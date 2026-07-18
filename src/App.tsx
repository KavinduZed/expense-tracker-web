import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import BoardsPage from './pages/BoardsPage'
import CategoriesPage from './pages/CategoriesPage'
import ExpensesPage from './pages/ExpensesPage'
import ProfilePage from './pages/ProfilePage'
import ComingSoon from './pages/ComingSoon'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import AppLayout from './components/AppLayout'
import { CurrentBoardProvider } from './board/CurrentBoardProvider'

// The authenticated shell: current-board context wraps the sidebar/topbar layout.
function AuthedLayout() {
  return (
    <CurrentBoardProvider>
      <AppLayout />
    </CurrentBoardProvider>
  )
}

function App() {
  return (
    <Routes>
      {/* Auth pages — redirect to the app if already signed in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Everything below requires a session and renders inside the app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Phase 2 — backend not built yet */}
          <Route path="/scan" element={<ComingSoon title="Scan a bill" />} />
          <Route path="/forecast" element={<ComingSoon title="Forecast" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
