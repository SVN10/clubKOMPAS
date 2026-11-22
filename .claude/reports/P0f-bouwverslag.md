# Build-rapport: P0f — Eigen adressen voor live en online test

## Wat is gebouwd
- De omgeving wordt op één plek bepaald, in `src/firebase.js` (`SOORT`, `OMGEVING_LABEL`, `VERCEL_ENV` worden geëxporteerd). Lokaal (DEV) bepaalt de Vite-modus, online (build) bepalen `VITE_OMGEVING` en het project. De code volgt de SOORT-tabel uit het ontwerp letterlijk, met `console.warn` als het label afwijkt.
- `__VERCEL_ENV__` komt via `define` in `vite.config.js` (`process.env.VERCEL_ENV || ''`).
- `configFout` heeft een nieuwe variant `test-met-productie` en een uitgebreide `gemengde-config`. Beide hangen aan `nietLive` (`!DEV && VERCEL_ENV !== 'production'`). Bij `VERCEL_ENV=production` kan alleen `geen-config` optreden. `modusMist` (`__MODUS_SLEUTELS__`) geldt alleen voor DEV.
- Omgevingsbalk: drie varianten (ontwikkel, test, productie-lokaal) met `data-soort`, en de tabtitels uit Scherm 1. Ontwikkel en test gebruiken allebei `.omgeving-balk--test`.
- Footer: `toonProject = SOORT !== 'productie'`. Het label komt altijd uit SOORT.
- Foutpagina's: `test-met-productie` en `gemengde-config` hebben elk een online variant en een lokale-buildvariant, in de volgorde uit Scherm 3. De bestaande DEV-teksten zijn ongewijzigd.
- Inlogscherm: M16 verschijnt bij `auth/unauthorized-domain`, `auth/unauthorized-continue-uri` en `auth/requests-from-referer*`. De melding wordt opgebouwd met `textContent` en `createElement`, met `location.host`. De extra regel verschijnt alleen bij ontwikkel en test. M16 en M5 verschijnen nooit tegelijk. M5 en M6 gelden nu ook bij ontwikkel, met het juiste woord.
- In `.env.test.local.voorbeeld` is de laatste regel nu `VITE_OMGEVING=Ontwikkel`, met een kopregel erboven.
- README "Omgevingen" is bijgewerkt en de CHANGELOG heeft een nieuwe kop "Ongepubliceerd".

## Gewijzigde bestanden
- `src/firebase.js`: bepaling van SOORT, OMGEVING_LABEL en VERCEL_ENV, waarschuwing bij een afwijkend label, nieuwe configFout-regels.
- `src/main.js`: de eigen omgevingsconstanten zijn verwijderd en worden nu geïmporteerd. Verder bijgewerkt: footer, `toonOmgevingsBalk` (tabel `OMGEVINGS_BALK`), `renderConfigFout` (4 nieuwe takken), M16 (`toonAdresNietToegestaan`), M5 en M6.
- `vite.config.js`: `__VERCEL_ENV__`.
- `.env.test.local.voorbeeld`: `VITE_OMGEVING=Ontwikkel` met een kopregel.
- `README.md`: tabel met drie omgevingen en hun adressen, "Dagelijks gebruik", configuratiebestanden, stap 2, 8 en 10. Nieuw kopje "Online test en werkwijze branch `test`" met de werkwijze `test` → `main` (`git merge --ff-only test`) en de stappen 0–7 in de volgorde van de bijstellingen. Verder een tabel "Als `tst.` niet klopt" en nieuwe meldingen.
- `CHANGELOG.md`: kop "Ongepubliceerd" met een P0f-regel.
- Geen CSS-wijzigingen. `.env.test.local`, `.env.productie.local`, `scripts/`, `package.json` en `.claude/docs/P0e-technisch.md` zijn niet aangeraakt.

## Afwijkingen van het ontwerp
- `gemengde-config`, lokale build: stap 1 luidt "Controleer in `.env.<MODE>.local` of alle zes … gevuld zijn …". Het ontwerp zegt alleen "als de online variant maar met dat bestand", dus die tekst heb ik zelf zo ingevuld.
- `.env.test.local.voorbeeld`: de kopregel staat direct boven `VITE_OMGEVING` en niet bovenaan het bestand. Zo blijft het bij de regel waar hij over gaat. `controleerVoorbeeld` negeert commentaar en `VITE_OMGEVING`.
- `.claude/docs/P0e-technisch.md` en de backlog zijn niet bijgewerkt, op aanwijzing van de opdrachtgever (alleen een CHANGELOG-regel). De backlog had al wijzigingen van de hoofdsessie die nog niet gecommit zijn.

## Verificatie
- `node --check` slaagt voor `src/main.js`, `src/firebase.js` en `vite.config.js`. `npm run build` slaagt.
- Nep-env-builds liepen buiten de repo (uitvoer in de scratchmap, `env -i`, nep-sleutels) en zijn gecontroleerd met jsdom (DOM) en een lib-build van `firebase.js` (waarden):
  1. preview + Test + productiewaarden: `test-met-productie`, online tekst, link naar clubkompas.svn10.nl. OK.
  2. production + Test + productiewaarden: Inloggen, geen balk, SOORT productie, `console.warn`. OK.
  3. production zonder label + productiewaarden: Inloggen, geen balk, `console.warn`. OK.
  4. preview + Test + testwaarden: balk "Testomgeving · online · project svn10-clubkompas-test · fictieve data", titel "TEST · clubKOMPAS", label Test. OK.
  5. preview + testwaarden zonder APP_ID: `gemengde-config`, online tekst. OK.
  6. dev (modus test, `.env.test.local` met `VITE_OMGEVING=Test`): SOORT ontwikkel, balk "Ontwikkelomgeving · op deze computer …", titel "ONTWIKKEL · clubKOMPAS", label Ontwikkel. OK (Vite SSR met jsdom).
  7. dev:productie: oranje balk "Let op: echte clubdata · lokaal tegen svn10-clubkompas", titel "PRODUCTIE LOKAAL", label "Productie (lokaal)". OK.
- Extra controles voor live: production met label Ontwikkel, met Productie en een lege APP_ID, met Productie en een niet-passend authDomain. Alle drie starten zonder stop en zonder balk. Production met het testproject geeft een balk "Testomgeving" en een warn (terugvalregel). Production zonder config geeft alleen `geen-config`. Preview zonder label met productiewaarden geeft productie zonder stop (zoals de spec beschrijft). Preview met label Ontwikkel en productiewaarden geeft `test-met-productie`. Lokale builds: Test met productiewaarden geeft de lokale variant van `test-met-productie`; Ontwikkel met testwaarden geeft een Ontwikkel-balk.

## Handmatig te controleren
- M16 in de browser: de foutcodes laten zich niet veilig nabootsen zonder in te loggen. Controleer de opbouw (eerste zin rood, spans in `--text`, `code` gestyled, regel 2 alleen bij ontwikkel/test) bijvoorbeeld via een breakpoint of door `e.code` tijdelijk te overschrijven.
- De footer na het inloggen ("ONTWIKKEL · VERSIE …" en tooltip "Project svn10-clubkompas-test · …"). De waarde is alleen via `OMGEVING_LABEL` gecontroleerd.
- Of de balktekst bij 400–680px netjes over twee regels breekt.
- Bij een lokale `npm run build` (modus production) noemt de lokale foutpagina `.env.production.local`, omdat het bestand uit `MODE` komt (zoals ontworpen). In de praktijk bouw je met `--mode test`.

## Herstelronde (22 november 2026)

Verwerkt: de bevindingen uit `P0f-test`, `P0f-beveiliging`, `P0f-compliance`, `P0f-huisstijl` en `P0f-toegankelijkheid`. Huisstijl en toegankelijkheid hadden geen bevindingen die een wijziging vragen.

### Code
1. **Preview met het productieproject stopt altijd** (beveiliging 1, test 1). Een online build buiten Production (`VERCEL_ENV` gevuld en niet `production`) met het productieproject krijgt nu SOORT `test` (of `ontwikkel` bij dat label), en nooit meer `productie`. `configFout` wordt dan altijd `test-met-productie`, ook met een leeg label, een onbekend label of `Productie`. Lokale builds (`VERCEL_ENV` leeg) en Production zijn ongewijzigd.
2. **Strengere controle op gemengde configuratie** (beveiliging 3). `onvolledig` controleert nu ook `appId.split(':')[1] === messagingSenderId`. Buiten live levert een fout `gemengde-config` op (DEV en `nietLive`). Op Production volgt alleen een nieuwe `console.warn`. De vergelijking "productie-`apiKey`/-`senderId` naast een testproject" is **niet** gebouwd: daarvoor moeten de productiesleutels in de code staan, en dat mocht niet. Dit staat gedocumenteerd in `.claude/docs/P0e-technisch.md`. De stappen in de foutpagina's voor `gemengde-config` (DEV, online, lokale build) noemen nu ook deze regel. Dat is een kleine afwijking van "DEV-teksten letterlijk", nodig omdat de nieuwe controle ook in DEV stopt.
3. **`vite.config.js`** (beveiliging 4) gooit een fout als `VERCEL` gezet is maar `VERCEL_ENV` leeg is. De build faalt, en de vorige deploy blijft staan.

### Documentatie
- README:
  - Intro over stoppen bij een Preview met het productieproject en over de falende build zonder `VERCEL_ENV`.
  - Stap 1 zwakker geformuleerd. Authorized domains schermen het inloggen met e-mail en wachtwoord niet af. De API-keybeperking wordt genoemd met de kanttekening over de scripts, met het advies om die nu niet in te stellen. Zelfregistratie moet uit staan.
  - Stap 3: `VITE_OMGEVING=Productie` heeft Preview en Development uit; Preview krijgt `VITE_OMGEVING=Test` en de testwaarden voor alle branches. Controle op zeven sleutels en op de zichtbaarheid van de systeemvariabelen.
  - Stap 4: controle dat de console op live geen `[clubKOMPAS]`-waarschuwing toont.
  - Stap 5: controle in een privévenster. Nieuw kopje "Tester toevoegen": liever een Shareable Link, en de voorwaarden om de bescherming toch uit te zetten.
  - Stap 7 omgedraaid: eerst de CNAME weg, dan controleren met `dig` dat de uitvoer leeg is, dan Vercel, Firebase en de API-key.
  - Nieuwe alinea "Uitwijkroute als Vercel uitvalt".
  - Tabel "Als `tst.` niet klopt": rij 1 zegt nu "HCA-account werkt wel of niet". Rij 2 is nu de stoppagina, voor elke Preview met productiewaarden. De M16-rijen zijn nauwkeuriger geformuleerd.
- `.claude/specs/P0f-gebruikersreis.md`: in het conceptbericht aan HCA zijn de antiphishingzin en de zin over de wachtwoordmanager toegevoegd, en "de domeinen" is vervangen door "je clubgegevens, pijlers, domeinen en alles wat je hebt ingevuld".
- `.claude/docs/P0e-technisch.md`: nieuwe sectie "P0f" met de adressen, `__VERCEL_ENV__`, de SOORT-tabel, de configFout-tabel, de beperking, het inlogscherm en de werkwijze test → main. Bestaande secties zijn niet herschreven.
- `CHANGELOG.md`: twee regels toegevoegd onder "Ongepubliceerd".
- Niet aangepast: de backlog (doet de hoofdsessie) en stap 7 in `.claude/specs/P0f-adressen.md` §3, die nog de oude volgorde noemt (alleen de README is omgedraaid).

### Verificatie herstelronde
- `node --check` slaagt voor `src/main.js`, `src/firebase.js` en `vite.config.js`. `npm run build` slaagt.
- De 7 controles slagen opnieuw: 1 `test-met-productie`; 2 en 3 geen stop, geen balk, warn; 4 Test-balk; 5 `gemengde-config`; 6 dev geeft Ontwikkel; 7 dev:productie geeft de oranje balk. De echte `.env.test.local` en `.env.productie.local` doorstaan de nieuwe appId-controle.
- Nieuwe gevallen:
  - Preview met productiewaarden zonder label: `test-met-productie`. OK.
  - Preview met productiewaarden en label `Productie`: `test-met-productie`. OK.
  - `VERCEL_ENV=development` met label Productie en productiewaarden: `test-met-productie`. OK.
  - Preview, testproject, appId die niet bij de senderId past: `gemengde-config` (online). OK.
  - Lokale build, testproject, appId die niet bij de senderId past: `gemengde-config` (lokaal). OK.
  - Production met een niet-passende appId (label Productie of Test): geen stop, geen balk, alleen een warn. OK.
  - Lokale build met productiewaarden en label Productie: geen stop (ongewijzigd). OK.
  - Production zonder configuratie: alleen `geen-config`. OK.
  - `VERCEL=1` zonder `VERCEL_ENV`: build faalt met exitcode 1 en een duidelijke melding. `VERCEL=1 VERCEL_ENV=production` bouwt gewoon. OK.

## Status
Klaar voor kwaliteitscontrole (na de herstelronde). Niet gecommit, niet gepusht, geen branch `test` aangemaakt.
