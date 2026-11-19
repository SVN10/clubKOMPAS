# Compliancerapport: P0c — Club loskoppelen van gebruiker

Beoordeelde bestanden: `.claude/specs/P0c-club-loskoppelen.md` (incl. "Besluiten PO"), `firestore.rules`, `scripts/migreer-club.mjs`, `scripts/firestore.rules.migratie`, `README.md`, `src/main.js` (club bepalen). Er is geen apart `build.md` gevonden.

## Verwerkte persoonsgegevens

| Gegeven | Waar | Betrokkene | Doel |
|---|---|---|---|
| E-mailadres | `clubs/{clubId}/leden/{uid}.email` | bestuurder | herkenbaarheid in de console |
| E-mailadres | `gebruikers/{uid}.email` | bestuurder | herkenbaarheid in de console (zelfde doel, tweede kopie) |
| E-mailadres (bron) | Firebase Authentication | bestuurder | inloggen |
| uid (pseudonieme ID) | documentpaden, `clubs/{clubId}.gemigreerdVan` | bestuurder | koppeling en herleidbaarheid |
| Rol, `toegevoegdOp` | `leden/{uid}` | bestuurder | toegang (rol nog niet afgedwongen) |
| Oude kopie clubdata | `clubs/{oudeUid}/...` | vooral clubgegevens; het pad bevat de uid | archief/rollback |

Er worden geen gegevens van gewone leden of jeugdleden verwerkt. De clubdata (profiel, logo, pijlers, domeinen) zijn organisatiegegevens. Het enige persoonsgegeven in het profiel is mogelijk een contactpersoon; dat is niet nagegaan.

## Bevindingen

### 1. Elk lid kan de e-mailadressen van alle andere leden lezen
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 5 lid 1 sub c (minimale gegevensverwerking), art. 25 (gegevensbescherming door ontwerp)
**Probleem:** `match /leden/{uid} { allow read: if isLid(clubId); }` geeft elk lid leesrecht op alle ledendocumenten, dus ook op de e-mailadressen van andere bestuurders. De app heeft daar nu geen functie voor, want er is geen ledenlijst (die valt buiten scope). Er is dus geen doel voor die toegang. Zodra er later andere rollen bijkomen (vrijwilligers, trainers), kan iedereen in de club de hele lijst ophalen via de SDK.
**Aanbeveling:** beperk het lezen tot het eigen document: `allow read: if ingelogd() && request.auth.uid == uid;`. Dit breekt `isLid()` niet, want `exists()` binnen de regels valt zelf niet onder de leesregels. Voeg in de Rules Playground het scenario "HCA-lid leest `leden/{anderUid}` → geweigerd" toe. Ruim het leesrecht pas weer op als P0d (ledenbeheer, rollen) daar een doel voor heeft, en dan alleen voor `beheerder`.

### 2. E-mailadres staat drie keer opgeslagen en raakt verouderd
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 5 lid 1 sub c en d (minimalisatie, juistheid), art. 16 (recht op rectificatie)
**Probleem:** het e-mailadres staat in Auth, in `gebruikers/{uid}` en in `leden/{uid}`, terwijl het doel alleen "herkenbaarheid in console" is. De app laat gebruikers hun e-mailadres wijzigen (`verifyBeforeUpdateEmail`), maar werkt de twee Firestore-kopieën niet bij. Want de client mag die documenten niet schrijven. Een correctie door de betrokkene zelf komt dus niet overal aan.
**Aanbeveling:** haal `email` weg uit `gebruikers/{uid}`. De uid is in de console via Authentication al te herleiden. Houd hooguit één kopie aan in `leden/{uid}`. Neem in de README op dat SVN10 die kopie handmatig bijwerkt bij een e-mailwijziging, totdat P0d het automatisch regelt (bijvoorbeeld met een Cloud Function of bij het inloggen).

### 3. Bewaartermijn van de oude kopie onder `clubs/{oudeUid}` is open
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 5 lid 1 sub e (opslagbeperking), art. 5 lid 2 (verantwoordingsplicht), art. 17 (recht op wissen)
**Probleem:** de PO heeft besloten tot "minimaal één sprint, daarna apart script en expliciet akkoord". Er is een ondergrens, maar geen bovengrens en geen eigenaar. Na publicatie van de regels is de kopie voor de app onbereikbaar, dus elk doel behalve rollback vervalt. Het risico is dat een archief blijft staan dat niemand opruimt. Een verzoek tot inzage of verwijdering moet dan ook die kopie dekken.
**Aanbeveling:** leg een uiterste datum vast, bijvoorbeeld twee sprints na livegang of een concrete kalenderdatum, en zet het opruimscript nu al als backlogitem met die datum. Neem in de procedure voor inzage en verwijdering op dat ook `clubs/{oudeUid}` wordt meegenomen zolang die bestaat. Verwijder bij het opruimen ook het veld `gemigreerdVan` (of houd het bewust vast en documenteer dat).

### 4. Geen procedure voor ontkoppelen of verwijderen van een bestuurder
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 17 (wissen), art. 32 (beveiliging: toegang intrekken), art. 5 lid 1 sub e
**Probleem:** de README beschrijft alleen het koppelen. Bij verenigingen wisselt het bestuur elk jaar. Er staat nergens hoe een vertrokken bestuurder de toegang verliest en hoe zijn gegevens worden gewist (ledendocument, gebruikersdocument, Auth-account). Zonder die procedure houdt een oud-bestuurder toegang tot clubdata en blijven zijn gegevens onbeperkt bewaard.
**Aanbeveling:** voeg aan de README het kopje "Beheer: gebruiker ontkoppelen/verwijderen" toe, met deze stappen: (1) `clubs/{clubId}/leden/{uid}` verwijderen (dat trekt de toegang direct in), (2) `gebruikers/{uid}` verwijderen, (3) het Auth-account uitschakelen of verwijderen, (4) vastleggen wie dit wanneer op verzoek van wie heeft gedaan. Spreek af dat de club (de verantwoordelijke) een bestuurswisseling doorgeeft.

### 5. Verwerkersrol SVN10 niet vastgelegd
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 28 lid 3 (verwerkersovereenkomst), art. 28 lid 2 en 4 (subverwerker Google/Firebase), art. 29, art. 30 lid 2 (register van de verwerker)
**Probleem:** met deze story wordt SVN10 duidelijk de partij die accounts aanmaakt, gebruikers koppelt, migraties draait en via de console onbeperkt bij alle tenantdata kan (console-schrijfacties vallen niet onder de regels). De club is verwerkingsverantwoordelijke voor de gegevens van haar bestuurders en leden, SVN10 is verwerker en Google is subverwerker. In de repo is niet te zien dat er een verwerkersovereenkomst met HCA is, of dat de club toestemming heeft gegeven voor Google als subverwerker. Ook is de regio van het Firestore-project (EU?) niet vastgelegd. Nu gaat het nog alleen om e-mailadressen van bestuurders, dus het risico is beperkt. Maar dit is de tenant-fundering waar later ledendata op komt.
**Aanbeveling:** sluit voordat een tweede club of ledendata erbij komt een verwerkersovereenkomst met HCA. Neem daarin op: Google Cloud/Firebase als subverwerker (met de Google Cloud Data Processing Addendum en SCC's/EU-US DPF), de Firestore-locatie (controleer in de console: Firestore → locatie, bij voorkeur `eur3` of `europe-west`), en dat SVN10 alleen op instructie van de club koppelt en ontkoppelt. Leg in het verwerkingsregister van SVN10 vast wie consoletoegang heeft.

### 6. Testaccount krijgt toegang tot echte HCA-data
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 29 (verwerking alleen op instructie), art. 32; SVN10-principe "geen productiedata in DEV/TST"
**Probleem:** acceptatiecriterium "Een tweede, handmatig gekoppeld testaccount ziet en bewerkt dezelfde HCA-data" wordt getest in productie, met een testaccount op de echte clubdata. Als dat een account van SVN10 is, is dat toegang tot productiedata zonder vastgelegde instructie van de club. De testwijzigingen komen bovendien in de echte HCA-data terecht.
**Aanbeveling:** gebruik bij voorkeur een echte tweede HCA-bestuurder, met akkoord van de club. Moet het met een SVN10-testaccount, vraag de club dan vooraf om akkoord, beperk de test tot lezen plus één teruggedraaide wijziging, en verwijder het account direct daarna volgens bevinding 4. Leg dit vast in het opleververslag.

### 7. Tijdelijk wachtwoord per e-mail versturen
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 32 (passende beveiliging)
**Probleem:** de README zegt dat je de bestuurder "het e-mailadres, het tijdelijke wachtwoord en de link" stuurt. Alle inloggegevens staan dan samen in één bericht. Wie de mailbox kan lezen, heeft toegang tot de clubdata.
**Aanbeveling:** maak het account aan en stuur via Firebase Auth een wachtwoord-resetlink ("Wachtwoord opnieuw instellen" in de console of `sendPasswordResetEmail`). SVN10 kent het wachtwoord dan nooit. Kan dat niet, stuur het tijdelijke wachtwoord dan via een ander kanaal (sms of telefoon) dan de link.

### 8. `gemigreerdVan` maakt de uid zichtbaar voor alle leden
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 sub c
**Probleem:** `clubs/{clubId}.gemigreerdVan` bevat de uid van de oorspronkelijke bestuurder en is leesbaar voor elk lid. Het risico is klein (het is een pseudonieme ID), maar de app heeft er geen functie voor.
**Aanbeveling:** acceptabel zolang de oude kopie bestaat. Verwijder het veld bij het opruimen (bevinding 3).

### 9. Wildcardregel en niet-afgedwongen rol: voorwaarde voor toekomstige ledendata
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 25 en 32; AVG art. 8 jo. UAVG art. 5 (toestemming ouders bij jongeren onder 16); NOC*NSF-richtlijnen voor ledenadministratie en VOG/vertrouwenspersoon
**Probleem:** `match /{collectie}/{pad=**}` geeft elk lid automatisch lees- en schrijfrecht op elke toekomstige collectie, en `rol` wordt nog niet gecontroleerd. Voor de huidige organisatiedata is dat prima. Zodra er collecties met leden- of jeugdgegevens of meldingen voor de vertrouwenspersoon bijkomen, krijgt iedereen met een ledendocument daar direct toegang toe.
**Aanbeveling:** maak het een harde voorwaarde (Definition of Ready) dat een story met persoonsgegevens van leden, jeugdleden of vertrouwenszaken pas start als (a) rollen in de regels worden afgedwongen en (b) die collectie expliciet in de regels staat, zonder wildcard. Leg dit vast in de backlog bij P0d.

### 10. Verantwoording van migratie en toegang (logging)
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 2 (verantwoordingsplicht), art. 33 (meldplicht datalekken)
**Probleem:** de migratie, de tijdelijke ruime overgangsregels en de handmatige koppelingen worden nergens vastgelegd. Firestore houdt standaard geen data-access-logs bij, dus achteraf is moeilijk na te gaan wie wanneer toegang had. Ook valt op dat `scripts/firestore.rules.voor-P0c` (stap 0) nog niet in de repo staat. Zolang die er niet is, weet niemand of de huidige productiedata openstaat (zie spec, "Huidige regels onbekend"). Als dat zo blijkt te zijn, beoordeel dan of het een meldplichtig datalek was.
**Aanbeveling:** houd een kort logboek bij (datum, uitvoerder, clubId, resultaat "OK", tijd dat de overgangsregels actief waren, gekoppelde en ontkoppelde accounts). Zet stap 0 echt uit voor de migratie. Waren de oude regels open (`if true` of alleen `request.auth != null`), noteer dat dan en beoordeel het met de art. 33-afweging (risico voor betrokkenen; waarschijnlijk laag omdat het om organisatiegegevens gaat). Overweeg Cloud Audit Logs (Data Access) voor Firestore aan te zetten.

## Positief
- Tenantscheiding en de standaardweigering verbeteren de beveiliging (art. 32) duidelijk ten opzichte van de vorige situatie.
- Leden kunnen het ledendocument en het gebruikersdocument niet zelf schrijven, dus niemand kan zichzelf toegang geven.
- Er komt geen echte uid in de repo, het wachtwoord wordt verborgen ingevoerd en de migratie wijzigt de bron niet en gebeurt in één keer (batch).
- PO-besluit 5 (zelfregistratie uitzetten) beperkt het aantal onnodige accounts (minimalisatie).
- Het geen-club-scherm toont alleen het eigen e-mailadres en leest geen clubdata.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 7 (1 t/m 7)
- 🟢 Aanbevelingen: 3 (8 t/m 10)

## Eindoordeel
🟡 **Acceptabel met aandacht.** Er is niets dat de deployment juridisch blokkeert. Het gaat om een beperkte set gegevens van bestuurders. Advies om vóór of direct bij livegang te regelen: bevinding 1 (leesregel `leden` beperken tot het eigen document, een kleine regelwijziging), bevinding 7 (resetlink in plaats van tijdelijk wachtwoord) en bevinding 6 (akkoord van de club voor het testaccount). Bevindingen 2 t/m 5 binnen één sprint en uiterlijk voordat een tweede club of ledendata erbij komt.
