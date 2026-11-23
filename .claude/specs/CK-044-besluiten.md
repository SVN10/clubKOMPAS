# CK-044 — Besluiten navigatie (22 november 2026)

Besluiten van Paul na schetsen, invoer voor de intake. Story staat in `.claude/backlog.md`.

**Laag:** Platform (app-shell, generiek voor elke club) · **MoSCoW:** Should

## Besluiten

1. **Eén navigatie: het zijmenu op elke pagina, ook Home.**
   - Inklapbaar tot 44px (alleen pictogrammen).
   - Stand onthouden zoals nu: localStorage-sleutel `zijmenu-ingeklapt`.
2. **Groepen met kopje:**
   - **Overzicht:** Home; later Vermogens, Activiteiten, Seizoensplanner, Documenten — tonen pas als ze gebouwd zijn.
   - **Beheer:** Domeinen, Bestuursfuncties, Club; later alleen zichtbaar voor beheerders (P0d).
3. **Onderaan het zijmenu:** "naam · rol" → Mijn account, en **Uitloggen**.
   - De footer houdt alleen omgeving en versie (midden, met bouwdatum als tooltip zoals in CK-036) en de rest zoals passend; naam · rol verhuist uit de footer.
4. **De witte titelbalk vervalt.**
   - De **petrol balk met oranje onderrand blijft** en bevat het kompas + "club**KOMPAS** · Hockey Club Alphen" in wit, ca. 22px.
   - De 30px-uitzondering voor de titelbalk uit CK-031 wordt hiermee herzien.
   - De oude menu-items in de petrol balk (huisje, Beheer) vervallen.
5. **Clublogo blijft zoals nu:** 78px rechtsboven, half over de petrol balk en half over de witte pagina (absolute positie).
   - Titel, kruimelpad en eerste inhoud houden rechts/boven ruimte vrij.
   - Op mobiel kleiner en binnen de balk.
6. **Kruimelpad blijft** (Home › Beheer › Domeinen; Home › Mijn account).
7. **Mobiel:** menuknop (☰) in de petrol balk opent het zijmenu als uitschuifpaneel (vervangt de horizontale rij uit CK-037).
8. **CK-037 teruggedraaid:** "Home zonder zijmenu, volle breedte" vervalt; het huisje verhuist naar het zijmenu (groep Overzicht).
9. **Omgevingsbalk (P0e/P0f) blijft boven alles.**

## Aandachtspunten voor de intake

- **Bestaande layout-klassen:** `.top-bar`, `.top-nav`, `.app-lijf`, `.zijmenu`, `.kruimelpad`. Eerst inventariseren waar ze gebruikt worden; wat vervalt echt opruimen (geen dode CSS).
- **Toegankelijkheid uitschuifpaneel:** `aria-expanded` en `aria-controls` op de ☰-knop; focus naar het paneel bij openen en terug naar de knop bij sluiten; sluiten met Esc en klik op de achtergrond; inhoud achter het paneel niet bereikbaar met Tab. Ingeklapt menu: naam voor schermlezers en tooltip per pictogram (zoals het huisje nu).
- **Clublogo en ruimte:** controleren bij ca. 400px, 768px en desktop, met menu in- en uitgeklapt.
- **Meldingen CK-023/CK-025** moeten na de ombouw op dezelfde plek blijven verschijnen.
- **P0d voorbereiden:** groep Beheer als aparte eenheid opbouwen, zodat verbergen voor niet-beheerders later één voorwaarde is.
- **Raakvlak CK-020/CK-021:** besluit 4 van CK-020 ("Vermogens als eigen hoofdmenu-item: Home · Vermogens · Beheer") wordt met CK-044: Vermogens als item in de groep **Overzicht** van het zijmenu. Bij de intake van CK-021 zo meenemen.
