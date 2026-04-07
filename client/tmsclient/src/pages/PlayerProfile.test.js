import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

import PlayerProfile from './PlayerProfile'

const API_BASE = '/api'
const PROFILE_URL = `${API_BASE}/auth/me`

describe('PlayerProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authMock = {
      token: 'token-1',
      user: {
        username: 'bob',
        email: 'bob@example.com',
        identityNumber: 'NIC',
        contactNumber: '+94770000000',
        address: 'Colombo',
      },
      updateUser: vi.fn(),
    }
  })

  it('loads profile, validates, and updates via PUT', async () => {
    const user = userEvent.setup()

    const getUser = {
      username: 'bob',
      email: 'bob@example.com',
      identityNumber: 'NIC',
      contactNumber: '+94770000000',
      address: 'Colombo',
    }

    const putResponse = {
      ok: true,
      json: async () => ({
        message: 'Profile updated successfully.',
        user: {
          ...getUser,
          email: 'new@example.com',
          contactNumber: '+94770000111',
          address: 'Kandy',
        },
      }),
    }

    vi.spyOn(global, 'fetch').mockImplementation((url, options = {}) => {
      if (url === PROFILE_URL && (!options.method || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: getUser }),
        })
      }

      if (url === PROFILE_URL && options.method === 'PUT') {
        // sanity check Authorization header
        expect(options.headers.Authorization).toBe('Bearer token-1')
        expect(JSON.parse(options.body).email).toBe('new@example.com')
        return Promise.resolve(putResponse)
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ message: 'Unexpected call' }),
      })
    })

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<PlayerProfile />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Loading
    expect(screen.getByText(/Loading profile details/i)).toBeInTheDocument()

    // Loaded
    await screen.findByDisplayValue('bob')

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    expect(saveButton).toBeDisabled()

    // Make it dirty by changing email to an invalid value -> save enabled but validation fails
    const emailInput = screen.getByLabelText('Email')
    await user.clear(emailInput)
    await user.type(emailInput, 'not-an-email')

    await waitFor(() => expect(saveButton).not.toBeDisabled())

    await user.click(saveButton)
    expect(
      await screen.findByText(/Please fix the highlighted fields and try again/i)
    ).toBeInTheDocument()

    // Correct value and submit succeeds
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    const contactInput = screen.getByLabelText(/Contact Number/i)
    await user.clear(contactInput)
    await user.type(contactInput, '+94770000111')

    const addressInput = screen.getByLabelText('Address')
    await user.clear(addressInput)
    await user.type(addressInput, 'Kandy')

    await user.click(saveButton)

    await waitFor(() => {
      expect(authMock.updateUser).toHaveBeenCalled()
    })
    expect(
      await screen.findByText(/Profile updated successfully/i)
    ).toBeInTheDocument()
  })
})

