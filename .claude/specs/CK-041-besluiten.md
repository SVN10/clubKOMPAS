# CK-041 — Besluiten commissies (23 november 2026)

Paul (PO) heeft deze keuzes gemaakt op 23 november 2026. Voorbeeld: CK-046 (Samenwerkingen), zie `.claude/specs/CK-046-besluiten.md` en `.claude/docs/CK-046.md`.

## Nummer en grootte
1. Het nummer **CK-041** was nog vrij in de backlog.
2. Route **groot, maar ingekort**. Er komen een nieuwe collectie en nieuwe Firestore-regels. Het scherm bestaat al (Samenwerkingen), daarom vallen de intake, het ontwerp en het prototype weg. De hoofdsessie bouwt zelf, met regeltests. Daarna volgen een beveiligingscontrole (sterkste model), één gecombineerde controle (test, huisstijl, toegankelijkheid), één doc en een testlijst voor tst.

## Wat het wordt
3. Er komt een beheerpagina **Commissies** in het zijmenu onder Beheer, **direct na Bestuursfuncties**. De volgorde wordt: Club, Bestuursfuncties, Commissies, Domeinen, Vermogens, Projecten, Samenwerkingen.
4. De velden zijn net als bij een samenwerking: **naam**, **omschrijving** en **eigenaar**. De eigenaar is een bestuursfunctie uit de lijst en is niet verplicht. Er is geen status en geen periode.
5. Er is **geen koppeling** aan domeinen of vermogens. Het vermogen "Kascommissie" bij Financiën blijft los bestaan.
6. Er komen **geen personen of leden** in, dus ook geen persoonsgegevens en geen compliance-ronde. P0d blijft open, met hetzelfde restrisico als bij CK-046.
7. Commissies zijn **alleen zichtbaar in Beheer**. Ze staan niet op het Vermogensoverzicht, niet op het Domeinenoverzicht en niet in de kerncijfers.

## Wat mee-verandert
8. **Bestuursfuncties:** de kolom "Eindverantwoordelijk voor" en de verwijderblokkade tellen ook commissies, net als projecten en samenwerkingen.
9. Huisregels voor beheertabellen: CK-046, besluiten 19–38. Naam uniek binnen de lijst (hoofdletters tellen niet), ↑/↓ voor de volgorde, rijnummers altijd zichtbaar.
