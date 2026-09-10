import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const dbProducts = await db.select().from(products).orderBy(products.category);
    return NextResponse.json(
      { success: true, products: dbProducts },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, inStock, title, description, price, price40cm, weight, category, tags, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof inStock === 'boolean') updateData.inStock = inStock;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (price40cm !== undefined) updateData.price40cm = price40cm ? Number(price40cm) : null;
    if (weight !== undefined) updateData.weight = weight;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    await db.update(products).set(updateData).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { title, category, description, price, price40cm, weight, imageUrl, tags = [] } = body;

    if (!title || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Title, category and price are required' },
        { status: 400 }
      );
    }

    const newId = `custom-${Date.now()}`;

    await db.insert(products).values({
      id: newId,
      title,
      category,
      description: description || '',
      price: Number(price),
      price40cm: price40cm ? Number(price40cm) : null,
      weight: weight || '300 г',
      inStock: true,
      imageFilename: 'placeholder.jpg',
      aiImagePrompt: '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      tags: tags,
      hasVariants: category === 'Пицца',
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}