import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, promotions } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

    const itemsList = safeItems
      .map((item: any) => `- ${item.title} ${item.variant ? `(${item.variant})` : ''} (${item.quantity} шт) — ${item.price * item.quantity} ₽`)
      .join('\n');

    const subtotalNum = Math.round(Number(totalAmount) || 0);
    const deliveryFeeNum = Math.round(Number(deliveryFee) || 0);

    // Серверная валидация промокода — не доверяем скидке, присланной с клиента
    let discountNum = 0;
    let validPromoId: string | null = null;
    let validPromoCode: string | null = null;

    if (promoCode) {
      try {
        const normalizedCode = String(promoCode).trim().toUpperCase();
        const [promo] = await db.select().from(promotions).where(eq(promotions.code, normalizedCode));

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
        console.error('Promo validation error:', promoErr);
      }
    }

    const finalPay = subtotalNum + deliveryFeeNum - discountNum;

    const message = `
<b>🚨 НОВЫЙ ЗАКАЗ #${orderId}</b>

<b>👤 Клиент:</b> ${customer?.name || 'Покупатель'} (${customer?.phone || ''})
<b>📍 Район/Зона:</b> ${zone}
<b>🚗 Тип:</b> ${deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
<b>🏠 Адрес:</b> ${address}
<b>🕒 Время:</b> ${time}
<b>💳 Оплата:</b> ${paymentMethod}
${customer?.comment ? `<b>💬 Комментарий:</b> ${customer.comment}\n` : ''}
<b>📦 Состав заказа:</b>
${itemsList}

<b>🚚 Доставка:</b> ${deliveryFeeNum === 0 ? 'БЕСПЛАТНО' : `${deliveryFeeNum} ₽`}
${validPromoCode ? `<b>🏷️ Промокод:</b> ${validPromoCode} (-${discountNum} ₽)\n` : ''}<b>💰 ИТОГО К ОПЛАТЕ:</b> ${finalPay} ₽
    `;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            parse_mode: 'HTML',
            text: message,
          }),
        });
      } catch (tgErr) {
        console.error('Telegram send fetch error:', tgErr);
      }
    }

    // Сохранение заказа в PostgreSQL с приведением к jsonb
    try {
      const itemsJson = JSON.stringify(safeItems);
      await db.execute(
        sql`INSERT INTO "orders" ("order_number", "customer_name", "customer_phone", "zone", "delivery_type", "address", "time", "payment_method", "items", "subtotal", "delivery_fee", "discount", "total_amount", "status", "comment", "promo_code")
            VALUES (${String(orderId)}, ${customer?.name || 'Покупатель'}, ${customer?.phone || ''}, ${String(zone || 'Заволжье')}, ${String(deliveryType || 'delivery')}, ${String(address || 'Самовывоз')}, ${String(time || 'Ближайшее')}, ${String(paymentMethod || 'Картой курьеру')}, ${itemsJson}::jsonb, ${subtotalNum}, ${deliveryFeeNum}, ${discountNum}, ${finalPay}, 'new', ${customer?.comment || ''}, ${validPromoCode})`
      );

      if (validPromoId) {
        await db
          .update(promotions)
          .set({ usedCount: sql`${promotions.usedCount} + 1` })
          .where(eq(promotions.id, validPromoId));
      }
    } catch (dbErr) {
      console.error('Failed to save order to Postgres:', dbErr);
    }

    return NextResponse.json({ success: true, orderId, discount: discountNum, totalAmount: finalPay });
  } catch (error: any) {
    console.error('Order processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}