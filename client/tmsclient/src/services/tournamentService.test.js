import { describe, it, expect, beforeEach } from 'vitest'
import { tournamentService } from './tournamentService'
import { API_ENDPOINTS } from '../config/api'
import { mockFetchOnce, resetStorage } from '../test-utils/mockApi'

const BASE = 'http://localhost:5011/api'
const API_URL = API_ENDPOINTS.ADMIN.replace('/admin', '/tournaments')

describe('tournamentService', () => {
  beforeEach(() => {
    resetStorage()
  })

  it('getAllTournaments: GETs /tournaments and returns data.data or []', async () => {
    const data = [{ id: 1, name: 'Spring' }]
    mockFetchOnce({ ok: true, json: { data } })

    const res = await tournamentService.getAllTournaments()
    expect(global.fetch).toHaveBeenCalledWith(API_URL, {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res).toEqual(data)
  })

  it('getTournamentById: GETs /tournaments/:id and returns data.data', async () => {
    const data = { id: 3, name: 'Final' }
    mockFetchOnce({ ok: true, json: { data } })

    const res = await tournamentService.getTournamentById(3)
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/3`, {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res).toEqual(data)
  })

  it('getTournamentsByStatus: GETs /tournaments/status/:status', async () => {
    const data = [{ id: 8 }]
    mockFetchOnce({ ok: true, json: { data } })

    const res = await tournamentService.getTournamentsByStatus('Completed')
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/status/Completed`, {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res).toEqual(data)
  })

  it('createTournament: POSTs tournament with bearer token and returns data.data', async () => {
    const token = 'token'
    const request = { name: 'New', description: '', startDate: 'x', endDate: 'y' }
    const data = { id: 1 }
    mockFetchOnce({ ok: true, json: { data } })

    const res = await tournamentService.createTournament(request, token)
    expect(global.fetch).toHaveBeenCalledWith(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    expect(res).toEqual(data)
  })

  it('createTournament: throws server message when not ok', async () => {
    mockFetchOnce({ ok: false, status: 400, json: { message: 'Create failed' } })
    await expect(tournamentService.createTournament({ name: 'x' }, 'token')).rejects.toThrow('Create failed')
  })

  it('updateTournament: PUTs tournament updates with bearer token', async () => {
    const token = 'token'
    const request = { description: 'updated' }
    const data = { id: 2 }
    mockFetchOnce({ ok: true, json: { data } })

    const res = await tournamentService.updateTournament(2, request, token)
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/2`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    expect(res).toEqual(data)
  })

  it('updateTournamentStatus: PATCHes /:id/status with { Status } and returns data.data', async () => {
    const token = 'token'
    mockFetchOnce({ ok: true, json: { data: { id: 1, status: 'Completed' } } })

    const res = await tournamentService.updateTournamentStatus(1, 'Completed', token)
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/1/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Status: 'Completed' }),
    })
    expect(res).toEqual({ id: 1, status: 'Completed' })
  })

  it('deleteTournament: DELETE returns true on success', async () => {
    mockFetchOnce({ ok: true, json: {} })

    const res = await tournamentService.deleteTournament(99, 'token')
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/99`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer token`,
        'Content-Type': 'application/json',
      },
    })
    expect(res).toBe(true)
  })
})

