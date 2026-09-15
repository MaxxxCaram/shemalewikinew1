import { describe, it, expect } from 'vitest'
import { isLoadablePhoto, hasRealFile } from '../utils/photoFilter.js'

describe('photoFilter - isLoadablePhoto', () => {
  it('returns false for broken hosts', () => {
    expect(isLoadablePhoto('https://web.archive.org/web/2023/http://example.com')).toBe(false)
    expect(isLoadablePhoto('https://shemalewiki.com/old-photo.jpg')).toBe(false)
    expect(isLoadablePhoto('https://cdn.shemalewiki.com/img.jpg')).toBe(false)
    expect(isLoadablePhoto('https://duckduckgo.com/?q=img')).toBe(false)
    expect(isLoadablePhoto('https://external-content.duckduckgo.com/iu/?u=http://x')).toBe(false)
  })

  it('returns false for video/embed URLs', () => {
    expect(isLoadablePhoto('https://youtube.com/watch?v=abc')).toBe(false)
    expect(isLoadablePhoto('https://youtu.be/abc')).toBe(false)
    expect(isLoadablePhoto('https://xhamster.com/videos/abc')).toBe(false)
    expect(isLoadablePhoto('https://pornhub.com/view_video.php?viewkey=abc')).toBe(false)
    expect(isLoadablePhoto('https://xvideos.com/video123')).toBe(false)
    expect(isLoadablePhoto('https://redtube.com/12345')).toBe(false)
    expect(isLoadablePhoto('https://onlyfans.com/user/posts/abc')).toBe(false)
    expect(isLoadablePhoto('https://tiktok.com/@user/video/123')).toBe(false)
  })

  it('returns true for real image URLs', () => {
    expect(isLoadablePhoto('https://api.shemalewiki.online/api/files/photos/abc/avatar.jpg')).toBe(true)
    expect(isLoadablePhoto('https://static2.eros.bz/image.jpg')).toBe(true)
    expect(isLoadablePhoto('https://example.com/photo.jpg')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isLoadablePhoto('')).toBe(false)
  })
})

describe('photoFilter - hasRealFile', () => {
  it('returns true for PocketBase file field', () => {
    expect(hasRealFile({ file: 'avatar.jpg', profile_id: 'abc' })).toBe(true)
  })

  it('returns true for api/files/ URL', () => {
    expect(hasRealFile({ photo_url: 'https://api.shemalewiki.online/api/files/photos/abc/avatar.jpg' })).toBe(true)
  })

  it('returns true for eros.bz URL', () => {
    expect(hasRealFile({ photo_url: 'https://static2.eros.bz/image.jpg' })).toBe(true)
  })

  it('returns false for dead URLs', () => {
    expect(hasRealFile({ photo_url: 'https://web.archive.org/web/2023/http://example.com' })).toBe(false)
    expect(hasRealFile({ photo_url: 'https://shemalewiki.com/old.jpg' })).toBe(false)
    expect(hasRealFile({ photo_url: 'https://youtube.com/watch?v=abc' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(hasRealFile(null)).toBe(false)
    expect(hasRealFile(undefined)).toBe(false)
  })

  it('returns false for empty object', () => {
    expect(hasRealFile({})).toBe(false)
  })
})
