# Beveiligingsrapport: CK-170 — Beheer → Activiteiten

Fase 5c, 25-11-2026. Branch `test`, nog niet gecommit. Bekeken: `git diff` van `firestore.rules`, `src/main.js` en `tests/regels.test.mjs`, plus het nieuwe bestand `src/activiteiten.js`. Ik heb geen code gewijzigd.

**Uitgevoerd:**
- `npm run test:regels`: 148 van 148 tests groen.
- Een eigen verkenningstest in de emulator, buiten de repo, met deze resultaten:
  - **Paden in een id (traversal):** geweigerd. Getest in `vermogenIds` en `commissieId`, met waarden als `../../club2/vermogens/w1`, `../club2/...`, `v1/sub/x`, `v1/`, `/v1`, `.`, `..`, `__x__` en een commissie-id dat naar een vermogen of naar een andere club wijst.
  - **Naam met verborgen tekens:** geweigerd bij een tab, een harde spatie (NBSP), een zacht afbreekstreepje of een newline aan het eind.
  - **Andere geweigerde schrijfacties:**
    - `soort` als lijst
    - `vermogenIds` als `['v1', null]` of als map
    - een veld weghalen met `deleteField()`
  - **Lezen:** een lid leest de activiteiten van de eigen club. Een lid leest club2 niet en een anonieme gebruiker leest niets.
  - **Toegestaan maar niet gewenst:** de datums `2027-02-31` en `0000-01-01` (zie bevinding 1).

## Bevindingen

### 1. De regels accepteren een datum die niet bestaat
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie
**Locatie:** `firestore.rules:149-151` (`geldigeDatum`, overgenomen in `geldigeActiviteit`, `firestore.rules:188-190`) en de spiegel in `src/activiteiten.js:33-45`
**Probleem:** `geldigeDatum` controleert alleen het patroon: een maand van 01 tot 12 en een dag van 01 tot 31. Daardoor gaan `2027-02-31`, `2027-04-31` en jaar `0000` door. Via de datumkiezer kan dit niet, wel via devtools of een rechtstreekse schrijfactie. Alleen een beheerder kan dat. Het gevolg is beperkt:
- `datumTekst` toont "31 feb 2027".
- Een sortering op string blijft werken.

Er is geen injectie mogelijk, want het formaat ligt vast op cijfers en streepjes. Projecten hebben dit al sinds CK-046.
**Aanbeveling:** dit hoeft niet in CK-170. Wil je het strakker, maak dan een backlogitem voor een algemene aanscherping van `geldigeDatum`:
- in de regels: dag 31 weigeren bij de maanden 04, 06, 09 en 11, en dag 30 en 31 bij maand 02
- een jaar van 1900 tot 2199 (`(19|20|21)[0-9]{2}`)
- dezelfde controle in `onderdelen.js`

### 2. Een vermogen of commissie met activiteiten kan buiten de app om toch weg
**Ernst:** 🟢 Laag
**Type:** Data-integriteit (autorisatie binnen de eigen tenant)
**Locatie:** `firestore.rules`, de regels `match /vermogens/{id}` en `match /commissies/{id}` (`allow delete: if isBeheerder(clubId)`). De blokkade zit alleen in `src/main.js` (de verwijdertak in `renderVermogensBeheer` en in `renderOnderdeelBeheer`).
**Probleem:** alleen de app blokkeert het verwijderen, de regels niet. Er kan dan een verwijzing naar een verdwenen vermogen of commissie achterblijven:
- als een beheerder via devtools verwijdert
- als twee beheerders tegelijk werken (de tijd tussen tellen en verwijderen)

Dit blijft binnen de eigen club en lekt geen data. De lijst vangt het op: daar staat dan "bestaat niet meer", en bij bewerken moet je een ander vermogen kiezen. Paul heeft dit restrisico bewust aanvaard (besluit 4 in de spec).
**Aanbeveling:** voor CK-170 is er niets nodig. Neem het risico op in het overzicht van restrisico's. Komen er later schermen die op `vermogenIds` vertrouwen (de vermogenskaart, de plaat), laat die verwijzingen dan fail-soft behandelen, zoals de beheerlijst al doet.

### 3. Regeltests: een paar randgevallen staan niet in de suite
**Ernst:** 🟢 Laag
**Type:** Testdekking (Firebase-regels)
**Locatie:** `tests/regels.test.mjs`, de suite `CK-170 activiteiten: regels` (vanaf ongeveer regel 1480)
**Probleem:** de spec-gevallen worden allemaal gedekt. De test "andere club" is ook goed opgezet: Jan wordt daarin ook beheerder van club2, dus de weigering komt door `exists()` en niet door `isBeheerder`. Een paar gevallen die ik alleen met mijn eigen verkenning heb gecontroleerd, ontbreken nog in de suite. Daardoor merkt de suite het niet als die gevallen later stuk gaan:
- een pad in `commissieId` naar een andere club (`'../../club2/commissies/k2'`, met een bestaande commissie in club2). Nu staat alleen het pad in `vermogenIds` erin.
- een pad met extra segmenten (`'v1/sub/x'`) waarbij het document `vermogens/v1/sub/x` echt bestaat
- in de traversaltest staat geen vermogen in club2. Daardoor wordt `'../../club1/vermogens/v1'` misschien om de verkeerde reden geweigerd. Een geval met een bestaand doel in de andere club is sterker.
- het weghalen van een veld met `updateDoc(..., { commissieId: deleteField() })`
- `vermogenIds` met een `null` als tweede element. Dit valt nu al onder `size() == 1`, maar het geval borgt de lengtecontrole.

**Aanbeveling:** voeg deze vier of vijf `assertFails`-gevallen toe aan de bestaande tests "andere club" en "vermogenIds". Zet in club2 een bestaand vermogen `w1` en een bestaande commissie `k2` als doel. Ze slagen nu al, dus het risico is nul en ze beschermen tegen een terugval.

## Gecontroleerd en in orde

- **P0d:**
  - Schrijven mag alleen met `isBeheerder(clubId)`. Een ontbrekend ledendocument geeft een fout en dus een weigering.
  - Lezen mag met `isLid(clubId)`. Er is geen lezen tussen clubs.
  - `hasOnly` en `hasAll` staan op precies 6 velden, de typen worden gecontroleerd en `soort` komt uit een vaste lijst.
  - De naam gebruikt de witte lijst van `geldigeOnderdeelnaam`. Die laat geen onzichtbare tekens, bidi-tekens of BOM door; dat is getest.
  - Een id is hooguit 100 tekens.
- **Multi-tenancy:**
  - `vermogenPad` en `commissiePad` gebruiken altijd de `clubId` uit het matchpad.
  - Een id met `/` of `..` levert geen document in een andere club op. Dat heb ik geverifieerd in de emulator.
  - `clubId` komt in de app uit `huidigClubId`.
- **`vermogenIds`:** het is een `list` met `size() == 1`, het element is een string van 1 tot 100 tekens en `exists()` wordt gecontroleerd. Een string, een lege lijst, twee elementen, een getal of een map worden geweigerd.
- **Datums:** `begindatum` is verplicht en niet leeg, `einddatum` is `''` of niet vóór `begindatum`. Een stringvergelijking volstaat door het vaste formaat. Zie bevinding 1 voor een datum die niet bestaat.
- **Kosten van de regels:** een schrijfactie doet hooguit 3 documentlezingen (lidmaatschap, vermogen en commissie).
- **XSS in `renderActiviteitenBeheer` (`src/main.js`):** alle gebruikersdata in `innerHTML` gaan door `esc()`. `esc()` codeert `& < > " '`, dus het werkt ook in attributen. Het gaat om:
  - `x.naam`, `x.id` en `datum`
  - de namen van vermogens, domeinen en commissies, ook in `<optgroup label>`
  - `w.naam`, `w.begindatum` en `w.einddatum`
  - de element-id's uit `idsVoor(id)`
  - `aria-label` via `actieKnopHTML`

  Verder:
  - Selectors met een id gebruiken `CSS.escape`.
  - Meldingen met een naam (de verwijderblokkades, `toonOk` en `zetStatus`) gebruiken `textContent` of `replaceChildren`.
  - De enige `innerHTML` zonder escaping (de hint "Maak eerst een vermogen aan") is vaste tekst.
  - Een kwaadaardig document-id (via devtools gezet, met `"` of `<`) wordt overal geëscaped.
- **Blootgestelde data en AVG:** er staan geen vrije-tekstvelden, persoonsgegevens, auteur of tijdstempels in het model. Er staan geen sleutels of tokens in de nieuwe code.
- **Dependencies:** er zijn geen nieuwe; `package.json` is niet gewijzigd.
- **CSRF:** niet van toepassing. Er zijn geen cookies of sessie-endpoints; elke schrijfactie gaat via de Firebase SDK met een ID-token en wordt in de regels gecontroleerd.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 0
- 🟢 Lage aanbevelingen: 3

## Eindoordeel
✅ Veilig voor TST. Het pakket mag ook naar PRD, want de drie aanbevelingen blokkeren niets. Bevinding 3 is aan te raden voor de commit, de bevindingen 1 en 2 passen in de backlog.
