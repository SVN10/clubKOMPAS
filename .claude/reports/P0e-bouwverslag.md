# Build-rapport: P0e — Aparte testomgeving

## Wat is gebouwd
- Lokale app draait standaard tegen test (`npm run dev` = `vite --mode test`). Wijst de lokale app toch naar `svn10-clubkompas` en is de modus niet `productie`, dan start Firebase niet en verschijnt M2. Zonder project-ID verschijnt M1 (lokaal met bestandsnamen, in een build zonder bestandsnamen).
- Omgevingsbalk bovenaan bij Test (petrol) en Productie (lokaal) (oranje), tabtitel met voorvoegsel, footer-varianten (oranje vlak bij Productie (lokaal), project-ID in de tooltip), M5-hint op het inlogscherm (alleen Test), M6-regel op "Geen club gekoppeld" (alleen Test), `role="alert"` op de algemene inlogfout.
- `scripts/lib/omgeving.mjs`: kiesOmgeving (standaard test), leesEnv per omgeving met consistentiecheck, kopregel, productiebevestiging, stop/waarschuw/gelukt (kleur alleen op TTY en zonder NO_COLOR), vraag/vraagVerborgen, plus startScript, inloggen (M13), zoekClubId (M11) en geweigerd (M12).
- Alle zes bestaande scripts gebruiken de lib. `scripts/seed-testclub.mjs` (nieuw), `scripts/regels.mjs` (nieuw, M14/M15).
- `firebase.json` (alleen regels), `.firebaserc` (test/productie, geen default), `firebase-tools` als devDependency.
- `.env.productie.local` (kopie van `.env` + `VITE_OMGEVING=Productie`), `.env.test.local.voorbeeld` (lege waarden, wél commitbaar).
- README-sectie "Omgevingen (test en productie)" met de 10 consolestappen, sectie "Firestore-regels" bijgewerkt. CHANGELOG onder "Ongepubliceerd". Kopcommentaar `firestore.rules` (regels zelf ongewijzigd).

## Gewijzigde bestanden
- `src/firebase.js` — `PRODUCTIE_PROJECT_ID`, `projectId`, `configFout`; geen initialisatie bij een configFout.
- `src/main.js` — `SOORT`/`OMGEVING_LABEL`, `renderConfigFout`, `toonOmgevingsBalk`, footer, M5, M6, `toonTussenkaart({ gestopt })`, `onAuthStateChanged` alleen zonder configFout.
- `src/style.css` — blok `/* ── Omgevingen (P0e) ── */` onderaan, exact uit het ontwerp.
- `scripts/lib/omgeving.mjs`, `scripts/regels.mjs`, `scripts/seed-testclub.mjs` — nieuw.
- `scripts/import-hca.mjs`, `inrichten-beheer-hca.mjs`, `inrichten-domeinen-hca.mjs`, `migreer-club.mjs`, `opschonen-dubbelen.mjs` — lib in plaats van eigen leesEnv/vraag; gebruiksregel met `[--omgeving=test|productie]`; lees- en schrijffouten via M12.
- `scripts/migrate.mjs` — weigert altijd (zie afwijkingen).
- `package.json` / `package-lock.json` — scripts `dev`, `dev:productie`, `regels:test`, `regels:productie`; `firebase-tools` ^15.37.0.
- `firebase.json`, `.firebaserc`, `.env.test.local.voorbeeld` — nieuw. `.env.productie.local` — nieuw, niet in git.
- `README.md`, `CHANGELOG.md`, `firestore.rules` (alleen commentaar), `.claude/backlog.md` (status P0e).

## Wat is getest
- `node --check` slaagt voor alle 9 `.mjs`-bestanden.
- `npm run build` slaagt (de chunkgrootte-waarschuwing bestond al). De build gebruikt nog `.env` (productie), dus het gedrag op Vercel verandert niet: live is `DEV` false, dus nooit M2; `VITE_OMGEVING=Productie` geeft geen balk.
- Een build zonder configuratie (lege envDir, in de scratchmap) slaagt ook en bevat M1 "tijdelijk niet beschikbaar". De build faalt dus nooit op ontbrekende config; de app toont dan M1. Zo is het ontworpen.
- Stoppaden zonder netwerk, uitvoer gecontroleerd: M3 (alle scripts zonder `.env.test.local`), M7 (`--omgeving=prod`, bij regels.mjs met "gepubliceerd"), M10 (seed + productie), M9 (fout antwoord bij import-hca productie en bij regels:productie; er wordt niets gestart), "kent geen --droog" (import-hca), migrate.mjs weigert. M4 (beide richtingen), kopregels (TEST, TEST·DROOG, PRODUCTIE·DROOG) en M8 getest met een kopie van de lib in de scratchmap met nep-env-bestanden.
- De devserver die al op localhost:5173 draaide (gewone `vite`, modus development, met `.env`) krijgt nu `configFout = 'productie-lokaal'` via HMR. Die lokale app toont dus M2 en praat niet meer met productie. Dat is het bedoelde gedrag.
- Niet getest (mocht niet, of kon niet zonder testproject): inloggen, `--droog` tegen een echt project, seed-schrijven, `regels:test`, M11/M12/M13/M14/M15 in het echt, en de schermen in een browser (geen headless browser beschikbaar).

## Afwijkingen van het ontwerp
1. **M1-tekst lokaal**: de bestandsnaam volgt de modus (`.env.productie.local` bij `npm run dev:productie`, anders `.env.test.local`). Reden: anders wijst de melding bij `dev:productie` naar het verkeerde bestand.
2. **`.env` niet verwijderd** (harde veiligheidsregel van de opdracht, afwijkend van de spec): Paul verwijdert hem zelf in README-stap 9, nadat de test-app werkt. Tot `.env.test.local` gevuld is, toont `npm run dev` M2. Scripts tonen M8.
3. **`migrate.mjs`** weigert altijd met een GESTOPT-melding in plaats van minimaal te refactoren. Reden: verouderd, werkt op `clubs/{uid}` en zou dubbelen maken; de oude code staat in git.
4. **Scripts zonder `--droog`** (`import-hca`, `opschonen-dubbelen`) stoppen bij `--droog`. Reden: anders zou de kopregel "DROOG" tonen en de productiebevestiging overslaan, terwijl het script wél schrijft. `import-hca.mjs` neemt het e-mailadres nu uit het eerste argument dat niet met `--` begint (voorheen `argv[2]`, wat met `--omgeving=…` zou botsen).
5. **Seed-omschrijvingen**: Bestuur, Communicatie, Financiën en de drie pijlers hebben in de bronscripts geen omschrijving. De seed laat het veld daar weg (bij bestaande items blijft een eventuele omschrijving staan). De pijlers houden de HCA-hashtagnamen, zoals de spec toestaat.
6. **Uitlijning**: volgregels springen vast 9 spaties in (zoals in het ontwerp). Na `AFGEBROKEN` (10 tekens) lijnen ze daardoor niet precies onder de tekst uit.
7. **migreer-club.mjs**: de afsluitende "VOLGENDE STAP (3)"-herinnering gaat via `waarschuw` (LET OP), de rest via `stop`/`gelukt`; de inhoud is gelijk gebleven.
8. **M12** gebruikt per omgeving "test"/"productie" en "testgebruiker"/"gebruiker". Een gedeeltelijk mislukte reeks losse schrijfacties (scripts zonder batch) meldt "Mogelijk is een deel al geschreven" in plaats van "Er is niets geschreven".

## Handmatig te controleren
- In een browser: M2 nu (met `.env`), M1 (tijdelijk `.env` en `.env.test.local` weg), balk en footer bij Test en bij `dev:productie`, M5 en M6 in Test, donkere modus, smalle schermen (balk breekt af).
- Live na merge: geen balk, footer "Productie · Versie …", tabtitel "clubKOMPAS".
- `npm install` meldde dat installatiescripts van o.a. `re2`/`protobufjs` niet zijn uitgevoerd (npm-beleid). `npx firebase --version` werkt (15.37.0); `deploy` is niet geprobeerd.

## Wat Paul zelf moet doen
README, "Omgevingen" → "Eenmalig inrichten", stappen 1–10: testproject aanmaken, `.env.test.local` vullen (vanuit `.env.test.local.voorbeeld`), Auth en Firestore (zelfde regio als productie), `npx firebase login` + `npm run regels:test`, testgebruiker + 3 documenten, seed, test-app controleren, **dan pas** `.env` verwijderen, Vercel-variabelen bekijken (ook Preview) zonder iets te wijzigen. Krijgt het testproject een achtervoegsel, dan `.firebaserc` aanpassen.

## Herstelronde (22 november 2026)

De punten uit de vijf kwaliteitsrapporten zijn verwerkt, plus de aanvulling over de project-ID. De veiligheidsregels golden ook hier: `.env` en `.env.productie.local` zijn niet gewijzigd (shasums gelijk), er is niet ingelogd, niets naar Firestore geschreven, niets gepubliceerd en niets gecommit.

### Wat is aangepast
1. **Gemengde configuratie (beveiliging 1).** `src/firebase.js` geeft lokaal (`DEV`) de nieuwe `configFout = 'gemengde-config'` als:
   - een van de zes `VITE_FIREBASE_*`-waarden leeg is;
   - `authDomain` niet begint met `${projectId}.` (de punt is het anker);
   - in modus `test` niet alle zes sleutels echt in `.env.test` of `.env.test.local` staan.

   Dat laatste kan alleen omdat `vite.config.js` de sleutels uit het modusbestand inleest en ze als `__MODUS_SLEUTELS__` aan de app doorgeeft. Waarom deze controle: als alleen `apiKey` ontbreekt, vult Vite die aan uit `.env`. Dan logt de app in bij productie, terwijl de authDomain-controle niets ziet.

   De app toont dan een foutpagina met oranje rand: "Gestopt: de configuratie is onvolledig of gemengd". Live (niet-DEV) blijft buiten deze controle, zodat een afwijkend authDomain of een ontbrekende `storageBucket` in Vercel de live app niet kan breken. Dit staat beschreven in de README.
2. **Wachtwoordinvoer (beveiliging 3).** `vraagVerborgen` slaat escape-reeksen over (CSI en SS3, ook als ze over meerdere stukken binnenkomen). Raw mode gaat altijd weer uit:
   - bij Enter, Ctrl+D en Ctrl+C;
   - bij een fout op stdin;
   - via `process.on('exit')`.

   De README zegt nu ook dat je wachtwoorden nooit als argument of via een pipe meegeeft.
3. **Voorbeeldbestand (beveiliging 4).** De kop van `.env.test.local.voorbeeld` zegt nu "VUL DIT BESTAND NOOIT IN". `controleerVoorbeeld()` in de lib stopt elk script en `regels.mjs` als er een waarde in het voorbeeldbestand staat (`VITE_OMGEVING` telt niet mee). De README zegt hetzelfde.
4. **Test.**
   - Bij twee of meer `--omgeving=`-argumenten stopt het script met een duidelijke melding.
   - De inspringing wordt per label berekend: minimaal 9, en anders labellengte + 2. Na AFGEBROKEN staan de volgregels daardoor nu onder de tekst (afwijking 6 vervalt).
5. **Huisstijl.**
   - Token `--on-orange: #111212` toegevoegd, licht en in beide donkere blokken. Het wordt gebruikt in het P0e-blok en ook in `.btn.primary`, zoals het huisstijlrapport voorstelt.
   - `.inlog-kaart code` krijgt `color: var(--text)`.
   - `calc(100vh - 28px)` is vervangen door `#app:has(> .inlog-wrap)` als flex-kolom met `flex: 1`, en `.inlog-wrap` met `flex: 1; min-height: 0`. Dit geldt alleen met de balk. De body was al een flex-kolom met `min-height: 100vh`.
6. **Toegankelijkheid.**
   - `#config-herlaad` krijgt een petrol rand.
   - Op de foutpagina wijst `aria-describedby="config-uitleg"` van de titel naar de eerste alinea.
7. **Compliance (README, "Omgevingen").**
   - Een kader "Alleen fictieve data in test": geen export of import van productie naar test, geen echte HCA-accounts, testaccounts alleen met functionele of verzonnen adressen.
   - Stap 1b: verwerkersvoorwaarden accepteren, ook in productie controleren, datum en account noteren.
   - Stap 4: regio gelijk aan productie als die in de EU staat, anders of bij twijfel `europe-west4`; de regio noteren.
   - Tip: tweestapsverificatie op het Google-account dat eigenaar is.
8. **README.** Installeren met `npm ci`, en uitgelegd waarom je geen `npm audit fix --force` draait (het zet `firebase-tools` terug naar een oudere hoofdversie en kan de app of de scripts breken).

### Project-ID svn10-clubkompas-test
- `.firebaserc`: alias `test` → `svn10-clubkompas-test`.
- `clubkompas-test` is vervangen in de README (stap 1 herschreven: het project bestaat al, met een waarschuwing over het gedeelde begin met de productie-ID), in `.env.test.local.voorbeeld`, CHANGELOG, backlog, dit verslag en de M4-melding (nieuwe constante `TEST_PROJECT_ID` in de lib).
- In de app staan geen vaste test-ID's; alle teksten gebruiken `projectId`.
- De specs en de vijf kwaliteitsrapporten zijn niet aangepast. Daar staat nog `clubkompas-test`; het zijn historische documenten.
- **Vergelijkingen:** alle productiecontroles zijn exact.
  - `firebase.js`: `projectId === PRODUCTIE_PROJECT_ID`.
  - lib `controleerProject`: `===` en `!==`.
  - `geweigerd`: `===`.
  - `productiebevestiging`: `antwoord.trim() !== projectId`.
  - `regels.mjs` gebruikt `controleerProject`.
  - `seed-testclub` weigert op omgevingsnaam, en daarna nog via `controleerProject`.
  - Er wordt nergens `startsWith`, `includes` of een regex op project-ID's gebruikt. De enige `startsWith` is de authDomain-controle `${projectId}.`, en de punt sluit verwarring tussen `svn10-clubkompas` en `svn10-clubkompas-test` uit.

### Wat is getest
- `node --check` op alle 9 `.mjs`-bestanden: geslaagd. `npm run build`: geslaagd.
- **App, met nep-env in een scratchkopie** (Vite dev-modus via `ssrLoadModule`, nep-waarden, geen netwerk). Alle 12 gevallen geven het verwachte resultaat:
  - test compleet met `.env` → geen fout;
  - test mist `API_KEY` → gemengde-config;
  - test mist `AUTH_DOMAIN` → gemengde-config;
  - `svn10-clubkompas-test` met authDomain `svn10-clubkompas.firebaseapp.com` → gemengde-config;
  - lege `APP_ID` → gemengde-config;
  - niets ingesteld → geen-config;
  - alleen `.env` → productie-lokaal;
  - test compleet zonder `.env` → geen fout;
  - `dev:productie` → geen fout;
  - productie-ID met authDomain `svn10-clubkompas-test.firebaseapp.com` in modus test → productie-lokaal;
  - hetzelfde in modus `productie` → gemengde-config;
  - `dev:productie` met de test-ID → geen fout.
- **Scripts, met nep-env:**
  - `controleerProject`: test+test-ID toegestaan, test+productie-ID gestopt, productie+test-ID gestopt, productie+productie-ID toegestaan.
  - `startScript`: kopregel met `svn10-clubkompas-test`. Het intypen van `svn10-clubkompas-test` bij de productiebevestiging geeft AFGEBROKEN; `svn10-clubkompas` gaat door.
  - Een ingevuld voorbeeldbestand stopt het script. De LET OP-inspringing klopt.
- **Wachtwoordinvoer met nagebootste stdin:** pijl- en functietoetsen worden genegeerd ("abcde"), ook een escape-reeks die verdeeld binnenkomt; backspace werkt. Na Ctrl+C (exit 130), na een stdin-fout en bij `process.exit` midden in de invoer staat raw mode weer uit. Een echte pty-test lukte niet betrouwbaar: de invoer kwam binnen vóór raw mode aan stond.
- **Stoppaden in de repo:** M3, M7, M10, dubbele omgeving (ook bij `regels.mjs`, met "gepubliceerd"), `migrate.mjs`, en M9 bij `regels:productie`.

### Overgebleven punten (niet in deze ronde)
- Beveiliging 2 en 5, compliance 6 (Vercel Preview) en de bestaande foutkleur in donkere modus (toegankelijkheid 1) zijn backlogpunten buiten P0e.
- Lokaal blijft `dev:productie` met een test-ID zonder fout; dat is de veilige kant op.
- De schermen zijn nog steeds niet in een browser bekeken.

## Status
Klaar voor een nieuwe kwaliteitscontrole. Niet gecommit.
