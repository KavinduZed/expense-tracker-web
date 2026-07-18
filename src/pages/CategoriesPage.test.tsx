import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoriesPage from './CategoriesPage'
import { server } from '../mocks/server'
import { clearTokens } from '../auth/tokenStore'
import { API_BASE, renderWithProviders } from '../test/utils'
import type { CategoryDto } from '../types/api'

const seeded: CategoryDto[] = [
  { id: 1, name: 'Food', isDefault: true },
  { id: 2, name: 'Transport', isDefault: true },
]

beforeEach(() => {
  clearTokens()
  localStorage.clear()
})
afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('CategoriesPage', () => {
  it('lists categories with a default badge', async () => {
    server.use(http.get(`${API_BASE}/api/categories`, () => HttpResponse.json(seeded)))
    renderWithProviders(<CategoriesPage />)

    expect(await screen.findByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getAllByText('Default')).toHaveLength(2)
  })

  it('creates a new category', async () => {
    const list = [...seeded]
    server.use(
      http.get(`${API_BASE}/api/categories`, () => HttpResponse.json(list)),
      http.post(`${API_BASE}/api/categories`, async ({ request }) => {
        const { name } = (await request.json()) as { name: string }
        const created: CategoryDto = { id: 99, name, isDefault: false }
        list.push(created)
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await user.click(await screen.findByRole('button', { name: /new category/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/name/i), 'Travel')
    await user.click(within(dialog).getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Travel')).toBeInTheDocument())
  })

  it('explains why an in-use category cannot be deleted', async () => {
    server.use(
      http.get(`${API_BASE}/api/categories`, () => HttpResponse.json(seeded)),
      http.delete(`${API_BASE}/api/categories/1`, () =>
        HttpResponse.json({ status: 409, title: 'Conflict' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    // Auto-confirm the window.confirm prompt.
    viConfirm(true)
    renderWithProviders(<CategoriesPage />)

    const foodCard = (await screen.findByText('Food')).closest('.MuiCard-root') as HTMLElement
    await user.click(within(foodCard).getByRole('button', { name: /delete/i }))

    expect(
      await screen.findByText(/used by existing expenses and can't be deleted/i),
    ).toBeInTheDocument()
  })
})

// Small helper to stub window.confirm for a test.
function viConfirm(result: boolean) {
  window.confirm = () => result
}
