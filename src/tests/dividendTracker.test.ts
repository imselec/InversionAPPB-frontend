/**
 * Unit tests for dividend aggregation logic.
 * Validates: Requirements 3.3, 3.4
 */
import { describe, it, expect } from 'vitest'

interface Payment { month: string; amount: number }

function aggregateByMonth(payments: Payment[]): Record<string, number> {
  return payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.month] = (acc[p.month] ?? 0) + p.amount
    return acc
  }, {})
}

function yearlyTotal(byMonth: Record<string, number>): number {
  return Object.values(byMonth).reduce((s, v) => s + v, 0)
}

describe('Dividend aggregation', () => {
  const payments: Payment[] = [
    { month: '2025-01', amount: 12.5 },
    { month: '2025-01', amount: 8.3 },
    { month: '2025-02', amount: 15.0 },
    { month: '2025-03', amount: 10.0 },
  ]

  it('sums payments correctly by month', () => {
    const byMonth = aggregateByMonth(payments)
    expect(byMonth['2025-01']).toBeCloseTo(20.8, 2)
    expect(byMonth['2025-02']).toBeCloseTo(15.0, 2)
    expect(byMonth['2025-03']).toBeCloseTo(10.0, 2)
  })

  it('calculates yearly total correctly', () => {
    const byMonth = aggregateByMonth(payments)
    expect(yearlyTotal(byMonth)).toBeCloseTo(45.8, 2)
  })

  it('returns empty object for no payments', () => {
    expect(aggregateByMonth([])).toEqual({})
  })

  it('handles single payment', () => {
    const byMonth = aggregateByMonth([{ month: '2025-06', amount: 5.0 }])
    expect(byMonth['2025-06']).toBe(5.0)
    expect(yearlyTotal(byMonth)).toBe(5.0)
  })

  it('yearly total equals sum of all individual payments', () => {
    const byMonth = aggregateByMonth(payments)
    const total = yearlyTotal(byMonth)
    const directSum = payments.reduce((s, p) => s + p.amount, 0)
    expect(total).toBeCloseTo(directSum, 5)
  })
})
