import { CATEGORIES } from './data/categories.ts'
import { QUESTIONS } from './data/questions.ts'
import styles from './App.module.css'

/**
 * Szkielet aplikacji: potwierdza, że tokeny, fonty i baza pytań działają.
 * Właściwe ekrany powstają etapami — patrz docs/PLAN.md (Etap 1 i dalej).
 */
export function App() {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.hello}>Szkielet projektu</span>
        <h1 className={styles.logo}>Erudyta</h1>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Baza pytań</span>
        <h2 className={styles.heroTitle}>{QUESTIONS.length} pytań z ciekawostkami</h2>
        <p>Ekrany z projektu „Kobalt” powstają etapami opisanymi w docs/PLAN.md.</p>
      </section>

      <section className={styles.section}>
        <h3>Ścieżki wiedzy</h3>
        <ul className={styles.grid}>
          {CATEGORIES.map((category) => (
            <li key={category.id} className={styles.tile}>
              <span className={styles.tileName}>{category.name}</span>
              <span className={styles.tileMeta}>
                {QUESTIONS.filter((q) => q.cat === category.id).length} pytań
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
