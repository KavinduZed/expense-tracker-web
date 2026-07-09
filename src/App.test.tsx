import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import App from './App'
import { theme } from './theme'

test('renders the home page', () => {
  render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>,
  )

  expect(screen.getByRole('heading', { name: /expense tracker/i })).toBeInTheDocument()
})
