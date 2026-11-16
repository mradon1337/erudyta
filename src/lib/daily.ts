import { pruneDaily, type Progress } from './progress.ts'
import { dailySeed, type RoundRequest } from './round.ts'

/**
 * Jak runda traktuje Wyzwanie dnia — rozstrzygane na starcie rundy (`docs/PRODUKT.md`, „Tryby gry”):
 * - `xp` — czy odpowiedzi dają XP (drugie podejście do Wyzwania dnia to trening bez XP),
 * - `countsAsDaily` — czy wynik tej rundy jest wynikiem Wyzwania dnia.
 *
 * Wyzwanie dnia liczy się od pierwszej odpowiedzi, więc przerwane (albo zamknięte w połowie) podejście też jest
 * „rozegrane”. Link od znajomego z dzisiejszym Wyzwaniem dnia (ziarno `d` + dzisiejsza data) to te same pytania —
 * jeśli Wyzwania dnia jeszcze nie grano, taka runda liczy się także jako Wyzwanie dnia.
 */
export function dailyRules(
  request: RoundRequest,
  progress: Pick<Progress, 'daily'>,
  today: string,
): { xp: boolean; countsAsDaily: boolean } {
  const played = progress.daily[today] !== undefined
  if (request.mode === 'daily') return { xp: !played, countsAsDaily: !played }
  if (request.mode === 'challenge' && request.seed === dailySeed(today)) return { xp: true, countsAsDaily: !played }
  return { xp: true, countsAsDaily: false }
}

/**
 * Zapisuje wynik Wyzwania dnia w trakcie rundy: dotychczasowe odpowiedzi, a pytania jeszcze bez odpowiedzi
 * jako błędne. Ukończenie rundy nadpisuje ten wpis pełnym wynikiem i bonusem (`finishRound`).
 */
export function recordDailyProgress(
  progress: Progress,
  today: string,
  results: readonly boolean[],
  xp: number,
  size: number,
): Progress {
  const padded = [...results, ...Array<boolean>(Math.max(0, size - results.length)).fill(false)]
  return { ...progress, daily: pruneDaily({ ...progress.daily, [today]: { results: padded, xp } }, today) }
}
