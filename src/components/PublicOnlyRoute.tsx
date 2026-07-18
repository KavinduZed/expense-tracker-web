import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { FullPageSpinner } from './ProtectedRoute'

// Inverse of ProtectedRoute: keeps already-authenticated users out of the login/signup
// pages, sending them to the dashboard instead.
export default function PublicOnlyRoute() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
