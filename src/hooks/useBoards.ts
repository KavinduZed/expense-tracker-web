import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as boardsApi from '../api/boards'

const boardsKey = ['boards'] as const
const membersKey = (boardId: string) => ['boards', boardId, 'members'] as const

export function useBoards() {
  return useQuery({ queryKey: boardsKey, queryFn: boardsApi.listBoards })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => boardsApi.createBoard(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardsKey }),
  })
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => boardsApi.updateBoard(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardsKey }),
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => boardsApi.deleteBoard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: boardsKey }),
  })
}

export function useBoardMembers(boardId: string | null) {
  return useQuery({
    queryKey: membersKey(boardId ?? ''),
    queryFn: () => boardsApi.listMembers(boardId as string),
    enabled: !!boardId,
  })
}

export function useAddMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => boardsApi.addMember(boardId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(boardId) })
      queryClient.invalidateQueries({ queryKey: boardsKey }) // memberCount changed
    },
  })
}

export function useRemoveMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => boardsApi.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(boardId) })
      queryClient.invalidateQueries({ queryKey: boardsKey })
    },
  })
}
