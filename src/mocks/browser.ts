import { setupWorker } from 'msw/browser'
import { browserHandlers } from './browserHandlers'

// The MSW worker used in demo mode (VITE_ENABLE_MOCKS=true). Started from main.tsx
// before the app renders; see public/mockServiceWorker.js.
export const worker = setupWorker(...browserHandlers)
