import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isDay, toDay } from './dates.ts'

describe('dates', () => {
  it('toDay bierze dzień lokalny, nie UTC', () => {
    expect(toDay(new Date(2026, 10, 15, 23, 59))).toBe('2026-11-15')
    expect(toDay(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })

  it('addDays przechodzi przez miesiące, lata i lata przestępne', () => {
    expect(addDays('2026-11-15', 1)).toBe('2026-11-16')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-03-28', 14)).toBe('2026-04-11') // przez zmianę czasu na letni
  })

  it('daysBetween liczy różnicę w dniach', () => {
    expect(daysBetween('2026-11-15', '2026-11-15')).toBe(0)
    expect(daysBetween('2026-11-15', '2026-11-29')).toBe(14)
    expect(daysBetween('2026-11-15', '2026-11-14')).toBe(-1)
    expect(daysBetween('2026-10-20', '2026-11-05')).toBe(16) // przez zmianę czasu na zimowy
  })

  it('isDay odrzuca złe formaty i nieistniejące daty', () => {
    expect(isDay('2026-11-15')).toBe(true)
    expect(isDay('2026-02-30')).toBe(false)
    expect(isDay('2026-1-5')).toBe(false)
    expect(isDay('jutro')).toBe(false)
    expect(isDay(20261115)).toBe(false)
    expect(isDay(null)).toBe(false)
  })

  it('addDays i daysBetween rzucają przy złej dacie', () => {
    expect(() => addDays('bzdura', 1)).toThrow()
    expect(() => daysBetween('2026-11-15', '2026-13-01')).toThrow()
  })
})
