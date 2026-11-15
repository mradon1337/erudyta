import { IconButton } from './IconButton.tsx'
import { Icon } from './Icon.tsx'
import styles from './RoundHeader.module.css'

interface Props {
  /** „Pytanie 2 z 10” albo w Szybkiej rundzie „Poprawne: 4”. */
  title: string
  /** Sekundy na zegarze; `null` = runda bez zegara (bez pigułki czasu). */
  seconds: number | null
  /** Zegar w stanie ostrzeżenia (≤ 5 s, tylko gdy tyka). */
  warn: boolean
  /** Segmenty postępu; `null` = bez segmentów (Szybka runda). */
  progress: { results: readonly boolean[]; total: number; current: number } | null
  onClose: () => void
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function RoundHeader({ title, seconds, warn, progress, onClose }: Props) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <IconButton icon="close" label="Zakończ rundę" onClick={onClose} />
        <span className={styles.title}>{title}</span>
        {seconds === null ? (
          <span className={styles.placeholder} aria-hidden="true" />
        ) : (
          <div className={`${styles.timer} ${warn ? styles.warn : ''}`}>
            <Icon name="clock" size={18} />
            <span>
              <span className="visually-hidden">Pozostały czas: </span>
              {formatClock(seconds)}
            </span>
          </div>
        )}
      </header>

      {progress && (
        <div
          className={styles.segments}
          style={{ gridTemplateColumns: `repeat(${progress.total}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {Array.from({ length: progress.total }, (_, i) => {
            const result = progress.results[i]
            const tone =
              result === true ? styles.good : result === false ? styles.bad : i === progress.current ? styles.now : ''
            return <span key={i} className={`${styles.segment} ${tone}`} />
          })}
        </div>
      )}
    </div>
  )
}
