import { useState } from 'react'
import { Button } from '../components/Button.tsx'
import { Icon } from '../components/Icon.tsx'
import { outcome, score } from '../lib/challenges.ts'
import { addDays, formatDay, toDay } from '../lib/dates.ts'
import { count } from '../lib/plural.ts'
import { initial } from '../lib/profile.ts'
import type { ChallengeRecord } from '../lib/progress.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './RankingScreen.module.css'

type View = 'challenges' | 'records'

interface Props {
  /** „Wyzwij znajomego”: nowa runda z własnym ziarnem, po niej link do wysłania. */
  onNewChallenge: () => void
}

const OUTCOME_TEXT = { win: 'wygrana', draw: 'remis', lose: 'przegrana' } as const

function ChallengeRow({ c }: { c: ChallengeRecord }) {
  const result = outcome(c.mine, c.theirs)
  const name = c.theirs.length === 0 ? 'Twoje wyzwanie' : c.from || 'Znajomy'
  const meta = `${formatDay(c.date)} · ${result ? OUTCOME_TEXT[result] : 'link do wysłania znajomym'}`
  return (
    <li className={`${styles.row} ${result === 'win' ? styles.won : ''}`}>
      <span className={`${styles.avatar} ${c.theirs.length === 0 ? styles.own : ''}`} aria-hidden="true">
        {c.theirs.length === 0 ? <Icon name="user" size={18} /> : initial(c.from || 'Z')}
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowName}>{name}</span>
        <span className={styles.rowMeta}>{meta}</span>
      </span>
      <span className={styles.rowScore}>
        {result ? (
          <>
            <span className="visually-hidden">Ty </span>
            {score(c.mine)} : {score(c.theirs)}
            <span className="visually-hidden"> {name}</span>
          </>
        ) : (
          `${score(c.mine)}/${c.mine.length}`
        )}
      </span>
    </li>
  )
}

/** Ranking w MVP: historia wyzwań z linków i własne rekordy (EKRANY.md, pkt 8). */
export function RankingScreen({ onNewChallenge }: Props) {
  const { progress } = useProgress()
  const [view, setView] = useState<View>('challenges')
  const today = toDay(new Date())
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, -i))

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ranking</h1>
        <button type="button" className={styles.invite} onClick={onNewChallenge}>
          <Icon name="users" size={18} />
          Wyzwij
        </button>
      </header>

      <div className={styles.toggle} role="group" aria-label="Widok">
        <button type="button" aria-pressed={view === 'challenges'} onClick={() => setView('challenges')}>
          Wyzwania
        </button>
        <button type="button" aria-pressed={view === 'records'} onClick={() => setView('records')}>
          Rekordy
        </button>
      </div>

      {view === 'challenges' ? (
        progress.challenges.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>Jeszcze żadnych wyzwań</h2>
            <p className={styles.emptyText}>
              Zagraj 10 pytań i wyślij link znajomym. Zagrają dokładnie te same pytania, a wynik porównacie tutaj.
              Link z Wyzwania dnia też działa.
            </p>
            <Button variant="play" iconStart="play" onClick={onNewChallenge}>
              Wyzwij znajomego
            </Button>
          </section>
        ) : (
          <ol className={styles.list}>
            {progress.challenges.map((c) => (
              <ChallengeRow key={c.seed} c={c} />
            ))}
          </ol>
        )
      ) : (
        <>
          <dl className={styles.records}>
            <div className={styles.record}>
              <dt>Szybka runda</dt>
              <dd>{progress.bestQuick > 0 ? count(progress.bestQuick, ['poprawna', 'poprawne', 'poprawnych']) : '–'}</dd>
            </div>
            <div className={styles.record}>
              <dt>Najdłuższa seria</dt>
              <dd className={styles.orange}>{count(progress.streak.best, ['dzień', 'dni', 'dni'])}</dd>
            </div>
          </dl>
          <section className={styles.box} aria-labelledby="daily-title">
            <h2 id="daily-title" className={styles.boxTitle}>
              Wyzwania dnia — ostatnie 7 dni
            </h2>
            <ul className={styles.days}>
              {week.map((day, i) => {
                const r = progress.daily[day]
                return (
                  <li key={day} className={styles.day}>
                    <span>{i === 0 ? 'Dziś' : i === 1 ? 'Wczoraj' : formatDay(day)}</span>
                    <span className={r ? styles.dayScore : styles.dayNone}>
                      {r ? `${score(r.results)}/${r.results.length}` : 'nie grane'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
