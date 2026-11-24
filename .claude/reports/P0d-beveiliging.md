# Beveiligingsrapport: P0d (alleen een beheerder schrijft masterdata)

Beoordeeld: `firestore.rules` (vergeleken met `scripts/firestore.rules.voor-P0d`), de P0d-delen van `src/main.js`, `src/omgeving.js` met `src/firebase.js`, `scripts/controleer-p0d.mjs`, `scripts/lib/p0d-velden.mjs` en `tests/regels.test.mjs`.
De andere v0.13.0-wijzigingen in de werkmap zijn niet beoordeeld.
Tests: `npm run test:regels` geeft 130 van de 130 groen (emulator, 24-11-2026).

## Wat goed is (gecontroleerd)

- **Schrijven door een niet-beheerder:** geweigerd voor alle 8 collecties: instellingen, bestuursfuncties, structuurelementen (ook `bevat`), vermogens, vermogensnamen, projecten, samenwerkingen en commissies. Dat geldt voor create, update en delete.
  - `isBeheerder` doet een `get()` op het eigen ledendocument in **dezelfde** `clubId`.
  - Ontbreekt dat document, dan geeft `get()` een fout en wordt de schrijfactie geweigerd.
  - Getest voor: een lid met een andere rol, een lid zonder rol, een rol die bijna klopt ("Beheerder", " beheerder"), een beheerder van een andere club en een niet-lid.
- **Rol ophogen:** dat kan niet. `leden/{uid}`, `gebruikers/{uid}` en `clubs/{clubId}` staan op `write: if false`. Dit is getest ("je rol ophogen ... geweigerd").
- **Velden en typen:**
  - `hasOnly` staat op profiel, bestuursfunctie en domein. Elk toegestaan veld krijgt een typecontrole (string met maximumlengte, int met grenzen, of een vaste keuzelijst).
  - Een map of lijst als waarde valt daardoor af: `is string` of `is int` faalt.
  - `d[veld]` in `optioneel()` leest een veld met een vaste naam op en is veilig.
  - `aantalVermogens` wordt bij create (`== 0`) en bij update (`is int`, `>= 0`, alleen een stap van ±1) gecontroleerd.
- **Logo:**
  - De regex `data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}` moet in Firestore-regels op de hele tekst passen.
  - SVG, `text/html`, aanhalingstekens, `<`, `>`, spaties en een tweede data-URL kunnen dus niet worden opgeslagen.
  - De limiet van 700.000 tekens blijft ruim onder de documentgrens van 1 MiB.
  - In de app gaat het logo bovendien door `esc()` in `src="..."`.
- **Grote documenten (DoS):** alle velden hebben een maximumlengte en `hasOnly` laat geen extra velden toe. De grootte van een document is dus begrensd.
- **`get()`-limieten:**
  - `isBeheerder` leest steeds hetzelfde ledendocument. Herhaalde opvragingen van hetzelfde document tellen in een batch of transactie één keer.
  - De tests voor toevoegen, verplaatsen, hernoemen en ↑/↓ in batches blijven binnen de limiet.
  - Een extra leesactie per schrijfactie kost iets meer, maar is geen risico.
- **App-guard:**
  - `navigeer` stuurt via `magNaar` naar Home.
  - Alle 5 beheer-renders beginnen met `geenBeheer()`. Ook her-renders binnen de pagina gaan door die render-functies.
  - `BEHEER_PAGINAS` wordt opgebouwd uit `ZIJMENU`, dus een nieuw menu-item valt er automatisch onder.
  - Kerncijfers zijn geen link voor wie geen beheerder is.
  - De echte beveiliging zit terecht in de regels.
- **Omgevingsguard:** `bepaalOmgeving` geeft dezelfde uitkomst als de oude code in `src/firebase.js`. Dat geldt voor `soort`, `label`, `configFout`, de waarschuwing bij een afwijkend label en de waarschuwing bij een onvolledige config op live. `config.projectId` is dezelfde getrimde waarde als het oude `projectId`.
- **Script:** het script haalt alleen onbekende velden weg, en alleen na een getypt "ja". Het meldt het als je eigen rol niet precies `'beheerder'` is. Bij `--droog` schrijft het niets.

## Bevindingen

### 1. App en regels lezen de rol verschillend
**Ernst:** 🟢 Laag
**Type:** Autorisatie (verschil tussen app en regels; de beveiliging blijft dicht)
**Locatie:** `src/main.js:288` (`laadRol`) tegenover `firestore.rules` (`isBeheerder`)
**Probleem:** De app haalt spaties rond de rol weg (`rol.trim()`), de regels niet. Een lid met rol `" beheerder"` ziet daardoor het Beheer-menu, maar elke opslag wordt geweigerd. Er is geen lek, wel verwarring.
**Aanbeveling:** Laat de `.trim()` in `laadRol` weg, of vergelijk in `isBeheerder` precies hetzelfde. `controleerP0d` vindt zo'n rol al vóór het publiceren.

### 2. Naam van een bestuursfunctie mag alleen uit spaties bestaan
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie
**Locatie:** `firestore.rules`, `geldigeBestuursfunctie`; spiegel in `scripts/lib/p0d-velden.mjs`, `controleerBestuursfunctie`
**Probleem:** `naam.size() >= 2` keurt `"  "` goed. Profiel en domein gebruiken wel `nietLeeg` (`trim().size() > 0`).
**Aanbeveling:** Voeg `&& d.naam.trim().size() >= 2` toe, en pas de JS-spiegel en de test mee aan.

### 3. App controleert bij het tonen van het logo alleen het begin van de tekst
**Ernst:** 🟢 Laag
**Type:** XSS (alleen verdediging in de diepte; geen bruikbaar lek)
**Locatie:** `src/main.js:30` (`veiligLogo`)
**Probleem:** Onder de oude regels (`data:image/.*`) kan al een logo zijn opgeslagen dat met `data:image/png;base64,` begint en daarna andere inhoud heeft. Dat is nu geen XSS: de waarde gaat door `esc()`, en een `<img>` of favicon voert geen script uit. De app is wel losser dan de regels.
**Aanbeveling:** Gebruik in `veiligLogo` dezelfde volledige regex als de regels (`^...[A-Za-z0-9+/]+={0,2}$`) en een lengtegrens. `controleer-p0d.mjs` meldt zo'n oud logo al. Zorg dat het vóór het publiceren is opgeschoond.

### 4. Script: een veld `id` in de data overschrijft het document-id
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie (alleen het beheerscript)
**Locatie:** `scripts/controleer-p0d.mjs`, `lees` (`{ id: d.id, ...d.data() }`) en `p0d-velden.mjs`, `controleerP0d` (`const { id, ...f }`)
**Probleem:** Heeft een document een dataveld `id`, dan gebeurt er twee dingen:
- Het pad wordt verkeerd: `updateDoc` faalt of raakt een ander document in dezelfde club.
- Het veld `id` wordt niet als onbekend gemeld. Na het publiceren kan dat document dan niet meer worden opgeslagen.
**Aanbeveling:** Geef het document-id en de data apart door, bijvoorbeeld `{ docId: d.id, data: d.data() }`, en controleer `data` volledig.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 0
- 🟢 Lage aanbevelingen: 4

Aandachtspunt bij het uitrollen (geen beveiligingsrisico): publiceer de regels pas als `node scripts/controleer-p0d.mjs` "Alles klopt" meldt. Anders kan de beheerder zelf niet meer opslaan. Ook dan blijft alles dicht.

## Eindoordeel
✅ Veilig voor TST. Na TST ook vrij te geven voor PRD. De 4 lage punten zijn aanbevelingen en blokkeren niet.
