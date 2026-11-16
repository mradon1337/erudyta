import { useEffect, useRef } from 'react'
import { Button } from '../components/Button.tsx'
import { CATEGORY_ICON } from '../components/categoryIcons.ts'
import { Chip } from '../components/Chip.tsx'
import { Icon } from '../components/Icon.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { categoryName, type CategoryId } from '../data/categories.ts'
import { factCollection, pathStats } from '../lib/home.ts'
import { count } from '../lib/plural.ts'
import type { RoundRequest } from '../lib/round.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './CategoryScreen.module.css'

interface Props {
  category: CategoryId
  onBack: () => void
  onPlay: (request: RoundRequest) => void
}

export function CategoryScreen({ category, onBack, onPlay }: Props) {
  const { progress } = useProgress()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stats = pathStats(progress.questions, category)
  const facts = factCollection(progress.questions, category)
  const hidden = stats.total - facts.length

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <IconButton icon="arrowLeft" label="Wróć do startu" onClick={onBack} />
        <span className={styles.crumb}>Ścieżka wiedzy</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroHead}>
          <span className={styles.heroIcon}>
            <Icon name={CATEGORY_ICON[category]} size={28} />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            {categoryName(category)}
          </h1>
        </div>
        <div className={styles.mastery}>
          <div className={styles.masteryHead}>
            <span className={styles.percent}>{stats.percent}% opanowane</span>
            <span className={styles.ofTotal}>
              {stats.known} z {count(stats.total, ['pytania', 'pytań', 'pytań'])}
            </span>
          </div>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label="Opanowanie ścieżki"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.percent}
          >
            <div className={styles.barFill} style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
        <dl className={styles.counters}>
          <div className={styles.counter}>
            <dt>opanowane</dt>
            <dd>{stats.known}</dd>
          </div>
          <div className={styles.counter}>
            <dt>w powtórkach</dt>
            <dd>{stats.inReview}</dd>
          </div>
          <div className={styles.counter}>
            <dt>{stats.fresh === 1 ? 'nowe' : 'nowych'}</dt>
            <dd>{stats.fresh}</dd>
          </div>
        </dl>
      </section>

      <div className={styles.actions}>
        <Button variant="play" iconStart="play" className={styles.action} onClick={() => onPlay({ mode: 'category', category })}>
          Runda 10 pytań
        </Button>
        <Button
          variant="secondary"
          className={styles.action}
          onClick={() => onPlay({ mode: 'category', category, noTimer: true })}
        >
          Bez zegara
        </Button>
      </div>

      <section className={styles.collection} aria-labelledby="collection-title">
        {stats.known === stats.total && stats.total > 0 && <Chip>Ścieżka ukończona</Chip>}
        <div className={styles.collectionHead}>
          <h2 id="collection-title" className={styles.collectionTitle}>
            Kolekcja ciekawostek
          </h2>
          <span className={styles.collectionCount}>
            {facts.length} / {stats.total}
          </span>
        </div>
        {facts.length > 0 && (
          <ul className={styles.facts}>
            {facts.map((q) => (
              <li key={q.id} className={styles.fact}>
                <span className={styles.factLead}>{q.a[0]}</span>
                <span className={styles.factText}>{q.f}</span>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 && (
          <p className={styles.locked}>
            <Icon name="lock" size={18} />
            {count(hidden, ['ciekawostka czeka', 'ciekawostki czekają', 'ciekawostek czeka'])} na odkrycie
          </p>
        )}
        {facts.length === 0 && (
          <p className={styles.hint}>
            Pytanie trafia do kolekcji, gdy zostanie opanowane: od razu po poprawnej odpowiedzi albo po przejściu
            wszystkich powtórek.
          </p>
        )}
      </section>
    </main>
  )
}
