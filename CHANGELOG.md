# Changelog

## [0.16.0] – 2026-11-25

### Gewijzigd (CK-174: uitvoeringen beheren in het formulier van de activiteit)
- De uitvoeringen van een activiteit beheer je nu in het formulier van de activiteit zelf. Het uitklapdeel in de lijst is weg. In het blok "Uitvoeringen" staat elke uitvoering op een eigen regel, met begindatum, einddatum, het label voorbij of bezig, en een prullenbak. Met "+ Uitvoering toevoegen" maak je een nieuwe regel. De knop Nieuwste eerst / Oudste eerst staat boven de regels.
- Opslaan bewaart de activiteit en alle uitvoeringen in één keer. Annuleren draait alles terug. Haal je opgeslagen uitvoeringen weg, dan vraagt de app één keer om bevestiging. Een lege regel en twee uitvoeringen op dezelfde dag geven een foutmelding.
- De regels zijn niet veranderd. 194 regeltests.

## [0.15.0] – 2026-11-25

### Toegevoegd (CK-172: uitvoeringen van een activiteit)
- Een activiteit kan nu meerdere uitvoeringen hebben, zoals de ALV een paar keer per jaar. Een uitvoering heeft een begindatum en eventueel een einddatum. Het vermogen en de commissie blijven bij de activiteit.
- Beheer → Activiteiten toont per activiteit het aantal uitvoeringen en de eerstvolgende datum (of "laatst: …"). Klap je een activiteit uit, dan zie je haar uitvoeringen. Je kunt ze toevoegen, bewerken en verwijderen, en met een knop kies je "Nieuwste eerst" of "Oudste eerst".
- Een nieuwe activiteit krijgt meteen haar eerste uitvoering. De lijst staat op volgorde: eerst bezig of komend, dan voorbij, dan zonder uitvoering.
- Een activiteit verwijder je samen met haar uitvoeringen, na één bevestiging met het aantal. Een naam van een activiteit is uniek in de club.
- Omzetscript `npm run uitvoeringen:omzetten` (`--droog`). In productie draait het alleen droog. Test is omgezet (2 activiteiten).

### Beveiliging
- Regels voor `clubs/{clubId}/uitvoeringen`: alleen een beheerder schrijft, elk lid leest, de velden liggen precies vast, de activiteit moet bestaan en `activiteitId` kan niet veranderen. Een activiteit heeft geen datumvelden meer. 177 regeltests. Gepubliceerd in test en productie op 25 november 2026.

## [0.14.0] – 2026-11-25

### Toegevoegd (CK-170: Beheer → Activiteiten)
- Nieuwe beheerpagina Activiteiten, direct na Vermogens in het zijmenu. Een activiteit heeft een naam, een soort, een begindatum, een optionele einddatum, een vermogen en een optionele commissie. De lijst staat op datum en heeft een filter op soort.
- Een vermogen of commissie met activiteiten kan niet worden verwijderd; de app telt vlak vóór de bevestiging.
- Nieuwe module `src/activiteiten.js` (zonder DOM) voor latere schermen.

### Beveiliging
- Regels voor `clubs/{clubId}/activiteiten`: alleen een beheerder schrijft, elk lid leest, exacte velden, vermogen en commissie moeten bestaan (152 regeltests). Gepubliceerd in test en productie op 25 november 2026.

## [0.13.4] – 2026-11-24

### Gewijzigd (CK-057: fixpakket uit de gerichte analyse van v0.13.3)
- Een overkoepelend domein dat projecten of samenwerkingen op de plaat toont, kun je weer omzetten naar pijler of ondersteunend domein. De koppeling `bevat` gaat dan weg.
- Snel weg en terug navigeren naar Domeinen of Bestuursfuncties geeft geen dubbele klikafhandeling meer.
- De melding bij een onzichtbaar teken in een naam noemt ook samengestelde emoji (zoals een gezin).

### Beveiliging
- Namen worden strenger gecontroleerd op onzichtbare tekens. Alle stuur- en opmaaktekens en regel- en alineascheidingen worden geweigerd (`\p{Cc}`, `\p{Cf}`, `\p{Zl}`, `\p{Zp}`), in de regels, de app en `p0d:controle` gelijk. Accenten, leestekens en gewone emoji blijven mogelijk.
- 133 regeltests, met een positieve controle bij de test voor een beheerder van een andere club.

## [0.13.2] – 2026-11-24

### Gewijzigd (CK-056: fixpakket uit de analyse van v0.13.0)
- Een lid (zonder Beheer) leest bij een lege lijst niet meer dat hij iets "via Beheer" moet toevoegen, maar dat een beheerder dat doet.
- Mijn account: de drie opslaanknoppen zijn primair (besluit 40). Verwijderen vraagt overal om bevestiging met dezelfde vaste zin, ook bij Vermogens, Projecten, Samenwerkingen, Commissies en het logo.
- De melding na automatisch uitloggen wordt door een schermlezer voorgelezen. De kalenderknop van de datumkiezer hoort niet meer bij de foutmelding van het veld.
- Na "Opnieuw laden" op het Domeinenoverzicht blijft de focus ook voor een lid op de pagina. Geen consolefout meer als je tijdens het laden van Domeinen of Bestuursfuncties wegklikt.
- Een naam met een onzichtbaar teken (bijvoorbeeld uit een gekopieerde tekst) geeft een duidelijke melding.

### Beveiliging
- Firestore-regels: het pictogram van een domein komt uit de vaste lijst; de namen van het profiel, de bestuursfuncties en de domeinen mogen geen stuur-, nul-breedte- of bidi-tekens bevatten; `bevat` staat alleen op een overkoepelend domein. Er is een test dat een beheerder van een andere club in geen enkele collectie kan schrijven (131 regeltests). `npm run p0d:controle` controleert de nieuwe regels mee.
- `vercel.json`: `Strict-Transport-Security` en `Permissions-Policy` erbij.
- Oude regelbestanden staan in `scripts/archief/`, met een waarschuwing. `migreer-club.mjs` toont alle data via `veilig()`.

## [0.13.1] – 2026-11-24

Alleen het versienummer is opgehoogd; de fixes van CK-056 staan in 0.13.2.

## [0.13.0] – 2026-11-24

### Beveiliging (P0d: Beheer alleen voor beheerders)
- Firestore-regels: alleen een lid met `rol: 'beheerder'` mag de clubgegevens wijzigen (profiel, bestuursfuncties, domeinen en `bevat`, vermogens, commissies, projecten en samenwerkingen). Veldcontrole met `hasOnly`, typen en lengtes op profiel, bestuursfuncties en domeinen. Een logo alleen als PNG, JPG of WebP, met een lengtegrens; de omschrijving van een domein maximaal 500 tekens.
- App: Beheer staat alleen in het zijmenu en is alleen te openen voor een beheerder. Een lid ziet de overzichten, met kerncijfers zonder link.
- De omgevingsguard staat in `src/omgeving.js` en is getest. Er zijn 30 nieuwe regeltests (130 van 130). Nieuw controlescript: `npm run p0d:controle`.
- De regels zijn op 24-11-2026 gepubliceerd in test en productie.

### Toegevoegd
- Automatisch uitloggen na 8 uur zonder klikken of typen (CK-052). Het tijdstip wordt gedeeld tussen tabbladen; ook een pagina die na 8 uur opnieuw wordt geopend, logt uit. Het inlogscherm zegt waarom.

### Gewijzigd (CK-048: laadfouten en toegankelijke formulieren)
- Mislukt het laden op het Domeinenoverzicht, in Beheer → Domeinen of in Bestuursfuncties, dan staat er een melding met "Opnieuw laden", net als bij Vermogens. Eén gedeelde helper (`laadfoutHTML`, `bindHerlaad`) voor alle pagina's.
- Inlogscherm: fouten staan bij het veld zelf, met `aria-invalid` en `aria-describedby`, en de focus gaat naar het veld. De knop blijft focusbaar tijdens het inloggen (`aria-disabled`).
- Datumkiezer: de focus komt nooit op een uitgeschakelde dag, zodat Escape blijft werken. "Vandaag" is uitgeschakeld als vandaag buiten de grenzen valt.
- De eigen keuzelijst en de datumkiezer krijgen een rode rand bij een fout.

### Gewijzigd (CK-050: beheertabellen gelijk)
- Dezelfde teksten in alle beheertabellen: bij verwijderen ("Domein X verwijderen? Dit kan niet ongedaan worden gemaakt."), bij validatie ("Vul een naam in.", "Een naam heeft minimaal 2 tekens."), bij een dubbele naam en bij een lege lijst. Alle validatieteksten eindigen op een punt.
- Enter in een tekstveld slaat op, nu ook bij Domeinen en Bestuursfuncties. De pijlknoppen heten overal "Omhoog: X" en "Omlaag: X".
- De omschrijving van een domein is een tekstvak, net als bij projecten, met een maximum van 500 tekens.
- Elke beheerpagina heeft een h1 en elke sectie is een regio voor de schermlezer. In een smalle tabel blijven de kolomkoppen voor de schermlezer bestaan; de bewerkrij van Domeinen en Bestuursfuncties heeft `role="cell"`.
- Opgeruimd: `src/counter.js`, `src/assets/`, `public/icons.svg`, een ongebruikte import en ongebruikte CSS. Oudere scripts tonen namen via `veilig()`; `scripts/firestore.rules.migratie` heeft een duidelijke waarschuwing.

### Gewijzigd (CK-052)
- Bij een lage viewport (onder 500 px hoog, zoals 400 % zoom) staat niets meer vast en scrolt de hele pagina.
- "+ Toevoegen" heeft dezelfde letterstijl als de andere knoppen.
- De kleuren van de omgevingsbalk staan als tokens in `:root`.

### Beveiliging
- Een logo moet een PNG, JPG of WebP zijn; een SVG wordt niet meer geaccepteerd of getoond. De bijbehorende Firestore-regel volgt met P0d.

## [0.12.2] – 2026-11-23

### Gewijzigd (CK-047)
- Invoervelden hebben een duidelijkere rand (eigen token `--rand-invoer`, 3,4:1 op wit en 3,7:1 in het donkere thema). Kaart- en tabelranden blijven licht (`--border`).
- Opslaan is in elk formulier de primaire knop (petrol vlak, besluit 40). Annuleren blijft secundair.
- Het logo verwijderen vraagt eerst om bevestiging: "Clublogo verwijderen? Dit kan niet ongedaan worden gemaakt." (besluit 41).
- Beheer → Domeinen: de hint zegt nu "De volgorde wijzig je bij Alle soorten." De naam van een domein is maximaal 200 tekens, net als in de regels.
- Inlogscherm: een onbekende fout toont een gewone tekst in plaats van een technische code.
- De toelichting in een petrol sectiekop heeft geen doorzichtigheid meer (4,9:1). Rijnummers zijn niet meer vet (besluit 21). Eindverantwoordelijke en Eigenaar zijn even groot (14 px).
- Het stipje bij de soort van een domein krijgt zijn kleur via een klasse in plaats van een `style`-attribuut (nodig voor de CSP).

### Beveiliging en privacy
- Het lettertype Barlow Semi Condensed staat lokaal in `public/fonts/` (latin, 400, 400 cursief, 500, 600, 700; OFL 1.1 van fontsource). Er gaat geen verzoek meer naar Google Fonts.
- Nieuw `vercel.json` met beveiligingsheaders: Content-Security-Policy (alleen eigen bestanden plus Firebase: Firestore, Identity Toolkit, Secure Token, firebaseio en de auth-domeinen van test en productie; `img-src 'self' data:` voor het logo), `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` en `Referrer-Policy: strict-origin-when-cross-origin`.

## [0.12.1] – 2026-11-23

### Gewijzigd
- Productie: de petrol omgevingsbalk zonder tekst onderaan is weg. Test, ontwikkel en productie lokaal houden hun balk.

## [0.12.0] – 2026-11-23

### Toegevoegd
- Beheer → Commissies (CK-041): commissies aanmaken, bewerken, ↑/↓ en verwijderen, met naam, omschrijving en eigenaar (een bestuursfunctie). De pagina staat in het zijmenu direct na Bestuursfuncties. Commissies staan alleen in Beheer, niet op de overzichten. Nieuwe collectie `commissies` met Firestore-regels en regeltests (100 van 100 groen).

### Gewijzigd
- Beheer → Bestuursfuncties: de kolom "Eindverantwoordelijk voor" en de verwijderblokkade tellen ook commissies.

## [0.11.3] – 2026-11-23

### Gewijzigd
- Vermogensoverzicht: de periode van een project staat achter de projectnaam in plaats van eronder.

## [0.11.2] – 2026-11-23

### Gewijzigd
- Vermogensoverzicht: het woord "Eindverantwoordelijke:" staat niet meer zichtbaar bij een domein; alleen de bestuursfunctie (voor schermlezers blijft het label).

## [0.11.1] – 2026-11-23

### Gewijzigd
- Omgevingsbalk staat nu onderaan, direct boven de footer (ook op inlog- en laadschermen). De titelbalk is 80px hoog (vroeger balk 52 + omgevingsbalk 28); titel en kompas staan er verticaal gecentreerd in. Het clublogo hangt nog steeds 11px over het kruimelpad; het mobiele paneel begint bovenaan.
- Clublogo 15% groter: 90px (telefoon 41px), 16px van boven en van rechts.
- Tekstschaal een stap groter (Barlow Semi Condensed is smal): lopende tekst 16px (was 14), bloknaam 16 (15), toelichting 14 (13), label 13 (12); regelhoogte lopende tekst 24px. Titelbalk afgerond op 32px (telefoon 26px). Zijmenu 192px breed (was 172), zodat "Vermogensoverzicht" past.

## [0.11.0] – 2026-11-23

### Toegevoegd
- Eigen keuzelijst en datumkiezer in de stijl van de app, in plaats van de lijst en kalender van de browser (`src/keuzelijst.js`). Het echte veld blijft verborgen de bron van de waarde. Keuzelijst: pijltjes, Home/End, typen om te zoeken, Enter/Spatie, Esc. Datumkiezer: typen als dd-mm-jjjj of kiezen in een kalender (maandag eerst, pijltjes, PageUp/PageDown, Vandaag, Leegmaken), met de bestaande foutmeldingen.

### Gewijzigd
- Titelbalk: titel en kompas nog eens 20% groter (titel 31,7px, kompas 35px).
- Home: de zin luidt nu "Bij het clubKOMPAS van <clubnaam>."
- Beheer → Projecten: de periode staat achter de projectnaam; de kolom Periode is weg.
- Beheer → Domeinen: kolomkop "Icon" boven de pictogrammen.
- Alle beheertabellen: de rijnummers zijn altijd zichtbaar (plaats in de hele lijst). Met een filter verdwijnen de pijlknoppen; alleen bij Vermogens blijven ze, want daar schuif je binnen één domein.
- Zijmenu Beheer in de volgorde Club, Bestuursfuncties, Domeinen, Vermogens, Projecten, Samenwerkingen.

## [0.10.1] – 2026-11-23

### Gewijzigd
- Titelbalk: de titel (clubKOMPAS · clubnaam) en het kompas zijn 20% groter (titel 26,4px, kompas 29px; op de telefoon 21,6px en 26px).
- Domeinenoverzicht: de knop "Beheer →" onder de domeinen is weg; beheer gaat via het zijmenu of de kerncijfers.
- Beheer → Vermogens: per domein geen soortlabel en geen aantal meer in de kop; elke tabel heeft zichtbare kolomkoppen (#, Vermogen).

## [0.10.0] – 2026-11-23

### Toegevoegd
- Projecten en samenwerkingen beheren (CK-046): nieuwe pagina's **Beheer → Projecten** en **Beheer → Samenwerkingen** (naam, omschrijving, eigenaar uit de bestuursfuncties; een project ook status en begin- en einddatum). Toevoegen, bewerken, ↑/↓, verwijderen, statusfilter bij projecten, lege staat en laadfout met **Opnieuw laden**.
- Vermogensoverzicht: in het overkoepelende domein met `bevat` staan kaartjes voor projecten en samenwerkingen in plaats van de omschrijving. Een project in voorbereiding is gestippeld (zonder zichtbare tekst; voor schermlezers staat "in voorbereiding" erbij), een afgerond project staat er niet op.
- Firestore-regels voor `projecten` en `samenwerkingen`, en het veld `bevat` op structuurelementen. Datums zijn `JJJJ-MM-DD` of leeg, met einddatum niet vóór begindatum.
- Vermogensoverzicht: kerncijfers bovenaan (Pijlers, Ondersteunende domeinen, Vermogens, Projecten, Samenwerkingen), in dezelfde vorm als op het Domeinenoverzicht. Projecten telt alleen wat op de plaat staat (lopend en in voorbereiding). Alle kerncijfers (ook op het Domeinenoverzicht) zijn doorklikbaar naar de beheerpagina; Pijlers, Ondersteunende en Overkoepelende domeinen openen Beheer → Domeinen met het juiste filter.
- Script `npm run projecten:import` (HCA, `--droog`, idempotent, één batch) dat de projecten en samenwerkingen aanmaakt en `bevat` zet.

### Gewijzigd
- Beheer → Bestuursfuncties: de kolom toont ook projecten en samenwerkingen waarvan de functie eigenaar is. Verwijderen is geblokkeerd zolang de functie ergens eindverantwoordelijke of eigenaar van is.
- Alle beheertabellen (Domeinen, Vermogens, Bestuursfuncties, Projecten, Samenwerkingen): de rijen staan als witte kaart met een rand op het grijze vlak, zoals in het prototype van CK-046. Alle lijnen zijn 1 px.
- Beheertabellen Domeinen, Bestuursfuncties, Projecten en Samenwerkingen: kolommen staan van links achter elkaar, zo breed als hun langste waarde, met 30 px ertussen; de knoppen blijven rechts. Geen vette waarden meer, nooit twee waarden onder elkaar (Domeinen krijgt een kolom Vermogens); omschrijvingen staan nooit in een tabel. Labels van soorten zijn rond, zoals de status van projecten. Het woord "Toon" voor de filters is weg (blijft als verborgen label voor schermlezers). De knoppen ↑/↓ zijn pictogrammen in dezelfde lijnstijl als bewerken en verwijderen.

## [0.9.0] – 2026-11-23

### Gewijzigd
- Home is een welkomspagina: "Welkom, naam" met "Welkom bij clubKOMPAS van clubnaam" (CK-045).
- Het vroegere Home heet nu **Domeinenoverzicht** en is een eigen pagina. Zijmenu Overzicht: Home, Domeinenoverzicht, Vermogensoverzicht; onder Beheer heet het item weer **Vermogens**.
- De accountregel in het zijmenu toont alleen de naam, zonder rol.
- Vermogensoverzicht: ondersteunende domeinen hebben dezelfde petrol bovenrand als de pijlers; de overkoepelende domeinen gebruiken de volle breedte.
- Paginatitels zijn niet meer deels vet.
- De titelbalk en de footer blijven in beeld; alleen de inhoud scrolt.
- Het kruimelpad blijft ook staan bij scrollen. Zijmenu op een raster van 44px (kopjes en items even hoog als het kruimelpad); naam en "Menu inklappen" 14px.
- Het clublogo staat hoger en steekt boven de titelbalk uit.
- De omgevingsbalk staat in elke omgeving: productie petrol zonder tekst, test grijs en ontwikkel oranje (beide met zwarte letters); lokaal tegen productie petrol met waarschuwing.

## [0.8.0] – 2026-11-23

### Toegevoegd
- De plaat (CK-021): nieuwe alleen-lezen pagina **Vermogens** (zijmenu, groep Overzicht, onder Home, pictogram tegels, kruimelpad Home › Vermogens). Pijlers als kolommen, daaronder de ondersteunende domeinen en de overkoepelende domeinen met omschrijving; per domein de eindverantwoordelijke en de vermogens in de vaste volgorde. Lege toestanden, laadfout met **Opnieuw laden**, en een voetnoot voor vermogens die niet bij een pijler of ondersteunend domein horen.

### Gewijzigd
- Home: het kerncijfer **Vermogens** is een link naar de plaat.
- Het beheeritem heet nu **Vermogens beheren** (zijmenu, kruimelpad, titel).

## [0.7.0] – 2026-11-23

### Toegevoegd
- Vermogens beheren (CK-020): nieuwe pagina **Beheer → Vermogens** (zijmenu tussen Domeinen en Bestuursfuncties, puzzelpictogram, kruimelpad Home › Beheer › Vermogens). Vermogens staan gegroepeerd per pijler en ondersteunend domein, in de domeinvolgorde; met **Toon** kies je één domein. Toevoegen, hernoemen, naar een ander domein verplaatsen, ↑/↓ binnen het domein en verwijderen (met bevestiging), met de CK-023-meldingen. Lege staat met uitleg, groep "Zonder geldig domein" voor vermogens bij een verdwenen of overkoepelend domein, en een nette melding als laden mislukt.
- Een vermogensnaam is uniek in de club (hoofdletters en spaties maken geen verschil) en heeft 2–100 tekens: letters (ook met accent), cijfers, spaties en `& ' - . , ( ) +`. De veldfout noemt het teken dat niet kan.
- Home: vierde kerncijfer **Vermogens** en per pijler- of ondersteunende kaart "n vermogens" of "Nog geen vermogens". Laden de vermogens niet, dan werkt Home gewoon, met "–" en een korte melding.
- Firestore-regels voor `vermogens` en `vermogensnamen`, en een teller `aantalVermogens` op domeinen. De regels dwingen af: unieke naam, vermogen alleen bij een pijler of ondersteunend domein, teller alleen ±1 samen met het vermogen, en een domein met vermogens kan niet weg en niet naar overkoepelend. Werkt ook met de huidige app (domeinen zonder teller = 0).
- Scripts `npm run vermogens:import` (58 HCA-vermogens, `--droog`, idempotent, één transactie per vermogen) en `npm run vermogens:controle` (controleert tellers en naamdocumenten, herstelt naamdocumenten, meldt de rest met de juiste waarde voor de console).
- Regeltests met de Firestore-emulator: `npm run test:regels` (geen login, project `demo-clubkompas`).

### Gewijzigd
- Beheer → Domeinen en Bestuursfuncties: de balk met **+ Domein toevoegen** / **+ Bestuursfunctie toevoegen** staat bovenaan, het formulier en de meldingen eronder, boven de lijst. Domeinen filter je met de keuzelijst **Toon** op soort (in plaats van vier knoppen); bij een andere soort dan "Alle soorten" legt een regel uit waarom ↑/↓ weg zijn.
- Bewerken en Verwijderen zijn op alle beheerlijsten pictogramknoppen (potlood, prullenbak) met tooltip en een naam voor de schermlezer ("Bewerken: Leden"); op de telefoon zijn alle rijknoppen 44×44px. Tijdens verwijderen blijft het pictogram staan.
- Domeinen: onder de naam staat "n vermogens" of "Nog geen vermogens", met een link naar de vermogens van dat domein. Een domein met vermogens verwijderen of overkoepelend maken geeft meteen een melding met de knop **Naar de vermogens van …**, ook als de database het weigert omdat iemand tegelijk iets toevoegde. Bij verwijderen gaat de focus naar die knop.
- Knoppen in lijsten en formulieren krijgen bij toetsenbordfocus naast de oranje rand een donkere binnenlijn (beter zichtbaar in het lichte thema). ↑/↓ heten voor de schermlezer "Omhoog: X" / "Omlaag: X", net als "Bewerken: X".
- Home: de vier kerncijfers staan tot 900px breed in een raster van 2×2. Velden in alle beheerformulieren zijn maximaal 480px breed. In donkere modus is het pijltje van keuzelijsten lichter.

### Beveiliging
- Regels: de volgorde van een vermogen is hoogstens 100000, en `laatsteVermogenId` op een domein is altijd een korte tekst. Scripts tonen stuurtekens uit clubdata als zichtbare code in de terminal, zodat een naam de uitvoer niet kan verstoren.

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
