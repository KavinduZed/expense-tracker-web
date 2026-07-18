import { createTheme, type Theme } from '@mui/material/styles'

export type ColorMode = 'light' | 'dark'

// The "Ledger" identity: evergreen primary on a ledger-paper neutral, with reserved
// red/green semantics for money out/in. Both modes share type, shape, and component shape;
// only the palette tokens differ.
const shared = {
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 720, letterSpacing: '-0.02em' },
    h2: { fontWeight: 680, letterSpacing: '-0.02em' },
    h3: { fontWeight: 680, letterSpacing: '-0.01em' },
    h4: { fontWeight: 680 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 650 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
}

const palettes = {
  light: {
    mode: 'light' as const,
    primary: { main: '#0f7a5a', dark: '#0b5e46', light: '#3a9a7c', contrastText: '#ffffff' },
    error: { main: '#c2483d' },
    success: { main: '#2e7d57' },
    warning: { main: '#b9822b' },
    background: { default: '#f5f7f4', paper: '#ffffff' },
    text: { primary: '#14201b', secondary: '#5c6b64' },
    divider: '#e2e7e1',
  },
  dark: {
    mode: 'dark' as const,
    primary: { main: '#34c08d', dark: '#4bd29e', light: '#5fd2a8', contrastText: '#08130e' },
    error: { main: '#e8746a' },
    success: { main: '#4cb583' },
    warning: { main: '#d6a34e' },
    background: { default: '#0d1411', paper: '#151f1b' },
    text: { primary: '#e8ede9', secondary: '#9aa9a1' },
    divider: '#26322d',
  },
}

export function createAppTheme(mode: ColorMode): Theme {
  return createTheme({
    ...shared,
    palette: palettes[mode],
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10, paddingInline: 18 } },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          // Money and dates line up in columns.
          '.num': { fontVariantNumeric: 'tabular-nums' },
        },
      },
    },
  })
}

// Default light theme (used by tests and as the initial render).
export const theme = createAppTheme('light')
