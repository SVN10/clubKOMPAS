# Vermogens beheren — technische documentatie

Voor ontwikkelaars die vermogens, de bijbehorende regels of de scripts aanpassen. Modellaag: `src/vermogens.js` (gedeeld door app, scripts en tests). UI: `src/main.js` (`renderVermogensBeheer`, `renderPijlersDomeinenBeheer`, `renderBestuursfunctiesBeheer`, `renderStructuurGrid`). Regels: `firestore.rules`. Stijl: `src/style.css`, sectie "Beheer en vermogens (CK-020)". Besluiten: `.claude/specs/CK-020-besluiten.md` (1–22).

## Datamodel

| Pad | Velden | Opmerking |
|---|---|---|
| `clubs/{clubId}/vermogens/{id}` | `naam`, `domeinId`, `volgorde` (int 1–100000) | Exact deze drie velden (`hasOnly` en `hasAll`). Id is automatisch en verandert nooit (M2 verwijst ernaar). `volgorde` geldt binnen het domein; gaten en dubbele nummers zijn onschuldig, de lijst sorteert daarna op naam (`sorteerDomeinen`) |
| `clubs/{clubId}/vermogensnamen/{sleutel}` | `vermogenId` | Technisch naamdocument dat de uniciteit afdwingt. `sleutel` = `naam.toLowerCase()` |
| `clubs/{clubId}/structuurelementen/{id}` | `aantalVermogens` (int ≥ 0, ontbreekt = 0), `laatsteVermogenId` (string ≤ 100) | Teller voor de domein-guard. De domeinformulieren schrijven deze velden nooit: `updateDoc` laat ze staan |

Alleen domeinen van type `pijler` of `domein` (`KAN_VERMOGENS`) kunnen vermogens hebben; overkoepelende niet.

De teller is er voor de regels, niet voor de weergave. Home en Beheer tellen de vermogensdocumenten zelf; het controlescript bewaakt dat beide gelijk zijn.

## Naamregels

`normaliseerVermogensnaam()` (NFC, trim, enkele spaties) loopt altijd vóór valideren en opslaan. Daarna geldt: 2–100 tekens, eerste teken letter of cijfer, daarna ook spatie en `& ' - . , ( ) +`. Letters zijn `a-zA-Z`, `0-9` en Latin-1 (`À-ÖØ-öø-ÿ`). `vermogensnaamFout()` geeft de veldfout (tekens, dan eerste teken, dan lengte) en noemt het teken dat niet kan; `geldigeVermogensnaam()` is de ja/nee-variant. De regex staat op twee plekken: `src/vermogens.js` en `geldigeVermogensnaam()` in `firestore.rules`. Wijzig ze altijd samen; `tests/regels.test.mjs` toetst dat ze gelijk zijn.

Latin-1 is bewust: alleen daar geven `toLowerCase()` (JS) en `lower()` (regels) gegarandeerd hetzelfde. Een naam zonder `/`, `.`/`..` of `__x__` is bovendien altijd een geldig document-id.

## Transactieprotocol (`src/vermogens.js`)

Eén vermogen per transactie. Eerst alles lezen, dan schrijven. De regels controleren de schrijfactie met `get` (voor) en `getAfter` (na), dus alleen dit protocol wordt geaccepteerd. Alle functies krijgen `db` en `clubId` mee; de app legt `clubId` vast bij het openen van de pagina.

| Handeling | Leest | Schrijft |
|---|---|---|
| `voegVermogenToe` | domein D, naamdocument N | set vermogen V (`volgorde` = hoogste in D + 1, vooraf per query bepaald), set N `{vermogenId}`, D teller +1 en `laatsteVermogenId = V` |
| `hernoemVermogen`, andere sleutel | V, N-nieuw, N-oud | update V, delete N-oud (alleen als het naar V wijst), set N-nieuw |
| `hernoemVermogen`, alleen hoofdletters | V | update V; naamdocument blijft (zelfde sleutel) |
| `verplaatsVermogen` | V, D-oud, D-nieuw | update V `{domeinId, volgorde}`, D-nieuw +1, D-oud −1 (beide met `laatsteVermogenId = V`). Ontbreekt D-oud, dan alleen D-nieuw |
| `verwijderVermogen` | V, N, D | delete V, delete N (alleen als het naar V wijst), D −1 |
| ↑/↓ | niets | `schrijfVolgorde('vermogens', lijst, clubId)`: één `writeBatch`, alleen `volgorde`. Geen transactie: de regels lezen dan niets extra |

Hernoemen én verplaatsen in één keer zijn **twee transacties** (eerst `controleerNaamVrij`, dan verplaatsen, dan hernoemen). De naamcheck vooraf (besluit 14) voorkomt dat het vermogen al verplaatst is als de naam bezet blijkt. Lukt alleen de eerste stap, dan opent het bewerkformulier opnieuw op de nieuwe plek met de getypte naam en een melding wat wel en niet gelukt is (`bewerk-opslaan` in `renderVermogensBeheer`).

Foutcodes uit het protocol (`throw { code }`): `dubbel-vermogen` (met `domeinNaam` en `zelfdeDomein`), `naam-bezet` (naamdocument zonder vermogen), `domein-weg`, `domein-overkoepelend`, `vermogen-weg`, en `aborted`. De UI zet ze om met `vermogenFoutTekst()` en `metOpslaan({ veldFouten })`.

## Regels (`firestore.rules`)

- **`sleutelVan(naam)`** is `naam.lower()` plus 30 `replace()`-stappen voor À–Ö en Ø–Þ. In de regels zet `lower()` alleen A–Z om (`'ÀB'.lower()` geeft `'Àb'`); zonder deze stappen zou elke naam met een hoofdletter met accent (Éénheid) geweigerd worden. Werkt `lower()` in productie wél met Unicode, dan doen de stappen niets. Elke wijziging aan de tekenset moet hier mee.
- **Uniciteit.** Een naamdocument mag alleen aangemaakt worden (`update: false`), en alleen als het vermogen dat in `getAfter` bestaat die naam heeft. Een vermogen met nieuwe naam is alleen geldig als het naamdocument ná de schrijfactie van dit vermogen is en het oude los is (`naamHoortNaBij`, `oudeNaamLos`). Een tweede vermogen met dezelfde sleutel kan dus niet, ook niet via twee tabbladen tegelijk (één transactie wint, de ander krijgt `aborted` of `dubbel-vermogen`).
- **Teller.** `tellerWijzigingKlopt` staat een teller alleen toe te blijven staan, of ±1 samen met een vermogen dat echt bij het domein komt of eruit gaat (`vermogenKomtBij`, `vermogenGaatWeg`) en dat in `laatsteVermogenId` staat. `tellerStap` is de tegenhanger vanuit het vermogen. `geldigLaatste` houdt `laatsteVermogenId` een string ≤ 100 tekens, ook bij een gelijke teller.
- **Guard op domeinen.** Aanmaken alleen met teller 0; verwijderen alleen bij teller 0; niet naar `overkoepelend` met teller > 0 (alleen de overgang telt, niet een domein dat al overkoepelend is).
- **Verweesd vermogen** (domein via de console weg): verplaatsen en verwijderen mag zonder tellercontrole op het oude domein (`!exists(...)`).
- `laatsteVermogenId` los wijzigen zonder tellerstap is toegestaan en onschuldig: de regels gebruiken het veld alleen als de teller verandert.

### Limieten van get/getAfter

Firestore staat 10 `get`/`exists`/`getAfter`/`existsAfter` per beoordeeld document en 20 per verzoek toe. Voorzichtig geteld (x en x-na apart; `isLid` is 1):

| Verzoek | Zwaarste document | Totaal | Past |
|---|---|---|---|
| Toevoegen | V: 4 | ±6 | ja |
| Verwijderen | V: 6 | ±7 | ja |
| Verplaatsen | V: 6 | ±8 | ja |
| Hernoemen | V: 4 | ±6 | ja |
| Hernoemen + verplaatsen in één | V: 9–10 | ±12 | te krap: daarom twee transacties |
| ↑/↓ | V: 1 | 1 | ja, ook bij een groot domein (batch max. 500) |

De emulator liet hernoemen + verplaatsen in één schrijfactie wél toe. Of hij de limiet precies zo telt als productie is niet vast te stellen; de splitsing blijft staan. Nieuwe regels die extra `get`'s toevoegen aan `vermogens`: tel opnieuw.

## Transactie-foutcodes in de SDK

De web-SDK probeert een transactie opnieuw bij `aborted`, `failed-precondition` en `already-exists`, en geeft na de laatste poging die code door. `failed-precondition` staat in `WEG_CODES` ("bestaat niet meer"). `transactie()` in `vermogens.js` zet daarom `failed-precondition` en `already-exists` om naar `aborted` ("Iemand anders wijzigde dit tegelijk…"). Gebruik voor nieuwe transacties altijd `transactie()`, niet `runTransaction` direct.

## UI in `src/main.js`

**Beheer → Vermogens beheren** (`renderVermogensBeheer(gebruiker, { filter })`, menu-id `vermogensbeheer`, pictogram `puzzel`; het id `vermogens` is sinds CK-021 de plaat, `renderPlaat`).
- Groepen per pijler en ondersteunend domein in domeinvolgorde: `h3.groep-kop` + eigen `role="table"` per groep; vermogens zonder geldig domein staan in "Zonder geldig domein" (bewerken en verwijderen kunnen, ↑/↓ niet).
- Balk met keuzelijst **Toon** en **+ Vermogen toevoegen**; formulier en sectiemelding boven de lijst.
- Bewerken gebeurt in de rij (naam en/of domein). Een fout die de lijst ververst (`VERVERS_CODES`: dubbele naam, domein weg of overkoepelend, `aborted`) laadt de lijst opnieuw en opent het formulier weer met de invoer en de fout.
- Verwijderen met `confirm()`. Laadfout: melding met **Opnieuw laden**, in test/ontwikkel met een hint bij `permission-denied` (regels nog niet gepubliceerd).
- Filter vooraf kiezen: `data-nav="vermogensbeheer" data-filter="{domeinId}"`. `bindAppShell` geeft `data-filter` als `{ filter }` door `navigeer()` aan de render-functie. Een filter op een verdwenen of overkoepelend domein valt terug op "Alle domeinen".

**Hulpfuncties** (alle beheerpagina's):
- `actieKnopHTML(actie, id, soort, naam, extra)`: pictogramknop (potlood of prullenbak) met `aria-label` "Bewerken: X" / "Verwijderen: X" en tooltip `.tip`. Esc verbergt de tooltip via `.tip-uit` op `#inhoud`. Pictogramknoppen die `metOpslaan` aanroepen gebruiken `bezig: null`: het pictogram blijft staan.
- `domeinOptiesHTML(domeinen, gekozen, { alle })`: keuzelijst met `optgroup` Pijlers en Ondersteunende domeinen; overkoepelende domeinen staan er nooit in.
- `toonVermogensBlokkade(el, domein, tekst)`: melding plus knop **Naar de vermogens van X** (`data-nav` + `data-filter`).
- `meldingInBeeld(el)`: scrolt een sectiemelding boven de lijst in beeld na een rijactie, ná het zetten van de focus.
- `zetStatus(el, tekst)`: leeg, na 100 ms gevuld, voor `role="status"`-regels (↑/↓, filter).
- `vermogenFoutTekst(e, domeinNaam)` en `vermogenVeldFouten(naamId, domeinId)`: veldteksten en de koppeling foutcode → veld.
- `schrijfVolgorde(subcollectie, items, clubId = huidigClubId)`: Vermogens geeft de vastgelegde `clubId` mee; Domeinen en Bestuursfuncties houden de standaard.

**Domeinen** (`renderPijlersDomeinenBeheer`): keuzelijst op soort vervangt de filterknoppen; ↑/↓ verdwijnen bij een andere soort dan "Alle soorten" (hint "De volgorde wijzig je bij Toon: Alle soorten."). Onder de naam staat "n vermogens" (link naar Vermogens met filter) of "Nog geen vermogens"; de link vervalt in de smalle container (zie CSS).
- *Verwijderen*: leest eerst vers het aantal (`leesAantalVermogens`); is dat > 0, dan geen `confirm()` maar meteen de blokkademelding, met de focus op de link. Weigeren de regels toch (`permission-denied`, race), dan het aantal opnieuw lezen en dezelfde melding.
- *Naar overkoepelend*: vóór opslaan gecontroleerd; melding onder de soortkeuze, radiogroep `aria-invalid`, focus op het rondje.
- Leest het aantal mislukt, dan geldt 0 (`.catch(() => 0)`) en beslissen de regels.

**Bestuursfuncties**: balk met alleen **+ Bestuursfunctie toevoegen** (filter pas boven ~15 functies, nu niet), pictogramknoppen, prullenbak met `data-aantal`.

**Home** (`renderDashboard`, `renderStructuurGrid`): vier kerncijfers; "n vermogens" of "Nog geen vermogens" op pijler- en ondersteunende kaarten. Domeinen en vermogens laden met `Promise.allSettled`: mislukt alleen het laden van vermogens, dan "–" met sr-tekst "niet geladen", geen regels op de kaarten en een hint in `#vermogens-hint` (altijd in de boom, `role="status"`, leeg = verborgen).

**Foutteksten**: `FOUTTEKSTEN` heeft `aborted` en `vermogen-weg`; `WEG_CODES` bevat `vermogen-weg`. `metOpslaan` toont `e.tekst` als veldfout wanneer de aanroeper die zelf zet.

Namen komen alleen via `esc()` of `textContent` in beeld; blijf dat doen (de tekens `& ' ( )` zijn toegestaan).

## CSS (`src/style.css`, "Beheer en vermogens (CK-020)")

| Klasse | Doel |
|---|---|
| `.beheer-balk` | filter links, `+ toevoegen` rechts; ≤700px gestapeld, knop en keuzelijst 44px. `[hidden]` verbergt hem |
| `.filter-keuze` | label + `select` (min. 220px) |
| `.btn-icoon`, `.tip` | pictogramknop 32×28px (44×44 op ≤700px) met tooltip; `.gevaar` zet de prullenbak rechts |
| `.cel-acties .btn-volgorde` | ↑/↓ even hoog als de pictogramknoppen |
| `.vermogen-groep`, `.groep-kop`, `.groep-naam`, `.groep-aantal`, `.groep-picto`, `.groep-leeg` | groepkop per domein; `.groep-picto:empty` verbergt het |
| `.vermogen-rij` | raster 28px / 1fr / 152px (200px op ≤700px, zodat vier knoppen van 44px passen) |
| `.leeg-blok` | lege staat met uitleg en knop |
| `.cel-domein`, `.cel-sub` | tekst "n vermogens" onder een domeinnaam |
| `.kaart-vermogens` (`.leeg`), `.vermogens-hint` | Home |
| `.lijst-leeg`, `.grid-leeg`, `.sectie-voet`, `.soort-optie` | vervangen inline stijlen |

Container queries (op de lijstcontainer, niet op het scherm, omdat het zijmenu de breedte bepaalt): `#structuur-lijst` stapelt onder **660px** (was 760), `#functie-lijst` onder **500px** (was 590), `#vermogen-lijst` onder **400px**. De actiekolom is 152px, op ≤700px 200px (staat vóór de container queries, zodat stapelen blijft winnen). Kerncijfers staan tot en met 900px in 2×2. Velden in alle beheerformulieren zijn max. 480px. Het focusring-patroon voor `.btn` en `.btn-kaart-actie` is oranje outline plus `box-shadow: 0 0 0 2px var(--text)`.

## Scripts

Draaien vanaf de repo-root; standaard tegen **test**. `--omgeving=productie` vraagt eerst de projectnaam (niet met `--droog`). `--droog` schrijft niets, maar logt wél in. `--help` start geen login. Agents draaien deze scripts niet.

| Script | Gebruik | Doet |
|---|---|---|
| `npm run vermogens:import -- --droog` | zonder `--droog` na "ja" | Zet de 58 HCA-vermogens neer (`scripts/lib/vermogens-hca.mjs`, `HCA_VERMOGENS`; Parkonderhoud en Parkbeveiliging). Stelt eerst het hele plan op; stopt zonder te schrijven bij een ontbrekend, dubbel of overkoepelend domein. Domein op hashtag, dan op naam, hoofdletterongevoelig. Eén `voegVermogenToe` per vermogen, dus hetzelfde protocol als de app. Idempotent (tweede run: 0 nieuw); verwijdert, hernoemt of verplaatst nooit; een vermogen dat al in een ander domein staat wordt gemeld ("LET OP", ongemoeid) |
| `npm run vermogens:controle -- --droog` | zonder `--droog` om naamdocumenten te herstellen | Controleert tellers, naamdocumenten, dubbele namen, ongeldige velden en vermogens bij een ontbrekend of overkoepelend domein (`controleerVermogens`). Herstelt alleen naamdocumenten (aanmaken of opruimen, na "ja"). Tellers, dubbele namen en verweesde vermogens meldt het met de juiste waarde voor de console, want de regels staan geen vrije tellerwijziging toe: dat ís de beveiliging. Exitcode 0 = alles klopt, 1 = afwijkingen |

`veilig()` in `scripts/lib/omgeving.mjs` maakt stuurtekens (C0/C1, regeleinden, richtings- en zero-width-tekens, BOM) zichtbaar als `\u{..}`. `stop`, `waarschuw`, `gelukt` en de planregels van beide scripts gebruiken het, zodat een naam in de database de terminaluitvoer niet kan opmaken. Gebruik het voor elke clubdata die je in een script uitvoert.

De plan- en controlelogica staat in `scripts/lib/vermogens-hca.mjs` zonder Firestore-aanroepen, zodat de emulatortests dezelfde code toetsen.

## Regeltests (emulator)

`npm run test:regels` start de Firestore-emulator (`firebase.json`, poort 8080, geen UI, `singleProjectMode`) met project `demo-clubkompas` en draait `tests/regels.test.mjs` met `node --test`. Geen login, geen echte database; Java moet geïnstalleerd zijn. Stand na de herstelronde: 71 tests, 71 geslaagd (±5 s). De tests gebruiken de echte functies uit `src/vermogens.js` en de scriptlogica, dus app en regels worden samen getoetst. De emulator-config raakt `firebase deploy --only firestore:rules` niet.

Dekking: naamregels, het protocol (alle handelingen, twee tabbladen tegelijk, alle 58 HCA-namen), weigeringen buiten het protocol om, de domein-guard en teller, bestaande bewerkingen (domeinen, bestuursfuncties, clubprofiel, `seed-testclub`), limieten, de scriptlogica en `veilig()`. Voeg bij elke regelwijziging een weiger- én een slaagtest toe.

## Uitrol (Paul)

Niet op 26 november 2026.

1. `npm ci` (nieuwe devDependency `@firebase/rules-unit-testing`), optioneel `npm run test:regels`.
2. `npm run regels:test`. De huidige app (v0.6.0) blijft werken: domeinen zonder teller zijn 0.
3. Lokaal en op tst testen (scenario's in de spec).
4. Import in test: `npm run vermogens:import -- --droog`, dan echt, dan nog eens (verwacht "0 nieuw, 58 al aanwezig").
5. Controle: `npm run vermogens:controle -- --droog` ("Alles klopt").
6. `npm run regels:productie`, vóór de app, omdat de nieuwe app `vermogens` leest.
7. App live.
8. Import in productie: `-- --omgeving=productie --droog`, dan echt, dan de controle.

## Keuzes die niet voor de hand liggen

- **Naamdocument en teller in plaats van een query of Cloud Function.** Op het Spark-plan kan niets server-side lopen, en een regel kan geen query doen. Een document per sleutel maakt uniciteit controleerbaar; de teller maakt "domein heeft vermogens" controleerbaar. Prijs: elke wijziging loopt via het protocol.
- **Transacties in `src/vermogens.js`, niet in `main.js`.** Het importscript en de emulatortests gebruiken zo precies hetzelfde protocol als de app.
- **`sleutelVan()` in plaats van `lower()`** (zie Regels).
- **Naamcheck vooraf bij hernoemen + verplaatsen** (besluit 14), omdat de twee stappen niet atomair zijn.
- **Hernoemen leest ook het oude naamdocument** en ruimt het alleen op als het naar dit vermogen wijst: beschermt tegen schade via de console.
- **Domeinguard zonder `confirm()`** (besluit 15): een domein met vermogens kan niet weg, dus vragen of je het zeker weet is misleidend; de melding wijst de weg.

## Bekende beperkingen en vervolgpunten

- **P0d (harde eis voor Beheer voor een tweede rol):** elk lid mag alles wat de regels toestaan, dus alle vermogens én daarna het domein verwijderen. `isBeheerder(clubId)` is nodig voor schrijven op `vermogens`, `vermogensnamen`, `structuurelementen`, `bestuursfuncties` en `instellingen`, plus een guard in `navigeer` en bovenaan elke beheer-render. `zichtbaar()` is presentatie, geen beveiliging.
- **Console en Admin-SDK omzeilen de regels.** Een verkeerde teller of een los naamdocument ontstaat alleen zo; het controlescript vindt het. Een los naamdocument blokkeert die naam ("naam-bezet") tot het is opgeruimd.
- **Geen back-up** (Spark-plan): overweeg een export vóór de import in productie of bij P0d.
- **Hernoemen + verplaatsen is niet atomair**; de halve uitkomst is met codereview beoordeeld en moeilijk op te wekken.
- **Dubbele `volgorde`** bij gelijktijdig toevoegen of ↑/↓: onschuldig; ↑/↓ via `runTransaction` is een bekend vervolgpunt.
- **CK-021 (plaat):** leest `vermogens`, groepeert op `domeinId`, sorteert op domein- en vermogenvolgorde; er komt dan een tweede menu-item "Vermogens" (id's zijn al gescheiden). `status`, `bovenId` (CK-038/039) vragen een aanpassing van `hasOnly`. Laat een vermogen later naar een **bestuursfunctie** verwijzen, niet naar een persoon (AVG).
- **Gevoelige vermogens** (Lief & Leed, Sociale veiligheid, Tuchtzaken): eerst P0d, geen vrije notities zonder besluit.
- **Niet in een browser getest** (alleen de emulator): lay-out op 375/768/≥1200px, licht en donker, tooltips, VoiceOver, focusafspraken, halve uitkomst, laadfout, Home met en zonder vermogens. Ook het gedrag van `lower()`, de regex en de limieten in productie-Firestore blijft te bevestigen in tst (scenario 5).
- Eén `h1` per pagina, 13 `region`-landmarks in Vermogens, `npm audit` en het bijwerken van `firebase`/`firebase-tools` zijn open (zie backlog).
- Regels en tekenset van namen van domeinen en bestuursfuncties zijn niet uniek afgedwongen (buiten scope).
