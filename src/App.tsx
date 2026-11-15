import { useState } from 'react'
import { Button } from './components/Button.tsx'
import { Chip } from './components/Chip.tsx'
import { QUESTIONS } from './data/questions.ts'
import { toDay } from './lib/dates.ts'
import { countDue } from './lib/reviews.ts'
import type { RoundRequest } from './lib/round.ts'
import { score, type Session } from './lib/session.ts'
import { levelFor } from './lib/xp.ts'
import { useProgress } from './progress/useProgress.ts'
import { RoundScreen } from './screens/RoundScreen.tsx'
import styles from './App.module.css'

/** Ekrany przełączane stanem (bez routera w MVP). */
type Screen =
  | { name: 'home' }
  | { name: 'round'; request: RoundRequest; id: number }
  | { name: 'summary'; correct: number; total: number; xp: number }

/**
 * Na razie: tymczasowy Start z przyciskiem „Zagraj” (runda mieszana = Wyzwanie dnia) i prosty koniec rundy.
 * Właściwe ekrany Start i Wynik powstają w Etapach 3–4 (docs/PLAN.md).
 */
export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const play = (request: RoundRequest) => setScreen({ name: 'round', request, id: Date.now() })

  if (screen.name === 'round') {
    return (
      <RoundScreen
        key={screen.id}
        request={screen.request}
        onFinish={(s: Session) => setScreen({ name: 'summary', correct: score(s), total: s.results.length, xp: s.xp })}
        onExit={() => setScreen({ name: 'home' })}
      />
    )
  }

  if (screen.name === 'summary') {
    return (
      <main className={styles.screen}>
        <div className={styles.summary}>
          <Chip>Runda ukończona</Chip>
          <h1 className={styles.score}>
            {screen.correct}/{screen.total}
          </h1>
          <p className={styles.gain}>+{screen.xp} XP</p>
          <Button block onClick={() => setScreen({ name: 'home' })}>
            Na start
          </Button>
        </div>
      </main>
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
