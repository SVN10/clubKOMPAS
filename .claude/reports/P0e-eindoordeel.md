# Eindoordeel: P0e — Aparte testomgeving

*Beoordelaar, 22 november 2026. Gelezen: specs (testomgeving, gebruikersreis, ontwerp), bouwverslag incl. herstelronde, de vijf kwaliteitsrapporten, beide docs. Steekproef in de code: `src/firebase.js`, `vite.config.js`, P0e-blok in `src/style.css`, `.claude/backlog.md`. Geen code gewijzigd.*

**Waarover dit oordeel gaat:** of de code nu veilig gecommit (en daarna naar `main` gepusht) kan worden. Niet of de testomgeving al werkt; dat is nog niet end-to-end gezien en staat in de checklist hieronder.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen | Na herstelronde |
|-------|-----------|---------|---------------------|-----------------|
| Functioneel testen | Tester | ✅ | 0 | Punt 1 (dubbele `--omgeving`) en 2 (uitlijning) verwerkt; punt 3 is handmatig |
| Huisstijl | Huisstijl | ✅ | 0 | Alle drie suggesties verwerkt (`--on-orange`, `code`-kleur, geen `calc(100vh - 28px)`) |
| Beveiliging | Beveiliging | ✅ | 0 | 1, 3, 4 verwerkt; 2 (SDK/audit) en 5 (Vercel Preview) naar backlog |
| Compliance | Compliance | ✅ (🟡 acceptabel met aandacht) | 0 | 1–5 verwerkt in README (fictieve data, regio, verwerkersvoorwaarden, 2FA); 6 (Preview) naar backlog |
| Toegankelijkheid | Toegankelijkheid | ✅ | 0 | 2, 3, 5 verwerkt; 1 (foutkleur donker, bestond al) naar backlog |

Kanttekening: de rapporten zijn geschreven vóór de herstelronde. De nieuwe code uit die ronde (`gemengde-config`, `__MODUS_SLEUTELS__` in `vite.config.js`, de aangepaste wachtwoordinvoer, de `:has()`-CSS) is niet opnieuw door de specialisten gezien. Ik heb `firebase.js`, `vite.config.js` en de CSS zelf nagelopen: alle nieuwe controles zitten achter `import.meta.env.DEV` of hangen aan `body.met-omgeving-balk` (die live nooit gezet wordt). De live build gedraagt zich dus als voorheen.

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/P0e-technisch.md`) | ✅ actueel, incl. herstelronde en test-ID `svn10-clubkompas-test` |
| Gebruikersdocs (`.claude/docs/P0e-voor-gebruikers.md`) | ✅ HCA-deel ("er verandert niets") en Paul-deel compleet |
| README / CHANGELOG | ✅ bijgewerkt volgens bouwverslag |

## Waarom de commit veilig is voor live

- Vercel bouwt met `npm run build` (ongewijzigd, modus `production`) en eigen variabelen. `DEV` is dan false: geen M2, geen gemengde-config-check, geen balk bij `VITE_OMGEVING=Productie`.
- Enige live-verschillen: `role="alert"` op het inlogfoutvak (onzichtbaar) en `.btn.primary` gebruikt nu token `--on-orange` met dezelfde waarde `#111212`. Visueel ongewijzigd.
- `firestore.rules`: alleen commentaar gewijzigd.
- Alle project-ID-vergelijkingen zijn exact (`===`); het gedeelde begin `svn10-clubkompas` / `svn10-clubkompas-test` kan niet verward worden.
- Let op: committen zelf doet niets live; de **push naar `main`** start de Vercel-deploy.

## Aandachtspunten voor Paul

1. **Vercel installeert nu ook `firebase-tools`** (devDependency, ca. 578 extra pakketten). De bundle verandert niet, maar de eerste build duurt langer. Kijk na de push of de Vercel-build slaagt. `re2` is een optionele afhankelijkheid; als die niet bouwt, faalt de installatie niet.
2. **Backlogpunten staan nog niet in `.claude/backlog.md`.** Ze staan alleen in de technische doc. Zet ze als losse items op de backlog: Vercel Preview naar testwaarden, Firebase SDK bijwerken + audit, foutkleur `.form-fout` in donkere modus, productieregio en verwerkersvoorwaarden vastleggen.
3. **Commit alleen P0e.** In de werkboom staan ook `.claude/specs/CK-020-*.md` (andere opdracht); die horen niet in deze commit. Vergeet de nieuwe map `scripts/lib/` niet (untracked).
4. **`.env` blijft tot stap 9 staan.** Tot `.env.test.local` gevuld is, toont `npm run dev` bewust M2. Dat is geen fout.
5. **`dev:productie` en authDomain:** de nieuwe controle eist dat `authDomain` begint met `svn10-clubkompas.`. Gebruikt productie een eigen authDomain, dan stopt `dev:productie` met "configuratie gemengd". Live heeft hier geen last van. Even nagaan (zie checklist).

## Blokkades

Geen.

## Checklist handmatige controles

### A. Vóór de commit (5 minuten)
- [ ] `git status`: `.env`, `.env.productie.local` en `.env.test.local` staan er **niet** tussen (genegeerd).
- [ ] `.env.test.local.voorbeeld` bevat alleen lege waarden (`git diff --cached .env.test.local.voorbeeld` na `git add`).
- [ ] Alleen P0e-bestanden staged, inclusief `scripts/lib/`, `scripts/regels.mjs`, `scripts/seed-testclub.mjs`, `firebase.json`, `.firebaserc`, `package-lock.json`; **zonder** de CK-020-specs.
- [ ] `npm run build` slaagt nog op je eigen machine.

### B. Testproject inrichten (README "Omgevingen", stappen 1–10)
- [ ] Stap 1b: verwerkersvoorwaarden geaccepteerd in test **en** gecontroleerd in productie; datum en account genoteerd.
- [ ] Stap 4: Firestore-regio test gekozen (EU) en genoteerd; productieregio genoteerd.
- [ ] `npx firebase login` en `npm run regels:test`: kopregel "REGELS NAAR: TEST — project svn10-clubkompas-test", daarna "Deploy complete". In de testconsole staat dezelfde regeltekst; in de productieconsole is de publicatietijd **niet** veranderd.
- [ ] Testgebruiker + `clubs`, `leden`, `gebruikers` met de hand aangemaakt (fictief adres).
- [ ] `node scripts/seed-testclub.mjs --droog`: kopregel "DOEL: TEST · DROOG", 6 functies en 15 domeinen in het overzicht. Daarna echt draaien; tweede keer draaien geeft geen dubbelen.
- [ ] `node scripts/seed-testclub.mjs --omgeving=productie` weigert direct.

### C. De app in de browser (`npm run dev`)
- [ ] Petrolkleurige balk "Testomgeving" met `svn10-clubkompas-test`, tabtitel begint met TEST, footer "Test · Versie …".
- [ ] Inloggen met testaccount: Home toont "Testclub clubKOMPAS", 15 domeinen; Beheer toont 6 bestuursfuncties.
- [ ] Inloggen met je HCA-account: mislukt, met de testhint (M5).
- [ ] Eén keer de koppeling tijdelijk weg (of een tweede testaccount zonder koppeling): "Geen club gekoppeld" met de extra testregel (M6).
- [ ] Donkere modus en een smal venster (ca. 360px): balk breekt netjes af, geen horizontale scroll.
- [ ] `npm run dev:productie`: oranje balk "Let op: echte clubdata", oranje footervlak, **geen** "configuratie gemengd" (punt 5 hierboven). Daarna direct weer stoppen.
- [ ] Pas als alles hierboven werkt: `.env` verwijderen (stap 9) en `npm run dev` nog één keer starten.

### D. Na de push naar `main` (live)
- [ ] Vercel-build geslaagd.
- [ ] Live: geen balk, footer "Productie · Versie …", tabtitel "clubKOMPAS", inloggen HCA werkt, data zichtbaar.
- [ ] Vercel → Settings → Environment Variables: genoteerd voor welke omgevingen (Production/Preview) de `VITE_FIREBASE_*` gelden. Niets wijzigen; staat Preview op productie, dan is dat het backlogpunt.

### E. Afronden
- [ ] Backlogpunten uit aandachtspunt 2 toegevoegd; P0e in de backlog op "Afgerond" zodra B t/m D groen zijn.

## Mijn aanbeveling

**🟢 GO — klaar voor jouw goedkeuring om te committen en naar `main` te pushen**

Er zijn geen kritieke bevindingen. Alle punten uit de kwaliteitsrapporten zijn verwerkt of bewust naar de backlog verschoven. De live app blijft functioneel en visueel gelijk. Voorbehoud: P0e is pas **af** als checklist B t/m D gedaan is. Die stappen raken live niet, maar ze zijn nog nooit end-to-end uitgevoerd. Gaat daar iets mis (bijvoorbeeld inloggen, seed of `regels:test`), dan is dat een herstelpunt voor de bouwer en geen reden om de commit terug te draaien.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
