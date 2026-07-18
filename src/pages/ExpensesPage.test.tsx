import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpensesPage from './ExpensesPage'
import { CurrentBoardProvider } from '../board/CurrentBoardProvider'
import { server } from '../mocks/server'
import { clearTokens } from '../auth/tokenStore'
import { API_BASE, renderWithProviders, testBoard } from '../test/utils'
import type { ExpenseDto, PagedResponse } from '../types/api'

const categories = [
  { id: 1, name: 'Food', isDefault: true },
  { id: 4, name: 'Bills', isDefault: true },
]

function expense(overrides: Partial<ExpenseDto>): ExpenseDto {
  return {
    id: 'exp-1',
    boardId: testBoard.id,
    categoryId: 4,
    categoryName: 'Bills',
    name: 'Electricity',
    amount: 142,
    date: '2026-06-28',
    createdByUserId: 'user-1',
    createdAt: '2026-06-28T00:00:00Z',
    ...overrides,
  }
}

function paged(items: ExpenseDto[]): PagedResponse<ExpenseDto> {
  return { items, page: 1, pageSize: 10, totalCount: items.length }
}

function renderPage() {
  localStorage.setItem('et_current_board', testBoard.id)
  return renderWithProviders(
    <CurrentBoardProvider>
      <ExpensesPage />
    </CurrentBoardProvider>,
  )
}

beforeEach(() => {
  clearTokens()
  localStorage.clear()
  server.use(
    http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([testBoard])),
    http.get(`${API_BASE}/api/categories`, () => HttpResponse.json(categories)),
  )
})
afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('ExpensesPage', () => {
  it('renders expenses with formatted amounts', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json(paged([expense({})])),
      ),
    )
    renderPage()

    expect(await screen.findByText('Electricity')).toBeInTheDocument()
    expect(screen.getByText('$142.00')).toBeInTheDocument()
    expect(screen.getByText('Bills')).toBeInTheDocument()
  })

  it('shows an empty state when there are no expenses', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json(paged([])),
      ),
    )
    renderPage()
    expect(await screen.findByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('validates the add-expense form', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json(paged([])),
      ),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /add expense/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^add$/i }))

    expect(await within(dialog).findByText(/name is required/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/amount must be greater than 0/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/pick a category/i)).toBeInTheDocument()
  })

  it('creates an expense and shows it in the list', async () => {
    const items: ExpenseDto[] = []
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json(paged(items)),
      ),
      http.post(`${API_BASE}/api/boards/${testBoard.id}/expenses`, async ({ request }) => {
        const body = (await request.json()) as { name: string; amount: number; categoryId: number }
        const created = expense({
          id: 'exp-new',
          name: body.name,
          amount: body.amount,
          categoryId: body.categoryId,
          categoryName: 'Food',
        })
        items.push(created)
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /add expense/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/name/i), 'Coffee')
    await user.type(within(dialog).getByLabelText(/amount/i), '4.5')

    // MUI select: open and choose Food.
    await user.click(within(dialog).getByLabelText(/category/i))
    await user.click(await screen.findByRole('option', { name: 'Food' }))

    await user.click(within(dialog).getByRole('button', { name: /^add$/i }))

    await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument())
  })
})
