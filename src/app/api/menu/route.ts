import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { PRODUCTS, Product } from '@/data/products';
import { CATEGORIES } from '@/data/categories';

export const dynamic = 'force-dynamic';

type DbProductRow = typeof products.$inferSelect;

/**
 * Приводит запись из Drizzle (camelCase: inStock, imageFilename, aiImagePrompt)
 * к единому контракту Product (snake_case: in_stock, image_filename, ai_image_prompt),
 * который ожидают все компоненты фронтенда (ProductCard, ProductDetailModal).
 *
 * Без этой нормализации товары из БД всегда отображались бы как "Нет в наличии"
 * и с битыми картинками, т.к. поля просто не совпадали по именам.
 */
function mapDbProductToApiProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    title: row.title ?? 'Без названия',
    category: row.category ?? 'Разное',
    description: row.description ?? '',
    price: typeof row.price === 'number' ? row.price : 0,
    weight: row.weight ?? '—',
    in_stock: row.inStock !== false,
    image_filename: row.imageFilename ?? '',
    ai_image_prompt: row.aiImagePrompt ?? '',
    imageUrl: row.imageUrl ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    hasVariants: !!row.hasVariants,
    price40cm: typeof row.price40cm === 'number' ? row.price40cm : undefined,
  };
}

export async function GET() {
  try {
    const dbProducts = await db.select().from(products).catch((err) => {
      console.warn('[Menu] Failed to fetch products from DB:', err);
      return [] as DbProductRow[];
    });

    // Если БД пустая — запускаем сид и повторяем запрос
    if (dbProducts.length === 0) {
      console.info('[Menu] DB is empty, running seed...');
      try {
        await seedDatabase();
        const seededProducts = await db.select().from(products);
        return NextResponse.json({
          success: true,
          categories: CATEGORIES,
          products: seededProducts.map(mapDbProductToApiProduct),
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
      products: dbProducts.map(mapDbProductToApiProduct),
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