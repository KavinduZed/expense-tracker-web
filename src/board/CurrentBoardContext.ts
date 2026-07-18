import { createContext } from 'react'
import type { BoardDto } from '../types/api'

export interface CurrentBoardContextValue {
  boards: BoardDto[]
  currentBoard: BoardDto | null
  currentBoardId: string | null
  setCurrentBoardId: (id: string) => void
  isLoading: boolean
  isError: boolean
}

export const CurrentBoardContext = createContext<CurrentBoardContextValue | null>(null)
