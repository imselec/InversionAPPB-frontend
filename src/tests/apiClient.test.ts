/**
 * Unit tests for API client error handling.
 * Validates: Requirements 1.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ApiError, apiClient } from '@/services/apiClient'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => { server.resetHandlers(); localStorage.clear(); vi.restoreAllMocks() })
afterAll(() => server.close())

describe('ApiClient error handling', () => {
  beforeEach(() => { localStorage.clear() })

  it('throws ApiError with status 404 on not found', async () => {
    server.use(
      http.get('*/nonexistent', () => HttpResponse.json({ detail: 'Not found' }, { status: 404 })),
    )
    await expect(apiClient.get('/nonexistent')).rejects.toMatchObject({
      name: 'ApiError', status: 404,
    })
  })

  it('throws ApiError with status 422 on validation error', async () => {
    server.use(
      http.get('*/bad-input', () => HttpResponse.json({ detail: 'Validation error' }, { status: 422 })),
    )
    await expect(apiClient.get('/bad-input')).rejects.toMatchObject({
      name: 'ApiError', status: 422,
    })
  })

  it('does not retry on 401 unauthorized', async () => {
    let callCount = 0
    server.use(
      http.get('*/protected', () => {
        callCount++
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      }),
    )
    await expect(apiClient.get('/protected')).rejects.toMatchObject({ status: 401 })
    expect(callCount).toBe(1)
  })

  it('setToken stores token in localStorage', () => {
    apiClient.setToken('my-token')
    expect(localStorage.getItem('auth_token')).toBe('my-token')
  })

  it('setToken(null) removes token from localStorage', () => {
    localStorage.setItem('auth_token', 'existing')
    apiClient.setToken(null)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('includes Bearer token in Authorization header', async () => {
    localStorage.setItem('auth_token', 'test-token-123')
    let capturedAuth = ''
    server.use(
      http.get('*/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await apiClient.get('/test-auth')
    expect(capturedAuth).toBe('Bearer test-token-123')
  })

  it('uses default token when no auth_token in localStorage', async () => {
    let capturedAuth = ''
    server.use(
      http.get('*/test-default', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await apiClient.get('/test-default')
    expect(capturedAuth).toBe('Bearer inversionapp2024')
  })
})
