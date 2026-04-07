import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const token = 'token-1'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ token }),
}))

vi.mock('../services/tournamentService', () => ({
  tournamentService: {
    getAllTournaments: vi.fn(),
  },
}))

vi.mock('../services/bracketService', () => {
  return {
    default: {
      getMatches: vi.fn(),
      getTeams: vi.fn(),
      getMatchScores: vi.fn(),
      getLiveGameScore: vi.fn(),
      updateLiveGameScore: vi.fn(),
      updateMatchSetScore: vi.fn(),
      updateMatch: vi.fn(),
      deleteMatchSetScore: vi.fn(),
    },
  }
})

import { tournamentService } from '../services/tournamentService'
import bracketService from '../services/bracketService'
import LiveScoring from './LiveScoring'

describe('LiveScoring', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()

    tournamentService.getAllTournaments.mockResolvedValue([
      { id: 1, name: 'Tournament 1' },
    ])

    bracketService.getMatches.mockResolvedValue([
      { id: 1, team1Id: 10, team2Id: 20, winnerId: null },
    ])

    bracketService.getTeams.mockResolvedValue([
      { id: 10, teamName: 'Team A' },
      { id: 20, teamName: 'Team B' },
    ])

    bracketService.getMatchScores.mockResolvedValue([])

    // Ensure matchStarted stays false (servingTeamId is falsy)
    bracketService.getLiveGameScore.mockResolvedValue({ servingTeamId: null })

    // These are awaited in the scoring flow
    bracketService.updateLiveGameScore.mockResolvedValue({})
    bracketService.updateMatchSetScore.mockResolvedValue({})
  })

  it('starts match, awards a game, and persists set score', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/live/1/1']}>
        <Routes>
          <Route path="/live/:urlTournamentId/:urlMatchId" element={<LiveScoring />} />
        </Routes>
      </MemoryRouter>
    )

    // Serve selection should show once loading completes
    const teamAServeButton = await screen.findByRole('button', { name: /Team A/i })
    await user.click(teamAServeButton)

    // Point buttons should now be visible
    const pointBtn1 = await screen.findByRole('button', { name: /Team A/i })
    expect(pointBtn1).toBeTruthy()

    // Award enough points for a game win (gameWon happens when a player reaches p>=4 in normal scoring)
    for (let i = 0; i < 4; i++) {
      await user.click(pointBtn1)
    }

    await waitFor(() => {
      expect(bracketService.updateLiveGameScore).toHaveBeenCalled()
      expect(bracketService.updateMatchSetScore).toHaveBeenCalled()
    })

    // After first game won, Set 1 should exist in the UI
    expect(await screen.findByText(/Set 1/i)).toBeInTheDocument()

    // Server should rotate at least once, so one of the serve indicators should exist
    expect(screen.getAllByText('(S)').length).toBeGreaterThanOrEqual(1)
  })
})

