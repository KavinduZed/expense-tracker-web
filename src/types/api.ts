// Types mirroring the backend API contract (expense-tracker-backend/docs/api-contract.md).
// Source of truth for every request/response body this frontend exchanges with the API.

// ---- Auth ----
export interface UserDto {
  id: string
  email: string
  displayName: string
  currency: string
}

export interface AuthResponse {
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  user: UserDto
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ---- Boards ----
export type BoardRole = 'Owner' | 'Member'

export interface BoardDto {
  id: string
  name: string
  ownerId: string
  createdAt: string
  role: BoardRole
  memberCount: number
}

export interface BoardMemberDto {
  userId: string
  email: string
  displayName: string
  role: BoardRole
}

// ---- Categories ----
export interface CategoryDto {
  id: number
  name: string
  icon?: string
  isDefault: boolean
}

// ---- Expenses ----
export interface ExpenseDto {
  id: string
  boardId: string
  categoryId: number
  categoryName: string
  name: string
  amount: number
  date: string // YYYY-MM-DD
  description?: string
  createdByUserId: string
  createdAt: string
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

// ---- Dashboard ----
export interface CategorySpendDto {
  categoryId: number
  categoryName: string
  total: number
}

export interface TimePointDto {
  periodStart: string
  total: number
}

// ---- Errors ----
// RFC-7807 ProblemDetails returned by the API on 4xx/5xx.
export interface ProblemDetails {
  status?: number
  title?: string
  detail?: string
  instance?: string
}
