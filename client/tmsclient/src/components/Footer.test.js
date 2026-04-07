import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders expected copyright and team credits', () => {
    render(<Footer />)

    expect(
      screen.getByText(/SLIIT Tennis Management System/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/CSP Group 04/i)).toBeInTheDocument()
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })
})

