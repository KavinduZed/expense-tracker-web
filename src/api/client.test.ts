import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiFetch, ApiError } from './client'
import { server } from '../mocks/server'
import { clearTokens, getRefreshToken, setTokens } from '../auth/tokenStore'
import { API_BASE } from '../test/utils'

beforeEach(() => {
  clearTokens()
  localStorage.clear()
})

afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('apiFetch auth interceptor', () => {
  it('injects the Bearer access token on authed requests', async () => {
    setTokens('access-1', 'refresh-1')
    let seenAuth: string | null = null
    server.use(
      http.get(`${API_BASE}/api/thing`, ({ request }) => {
        seenAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiFetch('/api/thing')
    expect(seenAuth).toBe('Bearer access-1')
  })

  it('refreshes once on 401 then retries the original request', async () => {
    setTokens('stale-access', 'refresh-1')
    let protectedCalls = 0
    let refreshCalls = 0

    server.use(
      http.get(`${API_BASE}/api/thing`, ({ request }) => {
        protectedCalls += 1
        const auth = request.headers.get('Authorization')
        if (auth === 'Bearer new-access') {
          return HttpResponse.json({ value: 42 })
        }
        return HttpResponse.json({ title: 'Unauthorized' }, { status: 401 })
      }),
      http.post(`${API_BASE}/api/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({
          accessToken: 'new-access',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          refreshToken: 'refresh-2',
          user: { id: 'u', email: 'e', displayName: 'd', currency: 'USD' },
        })
      }),
    )

    const result = await apiFetch<{ value: number }>('/api/thing')
    expect(result.value).toBe(42)
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(2) // initial 401 + retry
    expect(getRefreshToken()).toBe('refresh-2') // rotated token stored
  })

  it('shares a single refresh across concurrent 401s (single-flight)', async () => {
    setTokens('stale-access', 'refresh-1')
    let refreshCalls = 0

    server.use(
      http.get(`${API_BASE}/api/a`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer new-access'
          ? HttpResponse.json({ ok: 'a' })
          : HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
      http.get(`${API_BASE}/api/b`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer new-access'
          ? HttpResponse.json({ ok: 'b' })
          : HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${API_BASE}/api/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({
          accessToken: 'new-access',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          refreshToken: 'refresh-2',
          user: { id: 'u', email: 'e', displayName: 'd', currency: 'USD' },
        })
      }),
    )

    await Promise.all([apiFetch('/api/a'), apiFetch('/api/b')])
    expect(refreshCalls).toBe(1)
  })

  it('clears tokens and throws when the refresh fails', async () => {
    setTokens('stale-access', 'refresh-1')
    server.use(
      http.get(`${API_BASE}/api/thing`, () =>
        HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${API_BASE}/api/auth/refresh`, () =>
        HttpResponse.json({ title: 'Invalid refresh token' }, { status: 401 }),
      ),
    )

    await expect(apiFetch('/api/thing')).rejects.toBeInstanceOf(ApiError)
    expect(getRefreshToken()).toBeNull()
  })

  it('surfaces ProblemDetails.detail on the thrown ApiError', async () => {
    setTokens('access-1', 'refresh-1')
    server.use(
      http.post(`${API_BASE}/api/thing`, () =>
        HttpResponse.json({ status: 400, title: 'Bad Request', detail: 'Amount must be > 0' }, { status: 400 }),
      ),
    )

    await expect(apiFetch('/api/thing', { method: 'POST' })).rejects.toMatchObject({
      status: 400,
      detail: 'Amount must be > 0',
    })
  })
})
