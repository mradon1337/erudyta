import { createContext } from 'react'
import type { Progress } from '../lib/progress.ts'
import type { LoadStatus } from '../lib/storage.ts'

export interface ProgressContextValue {
  progress: Progress
  /** Jak poszło wczytanie przy starcie (`new`/`corrupt` → Powitanie, od Etapu 6). */
  loadStatus: LoadStatus
  /** `false`, gdy localStorage jest niedostępny albo zapis się nie udał — postęp żyje tylko w pamięci. */
  persistent: boolean
  /** Zmienia postęp funkcją z `src/lib/` i od razu go zapisuje. */
  updateProgress: (change: (progress: Progress) => Progress) => void
  /** Czyści cały postęp (Profil, Etap 6). */
  resetProgress: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
