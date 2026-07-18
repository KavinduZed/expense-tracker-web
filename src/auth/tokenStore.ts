// Token persistence strategy (decided during Stage 1 brainstorming):
//   - access token  -> in memory only (cleared on tab close; never touches storage)
//   - refresh token -> localStorage, so sessions survive a reload
// The refresh token in localStorage is XSS-exposed; that is the accepted tradeoff for a
// portfolio app that has no httpOnly-cookie option (the backend returns tokens in the body).

const REFRESH_TOKEN_KEY = 'et_refresh_token'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function setTokens(access: string, refresh: string): void {
  setAccessToken(access)
  setRefreshToken(refresh)
}

export function clearTokens(): void {
  setAccessToken(null)
  setRefreshToken(null)
}
