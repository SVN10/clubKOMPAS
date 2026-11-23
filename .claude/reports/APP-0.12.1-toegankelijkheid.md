# Toegankelijkheid clubKOMPAS v0.12.1 (WCAG 2.1 AA)

Branch `test`. Analyse op de code: geen browser en geen schermlezer gebruikt. Contrastwaarden zijn berekend.

## Oordeel

**Kleine tekortkomingen, maar met drie punten die voor AA terug moeten.**
De basis is sterk: `lang="nl"`, een skip-link, `<nav>` en `<main>`, labels bij alle velden, `aria-invalid` en `aria-describedby` bij veldfouten, live-regions die al in de pagina staan, een goede focusring (oranje met donkere binnenlijn), focus die na toevoegen, opslaan, verwijderen en annuleren op een logische plek terechtkomt, en `prefers-reduced-motion`. Het zijmenu en het mobiele paneel werken met het toetsenbord.

Aantallen: kritiek 0, hoog 3, middel 7, laag 9.

## Bekend open punt (nog niet gedaan)
- De 9 blokken `.sectie` zijn nog `<div>` en geen `<section aria-labelledby>`: `src/main.js:974, 996, 1434, 1859, 2329, 2721, 2971, 3000, 3102`. Alleen de twee groepen in Vermogens beheer zijn al `<section>` (`main.js:1957, 1968`).
- Er is nog geen `h1` op de beheerpagina's (Domeinen, Vermogens, Commissies, Projecten, Samenwerkingen, Bestuursfuncties, Club, Mijn account). Daar begint de pagina met een `h2`. Home, Domeinenoverzicht, Vermogensoverzicht en de inlogpagina hebben wel een `h1`.
Beide staan hieronder bij middel (M1, M2).

## Contrastberekening (verhouding)

| Combinatie | Licht | Donker | Oordeel |
|---|---|---|---|
| petrol op wit / op `--surface` | 4,90 / 4,51 | 6,23 (kaart) | Voldoet; op surface maar net |
| `--muted` op wit / surface | 5,08 / 4,67 | 6,64 / 7,45 | Voldoet |
| `--fout` op wit / surface | 5,44 / 5,00 | 6,48 | Voldoet |
| Wit op petrol-vlak (balk, footer, sectiekop) | 4,90 | 8,10 | Voldoet |
| Zwart op oranje (primaire knop, skip-link) | 9,07 | 9,56 | Voldoet |
| **`.toel` (wit, `opacity .85`) op petrol-vlak** | **4,05** | 6,41 | **Faalt in licht** |
| Focusring oranje alleen, op wit | 2,07 | 9,56 | Alleen oranje is te weinig; met de binnenlijn `--text` (18,8) is de ring goed |
| **Rand van invoervelden `--border` op wit** | **1,48** | **1,44 tot 1,76** | **Faalt (UI 3:1)** |
| Uitgeschakelde `.btn-volgorde` (opacity .35) | 1,6 | - | Vrijgesteld (uitgeschakeld) |
| Bezige knop (`aria-disabled`, opacity .6) | 2,35 | - | Zie L7 |
| Primaire knop in bezige stand | 5,03 | - | Voldoet |

Kleur is nergens de enige informatiedrager: pills, status en soort hebben altijd tekst. De gestippelde rand bij "in voorbereiding" komt boven op de tekst.

## Hoog

**H1. Veldfouten op het inlogscherm worden niet aangekondigd**
- WCAG 3.3.1 Foutidentificatie, 4.1.3 Statusberichten, 1.3.1.
- `src/main.js:667-690`. "Verplicht veld" gaat alleen als tekst in een gewone `<span class="form-fout">`. Er is geen `aria-invalid` en geen `aria-describedby`, de tekst is geen live-region en de focus gaat niet naar het veld. Een schermlezergebruiker die op Inloggen drukt, hoort niets. Alleen de algemene fout (`role="alert"`) wordt wel voorgelezen.
- Voorstel: gebruik `zetVeldFout('inlog-email', 'inlog-email-fout', 'Verplicht veld')` (bestaat al, `main.js:430`). Herstel ook de focus op de knop na "Bezig..." (de knop wordt `disabled` en verliest de focus).

**H2. Datumkiezer: focus raakt kwijt bij een niet-kiesbare dag**
- WCAG 2.1.1 Toetsenbord, 2.4.3 Focusvolgorde.
- `src/keuzelijst.js:226-232` (`focusOp`) en `:183` (`disabled` bij `magNiet`).
- Pijltjestoets naar een dag vóór de `min` (de einddatum kan niet voor de begindatum liggen): `teken()` bouwt de hele kalender opnieuw op, daardoor verdwijnt het element met de focus. `.focus()` op een uitgeschakelde knop doet niets. De focus staat dan op `<body>`, en Escape werkt niet meer omdat de keydown-luisteraar op de kalender staat.
- Voorstel: laat niet-kiesbare dagen focusbaar met `aria-disabled="true"` in plaats van `disabled` (en negeer de klik), of begrens de pijltjes tot `min`/`max`.

**H3. Randen van invoervelden hebben te weinig contrast**
- WCAG 1.4.11 Contrast van niet-tekstuele elementen.
- `src/style.css:3` (`--border: #C9D7D7`) en `:294-301` (`.form-input`, 1,5 px). Verhouding 1,48:1 op wit en op de lichte sectiekleur, donker 1,44:1 op de kaart. Een tekstveld, de eigen keuzelijst (`.eigen-knop`) en het datumveld zijn dus moeilijk te herkennen. Dit geldt overal in de app. De rand van knoppen (`.btn`) hoeft niet, want de tekst maakt ze herkenbaar.
- Voorstel: een eigen token `--veld-rand` van minstens 3:1 (licht bijvoorbeeld `#767676` of `#6B8486`; donker bijvoorbeeld `#7A9396`). Gebruik die alleen voor velden, keuzeknop en datumknop.

## Middel

**M1. Geen `region`-landmarks (bekend punt)**: `main.js` regels hierboven. WCAG 1.3.1 en 2.4.1. Voorstel: `<section class="sectie" aria-labelledby="...">` met een `id` op de `h2`.

**M2. Geen `h1` op beheerpagina's (bekend punt)**: bijvoorbeeld `main.js:1436, 1861, 2331, 2723, 2973, 3104` (alle `h2`). WCAG 1.3.1, 2.4.6. Na een paginawissel gaat de focus naar `<main>` (`main.js:1250`), dus de lezer hoort niet op welke pagina hij is. Voorstel: een `h1` per pagina (de kruimel kan visueel blijven) en de focus daarheen laten gaan, of `aria-label` op `main`.

**M3. Contrast van `.toel` in licht thema**: `src/style.css:152-156`, gebruikt in `main.js:999`. 4,05:1 voor 14 px cursief. Voorstel: haal `opacity: .85` weg (wit geeft 4,90:1).

**M4. Rode foutrand ontbreekt bij de eigen keuzelijst en datumkiezer**
- WCAG 1.4.1 en 3.3.1 (de tekst en `aria-invalid` zijn er wel, dus het is een zichtbaarheidsprobleem).
- `src/keuzelijst.js:50-58` kopieert alleen `aria-describedby`, `aria-invalid` en `disabled`. De klasse `fout` die `zetVeldFout` (`main.js:435`) op het verborgen `select` of de datuminvoer zet, komt niet op `.eigen-knop` of `.eigen-datum-tekst`. De velden Eigenaar, Domein, Status en de datums tonen dus geen rode rand.
- Voorstel: laat `volgAttributen` ook de klasse `fout` overnemen (MutationObserver op `class`).

**M5. Reflow en vaste paginahoogte (320 px, 400% zoom)**
- WCAG 1.4.10 Reflow.
- `src/style.css:781-785` en `:653` (`.top-bar` vast 80 px, `body` `height: 100dvh; overflow: hidden`). Op 1280x1024 bij 400% (viewport 320x256) blijven kopbalk (80 px) en een footer in kolomstand (ongeveer 70 px) staan. Voor de inhoud blijft ongeveer 100 px over. De tabellen en formulieren zelf klappen wel netjes om (container queries, 44 px-knoppen).
- Voorstel: laat onder bijvoorbeeld `max-height: 500px` de kopbalk en footer meescrollen (`position: static`, `overflow: visible`).

**M6. Kolomkoppen verdwijnen bij smalle tabel**
- WCAG 1.3.1.
- `src/style.css:1063-1078, 1092-1130`. Bij een smalle lijst staat `display: none` op de kopregel. De kolomkoppen verdwijnen dan ook voor de schermlezer, terwijl de cellen `role="cell"` houden. Alleen Projecten en Samenwerkingen hebben `cel-label` voor "Eigenaar:". Domeinen, Functies en Vermogens niet.
- Voorstel: maak de kop `sr-only` in plaats van `display: none`, of zet verborgen labels in de cellen.

**M7. Bewerkrij van Domeinen heeft geen `role="cell"`**
- WCAG 1.3.1 en 4.1.2.
- `src/main.js:1727`. De `div.pijler-bewerk-form` staat direct in `role="row"`. Bij Vermogens (`:2073`) en Onderdelen (`:2533`) staat `role="cell"` er wel. Voorstel: dezelfde `role="cell"` toevoegen.

## Laag

- **L1. Placeholder-kleur niet vastgelegd** (`style.css:294`, geen `::placeholder`). De browser kiest de kleur; in donker thema kan dat onder 4,5:1 vallen. Voorstel: `.form-input::placeholder { color: var(--muted); opacity: 1 }`. Dit is een 1.4.3-risico.
- **L2. Datumformaat alleen als placeholder** (`keuzelijst.js:209`). "dd-mm-jjjj" verdwijnt zodra je typt. WCAG 3.3.2. Voorstel: zet het formaat in een verborgen `aria-describedby`-tekst of in het label.
- **L3. Groepskoppen in de keuzelijst zijn `role="presentation"`** (`keuzelijst.js:110`). De optgroep-naam wordt niet voorgelezen. Voorstel: `role="group"` met `aria-labelledby`.
- **L4. Keuzelijst is een knop met listbox, geen `role="combobox"`**. Het toetsenbord werkt: pijltjes, Home, End, PageUp/Down, typen om te zoeken, Enter, Spatie, Escape en Tab. `aria-activedescendant`, `aria-selected`, `aria-expanded` en `aria-controls` kloppen. Op de gesloten knop doen letters en pijl niets (alleen openen). Acceptabel; het select-only-combobox-patroon van de APG is de voorkeursvorm.
- **L5. `aria-live` op de maandtitel van de kalender** (`keuzelijst.js:197`) wordt bij elke `teken()` vervangen, dus niet betrouwbaar aangekondigd. Ook: "vandaag" is alleen een lichte rand (1,48:1) en alleen visueel. Voorstel: een vaste live-region buiten het opnieuw getekende deel; `aria-current="date"` op vandaag.
- **L6. Vaste hoogtes en afkapping bij tekstafstand/zoom** (WCAG 1.4.12): `.zijmenu-item { height: 44px }` (`style.css:~790`), `input/select height: 38px`, `.kaart-omschrijving` met `-webkit-line-clamp: 3` (`:524-530`), titel in kopbalk met `ellipsis` (`:660-663`). Lange tekst kan wegvallen. Voorstel: `min-height` in plaats van `height`.
- **L7. Bezige knop** (`style.css:935`, `opacity .6`, 2,35:1 voor de tekst). Kort zichtbaar en `aria-disabled`; strikt gezien vrijgesteld. Voorstel: `.btn-kaart-actie`/`.btn` niet dimmen, maar een tekst "Bezig..." tonen.
- **L8. Kleine punten**: `<div class="cijfers" aria-label="Kerncijfers">` (`main.js:967, 1123`) heeft geen rol, dus het label wordt genegeerd (gebruik `role="group"` of `<section>`). `menu-knop` verandert alleen `aria-expanded`, niet de naam (goed), maar de naam "Menu openen" blijft staan bij open (liever "Menu"). Versienummer in footer staat alleen in `title`. Wachtwoordplaceholder "••••••••" is overbodig. Kalender (288 px) kan op 320 px een paar px buiten beeld komen (`style.css:1263`).
- **L9. Focus in gewone tekstvelden is minimaal**: `.form-input:focus { outline: none }` (`style.css:302`) met alleen een rand die petrol wordt (4,9:1). Voldoet, maar wijkt af van de rest van de app (oranje ring met donkere lijn). Voorstel: dezelfde `:focus-visible`-ring als bij `.eigen-knop`.

## Wat goed is (geen actie)
- `lang="nl"`, `title` per pagina, skip-link met focus naar `#inhoud`, meta viewport zonder zoombeperking.
- Zijmenu: `<nav aria-label>`, `aria-current="page"`, doelen van 44 px, tooltip met Escape (1.4.13), ingeklapt blijven de namen beschikbaar. Mobiel paneel: `inert` op de rest, Escape, focus terug naar de menuknop, `visibility: hidden` als het dicht is.
- Rijknoppen hebben `aria-label` met de naam van het item; de tooltip is `aria-hidden`; zichtbaar label zit in de toegankelijke naam (2.5.3). Doelgrootte 32x28 op desktop (≥24 px) en 44x44 op mobiel.
- Bevestigingen zijn het ingebouwde `confirm()`: toetsenbordbaar. Focus na verwijderen gaat naar de buur of een terugvalplek; na opslaan naar "Toevoegen"; na annuleren naar het potlood.
- `role="status"` en `role="alert"` staan leeg in de pagina; `zetStatus` leegt eerst en vult na 100 ms. De ↑/↓-knoppen melden de nieuwe plaats.
- `prefers-reduced-motion` voor de kompaspuls en het paneel. Alleen de chevron-animatie van 0,15 s mist het, zonder gevolg.

## Voorstel: wat eerst

1. **H3** rand van velden (één token, grootste winst in heel de app, 15 minuten).
2. **H1** foutmeldingen op het inlogscherm (klein, bestaande functie hergebruiken).
3. **H2** focus in de kalender (gebruik `aria-disabled` of begrens de pijltjes).
4. **M1 + M2** `section` en `h1` samen (één ronde door `main.js`), met de focus na paginawissel op de `h1`.
5. **M3** `opacity` van `.toel` weg; **M4** klasse `fout` doorgeven; **M7** `role="cell"`.
6. Daarna M5, M6 en de lage punten, of in de volgende feature meenemen.
