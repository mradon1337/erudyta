import { CATEGORIES, type CategoryId } from '../data/categories.ts'
import { QUESTIONS, type Question } from '../data/questions.ts'
import type { QuestionState } from './reviews.ts'

/** Poniżej tej skuteczności pasek kategorii w Profilu jest pomarańczowy. */
export const WEAK_ACCURACY = 60

export interface CategoryAccuracy {
  category: CategoryId
  answered: number
  /** Procent poprawnych, zaokrąglony; `null`, gdy brak odpowiedzi. */
  percent: number | null
}

export interface ProfileStats {
  /** Wszystkie odpowiedzi (łącznie z powtórnymi). */
  answers: number
  /** Skuteczność w procentach; `null`, gdy brak odpowiedzi. */
  accuracy: number | null
  known: number
  bankSize: number
  /** Od najwyższej skuteczności; kategorie bez odpowiedzi na końcu. */
  categories: CategoryAccuracy[]
}

const percent = (correct: number, seen: number): number | null => (seen === 0 ? null : Math.round((correct / seen) * 100))

/** Statystyki Profilu. Pytania usunięte z bazy są pomijane. */
export function profileStats(
  states: Readonly<Record<string, QuestionState>>,
  bank: readonly Question[] = QUESTIONS,
): ProfileStats {
  let seen = 0
  let correct = 0
  let known = 0
  const perCat = new Map<CategoryId, { seen: number; correct: number }>(
    CATEGORIES.map((c) => [c.id, { seen: 0, correct: 0 }]),
  )
  for (const q of bank) {
    const s = states[q.id]
    if (!s) continue
    seen += s.seen
    correct += s.correct
    if (s.known) known++
    const c = perCat.get(q.cat)
    if (c) {
      c.seen += s.seen
      c.correct += s.correct
    }
  }
  const categories = [...perCat].map(([category, c]) => ({
    category,
    answered: c.seen,
    percent: percent(c.correct, c.seen),
  }))
  // Sortowanie stabilne: przy remisie zostaje kolejność kategorii z bazy.
  categories.sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1))
  return { answers: seen, accuracy: percent(correct, seen), known, bankSize: bank.length, categories }
}

/** Inicjał do awatara: pierwsza litera imienia (wielka) albo „?” */
export function initial(name: string): string {
  const first = [...name.trim()][0]
  return first ? first.toLocaleUpperCase('pl') : '?'
}
