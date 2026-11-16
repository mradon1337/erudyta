import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { mulberry32 } from './rng.ts'
import { prepareQuestion, type RoundQuestion } from './round.ts'
import {
  addTime,
  currentQuestion,
  fiftyFifty,
  isAnswered,
  isLastQuestion,
  next,
  pick,
  score,
  secondsLeft,
  startSession,
  tick,
  timerKindFor,
  type Session,
} from './session.ts'

const T0 = 1_000_000
const rand = mulberry32(1)
const questions = (n: number): RoundQuestion[] => QUESTIONS.slice(0, n).map((q) => prepareQuestion(q, rand))
const correctOf = (s: Session) => currentQuestion(s)?.correct as number
const wrongOf = (s: Session) => (correctOf(s) + 1) % 4

describe('rodzaj zegara', () => {
  it('wg trybu i ustawienia', () => {
    expect(timerKindFor('daily', false)).toBe('question')
    expect(timerKindFor('challenge', false)).toBe('question')
    expect(timerKindFor('category', true)).toBe('question')
    expect(timerKindFor('category', false)).toBe('none')
    expect(timerKindFor('quick', false)).toBe('total')
    expect(timerKindFor('learn', true)).toBe('none')
    expect(timerKindFor('review', true)).toBe('none')
  })
})

describe('runda z zegarem na pytanie', () => {
  it('zegar liczy się z czasu, nie z tyknięć', () => {
    const s = startSession('daily', questions(10), T0)
    expect(secondsLeft(s, T0)).toBe(20)
    expect(secondsLeft(s, T0 + 1)).toBe(20)
    expect(secondsLeft(s, T0 + 1000)).toBe(19)
    expect(secondsLeft(s, T0 + 19_001)).toBe(1)
    expect(secondsLeft(s, T0 + 60_000)).toBe(0)
  })

  it('poprawna odpowiedź z bonusem za szybkość, potem bez', () => {
    let s = startSession('daily', questions(10), T0)
    s = pick(s, correctOf(s), T0 + 5_000)
    expect(s).toMatchObject({ results: [true], xp: 25, lastXp: 25 })
    s = next(s, T0 + 8_000)
    s = pick(s, correctOf(s), T0 + 8_000 + 12_000)
    expect(s).toMatchObject({ results: [true, true], xp: 45, lastXp: 20 })
  })

  it('po odpowiedzi zegar stoi i kolejne kliknięcia nic nie zmieniają', () => {
    let s = startSession('daily', questions(10), T0)
    s = pick(s, wrongOf(s), T0 + 3_000)
    expect(isAnswered(s)).toBe(true)
    expect(secondsLeft(s, T0 + 50_000)).toBe(17)
    expect(pick(s, correctOf(s), T0 + 4_000)).toBe(s)
    expect(tick(s, T0 + 50_000)).toBe(s)
    expect(s).toMatchObject({ results: [false], xp: 0 })
  })

  it('upływ czasu działa jak błędna odpowiedź', () => {
    let s = startSession('daily', questions(10), T0)
    expect(tick(s, T0 + 19_999)).toBe(s)
    s = tick(s, T0 + 20_000)
    expect(s).toMatchObject({ timedOut: true, results: [false], picked: null })
    expect(isAnswered(s)).toBe(true)
    // Spóźnione kliknięcie po czasie, zanim zadziałał tick, też liczy się jak upływ czasu.
    const late = pick(startSession('daily', questions(10), T0), 0, T0 + 25_000)
    expect(late).toMatchObject({ timedOut: true, results: [false] })
  })

  it('każde pytanie dostaje pełne 20 s', () => {
    let s = startSession('daily', questions(10), T0)
    s = pick(s, 0, T0 + 15_000)
    s = next(s, T0 + 40_000)
    expect(secondsLeft(s, T0 + 40_000)).toBe(20)
    expect(s.index).toBe(1)
  })

  it('10 pytań i koniec rundy', () => {
    let s = startSession('daily', questions(10), T0)
    let now = T0
    for (let i = 0; i < 10; i++) {
      expect(isLastQuestion(s)).toBe(i === 9)
      s = pick(s, i % 2 === 0 ? correctOf(s) : wrongOf(s), (now += 1000))
      s = next(s, (now += 1000))
    }
    expect(s.finished).toBe(true)
    expect(s.results).toHaveLength(10)
    expect(score(s)).toBe(5)
    expect(next(s, now)).toBe(s)
  })

  it('bez odpowiedzi nie da się przejść dalej', () => {
    const s = startSession('daily', questions(10), T0)
    expect(next(s, T0)).toBe(s)
  })
})

describe('jokery', () => {
  it('50/50 chowa dwie błędne odpowiedzi, raz na rundę', () => {
    let s = startSession('daily', questions(10), T0)
    s = fiftyFifty(s, mulberry32(5))
    expect(s.hidden).toHaveLength(2)
    expect(s.hidden).not.toContain(correctOf(s))
    expect(pick(s, s.hidden[0] as number, T0)).toBe(s)
    s = next(pick(s, correctOf(s), T0 + 1000), T0 + 2000)
    expect(s.hidden).toEqual([])
    expect(fiftyFifty(s, mulberry32(5))).toBe(s)
  })

  it('+10 s dodaje czas bieżącemu pytaniu, raz na rundę', () => {
    let s = startSession('daily', questions(10), T0)
    s = addTime(s, T0 + 15_000)
    expect(secondsLeft(s, T0 + 15_000)).toBe(15)
    expect(tick(s, T0 + 25_000).timedOut).toBe(false)
    expect(tick(s, T0 + 30_000).timedOut).toBe(true)
    expect(addTime(s, T0 + 16_000)).toBe(s)
  })

  it('jokerów nie ma w rundach bez zegara na pytanie ani po odpowiedzi', () => {
    const learn = startSession('learn', questions(10), T0)
    expect(learn.jokers).toBe(false)
    expect(fiftyFifty(learn, rand)).toBe(learn)
    expect(addTime(learn, T0)).toBe(learn)
    const answered = pick(startSession('daily', questions(10), T0), 0, T0)
    expect(fiftyFifty(answered, rand)).toBe(answered)
    expect(addTime(answered, T0)).toBe(answered)
  })
})

describe('rundy bez zegara', () => {
  it('Nauka: czas nie płynie, XP bez bonusu', () => {
    let s = startSession('learn', questions(10), T0)
    expect(s.deadline).toBeNull()
    expect(tick(s, T0 + 999_999)).toBe(s)
    s = pick(s, correctOf(s), T0 + 999_999)
    expect(s.lastXp).toBe(20)
  })

  it('Powtórki: 10 XP za poprawną', () => {
    const s = startSession('review', questions(3), T0)
    expect(pick(s, correctOf(s), T0).lastXp).toBe(10)
  })

  it('pusta lista pytań to od razu koniec', () => {
    expect(startSession('review', [], T0).finished).toBe(true)
  })
})

describe('Szybka runda', () => {
  it('jeden zegar 60 s, który stoi przy ciekawostce', () => {
    let s = startSession('quick', questions(5), T0)
    expect(s.jokers).toBe(false)
    s = pick(s, correctOf(s), T0 + 10_000)
    expect(s.lastXp).toBe(20)
    s = next(s, T0 + 30_000) // 20 s czytania ciekawostki się nie liczy
    expect(secondsLeft(s, T0 + 30_000)).toBe(50)
    expect(isLastQuestion(s)).toBe(false)
  })

  it('koniec czasu kończy rundę, pytanie bez odpowiedzi się nie liczy', () => {
    let s = startSession('quick', questions(5), T0)
    s = pick(s, correctOf(s), T0 + 1000)
    s = next(s, T0 + 1000)
    s = tick(s, T0 + 60_000)
    expect(s).toMatchObject({ finished: true, results: [true], timedOut: false })
  })

  it('po wyczerpaniu puli dobiera nowe pytania', () => {
    let s = startSession('quick', questions(1), T0)
    s = pick(s, correctOf(s), T0 + 1000)
    s = next(s, T0 + 1000, () => questions(2))
    expect(s).toMatchObject({ finished: false, index: 1 })
    expect(s.questions).toHaveLength(3)
  })
})

describe('dziennik odpowiedzi i trening', () => {
  it('zapisuje wybór i czas od pokazania pytania', () => {
    let s = startSession('daily', questions(3), T0)
    const wrong = wrongOf(s)
    s = pick(s, wrong, T0 + 3_000)
    s = next(s, T0 + 10_000)
    s = tick(s, T0 + 10_000 + 20_000)
    expect(s.log).toEqual([
      { picked: wrong, ms: 3_000 },
      { picked: null, ms: 20_000 },
    ])
  })

  it('runda bez XP (trening) liczy wyniki, ale nie punkty', () => {
    let s = startSession('daily', questions(2), T0, { xp: false })
    s = pick(s, correctOf(s), T0 + 1_000)
    expect(s).toMatchObject({ results: [true], xp: 0, lastXp: 0 })
  })
})
