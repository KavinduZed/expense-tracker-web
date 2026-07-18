import { Navigate, Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useAuth } from '../auth/useAuth'

// Gate for authenticated-only routes. While the session is still rehydrating on boot we
// show a spinner rather than flashing the login page and then redirecting back.
export default function ProtectedRoute() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function FullPageSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  )
}
