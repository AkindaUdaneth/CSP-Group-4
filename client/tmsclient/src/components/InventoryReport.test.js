import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import InventoryReport from './InventoryReport'

describe('InventoryReport', () => {
  it('renders computed stats, category chips, and lists; Print triggers window.open and print', async () => {
    const onClose = vi.fn()

    const printWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(printWindow)

    const inventory = [
      {
        id: 1,
        name: 'Racket',
        category: 'Sports',
        condition: 'Good',
        quantity: 2,
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-02T00:00:00Z',
      },
      {
        id: 2,
        name: 'Ball',
        category: 'Sports',
        condition: 'Good',
        quantity: 0,
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
      {
        id: 11,
        inventoryItemId: 1,
        issuedToUserId: 'user-1',
        quantityChanged: -1,
        comment: 'Issued asset',
        timestamp: '2026-04-03T00:00:00Z',
      },
    ]

    const returnedLogs = [
      {
        id: 20,
        inventoryItemId: 1,
        quantityChanged: 1,
        comment: 'Returned asset',
        timestamp: '2026-04-04T00:00:00Z',
      },
    ]

    render(
      <InventoryReport
        inventory={inventory}
        transactions={transactions}
        returnedLogs={returnedLogs}
        isAdmin={true}
        onClose={onClose}
      />
    )

    // Overview / stats
    expect(screen.getByText('Inventory Items')).toBeInTheDocument()
    const inventoryStat = screen.getByText('Inventory Items').closest('.ir-stat')
    expect(inventoryStat.querySelector('.ir-stat-num').textContent).toBe('2')

    expect(screen.getByText('Units in Stock')).toBeInTheDocument()
    const stockStat = screen.getByText('Units in Stock').closest('.ir-stat')
    expect(stockStat.querySelector('.ir-stat-num').textContent).toBe('2')

    // Category snapshot
    const sportsEls = screen.getAllByText('Sports')
    expect(sportsEls.length).toBeGreaterThan(0)

    // Pending/Active/Returned lists
    expect(screen.getByText('Pending Requests')).toBeInTheDocument()
    expect(screen.getByText('Request')).toBeInTheDocument()
    expect(screen.getByText('Active Issued Assets')).toBeInTheDocument()
    expect(screen.getByText('Issued asset')).toBeInTheDocument()
    expect(screen.getByText('Returned History')).toBeInTheDocument()
    expect(screen.getByText('Returned asset')).toBeInTheDocument()

    // Buttons
    screen.getByRole('button', { name: /Print Report/i }).click()
    expect(window.open).toHaveBeenCalled()

    // The print call is scheduled after 250ms
    await new Promise((r) => setTimeout(r, 300))
    expect(printWindow.print).toHaveBeenCalled()

    screen.getByRole('button', { name: /Close/i }).click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

