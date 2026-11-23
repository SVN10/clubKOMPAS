# Specificatie: CK-044 — Eén navigatie, zijmenu op elke pagina

Intake 22 november 2026 · Story: `.claude/backlog.md` (CK-044) · Besluiten: `.claude/specs/CK-044-besluiten.md` · Laag: Platform (app-shell)

## 1. Wat wordt er gebouwd?

Eén app-shell voor alle ingelogde pagina's (Home, Domeinen, Bestuursfuncties, Club, Mijn account). De shell bestaat uit een petrol balk met kompas, titel en clublogo, een zijmenu met de groepen Overzicht en Beheer en onderaan account en uitloggen, een kruimelpad, de inhoud en een smalle footer. De witte titelbalk, de menu-items in de petrol balk (huisje en Beheer) en "naam · rol" in de footer verdwijnen. Op mobiel opent het zijmenu als uitschuifpaneel via een ☰-knop. CK-037 "Home zonder zijmenu" wordt teruggedraaid.

**Buiten scope:** P0d (rolafhankelijk tonen van Beheer, alleen voorbereiden), nieuwe pagina's (Vermogens enz.), routing met URL/hash, focus na paginawissel (blijft zoals nu), tussenschermen.

## Gebruikersreis (samenvatting)

1. De bestuurder logt in en komt op Home: links staat het zijmenu met Home actief, bovenaan de petrol balk met "clubKOMPAS · Hockey Club Alphen" en rechts het clublogo.
2. Via Beheer › Domeinen/Bestuursfuncties/Club wisselt de pagina. Zijmenu, balk en footer blijven gelijk, het actieve item en het kruimelpad lopen mee.
3. Klapt de bestuurder het menu in tot 44px, dan blijft die stand bewaard (`zijmenu-ingeklapt`).
4. Onderaan het zijmenu staan "naam · rol" (naar Mijn account) en Uitloggen.
5. Op de telefoon staat er een ☰ in de balk. Die opent het paneel, met Esc, ✕ of een tik op de achtergrond gaat het weer dicht, en de focus gaat terug naar ☰.

## 2. Inventaris

### `src/main.js`

| Functie / constante | Gebruikt in | Lot |
|---|---|---|
| `topBarHTML()` (r. 491) | renderDashboard, renderPijlersDomeinenBeheer, renderBestuursfunctiesBeheer, renderClubBeheer, renderMijnAccount | **Ombouwen:** wordt de petrol balk (☰-knop, kompas, titel, logo). Opgenomen in de shell. |
| `navHTML(actief)` (r. 507) | dezelfde 5 renders | **Vervalt** (huisje en Beheer verdwijnen uit de balk) |
| `sessieLabel()` (r. 516) | footerHTML, renderMijnAccount (r. 1741) | **Blijft.** Wordt gebruikt voor de accountregel in het zijmenu; commentaar aanpassen |
| `footerHTML()` (r. 523) | 5 renders | **Ombouwen:** links "clubKOMPAS · een product van SVN10", midden omgeving · versie (tooltip met project en bouwdatum, ongewijzigd), rechts leeg. `.footer-rechts`, `.footer-account` en `#uitlog-knop` gaan eruit |
| `bindNavListeners(gebruiker)` (r. 544) | 5 renders | **Vervalt.** Wordt `bindAppShell(gebruiker)`. Let op: `querySelector('.nav-home').addEventListener` en `getElementById('uitlog-knop')` crashen als die elementen weg zijn |
| `MENU_ICOON` / `menuIcoon()` (r. 932) | beheerZijmenuHTML | **Blijft en wordt uitgebreid:** `huis` (lijnstijl 48×48, vervangt het gevulde 20×20-huisje), `account` en `uitloggen`. `persoon` blijft bij Bestuursfuncties, dus account krijgt een eigen pictogram |
| `BEHEER_ITEMS` / `BEHEER_NAAM` (r. 941) | beheerZijmenuHTML, kruimels in 3 beheer-renders | **Ombouwen:** wordt `ZIJMENU` (data, zie §3). Kruimelnaam via een opzoekhulp |
| `zijmenuIngeklapt()` (r. 948) | beheerZijmenuHTML | **Blijft** (sleutel `zijmenu-ingeklapt` ongewijzigd) |
| `beheerZijmenuHTML(actief)` (r. 952) | 3 beheer-renders | **Ombouwen:** wordt `zijmenuHTML(actief)` |
| `kruimelpadHTML(delen)` (r. 965) | paginaLijfHTML | **Blijft** |
| `paginaLijfHTML({...})` (r. 974) | 3 beheer-renders + Mijn account | **Ombouwen:** gaat op in `appShellHTML` |
| `bindBeheerTabs(gebruiker)` (r. 989) | 3 beheer-renders (niet Mijn account) | **Ombouwen:** inklappen en navigatie gaan op in `bindAppShell` |
| `renderDashboard` (r. 886) | toonUitkomst, nav | **Ombouwen:** inhoud via `appShellHTML({ actief: 'home', ... })`. De knop "Beheer →" blijft |
| `renderMijnAccount` (r. 1654) | footer-link | **Ombouwen:** `actief: 'account'`. Na "Naam opslaan" de accountregel in het zijmenu bijwerken in plaats van `footer .footer-account` (r. 1740) |
| `toonOmgevingsBalk()` (r. 794) | start (r. 1809) | **Ongewijzigd.** Staat buiten `#app` (`body.prepend`) en overleeft dus elke render |
| `meldingenHTML`, `toonOk`, `toonFout`, `bindMeldblokken` (CK-023) | in de inhoud | **Ongewijzigd.** Ze zitten in `inhoud`, dus niet in de shell |
| `toonTussenkaart`, `renderInlogscherm`, `renderConfigFout` | tussenschermen | **Ongewijzigd** (geen shell) |
| `setFavicon` | toonUitkomst, uitloggen | **Ongewijzigd** |

### `src/style.css`

| Selector | Regel | Lot |
|---|---|---|
| `.top-bar` (wit, rand onder), `.top-bar.heeft-logo` | 74–83 | **Ombouwen:** petrol achtergrond, `border-bottom: 4px solid var(--orange)`, tekst `--on-petrol`. `heeft-logo` blijft als ruimte voor het logo |
| `.app-icon`, `.app-title` (basis petrol) | 84–94 | **Blijven** (ook gebruikt door `.inlog-logo` in de tussenschermen). Wit alleen via `.top-bar .app-icon/.app-title` |
| `.top-bar .app-title/.app-icon { 30px }` (CK-031-uitzondering) | 672–674 | **Ombouwen:** 22px, commentaar bijwerken. De uitzondering staat nu op 22px in plaats van 30px |
| `.top-nav`, `.top-nav a`, `:hover`, `.active` | 97–121 | **Vervalt** |
| `.top-nav a.nav-home` (+ svg) en commentaar | 752–755 | **Vervalt** |
| `footer` | 266–281 | **Blijft.** Raster `1fr auto 1fr` houdt het midden in het midden |
| `.footer-rechts`, `.footer-rechts .btn` | 282–296 | **Vervalt** |
| `.footer-account` (CK-036) | 690–693 | **Vervalt** |
| `.uitlog-knop` | 398 | **Vervalt** (alleen gebruikt in de footer; tussenschermen gebruiken `.inlog-knop`). Uitloggen in het zijmenu krijgt de zijmenu-itemstijl |
| `.club-logo` | 484–492 | **Ombouwen:** verticaal centreren op de onderrand van de petrol balk, `max-width` erbij |
| `.app-lijf` (`min-height: calc(100vh - 160px)`), `.app-kolom` | 696–698 | **Blijven, aanpassen:** hoogte via flex (`#app` flex-kolom, `.app-lijf { flex: 1 }`) in plaats van het magische getal 160px. Dat getal klopt niet meer met of zonder omgevingsbalk |
| `.zijmenu*` | 699–729 | **Blijft, uitbreiden:** groepskopjes, accountblok onderaan, sticky, `.naam` ingeklapt als sr-only in plaats van `display:none` |
| `.kruimelpad*` | 731–742 | **Blijft.** Ruimte rechts voor het logo |
| mobiel `@media (max-width: 700px)` zijmenu-als-rij | 744–750 | **Vervalt.** Vervangen door de regels voor het uitschuifpaneel |
| P0e-blok `.omgeving-balk*`, `:has(> .inlog-wrap)` | 757–790 | **Ongewijzigd** |
| CK-023-blok `.meldingen`, `.melding*` | 825–848 | **Ongewijzigd** |

## 3. Voorgestelde aanpak

### Eén shell

```js
appShellHTML({ actief, kruimels, inhoud })   // actief: 'home'|'domeinen'|'functies'|'club'|'account'
bindAppShell(gebruiker)                       // na elke render; vervangt bindNavListeners + bindBeheerTabs
```

Opbouw (volgorde in de DOM):

```
<header class="top-bar [heeft-logo]">  ☰-knop (alleen mobiel zichtbaar) · kompas · titel · logo
<div class="app-lijf">
  <nav class="zijmenu" id="zijmenu" aria-label="Hoofdmenu">
     [inklapknop] · groep Overzicht · groep Beheer · (onderaan) account · uitloggen · [✕ mobiel]
  <div class="zijmenu-achtergrond" hidden></div>
  <div class="app-kolom">  kruimelpad · <main><div class="wrap">inhoud</div></main>
<footer>
```

Alle vijf renders roepen `appShellHTML` aan. Daarna volgen `bindAppShell(gebruiker)` en, waar nodig, `bindMeldblokken()` zoals nu. De `style="margin-top:0"` op de eerste sectie blijft.

### Zijmenu als data

```js
const ZIJMENU = [
  { id: 'overzicht', kop: 'Overzicht', zichtbaar: () => true, items: [
    { id: 'home', naam: 'Home', ico: 'huis' },
  ]},
  { id: 'beheer', kop: 'Beheer', zichtbaar: () => true /* P0d: huidigeRol === 'beheerder' */, items: [
    { id: 'domeinen', naam: 'Domeinen', ico: 'plaat' },
    { id: 'functies', naam: 'Bestuursfuncties', ico: 'persoon' },
    { id: 'club', naam: 'Club', ico: 'vlag' },
  ]},
]
```

- Groep en item hebben elk een optionele `zichtbaar()`. Voor P0d hoeft dan maar één regel te veranderen.
- Nog niet gebouwde items (Vermogens, Activiteiten, Seizoensplanner, Documenten) komen **niet** als lege plekken in de lijst. Ze worden toegevoegd zodra ze gebouwd zijn: één regel plus een doel. Zo blijft er geen dode code staan. Vermogens (CK-020/CK-021) komt in Overzicht.
- Eén navigatietabel voor zijmenu, kruimelpad en accountregel:
  `const NAV_DOEL = { home: renderDashboard, beheer: renderPijlersDomeinenBeheer, domeinen: renderPijlersDomeinenBeheer, functies: renderBestuursfunctiesBeheer, club: renderClubBeheer, account: renderMijnAccount }`.
  Alle links krijgen `data-nav="<id>"`, en `bindAppShell` heeft één klikhandler op `#app` voor `[data-nav]`.
- Markup per groep: `<span class="zijmenu-kop" id="zm-kop-beheer">Beheer</span><ul aria-labelledby="zm-kop-beheer">…</ul>`. Geen `<h2>`, anders raakt de koppenstructuur van de pagina vervuild. Het actieve item krijgt `aria-current="page"`.
- **Ingeklapt (44px):** kopjes worden een dunne scheidingslijn (visueel verborgen, voor schermlezers blijft de groepsnaam). `.naam` wordt `sr-only` in plaats van `display:none`, zodat de toegankelijke naam niet alleen op `title` leunt. `title` per item blijft voor de tooltip.
- **Onderaan** (`margin-top: auto` in een flex-kolom): een link "naam · rol" (`data-nav="account"`, pictogram `account`, `aria-current` op Mijn account) en een knop **Uitloggen** (`signOut(auth)`, pictogram `uitloggen`). Ingeklapt alleen de pictogrammen, met tooltip en sr-only tekst.
- **Sticky:** de binnenkant van het zijmenu `position: sticky; top: 0; max-height: 100vh; overflow-y: auto`. Zo blijven account en uitloggen in beeld op lange pagina's zoals Domeinen (zie open vraag 2).

### Petrol balk en logo

- `.top-bar`: petrol, 4px oranje onderrand, kompas en titel wit op 22px, padding ca. 11px 16px (hoogte ca. 48px + 4px).
- Clublogo: `position: absolute; right: 16px; height: 78px; max-width: 160px`, verticaal gecentreerd op de onderrand van de balk (`top: calc(100% - 39px)`, dus half over de balk en half over de pagina). `z-index` boven kruimelpad en zijmenu, onder het mobiele paneel.
- Ruimte voor het logo: alleen als er een logo is (`heeft-logo` op `#app` of de shell) krijgen `.top-bar` en `.kruimelpad` `padding-right` gelijk aan logobreedte + marge (CSS-variabele `--logo-ruimte`, bijv. 180px). Het logo steekt ca. 39px de pagina in en valt dus over het kruimelpad (44px). Het kruimelpad is dan de enige "eerste inhoud" die ruimte moet laten, en de inhoud eronder blijft vrij.
- Mobiel (≤700px): logo binnen de balk, bijv. 36px hoog, `top: 50%; transform: translateY(-50%)`, kleinere `--logo-ruimte`. Titel met `text-overflow: ellipsis`, zodat een lange clubnaam niet onder het logo loopt.

### Footer

- Links "clubKOMPAS · een product van SVN10", midden "Omgeving · Versie x" met de bestaande tooltip, rechts leeg (het raster houdt het midden in het midden). Naam · rol en Uitloggen verdwijnen.
- De footer blijft over de volle breedte onder `.app-lijf` (niet in de kolom), zoals nu.

### Mobiel uitschuifpaneel (≤700px, zelfde breekpunt als nu)

- ☰-knop in de balk: `<button class="menu-knop" aria-expanded="false" aria-controls="zijmenu" aria-label="Menu openen">`. Op desktop verborgen.
- Paneel = hetzelfde `nav#zijmenu` (één DOM, geen kopie). Op mobiel `position: fixed`, links, breedte ca. 260px, altijd uitgeklapt (de inklapknop is verborgen en `ingeklapt` wordt genegeerd). In gesloten toestand `visibility: hidden` plus transform. Daardoor niet bereikbaar met Tab en niet zichtbaar voor schermlezers. Met `prefers-reduced-motion` zonder animatie.
- **Openen:** `.open` op het paneel, `hidden` van de achtergrond af, `aria-expanded="true"`. `inert` op `.top-bar`, `.app-kolom`, `footer` en `.omgeving-balk`. `body.paneel-open { overflow: hidden }`. Focus naar het eerste item (of de ✕-knop "Menu sluiten" bovenaan het paneel).
- **Bovenkant:** het paneel begint onder de omgevingsbalk als die in beeld is (`top = max(0, balk.getBoundingClientRect().bottom)` bij openen). Zo blijft besluit 9 overeind.
- **Sluiten:** Esc, ✕, klik op de achtergrond, of een klik op een menu-item. Dan alles terugdraaien (inert eraf, scroll-lock eraf) en focus terug naar ☰, behalve bij navigatie, omdat de nieuwe render de DOM toch vervangt.
- **Eén keer binden, niet per render:** de Esc-listener op `document` en een `matchMedia('(min-width: 701px)')`-listener die een open paneel sluit bij draaien of vergroten. Die horen op module-niveau, anders stapelen ze zich bij elke render op.
- **Opruimen bij elke render:** `appShellHTML`/`bindAppShell` haalt `body.paneel-open` en `inert` van `.omgeving-balk` weg. Die staan buiten `#app` en blijven anders hangen na navigatie vanuit het paneel of na uitloggen.

### Tussenschermen

Inloggen, laden, geen club, configuratiefout en club-laden-mislukt blijven via `toonTussenkaart`/`renderInlogscherm` werken, zonder shell en zonder zijmenu. Daar verandert niets.

### CSS-opruiming

Alles wat in §2 op "Vervalt" staat, gaat echt weg. Daarna met `grep` per selector controleren dat er geen verwijzing meer naar is (`top-nav`, `nav-home`, `nav-beheer`, `footer-rechts`, `footer-account`, `uitlog-knop`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `bindNavListeners`, `BEHEER_ITEMS`).

## Betrokken bestanden

- `src/main.js`: shell, zijmenu-data, navigatietabel, mobiel paneel, 5 renders omzetten, accountregel bijwerken na naamwijziging
- `src/style.css`: top-bar petrol, logo, zijmenu (groepen, onderblok, sticky, mobiel paneel, achtergrond), footer, opruimen
- `.claude/backlog.md`: CK-037 en CK-031 (uitzondering 22px) met een verwijzing naar CK-044 bijwerken bij oplevering

## 4. Acceptatiecriteria (testen op tst: desktop ≥1200px, ~768px, ~400px)

- [ ] **Elke ingelogde pagina** (Home, Domeinen, Bestuursfuncties, Club, Mijn account) toont dezelfde petrol balk (kompas en "club**KOMPAS** · clubnaam" wit, 22px, oranje onderrand), hetzelfde zijmenu met kopjes Overzicht (Home) en Beheer (Domeinen, Bestuursfuncties, Club), het juiste actieve item (`aria-current="page"`, petrol) en het kruimelpad. De witte titelbalk, het huisje en "Beheer" in de balk zijn weg. Tussenschermen hebben geen zijmenu.
- [ ] **Inklappen** tot 44px werkt op elke pagina, ook op Home. De stand blijft bewaard na herladen en bij paginawissel (`zijmenu-ingeklapt`). Ingeklapt heeft elk pictogram een tooltip en een naam voor VoiceOver.
- [ ] **Onderaan het zijmenu** staat "naam · rol", dat naar Mijn account gaat (actief op die pagina), en Uitloggen, dat uitlogt naar het inlogscherm met het standaard-favicon. Na "Naam opslaan" toont de accountregel direct de nieuwe naam. De footer toont links "clubKOMPAS · een product van SVN10" en in het midden omgeving · versie met tooltip, zonder naam · rol of uitlogknop.
- [ ] **Clublogo:** 78px rechtsboven, half over de balk en half over het kruimelpad. Het overlapt geen titel, kruimel of eerste inhoud op desktop en op 768px, met het menu in- en uitgeklapt, ook met een lange clubnaam en een breed logo. Op ~400px staat het kleiner binnen de balk. Zonder logo is er geen lege ruimte rechts.
- [ ] **Mobiel (~400px):** ☰ opent het paneel. `aria-expanded` wisselt, `aria-controls="zijmenu"`, de focus gaat het paneel in, en Tab blijft in het paneel (de rest is `inert`). Esc, ✕ en een tik op de achtergrond sluiten het paneel en zetten de focus terug op ☰. Een menu-item kiezen opent de pagina met het paneel dicht en de pagina weer scrollbaar. Bij vergroten naar desktop met een open paneel sluit het paneel netjes.
- [ ] **Toetsenbord en VoiceOver (desktop en mobiel):** alles bereikbaar met Tab in een logische volgorde (balk, zijmenu, kruimelpad, inhoud, footer) met zichtbare oranje focusrand. VoiceOver noemt "Hoofdmenu", de groepsnamen Overzicht en Beheer, en "huidige pagina" bij het actieve item.
- [ ] **Niets verschoven:** de omgevingsbalk (Test/Ontwikkel/Productie lokaal) staat boven de petrol balk en wordt niet door het paneel bedekt. CK-023/CK-025-meldingen (ok, fout, "Opnieuw inloggen", bevestiging na opnieuw tekenen bij Club) verschijnen op dezelfde plek en één keer. In de CSS staan geen selectors meer zonder gebruik.

## 5. Risico's en wat niet mag breken

- **CK-023/CK-025-meldingen:** de live regions zitten in `inhoud` en blijven ongewijzigd. Risico: een extra wrapper of een aangepaste `main`/`.wrap`-padding verschuift `--meld-gap`. Controleer de focus na opnieuw tekenen (`CLUB_SUCCES`, `focusInLijst`): de nieuwe shell mag geen eigen `autofocus` of focus-steal doen.
- **P0e/P0f-omgevingsbalk:** staat buiten `#app` en blijft na elke render staan. Die mag niet geraakt worden door `#app.innerHTML`. Het mobiele paneel mag er niet overheen vallen, en `inert` erop moet altijd weer weg. `document.title` uit `toonOmgevingsBalk` blijft.
- **Logo-overlap:** variabele logobreedte (`width: auto`). Zonder `max-width` en `--logo-ruimte` loopt een breed logo over titel of kruimelpad. Ook letten op het kruimelpad, dat nu `overflow: hidden` heeft. Het logo valt erover heen, het hoort niet erin te zitten (z-index).
- **Favicon:** `setFavicon` blijft onaangeroerd. Uitloggen vanuit het zijmenu moet via dezelfde `signOut` → `onAuthStateChanged` lopen, zodat het favicon wordt teruggezet.
- **Crash door oude selectors:** `bindNavListeners` gebruikt `querySelector(...).addEventListener` zonder `?.`. Bij een half doorgevoerde ombouw breekt elke pagina. Daarom `bindNavListeners` helemaal weghalen, niet laten staan.
- **Listener-opstapeling:** de document-brede Esc- en matchMedia-listeners maar één keer binden.
- **Hangende toestand buiten `#app`:** `body.paneel-open` en `inert` op de omgevingsbalk bij elke render resetten.
- **Hoogte:** `min-height: calc(100vh - 160px)` vervangen door flex. Anders zweeft de footer of springt het zijmenu, met of zonder omgevingsbalk.
- **768px:** 172px zijmenu plus inhoud ca. 596px. Het domeinen-raster (2 kolommen ≤900px) en de beheer-rijen controleren met het menu uitgeklapt.
- **Gedeelde klassen:** `.app-icon`/`.app-title` worden ook in de tussenschermen gebruikt (`.inlog-logo`). Wit maken alleen binnen `.top-bar`.

## Architectuurlaag

Platform (P0-app-shell): generiek voor elke club en elke toekomstige pagina. Groepen en items zijn data, en P0d hangt er later een rolvoorwaarde aan.

## 6. Open vragen voor Paul

1. **Kruimelpad op Home:** alleen "Home" (als huidige pagina) tonen, of geen kruimelpad op Home?
   *Advies:* wel "Home" tonen. Elke pagina heeft dan dezelfde opbouw en het logo valt overal op dezelfde balk.
2. **Zijmenu bij lange pagina's:** sticky, zodat account en uitloggen altijd in beeld zijn, of meescrollen met de pagina, zodat ze onderaan pas na scrollen verschijnen?
   *Advies:* sticky. Anders staat "naam · rol / Uitloggen" op Domeinen ver onder de vouw.
3. **Breekpunt voor het uitschuifpaneel:** ≤700px zoals nu (dan krijgt 768px het gewone zijmenu, in- of uitklapbaar), of hoger, bijv. ≤900px (dan krijgt een tablet ook ☰)?
   *Advies:* 700px houden. Dat sluit aan bij de bestaande mobiele regels, en op 768px past het zijmenu, ingeklapt zeker.
4. **Pictogrammen voor account en uitloggen:** "persoon" is al van Bestuursfuncties. Akkoord met een nieuw lijnpictogram voor account (persoon in cirkel) en een uitgang-pijl voor uitloggen, in dezelfde mockup-stijl (48×48, lijn 3)?
   *Advies:* ja. Bestuursfuncties houdt "persoon", zodat bestaande herkenning blijft.

## Antwoorden van Paul (22 november 2026)
1. Kruimelpad op Home toont "Home". **Akkoord.**
2. Zijmenu sticky (blijft in beeld bij scrollen). **Akkoord.**
3. Breekpunt uitschuifpaneel ≤700px. **Akkoord.**
4. Nieuwe lijnpictogrammen voor account en uitloggen; Bestuursfuncties houdt "persoon". **Akkoord.**

## Bijstellingen na de gebruikersreis (22 november 2026)
Overgenomen uit `.claude/specs/CK-044-gebruikersreis.md`:
1. Accountregel met verborgen voorvoegsel "Mijn account, "; ingeklapt tooltip "Mijn account".
2. Overslaglink **"Direct naar inhoud"** als eerste element (alleen zichtbaar bij focus) naar `main#inhoud` (`tabindex="-1"`).
3. Ingeklapt: tooltip ook bij toetsenbordfocus (CSS-label bij `:hover` en `:focus-visible`), niet alleen `title`.
4. Inklapknop: `aria-label` wisselt "Menu inklappen"/"Menu uitklappen" (geen `aria-expanded`).
5. ☰-knop: label "Menu openen" met `aria-expanded`; bij openen focus naar ✕ "Menu sluiten"; bij sluiten terug naar ☰.
6. Kruimelpad: `nav aria-label="Kruimelpad"`, `aria-current="page"` op het laatste deel.
7. Titel op alle breedtes afkappen met "…"; clublogo `alt=""` (naam staat al in de titel).
8. **Uitloggen zonder bevestiging**, apart onderaan met scheidingslijn, minstens 44px tikruimte op mobiel.
9. Standaard **uitgeklapt** als er geen opgeslagen stand is.
Bekende beperking: focus na paginawissel blijft zoals nu (latere story).
