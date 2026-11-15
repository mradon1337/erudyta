import { describe, expect, it } from 'vitest'
import { QUESTIONS, type Question } from '../data/questions.ts'
import { addDays } from './dates.ts'
import type { QuestionState } from './reviews.ts'
import { mulberry32, shuffle } from './rng.ts'
import {
  buildRound,
  byPriority,
  dailySeed,
  newChallengeSeed,
  prepareQuestion,
  refillQuick,
  ROUND_SIZE,
  seededRound,
  type RoundQuestion,
} from './round.ts'

const D0 = '2026-11-15'
const ids = (round: readonly RoundQuestion[]) => round.map((r) => r.question.id)
const ctx = (states: Record<string, QuestionState> = {}, seed = 1) => ({ states, today: D0, rand: mulberry32(seed) })

function seen(partial: Partial<QuestionState> = {}): QuestionState {
  return { seen: 1, correct: 1, box: 0, due: null, known: true, last: D0, ...partial }
}

describe('ziarna', () => {
  it('Wyzwanie dnia ma ziarno z daty', () => {
    expect(dailySeed('2026-11-15')).toBe('d20261115')
  })

  it('ziarno własnego wyzwania: c + 6 znaków [a-z0-9]', () => {
    const rand = mulberry32(3)
    for (let i = 0; i < 50; i++) expect(newChallengeSeed(rand)).toMatch(/^c[a-z0-9]{6}$/)
  })
})

describe('prepareQuestion', () => {
  it('tasuje odpowiedzi i pamięta, gdzie jest poprawna', () => {
    const q = QUESTIONS[0] as Question
    for (let seed = 0; seed < 20; seed++) {
      const r = prepareQuestion(q, mulberry32(seed))
      expect([...r.answers].sort()).toEqual([...q.a].sort())
      expect(r.answers[r.correct]).toBe(q.a[0])
    }
  })
})

describe('runda z ziarnem', () => {
  it('to samo ziarno = ta sama runda, także kolejność odpowiedzi', () => {
    const a = seededRound('d20261115')
    const b = seededRound('d20261115')
    expect(a).toHaveLength(ROUND_SIZE)
    expect(a).toEqual(b)
  })

  it('nie zależy od kolejności pytań w pliku', () => {
    const reordered = shuffle(QUESTIONS, mulberry32(99))
    expect(seededRound('cabc123', reordered)).toEqual(seededRound('cabc123', QUESTIONS))
  })

  it('różne ziarna = różne rundy, bez powtórzeń w rundzie', () => {
    const a = ids(seededRound('d20261115'))
    const b = ids(seededRound('d20261116'))
    expect(a).not.toEqual(b)
    expect(new Set(a).size).toBe(ROUND_SIZE)
  })

  it('Wyzwanie dnia i wyzwanie z linku nie zależą od postępu gracza', () => {
    const states = Object.fromEntries(QUESTIONS.slice(0, 50).map((q) => [q.id, seen()]))
    expect(buildRound({ mode: 'daily' }, ctx(states, 1))).toEqual(seededRound(dailySeed(D0)))
    expect(buildRound({ mode: 'daily' }, ctx({}, 2))).toEqual(seededRound(dailySeed(D0)))
    expect(buildRound({ mode: 'challenge', seed: 'cq1w2e3' }, ctx({}, 5))).toEqual(seededRound('cq1w2e3'))
  })
})

describe('kolejność wg priorytetu', () => {
  const mk = (id: string): Question => ({ id, cat: 'historia', q: '?', a: ['a', 'b', 'c', 'd'], f: '' })
  const pool = ['n1', 'n2', 'u1', 'u2', 'k1', 'k2', 'k3'].map(mk)
  const states: Record<string, QuestionState> = {
    u1: seen({ known: false, box: 1, due: D0 }),
    u2: seen({ known: false, box: 2, due: addDays(D0, 3) }),
    k1: seen({ last: '2026-11-10' }),
    k2: seen({ last: '2026-10-01' }),
    k3: seen({ last: '2026-11-14' }),
  }

  it('niewidziane → nieopanowane → opanowane od najdawniej widzianych', () => {
    for (let s = 0; s < 10; s++) {
      const order = byPriority(pool, states, mulberry32(s)).map((q) => q.id)
      expect(new Set(order.slice(0, 2))).toEqual(new Set(['n1', 'n2']))
      expect(new Set(order.slice(2, 4))).toEqual(new Set(['u1', 'u2']))
      expect(order.slice(4)).toEqual(['k2', 'k1', 'k3'])
    }
  })

  it('w obrębie grupy kolejność jest losowa', () => {
    const firsts = new Set(Array.from({ length: 20 }, (_, s) => byPriority(pool, states, mulberry32(s))[0]?.id))
    expect(firsts).toEqual(new Set(['n1', 'n2']))
  })
})

describe('buildRound — tryby bez ziarna', () => {
  it('ścieżka: 10 pytań tylko z kategorii, najpierw niewidziane', () => {
    const geo = QUESTIONS.filter((q) => q.cat === 'geografia')
    const states = Object.fromEntries(geo.slice(0, geo.length - 3).map((q) => [q.id, seen()]))
    const round = buildRound({ mode: 'category', category: 'geografia' }, ctx(states))
    expect(round).toHaveLength(ROUND_SIZE)
    expect(round.every((r) => r.question.cat === 'geografia')).toBe(true)
    expect(new Set(ids(round).slice(0, 3))).toEqual(new Set(geo.slice(-3).map((q) => q.id)))
  })

  it('Nauka bez stresu: 10 mieszanych bez powtórzeń', () => {
    const round = buildRound({ mode: 'learn' }, ctx())
    expect(round).toHaveLength(ROUND_SIZE)
    expect(new Set(ids(round)).size).toBe(ROUND_SIZE)
  })

  it('bez ziarna generator decyduje o kolejności, a ten sam generator daje to samo', () => {
    expect(ids(buildRound({ mode: 'learn' }, ctx({}, 1)))).toEqual(ids(buildRound({ mode: 'learn' }, ctx({}, 1))))
    expect(ids(buildRound({ mode: 'learn' }, ctx({}, 1)))).not.toEqual(ids(buildRound({ mode: 'learn' }, ctx({}, 2))))
  })

  it('Szybka runda dostaje całą pulę bez powtórzeń', () => {
    const round = buildRound({ mode: 'quick' }, ctx())
    expect(round).toHaveLength(QUESTIONS.length)
    expect(new Set(ids(round)).size).toBe(QUESTIONS.length)
  })

  it('Powtórki: tylko zaległe, od najstarszego terminu, bez usuniętych pytań', () => {
    const [a, b, c] = QUESTIONS.map((q) => q.id)
    const states: Record<string, QuestionState> = {
      [a as string]: seen({ known: false, box: 1, due: D0 }),
      [b as string]: seen({ known: false, box: 2, due: addDays(D0, -2) }),
      [c as string]: seen({ known: false, box: 1, due: addDays(D0, 1) }),
      x999: seen({ known: false, box: 1, due: addDays(D0, -9) }),
    }
    expect(ids(buildRound({ mode: 'review' }, ctx(states)))).toEqual([b, a])
    expect(buildRound({ mode: 'review' }, ctx({}))).toEqual([])
  })
})

describe('refillQuick', () => {
  it('tasuje całą pulę od nowa i nie zaczyna od ostatnio pokazanego pytania', () => {
    for (let s = 0; s < 30; s++) {
      const first = refillQuick(null, mulberry32(s))[0]?.question.id as string
      const again = refillQuick(first, mulberry32(s))
      expect(again[0]?.question.id).not.toBe(first)
      expect(new Set(ids(again)).size).toBe(QUESTIONS.length)
    }
  })
})
