import { createContext } from 'react'
import type { ColorMode } from '../theme'

export interface ColorModeContextValue {
  mode: ColorMode
  toggle: () => void
  setMode: (mode: ColorMode) => void
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null)
