import { cleanName } from './progress.ts'
import { ROUND_SIZE } from './round.ts'

/** Wzorzec ziarna: 'd' + data (Wyzwanie dnia) albo 'c' + 6 znaków (własne wyzwanie). */
export const SEED_RE = /^[dc][a-z0-9]{6,8}$/
const RESULTS_RE = new RegExp(`^[01]{${ROUND_SIZE}}$`)
const BANK_SIZE_RE = /^\d{1,5}$/

export interface Challenge {
  seed: string
  /** Wynik nadawcy w kolejności pytań. */
  results: boolean[]
  /** Imię nadawcy; pusty napis, gdy link go nie podał (ekran pokazuje wtedy własny podpis). */
  name: string
  /** Liczba pytań w bazie nadawcy. */
  bankSize: number
}

export type ParseResult =
  | { status: 'none' }
  | { status: 'invalid' }
  /** Link poprawny, ale z inną wersją bazy pytań — wyzwania nie da się rozegrać. */
  | { status: 'bank-mismatch'; challenge: Challenge }
  | { status: 'ok'; challenge: Challenge }

export function resultsToString(results: readonly boolean[]): string {
  return results.map((r) => (r ? '1' : '0')).join('')
}

/** Link z wyzwaniem: `base#w=…&r=…&n=…&q=…`. `base` to adres aplikacji bez części `#`. */
export function buildChallengeUrl(base: string, challenge: Challenge): string {
  const name = cleanName(challenge.name, '')
  const parts = [
    `w=${challenge.seed}`,
    `r=${resultsToString(challenge.results)}`,
    ...(name ? [`n=${encodeURIComponent(name)}`] : []),
    `q=${challenge.bankSize}`,
  ]
  return `${base.split('#')[0]}#${parts.join('&')}`
}

/**
 * Odczyt wyzwania z części `#` adresu. Wszystko z linku to niezaufane dane: sprawdzamy wzorce,
 * imię przycinamy i czyścimy. `status: 'none'`, gdy adres w ogóle nie zawiera wyzwania.
 */
export function parseChallenge(hash: string, localBankSize: number): ParseResult {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const seed = params.get('w')
  if (seed === null) return { status: 'none' }

  const r = params.get('r') ?? ''
  const q = params.get('q') ?? ''
  if (!SEED_RE.test(seed) || !RESULTS_RE.test(r) || !BANK_SIZE_RE.test(q)) return { status: 'invalid' }

  const challenge: Challenge = {
    seed,
    results: [...r].map((c) => c === '1'),
    name: cleanName(params.get('n') ?? '', ''),
    bankSize: Number(q),
  }
  return challenge.bankSize === localBankSize ? { status: 'ok', challenge } : { status: 'bank-mismatch', challenge }
}

/** Tekst do udostępnienia: tytuł, wynik, kratki 🟦/🟧 i link. Emoji tylko tutaj, nie w interfejsie. */
export function shareText(title: string, results: readonly boolean[], url: string): string {
  const score = results.filter(Boolean).length
  const squares = results.map((r) => (r ? '🟦' : '🟧')).join('')
  return `Erudyta · ${title}\n${score}/${results.length}\n${squares}\n${url}`
}
