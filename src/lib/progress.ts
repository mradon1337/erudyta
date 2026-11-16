import { addDays } from './dates.ts'
import { answer, type QuestionState } from './reviews.ts'
import { EMPTY_STREAK, type Streak } from './streak.ts'

export const PROGRESS_VERSION = 1
export const DEFAULT_NAME = 'Ty'
export const NAME_MAX = 20
/** Ile dni wstecz trzymamy wyniki Wyzwań dnia. */
export const DAILY_KEEP_DAYS = 30
export const CHALLENGES_MAX = 50

export interface RoundResult {
  results: boolean[]
  xp: number
}

export interface ChallengeRecord {
  seed: string
  from: string
  theirs: boolean[]
  mine: boolean[]
  date: string
}

export interface Progress {
  v: typeof PROGRESS_VERSION
  name: string
  xp: number
  /** Tylko pytania, na które już odpowiadano. */
  questions: Record<string, QuestionState>
  streak: Streak
  /** Wyniki Wyzwań dnia; klucz to data 'YYYY-MM-DD'. */
  daily: Record<string, RoundResult>
  /** Najnowsze pierwsze. */
  challenges: ChallengeRecord[]
  /** Rekord Szybkiej rundy (poprawne odpowiedzi). */
  bestQuick: number
  settings: { timer: boolean }
}

export function createProgress(): Progress {
  return {
    v: PROGRESS_VERSION,
    name: DEFAULT_NAME,
    xp: 0,
    questions: {},
    streak: { ...EMPTY_STREAK },
    daily: {},
    challenges: [],
    bestQuick: 0,
    settings: { timer: true },
  }
}

/**
 * Znaki usuwane z imion: sterujące (C0, DEL), zerowej szerokości i sterujące kierunkiem tekstu
 * (U+202A–U+202E, U+2066–U+2069) — tymi ostatnimi dałoby się w linku „przestawić” wyświetlane imię.
 */
// eslint-disable-next-line no-control-regex
const NAME_JUNK = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g

/** Imię z formularza albo linku: bez znaków sterujących, przycięte, puste → domyślne. */
export function cleanName(raw: string, fallback = DEFAULT_NAME): string {
  const name = raw.replace(NAME_JUNK, '').trim().slice(0, NAME_MAX).trim()
  return name || fallback
}

/** Zapisuje odpowiedź na pytanie i doliczone XP. */
export function applyAnswer(
  progress: Progress,
  questionId: string,
  correct: boolean,
  today: string,
  opts: { inReview: boolean; xp: number },
): Progress {
  return {
    ...progress,
    xp: progress.xp + opts.xp,
    questions: {
      ...progress.questions,
      [questionId]: answer(progress.questions[questionId], correct, today, opts.inReview),
    },
  }
}

/** Zostawia wyniki Wyzwań dnia z ostatnich `DAILY_KEEP_DAYS` dni. */
export function pruneDaily(daily: Readonly<Record<string, RoundResult>>, today: string): Record<string, RoundResult> {
  const oldest = addDays(today, -(DAILY_KEEP_DAYS - 1))
  return Object.fromEntries(Object.entries(daily).filter(([day]) => day >= oldest && day <= today))
}
