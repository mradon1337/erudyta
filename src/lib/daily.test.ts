import { describe, expect, it } from 'vitest'
import { playedResults } from './challenges.ts'
import { dailyRules, recordDailyProgress } from './daily.ts'
import { createProgress, type Progress } from './progress.ts'
import { dailySeed, seededRound, type RoundRequest } from './round.ts'
import { currentQuestion, next, pick, startSession, tick, type Session } from './session.ts'
import { finishRound, recordAnswer } from './summary.ts'

const TODAY = '2026-11-16'
const T0 = 1_000_000

/**
 * Gra rundę tak jak aplikacja: zasady startu z `dailyRules`, zapis po każdej odpowiedzi przez `recordAnswer`.
 * `plan`: true = dobrze, false = źle, null = czas minął. Zwraca też, czy runda dobiegła końca.
 */
function play(request: RoundRequest, plan: (boolean | null)[], start: Progress, opts: { finish: boolean }) {
  const seed = request.mode === 'daily' ? dailySeed(TODAY) : request.mode === 'challenge' ? request.seed : 'x'
  const rules = dailyRules(request, start, TODAY)
  let p = start
  let now = T0
  let s: Session = startSession(request.mode, seededRound(seed), now, { xp: rules.xp, daily: rules.countsAsDaily })
  for (const choice of plan) {
    const q = currentQuestion(s)
    if (!q) break
    const before = s
    if (choice === null) {
      now += 21_000
      s = tick(s, now)
    } else {
      now += 4_000
      s = pick(s, choice ? q.correct : (q.correct + 1) % 4, now)
    }
    if (s.results.length > before.results.length) p = recordAnswer(p, s, TODAY)
    s = next(s, now)
  }
  return { progress: p, session: s, rules, finished: opts.finish && s.finished }
}

const all = (v: boolean) => Array<boolean>(10).fill(v)

describe('zasady Wyzwania dnia na starcie rundy', () => {
  const played = { daily: { [TODAY]: { results: all(true), xp: 270 } } }
  const fresh = { daily: {} }

  it('Wyzwanie dnia: pierwsze podejście liczy się, kolejne to trening bez XP', () => {
    expect(dailyRules({ mode: 'daily' }, fresh, TODAY)).toEqual({ xp: true, countsAsDaily: true })
    expect(dailyRules({ mode: 'daily' }, played, TODAY)).toEqual({ xp: false, countsAsDaily: false })
  })

  it('link z dzisiejszym Wyzwaniem dnia liczy się jako Wyzwanie dnia, jeśli jeszcze go nie grano', () => {
    const link: RoundRequest = { mode: 'challenge', seed: dailySeed(TODAY) }
    expect(dailyRules(link, fresh, TODAY)).toEqual({ xp: true, countsAsDaily: true })
    expect(dailyRules(link, played, TODAY)).toEqual({ xp: true, countsAsDaily: false })
    // Link z wczorajszym Wyzwaniem dnia to zwykłe wyzwanie.
    expect(dailyRules({ mode: 'challenge', seed: 'd20261115' }, fresh, TODAY).countsAsDaily).toBe(false)
  })

  it('inne tryby nie dotykają Wyzwania dnia', () => {
    for (const request of [
      { mode: 'learn' },
      { mode: 'quick' },
      { mode: 'review' },
      { mode: 'category', category: 'sport' },
      { mode: 'challenge', seed: 'cabc123' },
    ] as RoundRequest[]) {
      expect(dailyRules(request, fresh, TODAY)).toEqual({ xp: true, countsAsDaily: false })
    }
  })

  it('wynik w trakcie rundy: pytania bez odpowiedzi liczą się jako błędne', () => {
    const p = recordDailyProgress(createProgress(), TODAY, [true, true, false], 50, 10)
    expect(p.daily[TODAY]).toEqual({ results: [true, true, false, ...all(false).slice(3)], xp: 50 })
  })
})

describe('przerwane Wyzwanie dnia nie daje drugiej szansy na XP', () => {
  it('3 odpowiedzi i wyjście (bez ukończenia) → wynik dnia zapisany, kolejne podejście to trening', () => {
    const first = play({ mode: 'daily' }, [true, true, true], createProgress(), { finish: false })
    expect(first.session.finished).toBe(false)
    expect(first.progress.xp).toBe(75)
    expect(first.progress.daily[TODAY]?.results).toEqual([true, true, true, ...all(false).slice(3)])
    // Bez ukończenia: bez bonusu i bez dnia serii.
    expect(first.progress.streak.last).toBeNull()

    const second = play({ mode: 'daily' }, all(true), first.progress, { finish: true })
    expect(second.rules).toEqual({ xp: false, countsAsDaily: false })
    expect(second.session.xp).toBe(0)
    const { progress, summary } = finishRound(second.progress, second.session, TODAY)
    expect(summary).toMatchObject({ training: true, dailyBonus: 0, xp: 0 })
    expect(progress.xp).toBe(75)
    expect(progress.daily[TODAY]?.results).toEqual(first.progress.daily[TODAY]?.results)
    // Trening po przerwanym podejściu nadal zalicza dzień serii — to ukończona runda.
    expect(progress.streak.last).toBe(TODAY)
  })

  it('ukończone pierwsze podejście nadpisuje wynik zapisany w trakcie rundy pełnym wynikiem i bonusem', () => {
    const plan = [true, false, true, true, null, true, true, true, true, true]
    const r = play({ mode: 'daily' }, plan, createProgress(), { finish: true })
    const { progress, summary } = finishRound(r.progress, r.session, TODAY)
    expect(summary).toMatchObject({ training: false, dailyBonus: 20, correct: 8 })
    expect(progress.daily[TODAY]).toEqual({ results: r.session.results, xp: r.session.xp + 20 })
  })
})

describe('link z dzisiejszym Wyzwaniem dnia', () => {
  it('zalicza Wyzwanie dnia (+20 XP) i wyzwanie (+50 XP za wygraną), a potem nie da się go zagrać drugi raz', () => {
    const seed = dailySeed(TODAY)
    const theirs = [true, true, true, false, false, false, false, false, false, false]
    const r = play({ mode: 'challenge', seed }, all(true), createProgress(), { finish: true })
    expect(r.rules.countsAsDaily).toBe(true)
    const { progress, summary } = finishRound(r.progress, r.session, TODAY, { challenge: { seed, from: 'Kasia', theirs } })
    expect(summary).toMatchObject({ dailyBonus: 20, challengeBonus: 50, training: false })
    expect(progress.xp).toBe(250 + 20 + 50)
    expect(progress.daily[TODAY]?.results).toEqual(all(true))
    // Na Starcie Wyzwanie dnia jest rozegrane, a ponowne podejście byłoby treningiem.
    expect(dailyRules({ mode: 'daily' }, progress, TODAY)).toEqual({ xp: false, countsAsDaily: false })
    expect(playedResults(progress, seed)).toEqual(all(true))
  })
})
