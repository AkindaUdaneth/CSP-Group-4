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
import groupService from './groupService'

const BASE = '/api'

describe('groupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getGroupsByTournament: GET /group/tournament/:tournamentId', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 1 }] })
    const res = await groupService.getGroupsByTournament(10)
    expect(axios.get).toHaveBeenCalledWith(`${BASE}/group/tournament/10`)
    expect(res).toEqual([{ id: 1 }])
  })

  it('getGroup: GET /group/:groupId', async () => {
    axios.get.mockResolvedValue({ data: { id: 2 } })
    const res = await groupService.getGroup(2)
    expect(axios.get).toHaveBeenCalledWith(`${BASE}/group/2`)
    expect(res).toEqual({ id: 2 })
  })

  it('createGroupsWithRandomAssignment: POST /group/random-assign with bearer headers', async () => {
    axios.post.mockResolvedValue({ data: { created: 3 } })
    const token = 'tkn'
    const res = await groupService.createGroupsWithRandomAssignment(7, 3, [1, 2], token)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE}/group/random-assign`,
      { tournamentId: 7, numberOfGroups: 3, playerIds: [1, 2] },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }
    )
    expect(res).toEqual({ created: 3 })
  })

  it('createGroup: POST /group with groupData and bearer headers', async () => {
    axios.post.mockResolvedValue({ data: { id: 99 } })
    const token = 'tkn'
    const groupData = { TeamName: 'A' }
    const res = await groupService.createGroup(groupData, token)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE}/group`,
      groupData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    expect(res).toEqual({ id: 99 })
  })

  it('updateGroup: PUT /group/:groupId with groupData and bearer headers', async () => {
    axios.put.mockResolvedValue({ data: { id: 5, name: 'x' } })
    const token = 'tkn'
    const groupData = { name: 'x' }
    const res = await groupService.updateGroup(5, groupData, token)
    expect(axios.put).toHaveBeenCalledWith(
      `${BASE}/group/5`,
      groupData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    expect(res).toEqual({ id: 5, name: 'x' })
  })

  it('assignPlayerToGroup: POST /group/:groupId/player/:playerId', async () => {
    axios.post.mockResolvedValue({ data: { ok: true } })
    const token = 'tkn'
    const res = await groupService.assignPlayerToGroup(1, 2, token)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE}/group/1/player/2`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    expect(res).toEqual({ ok: true })
  })

  it('removePlayerFromGroup: DELETE /group/:groupId/player/:playerId', async () => {
    axios.delete.mockResolvedValue({ data: { ok: true } })
    const token = 'tkn'
    const res = await groupService.removePlayerFromGroup(1, 2, token)
    expect(axios.delete).toHaveBeenCalledWith(`${BASE}/group/1/player/2`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    expect(res).toEqual({ ok: true })
  })

  it('deleteGroup: DELETE /group/:groupId', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: true } })
    const token = 'tkn'
    const res = await groupService.deleteGroup(8, token)
    expect(axios.delete).toHaveBeenCalledWith(`${BASE}/group/8`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    expect(res).toEqual({ deleted: true })
  })

  it('reassignGroups: POST /group/tournament/:tournamentId/reassign', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } })
    const token = 'tkn'
    const res = await groupService.reassignGroups(12, 4, [1, 2, 3], token)
    expect(axios.post).toHaveBeenCalledWith(
      `${BASE}/group/tournament/12/reassign`,
      { tournamentId: 12, numberOfGroups: 4, playerIds: [1, 2, 3] },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    expect(res).toEqual({ ok: 1 })
  })
})

