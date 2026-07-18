import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBoards } from '../hooks/useBoards'
import { CurrentBoardContext } from './CurrentBoardContext'

const STORAGE_KEY = 'et_current_board'

// Tracks which board the user is looking at. Persisted so a reload keeps you on the same
// board. The selection is validated against the fetched list — a stale id (e.g. a board
// you were removed from) falls back to the first available board.
export function CurrentBoardProvider({ children }: { children: ReactNode }) {
  const { data: boards, isLoading, isError } = useBoards()
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const setCurrentBoardId = useCallback((id: string) => {
    setSelectedId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  // Once boards load, make sure the selection points at a board we can actually see.
  useEffect(() => {
    if (!boards || boards.length === 0) return
    const stillValid = selectedId && boards.some((b) => b.id === selectedId)
    if (!stillValid) {
      setSelectedId(boards[0].id)
      localStorage.setItem(STORAGE_KEY, boards[0].id)
    }
  }, [boards, selectedId])

  const value = useMemo(() => {
    const list = boards ?? []
    const currentBoard = list.find((b) => b.id === selectedId) ?? null
    return {
      boards: list,
      currentBoard,
      currentBoardId: currentBoard?.id ?? null,
      setCurrentBoardId,
      isLoading,
      isError,
    }
  }, [boards, selectedId, setCurrentBoardId, isLoading, isError])

  return <CurrentBoardContext.Provider value={value}>{children}</CurrentBoardContext.Provider>
}
