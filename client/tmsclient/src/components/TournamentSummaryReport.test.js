import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TournamentSummaryReport from './TournamentSummaryReport'

describe('TournamentSummaryReport', () => {
  it('renders champion + computed completion rate and supports Print and Close', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    // Print flow uses setTimeout; execute immediately to avoid fake timers + userEvent hangs.
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      cb()
      return 0
    })

    const tournament = {
      id: 1,
      name: 'Spring Championship',
      description: 'A test tournament',
      status: 'Completed',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-10T00:00:00Z',
    }

    const teams = [
      { id: 101, teamName: 'Team A' },
      { id: 102, teamName: 'Team B' },
      { id: 103, teamName: 'Team C' },
    ]

    const matchups = [
      {
        key: 'm1',
        team1: { id: 101, teamName: 'Team A' },
        team2: { id: 102, teamName: 'Team B' },
        winner: 101,
      },
      {
        key: 'm2',
        team1: { id: 102, teamName: 'Team B' },
        team2: { id: 103, teamName: 'Team C' },
        winner: null,
      },
    ]

    const tiebreakers = [
      {
        key: 'tb1',
        team1: { id: 101, teamName: 'Team A' },
        team2: { id: 103, teamName: 'Team C' },
        winner: 103,
      },
    ]

    const finalStandings = [
      { id: 1, teamName: 'Team A', wins: 5, losses: 1 },
      { id: 2, teamName: 'Team B', wins: 4, losses: 2 },
      { id: 3, teamName: 'Team C', wins: 3, losses: 3 },
    ]

    const pw = {
      document: {
        write: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(pw)

    render(
      <TournamentSummaryReport
        tournament={tournament}
        teams={teams}
        matchups={matchups}
        tiebreakers={tiebreakers}
        finalStandings={finalStandings}
        onClose={onClose}
      />
    )

    expect(screen.getByText(/Tournament Summary Report/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /Tournament Champion/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText('Team A').length).toBeGreaterThan(0)

    // completionPct: completedMatches=1 of totalMatches=2 => 50
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)

    expect(screen.getByText(/Playoff Match Results/i)).toBeInTheDocument()
    expect(screen.getByText(/Playoff Match Results/i)).toBeInTheDocument()

    // Print button should open a window and write html
    await user.click(screen.getByRole('button', { name: /Print \/ Download PDF/i }))
    expect(window.open).toHaveBeenCalled()
    expect(pw.document.write).toHaveBeenCalled()

    expect(pw.print).toHaveBeenCalled()

    // Close should call onClose
    await user.click(screen.getByRole('button', { name: /✕/i }))
    expect(onClose).toHaveBeenCalledTimes(1)

    setTimeoutSpy.mockRestore()
  })
})

