import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './categories.ts'
import { QUESTIONS, QUESTION_BY_ID } from './questions.ts'

describe('baza pytań', () => {
  it('ma unikalne identyfikatory', () => {
    expect(QUESTION_BY_ID.size).toBe(QUESTIONS.length)
  })

  it('każde pytanie należy do znanej kategorii', () => {
    const known = new Set(CATEGORIES.map((c) => c.id))
    for (const q of QUESTIONS) expect(known.has(q.cat), q.id).toBe(true)
  })

  it('każda kategoria ma co najmniej 20 pytań (rundy po 10 bez powtórzeń)', () => {
    for (const category of CATEGORIES) {
      const count = QUESTIONS.filter((q) => q.cat === category.id).length
      expect(count, category.id).toBeGreaterThanOrEqual(20)
    }
  })

  it('każde pytanie ma cztery różne, niepuste odpowiedzi', () => {
    for (const q of QUESTIONS) {
      expect(q.a.length, q.id).toBe(4)
      expect(new Set(q.a.map((x) => x.trim().toLowerCase())).size, q.id).toBe(4)
      for (const answer of q.a) expect(answer.trim().length, q.id).toBeGreaterThan(0)
    }
  })

  it('pytanie i ciekawostka mieszczą się na ekranie telefonu', () => {
    for (const q of QUESTIONS) {
      expect(q.q.length, `${q.id} — pytanie`).toBeLessThanOrEqual(110)
      expect(q.f.length, `${q.id} — ciekawostka`).toBeLessThanOrEqual(170)
      for (const answer of q.a) expect(answer.length, `${q.id} — odpowiedź`).toBeLessThanOrEqual(40)
    }
  })

  it('identyfikator zaczyna się od litery kategorii i ma numer', () => {
    for (const q of QUESTIONS) expect(q.id, q.id).toMatch(/^[a-z]\d{2,3}$/)
  })
})
