/** Generator losowy: zwraca liczbę z przedziału [0, 1). */
export type Rand = () => number

/**
 * Skrót napisu cyrb53 (53 bity). Zamienia ziarno-napis na liczbę dla `mulberry32`.
 * Nie zmieniaj algorytmu: od niego zależy, czy ten sam link daje tę samą rundę na każdym urządzeniu.
 */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** Deterministyczny generator mulberry32 dla 32-bitowego ziarna. */
export function mulberry32(seed: number): Rand {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generator z ziarnem w postaci napisu (np. 'd20261115'). */
export function randFromSeed(seed: string): Rand {
  return mulberry32(cyrb53(seed) >>> 0)
}

/** Losowa liczba całkowita z przedziału [0, n). */
export function randomInt(n: number, rand: Rand): number {
  return Math.floor(rand() * n)
}

/** Tasowanie Fishera–Yatesa. Zwraca nową tablicę, wejścia nie zmienia. */
export function shuffle<T>(items: readonly T[], rand: Rand): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rand)
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return out
}
