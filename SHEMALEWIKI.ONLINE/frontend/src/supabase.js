// PocketBase-compatible drop-in replacement for the Supabase client.
// Exposes the same query-builder interface the app uses so the rest of the
// frontend (Home, Profile, CityGuide, Countries, ProfilesList, Dashboard)
// works unchanged. Backed by PocketBase REST API.

const PB_URL = import.meta.env.VITE_PB_URL || 'https://api.shemalewiki.online';

// --- Minimal fetch helper ---
async function pbRequest(path, options = {}) {
  console.log('[PB]', path);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${PB_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    // try parse error
    let msg = `PocketBase ${res.status}`;
    try {
      const e = await res.json();
      msg = e.message || msg;
    } catch {
      /* non-JSON error body — keep generic message */
    }
    console.error(`[PB Error] ${res.status}: ${msg} | ${path.slice(0, 120)}`);
    return { data: null, error: { message: msg, status: res.status } };
  }
  const text = await res.text();
  return { data: text ? JSON.parse(text) : null, error: null };
}

// Fetch ALL records across pages (PocketBase caps perPage at 500).
// Used when the caller requests limit > 500 (e.g. .limit(2000)).
// `path` is the full path incl. any filter, WITHOUT perPage/page.
async function pbFetchAll(path, maxItems) {
  const perPage = 500;
  const items = [];
  const want = maxItems || Infinity;
  let page = 1;
  for (;;) {
    const sep = path.includes('?') ? '&' : '?';
    const { data, error } = await pbRequest(`${path}${sep}perPage=${perPage}&page=${page}`);
    if (error) return { data: null, error };
    const batch = (data && data.items) || [];
    items.push(...batch);
    const got = items.length;
    const total = (data && data.totalItems) || 0;
    if (!batch.length || got >= total || got >= want) break;
    page += 1;
  }
  return { data: { items }, error: null };
}

// --- Query builder mimicking supabase.from().select().eq()... ---
function buildQuery(collection) {
  const filters = [];     // PocketBase filter expressions
  const params = new URLSearchParams();
  let countExact = false;
  let isHead = false;
  let selectedFields = '*';
  let limit = null;

  const q = {
    select(cols, opts = {}) {
      selectedFields = cols || '*';
      if (opts.count === 'exact') countExact = true;
      if (opts.head) isHead = true;
      return q;
    },
    eq(col, v) { filters.push(`(${col}='${String(v).replace(/'/g, "''")}')`); return q; },
    neq(col, v) { filters.push(`(${col}!='${String(v).replace(/'/g, "''")}')`); return q; },
    in(col, arr) {
      // PocketBase filter has no IN operator; express as OR of eq.
      if (Array.isArray(arr) && arr.length) {
        const orExpr = arr.map(v => `(${col}='${String(v).replace(/'/g, "''")}')`).join('||');
        filters.push(`(${orExpr})`);
      }
      return q;
    },
    ilike(col, pattern) {
      // supabase ilike: %foo% -> PocketBase ~ 'foo'
      let p = String(pattern || '');
      const isContains = p.startsWith('%') && p.endsWith('%');
      const inner = p.replace(/%/g, '');
      if (isContains) {
        filters.push(`(${col}~'${inner.replace(/'/g, "''")}')`);
      } else if (p.startsWith('%')) {
        filters.push(`(${col}~'${inner.replace(/'/g, "''")}')`);
      } else {
        filters.push(`(${col}~'${inner.replace(/'/g, "''")}')`);
      }
      return q;
    },
    not(col, op, v) {
      // supabase .not('cam_chat','eq','rejected') -> (cam_chat!='rejected')
      // .not('photo_url','is',null) means "photo_url IS NOT null" -> (photo_url!=null)
      if (op === 'eq') filters.push(`(${col}!='${String(v).replace(/'/g, "''")}')`);
      else if (op === 'is') {
        if (v === null) filters.push(`(${col}!=null)`);
        else filters.push(`(${col}=null)`);
      }
      return q;
    },
    order(col, opts = {}) {
      // PocketBase has no 'created_at' column; it exposes the auto 'created' field.
      let c = col;
      if (col === 'created_at' || col === 'updated_at') c = col === 'created_at' ? 'created' : 'updated';
      const dir = (opts && opts.ascending === false) ? '-' : '+';
      params.set('sort', dir + c);
      return q;
    },
    limit(n) { limit = n; return q; },
    // Pagination helper (supabase-style .range(from, to)). PocketBase paginates
    // by page number with a fixed perPage, so translate the offset.
    range(from, to) {
      const per = Math.min(Math.max((to - from) + 1, 1), 500);
      params.set('perPage', String(per));
      params.set('page', String(Math.floor(from / per) + 1));
      limit = per;
      return q;
    },
    async single() {
      params.set('perPage', '1');
      const path = `/api/collections/${collection}/records?${params.toString()}` + (filters.length ? `&filter=${encodeURIComponent(filters.join('&&'))}` : '');
      const { data, error } = await pbRequest(path);
      if (error) return { data: null, error };
      const items = (data && data.items) || [];
      return { data: items[0] || null, error: items.length ? null : { message: 'No rows' } };
    },
    execute() { return this; },
    then(onFulfilled, onRejected) {
      const run = async () => {
        // If select includes a join like '*, photos(...)', fetch profiles + photos
        const joinMatch = selectedFields.match(/photos\s*\(\s*([^)]*)\s*\)/);
        if (joinMatch) {
          // paginate if limit > 500 (PocketBase caps perPage at 500)
          const wantItems = limit || 500;
          params.set('perPage', String(Math.min(wantItems, 500)));
          const path = `/api/collections/${collection}/records?${params.toString()}` + (filters.length ? `&filter=${encodeURIComponent(filters.join('&&'))}` : '');
          const { data, error } = wantItems > 500
            ? await pbFetchAll(path, wantItems)
            : await pbRequest(path);
          if (error) return { data: null, error, count: null };
          let items = (data && data.items) || [];
          // fetch photos for the returned profile ids, CHUNKED to <=500 ids
          // per query (a giant OR of >500 profile_id breaks PocketBase with 400).
          const profIds = items.map(p => p.id);
          let photos = [];
          if (profIds.length) {
            const CHUNK = 450;
            const groups = [];
            for (let i = 0; i < profIds.length; i += CHUNK) groups.push(profIds.slice(i, i + CHUNK));
            for (const grp of groups) {
              const idFilter = `(${grp.map(id => `profile_id='${id}'`).join('||')})`;
              // Perfiles con 300+ fotos desbordan un perPage fijo y dejan perfiles
              // sin fotos en el listado. pbFetchAll pagina hasta traer todas.
              const phPath = `/api/collections/photos/records?filter=${encodeURIComponent(idFilter)}`;
              const { data: phData } = await pbFetchAll(phPath, grp.length * 400 + 200);
              photos.push(...((phData && phData.items) || []));
            }
            // Covers: una foto marcada local_path='cover' por perfil. PocketBase
            // capa perPage en 500, asi que el fetch general (2000 pedidos) pierde
            // la mayoria de los perfiles y desaparecen del listado. Pedir los
            // covers aparte (1 fila por perfil) garantiza portada para todos.
            for (const grp of groups) {
              const covFilter = `(${grp.map(id => `profile_id='${id}'`).join('||')})&&(local_path='cover')`;
              const covPath = `/api/collections/photos/records?filter=${encodeURIComponent(covFilter)}`;
              const { data: covData } = await pbFetchAll(covPath, grp.length + 50);
              photos.push(...((covData && covData.items) || []));
            }
            photos = photos.filter((ph, i, arr) => arr.findIndex(x => x.id === ph.id) === i);
          }
          items = items.map(p => ({ ...p, photos: photos.filter(ph => ph.profile_id === p.id) }));
          items = items.map(p => ({
            ...p,
            photos: (p.photos || []).map(ph => ({
              ...ph,
              photo_url: ph.file
                ? `${PB_URL}/api/files/${ph.collectionId || ''}/${ph.id}/${ph.file}`
                : ph.photo_url,
              local_path: ph.local_path || '',
            })),
          }));
          return { data: items, error: null, count: countExact ? items.length : null };
        }
        // plain select
        const wantItems = limit || (isHead ? 1 : 500);
        // Send only the requested columns so PocketBase doesn't return full
        // records (descriptions/bios) for big listings — huge payload saver.
        if (selectedFields && selectedFields !== '*' && !selectedFields.includes('(')) {
          params.set('fields', selectedFields.replace(/\s+/g, ''));
        }
        // CRITICAL: PocketBase defaults to perPage=30 when it isn't sent, which
        // silently capped every listing to 30 records (looked like "profiles
        // without photos"). Always send an explicit perPage.
        const perPage = Math.min(wantItems, 500);
        params.set('perPage', String(isHead ? 1 : perPage));
        const path = `/api/collections/${collection}/records?${params.toString()}` + (filters.length ? `&filter=${encodeURIComponent(filters.join('&&'))}` : '');
        const { data, error } = wantItems > 500
          ? await pbFetchAll(path, wantItems)
          : await pbRequest(path);
        if (error) return { data: null, error, count: null };
        let items = (data && data.items) || [];
        if (collection === 'photos') {
          items = items.map(ph => ({
            ...ph,
            photo_url: ph.file
              ? `${PB_URL}/api/files/${ph.collectionId || ''}/${ph.id}/${ph.file}`
              : ph.photo_url,
          }));
        }
        return { data: items, error: null, count: countExact ? (data.totalItems || items.length) : null };
      };
      // thenable: must call onFulfilled/onRejected so `await` resolves.
      return run().then(onFulfilled, onRejected);
    },
  };
  return q;
}

export const supabase = {
  from(collection) {
    // skip 'services' if not present in PB
    if (collection === 'services') {
      return buildQuery('services');
    }
    return buildQuery(collection);
  },
};

export default supabase;
