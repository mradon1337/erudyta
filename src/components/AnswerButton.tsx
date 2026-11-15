import styles from './AnswerButton.module.css'
import { Icon } from './Icon.tsx'

/** Stany odpowiedzi z `docs/DESIGN.md`. */
export type AnswerState = 'default' | 'correct' | 'wrong' | 'dimmed'

interface Props {
  letter: string
  label: string
  state: AnswerState
  disabled: boolean
  onClick: () => void
}

export function AnswerButton({ letter, label, state, disabled, onClick }: Props) {
  return (
    <button type="button" className={`${styles.answer} ${styles[state]}`} disabled={disabled} onClick={onClick}>
      <span className={styles.badge} aria-hidden="true">
        {letter}
      </span>
      <span className={styles.label}>
        <span className="visually-hidden">{letter}. </span>
        {label}
      </span>
      {state === 'correct' && <Icon name="check" size={22} strokeWidth={2.6} label="Poprawna odpowiedź" className={styles.check} />}
      {state === 'wrong' && <Icon name="cross" size={22} strokeWidth={2.6} label="Błędna odpowiedź" className={styles.cross} />}
    </button>
  )
}
