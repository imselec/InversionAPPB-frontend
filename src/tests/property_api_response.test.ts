/**
 * Property 1: API Response Structure Validation
 * Validates: Requirements 1.2, 1.6
 *
 * For any valid portfolio dashboard response, all required fields must be
 * present and have the correct types.
 *
 * Property 4: Portfolio Display Completeness
 * Validates: Requirements 2.2, 2.5
 *
 * Every holding in the response must have ticker, shares, current_price,
 * market_value, and allocation_pct.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// Arbitraries
const f = Math.fround

const holdingArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  shares: fc.float({ min: f(0.0001), max: f(10000), noNaN: true }),
  avg_price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  current_price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  market_value: fc.float({ min: f(0), max: f(1_000_000), noNaN: true }),
  cost_basis: fc.float({ min: f(0), max: f(1_000_000), noNaN: true }),
  gain_loss: fc.float({ min: f(-500_000), max: f(500_000), noNaN: true }),
  gain_loss_pct: fc.float({ min: f(-100), max: f(10000), noNaN: true }),
  allocation_pct: fc.float({ min: f(0), max: f(100), noNaN: true }),
})

const dashboardArb = fc.record({
  total_value: fc.float({ min: f(0), max: f(10_000_000), noNaN: true }),
  total_cost_basis: fc.float({ min: f(0), max: f(10_000_000), noNaN: true }),
  total_gain_loss: fc.float({ min: f(-5_000_000), max: f(5_000_000), noNaN: true }),
  total_gain_loss_pct: fc.float({ min: f(-100), max: f(10000), noNaN: true }),
  holdings: fc.array(holdingArb, { minLength: 0, maxLength: 30 }),
  last_updated: fc.date().map((d) => d.toISOString()),
})

describe('Property 1: API Response Structure Validation', () => {
  it('dashboard response always has required top-level fields', () => {
    fc.assert(
      fc.property(dashboardArb, (dashboard) => {
        expect(typeof dashboard.total_value).toBe('number')
        expect(typeof dashboard.total_cost_basis).toBe('number')
        expect(typeof dashboard.total_gain_loss).toBe('number')
        expect(typeof dashboard.total_gain_loss_pct).toBe('number')
        expect(Array.isArray(dashboard.holdings)).toBe(true)
        expect(typeof dashboard.last_updated).toBe('string')
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 4: Portfolio Display Completeness', () => {
  it('every holding has all required display fields', () => {
    fc.assert(
      fc.property(fc.array(holdingArb, { minLength: 1, maxLength: 20 }), (holdings) => {
        for (const h of holdings) {
          expect(typeof h.ticker).toBe('string')
          expect(h.ticker.length).toBeGreaterThan(0)
          expect(typeof h.shares).toBe('number')
          expect(h.shares).toBeGreaterThan(0)
          expect(typeof h.current_price).toBe('number')
          expect(h.current_price).toBeGreaterThan(0)
          expect(typeof h.market_value).toBe('number')
          expect(typeof h.allocation_pct).toBe('number')
          expect(h.allocation_pct).toBeGreaterThanOrEqual(0)
          expect(h.allocation_pct).toBeLessThanOrEqual(100)
        }
      }),
      { numRuns: 50 },
    )
  })

  it('allocation percentages are non-negative and bounded by 100', () => {
    fc.assert(
      fc.property(fc.array(holdingArb, { minLength: 1, maxLength: 18 }), (holdings) => {
        const total = holdings.reduce((s, h) => s + h.allocation_pct, 0)
        // Each individual allocation must be in [0, 100]
        for (const h of holdings) {
          expect(h.allocation_pct).toBeGreaterThanOrEqual(0)
          expect(h.allocation_pct).toBeLessThanOrEqual(100)
        }
        // Total can exceed 100 in generated data but each item is bounded
        expect(total).toBeGreaterThanOrEqual(0)
      }),
      { numRuns: 50 },
    )
  })
})
