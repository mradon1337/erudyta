import { Icon, type IconName } from './Icon.tsx'
import styles from './BottomNav.module.css'

export type Tab = 'home' | 'reviews' | 'ranking' | 'profile'

const TABS: readonly { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Start', icon: 'home' },
  { id: 'reviews', label: 'Powtórki', icon: 'repeat' },
  { id: 'ranking', label: 'Ranking', icon: 'trophy' },
  { id: 'profile', label: 'Profil', icon: 'user' },
]

interface Props {
  active: Tab
  /** Liczba powtórek na dziś — licznik na zakładce (0 = bez licznika). */
  reviewsDue: number
  onSelect: (tab: Tab) => void
}

/** Dolna nawigacja: tylko na ekranach Start, Powtórki, Ranking, Profil. */
export function BottomNav({ active, reviewsDue, onSelect }: Props) {
  return (
    <nav className={styles.nav} aria-label="Główna nawigacja">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tab} ${tab.id === active ? styles.active : ''}`}
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <span className={styles.iconWrap}>
            <Icon name={tab.icon} />
            {tab.id === 'reviews' && reviewsDue > 0 && (
              <span className={styles.badge} aria-hidden="true">
                {reviewsDue > 99 ? '99+' : reviewsDue}
              </span>
            )}
          </span>
          {tab.label}
          {tab.id === 'reviews' && reviewsDue > 0 && <span className="visually-hidden">, na dziś: {reviewsDue}</span>}
        </button>
      ))}
    </nav>
  )
}
