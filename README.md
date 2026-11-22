# clubKOMPAS
Verenigingsbeheer voor sportclubs

## Omgevingen (ontwikkel, test en productie)

clubKOMPAS heeft twee Firebase-projecten en drie omgevingen:

| Omgeving | Adres | Vercel | Firebase-project | Balk bovenaan | Footer | Tabtitel |
|---|---|---|---|---|---|---|
| **Ontwikkel** | `localhost:5173` (`npm run dev`) | – | `svn10-clubkompas-test` | petrol: "Ontwikkelomgeving · op deze computer · project svn10-clubkompas-test · fictieve data" | Ontwikkel · Versie … | ONTWIKKEL · clubKOMPAS |
| **Test** (online) | `tst.clubkompas.svn10.nl` | Preview, branch `test` | `svn10-clubkompas-test` | petrol: "Testomgeving · online · project svn10-clubkompas-test · fictieve data" | Test · Versie … | TEST · clubKOMPAS |
| **Productie** (live) | `clubkompas.svn10.nl` | Production, branch `main` | `svn10-clubkompas` | **geen** | Productie · Versie … | clubKOMPAS |
| (oud) | `dev.clubkompas.svn10.nl` | stuurt tijdelijk (307) door naar live | – | – | – | – |

Lokaal tegen de echte data (`npm run dev:productie`, alleen bewust) toont een oranje balk "Let op: echte clubdata" en in de footer "Productie (lokaal)".

> **Vuistregel: geen balk = live.** Zie je op `tst.` geen balk, log dan niet in.

De app bepaalt zelf in welke omgeving hij draait: lokaal (`npm run dev`) altijd op basis van de Vite-modus, online op basis van `VITE_OMGEVING` en het Firebase-project. Elke build die niet naar het productieproject wijst, toont een balk. Een online build buiten Production (Preview) die naar het productieproject wijst, stopt altijd met "Gestopt: deze testomgeving wijst naar de echte clubdata", welk label er ook staat. Op Vercel Production start de app altijd (behalve zonder enige configuratie); een afwijkend label of een niet-passende configuratie geeft daar alleen een waarschuwing in de console. Een build op Vercel zonder `VERCEL_ENV` faalt bewust; dan blijft de vorige deploy staan.

Vercel publiceert automatisch vanaf GitHub: `main` naar live (Production), elke andere branch als Preview, en de branch `test` op `tst.clubkompas.svn10.nl`. Vercel haalt de instellingen uit zijn eigen dashboard (Project → Settings → Environment Variables), niet uit deze repo of van je laptop. Production heeft de productiewaarden, Preview de testwaarden (zie "Online test en werkwijze branch `test`").

> **Alleen fictieve data in test.** Zet nooit echte persoonsgegevens (namen, e-mailadressen, telefoonnummers, leeftijden, gegevens van jeugdleden) of een kopie van productiedata in het testproject. Dus geen Firestore-export of -import van productie naar test, en geen echte HCA-accounts als testgebruiker. Testaccounts krijgen alleen een functioneel of verzonnen adres (zoals `test-beheerder@svn10.nl`). Testdata maak je met de hand of met een seed-script met verzonnen gegevens.

### Dagelijks gebruik

| Wat | Commando | Gaat naar |
|---|---|---|
| App lokaal starten | `npm run dev` | **Testproject**. Bovenaan staat een petrol balk "Ontwikkelomgeving · op deze computer", in de footer "Ontwikkel · Versie …" |
| App lokaal tegen de echte data (alleen bewust) | `npm run dev:productie` | **Productie**. Oranje balk "Let op: echte clubdata" en in de footer "Productie (lokaal)" |
| Een script draaien | `node scripts/<naam>.mjs` | **Test** (standaard) |
| Een script tegen de echte data | `node scripts/<naam>.mjs --omgeving=productie` | **Productie**, pas nadat je `svn10-clubkompas` hebt ingetypt |
| Regels publiceren | `npm run regels:test`, daarna `npm run regels:productie` | eerst test, dan productie (zie "Firestore-regels") |

Elk script toont als eerste regel waar het naartoe schrijft, bijvoorbeeld `DOEL: TEST — project svn10-clubkompas-test`. Met `--droog` laat een script alleen zien wat het zou doen. Het seed-script `scripts/seed-testclub.mjs` draait nooit tegen productie. `scripts/migrate.mjs` is verouderd en weigert altijd.

Wijst de lokale app per ongeluk naar productie (bijvoorbeeld door een achtergebleven `.env`), dan start Firebase niet en zie je de melding "Gestopt: deze lokale app wijst naar de echte clubdata". Er wordt dan niets gelezen of opgeslagen.

Ontbreekt er lokaal een van de zes Firebase-waarden in `.env.test.local`, of horen de waarden niet bij hetzelfde project (`VITE_FIREBASE_AUTH_DOMAIN` begint niet met de project-ID), dan start Firebase ook niet en zie je "Gestopt: de configuratie is onvolledig of gemengd". Reden: Vite vult een ontbrekende waarde stilletjes aan uit de oude `.env` (productie). Dan zou inloggen bij productie gebeuren terwijl de data uit test komt, en zou je je echte wachtwoord kunnen intypen in wat je voor de test-app houdt. De controle kijkt naar de waarden die echt in `.env.test.local` staan. Online testbuilds (Vercel Preview) hebben een eigen variant van deze controle; live (Vercel Production) valt er nooit onder.

Na het bijwerken van de code (`git pull`) eenmalig `npm ci` draaien. Dat installeert precies de versies uit `package-lock.json`, ook de Firebase CLI (`firebase-tools`).

Draai **niet** `npm audit fix --force`. Dat "repareert" meldingen door pakketten naar een andere hoofdversie te zetten (het zou `firebase-tools` terugzetten naar een oude versie) en kan daardoor de app of de scripts breken. Meldingen van `npm audit` pakken we bewust op via de backlog.

Wachtwoorden typ je altijd zelf in wanneer een script erom vraagt (je ziet dan niets op het scherm). Geef ze nooit mee als argument of via een pipe (`echo … |`): dan komen ze in je shellgeschiedenis terecht.

`npm run build` en `npm run preview` hebben lokaal geen configuratie meer zodra `.env` weg is: de app toont dan "clubKOMPAS is tijdelijk niet beschikbaar". Dat is zo bedoeld en raakt Vercel niet. Wil je lokaal een build tegen test bekijken, gebruik dan `npx vite build --mode test` en `npx vite preview --mode test`.

### Configuratiebestanden (niet in git)

- `.env.test.local` — de zes `VITE_FIREBASE_*`-waarden van `svn10-clubkompas-test` plus `VITE_OMGEVING=Ontwikkel`. Staat er nog `VITE_OMGEVING=Test`, dan is dat onschuldig: `npm run dev` toont altijd "Ontwikkel". Advies: wijzig het naar `Ontwikkel`, dan toont ook een lokale `npx vite build --mode test` "Ontwikkel". Gebruik `.env.test.local.voorbeeld` als sjabloon: kopieer het naar `.env.test.local` en vul alleen die kopie in. Alle zes waarden zijn verplicht.
- `.env.test.local.voorbeeld` — **vul dit bestand nooit in.** Het staat in git en moet leeg blijven. Scripts en `npm run regels:*` stoppen als er toch waarden in staan.
- `.env.productie.local` — de huidige productiewaarden plus `VITE_OMGEVING=Productie`. Alleen voor scripts en `npm run dev:productie`. Staat al klaar.
- `.env` — **oud**, verdwijnt. Vite laadt `.env` in elke modus; een ontbrekende sleutel in het testbestand zou anders stilletjes de productiewaarde overnemen. Je verwijdert het zelf in stap 9 hieronder, pas als de test-app werkt.

Alle `.local`-bestanden vallen onder `.gitignore`. De waarden zijn niet geheim (ze staan ook in de live app), maar horen niet in git.

### Eenmalig inrichten (Paul)

Kijk in de Firebase-console bij elke stap eerst linksboven welk project open staat.

Tip: zet tweestapsverificatie aan op het Google-account dat eigenaar is van de Firebase-projecten (myaccount.google.com → Beveiliging), als dat nog niet zo is.

**1. Testproject aanmaken.** Gedaan: het testproject heeft project-ID `svn10-clubkompas-test` (dat staat al in `.firebaserc`). Opnieuw nodig? console.firebase.google.com → **Project toevoegen** → Google Analytics **uit** → Project maken, en zet de project-ID onder de naam in `.firebaserc` (regel `"test"`). Let op: de test-ID begint met de productie-ID `svn10-clubkompas`. Kijk dus altijd naar het achtervoegsel `-test`.

**1b. Verwerkersvoorwaarden accepteren.** In het testproject: tandwiel → **Projectinstellingen** → tabblad **Privacy** (of **Algemeen** → "Data Processing Terms" / voorwaarden voor gegevensverwerking) → accepteren namens SVN10. Controleer meteen in de **productie**console dat ze daar ook geaccepteerd zijn, en noteer de datum en het account.

**2. Web-app registreren.** Tandwiel → **Projectinstellingen** → onderaan **Je apps** → `</>` → bijnaam `clubKOMPAS test` → Firebase Hosting **niet** aanvinken → Registreren. Je ziet een blok `firebaseConfig` met zes waarden. Kopieer `.env.test.local.voorbeeld` naar `.env.test.local` (terminal: `cp .env.test.local.voorbeeld .env.test.local`) en zet de waarden in **de kopie**, nooit in het voorbeeldbestand:

```
VITE_FIREBASE_API_KEY=<apiKey>
VITE_FIREBASE_AUTH_DOMAIN=<authDomain>
VITE_FIREBASE_PROJECT_ID=<projectId>
VITE_FIREBASE_STORAGE_BUCKET=<storageBucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
VITE_FIREBASE_APP_ID=<appId>
VITE_OMGEVING=Ontwikkel
```

Zolang dit bestand er niet is, toont `npm run dev` de melding "Gestopt: deze lokale app wijst naar de echte clubdata": de oude `.env` wijst nog naar productie en de veiligheidscontrole houdt de app tegen. Zodra `.env.test.local` gevuld is, gaan de testwaarden voor.

**3. Inloggen met e-mail en wachtwoord aanzetten.** **Build → Authentication** → Aan de slag → **Aanmeldmethode** → **E-mail/wachtwoord** → bovenste schakelaar aan → Opslaan. `localhost` staat al bij de geautoriseerde domeinen.

**4. Firestore aanmaken.** Zoek eerst in de **productie**console de locatie op (Projectinstellingen → "Standaardlocatie voor Google Cloud-resources"). Dan in het testproject: **Build → Firestore Database** → Database maken → editie **Standard** → locatie → **Starten in productiemodus**. Kies als locatie:
- **dezelfde als productie**, als productie in de EU staat (bijvoorbeeld `europe-west4` of `eur3`);
- **`europe-west4`** (Nederland) als je twijfelt of als productie buiten de EU staat. Een productieregio buiten de EU is dan een apart punt voor de backlog.

De locatie is daarna niet meer te wijzigen. Vastgesteld op 22 november 2026: productie staat in **`eur3`** (multiregio Europa), test daarom ook in **`eur3`**.

**5. Regels publiceren.** In de terminal in de projectmap:
- `npm ci` (als je dat na het bijwerken nog niet deed).
- `npx firebase login` — de browser opent; kies het Google-account waarmee je in de Firebase-console werkt. Eén keer per computer. Controleren welk account is ingelogd: `npx firebase login:list`.
- `npm run regels:test` → eindigt met `KLAAR  regels gepubliceerd naar svn10-clubkompas-test.` Controle: testconsole → Firestore → Regels toont dezelfde tekst als `firestore.rules`.
- Lukt de CLI niet: plak `firestore.rules` in de testconsole (Firestore → Regels → Publiceren).

Dit moet vóór stap 7, anders weigert Firestore het seed-script.

**6. Testgebruiker en testclub koppelen** (in het **testproject**):
- **Authentication** → Gebruiker toevoegen: bijvoorbeeld `test-beheerder@svn10.nl` met een wachtwoord dat je in je wachtwoordmanager bewaart. Noteer de uid.
- **Firestore** → Collectie starten `clubs` → document-ID **Automatische ID** → veld `naam` (string) `Testclub clubKOMPAS` → Opslaan. Noteer het document-ID (= testclubId).
- In dat document: subcollectie `leden` → document-ID = de uid → velden `rol` (string) `beheerder`, `email` (string) het e-mailadres, `toegevoegdOp` (timestamp) nu.
- Collectie `gebruikers` → document-ID = de uid → veld `clubId` (string, hoofdletter I) = testclubId.

**7. Testclub vullen.**
```bash
node scripts/seed-testclub.mjs --droog   # laat zien wat er komt, schrijft niets
node scripts/seed-testclub.mjs           # log in met de testgebruiker, typ "ja"
```
Je ziet in de testconsole het clubprofiel, 6 bestuursfuncties en 15 domeinen. Opnieuw draaien maakt geen dubbelen ("0 toegevoegd, 21 bijgewerkt").

**8. Lokale app controleren.** `npm run dev` → localhost:5173 → petrol balk "Ontwikkelomgeving · op deze computer · project svn10-clubkompas-test" bovenaan → inloggen met de testgebruiker → Home toont "Testclub clubKOMPAS" met 15 domeinen, footer "Ontwikkel · Versie …".

**9. Oude `.env` verwijderen** — pas nu, als stap 8 gelukt is. Verwijder het bestand `.env` uit de projectmap (Finder: Cmd+Shift+. toont verborgen bestanden; of in de terminal `rm .env`). `.env.productie.local` blijft staan. Start `npm run dev` opnieuw en controleer dat alles nog werkt. Scripts melden tot die tijd `LET OP  er staat nog een bestand .env in de projectmap.`

**10. Vercel, adressen en online test.** Zie "Online test en werkwijze branch `test`" hieronder (P0f).

### Online test en werkwijze branch `test`

#### Werkwijze: eerst `test`, dan `main`

Code gaat eerst naar de branch `test`, daarna naar `main`:

1. Lokaal bouwen en proberen met `npm run dev` (balk "Ontwikkelomgeving").
2. Committen en pushen naar `test` (Claude doet dit alleen op verzoek). Na een minuut of twee staat de nieuwe versie op `tst.clubkompas.svn10.nl`. Eerste controle: het **versienummer in de footer**.
3. Is alles goed op `tst.`, dan live zetten met een fast-forward:
   ```bash
   git checkout main && git merge --ff-only test && git push
   ```
4. Controle live: `clubkompas.svn10.nl` toont geen balk en **hetzelfde versienummer als op `tst.`**.

Een spoedfix direct op `main` merge je daarna terug in `test` (`git checkout test && git merge main`), zodat `test` nooit achterloopt op `main`. Andere branches krijgen een eigen `…vercel.app`-adres met de balk "Testomgeving" en testdata.

Firestore-regels gaan niet mee met Vercel: die blijven via `npm run regels:test` en daarna `npm run regels:productie`.

#### Eenmalig inrichten (Paul), in deze volgorde

Kijk bij elke stap eerst welk project of welke omgeving openstaat (Firebase: linksboven; Vercel: projectnaam en Production/Preview). Live blijft op `dev.clubkompas.svn10.nl` werken tot het nieuwe adres bewezen werkt.

**0. Voorbereiden.** De DNS van `svn10.nl` staat bij **Hostnet** (ns01/ns02.hostnet.nl). Log in bij Mijn Hostnet → Domeinnamen → `svn10.nl` → DNS-beheer en bekijk de bestaande regel `dev.clubkompas` (CNAME naar Vercel). Vul bij nieuwe regels in het naamveld alleen het deel vóór `svn10.nl` in (`clubkompas`, `tst.clubkompas`) en neem de schrijfwijze van het doel (met of zonder punt aan het eind) over van de `dev.clubkompas`-regel. Maak in Vercel een schermafdruk van **Settings → Environment Variables** (terugvaloptie).

**1. Firebase Authorized domains en zelfregistratie.** Project **`svn10-clubkompas`** → Authentication → Settings → **Authorized domains** → Add domain → `clubkompas.svn10.nl`. Project **`svn10-clubkompas-test`** → idem → `tst.clubkompas.svn10.nl`. Laat `dev.clubkompas.svn10.nl` voorlopig staan. Let op: Authorized domains houden inloggen met e-mail en wachtwoord waarschijnlijk **niet** tegen; ze gelden vooral voor inloggen via Google e.d. (OAuth) en voor links in e-mails (bijv. wachtwoord herstellen). Toevoegen kan geen kwaad, maar het is geen afscherming.
- Wat inloggen wél per adres kan afschermen, is een websitebeperking op de API-key (Google Cloud Console → APIs & Services → Credentials → Browser key → "Website restrictions"). Kanttekening: de scripts (`scripts/`) gebruiken dezelfde key vanuit Node, zonder adres; die worden dan ook geblokkeerd, tenzij ze een eigen key krijgen. **Advies: nu niet instellen** (staat als punt op de backlog). Staat er al een lijst, voeg dan het nieuwe adres toe met `/*` erachter. Ligt het toch aan een beperking, dan toont het inlogscherm "Inloggen is op dit adres nog niet toegestaan" in plaats van "wachtwoord klopt niet".
- Controleer in beide projecten dat zelfregistratie uit staat: Authentication → Settings → User actions → "Enable create (sign-up)" **uit**.

**2. Live-domein en Hostnet-CNAME.** Vercel → Settings → **Domains** → Add → `clubkompas.svn10.nl` → **Production**. Neem de CNAME-waarde die Vercel toont **exact** over in Hostnet: nieuw record, type CNAME, naam `clubkompas`, TTL laag als dat kan. Open het adres pas als Vercel "Valid Configuration" en een certificaat toont. Controle: `dig @ns01.hostnet.nl clubkompas.svn10.nl CNAME +short` toont de Vercel-waarde; `https://clubkompas.svn10.nl` toont geen balk, footer "Productie · Versie …", inloggen met je eigen account lukt, HCA-data zichtbaar. `dev.` werkt nog.

**3. Vercel-variabelen scheiden (Preview = test, alle branches).** Vercel → Settings → Environment Variables:
- Bij elk van de zes `VITE_FIREBASE_*` **én** bij `VITE_OMGEVING=Productie`: Edit → **Preview** en **Development** uitvinken, alleen **Production** blijft aan. Waarden niet wijzigen.
- Voeg de zes `VITE_FIREBASE_*` opnieuw toe met de waarden van **`svn10-clubkompas-test`** (dezelfde als in `.env.test.local`), alleen **Preview**, voor **alle Preview-branches**. Let op: Production staat bij toevoegen soms standaard aangevinkt.
- Voeg `VITE_OMGEVING=Test` toe, alleen **Preview**, voor alle Preview-branches.
- Controle: elk van de zeven sleutels staat twee keer in de lijst: één regel "Production" (productiewaarden, `VITE_OMGEVING=Productie`) en één regel "Preview" (testwaarden, `VITE_OMGEVING=Test`). Nergens Production en Preview (of Development) op dezelfde regel. Production niet opnieuw deployen.
- Controleer ook dat "Automatically expose System Environment Variables" aan staat (Settings → Environment Variables). Staat dit uit, dan faalt de build bewust en blijft de vorige deploy staan.

**4. Code en branch `test` (Claude, op verzoek).** De P0f-code gaat naar `main` (controle live: geen balk, footer "Productie"). Daarna maakt Claude de branch `test` vanaf `main` en pusht die. Omdat stap 3 al gedaan is, gebruikt de eerste build van `test` meteen de testwaarden. Controle live: in de browserconsole staat geen waarschuwing die begint met `[clubKOMPAS]`.

**5. Testdomein koppelen en Deployment Protection.** Vercel → Domains → Add → `tst.clubkompas.svn10.nl` → **Preview** → Git branch **`test`** (niet Production). Hostnet: CNAME, naam `tst.clubkompas`, met de waarde die Vercel toont. Settings → **Deployment Protection**: "Vercel Authentication" blijft aan, dus `tst.` vraagt eerst om een Vercel-login. Controle: petrol balk "Testomgeving · online · project svn10-clubkompas-test · fictieve data", footer "Test · Versie …", tabtitel "TEST · clubKOMPAS"; inloggen met `test-beheerder@svn10.nl` geeft "Testclub clubKOMPAS". Je eigen HCA-account werkt hier niet, en dat is goed. Controleer de bescherming in een **privévenster**: je moet eerst het Vercel-inlogscherm zien.

**Tester toevoegen.** Moet een HCA-tester meekijken, geef dan liever een **Shareable Link** van Vercel voor die ene deploy (Deployments → deploy → Share) dan de bescherming uit te zetten; uitzetten geldt voor alle previews. Moet de bescherming toch uit, dan alleen onder deze voorwaarden:
- de tester krijgt een fictief testaccount (zoals `tester1@svn10.nl`), nooit zijn HCA-account of een kopie van HCA-data;
- zelfregistratie staat uit in beide Firebase-projecten (stap 1);
- na de testperiode zet je de bescherming weer aan, en je noteert in de backlog van wanneer tot wanneer hij uit stond.

**6. `dev.` doorsturen (307, 4 weken).** Pas als stap 2 en 5 werken, en nadat HCA bericht heeft gekregen (nieuw adres, bladwijzer aanpassen, één keer opnieuw inloggen). Vercel → Domains → `dev.clubkompas.svn10.nl` → Edit → **Redirect to** `clubkompas.svn10.nl`, statuscode **307 (tijdelijk)**. Controle: `https://dev.clubkompas.svn10.nl` en `https://dev.clubkompas.svn10.nl/#/iets` komen uit op `clubkompas.svn10.nl`. Zet de opheffingsdatum (4 weken na het bericht) in de backlog.

**7. Opheffen (na 4 weken), in deze volgorde.**
1. Hostnet: CNAME `dev.clubkompas` verwijderen.
2. Controleer met `dig @ns01.hostnet.nl dev.clubkompas.svn10.nl CNAME +short` dat de uitvoer **leeg** is.
3. Daarna pas Vercel: domein `dev.clubkompas.svn10.nl` verwijderen. (Andersom zou een CNAME naar Vercel blijven wijzen zonder project, waardoor iemand anders het adres in theorie kan claimen.)
4. Firebase productie: `dev.clubkompas.svn10.nl` uit Authorized domains halen.
5. Staat er een websitebeperking op de API-key, haal daar ook `dev.clubkompas.svn10.nl/*` weg.

#### Uitwijkroute als Vercel uitvalt

Schort Vercel het account op (bijvoorbeeld vanwege de niet-commercieel-voorwaarde van het Hobby-plan) of is het langdurig onbereikbaar, dan kan de app naar een andere host, want het is een statische Vite-build. Bouw met de productiewaarden (`npm run build` met de `VITE_FIREBASE_*` en `VITE_OMGEVING=Productie` als omgevingsvariabelen), zet de map `dist/` bij de nieuwe host (bijvoorbeeld Firebase Hosting of Netlify), zet bij Hostnet de CNAME `clubkompas` om naar de waarde die de nieuwe host opgeeft, en voeg het eventuele nieuwe adres van de host toe aan de Authorized domains van `svn10-clubkompas`. De data staat in Firebase en blijft daar ongemoeid.

#### Als `tst.` niet klopt

| Wat je ziet op `tst.` | Waarschijnlijke oorzaak | Wat te doen |
|---|---|---|
| Geen balk, footer "Productie" (HCA-account werkt wel of niet) | Domein aan **Production** gekoppeld | **Niet inloggen, dit is live.** Domains → `tst.` → Edit → Preview, branch `test`. |
| "Gestopt: deze testomgeving wijst naar de echte clubdata" | Onder Preview staan productiewaarden, met welk `VITE_OMGEVING` dan ook (leeg, `Test` of `Productie`) | Stap 3 nakijken (ook `VITE_OMGEVING=Productie` alleen Production), daarna Redeploy van `test`. Er is niets gelezen of opgeslagen. |
| Balk "Testomgeving", maar oude versie | Nog niet opnieuw gedeployd of browsercache | Redeploy, daarna Cmd+Shift+R. |
| Balk "Ontwikkelomgeving" online | `VITE_OMGEVING=Ontwikkel` bij Preview | Wijzig naar `Test`. |
| Vercel-inlogscherm | Deployment Protection (zo gewild) | Inloggen bij Vercel. |
| "Inloggen is op dit adres nog niet toegestaan" | Meestal een websitebeperking op de API-key zonder dit adres; soms Authorized domains | Stap 1 nakijken voor het project dat in de melding staat. |

### Meldingen

Elke melding zegt wat er aan de hand is, dat er niets is geschreven of gepubliceerd, en wat je nu moet doen. De meest voorkomende:

| Melding | Betekenis |
|---|---|
| `GESTOPT  het bestand .env.test.local ontbreekt.` | Stap 2 nog doen. |
| `GESTOPT  het voorbeeldbestand .env.test.local.voorbeeld is ingevuld …` | Waarden naar `.env.test.local` verplaatsen en het voorbeeld weer leegmaken. |
| App: "Gestopt: de configuratie is onvolledig of gemengd" | Niet alle zes waarden staan in `.env.test.local`, of ze horen bij verschillende projecten. |
| App online: "Gestopt: deze testomgeving wijst naar de echte clubdata" | Op een preview of `tst.` staan productiewaarden; zie "Als `tst.` niet klopt". |
| App online: "Gestopt: de instellingen van deze testomgeving zijn onvolledig of passen niet bij elkaar" | Onder Preview in Vercel ontbreekt een `VITE_FIREBASE_*`, of ze horen bij verschillende projecten (authDomain past niet bij de project-ID, of het projectnummer in `VITE_FIREBASE_APP_ID` verschilt van `VITE_FIREBASE_MESSAGING_SENDER_ID`). |
| App: "Inloggen is op dit adres (…) nog niet toegestaan" | Meestal staat het adres niet in de websitebeperking van de API-key, soms niet in Authorized domains (stap 1 van de online test). |
| `GESTOPT  je koos TEST, maar .env.test.local wijst naar het productieproject …` | In het testbestand staan productiewaarden. |
| `GESTOPT  ingelogd als …, maar er is geen document gebruikers/<uid> …` | Stap 6 niet (helemaal) gedaan. |
| `GESTOPT  Firestore weigert het schrijven in svn10-clubkompas-test.` | Meestal stap 5 (regels) nog niet gedaan, of de testgebruiker is geen beheerder. |
| `GESTOPT  je bent op deze computer nog niet ingelogd bij Firebase.` | `npx firebase login` draaien. |
| `GESTOPT  het Google-account … heeft geen toegang tot dit project.` | Verkeerd Google-account; zie `npx firebase login:list`. |

## Firestore-regels

De beveiligingsregels staan in `firestore.rules` in de root van deze repo. De repo is de bron: wijzig de regels hier en publiceer ze met de Firebase CLI, **altijd eerst naar test**:

1. `npm run regels:test` — publiceert naar `svn10-clubkompas-test`.
2. Controleren in test: de app (`npm run dev`) en de **Rules Playground in de testconsole**.
3. `npm run regels:productie` — vraagt of je eerst in test hebt gecontroleerd en laat je `svn10-clubkompas` intypen. Controleer daarna in de productieconsole de publicatietijd.

`firebase.json` bevat alleen de regels (geen hosting). `.firebaserc` kent de aliassen `test` en `productie` en bewust geen standaardproject, zodat een kale `firebase deploy` nooit per ongeluk productie raakt.

Terugval als de CLI niet werkt: plak de volledige inhoud van `firestore.rules` in de console (Firestore → Regels → Publiceren), eerst in test, dan in productie.

De regels staan per collectie expliciet toe (`instellingen`, `structuurelementen`). Elke nieuwe collectie (bijv. `vermogens`, CK-020) moet bewust aan `firestore.rules` worden toegevoegd; zonder regel is ze dicht.

Test wijzigingen vóór publicatie naar productie in de **Rules Playground** van de **testconsole** (met de testclub in plaats van HCA). Minimaal:

| Scenario | Verwacht |
|---|---|
| HCA-lid: lezen `clubs/{hcaClubId}/structuurelementen/x` | toegestaan |
| HCA-lid: schrijven `structuurelementen/x` met `type: "pijler"`, `naam: "Test"` | toegestaan |
| HCA-lid: schrijven `structuurelementen/x` met `type: "anders"` of zonder `naam` | geweigerd |
| HCA-lid: verwijderen `clubs/{hcaClubId}/structuurelementen/x` | toegestaan |
| HCA-lid: lezen `clubs/{hcaClubId}/instellingen/profiel` | toegestaan |
| HCA-lid: schrijven `instellingen/profiel` met `logo: "data:image/png;base64,..."` of zonder `logo` | toegestaan |
| HCA-lid: schrijven `instellingen/profiel` met `logo: "javascript:alert(1)"` of een getal | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/instellingen/iets-anders` | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/willekeurig/x` | geweigerd |
| HCA-lid: lezen `clubs/{hcaClubId}/leden/{eigenUid}` | toegestaan |
| HCA-lid: lezen `clubs/{hcaClubId}/leden/{anderUid}` | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/leden/{anderUid}` | geweigerd |
| HCA-lid: schrijven `gebruikers/{eigenUid}` | geweigerd |
| HCA-lid: lezen `gebruikers/{anderUid}` | geweigerd |
| Ingelogde niet-lid: lezen `clubs/{hcaClubId}/structuurelementen/x` | geweigerd |
| Niet ingelogd: alles | geweigerd |

## Beheer: gebruiker aan club koppelen

Er is (nog) geen uitnodigingsflow in de app. Een extra bestuurder koppel je handmatig in de Firebase-console. Schrijfacties in de console vallen niet onder de beveiligingsregels.

Koppel alleen op verzoek van de club (de verantwoordelijke) en noteer het in het logboek (zie onder).

1. **Authentication** → Gebruiker toevoegen: e-mailadres en een willekeurig, lang wachtwoord dat je niet bewaart of deelt. Noteer de uid van het nieuwe account.
2. **Firestore** → maak document `clubs/{clubId}/leden/{uid}` met:
   - `rol` (string): `beheerder`
   - `email` (string): het e-mailadres
   - `toegevoegdOp` (timestamp): nu
3. **Firestore** → maak document `gebruikers/{uid}` met alleen:
   - `clubId` (string): het clubId (zie `gebruikers/{uid van de eerste bestuurder}.clubId`)
4. **Authentication** → bij de nieuwe gebruiker: menu (⋮) → **Wachtwoord opnieuw instellen**. De bestuurder krijgt een mail met een link en kiest zelf een wachtwoord. SVN10 kent het wachtwoord dus nooit.
5. Laat de bestuurder weten (los van de resetmail) dat de mail eraan komt, met de link naar clubKOMPAS.

Maak altijd **beide** documenten uit stap 2 en 3 aan. Ontbreekt er één, of staat er een typfout in het clubId, dan ziet de gebruiker het scherm "Geen club gekoppeld". Staat dat scherm al open, laat de gebruiker dan de pagina herladen.

Wijzigt een bestuurder zijn e-mailadres via Instellingen, werk dan het veld `email` in `clubs/{clubId}/leden/{uid}` met de hand bij (de app mag dat document niet schrijven).

## Beheer: gebruiker ontkoppelen of verwijderen

Bij een bestuurswisseling of op verzoek van de club. De club geeft vertrek van een bestuurder door aan SVN10.

1. **Firestore** → verwijder `clubs/{clubId}/leden/{uid}`. Hiermee is de toegang tot de clubdata direct ingetrokken.
2. **Firestore** → verwijder `gebruikers/{uid}`.
3. **Authentication** → schakel het account uit, of verwijder het als het niet meer nodig is.
4. Noteer in het logboek: datum, wie het heeft uitgevoerd, op verzoek van wie, welk account (uid/e-mail) en welke club.

Een open sessie van de vertrokken bestuurder krijgt na stap 1 bij elke lees- of schrijfactie een weigering.

## Migratie P0c: club loskoppelen van gebruiker (eenmalig)

Doel: de HCA-data kopiëren van `clubs/{uid}` naar `clubs/{clubId}` en de nieuwe regels publiceren. De oude data blijft staan. Kies een rustig moment en vraag de HCA-bestuurder(s) vooraf uit te loggen en na afloop de pagina te herladen.

### Logboek
Houd tijdens de migratie een kort logboek bij (bijv. in het opleververslag):
- datum en uitvoerder
- tijdstip overgangsregels **aan** en tijdstip **uit** (= nieuwe regels gepubliceerd)
- clubId
- resultaat van het script (`OK` of de gemelde verschillen) en van de rookproef
- of de oude regels (stap 0) open waren (`if true` of alleen `request.auth != null`)

### Stap 0 — Huidige regels veiligstellen (verplicht)
Kopieer de huidige regels uit de console (Firestore → Regels) naar `scripts/firestore.rules.voor-P0c` en commit dat bestand. Zonder deze kopie is terugdraaien van de regels niet mogelijk.

### Stap 1 — Overgangsregels publiceren
Plak de inhoud van `scripts/firestore.rules.migratie` in de console en vervang daar `<HCA-UID>` door de uid van het HCA-account (Authentication → Gebruikers). Publiceer. Zet de echte uid nooit in een gecommit bestand.

### Stap 2 — Migratiescript draaien
```bash
node scripts/migreer-club.mjs --droog   # alleen samenvatting, schrijft niets
node scripts/migreer-club.mjs           # echte run, vraagt bevestiging met "ja"
```
Sinds P0e gaan scripts standaard naar test. Voor deze (historische) productiemigratie zou `--omgeving=productie` nodig zijn.
Log in met het HCA-account. Controleer in de samenvatting de clubnaam, het aantal pijlers en domeinen, of er een logo is en eventuele LET OP-meldingen. Na de echte run moet het script eindigen met `OK`, gevolgd door de herinnering om direct stap 3 uit te voeren. Het script schrijft in `gebruikers/{uid}` alleen het `clubId`. Opnieuw draaien is veilig: het hergebruikt het clubId uit `gebruikers/{uid}` en maakt geen duplicaten.

Ga daarna zo snel mogelijk door naar stap 3: de overgangsregels geven het HCA-account toegang tot de hele database.

### Stap 3 — Nieuwe regels en nieuwe app-versie
1. Plak de inhoud van `firestore.rules` in de console en publiceer (dit vervangt de overgangsregels).
2. Zet direct daarna de nieuwe app-versie live.

### Stap 4 — Rookproef
Log in als HCA-bestuurder en controleer: clubnaam, logo, favicon, seizoen en alle pijlers en domeinen zijn zichtbaar. Sla één testwijziging op en draai die terug.

### Terugdraaien
- Zet de vorige app-versie terug en plak `scripts/firestore.rules.voor-P0c` terug in de console. Alles werkt dan weer op `clubs/{uid}`.
- De nieuwe documenten (`clubs/{clubId}`, `gebruikers/{uid}`) mogen blijven staan; ze storen de oude versie niet.
- Wijzigingen die ná de migratie in de nieuwe locatie zijn gedaan, staan niet in de oude locatie en moeten zo nodig met de hand worden nagezet.

De oude data onder `clubs/{oudeUid}` blijft staan. Opruimen gebeurt pas na minimaal één sprint zonder problemen, met een apart script en expliciet akkoord van de PO.
