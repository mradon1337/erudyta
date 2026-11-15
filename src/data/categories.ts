export type CategoryId = 'historia' | 'geografia' | 'nauka' | 'sztuka' | 'sport' | 'jezyk'

export interface Category {
  id: CategoryId
  name: string
  /** Kolor akcentu kafla: niebieski lub pomarańczowy, jak w projekcie Kobalt. */
  tone: 'blue' | 'orange'
}

export const CATEGORIES: readonly Category[] = [
  { id: 'historia', name: 'Historia', tone: 'blue' },
  { id: 'geografia', name: 'Geografia', tone: 'blue' },
  { id: 'nauka', name: 'Nauka i kosmos', tone: 'blue' },
  { id: 'sztuka', name: 'Sztuka i kultura', tone: 'orange' },
  { id: 'sport', name: 'Sport', tone: 'orange' },
  { id: 'jezyk', name: 'Język i literatura', tone: 'blue' },
]

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id
}
