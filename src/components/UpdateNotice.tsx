import { useEffect, useState } from 'react'
import { registerServiceWorker } from '../platform/serviceWorker.ts'
import styles from './UpdateNotice.module.css'

/**
 * Pasek „Jest nowa wersja” po aktualizacji service workera. Nie przeładowuje strony sam — gracz może być
 * w środku rundy; decyduje przyciskiem.
 */
export function UpdateNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => registerServiceWorker(() => setVisible(true)), [])

  if (!visible) return null
  return (
    <div className={styles.notice} role="status">
      <span className={styles.text}>Jest nowa wersja aplikacji.</span>
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        Odśwież
      </button>
      <button type="button" className={styles.later} onClick={() => setVisible(false)}>
        Później
      </button>
    </div>
  )
}
