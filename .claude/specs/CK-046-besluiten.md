# CK-046 — Besluiten projecten en samenwerkingen (23 november 2026)

Paul (PO) heeft deze keuzes gemaakt op 23 november 2026. Bron: `.claude/specs/CK-020-bron-vermogensoverzicht.md`, sectie "Overkoepelende domeinen".

## Grootte
1. **CK-046** volgt de route **groot** uit `.claude/pipeline.md`, omdat er een nieuw datamodel en nieuwe Firestore-regels komen.

## Wat het wordt
2. Er komen twee beheerpagina's in het zijmenu onder Beheer: **Projecten** en **Samenwerkingen**.
   - Een project is een tijdelijk traject, bijvoorbeeld Ver(nieuw)bouw, Hoofdsponsoring 27/28+, Kledinglijn 27/28+, LED-scorebord of Buitenopslag (blaashal).
   - Een samenwerking is een externe partner, bijvoorbeeld KNHB, Gemeente, Junis, Scholen of Hulpdiensten.

## Velden
3. Beide krijgen een **naam**, een **omschrijving** en een **eigenaar**. De eigenaar is een bestuursfunctie die je uit de lijst kiest, net als de eindverantwoordelijke bij een domein.
4. Een project krijgt daarnaast een **periode**.
5. Er komt **geen contactpersoon**, want dat zijn persoonsgegevens. Er komt ook geen soort partner.
6. Er is **geen koppeling** aan domeinen of vermogens.

## Status
7. Een project heeft drie standen: **in voorbereiding**, **lopend** en **afgerond**. Een samenwerking heeft geen status.

## Tonen
8. Projecten en samenwerkingen verschijnen alleen op het **Vermogensoverzicht (de plaat)**, als kaartjes in het blok van het overkoepelende domein.
   - Een project in voorbereiding krijgt een gestippelde kaart, zoals op de PDF-plaat.
   - Een afgerond project staat niet op de plaat, maar blijft wel in beheer.
9. Het **Domeinenoverzicht blijft zoals het is**.

## Besluiten na de intake (23 november 2026)
Spec: `.claude/specs/CK-046-projecten-samenwerkingen.md`. Waar de spec iets anders zegt, gelden deze besluiten.

10. **Periode:** een project krijgt een **begindatum** en een **einddatum**. Beide zijn niet verplicht. De einddatum ligt niet vóór de begindatum. De datums worden opgeslagen als tekst `JJJJ-MM-DD`, of als `''` als er geen datum is.
    - In beheer en op het kaartje staat de periode kort, bijvoorbeeld "sep 2026 – jun 2028".
11. **Kaartje op de plaat:** de naam staat erop, met daaronder een kleine regel met de periode en zo nodig "In voorbereiding". Er staat geen omschrijving en geen eigenaar op.
12. **Omschrijving van het overkoepelende domein:** in een blok met `bevat` staat de omschrijving van het domein niet op de plaat. In plaats daarvan staan daar de kaartjes.
    - Is er niets te tonen, dan staat er **"Er zijn geen projecten."** of **"Er zijn geen samenwerkingen."**
    - Een blok zonder `bevat` blijft zoals het nu is.
13. **Eigenaar:** de eigenaar is niet verplicht. Het inrichtscript vult voor HCA de Voorzitter in.
14. **Naam:** een naam is uniek binnen zijn eigen lijst. Hoofdletters tellen niet mee. Alleen de app controleert dit, de regels niet.
15. **`bevat`:** er komt nog geen keuze voor `bevat` in het domeinformulier. Dat wordt een vervolgpunt. Voor HCA zet het inrichtscript het veld.

## Besluiten na het ontwerp (23 november 2026)
Ontwerp: `.claude/specs/CK-046-ontwerp.md`. Prototype: https://claude.ai/artifact/RENY5LyFsyvUSMELuvvj8y

16. **#-kolom met een filter:** de kolom toont de plaats in de hele lijst. Met een filter kunnen er dus gaten in de nummers zitten.
17. **Laadfout op de plaat:** lukt het laden niet, dan staat in het blok de omschrijving van het domein zoals nu, met een melding erbij.
18. **Lopend project zonder datums:** op de plaat staat alleen de naam, zonder kleine regel eronder. Dit is het advies van de ontwerper.

## Bijstellingen Paul tijdens het testen (23 november 2026)
Deze gelden voor alle beheertabellen: Domeinen, Vermogens, Bestuursfuncties, Projecten en Samenwerkingen.

19. **Rijen:** elke rij is een witte kaart op het grijze vlak. Alle lijnen zijn 1 px.
20. **Kolommen:** de kolommen staan van links achter elkaar. Elke kolom is zo breed als zijn langste waarde, met 30 px ertussen (subgrid). De knoppen staan altijd rechts.
21. **Waarden:** er zijn geen vette waarden, alleen de koprij is vet. In een tabel staan nooit twee waarden onder elkaar. Daarom krijgt Domeinen een eigen kolom Vermogens.
22. **Omschrijvingen:** een omschrijving staat nooit in een tabel.
23. **Labels:** de labels van soorten zijn rond, net als de status van projecten.
24. **Filter:** het woord "Toon" staat niet meer zichtbaar voor de filters. Het blijft wel als verborgen label voor schermlezers.
25. **Knoppen ↑ en ↓:** dit worden pictogrammen in dezelfde lijnstijl als bewerken en verwijderen. Dit herziet CK-020 besluit 21.
26. **Kerncijfers:** het Vermogensoverzicht krijgt kerncijfers voor Pijlers, Ondersteunende domeinen, Vermogens, Projecten en Samenwerkingen.
    - Alle kerncijfers zijn doorklikbaar naar beheer, ook op het Domeinenoverzicht.
    - Bij Domeinen opent het juiste filter.
27. **Plaat:** "In voorbereiding" staat niet als tekst op de plaat, de stippellijn laat het zien. Voor schermlezers blijft het als verborgen tekst.

## Bijstellingen Paul na v0.10.1 (23 november 2026)
28. **Titelbalk:** de titel en het kompas worden nog eens 20% groter. De titel wordt 31,7 px, het kompas 35 px.
29. **Home:** de zin wordt "Bij het clubKOMPAS van <clubnaam>."
30. **Projecten:** de periode staat achter de projectnaam, op dezelfde regel. De kolom Periode vervalt.
31. **Domeinen:** boven de pictogrammen staat de kolomkop "Icon".
32. **Rijnummers en pijlknoppen:** rijnummers zijn altijd zichtbaar, als plaats in de hele lijst. Met een filter verdwijnen de pijlknoppen helemaal. Bij Vermogens blijven ze, omdat je daar binnen één domein schuift.
33. **Zijmenu Beheer:** de volgorde wordt Club, Bestuursfuncties, Domeinen, Vermogens, Projecten, Samenwerkingen.
34. **Keuzelijsten en datums:** alle keuzelijsten en datumvelden krijgen een eigen versie in de stijl van de app, in plaats van de lijst en de kalender van de browser. Paul wil dit binnen deze sessie.

## Bijstelling Paul (23 november 2026)
35. **Omgevingsbalk:** de omgevingsbalk staat onderaan, direct boven de footer.
36. **Titelbalk:** de titelbalk is 80 px hoog, net zo hoog als vroeger de balk en de omgevingsbalk samen. De titel en het kompas staan er verticaal gecentreerd in.
37. **Clublogo:** het clublogo wordt 15% groter, 90 px hoog. Het staat 16 px van boven en 16 px van rechts.
38. **Tekstschaal:** de tekst wordt een stap groter. Paul nam het advies over, omdat Barlow Semi Condensed een smalle letter is. Dit herziet CK-031.

    | Rol | Was | Wordt |
    |---|---|---|
    | Lopende tekst | 14 px | 16 px |
    | Bloknaam | 15 px | 16 px |
    | Toelichting | 13 px | 14 px |
    | Label | 12 px | 13 px |

    - Paragraaf, hoofdstuk en titel blijven 18, 24 en 40 px.
    - De titelbalk wordt 32 px, op de telefoon 26 px.
    - Het zijmenu wordt 192 px breed.

39. **Kaarten en knoppen blijven vierkant** (23 november 2026, CK-051): afronding 0–6 px, geen schaduw, een lichte rand. Dit gaat vóór de algemene huisstijlregel (12 px met schaduw). Een huisstijlcontrole meldt dit niet meer als afwijking.
40. **Opslaan is een primaire knop** (petrol vlak), in elk formulier. Annuleren blijft secundair. Dit wordt gebouwd in CK-047.
41. **Verwijderen bevestigen met `confirm()`**, met één vaste tekst: "<Soort> <naam> verwijderen? Dit kan niet ongedaan worden gemaakt." Er komt geen eigen dialoog. De teksten worden gelijkgetrokken in CK-050. Het logo krijgt de bevestiging al in CK-047.
