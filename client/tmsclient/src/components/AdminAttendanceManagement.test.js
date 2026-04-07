import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminAttendanceManagement from './AdminAttendanceManagement'

const API_BASE = '/api'

describe('AdminAttendanceManagement', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.confirm = vi.fn(() => true)
    sessionStorage.clear()
  })

  it('loads sessions + report, toggles attendance, and saves with PUT payload', async () => {
    const sessionsPayload = [
      {
        id: 1,
        dayOfWeek: 'Monday',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        sessionType: 'Team Practice',
      },
    ]

    const attendancePayload = {
      players: [
        {
          playerId: 10,
          playerName: 'Player A',
          playerEmail: 'a@example.com',
          playerIdentityNumber: 'ID-1',
          isPresent: true,
        },
      ],
    }

    const reportPayload = {
      data: [
        {
          playerId: 10,
          username: 'Player A',
          email: 'a@example.com',
          missedSessions: 1,
          totalMarkedSessions: 2,
          missPercentage: 50,
        },
      ],
    }

    const fetchMock = vi.fn((url, options = {}) => {
      // GET sessions
      if (url === `${API_BASE}/practicesessions`) {
        return Promise.resolve({
          ok: true,
          json: async () => sessionsPayload,
        })
      }

      // GET attendance report
      if (String(url).includes('/practicesessions/attendance-report')) {
        return Promise.resolve({
          ok: true,
          json: async () => reportPayload,
        })
      }

      // GET attendance grid
      if (String(url).includes('/practicesessions/1/attendance')) {
        return Promise.resolve({
          ok: true,
          json: async () => attendancePayload,
        })
      }

      // PUT save attendance
      if (String(url).includes('/practicesessions/1/attendance') && options.method === 'PUT') {
        const sent = JSON.parse(options.body || '{}')
        // we expect one item with isPresent flipped to false after toggle
        expect(sent.items).toEqual([{ playerId: 10, isPresent: false }])
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Attendance saved successfully' }),
        })
      }

      // Fallback
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not mocked' }),
      })
    })

    vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

    const user = userEvent.setup()
    render(<AdminAttendanceManagement token="token-1" />)

    // Wait for the sessions to load and the report table header to render
    await screen.findByText('Attendance Management')
    expect(screen.getByText(/Admin Report - Frequent Absentees/i)).toBeInTheDocument()

    // Ensure the practice sessions have loaded (selectedSessionId is derived from the first session).
    await screen.findByRole('option', {
      name: /Monday \| 1:00 PM - 2:00 PM \| Team Practice/i,
    })

    // Load attendance grid
    const loadBtn = screen.getByRole('button', { name: /Load Attendance/i })
    await user.click(loadBtn)

    const playerANodes = await screen.findAllByText('Player A')
    expect(playerANodes.length).toBeGreaterThan(0)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    // Toggle presence -> should flip checkbox to unchecked
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()

    const saveBtn = screen.getByRole('button', { name: /Save Attendance/i })
    await user.click(saveBtn)

    // Success message is short-lived because the grid reload clears it,
    // so assert stable effects: PUT happened and grid was refreshed.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/practicesessions/1/attendance'),
        expect.objectContaining({ method: 'PUT' })
      )
      expect(screen.getByRole('checkbox')).toBeChecked()
    })
  })
})

