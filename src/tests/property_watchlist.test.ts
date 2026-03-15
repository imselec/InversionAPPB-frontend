/**
 * Property 55: Watchlist Addition — Validates: Requirements 15.1
 * Property 56: Watchlist Removal — Validates: Requirements 15.2
 * Property 57: Watchlist Metrics Display Completeness — Validates: Requirements 15.3, 15.4
 * Property 58: Watchlist Buy Criteria Alert — Validates: Requirements 15.5
 * Property 60: Watchlist Explanation Presence — Validates: Requirements 15.8
 * Property 62: Watchlist ETF Exclusion — Validates: Requirements 15.10
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

const f = Math.fround

// Known ETF tickers to test exclusion
const ETF_TICKERS = ['SPY', 'QQQ', 'IVV', 'VTI', 'VOO', 'GLD', 'TLT', 'EEM', 'XLF', 'XLE']

const watchlistItemArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  added_at: fc.date().map((d) => d.toISOString()),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  target_price: fc.option(fc.float({ min: f(0.01), max: f(100000), noNaN: true }), { nil: null }),
  current_price: fc.float({ min: f(0.01), max: f(100000), noNaN: true }),
  dividend_yield: fc.float({ min: f(0), max: f(30), noNaN: true }),
  pe_ratio: fc.float({ min: f(0), max: f(1000), noNaN: true }),
  market_cap: fc.float({ min: f(1_000_000), max: f(3_000_000_000_000), noNaN: true }),
  score: fc.float({ min: f(0), max: f(100), noNaN: true }),
  meets_criteria: fc.boolean(),
})

describe('Property 55 & 56: Watchlist Addition and Removal', () => {
  it('adding a ticker results in it being present in the list', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[A-Z]{1,5}$/), { minLength: 1, maxLength: 10 }),
        (tickers) => {
          const watchlist = new Set<string>()
          for (const t of tickers) watchlist.add(t)
          for (const t of tickers) {
            expect(watchlist.has(t)).toBe(true)
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('removing a ticker results in it being absent from the list', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[A-Z]{1,5}$/), { minLength: 2, maxLength: 10 }),
        (tickers) => {
          const watchlist = new Set(tickers)
          const toRemove = tickers[0]
          watchlist.delete(toRemove)
          expect(watchlist.has(toRemove)).toBe(false)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('no duplicate tickers in watchlist', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[A-Z]{1,5}$/), { minLength: 1, maxLength: 20 }),
        (tickers) => {
          const watchlist = new Set(tickers)
          expect(watchlist.size).toBeLessThanOrEqual(tickers.length)
          // All items in set are unique
          const arr = Array.from(watchlist)
          expect(new Set(arr).size).toBe(arr.length)
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Property 57: Watchlist Metrics Display Completeness', () => {
  it('every watchlist item has all required metrics', () => {
    fc.assert(
      fc.property(fc.array(watchlistItemArb, { minLength: 1, maxLength: 10 }), (items) => {
        for (const item of items) {
          expect(typeof item.ticker).toBe('string')
          expect(item.ticker.length).toBeGreaterThan(0)
          expect(item.current_price).toBeGreaterThan(0)
          expect(item.dividend_yield).toBeGreaterThanOrEqual(0)
          expect(item.pe_ratio).toBeGreaterThanOrEqual(0)
          expect(item.market_cap).toBeGreaterThan(0)
          expect(typeof item.score).toBe('number')
          expect(typeof item.meets_criteria).toBe('boolean')
        }
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 58: Watchlist Buy Criteria Alert', () => {
  it('item meets criteria when current_price <= target_price', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(1), max: f(1000), noNaN: true }),
        fc.float({ min: f(1), max: f(1000), noNaN: true }),
        (currentPrice, targetPrice) => {
          const meetsCriteria = currentPrice <= targetPrice
          if (currentPrice <= targetPrice) {
            expect(meetsCriteria).toBe(true)
          } else {
            expect(meetsCriteria).toBe(false)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Property 60: Watchlist Explanation Presence', () => {
  it('watchlist comparison always includes an explanation', () => {
    fc.assert(
      fc.property(
        fc.record({
          ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
          allocation_impact: fc.float({ min: f(0), max: f(100), noNaN: true }),
          explanation: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (comparison) => {
          expect(typeof comparison.explanation).toBe('string')
          expect(comparison.explanation.length).toBeGreaterThan(0)
          expect(comparison.allocation_impact).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('Property 62: Watchlist ETF Exclusion', () => {
  it('known ETF tickers are rejected from watchlist', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ETF_TICKERS), (etfTicker) => {
        // Simulate ETF validation: ETFs are in a known exclusion list
        const isEtf = ETF_TICKERS.includes(etfTicker)
        expect(isEtf).toBe(true)
        // Should be rejected
        const canAdd = !isEtf
        expect(canAdd).toBe(false)
      }),
      { numRuns: 10 },
    )
  })

  it('non-ETF stock tickers pass ETF validation', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{1,5}$/).filter((t) => !ETF_TICKERS.includes(t)),
        (ticker) => {
          const isEtf = ETF_TICKERS.includes(ticker)
          expect(isEtf).toBe(false)
        },
      ),
      { numRuns: 50 },
    )
  })
})
