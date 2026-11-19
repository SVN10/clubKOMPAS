# Huisstijlrapport: P0c — Club loskoppelen van gebruiker (tussenschermen)

Beoordeeld: `src/main.js` r. 7-14, 107-117, 283-365, 968-987 en `src/style.css` r. 410-455, naast `.claude/specs/P0c-ontwerp.md` (incl. Besluiten PO) en de bestaande huisstijl (inlogscherm r. 358-408 in style.css, tokens r. 5-46). Er is geen code aangepast.

Ernst: BLOKKEREND = moet vóór oplevering opgelost; SUGGESTIE = optioneel; BESTAAND = al aanwezig vóór P0c, buiten scope.

## Kleurgebruik
- ✅ Nieuwe CSS (style.css r. 410-455) gebruikt uitsluitend tokens: `--text`, `--muted`, `--petrol`. Geen hex/rgb-waarden toegevoegd. Donkere modus werkt daardoor vanzelf.
- ✅ Contrast: `--petrol` op `--card` (link) en `--muted` op `--card` (hint, laadtitel) voldoen in licht en donker aan 4,5:1.
- ✅ Geen inline `style=""` in de nieuwe functies (main.js r. 283-365).
- BESTAAND: `.btn.primary { color: #111212 }` (style.css r. 215) en `#c0392b` (r. 354, 355, 470) zijn hardcoded; niet door P0c ingevoerd.
- BESTAAND: tokenwaarden in `:root` (`--text: #111212`, `--muted: #6F6E6E`) wijken af van de opgegeven huisstijlwaarden (`#1A1A2E`, `#6B7B8D`). Bewuste keuze van de codebase of afwijking? Buiten P0c, wel aan PO voor te leggen.

## Typografie
- ✅ Geen nieuwe fonts of `@import`; alle tekst erft `var(--font)` (Barlow Semi Condensed).
- ✅ Gewichten 400 (laadtitel) en 700 (titel, strong, link) zijn de geladen gewichten (r. 1).
- ✅ Groottes volgen het ontwerp: laadtitel 18px/400/muted, tekst 15px/23px, hint 13px/19px.
- BESTAAND / SUGGESTIE: `.btn` gebruikt weight 500 en andere plekken 600; Google Fonts-import (r. 1) laadt 400/600/700, dus 500 valt terug. Geldt ook voor de nieuwe knoppen "Opnieuw proberen"/"Uitloggen". Optioneel 500 toevoegen aan de import.

## Componenten
- ✅ Alle drie de kaarten zijn `.inlog-wrap` > `.inlog-kaart` met `.inlog-logo` (icoon + club**KOMPAS**), identiek aan `renderInlogscherm` (main.js r. 217-225 vs 283-293). Geen top-bar, nav of footer.
- ✅ Eén `h1.inlog-titel#tussen-titel[tabindex=-1]` per kaart; focus programmatisch (r. 294); focusring op h1 uit (style.css r. 411), conform ontwerp.
- ✅ Knoppen: "Uitloggen" op geen-club-kaart is `.btn.primary.inlog-knop` (oranje, volle breedte, zelfde als "Inloggen"). Foutkaart: "Opnieuw proberen" `.btn.primary`, "Uitloggen" `.btn`, in bestaande `.form-rij`. Klopt met ontwerp en bestaande knopstijlen.
- ✅ Teksten exact conform ontwerp (titels, alinea's, hint A/B, "Bezig..."); geen foutcodes in beeld; geen lege `<strong>` of lege link bij `SUPPORT_EMAIL = ''`.
- ✅ Besluiten PO verwerkt: foutkaart blijft staan met "Bezig..." op de knop (r. 331-341); hint-zin zonder adres is de volledige zin (r. 346); foutkaart-onderwerp "Storing clubKOMPAS" (r. 345), geen-club-kaart "Toegang clubKOMPAS" (default r. 109).
- ✅ `.tussen-link` (petrol, vet, onderstreept, zichtbare `:focus-visible`), `.tussen-hint` (leeg = geen extra gap), `#fout-hint` altijd aanwezig met `role="status"`: conform.
- ✅ Laadstaat: rustige opacity-puls, uitgeschakeld bij `prefers-reduced-motion` (r. 448-455). Geen spinner.
- ✅ CSS-blok staat direct na het inlogblok en is inhoudelijk identiek aan het ontwerp; bestaande stijlen ongewijzigd.
- BESTAAND: `.inlog-kaart` heeft `border-radius: 6px` en `.card` heeft geen radius, terwijl de huisstijlregel 12px voorschrijft. P0c volgt terecht het bestaande inlogscherm; niet aanpassen binnen deze opdracht.
- BESTAAND: `.btn` (secundair) heeft `border: 1px solid var(--border)` i.p.v. petrol rand; de "Uitloggen"-knop op de foutkaart erft dat.
- SUGGESTIE (laag): de hint op de foutkaart verschijnt pas na poging 2 en laat de verticaal gecentreerde kaart ~40px groeien (layout-sprong). Optioneel ruimte reserveren (bijv. `min-height` op `.tussen-hint`), maar dat zou de `:empty`-regel uit het ontwerp tegenspreken; alleen doen na akkoord PO/ontwerper.

## Responsief gedrag
- ✅ `.inlog-wrap` padding 24px (>= 16px zijmarge), kaart `width:100%; max-width:400px`; geen aanpassing nodig op 320-400px.
- ✅ Foutkaart: onder 700px staat `.form-rij` in kolom (r. 566), knoppen op volle kaartbreedte, "Opnieuw proberen" bovenaan; daarboven naast elkaar.
- ✅ `overflow-wrap: anywhere` op `.tussen-tekst` en `.tussen-hint`: lange e-mailadressen breken af.
- N.v.t.: kaarten-grid (3 kolommen / 1 kolom onder 480px) komt op deze schermen niet voor.

## Eindoordeel
✅ Voldoet aan huisstijl en ontwerp. Geen blokkerende afwijkingen gevonden in de P0c-code. Alleen bestaande afwijkingen (hardcoded `#111212`/`#c0392b`, tokenwaarden vs. opgegeven huisstijlwaarden, radius 6px vs. 12px, secundaire knoprand) en twee lage suggesties (fontgewicht 500, layoutsprong hint) vermeld; geen daarvan hoeft voor P0c.
