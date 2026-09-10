import { NextResponse } from 'next/server';
import { supabaseAdmin, DISHES_BUCKET, extractStoragePath } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 МБ — после клиентского сжатия этого более чем достаточно

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const productId = (formData.get('productId') as string | null) || 'new';
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Файл не найден в запросе' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Недопустимый формат файла. Разрешены: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Файл слишком большой. Максимум 2 МБ после сжатия' },
        { status: 400 }
      );
    }

    const safeProductId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `dish_${safeProductId}_${Date.now()}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DISHES_BUCKET)
      .upload(fileName, buffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Ошибка загрузки в хранилище: ' + uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(DISHES_BUCKET)
      .getPublicUrl(fileName);

    const newUrl = publicUrlData.publicUrl;

    // Удаляем старый файл ТОЛЬКО после успешной загрузки нового
    const oldPath = extractStoragePath(oldImageUrl);
    if (oldPath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(DISHES_BUCKET)
        .remove([oldPath]);
      if (removeError) {
        // Не критично — новый файл уже загружен и будет использоваться,
        // просто залогируем что старый файл не удалось убрать
        console.warn('Не удалось удалить старый файл из Storage:', removeError.message);
      }
    }

    return NextResponse.json({ success: true, url: newUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('Upload route error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Полное удаление фото (без замены на новое)
export async function DELETE(req: Request) {
  try {
    const { imageUrl } = await req.json();

    const path = extractStoragePath(imageUrl);
    if (!path) {
      // URL не из нашего бакета (например, старая ручная ссылка) — просто ок, нечего удалять физически
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin.storage.from(DISHES_BUCKET).remove([path]);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}