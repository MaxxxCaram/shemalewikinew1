// Test setup: polyfills y configuración global
/**
 * @vitest-environment jsdom
 */
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock de localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock de fetch
global.fetch = vi.fn()

// Mock de window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://shemalewiki.online',
    hostname: 'shemalewiki.online',
    pathname: '/',
    href: 'https://shemalewiki.online/',
  },
  writable: true,
})

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/admin' }),
}))

// Mock de PhotoCropModal
vi.mock('../components/PhotoCropModal', () => ({
  default: () => null,
}))
