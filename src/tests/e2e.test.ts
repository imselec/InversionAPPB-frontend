/**
 * End-to-end tests for critical user flows.
 * Validates: Requirements 2.1, 3.1, 4.1, 14.1, 15.1
 * Task 25.2
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { portfolioService } from '@/services/portfolioService'
import { recommendationService } from '@/services/recommendationService'
import { dividendService } from '@/services/dividendService'
import { alertService } from '@/services/alertService'
import { watchlistService } from '@/services/watchlistService'

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockHoldings = [
  {
    ticker: 'AVGO', shares: 10, avg_price: 800, current_price: 900,
    market_value: 9000, cost_basis: 8000, gain_loss: 1000, gain_loss_pct: 12.5, allocation_pct: 60,
  },
  {
    ticker: 'PG', shares: 20, avg_price: 140, current_price: 145,
    market_value: 2900, cost_basis: 2800, gain_loss: 100, gain_loss_pct: 3.6, allocation_pct: 40,
  },
]

const mockDashboard = {
  total_value: 11900,
  total_invested: 10800,
  total_gain_loss: 1100,
  total_gain_loss_pct: 10.2,
  positions: mockHoldings,
  last_updated: new Date().toISOString(),
}

const mockRecommendationRun = {
  id: 42,
  executed_at: new Date().toISOString(),
  budget: 300,
  total_allocated: 290,
  portfolio_value: 11900,
  recommendations: [
    {
      ticker: 'PG', action: 'BUY', shares: 2, price: 145,
      total_cost: 290, score: 8.5, reasoning: 'Undervalued dividend stock', priority: 1,
    },
  ],
}

const mockDividendSummary = {
  monthly_total: 85,
  yearly_total: 980,
  by_month: { '2025-01': 85, '2024-12': 80 },
}

const mockAlerts = [
  {
    id: 1, user_id: 1, alert_type: 'price' as const, ticker: 'AVGO',
    target_price: 1000, enabled: true, last_triggered: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

const mockWatchlistItem = {
  ticker: 'MSFT', added_at: new Date().toISOString(), notes: null,
  target_price: null, current_price: 420, dividend_yield: 0.8,
  pe_ratio: 35, market_cap: 3_100_000_000_000, score: 78, meets_criteria: true,
}

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer(
  // Portfolio
  http.get('*/portfolio/dashboard', () => HttpResponse.json(mockDashboard)),
  http.get('*/portfolio/snapshot', () =>
    HttpResponse.json({ positions: mockHoldings, total_value: 11900 })),
  http.get('*/portfolio/allocation', () =>
    HttpResponse.json(
      mockHoldings.map((h) => ({ ticker: h.ticker, allocation_pct: h.allocation_pct })),
    )),

  // Recommendations
  http.post('*/recommendations/generate', () => HttpResponse.json(mockRecommendationRun)),
  http.get('*/recommendations/latest', () => HttpResponse.json(mockRecommendationRun)),

  // Dividends
  http.get('*/dividends/summary', () => HttpResponse.json(mockDividendSummary)),
  http.get('*/dividends/by-ticker', () =>
    HttpResponse.json([
      { ticker: 'AVGO', yield_pct: 1.5, annual_amount: 54, last_payment_date: '2025-01-15', last_payment_amount: 13.5 },
      { ticker: 'PG', yield_pct: 2.5, annual_amount: 72.5, last_payment_date: '2025-01-20', last_payment_amount: 18.1 },
    ])),
  http.get('*/dividends/history', () => HttpResponse.json([])),

  // Alerts — alertService.getAlerts() uses get<Alert[]>, returns raw response
  http.get('*/alerts', () => HttpResponse.json(mockAlerts)),
  http.post('*/alerts', () => HttpResponse.json(mockAlerts[0])),
  http.put('*/alerts/:id/toggle', () =>
    HttpResponse.json({ ...mockAlerts[0], enabled: false })),
  // alertService.getHistory() uses get<NotificationHistory[]>, return array
  http.get('*/alerts/history', () => HttpResponse.json([])),

  // Watchlist
  http.get('*/watchlist', () => HttpResponse.json([mockWatchlistItem])),
  http.post('*/watchlist', () => HttpResponse.json(mockWatchlistItem)),
  http.delete('*/watchlist/:ticker', () =>
    HttpResponse.json({ message: 'MSFT removed from watchlist', ticker: 'MSFT' })),
  http.get('*/watchlist/prioritized', () => HttpResponse.json([mockWatchlistItem])),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Flow 1: Complete investment recommendation flow
// View portfolio → generate recommendations → see results
// Requirements: 2.1, 3.1
// ---------------------------------------------------------------------------

describe('E2E: Complete investment recommendation flow', () => {
  it('fetches portfolio dashboard as starting point', async () => {
    const dashboard = await portfolioService.getDashboard()
    expect(dashboard.total_value).toBe(11900)
    expect(dashboard.holdings).toHaveLength(2)
    expect(dashboard.holdings[0].ticker).toBe('AVGO')
  })

  it('generates recommendations with a budget after viewing portfolio', async () => {
    // Step 1: view portfolio
    const dashboard = await portfolioService.getDashboard()
    expect(dashboard.total_value).toBeGreaterThan(0)

    // Step 2: generate recommendations using portfolio value as context
    const run = await recommendationService.generate(300)
    expect(run.budget).toBe(300)
    expect(run.total_allocated).toBeLessThanOrEqual(run.budget)
    expect(run.recommendations).toHaveLength(1)
    expect(run.recommendations[0].ticker).toBe('PG')
  })

  it('retrieves latest recommendation run after generation', async () => {
    // Generate first
    await recommendationService.generate(300)

    // Then fetch latest
    const latest = await recommendationService.getLatest()
    expect(latest.id).toBe(42)
    expect(latest.recommendations).toHaveLength(1)
    expect(latest.recommendations[0].action).toBe('BUY')
  })

  it('recommendation total_allocated does not exceed budget', async () => {
    const run = await recommendationService.generate(300)
    const sumCost = run.recommendations.reduce((acc, r) => acc + r.total_cost, 0)
    expect(sumCost).toBeLessThanOrEqual(run.budget)
  })

  it('each recommendation has required fields for display', async () => {
    const run = await recommendationService.generate(300)
    for (const rec of run.recommendations) {
      expect(rec.ticker).toBeTruthy()
      expect(rec.shares).toBeGreaterThan(0)
      expect(rec.price).toBeGreaterThan(0)
      expect(rec.total_cost).toBeGreaterThan(0)
      expect(rec.reasoning).toBeTruthy()
      expect(rec.priority).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Flow 2: Portfolio viewing and refresh flow
// Requirements: 1.1, 1.2
// ---------------------------------------------------------------------------

describe('E2E: Portfolio viewing and refresh flow', () => {
  it('loads portfolio snapshot with holdings', async () => {
    const snapshot = await portfolioService.getSnapshot()
    expect(snapshot.holdings).toHaveLength(2)
    expect(snapshot.holdings[0].ticker).toBe('AVGO')
    expect(snapshot.holdings[0].current_price).toBe(900)
  })

  it('loads portfolio dashboard with gain/loss summary', async () => {
    const dashboard = await portfolioService.getDashboard()
    expect(dashboard.total_value).toBe(11900)
    expect(dashboard.total_gain_loss).toBe(1100)
    expect(typeof dashboard.total_gain_loss_pct).toBe('number')
  })

  it('loads allocation data for each holding', async () => {
    const allocation = await portfolioService.getAllocation()
    expect(Array.isArray(allocation)).toBe(true)
    expect(allocation).toHaveLength(2)
    for (const item of allocation) {
      expect(item.ticker).toBeTruthy()
      expect(typeof item.allocation_pct).toBe('number')
    }
  })

  it('refreshes portfolio data on second call', async () => {
    // Simulate a refresh by calling twice
    const first = await portfolioService.getDashboard()
    const second = await portfolioService.getDashboard()
    expect(first.total_value).toBe(second.total_value)
    expect(first.holdings).toHaveLength(second.holdings.length)
  })

  it('portfolio holdings have all required display fields', async () => {
    const snapshot = await portfolioService.getSnapshot()
    for (const h of snapshot.holdings) {
      expect(h.ticker).toBeTruthy()
      expect(h.shares).toBeGreaterThan(0)
      expect(h.current_price).toBeGreaterThan(0)
      expect(h.market_value).toBeGreaterThan(0)
      expect(h.allocation_pct).toBeGreaterThanOrEqual(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Flow 3: Dividend tracking flow
// Requirements: 4.1
// ---------------------------------------------------------------------------

describe('E2E: Dividend tracking flow', () => {
  it('loads dividend summary with monthly and yearly totals', async () => {
    const summary = await dividendService.getSummary()
    expect(summary.monthly_total).toBe(85)
    expect(summary.yearly_total).toBe(980)
    expect(summary.by_month).toBeDefined()
  })

  it('yearly total is greater than or equal to monthly total', async () => {
    const summary = await dividendService.getSummary()
    expect(summary.yearly_total).toBeGreaterThanOrEqual(summary.monthly_total)
  })

  it('loads per-ticker dividend data', async () => {
    const byTicker = await dividendService.getByTicker()
    expect(Array.isArray(byTicker)).toBe(true)
    expect(byTicker).toHaveLength(2)
    for (const item of byTicker) {
      expect(item.ticker).toBeTruthy()
      expect(typeof item.yield_pct).toBe('number')
      expect(typeof item.annual_amount).toBe('number')
    }
  })

  it('loads dividend history (may be empty)', async () => {
    const history = await dividendService.getHistory()
    expect(Array.isArray(history)).toBe(true)
  })

  it('by_month map contains expected month keys', async () => {
    const summary = await dividendService.getSummary()
    const months = Object.keys(summary.by_month)
    expect(months.length).toBeGreaterThan(0)
    // Each key should look like YYYY-MM
    for (const m of months) {
      expect(m).toMatch(/^\d{4}-\d{2}$/)
    }
  })
})

// ---------------------------------------------------------------------------
// Flow 4: Alert configuration and notification flow
// Requirements: 14.1
// ---------------------------------------------------------------------------

describe('E2E: Alert configuration and notification flow', () => {
  it('retrieves existing alerts', async () => {
    const alerts = await alertService.getAlerts()
    expect(Array.isArray(alerts)).toBe(true)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].alert_type).toBe('price')
    expect(alerts[0].ticker).toBe('AVGO')
  })

  it('creates a new price alert', async () => {
    const alert = await alertService.createAlert({
      alert_type: 'price', ticker: 'AVGO', target_price: 1000, enabled: true,
    })
    expect(alert.id).toBe(1)
    expect(alert.ticker).toBe('AVGO')
    expect(alert.enabled).toBe(true)
  })

  it('toggles an alert off', async () => {
    const toggled = await alertService.toggleAlert(1)
    expect(toggled.enabled).toBe(false)
  })

  it('retrieves notification history', async () => {
    const history = await alertService.getHistory()
    expect(Array.isArray(history)).toBe(true)
  })

  it('full alert lifecycle: create → list → toggle', async () => {
    // Create
    const created = await alertService.createAlert({
      alert_type: 'price', ticker: 'AVGO', target_price: 1000, enabled: true,
    })
    expect(created.id).toBeDefined()

    // List
    const alerts = await alertService.getAlerts()
    expect(alerts.length).toBeGreaterThan(0)

    // Toggle
    const toggled = await alertService.toggleAlert(created.id)
    expect(toggled.enabled).toBe(false)
  })

  it('created alert has all required fields', async () => {
    const alert = await alertService.createAlert({
      alert_type: 'price', ticker: 'AVGO', target_price: 1000, enabled: true,
    })
    expect(alert.id).toBeDefined()
    expect(alert.alert_type).toBe('price')
    expect(alert.ticker).toBe('AVGO')
    expect(alert.target_price).toBe(1000)
    expect(typeof alert.enabled).toBe('boolean')
    expect(alert.created_at).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Flow 5: Watchlist management flow
// Requirements: 15.1
// ---------------------------------------------------------------------------

describe('E2E: Watchlist management flow', () => {
  it('retrieves current watchlist', async () => {
    const items = await watchlistService.getWatchlist()
    expect(Array.isArray(items)).toBe(true)
    expect(items).toHaveLength(1)
    expect(items[0].ticker).toBe('MSFT')
  })

  it('adds a ticker to the watchlist', async () => {
    const item = await watchlistService.addTicker('MSFT')
    expect(item.ticker).toBe('MSFT')
    expect(item.current_price).toBeGreaterThan(0)
    expect(typeof item.dividend_yield).toBe('number')
    expect(typeof item.pe_ratio).toBe('number')
  })

  it('removes a ticker from the watchlist', async () => {
    // removeTicker returns void/undefined on success (DELETE returns no body parsed)
    await expect(watchlistService.removeTicker('MSFT')).resolves.toBeDefined()
  })

  it('retrieves prioritized watchlist', async () => {
    const items = await watchlistService.getPrioritized()
    expect(Array.isArray(items)).toBe(true)
    expect(items[0].ticker).toBe('MSFT')
  })

  it('watchlist item has all required display fields', async () => {
    const items = await watchlistService.getWatchlist()
    for (const item of items) {
      expect(item.ticker).toBeTruthy()
      expect(item.added_at).toBeTruthy()
      expect(typeof item.current_price).toBe('number')
      expect(typeof item.dividend_yield).toBe('number')
      expect(typeof item.pe_ratio).toBe('number')
      expect(typeof item.score).toBe('number')
      expect(typeof item.meets_criteria).toBe('boolean')
    }
  })

  it('full watchlist lifecycle: add → list → remove', async () => {
    // Add
    const added = await watchlistService.addTicker('MSFT')
    expect(added.ticker).toBe('MSFT')

    // List
    const list = await watchlistService.getWatchlist()
    expect(list.length).toBeGreaterThan(0)

    // Remove
    await expect(watchlistService.removeTicker('MSFT')).resolves.toBeDefined()
  })
})
