import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../test-utils/testUtils'
import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders logo text and a Login link', () => {
    renderWithRouter(<Navbar />)

    expect(screen.getByRole('img', { name: /SLIIT Logo/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Sri Lanka Institute of Information Technology/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/SLIIT Tennis/i)).toBeInTheDocument()

    const loginLink = screen.getByRole('link', { name: 'Login' })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.getAttribute('href')).toBe('/login')
  })
})

