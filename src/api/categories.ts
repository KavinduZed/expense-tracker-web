import { apiFetch } from './client'
import type { CategoryDto } from '../types/api'

// Categories are global (not board-scoped). Seven are seeded (isDefault=true).
// Deleting a category that's in use by an expense returns 409; a duplicate name is 409.

export function listCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/api/categories')
}

export function createCategory(input: { name: string; icon?: string }): Promise<CategoryDto> {
  return apiFetch<CategoryDto>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCategory(
  id: number,
  input: { name: string; icon?: string },
): Promise<CategoryDto> {
  return apiFetch<CategoryDto>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' })
}
