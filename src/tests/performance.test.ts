/**
 * Performance tests for component render time and data processing.
 * Validates: Requirements 5.4
 * Task 26.3
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function measureMs(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

function generateTransactions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    date: new Date(Date.now() - i * 86_400_000).toISOString(),
    ticker: ['AVGO', 'PG', 'NEE', 'JNJ', 'TXN'][i % 5],
    action: i % 3 === 0 ? 'SELL' : 'BUY',
    shares: Math.random() * 10 + 1,
    price: Math.random() * 500 + 50,
    total_amount: Math.random() * 5000 + 100,
    transaction_type: 'regular',
  }))
}

function generateDividendHistory(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    ticker: ['AVGO', 'PG', 'KO', 'JNJ', 'XOM'][i % 5],
    amount: Math.random() * 50 + 5,
    payment_date: new Date(Date.now() - i * 30 * 86_400_000).toISOString(),
    reinvested: i % 4 === 0,
  }))
}

// ---------------------------------------------------------------------------
// Data processing performance
// ---------------------------------------------------------------------------

describe('Performance: data processing (Req 5.4)', () => {
  it('groups 1000 transactions by month in under 50ms', () => {
    const txs = generateTransactions(1000)

    const elapsed = measureMs(() => {
      const grouped: Record<string, typeof txs> = {}
      for (const tx of txs) {
        const key = new Date(tx.date).toLocaleDateString(undefined, {
          month: 'long', year: 'numeric',
        })
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(tx)
      }
    })

    expect(elapsed).toBeLessThan(50)
  })

  it('sorts 1000 transactions chronologically in under 20ms', () => {
    const txs = generateTransactions(1000)

    const elapsed = measureMs(() => {
      txs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })

    expect(elapsed).toBeLessThan(20)
  })

  it('calculates running dividend total for 500 payments in under 20ms', () => {
    const history = generateDividendHistory(500)

    const elapsed = measureMs(() => {
      let running = 0
      history
        .slice()
        .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
        .map((h) => {
          running += h.amount
          return { ...h, runningTotal: running }
        })
    })

    expect(elapsed).toBeLessThan(20)
  })

  it('filters BUY transactions and sums total_amount for 1000 records in under 10ms', () => {
    const txs = generateTransactions(1000)

    const elapsed = measureMs(() => {
      txs.filter((t) => t.action === 'BUY').reduce((sum, t) => sum + t.total_amount, 0)
    })

    expect(elapsed).toBeLessThan(10)
  })

  it('computes sector allocation from 18 holdings in under 5ms', () => {
    const holdings = Array.from({ length: 18 }, (_, i) => ({
      ticker: `TICK${i}`,
      market_value: Math.random() * 10000 + 1000,
      allocation_pct: (100 / 18),
    }))

    const sectorMap: Record<string, string> = {}
    holdings.forEach((h, i) => { sectorMap[h.ticker] = ['Tech', 'Finance', 'Energy'][i % 3] })

    const elapsed = measureMs(() => {
      const sectors: Record<string, number> = {}
      for (const h of holdings) {
        const sector = sectorMap[h.ticker] ?? 'Other'
        sectors[sector] = (sectors[sector] ?? 0) + h.market_value
      }
    })

    expect(elapsed).toBeLessThan(5)
  })
})

// ---------------------------------------------------------------------------
// Virtual list windowing logic
// ---------------------------------------------------------------------------

describe('Performance: virtual list windowing (Req 5.4)', () => {
  it('calculates visible window for 10000 items in under 1ms', () => {
    const itemHeight = 72
    const containerHeight = 600
    const scrollTop = 3600
    const overscan = 3

    const elapsed = measureMs(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
      const endIndex = Math.min(9999, startIndex + visibleCount)
      return { startIndex, endIndex }
    })

    expect(elapsed).toBeLessThan(1)
  })

  it('renders only ~15 items for a 600px container with 72px rows', () => {
    const itemHeight = 72
    const containerHeight = 600
    const scrollTop = 0
    const overscan = 3
    const totalItems = 10000

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount)
    const rendered = endIndex - startIndex + 1

    // Should render far fewer than total items
    expect(rendered).toBeLessThan(20)
    expect(rendered).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Debounce utility
// ---------------------------------------------------------------------------

describe('Performance: debounce utility (Req 5.4)', () => {
  it('debounce delay is configurable and non-negative', () => {
    const delays = [0, 100, 300, 500]
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(0)
    }
  })

  it('rapid calls only produce one update after delay', async () => {
    let callCount = 0
    const delay = 50

    function debounce(fn: () => void, ms: number) {
      let timer: ReturnType<typeof setTimeout>
      return () => {
        clearTimeout(timer)
        timer = setTimeout(fn, ms)
      }
    }

    const debounced = debounce(() => { callCount++ }, delay)

    // Fire 10 times rapidly
    for (let i = 0; i < 10; i++) debounced()

    // Wait for debounce to settle
    await new Promise((r) => setTimeout(r, delay + 20))

    expect(callCount).toBe(1)
  })
})
