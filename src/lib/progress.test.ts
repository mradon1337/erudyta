import { describe, expect, it } from 'vitest'
import { applyAnswer, cleanName, createProgress, pruneDaily } from './progress.ts'

describe('progress', () => {
  it('applyAnswer zapisuje stan pytania i XP, nie zmieniając wejścia', () => {
    const p0 = createProgress()
    const p1 = applyAnswer(p0, 'h01', false, '2026-11-15', { inReview: false, xp: 0 })
    const p2 = applyAnswer(p1, 'h02', true, '2026-11-15', { inReview: false, xp: 25 })
    expect(p0.questions).toEqual({})
    expect(p2.xp).toBe(25)
    expect(p2.questions.h01).toMatchObject({ box: 1, due: '2026-11-16' })
    expect(p2.questions.h02).toMatchObject({ known: true })
  })

  it('cleanName: bez znaków sterujących, maks. 20 znaków, puste → „Ty”', () => {
    expect(cleanName('  Ola ')).toBe('Ola')
    expect(cleanName('   ')).toBe('Ty')
    expect(cleanName('', '')).toBe('')
    expect(cleanName('a\u0007b')).toBe('ab')
    expect(cleanName('x'.repeat(30))).toHaveLength(20)
  })

  it('pruneDaily zostawia ostatnie 30 dni', () => {
    const r = { results: [true], xp: 25 }
    const daily = { '2026-10-16': r, '2026-10-17': r, '2026-11-15': r, '2026-11-20': r }
    expect(Object.keys(pruneDaily(daily, '2026-11-15'))).toEqual(['2026-10-17', '2026-11-15'])
  })
})

describe('cleanName — znaki niewidoczne i sterujące kierunkiem tekstu', () => {
  // Kody znaków zamiast samych znaków: w pliku byłyby niewidoczne.
  const ch = (...codes: number[]) => String.fromCharCode(...codes)

  it('usuwa znaki zmieniające kierunek tekstu (podszywanie się pod inne imię w linku)', () => {
    expect(cleanName('Ka' + ch(0x202e) + 'sia')).toBe('Kasia')
    expect(cleanName(ch(0x2066) + 'Ola' + ch(0x2069))).toBe('Ola')
    expect(cleanName(ch(0x200f) + 'Ewa' + ch(0x200e))).toBe('Ewa')
  })

  it('usuwa znaki zerowej szerokości i BOM', () => {
    expect(cleanName('A' + ch(0x200b) + 'na' + ch(0xfeff))).toBe('Ana')
    expect(cleanName(ch(0x200b, 0x200b))).toBe('Ty')
  })

  it('zostawia polskie litery', () => {
    expect(cleanName('Łucja Żółć')).toBe('Łucja Żółć')
  })
})
