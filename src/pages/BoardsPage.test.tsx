import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BoardsPage from './BoardsPage'
import { server } from '../mocks/server'
import { clearTokens } from '../auth/tokenStore'
import { API_BASE, renderWithProviders, testBoard } from '../test/utils'
import type { BoardDto } from '../types/api'

beforeEach(() => {
  clearTokens()
  localStorage.clear()
})
afterEach(() => {
  clearTokens()
  localStorage.clear()
})

describe('BoardsPage', () => {
  it('renders the boards returned by the API', async () => {
    server.use(http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([testBoard])))
    renderWithProviders(<BoardsPage />)

    expect(await screen.findByText('Personal')).toBeInTheDocument()
    expect(screen.getByText(/1 member/i)).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('shows an empty state when there are no boards', async () => {
    server.use(http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([])))
    renderWithProviders(<BoardsPage />)
    expect(await screen.findByText(/don't have any boards yet/i)).toBeInTheDocument()
  })

  it('validates and creates a new board', async () => {
    const boards: BoardDto[] = [testBoard]
    server.use(
      http.get(`${API_BASE}/api/boards`, () => HttpResponse.json(boards)),
      http.post(`${API_BASE}/api/boards`, async ({ request }) => {
        const { name } = (await request.json()) as { name: string }
        const created: BoardDto = { ...testBoard, id: 'board-2', name, memberCount: 1 }
        boards.push(created)
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BoardsPage />)

    await user.click(await screen.findByRole('button', { name: /new board/i }))
    const dialog = await screen.findByRole('dialog')

    // Empty name is rejected client-side.
    await user.click(within(dialog).getByRole('button', { name: /create/i }))
    expect(await within(dialog).findByText(/name is required/i)).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText(/board name/i), 'Road trip')
    await user.click(within(dialog).getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Road trip')).toBeInTheDocument())
  })

  it('surfaces a friendly error when inviting an unknown email', async () => {
    server.use(
      http.get(`${API_BASE}/api/boards`, () => HttpResponse.json([testBoard])),
      http.get(`${API_BASE}/api/boards/${testBoard.id}/members`, () =>
        HttpResponse.json([
          { userId: 'user-1', email: 'ada@example.com', displayName: 'Ada Lovelace', role: 'Owner' },
        ]),
      ),
      http.post(`${API_BASE}/api/boards/${testBoard.id}/members`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<BoardsPage />)

    await user.click(await screen.findByRole('button', { name: /manage members/i }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText(/invite by email/i), 'nobody@example.com')
    await user.click(within(dialog).getByRole('button', { name: /^add$/i }))

    expect(await within(dialog).findByText(/no account found with that email/i)).toBeInTheDocument()
  })
})
