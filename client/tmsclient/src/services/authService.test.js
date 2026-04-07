import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from './authService'
import { API_ENDPOINTS } from '../config/api'
import { mockFetchOnce, resetStorage } from '../test-utils/mockApi'

describe('authService', () => {
  beforeEach(() => resetStorage())

  it('login: posts credentials, stores token/user/role, and returns parsed json', async () => {
    const token = 'token-123'
    const payload = { token, username: 'john', role: 'admin', id: 1 }
    mockFetchOnce({ ok: true, json: payload })

    const res = await authService.login('  john  ', '  pass  ')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john', password: '  pass  ' }),
    })

    expect(localStorage.getItem('token')).toBe(token)
    expect(localStorage.getItem('username')).toBe('john')
    expect(localStorage.getItem('role')).toBe('admin')
    expect(res).toEqual(payload)
  })

  it('login: trims identifier and throws message from server on non-2xx', async () => {
    mockFetchOnce({ ok: false, status: 401, json: { message: 'Login failed' } })

    await expect(authService.login(' jane ', 'x')).rejects.toThrow('Login failed')
    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/login`, expect.anything())
  })

  it('signup: posts signup payload and returns parsed json on success', async () => {
    const payload = { ok: true, id: 9 }
    mockFetchOnce({ ok: true, json: payload })

    const res = await authService.signup('alice', '123', 'a@b.com', 'pw', 'pw')

    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.AUTH}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice',
        identityNumber: '123',
        email: 'a@b.com',
        password: 'pw',
        confirmPassword: 'pw',
      }),
    })
    expect(res).toEqual(payload)
  })

  it('signup: throws server message on non-2xx', async () => {
    mockFetchOnce({ ok: false, status: 400, json: { message: 'Signup failed' } })
    await expect(
      authService.signup('alice', '123', 'a@b.com', 'pw', 'pw')
    ).rejects.toThrow('Signup failed')
  })

  it('logout/getToken/isAuthenticated/getUsername remove and read localStorage keys', () => {
    localStorage.setItem('token', 't')
    localStorage.setItem('username', 'u')

    expect(authService.getToken()).toBe('t')
    expect(authService.getUsername()).toBe('u')
    expect(authService.isAuthenticated()).toBe(true)

    authService.logout()
    expect(localStorage.getItem('token')).toBe(null)
    expect(localStorage.getItem('username')).toBe(null)
    expect(authService.isAuthenticated()).toBe(false)
  })
})

