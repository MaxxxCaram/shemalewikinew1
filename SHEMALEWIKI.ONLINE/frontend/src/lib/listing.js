// Fast listings helper: profiles + their cover photo in a handful of light queries.
//
// Why: the previous code used `.select('*, photos(...)')` with limit(1000-4000).
// The PocketBase wrapper expands that join by querying photos for EVERY profile id
// in batches of 450 and paginating each batch — thousands of rows and dozens of
// requests per page load (listings took forever / browser choked).
//
// New approach:
//   1. profiles for the country/city (fields limited → tiny rows)
//   2. one pass over the photos of just those profiles asking for rows that
//      actually have a FILE (many legacy rows have an empty `file` = dead photo)
//   3. keep the profiles that really have a photo, with `_cover` precomputed
import { supabase } from '../supabase';

const PB_BASE = 'https://api.shemalewiki.online';

/** Public URL of a PocketBase photo record. */
export function photoUrl(ph) {
  if (!ph) return null;
  if (ph.id && ph.file) return `${PB_BASE}/api/files/photos/${ph.id}/${ph.file}`;
  return ph.photo_url || null;
}

/** Fetch every profile matching the given filter (paginated). */
async function fetchAllProfiles({ country, city, continent, search, max = 1200 }) {
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
 * Profiles for a country/city, each with `_cover` (photo URL). Only profiles
 * with a real photo file are returned, so no card shows a broken image.
 */
export async function fetchProfilesWithCovers({ country, city, continent, search, limit = 800 } = {}) {
  const profiles = await fetchAllProfiles({ country, city, continent, search, max: limit });
  if (!profiles.length) return [];

  const ids = profiles.map(p => p.id);
  const withPhoto = new Set();
  const coverMap = {};

  // First pass: rows that have a FILE (real photos). limit(2000) makes the
  // wrapper paginate internally so a photo-heavy chunk can't hide profiles.
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const grp = ids.slice(i, i + CHUNK);
    const { data } = await supabase
      .from('photos')
      .select('id,profile_id,file,photo_url,local_path')
      .in('profile_id', grp)
      .not('file', 'eq', '')
      .limit(2000);
    for (const ph of (Array.isArray(data) ? data : [])) {
      withPhoto.add(ph.profile_id);
      if (!coverMap[ph.profile_id] || (ph.local_path || '') === 'cover') {
        coverMap[ph.profile_id] = photoUrl(ph);
      }
    }
  }

  return profiles
    .filter(p => withPhoto.has(p.id) && coverMap[p.id])
    .map(p => ({ ...p, _cover: coverMap[p.id] }));
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
