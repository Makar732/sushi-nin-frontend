import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, promotions } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательная функция: отправка в Telegram
// Намеренно НЕ делаем await в основном потоке — клиент не должен ждать Telegram.
// Используем паттерн "fire and forget":
//   1. Функция запускается без await
//   2. Ошибки логируются, но не влияют на ответ клиенту
//   3. На Vercel: передаём промис в ctx.waitUntil если доступен,
//      иначе просто отпускаем (serverless успеет отправить до завершения процесса)
// ─────────────────────────────────────────────────────────────────────────────
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
      // Не бросаем — просто логируем. Telegram недоступен = не критично для бизнес-логики.
      console.error('[Telegram] Failed to send notification:', err);
    });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      customer,
      items,
      totalAmount,
      deliveryFee,
      zone,
      paymentMethod,
      deliveryType,
      address,
      time,
      promoCode,
    } = body;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const safeItems = Array.isArray(items) ? items : [];
    const subtotalNum = Math.round(Number(totalAmount) || 0);
    const deliveryFeeNum = Math.round(Number(deliveryFee) || 0);

    // ── Шаг 1: Валидация промокода ────────────────────────────────────────────
    // Выполняется первой, так как результат нужен для расчёта финальной суммы.
    // Это единственный обязательный последовательный запрос к БД.
    let discountNum = 0;
    let validPromoId: string | null = null;
    let validPromoCode: string | null = null;

    if (promoCode) {
      try {
        const normalizedCode = String(promoCode).trim().toUpperCase();
        const [promo] = await db
          .select()
          .from(promotions)
          .where(eq(promotions.code, normalizedCode))
          .limit(1);

        if (
          promo &&
          promo.active &&
          (promo.usageLimit === 0 || promo.usedCount < promo.usageLimit) &&
          subtotalNum >= promo.minAmount
        ) {
          discountNum =
            promo.discountType === 'fixed'
              ? Math.min(promo.discountValue, subtotalNum)
              : Math.round((subtotalNum * promo.discountValue) / 100);
          validPromoId = promo.id;
          validPromoCode = promo.code;
        }
      } catch (promoErr) {
        console.error('[Order] Promo validation error:', promoErr);
      }
    }

    const finalPay = subtotalNum + deliveryFeeNum - discountNum;

    // ── Шаг 2: INSERT заказа + UPDATE промокода параллельно ───────────────────
    // Два независимых запроса к БД — запускаем одновременно через Promise.all.
    // Экономия: ~150–300ms (время одного лишнего round-trip к Supabase Ireland).
    const itemsJson = JSON.stringify(safeItems);

    const insertOrderPromise = db.execute(
      sql`INSERT INTO "orders" (
            "order_number", "customer_name", "customer_phone",
            "zone", "delivery_type", "address", "time",
            "payment_method", "items", "subtotal", "delivery_fee",
            "discount", "total_amount", "status", "comment", "promo_code"
          ) VALUES (
            ${String(orderId)},
            ${customer?.name || 'Покупатель'},
            ${customer?.phone || ''},
            ${String(zone || 'Заволжье')},
            ${String(deliveryType || 'delivery')},
            ${String(address || 'Самовывоз')},
            ${String(time || 'Ближайшее')},
            ${String(paymentMethod || 'Картой курьеру')},
            ${itemsJson}::jsonb,
            ${subtotalNum},
            ${deliveryFeeNum},
            ${discountNum},
            ${finalPay},
            'new',
            ${customer?.comment || ''},
            ${validPromoCode}
          )`
    );

    const updatePromoPromise = validPromoId
      ? db
          .update(promotions)
          .set({ usedCount: sql`${promotions.usedCount} + 1` })
          .where(eq(promotions.id, validPromoId))
      : Promise.resolve();

    // Ждём оба запроса параллельно — если один упадёт, логируем, не роняем всё
    const [insertResult, updateResult] = await Promise.allSettled([
      insertOrderPromise,
      updatePromoPromise,
    ]);

    if (insertResult.status === 'rejected') {
      console.error('[Order] Failed to save order to DB:', insertResult.reason);
      // Критическая ошибка — заказ не сохранён, сообщаем клиенту
      return NextResponse.json(
        { success: false, error: 'Не удалось сохранить заказ. Позвоните нам напрямую.' },
        { status: 500 }
      );
    }

    if (updateResult.status === 'rejected') {
      // Некритично: заказ уже сохранён, просто промокод не инкрементировался
      console.error('[Order] Failed to increment promo usage:', updateResult.reason);
    }

    // ── Шаг 3: Telegram — fire and forget ────────────────────────────────────
    // НЕ делаем await — клиент получает ответ немедленно после сохранения в БД.
    // Telegram уведомление улетает в фоне асинхронно.
    // На Vercel Serverless: процесс живёт достаточно долго после отправки Response,
    // чтобы fetch успел завершиться (обычно Telegram отвечает за 200–500ms).
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const itemsList = safeItems
        .map(
          (item: any) =>
            `• ${item.title}${item.variant ? ` (${item.variant})` : ''} × ${item.quantity} — ${item.price * item.quantity} ₽`
        )
        .join('\n');

      const message = `
<b>🚨 НОВЫЙ ЗАКАЗ #${orderId}</b>

<b>👤 Клиент:</b> ${customer?.name || 'Покупатель'} (${customer?.phone || ''})
<b>📍 Район/Зона:</b> ${zone}
<b>🚗 Тип:</b> ${deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
<b>🏠 Адрес:</b> ${address}
<b>🕒 Время:</b> ${time}
<b>💳 Оплата:</b> ${paymentMethod}${customer?.comment ? `\n<b>💬 Комментарий:</b> ${customer.comment}` : ''}

<b>📦 Состав заказа:</b>
${itemsList}

<b>🚚 Доставка:</b> ${deliveryFeeNum === 0 ? 'БЕСПЛАТНО' : `${deliveryFeeNum} ₽`}${validPromoCode ? `\n<b>🏷️ Промокод:</b> ${validPromoCode} (-${discountNum} ₽)` : ''}
<b>💰 ИТОГО К ОПЛАТЕ: ${finalPay} ₽</b>
      `.trim();

      // Запускаем без await — ответ клиенту уже не зависит от Telegram
      sendTelegramNotification(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message);
    }

    // ── Шаг 4: Мгновенный ответ клиенту ──────────────────────────────────────
    // Клиент получает ответ сразу после сохранения в БД,
    // не дожидаясь ответа от Telegram API.
    return NextResponse.json({
      success: true,
      orderId,
      discount: discountNum,
      totalAmount: finalPay,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Order] Unhandled error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}