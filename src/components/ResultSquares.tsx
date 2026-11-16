import { count } from '../lib/plural.ts'
import styles from './ResultSquares.module.css'

interface Props {
  results: readonly boolean[]
  /** Czyj to wynik — początek opisu dla czytnika ekranu, np. „Kasia”. */
  who: string
}

/** Kratki dobrych (niebieskie) i złych (pomarańczowe) odpowiedzi — zawsze z opisem słownym. */
export function ResultSquares({ results, who }: Props) {
  const good = results.filter(Boolean).length
  const bad = results.length - good
  const label = `${who}: ${count(good, ['dobra odpowiedź', 'dobre odpowiedzi', 'dobrych odpowiedzi'])} i ${count(bad, ['zła', 'złe', 'złych'])}`
  return (
    <div className={styles.grid} role="img" aria-label={label}>
      {results.map((r, i) => (
        <span key={i} className={`${styles.square} ${r ? styles.good : styles.bad}`} />
      ))}
    </div>
  )
}
