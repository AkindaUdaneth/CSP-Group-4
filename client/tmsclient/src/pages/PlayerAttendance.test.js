import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import PlayerAttendance from './PlayerAttendance'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

describe('PlayerAttendance', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authMock = { token: 'token-1' }
  })

  it('renders attendance rows and allows navigating back', async () => {
    const user = userEvent.setup()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            attendanceDate: '2026-04-01T00:00:00Z',
            session: {
              sessionId: 1,
              sessionType: 'Team Practice',
              startTime: '3:00 PM',
              endTime: '6:30 PM',
            },
            isPresent: true,
            markedByAdmin: 'Admin1',
          },
        ],
      }),
    })

    render(
      <MemoryRouter initialEntries={['/my-attendance']}>
        <Routes>
          <Route path="/my-attendance" element={<PlayerAttendance />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/My Attendance/i)).toBeInTheDocument()
    expect(await screen.findByText('Present')).toBeInTheDocument()
    expect(screen.getByText('Team Practice')).toBeInTheDocument()
    expect(screen.getByText('Admin1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Dashboard/i }))

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })
})

