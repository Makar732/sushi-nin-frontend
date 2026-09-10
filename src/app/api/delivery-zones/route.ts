import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryZones } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const zones = await db
      .select({
        id: deliveryZones.id,
        name: deliveryZones.name,
        freeThreshold: deliveryZones.freeThreshold,
        deliveryFee: deliveryZones.deliveryFee,
        description: deliveryZones.description,
      })
      .from(deliveryZones)
      .where(eq(deliveryZones.active, true))
      .orderBy(deliveryZones.name);

    return NextResponse.json({ success: true, zones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[delivery-zones] GET error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}