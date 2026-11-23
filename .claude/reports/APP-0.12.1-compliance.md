# Compliancerapport: clubKOMPAS v0.12.1 (hele app)

Datum: 23 november 2026. Branch `test`. Er is niets gebouwd of aangepast.

## Wat is gelezen, en wat niet

Gelezen: `firestore.rules`, `src/firebase.js`, `index.html`, `scripts/lib/omgeving.mjs`, `scripts/lib/vermogens-hca.mjs` (begin), `scripts/import-hca.mjs`, `scripts/inrichten-beheer-hca.mjs` (begin), `scripts/inrichten-vermogens-hca.mjs` (begin), `scripts/migreer-club.mjs` (begin), `.claude/backlog.md`, en de conclusies van `CK-020-compliance.md` en `P0f-compliance.md`. Van `src/main.js` zijn alleen regels 1-150 en 3000-3275 gelezen (Mijn account, inloggen, uitloggen).

Beperking: ik had geen zoekfunctie of shell. Ik kon `src/main.js` dus niet gericht doorzoeken op `localStorage`, `console.log`, cookies, tracking of een privacyverklaring. Bevindingen daarover komen uit de gelezen delen, `index.html` en de backlog. Ze zijn nog niet bewezen voor de rest van `main.js`. De scripts zijn niet allemaal gelezen: `scripts/` is niet te openen als lijst, dus ik las alleen de bestanden die ik uit de rapporten en de backlog kende. Zie ook "Nog te controleren".

## Oordeel

🟡 **Acceptabel met aandacht voor de huidige stand, 🔴 niet klaar voor ledengegevens.**

Nu verwerkt de app bijna alleen organisatiegegevens (domeinen, bestuursfuncties, vermogens, projecten, samenwerkingen, commissies). Persoonsgegevens zijn beperkt tot de accounts van bestuurders. Dat risico is klein. Zodra er leden, jeugd of commissieleden in komen, zijn er meerdere harde voorwaarden. Daarvan zijn P0d (rollen in de regels) en de AVG-administratie (verwerkersovereenkomst, register, privacyverklaring) de belangrijkste.

## Welke persoonsgegevens zijn er nu

| Plek | Gegevens | Betrokkenen | Opmerking |
|---|---|---|---|
| Firebase Auth (`svn10-clubkompas`) | e-mailadres, weergavenaam (`displayName`), uid, wachtwoord-hash, inlogtijden, IP bij inloggen (bij Google) | HCA-bestuurders, Paul | `main.js:3112`, `3124`, `3174` (naam), `3197` (e-mail wijzigen) |
| Firestore `gebruikers/{uid}` en `clubs/{clubId}/leden/{uid}` | uid, `clubId`, `rol` | bestuurders | alleen eigen document leesbaar (`firestore.rules:172-186`); schrijven niet via de app |
| Firestore bestuursfuncties | functietitels ("Voorzitter") | geen personen | geen namen van personen |
| Firestore domeinen, vermogens, projecten, samenwerkingen, commissies | procesnamen, omschrijvingen | geen | vrije tekst bij `omschrijving` (max 500 tekens): een persoonsnaam kan erin |
| Firestore clubprofiel | clubnaam, afkorting, seizoen, logo | geen | het logo is een data-URL, zonder groottelimiet (`firestore.rules:16-19`) |
| Vercel | IP, user-agent, pad, tijdstip | alle bezoekers | zie P0f-rapport |
| Browser | Auth-sessie (IndexedDB/localStorage van de Firebase SDK), `zijmenu-ingeklapt` (CK-044, backlog) | gebruiker | strikt functioneel |
| Scripts (terminal van Paul) | e-mail en uid van de bestuurder worden getoond (`omgeving.mjs:293`, `import-hca.mjs:28`) | Paul | alleen lokaal |
| Oude kopie `clubs/{oudeUid}` | clubdata van vóór P0c | n.v.t. | CK-024 (gepland 26 november) |

Scripts en seeds: `import-hca.mjs`, `inrichten-beheer-hca.mjs` en `vermogens-hca.mjs` bevatten **geen namen van personen**. Er staan alleen pijlernamen, domeinen, functietitels en 58 procesnamen in. De testaccount heet `test-beheerder@svn10.nl` (P0f), een functioneel adres.

## Bevindingen

### Kritiek (blokkeert het invoeren van ledengegevens, niet de huidige stand)

**K1. P0d: elk lid mag alle masterdata schrijven en verwijderen** (bekend en geaccepteerd)
**Regelgeving:** AVG art. 25 en 32 (toegangsbeperking, privacy door ontwerp)
**Bestand:** `firestore.rules:192-274` (`isLid` is de enige voorwaarde; geen `isBeheerder`)
**Probleem:** `leden/{uid}.rol` bestaat al (`main.js` toont de rol), maar de regels gebruiken hem niet. Verbergen van Beheer in het menu is geen beveiliging.
**Aanbeveling:** bouw `isBeheerder(clubId)` en pas hem toe op alle schrijfacties. Alleen als de rol daar al klaar voor is: pas dán ledengegevens, commissieleden of personen toevoegen. Zet ook een leesrol voor niet-beheerders klaar (CK-021 backlog). Dit staat al als harde eis in de backlog. Voeg `projecten`, `samenwerkingen`, `commissies`, `vermogens` en `vermogensnamen` toe.

**K2. Geen privacyverklaring, verwerkersovereenkomst of verwerkingsregister vóór ledengegevens**
**Regelgeving:** AVG art. 13 en 14 (informatieplicht), art. 28 (verwerker), art. 30 (register), art. 35 (DPIA bij jeugdleden en gezondheid)
**Probleem:** `index.html:1-13` heeft geen link naar een privacyverklaring. In de gelezen delen van `main.js` staat ook geen privacytekst of -link (niet in heel `main.js` doorzocht). In de backlog staan de verwerkersovereenkomst met HCA, het register en de Firebase-voorwaarden als open punten ("Na P0e"). Er is ook geen DPIA-afweging.
**Aanbeveling:** leg dit vast vóór de eerste ledengegevens (zie "Voorstel"). Voor alleen bestuurders met een e-mailadres is een korte privacytekst al nodig, maar is een grote DPIA niet nodig.

### Hoog

**H1. Verwerkersovereenkomst met HCA en subverwerkers ontbreekt**
**Regelgeving:** AVG art. 28 lid 2, 3 en 4; art. 44-46
**Probleem:** SVN10 is verwerker voor HCA (verantwoordelijke). Google (Firebase) en Vercel zijn subverwerkers. Voor Firebase zijn de verwerkersvoorwaarden in de console nog niet vastgelegd (backlog "Productieregio en verwerkersvoorwaarden vastleggen"). Vercel Hobby heeft geen DPA en is niet bedoeld voor commercieel gebruik (P0f-rapport, nog open).
**Aanbeveling:** teken de overeenkomst met HCA. Neem Google en Vercel erin op als subverwerkers. Noteer datum en versie van de geaccepteerde Firebase-voorwaarden in beide projecten. Stap over op Vercel Pro vóór een tweede club of betaalde afspraak.

**H2. Weergavenaam en e-mail in Firebase Auth: alleen de gebruiker kan ze wijzigen, en er is geen manier om ze te laten verwijderen**
**Regelgeving:** AVG art. 15, 16, 17, 20 (rechten van betrokkenen)
**Bestand:** `main.js:3169-3242`
**Probleem:** de gebruiker kan naam, e-mail en wachtwoord wijzigen (correctie, art. 16). Er is geen knop of procedure voor inzage, export of verwijdering van het account. Verwijderen kan nu alleen via de Firebase-console of een script. Er is geen beschreven werkwijze. Bij leden wordt dit verplicht en veel groter.
**Aanbeveling:** voor nu een procedure van één pagina (README of `.claude/docs`): wie verzoekt, wie handelt af (Paul als verwerker, HCA als verantwoordelijke), binnen 1 maand (art. 12 lid 3), wat er in Auth, `gebruikers/{uid}`, `leden/{uid}` en de oude kopie wordt weggehaald. Zorg dat de procedure ook `clubs/{oudeUid}` (CK-024) noemt zolang die bestaat.

**H3. Geen back-up, geen herstelmogelijkheid**
**Regelgeving:** AVG art. 32 lid 1 sub b en c (beschikbaarheid en herstel)
**Probleem:** Spark-plan, geen PITR en geen geplande export (CK-020-rapport, backlog). Door P0d kan een lid alles verwijderen. Bij ledengegevens is dat een beschikbaarheidsrisico dat de AVG benoemt.
**Aanbeveling:** stel vóór ledengegevens een export in (bijvoorbeeld `gcloud firestore export` of Blaze met geplande back-up) en beschrijf de bewaartermijn van die back-up. Een back-up bevat ook gegevens die een betrokkene wil laten wissen; leg vast hoe lang hij bewaard wordt (art. 17).

**H4. Geen meldprocedure datalek en geen monitoring**
**Regelgeving:** AVG art. 33 en 34 (melding binnen 72 uur), art. 28 lid 3 sub f (verwerker meldt "zonder onredelijke vertraging" aan de verantwoordelijke)
**Probleem:** er is geen beschreven procedure en geen waarschuwing bij afwijkingen (Firebase-console, Vercel, mislukte inlogpogingen). In de repo is niets gevonden over incidenten (niet volledig doorzocht).
**Aanbeveling:** een korte procedure in de README: wie wat ziet, hoe snel HCA wordt gebeld, wat er gelogd wordt. Zet e-mailmeldingen van Google Cloud en Vercel aan. Neem de afspraak ook in de verwerkersovereenkomst op.

### Middel

**M1. Firebase Auth-gegevens staan niet in een EU-regio**
**Regelgeving:** AVG art. 44-46, art. 30
**Probleem:** Firestore staat in `eur3` (volgens eerdere rapporten en de backlog; hier niet opnieuw in de console gecontroleerd). Firebase Authentication (e-mail, wachtwoord-hash, inlogtijden) heeft geen regio-keuze en wordt door Google wereldwijd verwerkt. Dat is een doorgifte buiten de EER, afgedekt door Google's voorwaarden (SCC's, DPF). "Alle data in de EU" is dus niet juist voor Auth.
**Aanbeveling:** vermeld dit in het register en de verwerkersovereenkomst. Beloof HCA niet dat alle data in de EU blijft. Noteer de regel van het Firestore-project in de backlog (punt "regio noteren" staat nog open).

**M2. P0d en vrije tekst: omschrijvingen kunnen persoonsnamen bevatten**
**Regelgeving:** AVG art. 5 lid 1 sub c, art. 25
**Bestand:** `firestore.rules:134-150` (`omschrijving` tot 500 tekens, geen tekenset)
**Probleem:** de naamvelden hebben een strakke tekenset, de omschrijving niet. Iemand kan er een naam, e-mailadres of telefoonnummer in zetten, zichtbaar voor alle leden. Nu zijn alle leden bestuurders, dus het risico is klein.
**Aanbeveling:** zet een korte hulptekst bij het veld ("geen namen of contactgegevens van personen"). Geen technische beperking nodig zolang er alleen bestuurders zijn.

**M3. Gegevens van betrokkenen in commissies en projecten: voorwaarden vooraf vastleggen**
**Regelgeving:** AVG art. 5, 6, 25, 35
**Probleem:** commissies, projecten en samenwerkingen hebben nu bewust geen personen (`firestore.rules:151-165`, `hasOnly`). De backlog zegt: "Leden in een commissie: alleen na P0d en een compliance-controle". Dat is goed. Bestuurs- en commissiedata zijn vaak zichtbaar voor alle leden, en een koppeling naam-functie is dan zichtbaar voor iedereen met een account.
**Aanbeveling:** houd `hasOnly` zo. Een nieuw veld voor een persoon is een nieuw besluit met grondslag (gerechtvaardigd belang of uitvoering overeenkomst, niet toestemming), doel, zichtbaarheid per rol en bewaartermijn. Verwijs bij voorkeur naar een bestuursfunctie, niet naar een persoon (CK-020-rapport, bevinding 1).

**M4. Geen bewaartermijnen vastgelegd**
**Regelgeving:** AVG art. 5 lid 1 sub e, art. 13 lid 2 sub a
**Probleem:** nergens staat hoe lang een account of een log blijft bestaan, ook niet wat er gebeurt als een bestuurder stopt. `leden/{uid}` en Auth-accounts van oud-bestuurders blijven nu staan.
**Aanbeveling:** leg vast: account en lidmaatschap worden binnen een vaste termijn (bijvoorbeeld 30 dagen) na uittreden verwijderd. Vercel-logs: termijn volgens Vercel, in het register. De oude kopie `clubs/{oudeUid}` wordt opgeruimd op 26 november (CK-024); houd die datum aan.

**M5. Geen DPIA-afweging gedaan**
**Regelgeving:** AVG art. 35; lijst van de AP (grootschalige verwerking van gegevens van kwetsbare personen, kinderen)
**Probleem:** voor bestuurdersaccounts is geen DPIA nodig. Wel voor ledenbeheer met jeugdleden, gezondheid (Lief & Leed), sociale veiligheid en tuchtzaken (CK-020-rapport, bevinding 2).
**Aanbeveling:** doe de afweging vóór de eerste ledengegevens en leg het besluit vast, ook als het "geen DPIA" is.

### Laag

**L1. Cookies en lokale opslag: in orde voor zover gezien.** `index.html` laadt geen fonts, CDN, analytics of tracking van buiten. De Firebase-sessie en `zijmenu-ingeklapt` zijn strikt functioneel (Telecommunicatiewet 11.7a), dus geen toestemming nodig. Niet bewezen voor heel `main.js`. Zie "Nog te controleren". Vermeld ze wel in de privacytekst.

**L2. Logging: beperkt.** `main.js:72` logt alleen de foutcode bij uitloggen. `firebase.js:39,61` logt alleen projectnaam en omgeving. Er staat geen persoonsgegeven in de console-uitvoer in de gelezen delen. De scripts tonen e-mail en uid in de terminal van Paul (`omgeving.mjs:293`, `import-hca.mjs:28`), alleen lokaal. Er is geen eigen audittrail van wie wat wijzigt. Bij ledengegevens is dat nodig (wie heeft ingezien of gewijzigd).

**L3. Groottelimiet op het logo ontbreekt in de regels** (`firestore.rules:16-19`; staat al in de backlog). Een groot bestand kan opslag en kosten opjagen. Geen privacyrisico, wel integriteit/beschikbaarheid.

**L4. Firebase API-key en websitebeperking.** De sleutel staat in de gebouwde app, dat is normaal en is geen geheim. De toegang loopt via de regels. Een beperking tot het eigen domein is een goede aanvulling (backlog).

**L5. Fictieve-data-principe: wordt nageleefd.** Scripts kiezen standaard test, productie vraagt de projectnaam (`omgeving.mjs:223-228`). Het slot `test-met-productie` staat in `firebase.js:56`. Er staan geen personen in de seeds en importbestanden.

**L6. Het e-mailadres van de bestuurder staat in het bevestigingsbericht in de UI** (`main.js:3210`) en wordt met `esc()` getoond waar nodig. Geen probleem. Zorg wel dat het sjabloon "E-mailadreswijziging" met terugdraailink aan staat (backlog "Na CK-023").

## Wat er is vóórdat ledengegevens erin komen (checklist)

1. P0d klaar en getest (`isBeheerder`, leesrol, alle collecties), met regeltests.
2. Verwerkersovereenkomst met HCA, Google en Vercel als subverwerkers genoemd, Firebase-voorwaarden vastgelegd, Vercel Pro met DPA.
3. Verwerkingsregister (art. 30) en privacyverklaring (art. 13/14), met link in de app (inlogscherm en footer). Noem Auth (wereldwijd), Firestore (eur3), Vercel (VS, DPF).
4. DPIA-afweging, zeker bij jeugdleden onder 16 (toestemming ouders of een andere grondslag), gezondheid en tuchtzaken. Meldingen voor de vertrouwenspersoon horen niet in clubKOMPAS.
5. Procedure voor inzage, correctie, verwijdering en export, met termijn van 1 maand.
6. Bewaartermijnen per gegevenssoort, en een opruimmoment voor accounts van vertrekkende bestuurders en leden.
7. Back-up/export met een eigen bewaartermijn.
8. Meldprocedure datalek (72 uur) en meldingen aan.
9. Audittrail van wijzigingen op persoonsgegevens.
10. Beslis per veld: grondslag (bij leden meestal uitvoering van de overeenkomst of gerechtvaardigd belang), zichtbaarheid per rol, verwijzing naar functie in plaats van persoon waar het kan.
11. Geen echte ledengegevens in test of lokaal: alleen verzonnen gegevens.

## Voorstel: wat eerst

1. **Deze week (geen code):** noteer in de backlog de regio van Firestore productie en test, en de datum waarop de Firebase-voorwaarden zijn geaccepteerd. Schrijf het verwerkingsregister (één pagina, ook als concept) en de procedure voor verzoeken en datalekken.
2. **Voor de eerste ledengegevens:** P0d bouwen en testen, daarna de verwerkersovereenkomst met HCA (met subverwerkers) en een korte privacyverklaring met link in de app. Vercel Pro.
3. **Daarna:** back-up, bewaartermijnen en opruimprocedure voor accounts, DPIA-afweging, en pas dan het ledenmodel.
4. Houd 26 november (CK-024, oude kopie opruimen) aan: dat verkleint het aantal plekken waar gegevens staan.

## Nog te controleren

- Gericht zoeken in de rest van `src/main.js` naar `localStorage`, `console.log`, `fetch(`, cookies, tracking en een privacylink. Alleen de gelezen delen zijn gezien.
- Overige bestanden in `scripts/` die ik niet kon openen (zoals het seed-script, `opschonen-dubbelen.mjs`, `migrate.mjs`, `controleer-vermogens.mjs`, `lib/`-hulpbestanden): controleer dat er geen namen van personen of echte e-mailadressen in staan.
- De regio van Firestore (eur3) in de console, en of de Firebase-voorwaarden zijn geaccepteerd.
- Of de bijgewerkte regels met `commissies` al op productie staan (backlog zegt van niet; de app op productie is dan nog niet klaar voor die collectie).

## Samenvatting

- 🔴 Kritiek: 2 (K1 P0d, K2 privacy-administratie; beide blokkeren alleen het invoeren van ledengegevens)
- Hoog: 4 (H1 verwerkersovereenkomst, H2 rechten van betrokkenen, H3 back-up, H4 datalekprocedure)
- Middel: 5 (M1 Auth-regio, M2 vrije tekst, M3 personen in commissies, M4 bewaartermijnen, M5 DPIA)
- Laag: 6 (L1-L6)

## Eindoordeel

🟡 **Acceptabel met aandacht** voor de huidige stand (alleen bestuurdersaccounts en organisatiegegevens). 🔴 **Niet klaar voor ledengegevens** zolang K1 en K2 openstaan.

## Aanvulling door de hoofdsessie (grep, 23-11-2026)

De punten onder "Nog te controleren" zijn met grep nagekeken in `src/*.js`, `index.html` en `scripts/`:
- **localStorage:** alleen `zijmenu-ingeklapt` (`src/main.js:1254`, `:1417`). Dat is een functionele voorkeur zonder persoonsgegevens. Er is geen toestemming nodig.
- **console.log, analytics, tracking en cookies:** niets gevonden in `src/` en `index.html`.
- **Externe fonts (nieuw, middel):** `src/style.css:1` laadt Barlow Semi Condensed via `@import` van `fonts.googleapis.com`. Daardoor gaat bij elk bezoek het IP-adres van de gebruiker naar Google, zonder toestemming en zonder vermelding. Een Duitse rechter heeft dit in 2022 onrechtmatig genoemd (LG München, 3 O 17493/20). Voorstel: zet het lettertype lokaal in `public/` (self-hosting). Dat is een kleine fix.
- **Privacylink:** nergens in de app. Dit bevestigt K2.
- **Scripts:** de scripts vragen alleen om e-mail en wachtwoord om in te loggen (`scripts/lib/omgeving.mjs:255`). Ze slaan niets op, op één plek na: `scripts/migreer-club.mjs:166` schrijft het e-mailadres van de beheerder in een document. Dit is laag: neem het op in het verwerkingsregister.
