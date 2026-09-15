import { describe, it, expect } from 'vitest'
import { getProxiedImageUrl } from '../utils.js'

describe('getProxiedImageUrl', () => {
  it('returns NO_PHOTO_SVG for empty/null/undefined', () => {
    expect(getProxiedImageUrl(null)).toContain('data:image/svg+xml')
    expect(getProxiedImageUrl(undefined)).toContain('data:image/svg+xml')
    expect(getProxiedImageUrl('')).toContain('data:image/svg+xml')
  })

  it('returns relative paths directly', () => {
    expect(getProxiedImageUrl('/img/test.jpg')).toBe('/img/test.jpg')
  })

  it('returns data URIs directly', () => {
    expect(getProxiedImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it('returns blob URLs directly', () => {
    expect(getProxiedImageUrl('blob:https://example.com/abc')).toBe('blob:https://example.com/abc')
  })

  it('returns PocketBase URLs directly (no proxy)', () => {
    const url = 'https://api.shemalewiki.online/api/files/photos/abc123/avatar.jpg'
    expect(getProxiedImageUrl(url)).toBe(url)
  })

  it('routes external URLs through proxy', () => {
    const url = 'https://example.com/image.jpg'
    expect(getProxiedImageUrl(url)).toBe('/api/image?url=' + encodeURIComponent(url))
  })
})
