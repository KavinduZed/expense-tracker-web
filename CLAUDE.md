# Expense Tracker — Frontend

## Project Context
This is a web port of a mobile expense tracker app (originally Kotlin/Android, MVVM 
architecture). This repo is the React frontend only. It consumes a separate ASP.NET Core 
Web API backend (repo: `expense-tracker-backend`) over REST.

**Backend status:** Phase 1 is built and on `main`. The full API contract (endpoints, 
DTO shapes, auth flow, error format) is documented in 
`../expense-tracker-backend/docs/api-contract.md` — READ THIS FIRST; it is the source of 
truth for everything this frontend talks to. Match your `/src/types` to those DTOs.

## Stack
- React + TypeScript
- Vite (build tool)
- Tailwind CSS for styling
- MUI (Material UI) for form inputs, dialogs, dropdowns — switched from shadcn/ui during initial
  scaffold because the shadcn CLI (`init`, v4.13.0 and v4.12.0) reliably failed with a
  "Could not load the workspace config" error on this project setup; not investigated further
- Recharts for the dashboard charts (donut: spend by category, line: spend over time)
- React Router for navigation
- TanStack Query (`@tanstack/react-query`) for server state — data fetching, caching, and
  refetch-after-mutation; wraps the `client.ts` fetch layer (don't hand-roll loading/caching)
- react-hook-form for form state + validation (auth forms, expense form, etc.)

## API Integration
- Backend base URL comes from an environment variable (VITE_API_BASE_URL), never hardcoded.
  Backend already allows CORS from http://localhost:5173 (Vite default).
- All API calls go through a single /src/api/client.ts wrapper (handles base URL, auth 
  header injection, error handling) — don't call fetch() directly in components
- Auth model (as built): backend returns an **access token** (send as `Authorization: 
  Bearer <token>`, ~15 min) AND a **refresh token**, both in the JSON response body — the 
  backend does NOT set httpOnly cookies, so the httpOnly option is off the table. Decide 
  token storage (e.g. access token in memory; refresh token in memory vs localStorage — 
  localStorage survives reload but is XSS-exposed) and implement a `401 → POST /api/auth/refresh 
  → retry` interceptor in client.ts. Refresh tokens are single-use (rotated), so store the 
  new one returned by each refresh.
- **Decision (Stage 1, implemented):** access token in memory (`src/auth/tokenStore.ts`),
  refresh token in localStorage so sessions survive reload; single-flight `401 → refresh →
  retry` interceptor lives in `client.ts`. Session state is exposed via `AuthProvider` /
  `useAuth`, with `ProtectedRoute` / `PublicOnlyRoute` guards.
- Errors come back as RFC-7807 ProblemDetails `{ status, title, detail, instance }` — the 
  client wrapper should surface `detail`/`title` for user-facing messages.

## Pages / Screens (mirrors the original mobile app)
Backend Phase 1 supports everything below EXCEPT the items marked (Phase 2) — the backend
endpoints for those don't exist yet, so build them as stubs/"coming soon" or defer.
- Login / Sign Up (email+password now; **Google OAuth = Phase 2**)
- Dashboard (default "Personal" board is auto-created on registration; donut = spend-by-category,
  line = spend-over-time)
- Add Expense (manual entry form: name, amount, category, date, description)
- Scan Bill (upload receipt -> review line items -> save) — **Phase 2 (OCR backend not built)**
- Boards list / switcher (+ share by member email)
- Categories (list, add, edit, delete — global, not per-board; 7 seeded defaults)
- Profile (edit display name + currency, logout)
- Forecast view — **Phase 2 (forecasting backend not built)**

## Conventions
- Functional components + hooks only, no class components
- Component files in /src/components, page-level components in /src/pages
- Shared types (matching backend DTOs) in /src/types
- Keep components small; extract data-fetching into custom hooks (e.g., useExpenses, 
  useBoards)
- Run `npm run build` after significant changes to confirm no TypeScript errors

## Build Order (for reference)
1. Project scaffold + routing + Tailwind setup
2. Auth: Login / Sign Up (email+password) + client.ts token/refresh interceptor + protected routes
3. Boards + Categories pages
4. Add Expense (manual entry)
5. Dashboard with charts (Recharts donut + line, fed by the /dashboard endpoints)
6. Scan Bill (OCR) flow — blocked on backend Phase 2
7. Forecasting view — blocked on backend Phase 2
(Google OAuth login also blocked on backend Phase 2; ship email/password first.)

## Testing
- Vitest + React Testing Library for component and hook tests
- Use MSW to mock API calls in tests — never hit the real backend in unit tests
- Co-locate test files next to the component/hook they test (Component.test.tsx)
- Test custom hooks (useExpenses, useBoards) and form validation logic thoroughly
- Don't write tests for MUI primitives themselves, only your usage of them
- Run `npm run test` after adding/changing tests to confirm they pass