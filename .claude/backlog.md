# clubKOMPAS — Backlog

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
- [ ] Omschrijving van de HCA-pijlers is nu overal "Hockey"; echte teksten aanleveren
- [ ] Eindverantwoordelijke ontbreekt bij #HCASpeelt en #HCAGroeit

---

## Sprint 3 — Voorstel (nog in te plannen)

### P0c — Club loskoppelen van gebruiker (Platform-laag P0)
**Status:** Open · **Prioriteit:** Must · *Advies PO: als eerste oppakken*

*Als bestuurder wil ik met mijn eigen account toegang krijgen tot de club waar ik lid van ben, zodat meerdere bestuurders samen in dezelfde club kunnen werken.*

**Acceptatiecriteria:**
- [ ] Koppeling gebruiker → club (bijv. `gebruikers/{uid}.clubId` of `clubs/{clubId}/leden/{uid}` met rol); `huidigClubId` komt uit die koppeling en niet meer uit `uid`
- [ ] Firestore-regels: alleen leden van een club mogen `clubs/{clubId}/**` lezen en schrijven
- [ ] Firestore-regels opgenomen in de repo (`firestore.rules`)
- [ ] Migratie van de bestaande data van `clubs/{uid}` naar een echte clubId (HCA)
- [ ] Profiel, logo en structuurelementen blijven werken

---

### CK-017 — Dashboardcijfers uit echte gegevens
**Status:** Open

*Als bestuurder wil ik dat de cijfers op het dashboard kloppen met de gegevens van mijn club.*

**Acceptatiecriteria:**
- [ ] Aantal strategische pijlers en operationele domeinen wordt geteld uit `structuurelementen` (nu staat er vast "3" en "12")

---

### CK-020 — Vermogens onder een pijler of domein (Model-laag M1)
**Status:** Open

*Volgende stap in de structuur Club → Pijlers/Domeinen → Vermogens. Uitwerken na P0c.*

