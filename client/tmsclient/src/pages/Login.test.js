import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

import Login from './Login'

describe('Login page', () => {
  beforeEach(() => {
    authMock = {
      login: vi.fn(),
    }
  })

  it('navigates to /admin when role is admin', async () => {
    authMock.login.mockResolvedValue({
      success: true,
      user: { role: 'admin' },
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<div>Admin Landing</div>} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
          <Route path="/signup" element={<div>Signup</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(
      screen.getByPlaceholderText(/Email or Identity Number/i),
      'jane'
    )
    await user.type(screen.getByPlaceholderText(/Password/i), 'pw')

    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(await screen.findByText('Admin Landing')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Landing')).not.toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    authMock.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<div>Admin Landing</div>} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(
      screen.getByPlaceholderText(/Email or Identity Number/i),
      'jane'
    )
    await user.type(screen.getByPlaceholderText(/Password/i), 'pw')

    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument()
  })
})

