# Testrapport P0c — Club loskoppelen van gebruiker (Fase 5a)

Uitgevoerd: node --check op alle scripts (OK), `vite build` naar tijdelijke map (OK, alleen chunk-size-waarschuwing), unit-tests van `gelijk`/`verschilVelden` en mailto-opbouw (alles OK), statische code-review. Geen Firebase-verbinding, geen codewijzigingen.

## Acceptatiecriteria
| Criterium | Status | Opmerking |
|---|---|---|
| huidigClubId uit gebruikers/{uid}.clubId; nergens gebruiker.uid als clubId | Geslaagd | `bepaalClubId` (main.js r.79-83); enige andere `.uid`-gebruik is vergelijking op sessie. Data-functies gebruiken `huidigClubId`. |
| Lidmaatschap in clubs/{clubId}/leden/{uid} met `rol` | Geslaagd (code) | Migratiescript schrijft `rol:'beheerder'` (r.236) en controleert dit bij verificatie. Echte data niet testbaar. |
| firestore.rules in repo en identiek aan console | Deels / niet testbaar | Bestand staat in repo en komt inhoudelijk overeen met spec (plus commentaarregel). Gelijkheid met console niet te controleren. |
| Rules Playground (7 scenario's) | Niet testbaar | Geen console/emulator. Door lezen: lid mag lezen/schrijven structuurelementen en profiel; leden/ en gebruikers/ write false; wildcard sluit `leden` uit; niet-lid/niet-ingelogd geweigerd; gebruikers read alleen eigen uid. Logisch consistent met alle 7 scenario's. |
| Migratiescript: --droog schrijft niet | Geslaagd (code) | Exit vóór batch (r.220-223); geen schrijfacties daarvoor. |
| Echte run kopieert profiel incl. logo + structuurelementen met zelfde ID's, 2e run geen duplicaten | Geslaagd (code) | `batch.set` met bron-ID's; hergebruik clubId uit gebruikers/{uid}; "niets te doen" bij gelijk doel. Draaien niet mogelijk. |
| Brondata ongewijzigd | Geslaagd (code) | Script schrijft nooit naar clubs/{uid}; verificatie leest bron opnieuw en vergelijkt. |
| HCA ziet zelfde gegevens na migratie | Niet testbaar | Vereist echte data/browser. |
| CRUD structuurelement en profiel/logo landen in clubs/{hcaClubId} | Geslaagd (code) | Functies r.49-76 gebruiken `huidigClubId`, ongewijzigd. |
| Tweede testaccount ziet/bewerkt dezelfde data | Niet testbaar | Procedure in README correct; vereist console. |
| Account zonder koppeling: geen-club-scherm, uitloggen, geen reads op clubs/ | Geslaagd (code) | `laadClub` geeft 'geen-club' vóór enige clubs-read als clubId ontbreekt; kaart zonder nav/footer; knop `signOut`. |
| Terugdraaiprocedure beschreven; oude regels bewaard in scripts/firestore.rules.voor-P0c | Niet geslaagd | Procedure staat in README. Bestand `scripts/firestore.rules.voor-P0c` bestaat NIET (alleen te maken door PO uit console; stap 0). |

## Ontwerp-/gebruikersreischecks (code)
- Laadkaart pas na 500 ms (`setTimeout`), timer gewist bij uitkomst en bij uitloggen: geslaagd.
- Geen-club variant A/B (SUPPORT_EMAIL leeg → geen link/dubbele punt), lege e-mail → zin zonder strong: geslaagd.
- Foutkaart: permission-denied → geen-club, andere fouten → foutkaart; "Bezig..." zonder re-render; focus terug op knop; hint vanaf poging 2 met leegmaken + 100 ms; onderwerp "Storing clubKOMPAS": geslaagd.
- Race bij uitloggen (uid-check na elke await): geslaagd.
- Setfavicon vóór renderDashboard: geslaagd.
- Mailto-opbouw: correct geëncodeerd (`+`, `@`, newline), ook bij lege/undefined e-mail.
- CSS-klassen uit ontwerp aanwezig in style.css r.413-455.
- Visueel/focus/schermlezer/360px/donkere modus: niet testbaar (geen browser).

## Regressie
- Build slaagt; main.js bestaande functies (dashboardcijfers, instellingen, auth-wijzigingen) ongewijzigd in diff, alleen toevoeging + `onAuthStateChanged`.
- import-hca.mjs / opschonen-dubbelen.mjs lezen nu clubId uit gebruikers/{uid} en breken netjes af; migrate.mjs gemarkeerd als verouderd. Variabele `doc` in import-hca hernoemd naar `nieuw` (nodig vanwege import `doc`): correct.
- Niet getest: runtime-gedrag in browser.

## Randgevallen
| Geval | Status | Detail |
|---|---|---|
| Gebruikersdoc zonder ledendoc | Geslaagd (code) | permission-denied op profiel → geen-club |
| clubId leeg/niet-string | Geslaagd | `bepaalClubId` geeft null |
| Netwerkfout | Geslaagd (code) | foutkaart, niet geen-club |
| Profieldoc ontbreekt | Geslaagd | null → dashboard met standaardtitels (spec: ongewijzigd) |
| Doelclub van ander account (gemigreerdVan) | Geslaagd | script stopt |
| > 450 documenten | Geslaagd | script stopt |
| Onverwachte collecties (instellingen/*, pijlers, domeinen) | Geslaagd | waarschuwing |
| Echte uid niet in repo | Geslaagd | alleen placeholder `<HCA-UID>` |

## Bevindingen
1. **Midden**: `scripts/firestore.rules.voor-P0c` ontbreekt (AC rollback). Hoort bij handmatige stap 0 door PO vóór de migratie; geen codefout, maar AC pas af na aanmaken.
2. **Laag**: `aantalSchrijfacties = 4 + ...` (migreer-club.mjs r.200) is 1 te hoog; echte ops zijn 3 + profiel + structuur. Alleen cosmetisch in melding/limiet.
3. **Info**: `toonUitkomst` roept `setFavicon` ook zonder logo aan; `setFavicon` (r.16-19) negeert een lege waarde, dus geen probleem.
4. **Laag**: bij hergebruik zonder verschil maar met onvolledige koppeling schrijft script gewoon door (juist gedrag), maar toont dan geen "doel bevat data"-melding; OK.
5. **Info**: dubbele `onAuthStateChanged` voor dezelfde uid is niet afgevangen; Firebase doet dat normaal niet.
6. **Info**: SUPPORT_EMAIL is nog leeg (PO-besluit: adres onbekend); variant B actief.

## Eindoordeel
Code voldoet aan de spec voor zover statisch toetsbaar; geen blokkerende fouten. Openstaand: bestand voor-P0c (PO-actie), browser-rookproef, Rules Playground en echte migratie. Klaar voor beoordelaar, met bovenstaande niet-testbare punten.
