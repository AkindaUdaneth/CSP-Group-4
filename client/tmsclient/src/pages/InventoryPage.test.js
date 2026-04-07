import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let authMock = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMock,
}))

vi.mock('../components/InventoryReport', () => ({
  default: ({ onClose }) => (
    <div>
      <div>InventoryReport</div>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

const axiosGet = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: vi.fn((...args) => axiosGet(...args)),
  },
}))

import axios from 'axios'
import InventoryPage from './InventoryPage'

const API_BASE = '/api'

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    authMock = { token: 'token-1' }
  })

  it('fetches inventory data and toggles report overlay', async () => {
    const inventory = [
      {
        id: 1,
        name: 'Racket',
        category: 'Sports',
        condition: 'Good',
        quantity: 5,
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-02T00:00:00Z',
      },
    ]

    const transactions = [
      {
        id: 10,
        inventoryItemId: 1,
        issuedToUserId: null,
        quantityChanged: 0,
        comment: 'Request',
        timestamp: '2026-04-03T00:00:00Z',
      },
    ]

    const returnedTransactions = [
      {
        id: 20,
        inventoryItemId: 1,
        quantityChanged: 1,
        comment: 'Returned asset',
        timestamp: '2026-04-04T00:00:00Z',
      },
    ]

    axiosGet.mockImplementation((url) => {
      if (url === `${API_BASE}/inventory`) return Promise.resolve({ data: inventory })
      if (url === `${API_BASE}/inventory/transactions`)
        return Promise.resolve({ data: transactions })
      if (url === `${API_BASE}/inventory/returned-transactions`)
        return Promise.resolve({ data: returnedTransactions })
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const user = userEvent.setup()

    render(<InventoryPage isAdmin={true} userId={1} />)

    expect(await screen.findByText('Racket')).toBeInTheDocument()

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`${API_BASE}/inventory`, {
        headers: { Authorization: 'Bearer token-1' },
      })
      expect(axios.get).toHaveBeenCalledWith(`${API_BASE}/inventory/transactions`, {
        headers: { Authorization: 'Bearer token-1' },
      })
      expect(axios.get).toHaveBeenCalledWith(`${API_BASE}/inventory/returned-transactions`, {
        headers: { Authorization: 'Bearer token-1' },
      })
    })

    await user.click(screen.getByRole('button', { name: /Generate Report/i }))
    expect(screen.getByText('InventoryReport')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close/i }))
    await waitFor(() => {
      expect(screen.queryByText('InventoryReport')).not.toBeInTheDocument()
    })
  })
})

