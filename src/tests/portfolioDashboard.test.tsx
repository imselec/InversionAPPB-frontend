/**
 * Unit tests for PortfolioDashboard component.
 * Validates: Requirements 2.1, 2.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PortfolioDashboard } from '@/components/PortfolioDashboard'
import * as portfolioService from '@/services/portfolioService'
import * as marketService from '@/services/marketService'

function wrapper(children: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockDashboard = {
  total_value: 3196.44,
  total_cost_basis: 2800.00,
  total_gain_loss: 396.44,
  total_gain_loss_pct: 14.16,
  holdings: [
    {
      ticker: 'AVGO', shares: 1.3792, avg_price: 650, current_price: 900,
      market_value: 1241.28, cost_basis: 896.48, gain_loss: 344.80,
      gain_loss_pct: 38.46, allocation_pct: 38.83,
    },
    {
      ticker: 'PG', shares: 2.0, avg_price: 140, current_price: 145,
      market_value: 290, cost_basis: 280, gain_loss: 10,
      gain_loss_pct: 3.57, allocation_pct: 9.07,
    },
  ],
  last_updated: new Date().toISOString(),
}

describe('PortfolioDashboard', () => {
  beforeEach(() => {
    vi.spyOn(portfolioService.portfolioService, 'getDashboard').mockResolvedValue(mockDashboard)
    vi.spyOn(marketService.marketService, 'getStatus').mockResolvedValue({
      is_open: false,
      next_open: '',
      next_close: '',
    })
  })

  it('displays total portfolio value', async () => {
    render(wrapper(<PortfolioDashboard />))
    await waitFor(() => {
      expect(screen.getByText(/\$3,196\.44/)).toBeInTheDocument()
    })
  })

  it('displays all holdings', async () => {
    render(wrapper(<PortfolioDashboard />))
    await waitFor(() => {
      expect(screen.getByText('AVGO')).toBeInTheDocument()
      expect(screen.getByText('PG')).toBeInTheDocument()
    })
  })

  it('shows gain/loss percentage for each holding', async () => {
    render(wrapper(<PortfolioDashboard />))
    await waitFor(() => {
      expect(screen.getByText(/\+38\.46%/)).toBeInTheDocument()
    })
  })

  it('shows loading spinner while fetching', () => {
    vi.spyOn(portfolioService.portfolioService, 'getDashboard').mockReturnValue(
      new Promise(() => {}), // never resolves
    )
    render(wrapper(<PortfolioDashboard />))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message on fetch failure', async () => {
    vi.spyOn(portfolioService.portfolioService, 'getDashboard').mockRejectedValue(
      new Error('Network error'),
    )
    render(wrapper(<PortfolioDashboard />))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows market closed indicator when market is closed', async () => {
    render(wrapper(<PortfolioDashboard />))
    await waitFor(() => {
      expect(screen.getByText(/Mercado cerrado/)).toBeInTheDocument()
    })
  })
})
