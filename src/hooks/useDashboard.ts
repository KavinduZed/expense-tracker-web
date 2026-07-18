import { useQuery } from '@tanstack/react-query'
import * as dashboardApi from '../api/dashboard'
import type { TimeInterval } from '../api/dashboard'

interface DateRange {
  from?: string
  to?: string
}

export function useSpendByCategory(boardId: string | null, range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', boardId, 'spend-by-category', range],
    queryFn: () => dashboardApi.getSpendByCategory(boardId as string, range),
    enabled: !!boardId,
  })
}

export function useSpendOverTime(
  boardId: string | null,
  range: DateRange,
  interval: TimeInterval,
) {
  return useQuery({
    queryKey: ['dashboard', boardId, 'spend-over-time', range, interval],
    queryFn: () => dashboardApi.getSpendOverTime(boardId as string, range, interval),
    enabled: !!boardId,
  })
}
