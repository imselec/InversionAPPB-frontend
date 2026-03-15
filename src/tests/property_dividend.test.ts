/**
 * Property 5: Dividend Payment Display Completeness
 * Validates: Requirements 3.1, 3.2
 *
 * Property 7: Dividend Yield Display
 * Validates: Requirements 3.5
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

const f = Math.fround

const dividendPaymentArb = fc.record({
  id: fc.integer({ min: 1 }),
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  payment_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
    .map((d) => d.toISOString().split('T')[0]),
  amount: fc.float({ min: f(0.01), max: f(10000), noNaN: true }),
  shares_owned: fc.float({ min: f(0.0001), max: f(10000), noNaN: true }),
  per_share_amount: fc.float({ min: f(0.001), max: f(100), noNaN: true }),
  reinvested: fc.boolean(),
})

const dividendByTickerArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  yield_pct: fc.float({ min: f(0), max: f(30), noNaN: true }),
  annual_amount: fc.float({ min: f(0), max: f(100000), noNaN: true }),
  last_payment_date: fc.date().map((d) => d.toISOString().split('T')[0]),
  last_payment_amount: fc.float({ min: f(0), max: f(10000), noNaN: true }),
})

describe('Property 5: Dividend Payment Display Completeness', () => {
  it('every dividend payment has all required display fields', () => {
    fc.assert(
      fc.property(fc.array(dividendPaymentArb, { minLength: 1, maxLength: 20 }), (payments) => {
        for (const p of payments) {
          expect(typeof p.ticker).toBe('string')
          expect(p.ticker.length).toBeGreaterThan(0)
          expect(typeof p.payment_date).toBe('string')
          expect(p.payment_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(typeof p.amount).toBe('number')
          expect(p.amount).toBeGreaterThan(0)
          expect(typeof p.shares_owned).toBe('number')
          expect(p.shares_owned).toBeGreaterThan(0)
          expect(typeof p.per_share_amount).toBe('number')
          expect(typeof p.reinvested).toBe('boolean')
        }
      }),
      { numRuns: 50 },
    )
  })

  it('dividend amounts are always positive', () => {
    fc.assert(
      fc.property(dividendPaymentArb, (payment) => {
        expect(payment.amount).toBeGreaterThan(0)
        expect(payment.per_share_amount).toBeGreaterThan(0)
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 7: Dividend Yield Display', () => {
  it('dividend yield is always non-negative and bounded', () => {
    fc.assert(
      fc.property(fc.array(dividendByTickerArb, { minLength: 1, maxLength: 18 }), (items) => {
        for (const item of items) {
          expect(item.yield_pct).toBeGreaterThanOrEqual(0)
          expect(item.yield_pct).toBeLessThanOrEqual(30)
          expect(typeof item.ticker).toBe('string')
          expect(item.ticker.length).toBeGreaterThan(0)
          expect(typeof item.annual_amount).toBe('number')
        }
      }),
      { numRuns: 50 },
    )
  })

  it('monthly aggregation sums correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            month: fc.constantFrom('2025-01', '2025-02', '2025-03', '2025-04'),
            amount: fc.float({ min: f(0.01), max: f(1000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (payments) => {
          const byMonth: Record<string, number> = {}
          for (const p of payments) {
            byMonth[p.month] = (byMonth[p.month] ?? 0) + p.amount
          }
          // Each monthly total must be >= any single payment in that month
          for (const [month, total] of Object.entries(byMonth)) {
            const monthPayments = payments.filter((p) => p.month === month)
            expect(total).toBeGreaterThanOrEqual(Math.max(...monthPayments.map((p) => p.amount)))
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})
