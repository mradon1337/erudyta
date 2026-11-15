# Erudyta

Quiz wiedzy ogólnej, który uczy: ciekawostka po każdej odpowiedzi, powtórki błędnych pytań i wyzwania ze znajomymi.
Aplikacja webowa na telefon (React + Vite + TypeScript), bez serwera — postęp zapisuje się w przeglądarce.

**Stan:** szkielet projektu, baza 150 pytań, komplet makiet i dokumentacji. Ekrany powstają etapami z `docs/PLAN.md`.

## Uruchomienie

```bash
npm install
```

```bash
npm run dev
```

Aplikacja działa pod adresem http://localhost:5299.

## Sprawdzanie

```bash
npx tsc -b && npx eslint . && npm test
```

## Gdzie co jest
- `docs/PLAN.md` — co robić dalej, etap po etapie.
- `docs/PRODUKT.md` — zasady gry. `docs/DESIGN.md` — wygląd. `docs/EKRANY.md` — ekrany. `docs/DANE.md` — dane.
- `design/` — makiety ekranów w stylu „Kobalt”.
- `CLAUDE.md` — instrukcje dla Claude Code.
