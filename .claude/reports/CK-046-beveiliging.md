# Beveiligingsrapport: CK-046 Projecten en samenwerkingen

Gecontroleerd: `git diff` (firestore.rules, src/main.js, src/vermogens.js, tests/regels.test.mjs, package.json), `src/onderdelen.js`, `scripts/inrichten-projecten-samenwerkingen-hca.mjs`, `scripts/lib/onderdelen-hca.mjs`. `npm run test:regels`: 93/93 geslaagd (emulator).

## Wat in orde is

- **Regels `projecten`/`samenwerkingen`:** exacte veldenset (hasOnly + hasAll), types, naamregex met trim en geen dubbele spatie, lengtes (naam 2-100, omschrijving 500, bestuursfunctieId 100), `volgorde` int 1-100000, status als enum, datum `JJJJ-MM-DD` of `''`. Alles achter `isLid(clubId)`, dus tenant-isolatie gelijk aan de bestaande collecties. De test "niet-lid kan niet lezen of schrijven" dekt dit.
- **`bevat`:** alleen ontbrekend, `'projecten'` of `'samenwerkingen'`, bij create en update. Er is geen regressie op de bestaande voorwaarden voor structuurelementen (teller, type, naam): er is alleen een extra `&&` bijgekomen.
- **XSS:** alle gebruikersdata in nieuwe templates gaat door `esc()`: naam, omschrijving, periode, eigenaar, id's, `aria-label`, `value` en textarea. Statusklasse en -label komen alleen uit `STATUS_LABEL` (met `Object.hasOwn`). De selectors gebruiken `CSS.escape`. Meldingen met namen gaan via `textContent`/`replaceChildren`, en de periodeweergave gebruikt geen `new Date()`.
- **Script:** de standaard is TEST. Voor productie moet je `--omgeving=productie` opgeven en de projectnaam intypen (gedeelde `startScript`). `--droog` stopt vóór elke schrijfactie. Het script schrijft pas na het hele plan en na "ja", in één `writeBatch`. Het is idempotent en wijzigt of verwijdert nooit bestaande items. De uitvoer gaat door `veilig()`. Er zitten geen secrets of persoonsgegevens in, en geen nieuwe dependencies.

## Bevindingen

### 1. Datumformaat niet inhoudelijk gecontroleerd
**Ernst:** Laag
**Type:** Invoervalidatie
**Locatie:** `firestore.rules` `geldigeDatum`, `src/onderdelen.js` `DATUM`
**Probleem:** `2026-13-45` en `0000-00-00` worden geaccepteerd. Ook `einddatum < begindatum` wordt alleen in de app geweigerd. Een lid kan via de SDK een onzinperiode opslaan. De weergave blijft veilig, want die is ge-escaped en valt terug op de ruwe maand.
**Aanbeveling:** maak de regex strakker, bijvoorbeeld `'[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])'`. Voeg in `geldigProject` ook `(d.begindatum == '' || d.einddatum == '' || d.einddatum >= d.begindatum)` toe. Stringvergelijking werkt hier dankzij het vaste formaat.

### 2. Eigenaar niet gekoppeld aan een bestaande bestuursfunctie
**Ernst:** Laag
**Type:** Invoervalidatie / integriteit
**Locatie:** `firestore.rules` `geldigeBasis` (`bestuursfunctieId`)
**Probleem:** elke tekst tot 100 tekens is toegestaan, ook een id dat niet bestaat. De UI toont dan "nog niet gekozen". Er is geen data-lek, want het pad blijft binnen de club. Dit gedrag is gelijk aan dat van domeinen.
**Aanbeveling:** optioneel `d.bestuursfunctieId == '' || exists(/databases/$(database)/documents/clubs/$(clubId)/bestuursfuncties/$(d.bestuursfunctieId))`. Het kan ook een vervolgpunt worden, samen met de domeinen.

### 3. Naamuniciteit alleen in de app
**Ernst:** Laag (bewust, besluit 14)
**Type:** Invoervalidatie
**Locatie:** `src/onderdelen.js` `naamBezet`
**Probleem:** gelijktijdig opslaan of directe SDK-aanroepen kunnen dubbele namen opleveren. Dit heeft geen gevolgen voor de beveiliging, alleen voor de netheid van de data.
**Aanbeveling:** accepteren. Als het ooit nodig is: naamdocumenten zoals bij `vermogensnamen`.

## Restrisico (buiten scope, P0d)
Elk lid (`isLid`) mag projecten en samenwerkingen lezen, aanmaken, wijzigen en **verwijderen**, en mag `bevat` op domeinen zetten of weghalen. Pas met `isBeheerder` (P0d) kunnen gewone leden niet meer schrijven of verwijderen. Neem dit mee bij P0d.

## Samenvatting
- Kritieke bevindingen: 0
- Hoge bevindingen: 0
- Lage aanbevelingen: 3

## Eindoordeel
Veilig voor TST. Bevinding 1 is snel te herstellen en kan vóór PRD worden meegenomen.
