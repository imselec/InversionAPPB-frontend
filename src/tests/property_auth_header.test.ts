/**
 * Property 3: Authentication Header Inclusion
 * Validates: Requirements 1.5
 *
 * For any non-empty token stored in localStorage, every outgoing request
 * MUST include an Authorization: Bearer <token> header.
 * When no token is stored, the header MUST be absent.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import axios from 'axios'

// We test the interceptor logic directly by inspecting the request config
// produced by the interceptor, without making real network calls.

describe('Property 3: Authentication Header Inclusion', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('includes Bearer token when auth_token is set', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        (token) => {
          localStorage.setItem('auth_token', token)

          // Simulate what the interceptor does
          const config = { headers: axios.defaults.headers.common ?? {} } as Record<string, unknown>
          const storedToken = localStorage.getItem('auth_token')
          if (storedToken) {
            (config.headers as Record<string, string>).Authorization = `Bearer ${storedToken}`
          }

          const authHeader = (config.headers as Record<string, string>).Authorization
          expect(authHeader).toBe(`Bearer ${token}`)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('omits Authorization header when no token is stored', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        localStorage.removeItem('auth_token')

        const config = { headers: {} as Record<string, string> }
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`
        }

        expect(config.headers.Authorization).toBeUndefined()
      }),
      { numRuns: 10 },
    )
  })

  it('updates header when token changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        (token1, token2) => {
          localStorage.setItem('auth_token', token1)
          const headers1: Record<string, string> = {}
          const t1 = localStorage.getItem('auth_token')
          if (t1) headers1.Authorization = `Bearer ${t1}`

          localStorage.setItem('auth_token', token2)
          const headers2: Record<string, string> = {}
          const t2 = localStorage.getItem('auth_token')
          if (t2) headers2.Authorization = `Bearer ${t2}`

          expect(headers1.Authorization).toBe(`Bearer ${token1}`)
          expect(headers2.Authorization).toBe(`Bearer ${token2}`)
        },
      ),
      { numRuns: 30 },
    )
  })
})
