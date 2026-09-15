import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Admin from '../pages/Admin'

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/admin' }),
}))

// Mock de PhotoCropModal
vi.mock('../components/PhotoCropModal', () => ({
  default: () => null,
}))

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

describe('Admin Panel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders login form when not authenticated', () => {
    render(<Admin />)
    expect(screen.getByPlaceholderText('Secret de admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('shows error message on invalid password', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid admin password.' }),
    })

    render(<Admin />)
    const input = screen.getByPlaceholderText('Secret de admin')
    fireEvent.change(input, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/secret incorrecto/i)).toBeInTheDocument()
    })
  })

  it('authenticates and shows profiles on valid password', async () => {
    // Login response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    })
    // Profiles list response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profiles: [
          { id: 'p1', name: 'Test Profile', cam_chat: 'approved', location: 'Test City', phone: '123', email: 'test@test.com', bio: 'Test bio' },
        ],
      }),
    })

    render(<Admin />)
    const input = screen.getByPlaceholderText('Secret de admin')
    fireEvent.change(input, { target: { value: 'Aria2026!' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Test Profile')).toBeInTheDocument()
    })
    expect(screen.getByText(/1 perfiles/i)).toBeInTheDocument()
  })

  it('redirects to login when token is invalid on mount', async () => {
    localStorage.setItem('admin_token', 'invalid-token')
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid token.' }),
    })

    render(<Admin />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Secret de admin')).toBeInTheDocument()
    })
    expect(localStorage.getItem('admin_token')).toBeNull()
  })

  it('shows profile editor when edit button is clicked', async () => {
    // Login
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    })
    // Profiles list
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profiles: [
          { id: 'p1', name: 'Test Profile', cam_chat: 'approved', location: 'Test City', phone: '123', email: 'test@test.com', bio: 'Test bio' },
        ],
      }),
    })
    // get-profile
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          id: 'p1',
          name: 'Test Profile',
          cam_chat: 'approved',
          location: 'Test City',
          phone: '123',
          email: 'test@test.com',
          bio: 'Test bio',
        },
        photos: [
          { id: 'ph1', file: 'avatar.jpg', profile_id: 'p1', local_path: 'cover' },
        ],
      }),
    })

    render(<Admin />)
    const input = screen.getByPlaceholderText('Secret de admin')
    fireEvent.change(input, { target: { value: 'Aria2026!' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Test Profile')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByTitle('Editar perfil')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText(/editar: test profile/i)).toBeInTheDocument()
    })
  })
})
