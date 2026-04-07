import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

import PlayerDashboard from './PlayerDashboard'

describe('PlayerDashboard', () => {
  it('renders dashboard for non-admin and navigates to /login on Logout', async () => {
    const user = userEvent.setup()
    authMock = {
      user: { username: 'Bob', role: 'Player' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<PlayerDashboard />} />
          <Route path="/admin" element={<div>Admin Landing</div>} />
          <Route path="/login" element={<div>Login Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Welcome, Bob!/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Logout/i }))
    expect(authMock.logout).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(screen.getByText('Login Landing')).toBeInTheDocument()
    })
  })

  it('redirects admins to /admin', async () => {
    authMock = {
      user: { username: 'AdminUser', role: 'admin' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<PlayerDashboard />} />
          <Route path="/admin" element={<div>Admin Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Admin Landing')).toBeInTheDocument()
    })
  })
})

