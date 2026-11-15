import type { CategoryId } from '../data/categories.ts'
import { QUESTIONS, type Question } from '../data/questions.ts'
import { dueToday, REVIEW_LIMIT, type QuestionState } from './reviews.ts'
import { randFromSeed, randomInt, shuffle, type Rand } from './rng.ts'

/** Tryby gry z `docs/PRODUKT.md`. */
export type Mode = 'daily' | 'category' | 'quick' | 'learn' | 'review' | 'challenge'

export const ROUND_SIZE = 10

/** Pytanie gotowe do wyświetlenia: odpowiedzi w wylosowanej kolejności. */
export interface RoundQuestion {
  question: Question
  answers: readonly string[]
  /** Indeks poprawnej odpowiedzi w `answers`. */
  correct: number
}

export type RoundRequest =
  | { mode: 'daily' }
  | { mode: 'challenge'; seed: string }
  | { mode: 'category'; category: CategoryId }
  | { mode: 'learn' }
  | { mode: 'quick' }
  | { mode: 'review' }

export interface RoundContext {
  /** Stan pytań z postępu gracza. */
  states: Readonly<Record<string, QuestionState>>
  /** Dzień lokalny 'YYYY-MM-DD'. */
  today: string
  /** Generator dla rund bez ziarna (w aplikacji `Math.random`, w testach z ziarnem). */
  rand: Rand
  bank?: readonly Question[]
}

/** Ziarno Wyzwania dnia: 'd' + YYYYMMDD. */
export function dailySeed(today: string): string {
  return 'd' + today.replaceAll('-', '')
}

const SEED_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Ziarno własnego wyzwania: 'c' + 6 losowych znaków [a-z0-9]. */
export function newChallengeSeed(rand: Rand): string {
  let out = 'c'
  for (let i = 0; i < 6; i++) out += SEED_CHARS[randomInt(SEED_CHARS.length, rand)]
  return out
}

/** Tasuje kolejność odpowiedzi pytania. */
export function prepareQuestion(question: Question, rand: Rand): RoundQuestion {
  const order = shuffle([0, 1, 2, 3], rand)
  return {
    question,
    answers: order.map((i) => question.a[i] as string),
    correct: order.indexOf(0),
  }
}

/**
 * Runda z ziarnem: pytania posortowane po `id`, przetasowane generatorem z ziarna, pierwsze 10;
 * odpowiedzi tasowane tym samym generatorem. Ten sam napis i ta sama baza = ta sama runda wszędzie.
 */
export function seededRound(seed: string, bank: readonly Question[] = QUESTIONS, size = ROUND_SIZE): RoundQuestion[] {
  const rand = randFromSeed(seed)
  const sorted = [...bank].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
  return shuffle(sorted, rand)
    .slice(0, size)
    .map((q) => prepareQuestion(q, rand))
}

/**
 * Kolejność wg priorytetu: niewidziane → nieopanowane → opanowane (najdawniej widziane pierwsze).
 * W obrębie grupy kolejność losowa.
 */
export function byPriority(
  pool: readonly Question[],
  states: Readonly<Record<string, QuestionState>>,
  rand: Rand,
): Question[] {
  const group = (q: Question): number => {
    const s = states[q.id]
    if (!s || s.seen === 0) return 0
    return s.known ? 2 : 1
  }
  const keyed = shuffle(pool, rand).map((q) => ({ q, g: group(q), last: states[q.id]?.last ?? '' }))
  // Sortowanie w JS jest stabilne, więc losowa kolejność zostaje w obrębie grupy.
  keyed.sort((a, b) => a.g - b.g || (a.g === 2 && a.last !== b.last ? (a.last < b.last ? -1 : 1) : 0))
  return keyed.map((k) => k.q)
}

/** Buduje rundę dla danego trybu. Szybka runda dostaje całą pulę — po jej wyczerpaniu `refillQuick`. */
export function buildRound(request: RoundRequest, ctx: RoundContext): RoundQuestion[] {
  const bank = ctx.bank ?? QUESTIONS
  const prepare = (qs: readonly Question[]) => qs.map((q) => prepareQuestion(q, ctx.rand))

  switch (request.mode) {
    case 'daily':
      return seededRound(dailySeed(ctx.today), bank)
    case 'challenge':
      return seededRound(request.seed, bank)
    case 'category':
      return prepare(byPriority(bank.filter((q) => q.cat === request.category), ctx.states, ctx.rand).slice(0, ROUND_SIZE))
    case 'learn':
      return prepare(byPriority(bank, ctx.states, ctx.rand).slice(0, ROUND_SIZE))
    case 'quick':
      return prepare(byPriority(bank, ctx.states, ctx.rand))
    case 'review': {
      const byId = new Map(bank.map((q) => [q.id, q]))
      const ids = dueToday(ctx.states, ctx.today, byId, REVIEW_LIMIT)
      return prepare(ids.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined))
    }
  }
}

/**
 * Nowa porcja pytań do Szybkiej rundy po wyczerpaniu puli: cała baza przetasowana od nowa,
 * bez powtórzenia ostatnio pokazanego pytania na początku.
 */
export function refillQuick(lastId: string | null, rand: Rand, bank: readonly Question[] = QUESTIONS): RoundQuestion[] {
  const pool = shuffle(bank, rand)
  if (pool.length > 1 && pool[0]?.id === lastId) pool.push(pool.shift() as Question)
  return pool.map((q) => prepareQuestion(q, rand))
}
