/**
 * Polska odmiana po liczebniku: 1 dzień, 2–4 dni, 5 dni, 12 dni, 22 dni, 25 dni.
 * @param forms [jeden, kilka (2–4), wiele]
 */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n))
  if (abs === 1) return forms[0]
  const last = abs % 10
  const lastTwo = abs % 100
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1]
  return forms[2]
}

/** Liczba z odmienionym słowem, np. „3 pytania”. */
export function count(n: number, forms: readonly [string, string, string]): string {
  return `${n} ${plural(n, forms)}`
}
