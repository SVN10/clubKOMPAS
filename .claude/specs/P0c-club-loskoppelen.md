# Specificatie: P0c — Club loskoppelen van gebruiker

## Wat wordt er gebouwd?
De club wordt een zelfstandige tenant met een eigen `clubId`, los van de Firebase-uid van de gebruiker. Een gebruiker is lid van een club via een lidmaatschapsdocument; `huidigClubId` wordt na het inloggen uit die koppeling gelezen. Toegang tot `clubs/{clubId}/**` wordt in Firestore-regels (voortaan in de repo: `firestore.rules`) beperkt tot leden. De bestaande HCA-data wordt met een migratiescript gekopieerd van `clubs/{uid}` naar `clubs/{hcaClubId}`, zonder de oude data te verwijderen.

## Gebruikersreis (samenvatting)
1. **Bestaande HCA-bestuurder** logt in zoals altijd → app leest `gebruikers/{uid}.clubId` → laadt profiel, logo en structuurelementen uit `clubs/{clubId}/...` → ziet hetzelfde dashboard als nu.
2. **Ingelogde gebruiker zonder club** (account bestaat, maar geen koppeling) → ziet een melding "Je account is nog niet gekoppeld aan een club" met een uitlogknop; geen navigatie, geen data.
3. **Tweede bestuurder** (handmatig gekoppeld door SVN10 via de Firebase-console, zie "Extra bestuurder koppelen") → logt in met eigen account → ziet en bewerkt dezelfde HCA-data.
4. **SVN10-beheerder** draait eenmalig het migratiescript en publiceert daarna de nieuwe regels.

## Datamodel (keuze en motivatie)

**Keuze: twee documenten, met elk een eigen taak.**

```
gebruikers/{uid}                    ← wijzer: "bij welke club hoor ik?"
  clubId: "<hcaClubId>"
  email: "..."                      (alleen voor herkenbaarheid in console)

clubs/{clubId}                      ← het clubdocument zelf (bestaat nu waarschijnlijk niet)
  naam: "Hockey Club Alphen"
  aangemaaktOp: <timestamp>
  gemigreerdVan: "<oude uid>"       (alleen bij HCA, voor herleidbaarheid)

clubs/{clubId}/leden/{uid}          ← bron van waarheid voor toegang
  rol: "beheerder"                  (wordt opgeslagen, nog NIET afgedwongen)
  email: "..."
  toegevoegdOp: <timestamp>

clubs/{clubId}/instellingen/profiel           ← ongewijzigd (incl. logo als base64)
clubs/{clubId}/structuurelementen/{id}        ← ongewijzigd
```

**Waarom beide?**
- `clubs/{clubId}/leden/{uid}` maakt de regel simpel en tenant-lokaal: "is er een ledendocument voor mij in deze club?" (`exists()`). Het is ook de plek waar later rollen en uitnodigingen landen, en het ondersteunt in de toekomst meerdere clubs per gebruiker.
- `gebruikers/{uid}.clubId` is nodig om na het inloggen te weten wélke club geladen moet worden. Zonder dit document zou de client een collection-group-query over alle `leden` moeten doen (vereist een `uid`-veld plus een handmatig aan te maken collection-group-index in de console, en lekt structuur). Eén `getDoc` is eenvoudiger en sneller.
- Alleen `gebruikers/{uid}.clubId` (zonder `leden`) zou in de regels per request een `get()` op het gebruikersdocument vragen en heeft geen plek voor rol/meerdere clubs. Afgewezen.

**Consistentie:** beide documenten zijn voor de client alleen-lezen (regels: `write: if false`). Ze worden uitsluitend aangemaakt door het migratiescript of handmatig in de console, dus er is geen dubbele schrijflogica in de app. Bij koppelen altijd beide aanmaken.

**clubId:** automatisch gegenereerd Firestore-ID (`doc(collection(db,'clubs')).id`), niet de uid en geen leesbare naam. Zie Open vragen.

## Hoe `huidigClubId` bepaald wordt
In `onAuthStateChanged` (nu `src/main.js` regel 840–853, `huidigClubId = gebruiker.uid` op regel 842):

1. `getDoc(doc(db, 'gebruikers', gebruiker.uid))`
2. Bestaat het document en heeft het een niet-lege `clubId` → `huidigClubId = clubId`, daarna `laadProfiel()` en `renderDashboard()` zoals nu.
3. Bestaat het niet / geen `clubId` → `huidigClubId = null`, `renderGeenClub()`.
4. Fout `permission-denied` bij het laden van het profiel (gebruikersdoc wijst naar club waar geen ledendoc is) → ook `renderGeenClub()`. Andere fouten (netwerk) → nette foutmelding met "Opnieuw proberen", niet de geen-club-melding.

Implementeer dit als één functie, bijv. `async function bepaalClubId(gebruiker)` die `clubId` of `null` teruggeeft. Nergens anders in de app mag nog `gebruiker.uid` als clubId gebruikt worden. Alle data-functies (`laadStructuurelementen`, `voegStructuurelementToe`, `bewerkStructuurelement`, `verwijderStructuurelement`, `laadProfiel`, `slaaProfiel`, regels 45–71) blijven ongewijzigd: ze gebruiken al `huidigClubId`.

## Ingelogde gebruiker zonder club
Nieuw scherm `renderGeenClub()` in `src/main.js`, visueel in de stijl van het inlogscherm (`.inlog-wrap` / `.inlog-kaart`, kompas-icoon, bestaande tokens uit `src/style.css`):
- Titel: "Geen club gekoppeld"
- Tekst: "Je bent ingelogd als {e-mail}, maar je account is nog niet aan een club gekoppeld. Neem contact op met SVN10 om toegang te krijgen." (contactgegeven: zie Open vragen)
- Knop "Uitloggen" → `signOut(auth)`
- Geen top-nav, geen footer-navigatie, geen Firestore-reads op `clubs/...`.

Let op: Firebase Auth laat via de client-SDK in principe iedereen met de API-key een e-mail/wachtwoord-account aanmaken (als de provider aanstaat). Met deze regels levert dat geen toegang tot data op; dit scherm is dan wat zo iemand ziet.

## Firestore-regels (`firestore.rules`, nieuw in repo-root)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function ingelogd() {
      return request.auth != null;
    }

    function isLid(clubId) {
      return ingelogd()
        && exists(/databases/$(database)/documents/clubs/$(clubId)/leden/$(request.auth.uid));
    }

    // Wijzer gebruiker → club: alleen eigen document lezen, nooit schrijven vanuit de app
    match /gebruikers/{uid} {
      allow read: if ingelogd() && request.auth.uid == uid;
      allow write: if false;
    }

    match /clubs/{clubId} {
      // Clubdocument zelf
      allow read: if isLid(clubId);
      allow write: if false;

      // Ledenlijst: leden mogen lezen, niemand mag via de app schrijven
      match /leden/{uid} {
        allow read: if isLid(clubId);
        allow write: if false;
      }

      // Alle overige clubdata (instellingen, structuurelementen, toekomstige collecties)
      match /{collectie}/{pad=**} {
        allow read, write: if isLid(clubId) && collectie != 'leden';
      }
    }

    // Alles wat hierboven niet genoemd is: dicht (impliciet, Firestore default deny)
  }
}
```

Toelichting:
- De `collectie != 'leden'`-voorwaarde is essentieel: regels zijn OF-gekoppeld, dus zonder die uitzondering zou de wildcard leden toestaan zichzelf of anderen aan `leden` toe te voegen.
- Oude data onder `clubs/{oudeUid}/...` wordt na publicatie onbereikbaar voor de app (de oude uid is geen clubId met ledendoc). Dat is gewenst: het is dan een archief.
- Deploy: er is geen Firebase CLI / `firebase.json`. Publiceren gebeurt door de inhoud van `firestore.rules` in de console (Firestore → Regels) te plakken. Testen vooraf in de **Rules Playground** van de console (scenario's: zie Acceptatiecriteria). Een `firebase.json` + CLI-deploy valt buiten scope.
- Bovenaan `firestore.rules` een commentaarregel: "Gepubliceerd via Firebase-console. Repo is de bron; wijzig hier en plak in console."

## Migratieaanpak HCA (zonder dataverlies, terugdraaibaar)

### Stap 0 — Huidige regels veiligstellen
Kopieer de huidige regels uit de console naar `scripts/firestore.rules.voor-P0c` (in de repo, ter referentie en voor rollback). Zonder dit is rollback van de regels niet mogelijk.

### Stap 1 — Overgangsregels (alleen tijdens de migratie, minuten)
Het script draait met de client-SDK als de HCA-gebruiker. De nieuwe regels staan het aanmaken van `gebruikers/` en `leden/` niet toe en de huidige regels (onbekend) staan schrijven naar `clubs/{nieuwId}` waarschijnlijk ook niet toe. Daarom tijdelijk in de console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == '<HCA-UID>';
    }
  }
}
```
Alleen de HCA-uid heeft dan toegang; voor die ene gebruiker is dat niet ruimer dan nu. Het bestand `scripts/firestore.rules.migratie` bevat dit sjabloon (met placeholder, geen echte uid committen — zie Randgevallen).

### Stap 2 — Migratiescript `scripts/migreer-club.mjs`
Volgt het patroon van `scripts/opschonen-dubbelen.mjs`: `.env` lezen, e-mail vragen, wachtwoord verborgen vragen, inloggen met client-SDK.

Gedrag:
1. Lees `gebruikers/{uid}`. Bestaat er al een `clubId` → hergebruik die (idempotent, opnieuw draaien is veilig). Anders: nieuw ID via `doc(collection(db, 'clubs')).id`.
2. Lees bron: `clubs/{uid}/instellingen/profiel` en alle `clubs/{uid}/structuurelementen/*`. Toon samenvatting: clubnaam uit profiel, aantal pijlers, aantal domeinen, logo aanwezig ja/nee, doel-clubId.
3. Vraag bevestiging: typ "ja" (zoals bestaande scripts). Optie `--droog` toont alleen de samenvatting en schrijft niets.
4. Schrijf (met `setDoc`, zelfde document-ID's als de bron, zodat opnieuw draaien niets dupliceert):
   - `clubs/{clubId}` → `{ naam: profiel.naam, aangemaaktOp: serverTimestamp(), gemigreerdVan: uid }`
   - `clubs/{clubId}/instellingen/profiel` → exacte kopie (incl. `logo`)
   - `clubs/{clubId}/structuurelementen/{zelfdeId}` → exacte kopie per document
   - `clubs/{clubId}/leden/{uid}` → `{ rol: 'beheerder', email, toegevoegdOp: serverTimestamp() }`
   - `gebruikers/{uid}` → `{ clubId, email }` — **als laatste**, zodat een half-afgebroken migratie de app niet naar een onvolledige club laat wijzen
   - Gebruik een `writeBatch` (max 500 ops; HCA zit daar ruim onder) zodat het alles-of-niets is. Bij meer dan ~450 documenten: afbreken met melding.
5. Verificatie: lees doel terug, vergelijk aantallen en veldinhoud met bron; print "OK" of de verschillen.
6. **Bron wordt niet verwijderd of gewijzigd.**

### Stap 3 — Nieuwe regels + nieuwe code
1. Publiceer `firestore.rules` in de console.
2. Deploy de nieuwe app-versie (met `bepaalClubId`).
Volgorde regels vóór/na code maakt weinig uit zolang stap 2 klaar is: oude code leest `clubs/{uid}` (na nieuwe regels geblokkeerd), nieuwe code leest `clubs/{clubId}`. Advies: regels en app direct na elkaar, op een rustig moment.

### Stap 4 — Rookproef
Inloggen als HCA-gebruiker: clubnaam, logo, favicon, seizoen, alle pijlers/domeinen zichtbaar; één testwijziging opslaan en terugdraaien.

### Terugdraaien
- Vorige app-versie terugzetten + `scripts/firestore.rules.voor-P0c` terugplakken in de console → alles werkt weer op `clubs/{uid}`.
- Nieuwe documenten (`clubs/{clubId}`, `gebruikers/{uid}`) mogen blijven staan; ze storen de oude code niet.
- Let op: wijzigingen die ná de migratie in de nieuwe locatie zijn gedaan, staan niet in de oude locatie. Bij rollback binnen enkele dagen is dat acceptabel; anders handmatig naslepen.

### Opruimen oude data
Buiten scope van deze story. Pas na akkoord PO (zie Open vragen), met een apart script, na minimaal één sprint zonder problemen.

## Extra bestuurder koppelen (handmatige procedure, geen UI)
Om AC "meerdere bestuurders" aantoonbaar te maken, zonder uitnodigingsflow:
1. Firebase-console → Authentication → gebruiker toevoegen (e-mail + tijdelijk wachtwoord) → noteer uid.
2. Firestore → maak `clubs/{hcaClubId}/leden/{uid}` met `rol: "beheerder"`, `email`, `toegevoegdOp`.
3. Firestore → maak `gebruikers/{uid}` met `clubId: "{hcaClubId}"`, `email`.
(Console-schrijfacties vallen niet onder de beveiligingsregels.) Deze procedure komt in `README.md` onder een kopje "Beheer: gebruiker aan club koppelen".

## Betrokken bestanden
- `src/main.js` — `onAuthStateChanged` (r. 840–853): `huidigClubId` via nieuwe `bepaalClubId()`; nieuwe functie `renderGeenClub()`; foutafhandeling bij `permission-denied`. Import uitbreiden niet nodig (`doc`, `getDoc` zijn al geïmporteerd). **Let op:** er staan niet-gecommitte wijzigingen in `src/main.js` (dashboardcijfers, CK-017) — niet overschrijven.
- `src/style.css` — alleen indien nodig een kleine variant voor de geen-club-kaart; bij voorkeur hergebruik van `.inlog-wrap`/`.inlog-kaart`.
- `firestore.rules` (nieuw, repo-root) — de regels hierboven.
- `scripts/migreer-club.mjs` (nieuw) — migratiescript.
- `scripts/firestore.rules.voor-P0c` (nieuw) — kopie van de huidige console-regels (stap 0).
- `scripts/firestore.rules.migratie` (nieuw) — sjabloon overgangsregels met placeholder `<HCA-UID>`.
- `scripts/import-hca.mjs` en `scripts/opschonen-dubbelen.mjs` — gebruiken nu `clubs/{user.uid}/...` (r. 97 resp. 88); aanpassen zodat ze `clubId` uit `gebruikers/{uid}` lezen, anders schrijven ze na de migratie naar de oude (geblokkeerde) locatie. Afbreken met duidelijke melding als er geen `clubId` is.
- `scripts/migrate.mjs` — legacy (pijlers/domeinen → structuurelementen); niet aanpassen, wel bovenaan markeren als "verouderd: werkt op oude uid-structuur, niet meer gebruiken".
- `README.md` — sectie over `firestore.rules` (publiceren via console) en de koppelprocedure.

## Acceptatiecriteria
- [ ] `huidigClubId` komt uit `gebruikers/{uid}.clubId`; nergens in `src/` wordt `gebruiker.uid` nog als clubId gebruikt
- [ ] Lidmaatschap vastgelegd in `clubs/{clubId}/leden/{uid}` met veld `rol`
- [ ] `firestore.rules` staat in de repo en is identiek aan wat in de console is gepubliceerd
- [ ] Rules Playground, met gepubliceerde regels:
  - [ ] HCA-lid: lezen/schrijven `clubs/{hcaClubId}/structuurelementen/x` → toegestaan
  - [ ] HCA-lid: lezen/schrijven `clubs/{hcaClubId}/instellingen/profiel` → toegestaan
  - [ ] HCA-lid: schrijven `clubs/{hcaClubId}/leden/{anderUid}` → geweigerd
  - [ ] HCA-lid: schrijven `gebruikers/{eigenUid}` → geweigerd
  - [ ] Ingelogde niet-lid: lezen `clubs/{hcaClubId}/structuurelementen/x` → geweigerd
  - [ ] Niet ingelogd: alles geweigerd
  - [ ] HCA-lid: lezen `gebruikers/{anderUid}` → geweigerd
- [ ] Migratiescript draait met `--droog` zonder te schrijven; echte run kopieert profiel (incl. logo) en alle structuurelementen met behoud van document-ID's; tweede run maakt geen duplicaten
- [ ] Na migratie: brondata onder `clubs/{oudeUid}` is ongewijzigd aanwezig
- [ ] HCA-gebruiker ziet na inloggen exact dezelfde clubnaam, seizoen, logo, favicon en pijlers/domeinen als vóór de migratie
- [ ] Toevoegen, bewerken en verwijderen van een structuurelement en opslaan van profiel/logo werkt en landt in `clubs/{hcaClubId}/...`
- [ ] Een tweede, handmatig gekoppeld testaccount ziet en bewerkt dezelfde HCA-data
- [ ] Een ingelogd account zonder koppeling ziet het geen-club-scherm, kan uitloggen en doet geen reads op `clubs/...`
- [ ] Terugdraaiprocedure is beschreven en de oude regels zijn bewaard in `scripts/firestore.rules.voor-P0c`

## Wat mag er niet kapotgaan?
- Inloggen, uitloggen, wachtwoord/e-mail/naam wijzigen (Auth-functies blijven op `huidigGebruiker`)
- Clubprofiel (naam, afkorting, seizoen) en logo inclusief favicon en top-bar
- Pijlers & Domeinen-beheer (CRUD) en het dashboard-grid inclusief de (nog niet gecommitte) dashboardcijfers
- Geen enkel bestaand HCA-document mag verloren gaan of gewijzigd worden door de migratie

## Architectuurlaag
**Platform (P0 — auth & organisatie)** — dit is de tenant-fundering: wie hoort bij welke club en wie mag welke clubdata zien. Alle model- en feature-lagen (M1 vermogens, CK-017, ...) bouwen voort op `clubs/{clubId}` en de lidmaatschapsregel.

## Buiten scope
- Uitnodigen van extra bestuurders via de app (uitnodigingslink, e-mail, acceptatie)
- Rollen en rechten afdwingen (veld `rol` wordt wel opgeslagen, regels kijken er nog niet naar)
- Meerdere clubs per gebruiker / clubwisselaar
- Nieuwe club aanmaken via de app (onboarding van een tweede club)
- Ledenbeheer-scherm (lijst, verwijderen van leden)
- Verwijderen van de oude data onder `clubs/{oudeUid}`
- `firebase.json`, Firebase CLI, emulator-tests voor de regels
- Firebase Storage-regels (logo staat als base64 in Firestore, niet in Storage)
- Uitschakelen van zelfregistratie in Firebase Auth (wel aanbevolen, zie Open vragen)

## Randgevallen en risico's
- **Huidige regels onbekend:** als de huidige regels al ruim zijn (`allow read, write: if true` of `if request.auth != null`), is de data nu feitelijk open — deze story dicht dat. Stap 0 (veiligstellen) is verplicht vóór iets anders.
- **Volgorde gebruikersdoc als laatste:** voorkomt dat de app naar een half gevulde club wijst; batch maakt het bovendien atomair.
- **Logo-grootte:** profiel met base64-logo kan groot zijn (max 1 MiB per document); kopie 1-op-1, geen herschaling.
- **Documenten met subcollecties onder structuurelementen:** nu niet aanwezig; script moet alleen de bekende paden kopiëren en waarschuwen als het onverwachte collecties onder `clubs/{uid}` vindt (bijv. oude `pijlers`/`domeinen` van vóór `migrate.mjs` — die niet meekopiëren, wel melden).
- **uid in repo:** de HCA-uid niet in gecommitte bestanden zetten (sjabloon met placeholder; script toont uid alleen in de terminal).
- **Gebruikersdoc zonder ledendoc (of andersom):** leidt tot `permission-denied` → geen-club-scherm, geen crash.
- **Regel-kosten:** elke lees/schrijf op clubdata kost één `exists()`-lookup; verwaarloosbaar bij deze schaal.
- **Wildcard `{collectie}/{pad=**}`:** opent toekomstige collecties automatisch voor leden. Wil je per collectie expliciet toestaan (strenger), dan moet elke nieuwe collectie (bijv. `vermogens` in CK-020) ook in de regels worden toegevoegd. Beveiliging-medewerker beoordeelt.
- **Zelfregistratie:** zolang e-mail/wachtwoord-registratie in Auth openstaat, kan iedereen een account maken; zonder koppeling geeft dat geen data-toegang, maar wel ruis.
- **Rollback na wijzigingen:** wijzigingen in de nieuwe locatie gaan bij rollback niet automatisch mee terug.

## Open vragen (voor de product owner)
1. **Welke vorm krijgt de clubId — willekeurig ID of leesbare naam (bijv. `hockey-club-alphen`)?**
   *Advies:* willekeurig Firestore-ID. De naam kan veranderen of botsen met een andere club; het ID is intern en de naam staat in het clubdocument.
2. **Welk contactgegeven tonen we op het geen-club-scherm?**
   *Advies:* een algemeen SVN10-supportadres (bijv. `support@svn10.nl` of wat SVN10 gebruikt) in plaats van een persoonlijk adres.
3. **Moet het koppelen van een tweede bestuurder in deze sprint al via de app kunnen, of volstaat de handmatige consoleprocedure?**
   *Advies:* handmatige procedure volstaat voor P0c; uitnodigen via de app wordt een aparte story (P0d) met rollen.
4. **Wanneer mag de oude data onder `clubs/{oudeUid}` weg?**
   *Advies:* niet in deze story. Na minimaal één sprint probleemloos gebruik, met een apart opruimscript en expliciet akkoord.
5. **Moet zelfregistratie in Firebase Authentication uitgezet worden (alleen accounts via SVN10)?**
   *Advies:* ja, zolang er geen onboarding-flow is. Het is een instelling in de console, geen code; kan direct na deze story.
6. **Welke rol krijgt de huidige HCA-gebruiker?**
   *Advies:* `beheerder`. Rollen worden nu nog niet afgedwongen, maar dit voorkomt een tweede migratie later.

## Besluiten PO (19 november 2026)
Alle zes adviezen zijn overgenomen:
1. **clubId:** willekeurig Firestore-ID; de naam staat in het clubdocument.
2. **Contact op het geen-club-scherm:** een algemeen SVN10-supportadres. Het exacte adres is nog niet bekend; de bouwer gebruikt één constante zodat het later op één plek in te vullen is.
3. **Tweede bestuurder:** handmatige consoleprocedure (README). Uitnodigen via de app wordt een aparte story (P0d, samen met rollen).
4. **Oude data onder `clubs/{oudeUid}`:** blijft staan in deze story; opruimen na minimaal één sprint, met apart script en expliciet akkoord.
5. **Zelfregistratie in Firebase Auth:** uitzetten (console-instelling, door de PO na deze story).
6. **Rol van de huidige HCA-gebruiker:** `beheerder`.

## Wijzigingen na kwaliteitscontrole (19 november 2026)
- `gebruikers/{uid}` bevat alleen nog `clubId` (geen `email`): dataminimalisatie (compliance).
- `leden/{uid}`: een lid leest alleen het eigen document (compliance).
- Geen wildcard meer: `instellingen/{docId}` (alleen `profiel`) en `structuurelementen/{id}` zijn expliciet toegestaan, met minimale validatie; elke nieuwe collectie moet bewust in `firestore.rules` worden toegevoegd (beveiliging).
- Logo alleen als `data:image/`-string, in app én regels (beveiliging).
