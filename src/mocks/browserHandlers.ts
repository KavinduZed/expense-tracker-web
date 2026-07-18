import { http, HttpResponse } from 'msw'
import type {
  AuthResponse,
  BoardDto,
  BoardMemberDto,
  CategoryDto,
  ExpenseDto,
  PagedResponse,
  UserDto,
} from '../types/api'
import { DEMO_EMAIL, DEMO_PASSWORD } from './demoConfig'

// ---------------------------------------------------------------------------
// In-browser mock backend for demo mode (VITE_ENABLE_MOCKS=true). Stateful for
// the session so create/edit/delete feel real. No network / no real backend.
// Sign in with the demo credentials from demoConfig.ts.
// ---------------------------------------------------------------------------

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return iso(d)
}

// --- Seed data ---
let user: UserDto = {
  id: 'u-demo',
  email: DEMO_EMAIL,
  displayName: 'Demo User',
  currency: 'USD',
}

const boards: BoardDto[] = [
  {
    id: 'b-personal',
    name: 'Personal',
    ownerId: 'u-demo',
    createdAt: today.toISOString(),
    role: 'Owner',
    memberCount: 1,
  },
  {
    id: 'b-flat',
    name: 'Flat 3B',
    ownerId: 'u-demo',
    createdAt: today.toISOString(),
    role: 'Owner',
    memberCount: 2,
  },
]

const membersByBoard: Record<string, BoardMemberDto[]> = {
  'b-personal': [
    { userId: 'u-demo', email: DEMO_EMAIL, displayName: 'Demo User', role: 'Owner' },
  ],
  'b-flat': [
    { userId: 'u-demo', email: DEMO_EMAIL, displayName: 'Demo User', role: 'Owner' },
    { userId: 'u-sam', email: 'sam@example.com', displayName: 'Sam Rivera', role: 'Member' },
  ],
}

const categories: CategoryDto[] = [
  { id: 1, name: 'Food', isDefault: true },
  { id: 2, name: 'Transport', isDefault: true },
  { id: 3, name: 'Shopping', isDefault: true },
  { id: 4, name: 'Bills', isDefault: true },
  { id: 5, name: 'Entertainment', isDefault: true },
  { id: 6, name: 'Health', isDefault: true },
  { id: 7, name: 'Other', isDefault: true },
]

function seedExpense(
  id: string,
  name: string,
  amount: number,
  categoryId: number,
  daysBack: number,
): ExpenseDto {
  return {
    id,
    boardId: 'b-personal',
    categoryId,
    categoryName: categories.find((c) => c.id === categoryId)!.name,
    name,
    amount,
    date: daysAgo(daysBack),
    createdByUserId: 'u-demo',
    createdAt: new Date().toISOString(),
  }
}

const expenses: ExpenseDto[] = [
  seedExpense('e1', 'Electricity bill', 142, 4, 1),
  seedExpense('e2', 'Groceries — Whole Foods', 86.4, 1, 2),
  seedExpense('e3', 'Metro card top-up', 40, 2, 3),
  seedExpense('e4', 'Cinema — two tickets', 32, 5, 4),
  seedExpense('e5', 'Running shoes', 120, 3, 6),
  seedExpense('e6', 'Pharmacy', 24.5, 6, 8),
  seedExpense('e7', 'Dinner out', 64, 1, 9),
  seedExpense('e8', 'Internet bill', 55, 4, 12),
]

let nextCategoryId = 100

// --- Helpers ---
function authResponse(): AuthResponse {
  return {
    accessToken: 'mock-access-token',
    accessTokenExpiresAtUtc: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken: 'mock-refresh-token',
    user,
  }
}

function problem(status: number, title: string, detail?: string) {
  return HttpResponse.json({ status, title, detail }, { status })
}

function boardExpenses(boardId: string) {
  return expenses.filter((e) => e.boardId === boardId)
}

// --- Handlers ---
export const browserHandlers = [
  // Auth
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; displayName: string }
    user = { ...user, email: body.email, displayName: body.displayName }
    return HttpResponse.json(authResponse(), { status: 201 })
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email !== DEMO_EMAIL || body.password !== DEMO_PASSWORD) {
      return problem(401, 'Unauthorized', 'Invalid email or password.')
    }
    return HttpResponse.json(authResponse())
  }),
  http.post('/api/auth/refresh', () => HttpResponse.json(authResponse())),
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/auth/me', () => HttpResponse.json(user)),

  // Profile
  http.get('/api/profile', () => HttpResponse.json(user)),
  http.put('/api/profile', async ({ request }) => {
    const body = (await request.json()) as { displayName: string; currency: string }
    user = { ...user, ...body }
    return HttpResponse.json(user)
  }),

  // Boards
  http.get('/api/boards', () => HttpResponse.json(boards)),
  http.post('/api/boards', async ({ request }) => {
    const { name } = (await request.json()) as { name: string }
    const board: BoardDto = {
      id: crypto.randomUUID(),
      name,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      role: 'Owner',
      memberCount: 1,
    }
    boards.push(board)
    membersByBoard[board.id] = [
      { userId: user.id, email: user.email, displayName: user.displayName, role: 'Owner' },
    ]
    return HttpResponse.json(board, { status: 201 })
  }),
  http.put('/api/boards/:id', async ({ params, request }) => {
    const board = boards.find((b) => b.id === params.id)
    if (!board) return problem(404, 'Not Found')
    const { name } = (await request.json()) as { name: string }
    board.name = name
    return HttpResponse.json(board)
  }),
  http.delete('/api/boards/:id', ({ params }) => {
    const idx = boards.findIndex((b) => b.id === params.id)
    if (idx === -1) return problem(404, 'Not Found')
    boards.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('/api/boards/:id/members', ({ params }) =>
    HttpResponse.json(membersByBoard[params.id as string] ?? []),
  ),
  http.post('/api/boards/:id/members', async ({ params, request }) => {
    const boardId = params.id as string
    const { email } = (await request.json()) as { email: string }
    const list = membersByBoard[boardId] ?? []
    if (list.some((m) => m.email === email)) return problem(409, 'Conflict', 'Already a member.')
    const member: BoardMemberDto = {
      userId: crypto.randomUUID(),
      email,
      displayName: email.split('@')[0],
      role: 'Member',
    }
    list.push(member)
    membersByBoard[boardId] = list
    const board = boards.find((b) => b.id === boardId)
    if (board) board.memberCount = list.length
    return HttpResponse.json(member, { status: 201 })
  }),
  http.delete('/api/boards/:id/members/:userId', ({ params }) => {
    const boardId = params.id as string
    const list = membersByBoard[boardId] ?? []
    membersByBoard[boardId] = list.filter((m) => m.userId !== params.userId)
    const board = boards.find((b) => b.id === boardId)
    if (board) board.memberCount = membersByBoard[boardId].length
    return new HttpResponse(null, { status: 204 })
  }),

  // Categories
  http.get('/api/categories', () => HttpResponse.json(categories)),
  http.post('/api/categories', async ({ request }) => {
    const body = (await request.json()) as { name: string; icon?: string }
    if (categories.some((c) => c.name.toLowerCase() === body.name.toLowerCase())) {
      return problem(409, 'Conflict', 'A category with that name already exists.')
    }
    const category: CategoryDto = { id: nextCategoryId++, name: body.name, icon: body.icon, isDefault: false }
    categories.push(category)
    return HttpResponse.json(category, { status: 201 })
  }),
  http.put('/api/categories/:id', async ({ params, request }) => {
    const category = categories.find((c) => c.id === Number(params.id))
    if (!category) return problem(404, 'Not Found')
    const body = (await request.json()) as { name: string; icon?: string }
    category.name = body.name
    category.icon = body.icon
    return HttpResponse.json(category)
  }),
  http.delete('/api/categories/:id', ({ params }) => {
    const id = Number(params.id)
    if (expenses.some((e) => e.categoryId === id)) {
      return problem(409, 'Conflict', 'Category is in use by an expense.')
    }
    const idx = categories.findIndex((c) => c.id === id)
    if (idx === -1) return problem(404, 'Not Found')
    categories.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Expenses
  http.get('/api/boards/:boardId/expenses', ({ params, request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const categoryId = url.searchParams.get('categoryId')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '10')

    let items = boardExpenses(params.boardId as string)
    if (from) items = items.filter((e) => e.date >= from)
    if (to) items = items.filter((e) => e.date <= to)
    if (categoryId) items = items.filter((e) => e.categoryId === Number(categoryId))
    items = [...items].sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first

    const totalCount = items.length
    const start = (page - 1) * pageSize
    const pageItems = items.slice(start, start + pageSize)
    const response: PagedResponse<ExpenseDto> = { items: pageItems, page, pageSize, totalCount }
    return HttpResponse.json(response)
  }),
  http.post('/api/boards/:boardId/expenses', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string
      amount: number
      categoryId: number
      date: string
      description?: string
    }
    if (body.amount <= 0) return problem(400, 'Bad Request', 'Amount must be greater than 0.')
    const category = categories.find((c) => c.id === body.categoryId)
    if (!category) return problem(400, 'Bad Request', 'Unknown category.')
    const created: ExpenseDto = {
      id: crypto.randomUUID(),
      boardId: params.boardId as string,
      categoryId: body.categoryId,
      categoryName: category.name,
      name: body.name,
      amount: body.amount,
      date: body.date,
      description: body.description,
      createdByUserId: user.id,
      createdAt: new Date().toISOString(),
    }
    expenses.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put('/api/expenses/:id', async ({ params, request }) => {
    const expense = expenses.find((e) => e.id === params.id)
    if (!expense) return problem(404, 'Not Found')
    const body = (await request.json()) as {
      name: string
      amount: number
      categoryId: number
      date: string
      description?: string
    }
    const category = categories.find((c) => c.id === body.categoryId)
    Object.assign(expense, body, { categoryName: category?.name ?? expense.categoryName })
    return HttpResponse.json(expense)
  }),
  http.delete('/api/expenses/:id', ({ params }) => {
    const idx = expenses.findIndex((e) => e.id === params.id)
    if (idx === -1) return problem(404, 'Not Found')
    expenses.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Dashboard
  http.get('/api/boards/:boardId/dashboard/spend-by-category', ({ params, request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    let items = boardExpenses(params.boardId as string)
    if (from) items = items.filter((e) => e.date >= from)
    if (to) items = items.filter((e) => e.date <= to)
    const totals = new Map<number, { categoryName: string; total: number }>()
    for (const e of items) {
      const entry = totals.get(e.categoryId) ?? { categoryName: e.categoryName, total: 0 }
      entry.total += e.amount
      totals.set(e.categoryId, entry)
    }
    const result = [...totals.entries()]
      .map(([categoryId, v]) => ({ categoryId, categoryName: v.categoryName, total: v.total }))
      .sort((a, b) => b.total - a.total)
    return HttpResponse.json(result)
  }),
  http.get('/api/boards/:boardId/dashboard/spend-over-time', ({ params, request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const interval = url.searchParams.get('interval') ?? 'day'
    let items = boardExpenses(params.boardId as string)
    if (from) items = items.filter((e) => e.date >= from)
    if (to) items = items.filter((e) => e.date <= to)

    const bucket = (date: string) => {
      if (interval === 'month') return `${date.slice(0, 7)}-01`
      if (interval === 'week') {
        const d = new Date(date)
        const day = (d.getDay() + 6) % 7 // Monday=0
        d.setDate(d.getDate() - day)
        return iso(d)
      }
      return date
    }
    const totals = new Map<string, number>()
    for (const e of items) {
      const key = bucket(e.date)
      totals.set(key, (totals.get(key) ?? 0) + e.amount)
    }
    const result = [...totals.entries()]
      .map(([periodStart, total]) => ({ periodStart, total }))
      .sort((a, b) => (a.periodStart < b.periodStart ? -1 : 1))
    return HttpResponse.json(result)
  }),
]
