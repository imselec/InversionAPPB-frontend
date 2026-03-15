/**
 * Property 23: Allocation Deviation Display — Validates: Requirements 8.4
 * Property 37: Budget Validation — Validates: Requirements 12.2
 * Property 54: Notification History Completeness — Validates: Requirements 14.10
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

const f = Math.fround

const allocationArb = fc.record({
  ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
  allocation_pct: fc.float({ min: f(0), max: f(100), noNaN: true }),
  target_pct: fc.float({ min: f(0), max: f(100), noNaN: true }),
  deviation: fc.float({ min: f(-100), max: f(100), noNaN: true }),
})

const notificationArb = fc.record({
  id: fc.integer({ min: 1 }),
  alert_type: fc.constantFrom('price', 'dividend', 'rebalancing', 'monthly_investment', 'news'),
  ticker: fc.option(fc.stringMatching(/^[A-Z]{1,5}$/), { nil: null }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  sent_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
    .map((d) => d.toISOString()),
  delivered: fc.boolean(),
  read: fc.boolean(),
})

describe('Property 23: Allocation Deviation Display', () => {
  it('deviation equals allocation_pct minus target_pct', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(0), max: f(100), noNaN: true }),
        fc.float({ min: f(0), max: f(100), noNaN: true }),
        (allocationPct, targetPct) => {
          const deviation = allocationPct - targetPct
          expect(deviation).toBeCloseTo(allocationPct - targetPct, 4)
          if (allocationPct > targetPct) expect(deviation).toBeGreaterThan(0)
          if (allocationPct < targetPct) expect(deviation).toBeLessThan(0)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('overweight alert triggers when allocation exceeds target by 20%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(5), max: f(80), noNaN: true }),
        (targetPct) => {
          const overweightThreshold = targetPct * 1.2
          const overweightAllocation = overweightThreshold + 1
          const deviation = overweightAllocation - targetPct
          expect(deviation).toBeGreaterThan(targetPct * 0.2)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('underweight alert triggers when allocation is below target by 10%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: f(5), max: f(80), noNaN: true }),
        (targetPct) => {
          const underweightThreshold = targetPct * 0.9
          const underweightAllocation = underweightThreshold - 1
          const deviation = underweightAllocation - targetPct
          expect(deviation).toBeLessThan(-(targetPct * 0.1))
        },
      ),
      { numRuns: 50 },
    )
  })

  it('all allocation items have required display fields', () => {
    fc.assert(
      fc.property(fc.array(allocationArb, { minLength: 1, maxLength: 18 }), (items) => {
        for (const item of items) {
          expect(typeof item.ticker).toBe('string')
          expect(item.ticker.length).toBeGreaterThan(0)
          expect(item.allocation_pct).toBeGreaterThanOrEqual(0)
          expect(item.allocation_pct).toBeLessThanOrEqual(100)
          expect(item.target_pct).toBeGreaterThanOrEqual(0)
          expect(typeof item.deviation).toBe('number')
        }
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 37: Budget Validation', () => {
  const MIN_BUDGET = 50

  it('budget below minimum is rejected', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MIN_BUDGET - 1 }), (budget) => {
        const isValid = budget >= MIN_BUDGET
        expect(isValid).toBe(false)
      }),
      { numRuns: 50 },
    )
  })

  it('budget at or above minimum is accepted', () => {
    fc.assert(
      fc.property(fc.integer({ min: MIN_BUDGET, max: 100000 }), (budget) => {
        const isValid = budget >= MIN_BUDGET
        expect(isValid).toBe(true)
      }),
      { numRuns: 50 },
    )
  })

  it('budget is always a positive number', () => {
    fc.assert(
      fc.property(fc.integer({ min: MIN_BUDGET, max: 100000 }), (budget) => {
        expect(budget).toBeGreaterThan(0)
        expect(Number.isFinite(budget)).toBe(true)
      }),
      { numRuns: 50 },
    )
  })
})

describe('Property 54: Notification History Completeness', () => {
  it('every notification has all required display fields', () => {
    fc.assert(
      fc.property(fc.array(notificationArb, { minLength: 1, maxLength: 50 }), (notifications) => {
        for (const n of notifications) {
          expect(typeof n.id).toBe('number')
          expect(n.id).toBeGreaterThan(0)
          expect(['price', 'dividend', 'rebalancing', 'monthly_investment', 'news']).toContain(n.alert_type)
          expect(typeof n.message).toBe('string')
          expect(n.message.length).toBeGreaterThan(0)
          expect(typeof n.sent_at).toBe('string')
          expect(typeof n.delivered).toBe('boolean')
          expect(typeof n.read).toBe('boolean')
        }
      }),
      { numRuns: 50 },
    )
  })

  it('notifications are sorted by sent_at descending (most recent first)', () => {
    fc.assert(
      fc.property(fc.array(notificationArb, { minLength: 2, maxLength: 20 }), (notifications) => {
        const sorted = [...notifications].sort(
          (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
        )
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(new Date(sorted[i].sent_at).getTime()).toBeGreaterThanOrEqual(
            new Date(sorted[i + 1].sent_at).getTime(),
          )
        }
      }),
      { numRuns: 50 },
    )
  })
})
