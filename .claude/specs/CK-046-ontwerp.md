# Ontwerp: CK-046 — Projecten en samenwerkingen

Fase 3 (ontwerp), 23 november 2026 · Spec: `CK-046-projecten-samenwerkingen.md` · Besluiten: `CK-046-besluiten.md` (1–15, leidend) · Patroon: `CK-020-ontwerp.md` (beheerbalk, rijen, pictogramknoppen, meldingen)

**Prototype (klikbaar, privé):** https://claude.ai/artifact/RENY5LyFsyvUSMELuvvj8y
Bevat Beheer → Projecten (filter, lijst met 6 projecten, ↑/↓, bewerken, verwijderen, open formulier met de datumfout) en het blok Projecten/Samenwerkingen op de plaat. Licht/donker te wisselen. Vereenvoudigd: geen shell/zijmenu, verwijderen zonder `confirm()`, bewerken opent het formulier bovenaan (in de app: in de rij).

**Voorrang:** besluiten 10–15 > dit ontwerp > spec. Wat dit verandert t.o.v. de spec:
1. Veld `periode` vervalt; ervoor in de plaats **`begindatum`** en **`einddatum`** (string, `JJJJ-MM-DD` of `''`; besluit 10). Regels: beide `tekstTot(…, 10)` en leeg of `matches('[0-9]{4}-[0-9]{2}-[0-9]{2}')`; `hasOnly/hasAll` aanpassen. Volgorde einde ≥ begin alleen in de app (zoals de unieke naam).
2. Plaat: bij een blok met `bevat` **geen domeinomschrijving**, wel de kaartjes (besluit 12). Lege tekst "Er zijn geen projecten." / "Er zijn geen samenwerkingen.", ook als alle projecten afgerond zijn (de spectekst "Geen lopende projecten" vervalt).

---

## Schermen

### Scherm 1: Beheer → Projecten / Samenwerkingen

Eén `renderOnderdeelBeheer(gebruiker, soort)`; opbouw gelijk aan `renderVermogensBeheer` (CK-020 scherm 1). Id-voorvoegsel `onderdeel-` (één pagina tegelijk open).

**Lay-out:**
```
┌ sectie-kop ── PROJECTEN ──────────────────────────────────────────────┐
│ TOON [Alle projecten ▾]                          [ + Project toevoegen ] │ .beheer-balk
│ ┌ #onderdeel-form (alleen open na klik) ───────────────────────────────┐ │
│ │ NAAM / STATUS / PERIODE (OPTIONEEL) [begin][eind] / EIGENAAR / OMSCHR.│ │
│ │ [OPSLAAN] [ANNULEREN]                                                │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ▌✓ Project LED-scorebord toegevoegd.                                     │ sectiemelding
│ (p.tussen-hint als geen domein bevat=projecten)                          │
│ #  PROJECT            STATUS            PERIODE              EIGENAAR    │ beheer-kop
│ 1  Ver(nieuw)bouw     (Lopend)          sep 2026 – jun 2028  Voorzitter [↑][↓][✎] [🗑]│
│    Renovatie en …                                                        │
│ 4  LED-scorebord      (In voorbereiding) mrt 2027 – jun 2027 Voorzitter  │
│ 6  Terras clubhuis    (Afgerond)        apr 2025 – sep 2025  —           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Balk** (`.beheer-balk#onderdeel-balk`, `hidden` tijdens laden en bij laadfout):
- Projecten: `.filter-keuze` met `<label class="form-label" for="onderdeel-filter">Toon</label>` + `<select class="form-input" id="onderdeel-filter">`: `alle` "Alle projecten" (standaard), `in-voorbereiding` "In voorbereiding", `lopend` "Lopend", `afgerond` "Afgerond". Rechts `.btn-toevoegen#onderdeel-toevoegen-knop` "+ Project toevoegen".
- Samenwerkingen: alleen de knop "+ Samenwerking toevoegen" (blijft rechts, zoals Bestuursfuncties).
- Anders dan bij vermogens is de balk **ook zichtbaar in de lege staat** (spec), dus de knop staat altijd in de balk en de `.leeg-blok` heeft géén eigen knop. Het filter is in de lege staat `hidden` (niets te filteren).

**Lijst** (`#onderdeel-lijst`, `container-type: inline-size`), `<div role="table" aria-label="Projecten">`, eerste rij zichtbare kop `.beheer-rij.beheer-kop.project-rij[role=row]` met `columnheader`s `#`, `Project`, `Status`, `Periode`, `Eigenaar`, `<span class="sr-only">Acties</span>`.

Rij `.structuur-rij.beheer-rij.project-rij[role=row][data-id]` (samenwerking: `.samenwerking-rij`, zonder status en periode):
```html
<span class="cel-nr" role="cell">1</span>                                   <!-- plaats in de hele lijst (volgorde), ook bij filter -->
<span class="cel-project" role="cell">
  <span class="cel-naam">Ver(nieuw)bouw</span>
  <span class="cel-omschrijving">Renovatie en uitbreiding van het clubhuis.</span>   <!-- alleen als niet leeg -->
</span>
<span class="cel-status" role="cell"><span class="status-label lopend">Lopend</span></span>
<span class="cel-periode" role="cell"><span class="cel-label" aria-hidden="true">Periode: </span>sep 2026 – jun 2028</span>
<span class="cel-eigenaar" role="cell"><span class="cel-label" aria-hidden="true">Eigenaar: </span>Voorzitter</span>
<div class="kaart-acties cel-acties" role="cell">
  <button class="btn-kaart-actie btn-volgorde" data-actie="omhoog" data-id="{id}" aria-label="{naam} omhoog" [disabled bij eerste zichtbare]>↑</button>
  <button class="btn-kaart-actie btn-volgorde" data-actie="omlaag" data-id="{id}" aria-label="{naam} omlaag" [disabled bij laatste zichtbare]>↓</button>
  ${actieKnopHTML('bewerk', id, 'bewerk', naam)}${actieKnopHTML('verwijder', id, 'verwijder', naam)}
</div>
```
- Lege periode of eigenaar: `<span class="leeg-streep" aria-label="geen periode">—</span>` / `aria-label="nog niet gekozen"`.
- Status-label: klasse = statuswaarde (`in-voorbereiding` | `lopend` | `afgerond`). De tekst draagt de betekenis; rand/kleur is extra.
- Alle tekst via `esc()`.

**Formulier** (`.pijler-form#onderdeel-form`; bewerken: `.pijler-bewerk-form` in de rij met ids `on-{id}`, `os-{id}`, `ob-{id}`, `oe-{id}`, `ow-{id}`, `oo-{id}`):
```html
<div class="form-groep">
  <label class="form-label" for="onderdeel-naam">Naam</label>
  <input class="form-input" id="onderdeel-naam" type="text" placeholder="Bijv. LED-scorebord"   <!-- samenwerking: "Bijv. KNHB" -->
         autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false" aria-describedby="onderdeel-naam-fout">
  <span class="form-fout" id="onderdeel-naam-fout"></span>
</div>
<div class="form-groep">                                                  <!-- alleen projecten -->
  <label class="form-label" for="onderdeel-status">Status</label>
  <select class="form-input" id="onderdeel-status">…STATUSSEN, standaard in-voorbereiding…</select>
</div>
<fieldset class="periode-velden">                                         <!-- alleen projecten -->
  <legend class="form-label">Periode (optioneel)</legend>
  <div class="form-rij-datums">
    <div class="form-groep">
      <label class="datum-label" for="onderdeel-begin">Begindatum</label>
      <input class="form-input" id="onderdeel-begin" type="date" aria-describedby="onderdeel-begin-fout">
      <span class="form-fout" id="onderdeel-begin-fout"></span>
    </div>
    <div class="form-groep">
      <label class="datum-label" for="onderdeel-eind">Einddatum</label>
      <input class="form-input" id="onderdeel-eind" type="date" aria-describedby="onderdeel-eind-fout">
      <span class="form-fout" id="onderdeel-eind-fout"></span>
    </div>
  </div>
</fieldset>
<div class="form-groep">
  <label class="form-label" for="onderdeel-eigenaar">Eigenaar</label>
  ${bestuursfunctieKeuzeHTML(…)}                                          <!-- eerste optie "Kies een bestuursfunctie" = '' -->
</div>
<div class="form-groep">
  <label class="form-label" for="onderdeel-omschrijving">Omschrijving</label>
  <textarea class="form-input" id="onderdeel-omschrijving" rows="3" aria-describedby="onderdeel-omschrijving-fout"></textarea>
  <span class="form-fout" id="onderdeel-omschrijving-fout"></span>
</div>
<div class="form-rij"><button class="btn" type="button" id="onderdeel-opslaan">Opslaan</button><button class="btn" type="button" id="onderdeel-annuleer">Annuleren</button></div>
${meldingenHTML(null, 'onderdeel-form-fout')}
```
- Volgorde velden: Naam, Status, Periode, Eigenaar, Omschrijving. Samenwerking: Naam, Eigenaar, Omschrijving.
- `change` op begindatum zet `einddatum.min = begin || ''` (hulp in de kiezer; de controle blijft in de app).
- Geen `maxlength` op naam/omschrijving (niet stil afkappen). Enter in Naam = Opslaan; Enter in de textarea is een nieuwe regel.

**Interacties:**
- **Filter** (`change`) → alleen lijst opnieuw tekenen uit geladen gegevens, focus blijft. `#onderdeel-filter-status` (sr-only, na 100 ms): "3 projecten getoond." / "1 project getoond." / "Geen projecten met status Afgerond."
- **+ Project toevoegen** → formulier open, knop `hidden`, Status = filterwaarde als die een status is, anders In voorbereiding; focus Naam.
- **Opslaan** → normaliseren, valideren (volgorde: naam, begindatum, einddatum, omschrijving), eerste fout krijgt focus; dan `metOpslaan` met lijst vers laden en dubbele-naamcontrole. Gelukt: zie Teksten. Nieuw item buiten het filter → filter naar `alle` + staartzin.
- **Annuleren** → dicht en leeg, focus `#onderdeel-toevoegen-knop` (toevoegen) of Bewerken van de rij.
- **↑/↓** → wisselt met de zichtbare buur, hernummert 1..n (`schrijfVolgorde`), focus blijft op dezelfde knop (of Bewerken als die nu `disabled` is); statusregel "LED-scorebord staat nu op plaats 3 van 6."
- **Bewerken / Verwijderen** → exact als CK-020 (rij wordt formulier; `confirm()`; `bezig: null`; focus naar `zichtbareTerugval`). Niets gewijzigd → geen schrijfactie.

**Klassen:** `.sectie`, `.sectie-kop`, `.sectie-lijf`, `.beheer-balk`, `.filter-keuze`, `.btn-toevoegen`, `.pijler-form`, `.pijler-bewerk-form`, `.form-groep/-label/-input/-fout`, `.form-rij`, `.btn`, `.meldingen/.melding`, `.structuur-rij.beheer-rij`, `.cel-nr/-naam/-acties`, `.kaart-acties`, `.btn-kaart-actie`, `.btn-volgorde`, `.btn-icoon`, `.tip`, `.leeg-blok`, `.lijst-leeg`, `.lijst-laden`, `.tussen-hint`, `.sr-only`; nieuw: `.project-rij`, `.samenwerking-rij`, `.cel-project`, `.cel-omschrijving`, `.cel-status/-periode/-eigenaar`, `.cel-label`, `.leeg-streep`, `.status-label`, `.periode-velden`, `.form-rij-datums`, `.datum-label`.

### Scherm 2: Vermogensoverzicht (de plaat), blok met `bevat`

```html
<li class="plaat-domein over">
  <div class="plaat-kop">…zoals nu…</div>
  <p class="plaat-verantw">…zoals nu…</p>
  <!-- GEEN .plaat-omschrijving -->
  <ul class="plaat-onderdelen" role="list" aria-label="Projecten">
    <li class="plaat-onderdeel">Ver(nieuw)bouw<span class="plaat-onderdeel-sub">sep 2026 – jun 2028</span></li>
    <li class="plaat-onderdeel">Hoofdsponsoring 27/28+<span class="plaat-onderdeel-sub">vanaf jul 2027</span></li>
    <li class="plaat-onderdeel voorbereiding">LED-scorebord<span class="plaat-onderdeel-sub">In voorbereiding · mrt 2027 – jun 2027</span></li>
    <li class="plaat-onderdeel voorbereiding">Buitenopslag (blaashal)<span class="plaat-onderdeel-sub">In voorbereiding</span></li>
  </ul>
</li>
```
- `aria-label` van de lijst = de domeinnaam (`esc`), zodat de schermlezer "Projecten, lijst, 4 items" zegt.
- Subregel = `["In voorbereiding" als status in-voorbereiding, periodeTekst(...)]`, lege weg, gescheiden door `' · '`. Lopend zonder datums → geen subregel. Samenwerkingen: alleen de naam, nooit een subregel.
- Afgerond: niet tonen. Volgorde = beheervolgorde.
- Niets te tonen: `<p class="plaat-leeg">Er zijn geen projecten.</p>` / `Er zijn geen samenwerkingen.` (op de plek van de lijst).
- **Laden mislukt** (allSettled): het blok valt terug op het gedrag van nu (`.plaat-omschrijving`) plus de hint uit de spec. Zo staat er nooit een lege of misleidende tekst "Er zijn geen projecten." als het laden faalde.
- Blok zonder `bevat`: ongewijzigd.

### Periode-notatie (`periodeTekst(begin, eind)` in `src/onderdelen.js`)
Maanden: `jan feb mrt apr mei jun jul aug sep okt nov dec` (vaste lijst, geen `Intl`, dus overal gelijk). Dag valt weg.

| begin | eind | Tekst |
|---|---|---|
| 2026-09-01 | 2028-06-30 | `sep 2026 – jun 2028` (en-dash, spaties) |
| 2027-03-01 | 2027-03-31 | `mrt 2027` (zelfde maand) |
| 2026-09-01 | `''` | `vanaf sep 2026` |
| `''` | 2028-06-30 | `t/m jun 2028` |
| `''` | `''` | `''` → beheer "—", plaat geen periode |

Datums alleen splitsen (`'2026-09-01'.split('-')`), nooit `new Date()` (tijdzone schuift de dag).

---

## Teksten

| Situatie | Tekst | Plek |
|---|---|---|
| Lege staat projecten | **Nog geen projecten** — "Een project is een tijdelijk traject van de club, zoals een verbouwing, een nieuw scorebord of een sponsortraject." | `.leeg-blok` (h3 + p, geen knop) |
| Lege staat samenwerkingen | **Nog geen samenwerkingen** — "Een samenwerking is een vaste partner buiten de club, zoals de bond, de gemeente of scholen." | `.leeg-blok` |
| Filter zonder treffers | Geen projecten met status Afgerond. | `p.lijst-leeg` |
| Niet op de plaat | Deze projecten staan nog niet op de plaat: geen overkoepelend domein toont projecten. (samenwerkingen idem) | `p.tussen-hint` boven de lijst |
| Laden | Projecten worden geladen... | `p.lijst-laden` |
| Naam: leeg / kort / lang / tekens | als CK-020 (Vul een naam in. / minimaal 2 / maximaal 100 / tekenset + `/`) | veld Naam |
| Dubbele naam | Er is al een project met deze naam. / Er is al een samenwerking met deze naam. | veld Naam |
| Einddatum vóór begindatum | De einddatum ligt vóór de begindatum. | veld **Einddatum** |
| Onvolledige datum (`validity.badInput`) | Vul een hele datum in, of maak het veld leeg. | betreffend datumveld |
| Omschrijving > 500 | Een omschrijving heeft maximaal 500 tekens. Nu zijn het er {n}. | veld Omschrijving |
| Toegevoegd | ✓ Project {naam} toegevoegd. [+ " Het filter staat weer op Alle projecten."] | sectiemelding |
| Opgeslagen | ✓ Project {naam} opgeslagen. [+ " {naam} is afgerond en staat niet meer op de plaat."] | sectiemelding |
| Verwijderen vraag | Project {naam} verwijderen? Dit kan niet ongedaan worden gemaakt. | `confirm()` |
| Verwijderd / al weg | ✓ Project {naam} verwijderd. / Dit project bestaat niet meer. | sectiemelding |
| Laadfout | uit de spec (+ Opnieuw laden, testhint) | `#onderdeel-lijst` |

Samenwerking: dezelfde zinnen met "Samenwerking"/"samenwerking".

---

## Pictogrammen (`MENU_ICOON`, 48-viewBox, lijn 3, rond, via `menuIcoon()`)
```js
klembord: '<rect x="10" y="10" width="28" height="32" rx="3"/><rect x="18" y="6" width="12" height="8" rx="2"/><path d="M17 22 H31"/><path d="M17 29 H31"/><path d="M17 36 H25"/>',
schakels: '<g transform="rotate(-45 24 24)"><rect x="4" y="18" width="24" height="12" rx="6"/><rect x="20" y="18" width="24" height="12" rx="6"/></g>',
```
Klembord: het klemmetje overlapt de bovenrand (leest op 18px als klem, niet als losse balk). Schakels: twee schuin geschakelde ovalen, 8px overlap; schuin gezet zodat het niet lijkt op een pil of schakelaar. Op 18px controleren naast `puzzel` en `plaat`.

---

## Nieuwe CSS
Onder `/* ── Beheer en vermogens (CK-020) ── */`, nieuw kopje `/* Projecten en samenwerkingen (CK-046) */`. Alleen bestaande tokens.

```css
#onderdeel-lijst { container-type: inline-size; }
.project-rij      { grid-template-columns: 28px minmax(140px, 1.4fr) 128px 140px minmax(110px, 1fr) 152px; }  /* min. 758px */
.samenwerking-rij { grid-template-columns: 28px minmax(140px, 1.2fr) minmax(140px, 1fr) 152px; }              /* = functie-rij */
@media (max-width: 700px) { .samenwerking-rij { grid-template-columns: 28px minmax(100px, 1.2fr) minmax(100px, 1fr) 200px; } }
.cel-project { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cel-project .cel-naam { font-weight: 700; overflow-wrap: anywhere; }
.cel-omschrijving { font-size: var(--fs-toelichting); line-height: 18px; color: var(--muted); overflow-wrap: anywhere; }
.cel-label { display: none; color: var(--muted); }
.leeg-streep { color: var(--muted); }
.status-label {
  display: inline-block; width: fit-content; padding: 1px 8px; white-space: nowrap;
  font-size: var(--fs-label); line-height: 16px; font-weight: 600;
  border: 1px solid var(--border); border-radius: 999px; color: var(--text);
}
.status-label.lopend { border-color: var(--petrol); color: var(--petrol); }
.status-label.in-voorbereiding { border-style: dashed; border-color: var(--muted); }
.status-label.afgerond { color: var(--muted); background: var(--surface); }
.periode-velden { border: 0; padding: 0; margin: 0; min-width: 0; max-width: 480px; }
.periode-velden legend { padding: 0; margin-bottom: 4px; }
.form-rij-datums { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-rij-datums .form-groep { gap: 2px; }
.datum-label { font-size: var(--fs-toelichting); line-height: 18px; color: var(--text); }

@container (max-width: 760px) {
  .beheer-rij.beheer-kop.project-rij { display: none; }
  .project-rij { grid-template-columns: 24px auto 1fr; row-gap: 6px; column-gap: 10px; }
  .project-rij .cel-project  { grid-column: 2 / -1; }
  .project-rij .cel-status   { grid-column: 2; grid-row: 2; }
  .project-rij .cel-periode  { grid-column: 3; grid-row: 2; font-size: var(--fs-toelichting); }
  .project-rij .cel-eigenaar { grid-column: 2 / -1; font-size: var(--fs-toelichting); }
  .project-rij .cel-acties   { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
  .project-rij .cel-label    { display: inline; }
}
@container (max-width: 500px) {
  .beheer-rij.beheer-kop.samenwerking-rij { display: none; }
  .samenwerking-rij { grid-template-columns: 24px 1fr; row-gap: 4px; }
  .samenwerking-rij .cel-eigenaar { grid-column: 2; font-size: var(--fs-toelichting); }
  .samenwerking-rij .cel-label { display: inline; }
  .samenwerking-rij .cel-acties { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
}
@media (max-width: 480px) { .form-rij-datums { grid-template-columns: 1fr; } }
```
Onder `/* ── De plaat (CK-021) ── */`:
```css
.plaat-onderdelen { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.plaat-onderdeel {
  background: var(--surface); border: 1px solid var(--border); padding: 5px 8px;
  font-size: var(--fs-toelichting); line-height: 18px; color: var(--text); overflow-wrap: anywhere;
}
.plaat-onderdeel.voorbereiding { border-style: dashed; border-color: var(--muted); background: transparent; }
.plaat-onderdeel-sub { display: block; font-size: var(--fs-label); line-height: 16px; color: var(--muted); }
```
(binnen de bestaande `@container (max-width: 520px)`: `.plaat-onderdeel { padding: 4px 8px; }`). Contrast gestippelde rand `--muted` tegen `--card`: licht 5,0:1, donker 6,1:1 (≥ 3:1).

## Responsief gedrag
- **≥ ~1000px inhoud** (lijst ≥ 761px): projectrij op één regel, zichtbare kolomkop.
- **Lijst ≤ 760px** (o.a. 768px met uitgeklapt menu): kop weg; regel 1 nr + naam (+ omschrijving), regel 2 status-label + periode, regel 3 "Eigenaar: Voorzitter", regel 4 de knoppen. De zichtbare prefixen `.cel-label` vervangen de verdwenen kolomkop.
- **≤ 700px**: balk gestapeld (filter volle breedte 44px, knop volle breedte 44px), rijknoppen 44×44, prullenbak rechts (bestaande regels).
- **≤ 480px**: datumvelden onder elkaar.
- Plaat: ongewijzigd raster; de kaartjes vallen mee in `.plaat-over`.

## Toegankelijkheid
- Elk veld heeft een `<label for>`; de twee datums zitten in `<fieldset>` met `<legend>` "Periode (optioneel)", zodat de schermlezer "Periode, Begindatum" zegt. Fouten via `aria-describedby` + `aria-invalid="true"`; de fout bij volgorde staat bij **Einddatum** en dat veld krijgt focus.
- Status nooit alleen via kleur of stippellijn: beheer toont het woord ("In voorbereiding"), de plaat zet "In voorbereiding" in de subregel. De stippelrand is extra.
- `.cel-label` is `aria-hidden` (de cel heeft al een kolomkop); "—" heeft een `aria-label` zodat er geen "streepje" wordt voorgelezen.
- Focusring: bestaande regels (`--orange` + `--text`) op `.btn`, `.btn-kaart-actie`, `.btn-toevoegen`, en `.form-input:focus-visible` zoals in de rest van de app.
- Pictogramknoppen: `actieKnopHTML` (naam "Bewerken: {naam}", tooltip, Esc). ↑/↓ `aria-label` "{naam} omhoog/omlaag".
- Plaatlijsten met `role="list"` (Safari laat de lijstsemantiek anders vallen bij `list-style: none`) en `aria-label`.

## Implementatienotities voor de bouwer
- `periodeTekst` en de datumcontrole (`datumFout(begin, eind)` → `{ begin?, eind? }`) in `src/onderdelen.js`, met unittests in de app-functies-describe: vier rijen uit de tabel hierboven + einde vóór begin.
- Opslaan schrijft altijd `begindatum` en `einddatum` (ook `''`). Datums niet normaliseren: `input.value` is al `JJJJ-MM-DD`.
- Bij bewerken van een bestaand project met datums: `value` van de inputs direct zetten. `min` op einddatum ook bij openen zetten.
- `.leeg-blok` hier zonder knop; er is altijd precies één `#onderdeel-toevoegen-knop` (in de balk).
- Het filter is `hidden` als de lijst leeg is; de knop niet.
- `#`-kolom toont de plaats in de hele lijst, ook met filter (dan ontbreken er nummers; dat maakt duidelijk dat er items verborgen zijn en past bij de ↑/↓-statusregel "plaats 3 van 6").
- Plaat: projecten/samenwerkingen per soort één keer filteren (`OP_PLAAT`) vóór het tekenen; het eerste overkoepelende domein met `bevat === soort` krijgt de lijst.
- Inrichtscript: velden `begindatum: ''`, `einddatum: ''` in plaats van `periode`.
