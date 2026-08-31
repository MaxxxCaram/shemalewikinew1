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
    return { data: null, error: { message: msg, status: res.status } };
  }
  const text = await res.text();
  return { data: text ? JSON.parse(text) : null, error: null };
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
          params.set('perPage', String(limit || 500));
          const path = `/api/collections/${collection}/records?${params.toString()}` + (filters.length ? `&filter=${encodeURIComponent(filters.join('&&'))}` : '');
          const { data, error } = await pbRequest(path);
          if (error) return { data: null, error, count: null };
          let items = (data && data.items) || [];
          // fetch photos for the returned profile ids
          const profIds = items.map(p => p.id);
          let photos = [];
          if (profIds.length) {
            const idFilter = `(${profIds.map(id => `profile_id='${id}'`).join('||')})`;
            const phPath = `/api/collections/photos/records?perPage=2000&filter=${encodeURIComponent(idFilter)}`;
            const { data: phData } = await pbRequest(phPath);
            photos = (phData && phData.items) || [];
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
        params.set('perPage', String(limit || (isHead ? 1 : 500)));
        const path = `/api/collections/${collection}/records?${params.toString()}` + (filters.length ? `&filter=${encodeURIComponent(filters.join('&&'))}` : '');
        const { data, error } = await pbRequest(path);
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
