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

**Later:** de hashtag tonen op het dashboard (nu alleen opgeslagen).

---

### ✅ CK-031 — Tekstgroottes volgens de huisstijl
**Status:** Gebouwd (20 november 2026)

- [x] Vaste schaal als CSS-variabelen: titel 40, hoofdstuk 24, paragraaf 18, bloknaam 15, lopende tekst 14, toelichting 13, label 12
- [x] Alle groottes in de app op die schaal: app-titel, cijfers en inlogtitel naar 24; kopbalken naar 15 (bloknaam); introtekst en tussenkaart-tekst naar 14; veldlabels en footer van 11 naar 12

---

### CK-019 — Clubprofiel veilig opslaan met meerdere bestuurders
**Status:** Open · **Moet af zijn vóór een echte tweede bestuurder wordt gekoppeld**

*Als bestuurder wil ik dat mijn wijziging in het clubprofiel de wijziging van een andere bestuurder niet ongemerkt terugdraait.*

**Acceptatiecriteria:**
- [ ] Opslaan van het profiel schrijft alleen de gewijzigde velden (of controleert op een nieuwere versie)
- [ ] Scenario: A wijzigt het seizoen, B uploadt daarna een logo zonder te herladen → het seizoen van A blijft staan

---

### CK-025 — Bevestiging na opslaan clubprofiel
**Status:** Open · klein

*Als bestuurder wil ik na het opslaan van het clubprofiel zien dat het gelukt is.*

**Acceptatiecriteria:**
- [ ] Na opslaan verschijnt "✓ Profiel opgeslagen." (het element bestaat al, maar wordt na het opnieuw tekenen van de pagina nooit getoond)
- [ ] Hetzelfde voor "✓ Logo opgeslagen.", "✓ Naam opgeslagen.", "✓ E-mailadres gewijzigd." en "✓ Wachtwoord gewijzigd." (geen van deze meldingen wordt nu ooit zichtbaar)

---

### CK-023 — Melding bij mislukt opslaan
**Status:** Open

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

### Randvoorwaarde voor stories met ledendata
Voordat er gegevens van leden, jeugdleden (onder 16) of de vertrouwenspersoon worden opgeslagen: rollen écht afdwingen in de Firestore-regels, en elke nieuwe collectie expliciet in de regels opnemen (advies compliance P0c).

---

### CK-020 — Vermogens onder een pijler of domein (Model-laag M1)
**Status:** Open

*Volgende stap in de structuur Club → Pijlers/Domeinen → Vermogens. Uitwerken na P0c.*

