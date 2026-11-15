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

/** Imię z formularza albo linku: bez znaków sterujących, przycięte, puste → domyślne. */
export function cleanName(raw: string, fallback = DEFAULT_NAME): string {
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, NAME_MAX).trim()
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
