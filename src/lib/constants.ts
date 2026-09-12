/**
 * Единая точка правды для запасного изображения блюда.
 *
 * ВАЖНО: раньше здесь использовалась ссылка на images.unsplash.com,
 * но этот домен заблокирован на уровне провайдеров в РФ без VPN.
 * Из-за этого пользователи в России видели чёрные квадраты вместо фото —
 * причём даже фолбэк-картинка на случай ошибки тоже была на Unsplash,
 * создавая замкнутый круг неработающих изображений.
 *
 * Решение: встроенный SVG в виде data URI. Он "зашит" прямо в бандл
 * приложения, не требует ни одного сетевого запроса и на 100% доступен
 * в любой точке мира — независимо от блокировок CDN.
 */
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#0f172a"/>
  <circle cx="100" cy="82" r="36" fill="none" stroke="#475569" stroke-width="6"/>
  <path d="M72 132 h56" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
  <path d="M84 148 h32" stroke="#475569" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
  <text x="100" y="176" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Фото скоро будет</text>
</svg>
`.trim();

export const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;