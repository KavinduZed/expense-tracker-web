import { apiFetch } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../types/api'

// The auth endpoints that establish or rotate a session skip the auth interceptor
// (skipAuth) so a failure surfaces as a real error instead of triggering a refresh loop.

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  })
}

export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function getMe(): Promise<UserDto> {
  return apiFetch<UserDto>('/api/auth/me')
}
