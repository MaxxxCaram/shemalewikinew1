// Tests for the serverless functions that decide what crawlers see (api/og.js, api/sitemap.js).
// fetch is mocked (see setup.js); no network.
import { describe, it, expect, beforeEach } from 'vitest'
import og from '../../api/og.js'
import sitemap from '../../api/sitemap.js'

const mkRes = () => {
  const r = { code: 200, headers: {}, body: '' }
  r.setHeader = (k, v) => { r.headers[k] = v }
  r.end = (b) => { r.body = b || '' }
  r.status = (c) => { r.code = c; return r }
  r.send = (b) => { r.body = b; return r }
  Object.defineProperty(r, 'statusCode', { get: () => r.code, set: (v) => { r.code = v } })
  return r
}
const json = (data, ok = true) => ({ ok, json: async () => data })

// Route mock: profiles by id / by legacy url, and the cover-photo query.
const mockPocketBase = ({ byId = [], byUrl = [], covers = [], profilesOk = true } = {}) => {
  fetch.mockImplementation(async (url) => {
    const u = decodeURIComponent(String(url))
    if (u.includes('/photos/records')) return json({ items: covers })
    if (u.includes("(url='")) return json({ items: byUrl })
    if (u.includes("(id='")) return profilesOk ? json({ items: byId }) : json({}, false)
    return json({ items: [] })
  })
}

const call = async (host, path) => {
  const res = mkRes()
  await og({ url: `/api/og?path=${encodeURIComponent(path.replace(/^\//, ''))}`, headers: { host } }, res)
  return res
}
const one = (html, re) => (html.match(re) || [])[1]
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1])

describe('api/og.js — head per brand', () => {
  beforeEach(() => { fetch.mockReset() })

  it('shemalewiki profile: own canonical + site name, single canonical', async () => {
    mockPocketBase({ byId: [{ id: 'abc123', name: 'Nicolita', location: 'Europe | Belgium | Antwerpen' }] })
    const r = await call('shemalewiki.online', '/profile/abc123')
    expect(r.code).toBe(200)
    expect(all(r.body, /rel="canonical" href="([^"]*)"/g)).toEqual(['https://shemalewiki.online/profile/abc123'])
    expect(one(r.body, /og:site_name" content="([^"]*)"/)).toBe('ShemaleWiki')
    expect(one(r.body, /<title>([^<]*)<\/title>/)).toBe('Nicolita — ShemaleWiki')
  })

  it('buscatrans profile: buscatrans canonical/site name/title (was a shemalewiki canonical on every URL)', async () => {
    mockPocketBase({ byId: [{ id: 'abc123', name: 'Nicolita', location: 'Europe | Belgium | Antwerpen' }] })
    const r = await call('www.buscatrans.com', '/es/profile/abc123')
    expect(r.code).toBe(200)
    expect(all(r.body, /rel="canonical" href="([^"]*)"/g)).toEqual(['https://buscatrans.com/es/profile/abc123'])
    expect(one(r.body, /og:site_name" content="([^"]*)"/)).toBe('BuscaTrans')
    expect(one(r.body, /<title>([^<]*)<\/title>/)).toBe('Nicolita — BuscaTrans')
    expect(one(r.body, /og:image" content="([^"]*)"/)).toContain('buscatrans')
    expect(r.body).not.toContain('shemalewiki.online/profile')
  })

  it('legacy id (old sitemap, e.g. 2761 or a UUID) → 301 to the real profile, keeping the language prefix', async () => {
    mockPocketBase({ byId: [], byUrl: [{ id: 'c0g2kv7iy1rq1u8' }] })
    let r = await call('buscatrans.com', '/es/profile/2761')
    expect(r.code).toBe(301)
    expect(r.headers.Location).toBe('/es/profile/c0g2kv7iy1rq1u8')
    r = await call('shemalewiki.online', '/profile/93d985ff-2839-419c-acc0-b72682ffe077')
    expect(r.code).toBe(301)
    expect(r.headers.Location).toBe('/profile/c0g2kv7iy1rq1u8')
  })

  it('unknown profile → real 404 + noindex, no canonical (used to be a 200 soft-404)', async () => {
    mockPocketBase({ byId: [], byUrl: [] })
    const r = await call('buscatrans.com', '/es/profile/nope123')
    expect(r.code).toBe(404)
    expect(r.body).toContain('name="robots" content="noindex')
    expect(r.body).not.toContain('rel="canonical"')
  })

  it('PocketBase failing must NOT become a 404 (would de-index real profiles during an outage)', async () => {
    mockPocketBase({ profilesOk: false })
    const r = await call('shemalewiki.online', '/profile/abc123')
    expect(r.code).toBe(200)
  })
})

describe('api/sitemap.js', () => {
  beforeEach(() => { fetch.mockReset() })

  const profiles = [
    { id: 'p1', location: 'Europe | Spain | Madrid', updated: '2026-09-01 10:00:00.000Z' },
    { id: 'p2', location: 'Europe | United Kingdom | Milton Keynes', updated: '2026-09-02 10:00:00.000Z' },
    { id: 'p3', location: 'Europe | Spain | Madrid', updated: '2026-09-03 10:00:00.000Z' }, // no cover → not listed
    { id: 'p4', location: 'Other | Unknown', updated: '2026-09-03 10:00:00.000Z' },
  ]
  const covers = [{ profile_id: 'p1' }, { profile_id: 'p2' }, { profile_id: 'p4' }]
  const wire = () => fetch.mockImplementation(async (url) => {
    const u = String(url)
    if (u.includes('/collections/photos/')) return json({ items: covers, totalPages: 1 })
    if (u.includes('/collections/profiles/')) return json({ items: profiles, totalPages: 1 })
    return json({ items: [] })
  })
  const run = async (host) => {
    const res = mkRes()
    await sitemap({ headers: { host } }, res)
    return { res, locs: all(res.body, /<loc>([^<]+)<\/loc>/g) }
  }

  it('shemalewiki: only its own host, real ids, only profiles that have a cover', async () => {
    wire()
    const { res, locs } = await run('shemalewiki.online')
    expect(res.code).toBe(200)
    expect(new Set(locs.map((l) => new URL(l).host))).toEqual(new Set(['shemalewiki.online']))
    expect(locs).toContain('https://shemalewiki.online/profile/p1')
    expect(locs).toContain('https://shemalewiki.online/europe/spain/madrid')
    expect(locs).toContain('https://shemalewiki.online/europe/united-kingdom/milton-keynes')
    expect(locs).not.toContain('https://shemalewiki.online/profile/p3') // no cover photo
  })

  it('buscatrans: only buscatrans.com URLs, under /es', async () => {
    wire()
    const { locs } = await run('www.buscatrans.com')
    expect(new Set(locs.map((l) => new URL(l).host))).toEqual(new Set(['buscatrans.com']))
    expect(locs).toContain('https://buscatrans.com/es/')
    expect(locs).toContain('https://buscatrans.com/es/profile/p1')
    expect(locs).toContain('https://buscatrans.com/es/europe/spain')
    expect(locs.some((l) => l.includes('shemalewiki'))).toBe(false)
  })

  it('a PocketBase failure is a 502 that is not cached', async () => {
    fetch.mockImplementation(async () => json({}, false))
    const res = mkRes()
    await sitemap({ headers: { host: 'shemalewiki.online' } }, res)
    expect(res.code).toBe(502)
    expect(res.headers['Cache-Control']).toBe('no-store')
  })
})
