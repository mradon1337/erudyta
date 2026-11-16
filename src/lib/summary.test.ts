import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { applyAnswer, createProgress, type Progress } from './progress.ts'
import { mulberry32 } from './rng.ts'
import { prepareQuestion, type Mode, type RoundQuestion } from './round.ts'
import { currentQuestion, next, pick, startSession, tick, type Session } from './session.ts'
import { finishRound, leveledUp, levelsAfterExit, roundComment } from './summary.ts'

const T0 = 5_000_000
const TODAY = '2026-11-16'
const questions = (n: number): RoundQuestion[] => {
  const rand = mulberry32(7)
  return QUESTIONS.slice(0, n).map((q) => prepareQuestion(q, rand))
}

/**
 * Rozgrywa rundę jak aplikacja: każda odpowiedź od razu trafia do postępu.
 * `plan`: true = dobrze, false = źle, null = czas minął. Każda odpowiedź po 4 s.
 */
function play(mode: Mode, plan: (boolean | null)[], start: Progress = createProgress(), xp = true) {
  let p = start
  let now = T0
  let s: Session = startSession(mode, questions(plan.length), now, { xp })
  plan.forEach((choice, i) => {
    const q = currentQuestion(s) as RoundQuestion
    const before = s
    if (choice === null) {
      now += 21_000
      s = tick(s, now)
    } else {
      now += 4_000
      s = pick(s, choice ? q.correct : (q.correct + 1) % 4, now)
    }
    if (s.results.length > before.results.length) {
      p = applyAnswer(p, q.question.id, s.results.at(-1) === true, TODAY, { inReview: mode === 'review', xp: s.lastXp })
    }
    if (i < plan.length - 1 || mode !== 'quick') s = next(s, now)
  })
  return { progress: p, session: s }
}

describe('zakończenie rundy', () => {
  it('Wyzwanie dnia: wynik, bonus +20 XP, zapis dnia i seria', () => {
    const { progress, session } = play('daily', [true, true, false, true, null, true, true, true, true, true])
    expect(session.finished).toBe(true)
    expect(progress.xp).toBe(8 * 25)

    const { progress: after, summary } = finishRound(progress, session, TODAY)
    expect(summary).toMatchObject({ correct: 8, total: 10, dailyBonus: 20, xp: 220, training: false, streak: 1 })
    expect(after.xp).toBe(220)
    expect(after.daily[TODAY]).toEqual({ results: session.results, xp: 220 })
    expect(after.streak).toEqual({ count: 1, best: 1, last: TODAY })
    expect(summary.avgSeconds).toBe(4)
    expect(summary.mistakes.map((m) => m.id)).toEqual([QUESTIONS[2]?.id, QUESTIONS[4]?.id])
  })

  it('drugie podejście do Wyzwania dnia to trening: bez XP i bez zmiany wyniku dnia', () => {
    const first = play('daily', Array<boolean>(10).fill(false))
    const { progress: saved } = finishRound(first.progress, first.session, TODAY)
    const second = play('daily', Array<boolean>(10).fill(true), saved, false)
    expect(second.session.xp).toBe(0)
    const { progress: after, summary } = finishRound(second.progress, second.session, TODAY)
    expect(summary).toMatchObject({ training: true, dailyBonus: 0, xp: 0, correct: 10 })
    expect(after.xp).toBe(saved.xp)
    expect(after.daily[TODAY]?.results).toEqual(Array<boolean>(10).fill(false))
    expect(summary.dailyResults).toEqual(Array<boolean>(10).fill(false))
  })

  it('seria rośnie dzień po dniu i nie rośnie dwa razy tego samego dnia', () => {
    const start = { ...createProgress(), streak: { count: 4, best: 6, last: '2026-11-15' } }
    const a = play('learn', [true], start)
    const r1 = finishRound(a.progress, a.session, TODAY)
    expect(r1.summary.streak).toBe(5)
    const b = play('learn', [true], r1.progress)
    expect(finishRound(b.progress, b.session, TODAY).progress.streak).toEqual({ count: 5, best: 6, last: TODAY })
  })

  it('poza Wyzwaniem dnia bez bonusu i bez zapisu dnia', () => {
    const { progress, session } = play('category', [true, true])
    const { progress: after, summary } = finishRound(progress, session, TODAY)
    expect(summary.dailyBonus).toBe(0)
    expect(after.daily).toEqual({})
    expect(after.xp).toBe(progress.xp)
  })

  it('runda bez błędów: komplet, brak powtórek, ciekawostki z poprawnych', () => {
    const { progress, session } = play('learn', Array<boolean>(10).fill(true))
    const { summary } = finishRound(progress, session, TODAY)
    expect(summary.mistakes).toEqual([])
    expect(summary.facts).toHaveLength(2)
    expect(roundComment(summary)).toBe('Komplet!')
  })

  it('runda z samymi błędami: wszystkie trafiają do powtórek, ciekawostki z błędnych', () => {
    const plan = [false, null, false, false, false, false, false, false, false, false]
    const { progress, session } = play('daily', plan)
    const { summary } = finishRound(progress, session, TODAY)
    expect(summary.correct).toBe(0)
    expect(summary.xp).toBe(20) // tylko bonus za ukończenie
    expect(summary.mistakes).toHaveLength(10)
    expect(summary.mistakes[1]?.yours).toBeNull()
    expect(summary.mistakes[0]?.yours).not.toBe(summary.mistakes[0]?.correct)
    expect(summary.facts).toEqual([QUESTIONS[0]?.f, QUESTIONS[1]?.f])
    expect(roundComment(summary)).toBe('Następnym razem pójdzie lepiej')
  })

  it('ciekawostki: najpierw z błędnych odpowiedzi', () => {
    const { progress, session } = play('learn', [true, true, false])
    expect(finishRound(progress, session, TODAY).summary.facts).toEqual([QUESTIONS[2]?.f, QUESTIONS[0]?.f])
  })

  it('średni czas pomija pytania, przy których minął czas', () => {
    const { progress, session } = play('daily', [null, true])
    expect(finishRound(progress, session, TODAY).summary.avgSeconds).toBe(4)
    const none = play('daily', [null])
    expect(finishRound(none.progress, none.session, TODAY).summary.avgSeconds).toBeNull()
  })

  it('awans liczony z XP przed rundą i po bonusie', () => {
    const { progress, session } = play('daily', [true, true])
    const { summary } = finishRound({ ...progress, xp: 950 + session.xp }, session, TODAY)
    expect(summary.levelBefore.number).toBe(1)
    expect(summary.levelAfter).toMatchObject({ number: 2, name: 'Ciekawski', inLevel: 20 })
    expect(leveledUp(summary)).toBe(true)

    const small = finishRound({ ...progress, xp: 100 + session.xp }, session, TODAY).summary
    expect(leveledUp(small)).toBe(false)
  })

  it('awans po przerwanej rundzie', () => {
    const { session } = play('daily', [true, true])
    const levels = levelsAfterExit({ ...createProgress(), xp: 1010 }, session)
    expect(levels.levelBefore.number).toBe(1)
    expect(levels.levelAfter.number).toBe(2)
  })

  it('Szybka runda: rekord tylko, gdy pobity', () => {
    const start = { ...createProgress(), bestQuick: 2 }
    const a = play('quick', [true, true, true], start)
    const r = finishRound(a.progress, a.session, TODAY)
    expect(r.summary).toMatchObject({ newRecord: true, bestQuick: 3 })
    expect(r.progress.bestQuick).toBe(3)
    expect(roundComment(r.summary)).toBe('Nowy rekord!')

    const b = play('quick', [true, false], r.progress)
    const r2 = finishRound(b.progress, b.session, TODAY)
    expect(r2.summary).toMatchObject({ newRecord: false, bestQuick: 3 })
    expect(roundComment(r2.summary)).toBe('Dobra robota')
  })

  it('komentarze wg progów', () => {
    const c = (correct: number, total = 10) => roundComment({ mode: 'daily', correct, total, newRecord: false })
    expect(c(10)).toBe('Komplet!')
    expect(c(7)).toBe('Świetna runda!')
    expect(c(6)).toBe('Dobra robota')
    expect(c(4)).toBe('Dobra robota')
    expect(c(3)).toBe('Następnym razem pójdzie lepiej')
    expect(c(0, 0)).toBe('Następnym razem pójdzie lepiej')
  })
})
