import { NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(promotions).orderBy(promotions.createdAt);
    return NextResponse.json({ success: true, promocodes: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, discountType, discountValue, minAmount, usageLimit, description, active } = body;

    if (!code || !discountValue) {
      return NextResponse.json(
        { success: false, error: 'Код и размер скидки обязательны' },
        { status: 400 }
      );
    }

    const newId = `promo-${Date.now()}`;

    await db.insert(promotions).values({
      id: newId,
      code: String(code).trim().toUpperCase(),
      discountType: discountType === 'fixed' ? 'fixed' : 'percent',
      discountValue: Number(discountValue),
      minAmount: minAmount ? Number(minAmount) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : 0,
      usedCount: 0,
      description: description || '',
      active: active !== undefined ? Boolean(active) : true,
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, code, discountType, discountValue, minAmount, usageLimit, description, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID обязателен' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (discountType !== undefined) updateData.discountType = discountType === 'fixed' ? 'fixed' : 'percent';
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
    if (minAmount !== undefined) updateData.minAmount = Number(minAmount);
    if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
    if (description !== undefined) updateData.description = description;
    if (typeof active === 'boolean') updateData.active = active;

    await db.update(promotions).set(updateData).where(eq(promotions.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID обязателен' }, { status: 400 });
    }
    await db.delete(promotions).where(eq(promotions.id, id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}