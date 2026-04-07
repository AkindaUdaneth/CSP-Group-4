import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/tournamentService', () => ({
  tournamentService: {
    getTournamentById: vi.fn(),
  },
}))

vi.mock('../services/bracketService', () => {
  return {
    default: {
      getMatchById: vi.fn(),
      getTeamById: vi.fn(),
      getMatchScores: vi.fn(),
      getLiveGameScore: vi.fn(),
    },
  }
})

import { tournamentService } from '../services/tournamentService'
import bracketService from '../services/bracketService'
import LiveScoreView from './LiveScoreView'

describe('LiveScoreView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    tournamentService.getTournamentById.mockResolvedValue({ name: 'Tournament 1' })
    bracketService.getMatchById.mockResolvedValue({ team1Id: 10, team2Id: 20 })
    bracketService.getTeamById.mockImplementation((tId, teamId) =>
      Promise.resolve({ id: teamId, teamName: teamId === 10 ? 'Team A' : 'Team B' })
    )
    bracketService.getMatchScores.mockResolvedValue([
      { setNumber: 1, team1Games: 1, team2Games: 0 },
    ])
    bracketService.getLiveGameScore.mockResolvedValue({
      team1Points: 3,
      team2Points: 2,
      servingTeamId: 10,
    })
  })

  it('renders live scoreboard and polls every 5 seconds', async () => {
    let intervalCb
    vi.spyOn(global, 'setInterval').mockImplementation((cb, ms) => {
      if (ms === 5000) intervalCb = cb
      return 1
    })
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {})

    // Initial load values
    bracketService.getMatchScores.mockResolvedValueOnce([
      { setNumber: 1, team1Games: 1, team2Games: 0 },
    ])
    bracketService.getLiveGameScore.mockResolvedValueOnce({
      team1Points: 3,
      team2Points: 2,
      servingTeamId: 10,
    })

    // Polling values (so we can assert the UI actually updated)
    bracketService.getMatchScores.mockResolvedValueOnce([
      { setNumber: 1, team1Games: 5, team2Games: 2 },
    ])
    bracketService.getLiveGameScore.mockResolvedValueOnce({
      team1Points: 4,
      team2Points: 1,
      servingTeamId: 10,
    })

    render(
      <MemoryRouter initialEntries={['/tournaments/1/matches/1']}>
        <Routes>
          <Route path="/tournaments/:tournamentId/matches/:matchId" element={<LiveScoreView />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Tournament 1')).toBeInTheDocument()
    expect(screen.getAllByText('Team A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Team B').length).toBeGreaterThan(0)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/🎾 Serving/i)).toBeInTheDocument()

    // Trigger one polling cycle deterministically (instead of waiting 5s)
    expect(intervalCb).toBeTruthy()
    await act(async () => {
      await intervalCb()
    })

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      // points should have been updated from 3 -> 4
      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })
  })
})

