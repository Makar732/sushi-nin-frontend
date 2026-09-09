import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';

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

    const itemsList = items
      .map((item: any) => `- ${item.title} ${item.variant ? `(${item.variant})` : ''} (${item.quantity} шт) — ${item.price * item.quantity} ₽`)
      .join('\n');

    const finalPay = totalAmount + deliveryFee - discount;

    const message = `
<b>🚨 НОВЫЙ ЗАКАЗ #${orderId}</b>

<b>👤 Клиент:</b> ${customer.name} (${customer.phone})
<b>📍 Район/Зона:</b> ${zone}
<b>🚗 Тип:</b> ${deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
<b>🏠 Адрес:</b> ${address}
<b>🕒 Время:</b> ${time}
<b>💳 Оплата:</b> ${paymentMethod}
${customer.comment ? `<b>💬 Комментарий:</b> ${customer.comment}\n` : ''}
<b>📦 Состав заказа:</b>
${itemsList}

<b>🚚 Доставка:</b> ${deliveryFee === 0 ? 'БЕСПЛАТНО' : `${deliveryFee} ₽`}
${discount > 0 ? `<b>🏷️ Скидка:</b> -${discount} ₽\n` : ''}<b>💰 ИТОГО К ОПЛАТЕ:</b> ${finalPay} ₽
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

    // Save order to Postgres
    await db.insert(orders).values({
      orderNumber: String(orderId),
      customerName: customer.name || 'Покупатель',
      customerPhone: customer.phone || '',
      zone: zone || 'Заволжье',
      deliveryType: deliveryType || 'delivery',
      address: address || 'Самовывоз',
      time: time || 'Ближайшее',
      paymentMethod: paymentMethod || 'Картой курьеру',
      items: items,
      subtotal: totalAmount,
      deliveryFee: deliveryFee,
      discount: discount,
      totalAmount: finalPay,
      status: 'new',
      comment: customer.comment || '',
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Order processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}