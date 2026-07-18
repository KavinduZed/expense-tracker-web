import { createContext } from 'react'
import type { UserDto } from '../types/api'

export interface AuthContextValue {
  user: UserDto | null
  // True while the app boots and tries to rehydrate a session from a stored refresh token.
  isInitializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  // Reflect a profile change (display name / currency) into the session immediately.
  updateUser: (user: UserDto) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
