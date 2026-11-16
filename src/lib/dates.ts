/**
 * Dni kalendarzowe w czasie lokalnym, zapisane jako 'YYYY-MM-DD'. Napisy w tym formacie porównuje się
 * zwykłym `<` / `>`, a arytmetyka idzie przez UTC, żeby zmiana czasu letniego nie przesuwała dni.
 */

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

function fromUtc(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Znacznik UTC północy danego dnia albo `null`, gdy napis nie jest poprawną datą. */
function toUtc(day: string): number | null {
  const m = DAY_RE.exec(day)
  if (!m) return null
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  // Odrzuca daty typu 2026-02-30, które Date.UTC po cichu przenosi na marzec.
  return fromUtc(ms) === day ? ms : null
}

function utcOrThrow(day: string): number {
  const ms = toUtc(day)
  if (ms === null) throw new Error(`Niepoprawna data: ${day}`)
  return ms
}

/** Czy wartość jest poprawnym dniem 'YYYY-MM-DD'. */
export function isDay(value: unknown): value is string {
  return typeof value === 'string' && toUtc(value) !== null
}

/** Dzień lokalny (strefa urządzenia) dla podanej chwili. */
export function toDay(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Dzień przesunięty o `n` dni (może być ujemne). */
export function addDays(day: string, n: number): string {
  return fromUtc(utcOrThrow(day) + n * MS_PER_DAY)
}

/** Liczba dni od `from` do `to` (dodatnia, gdy `to` jest później). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcOrThrow(to) - utcOrThrow(from)) / MS_PER_DAY)
}

const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
] as const

/** Dzień po polsku, np. „16 listopada”. */
export function formatDay(day: string): string {
  const ms = utcOrThrow(day)
  const d = new Date(ms)
  return `${d.getUTCDate()} ${MONTHS_GENITIVE[d.getUTCMonth()]}`
}
