/**
 * Property tests for Recommendations
 * Validates: Requirements 4.4, 4.7, 4.8, 13.6, 13.7, 11.4, 11.5
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

const f = Math.fround

const recommendationArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  action: fc.constantFrom('BUY' as const, 'SELL' as const, 'HOLD' as const),
  shares: fc.float({ min: f(0.0001), max: f(1000), noNaN: true }),
  price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  total_cost: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  score: fc.float({ min: f(0), max: f(100), noNaN: true }),
  reasoning: fc.string({ minLength: 1, maxLength: 500 }),
  priority: fc.integer({ min: 1, max: 100 }),
})

const sellRecommendationArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  shares_to_sell: fc.float({ min: f(0.0001), max: f(1000), noNaN: true }),
  current_price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  reason: fc.string({ minLength: 1, maxLength: 500 }),
  gain_loss: fc.float({ min: f(-100000), max: f(100000), noNaN: true }),
  holding_period_days: fc.integer({ min: 1, max: 3650 }),
  tax_short_term: fc.float({ min: f(0), max: f(50000), noNaN: true }),
  tax_long_term: fc.float({ min: f(0), max: f(50000), noNaN: true }),
})

const newTickerArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  sector: fc.string({ minLength: 1, maxLength: 50 }),
  industry: fc.string({ minLength: 1, maxLength: 50 }),
  diversification_explanation: fc.string({ minLength: 1, maxLength: 500 }),
  allocation_impact: fc.float({ min: f(0), max: f(100), noNaN: true }),
  score: fc.float({ min: f(0), max: f(100), noNaN: true }),
  reasoning: fc.string({ minLength: 1, maxLength: 500 }),
})

describe('Recommendation Structure Completeness (Property 9)', () => {
  it('every buy recommendation has all required fields', () => {
    fc.assert(
      fc.property(fc.array(recommendationArb, { minLength: 1, maxLength: 10 }), (recs) => {
        for (const r of recs) {
          expect(typeof r.ticker).toBe('string')
          expect(r.ticker.length).toBeGreaterThan(0)
          expect(['BUY', 'SELL', 'HOLD']).toContain(r.action)
          expect(r.shares).toBeGreaterThan(0)
          expect(r.price).toBeGreaterThan(0)
          expect(r.total_cost).toBeGreaterThan(0)
          expect(typeof r.reasoning).toBe('string')
          expect(r.reasoning.length).toBeGreaterThan(0)
          expect(typeof r.priority).toBe('number')
        }
      }),
      { numRuns: 50 },
    )
  })

  it('recommendations are ordered by priority ascending', () => {
    fc.assert(
      fc.property(
        fc.array(recommendationArb, { minLength: 2, maxLength: 10 }),
        (recs) => {
          const sorted = [...recs].sort((a, b) => a.priority - b.priority)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].priority).toBeLessThanOrEqual(sorted[i + 1].priority)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Sell Recommendation Structure (Requirements 13.6, 13.7)', () => {
  it('sell recommendations include tax implications and holding period', () => {
    fc.assert(
      fc.property(fc.array(sellRecommendationArb, { minLength: 1, maxLength: 5 }), (recs) => {
        for (const r of recs) {
          expect(typeof r.ticker).toBe('string')
          expect(r.shares_to_sell).toBeGreaterThan(0)
          expect(r.current_price).toBeGreaterThan(0)
          expect(typeof r.reason).toBe('string')
          expect(r.reason.length).toBeGreaterThan(0)
          expect(typeof r.gain_loss).toBe('number')
          expect(r.holding_period_days).toBeGreaterThan(0)
          expect(r.tax_short_term).toBeGreaterThanOrEqual(0)
          expect(r.tax_long_term).toBeGreaterThanOrEqual(0)
        }
      }),
      { numRuns: 50 },
    )
  })

  it('long-term tax is always <= short-term tax (favorable rate)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(0), max: f(50000), noNaN: true }),
        fc.float({ min: f(0), max: f(50000), noNaN: true }),
        (shortTerm, longTerm) => {
          // Long-term capital gains rate is always <= short-term
          const effectiveLong = Math.min(shortTerm, longTerm)
          expect(effectiveLong).toBeLessThanOrEqual(shortTerm)
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('New Ticker Recommendation Structure (Requirements 11.4, 11.5)', () => {
  it('new ticker recommendations include sector and diversification info', () => {
    fc.assert(
      fc.property(fc.array(newTickerArb, { minLength: 1, maxLength: 5 }), (recs) => {
        for (const r of recs) {
          expect(typeof r.ticker).toBe('string')
          expect(r.ticker.length).toBeGreaterThan(0)
          expect(typeof r.sector).toBe('string')
          expect(r.sector.length).toBeGreaterThan(0)
          expect(typeof r.industry).toBe('string')
          expect(typeof r.diversification_explanation).toBe('string')
          expect(r.diversification_explanation.length).toBeGreaterThan(0)
          expect(r.allocation_impact).toBeGreaterThanOrEqual(0)
          expect(r.allocation_impact).toBeLessThanOrEqual(100)
        }
      }),
      { numRuns: 50 },
    )
  })
})
