# Huisstijlrapport: P0e — Aparte testomgeving

Gecontroleerd: nieuw blok `src/style.css` r. 757-813, `src/main.js` (SOORT r. 14-18, footerHTML r. 286-305, M5 r. 413-421, toonTussenkaart/renderConfigFout/toonOmgevingsBalk r. 433-502, M6 r. 521-525, opstart r. 1433-1459), tegen `.claude/specs/P0e-ontwerp.md` en de tokens in `src/style.css` r. 5-54.

Kanttekening: de tokens in de code wijken af van de opdrachttekst (`--text` is #111212 en `--muted` #6F6E6E, kaarten hebben 6px radius en geen schaduw, `.btn` heeft een `--border`-rand). Dit is de bestaande HCA-huisstijl van de repo. Ik toets daarom tegen de code en het ontwerp, niet tegen de afwijkende opdrachtwaarden.

## Kleurgebruik
- ✅ Het blok gebruikt alleen tokens: `--petrol-dark`, `--on-petrol`, `--orange`, `--surface`, `--border`, `--text`, `--fs-*`. Geen nieuwe kleur, geen `rgb()`/hex behalve de twee die het ontwerp toestaat.
- ✅ Test-balk: `--petrol-dark` met `--on-petrol` (style.css r. 769-772), ook goed in donkere modus (`#2F5658`).
- ✅ Productie-lokaal: oranje vlak met donkere tekst, nooit oranje tekst op petrol of wit (r. 773-777, 780-785).
- ✅ Ontwerp en bouw komen overeen: de CSS is letterlijk het ontwerp-blok.
- Suggestie (niet blokkerend): `#111212` staat 3x hardcoded in het nieuwe blok (style.css r. 775, 776, 782). Het ontwerp staat dit toe, want het is dezelfde waarde als `.btn.primary` (r. 206). Een token `--on-orange: #111212` zou de regel "geen hardcoded kleuren" volledig naleven. Wijzig dan ook `.btn.primary`.
- Suggestie: `.inlog-kaart code` (r. 798-805) erft in `.tussen-hint` de kleur `--muted` (#6F6E6E) op `--surface`. Dat is ongeveer 4,7:1, net boven de grens. Zet `color: var(--text)` op `code` voor meer marge (relevant voor M2 en M6).
- Geen nieuwe hardcoded foutkleur: `.form-fout` (#c0392b, r. 339) blijft bestaand en is gebruikt zoals ontworpen.

## Typografie
- ✅ Alleen Barlow Semi Condensed via de bestaande `@import` (r. 1); `--font` is niet gewijzigd. Balk, hint en stappen gebruiken `--fs-label`, `--fs-toelichting` en `--fs-lopend`.
- ✅ Balk volgt het footerpatroon: uppercase, `letter-spacing .08em`, 12px (niet kleiner dan het minimum).
- Suggestie: `code` gebruikt een systeem-monospace-stack (r. 799). Dat is geen webfont en door het ontwerp bepaald, dus acceptabel. Het is wel het enige lettertype buiten Barlow. Houd het bij `<code>` en breid het niet uit.

## Componenten
- ✅ Foutpagina M1/M2 hergebruikt `.inlog-wrap` > `.inlog-kaart`, `.inlog-logo`, `.inlog-titel`, `.tussen-tekst`, `.form-label`, `.btn.inlog-knop` (main.js r. 433-487). Secundaire knop `.btn` voor "Opnieuw laden", zoals ontworpen.
- ✅ M2 heeft `.kaart-gestopt` met oranje bovenrand (style.css r. 787). Het signaal zit ook in de titel "Gestopt:", dus niet alleen in kleur.
- ✅ `role="alert"` om titel en eerste alinea (main.js r. 474); focus op de titel via `toonTussenkaart` (r. 444).
- ✅ Footer-varianten (main.js r. 292-299): live en ontwikkel ongewijzigd, label met `.omgeving-label--waarschuwing` alleen bij productie-lokaal, projecttooltip alleen bij test en productie-lokaal.
- ✅ Balk (r. 489-502): eerste kind van `<body>` via `prepend`, HMR-guard, `role="note"`, `esc(projectId)`, titelvoorvoegsel zoals ontworpen. Er verschijnt niets bij live productie of ontwikkel.
- ✅ M5-hint: `createElement` en `textContent`, geen `innerHTML` met `e.code` (r. 413-421). `role="alert"` staat op `#inlog-algemeen-fout` (r. 377).
- ✅ M6-regel (r. 521-525): alleen bij test, `uid` en `projectId` via `esc()`, gebruikt de bestaande `.tussen-hint`.
- ✅ Nieuwe componenten voegen geen eigen `border-radius` toe. De `code` en het label zijn vierkant, in lijn met de huisstijl (`.pill` en `.card` zijn ook vierkant in de repo).
- ✅ Geen nieuwe inline `style=""` in P0e-code.
- Opmerking buiten scope (bestond al): inline `style` op main.js r. 91, 334, 348, 606 (`SOORT_KLEUR`, leeg-bericht, knoprij). Niet door P0e toegevoegd.
- Opmerking buiten scope (bestond al): `.btn` heeft een `--border`-rand (r. 199), geen petrol rand. Het hover-gedrag is wel petrol. Dit volgt de bestaande HCA-stijl en is geen P0e-afwijking.

## Responsief gedrag
- ✅ Balk: geen `white-space: nowrap`, `min-height` in plaats van vaste hoogte, zijmarge 16px (r. 759). De tekst mag afbreken.
- ✅ Foutpagina erft `.inlog-kaart` (max 400px, `.inlog-wrap` padding 24px, dus meer dan 16px marge). Lange paden breken via `overflow-wrap: anywhere` (r. 804, 416).
- ✅ Footer: grid ongewijzigd, het label past in de middenkolom.
- Suggestie (laag): `body.met-omgeving-balk .inlog-wrap { min-height: calc(100vh - 28px) }` (r. 778) gaat uit van een balk van precies 28px. Breekt de balk op een smal scherm af naar twee regels (ca. 44px), dan scrolt het inlogscherm ongeveer 16px. Het ontwerp schrijft dit zo voor. Een alternatief is `.inlog-wrap { flex: 1 }` in plaats van `100vh`-berekening, omdat `body` al een flex-kolom is.
- Niet van toepassing: het kaartengrid (3 kolommen naar 1 kolom) is door P0e niet aangeraakt.

## Afwijkingen van het ontwerp
Geen. De CSS is identiek aan het ontwerp-blok. De markup en teksten komen overeen. Gemelde afwijking 1 uit het bouwverslag (M1-bestandsnaam volgt de modus, main.js r. 448) is een zinvolle uitbreiding. Hij raakt de huisstijl niet.

## Blokkerende fouten
Geen.

## Suggesties (niet blokkerend)
1. Laag: token `--on-orange` voor `#111212` (style.css r. 775, 776, 782 en bestaand 206).
2. Laag: `color: var(--text)` op `.inlog-kaart code` voor meer contrast binnen `.tussen-hint` (r. 798).
3. Laag: `.inlog-wrap`-hoogte niet koppelen aan een vaste 28px (r. 778).
4. Visueel handmatig nakijken in een browser, want het bouwverslag meldt dat dit niet getest is: balk in licht en donker, `.kaart-gestopt`, footer-label, balk op 360px breed.

## Eindoordeel
✅ Voldoet aan huisstijl. Geen blokkerende afwijkingen, drie lage suggesties en een handmatige visuele controle.
