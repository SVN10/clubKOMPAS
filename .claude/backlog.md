# clubKOMPAS — Backlog

> **Nummering:** deze bouwbacklog is leidend voor de CK-nummers, omdat de commits ernaar verwijzen.
> De productbacklog-artifact (v4.1) gebruikt dezelfde nummers. "Clubidentiteit vastleggen" heet daar CK-018.

## Sprint 1 — Fundament

### ✅ CK-010 — Pijlers aanmaken (Model-laag M0)
*Afgerond. Pijlers aanmaken met naam, slogan, eindverantwoordelijke. Opgeslagen in localStorage.*

---

### ✅ P0a — Firebase Authentication (Platform-laag P0)
**Status:** Afgerond

*Als bestuurder wil ik kunnen inloggen met e-mail en wachtwoord, zodat alleen geautoriseerde gebruikers toegang hebben tot het clubbeheer.*

**Acceptatiecriteria:**
- [ ] Inlogscherm met e-mail + wachtwoord
- [ ] Foutmelding bij verkeerde gegevens
- [ ] Na inloggen: doorsturen naar het dashboard
- [ ] Uitloggen-knop beschikbaar
- [ ] Niet-ingelogde gebruiker ziet alleen het inlogscherm

---

### ✅ P0b — Firestore datamodel (Platform-laag P0)
**Status:** Afgerond

*Als platform wil ik clubdata opslaan in Firestore met club als tenant-root, zodat data persistent is en multi-tenancy correct is ingericht.*

**Acceptatiecriteria:**
- [ ] Firestore-structuur: `clubs/{clubId}/pijlers/{pijlerId}`
  *(Later vervangen door `clubs/{clubId}/structuurelementen`, zie CK-015.)*
- [ ] Pijlers uit CK-010 lezen en schrijven via Firestore in plaats van localStorage
- [ ] Schrijfrechten beperkt tot ingelogde gebruiker van die club
- [ ] Bestaande functionaliteit (aanmaken, weergeven) blijft werken

**Afhankelijkheid:** P0a moet klaar zijn voor P0b start.

---

### ✅ CK-011 — Pijler bewerken en verwijderen (Model-laag M0)
**Status:** Afgerond

*Als bestuurder wil ik een zelf aangemaakte pijler kunnen bewerken of verwijderen.*

**Opmerkingen:** Hardcoded pijlers mogen niet verwijderd worden. Start na P0b.

---

## Sprint 2 — Clubstructuur

### ✅ P1 — Clubprofiel (Platform-laag P1)
**Status:** Afgerond

*Als bestuurder wil ik de basisinformatie van mijn club kunnen instellen, zodat het platform de juiste clubnaam en het juiste seizoen toont.*

**Acceptatiecriteria:**
- [ ] Clubnaam, afkorting en huidig seizoen instelbaar
- [ ] Clubnaam zichtbaar in topbalk en footer in plaats van "clubKOMPAS"
  *(Footer toont sinds CK-016 weer altijd "clubKOMPAS · een product van SVN10".)*
- [ ] Opgeslagen in Firestore onder `clubs/{clubId}/profiel`
- [ ] Bewerken via een instellingenscherm

---

### ✅ CK-012 — Domeinen aanmaken (Model-laag M0)
**Status:** Afgerond

*Als bestuurder wil ik operationele domeinen kunnen aanmaken, zodat ik naast pijlers ook de domeinen van mijn club kan beheren.*

**Acceptatiecriteria:**
- [ ] Domein aanmaken met naam, omschrijving en type (Domein)
- [ ] Domeinen opgeslagen in Firestore: `clubs/{clubId}/domeinen/{domeinId}`
  *(Later vervangen door `clubs/{clubId}/structuurelementen`, zie CK-015.)*
- [ ] Domeinen weergegeven in het grid naast pijlers
- [ ] Hardcoded domeinen (Bestuur, Financiën, Communicatie) blijven zichtbaar maar zijn niet bewerkbaar
  *(Vervallen: de hardcoded voorbeeldkaarten zijn verwijderd in CK-016.)*

**Afhankelijkheid:** P0b

---

### ✅ CK-013 — Domeinen bewerken en verwijderen (Model-laag M0)
**Status:** Afgerond

*Als bestuurder wil ik een zelf aangemaakt domein kunnen bewerken of verwijderen.*

**Acceptatiecriteria:**
- [ ] Bewerken en verwijderen van dynamische domeinen (zelfde patroon als CK-011)
- [ ] Hardcoded domeinen zijn niet verwijderbaar

**Afhankelijkheid:** CK-012

---

## Sprint 2b — Afronding en opschoning
*Werk dat na Sprint 2 is gedaan, buiten de oorspronkelijke backlog om.*

### ✅ CK-014 — Versie, clublogo en vormgeving (v0.2.0)
**Status:** Afgerond

- [x] Versie-informatie zichtbaar in footer en instellingen
- [x] Clublogo uploaden, tonen in de topbalk en als favicon
- [x] clubKOMPAS-kompasicoon als standaard favicon
- [x] Titelbalk en footer opnieuw vormgegeven volgens de mockup
- [x] Accountbeheer in Instellingen: eigen naam, e-mail en wachtwoord (geen beheer van meerdere gebruikers)
- [x] Koppen en knoppen in hoofdletters
- [x] 8 bevindingen uit de code-review verwerkt

---

### ✅ CK-015 — Pijlers en domeinen samengevoegd (v0.2.1)
**Status:** Afgerond

*Pijlers en domeinen hebben dezelfde structuur en staan nu samen in één collectie.*

- [x] Firestore-structuur: `clubs/{clubId}/structuurelementen/{id}` met veld `type` (`pijler` of `domein`)
- [x] Eén beheerpagina "Pijlers & Domeinen" met filter Alles / Pijlers / Domeinen
- [x] Bestaande data overgezet met `scripts/migrate.mjs`

---

### ✅ CK-016 — HCA-gegevens en opgeschoond dashboard
**Status:** Afgerond

- [x] HCA-pijlers (#HCASpeelt, #HCAGroeit, #HCADoet) en -domeinen (Bestuur, Communicatie, Financiën) geïmporteerd met `scripts/import-hca.mjs` (slaat bestaande items over)
- [x] Dubbele items verwijderd met `scripts/opschonen-dubbelen.mjs` (6 dubbel, 6 over)
- [x] Hardcoded voorbeeldkaarten (#JouwClub… en standaarddomeinen) van het dashboard verwijderd; zonder items verschijnt een melding
- [x] Footer toont altijd "clubKOMPAS · een product van SVN10"
- [x] Scripts vragen het wachtwoord zonder het op het scherm te tonen

**Open punten:**
- [x] Omschrijvingen van de HCA-pijlers overgenomen uit "De missie van HCA"
- [x] Eindverantwoordelijken ingevuld: #HCASpeelt = Bestuurslid Hockey, #HCAGroeit = Voorzitter, #HCADoet = Voorzitter

---

## Sprint 3 — Voorstel (nog in te plannen)

### ✅ P0c — Club loskoppelen van gebruiker (Platform-laag P0)
**Status:** ✅ Live sinds 19 november 2026 (v0.3.0), migratie en rookproef geslaagd · **Prioriteit:** Must

**Logboek:** `.claude/reports/P0c-migratielogboek.md`

**Eindoordeel:** `.claude/reports/P0c-eindoordeel.md`

**Specificatie:** `.claude/specs/P0c-club-loskoppelen.md` · **Gebruikersreis:** `.claude/specs/P0c-gebruikersreis.md`

*Als bestuurder wil ik met mijn eigen account toegang krijgen tot de club waar ik lid van ben, zodat meerdere bestuurders samen in dezelfde club kunnen werken.*

**Acceptatiecriteria:**
- [ ] Koppeling gebruiker → club (bijv. `gebruikers/{uid}.clubId` of `clubs/{clubId}/leden/{uid}` met rol); `huidigClubId` komt uit die koppeling en niet meer uit `uid`
- [ ] Firestore-regels: alleen leden van een club mogen `clubs/{clubId}/**` lezen en schrijven
- [ ] Firestore-regels opgenomen in de repo (`firestore.rules`)
- [ ] Migratie van de bestaande data van `clubs/{uid}` naar een echte clubId (HCA)
- [ ] Profiel, logo en structuurelementen blijven werken

---

### ✅ CK-017 — Dashboardcijfers uit echte gegevens
**Status:** Afgerond

*Als bestuurder wil ik dat de cijfers op het dashboard kloppen met de gegevens van mijn club.*

**Acceptatiecriteria:**
- [x] Aantal strategische pijlers en operationele domeinen wordt geteld uit `structuurelementen` (was vast "3" en "12")

---

### ✅ CK-026 — Eén begrip: domein, met twee soorten
**Status:** Gebouwd (19 november 2026)

*Pijlers en domeinen heten voortaan allemaal **domein**. Er zijn twee soorten: **pijler** (strategisch domein: waar de club voor staat) en **ondersteunend domein** (wat nodig is om de club te laten draaien). Sluit aan op het Verenigingsmodel.*

- [x] Menu en koppen: "Domeinen" in plaats van "Pijlers & Domeinen"; filters Alles / Pijlers / Ondersteunend
- [x] Kaarten: "Pijler · strategisch domein" en "Ondersteunend domein"; dashboardcijfers "Pijlers" en "Ondersteunende domeinen"
- [x] Eindverantwoordelijke (bestuursfunctie) verplicht voor beide soorten
- [x] Technisch ongewijzigd: veld `type` blijft `pijler` / `domein`, geen migratie, geen wijziging in `firestore.rules`

**Opgelost:** eindverantwoordelijken en omschrijvingen van Bestuur, Communicatie en Financiën ingevuld.

---

### ✅ CK-027 — Alle HCA-domeinen, vaste volgorde en pictogrammen
**Status:** Gebouwd (19 november 2026) · bron: Vermogensoverzicht HCA v1.4 en Huisstijl HCA (pictogrammen)

- [x] 7 ontbrekende domeinen toegevoegd: Leden, Vrijwilligers, Relaties, Accommodatie, Hospitality, Materiaal, Digitaal (13 in totaal: 3 pijlers, 10 ondersteunend)
- [x] Eindverantwoordelijken met de officiële titels: Voorzitter, Secretaris, Penningmeester, Bestuurslid Hockey, Bestuurslid Accommodatie, Bestuurslid Hospitality
- [x] Vaste volgorde (veld `volgorde`, 1 t/m 13), aan te passen met ↑/↓ in Domeinen (filter Alles); nieuw domein komt onderaan
- [x] Vast pictogram per domein (veld `icoon`), te kiezen bij toevoegen en bewerken; pijler groot boven de naam, ondersteunend domein klein ervoor
- [x] Data ingericht met `scripts/inrichten-domeinen-hca.mjs` (droogtest + bevestiging)

**Open:**
- Omschrijvingen van de 7 nieuwe domeinen zijn samengesteld uit hun vermogens; door de PO te controleren.
- Projecten en Samenwerkingen (Vermogensoverzicht) zijn geen domein; plek in het model nog te bepalen.
- De pictogrammen zijn de HCA-set in `public/pictogrammen/`; bij een tweede club is een eigen set per club nodig.

---

### ✅ CK-028 — Beheer: bestuursfuncties als masterdata en overkoepelende domeinen
**Status:** Gebouwd (20 november 2026, v0.4.0)

- [x] Menu "Beheer" (masterdata) met tabbladen Domeinen en Bestuursfuncties
- [x] Bestuursfuncties: toevoegen, naam wijzigen, volgorde (↑/↓), verwijderen; niet te verwijderen zolang een domein eraan hangt; dubbele namen geweigerd
- [x] Domein kiest zijn eindverantwoordelijke uit een keuzelijst (veld `bestuursfunctieId`); het oude tekstveld `verantwoordelijke` is opgeruimd
- [x] Derde soort domein: overkoepelend (Projecten op 14, Samenwerkingen op 15, eindverantwoordelijke Voorzitter), met eigen filter en pictogram
- [x] `firestore.rules`: collectie `bestuursfuncties` (naam 2–100 tekens) en type `overkoepelend`
- [x] Data ingericht met `scripts/inrichten-beheer-hca.mjs`: 6 bestuursfuncties, 2 domeinen, 15 koppelingen

**Later:** alleen de rol `beheerder` mag masterdata wijzigen (P0d); domein niet verwijderen zolang er vermogens aan hangen (CK-020).

---

### ✅ CK-029 — Layout: rustiger dashboard en uitgelijnde beheertabellen
**Status:** Gebouwd (20 november 2026)

- [x] Dashboard: drie domeinen per rij (twee op tablet, één op telefoon), alle kaarten even hoog en gelijk opgebouwd (pictogram naast de naam, omschrijving max. 3 regels, label onderaan)
- [x] Beheer → Domeinen: tabel met vaste kolommen (#, pictogram, domein, soort, eindverantwoordelijke, acties) en kolomkoppen; omschrijving niet meer in de tabel
- [x] Beheer → Bestuursfuncties: zelfde tabelopbouw (#, bestuursfunctie, eindverantwoordelijk voor, acties)
- [x] Keuzelijsten even hoog als tekstvelden (38px), met eigen pijltje
- [x] Opgelost: een filter kiezen haalde de markering van het tabblad Domeinen weg

---

### ✅ CK-030 — #Hashtag per domein en strakkere formulieren en tabellen
**Status:** Gebouwd (20 november 2026)

- [x] Optioneel veld `hashtag` per domein (bijv. #HCASpeelt), zodat de naam los kan staan (bijv. "Hockey"); controle: begint met #, geen spaties, max. 50 tekens
- [x] Titel "Soort" boven de keuzerondjes, in toevoegen én bewerken
- [x] Beheertabellen: smallere, vaste kolommen die op elkaar aansluiten; vrije ruimte vóór de knoppen

**Opgelost in CK-032:** de hashtag staat op het dashboard.

---

### ✅ CK-031 — Tekstgroottes volgens de huisstijl
*Herzien in CK-044: de titelbalk-uitzondering van 30px vervalt; de titel staat nu op 22px in de petrol balk.*
**Status:** Gebouwd (20 november 2026)

- [x] Vaste schaal als CSS-variabelen: titel 40, hoofdstuk 24, paragraaf 18, bloknaam 15, lopende tekst 14, toelichting 13, label 12
- [x] Alle groottes in de app op die schaal: app-titel, cijfers en inlogtitel naar 24; kopbalken naar 15 (bloknaam); introtekst en tussenkaart-tekst naar 14; veldlabels en footer van 11 naar 12
- [x] Bewuste uitzondering: titelbalk (titel "clubKOMPAS · Hockey Club Alphen" en kompaslogo) op 30px (20 november 2026)

---

### ✅ CK-032 — Hashtag zichtbaar op het dashboard
**Status:** Gebouwd (20 november 2026)

- [x] Op de domeinkaart rechts naast het soortlabel, vet in petrol (bijv. Hockey · #HCASpeelt); kaarten blijven even hoog

---

### ✅ CK-033 — Omgeving en rol in de footer
**Status:** Gebouwd (20 november 2026)

- [x] Midden: OMGEVING · VERSIE, bijv. "ONTWIKKEL · VERSIE 0.4.0"; rechtsonder: NAAM · ROL, bijv. "PAUL ALBREGT · BEHEERDER"
- [x] Omgeving via de build-instelling `VITE_OMGEVING` (bijv. "Productie"); zonder instelling "Ontwikkel"
- [x] Rol uit `clubs/{clubId}/leden/{uid}.rol`; kan de rol niet geladen worden, dan wordt hij weggelaten

---

### ✅ CK-034 — Dashboard: Domeinenoverzicht met kerncijfers
**Status:** Gebouwd (20 november 2026)

- [x] Het introblok (verkooptekst, knoppen "Kom met ons in contact" / "Meer informatie", vulcijfers ∞ en 1) is weg
- [x] Paginatitel "Domeinen**overzicht**" (huisstijl: titel 40, kernwoord vet), met het seizoen rechts als toelichting
- [x] Eén rij kerncijfers uit de echte gegevens: pijlers, ondersteunende domeinen, overkoepelende domeinen, bestuursfuncties
- [x] Daaronder het blok Domeinen met de kaarten

---

### ✅ CK-035 — Vereenvoudiging: kopbalken, overzicht en Instellingen
**Status:** Gebouwd (20 november 2026)

- [x] Kopbalken alleen met de titel links; de toelichting rechts (bijv. "De structuur van jouw club") is weg
- [x] Domeinenoverzicht: kerncijfer Bestuursfuncties en het seizoen weg; drie kerncijfers
- [x] Domeinkaart: soort "Pijler" in plaats van "Pijler · strategisch domein"
- [x] Opslaan-knoppen in Instellingen en Beheer wit (niet meer oranje); knoppen even hoog (35px); Verwijderen kleurt rood bij aanwijzen; logoblok even breed als de formulieren en links uitgelijnd

---

### ✅ CK-036 — Instellingen opgeheven: Club onder Beheer, Mijn account via je naam
**Status:** Gebouwd (22 november 2026)

- [x] Menu: Home · Beheer (Instellingen vervalt)
- [x] Beheer krijgt het tabblad **Club** (clubprofiel en clublogo) naast Domeinen en Bestuursfuncties
- [x] **Mijn account** (naam, e-mailadres, wachtwoord) via een klik op "NAAM · ROL" in de footer; na het opslaan van je naam wordt de footer bijgewerkt inclusief rol
- [x] Blok "Over clubKOMPAS" vervalt; de bouwdatum staat als tooltip bij "ONTWIKKEL · VERSIE" in de footer

**Later (P0d):** Beheer alleen tonen voor de rol `beheerder`; tabblad Toegang voor bestuurders en rollen.

---

### ✅ CK-037 — Zijmenu en kruimelpad (volgens de mockup)
*Herzien in CK-044: het zijmenu staat nu op elke pagina, ook Home; het huisje en het menu in de petrol balk vervallen.*
**Status:** Gebouwd (22 november 2026)

- [x] Beheer: zijmenu links met Domeinen · Bestuursfuncties · Club (lijnpictogram + naam); actief item petrol met witte tekst; vervangt de knoppen bovenaan
- [x] Zijmenu in te klappen tot pictogrammen (44px); de keuze wordt onthouden in de browser
- [x] Kruimelpad boven de inhoud: Home › Beheer › Domeinen, en Home › Mijn account; klikbaar
- [x] Telefoon: zijmenu als horizontale rij bovenaan
- [x] Home blijft zonder zijmenu en kruimelpad (volle breedte)
- [x] Home in het hoofdmenu als huisje (pictogram, met "Home" voor schermlezers en als tooltip)

---

### ✅ P0e — Aparte testomgeving (Platform-laag P0)
**Status:** Afgerond en live in v0.4.1 (22 november 2026) · Vercel: `VITE_OMGEVING=Productie` op Production, live footer "Productie · Versie 0.4.1" · Spec: `.claude/specs/P0e-testomgeving.md` · Bouwverslag: `.claude/reports/P0e-bouwverslag.md` · Hosting: Vercel

*Als ontwikkelaar en PO wil ik lokaal en met scripts testen op een apart Firebase-project, zodat de echte HCA-gegevens niet geraakt worden.*

**Acceptatiecriteria (samengevat, zie spec):**
- [x] Tweede Firebase-project `svn10-clubkompas-test` (gratis Spark), zelfde regio als productie (eur3)
- [x] `npm run dev` draait standaard tegen test; footer toont "Test"
- [x] Lokaal tegen productie alleen bewust (`dev:productie`), met waarschuwing in de footer (gebouwd en getest op de code; nog niet in de browser bekeken)
- [x] Scripts kiezen een omgeving (`--omgeving=test|productie`), tonen het project en vragen extra bevestiging voor productie
- [x] Seed-script maakt een testclub met 15 domeinen en 6 bestuursfuncties
- [x] Regels publiceren via de Firebase CLI: eerst test, dan productie (test gedaan; productie bij de volgende regelwijziging)

---

### ✅ P0f — Eigen adressen voor live en online test (Platform-laag P0)
**Status:** Afgerond en live (22 november 2026) · live `clubkompas.svn10.nl`, test `tst.clubkompas.svn10.nl` (branch `test`, achter Vercel-login), lokaal Ontwikkel · Vercel-variabelen gescheiden (Preview = testproject) · `dev.` stuurt met 307 door · **nog: `dev.` opheffen op of na 20 december 2026** (eerst CNAME bij Hostnet weg, `dig` leeg, dan Vercel-domein en Firebase authorized domain) · Spec: `.claude/specs/P0f-adressen.md` · Eindoordeel: `.claude/reports/P0f-eindoordeel.md`

*Als PO wil ik dat het adres zegt welke omgeving erachter zit, zodat niemand per ongeluk op live test of op test werkt.*

Nu wijst `dev.clubkompas.svn10.nl` naar de **live** app (`svn10-clubkompas`) en gebruikt Vercel Preview de productiewaarden.

**Acceptatiecriteria:**
- [x] Live op **`clubkompas.svn10.nl`** (besluit Paul, 22 november 2026) als Production-domein in Vercel
- [x] **`tst.clubkompas.svn10.nl`** = online test: vaste branch (bijv. `test`) in Vercel met Preview-waarden van `svn10-clubkompas-test` en `VITE_OMGEVING=Test`
- [x] Testbalk ook zichtbaar op de online test (nu alleen lokaal)
- [x] Labels zeggen waar je bent: **lokaal "Ontwikkel"** (balk bijv. "Ontwikkelomgeving · project svn10-clubkompas-test", footer "Ontwikkel · Versie …"), **online test "Test"**, **live "Productie"**. Lokaal en tst delen voorlopig het testproject `svn10-clubkompas-test`; een eigen ontwikkelproject of de emulator kan later.
- [x] Firebase Authentication → Authorized domains: live adres in `svn10-clubkompas`, `tst.` in `svn10-clubkompas-test`
- [x] `dev.clubkompas.svn10.nl` tijdelijk doorsturen naar het live adres (307, sinds 22 november 2026)
- [ ] `dev.clubkompas.svn10.nl` opheffen op of na 20 december 2026
- [x] DNS-records bij svn10.nl volgens Vercel

---

### Na CK-023 — vervolgpunten (nog te nummeren)
**Status:** Open · uit de kwaliteitscontroles van CK-023 (22 november 2026)

- [ ] **Firebase-console (Paul):** Email enumeration protection aan in beide projecten; e-mailsjabloon "E-mailadreswijziging" (met terugdraailink) aan en in het Nederlands, test en productie
- [ ] **↑/↓ in één transactie** (`runTransaction`) tegen dubbele volgordenummers bij twee tabbladen tegelijk
- [ ] **Geen dubbel item na time-out:** document-id vooraf vastleggen en bij een nieuwe poging hergebruiken
- [ ] **`aria-describedby` en `aria-invalid`** ook op `structuur-naam`, `profiel-naam`, `profiel-afkorting`, `geb-naam`
- [ ] **Groottelimiet logo in de Firestore-regels**
- [ ] **Club vastleggen vóór het vooraf lezen** bij Domeinen en Bestuursfuncties (nu pas erna; clubwissel in die fractie kan het item bij de andere club zetten — bijna onmogelijk)
- [ ] Optioneel: ✕-kenmerk bij foutmeldingen; `aria-describedby` altijd aanwezig

---

### CK-044 — Eén navigatie: zijmenu op elke pagina (Platform-laag)
**Status:** ✅ Live als v0.6.0 (23 november 2026) · op tst gevonden en opgelost: domeinenlijst te breed naast het zijmenu · eindoordeel en testlijst: `.claude/reports/CK-044-eindoordeel.md` · Bouwverslag: `.claude/reports/CK-044-bouwverslag.md` · **MoSCoW:** Should · **Laag:** Platform (app-shell, generiek voor elke club) · Besluiten: `.claude/specs/CK-044-besluiten.md` (Paul, 22 november 2026) · Draait CK-037 "Home zonder zijmenu" terug en herziet de 30px-uitzondering uit CK-031

*Als bestuurder wil ik op elke pagina hetzelfde zijmenu met overzicht, beheer en mijn account, zodat ik altijd op één plek navigeer en weet waar ik ben.*

**Acceptatiecriteria:**
- [ ] **Zijmenu op elke pagina, ook Home**, met kopjes **Overzicht** (Home; later Vermogens, Activiteiten, Seizoensplanner, Documenten — pas zichtbaar als gebouwd) en **Beheer** (Domeinen, Bestuursfuncties, Club); inklapbaar tot 44px (alleen pictogrammen), stand onthouden in localStorage `zijmenu-ingeklapt`; kruimelpad blijft (Home › Beheer › Domeinen)
- [ ] **Onderaan het zijmenu:** "naam · rol" → Mijn account, en **Uitloggen**; de footer houdt omgeving en versie in het midden (naam · rol verhuist uit de footer)
- [ ] **Witte titelbalk vervalt;** de petrol balk (oranje onderrand) toont het kompas + "club**KOMPAS** · Hockey Club Alphen" in wit (ca. 22px, CK-031-uitzondering herzien); huisje en Beheer verdwijnen uit de balk; omgevingsbalk (P0e/P0f) blijft boven alles
- [ ] **Clublogo** 78px rechtsboven, half over de petrol balk en half over de pagina (absoluut); titel, kruimelpad en eerste inhoud laten rechtsboven ruimte vrij; op mobiel kleiner en binnen de balk
- [ ] **Mobiel:** menuknop (☰) in de petrol balk opent het zijmenu als uitschuifpaneel (vervangt de horizontale rij uit CK-037); toegankelijk: `aria-expanded`/`aria-controls` op de knop, focus naar het paneel en terug naar de knop bij sluiten, sluiten met Esc en met een klik op de achtergrond, geen focus achter het paneel

**Risico's:**
- Bestaande layout-klassen (`.top-bar`, `.top-nav`, `.app-lijf`, `.zijmenu`, `.kruimelpad`) worden omgebouwd: Home krijgt nu ook `.app-lijf` met zijmenu; controleer dat Beheer, Mijn account en de foutmeldingen/bevestigingen uit CK-023/CK-025 niet verschuiven of dubbel renderen. Eerst inventariseren waar deze klassen gebruikt worden; oude klassen echt opruimen, geen dode CSS.
- Clublogo met absolute positie kan over titel of kruimelpad vallen bij smalle schermen en ingeklapt/uitgeklapt menu; testen op ca. 400px, 768px en desktop.
- Uitschuifpaneel: focusbeheer en Esc zijn de grootste kans op een toegankelijkheidsfout; ook ingeklapt menu heeft namen voor schermlezers en tooltips nodig.
- Groep Beheer wordt later rolafhankelijk (P0d): nu al als aparte groep opbouwen, zodat verbergen één voorwaarde is.

---

### Na CK-044 — vervolgpunten (nog te nummeren)
**Status:** Open · uit de kwaliteitscontroles van CK-044 (22 november 2026)

- [x] **Harde eis voor P0d (Beheer alleen voor beheerders):** *✅ live in v0.13.0 (24-11-2026); regels gepubliceerd in test en productie; doc en testlijst: `.claude/docs/P0d.md`* verbergen in het zijmenu (`zichtbaar()`) is géén beveiliging. Nodig: `isBeheerder(clubId)` op `leden/{uid}.rol` in `firestore.rules` voor schrijven op `instellingen`, `bestuursfuncties`, `structuurelementen`, `vermogens`, `vermogensnamen` (CK-020), `projecten` en `samenwerkingen` (CK-046), `commissies` (CK-041), en voor het zetten of weghalen van `bevat` op structuurelementen; controle in de navigatie (`NAV_DOEL`) én een guard bovenaan elke beheer-render
  - [x] **Aanvulling uit de app-analyse v0.12.1** (`.claude/reports/APP-0.12.1-eindoordeel.md`, M1/M2), in dezelfde regelronde:
    - veldcontrole (`hasOnly`, typen, lengtes) op `instellingen`, `bestuursfuncties` en `structuurelementen` (`firestore.rules:192-228`);
    - een maximale lengte voor het logo, en een domeinnaam die niet leeg mag zijn;
    - regeltests voor de P0c-regels: zelf `gebruikers/{uid}` schrijven, zelf `leden/{uid}` aanmaken, je rol ophogen, `clubs/{id}` schrijven en het document van een ander lezen;
    - een test voor de omgevingsguard in `src/firebase.js`;
    - het logo alleen als `data:image/(png|jpeg|webp)` in `geldigLogo` (CK-052, besluit van 24-11-2026);
    - de omschrijving van een domein maximaal 500 tekens, net als in de app sinds v0.13.0.
- [ ] **Eén `h1` per pagina** (nu alleen Home)
- [x] **Domeinenlijst te breed** naast het zijmenu (op tst gezien tot ~1080px): opgelost 23 november 2026 met meegevende kolommen en een container query (domeinen stapelen onder 760px lijstbreedte, functies onder 590px)
- [ ] **Lege strook onder het zijmenu** bij omgevingsbalk na scrollen (beoordelen op tst)
- [ ] **Ongebruikte CSS opruimen:** `.functie-label`, `.picto-groot`, `.structuur-rij-info`, `.volgorde-nr`
- [ ] **Uitloggen mislukt:** nu alleen een melding in de console; zichtbare melding voor de gebruiker
- [ ] **Laadsignaal bij navigeren** naar Domeinen/Bestuursfuncties (en geen shell terug over het inlogscherm bij uitloggen tijdens laden)
- [ ] **Donker thema: `.filter-knop.active`** (Domeinen) haalt 2,38:1; ook `--petrol-vlak` gebruiken

---

### CK-019 — Clubprofiel veilig opslaan met meerdere bestuurders
**Status:** Open · **Moet af zijn vóór een echte tweede bestuurder wordt gekoppeld**

*Als bestuurder wil ik dat mijn wijziging in het clubprofiel de wijziging van een andere bestuurder niet ongemerkt terugdraait.*

**Acceptatiecriteria:**
- [ ] Opslaan van het profiel schrijft alleen de gewijzigde velden (of controleert op een nieuwere versie)
- [ ] Scenario: A wijzigt het seizoen, B uploadt daarna een logo zonder te herladen → het seizoen van A blijft staan

---

### ✅ CK-025 — Bevestiging na opslaan clubprofiel
**Status:** Afgerond en live in v0.5.0 (22 november 2026), gebouwd met CK-023

*Als bestuurder wil ik na het opslaan van het clubprofiel zien dat het gelukt is.*

**Acceptatiecriteria:**
- [ ] Na opslaan verschijnt "✓ Profiel opgeslagen." (het element bestaat al, maar wordt na het opnieuw tekenen van de pagina nooit getoond)
- [ ] Hetzelfde voor "✓ Logo opgeslagen.", "✓ Naam opgeslagen.", "✓ E-mailadres gewijzigd." en "✓ Wachtwoord gewijzigd." (geen van deze meldingen wordt nu ooit zichtbaar)

---

### ✅ CK-023 — Melding bij mislukt opslaan
**Status:** Afgerond en live in v0.5.0 (22 november 2026), samen met CK-025 en token `--fout` · getest op tst (o.a. geen toegang met tijdelijke regels in het testproject, teruggezet)

*Als bestuurder wil ik een duidelijke melding krijgen als opslaan bij Pijlers & Domeinen mislukt, zodat ik niet denk dat mijn wijziging bewaard is.*

**Acceptatiecriteria:**
- [ ] Bij een fout tijdens aanmaken, bewerken of verwijderen verschijnt een foutmelding en blijft de invoer staan
- [ ] Geldt ook voor geweigerde toegang (bijv. een oud tabblad na de migratie van P0c)

---

### CK-024 — Oude kopie van de clubdata opruimen (na P0c)
**Status:** Open · **Gepland:** 26 november 2026, na een week probleemloos gebruik (besluit PO, 19 november 2026)

**Uitvoering:** via de Firebase-console (de regels sluiten de oude plek af): document `clubs/{oudeUid}` verwijderen inclusief subcollecties, en in `clubs/{clubId}` het veld `gemigreerdVan` weghalen. Definitief, geen back-up.

*Als platform wil ik de oude kopie onder `clubs/{oudeUid}` verwijderen zodra de migratie van P0c bewezen goed werkt, zodat er geen dubbele persoonsgegevens blijven staan.*

**Acceptatiecriteria:**
- [ ] Opruimen na minimaal één sprint zonder problemen, met apart script en expliciet akkoord van de PO
- [ ] Ook `gemigreerdVan` opruimen
- [ ] Tot die tijd: de oude kopie meenemen bij verzoeken om inzage of verwijdering

---

### Na P0e — vier vervolgpunten (nog te nummeren)
**Status:** Open · uit de kwaliteitscontroles van P0e (22 november 2026), zie `.claude/docs/P0e-technisch.md`

- [x] **Vercel Preview naar testwaarden** (opgelost in P0f, 22 november 2026): vastgesteld 22 november 2026: de zes `VITE_FIREBASE_*`-variabelen gelden voor **Production én Preview**, dus elke preview-deploy praat nu met de echte HCA-data. Oplossing: in Vercel per variabele aparte Preview-waarden van `svn10-clubkompas-test` plus `VITE_OMGEVING=Test` voor Preview. (`VITE_OMGEVING=Productie` staat sinds 22 november 2026 alleen op Production.)
- [ ] **Firebase SDK bijwerken + audit:** 4 high-meldingen in `firebase`/`@grpc/grpc-js` (bestonden al); geen `npm audit fix --force`
- [ ] **Foutkleur in donkere modus:** `.form-fout` haalt maar 2,73:1; token `--fout` per modus (bv. `#FF8A7A` in donker)
- [ ] **Besluit Vercel Pro:** Hobby is alleen voor niet-commercieel gebruik en heeft geen verwerkersovereenkomst (DPA alleen Pro/Enterprise). Vóór een tweede club of betaalde afspraak overstappen; tot dan Vercel als subverwerker melden aan HCA (uit P0f-compliance)
- [ ] **Deployment Protection van tst.:** staat hij open voor een HCA-tester, noteer begin- en einddatum en zet hem daarna weer aan (liever een Shareable Link)
- [ ] **Verwerkingsregister (AVG art. 30):** Vercel (IP-adressen/logs, VS/DPF), Firebase live en test (test alleen fictieve data), Hostnet (DNS), acceptatiedata verwerkersvoorwaarden
- [ ] **Websitebeperking op de Firebase API-key overwegen:** echte poort tegen gebruik vanaf andere sites; vraagt een aparte key voor de scripts (Node, zonder Referer)
- [ ] **Productieregio en verwerkersvoorwaarden vastleggen:** regio noteren; Firebase-verwerkersvoorwaarden geaccepteerd in beide projecten; Google als subverwerker in de verwerkersovereenkomst met HCA

---

### Randvoorwaarde voor stories met ledendata
Voordat er gegevens van leden, jeugdleden (onder 16) of de vertrouwenspersoon worden opgeslagen: rollen écht afdwingen in de Firestore-regels, en elke nieuwe collectie expliciet in de regels opnemen (advies compliance P0c).

---

### CK-020 — Vermogens onder een pijler of domein (Model-laag M1)
**Status:** ✅ Live als v0.7.0 (23 november 2026) · 58 HCA-vermogens geïmporteerd in productie, controle "Alles klopt" · eerder getest op tst (open: twee tabbladen, devtools, offline, consoleschade, VoiceOver — zie vervolgpunten) · Specs: `.claude/specs/CK-020-*.md` (besluiten 1–22) · Eindoordeel: `.claude/reports/CK-020-eindoordeel.md`

*Beheer → Vermogens, regels met unieke naam (naamdocument) en domein-guard (teller), import van 58 HCA-vermogens, Home met vier kerncijfers, filter en pictogramknoppen op alle beheerpagina's. De plaat volgt in CK-021.*

**Vervolgpunten na CK-020:**
- [ ] **Gevoelige vermogens** (Lief & Leed, Sociale veiligheid, Tuchtzaken, Jongerenparticipatie, G-hockey): zodra M2/P1 personen of notities koppelt eerst P0d, geen vrije notities zonder besluit, verwerkingsregister bijwerken, DPIA beoordelen (compliance).
- [ ] **Back-up/export** van Firestore (Spark-plan heeft geen back-up), als herstelmogelijkheid.
- [ ] **npm audit:** 19 meldingen (5 high) uit bestaande pakketten (`firebase-tools`, `@grpc/grpc-js`); niet `npm audit fix --force`, apart bijwerken.
- [ ] Huisstijl: oranje hoofdactie per pagina (nu gestippelde "+ … toevoegen")? Besluit Paul.
- [ ] Huisstijl: puzzelstuk-pictogram herkenbaarder maken (inkeping).
- [ ] Vermogen later naar een bestuursfunctie laten verwijzen, niet naar een persoon (compliance).
- [ ] Nog op tst te testen: twee tabbladen tegelijk, devtools-scenario's, offline, consoleschade en VoiceOver (eindoordeel punten 4, 11, 12, 15, 16, 20).
- [ ] Bevestigingsvraag "Item verwijderen?" bij een domein zonder vermogens vervangen door een duidelijke tekst.
- [ ] `permission-denied` door de teller-guard ook in Vermogens met een eigen melding afhandelen.
- [ ] 13 `section`-landmarks in de vermogenslijst → `div`; één `h1` per pagina.
- [ ] ↑/↓ via een transactie in plaats van writeBatch.

---

### CK-021 — De plaat: vermogensoverzicht (Model-laag M1/M2-weergave)
**Status:** ✅ Live als v0.8.0 (23 november 2026) · getest op tst, testlijst geslaagd · Spec: `.claude/specs/CK-021-de-plaat.md` · Doc: `.claude/docs/CK-021.md` · Controle: `.claude/reports/CK-021-controle.md`

*Alleen-lezen pagina Vermogens (pijlers, ondersteunende en overkoepelende domeinen met eindverantwoordelijke en vermogens), Home-kerncijfer als link, beheeritem heet Vermogens beheren.*

**Vervolgpunten na CK-021:**
- [ ] Afdrukweergave of PDF-export van de plaat.
- [x] Leesrechten voor niet-beheerders meenemen bij P0d. *Lezen blijft voor elk lid; schrijven alleen voor de beheerder (P0d, 24-11-2026).*

---

### CK-045 — Home als welkomspagina, Domeinenoverzicht apart (Platform-laag P0, app-shell)
**Status:** ✅ Live als v0.9.0 (23 november 2026) · route klein · getest op tst

*Home begroet de ingelogde gebruiker ("Welkom, naam" en "Welkom bij clubKOMPAS van clubnaam"). Het oude Home wordt de pagina Domeinenoverzicht. Zijmenu Overzicht: Home, Domeinenoverzicht, Vermogensoverzicht; onder Beheer heet het item weer Vermogens. Accountregel zonder rol. Plaat: ondersteunende domeinen petrol bovenrand, overkoepelende domeinen over de volle breedte. Paginatitels niet meer half vet. Titelbalk, kruimelpad en footer blijven staan; alleen de inhoud scrolt. Zijmenu op 44px-raster, clublogo hoger, omgevingsbalk in elke omgeving (productie petrol zonder tekst, test grijs, ontwikkel oranje).*

**Vervolgpunten na CK-045:**
- [ ] Home later uitbreiden: laatst gewijzigd, taken voor de gebruiker.

---

### CK-046 — Projecten en samenwerkingen beheren (Platform-laag P0, masterdata)
**Status:** ✅ Live als v0.10.0 (23 november 2026) · route groot · getest op tst, met bijstellingen van Paul (besluiten 19–27: beheertabellen, kerncijfers, plaat) · eindoordeel en testlijst: `.claude/reports/CK-046-eindoordeel.md`

*Twee beheerpagina's onder Beheer: Projecten (met status en periode) en Samenwerkingen, met eigenaar uit de bestuursfuncties. Ze verschijnen als kaartjes op het Vermogensoverzicht, in het overkoepelende domein met `bevat`. Technisch: `.claude/docs/CK-046.md`.*

- [x] Collecties `projecten` en `samenwerkingen` met Firestore-regels en regeltests (94 van 94 groen)
- [x] Beheer → Projecten en Samenwerkingen: toevoegen, bewerken, ↑/↓, verwijderen, statusfilter, lege staat en laadfout
- [x] Plaat: kaartjes in plaats van de domeinomschrijving; gestippeld bij in voorbereiding, afgerond verborgen
- [x] Bestuursfuncties: kolom en verwijderblokkade tellen ook projecten en samenwerkingen
- [x] Inrichtscript HCA (`npm run projecten:import`, `--droog`, idempotent) — nog niet gedraaid
- [ ] Testlijst op tst afwerken (lay-out 1200/768/375px, datumkiezer, schermlezer)
- [ ] Regels en import op productie (niet op 26 november 2026)

**Vervolgpunten na CK-046:**
- [ ] Keuze voor `bevat` in het domeinformulier (nu zet alleen het inrichtscript het veld)
- [ ] Bestaan van de bestuursfunctie (eigenaar) afdwingen in de regels, samen met de domeinen
- [x] Restrisico P0d: elk lid kan projecten en samenwerkingen schrijven en verwijderen, en `bevat` zetten of weghalen *(opgelost in P0d, 24-11-2026)*

---

### CK-041 — Commissies beheren (Platform-laag P0, masterdata)
**Status:** ✅ Live als v0.12.0 (23 november 2026) · getest op tst · route groot, ingekort (geen intake, ontwerp en prototype: het scherm bestaat al) · besluiten: `.claude/specs/CK-041-besluiten.md` · controles: geen bevindingen open · doc en testlijst: `.claude/docs/CK-041.md`

*Als beheerder wil ik commissies aanmaken, zodat activiteiten een verantwoordelijke hebben. Het is een beheerpagina zoals Samenwerkingen: naam, omschrijving en eigenaar uit de bestuursfuncties. Er is geen koppeling aan domeinen of vermogens en er komen geen personen in. De commissies staan alleen in Beheer, in het zijmenu direct na Bestuursfuncties.*

- [x] Collectie `commissies` met Firestore-regels en regeltests (100 van 100 groen)
- [x] Beheer → Commissies: toevoegen, bewerken, ↑/↓, verwijderen, lege staat en laadfout
- [x] Bestuursfuncties: de kolom en de verwijderblokkade tellen ook commissies
- [x] Regels op test gepubliceerd en de testlijst op tst afgewerkt
- [ ] Regels op productie (`npm run regels:productie`) vóór de merge naar main

**Vervolgpunten na CK-041:**
- [ ] Leden in een commissie: alleen na P0d (`isBeheerder`) en een compliance-controle (AVG)
- [x] Restrisico P0d: elk lid kan commissies schrijven en verwijderen *(opgelost in P0d, 24-11-2026)*

---

## Uit de app-brede kwaliteitsanalyse v0.12.1 (23 november 2026)
Rapporten: `.claude/reports/APP-0.12.1-*.md`, eindoordeel in `APP-0.12.1-eindoordeel.md`. Met Paul besproken op 23 november 2026. Het P0d-deel (veldcontrole en tests) staat bij de harde eis voor P0d.

### ✅ CK-047 — Fixpakket v0.12.2 en beveiligingsheaders
**Status:** ✅ Live in v0.12.2 (23-11-2026) · route klein

- [x] Rand van invoervelden naar minstens 3:1 contrast (`--border`, `src/style.css:9`). Nu is het 1,48:1 (WCAG 1.4.11)
- [x] Verkeerde hint "De volgorde wijzig je bij Toon: Alle soorten" aanpassen (`src/main.js:1491`)
- [x] Inlogscherm: gewone tekst in plaats van `Fout: <code>` (`src/main.js:707`), volgens het criterium van CK-023
- [x] Maximum van 200 tekens op de domeinnaam in de app (`src/main.js:1647`), gelijk aan de regels
- [x] `.toel` op petrol zonder opacity, zodat het 4,5:1 haalt (`src/style.css:152`)
- [x] `.cel-nr` niet vet (besluit 21, `src/style.css:564`); Eindverantwoordelijke en Eigenaar even groot
- [x] Lettertype Barlow Semi Condensed lokaal in `public/` in plaats van via Google Fonts (`src/style.css:1`). Gewicht 500 laden of niet meer gebruiken
- [x] Bevestiging bij het verwijderen van het logo (`src/main.js:3056`)
- [x] Opslaan als primaire knop in elk formulier (besluit 40)
- [x] `vercel.json` met beveiligingsheaders: CSP, `frame-ancestors`, `nosniff` en `Referrer-Policy`. De CSP eerst op tst testen, ná het lokaal zetten van het lettertype

### ✅ CK-048 — Laadfouten en toegankelijke formulieren
**Status:** ✅ Live in v0.13.0 (24-11-2026) · route middel

- [x] Een laadfout op Domeinen, Bestuursfuncties en het Domeinenoverzicht toont een melding met "Opnieuw laden", net als Vermogens (`src/main.js:593`, `:988`, `:1558`, `:2813`)
- [x] Inlogscherm: fouten via `zetVeldFout` met `aria-invalid`/`aria-describedby` en een live-region (`src/main.js:667-690`)
- [x] Datumkiezer: de focus blijft op een geldige dag, en Escape blijft werken (`src/keuzelijst.js:183`, `:226-232`)
- [x] Een foutrand op de eigen keuzelijst en de datumkiezer (`src/keuzelijst.js:50-58`)

### CK-049 — AVG-basis vóór ledengegevens
**Status:** Open · grotendeels zonder code (Paul) · **harde poort vóór ledengegevens, naast P0d**

- [ ] Verwerkingsregister (zie ook het punt bij "Na P0e"), met het e-mailadres in `leden/{uid}`
- [ ] Verwerkersovereenkomst met HCA, met Google en Vercel als subverwerkers. Kiezen tussen Vercel Pro (met DPA) en een alternatief
- [ ] Procedure voor inzage, export en verwijdering van een account
- [ ] Datalekprocedure
- [ ] Back-up van Firestore
- [ ] Bewaartermijnen vastleggen
- [ ] Afweging over een DPIA
- [ ] Regio van Firebase Auth noteren (Firestore staat in eur3)
- [ ] Daarna een korte privacyverklaring, met een link in de footer van de app
- [ ] Procedure voor het toekennen en intrekken van de rol `beheerder` (wie mag dat, wanneer intrekken, vastleggen). Nieuw door P0d (analyse v0.13.0, C-2)
- [ ] Hulptekst "geen namen of contactgegevens" bij de omschrijvingsvelden (C-3)
- [ ] De localStorage-sleutel `clubkompas-laatst-actief` (automatisch uitloggen) opnemen in het register (C-5)

### ✅ CK-050 — Beheertabellen gelijktrekken en opruimen
**Status:** ✅ Live in v0.13.0 (24-11-2026) · route middel · het opsplitsen van `main.js` blijft apart (zie `pipeline.md`)

- [x] Dezelfde teksten bij verwijderen, lege toestand en validatie, hetzelfde Enter-gedrag en dezelfde labels op de pijlknoppen in alle beheertabellen (gedeelde helpers)
- [x] Region-landmarks (`<section aria-labelledby>`) en een `h1` per beheerpagina (zie ook "Na CK-044")
- [x] Kolomkoppen blijven voor de schermlezer bestaan in een smalle tabel; de bewerkrij van Domeinen krijgt `role="cell"`
- [x] Kleuren via klassen in plaats van inline `style=` (`SOORT_KLEUR`). Was al gedaan in CK-047
- [x] Dode code weg: `src/counter.js`, `src/assets/*`, `public/icons.svg`, de ongebruikte import, en dode of dubbele CSS. `huidigeRol`/`laadRol` blijven bewust staan: P0d heeft ze nodig voor `zichtbaar()`
- [x] Oudere scripts tonen namen via `veilig()`. `scripts/firestore.rules.migratie` verwijderen of er een waarschuwing in zetten

### ✅ CK-051 — Huisstijlbesluiten (Paul)
**Status:** ✅ Besloten op 23 november 2026 · vastgelegd als besluiten 39–41 in `.claude/specs/CK-046-besluiten.md`

- [x] Kaarten en knoppen blijven vierkant (0–6 px, geen schaduw, lichte rand). De huisstijlregel volgt het ontwerp
- [x] Opslaan wordt een primaire knop (petrol vlak). Gebouwd in CK-047 (v0.12.2)
- [x] Verwijderen blijft `confirm()` met één vaste tekst. De teksten worden gelijkgetrokken in CK-050

### CK-052 — Restpunten uit de analyse v0.12.1
**Status:** Codepunten live in v0.13.0 (24-11-2026); open: console-check en bundelgrootte · toegevoegd op 24 november 2026 · stonden in het eindoordeel maar nog niet in de backlog

- [x] Bij 320 px breed en 400 % zoom laat de vaste paginahoogte weinig ruimte over (M16, `src/style.css:781`, WCAG 1.4.10)
- [x] Het logo mag een SVG zijn. Besloten (Paul, 24-11-2026): SVG weren. De app accepteert en toont alleen PNG, JPG en WebP. De regel in `geldigLogo` is aangepast in P0d (24-11-2026)
- [x] Sessies blijven onbeperkt open. Besloten (Paul, 24-11-2026): automatisch uitloggen na 8 uur zonder klikken of typen, ook over tabbladen heen
- [ ] Firebase-console (Paul): nakijken of zelfregistratie (gebruikers die zelf een account aanmaken) uit staat, in test en productie
- [x] Hardgecodeerde hex-kleur in de omgevingsbalk via een token laten lopen (`src/style.css:858-860`)
- [x] Besluit 2, tweede deel: `.btn-toevoegen` krijgt dezelfde letterstijl als `.btn` (Paul, 24-11-2026); vorm en kleur blijven
- [ ] De bundel is 659 kB (Vite waarschuwt boven 500 kB). Kleiner maken bij het opsplitsen van `main.js` (zie `pipeline.md`)

## Uit de app-brede kwaliteitsanalyse v0.13.0 (24 november 2026)
Rapporten: `.claude/reports/APP-0.13.0-beveiliging.md` en `APP-0.13.0-analyse.md`, eindoordeel in `APP-0.13.0-eindoordeel.md`. Er zijn geen kritieke en geen hoge bevindingen. De AVG-punten (C-2, C-3, C-5) staan bij CK-049.

### ✅ CK-056 — Fixpakket v0.13.2
**Status:** ✅ Live in v0.13.2 (24-11-2026; v0.13.1 was alleen een versieophoging) · route middel · regels gepubliceerd in test; productie: na `npm run p0d:controle -- --omgeving=productie --droog` door Paul `regels:productie`

- [x] T-1: teksten "via Beheer" alleen voor een beheerder; een lid krijgt "Vraag een beheerder …" (`src/main.js:724`, `:1242`, `:1248`)
- [x] T-2: geen `bindHerlaad` of `enterSlaatOp` met `null` als de gebruiker tijdens het eerste laden wegnavigeert (`src/main.js:1733-1744`, `:3010-3016`)
- [x] T-3: na "Opnieuw laden" op het Domeinenoverzicht gaat de focus naar `#inhoud` als er geen kerncijfer-link is (lid) (`src/main.js:1130`)
- [x] T-5: `bevestigVerwijderen` ook bij Vermogens, onderdelen en het logo (`src/main.js:2378`, `:2841`, `:3260`)
- [x] A-1: de uitlogmelding na 8 uur pas na het tekenen in de live-region zetten, zodat de schermlezer hem voorleest (`src/main.js:833-836`)
- [x] A-2: de datumknop krijgt geen `aria-describedby` of `aria-invalid` terug via `volgAttributen` (`src/keuzelijst.js:40-50`, `:261-262`)
- [x] HS-1: de knoppen in Mijn account worden primair (besluit 40) (`src/main.js:3319`, `:3339`, `:3358`)
- [x] HS-4: `--paneel-top` niet meer inline zetten (`src/main.js:1491`)
- [x] Regels L1: test "beheerder van een andere club" voor alle zeven collecties (`tests/regels.test.mjs:1135-1141`)
- [x] Regels L2: `icoon` alleen uit de vaste lijst; geen stuur-, nul-breedte- of bidi-tekens in de namen van profiel, bestuursfuncties en domeinen (`firestore.rules:194-219`)
- [x] Regels L3: `bevat` alleen op een overkoepelend domein (`firestore.rules:178-180`)
- [x] Headers L4: `Permissions-Policy` en `Strict-Transport-Security` in `vercel.json`. `frame-src` en `firebaseio` blijven staan tot een test van inloggen en e-mail wijzigen zonder die twee is gedaan
- [x] Scripts L8/L9: `firestore.rules.migratie`, `.voor-P0c` en `.voor-P0d` naar `scripts/archief/`; drie regels in `migreer-club.mjs` via `veilig()`
- [ ] Firebase-console (Paul, L6): zelfregistratie uit, bescherming tegen e-mailenumeratie aan en de API-key beperken. Daarna de aparte melding voor `auth/user-not-found` weghalen (C-4)

Later, bij het opsplitsen van `main.js`: de bundel (712 kB), HS-2/3/5/6, A-3 t/m A-6, T-6 en T-7 (zie `APP-0.13.0-analyse.md`).

### ✅ CK-057 — Fixpakket uit de gerichte analyse van v0.13.3
**Status:** ✅ Live in v0.13.4 (24-11-2026), regels gepubliceerd in test en productie · route klein (de regels veranderen: regeltests draaien, en Paul publiceert opnieuw) · rapport: `.claude/reports/APP-0.13.3-analyse.md` (geen kritieke punten; CK-056 loste 12 van de 15 punten volledig op)

- [x] N-4 (procedure, belangrijk; droge controle in test: alles klopt): de regels toetsen het hele document. Een oud domein met een afwijkend pictogram of een onzichtbaar teken in de naam is daardoor niet meer te bewerken. Draai in productie `npm run p0d:controle -- --omgeving=productie --droog` (de regels staan daar al) en herstel afwijkingen. Doe dit vóór elke volgende `regels:productie`
- [x] N-2: een overkoepelend domein met `bevat` omzetten naar pijler of ondersteunend geeft "geen toestemming". Haal `bevat` bij die wijziging weg (`deleteField`) (`src/main.js:~1985`, `firestore.rules:233`)
- [x] N-1: de regex sluit nog niet alles uit: U+2028/2029, U+FEFF, C1 (0080–009F), U+00AD, U+2060–2064 en U+061C komen erdoor. Gebruik `[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}]*` in de regels, de app en het controlescript (in de emulator getest)
- [x] N-5: de melding voor emoji met een ZWJ (zoals 👨‍👩‍👧) noemt dat zo'n emoji niet kan
- [x] N-3: snel weg en terug (A→B→A) bindt de oude render zijn listeners op de nieuwe lijst. Leg het lijst-element vast vóór de eerste `await` (`src/main.js:1741`, `:3018`)
- [x] N-6: de L1-test krijgt een positieve controle: de eigen beheerder mag het wel (`tests/regels.test.mjs`)
- [x] N-7: `.claude/docs/CK-044-technisch.md:55`, `:72` (`--paneel-top`) en het commentaar in `src/keuzelijst.js:38` bijwerken

---

### ✅ CK-170 — Beheer → Activiteiten
**Status:** ✅ getest op tst (25 november 2026), versie 0.14.0, regels in test en productie · route groot (nieuw datamodel en nieuwe regels) · docs: `.claude/docs/CK-170.md` · spec: `.claude/specs/CK-170-activiteiten.md`

- [x] Collectie `activiteiten` met `naam`, `soort`, `begindatum`, `einddatum`, `vermogenIds` (lijst, nu precies 1) en `commissieId`; regels en 152 regeltests groen
- [x] Beheerpagina met filter op soort, module `src/activiteiten.js`, pictogram `kalender`
- [x] Verwijderblokkade in Vermogens en Commissies (alleen in de app; restrisico aanvaard)
- [ ] Paul: regels publiceren met `npm run regels:test`, dan app op tst controleren, daarna `npm run regels:productie`
- [ ] Browsercontrole: 320-400 px (kolomafstand in het smalle raster), toetsenbord, zoom 200%

**Vervolgpunten:**
- Meerdere vermogens per activiteit (Paul twijfelt; het model is er klaar voor, de regels en de keuzelijst moeten dan verruimd worden)
- Activiteiten toevoegen vanaf andere schermen (de module is daarvoor bedoeld)
- CK-171: activiteiten per vermogen bekijken (`laadActiviteitenVanVermogen` bestaat al)
- Een omschrijving bij een activiteit, pas na een AVG-besluit en compliance-controle
- `geldigeDatum` laat datums toe die niet bestaan (zoals 2027-02-31) en jaar 0000; aanscherpen in de regels en `onderdelen.js`
- `aria-required` in de hele app (WCAG 3.3.2)
- Kleine punten uit de controle: groene melding wissen bij een geblokkeerde verwijdering, `aria-describedby` op de uitgeschakelde toevoegknop, unittests voor `activiteitBezet`, `sorteerActiviteiten` en `geldigeActiviteit`, extra regeltests uit het beveiligingsrapport (bevinding 3)

---

### ✅ CK-172 — Uitvoeringen van een activiteit
**Status:** ✅ live in v0.15.0 (25 november 2026), regels in test en productie, test omgezet · route groot (nieuw datamodel, nieuwe regels, omzetscript) · docs: `.claude/docs/CK-172.md` · spec: `.claude/specs/CK-172-uitvoeringen.md`

- [x] Een activiteit heeft geen datums meer; die staan per keer in `clubs/{clubId}/uitvoeringen` (`activiteitId`, `begindatum`, `einddatum`). Uitklappaneel in Beheer → Activiteiten, nieuwe volgorde van de lijst, mee verwijderen; regels en 177 regeltests groen
- [x] Omzetscript `npm run uitvoeringen:omzetten` (alleen `--droog` in productie)
- [x] Paul: `npm run regels:test`, omzetscript op test (droog, echt, droog: "Niets te doen"), `npm run regels:productie`
- [ ] Browsercontrole: 320 px, toetsenbord, zoom 200%

**Voor CK-160 (seizoensplanner):** uitvoeringen opvragen uit `clubs/{clubId}/uitvoeringen` op `begindatum`, en wezen (een uitvoering zonder activiteit) overslaan.

**Doorlopende activiteiten (Paul, 25-11-2026):** iets wat het hele seizoen loopt, krijgt één uitvoering per seizoen, van de start tot het eind van het seizoen. Er komt geen apart soort, en een lege einddatum blijft "één dag" betekenen. Later komt er eventueel een knop "Hele seizoen", die de datums uit het seizoen invult (bij CK-161). Kijk eerst of zoiets niet eigenlijk een vermogen is, zoals trainingen of de competitie.

---

### Begrippen: activiteit, werkproces, termijn (Paul, 25-11-2026)
Dit is een afspraak voor het model, geen bouwwerk:
- **Activiteit** (M2): iets wat de club organiseert op een datum of in een periode, zoals de ALV, een open dag, een toernooi of een clinicreeks. Een activiteit heeft uitvoeringen en staat in de seizoensplanner.
- **Werkproces** (P2 Workflows, CK-053–055; F0, CK-150–152): een vaste reeks stappen die begint bij een gebeurtenis, zoals een lid inschrijven of uitschrijven, of een vrijwilliger aanmelden. Een werkproces heeft geen datum en staat dus niet in de planner. Het hoort bij een vermogen, zoals Ledenadministratie.
- **Termijn**: een vaste datum die bij een werkproces hoort, zoals de uiterste opzegdatum of het moment dat de contributie wordt geïnd. Een termijn is een activiteit van de soort "Termijn", met één uitvoering. Zo staat hij in de planner. Bij P2 koppel je later een termijn aan het werkproces, bijvoorbeeld "Uiterste opzegdatum" aan "Lid uitschrijven".

### CK-173 — Soort "Termijn" voor activiteiten
**Status:** nog in te plannen · route klein tot middel (de vaste lijst in de regels en in de app verandert, maar er komt geen nieuw datamodel)

- [ ] De soort `termijn` ("Termijn", voor deadlines en vaste momenten) komt in `ACTIVITEIT_SOORTEN` (`src/activiteiten.js`) en in de vaste lijst van `geldigeActiviteit` (`firestore.rules`). Er komen regeltests bij.
- [ ] De regels gaan eerst naar test en daarna naar productie, vóór de app.
- [ ] Later, bij P2: een termijn koppelen aan een werkproces.
