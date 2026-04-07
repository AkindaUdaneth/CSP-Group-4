import { vi } from 'vitest'

export function mockFetchOnce({ ok = true, status = 200, json = {} } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => json,
  })
}

export function mockFetchJson(fn) {
  global.fetch = vi.fn().mockImplementation(fn)
}

export function resetStorage() {
  localStorage.clear()
  sessionStorage.clear()
}

