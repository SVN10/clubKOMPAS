# Beveiligingsrapport: CK-172 — Uitvoeringen van een activiteit

Fase 5c, route groot. Branch `test`, niet gecommit. Bekeken:
- `firestore.rules`
- `src/activiteiten.js`
- het CK-172-deel van `src/main.js`
- `tests/regels.test.mjs`
- `scripts/zet-uitvoeringen-om.mjs`
- `scripts/lib/uitvoeringen-omzetten.mjs`
- `package.json`

**Testuitslag:** `npm run test:regels` (emulator) is groen: 176 tests in 24 suites, 0 fouten.

**Extra controle:** in een losse emulatorprobe, buiten de repo en niet toegevoegd aan de suite, heb ik een uitvoering geprobeerd met `activiteitId` `a/x/y`. Het document `clubs/club1/activiteiten/a/x/y` bestond. Ik heb ook `../../club2/activiteiten/z` geprobeerd. De regels weigerden beide (`permission-denied`). Via het pad in `activiteitId` kom je dus niet bij een ander document of een andere club.

## Gecontroleerd en in orde

**Regels voor `uitvoeringen/{uid}`:**
- Bij create en update staat `existsAfter` op het activiteitpad van dezelfde `clubId`.
- Een batch die een activiteit verwijdert en er tegelijk een uitvoering voor aanmaakt of bewerkt, wordt geweigerd. Een batch met een nieuwe activiteit en haar eerste uitvoering lukt.
- Bij delete is er terecht geen `existsAfter`. Zo kun je een wees altijd opruimen, en kan een activiteit samen met haar uitvoeringen in één batch weg.
- Een activiteit uit een andere club kan niet: het pad gebruikt altijd de `clubId` van de match. De test "andere club" bevestigt dat.

**`activiteitId` is onveranderlijk:**
- In de regels staat `request.resource.data.activiteitId == resource.data.activiteitId` bij update.
- Een `set()` op een bestaand document is ook een update, dus daar geldt het ook.
- In de app neemt `bewerkUitvoering` het `activiteitId` uit het bestaande document, niet uit de invoer.

**Velden:**
- `hasOnly` en `hasAll` staan op precies de drie velden.
- Datumformaat:
  - `geldigeDatum` gebruikt `matches`. In de regels toetst `matches` de hele tekst, en de lengte is hooguit 10.
  - De begindatum is niet leeg.
  - De einddatum is leeg of niet vóór de begindatum.
- `geldigeActiviteit` is strak zonder datumvelden. Oude documenten blijven leesbaar. `bewerkActiviteit` haalt de oude velden weg met `deleteField()`, alleen als ze er staan. Dat werkt omdat de regels de toestand ná de update toetsen.

**Rechten (P0d):**
- Schrijven (create, update, delete) mag alleen met `isBeheerder(clubId)`. Lezen mag met `isLid(clubId)`.
- Er is geen pad waarop een gewoon lid of een niet-lid schrijft. Het niet-lid leest ook niet.

**Kosten aan documentlezingen:**

| Schrijfactie | Lezingen |
|---|---|
| Losse uitvoering | 2 (lidmaatschap en activiteit) |
| Batch activiteit + eerste uitvoering | 4 (lid, vermogen, commissie, activiteit) |
| Batch van het omzetscript | 4 |
| Mee verwijderen (alleen delete-regels) | 1, ongeacht het aantal uitvoeringen |

Alles blijft ruim onder de limiet.

**XSS:**
- Alle data uit Firestore in het nieuwe paneel gaat door `esc()`:
  - teksten: naam, datumtekst, legend
  - attributen: `data-id`, `data-uid`, `data-activiteit`, `aria-controls`, element-id's
- `aria-label` loopt via `actieKnopHTML`, dat `esc(naam)` doet.
- Selectors gebruiken `CSS.escape`.
- Meldingen gaan via `textContent`, `toonOk` (`replaceChildren`) of `zetStatus`. `confirm()` krijgt platte tekst.
- De vrije document-id `{uid}` doet daarom geen kwaad.
- `hint.innerHTML` bevat alleen vaste tekst (met `esc`).

**`localStorage` `clubkompas-uitvoering-volgorde`:**
- Alleen de exacte waarde `'nieuw'` geeft `'nieuw'`. Elke andere waarde geeft `'oud'`, en een fout bij lezen of schrijven wordt opgevangen.
- De waarde komt nooit in HTML of een selector.

**Verwijderen van een activiteit:**
- De query is `where('activiteitId', '==', id)` binnen dezelfde club, dus hij raakt geen verkeerde uitvoeringen.
- Alles gaat in één atomaire `writeBatch`. Bij een fout gaat er niets weg, dus er ontstaat geen halve toestand.
- De grens van 499 uitvoeringen plus 1 activiteit wordt gecontroleerd vóór de batch (`te-veel-uitvoeringen`) en ook in de UI. Mislukt het tellen, dan wordt er niet verwijderd.

**Omzetscript:**
- Het script werkt met de client-SDK en een gewone login, dus de regels gelden ook voor het script.
- Standaard is de omgeving test. Bij `--omgeving=productie` controleert `startScript` het project en vraagt het de projectnaam. Daarna volgt nog `Typ "ja"`.
- `--droog` leest alleen en stopt vóór elke schrijfactie.
- Een onbekende of verkeerd getypte vlag (bijvoorbeeld `--drooog`) leidt niet tot stil schrijven: de "ja"-vraag blijft staan.
- Idempotent: de uitvoering krijgt als id het activiteit-id, en een tweede run vindt geen oude velden meer.
- Eén batch per activiteit: uitvoering en het weghalen van de velden gaan samen of niet.
- Clubdata in de terminal gaat door `veilig()`.

**Overig:**
- CSRF is niet van toepassing: Firebase gebruikt tokens, geen cookies.
- Er zijn geen nieuwe dependencies en geen gevoelige gegevens in de client.
- Er komen geen persoonsgegevens bij.

## Bevindingen

### 1. Wees-uitvoering bij gelijktijdig toevoegen en verwijderen
**Ernst:** laag
**Type:** Data-integriteit (race condition)
**Locatie:**
- `src/activiteiten.js`, `verwijderActiviteit` (leest de uitvoeringen en commit daarna de batch)
- `src/main.js`, `verwijderActiviteitMetUitvoeringen` (telt eerst, vraagt dan om bevestiging, verwijdert daarna)

**Probleem:** een tweede beheerder kan een uitvoering toevoegen tussen de query in `verwijderActiviteit` en de `batch.commit()`. Die uitvoering komt niet in de batch en blijft achter als wees. Er lekt geen data, en de wees is niet zichtbaar in de UI. Daarnaast kan het aantal in de bevestiging (`getCountFromServer`) afwijken van het aantal dat echt verwijderd wordt. De succesmelding toont wel het echte aantal.

**Voorstel:** accepteren, zoals de spec al doet. Leg in CK-160 (planner) vast dat uitvoeringen zonder bekende activiteit worden overgeslagen. Het omzetscript meldt wezen al (`soort: 'wees'`). Een sluitende oplossing kan met een transactie of een teller op de activiteit, maar dat is nu niet nodig.

### 2. Overgangsvenster tussen regels, script en app
**Ernst:** laag
**Type:** Data-integriteit bij de uitrol
**Locatie:** de uitrolvolgorde in `.claude/specs/CK-172-uitvoeringen.md`, en `bewerkActiviteit` in `src/activiteiten.js`

**Probleem:** er zijn twee manieren waarop data verloren gaat of verweesd raakt:
- Na het publiceren van de nieuwe regels kan de oude app (0.14.0) nog activiteiten verwijderen. De delete-regel vraagt alleen `isBeheerder`, dus dat lukt, en eventuele uitvoeringen blijven dan achter.
- Als de nieuwe app uitrolt vóórdat het script heeft gedraaid, wist een bewerking de oude datum zonder dat er een uitvoering voor in de plaats komt.

**Voorstel:** houd de uitrolvolgorde strikt aan: regels, script, app. Draai het script daarna nog één keer met `--droog`. Verwacht resultaat: "Niets te doen" en geen wezen. In productie zijn er geen echte activiteiten, dus daar speelt dit niet.

### 3. Het omzetscript kan in productie schrijven
**Ernst:** laag
**Type:** Bescherming van de omgeving
**Locatie:** `scripts/zet-uitvoeringen-om.mjs`, het schrijfgedeelte na `if (DROOG)`

**Probleem:** besluit 4 zegt "In productie niets omzetten". Het script staat een schrijfrun in productie toch toe, al vraagt het eerst de projectnaam en daarna "ja". Het risico is klein, want de regels gelden ook voor het script en productie heeft geen oude activiteiten. Toch dwingt de code het besluit niet af.

**Voorstel:** stop in productie zonder `--droog` meteen, bijvoorbeeld met:
```js
if (omgeving === 'productie' && !DROOG) stop('in productie alleen --droog (besluit 4).')
```
Laat het zoals het is als Paul die mogelijkheid bewust open wil houden.

### 4. De plan-functie vertrouwt een bestaande uitvoering met hetzelfde id blind
**Ernst:** laag
**Type:** Invoervalidatie en data-integriteit
**Locatie:** `scripts/lib/uitvoeringen-omzetten.mjs`, `planOmzetting` (`bestaand.has(id) ? null : uitvoering`)

**Probleem:** bestaat er al een uitvoering met het id van de activiteit, dan haalt het script alleen de oude velden weg. Het controleert niet of die uitvoering hetzelfde `activiteitId` en dezelfde datums heeft. Dat kan alleen voorkomen als iemand met de hand een document met dat id heeft gemaakt. Dan gaat de oude datum stil verloren.

**Voorstel:** houd een `Map` bij in plaats van een `Set`. Klopt het `activiteitId` niet, of wijken de datums af, meld dan een blokkerende afwijking (`soort: 'regels'`) in plaats van de velden weg te halen.

### 5. Geen tekenset-controle op `activiteitId` in de regels
**Ernst:** info
**Type:** Invoervalidatie
**Locatie:** `firestore.rules`, `geldigeUitvoering`

**Probleem:** `activiteitId` moet een string van 1 tot 100 tekens zijn, maar elke tekenset mag. Uit de emulatorprobe blijkt dat `/` en `..` niet naar een ander document of een andere club leiden. Het is dus geen echt lek.

**Voorstel:** maak het eventueel strakker met `d.activiteitId.matches('[A-Za-z0-9_-]{1,100}')`. Dat past bij de automatische id's en bij het id dat het omzetscript gebruikt. Doe dat dan wel in de app-spiegel én in de tests, en controleer eerst of er geen bestaande activiteit-id's met andere tekens zijn. Het is geen blokkade.

### 6. `geldigeDatum` controleert de kalender niet
**Ernst:** info
**Type:** Invoervalidatie (bekende beperking)
**Locatie:** `firestore.rules:149`, `geldigeDatum`

**Probleem:** een onmogelijke datum zoals `2027-02-31` komt door de regels. De spec noemt dit al als bekende beperking. Het heeft geen beveiligingsgevolg, en `datumTekst` en de sortering gaan er robuust mee om.

**Voorstel:** geen actie voor CK-172.

## Samenvatting
- Kritieke bevindingen: 0
- Hoge bevindingen: 0
- Middel: 0
- Lage aanbevelingen: 4 (1 tot en met 4)
- Info: 2 (5 en 6)

## Eindoordeel
Veilig voor TST. De regels, de data-isolatie per club, P0d, de XSS-afscherming en de beveiliging van het omzetscript zijn in orde, en de regeltests zijn groen (176 van 176). De lage punten zijn geen blokkade. Neem punt 3 en punt 4 bij voorkeur mee vóór de echte omzetrun op test, en houd de uitrolvolgorde strikt aan (punt 2).
