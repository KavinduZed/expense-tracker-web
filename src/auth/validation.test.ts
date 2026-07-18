import { describe, expect, it } from 'vitest'
import { validateEmail, validatePassword, validateDisplayName } from './validation'

describe('validateEmail', () => {
  it('rejects empty and malformed emails', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('not-an-email')).not.toBe(true)
    expect(validateEmail('missing@domain')).not.toBe(true)
  })

  it('accepts a well-formed email', () => {
    expect(validateEmail('ada@example.com')).toBe(true)
  })
})

describe('validatePassword', () => {
  it('enforces each backend rule', () => {
    expect(validatePassword('short1A!')).toBe(true) // 8 chars, all classes
    expect(validatePassword('Sh1!')).not.toBe(true) // too short
    expect(validatePassword('lowercase1!')).not.toBe(true) // no uppercase
    expect(validatePassword('NoNumber!')).not.toBe(true) // no digit
    expect(validatePassword('NoSymbol1')).not.toBe(true) // no symbol
  })
})

describe('validateDisplayName', () => {
  it('requires non-whitespace content', () => {
    expect(validateDisplayName('   ')).not.toBe(true)
    expect(validateDisplayName('Ada')).toBe(true)
  })
})
