# Build-rapport: CK-044 — Eén navigatie, zijmenu op elke pagina

Branch: `test` (niet gecommit, niet gepusht). Datum: 22 november 2026.
Bronnen: `.claude/specs/CK-044-besluiten.md`, `.claude/specs/CK-044-zijmenu.md` (incl. "Antwoorden van Paul" en "Bijstellingen na de gebruikersreis"), `.claude/specs/CK-044-gebruikersreis.md`, `.claude/specs/CK-044-ontwerp.md` (incl. correctie `.top-bar { height: 52px }` en "Bijstelling Paul na het prototype").

## Wat is gebouwd
Eén app-shell voor Home, Domeinen, Bestuursfuncties, Club en Mijn account.

- **`appShellHTML({ actief, kruimels, inhoud })`** levert de markup uit het ontwerp: overslaglink "Direct naar inhoud" → petrol balk (☰, kompas, titel, logo) → `.app-lijf` met `nav#zijmenu`, `.zijmenu-achtergrond[hidden]` en `.app-kolom` (kruimelpad + `main#inhoud[tabindex=-1]` + `.wrap`) → footer. `heeft-logo` staat op `.app-shell` en alleen als `veiligLogo()` iets geeft.
- **`ZIJMENU`** (data) met groepen Overzicht (Home) en Beheer (Domeinen, Bestuursfuncties, Club, met `zichtbaar: () => true /* P0d */`). Helper `zichtbaar()` filtert groepen en items, een lege groep wordt niet getekend. **`NAV_DOEL`** is de enige navigatietabel voor zijmenu, kruimelpad en accountregel (`data-nav`). Kruimelnamen komen via `navNaam(id)` uit `ZIJMENU`.
- **Zijmenu**: kopjes als `<span id="zm-kop-…">` met `<ul aria-labelledby>`. Precies één `aria-current="page"` (ook op de accountregel bij `actief: 'account'`). Geen `title`-attributen. Onderblok: accountregel (`.naam-voor` "Mijn account, " visueel verborgen + `.naam-sessie` = `sessieLabel()`), Uitloggen (`.zijmenu-uitlog`, geen id, geen bevestiging) en de inklapknop (`.naam` wisselt "Menu inklappen"/"Menu uitklappen", geen `aria-label`/`aria-expanded`). Standaard uitgeklapt, stand in `zijmenu-ingeklapt`.
- **Pictogrammen**: `huis`, `account`, `uitloggen`, `inklappen`, `menu` en `sluiten` toegevoegd aan `MENU_ICOON` (48×48, lijn 3). » is `inklappen` gespiegeld via CSS.
- **`bindAppShell(gebruiker)`**: ruimt eerst een hangend paneel op (`body.paneel-open`, `inert`, ook op `.omgeving-balk`) en zet daarna één klikhandler op `.app-shell` voor overslaglink, ☰, ✕/dimlaag, Uitloggen, inklapknop en `[data-nav]`.
- **Paneel** (module-niveau): `openPaneel()` (paneel-top onder de omgevingsbalk, `inert` op `.overslaan`, `.top-bar`, `.app-kolom`, `footer`, `.omgeving-balk`, scroll-lock, focus naar ✕) en `sluitPaneel({ focus })`. Esc-listener op `document` en `matchMedia('(min-width: 701px)')`-listener worden één keer gebonden.
- **Footer**: links "clubKOMPAS · een product van SVN10", rechts "omgeving · Versie x.y.z" met de bestaande tooltip (bijstelling Paul na het prototype). Op ≤700px gestapeld en gecentreerd.
- **Mijn account**: na "Naam opslaan" wordt `.zijmenu-account .naam-sessie` bijgewerkt.
- **CSS**: het shell-blok uit het ontwerp (petrol balk 52px, logo 78px met `--logo-ruimte`, sticky zijmenu 172/44px, tooltips bij `:hover` en `:focus-visible`, focusringen met binnenlijn, mobiel uitschuifpaneel, `prefers-reduced-motion`). De hoogte loopt nu via flex (`#app:has(> .app-shell)`), niet meer via `calc(100vh - 160px)`. De footer heeft `margin-top: 0`.
- **Opgeruimd**: in `src/main.js` `navHTML`, `bindNavListeners`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `BEHEER_ITEMS` en `BEHEER_NAAM`, plus de footer-account en de uitlogknop. In `src/style.css` de oude `.top-bar`, `.top-nav*`, `.footer-rechts*`, `.uitlog-knop`, de oude `.club-logo`, de CK-031-uitzondering (30px), `.footer-account*`, het oude zijmenublok, de mobiele zijmenu-rij en `.top-nav a.nav-home`.

Ongewijzigd: `toonOmgevingsBalk`, de tussenschermen, `meldingenHTML`/`toonOk`/`toonFout`/`bindMeldblokken`, `setFavicon`, `.wrap`, het P0e-blok en het CK-023-blok. `firestore.rules` en `.env.*.local` zijn niet aangeraakt.

## Gewijzigde bestanden
- `src/main.js`: `sessieLabel` (commentaar) en `footerHTML` (twee spans), het nieuwe shell-blok (`MENU_ICOON`, `ZIJMENU`, `zichtbaar`, `navNaam`, `NAV_DOEL`, `zijmenuHTML`, `topBarHTML(logoSrc)`, `kruimelpadHTML`, `appShellHTML`, `openPaneel`/`sluitPaneel`, `bindAppShell`), de vijf renders omgezet en de accountregel bijgewerkt in `renderMijnAccount`
- `src/style.css`: de oude regels weg, het shell-blok erin (zie hierboven), footer als flex met twee kolommen
- `CHANGELOG.md`: CK-044 onder "Ongepubliceerd › Gewijzigd"
- `.claude/backlog.md`: status CK-044 → "Gebouwd, wacht op kwaliteitscontrole"

## Afwijkingen van het ontwerp
1. **Footer als flex in plaats van grid**: volgens de bijstelling van Paul na het prototype (`justify-content: space-between`, twee kolommen). Op mobiel geldt daarom `flex-direction: column; align-items: center` in plaats van de grid-regel uit het ontwerp.
2. **`footer a` en `footer a:hover` verwijderd**: de footer bevat geen links meer, dus deze regels waren dode CSS (niet in de opruimlijst van het ontwerp).
3. **Kruimelpad**: de rechterruimte staat in de basisregel (`padding: 0 var(--logo-ruimte, 16px) 0 16px`) in plaats van in een aparte override-regel. Het effect is hetzelfde, er is alleen één regel minder.
4. **`window.matchMedia?.(…)`**: een kleine bescherming, zodat de module ook laadt waar `matchMedia` ontbreekt (jsdom). In de browser werkt het hetzelfde.
5. **Hulpjes `navNaam(id)` en `huidig(id, actief)`**: voor de kruimelnamen uit `ZIJMENU` en het `aria-current`-attribuut. Geen gedragsverschil.

## Wat is getest (zonder inloggen)
- `node --check src/main.js`: geslaagd.
- `npm run build`: geslaagd (25 modules).
- grep-lijst uit het ontwerp: `top-nav`, `nav-home`, `nav-beheer`, `footer-rechts`, `footer-account`, `uitlog-knop`, `data-beheer`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `bindNavListeners`, `BEHEER_ITEMS`, `BEHEER_NAAM` (en `navHTML`): 0 treffers in `src/` en `index.html`.
- **jsdom-test** (in de scratchpad, buiten de repo). `src/main.js` is gebundeld met nep-modules voor `firebase.js`, `firebase/auth` en `firebase/firestore`, met nep-data (Hockey Club Alphen, Jan de Vries · beheerder). **60/60 geslaagd**:
  - De omgevingsbalk staat buiten `#app` en blijft na elke render en na uitloggen staan.
  - Opbouw: eerste element is de overslaglink. Daarna volgen balk, lijf en footer. `main#inhoud[tabindex=-1]`. De overslaglink zet de focus op main, zonder hash in de URL.
  - ☰: `aria-controls="zijmenu"`, `aria-expanded`, "Menu openen". De titel klopt, het logo heeft `alt=""`, `nav` heeft "Hoofdmenu", de groepen heten Overzicht en Beheer en de `ul aria-labelledby` verwijst naar een bestaand kopje.
  - Precies één `aria-current` per pagina (home, domeinen, functies, club, account). Geen `title` in het zijmenu. De accountregel heet "Mijn account, Jan de Vries · beheerder". Uitloggen heeft geen id. De volgorde onderaan is account → uitloggen → inklapknop.
  - Inklappen: de klasse, `localStorage`, de tekst "Menu uitklappen" en het behoud van de stand bij paginawissel werken. Bij een opgeslagen `'1'` start het menu ingeklapt, zonder opgeslagen stand uitgeklapt.
  - Kruimelpad: "Home", "Home›Beheer›Domeinen/Bestuursfuncties/Club" en "Home›Mijn account", met `aria-current` op het laatste deel. Kruimels Home en Beheer navigeren.
  - CK-023-meldingen zijn aanwezig met de juiste rollen: `structuur-ok/-fout/-form-fout`, `functie-ok/-fout`, `profiel-ok`, `logo-ok/-fout`, `geb-naam-ok/-statusfout`. Er is één shell, één zijmenu en één footer per render.
  - Mijn account: na "Naam opslaan" toont de accountregel direct "Piet Jansen · beheerder" en verschijnt de ok-melding.
  - Paneel: open zet `.open`, haalt `hidden` van de dimlaag, zet `aria-expanded="true"`, de focus op ✕, `inert` op de vijf elementen (niet op het zijmenu), de scroll-lock en `--paneel-top` = onderkant van de omgevingsbalk. Esc, ✕ en de dimlaag sluiten het paneel en zetten de focus terug op ☰, met alles opgeruimd. Een `matchMedia`-wissel sluit het paneel, er is precies één listener. Navigeren vanuit het paneel ruimt alles op. Esc zonder open paneel doet niets. Uitloggen vanuit het paneel geeft het inlogscherm zonder shell en ruimt `paneel-open` en `inert` op de omgevingsbalk op.
  - Zonder logo: geen `heeft-logo` en geen img. Een clubnaam met HTML wordt ge-escaped.
- De devserver op :5173 serveert `src/main.js` en `src/style.css` (200).
- **Niet getest**: weergave en CSS in een echte browser (breedtes, sticky, tooltips, logo-overlap, animatie, donkere modus) en de echte Firebase-stroom. Ik heb niet ingelogd.

## Handmatig te controleren (Paul op tst)
1. **Desktop ≥1200px, uitgeklapt**: elke pagina toont dezelfde balk, hetzelfde zijmenu en dezelfde footer. Het actieve item is wit met een oranje rand en vet. Op de lange Domeinen-pagina blijven het zijmenu, de accountregel en Uitloggen in beeld bij scrollen. Footer links "clubKOMPAS · een product van SVN10", rechts "Test · Versie …" met tooltip.
2. **Desktop ingeklapt**: 44px met alleen pictogrammen en dunne lijnen tussen de groepen. Tooltip bij aanwijzen en bij Tab (ook "Mijn account / naam · rol" in twee regels). Na herladen en bij paginawissel blijft het menu ingeklapt. » is gespiegeld.
3. **768px**: gewoon zijmenu zonder ☰, in- en uitklapbaar. De titel loopt niet onder het logo en het kruimelpad "Home › Beheer › Bestuursfuncties" ook niet. **Let op (bestaand, CK-037):** de vaste `.domein-rij`-kolommen (ca. 900px) passen waarschijnlijk niet in ca. 596px bij een uitgeklapt menu. Valt dat tegen, dan is het een aparte bevinding.
4. **400px**: ☰ zichtbaar, logo 36px binnen de balk, titel afgekapt. Het paneel schuift in onder de omgevingsbalk, met gedimde achtergrond, ✕ bovenin en geen inklapknop. Sluiten met ✕, met een tik naast het paneel en via een menu-item. Daarna scrollt de pagina weer. Bij draaien naar liggend gaat een open paneel dicht. Tussen de accountregel en Uitloggen zit genoeg tikruimte.
5. **Toetsenbord**: Tab-volgorde Direct naar inhoud → Home → Domeinen → Bestuursfuncties → Club → accountregel → Uitloggen → Menu inklappen → kruimels → inhoud. De overslaglink is alleen zichtbaar bij focus. Overal een oranje focusring met binnenlijn. Op mobiel blijft Tab in het paneel en zet Esc de focus terug op ☰.
6. **VoiceOver**: "Hoofdmenu, navigatie", de groepsnamen Overzicht en Beheer, "Home, huidige pagina, link", "Mijn account, Jan de Vries · beheerder, link", "Menu openen, knop, ingevouwen" en "Kruimelpad, navigatie". Het clublogo wordt niet voorgelezen.
7. **Logo-overlap**: het logo valt half over de balk en half over het kruimelpad, en raakt de eerste inhoud niet. Ook testen met een breed logo. Zonder logo is er geen lege ruimte rechts.
8. **Lange clubnaam**: tijdelijk een lange naam bij Club invullen en controleren dat de titel op alle breedtes met "…" wordt afgekapt.
9. **Donkere modus**: het menu en de tooltips zijn leesbaar. Balk, footer en sectiekoppen staan sinds de herstelronde op `--petrol-vlak` (#2F5658, wit 8,1:1). Zie de herstelronde hieronder.
10. **Sticky met omgevingsbalk**: de hoogte van het zijmenu is `100dvh - --kop-h` (80px met omgevingsbalk). Na wegscrollen van de balken blijft er onderaan het zijmenu een strook vrij. Dat volgt uit het ontwerp, maar Paul moet beoordelen of hij dat goed vindt.
11. **Niets verschoven**: CK-023/CK-025-meldingen staan op dezelfde plek en verschijnen één keer, ook de bevestiging na opnieuw tekenen bij Club (focus op de knop, geen focus-steal). Na uitloggen staat het standaard-favicon terug.

## Overige bevinding (buiten scope)
Al bestaande ongebruikte CSS die niet bij CK-044 hoort: `.functie-label`, `.picto-groot`, `.structuur-rij-info`, `.volgorde-nr`. Niet verwijderd, voorstel voor een aparte opruiming.

## Herstelronde (22 november 2026)
Verwerkt: de bevindingen uit `CK-044-test.md`, `-huisstijl.md`, `-beveiliging.md`, `-compliance.md` en `-toegankelijkheid.md`, volgens de opdracht van de coördinator. Branch `test`, niet gecommit. `firestore.rules` is niet aangeraakt en de backlog ook niet (die doet de hoofdsessie).

### Toegankelijkheid
1. **Tooltip ingeklapt menu (1.4.13)**
   - **Wegklikbaar:** Esc zet `.tip-uit` op het ingeklapte menu (de module-brede `keydown`-listener; een open paneel gaat voor). Alle tooltipregels gelden alleen voor `.zijmenu.ingeklapt:not(.tip-uit)`. De klasse vervalt bij `pointerover` of `focusin` op een ander item dan dat waarop Esc werd ingedrukt. Die twee listeners staan op de `nav`, die per render wordt vervangen, dus ze stapelen niet op.
   - **Hoverbaar:** `pointer-events: none` is weg. Een `::before`-brug van 8px overbrugt de ruimte tussen het pictogram en het label. Het label zit in het item, dus de muis kan erop zonder dat het verdwijnt.
2. **Paginawissel**
   - Nieuwe functie `navigeer(id, gebruiker)`: sluit het paneel, rendert (await), zet `document.title = paginaTitel(navNaam(id))` en zet daarna de focus op `#inhoud` met `preventScroll: true`. De scrollpositie blijft dus zoals voorheen.
   - `paginaTitel()` voegt het voorvoegsel toe uit de bestaande `OMGEVINGS_BALK[SOORT].titel`, bijvoorbeeld "TEST · Domeinen · clubKOMPAS". `toonOmgevingsBalk` gebruikt dezelfde functie, met hetzelfde resultaat als voorheen.
   - Bij de eerste render na inloggen verandert er niets. Bij uitloggen wordt de titel teruggezet naar "TEST · clubKOMPAS".
   - De knop "Beheer →" op Home loopt ook via `navigeer('beheer')`, zodat elke paginawissel door de gebruiker zich hetzelfde gedraagt. Dat is een kleine uitbreiding op de opdracht ("via `NAV_DOEL`").
3. **Donker thema**
   - Nieuw token `--petrol-vlak`: licht `var(--petrol)` (visueel ongewijzigd, wit 4,90:1), donker `#2F5658` (wit **8,10:1**, oranje onderrand 4,26:1), op alle drie de plekken.
   - Gebruikt als achtergrond van `.top-bar`, `footer` en `.sectie-kop`.
4. **Lijsten:** `role="list"` op de `ul` in het zijmenu. Het kruimelpad is geen lijst (links met scheidingstekens) en is ongewijzigd gebleven.
5. **Lage viewport:** `@media (min-width: 701px) and (max-height: 480px) { .zijmenu.ingeklapt .zijmenu-binnen { overflow-y: auto } }`. Daar kan de tooltip worden afgekapt, maar het menu blijft bereikbaar.

### Huisstijl
6. **☰:** `.menu-knop svg { stroke-width: 2.25 }`. Gerenderd is dat 24 × 2,25 / 48 = 1,125px, gelijk aan de menu-items (18 × 3 / 48). Correctie op het huisstijlrapport: dat rekende met de helft te veel. De ☰ was niet dunner maar juist dikker (1,5px) dan de items. Hij wordt nu dus iets dunner.
7. **Tokens** `--schaduw-tooltip`, `--schaduw-paneel` en `--dimlaag` in `:root` (licht en donker gelijk). Er staat geen losse `rgba` meer in de regels.

### Beveiliging
8. `NAV_DOEL` is nu een `Map` (`has`/`get`). `constructor`, `toString`, `__proto__` en `hasOwnProperty` doen niets.
9. `item.id`, `groep.id` (ook in `id`/`aria-labelledby`) en de kruimel-`doel` gaan door `esc()`.
10. `esc()` escapet ook `'` als `&#39;`. Bestaande aanroepen zijn nagelopen: `esc()` wordt alleen in HTML-strings gebruikt (tekst en attributen tussen dubbele aanhalingstekens), nergens in `textContent` of in vergelijkingen. Getest met een clubnaam met `'`, `"` en `<b>` in de titel en in het invoerveld Clubnaam.
11. In de else-tak van `onAuthStateChanged` staat nu `sluitPaneel({ focus: false })`. Alle `signOut(auth)`-aanroepen (zijmenu, "Opnieuw inloggen" in een foutmelding, de tussenschermen) lopen via `uitloggen()` met `.catch(e => console.error('Uitloggen mislukt:', e?.code))`. Dat gaat iets verder dan alleen het zijmenu, voor de consistentie.

### Compliance
12. `sessieLabel()`: zonder `displayName` alleen het deel vóór de @ (`jan.devries · beheerder`). Dat geldt voor de accountregel en de tooltip, want beide gebruiken `sessieLabel()`. Op Mijn account staat het volledige adres nog in het e-mailformulier, zoals bedoeld.

### Niet gedaan (backlog, volgens de opdracht)
h1 op elke pagina, de kolommen van de domeinenlijst op 768px en de lege strook onder het zijmenu.

### Opmerking
In het donkere thema staat `.filter-knop.active` (Domeinen, wit op `--petrol`) nog op 2,38:1. Dat viel niet onder de drie genoemde plekken. Voorstel: in dezelfde lijn `--petrol-vlak` gebruiken (aparte bevinding).

### Verificatie
- `node --check src/main.js` en `npm run build`: geslaagd.
- jsdom in de scratchpad, bundel opnieuw gebouwd:
  - `test.mjs` (bouwer): **60/60**
  - `extra.mjs` (tester): **38/38**
  - nieuw `herstel.mjs`: **36/36**. Dekt punt 1 (Esc, hover en focus op hetzelfde of een ander item, uitgeklapt geen effect, geen `pointer-events:none`), punt 2 (titel en focus voor alle pagina's, de knop "Beheer →", het kruimelpad, vanuit het paneel, de eerste render ongewijzigd, de titel na uitloggen), punt 8 (prototype-sleutels), punt 10 (`'` in de titel en het invoerveld, attribuut met enkele aanhalingstekens blijft dicht), punt 11 (externe uitlog met open paneel ruimt alles op; een mislukte `signOut` logt alleen de code en de shell blijft staan), punt 12 (geen @ in de accountregel) en punt 4 (`role="list"`).
- Contrast berekend (WCAG-formule): wit op #2F5658 8,10:1, wit op #46797B 4,90:1 (licht ongewijzigd), oud donker 2,38:1.
- grep op verwijderde namen: nog steeds 0. De devserver serveert de bestanden (200).
- Niet getest: weergave in de browser (tooltip-brug, Esc met de muis op een item, lage viewport, donkere modus). Dat staat op de handmatige lijst hierboven.

## Status
Herstelronde verwerkt. Klaar voor hercontrole.
