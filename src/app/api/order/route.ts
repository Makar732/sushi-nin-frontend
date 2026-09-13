import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, promotions, products } from '@/db/schema';
import { sql, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const OrderItemSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Некорректный id товара'),
  quantity: z
    .number()
    .int('Количество должно быть целым числом')
    .min(1, 'Минимальное количество: 1')
    .max(50, 'Максимальное количество: 50'),
  variant: z.string().max(20).optional(),
});

const OrderSchema = z.object({
  orderId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^SN-\d{6}$/, 'Некорректный формат orderId'),
  customer: z.object({
    name: z
      .string()
      .min(2, 'Имя слишком короткое')
      .max(100)
      .transform((v) => v.trim().replace(/[<>"'&]/g, '')),
    phone: z
      .string()
      .regex(/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, 'Некорректный формат телефона')
      .max(18),
    comment: z
      .string()
      .max(500)
      .optional()
      .transform((v) => v?.trim().replace(/[<>"'&]/g, '') ?? ''),
  }),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Корзина пуста')
    .max(50, 'Слишком много позиций'),
  zone: z.string().min(1).max(100).transform((v) => v.trim()),
  paymentMethod: z.enum(['Картой курьеру', 'Наличные', 'СБП онлайн']),
  deliveryType: z.enum(['delivery', 'pickup']),
  address: z.string().min(1).max(300).transform((v) => v.trim()),
  time: z.string().min(1).max(100).transform((v) => v.trim()),
  promoCode: z.string().max(50).nullable().optional(),
});

function sendTelegramNotification(
  token: string,
  chatId: string,
  message: string
): Promise<void> {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      parse_mode: 'HTML',
      text: message,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((t) =>
          console.error('[Telegram] Non-OK response:', res.status, t)
        );
      }
    })
    .catch((err) => {
      console.error('[Telegram] Failed to send notification:', err);
    });
}

function calcDeliveryFee(
  deliveryType: string,
  zone: string,
  subtotal: number
): number {
  if (deliveryType === 'pickup') return 0;

  const zoneConfig: Record<string, { freeThreshold: number; fee: number }> = {
    'Заволжье':  { freeThreshold: 700,  fee: 100 },
    'Городец':   { freeThreshold: 1500, fee: 250 },
    'Балахна':   { freeThreshold: 1500, fee: 300 },
    'Чкаловск':  { freeThreshold: 1500, fee: 350 },
  };

  const config = zoneConfig[zone] ?? { freeThreshold: 700, fee: 100 };
  return subtotal >= config.freeThreshold ? 0 : config.fee;
}

export async function POST(req: Request) {
  try {
    // ── Шаг 0: Парсим и валидируем тело запроса через Zod ────────────────────
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }

    const parseResult = OrderSchema.safeParse(rawBody);
    if (!parseResult.success) {
      // ✅ ФИКС: Zod v3 хранит ошибки в .issues, не в .errors
      // parseResult.error — это ZodError, у которого есть .issues[]
      // и .flatten() для удобного форматирования
      const firstIssue = parseResult.error.issues[0];
      const errorPath = firstIssue?.path?.join('.') ?? 'unknown';
      const errorMsg  = firstIssue?.message ?? 'Ошибка валидации';
      return NextResponse.json(
        {
          success: false,
          error: `Ошибка валидации: ${errorPath} — ${errorMsg}`,
        },
        { status: 400 }
      );
    }

    const body = parseResult.data;
    const {
      orderId,
      customer,
      items,
      zone,
      paymentMethod,
      deliveryType,
      address,
      time,
      promoCode,
    } = body;

    // ── Шаг 1: Серверный пересчёт цен ────────────────────────────────────────
    const giftItems   = items.filter((i) => i.id.startsWith('gift-'));
    const regularItems = items.filter((i) => !i.id.startsWith('gift-'));

    const productIds = [
      ...new Set(
        regularItems.map((item) =>
          item.id.replace(/-34 см$/, '').replace(/-40 см$/, '')
        )
      ),
    ];

    const dbProducts = productIds.length > 0
      ? await db
          .select({
            id:          products.id,
            price:       products.price,
            price40cm:   products.price40cm,
            inStock:     products.inStock,
            title:       products.title,
            hasVariants: products.hasVariants,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // ── Шаг 2: Проверка доступности + серверный расчёт subtotal ──────────────
    let subtotal = 0;

    const enrichedItems: Array<{
      id: string;
      productId: string;
      title: string;
      variant?: string;
      price: number;
      quantity: number;
    }> = [];

    for (const item of regularItems) {
      const productId = item.id
        .replace(/-34 см$/, '')
        .replace(/-40 см$/, '');

      const dbProduct = productMap.get(productId);

      if (!dbProduct) {
        return NextResponse.json(
          {
            success: false,
            error: `Товар "${item.id}" не найден в меню. Обновите страницу и попробуйте снова.`,
          },
          { status: 400 }
        );
      }

      if (!dbProduct.inStock) {
        return NextResponse.json(
          {
            success: false,
            error: `Товар "${dbProduct.title}" закончился. Удалите его из корзины и повторите заказ.`,
          },
          { status: 400 }
        );
      }

      const is40cm = item.id.endsWith('-40 см');
      const unitPrice =
        is40cm && dbProduct.price40cm != null
          ? dbProduct.price40cm
          : dbProduct.price;

      subtotal += unitPrice * item.quantity;

      enrichedItems.push({
        id:        item.id,
        productId: dbProduct.id,
        title:     dbProduct.title,
        variant:   item.variant,
        price:     unitPrice,
        quantity:  item.quantity,
      });
    }

    // Подарочные позиции (price = 0)
    for (const giftItem of giftItems) {
      enrichedItems.push({
        id:        giftItem.id,
        productId: giftItem.id,
        title:     giftItem.id,
        variant:   undefined,
        price:     0,
        quantity:  giftItem.quantity,
      });
    }

    // ── Шаг 3: Серверный расчёт доставки ─────────────────────────────────────
    const deliveryFeeNum = calcDeliveryFee(deliveryType, zone, subtotal);

    // ── Шаг 4: Серверная валидация промокода ──────────────────────────────────
    let discountNum   = 0;
    let validPromoId: string | null   = null;
    let validPromoCode: string | null = null;

    if (promoCode) {
      try {
        const normalizedCode = promoCode.trim().toUpperCase();
        const [promo] = await db
          .select()
          .from(promotions)
          .where(eq(promotions.code, normalizedCode))
          .limit(1);

        if (
          promo &&
          promo.active &&
          (promo.usageLimit === 0 || promo.usedCount < promo.usageLimit) &&
          subtotal >= promo.minAmount
        ) {
          discountNum =
            promo.discountType === 'fixed'
              ? Math.min(promo.discountValue, subtotal)
              : Math.round((subtotal * promo.discountValue) / 100);
          validPromoId   = promo.id;
          validPromoCode = promo.code;
        }
      } catch (promoErr) {
        console.error('[Order] Promo validation error:', promoErr);
      }
    }

    // ── Шаг 5: Финальная сумма — только на сервере ───────────────────────────
    const finalPay = subtotal + deliveryFeeNum - discountNum;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

    // ── Шаг 6: INSERT заказа + UPDATE промокода параллельно ───────────────────
    const itemsForDb = enrichedItems.map((i) => ({
      id:        i.id,
      productId: i.productId,
      title:     i.title,
      variant:   i.variant,
      price:     i.price,
      quantity:  i.quantity,
    }));
    const itemsJson = JSON.stringify(itemsForDb);

    const insertOrderPromise = db.execute(
      sql`INSERT INTO "orders" (
            "order_number", "customer_name", "customer_phone",
            "zone", "delivery_type", "address", "time",
            "payment_method", "items", "subtotal", "delivery_fee",
            "discount", "total_amount", "status", "comment", "promo_code"
          ) VALUES (
            ${String(orderId)},
            ${customer.name},
            ${customer.phone},
            ${zone},
            ${deliveryType},
            ${address},
            ${time},
            ${paymentMethod},
            ${itemsJson}::jsonb,
            ${subtotal},
            ${deliveryFeeNum},
            ${discountNum},
            ${finalPay},
            'new',
            ${customer.comment ?? ''},
            ${validPromoCode}
          )`
    );

    const updatePromoPromise = validPromoId
      ? db
          .update(promotions)
          .set({ usedCount: sql`${promotions.usedCount} + 1` })
          .where(eq(promotions.id, validPromoId))
      : Promise.resolve();

    const [insertResult, updateResult] = await Promise.allSettled([
      insertOrderPromise,
      updatePromoPromise,
    ]);

    if (insertResult.status === 'rejected') {
      console.error('[Order] Failed to save order to DB:', insertResult.reason);
      return NextResponse.json(
        { success: false, error: 'Не удалось сохранить заказ. Позвоните нам напрямую.' },
        { status: 500 }
      );
    }

    if (updateResult.status === 'rejected') {
      console.error('[Order] Failed to increment promo usage:', updateResult.reason);
    }

    // ── Шаг 7: Telegram — fire and forget ────────────────────────────────────
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const itemsList = enrichedItems
        .map(
          (item) =>
            `• ${item.title}${item.variant ? ` (${item.variant})` : ''} × ${item.quantity} — ${
              item.price === 0 ? 'ПОДАРОК' : `${item.price * item.quantity} ₽`
            }`
        )
        .join('\n');

      const message = `
<b>🚨 НОВЫЙ ЗАКАЗ #${orderId}</b>

<b>👤 Клиент:</b> ${customer.name} (${customer.phone})
<b>📍 Район/Зона:</b> ${zone}
<b>🚗 Тип:</b> ${deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
<b>🏠 Адрес:</b> ${address}
<b>🕒 Время:</b> ${time}
<b>💳 Оплата:</b> ${paymentMethod}${customer.comment ? `\n<b>💬 Комментарий:</b> ${customer.comment}` : ''}

<b>📦 Состав заказа:</b>
${itemsList}

<b>🧾 Подытог:</b> ${subtotal} ₽
<b>🚚 Доставка:</b> ${deliveryFeeNum === 0 ? 'БЕСПЛАТНО' : `${deliveryFeeNum} ₽`}${validPromoCode ? `\n<b>🏷️ Промокод:</b> ${validPromoCode} (-${discountNum} ₽)` : ''}
<b>💰 ИТОГО К ОПЛАТЕ: ${finalPay} ₽</b>
      `.trim();

      sendTelegramNotification(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message);
    }

    // ── Шаг 8: Ответ клиенту с серверными суммами ────────────────────────────
    return NextResponse.json({
      success:     true,
      orderId,
      subtotal,
      deliveryFee: deliveryFeeNum,
      discount:    discountNum,
      totalAmount: finalPay,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Order] Unhandled error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}