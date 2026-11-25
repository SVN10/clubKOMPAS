# Eindoordeel: CK-172 — Uitvoeringen van een activiteit

Fase 7, 25-11-2026. Branch `test`, nog niet gecommit. Route groot. Gelezen: spec en ontwerp (met de besluiten van Paul), `CK-172-controle.md`, `CK-172-beveiliging.md` en `.claude/docs/CK-172.md`. Na de herstelronde: build geslaagd, 177 van 177 regeltests groen (volgens de bouwer, niet door mij opnieuw gedraaid). Niemand heeft de app in de browser bekeken, want de nieuwe regels staan nog niet in test.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen |
|-------|-----------|---------|---------------------|
| Functioneel testen | Controle (test) | ✅ | 0 |
| Huisstijl | Controle (huisstijl) | ✅ | 0 |
| Beveiliging | Beveiliging | ✅ | 0 |
| Compliance | — | n.v.t. | — (besluit 3: geen persoonsgegevens, geen vrije tekstvelden) |
| Toegankelijkheid | Controle (toegankelijkheid) | ✅ | 0 |

Ernst totaal vóór herstel: hoog 0, middel 0, laag 9, info 2. In de herstelronde zijn 5 lage punten opgelost:
- In productie draait het omzetscript alleen met `--droog` (beveiliging 3).
- Een afwijkende bestaande uitvoering wordt gemeld en overgeslagen (beveiliging 4).
- De volgordeknop laat open formulieren intact (controle 2).
- `.cel-periode` breekt af op smalle schermen (controle 3).
- Er staat een opmerking bij de sortering (controle 1).

Er staan nog 4 lage punten en 2 infopunten open. Geen enkele blokkeert.

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/CK-172.md`, deel Technisch) | ✅ (bijgewerkt na de herstelronde) |
| Gebruikersdocs (`.claude/docs/CK-172.md`, deel Voor gebruikers) | ✅ |

## Aandachtspunten voor Paul

1. **De volgorde van de uitrol is hier echt belangrijk.** Eerst de regels, dan het script, dan pas de app. Wijk je daarvan af, dan kan een oude datum stil verdwijnen (nieuwe app vóór het script) of blijft er een losse uitvoering achter (de oude app verwijdert een activiteit). Draai het script na de echte run nog één keer met `--droog`: dat moet "Niets te doen" geven, zonder wezen.
2. **Na het publiceren van de regels werkt de oude app (0.14.0) niet meer goed voor activiteiten.** Toevoegen en bewerken lukt dan niet. Houd die tijd kort.
3. **Wat de agents niet konden zien.** Het scherm is niet in de browser bekeken en het script is niet tegen de database gedraaid. Dat doe jij op tst met de testlijst hieronder. Let vooral op 320 px, het toetsenbord en VoiceOver.
4. **Dubbele namen na het omzetten (besluit 9).** Het script meldt ze alleen. Ruim ze daarna zelf op in de app: houd één activiteit, zet daar een uitvoering bij en verwijder de andere.

## Blokkades

Geen.

## Uitrolvolgorde

Regels altijd vóór het script, en het script vóór de app.
1. `npm run regels:test`
2. `npm run uitvoeringen:omzetten -- --droog`, dan `npm run uitvoeringen:omzetten`, dan nog een keer met `--droog`.
3. De app op tst testen met de testlijst hieronder.
4. Alles goed: `npm run regels:productie`, pas daarna de merge naar `main` en de app naar productie. In productie zet je niets om.

## Testlijst voor Paul op tst

Log in als beheerder, tenzij er iets anders staat.

**A. Regels en omzetscript**
- [ ] 1. Draai `npm run regels:test`. Je ziet dat de regels gepubliceerd zijn, zonder fout.
- [ ] 2. Draai `npm run uitvoeringen:omzetten -- --droog`. Je ziet het aantal activiteiten en per activiteit "naam: datum → 1 uitvoering", plus eventuele afwijkingen (dubbele namen, wezen, foute datums). Er wordt niets geschreven.
- [ ] 3. Draai `npm run uitvoeringen:omzetten` en typ "ja". Je ziet dezelfde lijst en daarna dat alles is omgezet.
- [ ] 4. Draai nog een keer `npm run uitvoeringen:omzetten -- --droog`. Je ziet "Niets te doen" en geen wezen.
- [ ] 5. Noteer de dubbele namen uit stap 2. Die ruim je op in stap 13.

**B. De app**
- [ ] 6. Open Beheer → Activiteiten. Elke omgezette activiteit heeft "1 uitvoering" met de oude datum achter de naam.
- [ ] 7. **Nieuwe activiteit met eerste uitvoering.** Klik op **+ Activiteit toevoegen**. Het blok met de datums heet "Eerste uitvoering". Vul alles in en sla op. Je ziet de melding, en in de rij de datum en "1 uitvoering".
- [ ] 8. **Activiteit zonder uitvoering.** Bewerk een activiteit: het formulier heeft geen datumvelden. Verwijder bij een activiteit haar enige uitvoering. De rij zegt "Nog geen uitvoering" en de knop zegt **"Geen uitvoeringen"**. Klap uit: het paneel zegt dat er nog geen uitvoeringen zijn en toont "+ Uitvoering toevoegen".
- [ ] 9. **Uitklappen.** Klik op "1 uitvoering": het paneel klapt open en de pijl draait. Klik nog eens: het klapt dicht.
- [ ] 10. **Toevoegen, bewerken, verwijderen.** Voeg in het paneel een uitvoering toe. Je ziet de melding in het paneel ("Uitvoering … toegevoegd aan …") en het aantal in de rij gaat omhoog. Bewerk een uitvoering: kies je een begindatum, dan kun je geen einddatum daarvóór kiezen. Verwijder een uitvoering en bevestig. Je ziet de melding en de focus staat op de buurregel. Een afgelopen uitvoering heeft het label "voorbij", een lopende "bezig".
- [ ] 11. **De volgordeknop.** Zet bij een activiteit 2 of meer uitvoeringen. Klik op "Nieuwste eerst": de nieuwste staat bovenaan en de knop heet nu "Oudste eerst". Herlaad de pagina en klap weer uit: de keuze is bewaard, ook bij andere activiteiten. Open daarna een half ingevuld formulier en klik op de volgordeknop: het formulier blijft staan. Bij 0 of 1 uitvoering zie je de knop niet.
- [ ] 12. **De volgorde van de lijst.** Zorg voor een activiteit die nog komt, een waarvan alles voorbij is en een zonder uitvoering. De lijst toont eerst die met een komende (of lopende) datum, de eerstvolgende bovenaan. Dan die met "laatst: …", de meest recente eerst. Dan die zonder uitvoering, op naam. Het filter op soort werkt nog.
- [ ] 13. **Activiteit met uitvoeringen verwijderen.** Verwijder een activiteit met bijvoorbeeld 2 uitvoeringen. De vraag noemt het aantal ("… en 2 uitvoeringen verwijderen?"). Na bevestigen zijn de activiteit en de uitvoeringen weg en noemt de melding het aantal. Ruim zo ook de dubbele namen uit stap 5 op.
- [ ] 14. **Dubbele naam.** Maak een activiteit met een naam die al bestaat (ook met andere hoofdletters of een andere datum). Je ziet bij Naam: "Er is al een activiteit met deze naam."
- [ ] 15. **Dubbele datum.** Voeg bij een activiteit een uitvoering toe op een begindatum die ze al heeft. Je ziet bij Begindatum: "Deze activiteit heeft al een uitvoering op deze datum."
- [ ] 16. **Blokkades.** Probeer in Beheer → Vermogens een vermogen te verwijderen dat nog een activiteit heeft. Je krijgt een melding met het aantal en er gaat niets weg. Doe hetzelfde in Beheer → Commissies.
- [ ] 17. **320 px.** Maak het venster 320 px breed (of gebruik je telefoon). De rijen passen, er is geen horizontale schuifbalk en een lange datum ("laatst: 30 dec 2026 – 2 jan 2027") breekt netjes af. Het paneel en het formulier passen ook.
- [ ] 18. **Toetsenbord.** Doe stap 9 en 10 alleen met Tab, Enter, Spatie en Esc. Je ziet steeds waar de focusrand staat. Enter in het datumformulier slaat niet op; opslaan gaat met de knop.
- [ ] 19. **VoiceOver.** De uitklapknop leest als "3 uitvoeringen van ALV, ingeklapt" (of "uitgeklapt"). Na toevoegen of verwijderen wordt de melding in het paneel voorgelezen. Na de volgordeknop hoor je "Nieuwste uitvoering bovenaan." of "Oudste uitvoering bovenaan.".
- [ ] 20. Log in als lid dat geen beheerder is: je ziet Activiteiten niet in het menu.

**C. Vóór de merge naar `main`**
- [ ] 21. Draai `npm run regels:productie`, en pas daarna de merge en de app naar productie.
- [ ] 22. Ter controle: `npm run uitvoeringen:omzetten -- --droog --omgeving=productie`. Je ziet "Niets te doen".

## Resterende risico's

- **Een losse uitvoering (wees).** Voegt een tweede beheerder een uitvoering toe terwijl jij de activiteit verwijdert, dan kan die uitvoering achterblijven. Ze is onzichtbaar en lekt niets. Het aantal in de vraag kan dan afwijken; de melding noemt het echte aantal. Het omzetscript meldt wezen.
- **Alleen de app controleert** of een activiteitnaam uniek is en of een datum dubbel is. De regels blokkeren ook niet het verwijderen van een activiteit met uitvoeringen. Het risico (twee beheerders tegelijk, of via devtools) is klein en blijft binnen de club.
- **`geldigeDatum` controleert de kalender niet** (`2027-02-31` komt erdoor). Dat was al zo.
- **`activiteitId` mag elke tekst zijn** (1 tot 100 tekens). Een test liet zien dat je daarmee niet bij een ander document of een andere club komt.
- **Opslaan en Annuleren** in het uitvoeringformulier zijn onder 700 px geen 44 px hoog. Dat geldt voor alle formulieren in de app.

## Voor later (backlog)

- **CK-160 seizoensplanner:** vraag de uitvoeringen op uit `clubs/{clubId}/uitvoeringen` op `begindatum`, en sla uitvoeringen zonder bekende activiteit over.
- **CK-161 herhaal in het volgende seizoen:** een nieuwe uitvoering met verschoven datums. Dat is ook de oplossing voor activiteiten met heel veel uitvoeringen (een wekelijkse training), want het paneel heeft geen paginering.
- App-breed: knoppen in formulieren 44 px op smalle schermen.
- Eventueel `activiteitId` strakker maken in de regels (alleen letters, cijfers, `_` en `-`), samen met de app en de tests.
- Algemene aanscherping van `geldigeDatum` (ook bij projecten), als eigen item.

## Mijn aanbeveling

**🟢 GO voor tst.** Er zijn geen kritieke, hoge of middelzware bevindingen. De build en 177 regeltests zijn groen, en de lage punten uit de herstelronde zijn opgelost.

Voor PRD: **GO met voorbehoud.** Pas na jouw testlijst op tst, met extra aandacht voor het omzetscript (stap 2 tot en met 4), 320 px, het toetsenbord en VoiceOver (stap 17 tot en met 19). Houd de uitrolvolgorde strikt aan. Gaat er iets mis, dan terug naar de bouwer.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
