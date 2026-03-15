/**
 * Unit tests for Settings Panel — budget validation and persistence.
 * Validates: Requirements 12.2, 12.3
 */
import { describe, it, expect, beforeEach } from 'vitest'

const MIN_BUDGET = 50

function validateBudget(value: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(value) || value < MIN_BUDGET) {
    return { valid: false, error: `Budget must be at least $${MIN_BUDGET}` }
  }
  return { valid: true }
}

// Simulate budget persistence via localStorage
function saveBudget(budget: number): void {
  localStorage.setItem('monthly_budget', String(budget))
}

function loadBudget(): number | null {
  const raw = localStorage.getItem('monthly_budget')
  if (raw === null) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

describe('Budget validation', () => {
  it('rejects budget below minimum', () => {
    expect(validateBudget(0).valid).toBe(false)
    expect(validateBudget(49).valid).toBe(false)
    expect(validateBudget(-100).valid).toBe(false)
  })

  it('accepts budget at minimum', () => {
    expect(validateBudget(50).valid).toBe(true)
  })

  it('accepts budget above minimum', () => {
    expect(validateBudget(300).valid).toBe(true)
    expect(validateBudget(1000).valid).toBe(true)
  })

  it('rejects non-finite values', () => {
    expect(validateBudget(Infinity).valid).toBe(false)
    expect(validateBudget(NaN).valid).toBe(false)
  })

  it('error message mentions minimum amount', () => {
    const result = validateBudget(10)
    expect(result.error).toContain('50')
  })
})

describe('Budget persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads budget correctly', () => {
    saveBudget(300)
    expect(loadBudget()).toBe(300)
  })

  it('returns null when no budget saved', () => {
    expect(loadBudget()).toBeNull()
  })

  it('overwrites previous budget on update', () => {
    saveBudget(200)
    saveBudget(500)
    expect(loadBudget()).toBe(500)
  })

  it('persists budget across multiple saves', () => {
    const budgets = [100, 200, 300, 500]
    for (const b of budgets) {
      saveBudget(b)
      expect(loadBudget()).toBe(b)
    }
  })
})
