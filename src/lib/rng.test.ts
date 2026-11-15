import { describe, expect, it } from 'vitest'
import { cyrb53, mulberry32, randFromSeed, shuffle } from './rng.ts'

describe('rng', () => {
  it('cyrb53 jest deterministyczny i rozróżnia napisy', () => {
    expect(cyrb53('d20261115')).toBe(cyrb53('d20261115'))
    expect(cyrb53('d20261115')).not.toBe(cyrb53('d20261116'))
    expect(Number.isSafeInteger(cyrb53('abc'))).toBe(true)
  })

  it('mulberry32 daje te same liczby dla tego samego ziarna, w przedziale [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('algorytm się nie zmienił (od tego zależą wyzwania między urządzeniami)', () => {
    const rand = randFromSeed('d20261115')
    expect([rand(), rand(), rand()]).toMatchInlineSnapshot(`
      [
        0.5657165739685297,
        0.03177600307390094,
        0.24305015592835844,
      ]
    `)
    expect(cyrb53('d20261115')).toMatchInlineSnapshot(`823420979300445`)
  })

  it('shuffle zwraca permutację i nie zmienia wejścia', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const out = shuffle(input, mulberry32(7))
    expect([...out].sort((x, y) => x - y)).toEqual(input)
    expect(out).not.toEqual(input)
    expect(shuffle(input, mulberry32(7))).toEqual(out)
  })

  it('shuffle radzi sobie z pustą i jednoelementową tablicą', () => {
    expect(shuffle([], mulberry32(1))).toEqual([])
    expect(shuffle(['a'], mulberry32(1))).toEqual(['a'])
  })
})
