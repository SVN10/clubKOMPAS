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
