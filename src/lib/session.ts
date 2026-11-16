import { shuffle, type Rand } from './rng.ts'
import type { Mode, RoundQuestion } from './round.ts'
import { xpForAnswer } from './xp.ts'

/**
 * Przebieg jednej rundy jako czyste funkcje: stan → nowy stan. Czas liczymy z przekazanego `now`
 * (w aplikacji `Date.now()`), nie z liczby tyknięć, więc zegar nie spóźnia się w tle ani przy zacięciach.
 */

export const QUESTION_SECONDS = 20
export const QUICK_SECONDS = 60
export const BONUS_SECONDS = 10
/** Przy tylu sekundach i mniej zegar robi się pomarańczowy. */
export const WARN_SECONDS = 5

/** Zegar na każde pytanie, jeden zegar na całą rundę (Szybka runda) albo brak zegara. */
export type TimerKind = 'question' | 'total' | 'none'

/** Jedna udzielona odpowiedź: wybrany indeks (`null` = czas minął) i czas od pokazania pytania. */
export interface AnswerLog {
  picked: number | null
  ms: number
}

export interface Session {
  mode: Mode
  questions: RoundQuestion[]
  index: number
  timer: TimerKind
  /** Czy w tej rundzie są jokery (tylko z zegarem na pytanie). */
  jokers: boolean
  /** Chwila końca czasu, gdy zegar chodzi; `null`, gdy stoi. */
  deadline: number | null
  /** Pozostały czas w ms, gdy zegar stoi. */
  remainingMs: number
  /** Wybrana odpowiedź (indeks w `answers`) albo `null`. */
  picked: number | null
  timedOut: boolean
  /** Odpowiedzi schowane jokerem 50/50 (indeksy w `answers`). */
  hidden: number[]
  fiftyUsed: boolean
  timeUsed: boolean
  /** Wyniki kolejnych odpowiedzi. */
  results: boolean[]
  /** XP zdobyte w tej rundzie. */
  xp: number
  /** XP za ostatnią odpowiedź. */
  lastXp: number
  /** Czy odpowiedzi dają XP (`false` — trening, np. drugie podejście do Wyzwania dnia). */
  xpEnabled: boolean
  /** Chwila pokazania bieżącego pytania. */
  shownAt: number
  /** Dziennik odpowiedzi, równoległy do `results`. */
  log: AnswerLog[]
  finished: boolean
}

export function timerKindFor(mode: Mode, timerSetting: boolean): TimerKind {
  if (mode === 'quick') return 'total'
  if (mode === 'learn' || mode === 'review') return 'none'
  // Ustawienie „Zegar w rundach” dotyczy tylko ścieżek (EKRANY.md, Profil).
  if (mode === 'category' && !timerSetting) return 'none'
  return 'question'
}

function fullTime(kind: TimerKind): number {
  return (kind === 'total' ? QUICK_SECONDS : QUESTION_SECONDS) * 1000
}

export function startSession(
  mode: Mode,
  questions: RoundQuestion[],
  now: number,
  opts: { timer?: TimerKind; xp?: boolean } = {},
): Session {
  const timer = opts.timer ?? timerKindFor(mode, true)
  const remainingMs = fullTime(timer)
  return {
    mode,
    questions,
    index: 0,
    timer,
    jokers: timer === 'question',
    deadline: timer === 'none' ? null : now + remainingMs,
    remainingMs,
    picked: null,
    timedOut: false,
    hidden: [],
    fiftyUsed: false,
    timeUsed: false,
    results: [],
    xp: 0,
    lastXp: 0,
    xpEnabled: opts.xp ?? true,
    shownAt: now,
    log: [],
    finished: questions.length === 0,
  }
}

export function currentQuestion(s: Session): RoundQuestion | undefined {
  return s.questions[s.index]
}

export function isAnswered(s: Session): boolean {
  return s.picked !== null || s.timedOut
}

export function isLastQuestion(s: Session): boolean {
  return s.timer !== 'total' && s.index >= s.questions.length - 1
}

export function msLeft(s: Session, now: number): number {
  return s.deadline === null ? s.remainingMs : Math.max(0, s.deadline - now)
}

/** Sekundy do pokazania (zaokrąglone w górę, jak na zegarze odliczającym). */
export function secondsLeft(s: Session, now: number): number {
  return Math.ceil(msLeft(s, now) / 1000)
}

function pause(s: Session, now: number): Pick<Session, 'deadline' | 'remainingMs'> {
  return { deadline: null, remainingMs: msLeft(s, now) }
}

/** Wybór odpowiedzi. Zatrzymuje zegar i dolicza XP. */
export function pick(s: Session, answerIndex: number, now: number): Session {
  const q = currentQuestion(s)
  if (!q || s.finished || isAnswered(s) || s.hidden.includes(answerIndex)) return s
  if (answerIndex < 0 || answerIndex >= q.answers.length) return s
  if (s.timer !== 'none' && msLeft(s, now) === 0) return tick(s, now)

  const correct = answerIndex === q.correct
  const gained = s.xpEnabled ? xpForAnswer(correct, s.timer === 'question' ? secondsLeft(s, now) : null, s.mode) : 0
  return {
    ...s,
    ...pause(s, now),
    picked: answerIndex,
    results: [...s.results, correct],
    log: [...s.log, { picked: answerIndex, ms: Math.max(0, now - s.shownAt) }],
    xp: s.xp + gained,
    lastXp: gained,
  }
}

/** Sprawdza upływ czasu. Zwraca ten sam obiekt, gdy nic się nie zmieniło. */
export function tick(s: Session, now: number): Session {
  if (s.deadline === null || s.finished || isAnswered(s) || msLeft(s, now) > 0) return s
  if (s.timer === 'total') {
    // Koniec Szybkiej rundy: pytanie bez odpowiedzi się nie liczy.
    return { ...s, deadline: null, remainingMs: 0, finished: true }
  }
  return {
    ...s,
    deadline: null,
    remainingMs: 0,
    timedOut: true,
    results: [...s.results, false],
    log: [...s.log, { picked: null, ms: Math.max(0, now - s.shownAt) }],
    lastXp: 0,
  }
}

/** Joker 50/50: chowa dwie losowe błędne odpowiedzi. */
export function fiftyFifty(s: Session, rand: Rand): Session {
  const q = currentQuestion(s)
  if (!q || !s.jokers || s.fiftyUsed || isAnswered(s) || s.finished) return s
  const wrong = q.answers.map((_, i) => i).filter((i) => i !== q.correct)
  return { ...s, fiftyUsed: true, hidden: shuffle(wrong, rand).slice(0, 2) }
}

/** Joker +10 s do bieżącego pytania. */
export function addTime(s: Session, now: number): Session {
  if (!s.jokers || s.timeUsed || isAnswered(s) || s.finished || s.deadline === null || msLeft(s, now) === 0) return s
  return { ...s, timeUsed: true, deadline: s.deadline + BONUS_SECONDS * 1000 }
}

/**
 * Następne pytanie albo koniec rundy. W Szybkiej rundzie po wyczerpaniu puli `refill` dostarcza nową porcję.
 */
export function next(s: Session, now: number, refill?: () => RoundQuestion[]): Session {
  if (!isAnswered(s) || s.finished) return s
  let questions = s.questions
  if (s.index >= questions.length - 1) {
    if (s.timer !== 'total' || !refill) return { ...s, finished: true }
    questions = [...questions, ...refill()]
  }
  const remainingMs = s.timer === 'question' ? fullTime('question') : s.remainingMs
  const running = s.timer !== 'none' && remainingMs > 0
  return {
    ...s,
    questions,
    index: s.index + 1,
    picked: null,
    timedOut: false,
    hidden: [],
    lastXp: 0,
    shownAt: now,
    remainingMs,
    deadline: running ? now + remainingMs : null,
    finished: s.timer === 'total' && remainingMs === 0,
  }
}

/** Liczba poprawnych odpowiedzi. */
export function score(s: Session): number {
  return s.results.filter(Boolean).length
}
