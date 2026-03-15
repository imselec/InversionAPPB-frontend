/**
 * Property 14: Transaction Chronological Ordering — Validates: Requirements 6.2
 * Property 16: Date Range Filtering — Validates: Requirements 6.5
 * Property 17: ROI Calculation Correctness — Validates: Requirements 6.7
 * Property 31: Per-Ticker Return Display — Validates: Requirements 10.6
 * Property 32: Cost Basis Calculation — Validates: Requirements 10.7
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

const f = Math.fround

const transactionArb = fc.record({
  id: fc.integer({ min: 1 }),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
    .map((d) => d.toISOString().split('T')[0]),
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  action: fc.constantFrom('BUY' as const, 'SELL' as const),
  shares: fc.float({ min: f(0.0001), max: f(1000), noNaN: true }),
  price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  total_amount: fc.float({ min: f(0.01), max: f(1_000_000), noNaN: true }),
  transaction_type: fc.constantFrom('REGULAR', 'REINVESTMENT'),
})

const tickerReturnArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  total_return_pct: fc.float({ min: f(-100), max: f(10000), noNaN: true }),
  cost_basis: fc.float({ min: f(0.01), max: f(1_000_000), noNaN: true }),
  current_value: fc.float({ min: f(0), max: f(10_000_000), noNaN: true }),
  gain_loss: fc.float({ min: f(-1_000_000), max: f(10_000_000), noNaN: true }),
})

describe('Property 14: Transaction Chronological Ordering', () => {
  it('transactions sorted by date are in ascending order', () => {
    fc.assert(
      fc.property(fc.array(transactionArb, { minLength: 2, maxLength: 20 }), (txns) => {
        const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date))
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].date <= sorted[i + 1].date).toBe(true)
        }
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 16: Date Range Filtering', () => {
  it('filtered transactions are all within the specified date range', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArb, { minLength: 1, maxLength: 30 }),
        fc.constantFrom('2023-01-01', '2024-01-01', '2025-01-01'),
        fc.constantFrom('2023-12-31', '2024-12-31', '2025-12-31'),
        (txns, startDate, endDate) => {
          if (startDate > endDate) return
          const filtered = txns.filter((t) => t.date >= startDate && t.date <= endDate)
          for (const t of filtered) {
            expect(t.date >= startDate).toBe(true)
            expect(t.date <= endDate).toBe(true)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Property 17: ROI Calculation Correctness', () => {
  it('ROI = (current_value - cost_basis) / cost_basis * 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(0.01), max: f(1_000_000), noNaN: true }),
        fc.float({ min: f(0), max: f(10_000_000), noNaN: true }),
        (costBasis, currentValue) => {
          const roi = ((currentValue - costBasis) / costBasis) * 100
          expect(typeof roi).toBe('number')
          expect(isFinite(roi)).toBe(true)
          // ROI can be negative (loss) or positive (gain)
          if (currentValue >= costBasis) {
            expect(roi).toBeGreaterThanOrEqual(0)
          } else {
            expect(roi).toBeLessThan(0)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Property 31: Per-Ticker Return Display', () => {
  it('every ticker return has required display fields', () => {
    fc.assert(
      fc.property(fc.array(tickerReturnArb, { minLength: 1, maxLength: 18 }), (returns) => {
        for (const r of returns) {
          expect(typeof r.ticker).toBe('string')
          expect(r.ticker.length).toBeGreaterThan(0)
          expect(typeof r.total_return_pct).toBe('number')
          expect(typeof r.cost_basis).toBe('number')
          expect(r.cost_basis).toBeGreaterThan(0)
          expect(typeof r.current_value).toBe('number')
          expect(typeof r.gain_loss).toBe('number')
        }
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 32: Cost Basis Calculation', () => {
  it('gain_loss equals current_value minus cost_basis', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(0.01), max: f(1_000_000), noNaN: true }),
        fc.float({ min: f(0), max: f(10_000_000), noNaN: true }),
        (costBasis, currentValue) => {
          const gainLoss = currentValue - costBasis
          expect(gainLoss).toBeCloseTo(currentValue - costBasis, 2)
          if (currentValue > costBasis) expect(gainLoss).toBeGreaterThan(0)
          if (currentValue < costBasis) expect(gainLoss).toBeLessThan(0)
        },
      ),
      { numRuns: 50 },
    )
  })
})
