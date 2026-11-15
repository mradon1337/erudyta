import { describe, expect, it } from 'vitest'
import type { Question } from '../data/questions.ts'
import { addDays } from './dates.ts'
import {
  answer,
  categoryMastery,
  countDue,
  dueToday,
  nextDueAfter,
  weekForecast,
  type QuestionState,
} from './reviews.ts'

const D0 = '2026-11-15'
const bank = { has: (id: string) => id !== 'gone' }

function state(partial: Partial<QuestionState>): QuestionState {
  return { seen: 1, correct: 0, box: 1, due: D0, known: false, last: D0, ...partial }
}

describe('answer — pełna ścieżka powtórki', () => {
  it('błąd → 1 → 3 → 7 → 14 dni → opanowane', () => {
    let day = D0
    let s = answer(undefined, false, day, false)
    expect(s).toMatchObject({ box: 1, due: addDays(D0, 1), known: false, seen: 1, correct: 0 })

    const expected = [
      { box: 2, gap: 3 },
      { box: 3, gap: 7 },
      { box: 4, gap: 14 },
    ]
    for (const step of expected) {
      day = s.due as string
      s = answer(s, true, day, true)
      expect(s.box).toBe(step.box)
      expect(s.due).toBe(addDays(day, step.gap))
      expect(s.known).toBe(false)
    }

    day = s.due as string
    s = answer(s, true, day, true)
    expect(s).toMatchObject({ box: 0, due: null, known: true, seen: 5, correct: 4, last: day })
  })

  it('błąd w połowie ścieżki wraca na etap 1 z terminem jutro', () => {
    let s = answer(undefined, false, D0, false)
    s = answer(s, true, addDays(D0, 1), true) // etap 2
    s = answer(s, true, addDays(D0, 4), true) // etap 3
    expect(s.box).toBe(3)

    const day = addDays(D0, 11)
    s = answer(s, false, day, true)
    expect(s).toMatchObject({ box: 1, due: addDays(day, 1), known: false })
  })

  it('poprawna odpowiedź na nowe pytanie od razu je opanowuje', () => {
    expect(answer(undefined, true, D0, false)).toMatchObject({ box: 0, due: null, known: true, seen: 1, correct: 1 })
  })

  it('błąd przy opanowanym pytaniu cofa opanowanie', () => {
    const known = state({ box: 0, due: null, known: true })
    expect(answer(known, false, D0, false)).toMatchObject({ box: 1, known: false, due: addDays(D0, 1) })
  })

  it('poprawna odpowiedź poza Powtórkami przed terminem nie zmienia etapu', () => {
    const s = state({ box: 2, due: addDays(D0, 2) })
    const next = answer(s, true, D0, false)
    expect(next).toMatchObject({ box: 2, due: addDays(D0, 2), seen: 2, correct: 1 })
  })

  it('poprawna odpowiedź poza Powtórkami w dniu terminu przesuwa etap', () => {
    expect(answer(state({ box: 2, due: D0 }), true, D0, false)).toMatchObject({ box: 3, due: addDays(D0, 7) })
  })

  it('nie zmienia stanu wejściowego', () => {
    const s = Object.freeze(state({}))
    answer(s, true, D0, true)
    expect(s.box).toBe(1)
  })
})

describe('listy powtórek', () => {
  const states: Record<string, QuestionState> = {
    a: state({ due: addDays(D0, -3) }),
    b: state({ due: D0 }),
    c: state({ due: addDays(D0, -1) }),
    d: state({ due: addDays(D0, 1) }),
    e: state({ due: addDays(D0, 6) }),
    f: state({ due: addDays(D0, 10) }),
    known: state({ box: 0, due: null, known: true }),
    gone: state({ due: addDays(D0, -5) }),
  }

  it('na dziś: termin dziś lub wcześniej, od najstarszego, bez usuniętych pytań', () => {
    expect(dueToday(states, D0, bank)).toEqual(['a', 'c', 'b'])
    expect(countDue(states, D0, bank)).toBe(3)
  })

  it('na dziś: najwyżej 20 pytań', () => {
    const many: Record<string, QuestionState> = {}
    for (let i = 0; i < 30; i++) many[`x${String(i).padStart(2, '0')}`] = state({ due: D0 })
    expect(dueToday(many, D0, bank)).toHaveLength(20)
    expect(countDue(many, D0, bank)).toBe(30)
  })

  it('rozkład 7 dni dolicza zaległe do dziś i pomija dalsze terminy', () => {
    const week = weekForecast(states, D0, bank)
    expect(week.map((d) => d.count)).toEqual([3, 1, 0, 0, 0, 0, 1])
    expect(week[0]?.day).toBe(D0)
    expect(week[6]?.day).toBe(addDays(D0, 6))
  })

  it('najbliższy termin po dziś', () => {
    expect(nextDueAfter(states, D0, bank)).toBe(addDays(D0, 1))
    expect(nextDueAfter({}, D0, bank)).toBeNull()
  })
})

describe('categoryMastery', () => {
  it('liczy opanowane pytania kategorii względem całej kategorii w bazie', () => {
    const q = (id: string, cat: Question['cat']): Question => ({ id, cat, q: '?', a: ['a', 'b', 'c', 'd'], f: '' })
    const miniBank = [q('h01', 'historia'), q('h02', 'historia'), q('h03', 'historia'), q('g01', 'geografia')]
    const states = {
      h01: state({ box: 0, due: null, known: true }),
      h02: state({}),
      g01: state({ box: 0, due: null, known: true }),
      h99: state({ box: 0, due: null, known: true }), // usunięte z bazy
    }
    expect(categoryMastery(states, 'historia', miniBank)).toEqual({ known: 1, total: 3 })
  })
})
