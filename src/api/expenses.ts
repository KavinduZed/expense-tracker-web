import { apiFetch } from './client'
import type { ExpenseDto, PagedResponse } from '../types/api'

// Expenses are board-scoped for listing/creating; individual expenses are addressed by id.
// See api-contract.md. List is newest-first and paged; amount must be > 0.

export interface ExpenseFilters {
  from?: string // YYYY-MM-DD
  to?: string
  categoryId?: number
  page?: number
  pageSize?: number
}

export interface ExpenseInput {
  name: string
  amount: number
  categoryId: number
  date: string // YYYY-MM-DD
  description?: string
}

function toQuery(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.categoryId != null) params.set('categoryId', String(filters.categoryId))
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.pageSize != null) params.set('pageSize', String(filters.pageSize))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function listExpenses(
  boardId: string,
  filters: ExpenseFilters = {},
): Promise<PagedResponse<ExpenseDto>> {
  return apiFetch<PagedResponse<ExpenseDto>>(
    `/api/boards/${boardId}/expenses${toQuery(filters)}`,
  )
}

export function createExpense(boardId: string, input: ExpenseInput): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>(`/api/boards/${boardId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateExpense(id: string, input: ExpenseInput): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>(`/api/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' })
}
