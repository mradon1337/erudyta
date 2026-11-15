import { describe, expect, it } from 'vitest'
import { completeDay, currentStreak, EMPTY_STREAK } from './streak.ts'

describe('seria', () => {
  it('pierwsza runda zaczyna serię', () => {
    expect(completeDay(EMPTY_STREAK, '2026-11-15')).toEqual({ count: 1, best: 1, last: '2026-11-15' })
  })

  it('rośnie dzień po dniu, a druga runda tego samego dnia nic nie zmienia', () => {
    let s = completeDay(EMPTY_STREAK, '2026-11-15')
    s = completeDay(s, '2026-11-16')
    s = completeDay(s, '2026-11-16')
    s = completeDay(s, '2026-11-17')
    expect(s).toEqual({ count: 3, best: 3, last: '2026-11-17' })
  })

  it('przerwa zeruje serię do 1, rekord zostaje', () => {
    const s = completeDay({ count: 5, best: 5, last: '2026-11-10' }, '2026-11-12')
    expect(s).toEqual({ count: 1, best: 5, last: '2026-11-12' })
  })

  it('przechodzi przez koniec roku', () => {
    expect(completeDay({ count: 2, best: 4, last: '2026-12-31' }, '2027-01-01')).toEqual({
      count: 3,
      best: 4,
      last: '2027-01-01',
    })
  })

  it('cofnięty zegar nie psuje serii', () => {
    const s = { count: 4, best: 4, last: '2026-11-15' }
    expect(completeDay(s, '2026-11-10')).toBe(s)
  })

  it('wyświetlana seria spada do 0 po przerwie, zanim zagra się kolejną rundę', () => {
    const s = { count: 6, best: 9, last: '2026-11-14' }
    expect(currentStreak(s, '2026-11-14')).toBe(6)
    expect(currentStreak(s, '2026-11-15')).toBe(6) // dziś jeszcze można przedłużyć
    expect(currentStreak(s, '2026-11-16')).toBe(0)
    expect(currentStreak(EMPTY_STREAK, '2026-11-16')).toBe(0)
  })
})
