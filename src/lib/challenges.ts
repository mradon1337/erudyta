import type { ChallengeRecord, Progress } from './progress.ts'
import { CHALLENGES_MAX } from './progress.ts'

export type Outcome = 'win' | 'draw' | 'lose'

/** Wyzwanie, w które gramy: ziarno i wynik nadawcy (pusty, gdy to nasze nowe wyzwanie). */
export interface ChallengeInfo {
  seed: string
  /** Imię nadawcy ('' — brak imienia albo własne wyzwanie). */
  from: string
  theirs: boolean[]
}

export const score = (results: readonly boolean[]): number => results.filter(Boolean).length

/** Wynik porównania; `null`, gdy nie ma z kim porównać (własne wyzwanie). */
export function outcome(mine: readonly boolean[], theirs: readonly boolean[]): Outcome | null {
  if (theirs.length === 0) return null
  const a = score(mine)
  const b = score(theirs)
  return a > b ? 'win' : a < b ? 'lose' : 'draw'
}

/** Ziarno Wyzwania dnia → dzień 'YYYY-MM-DD' (dla innych ziaren `null`). */
export function dailyDayOf(seed: string): string | null {
  const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(seed)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

/**
 * Własny wynik dla ziarna, jeśli ta runda była już rozegrana: z historii wyzwań albo z Wyzwania dnia
 * (link z Wyzwaniem dnia ma ziarno 'd' + data). `null` — jeszcze nie grane.
 */
export function playedResults(progress: Progress, seed: string): boolean[] | null {
  const record = progress.challenges.find((c) => c.seed === seed)
  if (record) return record.mine
  const day = dailyDayOf(seed)
  return day ? (progress.daily[day]?.results ?? null) : null
}

/** Dopisuje rozegrane wyzwanie na początek historii (bez duplikatów ziarna, najwyżej `CHALLENGES_MAX`). */
export function recordChallenge(list: readonly ChallengeRecord[], record: ChallengeRecord): ChallengeRecord[] {
  return [record, ...list.filter((c) => c.seed !== record.seed)].slice(0, CHALLENGES_MAX)
}
