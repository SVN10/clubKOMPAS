# Beveiligingsrapport: P0c — Club loskoppelen van gebruiker

Gescand (niet-gecommitte werkkopie, 19-11-2026): `firestore.rules`, `scripts/firestore.rules.migratie`, `scripts/migreer-club.mjs`, de diffs van `scripts/import-hca.mjs`, `scripts/opschonen-dubbelen.mjs`, `scripts/migrate.mjs`, `src/main.js` en `README.md`. Er is geen verbinding met Firebase gemaakt. De regels zijn alleen statisch beoordeeld, niet in de Rules Playground getest.

## Kernvragen

**Kan een gebruiker zichzelf aan een club toevoegen?** Nee. `gebruikers/{uid}` en `clubs/{clubId}/leden/{uid}` hebben `write: if false`. De wildcard sluit `leden` uit met `collectie != 'leden'`. Dat geldt ook voor diepere paden zoals `leden/{uid}/x/y`, want `collectie` is daar ook `'leden'`. Toegang hangt alleen af van `exists(leden/{auth.uid})`, en dat document kan niemand vanuit de client aanmaken.

**Kan een gebruiker data van een andere club lezen of schrijven?** Nee. Elke match op `clubs/{clubId}/...` controleert lidmaatschap van precies die `clubId`. Een list-query op `clubs` zonder vast clubId wordt geweigerd. `gebruikers/{anderUid}` is niet leesbaar. Een gebruikersdocument dat naar een vreemde club wijst geeft `permission-denied`, en de app toont dan het geen-club-scherm.

**Geeft de wildcard `{collectie}/{pad=**}` meer dan bedoeld?** Ja, maar alleen binnen de eigen club. Zie bevinding 1.

## Bevindingen

### 1. De wildcard geeft leden automatisch volledige schrijfrechten op elke toekomstige collectie
**Ernst:** 🟡 Middel (moet opgelost vóór PRD of uiterlijk vóór P0d; mag naar TST)
**Type:** Autorisatie / least privilege
**Locatie:** `firestore.rules:31-33`
**Probleem:** Elk lid krijgt read en write op elke willekeurige collectie en subcollectie onder de eigen club, ook op collecties die nog niet bestaan. Concreet:
- P0d (uitnodigingen en rollen) voegt waarschijnlijk iets toe als `uitnodigingen` of `rollen`. Met de wildcard is zo'n collectie meteen schrijfbaar voor élk lid, ook voordat er een specifieke regel voor bestaat. Een lid kan dan bijvoorbeeld zelf een uitnodiging aanmaken of een rol zetten. Of dat een escalatie wordt, hangt af van hoe P0d de collectie gebruikt. Het risico ontstaat stil, zonder dat iemand de regels aanpast.
- Een lid kan willekeurige collecties en geneste subcollecties aanmaken (bijv. `clubs/{id}/willekeurig/x/y/z`) en daarin onbeperkt data opslaan. Dat geeft opslag- en kostenmisbruik, en vervuiling die later een migratie kan verstoren.
- Er staat nergens schemavalidatie of een groottelimiet in de regels.

**Aanbeveling (advies op de vraag uit de spec): sta per collectie expliciet toe en laat de wildcard vallen.** Dit sluit aan bij het default-deny-principe van Firestore. Een nieuwe collectie (bijv. `vermogens` in CK-020) moet dan bewust in de regels worden opgenomen. Dat kost één regelblok per story en dwingt een beveiligingsafweging af op het moment dat het ertoe doet. Voorstel ter vervanging van regels 30-33:

```
match /instellingen/{docId} {
  allow read: if isLid(clubId);
  allow write: if isLid(clubId) && docId == 'profiel';
}
match /structuurelementen/{id} {
  allow read, delete: if isLid(clubId);
  allow create, update: if isLid(clubId)
    && request.resource.data.type in ['pijler', 'domein']
    && request.resource.data.naam is string
    && request.resource.data.naam.size() <= 200;
}
```

Optioneel voor `profiel`: `request.resource.data.logo` is `string` en begint met `'data:image/'` (sluit ook bevinding 2 af aan de serverkant). Houd validatie minimaal en test vooraf in de Playground of het huidige profiel en de structuurelementen erdoor komen. Voeg Playground-scenario's toe, bijv. "HCA-lid schrijft `clubs/{hcaClubId}/willekeurig/x` → geweigerd", en vul de README-tabel aan.

### 2. Stored XSS via het logo-veld (bestond al, wordt door P0c relevant)
**Ernst:** 🟡 Middel (vóór PRD met meerdere bestuurders per club oplossen)
**Type:** XSS
**Locatie:** `src/main.js:139` en `src/main.js:726`
**Probleem:** `huidigProfiel.logo` wordt zonder escaping in `<img src="${...}">` gezet. Via de UI komt daar altijd een `data:image/png`-URL in, maar elk lid kan met de Firebase-SDK en de publieke config direct `instellingen/profiel` schrijven met bijv. `logo: 'x" onerror="..."'`. Vóór P0c had elke club één gebruiker (alleen self-XSS). Met P0c kunnen meerdere bestuurders dezelfde club delen. Dan kan het ene lid script uitvoeren in de sessie van een ander lid, inclusief toegang tot het Firebase-token in IndexedDB. Zolang er geen rollen zijn, is de extra winst voor een aanvaller beperkt. Met P0d (rollen) wordt dit een echte escalatieroute.
**Aanbeveling:** Gebruik `esc(huidigProfiel.logo)` op beide plekken en render het logo alleen als de waarde begint met `data:image/`. Doe hetzelfde in `setFavicon`. Leg dit ook in de regels vast (zie bevinding 1). Andere interpolaties van userdata in de gescande code gaan wel via `esc()`.

### 3. Rollback-kopie van de huidige regels ontbreekt nog
**Ernst:** 🟡 Middel (blokkeert de migratie, niet TST van de code)
**Type:** Configuratie / herstelbaarheid
**Locatie:** `scripts/firestore.rules.voor-P0c` (bestaat niet)
**Probleem:** De spec noemt stap 0 verplicht. Zonder deze kopie kunnen de regels niet worden teruggedraaid en is niet bekend hoe open de data nu is.
**Aanbeveling:** Kopieer vóór stap 1 de huidige console-regels naar dit bestand en commit het. Staat daar `if true` of `if request.auth != null`, dan is de data nu feitelijk open en heeft deze story prioriteit.

### 4. Overgangsregels zijn breed en het is niet zeker dat ze worden teruggezet
**Ernst:** 🟢 Laag
**Type:** Autorisatie (tijdelijk)
**Locatie:** `scripts/firestore.rules.migratie:6-8`
**Probleem:** `{document=**}` geeft het HCA-account read en write op de héle database, ook op `gebruikers/*` en `leden/*`. Voor één tenant is dat acceptabel. Blijft de regel per ongeluk staan, dan heeft het HCA-account beheerrechten en zijn alle andere accounts buitengesloten. Een blijvende placeholder `<HCA-UID>` is veilig: die weigert alles. De sjabloon bevat terecht geen echte uid, en in de repo is geen uid gevonden.
**Aanbeveling:** Houd het venster kort. Laat het script na `OK` een herinnering printen: "Publiceer nu firestore.rules (stap 3)".

### 5. Opnieuw draaien kan nieuwere wijzigingen in de doelclub overschrijven
**Ernst:** 🟢 Laag
**Type:** Integriteit / dataverlies
**Locatie:** `scripts/migreer-club.mjs` (blok "WAARSCHUWING: de doelclub bevat al gegevens..." en `batch.set` van profiel en structuurelementen)
**Probleem:** Bij een tweede run na ingebruikname worden afwijkende doeldocumenten vervangen door de bronversie. Het script waarschuwt, toont de verschillen en vraagt "ja". Onder de definitieve regels faalt de batch bovendien op `gebruikers/` en `clubs/{id}`, en door de atomaire batch wordt er dan niets geschreven. Wel goed geregeld: de bron wordt nooit gewijzigd (ook gecontroleerd na schrijven), er zijn checks op gemigreerdVan en batchgrootte, en `--droog` schrijft niets.
**Aanbeveling:** Vraag bij afwijkende doeldata een tweede, expliciete bevestiging (bijv. typ "overschrijven") in plaats van "ja".

### 6. Wachtwoord als command-line-argument in import-hca
**Ernst:** 🟢 Laag (bestond al)
**Type:** Blootgestelde gegevens
**Locatie:** `scripts/import-hca.mjs:74`
**Probleem:** `process.argv[3]` als wachtwoord komt terecht in de shellhistorie en is zichtbaar in `ps`. `migreer-club.mjs` en `opschonen-dubbelen.mjs` doen dit goed: verborgen invoer, en foutmeldingen tonen alleen `e.code`. `.env` staat in `.gitignore` en wordt niet getrackt.
**Aanbeveling:** Verwijder de argv-optie voor het wachtwoord. Zet de nieuwe `getDoc(gebruikers/...)` in import-hca en opschonen in een try/catch met een nette melding (nu krijg je een unhandled rejection met stacktrace bij `permission-denied`).

### 7. Zelfregistratie en het tijdelijke wachtwoord in de koppelprocedure
**Ernst:** 🟢 Laag
**Type:** Authenticatie
**Locatie:** `README.md` (sectie "Beheer: gebruiker aan club koppelen"), Firebase Auth-instelling
**Probleem:** Zolang e-mail/wachtwoord-registratie openstaat, kan iedereen een account maken. Dat geeft door de regels geen toegang tot data, maar wel ruis. Volgens de README gaan het e-mailadres, het tijdelijke wachtwoord en de link samen in één bericht naar de bestuurder.
**Aanbeveling:** Zet zelfregistratie uit, zoals de PO heeft besloten. Stuur het tijdelijke wachtwoord via een ander kanaal dan het e-mailadres en de link. Of gebruik een wachtwoord-reset-link uit de console in plaats van een tijdelijk wachtwoord.

## Gecontroleerd zonder bevinding (src/main.js)
- **XSS in de tussenschermen:** het e-mailadres in `renderGeenClub` gaat via `esc()`. `supportMailto` codeert onderwerp en body met `encodeURIComponent`, en de href wordt daarna nog door `esc()` gehaald. `SUPPORT_EMAIL` is een constante in de code (nu leeg, dan wordt er geen link getoond). De `innerHTML` van de foutkaart-hint bevat alleen geëscapete waarden.
- **Race bij uitloggen of wisselen van account:** `laadClub` controleert na elke await `huidigGebruiker?.uid` en geeft `afgebroken` terug. De catch reset de status alleen bij dezelfde uid. `onAuthStateChanged` ruimt `laadTimer` op. Een late respons van een vorig account kan daardoor geen clubId, profiel of scherm van een ander account neerzetten. Ook de knop "Opnieuw proberen" controleert de uid.
- **Data zonder club:** zonder koppeling wordt alleen `gebruikers/{eigen uid}` gelezen, er zijn geen reads op `clubs/...`. Bij `permission-denied` wordt het geen-club-scherm getoond, bij een andere fout de foutkaart. Er wordt geen foutdetail aan de gebruiker getoond. `gebruiker.uid` wordt nergens meer als clubId gebruikt.
- **CSRF:** niet van toepassing (Firebase-SDK met bearer-token, geen cookie-sessies).
- **Dependencies:** geen nieuwe (`package.json` ongewijzigd).
- **Fictieve data:** de scripts werken bewust op de echte HCA-data (eenmalige productiemigratie). Draai `--droog` eerst en draai niet tegen DEV/TST met echte data.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Middel/hoge bevindingen: 3 (wildcard-regels, logo-XSS, rollback-kopie ontbreekt)
- 🟢 Lage aanbevelingen: 4

## Eindoordeel
🟡 Naar TST met aandachtspunten. De tenant-isolatie en de bescherming tegen zelf toevoegen aan een club zijn correct. Vóór PRD:
1. De wildcard vervangen door expliciete collectieregels (advies: expliciet).
2. De logo-XSS oplossen.
3. `scripts/firestore.rules.voor-P0c` vastleggen vóór stap 1 van de migratie.
