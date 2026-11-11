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

### CK-011 — Pijler bewerken en verwijderen (Model-laag M0)
**Status:** Backlog

*Als bestuurder wil ik een zelf aangemaakte pijler kunnen bewerken of verwijderen.*

**Opmerkingen:** Hardcoded pijlers mogen niet verwijderd worden. Start na P0b.
