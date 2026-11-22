# Compliancerapport: P0e — Aparte testomgeving

Getoetst: `.claude/specs/P0e-testomgeving.md`, `.claude/reports/P0e-bouwverslag.md`, `scripts/seed-testclub.mjs`, `scripts/lib/omgeving.mjs`, `scripts/import-hca.mjs`, README-sectie "Omgevingen (test en productie)". Ook bekeken: `.claude/specs/CK-020-bron-vermogensoverzicht.md`, omdat CK-020 de eerste klant van de testomgeving is. Datum: 22 november 2026. Er is geen code gewijzigd.

## Verwerkte persoonsgegevens

**In het testproject (`clubkompas-test`):**
- Eén testaccount in Firebase Authentication (voorbeeld `test-beheerder@svn10.nl`, mag een niet-bestaand adres zijn) met wachtwoord, en een uid. Firebase Auth legt daarbij zelf IP-adressen en user agents vast.
- `clubs/{testclubId}/leden/{uid}` met `rol`, `email` en `toegevoegdOp`, en `gebruikers/{uid}` met `clubId`. Die maakt Paul met de hand aan in de console.
- Seed-data (`seed-testclub.mjs`): clubprofiel "Testclub clubKOMPAS", 6 functienamen en 15 domeinen met omschrijvingen. Dit zijn **geen persoonsgegevens**. Het zijn functietitels, geen namen van mensen. De HCA-hashtags (`#HCASpeelt` enz.) zijn organisatiegegevens.

**Buiten de app:**
- Het Google-account van Paul (console en `npx firebase login`). Dat is een eigen account van de beheerder en valt niet onder ledendata.

**Productie:** inhoudelijk niet gewijzigd. Wel kan `npm run dev:productie` lokaal bewust tegen de echte data draaien, en scripts met `--omgeving=productie` ook. Beide alleen met een waarschuwing of met het intypen van de projectnaam.

**Wat er niet gebeurt:** er is geen script of stap die data van productie naar test kopieert. Alle scripts die schrijven gebruiken vaste data in de code, of werken binnen één project (`migreer-club.mjs`). Het principe "fictieve data" wordt dus in de code nageleefd.

## Bevindingen

### 1. Testomgeving bevat alleen fictieve data
**Ernst:** 🟢 Aanbeveling (positief, plus een klein verbeterpunt)
**Regelgeving:** AVG art. 5 lid 1 sub b en c (doelbinding, minimale gegevensverwerking), art. 25 (privacy by design en by default), art. 32 (beveiliging)
**Probleem:** Geen. De seed bevat geen persoonsgegevens en weigert productie hard (`startScript({ alleenTest: true })`). Scripts gaan standaard naar test, en voor productie moet je de projectnaam letterlijk intypen. De lokale app start niet als hij in dev-modus naar `svn10-clubkompas` wijst. Dit verkleint ook het risico op een datalek door per ongeluk schrijven in productie (art. 32 en 33). Klein punt: het voorbeeldadres `test-beheerder@svn10.nl` ligt op een echt domein. Bestaat die mailbox, dan is het adres van een (functie)account. Dat is geen probleem, zolang het geen persoonlijk adres van een HCA-lid of -bestuurder is.
**Aanbeveling:** Zo laten. Gebruik voor testaccounts alleen functionele of niet-bestaande adressen, en nooit het adres of account van een echte HCA-bestuurder.

### 2. README zegt niet expliciet dat echte ledendata in test verboden is
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 5 lid 1 sub b (doelbinding), art. 24 en 32 (passende organisatorische maatregelen), art. 5 lid 2 (verantwoordingsplicht)
**Probleem:** De spec zegt duidelijk "Geen kopie van echte HCA-data naar test (AVG: testdata is fictief)" en "geen echte namen of e-mailadressen van HCA-leden in test". De README noemt alleen "fictieve testclub" in de tabel. Het **verbod** staat er niet in. De README is de werkinstructie voor Paul en voor toekomstige ontwikkelaars, en de spec is dat niet. Juist met CK-020 (nieuwe collectie en import) en latere ledenfunctionaliteit is de verleiding groot om "even met echte data" te testen, bijvoorbeeld met een Firestore-export of -import, met console-kopiëren, of met een HCA-bestuurder als testaccount.
**Aanbeveling:** Een korte, expliciete regel in de README onder "Omgevingen", bijvoorbeeld:
> **Alleen fictieve data in test.** Zet nooit echte persoonsgegevens (namen, e-mailadressen, telefoonnummers, leeftijden, gegevens van jeugdleden) of een kopie van productiedata in het testproject. Dus geen Firestore-export/-import van productie naar test en geen echte HCA-accounts als testgebruiker. Testdata maak je met de hand of met een seed-script met verzonnen gegevens.

Neem dezelfde regel op in de spec-template of de checklist van de pipeline, zodat elke nieuwe seed (bijvoorbeeld voor CK-020 of later voor leden) erop wordt getoetst. Geen blokkade voor P0e: de code zelf is in orde.

### 3. Regio van het testproject (en van productie) nog niet vastgesteld
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG hoofdstuk V (art. 44–46, doorgifte buiten de EER), art. 28 (verwerker)
**Probleem:** De spec en de README laten Paul het testproject in "dezelfde locatie als productie" aanmaken. De productieregio is nog niet bekend (open vraag 2, "Paul zoekt het op"). Voor test zelf is het risico laag, want er staan alleen fictieve gegevens en één testaccount in. Maar staat productie buiten de EU (bijvoorbeeld `nam5` of `us-central`, vaak de standaard bij oudere projecten), dan krijgt test dat ook. En dan is er een groter punt voor productie. De locatie is daarna niet meer te wijzigen. Daarnaast: Firebase Authentication (zonder Identity Platform) is een wereldwijde dienst. Accountgegevens (e-mail, wachtwoordhash, IP-adressen) kunnen buiten de EU verwerkt worden, ongeacht de Firestore-regio. Dat valt onder de doorgiftemechanismen in de Firebase Data Processing and Security Terms (EU-US Data Privacy Framework of SCC's).
**Aanbeveling:**
- Paul legt de productieregio vast en noteert die in de README (tabel "Omgevingen", kolom "Regio") en in het opleververslag.
- Is productie EU (`europe-west4` of `eur3`): test in dezelfde regio. Klaar.
- Staat productie buiten de EU: maak test toch in de EU aan (`europe-west4`). Dat er dan een verschil met productie is, is acceptabel. Maak voor productie een apart backlogpunt (verhuizing of risicoafweging en vastlegging in het verwerkingsregister). Dat valt buiten P0e, maar mag niet blijven liggen.
- Noteer in het verwerkingsregister dat Firebase Auth een wereldwijde dienst is en dat de doorgifte gedekt wordt door de Firebase-verwerkersvoorwaarden.

### 4. Verwerkersrol Google/Firebase: voorwaarden per project accepteren
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 28 (verwerkersovereenkomst), art. 30 (verwerkingsregister)
**Probleem:** Google is voor Firebase verwerker. De verwerkersvoorwaarden (Firebase Data Processing and Security Terms) gelden pas als ze in de console zijn geaccepteerd. Dat gebeurt per project (Projectinstellingen → Algemeen of Privacy, "Voorwaarden voor gegevensverwerking"). De consolestappen in spec en README noemen dit niet. Voor het testproject met alleen fictieve data is het juridisch weinig relevant. Voor productie is het wel essentieel, en uit de stukken blijkt niet dat het daar gecontroleerd is. Positief: Google Analytics staat bij het aanmaken uit (stap 1). Daardoor geen analytische cookies of trackers in test, dus geen toestemmingsvraag (Telecommunicatiewet art. 11.7a). Firebase Auth gebruikt alleen functionele opslag (IndexedDB/localStorage).
**Aanbeveling:**
- Voeg aan README-stap 1 toe: "Projectinstellingen → voorwaarden voor gegevensverwerking accepteren (namens SVN10)".
- Controleer tegelijk in de **productie**console dat de voorwaarden geaccepteerd zijn, en noteer datum en account. Dit is SVN10 als verwerker van HCA, met Google als subverwerker. Controleer ook dat de verwerkersovereenkomst met HCA Google/Firebase als subverwerker noemt (art. 28 lid 2 en 4).
- Neem `clubkompas-test` op in het verwerkingsregister als "testomgeving, geen persoonsgegevens van betrokkenen behalve testaccounts".

### 5. Toegang tot het testproject en de laptop
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 32 (passende technische en organisatorische maatregelen), art. 5 lid 1 sub f (integriteit en vertrouwelijkheid)
**Probleem:** Toegang tot test loopt via het Google-account van Paul (eigenaar). Dat account heeft ook toegang tot productie. `npx firebase login` zet één CLI-token op de laptop dat beide projecten kan beheren, inclusief regels publiceren. Het ontwerp beperkt de risico's goed: geen service-account-sleutel (firebase-admin) op de laptop, wachtwoorden worden altijd gevraagd en nooit opgeslagen, `.firebaserc` heeft geen standaardproject, en voor productie moet je de projectnaam intypen. Wel geldt: wie de laptop of het Google-account in handen krijgt, kan bij productie.
**Aanbeveling:**
- Zet tweestapsverificatie aan op het Google-account dat eigenaar is van beide projecten (als dat nog niet zo is).
- Geef in IAM van `clubkompas-test` alleen accounts toegang die het nodig hebben. Geef externe ontwikkelaars of agents eventueel wel toegang tot test, maar niet tot productie. Dat is precies de winst van een apart project.
- Log uit met `npx firebase logout` op een computer die niet van Paul is.
- Stel een minimumversterkte wachtwoordregel in voor het testaccount (wachtwoordmanager, zoals de README al zegt).

### 6. Vercel Preview kan met echte data praten
**Ernst:** 🟡 Aandacht (buiten P0e, wel gesignaleerd)
**Regelgeving:** AVG art. 25 lid 2 (standaardinstellingen), art. 32
**Probleem:** README-stap 10 wijst er terecht op: staan de productiewaarden in Vercel ook bij **Preview**, dan gebruikt elke preview-deploy van een branch de echte clubdata. Een onaf feature-branch kan dan echte HCA-data lezen of wijzigen (binnen de regels, met een echt account). Dat ondermijnt het doel van P0e.
**Aanbeveling:** Als Paul bij stap 10 ziet dat Preview productiewaarden heeft: maak een backlogpunt om Preview om te zetten naar de testwaarden (`clubkompas-test`, `VITE_OMGEVING=Test`). Dat sluit ook aan op open vraag 4 (online test-URL).

### 7. Vooruitblik CK-020: testen met fictieve of eigen inhoud
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 sub c, art. 25
**Probleem:** Het vermogensoverzicht (CK-020) bevat functietitels en organisatie-onderdelen, geen namen van personen. Testen in test met deze inhoud is dus geen probleem. Het risico komt later: velden als "verantwoordelijke" of "contactpersoon" met echte namen, en ledenfunctionaliteit (jeugdleden onder 16, waarvoor strengere eisen gelden: AVG art. 8, UAVG art. 5).
**Aanbeveling:** Bij elke toekomstige seed of import die personen raakt: verzonnen namen gebruiken (bijvoorbeeld "Test Voorzitter") en de compliancecheck van die feature expliciet laten toetsen aan bevinding 2.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 4 (README-verbod op echte data in test, regio vastleggen, verwerkersvoorwaarden per project accepteren en controleren, Vercel Preview)
- 🟢 Aanbevelingen: 3 (fictieve data positief en testaccountadressen, toegang en 2FA, vooruitblik CK-020)

## Eindoordeel
🟡 **Acceptabel met aandacht.** P0e versterkt de AVG-positie: alleen fictieve data in test, standaard weg van productie, een harde blokkade in de seed, en geen kopieerroute van productie naar test. Niets blokkeert de deployment. Voor de oplevering wel graag: (1) de expliciete regel "geen echte persoonsgegevens in test" in de README, (2) de regio en het accepteren van de verwerkersvoorwaarden als consolestap toevoegen en voor productie controleren en vastleggen. De punten over Vercel Preview en de productieregio (als die buiten de EU blijkt te liggen) horen op de backlog.

## Bronnen
- [Privacy and Security in Firebase](https://firebase.google.com/support/privacy)
- [Firebase Data Processing and Security Terms](https://firebase.google.com/terms/data-processing-terms)
