# Ontwerp: CK-170 — Beheer → Activiteiten

Fase 3 (ontwerp), 25 november 2026 · Spec: `CK-170-activiteiten.md` (met de besluiten van Paul) · Huisregels tabellen: `CK-046-besluiten.md` 19–41 · Patroon: `CK-046-ontwerp.md` (Beheer → Projecten). Geen prototype: het scherm volgt het bestaande patroon. Hieronder staat alleen wat nieuw is of afwijkt.

**Voorrang:** besluiten van Paul > dit ontwerp > spec. Wat dit ontwerp verandert ten opzichte van de spec:
1. **Keuzelijst Vermogen gegroepeerd per domein (`optgroup`).** De spec gaat ervan uit dat `keuzelijst.js` geen `optgroup` kent, maar dat klopt niet: `bouwLijst()` tekent een `OPTGROUP` als kopregel `.eigen-groep` (keuzelijst.js r. 114). De optie bevat daarom alleen de vermogensnaam, zonder "(Domeinnaam)". Zoeken op de eerste letters werkt dan nog steeds.
2. **Exportnamen.** `main.js` heeft al `SOORTEN` en `SOORT_LABEL` (soorten domein, r. 114–115). `src/activiteiten.js` exporteert daarom **`ACTIVITEIT_SOORTEN`** en **`ACTIVITEIT_SOORT_LABEL`**.
3. **Een verdwenen vermogen of commissie staat zichtbaar in de tabel** ("bestaat niet meer"), niet alleen als verborgen tekst. De beheerder moet dit kunnen zien om het te herstellen.

---

## Schermen

### Scherm 1: Beheer → Activiteiten

**Lay-out:** gelijk aan Beheer → Projecten: `.sectie` met kop "ACTIVITEITEN", `.beheer-balk`, formulier, sectiemelding, eventueel hint, tabel. Het id-voorvoegsel is `activiteit-`.

```
┌ sectie-kop ── ACTIVITEITEN ───────────────────────────────────────────────────────────┐
│ [Alle soorten ▾]                                            [ + Activiteit toevoegen ] │
│ ▌✓ Activiteit Clubdag 2027 toegevoegd.                                                 │
│ #  ACTIVITEIT                     SOORT               VERMOGEN       COMMISSIE          │
│ 1  Jeugdclinic  12 mrt 2027       (Clinic of training) Jeugdopleiding Technische com. [✎] [🗑]│
│ 2  Paastoernooi  4 – 6 apr 2027   (Toernooi)          Toernooien     —              [✎] [🗑]│
│ 3  Oud-en-nieuwtoernooi  30 dec 2026 – 2 jan 2027 ...                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Balk** (`.beheer-balk#activiteit-balk`, `hidden` tijdens het laden en bij een laadfout):
- Links `.filter-keuze#activiteit-filter-keuze` met `<label class="sr-only" for="activiteit-filter">Toon</label>` en `<select class="form-input" id="activiteit-filter">`. De opties zijn `alle` "Alle soorten" (standaard) en daarna de 7 soorten in de vaste volgorde, met het label als tekst. In de lege staat is het filter `hidden`.
- Rechts `.btn-toevoegen#activiteit-toevoegen-knop` "+ Activiteit toevoegen". Die knop staat er altijd, ook in de lege staat (zoals bij Projecten). De `.leeg-blok` heeft dus géén eigen knop.
- Zijn er **geen vermogens** (geladen, lijst leeg), dan krijgt de knop `disabled` en staat er een `p.tussen-hint` boven de lijst (zie Teksten). Konden de vermogens **niet geladen** worden, dan ook `disabled`, met de laadhint.

**Tabel** (`#activiteit-lijst`, met daarin `<div role="table" aria-label="Activiteiten">`).

De kopregel is `.beheer-rij.beheer-kop.activiteit-rij[role=row]`, met de `columnheader`s in deze volgorde:
`#`, `Activiteit`, `Soort`, `Vermogen`, `Commissie`, `<span class="sr-only">Acties</span>`.

Een rij is `.structuur-rij.beheer-rij.activiteit-rij[role=row][data-id]`:
```html
<span class="cel-nr" role="cell">1</span>                       <!-- plaats in de hele gesorteerde lijst, ook met filter (besluit 16/32) -->
<span class="cel-activiteit" role="cell">
  <span class="cel-naam">Jeugdclinic</span><span class="cel-periode">12 mrt 2027</span>
</span>
<span class="cel-soort" role="cell"><span class="status-label">Clinic of training</span></span>
<span class="cel-vermogen" role="cell"><span class="cel-label" aria-hidden="true">Vermogen: </span>Jeugdopleiding</span>
<span class="cel-commissie" role="cell"><span class="cel-label" aria-hidden="true">Commissie: </span>Technische commissie</span>
<div class="kaart-acties cel-acties" role="cell">
  ${actieKnopHTML('bewerk', id, 'bewerk', naam)}${actieKnopHTML('verwijder', id, 'verwijder', naam)}
</div>
```
- **De datum staat achter de naam** op dezelfde regel, net als de periode bij projecten (besluit 30): `.cel-periode`, muted, `nowrap`, 10px marge links. De tekst komt uit `datumTekst()` (zie onder). Er is geen aparte datumkolom.
- **Soort:** het ronde label `.status-label` zonder modifier (neutrale rand `--border`, tekst `--text`). Alle soorten zien er hetzelfde uit en de tekst draagt de betekenis. Er komt geen `soort-label`-klasse en er komen geen kleuren per soort (besluit 23, geen nieuwe kleuren).
- **Vermogen:** alleen de naam van het vermogen. Het domein staat er niet bij (besluit 21: nooit twee waarden onder elkaar).
- **Commissie leeg:** `<span class="leeg-streep" aria-label="geen commissie">—</span>`.
- **Verwijzing weg** (het id staat niet in de geladen lijst): `<span class="leeg-streep">bestaat niet meer</span>`, zichtbaar en muted.
- **Lijst niet geladen** (vermogens of commissies fail-soft mislukt): `<span class="leeg-streep" aria-label="niet geladen">—</span>`. Zeg dan nooit "bestaat niet meer".
- Er zijn geen knoppen ↑ en ↓.
- Alle tekst gaat via `esc()`.

**Formulier** (`.pijler-form#activiteit-form`; bij bewerken `.pijler-bewerk-form` in de rij met de ids `an-`, `as-`, `av-`, `ac-`, `ab-` en `ae-{id}`). De velden staan in deze volgorde:

| # | Veld | Element | Eerste optie / placeholder |
|---|---|---|---|
| 1 | Naam | `input#activiteit-naam` (attributen als bij project) | placeholder "Bijv. Clubdag 2027" |
| 2 | Soort | `select#activiteit-soort` | `<option value="">Kies een soort</option>`, dan de 7 soorten |
| 3 | Vermogen | `select#activiteit-vermogen` | `<option value="">Kies een vermogen</option>`, dan de groepen |
| 4 | Commissie | `select#activiteit-commissie` | `<option value="">Geen commissie</option>` (standaard), dan de commissies op volgorde |
| 5 | Datum | `<fieldset class="periode-velden">` met `<legend class="form-label">Datum</legend>` en daarin `.form-rij-datums` met `input#activiteit-begin` (`.datum-label` "Begindatum") en `input#activiteit-eind` (`.datum-label` "Einddatum (optioneel)"), beide `type="date"` | — |

Daarna `.form-rij` met `Opslaan` (de primaire knop, zoals in het projectformulier nu) en `Annuleren`, en `meldingenHTML(null, 'activiteit-form-fout')`.
- Elk veld heeft een `span.form-fout#…-fout` en `aria-describedby`, ook de selects. De eigen keuzelijst neemt `aria-describedby`, `aria-invalid` en de klasse `fout` over.
- **Soort bij toevoegen:** staat het filter op een soort, dan is die soort voorgekozen. Anders staat er "Kies een soort" (er is geen standaardwaarde, want het veld is verplicht).
- **De keuzelijst Vermogen** krijgt een nieuwe helper `vermogenOptiesHTML(vermogens, domeinen, gekozen)`:
  - Per domein komt er een `<optgroup label="{domeinnaam}">` met de vermogens op `volgorde`.
  - De domeinen staan in dezelfde volgorde als `domeinOptiesHTML`: eerst de pijlers, dan de ondersteunende domeinen, elk op `volgorde`. Een domein zonder vermogens slaat de helper over.
  - Vermogens waarvan het domein niet bestaat, komen achteraan in `<optgroup label="Zonder domein">`.
  - Konden de domeinen niet geladen worden, dan maakt de helper geen groepen maar één platte lijst, op naam (`localeCompare 'nl'`).
- **Begindatum `change`** → zet `einddatum.min = begin || ''`. Zet `min` ook bij het openen van het bewerkformulier.
- **Bewerken, vermogen weg:** de keuzelijst staat op "Kies een vermogen" en de veldfout staat er direct bij het openen (zie Teksten).
- **Bewerken, commissie weg:** de keuzelijst staat op "Geen commissie". Er komt een hint in `p.vermogens-hint` onder het veld (zie Teksten). Dat is geen fout: opslaan schrijft `commissieId: ''`.
- **Commissies niet geladen:** de keuzelijst is `disabled` en heeft één optie met de huidige waarde (`value` = de bestaande `commissieId`, of `''` met de tekst "Geen commissie"). De tekst bij een bestaande commissie is "Huidige commissie (niet geladen)". Opslaan schrijft de bestaande `commissieId` ongewijzigd terug, nooit stilletjes `''`. Onder het veld komt de hint.
- Een niet-beheerder ziet dit allemaal niet (guard `geenBeheer`).

**Interacties:**
- **Filter** (`change`) → de lijst wordt opnieuw getekend, de focus blijft staan. In `#activiteit-filter-status` (`sr-only`, na 100 ms) komt "3 activiteiten getoond.", "1 activiteit getoond." of "Geen activiteiten van de soort Toernooi."
- **Toevoegen** → het formulier gaat open, de knop wordt `hidden` en de focus gaat naar Naam.
- **Opslaan** → normaliseren en dan valideren in de volgorde naam, soort, vermogen, begindatum, einddatum. Het eerste foute veld krijgt de focus. Dan volgt `metOpslaan` met vers laden en de dubbele-controle (dezelfde naam zonder hoofdletterverschil **en** dezelfde `begindatum`, het eigen id uitgezonderd).
  - Lukt het, dan komt er een sectiemelding en gaat de focus naar de nieuwe rij (zoals bij projecten).
  - Valt de nieuwe activiteit buiten het filter, dan springt het filter naar `alle` en komt er een staartzin bij de melding.
- **Bewerken in de rij, Annuleren, Verwijderen** → precies zoals bij projecten: `confirm()` met de tekst van besluit 41, `bezig: null`, en daarna de focus naar `zichtbareTerugval`. Is er niets gewijzigd, dan komt er geen schrijfactie.

**Klassen:** dezelfde als in Projecten (`.beheer-balk`, `.filter-keuze`, `.btn-toevoegen`, `.pijler-form`, `.pijler-bewerk-form`, `.form-*`, `.periode-velden`, `.form-rij-datums`, `.datum-label`, `.structuur-rij.beheer-rij`, `.cel-nr`, `.cel-naam`, `.cel-periode`, `.cel-label`, `.cel-acties`, `.kaart-acties`, `.btn-icoon`, `.status-label`, `.leeg-streep`, `.leeg-blok`, `.lijst-leeg`, `.lijst-laden`, `.tussen-hint`, `.vermogens-hint`, `.sr-only`). Nieuw zijn alleen `.activiteit-rij`, `.cel-activiteit`, `.cel-soort`, `.cel-vermogen` en `.cel-commissie`.

### Scherm 2: Beheer → Vermogens en Beheer → Commissies (de verwijderblokkade)

Bij verwijderen telt de app vers, **vóór** `bevestigVerwijderen`/`confirm()`, met `metTijdslimiet`. Dit volgt het patroon van de bestuursfuncties (main.js r. 3096–3114):
- Is het aantal groter dan 0, dan komt de tekst in `sectieFout`, gevolgd door `meldingInBeeld(sectieFout)` en `return`.
- Mislukt het tellen, dan komt de foutmelding (zie Teksten) in `sectieFout` en volgt ook een `return`. Er wordt dan nooit verwijderd.
- Is het aantal 0, dan gaat het verder zoals nu.
- De controle `lijstEl.isConnected` na het `await` blijft.

---

## Datumnotatie (`datumTekst(begin, eind)` in `src/activiteiten.js`)
De maanden komen uit dezelfde vaste lijst als `periodeTekst` (`jan feb mrt apr mei jun jul aug sep okt nov dec`). De dag staat zonder voorloopnul. Er wordt alleen gesplitst, er is geen `new Date()`. Het streepje is een en-dash met spaties.

| begin | eind | Tekst |
|---|---|---|
| 2027-03-12 | `''` | `12 mrt 2027` |
| 2027-03-12 | 2027-03-12 | `12 mrt 2027` (gelijk = eendaags) |
| 2027-03-12 | 2027-03-14 | `12 – 14 mrt 2027` |
| 2027-03-30 | 2027-04-02 | `30 mrt – 2 apr 2027` |
| 2026-12-30 | 2027-01-02 | `30 dec 2026 – 2 jan 2027` |

Unittests: deze vijf rijen plus `activiteitDatumFout` (leeg begin, eind vóór begin, eind leeg is goed).

**Sorteren:** op `begindatum`, dan `einddatum` (`''` eerst), dan `naam` (`localeCompare 'nl'`).

---

## Teksten

| Situatie | Tekst | Plek |
|---|---|---|
| Lege staat | **Nog geen activiteiten**: "Een activiteit is iets wat de club op een bepaalde dag organiseert, zoals een toernooi, een clinic of de ALV. Elke activiteit hoort bij een vermogen." | `.leeg-blok` (h3 + p, zonder knop) |
| Geen vermogens | Maak eerst een vermogen aan in `<a class="tussen-link">Beheer → Vermogens</a>`. Daarna kun je activiteiten toevoegen. | `p.tussen-hint` boven de lijst. De link gebruikt dezelfde navigatie als de doorklik van de kerncijfers. |
| Vermogens niet geladen | De vermogens konden niet worden geladen. Toevoegen en opslaan kan nu niet. Herlaad de pagina. | `p.tussen-hint` |
| Domeinen niet geladen | De domeinen konden niet worden geladen. De vermogens staan daarom op naam, zonder domein. | `p.tussen-hint` |
| Commissies niet geladen | De commissies konden niet worden geladen. De commissie blijft zoals hij was. | `p.vermogens-hint` onder het veld Commissie |
| Laden | Activiteiten worden geladen... | `p.lijst-laden` |
| Filter zonder treffers | Geen activiteiten van de soort Toernooi. | `p.lijst-leeg` |
| Naam: leeg, te kort, te lang of verkeerde tekens | als bij projecten (`onderdeelnaamFout`) | veld Naam |
| Dubbele naam | Er is al een activiteit met deze naam op deze datum. | veld **Naam** |
| Geen soort | Kies een soort. | veld Soort |
| Geen vermogen | Kies een vermogen. | veld Vermogen |
| Vermogen weg (bewerken) | Het vermogen van deze activiteit bestaat niet meer. Kies een ander vermogen. | veld Vermogen, direct bij het openen |
| Commissie weg (bewerken) | De commissie van deze activiteit bestaat niet meer. Bij opslaan wordt dit Geen commissie. | `p.vermogens-hint` onder het veld Commissie |
| Geen begindatum | Vul een begindatum in. | veld Begindatum |
| Halve begindatum (`badInput`) | Vul een hele datum in. | veld Begindatum |
| Halve einddatum (`badInput`) | Vul een hele datum in, of maak het veld leeg. | veld Einddatum |
| Einddatum vóór begindatum | De einddatum ligt vóór de begindatum. | veld **Einddatum** (dat veld krijgt de focus) |
| Toegevoegd | ✓ Activiteit {naam} toegevoegd. [+ " Het filter staat weer op Alle soorten."] | sectiemelding |
| Opgeslagen | ✓ Activiteit {naam} opgeslagen. | sectiemelding |
| Verwijderen | Activiteit {naam} verwijderen? Dit kan niet ongedaan worden gemaakt. | `confirm()` |
| Verwijderd of al weg | ✓ Activiteit {naam} verwijderd. / Deze activiteit bestaat niet meer. | sectiemelding |
| Vermogen heeft activiteiten | Vermogen {naam} hoort nog bij {1 activiteit / n activiteiten}. Koppel die eerst aan een ander vermogen in Beheer → Activiteiten. | `sectieFout` Vermogens |
| Commissie heeft activiteiten | Commissie {naam} hoort nog bij {1 activiteit / n activiteiten}. Koppel die eerst aan een andere commissie, of kies daar Geen commissie, in Beheer → Activiteiten. | `sectieFout` Commissies |
| Tellen mislukt | Vermogen {naam} kan nu niet worden verwijderd: de activiteiten konden niet worden geteld. Herlaad de pagina en probeer het opnieuw. (Bij een commissie: "Commissie {naam} …") | `sectieFout` |

Een hulpje `activiteitenTekst = n => (n === 1 ? '1 activiteit' : \`${n} activiteiten\`)` naast `vermogensTekst`.

---

## Pictogram `kalender` (`MENU_ICOON`, 48-viewBox, lijndikte 3, rond, via `menuIcoon()`)
```js
kalender: '<rect x="7" y="10" width="34" height="30" rx="3"/><path d="M7 20 H41"/><path d="M16 6 V14"/><path d="M32 6 V14"/>',
```
Dit is de kalender van de datumkiezer (`KALENDER` in keuzelijst.js) op schaal 2, zodat het menu en het datumveld hetzelfde beeld gebruiken. Er staan geen dagvakjes in, want die lopen op 18px dicht. Controleer het op 18px naast `klembord`: het onderscheid zit in de dwarslijn en de twee pinnen, waar het klembord één klem in het midden heeft.

---

## Nieuwe CSS
Zet dit in `style.css` onder het blok "Projecten en samenwerkingen (CK-046)", met een eigen kopje `/* Activiteiten (CK-170) */`. Gebruik alleen bestaande tokens en geen nieuwe kleuren.

```css
#activiteit-lijst { container-type: inline-size; }
.activiteit-rij { grid-template-columns: 28px minmax(140px, 1.4fr) auto minmax(110px, 1fr) minmax(110px, 1fr) 152px; } /* terugval zonder subgrid en tijdens bewerken */
.cel-activiteit { min-width: 0; overflow-wrap: anywhere; }

@container (max-width: 760px) {
  .beheer-rij.beheer-kop.activiteit-rij { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; } /* alleen voor de schermlezer (CK-050) */
  .activiteit-rij { grid-template-columns: 24px auto 1fr; row-gap: 6px; column-gap: 10px; }
  .activiteit-rij .cel-activiteit { grid-column: 2 / -1; }
  .activiteit-rij .cel-soort      { grid-column: 2; grid-row: 2; }
  .activiteit-rij .cel-vermogen   { grid-column: 3; grid-row: 2; font-size: var(--fs-toelichting); }
  .activiteit-rij .cel-commissie  { grid-column: 2 / -1; font-size: var(--fs-toelichting); }
  .activiteit-rij .cel-acties     { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
  .activiteit-rij .cel-label      { display: inline; }
}
```
Breid deze bestaande regels uit, dus geen nieuwe regels erbij:
- r. 1055: `.cel-project .cel-periode, .cel-activiteit .cel-periode { … }`.
- r. 1095 en r. 1106–1107: voeg `#activiteit-lijst > [role="table"]` en `#activiteit-lijst .beheer-rij` toe aan de selectorlijsten (raster, `column-gap: 30px`, `grid-column: 1 / -1`).
- Nieuw, naast r. 1100–1101:
```css
#activiteit-lijst > [role="table"] { grid-template-columns: 28px auto auto auto auto minmax(0, 1fr) 152px; }
@container (min-width: 761px) {
  #activiteit-lijst .beheer-rij.activiteit-rij:not(.bewerken) { grid-template-columns: subgrid; }
  #activiteit-lijst .activiteit-rij > :last-child { grid-column: -2 / -1; }
}
```
De actiekolom blijft 152px, ook onder 700px: twee knoppen van 44px plus de tussenruimte passen erin, en er zijn geen ↑ en ↓. De knoppen staan daardoor in elke beheertabel op dezelfde plek.

## Responsief gedrag
- **Lijst van 761px of breder:** één regel per activiteit, met de zichtbare kolomkop, en de kolommen via subgrid met 30px ertussen.
- **Lijst van 760px of smaller:** de kop is alleen voor de schermlezer. Regel 1 is het nummer met de naam en de datum. Regel 2 is het soortlabel met "Vermogen: X". Regel 3 is "Commissie: X". Regel 4 zijn de knoppen. De `.cel-label`-prefixen vervangen de kolomkop.
- **700px of smaller:** de balk staat gestapeld en de knoppen zijn 44×44, met de prullenbak rechts. Dat doen de bestaande regels al.
- **480px of smaller:** de datumvelden staan onder elkaar. Dat doet de bestaande regel ook al.

## Implementatienotities voor de bouwer
- `src/activiteiten.js` exporteert `ACTIVITEIT_SOORTEN` (`[sleutel, label]`, in de volgorde van de spec) en `ACTIVITEIT_SOORT_LABEL`. Het label van een onbekende soort (oude data) is "Overig".
- `vermogenOptiesHTML` komt in `main.js` naast `domeinOptiesHTML`. Gebruik geen platte lijst met "(Domein)".
- In de dubbele-controle gebruikt de bouwer `naamBezet` alleen op de activiteiten met dezelfde `begindatum`, en geeft daarna de foutcode `dubbele-activiteit` terug.
- Opslaan schrijft altijd alle zes de velden: `vermogenIds: [gekozenId]`, en de `einddatum` als `''` als die leeg is. Geeft de beheerder een einddatum gelijk aan de begindatum op, dan blijft die gewoon staan. `datumTekst` maakt er één dag van.
- Op de tabelcel van het vermogen staat de naam uit de geladen vermogens, opgezocht via `vermogenIds[0]`. Op de commissiecel staat de naam uit de geladen commissies.
- De guard in Commissies staat alleen in de tak `soort === 'commissies'` van `renderOnderdeelBeheer`. Projecten en Samenwerkingen blijven ongemoeid.
- Het zijmenu-item heeft `ico: 'kalender'` en staat direct na Vermogens. Het pictogram staat in `MENU_ICOON` naast `klembord` en `schakels`.
