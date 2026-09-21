import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { getProxiedImageUrl } from '../utils.js'
import SEO from '../components/SEO'

describe('no-photo placeholder', () => {
  it('is a percent-encoded SVG that actually decodes (raw # used to truncate it)', () => {
    const uri = getProxiedImageUrl(null)
    const prefix = 'data:image/svg+xml;charset=utf-8,'
    expect(uri.startsWith(prefix)).toBe(true)
    const svg = decodeURIComponent(uri.slice(prefix.length))
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
    expect(svg).toContain('#1e293b')
    // a well-formed document: no parsererror
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(doc.getElementsByTagName('parsererror').length).toBe(0)
    // and no unescaped '#' left in the URI (it would start a fragment)
    expect(uri.includes('#')).toBe(false)
  })
})

describe('<SEO/> head tags', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('removes the static shell copies (data-static-seo) so there is one canonical / description per page', async () => {
    document.head.innerHTML =
      '<link rel="canonical" href="https://shemalewiki.online/" data-static-seo />' +
      '<meta name="description" content="static" data-static-seo />' +
      '<meta property="og:site_name" content="ShemaleWiki" />'
    render(
      <HelmetProvider>
        <SEO title="Madrid" description="Trans companions in Madrid" canonicalPath="/europe/spain/madrid" />
      </HelmetProvider>
    )
    await vi.waitFor(() => {
      expect(document.head.querySelectorAll('[data-static-seo]').length).toBe(0)
      expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1)
    })
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://shemalewiki.online/europe/spain/madrid')
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1)
  })

  it('uses the buscatrans brand for canonical + og:site_name on buscatrans.com', async () => {
    const original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, hostname: 'buscatrans.com', pathname: '/es/europe/spain', href: 'https://buscatrans.com/es/europe/spain' },
    })
    try {
      render(
        <HelmetProvider>
          <SEO title="España" description="Acompañantes trans en España" canonicalPath="/es/europe/spain" />
        </HelmetProvider>
      )
      await vi.waitFor(() => {
        expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull()
      })
      expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://buscatrans.com/es/europe/spain')
      expect(document.head.querySelector('meta[property="og:site_name"]').getAttribute('content')).toBe('BuscaTrans')
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original })
    }
  })
})
