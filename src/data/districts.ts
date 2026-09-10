export interface District {
  id: string;
  name: string;
  freeThreshold: number;
  deliveryFee: number;
  description: string;
}

/**
 * ⚠️ DEPRECATED: раньше это был единственный источник зон доставки на клиенте.
 * Теперь актуальные зоны приходят из БД через GET /api/delivery-zones
 * и управляются в админке (/admin/delivery).
 *
 * Этот массив оставлен ТОЛЬКО как исторический референс для одноразового сидирования
 * (см. SQL-миграцию в чате) и НЕ должен использоваться напрямую в UI-компонентах.
 * После подтверждения, что seed.ts / seed route его не используют — этот экспорт можно удалить.
 */
export const DISTRICTS: District[] = [
  {
    id: 'zavolzhye',
    name: 'Заволжье',
    freeThreshold: 700,
    deliveryFee: 100,
    description: 'Центральный район Заволжья. Доставка 30-40 мин.',
  },
  {
    id: 'finsky',
    name: 'Финский посёлок',
    freeThreshold: 700,
    deliveryFee: 120,
    description: 'Доставка 35-45 мин.',
  },
  {
    id: '10th-poselok',
    name: '10-й посёлок',
    freeThreshold: 700,
    deliveryFee: 120,
    description: 'Доставка 35-45 мин.',
  },
  {
    id: 'yasnaya-polyana',
    name: 'Ясная поляна',
    freeThreshold: 900,
    deliveryFee: 150,
    description: 'Доставка 40-50 мин.',
  },
  {
    id: 'shelyaukhovo',
    name: 'Шеляухово',
    freeThreshold: 1200,
    deliveryFee: 200,
    description: 'Доставка 45-60 мин.',
  },
];