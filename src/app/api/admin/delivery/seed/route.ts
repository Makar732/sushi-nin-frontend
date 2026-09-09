import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryZones, workingHours } from '@/db/schema';

export const dynamic = 'force-dynamic';

// Дефолтная зона доставки — Заволжье (можно отредактировать/удалить/добавить другие через интерфейс)
const DEFAULT_ZONES = [
  {
    id: 'zavolzhye',
    name: 'Заволжье',
    freeThreshold: 700,
    deliveryFee: 150,
    description: 'Центральный район Заволжья. Доставка 30-40 мин.',
    active: true,
  },
];

export async function POST() {
  try {
    for (const zone of DEFAULT_ZONES) {
      await db.insert(deliveryZones).values(zone).onConflictDoNothing();
    }

    const existingHours = await db.select().from(workingHours).limit(1);
    if (existingHours.length === 0) {
      await db.insert(workingHours).values({
        openTime: '11:00',
        closeTime: '22:40',
        isManualClosed: false,
        manualCloseReason: '',
      });
    }

    const zones = await db.select().from(deliveryZones);

    return NextResponse.json({ success: true, zones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}