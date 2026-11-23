# Ontwerp: CK-020 — Vermogens beheren

Fase 3 (ontwerp), 23 november 2026, bijgewerkt dezelfde dag met besluiten 18–20 (Paul, na het prototype) · Spec: `CK-020-vermogens-beheren.md` · Reis: `CK-020-gebruikersreis.md` · Besluiten: `CK-020-besluiten.md` (1–20, leidend) · Shell: `CK-044-ontwerp.md` · Meldingen: `CK-023-ontwerp.md`

**Prototype (klikbaar, privé, versie 2):** https://claude.ai/artifact/Eheb3a9Svkq87B1oqan3Lc
Bevat Beheer → Vermogens (60 HCA-vermogens, Digitaal bewust leeg), toevoegen/bewerken/verplaatsen/↑↓/verwijderen, veldfouten (dubbel, ongeldig teken), een verbindingsfout (schakelaar bovenaan), de lege staat, Domeinen met de keuzelijst op soort en de blokkade-melding, Bestuursfuncties met de balk, pictogramknoppen met tooltip op alle drie de lijsten, en Home met vier kerncijfers (ook "vermogens laden niet"). Licht/donker te wisselen. Vereenvoudigd in het prototype: de domeinpictogrammen zijn vervangers (cirkel met letter), `confirm()` is een inline bevestigingsregel (een artifact kan geen systeemdialoog tonen), het domeinformulier is ingekort, Bewerken/Verwijderen bij Bestuursfuncties doen niets.

### Wat besluiten 18–20 veranderen (t.o.v. versie 1 van dit ontwerp)
- **18 — één manier van filteren:** keuzelijst "Toon" links in de beheerbalk, + Toevoegen rechts, op Domeinen, Vermogens en Bestuursfuncties. Domeinen: de filterknoppen Alles/Pijlers/Ondersteunend/Overkoepelend worden een keuzelijst op soort. Bestuursfuncties: balk met alleen de knop (advies: geen filter, zie §2c).
- **19 — pictogramknoppen:** Bewerken (potlood) en Verwijderen (prullenbak) zonder tekst, met tooltip en een toegankelijke naam per rij, op alle beheerlijsten. De actiekolom krimpt van 240px naar 152px; rasters en container-querygrenzen zijn herberekend (§4).
- **20 — introtekst vervalt** boven de vermogenslijst.

**Voorrang:** bij verschil geldt dit document, daarna de gebruikersreis. Bewuste afwijkingen van de reis:
1. **De sectiemelding verhuist naar boven**, direct onder de beheerbalk (en het formulier), op alle drie de tabbladen. De focus gaat na toevoegen naar de knop bovenaan; de bevestiging moet daar staan. Zie §2.
2. **Geen vaste hulptekst over tekens** onder het naamveld; de uitleg komt als veldfout. Open vraag 2.
3. **Knopteksten met zelfstandig naamwoord:** "+ Vermogen toevoegen", "+ Domein toevoegen", "+ Bestuursfunctie toevoegen". Open vraag 1.
4. **Focus bij de blokkade in Domeinen** blijft op Verwijderen, en die knop krijgt `aria-describedby` naar de melding.
5. **Rijknoppen** heten voor de schermlezer "Bewerken: Parkonderhoud" / "Verwijderen: Parkonderhoud" (besluit 19) in plaats van "Parkonderhoud bewerken" uit de reis. ↑/↓ houden "Parkonderhoud omhoog/omlaag".

### Antwoorden op de vijf ontwerpvragen

| # | Vraag | Besluit ontwerp |
|---|---|---|
| 1 | Eén tabel of per groep | **Per groep een `<section>` met `h3` en een eigen `role="table"`** ("Vermogens bij X"). Visueel één doorlopende lijst: groepen 24px uit elkaar, geen kaders. |
| 2 | Aantal op de domeinkaart | **Eigen regel boven de voetregel** (`p.kaart-vermogens`). Een lange hashtag drukt het aantal dan nooit weg; door `flex:1` op de omschrijving staat de regel op elke kaart op dezelfde hoogte. |
| 3 | Pictogram | **Puzzelstuk** (`puzzel`): "een onderdeel dat past in het geheel". Anders dan `plaat` (Domeinen) en vrij van wat de plaat in CK-021 nodig heeft. |
| 4 | Rij op ~768px uitgeklapt | **Op één regel.** De lijst is dan 524px; nummer 28 + acties 152 + 2×12 gap laat 320px voor de naam. Stapelen pas onder 400px lijstbreedte (telefoon). |
| 5 | Link in de domeinenlijst | **Onder de domeinnaam**, in dezelfde cel. Geen extra kolom (zie §3). |

---

## Schermen

### Scherm 1: Beheer → Vermogens

**Lay-out (`.sectie[data-meldblok]` met `style="margin-top:0"`):**

```
┌ sectie-kop (petrol, oranje onderbalk) ── VERMOGENS ──────────────────────────┐
│ sectie-lijf (--surface, padding 20, gap 16)                                   │
│ TOON [Alle domeinen          ▾]                       [ + Vermogen toevoegen ]│  .beheer-balk
│ ┌ #vermogen-form (alleen open na klik) ────────────────────────────────────┐ │
│ │ NAAM   [Bijv. Ledenwerving            ]                                   │ │
│ │ DOMEIN [Kies een domein             ▾]                                    │ │
│ │ [OPSLAAN] [ANNULEREN]                                                     │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ ▌✓ Vermogen Kascontrole 2027 toegevoegd aan Financiën.                        │  sectiemelding
│ ◯ #HCASPEELT   [■ Pijler]                                        7 vermogens  │  h3.groep-kop
│ ═════════════════════════════════════════════════════════════════════════════ │
│  1  Teamindeling                                            [↑][↓][✎]  [🗑]   │  .vermogen-rij
│  2  Coachaanstelling                                        [↑][↓][✎]  [🗑]   │
│ …                                                                             │
│ ◯ DIGITAAL     [■ Ondersteunend]                                 0 vermogens  │
│ ═════════════════════════════════════════════════════════════════════════════ │
│       Nog geen vermogens.                                                     │
│ Projecten en Samenwerkingen zijn overkoepelende domeinen. Die hebben geen …   │  p.lijst-voetnoot
└───────────────────────────────────────────────────────────────────────────────┘
```
(✎ = potlood, 🗑 = prullenbak; lijnpictogrammen, zie §4.)

**Markup (vast deel, één keer getekend):**

```html
<div class="sectie" style="margin-top:0" data-meldblok>
  <div class="sectie-kop"><h2>Vermogens</h2></div>
  <div class="sectie-lijf">
    <div class="beheer-balk" id="vermogen-balk" hidden>                       <!-- zichtbaar na de eerste geslaagde laadronde én als er vermogens zijn -->
      <div class="filter-keuze">
        <label class="form-label" for="vermogen-filter">Toon</label>
        <select class="form-input" id="vermogen-filter"><!-- zie Filter --></select>
      </div>
      <button class="btn-toevoegen" type="button" id="vermogen-toevoegen-knop">+ Vermogen toevoegen</button>
    </div>
    <div class="pijler-form vermogen-form" id="vermogen-form" hidden>
      <div class="form-groep">
        <label class="form-label" for="vermogen-naam">Naam</label>
        <input class="form-input" id="vermogen-naam" type="text" placeholder="Bijv. Ledenwerving"
               autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false"
               aria-describedby="vermogen-naam-fout">
        <span class="form-fout" id="vermogen-naam-fout"></span>
      </div>
      <div class="form-groep">
        <label class="form-label" for="vermogen-domein">Domein</label>
        <select class="form-input" id="vermogen-domein" aria-describedby="vermogen-domein-fout"><!-- domeinOpties --></select>
        <span class="form-fout" id="vermogen-domein-fout"></span>
      </div>
      <div class="form-rij">
        <button class="btn" type="button" id="vermogen-opslaan">Opslaan</button>
        <button class="btn" type="button" id="vermogen-annuleer">Annuleren</button>
      </div>
      ${meldingenHTML(null, 'vermogen-form-fout')}
    </div>
    ${meldingenHTML('vermogen-ok', 'vermogen-fout')}
    <div class="sr-only" id="vermogen-volgorde" role="status"></div>
    <div class="sr-only" id="vermogen-filter-status" role="status"></div>
    <div id="vermogen-lijst"><p class="lijst-laden">Vermogens worden geladen...</p></div>
  </div>
</div>
```

Geen introtekst (besluit 20). Geen `maxlength` op het naamveld (plakken mag niet stil afkappen). Opslaan is een gewone `.btn`.

**Componenten:**
- **Beheerbalk** `.beheer-balk`: links het filter, rechts de toevoegknop (`margin-left:auto`). Zelfde component op alle beheerpagina's (§2).
- **Filter** `#vermogen-filter`: `<select>` met label "Toon" (`.form-label`) links ervan. Opties via een nieuwe helper `domeinOptiesHTML(domeinen, gekozen, { alle })`:
  ```html
  <option value="alle">Alle domeinen</option>            <!-- alleen in het filter -->
  <option value="">Kies een domein</option>              <!-- alleen in het formulier -->
  <optgroup label="Pijlers"><option value="{id}">#HCASpeelt</option>…</optgroup>
  <optgroup label="Ondersteunende domeinen"><option value="{id}">Bestuur</option>…</optgroup>
  ```
  Volgorde = domeinvolgorde. Een lege optgroup wordt weggelaten. Overkoepelende domeinen staan er nooit in. "Zonder geldig domein" is geen filteroptie.
- **Toevoegknop** `.btn-toevoegen#vermogen-toevoegen-knop`, compact (Nieuwe CSS). `hidden` zolang het formulier open is.
- **Groep** per pijler/ondersteunend domein:
  ```html
  <section class="vermogen-groep" aria-labelledby="vg-kop-{domeinId}">
    <h3 class="groep-kop" id="vg-kop-{domeinId}">
      <span class="groep-picto">${pictogramHTML(domein, 'picto-klein')}</span>      <!-- altijd de span, ook zonder pictogram -->
      <span class="groep-naam">#HCASpeelt</span><span class="sr-only">, </span>
      <span class="pill"><span class="stip" style="${SOORT_KLEUR[type]}"></span>Pijler</span><span class="sr-only">, </span>
      <span class="groep-aantal">7 vermogens</span>                                      <!-- 0 vermogens / 1 vermogen / n vermogens -->
    </h3>
    <div role="table" aria-label="Vermogens bij #HCASpeelt">
      <div class="sr-only" role="row"><span role="columnheader">Nr.</span><span role="columnheader">Vermogen</span><span role="columnheader">Acties</span></div>
      …rijen…
    </div>
  </section>
  ```
  Lege groep: in plaats van de tabel `<p class="groep-leeg">Nog geen vermogens.</p>`.
- **Rij** `.structuur-rij.beheer-rij.vermogen-rij[role=row][data-id]`:
  ```html
  <span class="cel-nr" role="cell">1</span>                              <!-- positie in de groep -->
  <span class="cel-naam" role="cell">Teamindeling</span>                 <!-- span, gewoon gewicht -->
  <div class="kaart-acties cel-acties" role="cell">
    <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omhoog" data-id="{id}" aria-label="Teamindeling omhoog" [disabled bij eerste]>↑</button>
    <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omlaag" data-id="{id}" aria-label="Teamindeling omlaag" [disabled bij laatste]>↓</button>
    ${actieKnopHTML('bewerk', id, 'Bewerken', naam)}
    ${actieKnopHTML('verwijder', id, 'Verwijderen', naam)}
  </div>
  ```
  Zie §4 voor `actieKnopHTML`. Namen via `esc()`.
- **Voetnoot** `p.lijst-voetnoot`, als laatste kind van `#vermogen-lijst`, alleen bij "Alle domeinen" en als er overkoepelende domeinen zijn: "Projecten en Samenwerkingen zijn overkoepelende domeinen. Die hebben geen vermogens." Bij één: "Projecten is een overkoepelend domein. Dat heeft geen vermogens." Namen gescheiden door ", " en de laatste met " en ".
- **Groep "Zonder geldig domein"** (alleen na consolewerk, alleen bij "Alle domeinen", als laatste groep): kop met alleen `<span class="groep-naam">Zonder geldig domein</span>` + aantal, daaronder `<p class="groep-uitleg">Deze vermogens horen bij een domein dat niet meer bestaat of overkoepelend is. Kies via Bewerken een ander domein, of verwijder ze.</p>`, dan de tabel. ↑/↓ met het bestaande `onzichtbaar`-patroon.

**Toestanden van `#vermogen-lijst`:**

| Toestand | Inhoud `#vermogen-lijst` | Balk |
|---|---|---|
| Laden | `<p class="lijst-laden">Vermogens worden geladen...</p>` | `hidden` |
| Laden mislukt | zie hieronder | `hidden` |
| Geen pijlers/ondersteunende domeinen | `<p class="sectie-uitleg">Er zijn nog geen pijlers of ondersteunende domeinen. Een vermogen hoort altijd bij zo'n domein. <a href="#" class="tussen-link" data-nav="domeinen">Ga naar Domeinen</a> om er een toe te voegen.</p>` | `hidden` |
| Lege staat (0 vermogens) | leeg-blok | `hidden` |
| Gevuld | groepen + voetnoot | zichtbaar |

Lege staat:
```html
<div class="leeg-blok">
  <h3>Nog geen vermogens</h3>
  <p>Een vermogen is iets wat de club moet kunnen om een domein te laten werken, bijvoorbeeld <em>Ledenwerving</em> bij Leden of <em>Kascontrole</em> bij Financiën. Voeg het eerste vermogen toe.</p>
  <button class="btn-toevoegen" type="button" id="vermogen-toevoegen-knop">+ Vermogen toevoegen</button>
</div>
```
De lege staat behoudt zijn eigen uitleg (dat is geen introtekst; die is er alleen als er niets is). Er is altijd precies één `#vermogen-toevoegen-knop`: in de lege staat hier, anders in de balk. Het formulier opent op zijn vaste plek; de knop in het blok krijgt `hidden`.

Laden mislukt:
```html
<div class="meldingen"><div class="melding melding-fout" role="alert">De vermogens konden niet worden geladen. Controleer je verbinding en probeer het opnieuw.<button type="button" class="btn melding-actie" id="vermogen-herlaad">Opnieuw laden</button></div></div>
<p class="tussen-hint">Testomgeving: zijn de Firestore-regels voor vermogens al gepubliceerd?</p>   <!-- alleen bij SOORT test/ontwikkel én permission-denied -->
```
"Opnieuw laden" → "Bezig..." + `aria-disabled`, dan `laadEnRender()`; lukt het, focus naar `#vermogen-filter` (of de toevoegknop in de lege staat).

**Interacties:**
- **Openen** (zijmenu, of `data-nav="vermogensbeheer" data-filter="{id}"`) → `renderVermogensBeheer(gebruiker, { filter })`. Onbekend of overkoepelend filterdomein → "alle".
- **Filter wijzigen** (`change`) → alleen `#vermogen-lijst` opnieuw tekenen uit de al geladen gegevens, focus blijft op de keuzelijst. `#vermogen-filter-status` eerst leeg, na 100 ms: "7 vermogens bij Financiën." / "58 vermogens bij 13 domeinen." / "Nog geen vermogens bij Digitaal.". Meldingen worden niet gewist.
- Het filter blijft staan na elke actie; naar een andere pagina en terug = "alle".
- **+ Vermogen toevoegen** → formulier open, knop `hidden`, Domein = filterdomein (bij "alle": "Kies een domein"), focus in Naam.
- **Enter in Naam** → Opslaan. Esc doet niets in het formulier (wel: tooltip verbergen, §4).
- **Opslaan** → normaliseren, `valideerVelden`, `metOpslaan(opslaanKnop, voegVermogenToe…, { soort: 'formulier-lijst', fout: vermogen-form-fout, veldFouten })`.
  - Gelukt: formulier sluiten en leegmaken; filter ≠ "alle" en ≠ gekozen domein → filter naar het gekozen domein; lijst verversen; focus `#vermogen-toevoegen-knop`; `toonOk(vermogen-ok, 'Vermogen {naam} toegevoegd aan {domein}.')`.
  - Mislukt: formulier open, invoer blijft.
- **Annuleren** → sluiten en leegmaken, focus `#vermogen-toevoegen-knop`.
- **↑/↓** → `metOpslaan(knop, …, { soort: 'lijstactie', lijst: #vermogen-lijst, bezig: null, fout: vermogen-fout })`; de actie leest de vermogens van dít domein vers, wisselt, `schrijfVolgorde('vermogens', vanDitDomein)`. Verversen, `focusInLijst(...)`, `vermogen-volgorde` = "Vermogen {naam} staat nu op plaats {k} van {n} in {domein}."
- **Bewerken (potlood)** → rij wordt het bewerkformulier, focus in Naam.
- **Verwijderen (prullenbak)** → `confirm('Vermogen {naam} verwijderen? Dit kan niet ongedaan worden gemaakt.')`. OK: `metOpslaan(knop, verwijderVermogen, { soort: 'lijstactie', lijst, fout: vermogen-fout, bezig: null })`. **`bezig: null` is verplicht bij pictogramknoppen**: `zetBezig` zou anders de tekst "Bezig..." over het pictogram schrijven en bij het herstellen alleen tekst terugzetten (de svg is dan weg). De lijst krijgt `aria-busy`, de knoppen `aria-disabled` (gedimd, `cursor: progress`).

**Bewerkformulier in de rij:**
```html
<div class="structuur-rij beheer-rij vermogen-rij bewerken" role="row" data-id="{id}">
  <div class="pijler-bewerk-form vermogen-bewerk" role="cell">
    <div class="form-groep">
      <label class="form-label" for="vn-{id}">Naam</label>
      <input class="form-input" id="vn-{id}" value="{naam}" autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false" aria-describedby="vn-fout-{id}">
      <span class="form-fout" id="vn-fout-{id}"></span>
    </div>
    <div class="form-groep">
      <label class="form-label" for="vd-{id}">Domein</label>
      <select class="form-input" id="vd-{id}" aria-describedby="vd-fout-{id}">…huidig domein selected; bij een ongeldig domein "Kies een domein"…</select>
      <span class="form-fout" id="vd-fout-{id}"></span>
    </div>
    <div class="form-rij">
      <button class="btn" type="button" data-actie="bewerk-opslaan" data-id="{id}">Opslaan</button>
      <button class="btn" type="button" data-actie="bewerk-annuleer" data-id="{id}">Annuleren</button>
    </div>
    ${meldingenHTML(null, `vm-fout-${id}`)}
  </div>
</div>
```
(Opslaan en Annuleren blijven tekstknoppen; besluit 19 gaat over de rijknoppen.)
- Enter in `vn-{id}` = Opslaan.
- **Niets gewijzigd** → zonder schrijven terug, geen melding, focus op Bewerken van die rij.
- **Alleen naam** → `hernoemVermogen`. "✓ Vermogen {naam} opgeslagen."
- **Alleen domein** → `verplaatsVermogen`. "✓ Vermogen {naam} verplaatst naar {domein}."
- **Beide** (besluit 14): eerst het naamdocument van de nieuwe naam lezen; bestaat het voor een ander vermogen → dubbel-veldfout, niets verplaatst. Anders verplaatsen, dan hernoemen. "✓ Vermogen {nieuwe naam} opgeslagen en verplaatst naar {domein}."
- **Halve uitkomst** (verplaatst, hernoemen mislukt): verversen, bewerkformulier **opnieuw open op de nieuwe plek** met Domein = nieuw en de getypte naam; in `vm-fout-{id}`: "Het vermogen is verplaatst naar {domein}, maar de nieuwe naam is niet opgeslagen. {reden} Klik nog eens op Opslaan om de naam te wijzigen." ({reden} = `foutTekst(e, 'formulier-lijst')` zonder de staart "Wat je hebt ingevuld, staat er nog."). Bij een dubbele naam: reden als veldfout onder Naam, zin zonder reden, focus in Naam; anders focus op Opslaan.
- **Focus na verplaatsen:** filter "alle" → Bewerken van het verplaatste vermogen op zijn nieuwe plek. Filter op het oude domein → Bewerken van het vermogen dat nu op dezelfde positie staat (anders het laatste), anders `#vermogen-toevoegen-knop`. Het filter springt niet mee.
- **Annuleren** → lijst opnieuw tekenen, focus op Bewerken van die rij.

**Klassen:** `.sectie`, `.sectie-kop`, `.sectie-lijf`, `.beheer-balk`, `.filter-keuze`, `.form-*`, `.btn`, `.btn-toevoegen`, `.pijler-form`, `.pijler-bewerk-form`, `.meldingen`/`.melding`, `.structuur-rij.beheer-rij.vermogen-rij`, `.cel-nr`, `.cel-naam`, `.cel-acties`, `.kaart-acties`, `.btn-kaart-actie`, `.btn-volgorde`, `.btn-icoon` (nieuw), `.tip` (nieuw), `.onzichtbaar`, `.pill`, `.stip`, `.picto-klein`, `.vermogen-groep`, `.groep-*`, `.lijst-voetnoot`, `.lijst-laden`, `.leeg-blok`, `.sr-only`.

---

### Scherm 2: De beheerbalk op alle beheerpagina's (besluiten 13 en 18)

**Eén patroon:** `.beheer-balk` als eerste kind van `.sectie-lijf` → links `.filter-keuze` (label "Toon" + keuzelijst), rechts `.btn-toevoegen` → daaronder het toevoegformulier → de sectiemelding → de verborgen statusregels → de lijst.

#### 2a. Wijziging t.o.v. nu (v0.6.0), Domeinen en Bestuursfuncties

| | Nu | Nieuw |
|---|---|---|
| Volgorde Domeinen | `.filter-tabs` → `#structuur-lijst` → sectiemelding → `#structuur-volgorde` → `#structuur-toevoegen-knop` → `#structuur-form` | `.beheer-balk` [`.filter-keuze` met `#structuur-filter` + `#structuur-toevoegen-knop`] → `#structuur-form` → sectiemelding → `#structuur-volgorde` → `#structuur-filter-status` → (hint, zie 2b) → `#structuur-lijst` |
| Volgorde Bestuursfuncties | `#functie-lijst` → sectiemelding → `#functie-volgorde` → `#functie-toevoegen-knop` → `#functie-form` | `.beheer-balk` [`#functie-toevoegen-knop`] → `#functie-form` → sectiemelding → `#functie-volgorde` → `#functie-lijst` |
| Filter Domeinen | vier knoppen `.filter-knop` (Alles/Pijlers/Ondersteunend/Overkoepelend) in `.filter-tabs` | keuzelijst `#structuur-filter`, zie 2b |
| Knop | volle breedte, gestippeld, `style="margin-top:0"`, "+ Toevoegen" | `.btn-toevoegen`, compact (breedte naar inhoud, 38px hoog, rechts), inline-style weg, "+ Domein toevoegen" / "+ Bestuursfunctie toevoegen" (open vraag 1) |
| Formulier | onder de lijst | direct onder de balk, boven de lijst, volle breedte |
| Knop bij open formulier | `hidden` | ongewijzigd `hidden`; het filter blijft links staan |
| Focus bij openen / na Opslaan / Annuleren | eerste veld / toevoegknop | ongewijzigd |
| Sectiemelding | onder de lijst | onder balk en formulier, boven de lijst (afwijking 1) |
| Ruimte | — | de bestaande `gap:16px` van `.sectie-lijf`; lege meldingen heffen de gap op |

#### 2b. Domeinen: keuzelijst op soort

```html
<div class="beheer-balk">
  <div class="filter-keuze">
    <label class="form-label" for="structuur-filter">Toon</label>
    <select class="form-input" id="structuur-filter">
      <option value="alles">Alle soorten</option>
      <option value="pijler">Pijlers</option>
      <option value="domein">Ondersteunende domeinen</option>
      <option value="overkoepelend">Overkoepelende domeinen</option>
    </select>
  </div>
  <button class="btn-toevoegen" type="button" id="structuur-toevoegen-knop">+ Domein toevoegen</button>
</div>
```
- De waarden zijn dezelfde als de huidige `data-filter`, dus `actiefFilter` en `laadEnRender` blijven gelijk. De klikhandler op `.filter-tabs` wordt een `change`-handler op `#structuur-filter`: `actiefFilter = select.value; await laadEnRender()`; focus blijft op de keuzelijst.
- Verborgen statusregel `#structuur-filter-status` (eerst leeg, na 100 ms): "15 domeinen." / "3 pijlers." / "10 ondersteunende domeinen." / "2 overkoepelende domeinen.", bij een andere keuze dan "Alle soorten" gevolgd door " Volgorde wijzigen kan bij Alle soorten.".
- **↑/↓ blijven alleen werken bij "Alle soorten"**, zoals nu. De volgorde van de domeinen is één doorlopende reeks (de volgorde van de plaat, pijlers en ondersteunende domeinen door elkaar te zetten); wisselen binnen een gefilterde selectie zou buren verschuiven die je niet ziet. Bij een andere soort:
  - het bestaande `onzichtbaar`-patroon (`class="… onzichtbaar" tabindex="-1" aria-hidden="true" disabled`) en een lege `#`-kolom, zodat de kolommen gelijk blijven;
  - **nieuw:** boven de lijst `<p class="lijst-voetnoot" id="structuur-volgorde-hint">De volgorde wijzig je bij Toon: Alle soorten.</p>`, alleen bij een andere keuze dan "Alle soorten" (anders `hidden`). Zo weet je waarom de pijlen weg zijn.
- Lege uitkomst (bijvoorbeeld geen overkoepelende domeinen): bestaande tekst "Geen items gevonden." wordt "Geen domeinen van deze soort.".
- `.filter-tabs` en `.filter-knop.active` komen nergens anders voor: de CSS-regels mogen weg (controleer met grep).

#### 2c. Bestuursfuncties: balk met alleen de knop (advies)

```html
<div class="beheer-balk">
  <button class="btn-toevoegen" type="button" id="functie-toevoegen-knop">+ Bestuursfunctie toevoegen</button>
</div>
```
**Advies: geen filter.** Een club heeft 6–10 bestuursfuncties; die passen op één scherm. De kolom "Eindverantwoordelijk voor" toont al "Geen domeinen", dus wie wil opruimen ziet het meteen. Een keuzelijst "Met/zonder domeinen" kost een tabstop en een extra beslissing voor een lijst die je in één oogopslag overziet, en zou ↑/↓ net als bij Domeinen moeten verbergen. De knop staat op dezelfde plek (rechts) als op de andere pagina's, zodat de balk overal gelijk is. Als een club ooit meer dan ~15 functies heeft, is "Toon: Alle / Met domeinen / Zonder domeinen" de aangewezen uitbreiding (open vraag 5).

**Breedte van de balk:** Domeinen op 524px lijstbreedte (768px, menu uitgeklapt): keuzelijst 220 + label ~35 + knop ~170 + gaps = ~450px, past nu wel op één regel (de vier filterknoppen pasten niet). Op ≤700px onder elkaar: label boven de keuzelijst (44px hoog, volle breedte), daaronder de knop (volle breedte, 44px).

---

### Scherm 3: Beheer → Domeinen, domein met vermogens

**Link "n vermogens" (besluit 16): opgenomen, onder de domeinnaam.**
Onderbouwing met de nieuwe actiekolom (152px): het raster `28 24 minmax(120,1.2fr) 140 minmax(120,1fr) 152` + 5×12 gap heeft minimaal 644px nodig. Een eigen kolom van ~80px + gap zou dat 736px maken; dat past onder de oude grens van 760px wel, maar de naamkolom wordt dan te smal voor namen als "Accommodatie" plus nummer. Onder de naam kost het geen breedte en werkt het zowel in kolommen als gestapeld. Bij de nieuwe grens (stapelen ≤660px) is de naamkolom bij 661px ca. 140px breed: "12 vermogens" (13px, ~75px) past. Wel één regel extra hoogte per rij (18px).

Markup van de naamcel (`.cel-naam` blijft alleen de naam, omdat de code `rij.querySelector('.cel-naam').textContent` gebruikt):
```html
<span class="cel-domein" role="cell">
  <strong class="cel-naam">Leden</strong>
  <a href="#" class="tussen-link cel-sub" data-nav="vermogensbeheer" data-filter="{id}" aria-label="5 vermogens van Leden">5 vermogens</a>
</span>
```
- "1 vermogen" / "n vermogens" / "Nog geen vermogens" (`aria-label` "Nog geen vermogens bij Leden"). Overkoepelend: geen link.
- Aantal = `aantalVermogens` van het domein (al geladen, ontbreekt = 0).
- De rij houdt 6 kinderen, dus de `:nth-child(4/5)`-regels van de container query blijven kloppen.

**Verwijderen met vermogens (besluit 15):**
1. Klik prullenbak → eerst `leesAantalVermogens(id)` (`getDoc`). Mislukt het lezen → `confirm()` zoals nu (de regels beschermen).
2. Aantal > 0 → **geen** `confirm()`. In `structuur-fout` (via DOM):
   ```html
   Leden heeft nog 5 vermogens. Een domein met vermogens kan niet weg. Verplaats of verwijder die vermogens eerst.
   <a href="#" class="btn melding-actie" data-nav="vermogensbeheer" data-filter="{id}">Naar de vermogens van Leden</a>
   ```
   Enkelvoud "nog 1 vermogen". Focus blijft op de prullenbak; die krijgt `aria-describedby="structuur-fout"`. Melding buiten beeld → `scrollIntoView({ block: 'nearest' })` na het focussen.
3. **Race** (aantal was 0, OK, regels weigeren): `permission-denied` opvangen, aantal opnieuw lezen, bij > 0 dezelfde melding in plaats van "geen toestemming" (notitie 5).

**Bewerken → Overkoepelend met vermogens:**
```html
<div class="form-groep" role="radiogroup" aria-labelledby="bs-{id}">
  <span class="form-label" id="bs-{id}">Soort</span>
  <div class="form-rij soort-keuze">…</div>
  <div class="form-fout" id="bs-fout-{id}"></div>
</div>
```
- Opslaan met soort Overkoepelend (domein is nu geen overkoepelend): vóór `metOpslaan` het aantal vers lezen; > 0 → niets opslaan, in `bs-fout-{id}`: "Een overkoepelend domein heeft geen vermogens, en Leden heeft er nog 5. Verplaats of verwijder die eerst, of kies Pijler of Ondersteunend domein." + `a.btn.melding-actie` "Naar de vermogens van Leden". Radiogroep `aria-invalid="true"`, rondje "Overkoepelend domein" `aria-describedby="bs-fout-{id}"` en focus. Andere invoer blijft.
- Andere soort kiezen → `bs-fout` leeg, attributen weg. Race: als bij verwijderen, melding in `bs-fout-{id}`.

---

### Scherm 4: Home

**Kerncijfers:** `cijfers-3` gaat van de markup af (`.cijfers` is al 4 kolommen, ≤700px 2×2). Vierde kerncijfer:
```html
<div class="cijfer"><span class="n" id="cijfer-vermogens"><span aria-hidden="true">–</span><span class="sr-only">wordt geladen</span></span><span class="l">Vermogens</span></div>
```
- Gelukt: `textContent = aantal`. Geen link.
- Mislukt: `replaceChildren(<span aria-hidden="true">–</span>, <span class="sr-only">niet geladen</span>)`.
- Telling = vermogens met een bestaand domein van type `pijler`/`domein`.

**Domeinkaart**, tussen `.kaart-omschrijving` en `.kaart-voet`:
```html
<p class="kaart-vermogens">7 vermogens</p>              <!-- "1 vermogen" -->
<p class="kaart-vermogens leeg">Nog geen vermogens</p>  <!-- 0 -->
```
Overkoepelend: geen regel. Vermogens niet geladen: op geen enkele kaart een regel.

**Laden:** `renderStructuurGrid` met `Promise.allSettled([laadStructuurelementen(), laadVermogens()])`. Vermogens mislukt → kaarten zonder regel, kerncijfer als hierboven, en de hint:
```html
<p class="vermogens-hint" id="vermogens-hint" role="status" hidden></p>   <!-- in .sectie-lijf, vóór #structuur-grid -->
```
tekst: "Het aantal vermogens kon niet worden geladen. Herlaad de pagina om het opnieuw te proberen."

---

### Zijmenu-item en pictogrammen

`ZIJMENU`, groep Beheer, tweede item: `{ id: 'vermogensbeheer', naam: 'Vermogens', ico: 'puzzel' }`. Kruimelpad `[['Home','home'],['Beheer','beheer'],[navNaam('vermogensbeheer')]]`; tabtitel via `navigeer` → "Vermogens · clubKOMPAS".

Nieuwe sleutels in `MENU_ICOON` (48-viewBox, via `menuIcoon()`: lijn 3, rond, `aria-hidden`):
```js
puzzel:     '<path d="M9 15 H19 A4 4 0 1 1 27 15 H37 V25 A4 4 0 1 1 37 33 V39 H9 Z"/>',
potlood:    '<path d="M31 9 L39 17 L18 38 L9 39 L10 30 Z"/><path d="M27 13 L35 21"/>',
prullenbak: '<path d="M8 13 H40"/><path d="M19 13 V8 H29 V13"/><path d="M12 13 L14.5 40 H33.5 L36 13"/><path d="M20 20 V33"/><path d="M28 20 V33"/>',
```
Op 18px wordt de lijn 1,125px, gelijk aan de menu-items.

---

## 4. Actieknoppen met pictogram (besluit 19)

**Geldt voor:** de rijknoppen Bewerken en Verwijderen in Domeinen, Vermogens en Bestuursfuncties. ↑/↓ blijven pijlen (tekst), maar krijgen dezelfde hoogte. Opslaan/Annuleren in formulieren blijven tekst.

**Helper** (in `main.js`, bij de gedeelde UI-helpers):
```js
// Pictogramknop in een beheerrij: naam per rij voor de schermlezer, tooltip = het zichtbare label
const ACTIEKNOP = { bewerk: ['Bewerken', 'potlood', ''], verwijder: ['Verwijderen', 'prullenbak', ' gevaar'] }
function actieKnopHTML(actie, id, soort, naam) {          // soort: 'bewerk' | 'verwijder'; actie = data-actie-waarde
  const [label, ico, extra] = ACTIEKNOP[soort]
  return `<button class="btn-kaart-actie btn-icoon${extra}" type="button" data-actie="${esc(actie)}" data-id="${esc(id)}" aria-label="${label}: ${esc(naam)}">${menuIcoon(ico)}<span class="tip" aria-hidden="true">${label}</span></button>`
}
```
Gebruik met `actie` = `'bewerk'`/`'verwijder'` (de bestaande `data-actie`-waarden in alle drie de lijsten blijven ongewijzigd, dus `focusInLijst`, de handlers en `zetBezig` werken zonder aanpassing; de Domeinen-knop houdt `data-aantal` niet nodig, Bestuursfuncties wel: geef `data-aantal` mee via een extra parameter of zet het na het tekenen).

**Toegankelijke naam:** `aria-label="Bewerken: Parkonderhoud"` / `"Verwijderen: Parkonderhoud"`. Het zichtbare label (de tooltip) "Bewerken" staat vooraan in de naam (WCAG 2.5.3; spraakbesturing "klik Bewerken" werkt). De `.tip` is `aria-hidden`; de `aria-label` wint toch, maar zo hoort niemand iets dubbel. Geen `title`-attribuut (dubbel voorgelezen en niet bij focus).

**Tooltip** (zelfde patroon als het ingeklapte zijmenu, CK-044):
- Verschijnt bij `:hover` en `:focus-visible`, boven de knop, rechts uitgelijnd met de knop (blijft zo binnen de lijst, ook bij de meest rechtse knop).
- `--petrol-dark` met `--on-petrol`, 12px, `font-weight:600`, 4px radius, `--schaduw-tooltip`.
- **Aanwijsbaar** (1.4.13): een onzichtbare brug van 6px tussen tooltip en knop (`::after`).
- **Wegklikbaar** (1.4.13): Esc zet de klasse `tip-uit` op `#inhoud` en onthoudt de knop; bij `pointerover`/`focusin` op een **andere** `.btn-icoon` gaat de klasse eraf. Eén listener op `document` (zoals de bestaande Esc-listener voor het zijmenu: voeg het toe in dezelfde `keydown`-handler, na de paneel- en zijmenu-tak). Esc in een open formulier doet verder niets.
- **Blijvend:** geen timer.
- Op een touchscherm verschijnt de tooltip niet (geen hover); potlood en prullenbak zijn daar gangbaar genoeg, en de schermlezer leest de volledige naam.

**Verwijderen herkenbaar zonder alleen kleur:**
1. eigen vorm (prullenbak, niet een kruis dat op "sluiten" lijkt);
2. **extra afstand**: 12px tussen potlood en prullenbak (gap 6 + `margin-left: 6px`) tegenover 6px tussen de andere knoppen; op de telefoon staat de prullenbak helemaal rechts (`margin-left: auto`), het verst van ↑/↓ en potlood;
3. de tooltip en de schermlezernaam zeggen "Verwijderen";
4. altijd een bevestiging (`confirm()`, of de blokkade-melding bij een domein met vermogens);
5. pas daarna kleur: rode lijn en rand bij hover **en** bij focus (`--fout`).

**Maten:**

| | Desktop/tablet | Telefoon (≤700px) |
|---|---|---|
| ↑, ↓, potlood, prullenbak | 32 × 28px, pictogram 18px | **44 × 44px** (alle vier, alle drie de lijsten) |
| Actiekolom | 32+32+32+32 + 6+6+12 = **152px** | gestapeld op een eigen regel: 4×44 + 6+6 + rest = past in 303px |

**Bezig:** bij Verwijderen (en elke andere `metOpslaan` met een pictogramknop) altijd `bezig: null` doorgeven (zie Scherm 1). Dat geldt ook voor de bestaande verwijderaanroepen in Domeinen en Bestuursfuncties: die geven nu geen `bezig` mee en krijgen dus "Bezig..." — **aanpassen**.

**Bestuursfuncties "nog in gebruik":** de bestaande blokkade (tekst in `functie-fout`) blijft; de prullenbak houdt `data-aantal`.

---

## Meldingen (CK-023-patroon)

Plek: **veld** = `.form-fout` onder het veld + `.fout` + `aria-invalid` + focus op het veld. **Formulier** = `vermogen-form-fout` / `vm-fout-{id}`. **Sectie** = `vermogen-ok` / `vermogen-fout`.

| Situatie | Tekst | Plek |
|---|---|---|
| Naam leeg | Vul een naam in. | veld Naam |
| 1 teken | Een naam heeft minimaal 2 tekens. | veld |
| > 100 tekens | Een naam heeft maximaal 100 tekens. Nu zijn het er {n}. | veld |
| Eerste teken is een toegestaan leesteken | Begin de naam met een letter of cijfer. | veld |
| Eén ongeldig teken | Het teken {x} kan niet in een naam. Gebruik letters (ook met accent, zoals é, ë of ç), cijfers, spaties en & ' - . , ( ) + | veld |
| 2 of meer ongeldige tekens | De tekens {x}, {y} en {z} kunnen niet in een naam. Gebruik … (max. 3, uniek, in volgorde van voorkomen) | veld |
| Emoji/onzichtbaar teken (`\p{Extended_Pictographic}`, `\p{Cf}`, `\p{Cc}`) | Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji. Gebruik … | veld |
| Geen domein | Kies een domein. | veld Domein |
| Dubbel, ander domein | Dit vermogen bestaat al bij {domein}. Kies een andere naam, of verplaats het bestaande vermogen via Bewerken. | veld Naam |
| Dubbel, zelfde domein | Dit vermogen staat al bij {domein}. Misschien is een eerdere poging toch gelukt: kijk in de lijst. | veld Naam |
| Naam bezet, geen vermogen | Deze naam is al in gebruik, maar het vermogen is niet te vinden. Kies voorlopig een andere naam en meld het aan SVN10: support@svn10.nl. | veld Naam (adres als tekst) |
| Domein intussen verwijderd | Het domein {domein} bestaat niet meer. Kies een ander domein. (keuzelijst bijgewerkt) | veld Domein |
| Domein intussen overkoepelend | {domein} is nu een overkoepelend domein en kan geen vermogens hebben. Kies een ander domein. | veld Domein |
| `aborted` | Iemand anders wijzigde dit tegelijk. De lijst is bijgewerkt. Kijk of je wijziging nodig is en probeer het zo nodig opnieuw. (lijst meteen verversen) | formulier / sectie |
| Vermogen bestaat niet meer | Dit vermogen bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt. | sectie (`weg`) |
| Offline, server, time-out, rechten, sessie, onbekend | bestaande CK-023-teksten, staart I bij formulieren, staart L bij ↑/↓ en Verwijderen | formulier / sectie |
| Halve uitkomst | Het vermogen is verplaatst naar {domein}, maar de nieuwe naam is niet opgeslagen. {reden} Klik nog eens op Opslaan om de naam te wijzigen. | `vm-fout-{id}` |
| Gelukt | ✓ Vermogen {naam} toegevoegd aan {domein}. / opgeslagen. / verplaatst naar {domein}. / opgeslagen en verplaatst naar {domein}. / verwijderd. | `vermogen-ok` |
| Domeinen: verwijderen geblokkeerd | {domein} heeft nog {n} vermogen(s). Een domein met vermogens kan niet weg. Verplaats of verwijder die vermogens eerst. [Naar de vermogens van {domein}] | `structuur-fout` |
| Domeinen: overkoepelend geblokkeerd | Een overkoepelend domein heeft geen vermogens, en {domein} heeft er nog {n}. Verplaats of verwijder die eerst, of kies Pijler of Ondersteunend domein. [Naar de vermogens van {domein}] | `bs-fout-{id}` |
| Laden mislukt | De vermogens konden niet worden geladen. Controleer je verbinding en probeer het opnieuw. [Opnieuw laden] | in `#vermogen-lijst` |

Volgorde van de naamcontrole: ongeldige tekens (emoji eerst) → eerste teken → minimaal 2 → maximaal 100. Lengte in tekens (`[...naam].length`).

---

## Nieuwe CSS

Alleen bestaande tokens. Onderaan `src/style.css` onder `/* ── Beheer en vermogens (CK-020) ── */`. **Vervang** daarbij de bestaande regels `.domein-rij { grid-template-columns … 240px }`, `.functie-rij { … 240px }` en de twee `@container`-blokken (760px en 590px) door de versies hieronder.

```css
/* Beheerbalk: filter links, + Toevoegen rechts (besluiten 13 en 18) */
.beheer-balk { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.beheer-balk .btn-toevoegen { margin: 0 0 0 auto; padding: 0 16px; min-height: 38px; }
.beheer-balk .btn-toevoegen:hover { background: var(--card); }
.btn-toevoegen:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; box-shadow: 0 0 0 2px var(--text); }
.filter-keuze { display: flex; align-items: center; gap: 8px; }
.filter-keuze select { min-width: 220px; }
.sectie-uitleg { font-size: var(--fs-toelichting); line-height: 19px; color: var(--text); }   /* alleen nog bij "geen pijlers" */
a.btn { text-decoration: none; }
.form-fout .melding-actie { display: flex; width: fit-content; margin-top: 8px; }

/* Rijknoppen: ↑/↓ en pictogramknoppen even hoog; tooltip als in het ingeklapte zijmenu (besluit 19) */
.cel-acties .btn-volgorde { height: 28px; padding: 0; }
.btn-icoon { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 28px; padding: 0; }
.btn-icoon svg { width: 18px; height: 18px; }
.cel-acties .btn-icoon.gevaar { margin-left: 6px; }                          /* 12px tot het potlood */
.btn-icoon.gevaar:focus-visible { color: var(--fout); border-color: var(--fout); }
.btn-icoon .tip {
  display: none; position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 40;
  padding: 4px 8px; white-space: nowrap;
  background: var(--petrol-dark); color: var(--on-petrol);
  font-size: var(--fs-label); line-height: 16px; font-weight: 600; letter-spacing: 0; text-transform: none;
  border-radius: 4px; box-shadow: var(--schaduw-tooltip);
}
.btn-icoon .tip::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 6px; }   /* brug: tooltip aanwijsbaar */
.btn-icoon:is(:hover, :focus-visible) .tip { display: block; }
.tip-uit .btn-icoon .tip { display: none; }

/* Rasters met de smallere actiekolom (152px) */
#structuur-lijst, #functie-lijst { container-type: inline-size; }
.domein-rij  { grid-template-columns: 28px 24px minmax(120px, 1.2fr) 140px minmax(120px, 1fr) 152px; }   /* min. 644px */
.functie-rij { grid-template-columns: 28px minmax(140px, 1.2fr) minmax(140px, 1fr) 152px; }              /* min. 496px */
@container (max-width: 660px) {
  .beheer-rij.beheer-kop.domein-rij { display: none; }
  .domein-rij { grid-template-columns: 24px 24px 1fr; row-gap: 4px; }
  .domein-rij > :nth-child(4), .domein-rij > :nth-child(5) { grid-column: 3; }
  .domein-rij .cel-acties { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
}
@container (max-width: 500px) {
  .beheer-rij.beheer-kop.functie-rij { display: none; }
  .functie-rij { grid-template-columns: 24px 1fr; row-gap: 4px; }
  .functie-rij > :nth-child(3) { grid-column: 2; }
  .functie-rij .cel-acties { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
}

/* Vermogenslijst: groepen per domein */
#vermogen-lijst { container-type: inline-size; display: flex; flex-direction: column; gap: 24px; }
.vermogen-form .form-groep, .vermogen-bewerk .form-groep { max-width: 480px; }
.vermogen-groep { display: flex; flex-direction: column; }
.groep-kop {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px;
  padding: 0 0 6px; border-bottom: 2px solid var(--border);
  font-size: var(--fs-lopend); line-height: 19px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; color: var(--petrol);
}
.groep-naam { min-width: 0; overflow-wrap: anywhere; }
.groep-picto { display: flex; }
.groep-kop .pill { margin-top: 0; font-weight: 400; text-transform: none; color: var(--text); }
.groep-aantal { margin-left: auto; font-size: var(--fs-toelichting); font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--muted); white-space: nowrap; }
.vermogen-rij { grid-template-columns: 28px minmax(0, 1fr) 152px; }
.groep-leeg { padding: 8px 0 0 40px; font-size: var(--fs-toelichting); font-style: italic; color: var(--muted); }  /* 40 = nr 28 + gap 12 */
.groep-uitleg { padding-top: 6px; font-size: var(--fs-toelichting); line-height: 19px; color: var(--text); }
.lijst-voetnoot, .lijst-laden { font-size: var(--fs-toelichting); line-height: 19px; color: var(--muted); }
.leeg-blok {
  background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--petrol); border-radius: 4px;
  padding: 16px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start;
}
.leeg-blok h3 { font-size: var(--fs-paragraaf); line-height: 22px; font-weight: 700; color: var(--petrol); }
.leeg-blok p { font-size: var(--fs-lopend); line-height: 21px; max-width: 60ch; }
.leeg-blok .btn-toevoegen { padding: 0 16px; min-height: 38px; }
@container (max-width: 400px) {
  .vermogen-rij { grid-template-columns: 24px minmax(0, 1fr); row-gap: 4px; }
  .vermogen-rij .cel-acties { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
  .groep-kop { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; }
  .groep-kop .groep-picto  { grid-row: 1; grid-column: 1; }
  .groep-kop .groep-naam   { grid-row: 1; grid-column: 2; }
  .groep-kop .groep-aantal { grid-row: 1; grid-column: 3; }
  .groep-kop .pill         { grid-row: 2; grid-column: 2; justify-self: start; }
  .groep-leeg { padding-left: 28px; }
}

/* Domeinen: aantal vermogens onder de naam (besluit 16) */
.cel-domein { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cel-sub { font-size: var(--fs-toelichting); line-height: 18px; font-weight: 600; width: fit-content; }

/* Home */
.card .kaart-vermogens { margin-top: 8px; font-size: var(--fs-toelichting); line-height: 18px; font-weight: 600; color: var(--petrol); }
.card .kaart-vermogens.leeg { font-weight: 400; font-style: italic; color: var(--muted); }
.vermogens-hint { font-size: var(--fs-toelichting); line-height: 19px; color: var(--muted); }

@media (max-width: 700px) {
  .beheer-balk { flex-direction: column; align-items: stretch; }
  .beheer-balk .btn-toevoegen { margin-left: 0; min-height: 44px; }
  .filter-keuze { flex-direction: column; align-items: stretch; gap: 4px; }
  .filter-keuze select { min-width: 0; width: 100%; height: 44px; }
  .cel-acties .btn-volgorde, .cel-acties .btn-icoon { width: 44px; height: 44px; }   /* alle beheerlijsten */
  .cel-acties .btn-icoon.gevaar { margin-left: auto; }                              /* prullenbak het verst weg */
}
```

**Te verwijderen:** `.cijfers.cijfers-3`, `.filter-tabs`, `.filter-knop.active`; de inline `style="margin-top:0"` op beide toevoegknoppen.

Specificiteit: `.card .kaart-vermogens` (0,2,0) wint van `.card p`; `.filter-keuze select` staat ná `select.form-input` met gelijke specificiteit (44px op mobiel wint); `.cel-acties .btn-volgorde` overschrijft de `padding` van `.btn-kaart-actie`.

## Contrast (berekend met WCAG-luminantie)

| Element | Combinatie | Licht | Donker | Oordeel |
|---|---|---|---|---|
| Groepkop, link "n vermogens" | `--petrol` op `--surface` | 4,50 : 1 | 6,98 : 1 | AA (licht op de grens: nooit lichter, nooit < 13px, geen opacity) |
| Aantal in groepkop, voetnoot, hint, "Nog geen vermogens." | `--muted` op `--surface` | 4,62 : 1 | 7,44 : 1 | AA |
| **Pictogram in rust** (potlood, prullenbak, pijlen) | `--muted` op `--surface` | 4,62 : 1 | 7,44 : 1 | ≥ 3:1 (1.4.11) |
| **Pictogram bij hover** | `--petrol` / `--fout` op `--surface` | 4,50 / 4,99 | 6,98 / 7,27 | ≥ 3:1 |
| **Tooltip** | wit op `--petrol-dark` | 6,5 : 1 | 7,6 : 1 | AA |
| Kaart "7 vermogens" | `--petrol` op `--card` | 4,91 : 1 | 6,23 : 1 | AA |
| Kaart "Nog geen vermogens" | `--muted` op `--card` | 5,03 : 1 | 6,64 : 1 | AA |
| Knop in melding (`a.btn`) | `--petrol` op `--card` | 4,91 : 1 | 6,23 : 1 | AA |
| Veld-/meldingfout | `--fout` op `--surface` / `--card` | 4,99 / 5,44 | 7,27 / 6,48 | AA |
| Focusring knoppen | oranje 2px (+ donkere ring bij `.btn-toevoegen`) | — | — | zoals bestaand |

De knoprand (`--border` op `--surface`, ~1,3:1) is niet de drager van de knop; het pictogram is dat wel (≥ 3:1). Zo is het ook bij de huidige tekstknoppen.

## Toegankelijkheid

**Tabvolgorde Vermogens:** Direct naar inhoud → zijmenu → kruimelpad → **Toon** → **+ Vermogen toevoegen** → (formulier) → per rij: ↑ → ↓ → potlood → prullenbak (uitgeschakelde ↑/↓ overgeslagen) → footer. **Domeinen:** Toon → + Domein toevoegen → per rij: link "n vermogens" → ↑ → ↓ → potlood → prullenbak. **Bestuursfuncties:** + Bestuursfunctie toevoegen → rijen.

**Focusafspraken (nooit op `<body>`):**

| Na | Focus |
|---|---|
| Openen pagina | `#inhoud` |
| Filter wijzigen (alle pagina's) | blijft op de keuzelijst |
| + … toevoegen | eerste veld |
| Toevoegen gelukt / Annuleren | de toevoegknop |
| Formulierfout | Opslaan; veldfout → het veld |
| ↑/↓ | dezelfde knop, anders het potlood van die rij (`focusInLijst`) |
| Bewerken | Naam |
| Bewerken gelukt / Annuleren / niets gewijzigd | het potlood van die rij (verplaatsen: zie Scherm 1) |
| Verwijderen gelukt (Vermogens) | potlood van het volgende vermogen in de groep, anders het vorige, anders de toevoegknop |
| Verwijderen mislukt | dezelfde prullenbak |
| `weg` | de toevoegknop |
| Domeinen: blokkade | prullenbak blijft (met `aria-describedby`) / rondje Overkoepelend |

**Schermlezer:** groepkop = `h3` ("#HCASpeelt, Pijler, 7 vermogens, kop niveau 3"); per groep een tabel "Vermogens bij #HCASpeelt"; rijknoppen "Bewerken: Teamindeling, knop"; `vermogen-volgorde`, `vermogen-filter-status`, `structuur-filter-status` verborgen `role="status"`, eerst leeg, dan gevuld; succes `role="status"`, fout `role="alert"`.

**Toetsenbord:** Enter in Naam = Opslaan. Esc: sluit het mobiele paneel, verbergt anders de tooltip (zijmenu of rijknop); in formulieren verder niets.

## Responsief gedrag

| Breedte | Lijstbreedte | Vermogens | Domeinen | Bestuursfuncties | Home |
|---|---|---|---|---|---|
| ≥1200px, menu uit | ~1028px | balk op één regel; rij op één regel | kolommen; link onder naam | kolommen | 4 cijfers, 3 kaarten per rij |
| 1024px, menu uit | ~780px | idem | kolommen | kolommen | idem |
| 768px, menu ingeklapt | 652px | idem | **gestapeld** (≤660) | kolommen | 4 cijfers, 2 kaarten |
| 768px, menu uitgeklapt | 524px | balk op één regel; rij op één regel, naam 320px | gestapeld; balk op één regel | kolommen (> 500) | 4 cijfers (label op 2 regels), 2 kaarten |
| ≤700px (375px) | ~303px | balk onder elkaar (label boven keuzelijst, beide 44px, volle breedte); groepkop naam + aantal op regel 1, pill op regel 2; rij: nummer + naam, daaronder vier knoppen van 44×44 met de prullenbak rechts | gestapeld; zelfde knoppen | gestapeld; zelfde knoppen | 2×2 cijfers, 1 kaart per rij |

Geen horizontale scroll: tekstkinderen in flex/grid hebben `min-width: 0` of `minmax(0, …)`; lange namen breken met `overflow-wrap: anywhere`. De tooltip is `position: absolute` en rechts uitgelijnd, dus hij vergroot de paginabreedte niet.

---

## Implementatienotities voor de bouwer

1. **Menu en navigatie.** `ZIJMENU` + `NAV_DOEL` (`['vermogensbeheer', renderVermogensBeheer]`) + `MENU_ICOON.puzzel/potlood/prullenbak`.
2. **Filter meegeven.** `navigeer(id, gebruiker, opties = {})` → `await doel(gebruiker, opties)`. In `bindAppShell`: `navigeer(link.dataset.nav, gebruiker, link.dataset.filter ? { filter: link.dataset.filter } : {})`. `renderClubBeheer` krijgt dan `{}`; onschuldig.
3. **Laden.** `renderVermogensBeheer` tekent het vaste deel en bindt; `laadEnRender()` = `Promise.all([laadStructuurelementen(), laadVermogens()])`, bewaart beide in de closure, sorteert met `sorteerDomeinen`. Faalt het: de laadfoutstaat.
4. **`metOpslaan` met dynamische veldteksten.** `zetVeldFout(inputId, foutId, tekst || e?.tekst || foutTekst(e, soort))`. Transacties gooien `{ code: 'dubbel-vermogen' | 'naam-bezet' | 'domein-weg' | 'domein-overkoepelend', tekst }`. Na `dubbel-vermogen` alleen `#vermogen-lijst` verversen. `'vermogen-weg'` in `WEG_CODES` met eigen tekst; `aborted` in `FOUTTEKSTEN` + lijst verversen.
5. **Domeinen-race.**
   ```js
   let blokkade = 0
   const uitkomst = await metOpslaan(knop, async () => {
     try { await verwijderStructuurelement(id) }
     catch (e) { if (e?.code === 'permission-denied') blokkade = await leesAantalVermogens(id).catch(() => 0); throw e }
   }, { soort: 'lijstactie', lijst: lijstEl, fout: sectieFout, bezig: null })
   if (blokkade > 0) toonVermogensBlokkade(sectieFout, item, blokkade)
   ```
   `toonVermogensBlokkade(el, domein, aantal, tekst)` bouwt tekst + `<a class="btn melding-actie" data-nav data-filter>` via de DOM.
6. **Melding in beeld.** `meldingInBeeld(el)`: na een sectiemelding door een rijactie, `if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'nearest' })`, ná het focussen. Niet bij toevoegen.
7. **Statusregels**: eerst leeg, na 100 ms vullen.
8. **Eén `#vermogen-toevoegen-knop`**; haal hem per keer op met `getElementById`.
9. **Domeinen (besluit 18):** `.filter-tabs` → `.filter-keuze` met `#structuur-filter` (`change`-handler, focus blijft), de hint `#structuur-volgorde-hint` tonen bij een andere soort, `#structuur-filter-status` vullen. `kanVerplaatsen = actiefFilter === 'alles'` blijft. De klikhandler op `.filter-tabs` vervalt.
10. **Pictogramknoppen (besluit 19):** `actieKnopHTML` in alle drie de lijsten; `bezig: null` bij alle `metOpslaan`-aanroepen vanaf een pictogramknop (ook de bestaande verwijderacties van Domeinen en Bestuursfuncties); Esc-tak `tip-uit` in de bestaande `keydown`-listener, plus `pointerover`/`focusin` op `document` om hem weer toe te staan (zelfde aanpak als `tipItem` in CK-044). Controleer dat `focusInLijst` en de bestaande `.cel-naam`-lezingen blijven werken (ongewijzigde `data-actie`/`data-id`).
11. **Introtekst (besluit 20):** niet bouwen.
12. **Home:** `allSettled`; `cijfers-3` uit de markup.
13. **Niet aanraken:** CK-044-shell (behalve menu-item, `navigeer`-opties en de Esc-tak), `bindMeldblokken`, `schrijfVolgorde`, `focusInLijst`, `zichtbareTerugval`.
14. **Testen (naast de spec-scenario's):** 375px, 768px met menu in- en uitgeklapt (Domeinen stapelt bij 652 én 524, Bestuursfuncties niet), ≥1200px; licht en donker; tooltip met muis (aanwijzen, naar de tooltip bewegen, Esc), met Tab (verschijnt bij focus, Esc verbergt, volgende knop toont weer); VoiceOver: "Bewerken: Teamindeling, knop"; verwijderen met "Bezig" (pictogram blijft staan); filter op soort bij Domeinen (pijlen weg + hint); filter vanuit Domeinen naar Vermogens (link én meldingknop); lege staat; halve uitkomst.

## Open vragen voor Paul

1. **Knopteksten:** "+ Domein toevoegen" / "+ Vermogen toevoegen" / "+ Bestuursfunctie toevoegen" in plaats van overal "+ Toevoegen"? *Advies: ja* (ongewijzigd door besluit 19: dat gaat over de rijknoppen). Bovenaan, los van de lijst, zegt "+ Toevoegen" niet meer wat je toevoegt, ook niet voor VoiceOver.
2. **Vaste hulptekst over toegestane tekens onder het naamveld?** *Advies: nee.* De veldfout noemt het foute teken en wat wel mag.
3. **Sectiemelding naar boven, ook bij Domeinen en Bestuursfuncties** (wijziging op CK-023)? *Advies: ja.* Hoort bij de balk bovenaan; voor rijacties scrolt de app de melding in beeld.
4. ~~Knoppen ≥ 44px op de telefoon alleen in de vermogenslijst?~~ **Vervallen door besluit 19:** alle rijknoppen in alle beheerlijsten worden 44×44 op de telefoon. Geen vervolgpunt meer nodig.
5. **Nieuw — Bestuursfuncties zonder filter?** *Advies: ja, alleen de knop in de balk* (§2c). Een filter "met/zonder domeinen" pas als een club meer dan ~15 functies heeft.
6. **Nieuw — ↑/↓ ook als pictogram?** *Advies: nee.* De pijltekens zijn al een pictogram, zijn smal (32px) en worden overal begrepen; ze krijgen alleen dezelfde hoogte (28px / 44px op de telefoon).
