import type { Mode } from './round.ts'

/** Wartości punktów z `docs/PRODUKT.md`. */
export const XP = {
  correct: 20,
  speedBonus: 5,
  /** Bonus za szybkość, gdy zostało co najmniej tyle sekund. */
  speedBonusMinSeconds: 10,
  review: 10,
  dailyBonus: 20,
  challengeWin: 50,
  perLevel: 1000,
} as const

/** Tryby z zegarem na każde pytanie — tylko w nich jest bonus za szybkość. */
const PER_QUESTION_TIMER: ReadonlySet<Mode> = new Set<Mode>(['daily', 'category', 'challenge'])

/**
 * XP za jedną odpowiedź.
 * @param secondsLeft sekundy pozostałe na zegarze pytania; `null`, gdy runda jest bez zegara
 */
export function xpForAnswer(correct: boolean, secondsLeft: number | null, mode: Mode): number {
  if (!correct) return 0
  if (mode === 'review') return XP.review
  const fast = secondsLeft !== null && secondsLeft >= XP.speedBonusMinSeconds && PER_QUESTION_TIMER.has(mode)
  return XP.correct + (fast ? XP.speedBonus : 0)
}

export const LEVEL_NAMES = [
  'Nowicjusz',
  'Ciekawski',
  'Uczeń',
  'Bywalec',
  'Oczytany',
  'Znawca',
  'Bystrzak',
  'Erudyta',
  'Mędrzec',
  'Omnibus',
] as const

export interface Level {
  number: number
  name: string
  /** XP zdobyte w obecnym poziomie. */
  inLevel: number
  /** XP brakujące do następnego poziomu. */
  toNext: number
}

export function levelFor(xp: number): Level {
  const safe = Math.max(0, Math.floor(xp))
  const number = Math.floor(safe / XP.perLevel) + 1
  const inLevel = safe % XP.perLevel
  const name = LEVEL_NAMES[number - 1] ?? `Omnibus ${number}`
  return { number, name, inLevel, toNext: XP.perLevel - inLevel }
}
