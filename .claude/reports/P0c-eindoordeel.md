# Eindoordeel: P0c — Club loskoppelen van gebruiker

*Beoordelaar, fase 7 — 19 november 2026. Geen code aangepast.*

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen |
|-------|-----------|---------|---------------------|
| Functioneel testen | Tester | ✅ (statisch; browser niet getest) | 0 |
| Huisstijl | Huisstijl | ✅ | 0 |
| Beveiliging | Beveiliging | ✅ na fixronde (was 🟡) | 0 |
| Compliance | Compliance | 🟡 acceptabel met aandacht | 0 |
| Toegankelijkheid | Toegankelijkheid | ✅ | 0 |

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/P0c-technisch.md`, README) | ✅ |
| Gebruikersdocs (`.claude/docs/P0c-voor-gebruikers.md`) | ✅ |
| CHANGELOG | ✅ (versie 0.3.0 is een voorstel; `package.json` staat op 0.2.1) |

## Fixronde: zelf gecontroleerd

| # | Punt | Klopt? | Waar |
|---|------|--------|------|
| 1 | `leden/{uid}`: alleen eigen document lezen | ✅ | `firestore.rules` r. 32-35 |
| 2 | Wildcard weg, expliciet per collectie met validatie | ✅ | `firestore.rules` r. 41-55 |
| 3 | Logo alleen `data:image/` in app én regels | ✅ | `veiligLogo` + `esc()` in `main.js` (top-bar, instellingen, favicon); `geldigLogo` in regels |
| 4 | Geen email in `gebruikers/{uid}` | ✅ | `migreer-club.mjs` r. 241; README stap 3 |
| 5 | "Bezig..." via `aria-disabled` + melding in status-hint | ✅ | `main.js` r. 339-342 |
| 6 | Scripts: telling, herinnering stap 3, geen wachtwoord-argument, try/catch | ✅ | `migreer-club.mjs` r. 200, 278-279; `import-hca.mjs` r. 73-74, 97-104; `opschonen-dubbelen.mjs` r. 88-95 |
| 7 | README: resetlink, ontkoppelprocedure, logboek | ✅ | README r. 44, 51-60, 66-72 |

De app-code past bij de nieuwe regels: profiel opslaan (`setDoc`, met of zonder logo) en CRUD op structuurelementen (altijd `type` + `naam`) vallen binnen de validatie.

## Aandachtspunten voor Paul

1. **Bestaande data moet door de nieuwe validatie komen.** Heeft een bestaand HCA-structuurelement een ander `type` dan pijler/domein, of een naam langer dan 200 tekens? Dan kan het na livegang niet meer bewerkt worden. De droogtest meldt "Overig type"; controleer die regel.
2. **Opslaan dat door de regels geweigerd wordt, geeft bij Pijlers & Domeinen geen melding.** Er is geen foutafhandeling in toevoegen/bewerken/verwijderen. Het naamveld heeft ook geen maximale lengte. Dit was al zo, maar de strengere regels maken het iets waarschijnlijker. Laag risico, wel een kleine vervolgstory.
3. **Kleine fout in README:** onder "Stap 4 — Rookproef" staat "Ga daarna zo snel mogelijk door naar stap 3". Die zin hoort bij stap 2. Bij voorkeur vóór commit herstellen.
4. **Besluiten bij compliance die nog open staan** (geen blokkade):
   - uiterste datum voor het opruimen van `clubs/{oudeUid}` (er is nu alleen een ondergrens);
   - akkoord van HCA voor het testaccount op echte data, of een echte tweede bestuurder gebruiken;
   - verwerkersovereenkomst met HCA en EU-regio van Firestore. Vóór een tweede club of ledendata.
5. **E-mail staat nog in `leden/{uid}`.** Bewust één kopie. Na een e-mailwijziging werk je die met de hand bij (README).

## Wat moet nog

**Vóór commit**
- README-zin bij stap 4 verplaatsen (zie punt 3). Optioneel, wel netjes.
- Kies een versienummer: `package.json` 0.3.0 of de CHANGELOG aanpassen.
- Controleer dat de commit alleen P0c bevat (er stonden eerder niet-gecommitte CK-017-wijzigingen in `src/main.js`) en geen echte uid. In de repo staat alleen de placeholder `<HCA-UID>`.

**Vóór livegang (migratie), in deze volgorde**
1. Stap 0: huidige console-regels naar `scripts/firestore.rules.voor-P0c` en committen. **Verplicht.** Zonder dit bestand kun je de regels niet terugdraaien. Noteer of de oude regels open waren. Zo ja, maak de afweging of dit gemeld moet worden als datalek (art. 33).
2. Rules Playground: alle scenario's uit de README-tabel, ook met het echte HCA-profiel (logo) en een echt structuurelement.
3. `SUPPORT_EMAIL` invullen (mag ook leeg blijven: dan staat er een zin zonder adres).
4. Migratie volgens README: overgangsregels → `--droog` → echte run (`OK`) → direct `firestore.rules` publiceren + app live → rookproef. Logboek bijhouden.
5. Browser-rookproef: HCA-account, tweede gekoppeld account, account zonder koppeling, foutkaart (offline).
6. Daarna: zelfregistratie in Firebase Auth uitzetten (PO-besluit 5).

## Restrisico's

- Regels zijn alleen op papier en in de Playground getest, niet met een emulator.
- Zolang de overgangsregels actief zijn, heeft het HCA-account toegang tot de hele database. Houd dat venster kort; het script herinnert eraan.
- Terugdraaien na ingebruikname: wijzigingen in de nieuwe locatie gaan niet automatisch terug naar de oude.
- Tabbladen met de oude app die nog open staan, krijgen na de nieuwe regels geen toegang meer. Daarom vragen we de bestuurders vooraf uit te loggen (bericht staat klaar).
- Toegankelijkheid: na de tussenkaart valt de focus op het dashboard terug naar de pagina zelf. Gelijk aan het huidige inloggedrag; voor een aparte story.

## Blokkades

Geen in de code. Voor livegang zijn stap 0 (rollback-bestand) en de Rules Playground harde voorwaarden. De migratie start pas als beide klaar zijn.

## Mijn aanbeveling

**🟠 GO met voorbehoud.** De code mag gecommit worden. Livegang alleen na stap 0, een geslaagde Rules Playground, een schone droogtest en een geslaagde rookproef.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
