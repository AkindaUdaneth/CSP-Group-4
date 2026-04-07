import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}))

vi.mock('../components/Footer', () => ({
  default: () => <div>Footer</div>,
}))

import LandingPage from './LandingPage'

describe('LandingPage', () => {
  it('shows fallback practice schedule when backend fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    render(<LandingPage />)

    expect(screen.getByText(/Welcome to SLIIT Tennis/i)).toBeInTheDocument()
    expect(screen.getByText(/Weekly Practice Times/i)).toBeInTheDocument()

    // fallback should include these days
    expect(await screen.findByText('Wednesday')).toBeInTheDocument()
    expect(screen.getAllByText(/Team Practice \(Fallback\)/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Friday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()

    expect(screen.getByText('Navbar')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})

