import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button.tsx'
import { Icon } from '../components/Icon.tsx'
import { levelFor, XP, type Level } from '../lib/xp.ts'
import { appUrl, shareOrCopy } from '../platform/share.ts'
import styles from './LevelUpScreen.module.css'

interface Props {
  level: Level
  onContinue: () => void
}

/** Kwadraciki opadające raz przy wejściu: [left w %, top w px, kolor, opóźnienie w s] jak na makiecie. */
const BITS: readonly [number, number, 'accent' | 'surface' | 'ink', number][] = [
  [12, 120, 'accent', 0.1],
  [28, 70, 'surface', 0.25],
  [77, 96, 'accent', 0.15],
  [86, 190, 'surface', 0.35],
  [16, 250, 'ink', 0.3],
  [64, 54, 'ink', 0.2],
  [8, 380, 'surface', 0.4],
  [89, 350, 'accent', 0.45],
]

function blurb(level: Level): string {
  const done = `Poziom ${level.number - 1} zaliczony.`
  if (level.name === 'Erudyta') return `${done} Tak nazywa się ta aplikacja — i teraz także Ty.`
  return `${done} Każda runda to kolejne ciekawostki do zapamiętania.`
}

/** Ekran „Nowy poziom” po wyniku rundy, która podniosła poziom. */
export function LevelUpScreen({ level, onContinue }: Props) {
  const [message, setMessage] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nextLevel = levelFor(level.number * XP.perLevel)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])

  const brag = async () => {
    setMessage('')
    const outcome = await shareOrCopy(`Erudyta · Poziom ${level.number} · ${level.name}\n${appUrl()}`)
    setMessage(outcome === 'copied' ? 'Skopiowano do schowka.' : outcome === 'failed' ? 'Nie udało się udostępnić.' : '')
  }

  return (
    <main className={styles.screen}>
      {BITS.map(([left, top, tone, delay]) => (
        <span
          key={`${left}-${top}`}
          className={`${styles.bit} ${styles[tone]}`}
          style={{ left: `${left}%`, top, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      ))}

      <div className={styles.top}>
        <span className={styles.eyebrow}>Nowy poziom</span>
        <div className={styles.badge} aria-hidden="true">
          {level.number}
        </div>
        <h1 ref={headingRef} tabIndex={-1} className={styles.name}>
          <span className="visually-hidden">Poziom {level.number}: </span>
          {level.name}
        </h1>
        <p className={styles.blurb}>{blurb(level)}</p>
      </div>

      <div className={styles.bottom}>
        <section className={styles.progress} aria-label="Następny poziom">
          <div className={styles.progressHead}>
            <span className={styles.progressTitle}>
              Do poziomu {nextLevel.number} · {nextLevel.name}
            </span>
            <span className={styles.progressXp}>
              {level.inLevel} / {XP.perLevel} XP
            </span>
          </div>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={`Postęp do poziomu ${nextLevel.number}`}
            aria-valuemin={0}
            aria-valuemax={XP.perLevel}
            aria-valuenow={level.inLevel}
          >
            <div className={styles.fill} style={{ width: `${(level.inLevel / XP.perLevel) * 100}%` }} />
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.brag} onClick={() => void brag()}>
            <Icon name="share" size={18} />
            Pochwal się
          </button>
          <Button className={styles.continue} onClick={onContinue}>
            Gram dalej
          </Button>
        </div>
        <p className={styles.status} role="status">
          {message}
        </p>
      </div>
    </main>
  )
}
