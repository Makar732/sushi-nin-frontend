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

// Обновление зоны доставки
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { type, id, freeThreshold, deliveryFee, active,
            openTime, closeTime, isManualClosed, manualCloseReason } = body;

    if (type === 'zone') {
      if (!id) return NextResponse.json({ success: false, error: 'ID зоны обязателен' }, { status: 400 });
      const updateData: Record<string, unknown> = {};
      if (freeThreshold !== undefined) updateData.freeThreshold = Number(freeThreshold);
      if (deliveryFee !== undefined) updateData.deliveryFee = Number(deliveryFee);
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