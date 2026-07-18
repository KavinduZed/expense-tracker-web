import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/useAuth'
import { useCurrentBoard } from '../board/useCurrentBoard'

export default function Home() {
  const { user } = useAuth()
  const { currentBoard } = useCurrentBoard()

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Welcome back, {user?.displayName}.{' '}
        {currentBoard
          ? `Viewing "${currentBoard.name}". Charts and recent expenses land in the dashboard stage.`
          : 'Create a board to start tracking expenses.'}
      </Typography>
    </div>
  )
}
