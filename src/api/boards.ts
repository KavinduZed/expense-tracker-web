import { apiFetch } from './client'
import type { BoardDto, BoardMemberDto } from '../types/api'

// Boards — shared workspaces. Expenses and the dashboard are scoped to a board;
// see api-contract.md. A non-member gets a 404 by design (existence isn't leaked).

export function listBoards(): Promise<BoardDto[]> {
  return apiFetch<BoardDto[]>('/api/boards')
}

export function getBoard(id: string): Promise<BoardDto> {
  return apiFetch<BoardDto>(`/api/boards/${id}`)
}

export function createBoard(name: string): Promise<BoardDto> {
  return apiFetch<BoardDto>('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateBoard(id: string, name: string): Promise<BoardDto> {
  return apiFetch<BoardDto>(`/api/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export function deleteBoard(id: string): Promise<void> {
  return apiFetch<void>(`/api/boards/${id}`, { method: 'DELETE' })
}

export function listMembers(boardId: string): Promise<BoardMemberDto[]> {
  return apiFetch<BoardMemberDto[]>(`/api/boards/${boardId}/members`)
}

export function addMember(boardId: string, email: string): Promise<BoardMemberDto> {
  return apiFetch<BoardMemberDto>(`/api/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function removeMember(boardId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' })
}
