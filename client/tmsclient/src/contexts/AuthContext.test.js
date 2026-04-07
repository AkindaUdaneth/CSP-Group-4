import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider, useAuth } from './AuthContext'
import { resetStorage } from '../test-utils/mockApi'

function AuthConsumer({ onLoaded }) {
  const auth = useAuth()

  // Let tests wait for initial loading to finish.
  if (onLoaded && auth.loading === false) onLoaded(auth)

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="token">{auth.token || ''}</div>
      <div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="error">{auth.error || ''}</div>
      <button
        type="button"
        onClick={() => auth.login('  jane  ', '  pw  ')}
      >
        Login
      </button>
      <button type="button" onClick={() => auth.logout()}>
        Logout
      </button>
      <button
        type="button"
        onClick={() => auth.signup('alice', '123', 'a@b.com', 'pw', 'pw')}
      >
        Signup
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetStorage()
  })

  it('initializes from localStorage and sets loading=false', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'jane',
        email: 'jane@example.com',
        identityNumber: '123',
        contactNumber: '077',
        address: 'Somewhere',
        role: 'Admin',
        isApproved: true,
        approvedAt: null,
      })
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('token').textContent).toBe('stored-token')
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
  })

  it('login success stores token + user and updates isAuthenticated', async () => {
    const user = userEvent.setup()
    localStorage.clear()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'new-token',
        id: 5,
        username: 'jane',
        email: 'jane@example.com',
        identityNumber: 'NIC',
        contactNumber: '077',
        address: 'Colombo',
        role: 'Admin',
        isApproved: true,
        approvedAt: '2026-01-01T00:00:00Z',
      }),
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('new-token')
    })
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
    expect(screen.getByTestId('error').textContent).toBe('')
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(localStorage.getItem('user')).not.toBeNull()
  })

  it('login failure sets error and keeps isAuthenticated false', async () => {
    const user = userEvent.setup()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials')
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    })
  })

  it('logout clears localStorage and sets user/token back to null', async () => {
    const user = userEvent.setup()

    localStorage.setItem('token', 't')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'jane',
        email: 'jane@example.com',
        identityNumber: '123',
        contactNumber: '077',
        address: 'Somewhere',
        role: 'Admin',
        isApproved: true,
        approvedAt: null,
      })
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('')
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    })
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

