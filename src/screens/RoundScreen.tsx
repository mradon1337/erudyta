import { useCallback, useEffect, useRef, useState } from 'react'
import { AnswerButton, type AnswerState } from '../components/AnswerButton.tsx'
import { Chip } from '../components/Chip.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { FeedbackSheet } from '../components/FeedbackSheet.tsx'
import { Icon } from '../components/Icon.tsx'
import { RoundHeader } from '../components/RoundHeader.tsx'
import { categoryName } from '../data/categories.ts'
import { toDay } from '../lib/dates.ts'
import { applyAnswer } from '../lib/progress.ts'
import { buildRound, refillQuick, type RoundRequest } from '../lib/round.ts'
import {
  addTime,
  currentQuestion,
  fiftyFifty,
  isAnswered,
  isLastQuestion,
  next,
  pick,
  score,
  secondsLeft,
  startSession,
  tick,
  timerKindFor,
  WARN_SECONDS,
  type Session,
} from '../lib/session.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './RoundScreen.module.css'

const LETTERS = ['A', 'B', 'C', 'D'] as const
/** Jak często odświeżamy zegar. Sam czas i tak liczymy z `Date.now()`. */
const TICK_MS = 200

interface Props {
  request: RoundRequest
  /** Runda dobiegła końca (ostatnie „Zobacz wynik” albo koniec czasu Szybkiej rundy). `today` — dzień startu rundy. */
  onFinish: (session: Session, today: string) => void
  /** Gracz przerwał rundę. Odpowiedzi i XP są już zapisane. */
  onExit: (session: Session) => void
}

function answerState(s: Session, index: number): AnswerState {
  const q = currentQuestion(s)
  if (!q || !isAnswered(s)) return 'default'
  if (index === q.correct) return 'correct'
  if (index === s.picked) return 'wrong'
  return 'dimmed'
}

/** Komunikat dla czytnika ekranu: tylko przy 10 s i 5 s, nie co sekundę. */
function timeAnnouncement(seconds: number): string {
  if (seconds <= 0) return ''
  if (seconds <= WARN_SECONDS) return `Zostało ${WARN_SECONDS} sekund`
  if (seconds <= 10) return 'Zostało 10 sekund'
  return ''
}

export function RoundScreen({ request, onFinish, onExit }: Props) {
  const { progress, updateProgress } = useProgress()
  const [setup] = useState(() => {
    const now = Date.now()
    const today = toDay(new Date(now))
    const questions = buildRound(request, { states: progress.questions, today, rand: Math.random })
    const noTimer = request.mode === 'category' && request.noTimer === true
    const timer = timerKindFor(request.mode, progress.settings.timer && !noTimer)
    // Wynik Wyzwania dnia liczy się raz dziennie; kolejne podejścia to trening bez XP.
    const xp = !(request.mode === 'daily' && progress.daily[today] !== undefined)
    // Etap powtórki z chwili startu rundy — chip pokazuje go także po odpowiedzi, która go zmienia.
    const boxes = new Map(questions.map((q) => [q.question.id, progress.questions[q.question.id]?.box ?? 0]))
    return { today, now, boxes, session: startSession(request.mode, questions, now, { timer, xp }) }
  })
  const [session, setSession] = useState(setup.session)
  const [now, setNow] = useState(setup.now)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const sessionRef = useRef(session)
  const questionRef = useRef<HTMLHeadingElement>(null)
  const { today } = setup

  /** Jedyna droga zmiany stanu rundy: liczy nowy stan, zapisuje odpowiedź w postępie, kończy rundę. */
  const apply = useCallback(
    (change: (s: Session, now: number) => Session) => {
      const prev = sessionRef.current
      const at = Date.now()
      const nextState = change(prev, at)
      setNow(at)
      if (nextState === prev) return
      sessionRef.current = nextState
      setSession(nextState)

      if (nextState.results.length > prev.results.length) {
        const q = currentQuestion(nextState)
        const correct = nextState.results[nextState.results.length - 1] === true
        if (q) {
          updateProgress((p) =>
            applyAnswer(p, q.question.id, correct, today, { inReview: nextState.mode === 'review', xp: nextState.lastXp }),
          )
        }
      }
      if (nextState.finished && !prev.finished) onFinish(nextState, today)
    },
    [today, updateProgress, onFinish],
  )

  const goNext = useCallback(() => {
    apply((s, at) => next(s, at, () => refillQuick(currentQuestion(s)?.question.id ?? null, Math.random)))
  }, [apply])

  const running = session.deadline !== null
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => apply(tick), TICK_MS)
    return () => window.clearInterval(id)
  }, [running, apply])

  // Nowe pytanie: fokus na treść, żeby czytnik ekranu ją przeczytał, a klawiatura zaczynała od góry.
  useEffect(() => {
    questionRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [session.index])

  // Klawiatura: 1–4 / A–D wybierają odpowiedź, Enter — „Dalej”, Escape — wyjście.
  useEffect(() => {
    if (confirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return
      const s = sessionRef.current
      const key = e.key.toLowerCase()
      const index = '1234'.indexOf(key) >= 0 ? '1234'.indexOf(key) : 'abcd'.indexOf(key)
      if (key.length === 1 && index >= 0 && !isAnswered(s)) {
        e.preventDefault()
        apply((cur, at) => pick(cur, index, at))
      } else if (e.key === 'Enter' && isAnswered(s)) {
        // preventDefault blokuje też natywne „kliknięcie” Enterem przycisku w fokusie — bez podwójnego „Dalej”.
        e.preventDefault()
        goNext()
      } else if (e.key === 'Escape') {
        // Bez preventDefault ten sam Escape od razu zamknąłby świeżo otwarte okno.
        e.preventDefault()
        setConfirmOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen, apply, goNext])

  const q = currentQuestion(session)
  if (!q) return null

  const answered = isAnswered(session)
  const seconds = session.timer === 'none' ? null : secondsLeft(session, now)
  const title = session.timer === 'total' ? `Poprawne: ${score(session)}` : `Pytanie ${session.index + 1} z ${session.questions.length}`
  const correctText = q.answers[q.correct] ?? ''
  const good = session.picked === q.correct

  return (
    <main className={`${styles.screen} ${answered ? styles.answered : ''}`}>
      <RoundHeader
        title={title}
        seconds={seconds}
        warn={running && seconds !== null && seconds <= WARN_SECONDS}
        progress={
          session.timer === 'total'
            ? null
            : { results: session.results, total: session.questions.length, current: session.index }
        }
        onClose={() => setConfirmOpen(true)}
      />
      <p className="visually-hidden" aria-live="assertive">
        {running && seconds !== null ? timeAnnouncement(seconds) : ''}
      </p>

      <div className={styles.question}>
        <Chip>
          {categoryName(q.question.cat)}
          {session.mode === 'review' && (setup.boxes.get(q.question.id) ?? 0) > 0
            ? ` · Etap ${setup.boxes.get(q.question.id)} z 4`
            : ''}
        </Chip>
        <h1 ref={questionRef} tabIndex={-1} className={styles.questionText}>
          {q.question.q}
        </h1>
      </div>

      <div className={styles.answers}>
        {q.answers.map((label, i) =>
          session.hidden.includes(i) ? null : (
            <AnswerButton
              key={`${session.index}-${i}`}
              letter={LETTERS[i] ?? ''}
              label={label}
              state={answerState(session, i)}
              disabled={answered}
              onClick={() => apply((s, at) => pick(s, i, at))}
            />
          ),
        )}
      </div>

      {session.jokers && !answered && (
        <div className={styles.jokers}>
          <button
            type="button"
            className={styles.joker}
            disabled={session.fiftyUsed}
            onClick={() => apply((s) => fiftyFifty(s, Math.random))}
          >
            <Icon name="fifty" size={18} />
            {session.fiftyUsed ? '50/50 użyte' : '50/50'}
          </button>
          <button
            type="button"
            className={styles.joker}
            disabled={session.timeUsed}
            onClick={() => apply(addTime)}
          >
            <Icon name="stopwatch" size={18} />
            {session.timeUsed ? '+10 s użyte' : '+10 s'}
          </button>
        </div>
      )}

      {answered && (
        <FeedbackSheet
          key={session.index}
          tone={good ? 'good' : 'bad'}
          title={good ? `Dobrze!${session.lastXp > 0 ? ` +${session.lastXp} XP` : ''}` : session.timedOut ? 'Czas minął' : 'Nie tym razem'}
          subtitle={
            good
              ? `Poprawna odpowiedź: ${correctText}.`
              : `Poprawna odpowiedź: ${correctText}. To pytanie wróci jutro w Powtórkach.`
          }
          fact={q.question.f}
          nextLabel={isLastQuestion(session) ? 'Zobacz wynik' : 'Dalej'}
          onNext={goNext}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Przerwać rundę?"
        text="Udzielone odpowiedzi i zdobyte XP zostaną zapisane, ale przerwana runda nie zalicza dnia serii."
        cancelLabel="Graj dalej"
        confirmLabel="Przerwij rundę"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onExit(sessionRef.current)
        }}
      />
    </main>
  )
}
