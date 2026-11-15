import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { createProgress, type Progress } from '../lib/progress.ts'
import { browserStore, clearProgress, loadProgress, saveProgress, type KeyValueStore } from '../lib/storage.ts'
import { ProgressContext, type ProgressContextValue } from './progressContext.ts'

interface Props {
  children: ReactNode
  /** Magazyn danych; domyślnie localStorage (o ile działa). */
  store?: KeyValueStore | null
}

export function ProgressProvider({ children, store }: Props) {
  const [initial] = useState(() => {
    const s = store === undefined ? browserStore() : store
    return { store: s, ...loadProgress(s) }
  })
  const [progress, setProgress] = useState<Progress>(initial.progress)
  const [persistent, setPersistent] = useState(initial.status !== 'unavailable')
  // Bieżący postęp poza cyklem renderowania: kilka zmian w jednym zdarzeniu nie gubi się nawzajem,
  // a zapis dzieje się od razu, a nie dopiero po renderze.
  const current = useRef(initial.progress)

  const commit = useCallback(
    (next: Progress) => {
      current.current = next
      setProgress(next)
      if (!saveProgress(initial.store, next)) setPersistent(false)
    },
    [initial.store],
  )

  const updateProgress = useCallback(
    (change: (p: Progress) => Progress) => {
      const next = change(current.current)
      if (next !== current.current) commit(next)
    },
    [commit],
  )

  const resetProgress = useCallback(() => {
    clearProgress(initial.store)
    const fresh = createProgress()
    current.current = fresh
    setProgress(fresh)
  }, [initial.store])

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, loadStatus: initial.status, persistent, updateProgress, resetProgress }),
    [progress, initial.status, persistent, updateProgress, resetProgress],
  )

  return <ProgressContext value={value}>{children}</ProgressContext>
}
