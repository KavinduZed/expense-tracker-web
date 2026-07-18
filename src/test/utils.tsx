import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../auth/AuthProvider'
import { ColorModeProvider } from '../theme/ColorModeProvider'
import type { UserDto } from '../types/api'

// Base URL configured for tests in vite.config.ts (test.env).
export const API_BASE = 'http://localhost:5000'

export const testUser: UserDto = {
  id: 'user-1',
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  currency: 'USD',
}

function AllProviders({ children, initialEntries }: { children: ReactNode; initialEntries: string[] }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <ColorModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ColorModeProvider>
  )
}

export function renderWithProviders(ui: ReactElement, initialEntries: string[] = ['/']) {
  return render(<AllProviders initialEntries={initialEntries}>{ui}</AllProviders>)
}
