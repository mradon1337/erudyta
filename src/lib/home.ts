import type { CategoryId } from '../data/categories.ts'
import { QUESTIONS, type Question } from '../data/questions.ts'
import type { QuestionState } from './reviews.ts'

type States = Readonly<Record<string, QuestionState>>

/** Powitanie na Starcie wg godziny lokalnej (0–23). */
export function greeting(hour: number): string {
  return hour >= 5 && hour < 18 ? 'Dzień dobry' : 'Dobry wieczór'
}

/** Ile zostało do północy, np. „7 h” albo „40 min” (Wyzwanie dnia: „kończy się za …”). */
export function untilMidnight(now: Date): string {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const minutes = Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 60_000))
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h` : `${minutes} min`
}

export interface PathStats {
  total: number
  /** Opanowane. */
  known: number
  /** W powtórkach (etap 1–4). */
  inReview: number
  /** Jeszcze niewidziane. */
  fresh: number
  /** Opanowanie w procentach, zaokrąglone w dół (100% tylko przy komplecie). */
  percent: number
}

/** Liczniki ścieżki wiedzy; liczymy tylko pytania obecne w bazie. */
export function pathStats(states: States, category: CategoryId, bank: readonly Question[] = QUESTIONS): PathStats {
  let total = 0
  let known = 0
  let inReview = 0
  let fresh = 0
  for (const q of bank) {
    if (q.cat !== category) continue
    total++
    const s = states[q.id]
    if (!s || s.seen === 0) fresh++
    else if (s.known) known++
    else if (s.box > 0) inReview++
  }
  return { total, known, inReview, fresh, percent: total === 0 ? 0 : Math.floor((known / total) * 100) }
}

/** Kolekcja ciekawostek ścieżki: opanowane pytania, od ostatnio opanowanych. */
export function factCollection(states: States, category: CategoryId, bank: readonly Question[] = QUESTIONS): Question[] {
  return bank
    .filter((q) => q.cat === category && states[q.id]?.known === true)
    .sort((a, b) => {
      const la = states[a.id]?.last ?? ''
      const lb = states[b.id]?.last ?? ''
      return la !== lb ? (la < lb ? 1 : -1) : a.id < b.id ? -1 : 1
    })
}
