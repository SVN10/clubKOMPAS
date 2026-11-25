# Eindoordeel: CK-170 — Beheer → Activiteiten

Fase 7, 25-11-2026. Branch `test`, nog niet gecommit. Route groot. Gelezen: spec (met besluiten van Paul), `CK-170-controle.md`, `CK-170-beveiliging.md` en `.claude/docs/CK-170.md`. Na de herstelronde: 152 van 152 regeltests groen, lage testpunten 1 t/m 3 en de extra regeltests uit de beveiliging opgelost (volgens de bouwer, niet door mij opnieuw gedraaid).

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen |
|-------|-----------|---------|---------------------|
| Functioneel testen | Controle (test) | ✅ | 0 |
| Huisstijl | Controle (huisstijl) | ✅ | 0 |
| Beveiliging | Beveiliging | ✅ | 0 |
| Compliance | — | n.v.t. | — (besluit 3: geen omschrijving, geen persoonsgegevens) |
| Toegankelijkheid | Controle (toegankelijkheid) | ✅ | 0 |

Ernst totaal vóór herstel: hoog 0, middel 0, laag 12. Na herstel staan er nog 8 lage punten open, geen enkele blokkeert.

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/CK-170.md`, deel Technisch) | ✅ (twee kleine onjuistheden, zie hieronder) |
| Gebruikersdocs (`.claude/docs/CK-170.md`, deel Voor gebruikers) | ✅ |

Kleine onjuistheden in de docs (geen blokkade, wel even rechtzetten vóór de commit):
- Bij Tests staat nog dat `activiteitBezet`, `sorteerActiviteiten` en `geldigeActiviteit` geen eigen test hebben. Na de herstelronde klopt dat niet meer.
- De docs zeggen dat de keuzelijst Vermogen met `optgroup` per domein werkt. De spec zegt "Vermogensnaam (Domeinnaam)", omdat `keuzelijst.js` geen `optgroup` kent. Controleer op tst hoe de lijst eruitziet (stap 5 van de testlijst) en pas de docs daarop aan.

## Aandachtspunten voor Paul

1. **Wat de agents niet konden zien.** Niemand heeft het scherm in de browser bekeken. Dit moet jij doen op tst: het toetsenbord in de eigen keuzelijst en datumkiezer, het smalle scherm (320–400 px, ook de kolomafstand), de focusrand en het kalenderpictogram. Zie de testlijst.
2. **Aanvaard restrisico (jouw besluit 4).** Alleen de app blokkeert het verwijderen van een vermogen of commissie met activiteiten, de regels niet. Via devtools of bij twee beheerders tegelijk kan er een verwijzing naar iets wat weg is achterblijven. De lijst toont dan "bestaat niet meer". Geen datalek, blijft binnen de club.
3. **Voor de backlog (niet nu):**
   - `geldigeDatum` laat een datum als 31 februari of jaar 0000 door (alleen via devtools, geldt ook voor projecten). Algemene aanscherping als eigen item.
   - App-breed `aria-required` op verplichte velden overwegen.
4. **Nog open, laag:** de lege hint boven de lijst (`.tussen-hint:empty`, marge −16 px) kan de balk en lijst te dicht op elkaar zetten; de uitgeschakelde knop "+ Activiteit toevoegen" verwijst niet naar de hint. Beide even bekijken op tst.

## Blokkades

Geen.

## Uitrolvolgorde

Regels altijd vóór de app.
1. `npm run regels:test` (regels naar tst).
2. App op tst testen met de testlijst hieronder.
3. Alles goed: `npm run regels:productie`, pas daarna de merge naar `main` en de app naar productie.

## Testlijst voor Paul op tst

Log in als beheerder, tenzij anders staat.

1. Kijk in het zijmenu: **Activiteiten** staat onder Beheer direct na Vermogens, met een kalenderpictogram dat in stijl past bij de andere pictogrammen.
2. Open Activiteiten zonder activiteiten: je ziet "Nog geen activiteiten" met uitleg en de knop **+ Activiteit toevoegen**.
3. Klik op toevoegen en klik meteen op **Opslaan**. Je ziet foutmeldingen bij de velden en de cursor staat in het eerste foute veld.
4. Bedien het formulier alleen met het toetsenbord (Tab, pijltjes, Enter, Esc): kies een soort en een vermogen in de keuzelijst en een datum in de datumkiezer. Zie je steeds duidelijk waar de focusrand staat?
5. Open de keuzelijst Vermogen: staan de namen goed leesbaar (met het domein erbij) en kun je springen door de eerste letter te typen?
6. Kies een begindatum en open daarna de einddatum: een dag vóór de begindatum kun je niet kiezen.
7. Sla een activiteit op met alleen een begindatum en een met een periode. Je ziet een melding, en in de lijst "12 mrt 2027" of "12 – 14 mrt 2027" achter de naam.
8. Maak drie activiteiten op verschillende datums: de lijst staat op datum, de eerste bovenaan, en er zijn geen pijltjes ↑ ↓.
9. Probeer dezelfde naam op dezelfde begindatum nog een keer: dat wordt geweigerd. Dezelfde naam op een andere datum mag wel.
10. Gebruik het filter op soort: alleen die soort blijft over. Zet het terug op "Alle soorten".
11. Bewerk een activiteit in de rij en verwijder er een (bevestig de vraag). Beide geven een melding.
12. Ga naar Beheer → Vermogens en probeer een vermogen te verwijderen dat nog een activiteit heeft. Je krijgt een melding met het aantal en er wordt niets verwijderd. Doe hetzelfde bij Beheer → Commissies.
13. Verwijder een vermogen zonder activiteiten: dat lukt nog gewoon. Controleer ook kort dat Projecten en Samenwerkingen werken zoals altijd.
14. Maak het venster smal (320–400 px, of je telefoon): de rijen passen, er komt geen horizontale schuifbalk en de ruimte tussen de kolommen ziet er niet te breed uit. Kijk ook of de balk en de lijst niet te dicht op elkaar staan.
15. Log in als lid dat geen beheerder is: je ziet Activiteiten niet in het menu.

## Mijn aanbeveling

**🟢 GO voor tst** — geen kritieke of hoge bevindingen, build en 152 regeltests groen, de open punten zijn laag en het restrisico is door jou aanvaard.

Voor PRD: **GO met voorbehoud** — pas na jouw testlijst op tst, met extra aandacht voor stap 4, 5 en 14. Gaat daar iets mis, dan terug naar de bouwer.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
