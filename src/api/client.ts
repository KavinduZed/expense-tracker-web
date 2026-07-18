import type { AuthResponse, ProblemDetails } from '../types/api'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStore'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  detail?: string

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export interface RequestOptions extends RequestInit {
  // Skip Authorization header + the 401->refresh interceptor.
  // Used by the auth endpoints themselves (login/register/refresh).
  skipAuth?: boolean
  // Internal: marks a request already retried after a refresh, so we never loop.
  _retried?: boolean
}

// Single-flight refresh: concurrent 401s share one in-flight refresh call instead of
// each firing their own (which would race and invalidate each other's rotated tokens).
let refreshPromise: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return false
      try {
        const res = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          clearTokens()
          return false
        }
        const data = (await res.json()) as AuthResponse
        setTokens(data.accessToken, data.refreshToken)
        return true
      } catch {
        clearTokens()
        return false
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail: string | undefined
  let title: string | undefined
  try {
    const problem = (await res.json()) as ProblemDetails
    detail = problem.detail
    title = problem.title
  } catch {
    // Non-JSON body — fall back to the status text.
  }
  return new ApiError(res.status, detail ?? title ?? res.statusText, detail)
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, _retried, headers, ...init } = options
  const accessToken = getAccessToken()

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true })
    }
    clearTokens()
    throw await toApiError(res)
  }

  if (!res.ok) {
    throw await toApiError(res)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
