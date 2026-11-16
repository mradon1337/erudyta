import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '../components/Button.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { Switch } from '../components/Switch.tsx'
import { categoryName } from '../data/categories.ts'
import { count } from '../lib/plural.ts'
import { initial, profileStats, WEAK_ACCURACY } from '../lib/profile.ts'
import { cleanName, NAME_MAX } from '../lib/progress.ts'
import { levelFor, XP } from '../lib/xp.ts'
import { useProgress } from '../progress/useProgress.ts'
import styles from './ProfileScreen.module.css'

interface Props {
  /** Po wyczyszczeniu postępu — powrót do Powitania. */
  onReset: () => void
}

export function ProfileScreen({ onReset }: Props) {
  const { progress, updateProgress, resetProgress } = useProgress()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(progress.name)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const changeRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  const inputId = useId()
  const stats = profileStats(progress.questions)
  const level = levelFor(progress.xp)

  // Fokus: do pola przy edycji, z powrotem na „Zmień” po zapisie lub anulowaniu.
  useEffect(() => {
    if (editing) inputRef.current?.select()
    else if (wasEditing.current) changeRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    const name = cleanName(draft)
    updateProgress((p) => (p.name === name ? p : { ...p, name }))
    setEditing(false)
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Profil</h1>

      <section className={styles.card} aria-label="Imię i poziom">
        <span className={styles.avatar} aria-hidden="true">
          {initial(progress.name)}
        </span>
        {editing ? (
          <form className={styles.nameForm} onSubmit={saveName}>
            <label htmlFor={inputId} className="visually-hidden">
              Imię
            </label>
            <input
              id={inputId}
              ref={inputRef}
              className={styles.input}
              type="text"
              maxLength={NAME_MAX}
              autoComplete="nickname"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditing(false)
                }
              }}
            />
            <div className={styles.nameActions}>
              <Button type="submit" className={styles.small}>
                Zapisz
              </Button>
              <Button variant="text" className={styles.small} onClick={() => setEditing(false)}>
                Anuluj
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.who}>
              <span className={styles.name}>{progress.name}</span>
              <span className={styles.level}>
                Poziom {level.number} · {level.name} · {level.inLevel} / {XP.perLevel} XP
              </span>
            </div>
            <button
              ref={changeRef}
              type="button"
              className={styles.change}
              aria-label="Zmień imię"
              onClick={() => {
                setDraft(progress.name)
                setEditing(true)
              }}
            >
              Zmień
            </button>
          </>
        )}
      </section>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>odpowiedzi łącznie</dt>
          <dd>{stats.answers}</dd>
        </div>
        <div className={styles.stat}>
          <dt>skuteczność</dt>
          <dd className={styles.blue}>{stats.accuracy === null ? '–' : `${stats.accuracy}%`}</dd>
        </div>
        <div className={styles.stat}>
          <dt>pytań opanowanych</dt>
          <dd>
            {stats.known} / {stats.bankSize}
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>najdłuższa seria</dt>
          <dd className={styles.orange}>{count(progress.streak.best, ['dzień', 'dni', 'dni'])}</dd>
        </div>
      </dl>

      <section className={styles.box} aria-labelledby="acc-title">
        <h2 id="acc-title" className={styles.boxTitle}>
          Skuteczność w kategoriach
        </h2>
        <ul className={styles.cats}>
          {stats.categories.map((c) => {
            const weak = c.percent !== null && c.percent < WEAK_ACCURACY
            return (
              <li key={c.category} className={styles.cat}>
                <span className={styles.catName}>{categoryName(c.category)}</span>
                <span className={styles.catBar} aria-hidden="true">
                  <span
                    className={`${styles.catFill} ${weak ? styles.weak : ''}`}
                    style={{ width: `${c.percent ?? 0}%` }}
                  />
                </span>
                <span className={styles.catValue}>
                  {c.percent === null ? (
                    <>
                      –<span className="visually-hidden"> brak odpowiedzi</span>
                    </>
                  ) : (
                    <>
                      {c.percent}%{weak && <span className="visually-hidden"> — warto potrenować</span>}
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
        <span className={styles.boxNote}>Pomarańczowy pasek: poniżej {WEAK_ACCURACY}% — tu warto potrenować.</span>
      </section>

      <section className={`${styles.box} ${styles.settings}`} aria-label="Ustawienia">
        <Switch
          label="Zegar w rundach"
          description="Dotyczy ścieżek wiedzy. Wyzwania i Szybka runda zawsze mają zegar."
          checked={progress.settings.timer}
          onChange={(timer) => updateProgress((p) => ({ ...p, settings: { ...p.settings, timer } }))}
        />
      </section>

      <button type="button" className={styles.reset} onClick={() => setConfirmOpen(true)}>
        Wyczyść cały postęp
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Wyczyścić cały postęp?"
        text="Znikną XP, seria, powtórki, wyniki i imię. Tego nie da się cofnąć."
        cancelLabel="Zostaw postęp"
        confirmLabel="Wyczyść"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          resetProgress()
          onReset()
        }}
      />
    </main>
  )
}
