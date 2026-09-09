import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryZones, workingHours } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [zones, hours] = await Promise.all([
      db.select().from(deliveryZones).orderBy(deliveryZones.name),
      db.select().from(workingHours).limit(1),
    ]);

    return NextResponse.json({
      success: true,
      zones,
      workingHours: hours[0] || {
        openTime: '11:00',
        closeTime: '22:40',
        isManualClosed: false,
        manualCloseReason: '',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Создание новой зоны доставки
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, freeThreshold, deliveryFee, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Название зоны обязательно' }, { status: 400 });
    }

    const slug = name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-zа-яё0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    const newId = `${slug || 'zone'}-${Date.now()}`;

    await db.insert(deliveryZones).values({
      id: newId,
      name,
      freeThreshold: freeThreshold ? Number(freeThreshold) : 700,
      deliveryFee: deliveryFee ? Number(deliveryFee) : 150,
      description: description || '',
      active: true,
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Обновление зоны доставки или расписания работы
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { type, id, name, freeThreshold, deliveryFee, description, active,
            openTime, closeTime, isManualClosed, manualCloseReason } = body;

    if (type === 'zone') {
      if (!id) return NextResponse.json({ success: false, error: 'ID зоны обязателен' }, { status: 400 });
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (freeThreshold !== undefined) updateData.freeThreshold = Number(freeThreshold);
      if (deliveryFee !== undefined) updateData.deliveryFee = Number(deliveryFee);
      if (description !== undefined) updateData.description = description;
      if (typeof active === 'boolean') updateData.active = active;
      await db.update(deliveryZones).set(updateData).where(eq(deliveryZones.id, id));
    } else if (type === 'hours') {
      const [existing] = await db.select().from(workingHours).limit(1);
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (openTime !== undefined) updateData.openTime = openTime;
      if (closeTime !== undefined) updateData.closeTime = closeTime;
      if (typeof isManualClosed === 'boolean') updateData.isManualClosed = isManualClosed;
      if (manualCloseReason !== undefined) updateData.manualCloseReason = manualCloseReason;

      if (existing) {
        await db.update(workingHours).set(updateData).where(eq(workingHours.id, existing.id));
      } else {
        await db.insert(workingHours).values({
          openTime: openTime || '11:00',
          closeTime: closeTime || '22:40',
          isManualClosed: isManualClosed || false,
          manualCloseReason: manualCloseReason || '',
        });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Неверный тип обновления' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Удаление зоны доставки
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID зоны обязателен' }, { status: 400 });
    }

    await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}