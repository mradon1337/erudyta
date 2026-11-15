# System wizualny „Kobalt”

Jasny, czytelny, z dwoma mocnymi kolorami. Niebieski prowadzi i nagradza, pomarańczowy zaprasza do gry i sygnalizuje
błąd. Zaokrąglone karty, płaskie wypełnienia, bez gradientów i bez cieni (jedyny cień ma panel po odpowiedzi).

Wzorcem są makiety w `design/project/` — przy różnicy między tym opisem a makietą wygrywa makieta, a opis poprawiamy.
Wartości w kodzie biorą się wyłącznie z `src/styles/theme.css`.

## Kolory

| Token | Wartość | Do czego |
|---|---|---|
| `--color-bg` | `#F3F5F9` | tło ekranu |
| `--color-surface` | `#FFFFFF` | karty, dolna nawigacja, panel po odpowiedzi |
| `--color-track` | `#E6E9F0` | tło pasków postępu, tło przełącznika zakładek |
| `--color-ink` | `#10162B` | tekst główny; tło ciemnych przycisków i kart |
| `--color-ink-2` | `#3A4256` | tekst pomocniczy w dłuższych opisach |
| `--color-muted` | `#5B6478` | podpisy, nieaktywne zakładki, odpowiedzi „wyszarzone” |
| `--color-border` | `#DDE2EC` | ramki kart (1 px) i odpowiedzi (2 px) |
| `--color-border-strong` | `#8E97AB` | pola formularza, przerywane ramki jokerów, wyłączony przełącznik |
| `--color-primary` | `#2F5BFF` | akcja główna, poprawna odpowiedź, wypełnienie postępu |
| `--color-primary-strong` | `#1F3FBF` | niebieski tekst na jasnym tle; ciemniejsze pola na niebieskiej karcie |
| `--color-primary-soft` | `#E5EBFF` | tło poprawnej odpowiedzi, chipy, wiersz „Ty” w rankingu |
| `--color-primary-chart` | `#B8C6FF` | słupki wykresu poza dniem dzisiejszym |
| `--color-accent` | `#FF8A3D` | przycisk „Graj” (tekst zawsze `ink`), pierścień wyniku |
| `--color-accent-mid` | `#E8590C` | paski i segmenty błędu, niska skuteczność |
| `--color-accent-strong` | `#C2410C` | ramka, plakietka i ikona błędnej odpowiedzi; ikona żarówki i płomienia |
| `--color-accent-text` | `#B13A08` | pomarańczowy tekst na jasnym tle |
| `--color-accent-deep` | `#8A2E06` | tekst na tle `accent-soft` |
| `--color-accent-soft` | `#FFEBDD` | tło błędnej odpowiedzi, karta „wraca do powtórki” |

### Znaczenie kolorów
- **Niebieski** = dobrze, postęp, „Ty”. **Pomarańczowy** = źle, uwaga, wezwanie do gry, seria.
- Para niebieski/pomarańczowy zamiast zielony/czerwony jest celowa (czytelna przy daltonizmie). Nie dodawaj
  zieleni ani czerwieni.
- Znaczenia nigdy nie niesie sam kolor: poprawna odpowiedź ma ptaszek, błędna krzyżyk, etap powtórki ma opis.

### Kontrast (sprawdzone pary)
Biały na `primary` 5,2:1 · `ink` na `accent` 7:1 · `muted` na białym 5,9:1 · `primary-strong` na `primary-soft` 7:1 ·
`accent-deep` na `accent-soft` 7:1. Biały tekst na `accent` **nie przechodzi** — na pomarańczowym zawsze `ink`.

## Typografia
- **Space Grotesk** (700, czasem 500) — nagłówki, liczby, logo. `letter-spacing: -0.02em`.
- **Inter** (400–700) — cała reszta.

| Rola | Font | Rozmiar / waga |
|---|---|---|
| Wynik końcowy rundy | Space Grotesk | 84 / 700, `line-height: 1` |
| Tytuł powitania | Space Grotesk | 34 / 700 |
| Tytuł ekranu, logo | Space Grotesk | 28–30 / 700 |
| Karta wyróżniona, treść pytania | Space Grotesk | 24–27 / 700, `line-height: 1.15–1.25` |
| Liczby w statystykach, werdykt | Space Grotesk | 22–24 / 700 |
| Nagłówek sekcji | Space Grotesk | 18–20 / 700 |
| Przycisk, odpowiedź | Inter | 16 / 600–700 |
| Treść, ciekawostka | Inter | 15 / 400, `line-height: 1.45` |
| Tekst pomocniczy | Inter | 14 |
| Podpis | Inter | 13, kolor `muted` |
| Etykieta | Inter | 12 / 700, wersaliki, `letter-spacing: 0.08em` |

Najmniejszy tekst to 12 px (11 px tylko w osi wykresu).

## Układ
- Kolumna o szerokości do **480 px**, wyśrodkowana; makiety są rysowane dla 390 px.
- Margines boczny ekranu 20 px; odstęp między sekcjami 18–20 px; wewnątrz kart 10–14 px. Siatka 4 px.
- Dolna nawigacja ma 80 px i jest przyklejona do dołu; treść dostaje `padding-bottom: 100px`.
- Uwzględnij bezpieczne obszary telefonu: `env(safe-area-inset-*)`.
- Na komputerze ta sama kolumna na tle `bg` — bez osobnego układu w MVP.

## Promienie
10 plakietka litery · 12 kafelek ikony · 14 przycisk ikonowy i „Graj” · 16 przyciski i odpowiedzi · 18–20 karty ·
24 karty wyróżnione · 28 górne rogi panelu · 999 pigułki i paski.

## Komponenty

### Przyciski (wysokość 54–56 px, promień 16, tekst 16–17 / 700)
| Wariant | Tło / tekst | Gdzie |
|---|---|---|
| Główny | `primary` / biały | „Zaczynamy”, „Zobacz podsumowanie”, „Gotowe” |
| Graj | `accent` / `ink`, często z ikoną ▶ | każde rozpoczęcie rundy |
| Ciemny | `ink` / biały, strzałka z prawej | „Dalej” w panelu po odpowiedzi |
| Wtórny | biały, ramka 2 px `border` / `ink` | „Zagraj jeszcze raz”, „Udostępnij” |
| Tekstowy | bez tła / `ink-2` lub `accent-text` | „Nie teraz”, „Wyczyść cały postęp” |
| Ikonowy | 44×44, biały, ramka 1 px, promień 14 | zamknij, wstecz |

Stany: `:hover` lekko ciemniejsze tło, `:active` skala 0,98, `:disabled` tekst `muted` i brak reakcji,
`:focus-visible` obrys 3 px `primary` z odstępem 2 px.

### Karta
Biała, ramka 1 px `border`, promień 18–20, wypełnienie 14–16. **Karta wyróżniona**: tło `primary` (biały tekst)
albo `ink`, promień 24, wypełnienie 20–22, bez ramki. **Karta ostrzegawcza**: tło `accent-soft`, bez ramki.

### Kafel ścieżki wiedzy
Karta z ikoną w kwadracie 40×40 (promień 12), nazwą 15 / 700, podpisem „62% opanowane” i paskiem 6 px.
Ton (niebieski lub pomarańczowy) jest stałą cechą kategorii — pole `tone` w `src/data/categories.ts`.

### Odpowiedź
Przycisk na całą szerokość, min. 58 px, promień 16, ramka 2 px; z lewej plakietka 32×32 z literą A–D.

| Stan | Tło | Ramka | Plakietka | Ikona |
|---|---|---|---|---|
| Domyślna | biały | `border` | `bg` / `ink` | — |
| Poprawna (po odpowiedzi) | `primary-soft` | `primary` | `primary` / biały | ptaszek `primary` |
| Wybrana błędna | `accent-soft` | `accent-strong` | `accent-strong` / biały | krzyżyk `accent-strong` |
| Pozostałe po odpowiedzi | biały | `border` | tekst `muted` | — |

Po odpowiedzi wszystkie przyciski są `disabled`. Odpowiedzi schowane jokerem 50/50 znikają z listy.

### Nagłówek rundy
Przycisk zamknięcia · „Pytanie 2 z 5” · pigułka czasu z ikoną zegara (tekst `accent-strong`, gdy ≤ 5 s).
Pod spodem segmenty postępu (6 px, odstęp 6 px): dobre `primary`, złe `accent-mid`, bieżące `ink`, przyszłe `border`.

### Jokery
Dwa przyciski obok siebie, 48 px, biały, **przerywana** ramka `border-strong`. Zużyty: tekst `muted`,
podpis „50/50 użyte”, `disabled`. Znikają po udzieleniu odpowiedzi.

### Panel po odpowiedzi
Przyklejony do dołu, biały, górne rogi 28, górna linia 3 px (`primary` po dobrej, `accent-mid` po złej),
cień `--shadow-sheet`. Zawiera: werdykt (22 / 700), poprawną odpowiedź, blok „Ciekawostka” na tle `bg` z ikoną
żarówki, przycisk „Dalej”. Ma `aria-live="polite"`; po wysunięciu fokus przechodzi na „Dalej”.

### Dolna nawigacja
4 zakładki: Start, Powtórki, Ranking, Profil. Ikona 24 px nad podpisem 12 px. Aktywna: `primary` / 700 i
`aria-current="page"`; nieaktywne: `muted` / 600. Nie pokazuj jej w trakcie rundy, na wyniku, powitaniu i awansie.

### Pozostałe
- **Chip**: pigułka, tło `primary-soft`, tekst `primary-strong` 13 / 700 (kategoria pytania, „Runda ukończona”).
- **Pasek postępu**: 6–10 px, tło `track`, wypełnienie `primary`. W Profilu skuteczność poniżej 60% ma `accent-mid`.
- **Przełącznik zakładek** (Ranking): tło `track`, aktywny segment biały, `aria-pressed`.
- **Przełącznik** (Profil): 52×32, włączony `primary`, wyłączony `border-strong`, `role="switch"`.
- **Pole tekstowe**: 54 px, promień 16, ramka 2 px `border-strong`, widoczna etykieta nad polem.
- **Okno potwierdzenia** (np. „Przerwać rundę?”): natywny `<dialog>` otwierany `showModal()`, biały, promień 24,
  tytuł 22 / 700, opis 15 `ink-2`, pod spodem dwa przyciski na całą szerokość — bezpieczny wybór jako główny
  (np. „Graj dalej”, z fokusem), ryzykowny jako wtórny. Tło za oknem: `ink` z kryciem 45% (`color-mix`).
- **Kratki wyniku** (Wyzwanie): 10 kratek 26 px, `primary` dobre, `accent-mid` złe — zawsze z opisem słownym.

## Ikony
Liniowe SVG 24×24, `stroke="currentColor"`, grubość 2, zaokrąglone końce; kształty skopiuj z makiet.
Bez emoji w interfejsie. Ikona dekoracyjna ma `aria-hidden="true"`; ikona niosąca znaczenie — `role="img"` i `aria-label`.

## Ruch
- Przejścia stanów 150–200 ms `ease-out`. Panel po odpowiedzi wjeżdża od dołu w 250 ms.
- Poprawna odpowiedź: krótkie „podskoczenie” (skala 1 → 1,03 → 1). Błędna: jedno potrząśnięcie w poziomie.
- Nowy poziom: plakietka „wyskakuje”, kolorowe kwadraciki opadają raz (bez pętli).
- `prefers-reduced-motion: reduce` wyłącza wszystko poza zmianą kolorów (reguła jest już w `global.css`).

## Dostępność — lista kontrolna
- Prawdziwe `<button>`, `<a>`, `<input>` z `<label>`; żadnych klikalnych `<div>`.
- Cele dotyku min. 44×44 px. Tekst min. 4,5:1 (duży 24 px+ min. 3:1).
- Zegar: czytnik ekranu dostaje komunikat tylko przy 10 s i 5 s, nie co sekundę.
- Klawiatura w rundzie: klawisze 1–4 lub A–D wybierają odpowiedź, Enter to „Dalej” (obsługa na komponencie rundy).
- Każdy ekran ma jeden `<h1>`; `lang="pl"` na `<html>`.

## Ciemny motyw (Etap 10)
Nie projektujemy go teraz. Dzięki tokenom wystarczy drugi zestaw wartości pod `[data-theme="dark"]`; nazwy tokenów
opisują rolę, nie kolor, żeby to było możliwe.
