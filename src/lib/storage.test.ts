import { describe, expect, it } from 'vitest'
import { createProgress, type Progress } from './progress.ts'
import { clearProgress, loadProgress, normalizeProgress, parseProgress, saveProgress, STORAGE_KEY, type KeyValueStore } from './storage.ts'

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v
    },
    removeItem: (k) => {
      delete data[k]
    },
  }
}

const throwing: KeyValueStore = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

function sample(): Progress {
  return {
    ...createProgress(),
    name: 'Kasia',
    xp: 1234,
    questions: { h01: { seen: 3, correct: 2, box: 2, due: '2026-11-18', known: false, last: '2026-11-15' } },
    streak: { count: 4, best: 9, last: '2026-11-15' },
    daily: { '2026-11-15': { results: [true, false, true], xp: 70 } },
    challenges: [{ seed: 'cabc123', from: 'Ola', theirs: [true], mine: [false], date: '2026-11-14' }],
    bestQuick: 17,
    settings: { timer: false },
  }
}

describe('loadProgress', () => {
  it('brak zapisu → świeży postęp i status „new”', () => {
    expect(loadProgress(memoryStore())).toEqual({ progress: createProgress(), status: 'new' })
  })

  it('zapis i odczyt dają ten sam postęp', () => {
    const store = memoryStore()
    expect(saveProgress(store, sample())).toBe(true)
    expect(loadProgress(store)).toEqual({ progress: sample(), status: 'ok' })
  })

  it('zepsuty JSON → świeży postęp i status „corrupt”', () => {
    for (const raw of ['{"v":1,', 'undefined', '', 'null', '[]', '"tekst"', '42']) {
      const result = loadProgress(memoryStore({ [STORAGE_KEY]: raw }))
      expect(result.status, raw).toBe('corrupt')
      expect(result.progress).toEqual(createProgress())
    }
  })

  it('nieznana wersja → świeży postęp', () => {
    expect(loadProgress(memoryStore({ [STORAGE_KEY]: JSON.stringify({ ...sample(), v: 2 }) })).status).toBe('corrupt')
  })

  it('niedostępny localStorage → działanie w pamięci', () => {
    expect(loadProgress(null).status).toBe('unavailable')
    expect(loadProgress(throwing).status).toBe('unavailable')
    expect(saveProgress(null, sample())).toBe(false)
    expect(saveProgress(throwing, sample())).toBe(false)
    expect(() => clearProgress(throwing)).not.toThrow()
  })

  it('clearProgress usuwa zapis', () => {
    const store = memoryStore()
    saveProgress(store, sample())
    clearProgress(store)
    expect(loadProgress(store).status).toBe('new')
  })
})

describe('normalizeProgress', () => {
  it('uzupełnia brakujące pola wartościami domyślnymi', () => {
    expect(normalizeProgress({ v: 1 })).toEqual(createProgress())
    expect(normalizeProgress({ v: 1, xp: 50, name: '  Ola  ' })).toMatchObject({ xp: 50, name: 'Ola', settings: { timer: true } })
  })

  it('zastępuje złe typy domyślnymi zamiast się wywracać', () => {
    const p = normalizeProgress({
      v: 1,
      name: 42,
      xp: -5,
      questions: 'nie obiekt',
      streak: { count: 'trzy', best: 2, last: 'wczoraj' },
      daily: [],
      challenges: { a: 1 },
      bestQuick: Number.NaN,
      settings: { timer: 'tak' },
    })
    expect(p).toEqual({ ...createProgress(), streak: { count: 0, best: 2, last: null } })
  })

  it('pomija uszkodzone wpisy pytań, wyzwań i wyników dnia, a resztę zostawia', () => {
    const p = normalizeProgress({
      v: 1,
      questions: {
        ok: { seen: 2, correct: 1, box: 1, due: '2026-11-16', known: false, last: '2026-11-15' },
        noLast: { seen: 1, correct: 1, box: 0, due: null, known: true },
        badBox: { seen: 1, correct: 0, box: 9, due: '2026-11-16', known: false, last: '2026-11-15' },
        noDue: { seen: 1, correct: 0, box: 3, due: 'kiedyś', known: true, last: '2026-11-15' },
        tooManyCorrect: { seen: 1, correct: 5, box: 0, due: null, known: true, last: '2026-11-15' },
        nul: null,
      },
      daily: { '2026-11-15': { results: [true], xp: 25 }, zly: { results: [true], xp: 1 }, '2026-11-14': { results: 'x' } },
      challenges: [{ seed: 'cabc123', from: 'Ola', theirs: [true], mine: [false], date: '2026-11-14' }, { seed: 1 }],
    })
    expect(Object.keys(p?.questions ?? {}).sort()).toEqual(['badBox', 'noDue', 'ok', 'tooManyCorrect'])
    expect(p?.questions.badBox).toMatchObject({ box: 0, due: null })
    expect(p?.questions.noDue).toMatchObject({ box: 3, due: '2026-11-15', known: false })
    expect(p?.questions.tooManyCorrect?.correct).toBe(1)
    expect(Object.keys(p?.daily ?? {})).toEqual(['2026-11-15'])
    expect(p?.challenges).toHaveLength(1)
  })

  it('parseProgress zwraca null dla złego JSON-a', () => {
    expect(parseProgress('{')).toBeNull()
    expect(parseProgress(JSON.stringify(sample()))).toEqual(sample())
  })
})
