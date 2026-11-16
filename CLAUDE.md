# Erudyta

Quiz wiedzy ogólnej, który uczy (UI po polsku): po każdej odpowiedzi ciekawostka, błędne pytania wracają
w powtórkach, wynik można porównać ze znajomymi. React 19 + Vite 8 + TypeScript, CSS Modules, bez backendu
w MVP (postęp w localStorage). Aplikacja mobilna w przeglądarce (PWA), kolumna do 480 px.

**Stan:** Etapy 1–6 gotowe (logika w `src/lib/`; Powitanie, Start, ścieżki, runda, wynik, awans, powtórki, profil). Kolejne kroki są w `docs/PLAN.md` — rób jeden etap naraz, w kolejności.

## Dokumentacja (czytaj przed pracą nad danym obszarem)
- `docs/PLAN.md` — etapy z zadaniami i warunkami „gotowe, gdy”. Źródło prawdy o tym, co robić teraz.
- `docs/PRODUKT.md` — zasady gry: tryby, zegar, XP, poziomy, seria, powtórki, wyzwania.
- `docs/DESIGN.md` — system wizualny „Kobalt”: tokeny, typografia, komponenty i ich stany, dostępność.
- `docs/EKRANY.md` — ekran po ekranie: co pokazuje, stany, akcje, skąd dane.
- `docs/DANE.md` — format pytań, schemat postępu, algorytmy (losowanie z ziarnem, powtórki), format linku.
- `design/project/*.dc.html` — makiety ekranów (wzorzec wyglądu). Dokładne wymiary i kolory są w ich stylach inline.

## Komendy
- Po każdej zmianie: `npx tsc -b && npx eslint . && npm test`; build: `npm run build`.
- Dev: `npm run dev` (port 5299, `strictPort`). Podgląd builda: `npm run preview`.
- Testy: Vitest (`vitest.config.ts`), pliki `src/**/*.test.ts`.

## Mapa
- `src/data/questions.ts` — baza pytań (`a[0]` to zawsze poprawna odpowiedź; `id` jest stałe — nowe pytania dopisuj
  na końcu kategorii). `src/data/categories.ts` — 6 kategorii. `src/data/questions.test.ts` pilnuje spójności bazy.
- `src/styles/theme.css` — tokeny (kolory, promienie, fonty, odstępy). `src/styles/global.css` — reset i baza.
- `src/App.tsx` — przełącza ekrany stanem (zakładki, ścieżka, Runda → Wynik → Nowy poziom → powrót).
- `src/platform/share.ts` — Web Share / schowek (jedyne miejsce z tymi API przeglądarki).
- Docelowo (patrz `docs/PLAN.md`): `src/lib/` — logika bez Reacta (`rng`, `round`, `session`, `progress`, `reviews`,
  `xp`, `streak`, `share`, `storage`), `src/progress/` — kontekst postępu, `src/screens/`, `src/components/`.

## Zasady
- Teksty w UI, komentarze i commity po polsku. Zwroty do użytkownika bez rodzaju („Dobrze!”, nie „Odpowiedziałeś”).
- Logika gry tylko w `src/lib/` jako czyste funkcje z testami; komponenty nie liczą XP, terminów ani losowań.
  „Dziś” i generator losowy przekazuj jako parametry — testy muszą być deterministyczne.
- Kolory, promienie i fonty tylko przez zmienne z `theme.css`. Nowy kolor = najpierw token i wpis w `docs/DESIGN.md`.
- Znaczenie nigdy samym kolorem: dobra/zła odpowiedź ma też ikonę. Cele dotyku min. 44 px. Kontrast tekstu min. 4,5:1.
- Bez nowych zależności bez pytania. Bez routera w MVP (ekrany przełącza stan w `App`, wyzwanie przychodzi w `#hash`).
- Fakty w pytaniach i ciekawostkach muszą być prawdziwe i sprawdzone; przy wątpliwości nie dodawaj pytania.
- Zmiana zasad gry lub wyglądu = aktualizacja odpowiedniego pliku w `docs/` w tym samym commicie.
- Commit po każdym zakończonym etapie, krótki opis po polsku. **Bez push bez zgody.**
- Weryfikacja: tsc + eslint + testy; UI sprawdzaj w przeglądarce na szerokości 390 px i porównuj z makietą.
