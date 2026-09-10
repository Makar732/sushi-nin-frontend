import { createClient } from '@supabase/supabase-js';

// Убираем /rest/v1/, /auth/v1/ и любой хвостовой слэш —
// supabase-js сам дописывает нужные пути
const rawUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/auth\/v1\/?$/, '')
  .replace(/\/storage\/v1\/?$/, '')
  .replace(/\/+$/, '');

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны. ' +
    'Добавьте их в .env.local и переменные окружения Vercel.'
  );
}

// Логируем итоговый URL при старте сервера — поможет отловить следующую опечатку
console.log('[supabaseAdmin] URL:', supabaseUrl);

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)) {
  console.warn(
    '⚠️ [supabaseAdmin] SUPABASE_URL выглядит некорректно:',
    supabaseUrl,
    '\nОжидается формат: https://xxxxxxxxxxxx.supabase.co'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DISHES_BUCKET = 'dishes';

/**
 * Извлекает путь файла внутри бакета из публичного URL Supabase Storage.
 * Пример входа:  https://xxx.supabase.co/storage/v1/object/public/dishes/dish_123.webp
 * Пример выхода: dish_123.webp
 * Если URL не из нашего бакета — возвращает null.
 */
export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${DISHES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}