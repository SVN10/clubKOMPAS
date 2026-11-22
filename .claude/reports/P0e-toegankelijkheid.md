# Toegankelijkheidsrapport: P0e — Aparte testomgeving

Gecontroleerd (statische code-analyse, niet ingelogd): `src/main.js` (SOORT, `footerHTML`, inlogfout, `toonTussenkaart`, `renderConfigFout`, `toonOmgevingsBalk`, `renderGeenClub`), P0e-blok in `src/style.css:757-813`, vergeleken met `.claude/specs/P0e-ontwerp.md`. `index.html` heeft `lang="nl"`.

## Contrastberekening (WCAG-luminantie)

| Element | Voorgrond / achtergrond | Verhouding | Eis | Uitkomst |
|---|---|---|---|---|
| Balk Test licht | wit op `#3A6567` | 6,49 | 4,5 | ok |
| Balk Test donker | wit op `#2F5658` | 8,10 | 4,5 | ok |
| Balk Productie licht | `#111212` op `#FF9E16` | 9,07 | 4,5 | ok |
| Balk Productie donker | `#111212` op `#FFAA33` | 9,87 | 4,5 | ok |
| Footerlabel (oranje vlak) | `#111212` op oranje | 9,07 / 9,87 | 4,5 | ok |
| Footer-tekst wit op petrol | wit op `#46797B` | 4,90 | 4,5 | ok |
| `.tussen-hint` (M6) licht | `#6F6E6E` op wit | 5,08 | 4,5 | ok |
| `.tussen-hint` donker | `#A3B0B0` op `#1B2A2C` | 6,64 | 4,5 | ok |
| `.inlog-test-hint`, stappen, `code` | `--text` op kaart/surface | 12,6 tot 17,2 | 4,5 | ok |
| Foutzin `.form-fout` licht | `#c0392b` op wit | 5,44 | 4,5 | ok |
| Foutzin `.form-fout` donker | `#c0392b` op `#1B2A2C` | 2,73 | 4,5 | niet ok (zie bevinding 1) |
| Oranje bovenrand M2 licht | `#FF9E16` op wit | 2,07 | 3 (alleen als enige drager) | zie noot |
| `code`-rand | `#C9D7D7` op surface | 1,36 | n.v.t. (decoratief) | ok |

Noot oranje rand: de rand is niet de enige informatiedrager; "Gestopt:" staat in de titel. Daarmee voldoet 1.4.1 en is 1.4.11 niet van toepassing. De spec-keuze "oranje alleen als vlak met donkere tekst" is correct uitgevoerd; nergens oranje tekst op wit of petrol.

## Bevindingen

### 1. Foutkleur `.form-fout` faalt in donkere modus (raakt de nieuwe inlogfout)
**Ernst:** 🟡 Aandacht (AA-tekortkoming, bestond al vóór P0e; niet door P0e veroorzaakt)
**WCAG-criterium:** 1.4.3 Contrast (Minimum)
**Locatie:** `src/style.css:339`
**Probleem:** `#c0392b` op de donkere kaart (`#1B2A2C`) haalt 2,73:1. Dat geldt ook voor de eerste zin in de P0e-inlogfout ("E-mailadres of wachtwoord klopt niet."). De test-hint zelf (`--text`) is wel goed leesbaar. P0e maakt de melding nu voorleesbaar, maar in donker blijft hij slecht zichtbaar.
**Aanbeveling:** een foutkleur per modus, bijvoorbeeld `--fout: #c0392b` (licht) en `--fout: #FF8A7A` (donker, 6,48:1 op de kaart, 7,27:1 op surface), en `.form-fout { color: var(--fout); }`. Het is een bestaand punt; zet het in de backlog als het niet in P0e hoeft.

### 2. Foutpagina: alinea wordt alleen via role="alert" voorgelezen, focus staat op de titel
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 4.1.3 Statusberichten / 1.3.1 Info en relaties
**Locatie:** `src/main.js:474-477`, `src/main.js:444`
**Probleem:** de container met `role="alert"` bestaat al bij het invoegen (`innerHTML`). Niet elke schermlezer meldt zo'n alert. Dan hoort de gebruiker door de focus alleen de titel, niet de alinea. Bij andere schermlezers kan de titel dubbel klinken (alert plus focus).
**Aanbeveling:** laat de focus de uitleg meenemen: `<h1 ... id="tussen-titel" tabindex="-1" aria-describedby="config-uitleg">` en `<p class="tussen-tekst" id="config-uitleg">`. `role="alert"` mag blijven. Dat gedrag is goed genoeg voor AA; dit is polijsten.

### 3. Omgevingsbalk: hoogte op 320px en `min-height` van het inlogscherm
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.4.10 Reflow
**Locatie:** `src/style.css:778`
**Probleem:** de balk breekt op 320px af naar 2 tot 3 regels (geen `nowrap`, `min-height` en geen vaste hoogte, dus geen afkapping en geen horizontaal scrollen). Dat voldoet. `calc(100vh - 28px)` houdt echter geen rekening met die hogere balk, waardoor het inlogscherm een paar pixels te hoog wordt en een minieme verticale scrollbalk kan tonen. Dat is geen WCAG-fout.
**Aanbeveling:** optioneel `body.met-omgeving-balk #app .inlog-wrap { min-height: auto; flex: 1 }` met body als flex-kolom, of accepteer het.

### 4. Informatie alleen in `title`-tooltip (footer)
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.3.1 Info en relaties
**Locatie:** `src/main.js:299`
**Probleem:** het project-ID in de footer staat alleen in de tooltip (niet via toetsenbord of touch bereikbaar). Dat is hier acceptabel omdat de balk het project-ID zichtbaar toont en de footer de omgevingsnaam in gewone tekst heeft.
**Aanbeveling:** geen actie nodig.

### 5. Rand van secundaire knop "Opnieuw laden" heeft weinig contrast
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.4.11 Contrast van niet-tekstuele elementen
**Locatie:** `src/style.css:191-203` (bestaande `.btn`)
**Probleem:** rand `--border` op de kaart is ca. 1,5:1. Het label (petrol, 4,9:1) en de hoofdletters maken de knop als knop herkenbaar; AA wordt hier meestal geaccepteerd omdat de tekst de functie draagt. De spec zegt "petrol rand"; de bestaande `.btn` heeft dat niet.
**Aanbeveling:** optioneel `#config-herlaad { border-color: var(--petrol); }` (4,9:1 op wit).

## Wat goed is (volgens de criteria gecontroleerd)

- **Niet alleen kleur (1.4.1):** M2 draagt "Gestopt:" in de titel; footer `productie-lokaal` draagt de woorden "Productie (lokaal)"; balk draagt "Testomgeving" resp. "Let op: echte clubdata". De tabtitel heeft TEST of PRODUCTIE LOKAAL als voorvoegsel, de foutpagina "Gestopt".
- **Schermlezer:** balk met `role="note"` en `aria-label="Omgeving"` is eerste kind van `body` (leesvolgorde klopt) en wordt niet bij elk scherm herhaald. `#inlog-algemeen-fout` heeft `role="alert"`. De hint wordt na de foutzin toegevoegd, en de alert wordt bij elke poging geleegd en opnieuw gevuld, dus wordt voorgelezen. De test-hint gaat via `createElement` en `textContent` (geen XSS-pad). M6-regel en `code` zijn gewone tekst; UID en project-ID zijn geëscaped.
- **Documenttitel (2.4.2):** er zijn alleen twee plekken die `document.title` zetten; ze botsen niet.
- **Toetsenbord (2.1.1, 2.1.2, 2.4.7):** de enige nieuwe interactieve elementen zijn `<button>` (Opnieuw laden) en `<a>` (support-link). Beide zijn natuurlijk focusbaar met Enter of Spatie, zonder vallen. De browser-standaard focusring blijft op `.btn` staan (geen `outline: none`); `.tussen-link:focus-visible` heeft een petrol-ring. `outline: none` staat alleen op de programmatisch gefocuste `h1[tabindex=-1]`, wat acceptabel is omdat hij niet in de tabvolgorde zit. De balk is niet focusbaar; dat hoeft ook niet.
- **Reflow 320px (1.4.10):** `code` heeft `overflow-wrap: anywhere`, `.tussen-tekst` en `.tussen-hint` ook; kaart is `width:100%` met max 400px; geen vaste breedtes; lange UID en bestandsnamen breken. Binnenbreedte ca. 206px. Geen horizontaal scrollen te verwachten.
- **Tekstafstand (1.4.12):** `line-height` in px op elementen zonder vaste hoogte; de balk gebruikt `min-height`, dus geen afgeknipte tekst bij vergrote regelafstand.
- **Semantiek (1.3.1, 4.1.2):** `h1`, `p`, `ol`/`li` (genummerde stappen), `button`. Het label "Wat nu?" is een `p.form-label` en geen `label`, wat correct is want het hoort niet bij een veld.
- **Taal (3.1.1):** `lang="nl"`. Vaktermen en bestandsnamen in `code` zijn voor de schermlezer acceptabel.

## Vergelijking met `P0e-ontwerp.md`

Implementatie volgt het ontwerp. Verschillen zonder toegankelijkheidsgevolg:
- M1-bestandsnaam hangt af van `MODE` (`.env.productie.local` bij productiemodus). Extra, niet in spec.
- "Opnieuw laden" is zonder `primary` (secundair), zoals de spec zegt; de petrol rand uit de spec is niet toegevoegd (bevinding 5).

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 1 (bestaande foutkleur in donkere modus; niet door P0e)
- 🟢 Suggesties: 4

## Eindoordeel
✅ Voldoet aan WCAG 2.1 AA voor de P0e-wijzigingen. Kanttekening: de bestaande foutkleur `.form-fout` faalt in donkere modus (2,73:1) en raakt de eerste zin van de inlogfout; apart oppakken. Niet in een browser of met een schermlezer getest; dit is een code-analyse.
