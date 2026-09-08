import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { DISTRICTS } from '@/data/districts';

export async function GET() {
  try {
    let dbProducts: any[] = [];
    try {
      dbProducts = await db.select().from(products);
      if (dbProducts.length === 0) {
        await seedDatabase();
        dbProducts = await db.select().from(products);
      }
    } catch (dbErr) {
      console.warn("Using fallback static menu data due to DB query:", dbErr);
    }

    const items = dbProducts.length > 0 ? dbProducts : PRODUCTS;

    return NextResponse.json({
      success: true,
      categories: CATEGORIES,
      districts: DISTRICTS,
      products: items,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      categories: CATEGORIES,
      districts: DISTRICTS,
      products: PRODUCTS,
      error: error.message
    });
  }
}
