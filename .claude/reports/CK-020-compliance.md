# Compliancerapport: CK-020 Vermogens beheren

Datum: 23 november 2026. Branch `test`, niet gecommit.
Bronnen: `.claude/specs/CK-020-vermogens-beheren.md`, `.claude/specs/CK-020-besluiten.md`, `.claude/reports/CK-020-bouwverslag.md`, `.claude/reports/CK-044-compliance.md`, `.claude/reports/CK-023-compliance.md`, `.claude/backlog.md` (lopende punten "Na P0e" en "Na CK-044"), `firestore.rules`, `src/vermogens.js`, `scripts/inrichten-vermogens-hca.mjs`, `scripts/controleer-vermogens.mjs`, `scripts/lib/vermogens-hca.mjs`, `tests/regels.test.mjs`, `package.json`, `firebase.json`.
Werkwijze: de code is direct gelezen, zonder shell. `src/main.js` is alleen via het bouwverslag beoordeeld (UI-gedrag, opslag in de browser).

## Verwerkte persoonsgegevens

CK-020 voegt **geen persoonsgegevens** toe. De nieuwe gegevens beschrijven de organisatie, niet personen.

| Gegeven | Waar | Persoonsgegeven? |
|---|---|---|
| `vermogens/{id}`: `naam`, `domeinId`, `volgorde` | Firestore, per club | Nee. Het gaat om procesnamen ("Ledenwerving", "Kascontrole"). `hasOnly` in de regels voorkomt extra velden. |
| `vermogensnamen/{sleutel}`: `vermogenId` | Firestore, per club | Nee. Het is een technische index. |
| `structuurelementen`: `aantalVermogens`, `laatsteVermogenId` | Firestore, per club | Nee. Het zijn een teller en een technisch id. |
| E-mailadres en wachtwoord van de bestuurder | Alleen als invoer van de scripts (terminal) en naar Firebase Auth | Bestaand. Het wachtwoord wordt verborgen gevraagd (`vraag(..., true)`), zoals de andere scripts doen. |
| `uid` in foutmeldingen van scripts (`geweigerd`) | Terminal van Paul | Bestaand. Het is een pseudoniem id dat alleen lokaal te zien is. |
| Testgegevens (`jan`, `piet`, "Testclub", fictieve domeinen) | Alleen in de lokale emulator (`demo-clubkompas`) | Fictief. |

Het enige vrije tekstveld is `naam`. Het bevat maximaal 100 tekens en alleen letters, cijfers, spatie en `& ' - . , ( ) +`, en dat wordt afgedwongen in app én regels. Een persoonsnaam kan erin, maar het veld is daar niet voor bedoeld en de context (een lijst processen per domein) maakt dat onwaarschijnlijk. Zie bevinding 1.

## Bevindingen

### 1. Vrij naamveld: een persoonsnaam is mogelijk, maar onwaarschijnlijk
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 onder c (minimale gegevensverwerking), art. 25 lid 1 (privacy door ontwerp)
**Probleem:** de naamregels houden HTML, emoji en tekens als `@` en `/` tegen. E-mailadressen en URL's kunnen er dus niet in. Een bestuurder kan wel een vermogen "Jan de Vries" of "Kascontrole Piet" noemen. Dan staat er een persoonsnaam in een gegeven dat voor alle leden van de club leesbaar is en dat later op de plaat (CK-021) komt.
**Aanbeveling:** voor nu geen actie, het risico is klein. Leg bij CK-021 en bij een eventueel veld "eindverantwoordelijke per vermogen" vast dat een vermogen naar een **bestuursfunctie** verwijst (`bestuursfunctieId`, zoals bij domeinen) en niet naar een persoon of een vrije naam. Zo blijft het model vrij van persoonsgegevens, ook als mensen wisselen.

### 2. Toekomstige koppeling aan personen en activiteiten (CK-021, P1, M2)
**Ernst:** 🟢 Aanbeveling (vervolgpunt, verplicht meenemen bij de intake van die stories)
**Regelgeving:** AVG art. 5, 9 (bijzondere persoonsgegevens), 10 (strafrechtelijke gegevens), 25, 30, 35 (DPIA); randvoorwaarde "stories met ledendata" in de backlog; NOC*NSF/Centrum Veilige Sport (vertrouwenspersoon, tuchtrecht)
**Probleem:** CK-020 legt alleen het raamwerk vast. Een aantal HCA-vermogens gaat over gevoelige onderwerpen: **Lief & Leed** (ziekte en overlijden, dus gezondheid, art. 9), **Sociale veiligheid** en **Tuchtzaken** (meldingen, vertrouwenspersoon, mogelijk art. 10), **Ledenbeheer**, **Contributiebeheer**, **Jongerenparticipatie** en **G-hockey** (minderjarigen, mogelijk gezondheid). Zodra M2 activiteiten, notities of personen aan een vermogen koppelt, kunnen via die vermogens zulke gegevens binnenkomen. CK-038/CK-039 (status, omschrijving) voegen ook vrije tekst toe.
**Aanbeveling:** neem bij de intake van CK-021, P1 (personen) en M2 de volgende punten op:
- P0d eerst: rollen afdwingen in `firestore.rules` vóór er persoonsgegevens per vermogen bestaan.
- Geen vrije notities bij de vermogens Lief & Leed, Sociale veiligheid en Tuchtzaken zonder apart besluit. Meldingen voor de vertrouwenspersoon horen niet in clubKOMPAS, maar in het kanaal van de vertrouwenspersoon of het Centrum Veilige Sport.
- Een vermogen koppelen aan een bestuursfunctie, niet aan een persoon (zie 1).
- Werk het verwerkingsregister bij en beoordeel of een DPIA nodig is (jeugdleden, gezondheid).
- Gebruik `hasOnly` per nieuw veld (staat al in de spec): dan is elke uitbreiding een bewust besluit.

### 3. P0d-eis uitbreiden met de nieuwe collecties
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 32 lid 1 onder b (integriteit en beschikbaarheid), art. 25
**Probleem:** elk lid mag alle vermogens verwijderen en daarna de domeinen (restrisico 2 in de spec). Er staan geen persoonsgegevens in, dus het risico is nu alleen operationeel. Alle leden zijn op dit moment bestuurders. De spec vraagt om `vermogens` en `vermogensnamen` toe te voegen aan de harde P0d-eis. In `.claude/backlog.md` ("Na CK-044", eerste punt) staan alleen `instellingen`, `bestuursfuncties` en `structuurelementen`.
**Aanbeveling:** vul die backlogregel bij de afronding van CK-020 aan met `vermogens` en `vermogensnamen` en met de guard in `renderVermogensBeheer`. Er bestaat geen back-up (Spark-plan, geen PITR). Overweeg daarom bij P0d of bij de import in productie een export van de clubstructuur als herstelmogelijkheid.

### 4. Nieuwe devDependency en de lokale emulator
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 28 en 32 (geen nieuwe verwerker, beveiliging); fictieve-data-principe SVN10
**Beoordeling:** in orde.
- `@firebase/rules-unit-testing@^6` is alleen een devDependency. Het pakket komt niet in de Vite-bundel en verwerkt niets van gebruikers.
- `npm run test:regels` gebruikt `--project demo-clubkompas`. Een project-id met `demo-` maakt Firebase-tools offline: er is geen verbinding met een echt project, geen login en geen echte data. `singleProjectMode` en een uitgeschakelde emulator-UI beperken het verder. Het emulatorblok in `firebase.json` raakt `firebase deploy --only firestore:rules` niet.
- De tests gebruiken alleen fictieve gegevens (`jan`, `piet`, "Testclub") en ruimen op met `clearFirestore()` en `cleanup()`.
- Er komt geen nieuwe verwerker bij. Bij de eerste start downloadt de emulator een jar van Google; daarbij gaat geen clubdata mee.
**Aanbeveling:** Firebase CLI vraagt bij `firebase login` toestemming voor gebruiksstatistieken. Paul logt in voor `regels:test`/`regels:productie`. Controleer met `firebase login --reauth` of in `~/.config/configstore/firebase-tools.json` (`usage`) welke keuze daar staat. Dat raakt geen clubdata, maar het is netjes om het bewust te kiezen. Draai daarnaast `npm audit` na `npm ci`, zodat de nieuwe boom wordt meegenomen in het openstaande punt "Firebase SDK bijwerken + audit".

### 5. Importscripts: welke data, welk project
**Ernst:** 🟢 Aanbeveling (geen actie nodig)
**Regelgeving:** AVG art. 5 lid 1 onder b en f; fictieve-data-principe
**Beoordeling:** in orde.
- **Data:** 58 vaste procesnamen in `scripts/lib/vermogens-hca.mjs`, uit het HCA-vermogensoverzicht v1.4. Er staan geen persoonsgegevens in. Het script leest `structuurelementen`, `vermogens` en `vermogensnamen` en schrijft alleen vermogens, naamdocumenten en tellers. Het verwijdert, hernoemt en verplaatst nooit.
- **Project:** standaard test (`svn10-clubkompas-test`). Productie alleen met `--omgeving=productie` en het intypen van de projectnaam, daarna "ja". `--droog` schrijft niets. De club wordt gevonden via de eigen koppeling `gebruikers/{uid}`, dus er kan niet per ongeluk een andere club worden beschreven. Agents draaien de scripts niet (veiligheidsregels in de spec).
- **HCA-structuur in test:** de procesnamen van HCA komen ook in het testproject. Het fictieve-data-principe gaat over persoonsgegevens, en deze namen zijn geen persoonsgegevens en niet vertrouwelijk. Ze lijken op de domeinnamen die de seed al in test zet. Dit is acceptabel.
- Het controlescript herstelt alleen wat de regels toestaan en geeft verder instructies voor de console. Daarmee blijven de juistheid en integriteit van de structuur controleerbaar (art. 5 lid 1 onder d).

### 6. Toegankelijkheid (EAA), op hoofdlijnen
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** Richtlijn (EU) 2019/882 (EAA), Implementatiewet toegankelijkheidsvoorschriften producten en diensten (sinds 28 juni 2025); EN 301 549 / WCAG 2.1 AA
**Kader:** ongewijzigd ten opzichte van CK-023 (bevinding 6) en CK-044 (bevinding 3). clubKOMPAS is een besloten beheertool en geen consumentendienst uit de EAA-lijst, en SVN10 is waarschijnlijk een micro-onderneming. Er geldt dus naar verwachting **geen wettelijke EAA-plicht**. WCAG 2.1 AA blijft de richtlijn, omdat clubs of bonden die kunnen eisen.
**Beoordeling (op basis van het bouwverslag):** de opzet is goed.
- Pictogramknoppen hebben een toegankelijke naam ("Bewerken: X", "Verwijderen: X") en een tooltip die met Esc te sluiten is. Dat lost het restpunt 1.4.13 uit CK-044 op voor deze knoppen.
- Groepen hebben een `h3` en een eigen `role="table"`. Bij ↑/↓ meldt een verborgen `role="status"` de nieuwe plaats (4.1.3). Velden krijgen `aria-invalid` en `aria-describedby`, en de veldfouten zijn in klare taal (3.3.1/3.3.3).
- Bij een blokkade blijft de focus op de knop, en de focus komt nooit op `<body>` (2.4.3).
- Op ≤700px zijn knoppen 44×44px.
**Aanbeveling:** de UI is **niet in een browser of met VoiceOver getest** (bouwverslag, "Wat niet getest is"). Doe testscenario 18 op tst voordat er WCAG-conformiteit wordt geclaimd. Let daarbij op de ↑/↓-pijltekens: hebben ze een naam voor schermlezers, zoals "Omhoog: X"? Let ook op het contrast van de nieuwe groepkoppen in donkere modus.

### Gecontroleerd zonder bevinding
- **Regels:** elke nieuwe collectie is expliciet opgenomen (`vermogens`, `vermogensnamen`) en alleen voor leden van de club leesbaar. Een niet-lid wordt geweigerd, en dat is getest. `hasOnly` voorkomt dat er ongemerkt extra velden bijkomen. Dit past bij de compliance-randvoorwaarde uit P0c.
- **Bewaartermijn en verwijderen:** vermogens zijn organisatiegegevens, dus er geldt geen AVG-bewaartermijn. Verwijderen is echt verwijderen: vermogen, naamdocument en teller in één transactie, zonder zachte verwijdering of losse resten. Het controlescript ruimt losse naamdocumenten op.
- **Dataminimalisatie:** alleen naam, domein en volgorde. Geen omschrijving, status of persoon (besluiten 2 en 5).
- **Injectie en weergave:** namen komen alleen via `esc()`/`textContent` in beeld. Bovendien kan `<` niet in een naam (regels en app).
- **Cookies en lokale opslag:** het bouwverslag noemt geen nieuwe `localStorage`- of cookiegebruik. Het filter gaat via `data-filter` bij het navigeren. Er is geen toestemming nodig (art. 11.7a Tw).
- **Hosting en regio:** er komen geen nieuwe diensten bij. Firestore blijft in eur3 in beide projecten, en Cloud Functions zijn er niet.
- **Jongeren onder 16 en vertrouwenspersoon:** nu niet van toepassing, want er worden geen ledengegevens verwerkt. Zie bevinding 2 voor later.

## Lopende punten (niet veroorzaakt door CK-020, ongewijzigd open)

Deze punten staan in `.claude/backlog.md` ("Na P0e"). CK-020 verandert er niets aan, omdat de wijziging geen persoonsgegevens en geen nieuwe verwerker toevoegt. Ze blijven wel open:
- **Verwerkersovereenkomst met HCA**, met Google (Firebase) en Vercel als subverwerkers. Leg daarin ook de acceptatie van de Firebase-verwerkersvoorwaarden in beide projecten vast.
- **Vercel Hobby → Pro:** Hobby is niet voor commercieel gebruik en heeft geen DPA. Stap over vóór een tweede club of een betaalde afspraak, en meld Vercel tot dan als subverwerker aan HCA.
- **Verwerkingsregister (AVG art. 30):** nog op te stellen. Neem bij de clubstructuur (domeinen, bestuursfuncties, vermogens) op dat dit "organisatiegegevens, geen persoonsgegevens" zijn. Zo is het register meteen klaar voor CK-021, P1 en M2.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 0
- 🟢 Aanbevelingen: 6

## Eindoordeel
✅ **Compliant.** CK-020 verwerkt geen persoonsgegevens: vermogens, naamdocumenten en tellers zijn organisatiegegevens met een strak afgedwongen veldenset en tekenset. De emulator draait volledig lokaal op een `demo-`project met fictieve data. De importscripts gebruiken standaard het testproject en zetten alleen 58 vaste procesnamen neer. De belangrijkste vervolgpunten zijn bevinding 2 (gevoelige vermogens zoals Lief & Leed, Sociale veiligheid en Tuchtzaken, zodra M2 of P1 personen of notities koppelt) en bevinding 3 (P0d-eis uitbreiden met de nieuwe collecties). De lopende AVG-administratie (verwerkersovereenkomst HCA, Vercel Pro, verwerkingsregister) blijft open, maar blokkeert CK-020 niet.
