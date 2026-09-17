// Fast listings helper: profiles + their cover photo in a handful of light queries.
//
// History / why this shape:
//  - The old code used `.select('*, photos(...)')` with limit(1000-4000): the
//    PocketBase wrapper expanded that join per profile id (dozens of requests).
//  - Then a profile-first + "any photo with a file" pass turned out unreliable:
//    a chunk of 200 ids matched ~10k photo rows, and PocketBase pages that at
//    500 rows/page in a default order, so only a handful of profiles surfaced.
//
// Working shape (verified against production counts):
//  1. profiles for the country/city — paginated, fields limited to keep rows tiny
//  2. covers only: one row per profile (local_path='cover' + has a file).
//     ES: 786 profiles -> 124 with a cover, all of them returned.
import { supabase } from '../supabase';

const PB_BASE = 'https://api.shemalewiki.online';

/** Public URL of a PocketBase photo record. */
export function photoUrl(ph) {
  if (!ph) return null;
  if (ph.id && ph.file) return `${PB_BASE}/api/files/photos/${ph.id}/${ph.file}`;
  return ph.photo_url || null;
}

/** Fetch every profile matching the given filter (paginated, light fields). */
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
 * Profiles for a country/city, each with `_cover` (photo URL).
 * Only profiles that actually have a cover photo are returned, so a card never
 * renders a broken/empty image.
 */
export async function fetchProfilesWithCovers({ country, city, continent, search, limit = 3000 } = {}) {
  const profiles = await fetchAllProfiles({ country, city, continent, search, max: limit });
  if (!profiles.length) return [];

  const ids = profiles.map(p => p.id);
  const coverMap = {};
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const grp = ids.slice(i, i + CHUNK);
    // One row per profile: the marked cover that has a real file.
    const { data } = await supabase
      .from('photos')
      .select('id,profile_id,file,photo_url,local_path')
      .in('profile_id', grp)
      .eq('local_path', 'cover')
      .not('file', 'eq', '')
      .limit(500);
    for (const ph of (Array.isArray(data) ? data : [])) {
      if (ph.file || ph.photo_url) coverMap[ph.profile_id] = photoUrl(ph);
    }
  }

  return profiles
    .filter(p => coverMap[p.id])
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
