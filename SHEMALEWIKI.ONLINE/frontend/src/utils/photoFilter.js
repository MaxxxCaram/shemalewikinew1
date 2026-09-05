// Photo URL filter: only keep photos that are REAL loadable IMAGES.
//
// The DB stores profile photos from several sources:
//   - PocketBase file  -> api.shemalewiki.online/api/files/... (loads ✅)
//   - qtuzpswxzengqoqqwtpt.supabase.co/storage -> OLD migrated Supabase (most dead)
//   - static2.eros.bz  -> external CDN (sometimes loads)
//   - web.archive.org / shemalewiki.com -> blocked/dead, render broken
//   - xhamster / youtube / etc. -> these are VIDEO LINKS, not photos
//
// Only photos with a real PocketBase `file` reliably load. Everything else
// (web.archive, dead supabase, video links) makes the gallery/lightbox show
// broken images or open to black — the "photos don't open" bug.
const BROKEN_HOSTS = [
  'web.archive.org', 'shemalewiki.com', 'cdn.shemalewiki.com',
  // video / non-image hosts that must never render as a gallery photo
  'xhamster', 'pornhub', 'xvideos', 'redtube', 'youtube', 'youtu.be',
  'onlyfans.com', 'vimeo', 'twitch', 'tiktok.com',
];

// A photo is "loadable" only if it points to a real image:
// either a PocketBase file URL or a known-good image CDN. Excludes dead hosts
// AND video links.
export const isLoadablePhoto = (url) => {
  const u = (url || '').toLowerCase();
  if (BROKEN_HOSTS.some((h) => u.includes(h))) return false;
  // Exclude obvious video/embed URLs by extension not being an image
  if (/\/(videos?|watch|embed)\//.test(u)) return false;
  return true;
};

// A photo is guaranteed-good only when it has a real PocketBase file
// (storage-backed image). Use this to pick the hero / what goes in the
// clickable lightbox, so a click always opens a real image.
export const hasRealFile = (photo) => {
  if (!photo) return false;
  if (photo.file) return true;                       // PB storage file
  const u = ((photo.photo_url) || '').toLowerCase();
  return u.includes('api/files/') || u.includes('eros');  // real image URL
};
