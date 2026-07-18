// Lightweight demo-mode config (no MSW imports) so any component can read it cheaply.
// Demo mode is toggled by VITE_ENABLE_MOCKS in a local .env file — see .env.example.

export const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true'
export const DEMO_EMAIL = 'demo@example.com'
export const DEMO_PASSWORD = 'Password123!'
