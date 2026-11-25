# Ontwerp: CK-172 — Uitvoeringen van een activiteit

Fase 3 (ontwerp), 25 november 2026 · Spec: `CK-172-uitvoeringen.md` (met de besluiten van Paul) · Basis: `CK-170-ontwerp.md` (Beheer → Activiteiten) · Huisregels tabellen: `CK-046-besluiten.md` 19–41. Geen prototype: het scherm volgt het bestaande patroon. Hieronder staat alleen wat nieuw is of afwijkt van CK-170.

**Voorrang:** besluiten van Paul > dit ontwerp > spec. Wat dit ontwerp toevoegt of anders doet dan de spec:
1. **De uitklapknop staat in een eigen kolom "Uitvoeringen"**, direct na de kolom Activiteit (de spec noemt "een kolom voor de uitklapknop"). De naamcel houdt alleen de naam en de eerstvolgende datum.
2. **Meldingen over uitvoeringen staan in het paneel zelf**, niet bovenaan de sectie. De focus staat dan in het paneel, en een melding bovenaan zou de pagina laten verspringen. Alleen "Deze activiteit bestaat niet meer." gaat naar de sectiemelding, omdat het paneel dan verdwijnt.
3. **Een lopende uitvoering krijgt in het paneel het label "bezig"**, naast "voorbij" voor de afgelopen uitvoeringen. Dat sluit aan bij "bezig: …" in de rij.
4. **Er is maar één uitvoeringformulier tegelijk open** in de hele lijst. Open je er een tweede, dan sluit het eerste zonder op te slaan.

---

## Schermen

### Scherm 1: Beheer → Activiteiten (de lijst)

**Lay-out:** gelijk aan CK-170. De tabel krijgt één kolom erbij. Onder een uitgeklapte rij staat het paneel met de uitvoeringen.

```
┌ sectie-kop ── ACTIVITEITEN ──────────────────────────────────────────────────────────────────────┐
│ [Alle soorten ▾]                                                       [ + Activiteit toevoegen ] │
│ ▌✓ Activiteit ALV toegevoegd.                                                                     │
│ #  ACTIVITEIT                        UITVOERINGEN       SOORT        VERMOGEN     COMMISSIE        │
│ 1  Clubdag  bezig: 24 – 26 nov 2026  [› 1 uitvoering]   (Evenement)  Clubleven    —        [✎] [🗑]│
│ 2  ALV  12 mrt 2027                  [⌄ 3 uitvoeringen] (Bijeenkomst) Bestuur      Bestuur  [✎] [🗑]│
│    ┌─ UITVOERINGEN VAN ALV ───────────────────────────────────────────────┐                       │
│    │ ▌✓ Uitvoering 12 mrt 2027 toegevoegd aan ALV.                         │                       │
│    │ 3 feb 2026            (voorbij)                          [✎] [🗑]     │                       │
│    │ 12 mrt 2027                                              [✎] [🗑]     │                       │
│    │ 17 jun 2027                                              [✎] [🗑]     │                       │
│    │ [ + Uitvoering toevoegen ]                                            │                       │
│    └──────────────────────────────────────────────────────────────────────┘                       │
│ 3  Jeugdclinic  laatst: 3 okt 2026   [› 2 uitvoeringen] (Clinic …)   Jeugd        TC       [✎] [🗑]│
│ 4  Kerstborrel  Nog geen uitvoering  [› 0 uitvoeringen] (Evenement)  Clubleven    —        [✎] [🗑]│
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Volgorde:** `sorteerActiviteiten(activiteiten, perActiviteit, vandaag)` (besluit 8). Het rijnummer blijft `activiteiten.indexOf(x) + 1` in de hele gesorteerde lijst, ook met filter.

**Kopregel** (`.beheer-rij.beheer-kop.activiteit-rij`), de `columnheader`s in deze volgorde:
`#`, `Activiteit`, `Uitvoeringen`, `Soort`, `Vermogen`, `Commissie`, `<span class="sr-only">Acties</span>`.

**Rij** (`.structuur-rij.beheer-rij.activiteit-rij[role=row][data-id]`):
```html
<span class="cel-nr" role="cell">2</span>
<span class="cel-activiteit" role="cell">
  <span class="cel-naam">ALV</span><span class="cel-periode komend"><span class="sr-only">, eerstvolgende </span>12 mrt 2027</span>
</span>
<span class="cel-uitvoeringen" role="cell">
  <button class="btn-uitklap" type="button" data-actie="uitklap" data-id="{id}"
          aria-expanded="false" aria-controls="uv-{id}">
    <svg class="uitklap-pijl" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M6 3 L11 8 L6 13"/></svg>
    <span>3 uitvoeringen</span><span class="sr-only"> van ALV</span>
  </button>
</span>
<span class="cel-soort" role="cell">…</span>        <!-- ongewijzigd -->
<span class="cel-vermogen" role="cell">…</span>     <!-- ongewijzigd -->
<span class="cel-commissie" role="cell">…</span>    <!-- ongewijzigd -->
<div class="kaart-acties cel-acties" role="cell">…</div>  <!-- ongewijzigd -->
```

**De datum achter de naam** (`.cel-periode` met een modifier; de stand komt uit `eerstvolgendeUitvoering(lijst, vandaag)`; de datum uit `datumTekst(begin, eind)`):

| Stand | Zichtbare tekst | Klasse | Schermlezer leest |
|---|---|---|---|
| `komend` | `12 mrt 2027` | `.cel-periode.komend` | "ALV, eerstvolgende 12 mrt 2027" |
| `bezig` | `bezig: 24 – 26 nov 2026` | `.cel-periode.bezig` | "Clubdag, bezig: 24 – 26 nov 2026" |
| `voorbij` | `laatst: 3 okt 2026` | `.cel-periode.voorbij` | "Jeugdclinic, laatst: 3 okt 2026" |
| `geen` | `Nog geen uitvoering` | `.cel-periode.geen` | "Kerstborrel, Nog geen uitvoering" |
| uitvoeringen niet geladen | (niets) | — | — |

Bij `bezig`, `voorbij` en `geen` staat er alleen `<span class="sr-only">, </span>` vóór de tekst; het voorvoegsel is zichtbaar.

**De uitklapknop** (`.btn-uitklap`):
- De tekst is `uitvoeringenTekst(n)`: `0 uitvoeringen`, `1 uitvoering`, `3 uitvoeringen`. Er komt een hulpje `uitvoeringenTekst` naast `activiteitenTekst`.
- De toegankelijke naam is "3 uitvoeringen van ALV". `aria-expanded` zegt "ingeklapt" of "uitgeklapt". Gebruik geen `aria-label`, want dan verdwijnt de zichtbare tekst uit de naam.
- Ook bij 0 uitvoeringen staat de knop er: alleen zo kom je bij "+ Uitvoering toevoegen".
- **Uitvoeringen niet geladen:** geen knop. De cel krijgt `leeg('niet geladen')`.

**Het paneel** is een eigen rij in de tabel, direct na de rij van de activiteit. Het staat er alleen als de activiteit zichtbaar is (filter). Ingeklapt heeft het `hidden`.
```html
<div class="uitvoering-paneel" role="row" id="uv-{id}" data-activiteit="{id}" hidden>
  <div class="uitvoering-cel" role="cell">
    <h2 class="uitvoering-kop" id="uvk-{id}">Uitvoeringen van ALV</h2>
    ${meldingenHTML(`uv-ok-${id}`, `uv-fout-${id}`)}
    <ul class="uitvoering-lijst" aria-labelledby="uvk-{id}">
      <li class="uitvoering-rij" data-uid="{uid}">
        <span class="uitvoering-datum">3 feb 2026</span>
        <span class="status-label afgerond">voorbij</span>          <!-- alleen als voorbij -->
        <!-- of: <span class="status-label lopend">bezig</span>      alleen als bezig -->
        <div class="kaart-acties cel-acties">
          ${actieKnopHTML('uv-bewerk', uid, 'bewerk', `uitvoering ${datum}`)}${actieKnopHTML('uv-verwijder', uid, 'verwijder', `uitvoering ${datum}`)}
        </div>
      </li>
      …
    </ul>
    <p class="lijst-leeg">Nog geen uitvoeringen. Voeg hieronder de eerste toe.</p>   <!-- in plaats van de ul, als de lijst leeg is -->
    <button class="btn-toevoegen uitvoering-toevoegen" type="button" data-actie="uv-toevoegen" data-id="{id}">+ Uitvoering toevoegen</button>
    <div class="pijler-bewerk-form uitvoering-form" id="uvf-{id}" hidden></div>
  </div>
</div>
```
- De uitvoeringen staan op `sorteerUitvoeringen` (begindatum, einddatum, id): de oudste bovenaan.
- **Voorbij** = `(einddatum || begindatum) < vandaag`. **Bezig** = `begindatum <= vandaag <= (einddatum || begindatum)`. Komend krijgt geen label.
- De labels hergebruiken `.status-label.afgerond` (gedempt, `--surface`) en `.status-label.lopend` (petrol). Er komen geen nieuwe kleuren.
- `actieKnopHTML` geeft de knoppen hun naam, bijvoorbeeld "Bewerk uitvoering 12 mrt 2027". Controleer of dat goed leest; pas anders alleen het vierde argument aan.

**Welke panelen open zijn:** een `Set` `openPanelen` met de activiteit-ids. `tekenLijst()` zet bij elke rij `aria-expanded` en `hidden` volgens die set. De set blijft bestaan bij filteren, opslaan en herladen. Een verwijderde activiteit gaat eruit. Een nieuwe activiteit gaat niet vanzelf open.

**Interacties:**
- **Klik op de uitklapknop** (of Enter of Spatie; het is een gewone `button`) → zet `aria-expanded` om, zet `hidden` op het paneel om en werk `openPanelen` bij. Teken de lijst **niet** opnieuw. De focus blijft op de knop. Inklappen sluit ook een open uitvoeringformulier in dat paneel, zonder op te slaan.
- **+ Uitvoering toevoegen** → sluit een ander open uitvoeringformulier in de lijst (zie voorrang 4), vul `#uvf-{id}`, haal `hidden` eraf, zet de knop op `hidden`, focus naar de begindatum.
- **Bewerk (potlood) bij een uitvoering** → sluit een ander open uitvoeringformulier, vervang de inhoud van de `li` door het formulier (klasse `bewerken` op de `li`), zet `min` op de einddatum, focus naar de begindatum.
- **Verwijder (prullenbak) bij een uitvoering** → `confirm()` (zie Teksten), dan `metOpslaan` met `soort: 'lijstactie'`, `lijst: lijstEl`, `fout: el('uv-fout-{id}')`, `bezig: null`.

### Formulier: uitvoering toevoegen en bewerken

Beide gebruiken dezelfde opbouw:
```html
<fieldset class="periode-velden">
  <legend class="form-label">Nieuwe uitvoering</legend>        <!-- bij bewerken: "Uitvoering 12 mrt 2027" -->
  <div class="form-rij-datums">
    <div class="form-groep">
      <label class="datum-label" for="{b}">Begindatum</label>
      <input class="form-input" id="{b}" type="date" value="…" aria-describedby="{b}-fout" data-eind="{e}">
      <span class="form-fout" id="{b}-fout"></span>
    </div>
    <div class="form-groep">
      <label class="datum-label" for="{e}">Einddatum (optioneel)</label>
      <input class="form-input" id="{e}" type="date" value="…" min="{begindatum}" aria-describedby="{e}-fout">
      <span class="form-fout" id="{e}-fout"></span>
    </div>
  </div>
</fieldset>
<div class="form-rij">
  <button class="btn opslaan" type="button" data-actie="uv-opslaan">Opslaan</button>
  <button class="btn" type="button" data-actie="uv-annuleer">Annuleren</button>
</div>
${meldingenHTML(null, '{formfout}')}
```

| | Toevoegen | Bewerken |
|---|---|---|
| Plek | `#uvf-{activiteitId}`, onder de lijst; de knop "+ Uitvoering toevoegen" is `hidden` | in de `li` van de uitvoering |
| `{b}` / `{e}` | `unb-{activiteitId}` / `une-{activiteitId}` | `ub-{uid}` / `ue-{uid}` |
| `{formfout}` | `uvf-fout-{activiteitId}` | `ubf-fout-{uid}` |
| Waarden | leeg; `min` pas na het kiezen van een begindatum | de huidige datums; `min` = de begindatum |
| `data-uid` op de knoppen | — | `{uid}` |

- **Validatie** in de volgorde begindatum, einddatum, met dezelfde teksten als CK-170 (`uitvoeringDatumFout` en `badInput`). Het eerste foute veld krijgt de focus.
- **Begindatum `change`** → `einddatum.min`, via de bestaande `bijBegin` (die werkt al op `data-eind` in `lijstEl`).
- **Enter** slaat niet op (de eigen datumkiezer gebruikt Enter). Opslaan gaat altijd via de knop.
- **Dubbele begindatum:** `uitvoeringBezet(vers geladen uitvoeringen van deze activiteit, begindatum, eigenUid)` → foutcode `dubbele-uitvoering`, de veldfout bij **Begindatum** (via `veldFouten`).
- **Bewerken zonder wijziging:** geen schrijfactie. Teken het paneel opnieuw en zet de focus op het potlood van die uitvoering.

**Focus en meldingen na een actie** (na `laadEnRender()`; het paneel blijft open, ook als de rij door de nieuwe volgorde verschuift):

| Actie | Uitkomst | Focus | Melding |
|---|---|---|---|
| Toevoegen | ok | potlood van de nieuwe uitvoering | `uv-ok-{id}`: "✓ Uitvoering 12 mrt 2027 toegevoegd aan ALV." |
| Bewerken | ok | potlood van dezelfde uitvoering (op de nieuwe plek) | `uv-ok-{id}`: "✓ Uitvoering 12 mrt 2027 opgeslagen." (de nieuwe datum) |
| Verwijderen | ok | potlood van de volgende uitvoering, anders de vorige, anders "+ Uitvoering toevoegen" | `uv-ok-{id}`: "✓ Uitvoering 12 mrt 2027 van ALV verwijderd." |
| Annuleren (toevoegen) | — | "+ Uitvoering toevoegen" | — |
| Annuleren (bewerken) | — | potlood van die uitvoering | — |
| Toevoegen, bewerken, verwijderen | `uitvoering-weg` | "+ Uitvoering toevoegen" | `uv-fout-{id}`: "Deze uitvoering bestaat niet meer." |
| Elke uitvoeringactie | `activiteit-weg` | `terugval()` | `sectieFout`: "Deze activiteit bestaat niet meer." + `meldingInBeeld(sectieFout)` |
| Elke uitvoeringactie | andere fout | blijft staan (`metOpslaan`) | in `{formfout}` of, bij verwijderen, `uv-fout-{id}` |

- Een paneelmelding wist `sectieOk` en `sectieFout`, zodat er geen oude melding bovenaan blijft staan. Roep daarna `meldingInBeeld` aan op de paneelmelding, niet op `sectieOk`.
- De paneelmeldingen staan in `meldingenHTML`, dus ze worden voorgelezen. Omdat `tekenLijst()` het paneel opnieuw maakt, zet de bouwer de melding **na** het tekenen.

### Formulier: activiteit toevoegen en bewerken

- **Toevoegen:** zoals CK-170, maar de `fieldset` heet nu **"Eerste uitvoering"** (`legend`). De ids blijven `activiteit-begin` en `activiteit-eind`. Begindatum is verplicht, einddatum niet. Opslaan → `voegActiviteitToe(db, clubId, { naam, soort, vermogenIds, commissieId }, { begindatum, einddatum })`.
- **Bewerken:** dezelfde velden zonder de `fieldset`. `veldenHTML(ids, w, { metDatum })` krijgt een derde argument. `leesVelden` controleert de datums alleen als `metDatum` waar is, en geeft bij bewerken alleen de vier velden terug. De vergelijking "niets gewijzigd" kijkt alleen naar naam, soort, vermogen en commissie.
- **Dubbele naam:** `activiteitBezet(lijst, naam, eigenId)` op de hele club, foutcode `dubbele-activiteit`, veldfout bij **Naam**.

### Activiteit verwijderen

1. Klik op de prullenbak → zet `aria-disabled="true"` op de knop en tel vers: `metTijdslimiet(telUitvoeringenVanActiviteit(db, clubId, id))`.
2. Mislukt het tellen → `aria-disabled` eraf, de tekst in `sectieFout`, `meldingInBeeld(sectieFout)`, focus terug op de prullenbak. **Niet verwijderen.**
3. Daarna `aria-disabled` eraf en één `confirm()`: bij 0 de tekst van CK-170, bij 1 of meer de tekst met het aantal (zie Teksten). Annuleren → niets, de focus blijft op de prullenbak.
4. Bevestigd → zoals CK-170 (`metOpslaan`, buurrij of terugval). `verwijderActiviteit` geeft het aantal echt verwijderde uitvoeringen terug; de melding gebruikt dat getal (een andere beheerder kan er intussen een bij hebben gezet).
5. Haal de id uit `openPanelen`.

### Uitvoeringen niet geladen (fail-soft)

- `laadUitvoeringen` gaat mee in de `Promise.allSettled` van `laadEnRender`. Mislukt het, dan `perActiviteit = null`.
- De lijst staat op naam. Er staat geen datum achter de naam. De kolom Uitvoeringen toont `leeg('niet geladen')` en er zijn geen panelen.
- `openPanelen` blijft bewaard: lukt het herladen later wel, dan gaan dezelfde panelen weer open.
- Toevoegen en verwijderen van een activiteit blijven werken (die tellen en schrijven zelf).

---

## Teksten

Alleen nieuw of gewijzigd ten opzichte van CK-170.

| Situatie | Tekst | Plek |
|---|---|---|
| Lege staat (gewijzigd) | **Nog geen activiteiten**: "Een activiteit is iets wat de club organiseert, zoals een toernooi, een clinic of de ALV. Elke activiteit hoort bij een vermogen en kan vaker plaatsvinden. Elke keer is een uitvoering." | `.leeg-blok` |
| Uitvoeringen niet geladen | De uitvoeringen konden niet worden geladen. De activiteiten staan daarom op naam, zonder datums. Herlaad de pagina. | `#activiteit-hint`, als tweede zin na een eventuele hint over vermogens of domeinen |
| Kolomkop | Uitvoeringen | kopregel |
| Uitklapknop | `0 uitvoeringen` / `1 uitvoering` / `3 uitvoeringen` (+ sr-only " van {naam}") | `.btn-uitklap` |
| Kop van het paneel | Uitvoeringen van {naam} | `h2.uitvoering-kop` |
| Paneel leeg | Nog geen uitvoeringen. Voeg hieronder de eerste toe. | `p.lijst-leeg` |
| Labels | `voorbij` / `bezig` | `.status-label` |
| Toevoegknop | + Uitvoering toevoegen | `.btn-toevoegen` |
| Legend toevoegen (uitvoering) | Nieuwe uitvoering | `legend` |
| Legend bewerken (uitvoering) | Uitvoering {datum} | `legend` |
| Legend nieuw-activiteitformulier | Eerste uitvoering | `legend` (was "Datum") |
| Dubbele naam (gewijzigd) | Er is al een activiteit met deze naam. | veld Naam |
| Dubbele uitvoering | Deze activiteit heeft al een uitvoering op deze datum. | veld Begindatum |
| Uitvoering toegevoegd | ✓ Uitvoering {datum} toegevoegd aan {naam}. | `uv-ok-{id}` |
| Uitvoering opgeslagen | ✓ Uitvoering {datum} opgeslagen. | `uv-ok-{id}` |
| Uitvoering verwijderen | Uitvoering {datum} van {naam} verwijderen? Dit kan niet ongedaan worden gemaakt. | `confirm()` |
| Uitvoering verwijderd | ✓ Uitvoering {datum} van {naam} verwijderd. | `uv-ok-{id}` |
| Uitvoering weg | Deze uitvoering bestaat niet meer. | `uv-fout-{id}` |
| Activiteit weg | Deze activiteit bestaat niet meer. | `sectieFout` |
| Activiteit verwijderen, met uitvoeringen | Activiteit {naam} en {1 uitvoering / n uitvoeringen} verwijderen? Dit kan niet ongedaan worden gemaakt. | `confirm()` |
| Activiteit verwijderen, zonder uitvoeringen | Activiteit {naam} verwijderen? Dit kan niet ongedaan worden gemaakt. (ongewijzigd) | `confirm()` |
| Activiteit verwijderd | ✓ Activiteit {naam} en {n uitvoeringen} verwijderd. / bij 0: ✓ Activiteit {naam} verwijderd. | `sectieOk` |
| Tellen mislukt | Activiteit {naam} kan nu niet worden verwijderd: de uitvoeringen konden niet worden geteld. Herlaad de pagina en probeer het opnieuw. | `sectieFout` |
| Te veel uitvoeringen (> 499) | Activiteit {naam} heeft te veel uitvoeringen om in één keer te verwijderen. | `sectieFout` |

`{datum}` is altijd `datumTekst(begindatum, einddatum)`. Alle tekst gaat via `esc()`; in `confirm()` gaat de tekst zonder `esc()`, zoals nu in `bevestigVerwijderen`.

---

## Nieuwe CSS

In `style.css`, in het blok `/* Activiteiten (CK-170) */`, met als kopje `/* Activiteiten en uitvoeringen (CK-170, CK-172) */`. Alleen bestaande tokens.

**Bestaande regels aanpassen:**
```css
/* r. 1094: een kolom erbij (terugval zonder subgrid en tijdens bewerken) */
.activiteit-rij { grid-template-columns: 28px minmax(140px, 1.4fr) auto auto minmax(110px, 1fr) minmax(110px, 1fr) 152px; }
/* r. 1120: een auto-kolom erbij */
#activiteit-lijst > [role="table"] { grid-template-columns: 28px auto auto auto auto auto minmax(0, 1fr) 152px; }
```

**Nieuw:**
```css
/* Datum achter de naam: komend gewoon, bezig petrol, voorbij en geen gedempt */
.cel-activiteit .cel-periode.komend  { color: var(--text); }
.cel-activiteit .cel-periode.bezig   { color: var(--petrol); font-weight: 600; }
.cel-activiteit .cel-periode.voorbij,
.cel-activiteit .cel-periode.geen    { color: var(--muted); font-style: italic; }

/* Uitklapknop */
.btn-uitklap {
  display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 8px;
  background: transparent; border: 1px solid var(--border); border-radius: 4px;
  font: inherit; font-size: var(--fs-toelichting); font-weight: 600; color: var(--petrol);
  white-space: nowrap; cursor: pointer;
}
.btn-uitklap:hover { border-color: var(--petrol); }
.btn-uitklap:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; box-shadow: 0 0 0 2px var(--text); }
.uitklap-pijl { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform .15s; }
.btn-uitklap[aria-expanded="true"] .uitklap-pijl { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) { .uitklap-pijl { transition: none; } }

/* Paneel met uitvoeringen: ingesprongen tot de naamkolom (28px + 30px tussenruimte) */
.uitvoering-paneel[hidden] { display: none; }
.uitvoering-paneel { margin: 0 0 12px 58px; padding: 12px 16px; background: var(--surface); border-left: 3px solid var(--petrol); }
.uitvoering-cel { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; --meld-gap: 10px; }
.uitvoering-kop { font-size: var(--fs-toelichting); line-height: 19px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--petrol); overflow-wrap: anywhere; }
.uitvoering-lijst { list-style: none; margin: 0; padding: 0; width: 100%; max-width: 480px; }
.uitvoering-rij { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; min-height: 40px; padding: 4px 0; border-bottom: 1px solid var(--border); }
.uitvoering-rij:first-child { border-top: 1px solid var(--border); }
.uitvoering-rij .cel-acties { margin-left: auto; }
.uitvoering-rij.bewerken { display: block; padding: 10px 0; }
.uitvoering-datum { white-space: nowrap; }
.uitvoering-form { width: 100%; }
.uitvoering-form[hidden] { display: none; }
```
Contrast: `--muted` (#6F6E6E) is 5,1:1 op wit en ongeveer 4,7:1 op `--surface`; in het donkere thema is #A3B0B0 op `--surface` ruim voldoende.

**In de container query `@container (max-width: 760px)`** (vervang de regels voor `.activiteit-rij` door deze; elke cel krijgt een vaste regel, omdat de knop in de DOM vóór de soort staat):
```css
  #activiteit-lijst .beheer-rij.activiteit-rij { grid-template-columns: 24px auto 1fr; row-gap: 6px; column-gap: 10px; }
  .activiteit-rij .cel-nr           { grid-column: 1;      grid-row: 1; }
  .activiteit-rij .cel-activiteit   { grid-column: 2 / -1; grid-row: 1; }
  .activiteit-rij .cel-soort        { grid-column: 2;      grid-row: 2; }
  .activiteit-rij .cel-vermogen     { grid-column: 3;      grid-row: 2; font-size: var(--fs-toelichting); }
  .activiteit-rij .cel-commissie    { grid-column: 2 / -1; grid-row: 3; font-size: var(--fs-toelichting); }
  .activiteit-rij .cel-uitvoeringen { grid-column: 2 / -1; grid-row: 4; }
  .activiteit-rij .cel-acties       { grid-column: 1 / -1; grid-row: 5; justify-content: flex-start; flex-wrap: wrap; }
  .activiteit-rij .cel-label        { display: inline; }
  .uitvoering-paneel { margin-left: 0; padding: 10px 12px; }
```
Een rij in `.bewerken` heeft maar één cel; daar gelden deze plaatsingen niet (die cel is geen `.cel-*`).

**In `@media (max-width: 700px)`** (bij de bestaande 44px-regels):
```css
  .btn-uitklap { min-height: 44px; }
```
De knoppen in `.uitvoering-rij .cel-acties` worden daar vanzelf 44×44, en de prullenbak schuift naar rechts (bestaande regels).

## Responsief gedrag
- **Lijst van 761px of breder:** één regel per activiteit, met de kolom Uitvoeringen tussen Activiteit en Soort (subgrid). Het paneel springt in tot onder de naam.
- **Lijst van 760px of smaller:** regel 1 nummer, naam en datum; regel 2 soort en "Vermogen: X"; regel 3 "Commissie: X"; regel 4 de uitklapknop; regel 5 bewerken en verwijderen. Het paneel staat over de hele breedte, zonder inspringen.
- **700px of smaller:** de uitklapknop en alle pictogramknoppen zijn 44px hoog.
- **480px of smaller:** de twee datumvelden staan onder elkaar (bestaande regel).
- **320px:** een lange datum ("30 dec 2026 – 2 jan 2027") met label past niet naast twee knoppen van 44px. `.uitvoering-rij` loopt dan door naar een tweede regel; de knoppen staan daar rechts. Niets scrolt horizontaal.

## Implementatienotities voor de bouwer
- **Klikafhandeling in `lijstEl`:** handel `uitklap` en alle `uv-*`-acties af **vóór** `const x = activiteiten.find(o => o.id === id)`. Bij `uv-*` komt het activiteit-id uit `knop.closest('.uitvoering-paneel').dataset.activiteit` en het uid uit `knop.dataset.id` (de knoppen van `actieKnopHTML`) of `knop.dataset.uid` (de formulierknoppen). `potlood()` blijft alleen `data-actie="bewerk"` zoeken; maak een `uvPotlood(uid)` voor `[data-actie="uv-bewerk"][data-id="…"]`.
- **Uitklappen tekent niet opnieuw**, zodat de focus en een half ingevuld formulier elders blijven staan. Alleen opslaan, verwijderen en herladen tekenen opnieuw, met `openPanelen`.
- **De eigen datumkiezer** (`startEigenVelden`): controleer of die vanzelf op nieuwe `type="date"`-velden start (zoals in `openBewerk`). Zo niet, roep hem aan na het vullen van `#uvf-{id}` en van een `li` in bewerkstand.
- **Dubbele id's:** elk paneel heeft eigen id's (`uv-`, `uvk-`, `uv-ok-`, `uv-fout-`, `uvf-`, `unb-`, `une-`, `uvf-fout-` met het activiteit-id; `ub-`, `ue-`, `ubf-fout-` met het uid). Er is één `h2` per open paneel; de sectie heeft een `h1`.
- **`metOpslaan` bij uitvoeringen:** toevoegen en bewerken met `soort: 'formulier-lijst'`, `fout: {formfout}`, `weg: el('uv-fout-{id}')`, `veldFouten: { 'dubbele-uitvoering': ['{b}-fout', '{b}'] }`. Voeg `uitvoering-weg` en `activiteit-weg` toe aan `WEG_CODES`. Bij `activiteit-weg` zet de bouwer zelf de tekst in `sectieFout` (het paneel verdwijnt bij het herladen).
- **"Vandaag"** komt één keer per `tekenLijst()` uit `vandaagTekst()`, en geldt dan voor de rij en het paneel samen. Zo zeggen ze nooit iets anders.
- `uitvoeringenTekst = n => (n === 1 ? '1 uitvoering' : \`${n} uitvoeringen\`)` naast `activiteitenTekst`.
- Er komt geen `aria-live` op het paneel zelf; de meldingen erin zijn al live regions.
- Heel veel uitvoeringen (een wekelijkse training): het paneel toont ze allemaal, zonder paginering (zie de spec).

---

## Besluiten van Paul over het ontwerp (25-11-2026)
Deze besluiten gaan voor alles hierboven.
1. **Volgorde in het paneel: Paul kiest met een keuzeknop.** Bovenaan elk uitklappaneel staat links van "+ Uitvoering toevoegen" een gewone `.btn` met de tekst **"Nieuwste eerst"** als de volgorde oud → nieuw is, en **"Oudste eerst"** als de volgorde nieuw → oud is. De knop zegt dus wat er gebeurt als je erop klikt, en heeft daarom geen `aria-pressed`. Standaard staat de oudste bovenaan. De keuze geldt voor alle panelen tegelijk en wordt bewaard in `localStorage` onder `clubkompas-uitvoering-volgorde` (`'oud'` of `'nieuw'`). Bij een onbekende waarde wordt het `'oud'`. Na een klik wordt het paneel opnieuw getekend en blijft de focus op de keuzeknop. In de `sr-only`-status van het paneel komt "Nieuwste uitvoering bovenaan." of "Oudste uitvoering bovenaan.". Bij 0 of 1 uitvoering is de knop `hidden`. Het rijnummer van een uitvoering, als dat er is, volgt de getoonde volgorde. De sorteerfunctie in `src/activiteiten.js` krijgt een parameter voor de richting, zonder DOM.
2. **De uitklapknop bij 0 uitvoeringen** toont "Geen uitvoeringen", niet "0 uitvoeringen".
3. **Meldingen over uitvoeringen** staan in het paneel, zoals in punt 2 van de afwijkingen.
