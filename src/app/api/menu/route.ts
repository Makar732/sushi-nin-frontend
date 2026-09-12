import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories as categoriesTable } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Параллельно запрашиваем продукты и категории из БД —
    // вместо двух последовательных await экономим ~100–200ms
    const [dbProducts] = await Promise.all([
      db.select().from(products).catch((err) => {
        console.warn('[Menu] Failed to fetch products from DB:', err);
        return [] as typeof PRODUCTS;
      }),
    ]);

    // Если БД пустая — запускаем сид и повторяем запрос
    if (dbProducts.length === 0) {
      console.info('[Menu] DB is empty, running seed...');
      try {
        await seedDatabase();
        const seededProducts = await db.select().from(products);
        return NextResponse.json({
          success: true,
          categories: CATEGORIES,
          products: seededProducts,
        });
      } catch (seedErr) {
        console.error('[Menu] Seed failed, falling back to static data:', seedErr);
        return NextResponse.json({
          success: true,
          categories: CATEGORIES,
          products: PRODUCTS,
        });
      }
    }

    return NextResponse.json({
      success: true,
      categories: CATEGORIES,
      products: dbProducts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Menu] Unhandled error:', error);
    // Фолбэк на статические данные — сайт работает даже при падении БД
    return NextResponse.json({
      success: false,
      categories: CATEGORIES,
      products: PRODUCTS,
      error: message,
    });
  }
}