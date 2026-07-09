# Expense Tracker — Frontend

## Project Context
This is a web port of a mobile expense tracker app (originally Kotlin/Android, MVVM 
architecture). This repo is the React frontend only. It consumes a separate ASP.NET Core 
Web API backend (repo: `expense-tracker-backend`) over REST.

## Stack
- React + TypeScript
- Vite (build tool)
- Tailwind CSS for styling
- MUI (Material UI) for form inputs, dialogs, dropdowns — switched from shadcn/ui during initial
  scaffold because the shadcn CLI (`init`, v4.13.0 and v4.12.0) reliably failed with a
  "Could not load the workspace config" error on this project setup; not investigated further
- Recharts for the dashboard charts (donut: spend by category, line: spend over time)
- React Router for navigation

## API Integration
- Backend base URL comes from an environment variable (VITE_API_BASE_URL), never hardcoded
- All API calls go through a single /src/api/client.ts wrapper (handles base URL, auth 
  header injection, error handling) — don't call fetch() directly in components
- JWT is stored in memory / httpOnly cookie pattern (confirm approach before implementing 
  — avoid localStorage for the token if possible)

## Pages / Screens (mirrors the original mobile app)
- Login / Sign Up (email+password and Google OAuth)
- Dashboard (default board selected, donut chart + spending-over-time chart)
- Add Expense (manual entry form: name, amount, category, date, description)
- Scan Bill (upload/capture receipt image -> review detected line items -> save)
- Boards list / switcher
- Categories (list, add, edit, delete — global, not per-board)
- Profile (edit profile, settings, currency, logout)

## Conventions
- Functional components + hooks only, no class components
- Component files in /src/components, page-level components in /src/pages
- Shared types (matching backend DTOs) in /src/types
- Keep components small; extract data-fetching into custom hooks (e.g., useExpenses, 
  useBoards)
- Run `npm run build` after significant changes to confirm no TypeScript errors

## Build Order (for reference)
1. Project scaffold + routing + Tailwind setup
2. Login / Sign Up pages wired to backend auth
3. Boards + Categories pages
4. Add Expense (manual entry)
5. Dashboard with charts
6. Scan Bill (OCR) flow
7. Forecasting view

## Testing
- xUnit in a separate ExpenseTracker.Tests project, referencing the main API project
- Use Moq for mocking dependencies, FluentAssertions for assertions
- Use EF Core InMemory provider for tests touching the DbContext
- Test the Services layer thoroughly; controllers only need integration tests for critical 
  paths (auth, expense creation) using WebApplicationFactory
- Every new service method should have a corresponding test before the task is considered done
- Run `dotnet test` after adding/changing tests to confirm they pass