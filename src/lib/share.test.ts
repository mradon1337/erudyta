import { describe, expect, it } from 'vitest'
import { buildChallengeUrl, dailyShareText, parseChallenge, shareText, type Challenge } from './share.ts'

const BASE = 'https://example.org/erudyta/'
const R = [true, true, false, true, true, true, true, false, true, true]
const challenge: Challenge = { seed: 'd20261115', results: R, name: 'Kasia', bankSize: 150 }

function hashOf(url: string): string {
  return url.slice(url.indexOf('#'))
}

describe('link z wyzwaniem', () => {
  it('ma format z DANE.md', () => {
    expect(buildChallengeUrl(BASE, challenge)).toBe(`${BASE}#w=d20261115&r=1101111011&n=Kasia&q=150`)
  })

  it('odrzuca starą część # adresu bazowego', () => {
    expect(buildChallengeUrl(`${BASE}#stare`, challenge)).toBe(buildChallengeUrl(BASE, challenge))
  })

  it('budowa i odczyt dają to samo, także dla imion ze znakami specjalnymi', () => {
    for (const name of ['Kasia', 'Zażółć Gęślą', 'A&B=C#D+E%F', 'Ola 🙂']) {
      const url = buildChallengeUrl(BASE, { ...challenge, name })
      expect(parseChallenge(hashOf(url), 150)).toEqual({ status: 'ok', challenge: { ...challenge, name } })
    }
  })

  it('adres bez wyzwania → „none”', () => {
    expect(parseChallenge('', 150)).toEqual({ status: 'none' })
    expect(parseChallenge('#', 150)).toEqual({ status: 'none' })
    expect(parseChallenge('#cos=innego', 150)).toEqual({ status: 'none' })
  })

  it('zepsuty link → „invalid”', () => {
    const broken = [
      '#w=d20261115&r=110111101&q=150', // 9 wyników
      '#w=d20261115&r=11011110111&q=150', // 11 wyników
      '#w=d20261115&r=11011x1011&q=150',
      '#w=x20261115&r=1101111011&q=150', // zły prefiks ziarna
      '#w=cABC123&r=1101111011&q=150', // wielkie litery
      '#w=c12&r=1101111011&q=150', // za krótkie
      '#w=d2026111512&r=1101111011&q=150', // za długie
      '#w=<script>&r=1101111011&q=150',
      '#w=d20261115&q=150', // brak wyników
      '#w=d20261115&r=1101111011', // brak liczby pytań
      '#w=d20261115&r=1101111011&q=-1',
      '#w=d20261115&r=1101111011&q=abc',
      '#w=d20261115&r=1101111011&q=%E0%A4%A', // zepsute kodowanie
    ]
    for (const hash of broken) expect(parseChallenge(hash, 150), hash).toEqual({ status: 'invalid' })
  })

  it('inna liczba pytań w bazie → „bank-mismatch”', () => {
    const result = parseChallenge('#w=d20261115&r=1101111011&n=Kasia&q=149', 150)
    expect(result.status).toBe('bank-mismatch')
  })

  it('imię z linku jest czyszczone i przycinane do 20 znaków', () => {
    const long = encodeURIComponent('  Bardzo\u0000Długie\nImię Ponad Dwadzieścia Znaków ')
    const result = parseChallenge(`#w=cabc123&r=1101111011&n=${long}&q=150`, 150)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.challenge.name).toBe('BardzoDługieImię Pon')
      expect(result.challenge.name.length).toBeLessThanOrEqual(20)
    }
  })

  it('brak imienia nie psuje linku', () => {
    const result = parseChallenge('#w=cabc123&r=1101111011&q=150', 150)
    expect(result).toMatchObject({ status: 'ok', challenge: { name: '' } })
    expect(buildChallengeUrl(BASE, { ...challenge, name: '   ' })).not.toContain('n=')
  })
})

describe('shareText', () => {
  it('tytuł, wynik, kratki i link', () => {
    expect(shareText('Wyzwanie dnia 15.11.2026', R, 'https://x/#w=1')).toBe(
      'Erudyta · Wyzwanie dnia 15.11.2026\n8/10\n🟦🟦🟧🟦🟦🟦🟦🟧🟦🟦\nhttps://x/#w=1',
    )
  })
})

describe('dailyShareText', () => {
  const results = [true, true, false, true, true, true, true, false, true, true]

  it('tytuł z datą, link z ziarnem dnia i imieniem', () => {
    const text = dailyShareText('2026-11-16', results, { name: 'Kasia', base: 'https://x.pl/', bankSize: 150 })
    expect(text).toBe(
      'Erudyta · Wyzwanie dnia · 16 listopada\n8/10\n🟦🟦🟧🟦🟦🟦🟦🟧🟦🟦\nhttps://x.pl/#w=d20261116&r=1101111011&n=Kasia&q=150',
    )
  })

  it('domyślne imię nie trafia do linku', () => {
    const text = dailyShareText('2026-11-16', results, { name: 'Ty', base: 'https://x.pl/', bankSize: 150 })
    expect(text).not.toContain('n=')
  })
})
