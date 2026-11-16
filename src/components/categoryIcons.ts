import type { CategoryId } from '../data/categories.ts'
import type { IconName } from './Icon.tsx'

/** Ikona każdej ścieżki wiedzy (kształty z makiety `Main.dc.html`). */
export const CATEGORY_ICON: Readonly<Record<CategoryId, IconName>> = {
  historia: 'landmark',
  geografia: 'globe',
  nauka: 'flask',
  sztuka: 'palette',
  sport: 'medal',
  jezyk: 'book',
}
