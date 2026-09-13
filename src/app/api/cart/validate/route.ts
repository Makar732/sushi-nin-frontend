import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Схема входящего запроса: массив позиций корзины для валидации
const ValidateCartSchema = z.object({
  items: z
    .array(
      z.object({
        // cartItemId в формате "pepperoni-pizza" или "pepperoni-pizza-34 см"
        id: z.string().min(1).max(100),
        price: z.number().int().min(0), // текущая клиентская цена для сравнения
        variant: z.string().max(20).optional(),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Некорректный JSON' },
        { status: 400 }
      );
    }

    const parseResult = ValidateCartSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Ошибка валидации запроса' },
        { status: 400 }
      );
    }

    const { items } = parseResult.data;

    // Фильтруем подарки — они не проверяются в таблице products
    const regularItems = items.filter((i) => !i.id.startsWith('gift-'));

    // Извлекаем productId без суффикса варианта
    const productIds = [
      ...new Set(
        regularItems.map((item) =>
          item.id.replace(/-34 см$/, '').replace(/-40 см$/, '')
        )
      ),
    ];

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, updates: [], hasChanges: false });
    }

    // Один запрос к БД — получаем актуальные цены и наличие
    const dbProducts = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        price40cm: products.price40cm,
        inStock: products.inStock,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Формируем список изменений: что изменилось по цене или наличию
    type UpdateEntry = {
      id: string;          // cartItemId
      productId: string;
      title: string;
      newPrice: number;
      oldPrice: number;
      inStock: boolean;
      priceChanged: boolean;
      stockChanged: boolean;
    };

    const updates: UpdateEntry[] = [];
    let hasChanges = false;

    for (const item of regularItems) {
      const productId = item.id
        .replace(/-34 см$/, '')
        .replace(/-40 см$/, '');

      const dbProduct = productMap.get(productId);

      if (!dbProduct) {
        // Товар удалён из меню
        updates.push({
          id: item.id,
          productId,
          title: `Товар #${productId}`,
          newPrice: 0,
          oldPrice: item.price,
          inStock: false,
          priceChanged: false,
          stockChanged: true,
        });
        hasChanges = true;
        continue;
      }

      const is40cm = item.id.endsWith('-40 см');
      const actualPrice =
        is40cm && dbProduct.price40cm != null
          ? dbProduct.price40cm
          : dbProduct.price;

      const priceChanged = actualPrice !== item.price;
      const stockChanged = !dbProduct.inStock;

      if (priceChanged || stockChanged) {
        updates.push({
          id: item.id,
          productId: dbProduct.id,
          title: dbProduct.title,
          newPrice: actualPrice,
          oldPrice: item.price,
          inStock: dbProduct.inStock,
          priceChanged,
          stockChanged,
        });
        hasChanges = true;
      }
    }

    return NextResponse.json({
      success: true,
      hasChanges,
      updates,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cart Validate] Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}