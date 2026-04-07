import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

// Keep tab contents light (we only exercise approvals logic here)
vi.mock('../components/TournamentManagement', () => ({ default: () => <div>Tournament Management</div> }))
vi.mock('../components/TournamentCalendar', () => ({ default: () => <div>Tournament Calendar</div> }))
vi.mock('../components/TournamentBracket', () => ({ default: () => <div>Tournament Bracket</div> }))
vi.mock('./LiveScoring', () => ({ default: () => <div>Live Scoring</div> }))
vi.mock('./InventoryPage', () => ({ default: () => <div>Inventory Page</div> }))
vi.mock('../components/PracticeSessionManagement', () => ({ default: () => <div>Practice</div> }))
vi.mock('../components/AdminAttendanceManagement', () => ({ default: () => <div>Attendance</div> }))

import AdminDashboard from './AdminDashboard'

const API_BASE = '/api/admin'

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
    window.confirm = vi.fn(() => true)
  })

  it('redirects to /login when unauthenticated', async () => {
    authMock = { loading: false, isAuthenticated: false, user: { role: 'Admin' }, token: 'tkn', logout: vi.fn() }

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<div>Login Landing</div>} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Login Landing')).toBeInTheDocument())
  })

  it('redirects to /dashboard when role is not admin', async () => {
    authMock = { loading: false, isAuthenticated: true, user: { role: 'Player' }, token: 'tkn', logout: vi.fn() }

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<div>Login Landing</div>} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Dashboard Landing')).toBeInTheDocument())
  })

  it('loads pending registrations and approves one', async () => {
    sessionStorage.setItem('adminActiveTab', 'approvals')
    authMock = { loading: false, isAuthenticated: true, user: { role: 'Admin' }, token: 'tkn', logout: vi.fn() }

    const pending = [
      {
        id: 1,
        username: 'player1',
        identityNumber: 'NIC1',
        email: 'p1@example.com',
        createdAt: '2026-04-01T00:00:00Z',
      },
    ]

    const fetchMock = vi.fn((url, options = {}) => {
      // Initial load of pending approvals
      if (url === `${API_BASE}/pending-approvals`) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: pending }),
        })
      }

      // Approve call
      if (url === `${API_BASE}/approve-player/1` && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'approved' }),
        })
      }

      // Reload after approving
      if (url === `${API_BASE}/pending-approvals`) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: pending }),
        })
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ message: 'Not mocked' }),
      })
    })

    vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<div>Login Landing</div>} />
          <Route path="/dashboard" element={<div>Dashboard Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Pending Registration Requests')).toBeInTheDocument()
    expect(screen.getByText('player1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Approve/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE}/approve-player/1`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    expect(
      await screen.findByText(/Successfully approved player1/i)
    ).toBeInTheDocument()
  })
})

