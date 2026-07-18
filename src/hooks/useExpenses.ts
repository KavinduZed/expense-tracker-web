import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as expensesApi from '../api/expenses'
import type { ExpenseFilters, ExpenseInput } from '../api/expenses'

// All expense queries for a board share the ['expenses', boardId] prefix so a mutation
// can invalidate every filtered/paged view at once.
const boardExpensesKey = (boardId: string) => ['expenses', boardId] as const

export function useExpenses(boardId: string | null, filters: ExpenseFilters) {
  return useQuery({
    queryKey: [...boardExpensesKey(boardId ?? ''), filters],
    queryFn: () => expensesApi.listExpenses(boardId as string, filters),
    enabled: !!boardId,
  })
}

export function useCreateExpense(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseInput) => expensesApi.createExpense(boardId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardExpensesKey(boardId) }),
  })
}

export function useUpdateExpense(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ExpenseInput & { id: string }) =>
      expensesApi.updateExpense(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardExpensesKey(boardId) }),
  })
}

export function useDeleteExpense(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardExpensesKey(boardId) }),
  })
}
