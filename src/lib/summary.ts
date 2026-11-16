import { pruneDaily, type Progress } from './progress.ts'
import type { Mode } from './round.ts'
import type { Session } from './session.ts'
import { completeDay } from './streak.ts'
import { levelFor, XP, type Level } from './xp.ts'

/** Ile ciekawostek pokazuje Wynik w sekcji „Zapamiętaj z dzisiejszej rundy”. */
export const SUMMARY_FACTS = 2

/** Pytanie z błędną odpowiedzią — do karty „Wraca do powtórki”. */
export interface Mistake {
  id: string
  question: string
  /** Wybrana odpowiedź; `null`, gdy minął czas. */
  yours: string | null
  correct: string
}

export interface RoundSummary {
  mode: Mode
  correct: number
  /** Liczba udzielonych odpowiedzi (w Szybkiej rundzie zależy od tempa). */
  total: number
  /** XP z całej rundy razem z bonusami. */
  xp: number
  /** Bonus za ukończenie Wyzwania dnia (0, gdy nie należał się). */
  dailyBonus: number
  /** Drugie i kolejne podejście do Wyzwania dnia — bez XP, wynik dnia bez zmian. */
  training: boolean
  /** Zapisany wynik Wyzwania dnia (przy treningu — ten pierwszy). */
  dailyResults: boolean[] | null
  /** Seria po tej rundzie. */
  streak: number
  /** Średni czas odpowiedzi w sekundach (bez pytań, przy których minął czas); `null`, gdy brak odpowiedzi. */
  avgSeconds: number | null
  /** Do `SUMMARY_FACTS` ciekawostek, najpierw z pytań z błędną odpowiedzią. */
  facts: string[]
  mistakes: Mistake[]
  levelBefore: Level
  levelAfter: Level
  /** Szybka runda: rekord po tej rundzie i czy właśnie padł. */
  bestQuick: number
  newRecord: boolean
}

export function leveledUp(summary: Pick<RoundSummary, 'levelBefore' | 'levelAfter'>): boolean {
  return summary.levelAfter.number > summary.levelBefore.number
}

/**
 * Zamyka ukończoną rundę: zalicza dzień serii, dolicza bonus za Wyzwanie dnia i zapisuje jego wynik,
 * aktualizuje rekord Szybkiej rundy. Odpowiedzi i ich XP są już w `progress` (zapis po każdej odpowiedzi),
 * więc tu ich nie doliczamy ponownie.
 */
export function finishRound(
  progress: Progress,
  session: Session,
  today: string,
): { progress: Progress; summary: RoundSummary } {
  const correct = session.results.filter(Boolean).length
  const xpBefore = Math.max(0, progress.xp - session.xp)
  const training = session.mode === 'daily' && !session.xpEnabled

  const isDaily = session.mode === 'daily' && !training
  const dailyBonus = isDaily ? XP.dailyBonus : 0
  const xpAfter = progress.xp + dailyBonus
  const daily = isDaily
    ? pruneDaily({ ...progress.daily, [today]: { results: session.results, xp: session.xp + dailyBonus } }, today)
    : progress.daily

  const streak = completeDay(progress.streak, today)
  const bestQuick = session.mode === 'quick' ? Math.max(progress.bestQuick, correct) : progress.bestQuick

  const next: Progress = { ...progress, xp: xpAfter, daily, streak, bestQuick }

  const answered = session.log
    .map((entry, i) => ({ entry, q: session.questions[i], ok: session.results[i] === true }))
    .filter((x) => x.q !== undefined)
  const timed = answered.filter((x) => x.entry.picked !== null)
  const avgSeconds =
    timed.length === 0 ? null : Math.round(timed.reduce((sum, x) => sum + x.entry.ms, 0) / timed.length / 1000)

  const mistakes: Mistake[] = []
  for (const { entry, q, ok } of answered) {
    if (ok || !q) continue
    mistakes.push({
      id: q.question.id,
      question: q.question.q,
      yours: entry.picked === null ? null : (q.answers[entry.picked] ?? null),
      correct: q.answers[q.correct] ?? '',
    })
  }
  const facts = [...answered.filter((x) => !x.ok), ...answered.filter((x) => x.ok)]
    .map((x) => x.q?.question.f ?? '')
    .filter((f) => f !== '')
    .slice(0, SUMMARY_FACTS)

  return {
    progress: next,
    summary: {
      mode: session.mode,
      correct,
      total: session.results.length,
      xp: session.xp + dailyBonus,
      dailyBonus,
      training,
      dailyResults: daily[today]?.results ?? null,
      streak: streak.count,
      avgSeconds,
      facts,
      mistakes,
      levelBefore: levelFor(xpBefore),
      levelAfter: levelFor(xpAfter),
      bestQuick,
      newRecord: session.mode === 'quick' && correct > progress.bestQuick,
    },
  }
}

/** Awans po przerwanej rundzie: XP z odpowiedzi już zapisane, bez serii i bonusów. */
export function levelsAfterExit(progress: Progress, session: Session): { levelBefore: Level; levelAfter: Level } {
  return { levelBefore: levelFor(Math.max(0, progress.xp - session.xp)), levelAfter: levelFor(progress.xp) }
}

/** Komentarz na karcie wyniku (EKRANY.md, pkt 4). */
export function roundComment(summary: Pick<RoundSummary, 'mode' | 'correct' | 'total' | 'newRecord'>): string {
  if (summary.mode === 'quick') {
    if (summary.newRecord) return 'Nowy rekord!'
    return summary.correct > 0 ? 'Dobra robota' : 'Następnym razem pójdzie lepiej'
  }
  if (summary.total === 0) return 'Następnym razem pójdzie lepiej'
  const ratio = summary.correct / summary.total
  if (ratio === 1) return 'Komplet!'
  if (ratio >= 0.7) return 'Świetna runda!'
  if (ratio >= 0.4) return 'Dobra robota'
  return 'Następnym razem pójdzie lepiej'
}
