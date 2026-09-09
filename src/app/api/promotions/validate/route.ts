import { NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Введите промокод' }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const [promo] = await db.select().from(promotions).where(eq(promotions.code, normalizedCode));

    if (!promo || !promo.active) {
      return NextResponse.json({ success: false, message: 'Промокод не найден или неактивен' });
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ success: false, message: 'Лимит использований промокода исчерпан' });
    }

    const sub = Number(subtotal) || 0;
    if (promo.minAmount > 0 && sub < promo.minAmount) {
      return NextResponse.json({
        success: false,
        message: `Промокод активен при заказе от ${promo.minAmount} ₽`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Промокод ${promo.code} применён!`,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        description: promo.description,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: 'Ошибка сервера: ' + message }, { status: 500 });
  }
}