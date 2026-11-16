import { useId } from 'react'
import styles from './Switch.module.css'

interface Props {
  label: string
  /** Krótkie wyjaśnienie pod etykietą (opcjonalne). */
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Wiersz ustawień z przełącznikiem 52×32 (`role="switch"`). */
export function Switch({ label, description, checked, onChange }: Props) {
  const labelId = useId()
  const descId = useId()
  return (
    <div className={styles.row}>
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {description && (
          <span id={descId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        className={`${styles.switch} ${checked ? styles.on : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
    </div>
  )
}
