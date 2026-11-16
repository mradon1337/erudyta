import { describe, expect, it } from 'vitest'
import { count, plural } from './plural.ts'

const DAYS = ['dzień', 'dni', 'dni'] as const
const QS = ['pytanie', 'pytania', 'pytań'] as const

describe('odmiana', () => {
  it('1, 2–4, 5+, nastki i końcówki 22–24', () => {
    expect(plural(1, QS)).toBe('pytanie')
    expect(plural(2, QS)).toBe('pytania')
    expect(plural(4, QS)).toBe('pytania')
    expect(plural(5, QS)).toBe('pytań')
    expect(plural(0, QS)).toBe('pytań')
    expect(plural(12, QS)).toBe('pytań')
    expect(plural(14, QS)).toBe('pytań')
    expect(plural(22, QS)).toBe('pytania')
    expect(plural(25, QS)).toBe('pytań')
    expect(plural(101, QS)).toBe('pytań')
    expect(count(13, DAYS)).toBe('13 dni')
    expect(count(1, DAYS)).toBe('1 dzień')
  })
})
