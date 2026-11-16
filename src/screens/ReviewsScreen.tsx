import { Button } from '../components/Button.tsx'
import { categoryName } from '../data/categories.ts'
import { toDay, weekdayShort } from '../lib/dates.ts'
import { count } from '../lib/plural.ts'
import { countDue, dueLabel, REVIEW_LIMIT, reviewCards, weekForecast } from '../lib/reviews.ts'
import type { RoundRequest } from '../lib/round.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './ReviewsScreen.module.css'

/** Szacowany czas na jedno pytanie powtórki (bez zegara, z ciekawostką). */
const SECONDS_PER_REVIEW = 15
/** Wysokość najwyższego słupka wykresu w px. */
const BAR_MAX = 84

interface Props {
  onPlay: (request: RoundRequest) => void
}

/** Etap powtórki jako 4 kreski: etap 1 pomarańczowy (świeży błąd), dalsze niebieskie. */
function Stage({ box }: { box: number }) {
  return (
    <span className={styles.stage} role="img" aria-label={`Etap ${box} z 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`${styles.dash} ${i <= box ? (box === 1 ? styles.dashBad : styles.dashGood) : ''}`} />
      ))}
    </span>
  )
}

export function ReviewsScreen({ onPlay }: Props) {
  const { progress } = useProgress()
  const today = toDay(new Date())
  const due = countDue(progress.questions, today)
  const cards = reviewCards(progress.questions, today)
  const week = weekForecast(progress.questions, today)
  const max = Math.max(1, ...week.map((d) => d.count))
  // Gdy na dziś nic nie ma, pierwsza karta to najbliższy termin.
  const nearest = cards[0]
  const minutes = Math.max(1, Math.ceil((Math.min(due, REVIEW_LIMIT) * SECONDS_PER_REVIEW) / 60))
  const chartLabel = week
    .map((d, i) => `${i === 0 ? 'dziś' : weekdayShort(d.day)} ${d.count}`)
    .join(', ')

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Powtórki</h1>
        <p className={styles.lead}>
          Pytania, które sprawiły Ci trudność, wracają po 1, 3, 7 i 14 dniach — aż zostaną w głowie na dobre.
        </p>
      </header>

      {cards.length === 0 ? (
        <section className={styles.empty}>
          <h2 className={styles.emptyTitle}>Na razie nic do powtórki</h2>
          <p className={styles.emptyText}>
            Każde pytanie z błędną odpowiedzią (albo bez odpowiedzi na czas) trafia tutaj i wraca następnego dnia.
            Poprawna odpowiedź w powtórce przesuwa je dalej: za 3, 7 i 14 dni, aż do opanowania.
          </p>
          <Button variant="play" iconStart="play" onClick={() => onPlay({ mode: 'learn' })}>
            Zagraj rundę
          </Button>
        </section>
      ) : (
        <>
          <section className={styles.today} aria-labelledby="today-label">
            <div className={styles.todayText}>
              <span id="today-label" className={styles.eyebrow}>
                Na dziś
              </span>
              {due > 0 ? (
                <>
                  <span className={styles.todayCount}>{count(due, ['pytanie', 'pytania', 'pytań'])}</span>
                  <span className={styles.todayHint}>
                    ok. {count(minutes, ['minuta', 'minuty', 'minut'])}
                    {due > REVIEW_LIMIT ? ` · po ${REVIEW_LIMIT} w rundzie` : ''}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.todayDone}>Wszystko powtórzone</span>
                  {nearest && (
                    <span className={styles.todayHint}>
                      Najbliższa powtórka: {nearest.inDays === 1 ? 'jutro' : `za ${nearest.inDays} dni`}
                    </span>
                  )}
                </>
              )}
            </div>
            <Button variant="play" iconStart="play" disabled={due === 0} onClick={() => onPlay({ mode: 'review' })}>
              Zacznij
            </Button>
          </section>

          <section className={styles.week} aria-labelledby="week-title">
            <div className={styles.weekHead}>
              <h2 id="week-title" className={styles.weekTitle}>
                Najbliższy tydzień
              </h2>
              <span className={styles.weekTotal}>{count(cards.length, ['pytanie', 'pytania', 'pytań'])} w obiegu</span>
            </div>
            <div className={styles.chart} role="img" aria-label={`Liczba powtórek: ${chartLabel}`}>
              {week.map((d, i) => (
                <div key={d.day} className={`${styles.col} ${i === 0 ? styles.now : ''}`}>
                  <span className={styles.colCount}>{d.count}</span>
                  <span className={styles.colBar} style={{ height: d.count === 0 ? 0 : Math.max(6, (d.count / max) * BAR_MAX) }} />
                  <span className={styles.colDay}>{i === 0 ? 'Dziś' : weekdayShort(d.day)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.cards} aria-labelledby="cards-title">
            <h2 id="cards-title" className={styles.cardsTitle}>
              Twoje karty
            </h2>
            <ul className={styles.list}>
              {cards.map((c) => (
                <li key={c.question.id} className={styles.card}>
                  <span className={styles.cardQ}>{c.question.q}</span>
                  <span className={styles.cardMeta}>
                    <span className={styles.cardWhen}>
                      {categoryName(c.question.cat)} · {dueLabel(c.inDays)}
                    </span>
                    <Stage box={c.box} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
