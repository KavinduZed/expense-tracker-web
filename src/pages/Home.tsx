import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/useAuth'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <Container sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Expense Tracker
        </Typography>
        <Button variant="outlined" onClick={() => void logout()}>
          Log out
        </Button>
      </Box>
      <Typography color="text.secondary">
        Signed in as {user?.displayName} ({user?.email}). Boards, expenses, and the dashboard
        are built in the upcoming stages.
      </Typography>
    </Container>
  )
}
