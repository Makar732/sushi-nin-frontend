import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { sql } from 'drizzle-orm';

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
      discount = 0
    } = body;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const safeItems = Array.isArray(items) ? items : [];

    const itemsList = safeItems
      .map((item: any) => `- ${item.title} ${item.variant ? `(${item.variant})` : ''} (${item.quantity} шт) — ${item.price * item.quantity} ₽`)
      .join('\n');

    const subtotalNum = Math.round(Number(totalAmount) || 0);
    const deliveryFeeNum = Math.round(Number(deliveryFee) || 0);
    const discountNum = Math.round(Number(discount) || 0);
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
${discountNum > 0 ? `<b>🏷️ Скидка:</b> -${discountNum} ₽\n` : ''}<b>💰 ИТОГО К ОПЛАТЕ:</b> ${finalPay} ₽
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
        sql`INSERT INTO "orders" ("order_number", "customer_name", "customer_phone", "zone", "delivery_type", "address", "time", "payment_method", "items", "subtotal", "delivery_fee", "discount", "total_amount", "status", "comment")
            VALUES (${String(orderId)}, ${customer?.name || 'Покупатель'}, ${customer?.phone || ''}, ${String(zone || 'Заволжье')}, ${String(deliveryType || 'delivery')}, ${String(address || 'Самовывоз')}, ${String(time || 'Ближайшее')}, ${String(paymentMethod || 'Картой курьеру')}, ${itemsJson}::jsonb, ${subtotalNum}, ${deliveryFeeNum}, ${discountNum}, ${finalPay}, 'new', ${customer?.comment || ''})`
      );
    } catch (dbErr) {
      console.error('Failed to save order to Postgres:', dbErr);
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Order processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}