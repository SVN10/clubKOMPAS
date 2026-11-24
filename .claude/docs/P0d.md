# P0d Beheer alleen voor beheerders

Gebouwd op 24 november 2026 op branch `test`. Route groot (nieuwe Firestore-regels), ingekort: geen intake of ontwerp, want er komt geen nieuw scherm bij. Beveiligingsrapport: `.claude/reports/P0d-beveiliging.md`. Het oordeel is "vrij te geven", met 4 lage bevindingen. Alle 4 zijn opgelost in de herstelronde:
1. `laadRol` trimt de rol niet meer, net als de regels.
2. De naam van een bestuursfunctie mag niet alleen uit spaties bestaan.
3. `veiligLogo` gebruikt dezelfde volledige regex en lengtegrens als de regels.
4. `controleer-p0d` houdt het document-id en de data apart.

De vorige regels staan in `scripts/archief/firestore.rules.voor-P0d`.

P0d is de harde poort vóór een tweede bestuurder en vóór ledengegevens. Tot nu toe mocht elk lid van de club alles in Beheer wijzigen. Nu mag dat alleen iemand met de rol `beheerder`.

## Voor gebruikers
- Ben je **beheerder**? Dan verandert er niets. Je ziet Beheer in het zijmenu en kunt alles wijzigen zoals voorheen.
- Ben je **lid zonder beheerrol** (bijvoorbeeld een tweede bestuurder)? Dan zie je alleen Home, het Domeinenoverzicht en het Vermogensoverzicht. Beheer staat niet in je menu. De kerncijfers zijn dan gewone vakjes, geen links naar Beheer.
- Bij het clubprofiel geldt nu een maximum: clubnaam 100 tekens, afkorting 20 en seizoen 20.
- Een logo dat na het verkleinen nog te groot is, wordt geweigerd met een duidelijke melding. In de praktijk gebeurt dat niet, omdat de app logo's verkleint tot 300 px.

## Technisch

### Regels (`firestore.rules`)
- **`isBeheerder(clubId)`**: `get(clubs/{clubId}/leden/{uid}).data.get('rol', '') == 'beheerder'`, precies zo geschreven, zonder hoofdletters of spaties. Ontbreekt het ledendocument, dan geeft `get()` een fout en wordt de actie geweigerd.
- **Lezen** blijft `isLid(clubId)` voor alle collecties. Een lid zonder beheerrol kan dus de overzichten zien.
- **Schrijven** (aanmaken, wijzigen en verwijderen) vraagt nu `isBeheerder(clubId)` op `instellingen`, `bestuursfuncties`, `structuurelementen`, `vermogens`, `vermogensnamen`, `projecten`, `samenwerkingen` en `commissies`. Daarmee kan ook alleen een beheerder `bevat` op een domein zetten of weghalen.
- **Veldcontrole**:
  - `geldigProfiel`: alleen `naam` (1–100), `afkorting` (1–20), `seizoen` (1–20) en `logo`. Elk veld mag ontbreken, omdat de app met merge schrijft. Wat er staat, mag niet leeg of alleen spaties zijn.
  - `geldigeBestuursfunctie`: alleen `naam` (2–100) en `volgorde` (geheel getal van 1 tot 100000, mag ontbreken).
  - `geldigDomein`: alleen `type`, `naam`, `hashtag`, `omschrijving`, `bestuursfunctieId`, `icoon`, `volgorde`, `aantalVermogens`, `laatsteVermogenId` en `bevat`. `type` en `naam` zijn verplicht. De naam is 1–200 tekens en niet alleen spaties. De omschrijving is maximaal 500 tekens. De hashtag is leeg, of `#` met 1–49 tekens zonder spatie of tweede `#`. `bestuursfunctieId` is maximaal 100 tekens en `icoon` maximaal 50. De andere optionele velden mogen ontbreken; dan blijven oudere documenten en `schrijfVolgorde` (alleen `volgorde`) werken. De tellerregels van CK-020 zijn ongewijzigd.
  - `geldigLogo`: alleen `data:image/(png|jpeg|webp);base64,` met geldige base64, maximaal 700.000 tekens. SVG, GIF, URL's en ruwe data-URL's worden geweigerd. Een PNG van 300 x 300 px is in base64 hooguit ongeveer 480.000 tekens.
- Aantal `get()`-aanroepen: `isBeheerder` doet er één extra, op het ledendocument. De bestaande limiettests voor transacties en batches (CK-020) blijven groen.

### App (`src/main.js`)
- `isBeheerder()` leest `huidigeRol` uit `laadRol` (`leden/{uid}.rol`).
- Zijmenu: groep Beheer `zichtbaar: () => isBeheerder()`.
- `BEHEER_PAGINAS` (`beheer` plus de items van de groep Beheer) en `magNaar(id)`. `navigeer` stuurt een niet-beheerder naar Home.
- `geenBeheer(gebruiker)` staat als guard bovenaan elke beheer-render: `renderPijlersDomeinenBeheer`, `renderVermogensBeheer`, `renderOnderdeelBeheer`, `renderBestuursfunctiesBeheer` en `renderClubBeheer`. Zonder beheerrol toont die Home.
- `cijferHTML()`: de kerncijfers op het Domeinenoverzicht en de plaat zijn alleen een link als je die pagina mag openen.
- Profiel: `maxlength` en `maxFout` voor naam (100), afkorting (20) en seizoen (20). Logo: `LOGO_MAX_TEKENS` (700.000) na het verkleinen, met de foutcode `logo-te-groot`.
- Dit is gemak en geen beveiliging. De regels zijn de beveiliging.
- Lukt het laden van de rol niet (bijvoorbeeld door een netwerkfout), dan is `huidigeRol` `null` en is Beheer verborgen tot je de pagina herlaadt. Dat is bewust: bij twijfel geen Beheer.

### Omgevingsguard (`src/omgeving.js`)
De logica van `src/firebase.js` staat nu als pure functie `bepaalOmgeving()` in `src/omgeving.js`, zonder Vite-variabelen. `src/firebase.js` vult de invoer en geeft dezelfde exports (`SOORT`, `OMGEVING_LABEL`, `configFout`, `PRODUCTIE_PROJECT_ID`) en dezelfde waarschuwingen als voorheen.

### Data-controle (`scripts/controleer-p0d.mjs`, `npm run p0d:controle`)
- Controleert of jouw eigen rol `beheerder` is. Zo niet, dan kun je na het publiceren niets meer wijzigen.
- Controleert `instellingen/profiel`, `bestuursfuncties` en `structuurelementen` met `scripts/lib/p0d-velden.mjs`. Dat bestand spiegelt de regels in JavaScript en wordt in de tests tegen de regels getoetst.
- Haalt na "ja" alleen **onbekende velden** weg, zoals het oude `verantwoordelijke` uit `import-hca` en `inrichten-domeinen-hca`. Te lange teksten of verkeerde typen meldt het script alleen: die pas je aan in Beheer.
- Werkt onder de oude én de nieuwe regels, maar draai het vóór het publiceren.
- Ik kon de echte data in test en productie zelf niet lezen, want de scripts vragen jouw wachtwoord. Wat er op grond van de scripts te verwachten is: domeinen uit `import-hca`/`inrichten-domeinen-hca` kunnen nog `verantwoordelijke` hebben, als `inrichten-beheer-hca` dat veld bij die domeinen niet heeft weggehaald. Andere velden schreven de scripts en de app niet.

### Oude eenmalige scripts
`scripts/import-hca.mjs` en `scripts/inrichten-domeinen-hca.mjs` schrijven het oude veld `verantwoordelijke`. Na P0d weigeren de regels dat. Die scripts zijn klaar en worden niet meer gebruikt. `seed-testclub`, `inrichten-beheer-hca`, `inrichten-vermogens-hca`, `inrichten-projecten-samenwerkingen-hca` en `controleer-vermogens` blijven werken, als je inlogt als beheerder.

### Tests (`tests/regels.test.mjs`)
Er zijn 30 nieuwe tests. In totaal zijn het er 130, en alle 130 slagen (`npm run test:regels`).
- **P0d: alleen een beheerder schrijft** (7): lezen mag voor elk lid. Een lid met rol `lid` en een lid zonder rol worden overal geweigerd, ook bij `bevat` zetten of weghalen, bij vermogens via de app-functies en rechtstreeks, en bij projecten, samenwerkingen en commissies. De rol moet precies `beheerder` zijn. Een beheerder van een andere club schrijft niet in deze club.
- **P0d: veldcontrole** (8): het profiel, het logo (PNG, JPEG en WebP, de grens van 700.000 tekens, SVG en XSS-pogingen), bestuursfuncties, domeinen (grenzen, extra velden, lege naam, 501 tekens omschrijving, hashtag), een oud document met `verantwoordelijke`, de JS-spiegel tegen de regels en `controleerP0d`.
- **P0c** (7): zelf `gebruikers/{uid}` schrijven, zelf `leden/{uid}` aanmaken, je rol ophogen, `clubs/{id}` schrijven, het document van een ander lezen, en niet ingelogd.
- **Omgevingsguard** (8): lokaal test en productie, het productieproject zonder modus productie, een gemengde config, geen config, Vercel Production, Vercel Preview met het productie- of het testproject, en een lokale build.

## Uitrolvolgorde (Paul)
De regels gaan altijd vóór de app. Draai de data-controle vóór de regels.
1. Test: `npm run p0d:controle -- --droog`. Staat er iets? Dan `npm run p0d:controle` en "ja", en opnieuw tot er "Alles klopt" staat.
2. `npm run regels:test`
3. App op tst controleren (testlijst hieronder).
4. Productie: `npm run p0d:controle -- --omgeving=productie --droog`, dan zonder `--droog` als dat nodig is, tot er "Alles klopt" staat.
5. `npm run regels:productie`, en daarna de merge naar `main`.

**Terugdraaien:** zet `scripts/archief/firestore.rules.voor-P0d` terug als `firestore.rules` en publiceer opnieuw.

## Testlijst voor tst
Voorbereiding: een tweede testaccount in het testproject, met `gebruikers/{uid}` (`clubId` van de testclub) en `clubs/{clubId}/leden/{uid}` met `rol: 'lid'`. Maak die aan in de Firebase-console van **test**.

Als beheerder (jouw account):
1. `npm run p0d:controle -- --droog` meldt "Alles klopt", of alleen onbekende velden die je daarna opruimt.
2. Na `npm run regels:test`: het zijmenu toont Beheer met alle zeven items.
3. Club: wijzig de naam en sla op. Dat lukt. Typ een clubnaam van meer dan 100 tekens: het veld stopt bij 100.
4. Club: upload een PNG-, JPG- en WebP-logo. Elk lukt. Kies een SVG-bestand: je krijgt de melding dat het geen PNG, JPG of WebP is.
5. Domeinen: voeg een domein toe, bewerk het (met hashtag en omschrijving), zet het omhoog of omlaag, en verwijder het. Alles lukt.
6. Bestuursfuncties, Commissies, Projecten en Samenwerkingen: voeg er één toe, bewerk het en verwijder het. Alles lukt.
7. Vermogens: voeg een vermogen toe, hernoem het, verplaats het en verwijder het. Alles lukt.
8. Domeinenoverzicht en Vermogensoverzicht: de kerncijfers zijn links (met →) en openen de juiste beheerpagina.

Als lid (het tweede testaccount):
9. Na het inloggen zie je Home. In het zijmenu staan alleen Overzicht (Home, Domeinenoverzicht en Vermogensoverzicht) en Mijn account. Beheer staat er niet.
10. Domeinenoverzicht en Vermogensoverzicht laden met alle gegevens. De kerncijfers zijn vakjes zonder → en je kunt er niet op klikken.
11. Probeer via de browserconsole een domein te wijzigen. Dat lukt niet (permission-denied). Dat is optioneel en alleen als je dat wilt proberen.
12. Mijn account werkt zoals voorheen (wachtwoord wijzigen, uitloggen).

Terug naar beheerder:
13. Zet in de console de rol van het tweede account op `beheerder` en herlaad de app met dat account. Nu staat Beheer in het menu en kun je wijzigen. Zet de rol daarna terug op `lid`, of verwijder het account.

## Restrisico en vervolg
- Er is nog geen scherm om rollen toe te kennen. Je zet een rol in de Firebase-console (later: tabblad Toegang).
- Een beheerder kan het profiel nog steeds overschrijven terwijl een andere beheerder ook schrijft (CK-019).
- Het bestaan van de bestuursfunctie (`bestuursfunctieId`) wordt in de regels niet gecontroleerd (vervolgpunt CK-046).
