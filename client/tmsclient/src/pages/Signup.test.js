import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

import Signup from './Signup'

describe('Signup page', () => {
  beforeEach(() => {
    authMock = {
      signup: vi.fn(),
    }
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<div>Login Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/Username/i), 'alice')
    await user.type(screen.getByPlaceholderText(/Identity Number/i), '123')
    await user.type(screen.getByPlaceholderText(/Email/i), 'a@b.com')
    await user.type(screen.getByPlaceholderText(/^Password$/i), 'pw1')
    await user.type(screen.getByPlaceholderText(/Confirm Password/i), 'pw2')

    await user.click(screen.getByRole('button', { name: /Sign Up/i }))

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument()
  })

  it('navigates to /login on successful signup', async () => {
    authMock.signup.mockResolvedValue({ success: true })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<div>Login Landing</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/Username/i), 'alice')
    await user.type(screen.getByPlaceholderText(/Identity Number/i), '123')
    await user.type(screen.getByPlaceholderText(/Email/i), 'a@b.com')
    await user.type(screen.getByPlaceholderText(/^Password$/i), 'pw')
    await user.type(screen.getByPlaceholderText(/Confirm Password/i), 'pw')

    await user.click(screen.getByRole('button', { name: /Sign Up/i }))

    expect(await screen.findByText('Login Landing')).toBeInTheDocument()
  })
})

