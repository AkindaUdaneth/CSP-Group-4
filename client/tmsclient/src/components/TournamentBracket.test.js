import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const token = 'token-1'

vi.mock('../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      user: { id: 1, username: 'u', role: 'admin' },
      token,
    }),
  }
})

vi.mock('../services/tournamentService', () => {
  return {
    tournamentService: {
      getAllTournaments: vi.fn(),
      getTournamentById: vi.fn(),
    },
  }
})

vi.mock('../services/bracketService', () => {
  return {
    default: {
      getTeams: vi.fn(),
      getMatches: vi.fn(),
      createMatch: vi.fn(),
      deleteBracket: vi.fn(),
    },
  }
})

import { tournamentService } from '../services/tournamentService'
import bracketService from '../services/bracketService'
import TournamentBracket from './TournamentBracket'

describe('TournamentBracket', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)

    // Force initial selectedTournamentId from component state initializer
    sessionStorage.setItem('bracket_tournament', '1')

    tournamentService.getAllTournaments.mockResolvedValue([
      { id: 1, name: 'T1' },
    ])
    tournamentService.getTournamentById.mockResolvedValue({
      id: 1,
      name: 'T1',
      description: '',
      status: 'Scheduled',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-02T00:00:00Z',
    })

    bracketService.getTeams.mockResolvedValue([
      { id: 10, teamName: 'Team 1' },
      { id: 20, teamName: 'Team 2' },
    ])
    bracketService.getMatches.mockResolvedValue([]) // ensures createMatch path is used
  })

  it('clears the bracket when token is present', async () => {
    bracketService.deleteBracket.mockResolvedValue({ ok: true })

    const user = userEvent.setup()
    render(<TournamentBracket onOpenLiveScoring={vi.fn()} />)

    await screen.findAllByText('Team 1')

    await user.click(screen.getByRole('button', { name: /Clear Bracket/i }))

    await waitFor(() => {
      expect(bracketService.deleteBracket).toHaveBeenCalledWith(1, token)
    })

    await waitFor(() => {
      expect(screen.queryAllByText('Team 1')).toHaveLength(0)
    })
  })

  it('clicking a match card creates a match, updates sessionStorage, and opens summary report modal', async () => {
    const onOpenLiveScoring = vi.fn()
    bracketService.createMatch.mockResolvedValue({ id: 99 })

    const user = userEvent.setup()
    const { container } = render(<TournamentBracket onOpenLiveScoring={onOpenLiveScoring} />)

    await screen.findAllByText('Team 1')

    // Click the first "match-card" (div) via the "Score Match" text.
    const matchupsSection = container.querySelector('.matchups-section')
    const scoreMatch = within(matchupsSection).getByText(/Score Match/i)
    const matchCard = scoreMatch.closest('.match-card')
    expect(matchCard).not.toBeNull()

    await user.click(matchCard)

    await waitFor(() => {
      expect(bracketService.createMatch).toHaveBeenCalledWith(
        1,
        { Team1Id: 10, Team2Id: 20, IsPlayoff: false },
        token
      )
    })

    await waitFor(() => {
      expect(onOpenLiveScoring).toHaveBeenCalledTimes(1)
    })

    expect(sessionStorage.getItem('ls_tournament')).toBe('1')
    expect(sessionStorage.getItem('ls_match')).toBe('99')

    // Summary report modal
    await user.click(screen.getByRole('button', { name: /Generate Summary Report/i }))
    expect(await screen.findByText(/Tournament Summary Report/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /×|✕/i }))
    await waitFor(() => {
      expect(screen.queryByText(/Tournament Summary Report/i)).not.toBeInTheDocument()
    })
  })
})

