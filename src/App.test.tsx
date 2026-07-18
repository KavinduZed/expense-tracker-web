import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { server } from './mocks/server'
import { clearTokens } from './auth/tokenStore'
import { API_BASE, renderWithProviders, testBoard, testUser } from './test/utils'

// Landing on the dashboard mounts the shell (boards) and fires the dashboard aggregations
// plus recent expenses. Authed-path tests stub them all so no request goes unhandled.
function landingHandlers() {
  return [
    http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([testBoard])),
    http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-by-category`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-over-time`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 5, totalCount: 0 }),
    ),
  ]
}

beforeEach(() => {
  clearTokens()
  localStorage.clear()
})

afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('App routing + auth', () => {
  it('redirects an unauthenticated visit to the login page', async () => {
    renderWithProviders(<App />, ['/'])
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('blocks submitting an invalid email and shows a validation message', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />, ['/login'])

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/password/i), 'whatever')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
  })

  it('signs in and lands on the dashboard', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: 'access-1',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          refreshToken: 'refresh-1',
          user: testUser,
        }),
      ),
      ...landingHandlers(),
    )

    renderWithProviders(<App />, ['/login'])
    await user.type(screen.getByLabelText(/email/i), testUser.email)
    await user.type(screen.getByLabelText(/password/i), 'Password1!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // The authenticated shell loaded: the board switcher shows the current board.
    expect(await screen.findByRole('button', { name: /personal/i })).toBeInTheDocument()
  })

  it('shows an error message on bad credentials', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE}/api/auth/login`, () =>
        HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 }),
      ),
    )

    renderWithProviders(<App />, ['/login'])
    await user.type(screen.getByLabelText(/email/i), testUser.email)
    await user.type(screen.getByLabelText(/password/i), 'Password1!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
  })

  it('rehydrates an existing session from a stored refresh token', async () => {
    localStorage.setItem('et_refresh_token', 'refresh-1')
    server.use(
      // GET /me 401s (no access token in memory) -> interceptor refreshes -> retries.
      http.get(`${API_BASE}/api/auth/me`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer access-1'
          ? HttpResponse.json(testUser)
          : HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${API_BASE}/api/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: 'access-1',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          refreshToken: 'refresh-2',
          user: testUser,
        }),
      ),
      ...landingHandlers(),
    )

    renderWithProviders(<App />, ['/'])
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument(),
    )
  })
})
