import { isDay } from './dates.ts'
import {
  CHALLENGES_MAX,
  cleanName,
  createProgress,
  PROGRESS_VERSION,
  type ChallengeRecord,
  type Progress,
  type RoundResult,
} from './progress.ts'
import type { Box, QuestionState } from './reviews.ts'
import type { Streak } from './streak.ts'

export const STORAGE_KEY = 'erudyta-progress-v1'

/** Część API `Storage`, której potrzebujemy — w testach wystarczy prosty obiekt. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * - `ok` — wczytano zapisany postęp,
 * - `new` — brak zapisu (pierwsze uruchomienie),
 * - `corrupt` — zapis nieczytelny lub z nieznanej wersji; zaczynamy od nowa,
 * - `unavailable` — localStorage niedostępny; aplikacja działa w pamięci.
 */
export type LoadStatus = 'ok' | 'new' | 'corrupt' | 'unavailable'

export interface LoadResult {
  progress: Progress
  status: LoadStatus
}

/** localStorage, jeśli da się do niego pisać (w trybie prywatnym bywa zablokowany). */
export function browserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage
    const probe = '__erudyta_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

export function loadProgress(store: KeyValueStore | null): LoadResult {
  if (!store) return { progress: createProgress(), status: 'unavailable' }
  let raw: string | null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return { progress: createProgress(), status: 'unavailable' }
  }
  if (raw === null) return { progress: createProgress(), status: 'new' }
  const progress = parseProgress(raw)
  return progress ? { progress, status: 'ok' } : { progress: createProgress(), status: 'corrupt' }
}

/** Zapisuje postęp; `false`, gdy się nie udało (brak miejsca, zablokowany localStorage). */
export function saveProgress(store: KeyValueStore | null, progress: Progress): boolean {
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function clearProgress(store: KeyValueStore | null): void {
  try {
    store?.removeItem(STORAGE_KEY)
  } catch {
    // Nic więcej nie da się zrobić — postęp w pamięci i tak zostaje wyczyszczony przez wywołującego.
  }
}

/** Odczyt zapisanego JSON-a. `null` dla złego JSON-a lub nieznanej wersji. */
export function parseProgress(raw: string): Progress | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  return normalizeProgress(data)
}

// ——— Walidacja: wszystko z localStorage traktujemy jak niepewne dane ———

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function count(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback
}

function bools(v: unknown): boolean[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === 'boolean') ? v : null
}

function questionState(v: unknown): QuestionState | null {
  if (!isObj(v) || !isDay(v.last)) return null
  const seen = count(v.seen)
  const correct = Math.min(count(v.correct), seen)
  const box: Box = seen > 0 && typeof v.box === 'number' && [1, 2, 3, 4].includes(v.box) ? (v.box as Box) : 0
  // Etap bez poprawnego terminu → powtórka od razu (termin = dzień ostatniej odpowiedzi).
  const due = box === 0 ? null : isDay(v.due) ? v.due : v.last
  return { seen, correct, box, due, known: box === 0 && v.known === true, last: v.last }
}

function streak(v: unknown): Streak {
  if (!isObj(v)) return { count: 0, best: 0, last: null }
  const c = count(v.count)
  return { count: c, best: Math.max(count(v.best), c), last: isDay(v.last) ? v.last : null }
}

function roundResult(v: unknown): RoundResult | null {
  if (!isObj(v)) return null
  const results = bools(v.results)
  return results ? { results, xp: count(v.xp) } : null
}

function challenge(v: unknown): ChallengeRecord | null {
  if (!isObj(v) || typeof v.seed !== 'string' || !isDay(v.date)) return null
  const theirs = bools(v.theirs)
  const mine = bools(v.mine)
  if (!theirs || !mine) return null
  return { seed: v.seed, from: typeof v.from === 'string' ? v.from : '', theirs, mine, date: v.date }
}

function record<T>(v: unknown, item: (x: unknown, key: string) => T | null): Record<string, T> {
  const out: Record<string, T> = {}
  if (!isObj(v)) return out
  for (const [key, x] of Object.entries(v)) {
    const parsed = item(x, key)
    if (parsed) out[key] = parsed
  }
  return out
}

/**
 * Sprawdza kształt danych i uzupełnia brakujące pola wartościami domyślnymi. Uszkodzone wpisy pomija.
 * Nieznana wersja `v` → `null`. Przy zmianie kształtu: nowa wersja i migracja tutaj.
 */
export function normalizeProgress(data: unknown): Progress | null {
  if (!isObj(data) || data.v !== PROGRESS_VERSION) return null
  const base = createProgress()
  return {
    v: PROGRESS_VERSION,
    name: typeof data.name === 'string' ? cleanName(data.name) : base.name,
    xp: count(data.xp),
    questions: record(data.questions, questionState),
    streak: streak(data.streak),
    daily: record(data.daily, (x, key) => (isDay(key) ? roundResult(x) : null)),
    challenges: Array.isArray(data.challenges)
      ? data.challenges
          .map(challenge)
          .filter((c): c is ChallengeRecord => c !== null)
          .slice(0, CHALLENGES_MAX)
      : [],
    bestQuick: count(data.bestQuick),
    settings: { timer: isObj(data.settings) && typeof data.settings.timer === 'boolean' ? data.settings.timer : true },
  }
}
