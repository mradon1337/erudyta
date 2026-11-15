# Makiety „Kobalt”

Pliki `project/*.dc.html` to makiety ekranów z kanwy projektowej (format Design Component). Są wzorcem wyglądu:
dokładne kolory, rozmiary, odstępy i kształty ikon odczytuj z ich stylów inline i znaczników SVG.
To nie jest kod aplikacji — nie importuj ich i nie kopiuj stylów inline do komponentów (używaj tokenów z
`src/styles/theme.css`).

Kanwa na żywo: https://claude.ai/artifact/2iE7gLwGNaob9jV49hTicD (prywatna — widoczna dla właściciela).
Na kanwie są też odrzucone kierunki (strony „D–F” i „A–C”); do repozytorium trafił tylko wybrany „Kobalt”.

| Plik | Ekran | Rozmiar |
|---|---|---|
| `Onboard.dc.html` | Powitanie | 390×844 |
| `Main.dc.html` | Start | 390×1200 (ekran przewijany) |
| `Quiz.dc.html` | Runda — makieta grywalna: zegar, jokery, panel z ciekawostką | 390×844 |
| `Wynik.dc.html` | Wynik rundy | 390×844 |
| `Awans.dc.html` | Nowy poziom | 390×844 |
| `Kategoria.dc.html` | Ścieżka wiedzy | 390×844 |
| `Powtorki.dc.html` | Powtórki | 390×844 |
| `Ranking.dc.html` | Ranking (wersja docelowa, z serwerem) | 390×844 |
| `Wyzwanie.dc.html` | Wyzwanie od znajomego | 390×844 |
| `Profil.dc.html` | Profil | 390×980 (ekran przewijany) |

Liczby, imiona i wyniki na makietach to dane przykładowe. Opis zachowania ekranów: `docs/EKRANY.md`.
