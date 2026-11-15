import { daysBetween } from './dates.ts'

export interface Streak {
  /** Długość bieżącej serii w dniach. */
  count: number
  /** Najdłuższa seria. */
  best: number
  /** Ostatni zaliczony dzień 'YYYY-MM-DD'. */
  last: string | null
}

export const EMPTY_STREAK: Streak = { count: 0, best: 0, last: null }

/**
 * Zalicza dzień po ukończonej rundzie. Wczoraj zaliczone → seria +1; dziś już zaliczone → bez zmian;
 * przerwa → seria od 1.
 */
export function completeDay(streak: Streak, today: string): Streak {
  const gap = streak.last === null ? Infinity : daysBetween(streak.last, today)
  // gap < 0: zegar urządzenia cofnięty — nie psujemy zapisanej serii.
  if (gap <= 0) return streak
  const count = gap === 1 ? streak.count + 1 : 1
  return { count, best: Math.max(streak.best, count), last: today }
}

/** Seria do pokazania dziś: 0, gdy ostatni zaliczony dzień był przedwczoraj lub wcześniej. */
export function currentStreak(streak: Streak, today: string): number {
  if (streak.last === null) return 0
  return daysBetween(streak.last, today) <= 1 ? streak.count : 0
}
