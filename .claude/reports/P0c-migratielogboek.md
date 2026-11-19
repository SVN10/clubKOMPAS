# Logboek migratie P0c — club loskoppelen van gebruiker

- **Datum:** 19 november 2026
- **Uitvoerder:** PO (console en scripts), begeleid door Claude
- **Club:** Hockey Club Alphen
- **clubId:** `zVlRYYHjyFc42lACQhdr`

> De echte uid van het HCA-account staat bewust niet in dit logboek (zie `scripts/firestore.rules.migratie`).

## Verloop

| Tijd | Stap | Wat | Resultaat |
|---|---|---|---|
| vóór 21:48 | 0 | Huidige console-regels veiliggesteld in `scripts/firestore.rules.voor-P0c` | Gedaan. Oude regels waren **niet open**: alleen `request.auth.uid == clubId` op `clubs/{clubId}/**`. Geen datalek. |
| vóór 21:48 | — | **Voorval:** nieuwe `firestore.rules` per ongeluk gepubliceerd tijdens Playground-controle (vóór de migratie) | Live app had kort geen toegang tot data. Oude regels uit `scripts/firestore.rules.voor-P0c` opnieuw gepubliceerd; app werkt weer. Geen gegevens verloren. Bijvangst: nieuwe regels bevatten geen syntaxfouten. |
| 21:48 | — | Start migratie | Volgorde gekozen: 1 overgangsregels → 2 script → 3a app live (push) → 3b Playground → 3c definitieve regels → 4 rookproef |
| 21:50 | 1 | Overgangsregels **aan** | Gepubliceerd door PO (alleen HCA-account, alle paden) |
| 21:52 | 2 | Migratiescript `--droog` | Clubnaam Hockey Club Alphen, 3 pijlers, 3 domeinen, logo aanwezig, geen LET OP-meldingen. 10 schrijfacties (clubdocument, ledendocument, gebruikerswijzer, profiel, 6 structuurelementen). Niets geschreven. |
| 21:54 | 2 | Migratiescript echte run | `OK`: profiel (incl. logo) en 6 structuurelementen gekopieerd naar `clubs/zVlRYYHjyFc42lACQhdr`, ledendocument en gebruikerswijzer aangemaakt. Bron ongewijzigd. |
| 21:56 | 3a | Lokale controle nieuwe app (v0.3.0) met gemigreerde data, daarna push naar GitHub (automatische deploy) | Lokaal: dashboard met 3 pijlers, 3 domeinen en logo. Push uitgevoerd. Live-controle: _volgt_ |
| | 3b | Rules Playground met echte clubId | |
| | 3c | Definitieve regels gepubliceerd (= overgangsregels **uit**) | |
| | 4 | Rookproef | |
