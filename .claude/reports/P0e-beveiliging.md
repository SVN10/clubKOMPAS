# Beveiligingsrapport: P0e — Aparte testomgeving

Gescand: alle ongecommitte wijzigingen (`git diff`) en de nieuwe bestanden `scripts/lib/omgeving.mjs`, `scripts/regels.mjs`, `scripts/seed-testclub.mjs`, `firebase.json`, `.firebaserc`, `.env.test.local.voorbeeld`, en daarnaast `.gitignore`, `package.json`/`package-lock.json`, `src/firebase.js`, `src/main.js` en de vijf aangepaste scripts. Specs `P0e-*.md` en `P0e-bouwverslag.md` gelezen. Ik heb niet ingelogd, geen schrijvende scripts gedraaid en niets gewijzigd (alleen `npm audit`, dat niets schrijft).

## Gecontroleerd zonder bevinding

- **Geheimen in git**: `.env`, `.env.productie.local` en `.env.test.local` vallen onder `.gitignore` (`.env`, `*.local`, `.env.*.local`; nagegaan met `git check-ignore -v`). Er staat geen env-bestand in `git ls-files`. `.env.test.local.voorbeeld` is commitbaar en bevat alleen lege sleutels en commentaar. `.firebaserc` en `firebase.json` bevatten alleen projectnamen en het regelpad, dus geen geheimen. `.env` en `.env.productie.local` hebben rechten 600.
- **XSS**: `projectId` en `gebruiker.uid` gaan overal door `esc()`: in de omgevingsbalk, de footer-tooltip (het attribuut staat tussen dubbele aanhalingstekens en `esc` codeert `"`), M2 en M6. De inloghint in de testomgeving wordt opgebouwd met `createElement`/`textContent`. `bestand` in `renderConfigFout` is een constante. Er komt geen gebruikersinvoer in de nieuwe HTML. Bovendien komt `projectId` uit de build-env, niet van de gebruiker.
- **Commando-injectie in `regels.mjs`**: `spawn` draait zonder `shell: true`, met een vaste argumentenlijst. `omgeving` is eerst getoetst aan de lijst `['test','productie']`. Het pad naar de binary komt uit `ROOT/node_modules/.bin`. Er is dus geen injectiepad.
- **Per ongeluk naar productie schrijven (scripts)**: de standaard is `test`. Een onbekende `--omgeving` stopt het script. `leesEnv` leest alleen het gekozen `.env.<omgeving>.local` (geen samenvoeging met `.env`) en controleert dat het project-ID bij de omgeving past, in beide richtingen. Productie zonder `--droog` vraagt om het letterlijk intypen van `svn10-clubkompas`, en dat gebeurt vóór het inloggen. `seed-testclub` weigert productie (`alleenTest`) en de consistentiecheck sluit het productieproject in test uit, dus er zijn twee lagen. `migrate.mjs` weigert altijd. Scripts met `--droog` stoppen in alle gevallen vóór de eerste schrijfactie. Scripts zonder droogmodus (`import-hca`, `opschonen-dubbelen`) weigeren `--droog`, zodat de productiebevestiging niet ongemerkt wordt overgeslagen. Bij twijfel kiest de code de veilige kant: `--droog=1` telt niet als droog, en bij meerdere `--omgeving` geldt de eerste.
- **Regels-deploy**: het project komt uit `.firebaserc` en wordt gecontroleerd met `controleerProject`. De CLI krijgt dezelfde alias via `--project`, die de CLI ook via `.firebaserc` oplost, dus de controle en de deploy wijzen naar hetzelfde project. Productie vraagt de projectnaam. `.firebaserc` heeft geen `default`, waardoor een kale `firebase deploy` geen project heeft. `firebase.json` bevat alleen `firestore.rules`, geen hosting of functions.
- **Lokale app**: als in DEV het productieproject is ingesteld en de modus niet `productie` is, start Firebase niet (`src/firebase.js:9`) en is `onAuthStateChanged` niet actief. In een productiebuild (`DEV` false) verandert er niets.
- **Wachtwoordinvoer**: in een terminal wordt het wachtwoord verborgen ingevoerd met raw mode, zonder echo en zonder sterretjes. Het wachtwoord wordt nergens gelogd of weggeschreven. Foutmeldingen tonen alleen `e.code`.
- **Multi-tenancy en regels**: `firestore.rules` is alleen in het commentaar gewijzigd. De scripts schrijven binnen `clubs/{clubId}`, waarbij het clubId uit `gebruikers/{uid}` komt, net als voorheen.
- **Fictieve data**: de seed bevat alleen de testclub "Testclub clubKOMPAS", functienamen en domeinen, geen persoonsgegevens. Het voorbeeldaccount `test-beheerder@svn10.nl` in de spec is een fictief adres.

## Bevindingen

### 1. Gemengde configuratie zolang `.env` bestaat
**Ernst:** 🟢 Laag
**Type:** Configuratie / omgevingsscheiding
**Locatie:** `src/firebase.js:9` (de controle kijkt alleen naar `projectId`)
**Probleem:** Vite laadt in `--mode test` eerst `.env` en daarna `.env.test.local`. Zolang de oude `.env` (productie) bestaat, neemt een sleutel die *ontbreekt* in `.env.test.local` stilletjes de productiewaarde over. Een lege waarde overschrijft wel. De controle vangt alleen een verkeerd `projectId`. Een voorbeeld: `.env.test.local` heeft wel het test-`PROJECT_ID`, maar mist de regel `API_KEY`/`AUTH_DOMAIN`. Dan gaat het inloggen naar productie-Auth en Firestore naar test. Productiedata wordt daarbij niet gelezen of geschreven, want test-Firestore weigert het productietoken. Wel kan iemand zijn echte productiewachtwoord intypen in wat hij voor de test-app houdt. De scripts hebben dit risico niet, omdat ze alleen het gekozen bestand lezen.
**Aanbeveling:** Voer README-stap 9 (`.env` verwijderen) zo snel mogelijk uit. Voeg daarnaast een goedkope extra controle toe in `src/firebase.js`: zet `configFout` als `authDomain` niet begint met `${projectId}.` (de standaardvorm is `<projectId>.firebaseapp.com`), of als een van de zes sleutels leeg of afwezig is.

### 2. Supply-chain van `firebase-tools`
**Ernst:** 🟢 Laag
**Type:** Dependency-risico
**Locatie:** `package.json` (devDependencies `firebase-tools ^15.37.0`), `package-lock.json`
**Probleem:** `firebase-tools` voegt 578 pakketten toe aan de lockfile. De versies van bestaande pakketten blijven ongewijzigd. Het pakket is echt (juiste naam) en alle 753 `resolved`-URL's wijzen naar `registry.npmjs.org`, met integrity-hashes. `npm audit` meldt in de `firebase-tools`-keten 14 moderate-advisories (o.a. `glob`, `minimatch`, `uuid`, `@opentelemetry/core`, `archiver`). Er zijn geen kritieke. Het gaat om dev-tooling die niet in de browserbundle komt en alleen lokaal draait bij `regels:*`. Eén nieuw pakket heeft een installscript (`re2`). De CLI bewaart zijn login-token buiten de repo (`~/.config/configstore`).
De 4 high-meldingen (`firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`) bestonden al vóór P0e (`@grpc/grpc-js` 1.9.16, `firebase` 13.2.0, beide ongewijzigd). Ze zijn dus geen gevolg van deze wijziging.
**Aanbeveling:** Laat het pakket als devDependency staan en installeer met `npm ci` (de lockfile is leidend). Draai **niet** `npm audit fix --force`, want dat zet `firebase-tools` terug naar 13.11.2. Zet de bestaande high-meldingen in de firebase-SDK-keten als apart backlogpunt ("firebase SDK bijwerken en audit opnieuw draaien"), los van P0e.

### 3. Robuustheid van de verborgen wachtwoordinvoer
**Ernst:** 🟢 Laag
**Type:** Invoerverwerking
**Locatie:** `scripts/lib/omgeving.mjs:122-158` (`vraag`, `vraagVerborgen`)
**Probleem:** (a) Escape-reeksen van pijl- en functietoetsen (`\x1b[A`) komen deels in het wachtwoord terecht: `[A` wordt toegevoegd. Inloggen mislukt dan zonder duidelijke oorzaak, maar er lekt niets. (b) Bij een onverwachte fout tijdens de invoer blijft de terminal in raw mode staan. (c) Zonder TTY (stdin via een pipe) valt de invoer terug op gewone `readline`. Dat is aanvaardbaar, want piped invoer wordt niet geëchood, maar het wachtwoord staat dan wel in de bron van de pipe (bijv. shellgeschiedenis).
**Aanbeveling:** Sla escape-reeksen over (negeer alles vanaf `\x1b` tot en met de afsluitende letter). Zet raw mode ook terug in een `process.on('exit')`-handler. Zet in de README dat wachtwoorden nooit via een pipe of als argument worden meegegeven. Het e-mailadres als argument bij `import-hca` is geen probleem.

### 4. Voorbeeldbestand is commitbaar
**Ernst:** 🟢 Laag
**Type:** Blootgestelde data (preventief)
**Locatie:** `.env.test.local.voorbeeld`
**Probleem:** Het bestand valt bewust niet onder `.gitignore`. Vult iemand per ongeluk het voorbeeld in in plaats van een kopie, dan komen de testwaarden in git. De Firebase-webconfig is geen echt geheim, maar volgens de spec hoort die niet in git. Bij een vergissing met productiewaarden zou het productieproject in de repo staan.
**Aanbeveling:** Het commentaar waarschuwt al. Controleer vóór de commit dat alle zes waarden leeg zijn (`git diff --cached .env.test.local.voorbeeld`). Optioneel: een kleine controle in `scripts/regels.mjs` of een pre-commit-hook die weigert als er na `=` een waarde staat.

### 5. Geen bescherming tegen productieconfig in niet-DEV-builds (bestaand)
**Ernst:** 🟢 Laag
**Type:** Omgevingsscheiding
**Locatie:** `src/firebase.js:9` (alleen `import.meta.env.DEV`), Vercel-instellingen
**Probleem:** De controle werkt alleen lokaal. Een Vercel Preview-deploy van een andere branch die ook de productievariabelen heeft, praat met de echte clubdata. De README (stap 10) noemt dit en P0e verandert er niets aan. Het is een bestaand risico, maar wel relevant zodra CK-020 op branches wordt gebouwd.
**Aanbeveling:** Volg de uitkomst van stap 10 op met een backlogpunt: koppel Preview in Vercel aan de testvariabelen (`clubkompas-test`, `VITE_OMGEVING=Test`).

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 0
- 🟢 Lage aanbevelingen: 5

## Eindoordeel
✅ Veilig voor TST. Geen blokkades. Advies: verwijder `.env` direct na de testinrichting (bevinding 1) en zet de punten 2 en 5 op de backlog.
