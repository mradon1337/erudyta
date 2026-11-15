# Dane i algorytmy

## Pytania — `src/data/questions.ts`

```ts
interface Question {
  id: string            // litera kategorii + numer, np. "h07"; nigdy się nie zmienia
  cat: CategoryId       // 'historia' | 'geografia' | 'nauka' | 'sztuka' | 'sport' | 'jezyk'
  q: string             // treść pytania, do 110 znaków
  a: [string, string, string, string]  // a[0] = poprawna; każda do 40 znaków
  f: string             // ciekawostka, do 170 znaków
}
```

Zasady dopisywania:
- Nowe pytanie dostaje kolejny numer na końcu swojej kategorii. Nie zmieniaj ani nie używaj ponownie `id` —
  postęp graczy jest zapisany po `id`.
- Usuwane pytanie po prostu znika z pliku; jego wpis w postępie jest ignorowany (patrz „Wczytywanie”).
- Litery kategorii: `h` historia, `g` geografia, `n` nauka, `s` sztuka, `p` sport, `j` język.
- `src/data/questions.test.ts` sprawdza unikalność `id`, liczbę i różność odpowiedzi, długości i minimum 20 pytań
  na kategorię. Dopisując pytania, uruchom testy.

## Postęp gracza — localStorage, klucz `erudyta-progress-v1`

```ts
interface Progress {
  v: 1
  name: string                         // imię z powitania; domyślnie "Ty"
  xp: number
  questions: Record<string, QuestionState>   // tylko pytania, na które już odpowiadano
  streak: { count: number; best: number; last: string | null }   // last: 'YYYY-MM-DD'
  daily: Record<string, RoundResult>   // klucz: data 'YYYY-MM-DD'; trzymamy ostatnie 30 dni
  challenges: ChallengeRecord[]        // rozegrane wyzwania z linków, najnowsze pierwsze, maks. 50
  bestQuick: number                    // rekord Szybkiej rundy (poprawne odpowiedzi)
  settings: { timer: boolean }
}

interface QuestionState {
  seen: number          // ile razy pokazane
  correct: number       // ile razy poprawnie
  box: 0 | 1 | 2 | 3 | 4   // 0 = poza powtórkami
  due: string | null    // 'YYYY-MM-DD' — termin powtórki, gdy box > 0
  known: boolean        // opanowane
  last: string          // 'YYYY-MM-DD' ostatniej odpowiedzi
}

interface RoundResult { results: boolean[]; xp: number }

interface ChallengeRecord {
  seed: string; from: string; theirs: boolean[]; mine: boolean[]; date: string
}
```

Zasady:
- Daty to **lokalne** dni w formacie `YYYY-MM-DD` (nie UTC, nie znaczniki czasu). Funkcje logiki dostają „dziś”
  jako parametr.
- **Wczytywanie:** `try/catch` wokół `localStorage` i `JSON.parse`; brak danych, zły JSON lub nieznane `v` →
  świeży postęp (i Powitanie). Brakujące pola uzupełnij wartościami domyślnymi. Wpisy pytań, których nie ma już
  w bazie, pomijaj przy liczeniu statystyk.
- **Zapis** po każdej odpowiedzi (nie dopiero po rundzie), żeby zamknięcie karty nie gubiło postępu.
- Zmiana kształtu danych = nowa wersja `v` i funkcja migracji ze starej.
- localStorage bywa niedostępny (tryb prywatny). Aplikacja ma wtedy działać w pamięci i pokazać raz informację,
  że postęp nie zostanie zapisany.

## Powtórki — `src/lib/reviews.ts`

```
ODSTĘPY = [1, 3, 7, 14]   // dni dla etapów 1–4

odpowiedz(stan, poprawnie, dziś, wPowtórce):
  seen += 1; last = dziś; jeśli poprawnie: correct += 1
  jeśli !poprawnie:            box = 1; due = dziś + 1; known = false
  w przeciwnym razie jeśli box == 0:      known = true
  w przeciwnym razie jeśli wPowtórce lub due <= dziś:
       jeśli box == 4:         box = 0; due = null; known = true
       w przeciwnym razie:     box += 1; due = dziś + ODSTĘPY[box - 1]
  // poprawna odpowiedź przed terminem, poza Powtórkami: bez zmian etapu
```

W kodzie: `answer(stan, poprawnie, dziś, wPowtórce)`.

- **Na dziś** (`dueToday`, licznik `countDue`): pytania z `box > 0` i `due <= dziś`, od najstarszego terminu,
  najwyżej 20 na rundę.
- **Wykres 7 dni** (`weekForecast`): liczba pytań z `due` w danym dniu; zaległe doliczamy do „dziś”.
- **Opanowanie kategorii** (`categoryMastery`): `known` / liczba pytań kategorii w bazie.

## Losowanie — `src/lib/rng.ts`, `src/lib/round.ts`
- Generator: `mulberry32` z ziarnem liczonym z napisu funkcją skrótu (np. `cyrb53`). Żadnego `Math.random`
  w logice rund z ziarnem.
- **Runda z ziarnem** (Wyzwanie dnia, wyzwanie z linku): posortuj pytania po `id`, przetasuj Fisherem–Yatesem
  tym generatorem, weź pierwsze 10; kolejność odpowiedzi w każdym pytaniu tasuj tym samym generatorem.
  Ten sam napis ziarna i ta sama baza = identyczna runda na każdym urządzeniu.
- Ziarno Wyzwania dnia: `"d" + YYYYMMDD` (np. `d20261115`). Ziarno własnego wyzwania: `"c"` + 6 losowych znaków
  `[a-z0-9]`.
- **Runda bez ziarna:** kolejność wg priorytetu z `PRODUKT.md` (niewidziane → nieopanowane → opanowane najdawniej
  widziane), w obrębie grupy losowo; generator losowy przekazywany jako parametr (w testach — z ziarnem).
- Bez powtórzeń pytania w jednej rundzie. Szybka runda po wyczerpaniu puli tasuje ją od nowa.

## Link z wyzwaniem — `src/lib/share.ts`
Parametry w części `#` adresu (nie trafiają na serwer):

```
https://…/#w=d20261115&r=1101111011&n=Kasia&q=150
```

| Parametr | Znaczenie |
|---|---|
| `w` | ziarno rundy |
| `r` | wynik nadawcy: 10 znaków `1` (dobrze) / `0` (źle), w kolejności pytań |
| `n` | imię nadawcy, do 20 znaków, kodowane `encodeURIComponent` |
| `q` | liczba pytań w bazie nadawcy — gdy różni się od lokalnej, wyzwania nie da się rozegrać |

- Parsowanie przez `URLSearchParams`; wszystko z linku to **niezaufane dane**: sprawdź wzorce (`w`: `^[dc][a-z0-9]{6,8}$`,
  `r`: `^[01]{10}$`), przytnij imię, wyświetlaj wyłącznie jako tekst (React domyślnie escapuje — nie używaj
  `dangerouslySetInnerHTML`).
- Po wczytaniu wyzwania usuń `#…` z adresu (`history.replaceState`), żeby odświeżenie nie otwierało go ponownie.
- Udostępnianie: `navigator.share`, a gdy go nie ma — kopiowanie do schowka z potwierdzeniem „Skopiowano link”.
- Tekst udostępnienia: nazwa trybu z datą, wynik, rząd kratek 🟦/🟧 i link. Emoji wolno użyć tylko tutaj, w tekście
  wysyłanym na zewnątrz — nie w interfejsie.

## XP, poziomy, seria — `src/lib/xp.ts`, `src/lib/streak.ts`
Wartości i nazwy poziomów są w `PRODUKT.md`. Funkcje są czyste:
`xpForAnswer(poprawnie, zostałoSekund | null, tryb)`, `levelFor(xp) → { number, name, inLevel, toNext }`,
`completeDay(streak, dziś) → streak` (zaliczenie dnia) i `currentStreak(streak, dziś)` (seria do pokazania:
0, gdy ostatni zaliczony dzień był przedwczoraj lub wcześniej).

## Pozostałe moduły `src/lib/`
- `dates.ts` — `toDay(Date)`, `addDays`, `daysBetween`, `isDay`.
- `round.ts` — `buildRound({ mode, … }, { states, today, rand })`; `seededRound(ziarno)`; `refillQuick` dla
  Szybkiej rundy po wyczerpaniu puli; `dailySeed`, `newChallengeSeed`.
- `session.ts` — przebieg rundy jako czyste funkcje: `startSession`, `pick`, `tick`, `fiftyFifty`, `addTime`,
  `next`; zegar liczony z przekazanego `now` (`deadline` gdy tyka, `remainingMs` gdy stoi).
- `progress.ts` — typy postępu, `createProgress`, `applyAnswer`, `pruneDaily`, `cleanName`.
- `storage.ts` — `loadProgress(store) → { progress, status: 'ok' | 'new' | 'corrupt' | 'unavailable' }`,
  `saveProgress`, `clearProgress`, `browserStore()` (localStorage albo `null`).
- `share.ts` — `buildChallengeUrl`, `parseChallenge(hash, liczbaPytań) → status 'none' | 'invalid' |
  'bank-mismatch' | 'ok'`, `shareText`.
