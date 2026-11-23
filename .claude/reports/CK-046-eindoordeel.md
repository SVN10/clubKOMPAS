# Eindoordeel: CK-046 Projecten en samenwerkingen

Datum: 23 november 2026 · Branch: `test` · Route: groot

## Eindoordeel

**GO voor tst.** Er zijn geen kritieke of hoge bevindingen in beveiliging, test, huisstijl en toegankelijkheid. De lage bevindingen over datumcontrole, het streepje voor schermlezers, ↑/↓ bij een gelijktijdige wijziging en het laden van Bestuursfuncties zijn in de herstelronde opgelost. 94 van 94 regeltests slagen en de build slaagt.
Wat nog openstaat: niemand heeft het al in een browser getest. Dat doe je met de testlijst hieronder. Bewust geaccepteerd: de naamcontrole zit alleen in de app (besluit 14) en de regels controleren niet of de eigenaar bestaat (net als bij domeinen). Restrisico P0d: elk lid mag projecten en samenwerkingen schrijven en verwijderen, en `bevat` zetten.

| Check | Oordeel | Kritiek |
|---|---|---|
| Functioneel testen | ✅ (zonder browser) | 0 |
| Huisstijl | ✅ | 0 |
| Beveiliging | ✅ | 0 |
| Toegankelijkheid | ✅ (zonder schermlezer) | 0 |
| Technische docs en gebruikersdocs | ✅ (`.claude/docs/CK-046.md`) | – |

## Testlijst voor Paul op tst (tst.clubkompas.svn10.nl)

Voor je begint: de code is gecommit en gepusht op `test`, zodat tst bijgewerkt is.

**Eerst zelf draaien (in deze volgorde)**
- [ ] 1. `npm run regels:test`: de regels staan op test.
- [ ] 2. `npm run projecten:import -- --droog`: lees het plan. Het domein krijgt `bevat`, de Voorzitter wordt eigenaar en LED-scorebord en Buitenopslag staan in voorbereiding. Er wordt nog niets geschreven.
- [ ] 3. `npm run projecten:import` en typ "ja". Klopt het plan nog steeds?

**Projecten (Beheer → Projecten)**
- [ ] 4. In het zijmenu staan Projecten en Samenwerkingen, met een pictogram dat netjes naast de andere staat. De lijst van HCA is zichtbaar.
- [ ] 5. Toevoegen: maak een project met naam, omschrijving, eigenaar, status en datums. De knop Toevoegen is weg zolang het formulier open is. Het project staat daarna in de lijst, met een periode als "sep 2026 – jun 2028".
- [ ] 6. Bewerken: wijzig iets in de rij en sla op. De wijziging blijft staan.
- [ ] 7. Datumfout: zet de einddatum vóór de begindatum. Je ziet een melding bij de einddatum en er wordt niets opgeslagen.
- [ ] 8. Dubbele naam: gebruik een bestaande naam met andere hoofdletters. Je ziet een melding en er wordt niets opgeslagen.
- [ ] 9. Filter: kies "Lopend". Alleen lopende projecten blijven over en de #-nummers mogen gaten hebben. Zet een project op Afgerond. Je ziet dan een korte melding dat het uit het filter valt.
- [ ] 10. ↑/↓: verplaats een project, ook met een filter aan. De volgorde blijft goed na verversen (F5).
- [ ] 11. Verwijderen: bevestig. Het project is weg.

**Samenwerkingen (Beheer → Samenwerkingen)**
- [ ] 12. Toevoegen, bewerken, ↑/↓ en verwijderen werken. Er is geen status, geen datum en geen filter.

**Bestuursfuncties**
- [ ] 13. De kolom laat zien van welke domeinen, projecten en samenwerkingen een functie eigenaar is.
- [ ] 14. Probeer de Voorzitter (eigenaar van projecten) te verwijderen. Dat wordt geblokkeerd, met de melding "eigenaar van …".

**Vermogensoverzicht (de plaat)**
- [ ] 15. In het blok van het overkoepelende domein staan kaartjes met de naam en een kleine regel met de periode. Er staat geen omschrijving of eigenaar op.
- [ ] 16. Een project in voorbereiding heeft een gestippelde rand en het label "In voorbereiding".
- [ ] 17. Een afgerond project staat niet op de plaat, maar wel in Beheer.
- [ ] 18. In dat blok staat de omschrijving van het domein niet meer.
- [ ] 19. Lege tekst: zet alle projecten tijdelijk op Afgerond. Op de plaat staat dan "Er zijn geen projecten." Zet ze daarna terug.
- [ ] 20. Bewerk het domein in Beheer → Domeinen en sla het op. De kaartjes staan daarna nog op de plaat.

**Lay-out**
- [ ] 21. Bekijk het op telefoonbreedte (ongeveer 375px): beheerlijst, formulier en plaat. Niets loopt over de rand.
- [ ] 22. Zet de donkere modus aan en loop beheer en plaat nog een keer door. Alles is leesbaar en de gestippelde rand is zichtbaar.

## Stappen voor live (niet op 26 november 2026)

Pas als de testlijst helemaal goed is:
1. `npm run regels:productie`: regels altijd vóór de app.
2. Op `test`: `npm version minor` (wordt 0.10.0).
3. Naar main: `git checkout main && git merge --ff-only test`, push daarna `main` (en de tag), zodat de app live gaat.
4. `npm run projecten:import -- --omgeving=productie --droog`: controleer het plan.
5. `npm run projecten:import -- --omgeving=productie`: typ de projectnaam en "ja".
6. Controleer de plaat en Beheer → Projecten op productie.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
