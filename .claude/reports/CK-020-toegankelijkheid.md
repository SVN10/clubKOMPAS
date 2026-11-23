# Toegankelijkheidsrapport: CK-020 Vermogens beheren

Fase 5e, 23 november 2026. Statische analyse van `git diff src/main.js src/style.css`, `src/vermogens.js` (alleen modellaag), ontwerp, gebruikersreis, besluiten 18-21 en bouwverslag. Contrast berekend (WCAG-formule). **Niet** in een browser of met een schermlezer getest (ook de bouwer heeft de UI niet geklikt). Regelnummers verwijzen naar de huidige werkkopie.

## Wat in orde is

- **Pictogramknoppen** (`actieKnopHTML`, main.js:505): `aria-label="Bewerken: <naam>"` / `"Verwijderen: <naam>"` per rij, svg `aria-hidden`, tooltip `aria-hidden` (geen dubbele aankondiging). Zichtbaar label (de tooltip) zit in de naam (2.5.3). ↑/↓: `"<naam> omhoog/omlaag"`.
- **Tooltip (1.4.13):** zichtbaar bij hover en bij `:focus-visible`; Esc verbergt hem (`tip-uit` op `#inhoud`, main.js:1148-1160) tot een andere knop hover/focus krijgt; hoverbaar door de 6px-brug `.tip::after`; blijft staan zolang de aanwijzer erop of op de knop staat.
- **Verwijderen niet alleen via kleur:** ander pictogram (prullenbak), eigen naam "Verwijderen: X", `confirm()` met de naam, op de telefoon ook ruimtelijk gescheiden (`margin-left:auto`). Kleur (`--fout`) komt alleen bij hover/focus erbij. 1.4.1 ok.
- **Doel op de telefoon:** `.btn-icoon` en `.btn-volgorde` 44x44 op ≤700px (style.css:1016), ook "+ Vermogen toevoegen" en de keuzelijst 44px. Rijen stapelen op ≤400px containerbreedte, `flex-wrap` op de actiekolom. Op desktop 32x28 (WCAG 2.1 eist geen minimum, 2.5.5 is AAA).
- **Toon-keuzelijst:** zichtbaar `<label for>` "Toon", native `<select>` met `optgroup`, ververst bij `change` (geen aparte knop), `role="status"`-regel vanaf het tekenen aanwezig, leeg tot de wijziging, `zetStatus` leeg, na 100 ms gevuld ("7 vermogens bij Financiën." / "58 vermogens bij 13 domeinen." / "Nog geen vermogens bij X."). Zelfde patroon bij Domeinen (soortfilter, met de aanvulling "Volgorde wijzigen kan bij Alle soorten.").
- **Groepkoppen:** h1 (Home) / h2 (sectie) / h3 (groep, lege-staat-blok). Kop leest als "Financiën, Ondersteunend domein, 7 vermogens" (sr-only komma's, pictogram `alt=""`, pill heeft tekst, het stipje is decoratief). Per groep een `role="table"` met `aria-label="Vermogens bij X"`, sr-only kolomkoppen Nr./Vermogen/Acties, `role="row"`/`cell` per rij. Domeinen heeft kolomkoppen incl. sr-only "Pictogram" en "Acties".
- **↑/↓:** `role="status"` leeg vóór de klik, na verversen gevuld ("Vermogen X staat nu op plaats 2 van 7 in Y."). Staat een pijl op zijn grens, dan is hij `disabled` (uit de tabvolgorde) en `focusInLijst` valt terug op Bewerken van dezelfde rij, dus de focus raakt niet kwijt. Verborgen pijlen (Domeinen met soortfilter, groep "Zonder geldig domein") zijn `visibility:hidden` + `tabindex=-1` + `aria-hidden` + `disabled`: niet focusbaar, niet voorgelezen. Uitleg staat er bij: hint "De volgorde wijzig je bij Toon: Alle soorten." en de groepsuitleg bij "Zonder geldig domein" (verwijst naar Bewerken).
- **Formulier:** `<label for>` bij Naam en Domein (ook in de rij, `vn-`/`vd-`-id's), `aria-describedby` vanaf het tekenen naar het foutspan, `aria-invalid` via `zetVeldFout`/`wisVeldFout`, focus op het eerste foute veld (`valideerVelden`) ook bij serverfouten (`veldFouten`-map), Enter in het naamveld = Opslaan, geen Esc-gedrag (zoals gebruikersreis). Foutteksten benoemen oorzaak én herstel. Focus na opslaan: terug op "+ Vermogen toevoegen" (ook als die in de lege staat of de balk staat); na annuleren idem; na bewerken op het potlood (of dat van de buurrij bij verplaatsen onder een filter); na verwijderen op het potlood van de buurrij, anders `zichtbareTerugval` (lost CK-023 bevinding 1 op).
- **Meldingen:** succes `role="status"` met `aria-hidden`-vinkje, fout `role="alert"`, beide vanaf het tekenen aanwezig en leeg (CK-023-patroon). `meldingInBeeld` scrolt alleen als de melding buiten beeld is. De laadfout is een `role="alert"` met echte `<button>` "Opnieuw laden" (focus terug op filter of toevoegknop na succes).
- **Halve uitkomst:** formulier opnieuw open op de nieuwe plek, melding in `role="alert"`; bij een naamfout focus op Naam met `aria-invalid` en `aria-describedby`, anders focus op Opslaan. De melding benoemt wat wel en niet gelukt is.
- **Melding "Naar de vermogens van X":** echte link (`<a data-nav>` in de melding), de foutmelding hoort bij de radiogroep (`aria-invalid` op de `radiogroup`, `aria-describedby` op het rondje, focus op het rondje, link volgt direct in de tabvolgorde). Na klikken: `navigeer()` zet titel bij, scrollt naar boven en focust `#inhoud` (lost CK-044 bevinding 2 op); het filter staat dan al op X.
- **Home:** `Promise.allSettled` zodat Home blijft werken; kerncijfer "–" `aria-hidden` + sr-only "niet geladen"/"wordt geladen"; "n vermogens" petrol en "Nog geen vermogens" muted cursief, beide met tekst (niet kleur-alleen); bij laadfout geen regel op de kaarten, wel een zichtbare hint.
- **Tabvolgorde Vermogens:** overslaan, zijmenu, kruimelpad, Toon, + toevoegen, formulier, rijen (DOM-volgorde = visuele volgorde). Geen toetsenbordval; `hidden` knoppen worden niet getoond/gefocust.
- **Mobiel paneel:** onveranderd (CK-044); `navigeer` sluit het paneel zonder focus te stelen en focust dan de inhoud.
- **Reflow/zoom:** op ≤700px (ook 200% zoom op 1280px) gelden de telefoonregels; keuzelijst en knop over de volle breedte; lange namen breken (`overflow-wrap:anywhere`), geen ellipsis.

## Contrast (berekend)

| Combinatie | Licht | Donker | Eis |
|---|---|---|---|
| petrol (groepskop, "n vermogens", melding ok) op `--bg`/`--card` | 4,90 | 7,62 / 6,23 | 4,5 ok |
| petrol op `--surface` | 4,51 (grens) | 6,98 | ok |
| muted (iconen, "Nog geen vermogens", hint, aantal) op `--bg`/`--card` | 5,08 | 8,13 / 6,64 | ok |
| muted op `--surface` | 4,67 | 7,45 | ok |
| `--fout` (melding, veldfout) op `--card` / `--surface` | 5,44 / 5,00 | 6,48 / 7,27 | ok |
| tooltip: wit op `--petrol-dark` | 6,49 | 8,10 | ok |
| oranje focusring (alleen) op wit/card | **2,07** | 7,18 | 3:1 licht niet gehaald (zie 1) |
| `--border` op `--bg` (knoprand) | 1,48 | 1,76 | n.v.t.: het pictogram (5,08) identificeert de knop |
| uitgeschakeld ↑/↓ (`opacity:.35`) | n.v.t. | n.v.t. | uitgezonderd |

## Bevindingen

### 1. Focusring pictogramknoppen en ↑/↓ in het lichte thema alleen oranje (2,07:1)
**Ernst:** 🟡 Aandacht (strikt gelezen AA-gap)
**WCAG-criterium:** 1.4.11 Non-text Contrast, 2.4.7 Focus Visible
**Locatie:** `src/style.css:904-905` (`.btn-kaart-actie:focus-visible`, `.btn-icoon`); vergelijk `.btn-toevoegen:focus-visible` (r. 920) en de zijmenu-ringen (r. 700-703), die wel een donkere binnenlijn hebben
**Probleem:** Bewerken/↑/↓ krijgen bij focus alleen een oranje 2px-outline (2,07:1 op wit). Alleen Verwijderen verandert ook van rand en kleur (`.btn-icoon.gevaar:focus-visible`). De tooltip bij focus is een extra aanwijzing, maar geen vervanging (hij kan met Esc weg). Dit zijn nu ~230 focusstops op de Vermogens-pagina. Zelfde punt als CK-023 bevinding 5/CK-044.
**Aanbeveling:**
```css
.btn-kaart-actie:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; box-shadow: 0 0 0 2px var(--text); }
```
(donkere lijn 18,8:1 in licht; in donker is oranje al 7,2:1 en blijft de lijn zichtbaar.)

### 2. Domeinen: melding "Naar de vermogens van X" staat vóór de lijst, focus blijft op de prullenbak
**Ernst:** 🟡 Aandacht
**WCAG-criterium:** 2.4.3 Focus Order (bruikbaarheid toetsenbord), 3.3.3 Error Suggestion
**Locatie:** `src/main.js:1399-1404` (`toonVerwijderBlokkade`: `knop.focus()`), melding in `#structuur-fout` boven `#structuur-lijst`
**Probleem:** De schermlezer hoort de melding (alert + `aria-describedby`), maar de enige actie, de link, staat boven de lijst. Wie op de prullenbak van een domein onderaan staat, moet met Shift+Tab terug langs alle rijknoppen (13 domeinen x 4 knoppen) om de link te bereiken. De tekst zegt dus wat te doen, maar de weg ernaartoe is voor toetsenbordgebruikers lang. (Bij de soortkeuze in het bewerkformulier is dit wel goed: de link volgt direct op het rondje.)
**Aanbeveling:** Zet de focus op de link in de melding, die is de logische volgende stap, en laat de alert de uitleg voorlezen:
```js
toonVermogensBlokkade(sectieFout, domein, tekst)
sectieFout.querySelector('a')?.focus()   // i.p.v. knop.focus() en aria-describedby
meldingInBeeld(sectieFout)
```
Of laat de melding in de rij zelf verschijnen, onder de domeinnaam, zodat de link naast de prullenbak staat. Wijkt af van besluit 15 (focus op de prullenbak); leg dat vast.

### 3. Dertien `region`-landmarks door `<section aria-labelledby>` per groep
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.3.1 Info and Relationships (best practice voor landmarknavigatie)
**Locatie:** `src/main.js:1738`, `1753` (`<section class="vermogen-groep" aria-labelledby=...>`)
**Probleem:** Een `section` met naam is een `region`-landmark: bij 13 groepen krijgt de rotor/landmarklijst van Jan 13 extra regio's naast de echte (banner, navigatie, main). De h3's en de tabelnamen doen het werk al.
**Aanbeveling:** `<div class="vermogen-groep">` in plaats van `<section>` (de h3 blijft de kop; de tabel heeft al `aria-label`).

### 4. Hint "kon niet worden geladen" op Home wordt mogelijk niet voorgelezen
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 4.1.3 Status Messages
**Locatie:** `src/main.js:952` (`<p ... role="status" hidden>`) en 602-606 (`hint.hidden = false`)
**Probleem:** Een live region die met `hidden` uit de toegankelijkheidsboom staat en tegelijk met de tekst zichtbaar wordt, wordt vaak niet aangekondigd (CK-023-lering: "vanaf het tekenen aanwezig, niet verborgen"). Gevolg is beperkt: de gebruiker deed geen actie, en het kerncijfer zegt zelf "niet geladen".
**Aanbeveling:** Laat de `<p role="status">` altijd bestaan (leeg, zonder `hidden`) en vul alleen de tekst; verberg hem visueel via `:empty { display:none }` zoals bij `.melding`.

### 5. Vermogens-pagina: ruim 200 tabstops bij "Alle domeinen", geen sneller pad voor toetsenbordgebruikers
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 2.4.1 Bypass Blocks (best practice; voldaan via filter en h3's)
**Locatie:** `src/main.js:1706-1717` (`rijHTML`)
**Probleem:** 58 rijen x 4 knoppen. Het filter staat bovenaan en schermlezers hebben kopnavigatie, maar een toetsenbordgebruiker zonder schermlezer heeft alleen het filter. Dit is bewust geaccepteerd in de gebruikersreis.
**Aanbeveling:** Later (bij CK-021) overwegen: standaard het eerste domein tonen, of de ↑/↓-knoppen alleen tonen in een "Volgorde wijzigen"-modus. Nu geen actie.

### 6. Naamvolgorde rijknoppen inconsistent met de spec en met ↑/↓
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 2.4.6 Headings and Labels (consistentie), 3.2.4 Consistent Identification
**Locatie:** `src/main.js:508` ("Bewerken: X") versus 1714 (`"X omhoog"`); de gebruikersreis noemde "Teamindeling bewerken"
**Probleem:** Twee naamstijlen naast elkaar in één rij: "Bewerken: Teamindeling", "Teamindeling omhoog". Niet fout (beide bevatten de naam; "Bewerken: X" houdt het zichtbare label vooraan), wel ongelijk in de rotor.
**Aanbeveling:** Kies één stijl, bijvoorbeeld "Omhoog: X" / "Omlaag: X", zodat alle vier de knoppen dezelfde vorm hebben.

### 7. Beheerpagina's hebben nog geen `h1` (herhaald, bestond al)
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.3.1 / 2.4.6
**Locatie:** `src/main.js:1633-1636` (en Domeinen, Bestuursfuncties): `h2` "Vermogens" is de eerste kop; alleen Home heeft een `h1`
**Aanbeveling:** Zie CK-044 bevinding 6; maak de sectiekop een `h1` of voeg een sr-only `h1` toe. Heading-structuur h2 > h3 is voor Vermogens verder logisch.

### 8. Opmerkingen zonder actie
- Filterwissel: `tekenLijst` herbouwt de opties van de `select` waar de focus op staat (main.js:1789). Werkt, maar herbouw alleen als de domeinen veranderd zijn, om een mogelijke herhaalde aankondiging in Safari/VoiceOver te voorkomen. Niet geverifieerd.
- Filter springt bij toevoegen en halve uitkomst naar het nieuwe domein (afwijking 6 in het bouwverslag): de melding noemt het domein, dus voor schermlezers voldoende.
- Op de telefoon blijft een getapte tooltip (hover-emulatie) staan tot een tik elders; Esc bestaat daar niet. Hinder is klein (tooltip ligt boven de eigen knop).
- Niet getest door de bouwer en ook niet door mij: VoiceOver/TalkBack, focus bij `confirm()` (native dialoog, focus keert terug), 320px-reflow met zijmenu, tooltip-afknipping in de eerste rij. Dit hoort in de handmatige test.

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 2 (focusring licht 1.4.11; focus/link bij Domeinen-blokkade 2.4.3)
- 🟢 Suggesties: 5 (13 regio-landmarks, Home-hint als live region, 200+ tabstops, naamstijl knoppen, h1)
- Alle nieuwe contrastcombinaties in licht en donker halen 4,5:1 (petrol op surface 4,51 blijft op de grens); alleen de oranje focusring alleen in licht (2,07:1) niet.
- Sterk: toegankelijke namen met het vermogen erin, Esc-tooltips, statusregels voor Toon en ↑/↓, `aria-describedby` en `aria-invalid` met focus bij fouten, focus bij elke actie op iets zinnigs, alerts en statussen vanaf het tekenen aanwezig.

## Eindoordeel

🟡 Kleine tekortkomingen. Geen A/AA-blokkade in de functionaliteit; bevinding 1 (focusring) is strikt gelezen een AA-gap en is met één regel CSS op te lossen, bevinding 2 verbetert de toetsenbordroute bij Domeinen. Geen reden om terug naar de bouwer te gaan; wel handmatig met VoiceOver en alleen-toetsenbord testen, omdat de bouwer de UI niet heeft kunnen klikken.
