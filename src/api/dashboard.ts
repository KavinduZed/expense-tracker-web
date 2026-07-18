import { apiFetch } from './client'
import type { CategorySpendDto, TimePointDto } from '../types/api'

// Board-scoped aggregations for the dashboard charts. See api-contract.md.
export type TimeInterval = 'day' | 'week' | 'month'

interface DateRange {
  from?: string
  to?: string
}

function rangeQuery(range: DateRange, extra?: Record<string, string>): string {
  const params = new URLSearchParams()
  if (range.from) params.set('from', range.from)
  if (range.to) params.set('to', range.to)
  for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function getSpendByCategory(boardId: string, range: DateRange): Promise<CategorySpendDto[]> {
  return apiFetch<CategorySpendDto[]>(
    `/api/boards/${boardId}/dashboard/spend-by-category${rangeQuery(range)}`,
  )
}

export function getSpendOverTime(
  boardId: string,
  range: DateRange,
  interval: TimeInterval,
): Promise<TimePointDto[]> {
  return apiFetch<TimePointDto[]>(
    `/api/boards/${boardId}/dashboard/spend-over-time${rangeQuery(range, { interval })}`,
  )
}
