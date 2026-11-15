# Erudyta — opis produktu

## Pomysł w jednym zdaniu
Krótkie rundy quizu z wiedzy ogólnej, w których każda odpowiedź czegoś uczy: zawsze pojawia się ciekawostka,
a pytania z błędną odpowiedzią wracają w powtórkach, aż zostaną zapamiętane.

## Dla kogo
- Dla autora i jego znajomych: ktoś, kto lubi gry-quizy i chce przy okazji poszerzać wiedzę ogólną.
- Sesja trwa 2–5 minut, na telefonie, często jedną ręką. Bez zakładania konta.

## Czym się wyróżnia
1. **Ciekawostka po każdej odpowiedzi** — także po poprawnej. To ona uczy, nie sam wynik.
2. **Powtórki** — błędy wracają po 1, 3, 7 i 14 dniach (system pudełek, patrz niżej).
3. **Wyzwanie dnia** — 10 pytań, te same dla wszystkich danego dnia, więc wyniki da się porównać.
4. **Wyzwania przez link** — bez serwera: link niesie ziarno losowania i wynik nadawcy.

## Tryby gry

| Tryb | Pytania | Zegar | Jokery | Uwagi |
|---|---|---|---|---|
| Wyzwanie dnia | 10, ziarno = data lokalna | 20 s na pytanie | tak | Wynik liczy się raz dziennie; kolejne podejścia to trening bez XP |
| Ścieżka wiedzy (kategoria) | 10 z kategorii | 20 s | tak | Wariant „Bez zegara” z ekranu ścieżki |
| Szybka runda | bez limitu | 60 s łącznie | nie | Zegar stoi, gdy widać ciekawostkę; liczy się rekord poprawnych |
| Nauka bez stresu | 10 mieszanych | brak | nie | Dla nauki, nie dla wyniku |
| Powtórki | do 20 zaległych | brak | nie | Tylko pytania z terminem na dziś lub wcześniej |
| Wyzwanie z linku | 10, ziarno z linku | 20 s | tak | Po rundzie porównanie z wynikiem nadawcy |
| Pojedynek na żywo, liga | — | — | — | Wymagają serwera — Etap 9 |

Dobór pytań poza trybami z ziarnem: najpierw nigdy niewidziane, potem nieopanowane, na końcu opanowane
(najdawniej widziane pierwsze). Kolejność odpowiedzi A–D jest losowana przy każdym wyświetleniu.

## Zasady rundy
- **Zegar:** 20 s na pytanie. Upływ czasu liczy się jak błędna odpowiedź („Czas minął”). Przy 5 s i mniej czas
  zmienia kolor na pomarańczowy. Po udzieleniu odpowiedzi zegar staje.
- **Jokery** (po jednym na rundę, tylko w rundach z zegarem na pytanie): **50/50** chowa dwie błędne odpowiedzi,
  **+10 s** dodaje czas do bieżącego pytania.
- **Po odpowiedzi** wysuwa się panel: werdykt, poprawna odpowiedź, ciekawostka, przycisk „Dalej”
  (na ostatnim pytaniu „Zobacz wynik”). Nie ma automatycznego przejścia — użytkownik czyta w swoim tempie.
- **Wyjście z rundy** (X): pyta o potwierdzenie; przerwana runda nie daje serii ani bonusu za ukończenie,
  ale udzielone odpowiedzi i XP zostają zapisane.

## Punkty i poziomy
- Poprawna odpowiedź: **20 XP**. Bonus za szybkość: **+5 XP**, gdy zostało co najmniej 10 s (tylko z zegarem).
- Poprawna odpowiedź w Powtórkach: **10 XP**.
- Ukończenie Wyzwania dnia: **+20 XP**. Wygrane wyzwanie z linku (wynik lepszy niż nadawcy): **+50 XP**.
- **Poziom** = `floor(xp / 1000) + 1`. Nazwy: 1 Nowicjusz, 2 Ciekawski, 3 Uczeń, 4 Bywalec, 5 Oczytany,
  6 Znawca, 7 Bystrzak, 8 Erudyta, 9 Mędrzec, 10 Omnibus (powyżej 10: „Omnibus” z numerem poziomu).
- Awans pokazuje ekran „Nowy poziom” po zakończeniu rundy (nie w jej trakcie).

## Seria
Dzień zalicza ukończenie co najmniej jednej rundy dowolnego trybu. Seria rośnie, gdy poprzedni zaliczony dzień
to wczoraj; przerwa zeruje ją do 1 przy następnej rundzie. Zapamiętujemy też najdłuższą serię.
Dni liczymy w czasie lokalnym urządzenia.

## Powtórki (system pudełek)
- Błędna odpowiedź (lub upływ czasu) w dowolnym trybie: pytanie trafia do **etapu 1**, termin **jutro**.
- Poprawna odpowiedź w powtórce: etap +1, kolejne terminy po **3**, **7** i **14** dniach.
- Poprawna odpowiedź na etapie 4: pytanie jest **opanowane** i wychodzi z powtórek.
- Błąd na dowolnym etapie: powrót do etapu 1, termin jutro.
- Poprawna odpowiedź na pytanie, którego nie ma w powtórkach: od razu **opanowane**.
- Poprawna odpowiedź poza Powtórkami na pytanie z terminem w przyszłości nie zmienia etapu.

**Opanowanie ścieżki** = opanowane pytania / wszystkie pytania kategorii. **Kolekcja ciekawostek** w ścieżce
to ciekawostki opanowanych pytań; reszta jest „do odkrycia”.

## Znajomi
- **MVP (bez serwera):** przycisk „Udostępnij” po Wyzwaniu dnia i „Wyzwij znajomego” tworzą link. Odbiorca widzi
  ekran „Wyzwanie od znajomego” (imię, wynik, kratki dobrych i złych odpowiedzi — bez treści pytań), gra te same
  pytania i dostaje porównanie. Zakładka Ranking pokazuje wtedy historię wyzwań i własne rekordy.
- **Docelowo (Etap 9, serwer):** liga tygodniowa, ranking znajomych, pojedynek na żywo — jak na makiecie `Ranking`.

## Poza zakresem MVP
Konta i synchronizacja między urządzeniami, powiadomienia, pojedynek na żywo, liga, pytania otwarte i obrazkowe,
zgłaszanie błędów w pytaniach, ciemny motyw (przełącznik jest na makiecie Profilu, realizacja w Etapie 10).

## Treść
- Start: 150 pytań, po 25 w każdej z 6 kategorii. Cel: 500+ (ścieżka „Więcej pytań” w `PLAN.md`).
- Każde pytanie: 1 poprawna i 3 wiarygodne błędne odpowiedzi tego samego rodzaju (rok obok roku, nazwisko obok
  nazwiska), ciekawostka do 170 znaków, która dodaje coś ponad samą odpowiedź.
- Tylko fakty pewne i stabilne w czasie. Jeśli coś może się zmienić (rekordy, liczby), ciekawostka podaje rok
  albo sformułowanie „ponad…”.
