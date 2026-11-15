import { describe, expect, it } from 'vitest'
import { levelFor, xpForAnswer } from './xp.ts'

describe('xpForAnswer', () => {
  it('20 XP za poprawną, +5 przy co najmniej 10 s na zegarze pytania', () => {
    expect(xpForAnswer(true, 10, 'daily')).toBe(25)
    expect(xpForAnswer(true, 9.9, 'daily')).toBe(20)
    expect(xpForAnswer(true, 15, 'category')).toBe(25)
    expect(xpForAnswer(true, 15, 'challenge')).toBe(25)
  })

  it('bez zegara na pytanie nie ma bonusu', () => {
    expect(xpForAnswer(true, null, 'category')).toBe(20)
    expect(xpForAnswer(true, null, 'learn')).toBe(20)
    expect(xpForAnswer(true, 45, 'quick')).toBe(20)
  })

  it('10 XP w Powtórkach, 0 za błąd', () => {
    expect(xpForAnswer(true, null, 'review')).toBe(10)
    expect(xpForAnswer(false, 19, 'daily')).toBe(0)
    expect(xpForAnswer(false, null, 'review')).toBe(0)
  })
})

describe('levelFor', () => {
  it('poziom = floor(xp / 1000) + 1, z postępem w poziomie', () => {
    expect(levelFor(0)).toEqual({ number: 1, name: 'Nowicjusz', inLevel: 0, toNext: 1000 })
    expect(levelFor(999)).toEqual({ number: 1, name: 'Nowicjusz', inLevel: 999, toNext: 1 })
    expect(levelFor(1000)).toEqual({ number: 2, name: 'Ciekawski', inLevel: 0, toNext: 1000 })
    expect(levelFor(6250)).toMatchObject({ number: 7, name: 'Bystrzak', inLevel: 250, toNext: 750 })
  })

  it('nazwy do 10 poziomu, potem „Omnibus” z numerem', () => {
    expect(levelFor(7000).name).toBe('Erudyta')
    expect(levelFor(9999).name).toBe('Omnibus')
    expect(levelFor(10000)).toMatchObject({ number: 11, name: 'Omnibus 11' })
  })

  it('odporny na ujemne i ułamkowe XP', () => {
    expect(levelFor(-50)).toMatchObject({ number: 1, inLevel: 0 })
    expect(levelFor(1500.7)).toMatchObject({ number: 2, inLevel: 500 })
  })
})
