import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { renderWithProviders } from '../test/utils'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('color mode toggle', () => {
  it('defaults to light and persists a switch to dark', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />, ['/login'])

    // Starts in light mode -> the toggle offers to switch to dark.
    const toggle = await screen.findByRole('button', { name: /switch to dark mode/i })
    await user.click(toggle)

    expect(localStorage.getItem('et_color_mode')).toBe('dark')
    // Now it offers the way back to light.
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
  })

  it('restores the stored mode on next load', async () => {
    localStorage.setItem('et_color_mode', 'dark')
    renderWithProviders(<App />, ['/login'])
    expect(
      await screen.findByRole('button', { name: /switch to light mode/i }),
    ).toBeInTheDocument()
  })
})
