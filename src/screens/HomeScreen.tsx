import { useState } from 'react'
import { Button } from '../components/Button.tsx'
import { CATEGORY_ICON } from '../components/categoryIcons.ts'
import { Icon, type IconName } from '../components/Icon.tsx'
import { CATEGORIES, type CategoryId } from '../data/categories.ts'
import { QUESTIONS } from '../data/questions.ts'
import { toDay } from '../lib/dates.ts'
import { greeting, pathStats, untilMidnight } from '../lib/home.ts'
import { count } from '../lib/plural.ts'
import type { RoundRequest } from '../lib/round.ts'
import { dailyShareText } from '../lib/share.ts'
import { currentStreak } from '../lib/streak.ts'
import { levelFor, XP } from '../lib/xp.ts'
import { appUrl, shareOrCopy } from '../platform/share.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './HomeScreen.module.css'

interface Props {
  onPlay: (request: RoundRequest) => void
  onOpenCategory: (category: CategoryId) => void
  /** „Wyzwij znajomego”: runda z nowym ziarnem, po niej link do wysłania. */
  onNewChallenge: () => void
}

function ModeRow(props: { icon: IconName; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.mode} onClick={props.onClick}>
      <span className={styles.modeIcon}>
        <Icon name={props.icon} size={20} />
      </span>
      <span className={styles.modeText}>
        <span className={styles.modeTitle}>{props.title}</span>
        <span className={styles.modeSub}>{props.subtitle}</span>
      </span>
      <Icon name="arrowRight" size={20} className={styles.modeArrow} />
    </button>
  )
}

export function HomeScreen({ onPlay, onOpenCategory, onNewChallenge }: Props) {
  const { progress, persistent } = useProgress()
  const [shareMessage, setShareMessage] = useState('')
  const now = new Date()
  const today = toDay(now)
  const streak = currentStreak(progress.streak, today)
  const level = levelFor(progress.xp)
  const nextLevel = levelFor(level.number * XP.perLevel)
  const daily = progress.daily[today]

  const shareDaily = async () => {
    if (!daily) return
    setShareMessage('')
    const text = dailyShareText(today, daily.results, {
      name: progress.name,
      base: appUrl(),
      bankSize: QUESTIONS.length,
    })
    const outcome = await shareOrCopy(text)
    setShareMessage(outcome === 'copied' ? 'Skopiowano wynik do schowka.' : outcome === 'failed' ? 'Nie udało się udostępnić.' : '')
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <span className={styles.hello}>{greeting(now.getHours())}</span>
          <h1 className={styles.logo}>Erudyta</h1>
        </div>
        <span className={styles.streak}>
          <Icon name="flame" size={18} className={styles.flame} />
          {streak > 0 ? (
            <>
              <span className="visually-hidden">Seria: </span>
              {count(streak, ['dzień', 'dni', 'dni'])}
            </>
          ) : (
            'Zacznij serię'
          )}
        </span>
      </header>

      {!persistent && (
        <p className={styles.notice} role="status">
          Ta przeglądarka nie pozwala zapisać postępu. Można grać, ale po zamknięciu karty wyniki znikną.
        </p>
      )}

      <section className={styles.daily} aria-labelledby="daily-title">
        <div className={styles.dailyHead}>
          <span className={styles.eyebrow}>Wyzwanie dnia</span>
          <span className={styles.dailyTime}>
            {daily ? 'jutro nowe pytania' : `kończy się za ${untilMidnight(now)}`}
          </span>
        </div>
        <h2 id="daily-title" className={styles.dailyTitle}>
          10 pytań. Te same dla wszystkich.
        </h2>
        {daily ? (
          <>
            <p className={styles.dailyText}>
              Twój wynik: <strong className={styles.dailyScore}>{daily.results.filter(Boolean).length}/{daily.results.length}</strong>
              . Wyślij link znajomym — zagrają te same pytania.
            </p>
            <div className={styles.dailyActions}>
              <Button variant="play" iconStart="share" onClick={() => void shareDaily()}>
                Udostępnij
              </Button>
            </div>
            <p className={styles.dailyStatus} role="status">
              {shareMessage}
            </p>
          </>
        ) : (
          <>
            <p className={styles.dailyText}>
              Porównaj wynik ze znajomymi. Po każdej odpowiedzi dostajesz krótką ciekawostkę.
            </p>
            <div className={styles.dailyActions}>
              <Button variant="play" iconStart="play" onClick={() => onPlay({ mode: 'daily' })}>
                Graj
              </Button>
              <span className={styles.dailyHint}>ok. 3 minuty</span>
            </div>
          </>
        )}
      </section>

      <section className={styles.level} aria-label="Poziom">
        <div className={styles.levelHead}>
          <span className={styles.levelName}>
            Poziom {level.number} · {level.name}
          </span>
          <span className={styles.levelXp}>
            {level.inLevel} / {XP.perLevel} XP
          </span>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="XP w obecnym poziomie"
          aria-valuemin={0}
          aria-valuemax={XP.perLevel}
          aria-valuenow={level.inLevel}
        >
          <div className={styles.barFill} style={{ width: `${(level.inLevel / XP.perLevel) * 100}%` }} />
        </div>
        <span className={styles.levelNext}>
          Jeszcze {level.toNext} XP do poziomu „{nextLevel.name}”
        </span>
      </section>

      <section className={styles.section} aria-labelledby="paths-title">
        <h2 id="paths-title" className={styles.sectionTitle}>
          Ścieżki wiedzy
        </h2>
        <ul className={styles.paths}>
          {CATEGORIES.map((c) => {
            const { percent } = pathStats(progress.questions, c.id)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`${styles.path} ${c.tone === 'orange' ? styles.orange : styles.blue}`}
                  onClick={() => onOpenCategory(c.id)}
                >
                  <span className={styles.pathIcon}>
                    <Icon name={CATEGORY_ICON[c.id]} size={22} />
                  </span>
                  <span className={styles.pathName}>{c.name}</span>
                  <span className={styles.pathPercent}>{percent}% opanowane</span>
                  <span className={styles.pathBar} aria-hidden="true">
                    <span className={styles.pathFill} style={{ width: `${percent}%` }} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="modes-title">
        <h2 id="modes-title" className={styles.sectionTitle}>
          Tryby gry
        </h2>
        <ModeRow
          icon="bolt"
          title="Szybka runda"
          subtitle={progress.bestQuick > 0 ? `Ile zdążysz w 60 sekund? Rekord: ${progress.bestQuick}` : 'Ile zdążysz w 60 sekund?'}
          onClick={() => onPlay({ mode: 'quick' })}
        />
        <ModeRow
          icon="bulb"
          title="Nauka bez stresu"
          subtitle="10 pytań bez zegara, w swoim tempie"
          onClick={() => onPlay({ mode: 'learn' })}
        />
        <ModeRow
          icon="users"
          title="Wyzwij znajomego"
          subtitle="Zagraj 10 pytań i wyślij link"
          onClick={onNewChallenge}
        />
      </section>
    </main>
  )
}
