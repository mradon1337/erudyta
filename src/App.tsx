import { useState } from 'react'
import { Button } from './components/Button.tsx'
import { categoryName } from './data/categories.ts'
import { QUESTIONS } from './data/questions.ts'
import { formatDay, toDay } from './lib/dates.ts'
import { DEFAULT_NAME } from './lib/progress.ts'
import { countDue } from './lib/reviews.ts'
import { dailySeed, type RoundRequest } from './lib/round.ts'
import type { Session } from './lib/session.ts'
import { buildChallengeUrl, shareText } from './lib/share.ts'
import { finishRound, leveledUp, levelsAfterExit, type RoundSummary } from './lib/summary.ts'
import { levelFor, type Level } from './lib/xp.ts'
import { appUrl } from './platform/share.ts'
import { useProgress } from './progress/useProgress.ts'
import { LevelUpScreen } from './screens/LevelUpScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { RoundScreen } from './screens/RoundScreen.tsx'
import styles from './App.module.css'

/** Ekrany przełączane stanem (bez routera w MVP). */
type Screen =
  | { name: 'home' }
  | { name: 'round'; request: RoundRequest; id: number }
  | { name: 'result'; request: RoundRequest; summary: RoundSummary; today: string }
  | { name: 'levelUp'; level: Level; then: Screen }

/** Napis na chipie ekranu Wynik. */
function resultLabel(request: RoundRequest, summary: RoundSummary): string {
  switch (request.mode) {
    case 'daily':
      return summary.training ? 'Wyzwanie dnia · trening' : 'Wyzwanie dnia ukończone'
    case 'challenge':
      return 'Wyzwanie ukończone'
    case 'category':
      return `${categoryName(request.category)} · runda ukończona`
    case 'quick':
      return 'Szybka runda'
    case 'learn':
      return 'Nauka bez stresu'
    case 'review':
      return 'Powtórki ukończone'
  }
}

/**
 * Runda → Wynik → (Nowy poziom) → Start. Start jest na razie tymczasowy — właściwy powstaje w Etapie 4
 * (docs/PLAN.md).
 */
export function App() {
  const { progress, updateProgress } = useProgress()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const play = (request: RoundRequest) => setScreen({ name: 'round', request, id: Date.now() })
  const home: Screen = { name: 'home' }

  /** Po wyniku albo przerwanej rundzie: najpierw ekran awansu, jeśli poziom wzrósł. */
  const leave = (levels: { levelBefore: Level; levelAfter: Level }, then: Screen) =>
    setScreen(leveledUp(levels) ? { name: 'levelUp', level: levels.levelAfter, then } : then)

  if (screen.name === 'round') {
    const { request } = screen
    return (
      <RoundScreen
        key={screen.id}
        request={request}
        onFinish={(session: Session, today: string) => {
          // Funkcja z updateProgress działa od razu na bieżącym postępie (także z ostatnią odpowiedzią).
          const out: { summary?: RoundSummary } = {}
          updateProgress((p) => {
            const r = finishRound(p, session, today)
            out.summary = r.summary
            return r.progress
          })
          if (out.summary) setScreen({ name: 'result', request, summary: out.summary, today })
        }}
        onExit={(session: Session) => leave(levelsAfterExit(progress, session), home)}
      />
    )
  }

  if (screen.name === 'result') {
    const { request, summary, today } = screen
    const shareable = request.mode === 'daily' && summary.dailyResults !== null
    const text =
      shareable && summary.dailyResults
        ? shareText(
            `Wyzwanie dnia · ${formatDay(today)}`,
            summary.dailyResults,
            buildChallengeUrl(appUrl(), {
              seed: dailySeed(today),
              results: summary.dailyResults,
              name: progress.name === DEFAULT_NAME ? '' : progress.name,
              bankSize: QUESTIONS.length,
            }),
          )
        : null
    const canReplay = request.mode !== 'review' || countDue(progress.questions, toDay(new Date())) > 0
    return (
      <ResultScreen
        summary={summary}
        label={resultLabel(request, summary)}
        shareText={text}
        onReplay={canReplay ? () => leave(summary, { name: 'round', request, id: Date.now() }) : null}
        onDone={() => leave(summary, home)}
      />
    )
  }

  if (screen.name === 'levelUp') {
    const { then } = screen
    // Nowa runda dostaje świeży klucz, żeby nie wznowić starej.
    return (
      <LevelUpScreen
        level={screen.level}
        onContinue={() => setScreen(then.name === 'round' ? { ...then, id: Date.now() } : then)}
      />
    )
  }

  return <TemporaryHome onPlay={play} />
}

function TemporaryHome({ onPlay }: { onPlay: (request: RoundRequest) => void }) {
  const { progress, persistent } = useProgress()
  const level = levelFor(progress.xp)
  const answered = Object.keys(progress.questions).length
  const due = countDue(progress.questions, toDay(new Date()))

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.hello}>Wersja robocza</span>
        <h1 className={styles.logo}>Erudyta</h1>
      </header>

      {!persistent && (
        <p className={styles.notice} role="status">
          Ta przeglądarka nie pozwala zapisać postępu. Można grać, ale po zamknięciu karty wyniki znikną.
        </p>
      )}

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Runda mieszana</span>
        <h2 className={styles.heroTitle}>10 pytań, 20 sekund na każde</h2>
        <p>
          Poziom {level.number} · {level.name} · {progress.xp} XP
        </p>
        <div className={styles.actions}>
          <Button variant="play" iconStart="play" onClick={() => onPlay({ mode: 'daily' })}>
            Zagraj
          </Button>
          <Button variant="secondary" onClick={() => onPlay({ mode: 'learn' })}>
            Bez zegara
          </Button>
        </div>
      </section>

      <p className={styles.stats}>
        Odpowiedzi zapisane dla {answered} z {QUESTIONS.length} pytań · do powtórki dziś: {due}
      </p>
    </main>
  )
}
