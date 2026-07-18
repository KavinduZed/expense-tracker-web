import { apiFetch } from './client'
import type { UserDto } from '../types/api'

export function getProfile(): Promise<UserDto> {
  return apiFetch<UserDto>('/api/profile')
}

export function updateProfile(input: { displayName: string; currency: string }): Promise<UserDto> {
  return apiFetch<UserDto>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
