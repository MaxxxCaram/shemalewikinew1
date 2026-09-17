const NO_PHOTO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="none"><rect width="300" height="400" fill="#1e293b"/><circle cx="150" cy="160" r="50" fill="#475569"/><path d="M70,300 C70,240 230,240 230,300" fill="#475569"/><text x="150" y="360" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600" text-anchor="middle">No Photo</text></svg>`;

const svgEsc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * Designed placeholder for a profile card WITHOUT a photo: dark gradient,
 * gold ring and the profile's initial. Renders instantly (data URI) so the
 * directory grid never shows an endless shimmer for photo-less profiles.
 */
export const profilePlaceholder = (name) => {
  const initial = svgEsc((name || '').trim().charAt(0) || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#202c4a"/><stop offset="1" stop-color="#141a2e"/></linearGradient>
<linearGradient id="gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5d9a8"/><stop offset="1" stop-color="#e28bb1"/></linearGradient>
</defs>
<rect width="300" height="400" fill="url(#g)"/>
<circle cx="150" cy="172" r="60" fill="none" stroke="url(#gr)" stroke-width="2" opacity="0.55"/>
<text x="150" y="208" fill="url(#gr)" font-family="Georgia, serif" font-size="72" font-weight="700" text-anchor="middle">${initial}</text>
<path d="M96,330 C96,272 204,272 204,330" stroke="url(#gr)" stroke-width="2" fill="none" opacity="0.35"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Adds PocketBase's server-side thumbnail param to a file URL.
 * PB generates on the fly from the `thumbs` config of the collection field:
 * 300x400 for cards (~3x fewer bytes) and 600x800 for profile galleries.
 * Non-PB URLs and data URIs pass through untouched.
 */
export const withThumb = (url, size = '300x400') => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/api/files/') || url.startsWith('data:')) return url;
  if (/[?&]thumb=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}thumb=${size}`;
};

export const getProxiedImageUrl = (url) => {
  if (!url) return NO_PHOTO_SVG;
  // If it is already a relative path, local resource, or base64 data URI, return it directly
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // PocketBase local storage files (api.shemalewiki.online) are same-origin
  // reachable and have no hotlink-blocking — serve them directly, no proxy.
  if (url.includes('api.shemalewiki.online')) {
    return url;
  }

  // Route all external images through our secure, high-performance edge cached proxy
  return `/api/image?url=${encodeURIComponent(url)}`;
};