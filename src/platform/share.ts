import { parseChallenge, type ParseResult } from '../lib/share.ts'

/**
 * Udostępnianie tekstu: systemowy arkusz (`navigator.share`), a gdy go nie ma — schowek.
 * To jedyne miejsce, które dotyka tych API przeglądarki.
 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareOrCopy(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (e) {
      // Zamknięcie arkusza przez użytkownika to nie błąd.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Adres aplikacji bez części `#` — podstawa linków z wyzwaniem. */
export function appUrl(): string {
  return window.location.href.split('#')[0] ?? ''
}

/**
 * Wyzwanie z części `#` adresu. Po odczycie czyści `#…` (`history.replaceState`), żeby odświeżenie strony
 * nie otwierało wyzwania ponownie.
 */
export function takeChallengeFromUrl(bankSize: number): ParseResult {
  const result = parseChallenge(window.location.hash, bankSize)
  if (result.status !== 'none') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return result
}
