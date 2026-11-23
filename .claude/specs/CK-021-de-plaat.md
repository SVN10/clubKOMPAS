# Specificatie: CK-021 De plaat (Vermogensoverzicht)

Route "middel": intake en ontwerp in één spec. Bron: `CK-020-bron-vermogensoverzicht.md` (opbouw van de PDF-plaat HCA v1.4), `CK-020-besluiten.md` (besluit 4, 8, 17), besluiten Paul 23-11-2026.

## Wat wordt er gebouwd?
Een alleen-lezen pagina **Vermogens** (zijmenu, groep Overzicht, onder Home) die de vermogens van de club toont zoals op de PDF-plaat: de pijlers als kolommen bovenaan, de ondersteunende domeinen eronder, en de overkoepelende domeinen (Projecten, Samenwerkingen) als aparte blokken zonder vermogens. Per domein staat de eindverantwoordelijke bestuursfunctie. Geen bewerkingen, geen doorklikken naar beheer. Daarnaast: het Home-kerncijfer "Vermogens" wordt een link naar de plaat en het beheeritem heet voortaan **Vermogens beheren**.

## Scope
- Nieuwe pagina `renderPlaat(gebruiker)`, menu-id `vermogens`, nieuw pictogram.
- Home: kerncijfer Vermogens wordt een link (`data-nav="vermogens"`).
- Beheeritem `vermogensbeheer` heet "Vermogens beheren" (menu, kruimelpad, documenttitel, `h2` van die pagina).
- Lege toestanden, laadmelding, laadfout met **Opnieuw laden**.
- CSS-sectie "De plaat (CK-021)" onderaan `src/style.css`.
- Documentatie bijwerken: `.claude/docs/CK-020-technisch.md` (naam beheeritem), `.claude/docs/CK-044-technisch.md` (voorbeeld "Een menu-item toevoegen" is nu echt), CHANGELOG, backlog.

## Niet in scope
- Geen nieuw datamodel, geen nieuwe velden, geen wijziging in `firestore.rules` (lezen van `structuurelementen`, `vermogens` en `bestuursfuncties` mag al voor `isLid`).
- Geen "Hoofdsponsor #HCA…"-vak bij de pijlers (staat niet in de data).
- Geen losse projecten of partners onder Projecten/Samenwerkingen (staan niet in de data; alleen de `omschrijving` van het domein).
- Geen "in voorbereiding" (CK-038), geen onderliggende vermogens (CK-039), geen omschrijving per vermogen.
- Geen links naar Domeinen of Vermogens beheren vanuit de plaat (ook niet in lege toestanden).
- Geen afdrukweergave of PDF-export (mogelijk vervolgpunt).
- Geen realtime bijwerken (`onSnapshot`): de pagina leest bij openen, zoals de andere pagina's.

## Gebruikersreis (samenvatting)
1. Lid opent **Vermogens** in het zijmenu (of klikt op het kerncijfer Vermogens op Home).
2. Ziet "De plaat wordt geladen...", daarna de plaat: pijlers, ondersteunende domeinen, overkoepelende domeinen.
3. Leest per domein de eindverantwoordelijke en de vermogens in de vaste volgorde.
4. Wil hij iets wijzigen, dan gaat hij zelf via het zijmenu naar **Vermogens beheren**.

## Databronnen
Drie leesacties bij het openen, parallel:

| Bron | Functie (bestaand) | Gebruikte velden |
|---|---|---|
| `clubs/{clubId}/structuurelementen` | `laadStructuurelementen()` (main.js r. 135), al gesorteerd met `sorteerDomeinen` | `id`, `type` (`pijler` / `domein` / `overkoepelend`), `naam`, `hashtag`, `omschrijving`, `icoon`, `bestuursfunctieId`, `volgorde` |
| `clubs/{clubId}/vermogens` | `laadVermogens(db, clubId)` (vermogens.js r. 67) | `id`, `naam`, `domeinId`, `volgorde` |
| `clubs/{clubId}/bestuursfuncties` | `laadBestuursfuncties()` (main.js r. 155) | `id`, `naam` |

- Groeperen op `domeinId`; per domein sorteren met `sorteerDomeinen()` (volgorde, daarna naam, `nl`). Domeinvolgorde komt uit `laadStructuurelementen()`.
- Indeling op `type`: `pijler` → rij Pijlers, `domein` → rij Ondersteunende domeinen, `overkoepelend` → blok Overkoepelende domeinen. Gebruik `KAN_VERMOGENS` voor "kan vermogens hebben".
- Eindverantwoordelijke: `functieNaam.get(domein.bestuursfunctieId)` (zelfde `Map` als in `renderPijlersDomeinenBeheer`, r. 1203–1204).
- **Domeinen en vermogens** laden met `Promise.all` (beide nodig; mislukt er één, dan laadfout). **Bestuursfuncties** apart via `Promise.allSettled`: mislukt dat, dan de plaat zonder namen van eindverantwoordelijken (zie Teksten), net als Home bij vermogens.
- `clubId` vastleggen bij openen (`const clubId = huidigClubId`), zoals `renderVermogensBeheer`.
- Vermogens waarvan `domeinId` niet naar een pijler of ondersteunend domein wijst (verweesd, of bij een overkoepelend domein) staan niet op de plaat en tellen niet mee; wel één voetnoot (zie Teksten). Dit is hetzelfde als het Home-cijfer.

## Lay-out

### Pagina-opbouw (binnen `appShellHTML`)
```
.pagina-kop > h1.pagina-titel "Vermogens<b>overzicht</b>"
#plaat (container)
  .sectie.plaat-sectie            Pijlers               [toel: 13 vermogens]
    ul.plaat-rij.plaat-pijlers    li.plaat-domein.pijler × n   (kolommen)
  .sectie.plaat-sectie            Ondersteunende domeinen [toel: 45 vermogens]
    ul.plaat-rij.plaat-steun      li.plaat-domein.steun × n
  .sectie.plaat-sectie            Overkoepelende domeinen [toel: zonder vermogens]
    ul.plaat-rij.plaat-over       li.plaat-domein.over × n
  p.lijst-voetnoot (alleen bij verweesde vermogens)
```
- Kruimelpad: `[['Home', 'home'], [navNaam('vermogens')]]`; `actief: 'vermogens'`.
- Elke sectie gebruikt de bestaande `.sectie` / `.sectie-kop` (petrol vlak, oranje onderrand, `h2`) / `.sectie-lijf`. Als `div`, **niet** `section`: geen extra region-landmarks (vervolgpunt CK-020).
- Een sectie zonder domeinen wordt niet getekend (bijv. club zonder overkoepelende domeinen).

### Domeinkaart (`li.plaat-domein`)
```
h3.plaat-kop   [pictogram 22px] NAAM
p.plaat-sub    #HCASpeelt                (alleen bij hashtag)
p.plaat-verantw  Eindverantwoordelijke: Bestuurslid Hockey
ul.plaat-vermogens  li.plaat-vermogen × n   (tegels, onder elkaar)
  of p.plaat-leeg "Nog geen vermogens"
```
Overkoepelende kaart: kop, eindverantwoordelijke, `p.plaat-omschrijving` (de `omschrijving`), geen vermogenslijst.

### Desktop (container `#plaat` ≥ 700px)
- **Pijlers:** `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`. Bij 3 pijlers drie gelijke kolommen; vermogenstegels onder elkaar in de kolom, zoals op de plaat. Kaarten in één rij even hoog (`align-items: stretch`).
- **Ondersteunende domeinen:** `repeat(auto-fill, minmax(170px, 1fr))`; bij de normale breedte (zijmenu uitgeklapt, ~1000px inhoud) 5 per rij, dus 10 domeinen in 2 rijen, zoals de plaat. Kaarten per rij even hoog.
- **Overkoepelende domeinen:** `repeat(auto-fill, minmax(240px, 1fr))`, kaarten naast elkaar.
- Container query op `#plaat` (`container-type: inline-size`), niet op het scherm: het zijmenu bepaalt de breedte (zelfde afspraak als CK-044/CK-020).

### Smal (container `#plaat` < 520px, o.a. telefoon 375px)
- Alle drie rijen één kolom (`grid-template-columns: 1fr`).
- Tegels compacter (padding 4px 8px). Alles blijft uitgeklapt (zie open vraag 3).
- Tussen 520 en 700px: pijlers 2 kolommen of meer volgens `auto-fit`; geen extra regel nodig.

## Componenten en CSS-klassen
Nieuwe sectie `/* ── De plaat (CK-021) ── */` onderaan `src/style.css` (na r. 1042). Alleen bestaande tokens.

| Klasse | Stijl |
|---|---|
| `#plaat` | `container-type: inline-size; display: flex; flex-direction: column; gap: 0` (de `.sectie` heeft al `margin-bottom: 20px`) |
| `.plaat-rij` | `list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; align-items: stretch`; kolommen per variant zoals hierboven |
| `.plaat-domein` | `background: var(--card); border: 1px solid var(--border); border-top: 4px solid var(--petrol); padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; min-width: 0` |
| `.plaat-domein.steun` | `border-top-color: var(--orange)` (zelfde kleurcode als `SOORT_KLEUR`) |
| `.plaat-domein.over` | `border-top-color: var(--muted)`. **Geen gestippelde rand**: dat betekent op de PDF "in voorbereiding" (CK-038) |
| `.plaat-kop` | als `.groep-kop` zonder onderrand: `display: flex; align-items: center; gap: 8px; font-size: var(--fs-lopend); line-height: 19px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--petrol); overflow-wrap: anywhere`. Pictogram met bestaande `pictogramHTML(d, 'picto-klein')` (22px) |
| `.plaat-sub` | `font-size: var(--fs-toelichting); font-style: italic; color: var(--muted)` (zoals `.card .sub`) |
| `.plaat-verantw` | `font-size: var(--fs-label); line-height: 16px; letter-spacing: .04em; color: var(--muted)`; de functienaam in `<strong>` met `color: var(--text); font-weight: 600` |
| `.plaat-vermogens` | `list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px` |
| `.plaat-vermogen` | `background: var(--surface); border: 1px solid var(--border); padding: 5px 8px; font-size: var(--fs-toelichting); line-height: 18px; color: var(--text); overflow-wrap: anywhere` |
| `.plaat-leeg` | als `.card .kaart-vermogens.leeg`: `font-size: var(--fs-toelichting); font-style: italic; color: var(--muted)` |
| `.plaat-omschrijving` | `font-size: var(--fs-toelichting); line-height: 18px; color: var(--text)` (niet afgekapt, anders dan op Home) |
| `@container (max-width: 520px)` | `.plaat-rij { grid-template-columns: 1fr }`, `.plaat-vermogen { padding: 4px 8px }` |
| `.cijfer-link` | Home: `a.cijfer` met `text-decoration: none; color: inherit`; `:hover` `border-color: var(--petrol)` en `.l` onderstreept; `:focus-visible` de bestaande oranje focusring (zoals `.tussen-link:focus-visible`, r. 386). De pijl staat in de HTML als `<span aria-hidden="true"> →</span>` achter het label |

Hergebruik zonder wijziging: `.pagina-kop`, `.pagina-titel`, `.sectie*`, `.sectie-kop .toel`, `.picto-klein`, `.lijst-laden`, `.lijst-voetnoot`, `.leeg-blok`, `.meldingen .melding .melding-fout .melding-actie`, `.tussen-hint`, `.sr-only`.

Licht en donker: alle kleuren via tokens; `--petrol` op `--card` haalt in beide thema's ≥ 4,5:1. Geen `--petrol` als vlak met witte tekst (sectiekop gebruikt al `--petrol-vlak`).

## Pictogram (voorstel)
Nieuwe sleutel `tegels` in `MENU_ICOON`: een raster van 3×3 vakjes, het beeld van "alles op één plaat", duidelijk anders dan `plaat` (vier kolommen, Domeinen) en `puzzel` (Vermogens beheren, blijft).
```js
tegels: '<rect x="7" y="7" width="9" height="9" rx="1.5"/><rect x="19.5" y="7" width="9" height="9" rx="1.5"/><rect x="32" y="7" width="9" height="9" rx="1.5"/><rect x="7" y="19.5" width="9" height="9" rx="1.5"/><rect x="19.5" y="19.5" width="9" height="9" rx="1.5"/><rect x="32" y="19.5" width="9" height="9" rx="1.5"/><rect x="7" y="32" width="9" height="9" rx="1.5"/><rect x="19.5" y="32" width="9" height="9" rx="1.5"/><rect x="32" y="32" width="9" height="9" rx="1.5"/>',
```
Controleren op 18px (ingeklapt menu): vakjes niet dichtgelopen. Lukt dat niet, dan 2×3 (bovenste rij drie smalle, onderste rij twee brede vakjes = pijlers boven, domeinen onder).

## Teksten

| Plek | Tekst |
|---|---|
| Menu-item | Vermogens |
| Beheeritem (was "Vermogens") | Vermogens beheren |
| `h1` | Vermogens**overzicht** (`Vermogens<b>overzicht</b>`, zelfde vorm als Home "Domeinen**overzicht**") |
| Documenttitel | via `paginaTitel(navNaam('vermogens'))` = "Vermogens" |
| Laden | De plaat wordt geladen... |
| Sectiekoppen (`h2`) | Pijlers · Ondersteunende domeinen · Overkoepelende domeinen |
| `.toel` Pijlers / Ondersteunend | `vermogensTekst(n)` ("13 vermogens", "1 vermogen"); bij 0: "nog geen vermogens" |
| `.toel` Overkoepelend | zonder vermogens |
| Eindverantwoordelijke | Eindverantwoordelijke: **Voorzitter** |
| Geen of onbekende functie | Eindverantwoordelijke: **nog niet gekozen** |
| Bestuursfuncties niet geladen | regel weggelaten op alle kaarten + één `p.vermogens-hint` (`role="status"`) boven de plaat: "De eindverantwoordelijken konden niet worden geladen. Herlaad de pagina om het opnieuw te proberen." |
| Domein zonder vermogens | Nog geen vermogens |
| Overkoepelend zonder omschrijving | geen omschrijvingsregel |
| Verweesde vermogens (n ≥ 1) | "1 vermogen hoort niet bij een pijler of ondersteunend domein en staat daarom niet op de plaat." / "n vermogens horen ..." |
| Geen pijlers en geen ondersteunende domeinen (`.leeg-blok`) | **Nog geen domeinen** — "De plaat toont de pijlers en ondersteunende domeinen van de club met hun vermogens. Die zijn er nog niet; ze worden toegevoegd via Beheer." (geen knop of link). Overkoepelende domeinen worden dan wel nog getoond |
| Wel domeinen, nul vermogens (`.leeg-blok` boven de plaat) | **Nog geen vermogens** — "Een vermogen is iets wat de club moet kunnen om een domein te laten werken. Ze worden toegevoegd via Beheer → Vermogens beheren." Daaronder de plaat met per kaart "Nog geen vermogens" en de eindverantwoordelijken |
| Laadfout (`.melding-fout`, `role="alert"`) | De plaat kon niet worden geladen. Controleer je verbinding en probeer het opnieuw. [Opnieuw laden] |
| Laadfout, test/ontwikkel, `permission-denied` (`.tussen-hint`) | Testomgeving: zijn de Firestore-regels voor vermogens al gepubliceerd? |

Alle namen via `esc()` (namen mogen `& ' ( )` bevatten).

## Toegankelijkheid
- **Precies één `h1`** (de paginatitel). Daaronder `h2` per sectie (in `.sectie-kop`), `h3` per domein. Geen kopniveaus overslaan.
- Domeinen per rij in een `ul role="list"`, vermogens per domein in een `ul role="list"` (`list-style: none` haalt in Safari/VoiceOver anders de lijstsemantiek weg; zelfde aanpak als het zijmenu). Schermlezer hoort "lijst, 7 items" na de kop; geen extra aantal per kaart nodig.
- Geen `section`, `article` of `aria-label` op de kaarten of secties: geen extra landmarks. Enige landmarks blijven die van de shell.
- Geen interactieve elementen op de plaat behalve **Opnieuw laden** bij een laadfout. Tabvolgorde gaat dus van zijmenu direct naar de footer.
- Laden: `.lijst-laden` als gewone tekst (zoals Vermogens beheren). Laadfout: `role="alert"`. Na geslaagd opnieuw laden: focus op `#inhoud` (`focus({ preventScroll: true })`); mislukt het weer, focus op de nieuwe knop `#plaat-herlaad`. Knop tijdens laden: "Bezig..." met `aria-disabled="true"` (patroon r. 1920–1927).
- Pictogrammen `alt=""` `aria-hidden` (bestaande `pictogramHTML`).
- Home-kerncijfer als `<a href="#" class="cijfer cijfer-link" data-nav="vermogens">`: toegankelijke naam = inhoud ("58 Vermogens"); tijdens laden "wordt geladen Vermogens", bij fout "niet geladen Vermogens" (bestaande sr-teksten). De link blijft altijd werken; de plaat heeft eigen foutafhandeling.
- Herschikken op smal scherm alleen via grid, DOM-volgorde = leesvolgorde (pijlers, ondersteunend, overkoepelend).

## Betrokken bestanden en te wijzigen plekken

`src/main.js` (regelnummers stand v0.7.0, commit 4ea3dae):
- **r. 968–981 `MENU_ICOON`**: sleutel `tegels` toevoegen.
- **r. 987–997 `ZIJMENU`**: na r. 989 (`home`) `{ id: 'vermogens', naam: 'Vermogens', ico: 'tegels' },`; r. 993 `naam: 'Vermogens'` → `naam: 'Vermogens beheren'`.
- **r. 1002–1010 `NAV_DOEL`**: `['vermogens', renderPlaat],` na `home`.
- **r. 941 `renderDashboard`**: `div.cijfer` van vermogens wordt `<a href="#" class="cijfer cijfer-link" data-nav="vermogens">…<span class="l">Vermogens<span aria-hidden="true"> →</span></span></a>`. De `id="cijfer-vermogens"` blijft op de `span.n`, zodat `renderStructuurGrid` (r. 586–605) ongewijzigd werkt. Klik loopt via de bestaande `data-nav`-handler in `bindAppShell` (r. 1194–1197, doet `preventDefault`). De andere drie cijfers blijven `div`.
- **r. 1631 `renderVermogensBeheer`**: `<h2>Vermogens</h2>` → `<h2>Vermogens beheren</h2>`. Kruimelpad en documenttitel volgen vanzelf via `navNaam('vermogensbeheer')`.
- **Nieuw: `async function renderPlaat(gebruiker)`**, in een eigen blok `// ── Vermogens: de plaat (CK-021) ──` direct na `renderDashboard` (vóór r. 965). Opbouw:
  1. `appShellHTML({ actief: 'vermogens', kruimels, inhoud })` met `.pagina-kop`, `p#plaat-hint.vermogens-hint[role=status]` en `div#plaat` met de laadtekst; `bindAppShell(gebruiker)`.
  2. `laadEnTeken()`: `Promise.all([laadStructuurelementen(), laadVermogens(db, clubId)])` plus `laadBestuursfuncties()` via `allSettled`; bij fout `console.error('Plaat laden mislukt:', e?.code)` en `toonLaadfout(e)` (kopie van r. 1792–1800 met eigen id `plaat-herlaad` en tekst "De plaat kon…").
  3. `if (!plaatEl.isConnected) return` na elke `await` (gebruiker kan intussen weg zijn genavigeerd).
  4. Pure hulpfuncties `plaatSectieHTML(kop, toel, klasse, kaarten)` en `plaatKaartHTML(d, lijst, functieNaam)`; HTML via template strings met `esc()`.
  5. Klikhandler op `#plaat` alleen voor `#plaat-herlaad`.
- Hergebruik: `sorteerDomeinen`, `vermogensTekst` (r. 192), `pictogramHTML`, `KAN_VERMOGENS`, `SOORT` (testhint).

`src/style.css`:
- Na r. 1042: sectie "De plaat (CK-021)" met de klassen hierboven, inclusief `.cijfer-link`.

Niet wijzigen: `src/vermogens.js`, `firestore.rules`, scripts, tests.

## Acceptatiecriteria
- [ ] Zijmenu, groep Overzicht: **Home**, daarna **Vermogens** met pictogram `tegels`; op de plaat staat `aria-current="page"` alleen op Vermogens.
- [ ] Groep Beheer toont **Vermogens beheren** (pictogram `puzzel`); kruimelpad "Home › Beheer › Vermogens beheren", documenttitel en `h2` idem.
- [ ] Kruimelpad op de plaat: "Home › Vermogens"; Home is een link.
- [ ] Met de HCA-data in test: 3 pijlerkolommen (13 vermogens), 10 ondersteunende domeinen (45 vermogens), blokken Projecten en Samenwerkingen met omschrijving en "Voorzitter", zonder vermogens. Volgorde van domeinen en vermogens gelijk aan Vermogens beheren.
- [ ] Per domein de juiste eindverantwoordelijke (vergelijk met de tabel in `CK-020-bron-vermogensoverzicht.md`); zonder geldige `bestuursfunctieId` "nog niet gekozen".
- [ ] Sectietoelichting toont het aantal ("13 vermogens", "45 vermogens") en het totaal is gelijk aan het Home-kerncijfer.
- [ ] Domein zonder vermogens: "Nog geen vermogens". Club zonder vermogens: leeg-blok "Nog geen vermogens" plus de plaat. Club zonder pijlers en ondersteunende domeinen: leeg-blok "Nog geen domeinen". Lege secties worden niet getekend.
- [ ] Verweesd vermogen (testclub via console): staat niet op de plaat, voetnoot met het aantal verschijnt.
- [ ] Laadfout (bijv. offline): melding met **Opnieuw laden**; werkt na herstel; focus volgens de afspraak. In test/ontwikkel bij `permission-denied` de regels-hint.
- [ ] Bestuursfuncties-laden mislukt: plaat verschijnt, eindverantwoordelijke-regels ontbreken, statusmelding staat erboven.
- [ ] Geen knoppen of links op de plaat naar beheer; geen schrijfactie naar Firestore.
- [ ] Home: kerncijfer Vermogens is een link naar de plaat (muis en Enter), met hover- en focusstijl; de andere drie cijfers zijn geen link. Bij laadfout op Home blijft het een link met "–".
- [ ] Precies één `h1` op de plaat; koppen h1 › h2 › h3; domeinen en vermogens als lijsten; geen nieuwe `region`-landmarks (controle met de toegankelijkheidsboom).
- [ ] Lay-out: ≥ 1200px met uitgeklapt en ingeklapt menu (pijlers 3 kolommen, ondersteunend 5 per rij of meer), 768px, 375px (één kolom, geen horizontale scroll), licht en donker thema. Lange namen ("Scheidsrechtersontwikkeling", "Bar- en keukenbeheer") breken netjes af.
- [ ] Ingeklapt zijmenu: pictogram `tegels` leesbaar op 18px, tooltip "Vermogens".
- [ ] Namen met `& ' ( )` worden goed getoond (geen HTML-injectie).
- [ ] `npm run build` slaagt; bestaande regeltests (`npm run test:regels`) ongewijzigd groen.

## Wat mag er niet kapotgaan?
- Home: kerncijfers en domeinkaarten (`renderStructuurGrid` zoekt `#cijfer-vermogens`).
- Vermogens beheren: alle functies, inclusief `data-nav="vermogensbeheer" data-filter` vanaf Domeinen en de blokkademelding "Naar de vermogens van X".
- Zijmenu: in-/uitklappen, tooltips, uitschuifpaneel ≤700px, één `aria-current`.
- Menu-id's: `vermogens` (plaat) en `vermogensbeheer` (beheer) blijven gescheiden.
- Firestore-regels en import-/controlescripts: niets aan veranderen.

## Architectuurlaag
**Model-laag (M1/M2-weergave)**, met een kleine aanpassing in de **Platform-laag (P0, app-shell)**. De plaat is de generieke weergave van het pijler/domein/vermogen-model van elke tenant: niets HCA-specifieks in de code (aantallen, namen en kolommen komen uit de data). Het zijmenu-item en de Home-link zijn shellwijzigingen volgens het bestaande patroon van CK-044.

## Randgevallen en risico's
- **Veel pijlers** (bijv. 5): `auto-fit` maakt smalle kolommen; minimaal 200px, daarna breekt de rij af. Acceptabel.
- **Eén domein met veel vermogens** (20+): lange kolom; pijlerkaarten in dezelfde rij rekken mee (lege ruimte). Acceptabel, de plaat is ook zo.
- **Gelijke `volgorde`** (bekend vervolgpunt CK-023): sorteren op naam als tweede sleutel, zoals overal.
- **Wegnavigeren tijdens laden**: `isConnected`-controle na `await`.
- **Leesrechten**: de plaat leest dezelfde collecties als Home en Domeinen; na P0d (rollen) moet ook een niet-beheerder deze collecties kunnen lezen. Dat is de bedoeling van de plaat (iedereen mag kijken); meenemen bij P0d.
- **Gevoelige vermogens** (Lief & Leed, Sociale veiligheid, Tuchtzaken): alleen de naam staat op de plaat; geen extra inhoud.
- **Kosten**: drie `getDocs` per bezoek (~15 + 58 + 6 documenten). Verwaarloosbaar op Spark.
- **Uitrol**: geen regelwijziging, dus alleen app-uitrol. Niet op 26 november 2026 (lijn CK-020). Eerst op tst testen.

## Besluiten Paul (23 november 2026)
1. **Pictogram:** `tegels` (3×3 vakjes) voor de plaat; `puzzel` blijft bij Vermogens beheren.
2. **Pijlerkaart:** appnaam als kop, hashtag eronder ("HOCKEY" / *#HCASpeelt*).
3. **Smal scherm:** alles uitgeklapt (één lange pagina), niet inklapbaar.
