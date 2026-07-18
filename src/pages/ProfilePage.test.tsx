import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilePage from './ProfilePage'
import { server } from '../mocks/server'
import { clearTokens } from '../auth/tokenStore'
import { API_BASE, renderWithProviders, testUser } from '../test/utils'

beforeEach(() => {
  clearTokens()
  localStorage.clear()
  // Seed a session: a stored refresh token makes AuthProvider rehydrate via /me.
  localStorage.setItem('et_refresh_token', 'r1')
  server.use(http.get(`${API_BASE}/api/auth/me`, () => HttpResponse.json(testUser)))
})
afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('ProfilePage', () => {
  it('prefills the form and saves an update', async () => {
    server.use(
      http.put(`${API_BASE}/api/profile`, async ({ request }) => {
        const body = (await request.json()) as { displayName: string; currency: string }
        return HttpResponse.json({ ...testUser, ...body })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    const nameField = await screen.findByDisplayValue('Ada Lovelace')
    await user.clear(nameField)
    await user.type(nameField, 'Ada L')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument()
  })

  it('surfaces a server error', async () => {
    server.use(
      http.put(`${API_BASE}/api/profile`, () =>
        HttpResponse.json({ status: 400, title: 'Bad Request', detail: 'Invalid currency' }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    await screen.findByDisplayValue('Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/invalid currency/i)).toBeInTheDocument()
  })
})
