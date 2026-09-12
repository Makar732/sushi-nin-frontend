import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin, DISHES_BUCKET, extractStoragePath } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

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

    const safeProductId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '') || 'item';
    const uniquePart = randomUUID().slice(0, 8);
    // Расширение и Content-Type определяются по РЕАЛЬНОМУ типу присланного файла,
    // так как клиент может прислать WebP или JPEG-фолбэк (см. ImageUploader.tsx)
    const ext = MIME_TO_EXT[file.type] || 'webp';

    const fileName = `dish_${safeProductId}_${Date.now()}_${uniquePart}.${ext}`
      .replace(/^\/+/, '')
      .replace(/\/{2,}/g, '/');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[upload] bucket=%s path=%s size=%d contentType=%s', DISHES_BUCKET, fileName, buffer.length, file.type);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DISHES_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);

      const friendlyMessage = /bucket/i.test(uploadError.message)
        ? `Бакет "${DISHES_BUCKET}" не найден в Supabase Storage. Создайте публичный бакет с именем "${DISHES_BUCKET}" в панели Supabase → Storage.`
        : /invalid path/i.test(uploadError.message)
        ? 'Некорректный URL Supabase. Проверьте SUPABASE_URL в переменных окружения (без хвостового слэша и кавычек).'
        : 'Ошибка загрузки в хранилище: ' + uploadError.message;

      return NextResponse.json({ success: false, error: friendlyMessage }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(DISHES_BUCKET)
      .getPublicUrl(fileName);

    const newUrl = publicUrlData.publicUrl;

    const oldPath = extractStoragePath(oldImageUrl);
    if (oldPath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(DISHES_BUCKET)
        .remove([oldPath]);
      if (removeError) {
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

export async function DELETE(req: Request) {
  try {
    const { imageUrl } = await req.json();
    const path = extractStoragePath(imageUrl);
    if (!path) {
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