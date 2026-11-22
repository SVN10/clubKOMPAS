# clubKOMPAS
Verenigingsbeheer voor sportclubs

## Omgevingen (test en productie)

clubKOMPAS heeft twee Firebase-projecten:

| Omgeving | Firebase-project | Waarvoor | Configuratie |
|---|---|---|---|
| **Test** | `svn10-clubkompas-test` | Lokaal ontwikkelen en uitproberen, fictieve testclub | `.env.test.local` (alleen op je laptop) |
| **Productie** | `svn10-clubkompas` | De live app met de echte clubdata (HCA) | Vercel (live) en `.env.productie.local` (alleen voor scripts) |

De live app wordt door **Vercel** automatisch gepubliceerd vanaf GitHub `main`. Vercel haalt de instellingen uit zijn eigen dashboard (Project → Settings → Environment Variables), niet uit deze repo of van je laptop.

> **Alleen fictieve data in test.** Zet nooit echte persoonsgegevens (namen, e-mailadressen, telefoonnummers, leeftijden, gegevens van jeugdleden) of een kopie van productiedata in het testproject. Dus geen Firestore-export of -import van productie naar test, en geen echte HCA-accounts als testgebruiker. Testaccounts krijgen alleen een functioneel of verzonnen adres (zoals `test-beheerder@svn10.nl`). Testdata maak je met de hand of met een seed-script met verzonnen gegevens.

### Dagelijks gebruik

| Wat | Commando | Gaat naar |
|---|---|---|
| App lokaal starten | `npm run dev` | **Test**. Bovenaan staat een donkere balk "Testomgeving", in de footer "Test · Versie …" |
| App lokaal tegen de echte data (alleen bewust) | `npm run dev:productie` | **Productie**. Oranje balk "Let op: echte clubdata" en in de footer "Productie (lokaal)" |
| Een script draaien | `node scripts/<naam>.mjs` | **Test** (standaard) |
| Een script tegen de echte data | `node scripts/<naam>.mjs --omgeving=productie` | **Productie**, pas nadat je `svn10-clubkompas` hebt ingetypt |
| Regels publiceren | `npm run regels:test`, daarna `npm run regels:productie` | eerst test, dan productie (zie "Firestore-regels") |

Elk script toont als eerste regel waar het naartoe schrijft, bijvoorbeeld `DOEL: TEST — project svn10-clubkompas-test`. Met `--droog` laat een script alleen zien wat het zou doen. Het seed-script `scripts/seed-testclub.mjs` draait nooit tegen productie. `scripts/migrate.mjs` is verouderd en weigert altijd.

Wijst de lokale app per ongeluk naar productie (bijvoorbeeld door een achtergebleven `.env`), dan start Firebase niet en zie je de melding "Gestopt: deze lokale app wijst naar de echte clubdata". Er wordt dan niets gelezen of opgeslagen.

Ontbreekt er lokaal een van de zes Firebase-waarden in `.env.test.local`, of horen de waarden niet bij hetzelfde project (`VITE_FIREBASE_AUTH_DOMAIN` begint niet met de project-ID), dan start Firebase ook niet en zie je "Gestopt: de configuratie is onvolledig of gemengd". Reden: Vite vult een ontbrekende waarde stilletjes aan uit de oude `.env` (productie). Dan zou inloggen bij productie gebeuren terwijl de data uit test komt, en zou je je echte wachtwoord kunnen intypen in wat je voor de test-app houdt. De controle kijkt naar de waarden die echt in `.env.test.local` staan. Live (Vercel) valt er niet onder.

Na het bijwerken van de code (`git pull`) eenmalig `npm ci` draaien. Dat installeert precies de versies uit `package-lock.json`, ook de Firebase CLI (`firebase-tools`).

Draai **niet** `npm audit fix --force`. Dat "repareert" meldingen door pakketten naar een andere hoofdversie te zetten (het zou `firebase-tools` terugzetten naar een oude versie) en kan daardoor de app of de scripts breken. Meldingen van `npm audit` pakken we bewust op via de backlog.

Wachtwoorden typ je altijd zelf in wanneer een script erom vraagt (je ziet dan niets op het scherm). Geef ze nooit mee als argument of via een pipe (`echo … |`): dan komen ze in je shellgeschiedenis terecht.

`npm run build` en `npm run preview` hebben lokaal geen configuratie meer zodra `.env` weg is: de app toont dan "clubKOMPAS is tijdelijk niet beschikbaar". Dat is zo bedoeld en raakt Vercel niet. Wil je lokaal een build tegen test bekijken, gebruik dan `npx vite build --mode test` en `npx vite preview --mode test`.

### Configuratiebestanden (niet in git)

- `.env.test.local` — de zes `VITE_FIREBASE_*`-waarden van `svn10-clubkompas-test` plus `VITE_OMGEVING=Test`. Gebruik `.env.test.local.voorbeeld` als sjabloon: kopieer het naar `.env.test.local` en vul alleen die kopie in. Alle zes waarden zijn verplicht.
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
VITE_OMGEVING=Test
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

**8. Test-app controleren.** `npm run dev` → localhost:5173 → donkere balk "Testomgeving" bovenaan → inloggen met de testgebruiker → Home toont "Testclub clubKOMPAS" met 15 domeinen, footer "Test · Versie …".

**9. Oude `.env` verwijderen** — pas nu, als stap 8 gelukt is. Verwijder het bestand `.env` uit de projectmap (Finder: Cmd+Shift+. toont verborgen bestanden; of in de terminal `rm .env`). `.env.productie.local` blijft staan. Start `npm run dev` opnieuw en controleer dat alles nog werkt. Scripts melden tot die tijd `LET OP  er staat nog een bestand .env in de projectmap.`

**10. Vercel controleren (niets wijzigen).** vercel.com → project clubKOMPAS → **Settings → Environment Variables**. Ga na dat `VITE_OMGEVING=Productie` en de zes `VITE_FIREBASE_*`-waarden er staan, en noteer bij welke omgevingen ze aangevinkt zijn (Production / Preview / Development). Staan de productiewaarden ook bij **Preview**, dan praat elke preview-deploy van een andere branch met de echte clubdata. Noteer dat; aanpassen valt buiten P0e.

### Meldingen

Elke melding zegt wat er aan de hand is, dat er niets is geschreven of gepubliceerd, en wat je nu moet doen. De meest voorkomende:

| Melding | Betekenis |
|---|---|
| `GESTOPT  het bestand .env.test.local ontbreekt.` | Stap 2 nog doen. |
| `GESTOPT  het voorbeeldbestand .env.test.local.voorbeeld is ingevuld …` | Waarden naar `.env.test.local` verplaatsen en het voorbeeld weer leegmaken. |
| App: "Gestopt: de configuratie is onvolledig of gemengd" | Niet alle zes waarden staan in `.env.test.local`, of ze horen bij verschillende projecten. |
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
