import styles from './PlaceholderScreen.module.css'

/** Tymczasowa zakładka — zastępują ją ekrany z Etapów 5–7 (docs/PLAN.md). */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>Ten ekran jeszcze powstaje.</p>
    </main>
  )
}
