# Expense Tracker — Web

Web frontend for the Expense Tracker app — a port of an existing mobile app
(originally Kotlin/Android, MVVM architecture). This repo contains the React
frontend only; it consumes a separate ASP.NET Core Web API backend
(`expense-tracker-backend`) over REST.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- MUI (Material UI) — form inputs, dialogs, dropdowns
- Recharts — dashboard charts
- React Router — navigation
- Vitest + Testing Library — unit/component tests
- MSW — API mocking in tests

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the `expense-tracker-backend` API (or a mock)

### Setup

```bash
npm install
cp .env.example .env
```

Set `VITE_API_BASE_URL` in `.env` to point at the backend API.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

Runs a TypeScript project build (`tsc -b`) followed by the Vite production build.

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── api/          # Single fetch wrapper (base URL, auth header, error handling)
├── components/   # Reusable, shared components
├── hooks/        # Custom hooks (data fetching, etc.)
├── mocks/        # MSW handlers/server for tests
├── pages/        # Page-level components
├── types/        # Shared types (mirror backend DTOs)
└── theme.ts      # MUI theme
```

## Pages

- Login / Sign Up (email+password and Google OAuth)
- Dashboard (donut chart: spend by category, line chart: spend over time)
- Add Expense (manual entry)
- Scan Bill (receipt upload → detected line items → save)
- Boards list / switcher
- Categories (list, add, edit, delete)
- Profile (edit profile, settings, currency, logout)

See [CLAUDE.md](CLAUDE.md) for full conventions and build order.
