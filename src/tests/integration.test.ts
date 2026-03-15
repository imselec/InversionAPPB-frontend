/**
 * Integration tests for frontend-backend communication.
 * Validates: Requirements 1.1, 1.2, 1.3, 14.1, 15.1
 * Task 25.1 & 25.3
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { portfolioService } from '@/services/portfolioService'
import { dividendService } from '@/services/dividendService'
import { recommendationService } from '@/services/recommendationService'
import { alertService } from '@/services/alertService'
import { watchlistService } from '@/services/watchlistService'
import { settingsService } from '@/services/settingsService'
import { analyticsService } from '@/services/analyticsService'

const mockDashboard = {
  total_value: 50000,
  total_cost_basis: 40000,
  total_gain_loss: 10000,
  total_gain_loss_pct: 25.0,
  holdings: [
    { ticker: 'AVGO', shares: 10, avg_price: 800, current_price: 900,
      market_value: 9000, cost_basis: 8000, gain_loss: 1000, gain_loss_pct: 12.5, allocation_pct: 18 },
  ],
  last_updated: new Date().toISOString(),
}

const server = setupServer(
  http.get('*/portfolio/dashboard', () => HttpResponse.json(mockDashboard)),
  http.get('*/portfolio/snapshot', () => HttpResponse.json({ holdings: mockDashboard.holdings })),
  http.get('*/dividends/summary', () =>
    HttpResponse.json({ monthly_total: 120, yearly_total: 1440, by_month: { '2025-01': 120 } })),
  http.post('*/recommendations/generate', () =>
    HttpResponse.json({ id: 1, executed_at: new Date().toISOString(), budget: 300,
      total_allocated: 290, portfolio_value: 50000, recommendations: [] })),
  http.get('*/recommendations/latest', () =>
    HttpResponse.json({ id: 1, executed_at: new Date().toISOString(), budget: 300,
      total_allocated: 290, portfolio_value: 50000, recommendations: [] })),
  http.get('*/alerts', () => HttpResponse.json([])),
  http.post('*/alerts', () =>
    HttpResponse.json({ id: 1, user_id: 1, alert_type: 'price', ticker: 'AVGO',
      target_price: 1000, enabled: true, last_triggered: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString() })),
  http.get('*/watchlist', () => HttpResponse.json([])),
  http.post('*/watchlist', () =>
    HttpResponse.json({ ticker: 'MSFT', added_at: new Date().toISOString(), notes: null,
      target_price: null, current_price: 400, dividend_yield: 0.8, pe_ratio: 35,
      market_cap: 3_000_000_000_000, score: 75, meets_criteria: false })),
  http.get('*/settings/budget', () => HttpResponse.json({ monthly_budget: 300 })),
  http.put('*/settings/budget', () => HttpResponse.json({ monthly_budget: 500 })),
  http.get('*/analytics/performance', () =>
    HttpResponse.json({ total_return_pct: 25, annualized_return_pct: 12,
      portfolio_yield_pct: 3.5, volatility: 0.15, sp500_comparison: 5 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Portfolio data flow (Task 25.1)', () => {
  it('fetches portfolio dashboard with correct structure', async () => {
    const data = await portfolioService.getDashboard()
    expect(data.total_value).toBe(50000)
    expect(data.holdings).toHaveLength(1)
    expect(data.holdings[0].ticker).toBe('AVGO')
  })

  it('fetches portfolio snapshot', async () => {
    const data = await portfolioService.getSnapshot()
    expect(data.holdings).toHaveLength(1)
  })
})

describe('Dividend data flow (Task 25.1)', () => {
  it('fetches dividend summary with monthly and yearly totals', async () => {
    const data = await dividendService.getSummary()
    expect(data.monthly_total).toBe(120)
    expect(data.yearly_total).toBe(1440)
    expect(data.by_month['2025-01']).toBe(120)
  })
})

describe('Recommendation generation flow (Task 25.1)', () => {
  it('generates recommendations with budget constraint', async () => {
    const run = await recommendationService.generate(300)
    expect(run.budget).toBe(300)
    expect(run.total_allocated).toBeLessThanOrEqual(run.budget)
    expect(Array.isArray(run.recommendations)).toBe(true)
  })

  it('fetches latest recommendation run', async () => {
    const run = await recommendationService.getLatest()
    expect(run.id).toBe(1)
    expect(typeof run.executed_at).toBe('string')
  })
})

describe('Alert creation and retrieval flow (Task 25.1)', () => {
  it('retrieves empty alerts list', async () => {
    const alerts = await alertService.getAlerts()
    expect(Array.isArray(alerts)).toBe(true)
  })

  it('creates a price alert successfully', async () => {
    const alert = await alertService.createAlert({
      alert_type: 'price', ticker: 'AVGO', target_price: 1000, enabled: true,
    })
    expect(alert.id).toBe(1)
    expect(alert.ticker).toBe('AVGO')
    expect(alert.alert_type).toBe('price')
  })
})

describe('Watchlist operations flow (Task 25.1)', () => {
  it('retrieves empty watchlist', async () => {
    const items = await watchlistService.getWatchlist()
    expect(Array.isArray(items)).toBe(true)
  })

  it('adds ticker to watchlist', async () => {
    const item = await watchlistService.addTicker('MSFT')
    expect(item.ticker).toBe('MSFT')
    expect(item.current_price).toBeGreaterThan(0)
  })
})

describe('Settings flow (Task 25.1)', () => {
  it('retrieves current budget', async () => {
    const settings = await settingsService.getBudget()
    expect(settings.monthly_budget).toBe(300)
  })

  it('updates budget successfully', async () => {
    const updated = await settingsService.updateBudget(500)
    expect(updated.monthly_budget).toBe(500)
  })
})

describe('Analytics data flow (Task 25.1)', () => {
  it('fetches performance metrics', async () => {
    const metrics = await analyticsService.getPerformance()
    expect(typeof metrics.total_return_pct).toBe('number')
    expect(typeof metrics.annualized_return_pct).toBe('number')
    expect(typeof metrics.portfolio_yield_pct).toBe('number')
  })
})

describe('Error handling scenarios (Task 25.3)', () => {
  it('handles backend unavailable (503)', async () => {
    server.use(
      http.get('*/portfolio/dashboard', () =>
        HttpResponse.json({ detail: 'Service unavailable' }, { status: 503 })),
    )
    await expect(portfolioService.getDashboard()).rejects.toBeDefined()
  })

  it('handles invalid authentication (401)', async () => {
    server.use(
      http.get('*/portfolio/dashboard', () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })),
    )
    await expect(portfolioService.getDashboard()).rejects.toMatchObject({ status: 401 })
  })

  it('handles malformed API response gracefully', async () => {
    server.use(
      http.get('*/dividends/summary', () =>
        HttpResponse.json({ unexpected_field: true })),
    )
    // Service returns whatever the API sends — consumer handles missing fields
    const data = await dividendService.getSummary()
    expect(data).toBeDefined()
  })
})
