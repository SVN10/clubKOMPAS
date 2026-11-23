# CK-020 / CK-021 — Besluiten vermogens (22 november 2026)

Paul heeft het PO-advies van 22 november 2026 overgenomen. Volgorde: **eerst de aparte testomgeving (P0e)**, daarna CK-023 (+ CK-025), daarna de vermogens.

## Nummering
- CK-020 Vermogens beheren (Beheer → Vermogens)
- CK-021 Vermogensoverzicht, "de plaat" (eigen hoofdmenu-item Vermogens)
- CK-038 Status "in voorbereiding" (later)
- CK-039 Onderliggende vermogens (later)
- Nog recht te zetten: CK-030 t/m CK-033 hebben in de backlog-artifact een andere betekenis dan in de repo.

## Besluiten (advies PO overgenomen)
1. Vermogensnaam is uniek binnen de club (2–100 tekens).
2. Geen status "in voorbereiding" in de eerste versie (wordt CK-038).
3. Projecten en Samenwerkingen krijgen geen vermogens; later een eigen begrip.
4. De plaat wordt een eigen menu-item. Sinds CK-044 (zijmenu op elke pagina): **Vermogens** in de zijmenugroep "Overzicht", onder Home.
5. Nog geen omschrijving per vermogen.
6. De 58 namen uit `CK-020-bron-vermogensoverzicht.md` worden vóór de import kort met Paul gecontroleerd.
   - 23 november 2026: **Kledingpartnerschap** (Relaties) en **Kledingbeheer** (Materiaal) blijven allebei bestaan.
   - 23 november 2026: **Onderhoud** en **Beveiliging** (Accommodatie) heten bij de import **Parkonderhoud** en **Parkbeveiliging**.
   - 23 november 2026: **Evenementen** blijft bij Hospitality.
   - Namencontrole afgerond: 58 vermogens (de bron telde ten onrechte 63; gecontroleerd tegen het HCA-overzicht v1.4), verder ongewijzigd ten opzichte van de bronlijst.

## MVP (samenvatting PO-voorstel)
- Datamodel `clubs/{clubId}/vermogens/{id}`: `naam`, `domeinId`, `volgorde`.
- Alleen bij domeinen van het type `pijler` of `domein` (ondersteunend), ook afgedwongen in de regels.
- Domein met vermogens niet verwijderen en niet naar overkoepelend wijzigen.
- Home: vierde kerncijfer "Vermogens" en "n vermogens" per domeinkaart.
- Import `scripts/inrichten-vermogens-hca.mjs` (--droog, writeBatch, idempotent, domein op naam/hashtag).
- Eerst testen in de testomgeving (P0e), niet op 26 november 2026.

## Besluiten na de intake (23 november 2026, advies overgenomen)
Spec: `.claude/specs/CK-020-vermogens-beheren.md`.
7. Unieke naam én de guard op domeinen met vermogens worden door de **Firestore-regels** afgedwongen (naamdocument `vermogensnamen/{sleutel}`, teller `aantalVermogens` op het domein, transacties), niet alleen door de app. Restrisico (console, leden mogen alles wat de regels toestaan) hoort bij P0d.
8. Vermogens beheren in een eigen tabblad **Beheer → Vermogens** (menu-id `vermogensbeheer`; `vermogens` blijft vrij voor CK-021).
9. Domeinkaart zonder vermogens toont **"Nog geen vermogens"**.
10. Uitrol: regels test → testen en importeren in test → regels productie → app en import live. Niet op 26 november 2026.
11. Agents mogen de regels lokaal testen met de **Firestore-emulator** (`@firebase/rules-unit-testing`, geen login, geen echte database). Java installeert Paul zelf.
12. Vermogensnamen: alleen letters (incl. Latin-1-accenten), cijfers, spatie en `& ' - . , ( ) +`.

## Besluiten na de gebruikersreis (23 november 2026)
Gebruikersreis: `.claude/specs/CK-020-gebruikersreis.md`.
13. De knop **+ Toevoegen** staat bovenaan, naast het filter, bij **Vermogens én bij Domeinen en Bestuursfuncties** (Paul: alles hetzelfde). Dit hoort bij de scope van CK-020.
14. Hernoemen én verplaatsen: de app controleert eerst of de nieuwe naam al bestaat, vóórdat er iets verplaatst wordt (bijstelling 1).
15. Domein met vermogens verwijderen of overkoepelend maken: geen "Weet je het zeker?", maar meteen een melding met de knop "Naar de vermogens van X".
16. Link "n vermogens" in de domeinenlijst alleen als de rij op 760px lijstbreedte nog past; anders vervalt hij.
17. Het beheeritem Vermogens krijgt nu een eigen pictogram; de naam "Vermogens beheren" pas bij CK-021.

## Bijstelling Paul na het prototype (23 november 2026)
Prototype: https://claude.ai/artifact/Eheb3a9Svkq87B1oqan3Lc
18. De manier van filteren (keuzelijst links in de balk, + Toevoegen rechts) geldt op **alle beheerpagina's**. Domeinen: keuzelijst op soort (vervangt de filterknoppen Alles/Pijlers/Ondersteunend/Overkoepelend). Bestuursfuncties: dezelfde balk; een filter alleen als er iets zinnigs te filteren valt (ontwerper adviseert).
19. **Bewerken** en **Verwijderen** worden knoppen met een pictogram in plaats van tekst, op alle beheerpagina's (met toegankelijke naam en tooltip).
20. De introtekst "Wat moet de club kunnen? Per pijler en ondersteunend domein de vermogens, in de volgorde van de plaat." vervalt.
21. Open vragen uit het ontwerp (advies overgenomen, 23 november 2026): knopteksten "+ Vermogen / Domein / Bestuursfunctie toevoegen"; geen vaste hulptekst over tekens (de veldfout legt het uit); sectiemelding naar boven, ook bij Domeinen en Bestuursfuncties; Bestuursfuncties zonder filter (alleen de knop, filter pas boven ~15 functies); ↑/↓ blijven pijltekens met dezelfde hoogte.
22. Na de bouw (23 november 2026): de bronlijst telde ten onrechte 63; het HCA-overzicht v1.4 bevat **58 vermogens** (13 bij de pijlers, 45 bij de ondersteunende domeinen). De import zet er 58 neer.
