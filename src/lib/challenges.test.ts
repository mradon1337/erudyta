import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { dailyDayOf, outcome, playedResults, recordChallenge } from './challenges.ts'
import { applyAnswer, CHALLENGES_MAX, createProgress, type ChallengeRecord } from './progress.ts'
import { seededRound } from './round.ts'
import { currentQuestion, next, pick, startSession } from './session.ts'
import { finishRound } from './summary.ts'

const TODAY = '2026-11-16'
const T = (n: number) => Array.from({ length: 10 }, (_, i) => i < n)
const rec = (seed: string, mine: boolean[] = T(5)): ChallengeRecord => ({ seed, from: 'Kasia', theirs: T(5), mine, date: TODAY })

/** Gra rundę z ziarnem: `n` pierwszych odpowiedzi dobrze, reszta źle. */
function playSeed(seed: string, n: number) {
  let p = createProgress()
  let s = startSession('challenge', seededRound(seed), 0)
  for (let i = 0; i < 10; i++) {
    const q = currentQuestion(s)
    if (!q) break
    s = pick(s, i < n ? q.correct : (q.correct + 1) % 4, 1000)
    p = applyAnswer(p, q.question.id, i < n, TODAY, { inReview: false, xp: s.lastXp })
    s = next(s, 1000)
  }
  return { progress: p, session: s }
}

describe('wyzwania', () => {
  it('porównanie wyników', () => {
    expect(outcome(T(9), T(8))).toBe('win')
    expect(outcome(T(8), T(8))).toBe('draw')
    expect(outcome(T(2), T(8))).toBe('lose')
    expect(outcome(T(2), [])).toBeNull()
  })

  it('dzień z ziarna Wyzwania dnia', () => {
    expect(dailyDayOf('d20261116')).toBe('2026-11-16')
    expect(dailyDayOf('cab12cd')).toBeNull()
  })

  it('już rozegrane: z historii wyzwań albo z Wyzwania dnia', () => {
    const p = {
      ...createProgress(),
      challenges: [rec('cabcdef', T(7))],
      daily: { [TODAY]: { results: T(6), xp: 0 } },
    }
    expect(playedResults(p, 'cabcdef')).toEqual(T(7))
    expect(playedResults(p, 'd20261116')).toEqual(T(6))
    expect(playedResults(p, 'd20261115')).toBeNull()
    expect(playedResults(p, 'czzzzzz')).toBeNull()
  })

  it('historia: najnowsze pierwsze, bez duplikatów, z limitem', () => {
    let list: ChallengeRecord[] = []
    for (let i = 0; i < CHALLENGES_MAX + 5; i++) list = recordChallenge(list, rec(`c${String(i).padStart(6, '0')}`))
    expect(list).toHaveLength(CHALLENGES_MAX)
    expect(list[0]?.seed).toBe(`c${String(CHALLENGES_MAX + 4).padStart(6, '0')}`)
    const again = recordChallenge(list, rec(list[3]?.seed ?? ''))
    expect(again).toHaveLength(CHALLENGES_MAX)
    expect(again[0]?.seed).toBe(list[3]?.seed)
  })
})

describe('koniec rundy z wyzwaniem', () => {
  it('wygrana: +50 XP i zapis w historii', () => {
    const { progress, session } = playSeed('cabc123', 9)
    const { progress: after, summary } = finishRound(progress, session, TODAY, {
      challenge: { seed: 'cabc123', from: 'Kasia', theirs: T(8) },
    })
    expect(summary.challengeBonus).toBe(50)
    expect(summary.challenge?.outcome).toBe('win')
    expect(after.xp).toBe(progress.xp + 50)
    expect(after.challenges[0]).toEqual({ seed: 'cabc123', from: 'Kasia', theirs: T(8), mine: session.results, date: TODAY })
    expect(playedResults(after, 'cabc123')).toEqual(session.results)
  })

  it('remis i przegrana bez bonusu', () => {
    const draw = playSeed('cabc123', 8)
    expect(finishRound(draw.progress, draw.session, TODAY, { challenge: { seed: 'cabc123', from: '', theirs: T(8) } }).summary)
      .toMatchObject({ challengeBonus: 0, challenge: { outcome: 'draw' } })
    const lose = playSeed('cabc123', 3)
    expect(finishRound(lose.progress, lose.session, TODAY, { challenge: { seed: 'cabc123', from: '', theirs: T(8) } }).summary)
      .toMatchObject({ challengeBonus: 0, challenge: { outcome: 'lose' } })
  })

  it('własne wyzwanie: zapis bez porównania i bez bonusu', () => {
    const { progress, session } = playSeed('cown001', 10)
    const { progress: after, summary } = finishRound(progress, session, TODAY, {
      challenge: { seed: 'cown001', from: '', theirs: [] },
    })
    expect(summary).toMatchObject({ challengeBonus: 0, challenge: { outcome: null } })
    expect(after.challenges[0]?.theirs).toEqual([])
  })

  it('ten sam link daje te same pytania w tej samej kolejności', () => {
    const a = seededRound('cabc123').map((q) => [q.question.id, q.answers.join('|')])
    const b = seededRound('cabc123').map((q) => [q.question.id, q.answers.join('|')])
    expect(a).toEqual(b)
    expect(new Set(a.map(([id]) => id)).size).toBe(10)
    expect(QUESTIONS.length).toBeGreaterThan(10)
  })
})
