import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/useAuth'
import ColorModeToggle from '../components/ColorModeToggle'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <Container sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Expense Tracker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ColorModeToggle />
          <Button variant="outlined" onClick={() => void logout()}>
            Log out
          </Button>
        </Box>
      </Box>
      <Typography color="text.secondary">
        Signed in as {user?.displayName} ({user?.email}). Boards, expenses, and the dashboard
        are built in the upcoming stages.
      </Typography>
    </Container>
  )
}
