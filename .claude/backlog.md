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
- [ ] Opgeslagen in Firestore onder `clubs/{clubId}/profiel`
- [ ] Bewerken via een instellingenscherm

---

### CK-012 — Domeinen aanmaken (Model-laag M0)
**Status:** Backlog

*Als bestuurder wil ik operationele domeinen kunnen aanmaken, zodat ik naast pijlers ook de domeinen van mijn club kan beheren.*

**Acceptatiecriteria:**
- [ ] Domein aanmaken met naam, omschrijving en type (Domein)
- [ ] Domeinen opgeslagen in Firestore: `clubs/{clubId}/domeinen/{domeinId}`
- [ ] Domeinen weergegeven in het grid naast pijlers
- [ ] Hardcoded domeinen (Bestuur, Financiën, Communicatie) blijven zichtbaar maar zijn niet bewerkbaar

**Afhankelijkheid:** P0b

---

### CK-013 — Domeinen bewerken en verwijderen (Model-laag M0)
**Status:** Backlog

*Als bestuurder wil ik een zelf aangemaakt domein kunnen bewerken of verwijderen.*

**Acceptatiecriteria:**
- [ ] Bewerken en verwijderen van dynamische domeinen (zelfde patroon als CK-011)
- [ ] Hardcoded domeinen zijn niet verwijderbaar

**Afhankelijkheid:** CK-012
