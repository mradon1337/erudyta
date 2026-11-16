import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { initial, profileStats } from './profile.ts'
import type { QuestionState } from './reviews.ts'

const st = (seen: number, correct: number, known = false): QuestionState => ({
  seen,
  correct,
  box: known ? 0 : 1,
  due: known ? null : '2026-11-17',
  known,
  last: '2026-11-16',
})
const firstOf = (cat: string) => QUESTIONS.find((q) => q.cat === cat)?.id as string

describe('statystyki profilu', () => {
  it('nowy gracz: zera i brak skuteczności', () => {
    const s = profileStats({})
    expect(s).toMatchObject({ answers: 0, accuracy: null, known: 0, bankSize: QUESTIONS.length })
    expect(s.categories.every((c) => c.percent === null)).toBe(true)
    expect(s.categories).toHaveLength(6)
  })

  it('suma odpowiedzi, skuteczność, opanowane i kategorie od najlepszej', () => {
    const s = profileStats({
      [firstOf('historia')]: st(4, 3, true),
      [firstOf('sport')]: st(2, 0),
      [firstOf('nauka')]: st(1, 1, true),
      x99: st(10, 10, true),
    })
    expect(s.answers).toBe(7)
    expect(s.accuracy).toBe(57)
    expect(s.known).toBe(2)
    expect(s.categories.slice(0, 3)).toEqual([
      { category: 'nauka', answered: 1, percent: 100 },
      { category: 'historia', answered: 4, percent: 75 },
      { category: 'sport', answered: 2, percent: 0 },
    ])
    expect(s.categories[3]?.percent).toBeNull()
  })

  it('inicjał', () => {
    expect(initial('kasia')).toBe('K')
    expect(initial('  Łucja')).toBe('Ł')
    expect(initial('')).toBe('?')
  })
})
