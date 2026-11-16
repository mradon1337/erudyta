import { useEffect, useRef } from 'react'
import { Button } from '../components/Button.tsx'
import { IconButton } from '../components/IconButton.tsx'
import { ResultSquares } from '../components/ResultSquares.tsx'
import { outcome, playedResults, score, type ChallengeInfo } from '../lib/challenges.ts'
import { initial } from '../lib/profile.ts'
import { QUESTION_SECONDS } from '../lib/session.ts'
import type { ParseResult } from '../lib/share.ts'
import { XP } from '../lib/xp.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './ChallengeScreen.module.css'

interface Props {
  link: Exclude<ParseResult, { status: 'none' }>
  onAccept: (challenge: ChallengeInfo) => void
  onClose: () => void
}

/** Ekran „Wyzwanie od znajomego” (EKRANY.md, pkt 9): zaproszenie, porównanie albo komunikat o złym linku. */
export function ChallengeScreen({ link, onAccept, onClose }: Props) {
  const { progress } = useProgress()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  const header = (
    <header className={styles.header}>
      <IconButton icon="close" label="Zamknij wyzwanie" onClick={onClose} />
      <span className={styles.chip}>Wyzwanie z linku</span>
      <span className={styles.spacer} aria-hidden="true" />
    </header>
  )

  if (link.status !== 'ok') {
    return (
      <main className={styles.screen}>
        {header}
        <div className={styles.intro}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            Tego wyzwania nie da się już rozegrać
          </h1>
          <p className={styles.text}>
            {link.status === 'invalid'
              ? 'Link jest uszkodzony albo niepełny. Poproś o wysłanie go jeszcze raz.'
              : 'Link pochodzi z innej wersji bazy pytań, więc pytania by się nie zgadzały.'}
          </p>
        </div>
        <div className={styles.bottom}>
          <Button block onClick={onClose}>
            Na start
          </Button>
        </div>
      </main>
    )
  }

  const { challenge } = link
  const sender = challenge.name || 'Znajomy'
  const mine = playedResults(progress, challenge.seed)

  if (mine) {
    const result = outcome(mine, challenge.results)
    const verdict =
      result === 'win'
        ? `Wygrana: ${score(mine)} do ${score(challenge.results)}`
        : result === 'lose'
          ? `${sender} wygrywa: ${score(challenge.results)} do ${score(mine)}`
          : `Remis: ${score(mine)} do ${score(challenge.results)}`
    return (
      <main className={styles.screen}>
        {header}
        <div className={styles.intro}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            To wyzwanie już rozegrane
          </h1>
          <p className={styles.text}>{verdict}. Jedno wyzwanie można rozegrać raz.</p>
        </div>
        <section className={styles.card}>
          <div className={styles.row}>
            <span className={styles.rowName}>{sender}</span>
            <span className={styles.rowScore}>
              {score(challenge.results)}/{challenge.results.length}
            </span>
          </div>
          <ResultSquares results={challenge.results} who={sender} />
          <div className={styles.row}>
            <span className={styles.rowName}>Ty</span>
            <span className={styles.rowScore}>
              {score(mine)}/{mine.length}
            </span>
          </div>
          <ResultSquares results={mine} who="Ty" />
        </section>
        <div className={styles.bottom}>
          <Button block onClick={onClose}>
            Na start
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.screen}>
      {header}
      <div className={styles.intro}>
        <span className={styles.avatar} aria-hidden="true">
          {challenge.name ? initial(challenge.name) : '?'}
        </span>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          {challenge.name ? `${challenge.name} rzuca Ci wyzwanie` : 'Masz wyzwanie od znajomego'}
        </h1>
        <p className={styles.text}>Zagrasz dokładnie te same 10 pytań, w tej samej kolejności. Dasz radę lepiej?</p>
      </div>

      <section className={styles.card} aria-label="Wynik do pobicia">
        <div className={styles.row}>
          <span className={styles.eyebrow}>Wynik do pobicia</span>
          <span className={styles.target}>
            {score(challenge.results)}/{challenge.results.length}
          </span>
        </div>
        <ResultSquares results={challenge.results} who={sender} />
        <span className={styles.note}>Niebieskie — dobre odpowiedzi, pomarańczowe — błędy. Treści pytań nie zdradzamy.</span>
      </section>

      <ul className={styles.rules}>
        <li>
          <strong>10</strong>
          <span>pytań</span>
        </li>
        <li>
          <strong>{QUESTION_SECONDS} s</strong>
          <span>na każde</span>
        </li>
        <li>
          <strong>+{XP.challengeWin} XP</strong>
          <span>za wygraną</span>
        </li>
      </ul>

      <div className={styles.bottom}>
        <Button
          variant="play"
          iconStart="play"
          block
          className={styles.accept}
          onClick={() => onAccept({ seed: challenge.seed, from: challenge.name, theirs: challenge.results })}
        >
          Podejmij wyzwanie
        </Button>
        <Button variant="text" block onClick={onClose}>
          Nie teraz
        </Button>
      </div>
    </main>
  )
}
