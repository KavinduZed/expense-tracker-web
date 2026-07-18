import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../auth/AuthProvider'
import { theme } from '../theme'
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
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export function renderWithProviders(ui: ReactElement, initialEntries: string[] = ['/']) {
  return render(<AllProviders initialEntries={initialEntries}>{ui}</AllProviders>)
}
