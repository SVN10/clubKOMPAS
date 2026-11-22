# Specificatie: P0e — Aparte testomgeving

## Wat wordt er gebouwd?
Een tweede, los Firebase-project `clubkompas-test` met een eigen testclub, zodat de lokale app (`npm run dev`, localhost:5173) en alle scripts standaard naar test gaan in plaats van naar de echte HCA-data in `svn10-clubkompas`. Scripts kiezen hun doelomgeving expliciet, tonen altijd naar welk project ze schrijven en weigeren productie zonder extra bevestiging. Een seed-script vult de testclub met de 15 domeinen en 6 bestuursfuncties. Dit moet klaar zijn vóór CK-020 (nieuwe collectie `vermogens`, nieuwe regels, import).

## Afbakening
**Wel**
- Tweede Firebase-project (test) met Auth (e-mail/wachtwoord) en Firestore in de EU.
- Lokale app draait standaard tegen test; footer toont "Test".
- Gedeelde omgevingskeuze voor alle `scripts/*.mjs` + veiligheidscheck.
- Seed-script voor de testclub.
- Regels publiceren per omgeving (Firebase CLI, met handmatig alternatief).
- README bijwerken.

**Niet**
- Geen online test-URL (preview-deploy met testconfig). Kan later, zie open vraag 4.
- Geen geautomatiseerde tests of CI.
- Geen wijziging aan de live deploy of aan HCA-data.
- Geen kopie van echte HCA-data naar test (AVG: testdata is fictief).

## Aanbevolen aanpak: tweede echt Firebase-project
**Aanbeveling:** een apart project `clubkompas-test` op het gratis Spark-abonnement.

Waarom:
- Paul is geen ontwikkelaar. Een tweede project werkt precies als live: zelfde console, zelfde inlogscherm, zelfde regels. Geen extra software, geen processen die moeten draaien.
- Regels worden echt afgedwongen zoals in productie; de Rules Playground werkt ook in test. Dat is precies wat CK-020 nodig heeft.
- Data blijft bewaard tussen sessies; Paul kan zelf in de console kijken wat een script heeft gedaan.
- Kosten: nihil binnen de gratis limieten.

**Afgewogen alternatief: Firebase Local Emulator Suite.**
Voordelen: volledig offline, gratis, snel resetten, geschikt voor geautomatiseerde regeltests. Nadelen voor deze situatie: vereist Java en `firebase-tools`, moet bij elke sessie in een terminal draaien, data verdwijnt standaard bij afsluiten, aparte emulator-UI in plaats van de bekende console, en extra code (`connectAuthEmulator`/`connectFirestoreEmulator`) in app en scripts. Te veel bewegende delen voor de PO. De emulator kan later alsnog worden toegevoegd voor geautomatiseerde regeltests; dat staat de aanbeveling niet in de weg.

## Gebruikersreis (samenvatting)
1. Paul maakt eenmalig het testproject aan in de console (stappen hieronder) en zet de config in `.env.test.local`.
2. De bouwer verplaatst de huidige `.env` naar `.env.productie.local`.
3. Paul maakt in de testconsole een testgebruiker en de koppeldocumenten aan, draait `node scripts/seed-testclub.mjs` en ziet in de console de testclub verschijnen.
4. `npm run dev` opent de app tegen test; footer toont "Test · Versie x".
5. Scripts draaien standaard tegen test. Voor productie: `--omgeving=productie` plus het projectnummer intypen.
6. Regels: eerst `npm run regels:test`, testen, daarna `npm run regels:productie`.

## Betrokken bestanden

### Configuratie (lokaal, niet in git)
- `.env` — **verdwijnt**. Inhoud verhuist naar `.env.productie.local`. Reden: Vite laadt `.env` in elke modus; een ontbrekende sleutel in het testbestand zou anders stilletjes de productiewaarde overnemen.
- `.env.test.local` — nieuw: `VITE_FIREBASE_*` van `clubkompas-test` + `VITE_OMGEVING=Test`.
- `.env.productie.local` — nieuw: huidige productieconfig + `VITE_OMGEVING=Productie`. Alleen voor scripts; de live build krijgt zijn waarden uit het dashboard van de hostingdienst (niet uit de repo).
- Beide vallen al onder `.gitignore` (`*.local`, `.env.*.local`). Geen wijziging nodig.

### Code
- `package.json`
  - `"dev": "vite --mode test"` (laadt `.env.test.local`).
  - `"dev:productie": "vite --mode productie"` — alleen voor noodgevallen; de app toont dan een duidelijke waarschuwing (zie firebase.js).
  - `"regels:test": "firebase deploy --only firestore:rules --project test"`
  - `"regels:productie": "firebase deploy --only firestore:rules --project productie"`
  - `firebase-tools` als devDependency (zodat Paul niets globaal hoeft te installeren).
  - `"build"` ongewijzigd (de hostingdienst gebruikt zijn eigen env-variabelen).
- `src/firebase.js`
  - Constante `PRODUCTIE_PROJECT_ID = 'svn10-clubkompas'` (geen geheim; staat al in de live bundle).
  - Veiligheidscheck: als `import.meta.env.DEV` én `projectId === PRODUCTIE_PROJECT_ID` én `import.meta.env.MODE !== 'productie'` → niet initialiseren, foutmelding tonen ("Lokale app wijst naar productie. Gebruik npm run dev (test)."). Zo kan een achtergebleven `.env` nooit ongemerkt live data raken.
  - Als `projectId` leeg is: duidelijke melding "Geen Firebase-configuratie gevonden (.env.test.local ontbreekt?)" in plaats van een cryptische Firebase-fout.
- `src/main.js`
  - Footer: logica `VITE_OMGEVING || 'Ontwikkel'` blijft. Label "Test" komt uit `.env.test.local`.
  - Bij `MODE === 'productie'` in dev: label "Productie (lokaal)" in oranje `#FF9E16` als visuele waarschuwing. Klein; geen nieuwe component.
- `scripts/lib/omgeving.mjs` — **nieuw**, gedeeld door alle scripts:
  - `kiesOmgeving()` leest `--omgeving=test|productie` uit `process.argv`; **standaard `test`**. Onbekende waarde → stoppen.
  - Leest `../.env.<omgeving>.local` (vervangt de 6 gekopieerde `leesEnv()`-functies). Bestand ontbreekt → stoppen met uitleg welk bestand nodig is.
  - Consistentiecheck: `test` met projectId `svn10-clubkompas` → stoppen. `productie` met een ander projectId → stoppen.
  - Toont altijd vóór het inloggen een kopregel, bv. `DOEL: TEST — project clubkompas-test` of `DOEL: PRODUCTIE — project svn10-clubkompas (echte clubdata)`.
  - Bij `productie` zonder `--droog`: Paul moet het projectnummer (`svn10-clubkompas`) letterlijk intypen; anders afbreken, niets geschreven.
  - Exporteert ook `vraag()` en `vraagVerborgen()` (nu 6x gekopieerd) en `firebaseConfig`.
- `scripts/import-hca.mjs`, `migrate.mjs`, `migreer-club.mjs`, `opschonen-dubbelen.mjs`, `inrichten-domeinen-hca.mjs`, `inrichten-beheer-hca.mjs` — eigen `leesEnv`/`vraag`/`vraagVerborgen` vervangen door `scripts/lib/omgeving.mjs`. Verder geen gedragswijziging. Gebruiksregel bovenin bijwerken met `[--omgeving=test|productie]`.
- `scripts/seed-testclub.mjs` — **nieuw** (zie onder).
- `firebase.json` — nieuw, minimaal: `{ "firestore": { "rules": "firestore.rules" } }`. Géén hosting-sectie (live hosting blijft zoals hij is).
- `.firebaserc` — nieuw: aliassen `test` → `clubkompas-test`, `productie` → `svn10-clubkompas`. Projectnamen zijn geen geheim.
- `firestore.rules` — kopcommentaar aanpassen: "Publiceren via `npm run regels:test`, daarna `npm run regels:productie`." Regels zelf ongewijzigd.
- `README.md` — nieuwe sectie "Omgevingen (test en productie)" met de stappen hieronder; sectie Firestore-regels bijwerken (CLI eerst naar test; console-plakken blijft als terugvaloptie).

### Seed-script `scripts/seed-testclub.mjs`
- Weigert hard bij `--omgeving=productie` (ook met bevestiging). Draait alleen tegen test.
- Ondersteunt `--droog`.
- Logt in als de testgebruiker (e-mail/wachtwoord gevraagd, verborgen), zoekt `gebruikers/{uid}.clubId` op, zoals de bestaande scripts.
- Idempotent (op naam, zoals `inrichten-beheer-hca.mjs`): bestaande items bijwerken, ontbrekende toevoegen, niets verwijderen. Twee keer draaien = geen dubbelen.
- Schrijft met `writeBatch`:
  - `instellingen/profiel`: `naam: "Testclub clubKOMPAS"`, `afkorting: "TST"`, `seizoen: "2026–2027"`, geen logo.
  - `bestuursfuncties`: de 6 functies (Voorzitter, Secretaris, Penningmeester, Bestuurslid Hockey, Bestuurslid Accommodatie, Bestuurslid Hospitality).
  - `structuurelementen`: de 15 domeinen met `type`, `naam`, `omschrijving`, `icoon`, `volgorde` 1–15 en `bestuursfunctieId`, overgenomen uit `DOMEINEN` in `inrichten-domeinen-hca.mjs` en `NIEUWE_DOMEINEN`/`KOPPELING` in `inrichten-beheer-hca.mjs` (3 pijlers, 10 ondersteunend, 2 overkoepelend). Pijlernamen mogen de HCA-hashtags houden; het zijn geen persoonsgegevens.
- Schrijft **niet** `clubs/{clubId}`, `leden` en `gebruikers`: de regels verbieden dat vanuit de client (terecht). Die maakt Paul in de console (stap 6 hieronder). Bewuste keuze: geen service-account-sleutel (firebase-admin) op de laptop.
- Maakt geen echte persoonsgegevens aan.

## Handmatige stappen voor Paul (eenmalig)

**1. Project aanmaken**
console.firebase.google.com → **Project toevoegen** → naam `clubkompas-test` → Google Analytics **uit** → Project maken. Noteer de project-ID (staat onder de naam; als `clubkompas-test` bezet is, krijgt hij een achtervoegsel, geef die door aan de bouwer).

**2. Web-app registreren (voor de configuratie)**
Projectoverzicht → tandwiel → **Projectinstellingen** → onderaan **Je apps** → het `</>`-icoon → bijnaam `clubKOMPAS test` → Firebase Hosting **niet** aanvinken → Registreren. Je ziet een blok `firebaseConfig` met zes waarden. Geef die aan de bouwer (of zet ze zelf in `.env.test.local` volgens het voorbeeld in de README). Deze waarden zijn niet geheim, maar horen niet in git.

**3. Inloggen met e-mail en wachtwoord aanzetten**
Menu links **Build → Authentication** → Aan de slag → tabblad **Aanmeldmethode** → **E-mail/wachtwoord** → bovenste schakelaar aan → Opslaan. `localhost` staat standaard bij Instellingen → Geautoriseerde domeinen; niets aan doen.

**4. Firestore aanmaken in de EU**
**Build → Firestore Database** → Database maken → editie **Standard** → locatie: **dezelfde als productie** (zie open vraag 2; advies `europe-west4` Nederland of `eur3` Europa). Let op: de locatie is daarna niet meer te wijzigen. Kies **Starten in productiemodus** (alles dicht).

**5. Regels publiceren (eenmalig inloggen met de CLI)**
In de terminal in de projectmap:
- `npx firebase login` (browser opent, inloggen met het Google-account van Firebase) — één keer per computer.
- `npm run regels:test` → melding "Deploy complete". Controle: in de testconsole bij Firestore → Regels staat nu dezelfde tekst als `firestore.rules`.
- Lukt de CLI niet: plak `firestore.rules` in de testconsole (Firestore → Regels → Publiceren), zoals nu bij productie.

**6. Testgebruiker en testclub koppelen** (zelfde procedure als README "gebruiker aan club koppelen", maar in het **testproject**)
- Authentication → Gebruiker toevoegen: bv. `test-beheerder@svn10.nl` (mag een niet-bestaand adres op eigen domein zijn) met een wachtwoord dat je in je wachtwoordmanager bewaart. Noteer de uid.
- Firestore → Collectie starten `clubs` → document-ID: **Automatische ID** → veld `naam` (string) `Testclub clubKOMPAS` → Opslaan. Noteer het document-ID (= testclubId).
- In dat document: subcollectie `leden` → document-ID = de uid → velden `rol` (string) `beheerder`, `email` (string) het e-mailadres, `toegevoegdOp` (timestamp) nu.
- Collectie `gebruikers` → document-ID = de uid → veld `clubId` (string) = testclubId.

**7. Seed-data**
`node scripts/seed-testclub.mjs --droog` (toont wat er komt), daarna `node scripts/seed-testclub.mjs` → inloggen met de testgebruiker → "ja". Controle: `npm run dev`, inloggen met de testgebruiker → Home toont 15 domeinen, footer "Test".

**8. Controle live**
In het dashboard van de hostingdienst (de dienst die automatisch vanaf GitHub `main` publiceert) nagaan dat `VITE_OMGEVING=Productie` en de `VITE_FIREBASE_*`-waarden daar staan. Er wordt daar niets gewijzigd.

## Acceptatiecriteria
- [ ] `npm run dev` start de app tegen `clubkompas-test`; de footer toont "Test · Versie …"; inloggen met de testgebruiker toont de testclub met 15 domeinen en 6 bestuursfuncties.
- [ ] Ieder script in `scripts/` gaat zonder `--omgeving` naar test en toont vóór het inloggen een kopregel met omgeving en project-ID.
- [ ] `--omgeving=productie` (zonder `--droog`) schrijft pas na het letterlijk intypen van `svn10-clubkompas`; elk ander antwoord breekt af zonder schrijven. `seed-testclub.mjs` weigert productie altijd.
- [ ] Wijst de lokale app (dev, niet `--mode productie`) toch naar `svn10-clubkompas`, dan initialiseert Firebase niet en ziet de gebruiker een duidelijke melding.
- [ ] `npm run regels:test` publiceert `firestore.rules` naar test zonder productie te raken; README beschrijft de volgorde test → controleren → productie.
- [ ] Live app (vanaf `main`) werkt na de wijziging ongewijzigd: inloggen HCA, footer "Productie", data zichtbaar.

## Wat mag er niet kapotgaan?
- De live deploy vanaf GitHub `main` en de HCA-data (`zVlRYYHjyFc42lACQhdr`).
- Bestaande scriptfunctionaliteit (`--droog`, "ja"-bevestiging, verborgen wachtwoordinvoer).
- Beveiligingsregels: `firestore.rules` inhoudelijk ongewijzigd.
- Footerweergave in productie ("Productie · Versie …").
- `npm run build`.

## Architectuurlaag
Platform (P0) — infrastructuur en werkwijze die alle clubs en features raakt; geen gebruikersfunctionaliteit.

## Randgevallen en risico's
- **Achtergebleven `.env`**: Vite laadt die altijd. Afgevangen door de projectId-check in `firebase.js` en door `.env` te verwijderen. Scripts lezen `.env` niet meer; ze waarschuwen als het bestand nog bestaat.
- **Regels naar verkeerd project**: `firebase deploy` zonder `--project` pakt het standaardproject. `.firebaserc` krijgt daarom **geen** `default`; de npm-scripts noemen het project altijd expliciet.
- **Per ongeluk publiceren in productie** (gebeurde al tijdens P0c, zie migratielogboek): door eerst in test te publiceren en te controleren vervalt de noodzaak om in de productieconsole te experimenteren. Rules Playground voortaan in test.
- **Twee projecten uit de pas**: regels via de repo naar beide projecten; seed-script idempotent zodat test opnieuw gelijk te trekken is.
- **Firestore-locatie** niet wijzigbaar na aanmaken; testproject moet bij productie passen (open vraag 2).
- **Hostingdienst staat niet in de repo** (geen config-bestand, geen vermelding in README/CHANGELOG). De deploy-instellingen staan in het dashboard van die dienst; de bouwer wijzigt daar niets. Wel in de README noteren welke dienst het is.
- **`firebase-tools`** is een grote devDependency; de live build hoeft hem niet te gebruiken. Alternatief: `npx firebase-tools` zonder installatie (langzamer).
- **Testgebruiker-wachtwoord** nooit in een bestand of script; altijd vragen.
- **Testdata** is fictief; geen echte namen of e-mailadressen van HCA-leden in test.

## Open vragen voor Paul
1. **Welke hostingdienst publiceert de live app vanaf GitHub (bv. Vercel, Netlify, Cloudflare Pages)?** Advies: noteren in de README en in het dashboard controleren dat `VITE_OMGEVING=Productie` staat. Er hoeft niets te veranderen.
2. **In welke regio staat de productie-Firestore?** (Console productie → Firestore → bovenaan / Projectinstellingen → "Standaardlocatie voor Google Cloud-resources".) Advies: test in dezelfde regio; staat productie buiten de EU, dan is dat een apart punt voor de verwerkersovereenkomst/EU-regio, niet voor P0e.
3. **Regels voortaan via de Firebase CLI publiceren, ook voor productie?** Advies: ja, voor test direct; voor productie ook, via `npm run regels:productie` na controle in test. Console-plakken blijft als terugvaloptie in de README.
4. **Wil je ook een online test-URL (bv. een preview-site met testconfig) om op telefoon of met anderen te testen?** Advies: nu niet; eerst lokaal. Later eenvoudig toe te voegen via een tweede site of preview-omgeving bij de hostingdienst met de testwaarden.

## Antwoorden van Paul (22 november 2026)
1. Hosting: **Vercel** (publiceert automatisch vanaf GitHub `main`). Opnemen in de README; in Vercel → Project → Settings → Environment Variables nagaan dat `VITE_OMGEVING=Productie` en de `VITE_FIREBASE_*`-waarden staan.
2. Regio productie-Firestore: **eur3** (multiregio EU), vastgesteld 22 november 2026. Test komt ook in eur3.
3. Regels voortaan via de Firebase CLI (eerst test, dan productie); console blijft terugval. **Akkoord.**
4. Geen online test-URL voor nu; eerst lokaal. **Akkoord.**

## Bijstellingen na de gebruikersreis (22 november 2026)
Overgenomen uit `.claude/specs/P0e-gebruikersreis.md`:
1. **Regels via een wrapper `scripts/regels.mjs`** (`npm run regels:test` / `regels:productie` roepen dit aan): toont de kopregel `REGELS NAAR: TEST/PRODUCTIE — project …`, vraagt voor productie het letterlijk intypen van `svn10-clubkompas`, en vertaalt veelvoorkomende CLI-fouten (niet ingelogd, geen toegang) naar klare taal.
2. **Meldingen** M5, M6, M11 en M12 uit de gebruikersreis worden gebouwd (naast M1/M2): scripts noemen het ontbrekende document en bij `permission-denied` als eerste oorzaak "regels nog niet naar test gepubliceerd"; in de app een extra regel bij Test.
3. **Vercel-controle (consolestap 8):** ook nagaan voor welke omgevingen (Production/Preview/Development) de `VITE_FIREBASE_*`-waarden gelden; noteren, niet wijzigen binnen P0e.
4. **README:** `npm install` na het bijwerken, `npx firebase login:list`, en dat lokaal `build`/`preview` geen configuratie meer heeft zonder `--mode`.
5. Een gekleurde omgevingsbalk bovenaan is ter beoordeling van de Ontwerp-medewerker.
