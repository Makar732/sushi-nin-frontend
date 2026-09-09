import { NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions, giftSettings, banners, products } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [activePromos, bannersList, giftRows] = await Promise.all([
      db.select().from(promotions).where(eq(promotions.active, true)),
      db.select().from(banners).where(eq(banners.active, true)).orderBy(banners.sortOrder),
      db.select().from(giftSettings).limit(1),
    ]);

    const settings = giftRows[0];
    let giftProducts: any[] = [];
    if (settings && settings.productIds && settings.productIds.length > 0) {
      giftProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, settings.productIds));
    }

    return NextResponse.json(
      {
        success: true,
        promocodes: activePromos.map((p) => ({
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
          minAmount: p.minAmount,
          description: p.description,
        })),
        gift: settings
          ? {
              minAmount: settings.minAmount,
              active: settings.active,
              products: giftProducts,
            }
          : { minAmount: 2000, active: false, products: [] },
        banners: bannersList,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
        promocodes: [],
        gift: { minAmount: 2000, active: false, products: [] },
        banners: [],
      },
      { status: 500 }
    );
  }
}