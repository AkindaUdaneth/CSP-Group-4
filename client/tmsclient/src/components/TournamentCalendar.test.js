import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the API layer used by TournamentCalendar
vi.mock('../services/tournamentService', () => {
  return {
    tournamentService: {
      getAllTournaments: vi.fn(),
    },
  }
})

// Mock react-big-calendar to keep tests deterministic and light.
vi.mock('react-big-calendar', () => {
  return {
    momentLocalizer: () => ({}),
    Calendar: function CalendarStub({ events = [], onSelectEvent }) {
      return (
        <div data-testid="calendar-stub">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelectEvent?.(e)}
            >
              {e.title}
            </button>
          ))}
        </div>
      )
    },
  }
})

import { tournamentService } from '../services/tournamentService'
import TournamentCalendar from './TournamentCalendar'

describe('TournamentCalendar', () => {
  it('loads tournaments and opens/closes event details', async () => {
    tournamentService.getAllTournaments.mockResolvedValue([
      {
        id: 1,
        name: 'Spring Championship',
        startDate: '2026-04-01T10:00:00Z',
        endDate: '2026-04-02T10:00:00Z',
        description: 'Test description',
        status: 'Scheduled',
      },
    ])

    const user = userEvent.setup()
    render(<TournamentCalendar token="tkn" refreshTrigger={0} />)

    const eventButton = await screen.findByRole('button', {
      name: 'Spring Championship',
    })
    await user.click(eventButton)

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Spring Championship' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Start Date:/i)).toBeInTheDocument()
    expect(screen.getByText(/Test description/i)).toBeInTheDocument()
    expect(screen.getByText('Scheduled', { selector: '.status-badge' })).toBeInTheDocument()

    // Close from the modal footer
    await user.click(screen.getByRole('button', { name: /Close/i }))
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 3, name: 'Spring Championship' })
      ).not.toBeInTheDocument()
    })
  })

  it('refresh button re-fetches tournaments', async () => {
    tournamentService.getAllTournaments
      .mockResolvedValueOnce([
        { id: 1, name: 'T1', startDate: '2026-04-01T10:00:00Z', endDate: '2026-04-02T10:00:00Z', description: '', status: 'Scheduled' },
      ])
      .mockResolvedValueOnce([
        { id: 2, name: 'T2', startDate: '2026-04-03T10:00:00Z', endDate: '2026-04-04T10:00:00Z', description: '', status: 'Completed' },
      ])

    const user = userEvent.setup()
    render(<TournamentCalendar token="tkn" refreshTrigger={0} />)

    await screen.findByRole('button', { name: 'T1' })
    const initialCalls = tournamentService.getAllTournaments.mock.calls.length
    const refreshBtn = screen.getByRole('button', { name: /Refresh/i })
    await waitFor(() => expect(refreshBtn).not.toBeDisabled())
    await user.click(refreshBtn)

    await waitFor(() => {
      expect(tournamentService.getAllTournaments).toHaveBeenCalledTimes(initialCalls + 1)
    })
  })

  it('shows a user-facing error when API fails', async () => {
    tournamentService.getAllTournaments.mockRejectedValue(new Error('backend down'))

    render(<TournamentCalendar token="tkn" refreshTrigger={0} />)

    expect(
      await screen.findByText(/Failed to load tournaments: backend down/i)
    ).toBeInTheDocument()
  })
})

