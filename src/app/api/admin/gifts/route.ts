import { NextResponse } from 'next/server';
import { db } from '@/db';
import { giftSettings, products } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let [settings] = await db.select().from(giftSettings).limit(1);

    if (!settings) {
      const [inserted] = await db
        .insert(giftSettings)
        .values({ minAmount: 2000, productIds: [], active: true })
        .returning();
      settings = inserted;
    }

    let resolvedProducts: any[] = [];
    if (settings.productIds && settings.productIds.length > 0) {
      resolvedProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, settings.productIds));
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        minAmount: settings.minAmount,
        active: settings.active,
        productIds: settings.productIds || [],
        products: resolvedProducts,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { minAmount, productIds, active } = body;

    const [existing] = await db.select().from(giftSettings).limit(1);

    if (existing) {
      await db
        .update(giftSettings)
        .set({
          minAmount: Number(minAmount) || 0,
          productIds: Array.isArray(productIds) ? productIds.slice(0, 4) : [],
          active: Boolean(active),
          updatedAt: new Date(),
        })
        .where(eq(giftSettings.id, existing.id));
    } else {
      await db.insert(giftSettings).values({
        minAmount: Number(minAmount) || 0,
        productIds: Array.isArray(productIds) ? productIds.slice(0, 4) : [],
        active: Boolean(active),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}