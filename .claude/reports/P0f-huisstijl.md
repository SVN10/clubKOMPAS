# Huisstijlrapport: P0f — Eigen adressen voor live en online test

Gecontroleerd: `src/main.js` (footer r.279-298, M16/M5 r.405-448, `renderConfigFout` r.464-542, `OMGEVINGS_BALK`/`toonOmgevingsBalk` r.544-563, M6 r.582-586), `src/style.css` (P0e-blok r.760-826, ongewijzigd), `P0f-ontwerp.md`, `P0f-bouwverslag.md`. Alleen lezen, geen code gewijzigd.

## Kleurgebruik
- ✅ Geen nieuwe kleuren en geen nieuwe CSS; `style.css` is niet gewijzigd (bouwverslag klopt).
- ✅ Ontwikkel en Test gebruiken allebei `.omgeving-balk--test` (`var(--petrol-dark)` / `var(--on-petrol)`), productie-lokaal `.omgeving-balk--productie` (`var(--orange)` / `var(--on-orange)`). Conform ontwerp Scherm 1 (main.js r.545-547, r.555).
- ✅ Footerlabel productie-lokaal gebruikt `.omgeving-label--waarschuwing` (r.287); Ontwikkel en Test zijn gewone footertekst (r.288).
- ✅ Foutpagina's gebruiken `kaart-gestopt` (oranje bovenrand) via `toonTussenkaart(..., { gestopt })` (r.537); `geen-config` blijft zonder oranje rand.
- ✅ M16 (r.431-448): eerste zin erft rood van `.form-fout`, de `span`s gebruiken `.inlog-test-hint` (`var(--text)`), `code` krijgt `.inlog-kaart code`. Geen hardcoded kleuren in de nieuwe code.
- ✅ Geen nieuwe hardcoded kleurwaarden in P0f-wijzigingen.
- Opmerking (bestaand, niet P0f, geen blokkade): `style.css` r.341, 342, 457, 687 gebruiken `#c0392b` voor foutrood zonder token. Suggestie voor een later punt: token `--fout` invoeren.

## Typografie
- ✅ Geen nieuwe fonts; Barlow Semi Condensed blijft via `style.css` r.1.
- ✅ Hoofdletters in de balk komen uit CSS (`text-transform: uppercase`, r.769); de HTML bevat gewone tekst, zoals in het ontwerp.
- ✅ Tabtitels `ONTWIKKEL · clubKOMPAS`, `TEST · clubKOMPAS`, `PRODUCTIE LOKAAL · clubKOMPAS`, `Gestopt · clubKOMPAS` komen overeen met het ontwerp (r.545-547, r.539, r.562).
- Suggestie (laag): in M16 is `.form-fout` 12px (`--fs-label`) en de `.inlog-test-hint`-spans 13px (`--fs-toelichting`), dus de toelichting is groter dan de foutzin. Ontwerp schrijft dit zo voor (hergebruik P0e) en M5 heeft hetzelfde patroon; alleen noteren, niet wijzigen.

## Componenten
- ✅ Foutpagina's `test-met-productie` (online en lokaal) en `gemengde-config` (online en lokaal) volgen de opbouw van M2: `role="alert"`, focus op `#tussen-titel`, "Wat nu?" met `.config-stappen`, `.config-gerust`, knop `.btn.inlog-knop` "Opnieuw laden" (r.528-538). Teksten komen letterlijk overeen met Scherm 3.
- ✅ Link naar `clubkompas.svn10.nl` in de `test-met-productie`-hint gebruikt `.tussen-link` (r.484), conform ontwerp.
- ✅ Tak-volgorde in `renderConfigFout` volgt het ontwerp (productie-lokaal, test-met-productie online, lokaal, gemengd DEV, gemengd online, gemengd lokaal, DEV geen-config, geen-config build).
- ✅ Balk: `role="note"`, `aria-label="Omgeving"`, `data-soort` zonder CSS, `prepend`, `body.met-omgeving-balk` (r.553-561).
- ✅ Footer: `toonProject = SOORT !== 'productie'` met tooltip `Project … · Gebouwd op …` (r.285, r.292).
- ✅ M5 en M6: voorvoegsel en vet woord volgen SOORT (r.416, r.583), geen nieuwe markup of stijl.
- ✅ M16 en M5 verschijnen nooit tegelijk (`return` op r.408). M16 gebruikt `textContent`/`createElement`, geen `innerHTML` met `location.host`.
- ✅ Geen nieuwe inline `style=""` toegevoegd in P0f-code.
- Opmerking (bestaand, niet P0f): inline `style` op r.73, 84, 327, 341 (`SOORT_KLEUR`, soortkeuze, leeg-bericht, stip). Dynamisch (r.73/341) of eerder werk; geen P0f-afwijking.
- Opmerking (bestaand, niet P0f): `.card`, `.btn`, `.pill` hebben geen `border-radius: 12px` en `--text`/`--muted` wijken af van de tokenwaarden in de huisstijlregels (`#111212` vs `#1A1A2E`, `#6F6E6E` vs `#6B7B8D`). Dit is de bestaande HCA-huisstijl in de repo; P0f verandert dit niet.

## Responsief gedrag
- ✅ Geen `nowrap` op de balk; `min-height: 28px` en `line-height: 16px` laten de langste tekst (Ontwikkel, ca. 85 tekens) afbreken over twee regels (style.css r.761-770).
- ✅ Zijmarges: balk `padding: 6px 16px`, kaart-wrapper `.inlog-wrap` `padding: 24px`; minimaal 16px blijft gehaald.
- ✅ Lange hostnamen in `code` en `.tussen-tekst`/`.tussen-hint` breken via `overflow-wrap: anywhere` (r.411, 419, 817).
- Niet geverifieerd in browser (zoals het bouwverslag aangeeft): afbreken van de balk tussen 400 en 680px en de weergave van M16. Handmatig controleren door Paul.
- Kaartengrid 3 kolommen / 1 kolom onder 480px valt buiten P0f (geen wijzigingen aan de grid).

## Afwijkingen (samengevat)
| Ernst | Bevinding | Plek |
|---|---|---|
| Blokkerend | Geen | – |
| Suggestie | Foutrood `#c0392b` als token (`--fout`) invoeren | style.css r.341, 342, 457, 687 (bestaand) |
| Suggestie | Toelichting M16 (13px) groter dan foutzin (12px) | style.css r.342 vs r.823; volgt ontwerp |
| Notitie | Tekst `gemengde-config` lokaal, stap 1: eigen invulling bouwer, "Controleer in `.env.<MODE>.local` of alle zes …", consistent met de stijl van de andere stappen | main.js r.511 |

## Eindoordeel
✅ Voldoet aan huisstijl. Geen blokkerende afwijkingen; P0f voegt geen CSS, kleuren, fonts of inline stijlen toe en hergebruikt de P0e-componenten één-op-één. Alleen de handmatige browsercontrole (balk op 400-680px, M16 visueel) staat nog open.
