import { useId, useState, type FormEvent } from 'react'
import { Button } from '../components/Button.tsx'
import { Icon, type IconName } from '../components/Icon.tsx'
import { NAME_MAX } from '../lib/progress.ts'
import styles from './OnboardingScreen.module.css'

interface Props {
  /** Imię z pola (może być puste — wtedy zostaje domyślne). */
  onStart: (name: string) => void
}

const PERKS: readonly { icon: IconName; tone: 'blue' | 'orange'; title: string; text: string }[] = [
  {
    icon: 'bulb',
    tone: 'orange',
    title: 'Ciekawostka po każdej odpowiedzi',
    text: 'Nawet po trafnej odpowiedzi dowiesz się czegoś więcej.',
  },
  {
    icon: 'repeat',
    tone: 'blue',
    title: 'Powtórki pamiętają za Ciebie',
    text: 'Błędne odpowiedzi wracają po 1, 3, 7 i 14 dniach.',
  },
  {
    icon: 'users',
    tone: 'blue',
    title: 'Wyzwania ze znajomymi',
    text: 'Wyślij link — zagracie te same 10 pytań.',
  },
]

/** Powitanie przy pierwszym uruchomieniu (i po wyczyszczeniu postępu). */
export function OnboardingScreen({ onStart }: Props) {
  const [name, setName] = useState('')
  const inputId = useId()
  const hintId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onStart(name)
  }

  return (
    <main className={styles.screen}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">
              E
            </span>
            <span className={styles.brandName}>Erudyta</span>
          </div>

          <h1 className={styles.title}>Wiedza ogólna po 3 minuty dziennie.</h1>

          <ul className={styles.perks}>
            {PERKS.map((p) => (
              <li key={p.title} className={styles.perk}>
                <span className={`${styles.perkIcon} ${styles[p.tone]}`}>
                  <Icon name={p.icon} size={22} />
                </span>
                <span className={styles.perkText}>
                  <span className={styles.perkTitle}>{p.title}</span>
                  <span className={styles.perkSub}>{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              Jak mamy Cię nazywać?
            </label>
            <input
              id={inputId}
              className={styles.input}
              type="text"
              maxLength={NAME_MAX}
              placeholder="np. Kasia"
              autoComplete="nickname"
              aria-describedby={hintId}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span id={hintId} className={styles.hint}>
              Imię zobaczą znajomi, którym wyślesz wyzwanie. Można je pominąć.
            </span>
          </div>
        </div>

        <div className={styles.bottom}>
          <Button type="submit" block className={styles.start}>
            Zaczynamy
          </Button>
          <span className={styles.note}>Bez zakładania konta. Postęp zapisuje się na tym urządzeniu.</span>
        </div>
      </form>
    </main>
  )
}
