import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Home() {
  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Expense Tracker
      </Typography>
      <Typography color="text.secondary">
        Project scaffold complete. Pages will be built out in upcoming steps.
      </Typography>
    </Container>
  )
}
