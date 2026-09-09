import { NextResponse } from 'next/server';
import { db } from '@/db';
import { banners } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(banners).orderBy(banners.sortOrder);
    return NextResponse.json({ success: true, banners: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, subtitle, badge, code, bgGradient, accentColor, sortOrder, active } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Заголовок обязателен' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(banners)
      .values({
        title,
        subtitle: subtitle || '',
        badge: badge || 'АКЦИЯ',
        code: code || null,
        bgGradient: bgGradient || 'from-red-900/60 via-slate-900 to-slate-900',
        accentColor: accentColor || 'border-red-500/40 text-red-400',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        active: active !== undefined ? Boolean(active) : true,
      })
      .returning();

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, title, subtitle, badge, code, bgGradient, accentColor, sortOrder, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID обязателен' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (badge !== undefined) updateData.badge = badge;
    if (code !== undefined) updateData.code = code || null;
    if (bgGradient !== undefined) updateData.bgGradient = bgGradient;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (typeof active === 'boolean') updateData.active = active;

    await db.update(banners).set(updateData).where(eq(banners.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID обязателен' }, { status: 400 });
    }
    await db.delete(banners).where(eq(banners.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}