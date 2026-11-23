# Huisstijlrapport: CK-044 — Eén navigatie, zijmenu op elke pagina

Fase 5b, 22 november 2026. Gelezen: `src/style.css` (shell-blok r. 623–804, footer r. 229–244), `src/main.js` (r. 476–511 en 875–1064), `.claude/specs/CK-044-ontwerp.md` (incl. "Bijstelling Paul na het prototype"), `.claude/reports/CK-044-bouwverslag.md`. Geen code gewijzigd. Niet in een browser bekeken: alles hieronder is op basis van de code.

## Kleurgebruik
- ✅ Alle kleuren in het shell-blok lopen via tokens (`--petrol`, `--petrol-dark`, `--orange`, `--on-orange`, `--on-petrol`, `--surface`, `--card`, `--bg`, `--border`, `--text`, `--muted`). Geen hex-waarden in de nieuwe shell-CSS (r. 623–804), footer of `main.js`-shell (r. 875–1064).
- ✅ Er zijn geen nieuwe kleuren of tokens toegevoegd. Alleen `--kop-h` en `--logo-ruimte` (maten, geen kleuren).
- ✅ Actief item = `--card` + 4px `--orange` linkerrand + vet (`style.css` r. 697), conform ontwerp. Hover = `--card` + `--border`-rand (r. 696).
- ✅ Petrol balk met 4px oranje onderrand (r. 643–650), tekst en kompas `--on-petrol` (r. 651, 655). Footer petrol met `--on-petrol` (r. 231–232). Tooltip `--petrol-dark` met `--on-petrol` (r. 737).
- ✅ Focusringen: oranje 2px plus binnenlijn in `--text` of `--on-petrol` (r. 711–714), conform ontwerp. In het donkere thema volgen ze de tokens mee.
- 💡 Suggestie (niet blokkerend): drie `rgba(0,0,0,…)`-waarden staan buiten de tokens: tooltipschaduw `.18` (r. 739), paneelschaduw `.2` (r. 784), dimlaag `.45` (r. 797). Alleen de dimlaag is in het ontwerp als bewuste uitzondering benoemd; de twee schaduwen staan wel in de ontwerp-CSS maar niet in de tekst over "één niet-token-kleur". Overweeg een token (bijv. `--schaduw`, `--dim`) zodat de regel "geen hardcoded kleuren" zonder uitzonderingen geldt.
- ℹ️ Observatie (bestaand, niet CK-044): de tokenwaarden in `:root` wijken af van de waarden in de huisstijlregels van de opdracht (`--text` `#111212` i.p.v. `#1A1A2E`, `--muted` `#6F6E6E` i.p.v. `#6B7B8D`, r. 15–16). CK-044 gebruikt alleen de tokens en verandert hier niets aan. Alleen voor de beoordelaar: welke waarde leidend is, is een aparte vraag.
- ℹ️ Bekend en buiten scope (ontwerp en bouwverslag): in het donkere thema haalt wit op de lichte `--petrol` in balk en footer geen AA, zoals ook bij `.sectie-kop`.

## Typografie
- ✅ Alleen Barlow Semi Condensed (`@import` r. 1); `.zijmenu-item` zet `font-family: var(--font)` zodat `<button>`-items (Uitloggen, inklapknop) niet terugvallen op de systeemfont (r. 691). Geen nieuwe webfonts.
- ✅ Tekstgroottes via `--fs-*`: kopjes `--fs-label` (r. 683), items `--fs-lopend` (r. 691), accountregel `.naam-sessie` en inklapknop `--fs-toelichting` (r. 705, 707), tooltip `--fs-label` (r. 738), kruimelpad `--fs-toelichting` (r. 758), footer `--fs-label` (r. 239), overslaglink `--fs-lopend` (r. 635), titel op mobiel `--fs-paragraaf` (r. 777). Niets kleiner dan 12px.
- ✅ Gewichten 400/600/700 zijn allemaal geladen (r. 1); geen synthetische vetten in de shell.
- ✅ Bewuste uitzondering: titel in de balk 22px (r. 654), met commentaar en in het ontwerp/besluit 4 vastgelegd (herziet de 30px uit CK-031). Dit valt buiten `--fs-*` maar is goedgekeurd; regelhoogtes in px (26/22/18/17/16px) volgen de bestaande stijl van het bestand.
- ✅ Het oude 30px-`.app-icon`/`.app-title` voor de balk is vervangen door 24px/22px (r. 651–657). De basisregels `.app-icon`/`.app-title` (r. 74–84) blijven voor het inlogscherm in gebruik, dus geen dode CSS.

## Componenten
- ✅ **Petrol balk**: 52px incl. 4px oranje rand, kompas, titel (wit, afgekapt met ellipsis), logo 78px half over de balk (r. 661–664). Op mobiel 36px binnen de balk (r. 778). Zoals ontworpen.
- ✅ **Zijmenu**: 172px, `--surface`, 1px `--border`-rand; groepskoppen als uppercase `--muted`-label; items min. 44px hoog (aanraakdoel). Actief item en hover volgen het ontwerp (inclusief de bijstelling: wit + oranje balk + vet, niet petrol gevuld).
- ✅ **Tooltips (ingeklapt)**: `.naam` zelf wordt het label bij `:hover` én `:focus-visible` (r. 733–741), `--petrol-dark`, 4px radius (gelijk aan de bestaande 4px van formuliervelden), account in twee regels (r. 742–748). Geen `title`-attributen in het zijmenu (`main.js` r. 930–951).
- ✅ **Onderblok**: accountregel, Uitloggen, daaronder de inklapknop (volgorde conform bijstelling). Inklapknop in `--muted` en 13px, onderscheidt zich van de gewone items (r. 707). Dunne scheidingslijnen `--border` (r. 701, 707).
- ✅ **Uitschuifpaneel (mobiel)**: 260px, ✕ bovenin, dimlaag, `prefers-reduced-motion` respecteert (r. 802–804). Geen inklapknop op mobiel (r. 796).
- ✅ **Footer** volgt de bijstelling van Paul: links "clubKOMPAS · een product van SVN10", rechts "omgeving · Versie x.y.z" met bestaande tooltip (`main.js` r. 507–510), `display:flex; justify-content: space-between` (r. 234–236), midden leeg. Mobiel gestapeld en gecentreerd (r. 800). Geen links meer, dus de verwijdering van `footer a` is terecht. `margin-top: 0` zodat het zijmenu tot de footer doorloopt.
- ✅ **Pictogrammen**: alle zes nieuwe iconen (`huis`, `account`, `uitloggen`, `inklappen`, `menu`, `sluiten`) volgen dezelfde stijl als `plaat`/`persoon`/`vlag`: 48×48, `stroke="currentColor"`, lijndikte 3, ronde uiteinden, `aria-hidden` (`main.js` r. 878–891). Kleur volgt de tekstkleur van het element (petrol, muted of wit). Eén rendering-functie `menuIcoon()`, geen losse inline-SVG's. » is hetzelfde pictogram gespiegeld via CSS (r. 730), geen aparte path.
- 💡 Suggestie, pictogramgewicht (niet blokkerend): door de schaling is de gerenderde lijndikte niet overal gelijk: 18px-iconen ≈ 2,25px (r. 694), inklapknop 16px ≈ 1,9px (r. 708), ✕ 20px ≈ 1,9px (r. 795), ☰ 24px ≈ 1,5px (r. 775). Het ☰-icoon oogt dus dunner dan de menu-items en past juist wel bij het 1,5px-kompas ernaast. Houd je één gewicht aan, dan kan `stroke-width` per formaat worden bijgesteld. De maten zelf komen uit het ontwerp.
- 💡 Suggestie: `persoon` (Bestuursfuncties) en `account` (cirkel met persoon) zijn beide een personen-icoon. Ze verschillen door de cirkel en staan in aparte blokken, dus niet verwarrend. Alleen noteren voor als het menu groeit.
- ❌/⚠️ **Inline `style=""` (bestaand, niet door CK-044 toegevoegd)**: `main.js` r. 73 (`SOORT_KLEUR`, `background:var(--orange)`) en r. 542, r. 84 (`soortKeuzeHTML`), r. 528 (`leeg.style.color`), r. 862 (`text-align:right;margin-top:8px` op de Beheer-knop op Home). Strikt genomen in strijd met de regel "geen inline style"; r. 862 is Home-inhoud die in CK-044 is verplaatst en alleen bewust behouden volgens ontwerp-notitie 6. Het enige inline-gebruik in de nieuwe shell is `setProperty('--paneel-top', …)` (r. 1010), dynamisch noodzakelijk en dus toegestaan. `style="margin-top:0"` (r. 1070 e.v.) is expliciet door het ontwerp voorgeschreven. Advies: niet blokkerend voor CK-044; opruimen in een aparte backlogstory.
- ℹ️ Kaarten (`.card`) en `.pill` zijn niet door CK-044 aangeraakt. Ze wijken af van de huisstijlregel ("border-radius 12px, schaduw"): `.card` heeft geen radius of schaduw (r. 187–191). Dit is bestaand gedrag en geen gevolg van deze story, alleen als aandachtspunt voor de beoordelaar.

## Responsief gedrag
- ✅ Zijmarges ≥16px op mobiel: balk `padding-left: 8px` plus ☰-knop van 44px (icoon ruim >16px van de rand), kruimelpad 16px (r. 754, 779), `.wrap` 16px (r. 90), footer 16px (r. 233).
- ✅ Breakpoint ≤700 / ≥701 is consistent in de hele shell. Logo-ruimte 16/192/124px per situatie (r. 628–629, 768), zonder logo geen lege ruimte.
- ✅ Zijmenu op desktop sticky en 44px ingeklapt; mobiel paneel `max-width: calc(100vw - 48px)` zodat er altijd dimlaag zichtbaar blijft.
- ✅ Hoogte via flex en `--kop-h` (52px, 80px met omgevingsbalk) in plaats van het oude `calc(100vh - 160px)`.
- ℹ️ Kaartengrid (bestaand, `style.css` r. 510–515): 3 kolommen op desktop, 2 onder 900px, 1 onder 600px. Dat voldoet aan "1 kolom onder 480px" (strenger). Met een uitgeklapt zijmenu (172px) hebben de drie kaarten bij 1100px iets minder ruimte; controleren in de browser.
- ⚠️ Open punt uit ontwerp en bouwverslag, niet te beoordelen op code: de vaste `.domein-rij`-kolommen (ca. 900px, r. 539) passen waarschijnlijk niet in ca. 596px bij 768px met uitgeklapt menu. Paul moet dit op tst bekijken en zo nodig apart melden.
- ℹ️ Niet in een browser getest (breedtes, sticky, tooltippositie, logo-overlap, donkere modus). Zie de handmatige controlelijst in het bouwverslag, punten 1–10.

## Afwijkingen van het ontwerp (bouwverslag) en mijn oordeel
1. Footer als flex i.p.v. grid: terecht, volgt de bijstelling van Paul.
2. `footer a` verwijderd: terecht, geen links meer.
3. Kruimelpad-padding in de basisregel i.p.v. een override: zelfde effect, minder CSS.
4. `matchMedia?.` en hulpjes `navNaam`/`huidig`: geen invloed op de huisstijl.

## Blokkerend / niet-blokkerend
- Blokkerend: geen.
- Niet blokkerend: tokens voor de drie `rgba`-waarden; gewicht van de pictogrammen; bestaande inline styles en `.card`-afwijkingen (aparte story).

## Eindoordeel
✅ Voldoet aan huisstijl voor de CK-044 app-shell. Kleuren lopen via tokens zonder nieuwe kleuren, tekstgroottes via `--fs-*` (met de goedgekeurde 22px-uitzondering voor de titel), de pictogrammen zijn onderling consistent, en de footer, het actieve item en de inklapknop komen overeen met het ontwerp en Pauls bijstellingen. Er zijn alleen niet-blokkerende suggesties en bestaande punten buiten scope (zie boven). De beoordeling van de weergave in de browser blijft een handmatige controle voor Paul.
