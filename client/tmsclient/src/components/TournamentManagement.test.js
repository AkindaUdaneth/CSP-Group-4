import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../services/tournamentService', () => {
  return {
    tournamentService: {
      getAllTournaments: vi.fn(),
      createTournament: vi.fn(),
      updateTournament: vi.fn(),
      deleteTournament: vi.fn(),
      updateTournamentStatus: vi.fn(),
    },
  }
})

import { tournamentService } from '../services/tournamentService'
import TournamentManagement from './TournamentManagement'

describe('TournamentManagement', () => {
  it('loads tournaments and creates a new one via the form', async () => {
    tournamentService.getAllTournaments.mockResolvedValueOnce([])
    tournamentService.createTournament.mockResolvedValueOnce({ id: 1 })
    tournamentService.getAllTournaments.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Spring Championship',
        description: 'd',
        startDate: '2026-04-01T10:00:00Z',
        endDate: '2026-04-02T10:00:00Z',
        status: 'Scheduled',
      },
    ])

    const onTournamentAdded = vi.fn()
    const user = userEvent.setup()

    render(
      <TournamentManagement token="token-1" onTournamentAdded={onTournamentAdded} />
    )

    // Open form
    await user.click(screen.getByRole('button', { name: /\+ New Tournament/i }))

    const nameInput = screen.getByPlaceholderText(/Spring Championship 2026/i)
    await user.type(nameInput, 'Spring Championship')

    const descInput = screen.getByPlaceholderText(/Tournament description/i)
    await user.type(descInput, 'd')

    const startInput = document.querySelector('input[name="startDate"]')
    const endInput = document.querySelector('input[name="endDate"]')
    await user.clear(startInput)
    await user.type(startInput, '2026-04-01T10:00')
    await user.clear(endInput)
    await user.type(endInput, '2026-04-02T10:00')

    await user.click(screen.getByRole('button', { name: /Create Tournament/i }))

    await waitFor(() => {
      expect(tournamentService.createTournament).toHaveBeenCalled()
    })

    expect(onTournamentAdded).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText(/Tournament created successfully/i)
    ).toBeInTheDocument()

    expect(screen.getByText('Spring Championship')).toBeInTheDocument()
  })

  it('updates tournament status and deletes a tournament', async () => {
    const existing = {
      id: 2,
      name: 'T2',
      description: 'desc',
      startDate: '2026-04-03T10:00:00Z',
      endDate: '2026-04-04T10:00:00Z',
      status: 'Scheduled',
    }

    tournamentService.getAllTournaments
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([existing]) // after status update
      .mockResolvedValueOnce([]) // after delete

    tournamentService.updateTournamentStatus.mockResolvedValueOnce({ id: 2 })
    tournamentService.deleteTournament.mockResolvedValueOnce(true)

    window.confirm = vi.fn(() => true)
    const user = userEvent.setup()

    render(<TournamentManagement token="token-1" />)

    // Status update
    await screen.findByText('T2')
    const statusSelect = screen.getByDisplayValue('Scheduled')
    await user.selectOptions(statusSelect, 'Completed')

    await waitFor(() => {
      expect(tournamentService.updateTournamentStatus).toHaveBeenCalledWith(
        2,
        'Completed',
        'token-1'
      )
    })
    expect(
      await screen.findByText(/Tournament status updated/i)
    ).toBeInTheDocument()

    // Delete
    await user.click(screen.getByRole('button', { name: /Delete/i }))

    await waitFor(() => {
      expect(tournamentService.deleteTournament).toHaveBeenCalledWith(2, 'token-1')
    })
    expect(
      await screen.findByText(/Tournament deleted successfully/i)
    ).toBeInTheDocument()
  })
})

