// Fast listings helper: profiles + covers in a handful of quick queries.
//
// Perf history (measured against production):
//  - `.select('*, photos(...)')` join: dozens of requests per page (removed).
//  - photos filtered by an OR of 200 profile ids: ~1.5s PER CHUNK (slow).
//  - Global cover query (no id filter, sorted by -created): ~0.05s per 500 rows.
// So we fetch ALL covers once (≈3k rows, cached for a few minutes) and intersect
// locally with the profiles of the current listing. Spain: 786 profiles scanned
// in ~0.5s instead of ~7s, and every profile with a photo is returned.
import { supabase } from '../supabase';

const PB_BASE = 'https://api.shemalewiki.online';
const COVER_TTL_MS = 5 * 60 * 1000;

let coverCache = { at: 0, map: null };

/** Public URL of a PocketBase photo record. */
export function photoUrl(ph) {
  if (!ph) return null;
  if (ph.id && ph.file) return `${PB_BASE}/api/files/photos/${ph.id}/${ph.file}?thumb=300x400`;
  return ph.photo_url || null;
}

/** profile_id -> cover URL, for every profile that has a marked cover with a file. */
async function loadCovers() {
  const now = Date.now();
  if (coverCache.map && (now - coverCache.at) < COVER_TTL_MS) return coverCache.map;

  const map = {};
  const { data } = await supabase
    .from('photos')
    .select('id,profile_id,file,local_path')
    .eq('local_path', 'cover')
    .not('file', 'eq', '')
    .order('created_at', { ascending: false })
    .limit(5000); // wrapper paginates internally (>500) until exhausted

  for (const ph of (Array.isArray(data) ? data : [])) {
    if (!map[ph.profile_id] && (ph.file || ph.photo_url)) {
      map[ph.profile_id] = photoUrl(ph);
    }
  }
  coverCache = { at: now, map };
  return map;
}

/** Every profile matching the filter (paginated, light fields). */
async function fetchAllProfiles({ country, city, continent, search, max = 3000 }) {
  const out = [];
  const PER = 500;
  for (let offset = 0; offset < max; offset += PER) {
    let qb = supabase
      .from('profiles')
      .select('id,name,location,created_at,age,description')
      .not('cam_chat', 'eq', 'rejected');
    if (country) qb = qb.ilike('location', `% | ${country} |%`);
    if (city) qb = qb.ilike('location', `% | ${city}`);
    if (continent && !country) qb = qb.ilike('location', `${continent}%`);
    if (search) qb = qb.ilike('name', `%${search}%`);
    const { data } = await qb.order('created_at', { ascending: false }).range(offset, offset + PER - 1);
    const items = Array.isArray(data) ? data : [];
    out.push(...items);
    if (items.length < PER) break;
  }
  return out.slice(0, max);
}

/**
 * EVERY profile for a country/city (geo directory), each with `_cover` when
 * one exists. No filtering by photo: the listing must show ALL profiles of
 * the location — featured/photo-only placement is a paid slot later.
 */
export async function fetchProfilesWithCovers({ country, city, continent, search, limit = 3000 } = {}) {
  const [profiles, covers] = await Promise.all([
    fetchAllProfiles({ country, city, continent, search, max: limit }),
    loadCovers(),
  ]);
  if (!profiles.length) return [];

  return profiles.map(p => ({
    ...p,
    ...(covers[p.id] ? { _cover: covers[p.id] } : {}),
  }));
}

/** Drop the cached covers (call after a photo/cover change). */
export function invalidateCovers() {
  coverCache = { at: 0, map: null };
}

/** City → slug (matches CityGuide routing) */
export function cityToSlug(city) {
  return (city || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** City counts from an already-fetched profile list (no extra queries). */
export function cityCountsFrom(profiles) {
  const counts = {};
  for (const p of (profiles || [])) {
    const parts = (p.location || '').split(' | ');
    const city = parts[parts.length - 1];
    if (city && city !== 'Unknown') counts[city] = (counts[city] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, slug: cityToSlug(city), count }));
}
