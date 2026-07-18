// Client-side validation mirroring the backend rules (ASP.NET Identity defaults) so users
// get instant feedback. The server remains the authority — its 400 ProblemDetails still
// surface on the form if anything slips through.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | true {
  if (!value) return 'Email is required'
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address'
  return true
}

// Password: min 8 chars + at least one digit, one uppercase, one non-alphanumeric.
export function validatePassword(value: string): string | true {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (!/[0-9]/.test(value)) return 'Password must contain a number'
  if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter'
  if (!/[^a-zA-Z0-9]/.test(value)) return 'Password must contain a non-alphanumeric character'
  return true
}

export function validateDisplayName(value: string): string | true {
  if (!value.trim()) return 'Display name is required'
  return true
}
