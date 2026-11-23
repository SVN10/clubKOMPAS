# Ontwerp: CK-044 — Eén navigatie, zijmenu op elke pagina

Fase 3 (ontwerp), 22 november 2026 · Spec: `CK-044-zijmenu.md` · Reis: `CK-044-gebruikersreis.md` · Besluiten: `CK-044-besluiten.md`

**Voorrang:** bij verschil geldt dit document. Twee bewuste afwijkingen van de gebruikersreis, op basis van Pauls schetsen:
1. **Actief item = wit (`--card`) met 4px oranje linkerrand en vet**, niet petrol gevuld.
2. **De inklapknop staat onderaan** (onder Uitloggen), niet bovenaan. Daardoor tab je eerst door de items en pas daarna langs de knop.

---

## Schermen

Er is één shell voor Home, Domeinen, Bestuursfuncties, Club en Mijn account. Alleen `actief`, `kruimels` en `inhoud` verschillen per pagina.

| Pagina | `actief` | Kruimelpad |
|---|---|---|
| Home | `home` | `[['Home']]` |
| Domeinen | `domeinen` | `[['Home','home'],['Beheer','beheer'],['Domeinen']]` |
| Bestuursfuncties | `functies` | `[['Home','home'],['Beheer','beheer'],['Bestuursfuncties']]` |
| Club | `club` | `[['Home','home'],['Beheer','beheer'],['Club']]` |
| Mijn account | `account` | `[['Home','home'],['Mijn account']]` |

### Desktop (≥701px), uitgeklapt

```
┌ omgevingsbalk (alleen tst/dev, ongewijzigd) ─────────────────────────────┐
├ petrol 48px ─────────────────────────────────────────────────┬─────────┐ │
│ ◎ clubKOMPAS · Hockey Club Alphen…                           │  LOGO   │ │
╞ oranje 4px ══════════════════════════════════════════════════│  78px   │═╡
│ zijmenu 172px  │ Home › Beheer › Domeinen          (ruimte)  └─────────┘ │
│ OVERZICHT      ├──────────────────────────────────────────────────────── │
│ ⌂ Home         │ inhoud (.wrap, max 1100px)                              │
│ BEHEER         │                                                         │
│▌▦ Domeinen     │   ▌ = actief: wit, oranje linkerrand 4px, vet            │
│ ♙ Bestuursf.   │                                                         │
│ ⚑ Club         │                                                         │
│ ───────────    │                                                         │
│ ◉ Jan de Vries │                                                         │
│   · beheerder  │                                                         │
│ ⇥ Uitloggen    │                                                         │
│ ───────────    │                                                         │
│ « Menu inkl.   │                                                         │
├ footer petrol: CLUBKOMPAS · EEN PRODUCT VAN SVN10 │ TEST · VERSIE 0.5.0 ──┤
```

### Desktop, ingeklapt (44px)
Alleen pictogrammen. De kopjes worden visueel een dunne lijn tussen de groepen (de naam blijft voor schermlezers). Bij `:hover` en `:focus-visible` verschijnt rechts van het pictogram een label in `--petrol-dark` (tooltip). De inklapknop toont » met het label "Menu uitklappen".

### Mobiel (≤700px)
De balk toont ☰, het kompas, de titel (afgekapt) en het logo van 36px binnen de balk. Er staat geen zijmenu in beeld. Bij openen schuift een paneel van 260px van links in, onder de omgevingsbalk, met een gedimde achtergrond. Bovenin het paneel staat ✕, daarna dezelfde groepen en het onderblok. Er is geen inklapknop.

---

## Markup van de app-shell

`appShellHTML({ actief, kruimels, inhoud })` levert precies dit (de waarden komen via `esc()`):

```html
<div class="app-shell heeft-logo">                      <!-- heeft-logo alleen als veiligLogo() iets geeft -->
  <a class="overslaan" href="#inhoud">Direct naar inhoud</a>

  <header class="top-bar">
    <button class="menu-knop" type="button" aria-controls="zijmenu" aria-expanded="false" aria-label="Menu openen">
      ${menuIcoon('menu')}
    </button>
    ${kompasIconSVG()}
    <span class="app-title">club<b>KOMPAS</b> · Hockey Club Alphen</span>   <!-- zonder clubnaam: club<b>KOMPAS</b> -->
    <img src="…" class="club-logo" alt="">
  </header>

  <div class="app-lijf">
    <nav class="zijmenu ingeklapt" id="zijmenu" aria-label="Hoofdmenu">   <!-- ingeklapt alleen als zijmenuIngeklapt() -->
      <div class="zijmenu-binnen">
        <div class="zijmenu-paneelkop">
          <button class="zijmenu-sluit" type="button" aria-label="Menu sluiten">${menuIcoon('sluiten')}</button>
        </div>

        <div class="zijmenu-groep" data-groep="overzicht">
          <span class="zijmenu-kop" id="zm-kop-overzicht">Overzicht</span>
          <ul aria-labelledby="zm-kop-overzicht">
            <li><a href="#" class="zijmenu-item" data-nav="home" aria-current="page">${menuIcoon('huis')}<span class="naam">Home</span></a></li>
          </ul>
        </div>

        <div class="zijmenu-groep" data-groep="beheer">
          <span class="zijmenu-kop" id="zm-kop-beheer">Beheer</span>
          <ul aria-labelledby="zm-kop-beheer">
            <li><a href="#" class="zijmenu-item" data-nav="domeinen">${menuIcoon('plaat')}<span class="naam">Domeinen</span></a></li>
            <li><a href="#" class="zijmenu-item" data-nav="functies">${menuIcoon('persoon')}<span class="naam">Bestuursfuncties</span></a></li>
            <li><a href="#" class="zijmenu-item" data-nav="club">${menuIcoon('vlag')}<span class="naam">Club</span></a></li>
          </ul>
        </div>

        <div class="zijmenu-onder">
          <a href="#" class="zijmenu-item zijmenu-account" data-nav="account">
            ${menuIcoon('account')}
            <span class="naam"><span class="naam-voor">Mijn account<span class="sr-only">, </span></span><span class="naam-sessie">Jan de Vries · beheerder</span></span>
          </a>
          <button class="zijmenu-item zijmenu-uitlog" type="button">${menuIcoon('uitloggen')}<span class="naam">Uitloggen</span></button>
          <button class="zijmenu-item zijmenu-knop" type="button">${menuIcoon('inklappen')}<span class="naam">Menu inklappen</span></button>
        </div>
      </div>
    </nav>
    <div class="zijmenu-achtergrond" hidden></div>

    <div class="app-kolom">
      ${kruimelpadHTML(kruimels)}            <!-- ongewijzigd: nav.kruimelpad aria-label="Kruimelpad", laatste deel aria-current="page" -->
      <main id="inhoud" tabindex="-1">
        <div class="wrap">${inhoud}</div>
      </main>
    </div>
  </div>

  ${footerHTML()}
</div>
```

Regels:
- `aria-current="page"` komt op precies één `.zijmenu-item`, namelijk het item met `data-nav === actief`. Ook de accountregel telt mee bij `actief: 'account'`.
- **Geen `title`-attributen** op zijmenu-items. De `.naam` is zowel de toegankelijke naam als de tooltip, zodat VoiceOver niets dubbel hoort.
- **Inklapknop:** de tekst van `.naam` wisselt tussen "Menu inklappen" en "Menu uitklappen". Dat is de toegankelijke naam. Er komt geen `aria-label` en geen `aria-expanded` op.
- **Uitloggen** krijgt geen `id`. Gebruik de klasse `.zijmenu-uitlog`, zodat `uitlog-knop` na de opruiming nergens meer voorkomt.
- Kopjes zijn `<span>` en geen `<h2>`.

## Pictogrammen

Alle pictogrammen gaan via `menuIcoon(naam)`: viewBox 48×48, `fill="none" stroke="currentColor" stroke-width="3" round`, `aria-hidden="true"`. `plaat`, `persoon` en `vlag` blijven ongewijzigd. Voeg aan `MENU_ICOON` toe:

```js
huis:      '<path d="M7 22 L24 8 L41 22"/><path d="M11 19 V40 H37 V19"/><path d="M20 40 V29 H28 V40"/>',
account:   '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="20" r="6"/><path d="M13 36.5 C15.5 31 19.5 29 24 29 C28.5 29 32.5 31 35 36.5"/>',
uitloggen: '<path d="M20 8 H10 a2 2 0 0 0 -2 2 V38 a2 2 0 0 0 2 2 H20"/><path d="M19 24 H40"/><path d="M32 16 L40 24 L32 32"/>',
inklappen: '<path d="M24 12 L12 24 L24 36"/><path d="M36 12 L24 24 L36 36"/>',
menu:      '<path d="M8 13 H40"/><path d="M8 24 H40"/><path d="M8 35 H40"/>',
sluiten:   '<path d="M12 12 L36 36"/><path d="M36 12 L12 36"/>',
```

Uitklappen (») gebruikt hetzelfde `inklappen`-pictogram, gespiegeld via CSS (`scaleX(-1)`). Er wordt dus geen path meer gewisseld in JS. Het gevulde 20×20-huisje en de 20×20-driehoekjes van de oude knop vervallen.

## Teksten en labels

| Element | Zichtbaar | Toegankelijke naam / tooltip |
|---|---|---|
| Overslaglink | "Direct naar inhoud" (alleen bij focus) | idem |
| ☰ | pictogram | "Menu openen" + `aria-expanded` |
| ✕ | pictogram | "Menu sluiten" |
| Zijmenu | — | "Hoofdmenu" |
| Kopjes | OVERZICHT, BEHEER | idem (ingeklapt verborgen tekst) |
| Items | Home, Domeinen, Bestuursfuncties, Club | idem; ingeklapt tooltip |
| Accountregel | `sessieLabel()` ("Jan de Vries · beheerder", max. 2 regels) | "Mijn account, Jan de Vries · beheerder"; ingeklapt tooltip in twee regels: **Mijn account** / Jan de Vries · beheerder |
| Uitloggen | Uitloggen | idem, zonder bevestiging |
| Inklapknop | Menu inklappen / Menu uitklappen | idem |
| Clublogo | — | `alt=""` |

---

## Nieuwe CSS

Alles gebruikt bestaande tokens. Er komen twee shell-variabelen bij (`--kop-h`, `--logo-ruimte`) en één niet-token-kleur: de dimlaag `rgba(0,0,0,.45)`. Die is bewust gekozen, omdat de dimlaag in licht en donker thema even donker moet zijn. Vervang het blok "Zijmenu en kruimelpad (CK-037)" (r. 695–755) en de oude `.top-bar`/`.club-logo`-regels door het volgende. Zie §Opruimen voor wat er precies weggaat.

```css
/* ── App-shell (CK-044) ── */
:root { --kop-h: 52px; }                              /* hoogte petrol balk incl. oranje rand */
body.met-omgeving-balk { --kop-h: 80px; }             /* + omgevingsbalk 28px */

#app:has(> .app-shell) { flex: 1; display: flex; flex-direction: column; }
.app-shell { flex: 1; display: flex; flex-direction: column; position: relative; --logo-ruimte: 16px; }
.app-shell.heeft-logo { --logo-ruimte: 192px; }      /* max-width logo 160 + rechts 16 + lucht 16 */

/* Overslaglink */
.overslaan {
  position: absolute; left: 16px; top: 8px; z-index: 50;
  background: var(--orange); color: var(--on-orange);
  font-size: var(--fs-lopend); font-weight: 700; text-decoration: none;
  padding: 8px 14px;
}
.overslaan:not(:focus) { width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.overslaan:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
.app-kolom > main:focus { outline: none; }

/* Petrol balk */
.top-bar {
  position: relative;
  height: var(--kop-h-balk, 52px); box-sizing: border-box;
  display: flex; align-items: center; gap: 10px;
  padding: 0 var(--logo-ruimte) 0 16px;
  background: var(--petrol); color: var(--on-petrol);
  border-bottom: 4px solid var(--orange);
}
.top-bar .app-icon { width: 24px; height: 24px; color: var(--on-petrol); }
.top-bar .app-title {
  flex: 1 1 auto; min-width: 0;
  font-size: 22px; line-height: 26px;               /* bewuste uitzondering op de tekstschaal (herziet CK-031) */
  color: var(--on-petrol);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.menu-knop { display: none; }

/* Clublogo: verticaal gecentreerd op de onderrand van de balk (13 + 39 = 52) */
.club-logo {
  position: absolute; top: 13px; right: 16px; z-index: 3;
  height: 78px; width: auto; max-width: 160px; object-fit: contain;
}

/* Lijf */
.app-lijf { flex: 1; display: flex; align-items: stretch; }
.app-kolom { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.app-kolom > main { flex: 1; padding-bottom: 32px; }   /* neemt de margin-top van de footer over */

/* Zijmenu */
.zijmenu { width: 172px; flex: none; background: var(--surface); border-right: 1px solid var(--border); }
.zijmenu-binnen {
  position: sticky; top: 0; z-index: 5;
  height: min(100%, calc(100dvh - var(--kop-h)));
  display: flex; flex-direction: column;
  overflow-y: auto; padding-top: 4px;
}
.zijmenu-paneelkop { display: none; }
.zijmenu-groep ul { list-style: none; }
.zijmenu-kop {
  display: block; padding: 12px 12px 4px 16px;      /* 16 = rand 4 + padding 12: lijnt uit met de pictogrammen */
  font-size: var(--fs-label); line-height: 16px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
}
.zijmenu-item {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  width: 100%; min-height: 44px; padding: 0 12px;
  border: 0; border-left: 4px solid transparent; background: transparent;
  color: var(--petrol); font-family: var(--font); font-size: var(--fs-lopend); line-height: 18px;
  text-align: left; text-decoration: none; cursor: pointer;
}
.zijmenu-item svg { width: 18px; height: 18px; flex: none; }
.zijmenu-item .naam { min-width: 0; }
.zijmenu-item:hover { background: var(--card); border-left-color: var(--border); }
.zijmenu-item[aria-current="page"] { background: var(--card); border-left-color: var(--orange); font-weight: 700; }

/* Onderblok: account + uitloggen, daaronder de inklapknop */
.zijmenu-onder { margin-top: auto; padding-top: 8px; }
.zijmenu-account { border-top: 1px solid var(--border); padding-block: 8px; }
.naam-voor { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.naam-sessie {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  overflow-wrap: anywhere; font-size: var(--fs-toelichting); line-height: 17px;
}
.zijmenu-knop { border-top: 1px solid var(--border); color: var(--muted); font-size: var(--fs-toelichting); }
.zijmenu-knop svg { width: 16px; height: 16px; }

/* Focusringen in de shell: oranje 2px + 1px donkere binnenlijn (contrast ≥3:1 op wit/surface) */
.zijmenu-item:focus-visible,
.zijmenu-sluit:focus-visible { outline: 2px solid var(--orange); outline-offset: -2px; box-shadow: inset 0 0 0 3px var(--text); }
.menu-knop:focus-visible     { outline: 2px solid var(--orange); outline-offset: -2px; box-shadow: inset 0 0 0 3px var(--on-petrol); }
.kruimel:focus-visible       { outline: 2px solid var(--orange); outline-offset: 2px; box-shadow: 0 0 0 2px var(--text); }

/* Ingeklapt: alleen op desktop; op mobiel wordt .ingeklapt genegeerd */
@media (min-width: 701px) {
  .zijmenu.ingeklapt { width: 44px; }
  .zijmenu.ingeklapt .zijmenu-binnen { overflow: visible; }       /* anders knipt de tooltip af */
  .zijmenu.ingeklapt .zijmenu-kop,
  .zijmenu.ingeklapt .zijmenu-item .naam {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  .zijmenu.ingeklapt .zijmenu-groep + .zijmenu-groep::before {
    content: ""; display: block; height: 1px; margin: 8px 10px; background: var(--border);
  }
  .zijmenu.ingeklapt .zijmenu-item { justify-content: center; gap: 0; padding: 0 4px 0 0; }  /* 4px rechts compenseert de linkerrand */
  .zijmenu.ingeklapt .zijmenu-account { padding-block: 0; }
  .zijmenu.ingeklapt .zijmenu-knop svg { transform: scaleX(-1); }

  /* Tooltip = de .naam zelf, bij hover en toetsenbordfocus */
  .zijmenu.ingeklapt .zijmenu-item:is(:hover, :focus-visible) .naam {
    left: calc(100% + 8px); top: 50%; transform: translateY(-50%);
    width: auto; height: auto; margin: 0; padding: 4px 8px;
    overflow: visible; clip-path: none; white-space: nowrap;
    background: var(--petrol-dark); color: var(--on-petrol);
    font-size: var(--fs-label); line-height: 16px; font-weight: 600;
    border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,.18);
    z-index: 40; pointer-events: none;
  }
  .zijmenu.ingeklapt .zijmenu-account:is(:hover, :focus-visible) .naam-voor {
    position: static; display: block; width: auto; height: auto; margin: 0;
    overflow: visible; clip-path: none; font-weight: 700;
  }
  .zijmenu.ingeklapt .zijmenu-account:is(:hover, :focus-visible) .naam-sessie {
    display: block; -webkit-line-clamp: unset; font-size: var(--fs-label); line-height: 16px; font-weight: 400;
  }
  .zijmenu-achtergrond { display: none; }
}

/* Kruimelpad: ruimte voor het logo */
.kruimelpad { padding-right: var(--logo-ruimte); }     /* overschrijft alleen de rechterkant van de bestaande padding 0 16px */

/* Mobiel: uitschuifpaneel */
@media (max-width: 700px) {
  .app-shell.heeft-logo { --logo-ruimte: 124px; }    /* logo 96 + 16 + 12 */
  .top-bar { padding-left: 8px; gap: 8px; }
  .menu-knop {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; flex: none;
    background: transparent; border: 0; color: var(--on-petrol); cursor: pointer;
  }
  .menu-knop svg { width: 24px; height: 24px; }
  .top-bar .app-icon { width: 22px; height: 22px; }
  .top-bar .app-title { font-size: var(--fs-paragraaf); line-height: 22px; }
  .club-logo { top: 6px; height: 36px; max-width: 96px; }   /* binnen de balk: (48 - 36) / 2 */
  .kruimelpad { padding-right: 16px; }

  .zijmenu {
    position: fixed; top: var(--paneel-top, 0px); bottom: 0; left: 0; z-index: 30;
    width: 260px; max-width: calc(100vw - 48px);
    box-shadow: 4px 0 16px rgba(0,0,0,.2);
    transform: translateX(-100%); visibility: hidden;
    transition: transform .2s ease, visibility 0s linear .2s;
  }
  .zijmenu.open { transform: none; visibility: visible; transition: transform .2s ease, visibility 0s; }
  .zijmenu-binnen { position: static; height: 100%; padding-top: 0; }
  .zijmenu-paneelkop { display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); }
  .zijmenu-sluit {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; background: transparent; border: 0; color: var(--petrol); cursor: pointer;
  }
  .zijmenu-sluit svg { width: 20px; height: 20px; }
  .zijmenu-knop { display: none; }
  .zijmenu-achtergrond { position: fixed; inset: var(--paneel-top, 0px) 0 0 0; z-index: 20; background: rgba(0,0,0,.45); }
  body.paneel-open { overflow: hidden; }

  footer { grid-template-columns: 1fr; justify-items: center; text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .zijmenu, .zijmenu.open { transition: none; }
}
```

Correctie op de code hierboven: in `.top-bar` mag gewoon `height: 52px` staan (de `var(--kop-h-balk, 52px)` is niet nodig). `--kop-h` blijft de enige variabele voor de hoogte.

Aanpassingen in bestaande regels:
- `footer`: `margin-top: 32px` wordt `margin-top: 0`, zodat het zijmenu tot aan de footer doorloopt.
- `.top-bar .app-title/.app-icon { 30px }` (r. 672–674) vervalt. Hij is vervangen door de 22px/24px hierboven.

## Contrast (licht thema)

| Combinatie | Ratio | Oordeel |
|---|---|---|
| Wit op `--petrol` (balk, footer) | 4,9 : 1 | AA voor gewone tekst |
| `--petrol` op `--surface` (items) | 4,5 : 1 | AA, precies op de grens. Daarom geen lichtere tekst en geen kleinere letter dan 13px in het menu |
| `--petrol` op `--card` (actief item) | 4,9 : 1 | AA |
| `--muted` op `--surface` (kopjes, inklapknop) | 4,6 : 1 | AA |
| Wit op `--petrol-dark` (tooltip) | 6,5 : 1 | AA |
| `--orange` op `--surface` / `--petrol` (focusring) | 1,9 / 2,4 : 1 | Te laag op zichzelf, **daarom de donkere (of op de balk witte) binnenlijn** in de focusring |

Het actief-signaal leunt niet alleen op de oranje rand: het item is ook vet, heeft een witte achtergrond en `aria-current`.

**Bekend, buiten scope:** in het donkere thema wordt `--petrol` licht (#7DB1B3). Wit daarop haalt geen AA. Dat geldt al voor `.sectie-kop` en de footer. De balk volgt hetzelfde token en dit gaat mee in dezelfde latere fix.

## Toegankelijkheid

- **Focusvolgorde desktop:** Direct naar inhoud → Home → Domeinen → Bestuursfuncties → Club → accountregel → Uitloggen → Menu inklappen → kruimelpadlinks → inhoud → footer. ☰ en ✕ staan op `display:none` en zijn dus niet tabbaar.
- **Focusvolgorde mobiel, paneel dicht:** Direct naar inhoud → ☰ → kruimelpad → inhoud → footer. Het gesloten paneel is `visibility:hidden` en dus niet tabbaar.
- **Paneel open:** focus naar ✕. Daarna ✕ → items → accountregel → Uitloggen. `inert` staat op `.overslaan`, `.top-bar`, `.app-kolom`, `footer` en `.omgeving-balk`.
- **Sluiten** met Esc, ✕ of klik op `.zijmenu-achtergrond`. Daarna gaat de focus terug naar ☰. Bij een item, de accountregel of Uitloggen gaat het paneel dicht zonder focus terug te zetten (de nieuwe render vervangt de DOM).
- `aria-expanded` staat alleen op ☰. `aria-current="page"` staat op het actieve zijmenu-item en op het laatste deel van het kruimelpad.
- **Overslaglink:** de klik wordt in JS afgehandeld met `preventDefault()` en daarna `document.getElementById('inhoud').focus()`. Zo komt er geen `#inhoud` in de URL.
- Er komt geen `autofocus` en geen focus-steal bij het renderen. De focus na opnieuw tekenen (CK-025, `focusInLijst`) blijft ongemoeid.

## Footer

`footerHTML()` levert alleen nog twee spans. Het raster `1fr auto 1fr` zet het midden vanzelf in het midden:

```html
<footer>
  <span>clubKOMPAS · een product van SVN10</span>
  <span title="…ongewijzigd…">${label} · Versie ${version}</span>
</footer>
```

`.footer-rechts`, `.footer-account` en de uitlogknop gaan eruit. Op ≤700px staat alles gestapeld en gecentreerd.

## Responsief gedrag

| Breedte | Balk | Logo | Zijmenu |
|---|---|---|---|
| ≥1200px | 52px, titel 22px | 78px, half over de balk en half over het kruimelpad, `--logo-ruimte` 192px | 172px of 44px, sticky |
| ~768px | idem; titel past (ca. 526px ruimte) | idem | idem (172px laat ca. 596px voor de inhoud over) |
| ≤700px | ☰ + titel 18px, afgekapt | 36px binnen de balk, `--logo-ruimte` 124px | uitschuifpaneel 260px, altijd uitgeklapt |
| geen logo | `--logo-ruimte` 16px | — | — |

Het logo loopt van 13px tot 91px. De balk eindigt op 52px en het kruimelpad op 96px, dus het logo blijft 5px boven de eerste inhoud.

**Aandachtspunt (bestaand, al zo sinds CK-037):** de vaste `.domein-rij`-kolommen (ca. 900px) passen niet in 596px. Controleer dit op 768px met het menu uitgeklapt. Valt het tegen, dan meld je het als aparte bevinding en los je het niet op in deze story.

---

## Implementatienotities voor de bouwer

1. **Data en navigatie**
   ```js
   const ZIJMENU = [
     { id: 'overzicht', kop: 'Overzicht', items: [ { id: 'home', naam: 'Home', ico: 'huis' } ] },
     { id: 'beheer', kop: 'Beheer', zichtbaar: () => true /* P0d: huidigeRol === 'beheerder' */, items: [
       { id: 'domeinen', naam: 'Domeinen', ico: 'plaat' },
       { id: 'functies', naam: 'Bestuursfuncties', ico: 'persoon' },
       { id: 'club', naam: 'Club', ico: 'vlag' },
     ]},
   ]
   const zichtbaar = x => x.zichtbaar ? x.zichtbaar() : true
   const NAV_DOEL = { home: renderDashboard, beheer: renderPijlersDomeinenBeheer, domeinen: renderPijlersDomeinenBeheer,
     functies: renderBestuursfunctiesBeheer, club: renderClubBeheer, account: renderMijnAccount }
   ```
   `zijmenuHTML(actief)` filtert groepen en items met `zichtbaar()`. Een groep zonder zichtbare items wordt niet getekend. Kruimelnamen haal je uit `ZIJMENU` in plaats van uit `BEHEER_NAAM`.

2. **`appShellHTML({ actief, kruimels, inhoud })`** levert de markup hierboven. Elke render doet `#app.innerHTML = appShellHTML(...)` en roept daarna `bindAppShell(gebruiker)` aan. Waar nodig volgt `bindMeldblokken()`, zoals nu. De `style="margin-top:0"` op de eerste sectie blijft.

3. **`bindAppShell(gebruiker)`**: één klikhandler op `.app-shell`. Dat element wordt per render vervangen, dus listeners stapelen niet op. Bind **niet** op `#app`.
   ```js
   function bindAppShell(gebruiker) {
     sluitPaneel({ focus: false })                       // ruimt body.paneel-open en inert (ook op .omgeving-balk) op
     const shell = document.querySelector('.app-shell')
     shell.addEventListener('click', e => {
       const t = e.target
       if (t.closest('.overslaan')) { e.preventDefault(); document.getElementById('inhoud').focus(); return }
       if (t.closest('.menu-knop')) { openPaneel(); return }
       if (t.closest('.zijmenu-sluit') || t.closest('.zijmenu-achtergrond')) { sluitPaneel(); return }
       if (t.closest('.zijmenu-uitlog')) { sluitPaneel({ focus: false }); signOut(auth); return }
       const knop = t.closest('.zijmenu-knop')
       if (knop) {
         const nav = shell.querySelector('.zijmenu')
         const klein = !nav.classList.contains('ingeklapt')
         try { localStorage.setItem('zijmenu-ingeklapt', klein ? '1' : '0') } catch {}
         nav.classList.toggle('ingeklapt', klein)
         knop.querySelector('.naam').textContent = klein ? 'Menu uitklappen' : 'Menu inklappen'
         return
       }
       const link = t.closest('[data-nav]')
       if (link && NAV_DOEL[link.dataset.nav]) { e.preventDefault(); sluitPaneel({ focus: false }); NAV_DOEL[link.dataset.nav](gebruiker) }
     })
   }
   ```

4. **Paneel** (module-niveau):
   ```js
   const PANEEL_INERT = ['.overslaan', '.top-bar', '.app-kolom', 'footer', '.omgeving-balk']
   function openPaneel() {
     const nav = document.getElementById('zijmenu'); if (!nav) return
     const balk = document.querySelector('.omgeving-balk')
     const top = Math.max(0, balk ? balk.getBoundingClientRect().bottom : 0)
     document.querySelector('.app-shell').style.setProperty('--paneel-top', `${top}px`)
     nav.classList.add('open')
     document.querySelector('.zijmenu-achtergrond').hidden = false
     document.querySelector('.menu-knop').setAttribute('aria-expanded', 'true')
     PANEEL_INERT.forEach(s => document.querySelector(s)?.setAttribute('inert', ''))
     document.body.classList.add('paneel-open')
     nav.querySelector('.zijmenu-sluit').focus()
   }
   function sluitPaneel({ focus = true } = {}) {
     document.body.classList.remove('paneel-open')
     PANEEL_INERT.forEach(s => document.querySelector(s)?.removeAttribute('inert'))
     const nav = document.getElementById('zijmenu')
     if (!nav?.classList.contains('open')) return
     nav.classList.remove('open')
     document.querySelector('.zijmenu-achtergrond').hidden = true
     const knop = document.querySelector('.menu-knop')
     knop.setAttribute('aria-expanded', 'false')
     if (focus) knop.focus()
   }
   // Eén keer binden, niet per render
   document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.zijmenu.open')) sluitPaneel() })
   matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) sluitPaneel({ focus: false }) })
   ```

5. **Mijn account:** na "Naam opslaan" komt er `document.querySelector('.zijmenu-account .naam-sessie').textContent = sessieLabel()` in plaats van de footer-regel (r. 1740–1741). Werk ook het commentaar bij `sessieLabel()` en bij `renderMijnAccount` bij ("via de accountregel in het zijmenu").

6. **Home:** de knop "Beheer →" en de eigen listener ervan blijven. `renderStructuurGrid()` blijft ongewijzigd.

7. **Opruimen, `src/main.js`:** verwijder `navHTML`, `bindNavListeners`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `BEHEER_ITEMS` en `BEHEER_NAAM`. `topBarHTML` gaat op in `appShellHTML`, of blijft als hulpfunctie zonder `heeft-logo` op de header. De klasse staat nu op `.app-shell`.

8. **Opruimen, `src/style.css`:**
   - `.top-bar` (oud, r. 74–83, incl. `.top-bar.heeft-logo`)
   - `.top-nav*` (r. 96–121)
   - `.footer-rechts*` (r. 282–296)
   - `.uitlog-knop` (r. 398)
   - `.club-logo` (oud, r. 484–492)
   - CK-031-uitzondering (r. 672–674)
   - `.footer-account*` (r. 690–693)
   - het oude zijmenublok `.app-lijf` t/m `.zijmenu.ingeklapt a svg` (r. 696–729)
   - de mobiele zijmenu-als-rij (r. 744–750)
   - `.top-nav a.nav-home` (r. 752–755)

   `.kruimelpad`, `.kruimel`, `.kruimel-sep` en `.kruimel-huidig` blijven (r. 731–742). Verwijder alleen `.kruimel:focus-visible` uit de samengestelde regel van r. 725, want die vervalt met dat blok en staat nu in de shell-CSS. Controleer daarna met grep dat deze namen nergens meer voorkomen: `top-nav`, `nav-home`, `nav-beheer`, `footer-rechts`, `footer-account`, `uitlog-knop`, `data-beheer`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `bindNavListeners`, `BEHEER_ITEMS`, `BEHEER_NAAM`.

9. **Ongewijzigd laten:** `toonOmgevingsBalk`, de tussenschermen (`toonTussenkaart` zonder shell), `meldingenHTML`, `toonOk`, `toonFout`, `bindMeldblokken`, `setFavicon`, `.wrap`, het P0e-blok en het CK-023-blok.

10. **Testen:** ≥1200px, 768px en 400px, met het menu in- en uitgeklapt, met en zonder omgevingsbalk, met een lange clubnaam, met een breed logo en zonder logo. Toetsenbord: Tab, Esc en de overslaglink. VoiceOver: "Hoofdmenu", de groepsnamen, "huidige pagina" en "Mijn account, …".

## Bijstelling Paul na het prototype (22 november 2026)
- **Footer:** links "clubKOMPAS · een product van SVN10", **rechts "omgeving · Versie x.y.z"** (met de bestaande tooltip). Het midden blijft leeg; gebruik twee kolommen (`justify-content: space-between`). Op mobiel gestapeld en gecentreerd zoals ontworpen.
