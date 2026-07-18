import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { UserDto } from '../types/api'
import * as authApi from '../api/auth'
import { clearTokens, getRefreshToken, setTokens } from './tokenStore'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const queryClient = useQueryClient()

  // On boot, if a refresh token survived in localStorage, rehydrate the session.
  // GET /me has no access token yet, so it 401s and the client's interceptor refreshes
  // and retries transparently — if that fails, the tokens are cleared and we show login.
  useEffect(() => {
    let active = true
    async function rehydrate() {
      if (!getRefreshToken()) {
        setIsInitializing(false)
        return
      }
      try {
        const me = await authApi.getMe()
        if (active) setUser(me)
      } catch {
        clearTokens()
      } finally {
        if (active) setIsInitializing(false)
      }
    }
    void rehydrate()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setTokens(res.accessToken, res.refreshToken)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await authApi.register({ email, password, displayName })
      setTokens(res.accessToken, res.refreshToken)
      setUser(res.user)
    },
    [],
  )

  const updateUser = useCallback((next: UserDto) => setUser(next), [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // Best effort — clear the local session regardless of the server response.
    }
    clearTokens()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
