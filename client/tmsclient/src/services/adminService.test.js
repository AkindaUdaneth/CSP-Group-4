import { describe, it, expect, beforeEach } from 'vitest'
import { adminService } from './adminService'
import { API_ENDPOINTS } from '../config/api'
import { mockFetchOnce, resetStorage } from '../test-utils/mockApi'

describe('adminService', () => {
  beforeEach(() => resetStorage())

  it('getPendingRegistrations: includes bearer token and returns json on success', async () => {
    localStorage.setItem('token', 'admin-token')
    const data = [{ id: 1, username: 'u' }]
    mockFetchOnce({ ok: true, json: data })

    const res = await adminService.getPendingRegistrations()

    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/pending-registrations`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
    })
    expect(res).toEqual(data)
  })

  it('getPendingRegistrations: throws server message on failure', async () => {
    localStorage.setItem('token', 'admin-token')
    mockFetchOnce({ ok: false, status: 500, json: { message: 'Boom' } })

    await expect(adminService.getPendingRegistrations()).rejects.toThrow('Boom')
  })

  it('approveRegistration: posts to correct endpoint with bearer token', async () => {
    localStorage.setItem('token', 'admin-token')
    const data = { message: 'approved' }
    mockFetchOnce({ ok: true, json: data })

    const res = await adminService.approveRegistration(42)
    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/approve-registration/42`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
    })
    expect(res).toEqual(data)
  })

  it('rejectRegistration: sends reason in body and returns json on success', async () => {
    localStorage.setItem('token', 'admin-token')
    const data = { message: 'rejected' }
    mockFetchOnce({ ok: true, json: data })

    const res = await adminService.rejectRegistration(7, 'not valid')
    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/reject-registration/7`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'not valid' }),
    })
    expect(res).toEqual(data)
  })
})

