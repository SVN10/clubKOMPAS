# Beveiligingsrapport: CK-020 — Vermogens beheren

Fase 5c, 23 november 2026, branch `test` (ongecommitte wijzigingen). Alleen de lokale Firestore-emulator (`demo-clubkompas`) is gebruikt. Niet ingelogd bij Firebase, geen regels gepubliceerd, niet naar een echte Firestore geschreven, geen productiecode gewijzigd, `.env*.local` niet gelezen.

Bekeken: `firestore.rules`, `src/vermogens.js`, `src/main.js` (alle `innerHTML`-plekken en foutteksten), `scripts/inrichten-vermogens-hca.mjs`, `scripts/controleer-vermogens.mjs`, `scripts/lib/omgeving.mjs`, `scripts/lib/vermogens-hca.mjs`, `tests/regels.test.mjs`, `firebase.json`, `package.json` en `package-lock.json`, en de spec, besluiten 7 en 12 en het bouwverslag.

## Uitgevoerde controles

- `npm run test:regels`: **69 tests, 69 geslaagd**. Dat zijn de 59 bestaande tests plus 10 nieuwe aanvallende tests in het blok `beveiliging: aanvallen via de API worden geweigerd` onderaan `tests/regels.test.mjs`. Ze tonen aan dat de regels deze pogingen weigeren:
  - schrijven naar of lezen uit een andere club (tenant-isolatie), ook met een volledig protocol-batch;
  - een `domeinId` met een pad (`../../club2/structuurelementen/d2`, `speelt/x/y`, `speelt/`);
  - een naamdocument kapen door het in één batch te verwijderen en opnieuw aan te maken, met een vermogen dat alleen in hoofdletters verschilt;
  - twee vermogens in één batch met één tellerstap;
  - een domein naar overkoepelend zetten in dezelfde batch als een nieuw vermogen;
  - een domein samen met zijn laatste vermogen verwijderen;
  - de teller verlagen door een vermogen naar een niet-bestaand domein te zetten;
  - een nieuw domein met de teller als string;
  - een naamdocument voor een vermogen dat niet bestaat;
  - één informatieve test: `volgorde` heeft geen bovengrens (zie bevinding 2).
- De regels met de hand nagelopen op deze vragen:
  - Kan de teller vervalst worden? Nee. Een stap van +1 of −1 moet in dezelfde schrijfactie bij een echt vermogen horen dat bij het domein komt of eruit gaat (`vermogenKomtBij`/`vermogenGaatWeg` met `get` en `getAfter`).
  - Kan `laatsteVermogenId` misbruikt worden? Nee. Bij een gelijke teller mag het veld vrij veranderen, maar dat is onschuldig. Bij een tellerstap moet het naar het vermogen wijzen dat in dezelfde batch verandert, en twee stappen in één batch kunnen niet (één waarde).
  - Kan een naamdocument gekaapt of verwijderd worden? Nee. Het kan niet worden bijgewerkt (`update: if false`). Verwijderen kan alleen als de naam na de schrijfactie niet meer bij dat vermogen hoort. De sleutel moet in beide richtingen gelijk zijn aan `sleutelVan(naam)`.
  - Kan een vermogen bij een overkoepelend domein komen? Nee. `getAfter` controleert het type na de schrijfactie. Een domein met teller > 0 kan niet naar overkoepelend, en ook niet in dezelfde batch.
  - Race conditions: een verouderde teller maakt `tellerStap` onwaar, dus de hele batch wordt geweigerd. De bestaande test met twee tabbladen bevestigt dat precies één schrijfactie wint.
- Bestaande regels zijn niet verzwakt:
  - `gebruikers`, `clubs`, `leden`, `instellingen` en `bestuursfuncties` zijn ongewijzigd.
  - `structuurelementen` is strenger geworden: create alleen met teller 0, update alleen via `tellerWijzigingKlopt`, delete alleen bij teller 0.
  - Er zijn geen wildcard-matches toegevoegd. Wat niet genoemd is, blijft dicht.
- XSS: `esc()` vervangt `& < > " '`. Ik heb alle templates met vermogens- en domeinnamen nagelopen: de rijen, `aria-label`, `value="…"` in de bewerkrij, `<option>`, groepskop, tabellabel, voetnoot, domeinlink en Home-kaart. Ze gebruiken allemaal `esc()`. Meldingen gaan via `textContent`/`replaceChildren` (`toonOk`, `toonFout`, `zetVeldFout`, `toonVermogensBlokkade`, `zetStatus`). `confirm()` toont platte tekst. De pictogramnaam gaat door een allowlist (`PICTOGRAM_SLEUTELS`), `SOORT_KLEUR`/`SOORT_LABEL` zijn vaste lookups en de aantallen zijn gecontroleerde ints. Ik heb geen niet-ge-escapete interpolatie gevonden. De tekens `& ' ( )` uit besluit 12 zijn dus veilig. De domeinnamen, die niet op tekens worden beperkt, worden ook overal ge-escaped.
- Foutmeldingen en logs:
  - In productie logt `metOpslaan` alleen `code` en `name`. Het volledige foutobject wordt alleen in DEV gelogd.
  - Laadfouten loggen alleen `e?.code`.
  - Foutteksten bevatten alleen gegevens van de eigen club (domeinnaam) en het supportadres.
  - De testhint over regels verschijnt alleen in test en ontwikkel.
  - `firestore-debug.log` valt onder `*.log` in `.gitignore`.
- Scripts:
  - Standaard is de omgeving test. Productie kan alleen met `--omgeving=productie`, en dan moet je de projectnaam intypen (behalve bij `--droog`). Vóór het schrijven moet je "ja" typen.
  - Ze gebruiken de client-SDK met gewone login, dus de regels gelden. Er is geen Admin-SDK en geen serviceaccount.
  - Het wachtwoord wordt verborgen ingelezen.
  - Er staan geen sleutels in de code (config komt uit `.env.<omgeving>.local`, dat in `.gitignore` staat).
  - De controle herstelt alleen naamdocumenten, binnen de regels.
- `firebase.json`: het blok `emulators` met `singleProjectMode` raakt de deploy van de regels niet. `test:regels` draait op het project `demo-clubkompas`, dus er is nooit verbinding met een echt project.
- `sleutelVan()`: uniciteit wordt volledig in de regels afgedwongen (dezelfde functie voor de sleutel van het naamdocument en voor de controle). Alle toegestane hoofdletters (A–Z, À–Ö, Ø–Þ) worden afgebeeld. Een `lower()` die zich in productie anders gedraagt, kan alleen tot gelijke uitkomst of tot weigering leiden (fail closed), niet tot een dubbele naam. Testscenario 5 in tst blijft nodig voor de bruikbaarheid.

## Bevindingen

### Bevinding 1: elk lid mag alles wat de regels toestaan (rol wordt niet gecontroleerd)
**Ernst:** 🟢 Laag (bekend en geaccepteerd restrisico, besluit 7 en spec "Restrisico" punt 2)
**Type:** Autorisatie
**Locatie:** `firestore.rules`, blokken `structuurelementen`, `vermogens` en `vermogensnamen` (alle `allow` gebruiken alleen `isLid(clubId)`)
**Probleem:** `isLid` controleert alleen of het ledendocument bestaat, niet `rol == 'beheerder'`. Scenario: een toekomstig lid zonder beheerrol verwijdert via devtools alle vermogens met het juiste protocol en daarna de domeinen. De regels houden dat niet tegen. Nu zijn alle leden bestuurders, dus het risico is klein. Tenant-isolatie werkt wel: in een andere club lukt niets.
**Aanbeveling:** voeg in P0d een `isBeheerder(clubId)` toe (ledendocument met `rol == 'beheerder'`) voor create, update en delete op `structuurelementen`, `vermogens`, `vermogensnamen` en `bestuursfuncties`, en neem `vermogens`/`vermogensnamen` op in de harde eis in de backlog ("Na CK-044"), zoals de spec al zegt. Doe dit vóórdat er leden zonder beheerrol komen.

### Bevinding 2: geen bovengrens op `volgorde` en vrij veld `laatsteVermogenId`
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie
**Locatie:** `firestore.rules`, `geldigVermogen()` (`d.volgorde is int && d.volgorde >= 1`) en `tellerWijzigingKlopt()` (bij `nieuw == oud` wordt `laatsteVermogenId` niet gecontroleerd)
**Probleem:**
- Een lid kan `volgorde` op bijvoorbeeld `9007199254740991` zetten (aangetoond in de test "ter informatie: volgorde heeft geen bovengrens"). Een volgende toevoeging rekent dan met `hoogste + 1`, buiten het veilige integerbereik van JavaScript.
- Een lid kan `laatsteVermogenId` (bij een gelijke teller) een willekeurig type of een grote waarde geven, tot de documentlimiet van 1 MiB.
- `structuurelementen` accepteert al extra velden (bestaand gedrag).
- De guard of de uniciteit worden hiermee niet omzeild. Het effect is rommel en een verstoorde sortering.

**Aanbeveling:** voeg `&& d.volgorde <= 100000` toe aan `geldigVermogen`. Voeg in `tellerWijzigingKlopt` altijd toe: `(!('laatsteVermogenId' in request.resource.data) || (request.resource.data.laatsteVermogenId is string && request.resource.data.laatsteVermogenId.size() <= 100))`. Overweeg voor `structuurelementen` later een `keys().hasOnly([...])`.

### Bevinding 3: clubdata ongefilterd in de terminaluitvoer van de scripts
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie / output-injectie (terminal-escapes)
**Locatie:**
- `scripts/inrichten-vermogens-hca.mjs`: de regel `console.log(\`  + ${p.naam} → ${p.domeinNaam} (${nr})\`)` en `waarschuw(...letOp)`;
- `scripts/controleer-vermogens.mjs`: de uitvoer van `afwijkingen` en `herstel`;
- `scripts/lib/vermogens-hca.mjs:94` (`${d.naam}`), r. 114 en r. 144 (`label(v)`).

**Probleem:** domeinnamen worden alleen op lengte gecontroleerd (≤ 200), dus ze kunnen stuurtekens en ANSI-escapes bevatten. Een vermogen met een ongeldige naam kan via de console bestaan. Scenario: een lid zet een domeinnaam met `\x1b[2K\x1b[1A`-reeksen. Als Paul het import- of controlescript tegen productie draait, kunnen regels uit het plan op het scherm verdwijnen of anders lijken vóórdat hij "ja" typt. Er is geen codeuitvoering en de regels blijven gelden, maar de controle vooraf wordt minder betrouwbaar.
**Aanbeveling:** filter in `scripts/lib/omgeving.mjs` één helper over alle clubdata vóór uitvoer, bijvoorbeeld `const veilig = s => String(s).replace(/[\x00-\x1f\x7f-\x9f]/g, '?')`, of toon namen met `JSON.stringify`.

### Bevinding 4: nieuwe devDependency en bestaande audit-meldingen
**Ernst:** 🟢 Laag
**Type:** Dependency-risico's
**Locatie:** `package.json` (`@firebase/rules-unit-testing@^6.0.0`), `package-lock.json`
**Probleem:**
- `@firebase/rules-unit-testing@6.0.0` (Apache-2.0, officieel Firebase-pakket, alleen dev) voegt volgens de lockfile **geen** nieuwe transitieve pakketten toe. Het heeft alleen een peer `firebase ^13`, die al aanwezig is.
- `npm audit` meldt 19 kwetsbaarheden (14 moderate, 5 high). Die komen allemaal uit bestaande dependencies:
  - `firebase-tools`: archiver, glob/minimatch, gaxios/uuid, google-gax, pubsub;
  - `@grpc/grpc-js` onder `@firebase/firestore`: dit is het Node-transportpad, niet de browserbundle.
- `@firebase/rules-unit-testing` staat er alleen in via de peer `firebase`. CK-020 voegt geen nieuw risico toe.

**Aanbeveling:** accepteren voor CK-020. Draai **niet** `npm audit fix --force`, want dat zet `firebase-tools` en `firebase` op oude majorversies terug. Maak een apart backlogpunt om `firebase` en `firebase-tools` bij te werken zodra er een versie met een gepatchte `@grpc/grpc-js` (> 1.13.5) beschikbaar is, en draai daarna `npm audit --omit=dev` opnieuw.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 0
- 🟢 Lage aanbevelingen: 4

## Eindoordeel
✅ **Veilig voor TST**, met de lage aanbevelingen als aandachtspunten. Voor PRD blokkeert er niets. Bevinding 1 moet in P0d opgelost zijn voordat er leden zonder beheerrol komen. Bevindingen 2 en 3 zijn kleine verbeteringen, die zonder risico vóór of na de PRD-uitrol kunnen.
