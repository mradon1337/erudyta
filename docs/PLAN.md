# Plan budowy

Jeden etap = jedna sesja pracy i jeden commit. Rób je po kolei: każdy opiera się na poprzednim.
Polecenie dla Claude Code może brzmieć po prostu: **„Zrób Etap 2 z docs/PLAN.md”**.

Po każdym etapie: `npx tsc -b && npx eslint . && npm test`, sprawdzenie w przeglądarce na 390 px, porównanie
z makietą, odhaczenie etapu poniżej, commit.

## Etap 0 — Szkielet ✅
- [x] Projekt React + Vite + TypeScript, ESLint, Vitest, fonty Inter i Space Grotesk.
- [x] Tokeny w `src/styles/theme.css`, baza 150 pytań z testami spójności.
- [x] Makiety 10 ekranów w `design/project/`, dokumentacja w `docs/`.

## Etap 1 — Logika gry (bez interfejsu) ✅
Pliki w `src/lib/`, każdy z testem obok. Opis algorytmów: `DANE.md`.
- [x] `dates.ts` — dzień lokalny `YYYY-MM-DD`, dodawanie dni, różnica dni.
- [x] `rng.ts` — skrót napisu, `mulberry32`, tasowanie.
- [x] `reviews.ts` — `answer(...)`, lista „na dziś”, rozkład na 7 dni, opanowanie kategorii.
- [x] `xp.ts`, `streak.ts` — punkty, poziomy z nazwami, seria z rekordem.
- [x] `round.ts` — budowa rundy dla każdego trybu (z ziarnem i bez), tasowanie odpowiedzi.
- [x] `storage.ts` — wczytywanie i zapis postępu z obsługą błędów i wartościami domyślnymi.
- [x] `share.ts` — budowa i parsowanie linku z wyzwaniem.

**Gotowe, gdy:** testy pokrywają pełną ścieżkę powtórki (błąd → 1 → 3 → 7 → 14 dni → opanowane, oraz błąd
w połowie), tę samą rundę dla tego samego ziarna, zerowanie serii po przerwie, odrzucenie zepsutego linku
i zepsutego JSON-a w localStorage.

## Etap 2 — Runda ✅
Makieta: `Quiz.dc.html`. Opis: `EKRANY.md` pkt 3.
- [x] Kontekst postępu (`src/progress/`: `progressContext.ts`, `ProgressProvider.tsx`, `useProgress.ts`).
- [x] Komponenty: `Button`, `IconButton`, `Chip`, `Icon`, `AnswerButton`, `RoundHeader`, `FeedbackSheet`.
- [x] Ekran rundy: zegar (liczony z `Date.now()`, nie z liczby tyknięć), jokery, panel z ciekawostką,
  zapis po każdej odpowiedzi, potwierdzenie wyjścia, obsługa klawiatury.
- [x] `App` przełącza ekrany stanem; tymczasowy przycisk „Zagraj” uruchamia rundę mieszaną.

**Gotowe, gdy:** da się przejść 10 pytań myszą i samą klawiaturą; upływ czasu działa jak błąd; odświeżenie strony
w trakcie rundy nie gubi zapisanych odpowiedzi; wszystkie 4 stany odpowiedzi wyglądają jak na makiecie.

## Etap 3 — Wynik i nowy poziom ✅
Makiety: `Wynik.dc.html`, `Awans.dc.html`.
- [x] Ekran wyniku z wariantami z `EKRANY.md` pkt 4, zaliczenie dnia serii, bonus za Wyzwanie dnia.
- [x] Ekran nowego poziomu pokazywany po wyniku, gdy poziom wzrósł.

**Gotowe, gdy:** wynik zgadza się z przebiegiem rundy, XP i seria rosną zgodnie z `PRODUKT.md`, a runda bez błędów
i runda z samymi błędami mają sensowne komunikaty.

## Etap 4 — Start, ścieżki, tryby
Makiety: `Main.dc.html`, `Kategoria.dc.html`.
- [ ] Ekran Start z prawdziwymi danymi; Wyzwanie dnia w stanie „do zagrania” i „rozegrane”.
- [ ] Ekran ścieżki z kolekcją ciekawostek i pustymi stanami.
- [ ] Tryby: Szybka runda (zegar 60 s, rekord), Nauka bez stresu.
- [ ] Dolna nawigacja (`BottomNav`).

**Gotowe, gdy:** każdy kafel i tryb prowadzi do właściwej rundy, a procenty na Starcie zmieniają się po grze.

## Etap 5 — Powtórki
Makieta: `Powtorki.dc.html`.
- [ ] Ekran z licznikiem na dziś, wykresem 7 dni, listą kart i pustymi stanami.
- [ ] Runda w trybie powtórek (bez zegara, 10 XP, etap na chipie), licznik na zakładce.

**Gotowe, gdy:** błąd z dzisiejszej rundy widać w kartach z terminem „jutro”, a po przestawieniu daty systemowej
pytanie pojawia się w „Na dziś” i po poprawnej odpowiedzi przechodzi na „za 3 dni”.

## Etap 6 — Powitanie i profil
Makiety: `Onboard.dc.html`, `Profil.dc.html`.
- [ ] Powitanie przy pierwszym uruchomieniu, zapis imienia.
- [ ] Profil: statystyki, skuteczność w kategoriach, zmiana imienia, ustawienie zegara, wyczyszczenie postępu.

**Gotowe, gdy:** nowy użytkownik trafia na Powitanie, a po wyczyszczeniu postępu aplikacja wraca do stanu początkowego.

## Etap 7 — Wyzwania przez link
Makiety: `Wyzwanie.dc.html`, `Ranking.dc.html` (wariant MVP z `EKRANY.md` pkt 8).
- [ ] „Udostępnij” po Wyzwaniu dnia i „Wyzwij znajomego” na Starcie (Web Share albo schowek).
- [ ] Odczyt linku przy starcie, ekran wyzwania, porównanie na wyniku, +50 XP za wygraną.
- [ ] Zakładka Ranking: historia wyzwań i rekordy.

**Gotowe, gdy:** link otwarty w drugiej przeglądarce (okno prywatne) daje te same 10 pytań w tej samej kolejności,
a zepsuty link pokazuje komunikat zamiast błędu.

## Etap 8 — Aplikacja na telefon (PWA) i publikacja
- [ ] `manifest.webmanifest`, ikony 192 i 512 px (także maskowalna), `theme-color`.
- [ ] Service worker: pliki aplikacji z pamięci podręcznej, działanie offline, odświeżanie po nowej wersji.
- [ ] Publikacja jako strona statyczna (np. GitHub Pages; `base: './'` jest już ustawione).

**Gotowe, gdy:** aplikację da się dodać do ekranu głównego telefonu i rozegrać rundę w trybie samolotowym.

## Równolegle — Więcej pytań
Można robić w dowolnym momencie po Etapie 1, niezależnie od ekranów.
- [ ] Rozbudowa bazy do 500+ pytań (ok. 85 na kategorię), w paczkach po 50 z przeglądem faktów.
- [ ] Rozważ podział bazy na pliki per kategoria i ładowanie leniwe, gdy plik przekroczy ok. 300 kB.

## Później (wymaga decyzji)
- **Etap 9 — Serwer:** konta, synchronizacja postępu, liga tygodniowa, ranking znajomych, pojedynek na żywo
  (docelowa makieta `Ranking.dc.html`). Naturalny wybór to ASP.NET Core + SQLite, jak we Fliq.
- **Etap 10 — Dodatki:** ciemny motyw, dźwięki i haptyka, przypomnienia o serii, zgłaszanie błędów w pytaniach,
  drugi motyw graficzny (np. „Retro arcade” z kanwy).
