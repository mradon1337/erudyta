import { useEffect, useRef } from 'react'
import { Button } from './Button.tsx'
import styles from './FeedbackSheet.module.css'
import { Icon } from './Icon.tsx'

interface Props {
  tone: 'good' | 'bad'
  title: string
  subtitle: string
  fact: string
  nextLabel: string
  onNext: () => void
}

/** Panel po odpowiedzi: werdykt, poprawna odpowiedź, ciekawostka, „Dalej”. Fokus od razu na „Dalej”. */
export function FeedbackSheet({ tone, title, subtitle, fact, nextLabel, onNext }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section className={`${styles.sheet} ${styles[tone]}`} aria-live="polite" aria-label="Wynik odpowiedzi">
      <div className={styles.verdict}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.fact}>
        <Icon name="bulb" size={22} className={styles.bulb} />
        <div className={styles.factBody}>
          <span className={styles.factLabel}>Ciekawostka</span>
          <p className={styles.factText}>{fact}</p>
        </div>
      </div>
      <Button ref={nextRef} variant="dark" iconEnd="arrowRight" block onClick={onNext}>
        {nextLabel}
      </Button>
    </section>
  )
}
