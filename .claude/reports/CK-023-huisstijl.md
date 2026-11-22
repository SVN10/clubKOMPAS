# Huisstijlrapport: CK-023 + CK-025 Meldingen bij opslaan

Methode: `src/style.css` volledig gelezen, `src/main.js` regels 1-1700 (helpers, Domeinen, Bestuursfuncties, Club, begin Mijn account), vergeleken met `.claude/specs/CK-023-ontwerp.md` en `.claude/reports/CK-023-bouwverslag.md`. Er is geen `git diff` gedraaid (geen shell beschikbaar) en niets in de browser getest. Er is geen code gewijzigd.

Kanttekening: de tokens in de opdracht (`--text` #1A1A2E, `--muted` #6B7B8D) wijken af van die in `src/style.css` (#111212, #6F6E6E; de HCA-huisstijl). Dit was al zo en valt buiten CK-023. De repo is als maatstaf gebruikt.

## Kleurgebruik
- ✅ Token `--fout` staat op drie plekken (`src/style.css` r.17 `:root` #c0392b, r.42 donkere media query en r.58 `:root[data-theme="dark"]`, beide #FF8A7A). Dat is conform ontwerp §4e.
- ✅ `#c0392b` staat alleen nog in `:root` (r.17). De vier vervangingen (`.form-input.fout` r.344, `.form-fout` r.345, `.btn-kaart-actie.gevaar:hover` r.460, `.btn.gevaar:hover` r.684) gebruiken `var(--fout)`.
- ✅ De nieuwe regels (r.825-853) gebruiken alleen tokens: `--petrol`, `--fout`, `--border`, `--orange`, `--muted`. Er zijn geen hardcoded kleuren toegevoegd in `src/main.js`.
- ✅ `.melding-ok` is petrol (donker: #7DB1B3) en `.melding-fout` is `--fout`. De balk links is `currentColor`, dus altijd gelijk aan de tekstkleur. Het contrast is volgens ontwerp §6 gehaald; petrol op `--surface` zit in licht precies op 4,5:1 (niet opnieuw gemeten).
- Suggestie (laag): `--fout` staat niet in de huisstijlregels van de opdracht. Het is bewust ingevoerd (rood voor fouten, donkere variant voor contrast). Neem het op in de huisstijldocumentatie als vast token.

## Typografie
- ✅ Geen nieuwe webfont, geen `font-family` toegevoegd. `.melding` erft `--font`.
- ✅ `.melding` gebruikt `--fs-toelichting` (13px), regelhoogte 19px, gewicht 600. Dit sluit aan op de tekstschaal en op `.tussen-hint`.
- ✅ De knop "Opnieuw inloggen" is een `.btn` en heeft dus de bestaande knoptypografie.

## Componenten
- ✅ `.btn` en `.btn.primary` zijn niet gewijzigd. De logoknop (`src/main.js` r.1505) is nu `<button class="btn" id="logo-kiezen">` in plaats van `<label class="btn">`. Het uiterlijk is gelijk (zelfde klasse, `src/style.css` r.683).
- ✅ Meldingen zijn geen toast of kaart: een statusregel met linkerbalk. Er is geen nieuwe `border-radius`.
- ✅ Knopstatus "Bezig...": `[aria-disabled="true"]` geeft opacity .6 en `cursor: progress` (r.847-851). De hover van `.btn`, `.btn.primary` en `.btn-kaart-actie` is teruggezet, zodat een bezige knop niet reageert. De focusring blijft, want er wordt geen `disabled` gebruikt.
- ✅ Bezige Verwijderen-knoppen in de lijsten (`.btn-kaart-actie.gevaar`, `src/main.js` r.1048 en r.1320): r.851 heeft dezelfde specificiteit als r.460 en staat later. Rand én tekst worden dus teruggezet; hier geen rode hover.
- ❌ **Laag, bevestigt afwijking 8 van het bouwverslag, maar alleen voor de Logo-Verwijderen-knop.** `#logo-verwijderen` is `.btn.gevaar` (`src/main.js` r.1508). Tijdens "Bezig..." zet r.849 (`.btn[aria-disabled="true"]:hover`) alleen `border-color` terug. `.btn.gevaar:hover` (r.684) kleurt de tekst nog steeds rood (`--fout`) en heeft dezelfde specificiteit als r.849. De knop lijkt dan nog actief op hover.
  Correctie in `src/style.css`, na r.849: `.btn.gevaar[aria-disabled="true"]:hover { color: var(--petrol); }` (de rand wordt al door r.849 teruggezet). Niet blokkerend: alleen zichtbaar bij hoveren tijdens ongeveer 1 seconde opslaan.
- ❌ **Laag, mogelijk (niet in de browser getest): extra witruimte door lege `.meldingen`.** Bij `meldingenHTML(okId, foutId)` (ok en fout) staan twee lege `.melding`-kinderen in een flex-kolom met `gap: 8px` (`src/style.css` r.826). Twee lege blokken met een gap ertussen geven 8px hoogte. De negatieve `margin-top` (r.828) heft dat niet op. Gevolg: 8px extra ruimte (24 in plaats van 16px) onder de melding in Domeinen, Bestuursfuncties, Clubprofiel, Clublogo en de drie Mijn-account-blokken. Als er één melding tekst heeft, staat er ook 8px lege ruimte onder. Alleen-fout-blokken (`structuur-form-fout` e.d.) hebben dit niet. Mogelijke correctie zonder `display:none` (de live regions moeten in de toegankelijkheidsboom blijven): `.meldingen { display: block; }` en `.melding:not(:empty) + .melding:not(:empty), .melding + .melding:not(:empty) { margin-top: 8px }`, of `.melding:empty { margin-block: -4px; }`. Eerst in de browser nameten (DevTools, hoogte van `.meldingen`).
- Suggestie (laag): inline `style=""` blijft op de nieuwe regel r.1504 (`margin-top:12px` op `.form-rij` bij het logo). Het ontwerp schreef dat letterlijk voor, en `style="margin-top:0"` (r.963, r.1268) en `style="width:100%"` (r.1181, r.1413) stonden er al. Regel "geen inline style" is hier dus niet nieuw overtreden, maar de nieuwe regel hoort eigenlijk in een klasse, bijvoorbeeld `.logo-upload-wrap .form-rij { margin-top: 12px }`.
- Suggestie (zeer laag): de comment bij r.682 noemt nog `<label class="btn">`. Het label bestaat niet meer.
- `.pill`, `.card`, `.sectie-kop`: niet gewijzigd en niet beoordeeld op nieuwe afwijkingen. De bestaande vierkante hoeken (geen 12px radius) wijken af van de opdrachttekst, maar zijn de HCA-stijl en niet door CK-023 veranderd.

## Responsief gedrag
- ✅ `.melding` is een blokelement met `overflow-wrap: anywhere`. Lange namen en e-mailadressen lopen door, geen horizontaal scrollen. Er zijn geen vaste breedtes of extra marges; de 16px zijmarge van `.wrap` blijft gelden.
- ✅ `.melding-actie` ("Opnieuw inloggen") staat op een eigen regel (`display:flex; width: fit-content`).
- ✅ Onder 700px blijft `.form-rij` gestapeld (r.539); de statusregel komt dan onder de laatste knop. De logoknoppen stapelen mee.
- ✅ Kaartengrid is niet aangeraakt. (De bestaande dashboardgrid gaat naar 1 kolom bij 600px, niet bij 480px. Dit was al zo en is niet door CK-023 veroorzaakt.)

## Samenvatting afwijkingen
| # | Ernst | Wat | Plek |
|---|---|---|---|
| 1 | Laag | Logo-Verwijderen (`.btn.gevaar`) toont tijdens "Bezig..." op hover nog rode tekst | `src/style.css` r.684 en r.849 |
| 2 | Laag (nog te verifiëren) | Lege `.meldingen` met ok + fout geeft 8px extra ruimte | `src/style.css` r.826-828 |
| 3 | Suggestie | Inline `margin-top:12px` op de nieuwe logo-`.form-rij` naar een klasse | `src/main.js` r.1504 |
| 4 | Suggestie | `--fout` als vast token in de huisstijldocumentatie opnemen; verouderde comment | `src/style.css` r.682 |

Blokkerende fouten: geen.

## Eindoordeel
✅ Voldoet aan huisstijl, met twee kleine afwijkingen (laag, niet blokkerend, zie boven). Geen hardcoded kleuren, geen nieuwe fonts of border-radius, tokens correct. Aanbevolen vóór oplevering: afwijking 2 in de browser nameten, en afwijking 1 met één regel CSS oplossen.
