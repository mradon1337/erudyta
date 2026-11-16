# Ekrany

Każdy ekran ma makietę w `design/project/`. Liczby i imiona na makietach to dane przykładowe.
Zasady gry: `PRODUKT.md`. Wygląd komponentów: `DESIGN.md`. Dane: `DANE.md`.

## Mapa przejść

```
Powitanie ──► Start ──► Runda ──► Wynik ──► (Nowy poziom) ──► Start
                │  ▲                 │
                │  └── Ścieżka wiedzy ┘
                ├──► Powtórki ──► Runda (tryb powtórek)
                ├──► Ranking
                └──► Profil
Link z wyzwaniem ──► Wyzwanie od znajomego ──► Runda ──► Wynik (z porównaniem)
```

Dolna nawigacja (Start, Powtórki, Ranking, Profil) jest widoczna tylko na tych czterech ekranach.

---

## 1. Powitanie — `Onboard.dc.html`
**Kiedy:** pierwsze uruchomienie (brak zapisanego postępu).
**Zawiera:** logo, hasło, trzy korzyści z ikonami, pole „Jak mamy Cię nazywać?” (do 20 znaków, opcjonalne),
przycisk „Zaczynamy”, dopisek o braku konta.
**Akcje:** „Zaczynamy” zapisuje imię (puste → „Ty”) i tworzy pusty postęp, potem Start.
**Jeśli aplikację otwarto z linku wyzwania:** po powitaniu przejdź do ekranu Wyzwanie, nie na Start.

## 2. Start — `Main.dc.html`
**Zawiera, od góry:**
1. Powitanie zależne od pory dnia + logo; pigułka serii („12 dni”, przy serii 0 — „Zacznij serię”).
2. Karta **Wyzwanie dnia**: opis, przycisk „Graj”, czas do północy („kończy się za 7 h”).
   Po rozegraniu: wynik „8/10” i przycisk „Udostępnij” zamiast „Graj”.
3. Karta poziomu: „Poziom 7 · Bystrzak”, pasek XP, ile brakuje do następnego.
4. **Ścieżki wiedzy**: 6 kafli (2 kolumny) z procentem opanowania → ekran Ścieżka wiedzy.
5. **Tryby gry**: Szybka runda (podpis z rekordem, gdy jest), Nauka bez stresu, Pojedynek
   (w MVP: „Wyzwij znajomego” — tworzy link; podpis „5 pytań na żywo” wraca w Etapie 9).

**Dodatkowo:** jeśli są powtórki na dziś, zakładka Powtórki ma licznik.

## 3. Runda — `Quiz.dc.html` (makieta grywalna)
**Zawiera:** nagłówek rundy z zegarem, segmenty postępu, chip kategorii, pytanie, 4 odpowiedzi, jokery.
**Stany:**
- *Pytanie* — zegar tyka, jokery dostępne.
- *Po odpowiedzi* — odpowiedzi pokolorowane, jokery znikają, wysuwa się panel z werdyktem i ciekawostką.
  Werdykty: „Dobrze! +25 XP” / „Nie tym razem” / „Czas minął”. Po błędzie dopisek „To pytanie wróci jutro w Powtórkach”.
- *Koniec rundy* — makieta pokazuje prosty ekran końcowy; w aplikacji od razu przechodzimy do ekranu Wynik.

**Warianty wg trybu:** bez zegara (Nauka, Powtórki) — brak pigułki czasu i jokerów; Szybka runda — jeden zegar
na całą rundę i licznik poprawnych zamiast „Pytanie 2 z 10”; Powtórki — chip pokazuje też etap („Etap 2 z 4”).
**Zamknięcie (X lub Escape):** okno potwierdzenia „Przerwać rundę?” z przyciskami „Graj dalej” (fokus) i „Przerwij
rundę”. Zegar w tym czasie nie staje.
**Klawiatura:** 1–4 lub A–D wybiera odpowiedź, Enter to „Dalej”. Po przejściu do nowego pytania fokus trafia na jego treść.

## 4. Wynik — `Wynik.dc.html`
**Zawiera:** chip z nazwą trybu, ciemna karta z pierścieniem wyniku i komentarzem, trzy statystyki (XP, seria,
średni czas odpowiedzi), „Zapamiętaj z dzisiejszej rundy” (do 2 ciekawostek z tej rundy, najpierw z błędnych
odpowiedzi), karta „Wraca do powtórki” (gdy były błędy), przyciski „Udostępnij” i „Gotowe”.
**Warianty:**
- Komentarz wg wyniku: 100% „Komplet!”, ≥ 70% „Świetna runda!”, ≥ 40% „Dobra robota”, poniżej „Następnym razem pójdzie lepiej”.
- Zdanie o znajomych z makiety pojawia się tylko przy wyzwaniu z linku („Lepiej niż Kasia: 9 do 8”) — w MVP
  nie ma danych o innych graczach.
- „Udostępnij” widać po Wyzwaniu dnia i wyzwaniu z linku; w pozostałych trybach zastępuje je „Zagraj jeszcze raz”.
- Bez błędów: zamiast karty powtórki — „Wszystko dobrze. Nic nie trafia do powtórek.”
- Karta powtórki wypisuje do 3 pytań („Twoja odpowiedź: … · poprawna: …” albo „Czas minął · …”), resztę
  streszcza „i jeszcze N pytań”.
- Szybka runda: w pierścieniu sama liczba poprawnych, komentarz „Nowy rekord!”, gdy padł rekord.
- Drugie podejście do Wyzwania dnia: chip „Wyzwanie dnia · trening”, bez XP; „Udostępnij” wysyła pierwszy wynik dnia.
- X i „Gotowe” prowadzą na Start, a gdy poziom wzrósł — najpierw na Nowy poziom (także przed „Zagraj jeszcze raz”
  i po przerwanej rundzie, która podniosła poziom).

## 5. Nowy poziom — `Awans.dc.html`
**Kiedy:** po ekranie Wynik, jeśli runda podniosła poziom.
**Zawiera:** numer i nazwę poziomu, pasek do następnego, „Pochwal się” (udostępnia tekst) i „Gram dalej”.

## 6. Ścieżka wiedzy — `Kategoria.dc.html`
**Zawiera:** niebieska karta z nazwą, procentem opanowania i trzema licznikami (opanowane, w powtórkach, nowe);
przyciski „Runda 10 pytań” i „Bez zegara”; **Kolekcja ciekawostek** — lista ciekawostek opanowanych pytań
(od najnowszych) i przerywana ramka „9 ciekawostek czeka na odkrycie”.
**Pusty stan:** brak opanowanych pytań → sama ramka „25 ciekawostek czeka na odkrycie”.
**Gdy opanowane 100%:** przycisk „Runda 10 pytań” zostaje (trening), a nad kolekcją chip „Ścieżka ukończona”.

## 7. Powtórki — `Powtorki.dc.html`
**Zawiera:** tytuł i jedno zdanie wyjaśnienia; karta „Na dziś: 8 pytań” z przyciskiem „Zacznij”;
wykres słupkowy na 7 dni (dziś wyróżnione kolorem i pogrubieniem, liczba nad każdym słupkiem);
„Twoje karty” — pytania w powtórkach z kategorią, terminem („wraca jutro”, „za 3 dni”) i etapem (4 kreski).
**Puste stany:** nic na dziś → „Na dziś wszystko powtórzone” i termin najbliższej powtórki, przycisk nieaktywny;
nic w powtórkach → krótkie wyjaśnienie, skąd biorą się powtórki, i przycisk „Zagraj rundę”.

## 8. Ranking — `Ranking.dc.html`
**Makieta pokazuje wersję docelową (Etap 9):** przełącznik Znajomi / Liga tygodnia, lista z wyróżnionym wierszem
„Ty”, karta pojedynku, przycisk „Zaproś”.
**MVP (bez serwera):** ten sam układ, inna treść —
- przełącznik: „Wyzwania” / „Rekordy”;
- *Wyzwania*: lista rozegranych wyzwań z linków (imię, wynik znajomego, Twój wynik, kto wygrał) i przycisk
  „Wyzwij znajomego”; pusty stan zachęca do wysłania pierwszego linku;
- *Rekordy*: najlepsza Szybka runda, najdłuższa seria, wyniki Wyzwań dnia z ostatnich 7 dni.

## 9. Wyzwanie od znajomego — `Wyzwanie.dc.html`
**Kiedy:** aplikację otwarto z linku z `#w=…` (format w `DANE.md`).
**Zawiera:** inicjał i imię nadawcy, „Wynik do pobicia 8/10”, 10 kratek dobre/złe (bez treści pytań), zasady
(10 pytań, 20 s, +50 XP za wygraną), „Podejmij wyzwanie”, „Nie teraz”.
**Błędy:** link uszkodzony albo z innej wersji bazy pytań → komunikat „Tego wyzwania nie da się już rozegrać”
i przycisk „Na start”. Własny link (to samo ziarno już rozegrane) → od razu porównanie, bez ponownej gry.

## 10. Profil — `Profil.dc.html`
**Zawiera:** karta z inicjałem, imieniem, poziomem i przyciskiem „Zmień”; 4 statystyki (odpowiedzi łącznie,
skuteczność, pytania opanowane, najdłuższa seria); skuteczność w kategoriach (posortowana malejąco, poniżej 60%
pomarańczowa); ustawienia: Dźwięki, Zegar w rundach, Ciemny motyw; „Wyczyść cały postęp”.
**Uwagi:**
- „Zegar w rundach” wyłączony zamienia rundy ścieżek na wariant bez zegara; nie dotyczy Wyzwania dnia,
  wyzwań z linku i Szybkiej rundy.
- „Ciemny motyw” i „Dźwięki” do czasu realizacji (Etap 10) ukryj — nie pokazuj martwych przełączników.
- „Wyczyść cały postęp” wymaga potwierdzenia w oknie i wraca do Powitania.
