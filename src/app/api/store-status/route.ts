import { NextResponse } from 'next/server';
import { db } from '@/db';
import { workingHours, deliveryZones } from '@/db/schema';

export const dynamic = 'force-dynamic';

function isStoreOpen(openTime: string, closeTime: string): boolean {
  const now = new Date();
  // Московское время (UTC+3)
  const moscowOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const moscowNow = new Date(now.getTime() + (moscowOffset + localOffset) * 60000);

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const nowMinutes = moscowNow.getHours() * 60 + moscowNow.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export async function GET(): Promise<NextResponse> {
  try {
    const [hoursRows, zones] = await Promise.all([
      db.select().from(workingHours).limit(1),
      db.select().from(deliveryZones),
    ]);

    const hours = hoursRows[0];

    if (!hours) {
      return NextResponse.json(
        {
          success: true,
          isOpen: true,
          openTime: '11:00',
          closeTime: '22:40',
          isManualClosed: false,
          manualCloseReason: '',
          zones: [],
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const isOpen = !hours.isManualClosed && isStoreOpen(hours.openTime, hours.closeTime);

    return NextResponse.json(
      {
        success: true,
        isOpen,
        openTime: hours.openTime,
        closeTime: hours.closeTime,
        isManualClosed: hours.isManualClosed,
        manualCloseReason: hours.manualCloseReason,
        zones: zones.filter((z) => z.active),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Fallback: не блокируем заказы при ошибке БД
    return NextResponse.json(
      {
        success: true,
        isOpen: true,
        openTime: '11:00',
        closeTime: '22:40',
        isManualClosed: false,
        manualCloseReason: '',
        zones: [],
        error: message,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}