import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button.tsx'
import { Chip } from '../components/Chip.tsx'
import { Icon } from '../components/Icon.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { count } from '../lib/plural.ts'
import { roundComment, type RoundSummary } from '../lib/summary.ts'
import { shareOrCopy, type ShareOutcome } from '../platform/share.ts'
import styles from './ResultScreen.module.css'

/** Ile błędnych pytań wypisujemy na karcie „Wraca do powtórki”; resztę streszcza jedno zdanie. */
const MISTAKES_SHOWN = 3
const RING_R = 48
const RING_LENGTH = 2 * Math.PI * RING_R

interface Props {
  summary: RoundSummary
  /** Nazwa trybu na chipie, np. „Wyzwanie dnia ukończone”. */
  label: string
  /** Tekst do udostępnienia (Wyzwanie dnia, wyzwanie z linku); `null` — zamiast „Udostępnij” jest „Zagraj jeszcze raz”. */
  shareText: string | null
  /** `null`, gdy nie ma czego zagrać ponownie (np. powtórki na dziś skończone). */
  onReplay: (() => void) | null
  onDone: () => void
}

const SHARE_MESSAGES: Record<ShareOutcome, string> = {
  shared: '',
  cancelled: '',
  copied: 'Skopiowano wynik do schowka.',
  failed: 'Nie udało się udostępnić wyniku.',
}

function subtitle(s: RoundSummary): string {
  if (s.mode === 'quick') {
    const answers = count(s.correct, ['poprawna odpowiedź', 'poprawne odpowiedzi', 'poprawnych odpowiedzi'])
    return s.newRecord ? `${answers} w 60 sekund.` : `${answers} w 60 sekund. Rekord: ${s.bestQuick}.`
  }
  if (s.challenge) {
    const { from, theirs, outcome } = s.challenge
    const name = from || 'Znajomy'
    const theirScore = theirs.filter(Boolean).length
    // Link z dzisiejszym Wyzwaniem dnia, które nie było jeszcze grane, zalicza też Wyzwanie dnia.
    const daily = s.dailyBonus > 0 ? ` Do tego +${s.dailyBonus} XP za Wyzwanie dnia.` : ''
    if (outcome === 'win')
      return `Lepiej niż ${name}: ${s.correct} do ${theirScore}. +${s.challengeBonus} XP za wygraną.${daily}`
    if (outcome === 'draw') return `Remis: ${s.correct} do ${theirScore}.${daily}`
    if (outcome === 'lose') return `${name} tym razem lepiej: ${theirScore} do ${s.correct}.${daily}`
    return `${s.correct} z ${s.total}. Wyślij link — znajomi zagrają te same pytania.${daily}`
  }
  if (s.training) {
    const daily = s.dailyResults ? ` (${s.dailyResults.filter(Boolean).length}/${s.dailyResults.length})` : ''
    return `Trening: wynik dnia${daily} był już zapisany, więc ta runda nie daje XP.`
  }
  const base =
    s.correct === s.total
      ? `Wszystkie ${count(s.total, ['odpowiedź', 'odpowiedzi', 'odpowiedzi'])} poprawne.`
      : `${s.correct} z ${count(s.total, ['odpowiedzi', 'odpowiedzi', 'odpowiedzi'])} poprawnie.`
  return s.dailyBonus > 0 ? `${base} Do tego +${s.dailyBonus} XP za Wyzwanie dnia.` : base
}

export function ResultScreen({ summary, label, shareText, onReplay, onDone }: Props) {
  const [shareMessage, setShareMessage] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { correct, total, mistakes } = summary
  const comment = roundComment(summary)
  const quick = summary.mode === 'quick'
  const ratio = total === 0 ? 0 : correct / total

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])

  const share = async () => {
    if (!shareText) return
    setShareMessage('')
    setShareMessage(SHARE_MESSAGES[await shareOrCopy(shareText)])
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <IconButton icon="close" label="Zamknij wynik" onClick={onDone} />
        <Chip>{label}</Chip>
        <span className={styles.spacer} aria-hidden="true" />
      </header>

      <section className={styles.hero} aria-labelledby="result-comment">
        <div className={styles.ring}>
          <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
            <circle className={styles.ringTrack} cx="56" cy="56" r={RING_R} />
            {ratio > 0 && (
              <circle
                className={styles.ringFill}
                cx="56"
                cy="56"
                r={RING_R}
                strokeDasharray={`${ratio * RING_LENGTH} ${RING_LENGTH}`}
                transform="rotate(-90 56 56)"
              />
            )}
          </svg>
          <span className={styles.score} aria-hidden="true">
            {quick ? correct : `${correct}/${total}`}
          </span>
        </div>
        <div className={styles.heroText}>
          <h1 id="result-comment" ref={headingRef} tabIndex={-1} className={styles.comment}>
            {comment}
          </h1>
          <p className={styles.heroSub}>
            <span className="visually-hidden">
              {quick ? `Wynik: ${correct}. ` : `Wynik: ${correct} na ${total}. `}
            </span>
            {subtitle(summary)}
          </p>
        </div>
      </section>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>XP zdobyte</dt>
          <dd className={`${styles.statValue} ${styles.blue}`}>+{summary.xp}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>{summary.streak > 1 ? 'seria trwa' : 'seria'}</dt>
          <dd className={`${styles.statValue} ${styles.orange}`}>{count(summary.streak, ['dzień', 'dni', 'dni'])}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>na odpowiedź</dt>
          <dd className={styles.statValue}>{summary.avgSeconds === null ? '–' : summary.avgSeconds < 1 ? '<1 s' : `${summary.avgSeconds} s`}</dd>
        </div>
      </dl>

      {summary.facts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Zapamiętaj z dzisiejszej rundy</h2>
          <ul className={styles.facts}>
            {summary.facts.map((fact) => (
              <li key={fact} className={styles.fact}>
                <Icon name="bulb" size={22} className={styles.bulb} />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mistakes.length > 0 ? (
        <section className={styles.review} aria-labelledby="review-title">
          <div className={styles.reviewHead}>
            <h2 id="review-title" className={styles.reviewLabel}>
              Wraca do powtórki
            </h2>
            <span className={styles.reviewWhen}>jutro</span>
          </div>
          <ul className={styles.mistakes}>
            {mistakes.slice(0, MISTAKES_SHOWN).map((m) => (
              <li key={m.id} className={styles.mistake}>
                <span className={styles.mistakeQ}>{m.question}</span>
                <span className={styles.mistakeA}>
                  {m.yours === null ? 'Czas minął' : `Twoja odpowiedź: ${m.yours}`} · poprawna: {m.correct}
                </span>
              </li>
            ))}
          </ul>
          {mistakes.length > MISTAKES_SHOWN && (
            <p className={styles.more}>
              i jeszcze {count(mistakes.length - MISTAKES_SHOWN, ['pytanie', 'pytania', 'pytań'])}
            </p>
          )}
        </section>
      ) : (
        total > 0 && (
          <p className={styles.clean}>
            <Icon name="check" size={22} strokeWidth={2.4} className={styles.check} />
            Wszystko dobrze. Nic nie trafia do powtórek.
          </p>
        )
      )}

      <div className={styles.actions}>
        {shareText ? (
          <Button variant="secondary" iconStart="share" className={styles.action} onClick={() => void share()}>
            Udostępnij
          </Button>
        ) : (
          onReplay && (
            <Button variant="secondary" className={styles.action} onClick={onReplay}>
              Zagraj jeszcze raz
            </Button>
          )
        )}
        <Button className={styles.action} onClick={onDone}>
          Gotowe
        </Button>
      </div>
      <p className={styles.shareStatus} role="status">
        {shareMessage}
      </p>
    </main>
  )
}
