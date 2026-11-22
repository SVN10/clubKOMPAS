# P0e — Aparte testomgeving: technische documentatie

De consolestappen om het testproject in te richten staan in `README.md` ("Omgevingen"). Dit document legt de opzet en de keuzes uit. De changelog staat in `CHANGELOG.md`.

## Uitgangspunt

Twee Firebase-projecten: `svn10-clubkompas` (productie) en `svn10-clubkompas-test`. Alles is gericht op één ding: per ongeluk niet in productie schrijven. Test is overal de standaard; productie vraagt altijd een bewuste handeling. Let op: de test-ID begint met de productie-ID. Daarom zijn alle vergelijkingen exact (`===`), nooit `startsWith` of `includes` op een project-ID. Enige uitzondering is de authDomain-controle `${projectId}.`, waar de punt de verwarring uitsluit.

## Omgevingen en .env-bestanden

| Commando | Vite-modus | Bestand(en) | Gedrag |
|---|---|---|---|
| `npm run dev` | `test` | `.env.test.local` (daarna `.env.test`, `.env.local`, `.env`) | test-app |
| `npm run dev:productie` | `productie` | `.env.productie.local` | bewust tegen productie, oranje balk |
| `npm run build` | `production` | `.env` | Vercel; gedrag ongewijzigd |

- `*.local` en `.env` staan in `.gitignore`. Alleen `.env.test.local.voorbeeld` staat in git, met lege waarden (de kop zegt: nooit invullen).
- Vite vult ontbrekende sleutels uit `.env` aan. Dat is de bron van het gemengde-configuratierisico (zie hieronder); de oplossing is `.env` na de inrichting te verwijderen.
- Scripts lezen niet via Vite maar via `scripts/lib/omgeving.mjs` rechtstreeks `.env.<omgeving>.local`. Ze gebruiken `.env` niet meer.

## src/firebase.js: configFout

`configFout` is `null` of een van deze varianten. Bij een fout wordt Firebase niet geïnitialiseerd (`auth` en `db` zijn dan `null`) en toont `src/main.js` een foutpagina (`renderConfigFout`) in plaats van de app.

| Waarde | Wanneer | Waar actief | Pagina |
|---|---|---|---|
| `geen-config` | `projectId` leeg | overal | lokaal M1 met bestandsnaam (volgt de modus); in een build M1 "tijdelijk niet beschikbaar" |
| `productie-lokaal` | `DEV`, project is productie, modus is niet `productie` | alleen DEV | M2, oranje rand (`.kaart-gestopt`) |
| `gemengde-config` | `DEV` en: een van de zes waarden leeg, óf `authDomain` begint niet met `${projectId}.`, óf (modus `test`) niet alle zes sleutels staan echt in het modusbestand | alleen DEV | "Gestopt: de configuratie is onvolledig of gemengd", oranje rand |

De controles gelden bewust niet live: een afwijkend authDomain of ontbrekende `storageBucket` in Vercel mag de live app niet breken. De build faalt ook nooit op ontbrekende config; de app toont dan M1.

### __MODUS_SLEUTELS__

`vite.config.js` leest per modus `.env.<mode>` en `.env.<mode>.local` zelf in en geeft de namen van de Firebase-sleutels die daar echt (niet leeg) staan door als `define`-constante `__MODUS_SLEUTELS__` (JSON-array). Waarom: in de app is niet te zien of een waarde uit het modusbestand of uit `.env` komt. Ontbreekt alleen `apiKey` in `.env.test.local`, dan vult Vite die aan uit `.env` en logt de app in bij productie terwijl project-ID en authDomain er goed uitzien. De lijst `FIREBASE_SLEUTELS` staat daarom zowel in `vite.config.js` als in `src/firebase.js`; houd ze gelijk.

## src/main.js: SOORT

`SOORT` wordt afgeleid van `VITE_OMGEVING` (hoofdletterongevoelig) en de modus:

| SOORT | Wanneer | Effect |
|---|---|---|
| `productie-lokaal` | `DEV` en modus `productie` | oranje balk, tabtitel "PRODUCTIE LOKAAL · clubKOMPAS", oranje footervlak met project-ID |
| `test` | `VITE_OMGEVING=Test` | petrolkleurige balk, tabtitel "TEST · …", hint M5 op het inlogscherm (bij verkeerde inloggegevens), hint M6 op "Geen club gekoppeld" |
| `productie` | `VITE_OMGEVING=Productie`, niet lokaal | geen balk, tabtitel ongewijzigd, footer "Productie · Versie …" |
| `ontwikkel` | anders | geen balk |

`toonOmgevingsBalk()` voegt een `div.omgeving-balk` (`role="note"`) toe aan `body` en zet `body.met-omgeving-balk`. Alle teksten gebruiken `projectId` uit `firebase.js`; er staan geen vaste test-ID's in de app. De bijbehorende CSS staat onderaan `src/style.css` in het blok `/* ── Omgevingen (P0e) ── */`. Token `--on-orange` (#111212, licht en donker) is de tekstkleur op oranje vlakken, ook gebruikt in `.btn.primary`. Het inlogscherm vult met balk de resterende hoogte via `#app:has(> .inlog-wrap)` als flex-kolom (geen `calc(100vh - …)`).

## scripts/lib/omgeving.mjs

Gedeelde basis voor alle scripts; niets in de lib logt in of schrijft zelf.

| Export | Doet |
|---|---|
| `PRODUCTIE_PROJECT_ID`, `TEST_PROJECT_ID`, `OMGEVINGEN`, `ROOT`, `DROOG` | constanten (`DROOG` = `--droog` in argv) |
| `kiesOmgeving(argv, niets)` | leest `--omgeving=`; standaard `test`; stopt bij onbekende waarde of meer dan één keer opgegeven |
| `envBestand(omgeving)` | `.env.<omgeving>.local` |
| `leesEnv(omgeving, map)` | leest dat bestand; stopt als het ontbreekt of geen project-ID heeft; roept `controleerProject` aan |
| `controleerProject(omgeving, projectId, bron, niets)` | stopt bij test+productie-ID of productie+andere ID |
| `controleerVoorbeeld(niets, map)` | stopt als er in `.env.test.local.voorbeeld` een waarde staat (`VITE_OMGEVING` telt niet) |
| `firebaseConfigUit(env)` | zes `VITE_FIREBASE_*` naar een SDK-configobject |
| `kopregel(soort, omgeving, projectId, { droog })` | gekleurde regel TEST/PRODUCTIE met project-ID |
| `productiebevestiging(projectId, opties)` | vraagt de projectnaam; alles behalve een exacte match is AFGEBROKEN |
| `startScript({ droogMogelijk, alleenTest })` | kiest omgeving, controleert, toont kopregel, vraagt bij productie (zonder `--droog`) bevestiging, waarschuwt bij een resterende `.env`. Levert `{ omgeving, projectId, firebaseConfig, droog }` |
| `stop`, `waarschuw`, `gelukt` | uitvoerblokken (GESTOPT/AFGEBROKEN, LET OP, KLAAR); `stop` doet `process.exit(1)`. Kleur alleen op een TTY en zonder `NO_COLOR`. Inspringing is `max(9, label + 2)` |
| `argumenten()` | argv zonder `--`-vlaggen (e-mailadres e.d.) |
| `vraag`, `vraagVerborgen` | invoer; verborgen = raw mode zonder echo, negeert escape-reeksen (CSI/SS3, ook over meerdere stukken), zet raw mode altijd uit (Enter, Ctrl+D, Ctrl+C, stdin-fout, `exit`) |
| `inloggen`, `zoekClubId`, `geweigerd` | login met begrijpelijke fout (M13), `gebruikers/{uid}.clubId` opzoeken (M11), permission-denied met oorzaken per omgeving (M12) |

Volgorde in `startScript` is bewust: omgeving, voorbeeldcheck, env, project-ID-check, kopregel, bevestiging, en pas daarna mag het script inloggen. Wachtwoorden nooit via argv of pipe.

Per script: `--droog` bestaat bij `migreer-club`, `inrichten-*` en `seed-testclub`. `import-hca` en `opschonen-dubbelen` kennen het niet en stoppen erop (anders zou de kopregel DROOG tonen en de bevestiging vervallen terwijl het script wél schrijft). `migrate.mjs` weigert altijd: het is verouderd (werkt op `clubs/{uid}`) en de oude code staat in git.

## scripts/regels.mjs

Publiceert `firestore.rules` via `firebase deploy --only firestore:rules --project <alias>` (CLI uit `node_modules/.bin`, `firebase-tools` als devDependency). Het alias komt uit `.firebaserc` (`test`, `productie`; bewust geen `default`, zodat een vergeten `--project` nooit raadt). Het script controleert het project-ID uit `.firebaserc` met `controleerProject`, vraagt bij productie eerst "Heb je dit in test gecontroleerd?" plus de projectnaam, en vertaalt CLI-fouten naar M14 (niet ingelogd) en M15 (geen toegang). Gebruik: `npm run regels:test` en `npm run regels:productie`. Aanpassing van het testproject-ID vraagt ook een wijziging in `.firebaserc`.

## scripts/seed-testclub.mjs

Vult alleen test (`startScript({ alleenTest: true })`; productie geeft M10, en `controleerProject` is een tweede slot). Schrijft clubprofiel, 6 bestuursfuncties en 15 domeinen in één `writeBatch`, idempotent op naam (lowercase, getrimd): bestaand wordt bijgewerkt met `merge`, ontbrekend toegevoegd, niets verwijderd. Items die niet in de seedlijst staan blijven ongemoeid en geven een LET OP. Het script maakt géén `clubs/{clubId}`, `leden` of `gebruikers`: die staan buiten de regels voor schrijven (`write: if false`) en worden in de testconsole handmatig aangemaakt. De domeinlijst is gekopieerd uit de HCA-inrichtscripts; omschrijvingen die daar ontbreken blijven weg. Draai eerst met `--droog`.

## Beveiligingslagen

Van buiten naar binnen; elke laag werkt ook als de vorige faalt.

1. **Standaard test**: `npm run dev` en alle scripts kiezen test zonder argument.
2. **Aparte config per omgeving**: `.env.test.local` en `.env.productie.local`, beide buiten git.
3. **Exacte project-ID-controle** in app (`configFout`) en lib (`controleerProject`), met een omgevingskeuze die altijd moet kloppen met het bestand.
4. **Gemengde configuratie-controle** via `__MODUS_SLEUTELS__` en de authDomain-check (alleen lokaal).
5. **Bevestiging bij productie**: projectnaam intypen (scripts) of `dev:productie` (app); `regels:productie` vraagt eerst of test is gecontroleerd.
6. **Zichtbaarheid**: omgevingsbalk, tabtitel, footer en kopregel in de terminal, zodat je ziet waar je zit. Het signaal zit ook in de tekst, niet alleen in kleur.
7. **Seed alleen test**, **voorbeeldbestand moet leeg blijven**, **geen import/export van productie naar test** (README: alleen fictieve data in test, AVG).
8. **Firestore-regels** zijn per project dezelfde bron (`firestore.rules`) en worden eerst in test gepubliceerd.

## Bekende beperkingen

- `.env` (productie) blijft staan tot Paul hem zelf verwijdert (README, stap 9). Tot die tijd toont de scripts LET OP en vangt `gemengde-config` het ontbrekende-sleutelgeval af.
- Lokaal geeft `dev:productie` met een test-ID geen fout (de veilige kant op).
- Live (Vercel) heeft geen configFout-controles op gemengde waarden; zie backlog hieronder.
- Alleen de mislukkingspaden zijn getest met nep-env. Inloggen, seed-schrijven, `regels:test`, M11 tot en met M15 in het echt, en de schermen in een browser zijn niet gezien.
- `npm install` slaat installatiescripts van o.a. `re2` en `protobufjs` over (npm-beleid); `deploy` werkt via `npx firebase`. Installeer met `npm ci` en draai nooit `npm audit fix --force`: dat zet `firebase-tools` terug naar een oudere hoofdversie.
- Specs en de eerste kwaliteitsrapporten noemen nog het oude test-ID `clubkompas-test`; het echte ID is `svn10-clubkompas-test`.

## Backlogpunten buiten P0e

- **Vercel Preview** koppelen aan de testvariabelen (`svn10-clubkompas-test`, `VITE_OMGEVING=Test`). Nu kan Preview met productiewaarden met echte data praten; sluit aan op de wens van een online test-URL.
- **Firebase SDK bijwerken** en `npm audit` opnieuw draaien (bestaande high-meldingen in de SDK-keten; de 14 moderate meldingen in `firebase-tools` zijn dev-tooling).
- **Foutkleur in donkere modus**: `.form-fout` haalt daar de contrastnorm niet. Voorstel: token `--fout` per modus (`#c0392b` licht, `#FF8A7A` donker) en `.form-fout { color: var(--fout) }`. Raakt ook de nieuwe inlogfout.
- **Productieregio en verwerkersvoorwaarden** vaststellen en vastleggen (regio is niet te wijzigen; ligt productie buiten de EU, dan eigen punt voor verhuizing of risicoafweging).
