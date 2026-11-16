import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { factCollection, greeting, pathStats, untilMidnight } from './home.ts'
import type { QuestionState } from './reviews.ts'

const history = QUESTIONS.filter((q) => q.cat === 'historia')
const id = (i: number) => history[i]?.id as string
const known = (last: string): QuestionState => ({ seen: 1, correct: 1, box: 0, due: null, known: true, last })
const review: QuestionState = { seen: 1, correct: 0, box: 1, due: '2026-11-17', known: false, last: '2026-11-16' }

describe('Start', () => {
  it('powitanie wg pory dnia', () => {
    expect(greeting(8)).toBe('Dzień dobry')
    expect(greeting(17)).toBe('Dzień dobry')
    expect(greeting(18)).toBe('Dobry wieczór')
    expect(greeting(2)).toBe('Dobry wieczór')
  })

  it('czas do północy w godzinach albo minutach', () => {
    expect(untilMidnight(new Date(2026, 10, 16, 17, 0))).toBe('7 h')
    expect(untilMidnight(new Date(2026, 10, 16, 16, 30))).toBe('7 h')
    expect(untilMidnight(new Date(2026, 10, 16, 23, 20))).toBe('40 min')
    expect(untilMidnight(new Date(2026, 10, 16, 23, 59, 59))).toBe('1 min')
  })
})

describe('ścieżka wiedzy', () => {
  it('pusta ścieżka: wszystko nowe', () => {
    expect(pathStats({}, 'historia')).toEqual({ total: history.length, known: 0, inReview: 0, fresh: history.length, percent: 0 })
    expect(factCollection({}, 'historia')).toEqual([])
  })

  it('liczniki i procent (w dół), obce kategorie i usunięte pytania pominięte', () => {
    const states = {
      [id(0)]: known('2026-11-10'),
      [id(1)]: known('2026-11-15'),
      [id(2)]: review,
      g01: known('2026-11-15'),
      x99: known('2026-11-15'),
    }
    const stats = pathStats(states, 'historia')
    expect(stats).toMatchObject({ known: 2, inReview: 1, fresh: history.length - 3 })
    expect(stats.percent).toBe(Math.floor((2 / history.length) * 100))
  })

  it('kolekcja od najnowszych', () => {
    const states = { [id(0)]: known('2026-11-10'), [id(1)]: known('2026-11-15'), [id(2)]: review }
    expect(factCollection(states, 'historia').map((q) => q.id)).toEqual([id(1), id(0)])
  })

  it('100% tylko przy komplecie', () => {
    const all = Object.fromEntries(history.map((q) => [q.id, known('2026-11-01')]))
    expect(pathStats(all, 'historia').percent).toBe(100)
    const { [id(0)]: _skip, ...almost } = all
    expect(pathStats(almost, 'historia').percent).toBe(Math.floor(((history.length - 1) / history.length) * 100))
  })
})
