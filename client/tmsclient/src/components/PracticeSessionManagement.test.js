import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PracticeSessionManagement from './PracticeSessionManagement'

const API_BASE = '/api'
const API_URL = `${API_BASE}/practicesessions`

describe('PracticeSessionManagement', () => {
  it('uses fallback data when initial fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    render(<PracticeSessionManagement token="token-1" />)

    // fallback session should render
    expect(await screen.findByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText(/3:00 PM - 6:30 PM/i)).toBeInTheDocument()
    expect(screen.getByText(/Team Practice \(Fallback\)/i)).toBeInTheDocument()
  })

  it('edits and submits a session (PUT) with Authorization header', async () => {
    const user = userEvent.setup()

    const initialSessions = [
      {
        id: 1,
        dayOfWeek: 'Monday',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        sessionType: 'Team Practice',
      },
    ]

    const updatedSessions = [
      {
        id: 1,
        dayOfWeek: 'Monday',
        startTime: '1:30 PM',
        endTime: '2:30 PM',
        sessionType: 'Team Practice',
      },
    ]

    // Order of fetch calls:
    // 1) mount fetchSessions() -> GET API_URL
    // 2) submit -> PUT /:id
    // 3) refresh after submit -> fetchSessions() GET API_URL again
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialSessions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSessions,
      })

    render(<PracticeSessionManagement token="token-1" />)

    await screen.findByText('Monday')

    await user.click(screen.getByRole('button', { name: /Edit/i }))

    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument()

    const startInput = screen.getByPlaceholderText(/e\.g\. 3:00 PM/i) // startTime placeholder
    await user.clear(startInput)
    await user.type(startInput, '1:30 PM')

    const endInput = screen.getByPlaceholderText(/e\.g\. 6:30 PM/i)
    await user.clear(endInput)
    await user.type(endInput, '2:30 PM')

    await user.click(screen.getByRole('button', { name: /Update/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Authorization': 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
      }))
    })

    expect(await screen.findByText(/Session updated!/i)).toBeInTheDocument()

    // We don't assert auto-clear via timers here to keep the test stable.
  })
})

