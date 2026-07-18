import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Placeholder for Phase-1 screens not yet built (expenses, categories, profile, dashboard)
// and Phase-2 stubs. Replaced by the real page in that feature's stage.
export default function ComingSoon({ title }: { title: string }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">Coming in an upcoming stage.</Typography>
    </Box>
  )
}
