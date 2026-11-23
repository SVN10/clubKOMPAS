# Build-rapport: CK-046 Projecten en samenwerkingen

## Wat is gebouwd
- Beheer → **Projecten** en **Samenwerkingen** in het zijmenu (na Vermogens, pictogrammen `klembord` en `schakels`), via één `renderOnderdeelBeheer(gebruiker, soort)`: filter op status (alleen projecten), toevoegen (knop verborgen zolang het formulier open is), bewerken in de rij, ↑/↓ met de zichtbare buur, verwijderen, lege staat, filter zonder treffers, laadfout met Opnieuw laden en testhint, hint "staan nog niet op de plaat", hint bij mislukte bestuursfuncties.
- Plaat: in het eerste overkoepelende domein met `bevat` kaartjes in plaats van de omschrijving (besluit 12); subregel "In voorbereiding · periode" (besluit 11), lopend zonder datums zonder subregel (18), afgerond niet getoond, "Er zijn geen projecten/samenwerkingen.", bij laadfout de omschrijving van nu plus hint (17).
- Bestuursfuncties: kolom somt domeinen, projecten en samenwerkingen op ("Niets" als er geen zijn); verwijderen telt vers uit de drie collecties en blokkeert bij > 0.
- `firestore.rules`: collecties `projecten` en `samenwerkingen`, `bevat` op `structuurelementen` (create en update).
- Inrichtscript met `--droog`, idempotent, één `writeBatch`, zet `bevat`, Voorzitter als eigenaar, LED-scorebord en Buitenopslag in voorbereiding. **Niet gedraaid.**

## Gewijzigde bestanden
- `src/onderdelen.js` (nieuw): soorten, statussen, naamregels, `periodeTekst`, `datumFout`, `geldigOnderdeel`, laden/toevoegen/bewerken/verwijderen.
- `src/vermogens.js`: `maakNaamregels(extra)` en `normaliseerNaam` (alias); vermogensteksten ongewijzigd (bestaande test groen).
- `src/main.js`: imports, `FOUTTEKSTEN`/`WEG_CODES`, `MENU_ICOON`, `ZIJMENU`, `NAV_DOEL`, plaat (`plaatOnderdelenHTML`, `teken`, `laadEnTeken`), `renderOnderdeelBeheer`, `renderBestuursfunctiesBeheer`.
- `src/style.css`: CSS uit het ontwerp, plus `.filter-keuze[hidden] { display: none; }`.
- `firestore.rules`, `tests/regels.test.mjs` (4 nieuwe describe-blokken), `package.json` (`projecten:import`).
- `scripts/inrichten-projecten-samenwerkingen-hca.mjs` en `scripts/lib/onderdelen-hca.mjs` (nieuw; planlogica los, zodat de tests die toetsen).

## Testresultaten
- `npm run test:regels`: 93 van 93 geslaagd (waarvan 22 nieuw voor CK-046; bestaande ongewijzigd groen). `/` in de tekenklasse en Latin-1 werken in de emulator.
- `npm run build`: geslaagd (bestaande waarschuwing over de chunkgrootte).
- `node --check` op het script: geslaagd. Geen browsertest gedaan (niet ingelogd).

## Afwijkingen van de spec en het ontwerp
1. Velden `begindatum`/`einddatum` i.p.v. `periode` (besluit 10, ontwerp). Regels: `JJJJ-MM-DD` of `''`.
2. `bewerkOnderdeel` en `verwijderOnderdeel` lezen eerst of het item nog bestaat. Op een verdwenen document geven de regels bij `updateDoc` `permission-denied` (niet `not-found`); zonder deze controle kreeg de gebruiker de verkeerde melding. Kost één leesactie per bewerking.
3. Melding "al weg": "Dit project bestaat niet meer." / "Deze samenwerking bestaat niet meer." (eigen codes `project-weg`, `samenwerking-weg`).
4. Blokkadetekst bij Bestuursfuncties: "eindverantwoordelijke van …" als het alleen domeinen zijn (tekst van nu), "eigenaar van …" als het alleen projecten/samenwerkingen zijn, "eindverantwoordelijke of eigenaar van …" bij beide. De spec geeft alleen het laatste voorbeeld.
5. Plaathint bij een laadfout verschijnt alleen als er een domein met `bevat` voor die soort is. Zonder `bevat` is het laden niet nodig voor de plaat (en vóór het publiceren van de regels zou de hint anders altijd verschijnen).
6. Eigenaar in het script: de bestuursfunctie met de naam "Voorzitter" (besluit 13), niet de eindverantwoordelijke van het domein (spec). Stopt als die niet precies één keer bestaat.
7. Het script zoekt het domein eerst op `bevat`, anders op naam. Heeft het domein al een andere `bevat`, dan stopt het.
8. Bewerken met een eigenaar die niet meer bestaat (of als de bestuursfuncties niet laden): de bestaande `bestuursfunctieId` blijft staan zolang er niets gekozen is.
9. Pagina Bestuursfuncties: zie Herstelronde punt 4 (laadt nu ook zonder leesbare projecten/samenwerkingen).

## Handmatig te controleren
- Lay-out op ≥ 1200px, 768px en 375px, licht en donker; pictogrammen op 18px naast `puzzel` en `plaat`.
- Filter: ↑/↓ met filter, nieuw item buiten het filter (filter terug op Alle + staartzin), "#"-kolom met gaten.
- Datumkiezer: half ingevulde datum (Safari/Firefox), einddatum `min`, fout bij de einddatum met focus.
- Bewerken naar Afgerond: staartzin en focus als het item uit het filter valt.
- Schermlezer: tabelrollen, statusregels, `aria-label` van de plaatlijst, "—" met `aria-label`.
- Domein bewerken in Beheer → Domeinen laat `bevat` staan.

## Uitrolvolgorde
1. Regels naar test: `npm run regels:test`.
2. Script droog in test: `npm run projecten:import -- --droog`.
3. Script in test: `npm run projecten:import` (typ "ja").
4. App in test controleren, daarna regels productie → app → script productie (niet op 26 november 2026).

## Herstelronde (na beveiliging en controle)
1. `firestore.rules` en `src/onderdelen.js`: datum alleen met maand 01–12 en dag 01–31; zijn beide ingevuld, dan `einddatum >= begindatum` (nieuwe `geldigePeriode`). Nieuwe regeltest: o.a. `2026-13-45` en einde vóór begin geweigerd, gelijke datum en één lege datum toegestaan, update naar einde vóór begin geweigerd.
2. `leeg-streep`: "—" met `aria-hidden` plus `sr-only`-tekst ("geen periode", "nog niet gekozen", "geen status") in plaats van `aria-label` op een span.
3. ↑/↓ op een rij die intussen al bovenaan/onderaan staat: geen lege foutmelding meer in beeld; statusregel "{naam} staat al bovenaan/onderaan. De lijst is bijgewerkt." en de lijst wordt ververst.
4. Bestuursfuncties: projecten en samenwerkingen laden fail-soft. Lukt dat niet, dan laadt de pagina toch, telt de kolom alleen de domeinen ("Geen domeinen" i.p.v. "Niets") en staat er een melding (`#functie-hint`). Verwijderen is dan geblokkeerd met een melding, omdat de telling onvolledig is. Domeinen blijven verplicht (zoals vroeger).

Resultaat: `npm run test:regels` 94 van 94 geslaagd; `npm run build` geslaagd.

## Status
Klaar voor kwaliteitscontrole. Niet gecommit, niet gepusht, niets gepubliceerd of gedraaid tegen Firebase.
