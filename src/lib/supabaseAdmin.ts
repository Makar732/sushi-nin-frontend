import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны для работы Supabase Storage. Добавьте их в переменные окружения.'
  );
}

// ⚠️ Этот клиент использует Service Role Key — он ДОЛЖЕН импортироваться
// только в серверном коде (API routes), никогда в клиентских компонентах!
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const DISHES_BUCKET = 'dishes';

/**
 * Извлекает путь файла внутри бакета из публичного URL Supabase Storage.
 * Пример: https://xxx.supabase.co/storage/v1/object/public/dishes/dish_123.webp
 * Вернёт: dish_123.webp
 * Если URL не относится к нашему бакету — вернёт null.
 */
export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${DISHES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}