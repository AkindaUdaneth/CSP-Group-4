import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authMock = {
      loading: false,
      isAuthenticated: false,
      user: null,
    }
  })

  function Harness({ roles, redirectTo }) {
    return (
      <ProtectedRoute roles={roles} redirectTo={redirectTo}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
  }

  it('renders Loading... when auth is loading', () => {
    authMock = { loading: true }

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={<Harness roles={['admin']} redirectTo="/dashboard" />}
          />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    authMock = {
      loading: false,
      isAuthenticated: false,
      user: null,
    }

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={<Harness roles={['admin']} redirectTo="/dashboard" />}
          />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('redirects to redirectTo when role is not allowed', () => {
    authMock = {
      loading: false,
      isAuthenticated: true,
      user: { role: 'player' },
    }

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={<Harness roles={['admin']} redirectTo="/dashboard" />}
          />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders children when authenticated and role allowed', () => {
    authMock = {
      loading: false,
      isAuthenticated: true,
      user: { role: 'Admin' },
    }

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={<Harness roles={['admin']} redirectTo="/dashboard" />}
          />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

