import type { CategoryId } from '../data/categories.ts'
import { QUESTIONS, QUESTION_BY_ID, type Question } from '../data/questions.ts'
import { addDays, daysBetween } from './dates.ts'

/** Etap powtórki: 0 = poza powtórkami, 1–4 = kolejne pudełka. */
export type Box = 0 | 1 | 2 | 3 | 4

export interface QuestionState {
  /** Ile razy pytanie pokazano. */
  seen: number
  /** Ile razy odpowiedziano poprawnie. */
  correct: number
  box: Box
  /** Termin powtórki 'YYYY-MM-DD', gdy `box > 0`. */
  due: string | null
  /** Opanowane. */
  known: boolean
  /** Dzień ostatniej odpowiedzi. */
  last: string
}

/** Odstęp w dniach do następnej powtórki po wejściu na dany etap. */
export const INTERVAL_DAYS: Readonly<Record<Exclude<Box, 0>, number>> = { 1: 1, 2: 3, 3: 7, 4: 14 }

/** Najwięcej pytań w jednej rundzie powtórek. */
export const REVIEW_LIMIT = 20

/** Coś, co umie powiedzieć, czy pytanie o danym id nadal jest w bazie (np. `QUESTION_BY_ID`). */
export interface QuestionLookup {
  has(id: string): boolean
}

type States = Readonly<Record<string, QuestionState>>

/**
 * Nowy stan pytania po odpowiedzi (algorytm z `docs/DANE.md`).
 * @param inReview czy odpowiedź padła w rundzie Powtórek
 */
export function answer(
  prev: QuestionState | undefined,
  correct: boolean,
  today: string,
  inReview: boolean,
): QuestionState {
  const s: QuestionState = prev ?? { seen: 0, correct: 0, box: 0, due: null, known: false, last: today }
  const next: QuestionState = { ...s, seen: s.seen + 1, correct: s.correct + (correct ? 1 : 0), last: today }

  if (!correct) return { ...next, box: 1, due: addDays(today, INTERVAL_DAYS[1]), known: false }
  if (s.box === 0) return { ...next, known: true }
  if (inReview || (s.due !== null && s.due <= today)) {
    if (s.box === 4) return { ...next, box: 0, due: null, known: true }
    const box = (s.box + 1) as 2 | 3 | 4
    return { ...next, box, due: addDays(today, INTERVAL_DAYS[box]) }
  }
  // Poprawna odpowiedź przed terminem, poza Powtórkami: etap bez zmian.
  return next
}

/** Wpisy w powtórkach (z terminem), tylko dla pytań, które wciąż są w bazie. */
function scheduled(states: States, bank: QuestionLookup): [string, string][] {
  const out: [string, string][] = []
  for (const [id, s] of Object.entries(states)) {
    if (s.box > 0 && s.due !== null && bank.has(id)) out.push([id, s.due])
  }
  return out
}

/** Pytania do powtórki na dziś (termin dziś lub wcześniej), od najstarszego terminu. */
export function dueToday(
  states: States,
  today: string,
  bank: QuestionLookup = QUESTION_BY_ID,
  limit = REVIEW_LIMIT,
): string[] {
  return scheduled(states, bank)
    .filter(([, due]) => due <= today)
    .sort(([idA, dueA], [idB, dueB]) => (dueA !== dueB ? (dueA < dueB ? -1 : 1) : idA < idB ? -1 : 1))
    .slice(0, limit)
    .map(([id]) => id)
}

/** Liczba wszystkich zaległych powtórek (bez limitu rundy) — licznik na zakładce. */
export function countDue(states: States, today: string, bank: QuestionLookup = QUESTION_BY_ID): number {
  return scheduled(states, bank).filter(([, due]) => due <= today).length
}

export interface ForecastDay {
  day: string
  count: number
}

/** Rozkład powtórek na 7 dni od dziś; zaległe doliczone do dzisiejszego dnia. */
export function weekForecast(states: States, today: string, bank: QuestionLookup = QUESTION_BY_ID): ForecastDay[] {
  const days: ForecastDay[] = Array.from({ length: 7 }, (_, i) => ({ day: addDays(today, i), count: 0 }))
  for (const [, due] of scheduled(states, bank)) {
    const slot = days[Math.max(0, daysBetween(today, due))]
    if (slot) slot.count++
  }
  return days
}

/** Najbliższy termin powtórki po dniu dzisiejszym (do pustego stanu „Na dziś wszystko powtórzone”). */
export function nextDueAfter(states: States, today: string, bank: QuestionLookup = QUESTION_BY_ID): string | null {
  let best: string | null = null
  for (const [, due] of scheduled(states, bank)) {
    if (due > today && (best === null || due < best)) best = due
  }
  return best
}

export interface Mastery {
  known: number
  total: number
}

/** Opanowanie kategorii: opanowane pytania / wszystkie pytania kategorii w bazie. */
export function categoryMastery(states: States, category: CategoryId, bank: readonly Question[] = QUESTIONS): Mastery {
  let known = 0
  let total = 0
  for (const q of bank) {
    if (q.cat !== category) continue
    total++
    if (states[q.id]?.known) known++
  }
  return { known, total }
}
