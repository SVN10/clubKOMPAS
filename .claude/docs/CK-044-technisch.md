# App-shell en zijmenu — technische documentatie

Voor ontwikkelaars die een pagina of menu-item toevoegen, of het menu aanpassen. Alles staat in `src/main.js` (blok "Zijmenu als data" tot en met `bindAppShell`) en `src/style.css` (sectie "app-shell"). Elke ingelogde pagina (Home, Domeinen, Bestuursfuncties, Club, Mijn account) gebruikt dezelfde shell; de tussenschermen (laden, geen club, inlogscherm) niet.

## Opbouw

`appShellHTML({ actief, kruimels, inhoud })` levert, in deze volgorde:

1. `a.overslaan` ("Direct naar inhoud", alleen zichtbaar bij focus)
2. `header.top-bar`: ☰ (`.menu-knop`, alleen ≤700px), kompas, titel, clublogo
3. `.app-lijf` met `nav#zijmenu`, `.zijmenu-achtergrond[hidden]` (dimlaag) en `.app-kolom` (kruimelpad + `main#inhoud[tabindex=-1]` > `.wrap`)
4. `footer`

De omgevingsbalk (P0e/P0f) staat bewust buiten `#app`, in `body`, en overleeft dus elke render. `.heeft-logo` staat op `.app-shell` en alleen als `veiligLogo()` iets teruggeeft; die klasse zet `--logo-ruimte`.

Elke render zet `#app.innerHTML` en roept daarna **`bindAppShell(gebruiker)`** aan. Die ruimt eerst een hangend paneel op en bindt één klikhandler op `.app-shell`. Omdat de shell per render wordt vervangen, stapelen listeners op de shell of de `nav` niet op. Listeners op `document` en `matchMedia` (Esc, breedtewissel) staan op moduleniveau en worden één keer gebonden.

## Een menu-item of pagina toevoegen

Voorbeeld: Vermogens (de plaat, CK-021), onder Overzicht. Zo is het ook echt gebouwd: `renderPlaat` in `src/main.js`.

```js
// 1. Een render-functie die de shell gebruikt
async function renderPlaat(gebruiker) {
  document.querySelector('#app').innerHTML = appShellHTML({
    actief: 'vermogens',
    kruimels: [['Home', 'home'], [navNaam('vermogens')]],   // laatste deel = huidige pagina, zonder doel
    inhoud: `<div class="pagina-kop"><h1 class="pagina-titel">Vermogens<b>overzicht</b></h1></div> ...`,
  })
  bindAppShell(gebruiker)                                    // altijd, ná het zetten van innerHTML
}

// 2. Eén regel in ZIJMENU (bestaande groep, of een nieuwe groep met id en kop)
{ id: 'overzicht', kop: 'Overzicht', items: [
  { id: 'home', naam: 'Home', ico: 'huis' },
  { id: 'vermogens', naam: 'Vermogens', ico: 'tegels' },   // ico: sleutel in MENU_ICOON
]},

// 3. Eén regel in NAV_DOEL
['vermogens', renderPlaat],
```

Daarnaast:
- Een nieuw pictogram: voeg een sleutel toe aan `MENU_ICOON` (viewBox 48×48, lijn, geen vulling; stroke-width komt van `menuIcoon()`).
- Pagina's die niet in het menu staan (zoals `account`) krijgen een naam in `PAGINA_NAAM`, anders valt `navNaam()` terug op de id.
- Pagina's onder een tussenstap (Home › Beheer › Domeinen): geef de tussenstap een `[naam, doel]` in `kruimels` en zorg dat het doel in `NAV_DOEL` staat.
- Een link of knop buiten het menu die navigeert: `data-nav="<id>"` binnen `.app-shell`. De klikhandler doet de rest.
- Vanuit code navigeren: `navigeer(id, gebruiker)`, niet de render-functie direct aanroepen. `navigeer` sluit het paneel, rendert, zet `document.title` via `paginaTitel(navNaam(id))` en zet de focus op `#inhoud` (`preventScroll`). Alleen de eerste render na inloggen gaat zonder `navigeer`.
- Zet `data-nav`-waarden en menu-id's nooit door in `innerHTML` zonder `esc()`; `NAV_DOEL` is een `Map` zodat sleutels als `constructor` of `__proto__` niets doen.

`zichtbaar()` filtert groepen en items; een groep zonder zichtbare items wordt niet getekend. Zie "Vervolgpunten": dit is presentatie, geen beveiliging.

## Uitschuifpaneel (≤700px) en toegankelijkheid

- Het zijmenu wordt een `position: fixed` paneel over de volle hoogte (`top: 0`; sinds 23-11-2026 staat de omgevingsbalk onderaan, `--paneel-top` is in CK-056 vervallen). `openPaneel()` zet `.open`, toont de dimlaag, `aria-expanded="true"` op ☰, `inert` op alles uit `PANEEL_INERT` (overslaglink, balk, kolom, footer, omgevingsbalk), `body.paneel-open` (scroll-lock) en zet de focus op ✕.
- `sluitPaneel({ focus })` draait dit terug en zet de focus terug op ☰. Gebruik `focus: false` als de focus daarna toch elders heen gaat (navigeren, uitloggen, nieuwe render, `onAuthStateChanged` zonder sessie). Het opruimen gebeurt ook als het paneel niet open is, zodat een hangende `inert` of scroll-lock nooit overblijft.
- Sluiten: ✕, Esc, dimlaag, een menu-item, of een breedtewissel naar >700px.
- Er is precies één `aria-current="page"` per pagina; op de accountregel als `actief: 'account'`. De accountregel heet voor schermlezers "Mijn account, naam · rol" (`.naam-voor` + visueel verborgen komma).
- Ingeklapt (44px, alleen ≥701px) tonen items een tooltip bij `:hover` en `:focus-visible` (WCAG 1.4.13): Esc verbergt hem (`.tip-uit`, tot hover/focus op een ander item), de muis kan erop (geen `pointer-events: none`, een `::before`-brug van 8px). Alle tooltipregels gelden alleen voor `.zijmenu.ingeklapt:not(.tip-uit)`.
- Menu-items hebben bewust geen `title`, `aria-label` of `aria-expanded` op de inklapknop: de zichtbare tekst (`.naam`) is de toegankelijke naam en wisselt tussen "Menu inklappen" en "Menu uitklappen".
- Focusring: oranje `outline` met binnenlijn (`box-shadow: inset`), zodat hij ook op petrol en in donker thema zichtbaar blijft.
- `prefers-reduced-motion` zet de paneelanimatie uit.
- Uitloggen loopt altijd via `uitloggen()` (foutafhandeling: alleen `e.code` in de console). Het zijmenu vraagt niet om bevestiging.

## Tokens en maten (`src/style.css`)

| Token | Waarde | Gebruik |
|---|---|---|
| `--petrol-vlak` | licht `var(--petrol)`, donker `#2F5658` | achtergrond van vlakken met witte tekst: `.top-bar`, `footer`, `.sectie-kop`. Niet `--petrol` gebruiken voor nieuwe vlakken met witte tekst: in donker thema haalt dat maar 2,38:1, `--petrol-vlak` 8,1:1 |
| `--logo-ruimte` | 16px; `192px` met `.heeft-logo`; `124px` met logo op ≤700px | rechterruimte voor titel en kruimelpad zodat het clublogo niets overlapt. Gebruik hem voor elk nieuw element dat in de kopstrook rechts moet uitlijnen |
| `--kop-h` | 52px; 80px met `body.met-omgeving-balk` | hoogte petrol balk (plus omgevingsbalk); bepaalt de hoogte van het sticky zijmenu (`100dvh - --kop-h`) |
| `--schaduw-tooltip`, `--schaduw-paneel`, `--dimlaag` | in `:root`, licht en donker gelijk | schaduwen en dimlaag; geen losse `rgba` in regels |

Maten: balk 52px, logo 78px (36px mobiel), zijmenu 172px uitgeklapt / 44px ingeklapt. Het ☰-icoon heeft `stroke-width: 2.25` zodat de gerenderde lijn (1,125px) gelijk is aan die van de menu-items (18px bij 3 op 48).

Hoogte loopt via flex (`#app:has(> .app-shell)`), niet via vaste `calc(100vh - …)`-waarden.

## Keuzes die niet voor de hand liggen

- **`NAV_DOEL` is de enige navigatietabel** voor zijmenu, kruimelpad, accountregel en knoppen. Een tweede tabel gaat uit de pas lopen; en een `Map` omdat een gewoon object prototype-sleutels (`constructor`) als geldig doel zou zien.
- **`.top-bar` is 52px en het logo steekt eruit** (half over de balk, half over de pagina): daarom `--logo-ruimte` in plaats van een vaste marge, en alleen ruimte reserveren als er echt een logo is.
- **`inert` in plaats van een focus-trap** voor het paneel: de browser houdt dan zowel toetsenbord als schermlezer buiten de rest. De omgevingsbalk zit buiten `#app` en staat daarom expliciet in `PANEEL_INERT`.
- **Stand van het menu in `localStorage` (`zijmenu-ingeklapt`)**, in `try/catch` omdat opslag geblokkeerd kan zijn; standaard uitgeklapt.
- **Accountregel zonder `displayName`** toont alleen het deel vóór de @ (`sessieLabel()`), om het volledige e-mailadres niet permanent in beeld en tooltips te hebben.

## Vervolgpunten (backlog "Na CK-044")

- **Harde eis voor P0d, vóór Beheer voor een tweede bestuurder of rol openstaat: `zichtbaar()` is géén beveiliging.** Het verbergt alleen een menu-item; `NAV_DOEL` en de render-functies zijn nog steeds bereikbaar (via `data-nav`, de console, of een oude link). De `zichtbaar: () => true /* P0d */` op de groep Beheer is een plaatsmarkering. Nodig: `isBeheerder(clubId)` op `leden/{uid}.rol` in `firestore.rules` voor schrijven op `instellingen`, `bestuursfuncties` en `structuurelementen`; controle in `navigeer`/`NAV_DOEL` (niet rendern zonder recht); en een guard bovenaan elke beheer-render. De regels zijn de echte grens, de rest is bruikbaarheid.
- Eén `h1` per pagina (nu alleen Home).
- Domeinenlijst op ~768px met uitgeklapt menu: vaste kolommen (~900px) passen niet.
- Lege strook onder het zijmenu bij omgevingsbalk na scrollen (beoordelen op tst).
- Ongebruikte CSS opruimen: `.functie-label`, `.picto-groot`, `.structuur-rij-info`, `.volgorde-nr`.
- Donker thema: `.filter-knop.active` (Domeinen) haalt 2,38:1; `--petrol-vlak` gebruiken.
- Niet in een echte browser getest: tooltip-brug, lage viewport, logo-overlap, donkere modus (zie handmatige lijst in het bouwverslag).
