---
name: expense-tracker-frontend
description: >-
  Best-practice workflow and conventions for building the Expense Tracker React
  frontend (expense-tracker-web). Use this whenever you work in this repo —
  adding a page, component, hook, or API call; wiring auth or data fetching;
  building one of the staged features (boards, categories, expenses, dashboard,
  profile); or styling anything. Trigger even when the request just says "build
  the expenses page", "add a hook for boards", or "hook this up to the API"
  without naming conventions — this skill carries the stack decisions, the API
  contract, the design system, and the definition of done so each stage lands
  consistently instead of re-deciding every time.
---

# Expense Tracker — Frontend

A web port of a Kotlin/Android expense tracker, and a portfolio piece meant to show
senior-level work. It consumes the sibling ASP.NET Core API (`expense-tracker-backend`)
over REST. Consistency across stages is the whole point — recruiters read this code.

## Where the truth lives — read before building

Don't guess at shapes or endpoints; they're already pinned down.

- **`CLAUDE.md`** (repo root) — stack, conventions, page list, build order. The baseline.
- **`../expense-tracker-backend/docs/api-contract.md`** — every endpoint, DTO shape, auth
  flow, and error format. This is the source of truth for anything the FE talks to.
  Match `src/types/api.ts` to it exactly.

If a requirement seems to conflict with these, surface it rather than silently diverging.

## Stack decisions already made (don't relitigate)

These were chosen deliberately — build with them, not around them.

- **React + TypeScript + Vite**, **MUI** for components, **Tailwind** available for layout,
  **Recharts** for the dashboard, **React Router** for navigation.
- **TanStack Query** (`@tanstack/react-query`) owns all server state — fetching, caching,
  and refetch-after-mutation. Don't hand-roll loading/error/caching in `useState`.
- **react-hook-form** owns form state + validation (auth forms, expense form, etc.).
- **Auth tokens**: access token in memory (`src/auth/tokenStore.ts`), refresh token in
  `localStorage` so sessions survive reload. A single-flight `401 → refresh → retry`
  interceptor lives in `src/api/client.ts`. Refresh tokens are single-use (rotated) —
  always store the new one each refresh.
- **Theme**: the "Ledger" design system in `src/theme.ts` (`createAppTheme(mode)`), with a
  light/dark switch via `ColorModeProvider` / `useColorMode` / `ColorModeToggle`. New
  screens inherit it automatically through MUI — style through theme tokens
  (`palette.primary`, `text.secondary`, semantic `error`/`success` for money out/in), not
  hardcoded hex. Use the `.num` class (tabular figures) wherever money or dates line up.

## How to build a stage

The staged build order is auth → boards/app-shell → categories → expenses → dashboard →
profile. Each stage is one `feat-` branch and should be independently demoable. Work
outside-in from the data:

1. **Types** — add/confirm the DTOs in `src/types/api.ts` against the contract.
2. **API layer** — thin functions in `src/api/<resource>.ts` that call `apiFetch` from
   `client.ts`. Never call `fetch` directly in a component. Let the interceptor handle 401s.
3. **Data hooks** — wrap the API functions in TanStack Query: `useQuery` for reads,
   `useMutation` (with `queryClient.invalidateQueries`) for writes. Co-locate as
   `src/hooks/use<Resource>.ts` (e.g. `useBoards`, `useExpenses`).
4. **UI** — small components in `src/components`, page-level in `src/pages`. Forms use
   react-hook-form with validation mirroring the backend rules so users get instant
   feedback; server `ProblemDetails` (400/401/409) still surface as inline errors.
5. **States** — every screen handles loading, empty, and error explicitly. Errors show the
   `detail`/`title` from the `ApiError`, not a generic message.
6. **Tests** — see below.
7. **Verify** — see the definition of done.

## Patterns to follow

**API + errors.** `client.ts` throws a typed `ApiError` carrying `status` + `detail`. Catch
it in mutations/forms and map known statuses to human copy (401 → "Incorrect email or
password", 409 → "…already exists"), falling back to `err.message`.

**Board scoping.** Expenses and the dashboard are board-scoped (`/api/boards/{id}/...`);
categories are global. The currently-selected board is app state — thread the board id
through the relevant hooks, and remember a non-member gets a 404 by design.

**Money & dates.** Amounts are decimals (> 0); dates are `YYYY-MM-DD` (`DateOnly`). Keep
them as strings matching the contract; format for display only.

**Phase 2 stubs.** Google OAuth, Scan Bill (OCR), and Forecast have no backend yet. Build
them as visible "coming soon" stubs, not dead ends — don't wire them to nonexistent
endpoints.

## Testing (required before a stage is done)

- **Vitest + React Testing Library**; **MSW** mocks every API call — never hit the real
  backend in unit tests. Handlers use the absolute `API_BASE` from `src/test/utils.tsx`.
- Co-locate tests as `Thing.test.tsx` next to what they test.
- Test the things most likely to break: custom hooks (query/mutation + cache invalidation),
  form validation, and the auth/interceptor paths. Don't test MUI primitives themselves —
  only your usage of them.
- Reuse `renderWithProviders` from `src/test/utils.tsx` so components get the theme, query
  client, auth, and router context.

## Branch & commit workflow

- One `feat-<name>` branch per stage (`feat-boards`, `feat-expenses`, …), stacked in order.
- **Commit** each finished task on its branch. **Never `git push`** — the user does all
  push / PR / merge themselves.
- Commit message style: `feat: <short description>`. **Do not** append a
  `Co-Authored-By: Claude` trailer — authorship stays clean for the portfolio.
- An external editor/Git GUI sometimes switches branches mid-session; check
  `git rev-parse --abbrev-ref HEAD` before committing.

## Definition of done

A stage isn't finished until all of these pass — run them, don't assume:

- [ ] `src/types` match the API contract for the touched resources
- [ ] All network access goes through `client.ts`; server state via TanStack Query
- [ ] Loading / empty / error states handled on every new screen
- [ ] Tests added (hooks, validation, critical paths) and `npm run test` is green
- [ ] `npx tsc -b` clean, `npm run build` succeeds, `npm run lint` clean
- [ ] Verified in the running app (`npm run dev`), not just in tests
