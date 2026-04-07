import { describe, it, expect } from 'vitest'
import { API_ENDPOINTS } from './api.js'

describe('api config', () => {
  it('exposes auth and admin endpoints', () => {
    expect(API_ENDPOINTS.AUTH).toContain('/auth')
    expect(API_ENDPOINTS.ADMIN).toContain('/admin')
  })
})
