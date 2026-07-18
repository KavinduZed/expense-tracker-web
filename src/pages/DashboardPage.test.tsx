import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'
import { CurrentBoardProvider } from '../board/CurrentBoardProvider'
import { server } from '../mocks/server'
import { clearTokens } from '../auth/tokenStore'
import { API_BASE, renderWithProviders, testBoard } from '../test/utils'

function renderPage() {
  localStorage.setItem('et_current_board', testBoard.id)
  return renderWithProviders(
    <CurrentBoardProvider>
      <DashboardPage />
    </CurrentBoardProvider>,
  )
}

beforeEach(() => {
  clearTokens()
  localStorage.clear()
  server.use(http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([testBoard])))
})
afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('DashboardPage', () => {
  it('shows the total, top category, and category legend', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-by-category`, () =>
        HttpResponse.json([
          { categoryId: 4, categoryName: 'Bills', total: 540 },
          { categoryId: 1, categoryName: 'Food', total: 420 },
        ]),
      ),
      http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-over-time`, () =>
        HttpResponse.json([{ periodStart: '2026-06-01', total: 960 }]),
      ),
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'exp-1',
              boardId: testBoard.id,
              categoryId: 4,
              categoryName: 'Bills',
              name: 'Electricity',
              amount: 540,
              date: '2026-06-28',
              createdByUserId: 'user-1',
              createdAt: '2026-06-28T00:00:00Z',
            },
          ],
          page: 1,
          pageSize: 5,
          totalCount: 1,
        }),
      ),
    )
    renderPage()

    expect(await screen.findByText('$960.00')).toBeInTheDocument() // total spend tile
    expect(screen.getByText('Total spend')).toBeInTheDocument()
    // "Bills" is the top category and appears in the legend + recent list.
    expect(screen.getAllByText('Bills').length).toBeGreaterThan(0)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Electricity')).toBeInTheDocument()
  })

  it('shows an empty state when there is no spending', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-by-category`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${API_BASE}/api/boards/${testBoard.id}/dashboard/spend-over-time`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${API_BASE}/api/boards/${testBoard.id}/expenses`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, totalCount: 0 }),
      ),
    )
    renderPage()

    expect(await screen.findAllByText(/no spending in this range yet/i)).toHaveLength(2)
  })
})
