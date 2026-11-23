# Toegankelijkheidsrapport: CK-044 Eén navigatie, zijmenu op elke pagina

Beoordeeld: `git diff src/main.js src/style.css` tegen `.claude/specs/CK-044-ontwerp.md` en `CK-044-gebruikersreis.md`. Methode: code-analyse en contrastberekening (geen browser-/schermlezertest uitgevoerd).

## Wat in orde is (kort)

- Skiplink "Direct naar inhoud": eerste focusbare element, alleen zichtbaar bij focus, focust `main#inhoud` (tabindex -1, outline weg is ok), geen `#inhoud` in de URL. Focusindicator: donkere outline op petrol 3,83:1. 2.4.1 ok.
- Landmarks: `header` (banner), `nav aria-label="Hoofdmenu"`, `nav aria-label="Kruimelpad"`, `main#inhoud`, `footer`. Twee navs hebben onderscheidende namen. 1.3.1 / 4.1.2 ok.
- `aria-current="page"` op precies een zijmenu-item (ook de accountregel) en op het laatste kruimel. Actief is niet alleen kleur: ook vet en witte achtergrond. 1.4.1 ok.
- Ingeklapt menu: `.naam` is zowel naam als tooltip, geen `title`-attributen, dus geen dubbele aankondiging. Accountnaam "Mijn account, <naam · rol>" bevat de zichtbare tekst (2.5.3 ok). Groepen: `ul aria-labelledby` op het kopje.
- Inklapknop: wisselende tekst in `.naam` ("Menu inklappen"/"Menu uitklappen"), geen aria-label/aria-expanded, conform ontwerp. Icoon `aria-hidden`.
- Paneel (mobiel): ☰ heeft `aria-controls`, `aria-expanded` (label blijft constant: correct patroon), focus naar ✕ bij openen, terug naar ☰ bij sluiten (inert wordt eerst verwijderd), Esc, ✕ en klik op achtergrond sluiten, `inert` op overslaan/top-bar/app-kolom/footer/omgevingsbalk, scroll-lock via `body.paneel-open`, `prefers-reduced-motion` gerespecteerd, resize naar >700px sluit het paneel. Gesloten paneel is `visibility:hidden`, dus niet tabbaar. Geen toetsenbordval (rest is inert, Tab gaat naar de browser).
- Focusringen: oranje 2px + donkere (op de balk witte) binnenlijn. Oranje alleen is 1,9:1 (surface) en 2,4:1 (petrol), maar de binnenlijn haalt 17,2:1 (text/surface) en 4,9:1 (wit/petrol). 2.4.7 en 1.4.11 ok.
- Contrast (licht thema): wit op petrol 4,90; petrol op surface 4,51 (net voldoende); petrol op card 4,90; muted op surface 4,67; wit op petrol-dark (tooltip) 6,49; text op oranje (overslaan) 9,07. 1.4.3 ok.
- Tikruimte: items `min-height:44px`, ☰ en ✕ 44x44, ingeklapt 44 breed. ok.
- Reflow 320px: paneel max 260px, titel met ellipsis, kruimelpad en footer breken/knippen netjes, `.app-kolom` heeft `min-width:0`. Geen horizontaal scrollen door de shell. (De `.domein-rij`-kolommen zijn een bekend bestaand punt en niet beoordeeld.)
- Logo `alt=""`: correct, de clubnaam staat in de titel.
- `lang="nl"` ongewijzigd. Overige criteria uit de opdracht: n.v.t. of ok.

## Bevindingen

### 1. Tooltip ingeklapt menu: niet sluitbaar met Esc en niet hoverbaar
**Ernst:** 🟡 Aandacht (strikt gelezen AA-gap)
**WCAG-criterium:** 1.4.13 Content on Hover or Focus
**Locatie:** `src/style.css:733-741` (`.zijmenu.ingeklapt .zijmenu-item:is(:hover, :focus-visible) .naam`, `pointer-events: none`)
**Probleem:** De tooltip verschijnt bij hover/focus, maar kan niet met Esc worden weggehaald zonder de focus te verplaatsen (dismissible) en kan niet met de muis worden bereikt (hoverable, `pointer-events:none`). De tooltip bedekt ook het volgende pictogram niet, dus de hinder is klein, en de informatie is ook via uitklappen beschikbaar.
**Aanbeveling:** Voeg een Esc-handler toe die tijdelijk een klasse zet:
```js
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.zijmenu')?.classList.add('tip-uit') })
// en bij focusout/mouseleave: classList.remove('tip-uit')
```
```css
.zijmenu.tip-uit .zijmenu-item .naam { /* terug naar visueel verborgen */ }
```
Hoverable: haal `pointer-events:none` weg en laat de `.naam` ook zichtbaar blijven op `.zijmenu-item:hover`. De tooltip hangt in het item zelf, dus de muis kan er zonder gat naartoe (offset 8px: gebruik `left: 100%` en `margin-left: 8px` als padding-gap vermijdt flikkeren).

### 2. Geen focusbeheer en geen titelwissel bij paginawissel
**Ernst:** 🟡 Aandacht
**WCAG-criterium:** 2.4.3 Focus Order, 2.4.2 Page Titled, 4.1.3 Status Messages (best practice voor SPA)
**Locatie:** `src/main.js:1039-1063` (`bindAppShell`, `NAV_DOEL[...]`) en de `render*`-functies (`document.title` wordt alleen in de tussenkaarten gezet, `main.js:740`, `763`)
**Probleem:** Een klik op een menu-item of kruimel vervangt `#app.innerHTML`. De focus valt terug naar `body`; toetsenbord- en schermlezergebruikers beginnen weer bij de skiplink en horen niet dat de pagina is gewisseld. `document.title` blijft gelijk. Het ontwerp laat dit bewust zo (focus niet stelen bij renderen), maar bij navigatie via het menu is een gebruikersactie de aanleiding. Nu het menu op elke pagina staat, merk je dit vaker.
**Aanbeveling:** Alleen in de `data-nav`-handler, na de render van de doelpagina:
```js
await NAV_DOEL[id](gebruiker)
document.title = `${navNaam(id)} · clubKOMPAS`
document.getElementById('inhoud')?.focus()   // tabindex=-1, outline is al uit
```
Dit raakt de CK-025-focus na opslaan niet (die loopt via een andere route).

### 3. Donker thema: wit op petrol haalt geen AA, en dat geldt nu ook voor titelbalk en ☰
**Ernst:** 🟡 Aandacht (bekend en buiten scope volgens ontwerp; wel uitgebreid)
**WCAG-criterium:** 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast
**Locatie:** `src/style.css:~652` (`.top-bar`, `.top-bar .app-title`, `.menu-knop`), `footer`; token `--petrol: #7DB1B3` in het donkere thema
**Probleem:** Wit op `#7DB1B3` is 2,38:1. De titel "clubKOMPAS · club" stond voorheen op `--bg` in petrol (goed contrast, 6,98 op surface) en staat nu op de petrol balk: nieuwe verslechtering in donker thema, naast de al bestaande footer. ☰ (wit op petrol) is ook 2,38:1 (<3:1). Petrol op surface/card is in donker wel ruim voldoende (6,2 tot 7,0).
**Aanbeveling:** Gebruik voor vlakken met witte tekst een apart token dat in donker donker blijft:
```css
:root { --petrol-vlak: var(--petrol); }
:root[data-theme="dark"] { --petrol-vlak: #2F5658; }   /* wit: 8,1:1 */
/* idem in het prefers-color-scheme-blok */
.top-bar, footer { background: var(--petrol-vlak); }
```
Dan ook de `--on-petrol`-focus-binnenlijn van ☰ controleren (wit op #2F5658 is ruim voldoende).

### 4. Ingeklapt menu kan op lage viewports afgeknipt raken
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.4.10 Reflow, 2.1.1 Keyboard
**Locatie:** `src/style.css:719` (`.zijmenu.ingeklapt .zijmenu-binnen { overflow: visible }`) in combinatie met `height: min(100%, calc(100dvh - var(--kop-h)))` (r. 673-)
**Probleem:** Ingeklapt is `overflow` zichtbaar (voor de tooltip) en de sticky container heeft een vaste hoogte. Bij weinig hoogte (ca. 400px css, bijv. 180% zoom op laptop met breedte >700px) vallen de onderste items (Uitloggen, uitklapknop) buiten beeld zonder dat het menu kan scrollen.
**Aanbeveling:** Voeg toe: `@media (max-height: 480px) { .zijmenu.ingeklapt .zijmenu-binnen { overflow-y: auto } }` (tooltip wordt dan afgekapt, maar bereikbaarheid wint), of gebruik daar altijd de uitgeklapte variant.

### 5. `list-style: none` haalt in Safari/VoiceOver de lijstsemantiek weg
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.3.1 Info and Relationships
**Locatie:** `src/style.css:680` (`.zijmenu-groep ul { list-style: none }`)
**Aanbeveling:** `role="list"` op de `ul` in `zijmenuHTML` (`src/main.js:924`) zodat "lijst, 3 items" blijft klinken.

### 6. Pagina's zonder `h1`
**Ernst:** 🟢 Suggestie (bestond al)
**WCAG-criterium:** 1.3.1 / 2.4.6 Headings and Labels
**Locatie:** de `render*`-functies; alleen Home heeft een `h1` (`main.js:846`), de overige pagina's beginnen met `h2` in `.sectie-kop`.
**Aanbeveling:** Maak de eerste `h2` per pagina een `h1`, of voeg een `sr-only` `h1` toe. Combineer met finding 2 (focus naar de koptekst i.p.v. `main`).

### 7. Titel op mobiel wordt afgekapt zonder volledige tekst
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.4.10 Reflow (informatieverlies is licht: clubnaam staat ook op de Club-pagina)
**Locatie:** `src/style.css:652` en `:777` (`.top-bar .app-title`, ellipsis; bij logo blijft op 320px ca. 106px over)
**Aanbeveling:** `title="<volledige titel>"` op `.app-title` is optioneel; liever de titel toestaan om op 2 regels te breken op mobiel (`white-space: normal; line-clamp: 2`) zodat de naam leesbaar blijft.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 3 (tooltip 1.4.13, focus/titel bij paginawissel, donker thema contrast)
- 🟢 Suggesties: 4

## Eindoordeel
🟡 Kleine tekortkomingen. In het lichte thema voldoet de shell aan WCAG 2.1 AA, op de tooltip-eis (1.4.13) na. Geen reden om terug naar de bouwer te gaan; punt 2 en 3 zijn goede kandidaten voor een vervolgstory.
