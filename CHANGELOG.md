# Changelog

## Ongepubliceerd

## [0.6.0] – 2026-11-23

### Gewijzigd
- Eén navigatie op elke ingelogde pagina (CK-044): Home, Domeinen, Bestuursfuncties, Club en Mijn account delen één app-shell met dezelfde petrol balk, hetzelfde zijmenu, kruimelpad en footer. Draait "Home zonder zijmenu" (CK-037) terug.
  - Zijmenu met de groepen **Overzicht** (Home) en **Beheer** (Domeinen, Bestuursfuncties, Club), onderaan "naam · rol" (naar Mijn account) en **Uitloggen** (zonder bevestiging), daaronder de knop Menu inklappen/uitklappen. Inklapbaar tot 44px; de stand blijft bewaard (`zijmenu-ingeklapt`), standaard uitgeklapt. Het zijmenu blijft in beeld bij scrollen. Actief item wit met oranje linkerrand, vet en `aria-current="page"`; ingeklapt verschijnt de naam als tooltip bij aanwijzen én bij toetsenbordfocus.
  - De witte titelbalk, het huisje en "Beheer" in de balk vervallen. De petrol balk (oranje onderrand, 52px) toont het kompas en "club**KOMPAS** · clubnaam" in wit op 22px (herziet de 30px-uitzondering uit CK-031); een lange clubnaam wordt afgekapt met "…". Het clublogo (78px, `alt=""`) staat half over de balk en half over het kruimelpad, met vrije ruimte rechts; op mobiel 36px binnen de balk.
  - Mobiel (≤700px): menuknop ☰ opent het zijmenu als uitschuifpaneel onder de omgevingsbalk, met gedimde achtergrond. Sluiten met ✕, Esc, een tik op de achtergrond of een keuze; focus gaat naar ✕ en terug naar ☰; de rest van de pagina is intussen onbereikbaar (`inert`) en scrollt niet.
  - Overslaglink "Direct naar inhoud" als eerste element.
  - Footer: links "clubKOMPAS · een product van SVN10", rechts omgeving · versie (tooltip met bouwdatum). Naam · rol en de uitlogknop zijn uit de footer verhuisd naar het zijmenu.
  - Opgeruimd: oude klassen en functies voor de bovenbalknavigatie, de footer-account en de uitlogknop.
  - Na een paginawissel via het menu, het kruimelpad of "Beheer →" krijgt het tabblad de paginanaam ("Domeinen · clubKOMPAS", met het omgevingsvoorvoegsel op Test/Ontwikkel) en gaat de focus naar de nieuwe inhoud.
  - Ingeklapt menu: de tooltip is met Esc weg te halen en met de muis te bereiken. Bij weinig schermhoogte scrolt het ingeklapte menu, zodat Uitloggen bereikbaar blijft. De lijsten in het menu blijven lijsten voor VoiceOver (`role="list"`).
  - Donker thema: balk, footer en sectiekoppen krijgen een donkere petrol (`--petrol-vlak`, wit erop 8,1:1). Het lichte thema is ongewijzigd.
  - Zonder ingestelde naam toont de accountregel alleen het deel van het e-mailadres vóór de @.
  - Huisstijl: het ☰-icoon heeft dezelfde lijndikte als de menupictogrammen; schaduwen en dimlaag lopen via tokens.
  - De lijsten op Domeinen en Bestuursfuncties passen naast het zijmenu: de kolommen geven mee met de breedte, de knoppen blijven in beeld, en is de lijst te smal dan staan de gegevens onder elkaar (container query). Voorheen vielen de knoppen bij een venster smaller dan ~1080px rechts buiten beeld.

### Beveiliging
- `esc()` escapet ook enkele aanhalingstekens. Navigatie zoekt alleen in een vaste tabel (`Map`), ids in het menu worden ge-escaped. Uitloggen buiten het menu om (bijv. in een ander tabblad) ruimt een open menupaneel op. Een mislukte uitlog wordt gelogd (alleen de foutcode).

## [0.5.0] – 2026-11-22

### Toegevoegd
- Meldingen bij opslaan (CK-023 + CK-025): elke schrijfactie in Beheer (domeinen, bestuursfuncties, clubprofiel, clublogo) en Mijn account (naam, e-mailadres, wachtwoord) toont een statusregel onder de knoppen: "✓ …" bij succes (`role="status"`, ook na opnieuw tekenen) en een foutmelding in klare taal bij een fout (`role="alert"`), met knop "Opnieuw inloggen" bij een verlopen sessie of als opnieuw inloggen nodig is. Invoer blijft staan; serverfouten die bij een veld horen (dubbele functienaam, e-mailadres in gebruik, zwak of onjuist wachtwoord) staan onder dat veld. Geen ruwe foutcodes meer in beeld (wel in de console).
- Tijdens opslaan staat de knop op "Bezig..." (`aria-disabled`, focus blijft) en doet een tweede klik niets; bij lijstacties zijn alle actieknoppen van de lijst tijdelijk inactief. Offline wordt niet geschreven; na 15 seconden zonder antwoord volgt een melding (geen automatische nieuwe poging).
- Token `--fout` (licht `#c0392b`, donker `#FF8A7A`) voor alle foutkleuren, ook in donkere modus.

### Opgelost
- Domein toevoegen, bewerken en verwijderen, bestuursfunctie verwijderen en logo verwijderen faalden stil bij een fout.
- ↑/↓ schrijft de nieuwe volgorde in één `writeBatch` (alles of niets), zodat een mislukte verplaatsing de nummering niet meer half kan beschadigen.
- Het vooraf lezen bij toevoegen (volgorde, dubbele-naamcheck) valt binnen de foutafhandeling.
- Hetzelfde logobestand opnieuw kiezen werkt na een fout; de logoknop is een echte, focusbare knop.
- Herstelronde CK-023 (bevindingen tester, huisstijl, beveiliging, compliance, toegankelijkheid):
  - Een late profiel- of logo-opslag (bijv. na een time-out en opnieuw inloggen bij een andere club) werkt het profiel in het geheugen alleen bij als dezelfde gebruiker nog in dezelfde club zit.
  - Profiel en logo schrijven alleen hun eigen velden (`merge`; logo verwijderen met `deleteField()`), zodat ze elkaar niet meer overschrijven. Geen regelwijziging nodig.
  - Logo: bestanden die geen afbeelding zijn of groter dan 10 MB worden geweigerd vóór het inlezen.
  - Console: bij opslagfouten alleen code en naam; het volledige foutobject alleen in de ontwikkelomgeving.
  - Focus valt terug op het eerste veld van het open toevoegformulier als "+ Toevoegen" verborgen is; ↑/↓ meldt de nieuwe plaats aan schermlezers via een verborgen statusregel.
  - Veldfouten bij de clientvalidatie zetten en wissen samen tekst, rode rand, `aria-invalid` en focus (eerste fout).
  - Focusring op knoppen (oranje), ook zichtbaar op een bezige knop; bezige Verwijderen-knop kleurt bij hover niet meer rood; lege meldingen nemen geen ruimte meer in.
  - "Neem contact op met SVN10" toont het supportadres als link; eigen time-outtekst bij e-mail en wachtwoord wijzigen.

### Gewijzigd
- Eigen adressen per omgeving (P0f): live op `clubkompas.svn10.nl`, online test op `tst.clubkompas.svn10.nl` (branch `test`, Vercel Preview, project `svn10-clubkompas-test`), lokaal "Ontwikkelomgeving". De omgeving wordt op één plek bepaald (`src/firebase.js`: lokaal de Vite-modus, online `VITE_OMGEVING` plus het project; Vercel Production altijd productie); nieuwe stop `test-met-productie` en `gemengde-config` voor online testbuilds (nooit op Vercel Production); melding "Inloggen is op dit adres nog niet toegestaan" bij een niet-toegestaan domein; README "Omgevingen" met werkwijze `test` → `main` en de inrichtingsstappen.
- Beveiliging omgevingen (P0f, herstel): elke online build buiten Vercel Production die naar het productieproject wijst, stopt met `test-met-productie`, ongeacht `VITE_OMGEVING`; `gemengde-config` controleert ook of `VITE_FIREBASE_APP_ID` bij `VITE_FIREBASE_MESSAGING_SENDER_ID` past (op live alleen een waarschuwing); een Vercel-build zonder `VERCEL_ENV` faalt, zodat de vorige deploy blijft staan.
- README: inrichtingsstappen aangescherpt (Authorized domains en API-keybeperking, `VITE_OMGEVING=Productie` alleen Production, Deployment Protection controleren en tester toevoegen, opheffen van `dev.` met eerst de DNS-regel weg, uitwijkroute bij uitval van Vercel).
- Technische documentatie: sectie "P0f" in `.claude/docs/P0e-technisch.md`.

## [0.4.1] – 2026-11-22

### Toegevoegd
- Aparte testomgeving (P0e): `npm run dev` draait tegen Firebase-project `svn10-clubkompas-test`; omgevingsbalk bij Test en Productie (lokaal); scripts kiezen hun omgeving met `--omgeving=test|productie` (standaard test, productie alleen na het intypen van de projectnaam); `scripts/seed-testclub.mjs`; regels publiceren met `npm run regels:test` en `npm run regels:productie`.
- Beveiliging omgevingen: de lokale app stopt bij een gemengde configuratie (ontbrekende of niet-passende Firebase-waarden) en bij productie zonder `npm run dev:productie`; scripts weigeren een ingevuld `.env.test.local.voorbeeld`; wachtwoordinvoer negeert pijl- en functietoetsen.
- Token `--on-orange` voor tekst op oranje vlakken.

### Gewijzigd
- Alle scripts gebruiken `scripts/lib/omgeving.mjs`; `scripts/import-hca.mjs` en `scripts/opschonen-dubbelen.mjs` kennen geen `--droog` en stoppen erop; `scripts/migrate.mjs` weigert altijd (verouderd).
- `npm run dev` start in modus `test`; productie lokaal kan alleen met `npm run dev:productie`.
- Technische documentatie: `.claude/docs/P0e-technisch.md`.
- Navigatie en vormgeving sinds 0.4.0 (CK-029 t/m CK-037): rustiger dashboard als Domeinenoverzicht met kerncijfers; uitgelijnde beheertabellen; #hashtag per domein (ook op het dashboard); tekstgroottes volgens de huisstijl; titelbalk 30px; omgeving, versie en rol in de footer; Instellingen opgeheven (Club onder Beheer, Mijn account via je naam); zijmenu en kruimelpad; Home als huisje in het hoofdmenu.

## [0.4.0] – 2026-11-20

### Toegevoegd
- Menu "Beheer" met tabbladen Domeinen en Bestuursfuncties (masterdata).
- Bestuursfuncties beheren; een domein kiest zijn eindverantwoordelijke uit deze lijst (`bestuursfunctieId`).
- Soort domein "overkoepelend" (Projecten, Samenwerkingen) en hun pictogrammen.
- Vaste volgorde en pictogram per domein (CK-027); één begrip "domein" met soorten (CK-026).

### Gewijzigd
- `firestore.rules`: collectie `bestuursfuncties` en type `overkoepelend` toegestaan.

## [0.3.1] – 2026-11-19

### Gewijzigd
- Supportadres `support@svn10.nl` ingevuld op de schermen "Geen club gekoppeld" en "Club laden lukt niet" (klikbare mail-link met onderwerp en account).

### Opgelost
- Clublogo wordt als favicon getoond (type volgt het logo; het element wordt vervangen). Bij logo verwijderen en uitloggen komt het kompas-icoon terug. Safari staat dynamische favicons niet toe en blijft het kompas tonen.

## [0.3.0] – 2026-11-19

### Toegevoegd
- Club is een zelfstandige tenant: `clubs/{clubId}` met lidmaatschap in `clubs/{clubId}/leden/{uid}` en een wijzer `gebruikers/{uid}.clubId`.
- `firestore.rules` in de repo, per collectie expliciet (`instellingen`, `structuurelementen`).
- Tussenschermen: laden, "Geen club gekoppeld" en "Club laden lukt niet" (met opnieuw proberen).
- `scripts/migreer-club.mjs` (eenmalig, `--droog` beschikbaar) en `scripts/firestore.rules.migratie` (overgangsregels).

### Gewijzigd
- `huidigClubId` komt uit `gebruikers/{uid}.clubId` in plaats van de Firebase-uid.
- `scripts/import-hca.mjs` en `scripts/opschonen-dubbelen.mjs` lezen het clubId uit `gebruikers/{uid}` en breken af zonder koppeling; `import-hca.mjs` leest het wachtwoord niet meer uit `argv`.
- Logo wordt alleen geaccepteerd als `data:image/`-string, in app én regels.

### Verwijderd
- Niets. De oude data onder `clubs/{oudeUid}` blijft staan als archief.
