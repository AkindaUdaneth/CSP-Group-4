import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  }
})

import axios from 'axios'
import bracketService from './bracketService'

const BASE = '/api'

describe('bracketService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTeams: calls correct bracket teams endpoint', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 1 }] })
    const res = await bracketService.getTeams(5)
    expect(axios.get).toHaveBeenCalledWith(`${BASE}/tournaments/5/bracket/teams`)
    expect(res).toEqual([{ id: 1 }])
  })

  it('createTeam: POSTs team payload with bearer headers', async () => {
    axios.post.mockResolvedValue({ data: { id: 9 } })
    const token = 'token'
    const res = await bracketService.createTeam(5, { TeamName: 'A' }, token)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE}/tournaments/5/bracket/teams`,
      { TeamName: 'A' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    expect(res).toEqual({ id: 9 })
  })

  it('getMatchScores: GETs match scores list', async () => {
    axios.get.mockResolvedValue({ data: [{ setNumber: 1, team1Games: 0, team2Games: 0 }] })
    const res = await bracketService.getMatchScores(1, 2)
    expect(axios.get).toHaveBeenCalledWith(
      `${BASE}/tournaments/1/bracket/matches/2/scores`
    )
    expect(res).toEqual([{ setNumber: 1, team1Games: 0, team2Games: 0 }])
  })

  it('updateMatchSetScore: PUTs score with bearer headers', async () => {
    axios.put.mockResolvedValue({ data: { updated: true } })
    const token = 'token-xyz'
    const score = { team1Games: 1, team2Games: 0 }
    const res = await bracketService.updateMatchSetScore(1, 2, 1, score, token)
    expect(axios.put).toHaveBeenCalledWith(
      `${BASE}/tournaments/1/bracket/matches/2/scores/1`,
      score,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    expect(res).toEqual({ updated: true })
  })

  it('deleteMatchSetScore: DELETEs set score with bearer headers', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: true } })
    const token = 'token-xyz'
    const res = await bracketService.deleteMatchSetScore(1, 2, 3, token)
    expect(axios.delete).toHaveBeenCalledWith(
      `${BASE}/tournaments/1/bracket/matches/2/scores/3`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(res).toEqual({ deleted: true })
  })

  it('getStandings: GETs standings endpoint', async () => {
    axios.get.mockResolvedValue({ data: { standings: [] } })
    const res = await bracketService.getStandings(44)
    expect(axios.get).toHaveBeenCalledWith(`${BASE}/tournaments/44/bracket/standings`)
    expect(res).toEqual({ standings: [] })
  })

  it('getTeams: throws a friendly message when axios rejects with server message', async () => {
    const err = {
      response: { data: { message: 'Backend down' } },
    }
    axios.get.mockRejectedValue(err)
    await expect(bracketService.getTeams(1)).rejects.toThrow('Backend down')
  })
})

