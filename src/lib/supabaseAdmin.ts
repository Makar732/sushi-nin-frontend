import { createClient } from '@supabase/supabase-js';

// Убираем возможные пробелы/кавычки/хвостовой слэш из URL —
// частая причина "Invalid path specified in request URL"
const rawUrl = process.env.SUPABASE_URL?.trim();
const supabaseUrl = rawUrl?.replace(/\/+$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны для работы Supabase Storage. Добавьте их в переменные окружения.'
  );
}

if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(supabaseUrl)) {
  console.warn(
    '⚠️ SUPABASE_URL выглядит подозрительно:',
    supabaseUrl,
    '— проверьте, что это чистый URL вида https://xxxxx.supabase.co без хвостового слэша и кавычек.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DISHES_BUCKET = 'dishes';

export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${DISHES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}