import { useContext } from 'react'
import { CurrentBoardContext } from './CurrentBoardContext'

export function useCurrentBoard() {
  const ctx = useContext(CurrentBoardContext)
  if (!ctx) {
    throw new Error('useCurrentBoard must be used within a CurrentBoardProvider')
  }
  return ctx
}
