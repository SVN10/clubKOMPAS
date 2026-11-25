# Specificatie en ontwerp: CK-174 — Uitvoeringen beheren in het formulier van de activiteit

Route **middel**: intake en ontwerp in één document, zonder prototype. Versie bij start: 0.15.0, branch `test`. Bouwt voort op CK-172 (`.claude/docs/CK-172.md`, `.claude/specs/CK-172-ontwerp.md`).

**Voorrang:** besluiten van Paul (onderaan) > dit document > CK-172-ontwerp. Alles van CK-172 over het uitklappaneel vervalt.

**Er verandert niets aan het datamodel en de regels** (`firestore.rules` blijft zoals het is). Zie "Controle van de regels" onder Logica.

---

## Wat wordt er gebouwd?
Het uitklappaneel met de uitvoeringen verdwijnt uit de lijst. In de plaats daarvan krijgen het bewerkformulier (in de rij) en het formulier voor een nieuwe activiteit onder de velden een blok **"Uitvoeringen (n)"**. Elke uitvoering staat daar op één regel: een nummer, de begindatum, de einddatum, het label voorbij of bezig, en een prullenbak. Eén klik op **Opslaan** bewaart de activiteit en alle wijzigingen aan de uitvoeringen samen, in één batch. **Annuleren** draait alles terug. In de rij in de lijst staan alleen nog het aantal uitvoeringen en de eerstvolgende datum.

## Gebruikersreis (samenvatting)
1. De beheerder opent Beheer → Activiteiten. Per rij ziet hij de naam met de eerstvolgende datum ("12 mrt 2027", "bezig: …" of "laatst: …") en in de kolom Uitvoeringen het aantal ("3 uitvoeringen" of "Geen uitvoeringen").
2. **Bewerken:** hij klikt op het potlood. De rij wordt het formulier: naam, soort, vermogen en commissie, en daaronder het blok Uitvoeringen met een regel per uitvoering, in de bewaarde volgorde.
3. Hij past een datum aan, haalt een regel weg met de prullenbak, of klikt op "+ Uitvoering toevoegen". Er komt dan een lege regel onderaan. Er wordt nog niets opgeslagen.
4. Hij klikt op **Opslaan**. De app controleert alle velden. Haalt hij bestaande uitvoeringen weg, dan vraagt de app één keer om bevestiging. Daarna gaat alles in één keer naar de database. De lijst wordt bijgewerkt en er komt één melding, bijvoorbeeld "Activiteit ALV opgeslagen (1 uitvoering toegevoegd, 1 verwijderd)."
5. **Annuleren** sluit het formulier zonder iets op te slaan.
6. **Nieuwe activiteit:** "+ Activiteit toevoegen" opent hetzelfde formulier, met in het blok één lege regel. Die regel mag hij invullen, weghalen of aanvullen met meer regels.

---

## Ontwerp

### Lay-out

**Bewerkformulier (blok 640px breed of meer):**
```
Naam [ALV            ]  Soort [Bijeenkomst ▾]  Vermogen [Bestuur ▾]  Commissie [Geen ▾]

UITVOERINGEN (3)                                   [Nieuwste eerst]
 #  Begindatum         Einddatum (optioneel)
 1  [28-10-2026 📅]    [            📅]     voorbij    [🗑]
 2  [10-03-2027 📅]    [12-03-2027  📅]                [🗑]
 3  [            📅]   [            📅]                [🗑]
    Vul een begindatum in, of haal deze uitvoering weg.
[+ Uitvoering toevoegen]
Bij Opslaan wordt 1 uitvoering verwijderd.

[Opslaan] [Annuleren]
```
- De kopregel ("# Begindatum Einddatum (optioneel)") staat er alleen voor het oog (`aria-hidden`). De schermlezer krijgt een eigen label per veld.
- Een fout staat in de kolom van het veld, direct onder dat veld. De regel wordt dan hoger, de kolommen blijven op hun plek.
- De zin "Bij Opslaan wordt … verwijderd." staat er alleen als er een **opgeslagen** uitvoering is weggehaald. Een nieuwe regel weghalen telt niet mee.

**Blok smaller dan 480px (telefoon, ook 320px):**
```
UITVOERINGEN (2)
[Nieuwste eerst]
 1  Begindatum
    [28-10-2026     📅]
    Einddatum (optioneel)
    [               📅]
    voorbij                     [🗑]
 ───────────────────────────────────
 2  Begindatum
    [10-03-2027     📅]
    …
[+ Uitvoering toevoegen]
```
- De kopregel verdwijnt. De labels "Begindatum" en "Einddatum (optioneel)" worden zichtbaar boven elk veld.
- De datumvelden krijgen de volle breedte naast het nummer. Het label en de prullenbak staan samen op de laatste regel, met de prullenbak rechts.
- Bij 760px is het blok breder dan 480px: dan staat elke uitvoering op één regel, zoals hierboven.
- Bij 320px is het blok ongeveer 240px breed. Een datumveld is dan ongeveer 200px breed, genoeg voor "dd-mm-jjjj" en de kalenderknop. Niets scrolt horizontaal.

**Lijst (de rij buiten bewerken):** zoals CK-172, maar de kolom **Uitvoeringen** bevat gewone tekst in plaats van de uitklapknop. Er staat geen paneel meer onder de rij.

### HTML-structuur

**Kolom Uitvoeringen in de rij** (vervangt `uitklapHTML`):
```html
<span class="cel-uitvoeringen" role="cell">
  <span class="uv-aantal-cel">3 uitvoeringen</span>              <!-- 0: <span class="uv-aantal-cel geen">Geen uitvoeringen</span> -->
</span>                                                           <!-- niet geladen: leeg('niet geladen'), zoals nu -->
```
In de naamcel geeft `periodeHTML` bij de stand `geen` niets meer terug. "Geen uitvoeringen" staat dan maar één keer in de rij, in de kolom.

**Blok in het formulier** (één functie `uitvoeringBlokHTML(p, regels)` voor beide formulieren):
- `p` = `uv-{activiteitId}` bij bewerken, `uv-nieuw` bij een nieuwe activiteit.
- `k` = de sleutel van een regel: het uid voor een opgeslagen uitvoering, `n{teller}` voor een nieuwe regel. `teller` is één teller voor de hele pagina, zodat er nooit twee dezelfde id's zijn.
- `r` = `{p}-{k}`.

```html
<fieldset class="uv-blok" id="{p}" data-uv-blok>
  <legend class="form-label">Uitvoeringen <span class="uv-aantal">(3)</span></legend>
  <div class="uv-balk">
    <button class="btn uv-volgorde" type="button" data-uv-actie="volgorde">Nieuwste eerst</button>  <!-- hidden bij minder dan 2 regels -->
  </div>
  <div class="uv-kop" aria-hidden="true"><span>#</span><span>Begindatum</span><span>Einddatum (optioneel)</span></div>
  <ol class="uv-regels" id="{p}-regels">
    <li class="uv-regel" data-sleutel="{k}" data-uid="{uid of leeg}">
      <span class="uv-nr" aria-hidden="true">1</span>
      <div class="uv-veld uv-begin">
        <label class="uv-label" for="{r}-b">Begindatum<span class="sr-only"> uitvoering 1</span></label>
        <input class="form-input" id="{r}-b" type="date" value="2026-10-28" data-eind="{r}-e" aria-describedby="{r}-b-fout">
        <span class="form-fout" id="{r}-b-fout"></span>
      </div>
      <div class="uv-veld uv-eind">
        <label class="uv-label" for="{r}-e">Einddatum (optioneel)<span class="sr-only"> uitvoering 1</span></label>
        <input class="form-input" id="{r}-e" type="date" value="" min="2026-10-28" aria-describedby="{r}-e-fout">
        <span class="form-fout" id="{r}-e-fout"></span>
      </div>
      <span class="uv-stand"><span class="status-label afgerond">voorbij</span></span>   <!-- bezig: .status-label.lopend; komend of onvolledig: leeg -->
      <button class="btn-kaart-actie btn-icoon gevaar uv-weg" type="button" data-uv-actie="weg"
              aria-label="Verwijderen: uitvoering 1 (28 okt 2026)">[prullenbak]<span class="tip" aria-hidden="true">Verwijderen</span></button>
    </li>
  </ol>
  <p class="lijst-leeg" id="{p}-leeg" hidden>Geen uitvoeringen.</p>
  <button class="btn-toevoegen uv-toevoegen" type="button" data-uv-actie="toevoegen">+ Uitvoering toevoegen</button>
  <p class="vermogens-hint uv-weg-hint" id="{p}-weg" hidden>Bij Opslaan wordt 1 uitvoering verwijderd.</p>
  <div class="sr-only" id="{p}-status" role="status"></div>
</fieldset>
```
- Het blok staat in `veldenHTML`, na de commissie. Het vervangt de `fieldset` "Eerste uitvoering" (`datumVeldenHTML`) en de optie `metDatum`.
- De knoppen gebruiken **`data-uv-actie`**, niet `data-actie`. Zo komen ze niet in de bestaande rijacties van `lijstEl` terecht. Eén handler `uvBlokKlik(e)` hangt aan `form` en aan `lijstEl` en draait vóór de rest.
- De prullenbak is de opmaak van `actieKnopHTML(…, 'verwijder', …)`, maar met `data-uv-actie="weg"` in plaats van `data-actie`. Geef `actieKnopHTML` daarvoor een optie, of schrijf de knop uit. De tooltip blijft "Verwijderen", zoals overal.
- **Het nummer** volgt de regels van boven naar beneden (1 tot en met n). Na toevoegen, weghalen en de volgordeknop worden de nummers opnieuw gezet: het zichtbare nummer, de `sr-only`-tekst in beide labels en de `aria-label` van de prullenbak.
- **De eigen datumkiezer** (`keuzelijst.js`) pakt nieuwe velden vanzelf op (MutationObserver). Hij zet de `aria-label` van zijn kalenderknop en van de kalender maar één keer, bij het starten, op basis van het label. Bij hernummeren klopt "Begindatum uitvoering 3 kiezen uit de kalender" dan niet meer. Voeg in `keuzelijst.js` een kleine export toe, `werkDatumLabelBij(veld)`, die die twee `aria-label`s opnieuw uit het label haalt, en roep die aan na het hernummeren. Het tekstveld zelf volgt het label al via `aria-labelledby`.
- **Verplaatsen zonder opnieuw tekenen:** regels worden bij de volgordeknop en bij weghalen als DOM-knoop verplaatst of verwijderd, niet via `innerHTML` opnieuw getekend. Zo blijven de ingevulde waarden, de fouten en de datumkiezer staan.
- **`aria-describedby`:** elk datumveld wijst naar zijn eigen foutregel (`{r}-b-fout` en `{r}-e-fout`). Die id's staan vanaf het begin in de HTML, dus `zetVeldFout` voegt niets toe. De datumkiezer neemt `aria-describedby` en `aria-invalid` over op het zichtbare tekstveld (`volgAttributen`).
- **Fail-soft** (de uitvoeringen konden niet worden geladen, `perActiviteit === null`): in het bewerkformulier toont het blok alleen `<p class="vermogens-hint">De uitvoeringen konden niet worden geladen. Herlaad de pagina om ze te wijzigen.</p>`, zonder regels en zonder knoppen. Opslaan bewaart dan alleen de activiteit. Het formulier voor een nieuwe activiteit werkt gewoon: daar zijn nog geen uitvoeringen.

### Gedrag

**Openen**
- **Bewerken:** de regels komen uit `perActiviteit.get(id)` (de stand van het laatste laden), gesorteerd met `sorteerUitvoeringen([...], volgorde)`. Die lijst wordt ook bewaard als **`oud`** (per formulier, in een `Map` op `p`). De focus gaat naar de naam, zoals nu.
- **Nieuw:** één lege regel. `oud` is een lege lijst. De focus gaat naar de naam, zoals nu.

**Typen**
- De regels sorteren zich **niet** opnieuw tijdens het typen. Dat gebeurt pas na het opslaan, of als de beheerder op de volgordeknop klikt.
- Bij `change` op een begindatum zet de bestaande `bijBegin` de `min` van de einddatum.
- Bij `change` op een datum van een regel wordt het label opnieuw bepaald met `uitvoeringStand`. Dat gebeurt alleen als de begindatum geldig is en de einddatum leeg is of niet vóór de begindatum ligt. Anders is het label leeg. "Vandaag" is de waarde van het laatste `tekenLijst()`.
- Enter in een datumveld slaat niet op (de datumkiezer gebruikt Enter). Enter in het naamveld slaat op, zoals nu.

**+ Uitvoering toevoegen**
- Zet een lege regel **onderaan** de lijst, direct boven de knop. Dat gebeurt ook als de volgorde "nieuwste eerst" is: de nieuwe regel staat zo naast de knop waarmee je hem maakte.
- Nummers, `(n)` in de legend en de volgordeknop (zichtbaar vanaf 2 regels) worden bijgewerkt. `{p}-leeg` wordt `hidden`.
- De focus gaat naar de begindatum van de nieuwe regel.
- Status: "Uitvoering {nr} toegevoegd."

**Prullenbak (weghalen)**
- Haalt de regel meteen weg uit het formulier, **zonder** vraag. Weghalen is nog niet opgeslagen en Annuleren draait het terug.
- Was het een opgeslagen uitvoering (`data-uid` niet leeg), dan komt het uid in de lijst `weg` van het formulier en wordt `{p}-weg` bijgewerkt.
- Nummers, `(n)` en de volgordeknop worden bijgewerkt. Zijn er geen regels meer, dan wordt `{p}-leeg` zichtbaar. De laatste regel weghalen mag: een activiteit zonder uitvoering mag bestaan.
- **Focus:** de begindatum van de regel die nu op dezelfde plek staat (de volgende). Was het de onderste regel, dan "+ Uitvoering toevoegen". Die staat er direct onder.
- Status: opgeslagen uitvoering: "Uitvoering {nr} ({datum}) weggehaald. Die wordt verwijderd bij Opslaan. Nog {n uitvoeringen}." Nieuwe regel: "Uitvoering {nr} weggehaald. Nog {n uitvoeringen}." Bij 0: "Geen uitvoeringen meer."

**Volgordeknop**
- Zet `volgorde` om en bewaart die in `localStorage` onder `clubkompas-uitvoering-volgorde`, met `leesUitvoeringVolgorde` zoals nu.
- Sorteert de regels in dit formulier op hun **huidige** waarden (met `sorteerUitvoeringen` op `{ id: sleutel, begindatum, einddatum }`). Regels zonder geldige begindatum komen onderaan, in hun huidige volgorde. Dit is een bewuste klik, dus hier mag de volgorde wel veranderen.
- De knoptekst wordt "Oudste eerst" of "Nieuwste eerst". De focus blijft op de knop. Status: "Nieuwste uitvoering bovenaan." of "Oudste uitvoering bovenaan."

**Opslaan** (dezelfde volgorde voor beide formulieren)
1. **Lezen en controleren in de browser:** de velden van de activiteit (`leesVelden`) en daarna de regels van boven naar beneden, per regel eerst de begindatum en dan de einddatum. Alles gaat in één `valideerVelden`-aanroep. Die zet alle fouten en geeft de focus aan het **eerste** foute veld. Is er een fout, dan stopt het hier.
2. **Niets gewijzigd** (alleen bij bewerken): de vier velden zijn gelijk, de activiteit heeft geen oude datumvelden en `uitvoeringWijzigingen(oud, regels)` is leeg. Dan sluit het formulier zonder te schrijven, en gaat de focus naar het potlood (zoals nu).
3. **Bevestigen:** zijn er opgeslagen uitvoeringen weggehaald, dan één `confirm()` (zie Teksten). Klikt de beheerder op Annuleren, dan wordt er niets opgeslagen, blijft het formulier staan en blijft de focus op Opslaan.
4. **Schrijven** met `metOpslaan(knop, …, { soort: 'formulier-lijst', fout: {formfout}, weg: sectieFout, veldFouten: dubbelFout(ids) })`. Daarin eerst `controleerDubbel` (de naam, zoals nu) en daarna `bewaarActiviteit(…)` (zie Logica).
5. **Gelukt:** sluit het formulier, `laadEnRender()`, de focus gaat naar het potlood van de activiteit, de melding komt in `sectieOk` met `meldingInBeeld`. Bij een nieuwe activiteit ook de bestaande staart over het filter.
6. **Mislukt:** zie "Fouten na opslaan" hieronder.

**Annuleren:** bij bewerken `tekenLijst()` en de focus naar het potlood. Bij nieuw `sluitForm()` en de focus naar "+ Activiteit toevoegen". Er wordt niets gevraagd, zoals bij de andere formulieren. De `Map` met `oud` en `weg` voor `p` gaat weg.

### Fouten per regel

| Fout | Wanneer | Tekst | Plek |
|---|---|---|---|
| Begindatum leeg | `begindatum === ''` en het veld heeft geen `badInput` | Vul een begindatum in, of haal deze uitvoering weg. | `{r}-b-fout` |
| Halve begindatum | `validity.badInput` (de datumkiezer: tekst die geen datum is) | Vul een hele datum in. | `{r}-b-fout` |
| Halve einddatum | `validity.badInput` | Vul een hele datum in, of maak het veld leeg. | `{r}-e-fout` |
| Einde vóór begin | beide geldig en `einddatum < begindatum` | De einddatum ligt vóór de begindatum. | `{r}-e-fout` |
| Dubbel in het formulier | dezelfde begindatum als een regel hoger in de lijst | Deze begindatum staat al bij uitvoering {nr}. | `{r}-b-fout` van de **lagere** regel |
| Dubbel met een uitvoering van iemand anders | na het verse lezen (zie Logica) | Deze activiteit heeft intussen al een uitvoering op deze datum. Kies een andere datum. | `{r}-b-fout` |
| Uitvoering intussen weg | een regel die je wijzigde, is intussen door iemand anders verwijderd | Deze uitvoering is intussen door iemand anders verwijderd. Klik op Opslaan om hem opnieuw toe te voegen, of haal hem weg. | `{r}-b-fout` |

- De controle kijkt naar de **eindstand**. Ruil je de datums van twee regels om, dan is dat geen dubbele datum.
- De volgorde van de fouten en de focus: de velden van de activiteit, dan regel 1 (begin, eind), regel 2, enzovoort. De focus gaat naar het eerste foute veld. De datumkiezer stuurt `veld.focus()` door naar zijn tekstveld.
- Bij "Uitvoering intussen weg" wordt de regel een **nieuwe regel**: `data-uid` wordt leeg en de waarden blijven staan. Opnieuw opslaan voegt hem dan toe.
- Een fout verdwijnt pas bij de volgende keer opslaan. Dat is hetzelfde als in de andere formulieren.

### Teksten

| Situatie | Tekst | Plek |
|---|---|---|
| Kolom in de rij | `1 uitvoering` / `3 uitvoeringen` / `Geen uitvoeringen` | `.cel-uitvoeringen` |
| Naamcel zonder uitvoering | (niets; was "Nog geen uitvoering") | `.cel-activiteit` |
| Legend van het blok | Uitvoeringen (n) | `legend` (zichtbaar in hoofdletters, net als `.form-label`) |
| Kopregel | # · Begindatum · Einddatum (optioneel) | `.uv-kop` (`aria-hidden`) |
| Labels per veld | Begindatum uitvoering {nr} / Einddatum (optioneel) uitvoering {nr} | `label` (het nummer is `sr-only`) |
| Prullenbak | Verwijderen: uitvoering {nr} ({datum}) / zonder geldige datum: Verwijderen: uitvoering {nr} | `aria-label` |
| Labels | voorbij / bezig | `.status-label.afgerond` / `.lopend` |
| Volgordeknop | Nieuwste eerst / Oudste eerst | `.uv-volgorde` |
| Geen regels | Geen uitvoeringen. | `{p}-leeg` |
| Weggehaald, nog niet opgeslagen | Bij Opslaan wordt 1 uitvoering verwijderd. / Bij Opslaan worden 3 uitvoeringen verwijderd. | `{p}-weg` |
| Status toevoegen | Uitvoering {nr} toegevoegd. | `{p}-status` |
| Status weghalen | zie Gedrag | `{p}-status` |
| Status volgorde | Nieuwste uitvoering bovenaan. / Oudste uitvoering bovenaan. | `{p}-status` |
| Fail-soft in het formulier | De uitvoeringen konden niet worden geladen. Herlaad de pagina om ze te wijzigen. | `.vermogens-hint` in het blok |
| Bevestiging, 1 weg | Uitvoering {datum} van {naam} verwijderen? Dit kan niet ongedaan worden gemaakt. | `confirm()` |
| Bevestiging, meer weg | {n} uitvoeringen van {naam} verwijderen ({datum}, {datum}, …)? Dit kan niet ongedaan worden gemaakt. | `confirm()`; hoogstens 5 datums, daarna "en nog {m}" |
| Opgeslagen, zonder wijziging aan uitvoeringen | ✓ Activiteit {naam} opgeslagen. | `sectieOk` |
| Opgeslagen, met wijzigingen | ✓ Activiteit {naam} opgeslagen ({wijzigingen}). | `sectieOk` |
| Toegevoegd | ✓ Activiteit {naam} toegevoegd. / ✓ Activiteit {naam} toegevoegd (2 uitvoeringen). + eventueel de filterstaart | `sectieOk` |
| `{wijzigingen}` | delen in deze volgorde, alleen als ze niet 0 zijn: "{n uitvoering(en)} toegevoegd", "{n} gewijzigd", "{n} verwijderd". Alleen het eerste deel krijgt het woord uitvoering(en). Voorbeelden: "1 uitvoering toegevoegd, 1 verwijderd" en "2 uitvoeringen gewijzigd". | — |
| Formulier: dubbel met iemand anders | Er is niets opgeslagen. Deze activiteit heeft intussen al een uitvoering op een van deze datums. | `{formfout}` (`FOUTTEKSTEN['dubbele-uitvoering-vers']`) |
| Formulier: uitvoering intussen weg | Er is niets opgeslagen. Een uitvoering is intussen door iemand anders verwijderd. Kijk bij de regel met de melding. | `{formfout}` (`FOUTTEKSTEN['uitvoering-intussen-weg']`) |
| Te veel wijzigingen | Er is niets opgeslagen. Dit zijn te veel wijzigingen aan de uitvoeringen om in één keer op te slaan (meer dan 499). Sla ze in delen op. | `{formfout}` (`FOUTTEKSTEN['te-veel-uitvoeringen']`) |
| Activiteit intussen weg | Deze activiteit bestaat niet meer. (ongewijzigd) | `sectieFout` |

- `{formfout}` = `am-fout-{id}` bij bewerken, `activiteit-form-fout` bij nieuw. `foutTekst` zet de staart "Wat je hebt ingevuld, staat er nog." erachter, zoals nu.
- `{datum}` is altijd `datumTekst(begindatum, einddatum)`. Bij `confirm()` gaat de tekst zonder `esc()`. De naam in de bevestiging en de melding is de nieuwe naam uit het formulier.
- De meldingen na opslaan noemen het **echte** aantal (uit de uitkomst van `bewaarActiviteit`), niet het aantal uit het formulier.

### CSS (`src/style.css`, blok `/* Activiteiten en uitvoeringen (CK-170, CK-172) */`, alleen bestaande tokens)

**Nieuw:**
```css
/* Uitvoeringen in het formulier (CK-174) */
.uv-blok { border: 0; padding: 0; margin: 4px 0 0; min-width: 0; width: 100%; max-width: 640px;
  container: uv-blok / inline-size; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.uv-blok legend { padding: 0; margin-bottom: 4px; }
.uv-balk [hidden], .uv-blok [hidden] { display: none; }
.uv-kop, .uv-regel { display: grid; grid-template-columns: 28px minmax(9.5rem, 12rem) minmax(9.5rem, 12rem) minmax(64px, auto) 44px;
  column-gap: 8px; align-items: start; width: 100%; }
.uv-kop { font-size: var(--fs-toelichting); font-weight: 600; color: var(--muted); }
.uv-regels { list-style: none; margin: 0; padding: 0; width: 100%; }
.uv-regel { padding: 6px 0; border-bottom: 1px solid var(--border); }
.uv-regel:first-child { border-top: 1px solid var(--border); }
.uv-nr { font-weight: 700; color: var(--petrol); text-align: right; padding-top: 10px; }   /* bouwer: lijn uit op de hoogte van .form-input */
.uv-veld { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.uv-stand, .uv-weg { align-self: start; margin-top: 6px; }
.uv-label { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.uv-weg-hint { font-style: italic; }
.cel-uitvoeringen .uv-aantal-cel.geen { color: var(--muted); font-style: italic; }

@container uv-blok (max-width: 479px) {
  .uv-kop { display: none; }
  .uv-regel { grid-template-columns: 24px minmax(0, 1fr) 44px; grid-template-areas: "nr begin begin" ". eind eind" ". stand weg"; row-gap: 6px; }
  .uv-nr { grid-area: nr; } .uv-begin { grid-area: begin; } .uv-eind { grid-area: eind; }
  .uv-stand { grid-area: stand; align-self: center; margin-top: 0; } .uv-weg { grid-area: weg; margin-top: 0; }
  .uv-label { position: static; width: auto; height: auto; margin: 0; overflow: visible; clip: auto; white-space: normal; }
}
```
**In `@media (max-width: 700px)`:** `.uv-regel .btn-icoon { width: 44px; height: 44px; }` en `.uv-volgorde, .uv-toevoegen { min-height: 44px; }`.

**Weg (opruimen):** `.btn-uitklap` (met `:hover` en `:focus-visible`), `.uitklap-pijl` (met de `rotate`-regel en de `prefers-reduced-motion`-regel), `.uitvoering-paneel` (ook `[hidden]` en de regel in `@container (max-width: 760px)`), `.uitvoering-cel`, `.uitvoering-kop`, `.uitvoering-balk` (alle drie de regels, ook in `@media (max-width: 700px)`), `.uitvoering-lijst-houder`, `.uitvoering-lijst`, `.uitvoering-rij` (alle vier), `.uitvoering-datum`, `.uitvoering-form` (beide) en `.btn-uitklap` in `@media (max-width: 700px)`. Controleer met grep dat ze nergens anders gebruikt worden. **Blijven:** `.periode-velden` en `.form-rij-datums`, want die gebruiken projecten ook. De kolombreedtes van `.activiteit-rij` blijven, want de kolom Uitvoeringen blijft.

---

## Logica

### Nieuwe pure functies in `src/activiteiten.js` (zonder DOM, zonder import uit `main.js`)

```js
// Fouten per regel, in de volgorde van het formulier.
// regels: [{ sleutel, begindatum, einddatum, beginHalf, eindHalf }]  (beginHalf/eindHalf = validity.badInput)
// geeft: [{ begin?: tekst, eind?: tekst }], één per regel; dubbel → begin van de lagere regel ("… bij uitvoering {nr}")
export function uitvoeringRegelFouten(regels)

// Verschil tussen de stand bij het openen (oud) en de regels bij opslaan.
// oud: [{ id, begindatum, einddatum }]; regels: [{ sleutel, id (uid of ''), begindatum, einddatum }]
// geeft: { nieuw: [{ sleutel, begindatum, einddatum }], gewijzigd: [{ id, sleutel, begindatum, einddatum }], weg: [id] }
// Ongewijzigde regels staan er niet in. '' en een ontbrekende einddatum zijn gelijk.
// Een id dat niet in oud staat, wordt een nieuwe regel (verdedigend).
export function uitvoeringWijzigingen(oud, regels)

// Eindstand na de wijzigingen, tegen de vers gelezen uitvoeringen van deze activiteit.
// geeft: { dubbel: [sleutel], intussenWeg: [sleutel], wegAlWeg: [id] }
//  - intussenWeg: gewijzigd, maar het id staat niet meer in vers
//  - wegAlWeg: weggehaald, maar al door iemand anders verwijderd (wordt overgeslagen en telt niet mee)
//  - dubbel: een nieuwe of gewijzigde regel met dezelfde begindatum als een uitvoering in de eindstand die
//    niet van deze regels komt (toegevoegd of gewijzigd door iemand anders)
export function controleerUitvoeringEindstand(vers, wijzigingen)

// "1 uitvoering toegevoegd, 1 verwijderd"; '' als alles 0 is
export function uitvoeringWijzigingTekst({ toegevoegd, gewijzigd, verwijderd })
```

### Opslaan in één batch

```js
// id = null: nieuwe activiteit. oud = null: de uitvoeringen waren niet geladen, alleen de activiteit opslaan.
// geeft { id, nieuweIds, toegevoegd, gewijzigd, verwijderd }
export async function bewaarActiviteit(db, clubId, { id = null, velden, oud = [], regels = [] })
```
1. **Bewerken:** `getDoc` van de activiteit. Bestaat die niet, dan `activiteit-weg`. Bewaar de oude datumvelden voor `deleteField()` (zoals `bewerkActiviteit` nu).
2. `wijzigingen = uitvoeringWijzigingen(oud, regels)`. Bij `oud === null` zijn de wijzigingen leeg.
3. **Vers lezen**, vlak vóór de batch: `laadUitvoeringenVanActiviteit(db, clubId, id)`. Dat is niet nodig bij een nieuwe activiteit. Daarna `controleerUitvoeringEindstand(vers, wijzigingen)`:
   - `intussenWeg` niet leeg → `throw { code: 'uitvoering-intussen-weg', sleutels }`;
   - `dubbel` niet leeg → `throw { code: 'dubbele-uitvoering-vers', sleutels }`;
   - `wegAlWeg` → uit `weg` halen.
4. **Grens:** `schrijfacties = (activiteit schrijven ? 1 : 0) + nieuw + gewijzigd + weg`. Is dat meer dan 500, dan `throw { code: 'te-veel-uitvoeringen' }`, zonder te schrijven. Gebruik de bestaande `MAX_UITVOERINGEN_MEE` (499) als grens voor het aantal uitvoeringen.
5. **Batch** (`writeBatch`):
   - de activiteit: `set` bij nieuw (een nieuwe `doc(kolom)`); `update` bij bewerken als de vier velden anders zijn of er oude datumvelden zijn (`activiteitVelden(velden)` + `deleteField()`); anders niet schrijven;
   - nieuw: `set(doc(uitvoeringKolom), uitvoeringVelden({ …, activiteitId }))`;
   - gewijzigd: `update(uitvoeringRef(uid), uitvoeringVelden({ …, activiteitId }))`. Het `activiteitId` komt altijd van deze activiteit, en het uid komt uit `vers` met dat `activiteitId`;
   - weg: `delete(uitvoeringRef(uid))`.
6. **Commit.** Mislukt de commit met `not-found` (een `update` op een uitvoering die tussen het verse lezen en de commit verdween), doe dan stap 1 en 3 nog één keer. Die stappen geven de juiste foutcode (`activiteit-weg` of `uitvoering-intussen-weg`). Geven ze geen fout, gooi dan de oorspronkelijke fout. Mislukt de commit met `permission-denied` en is de activiteit weg (`existsAfter` weigert), dan `activiteit-weg`. Dat is dezelfde aanpak als `schrijfUitvoering` nu.
7. Het resultaat geeft de **echte** aantallen.

`voegActiviteitToe` en `bewerkActiviteit` blijven bestaan: de CK-170-tests gebruiken ze. De app gebruikt ze niet meer. Zet `bewerkActiviteit` eventueel om naar `bewaarActiviteit` met `oud = null`.

### `src/main.js`
- `uvBlokKlik(e)` voor `data-uv-actie` (`toevoegen`, `weg`, `volgorde`), aan `form` en aan `lijstEl`.
- Per formulier `uvStaat.get(p) = { oud, weg: Set }`. Dit wordt gevuld bij het openen en weggehaald bij sluiten en annuleren. Daarnaast `leesRegels(p)` → `[{ sleutel, id, begindatum, einddatum, beginHalf, eindHalf, beginId, eindId }]` en `hernummer(p)`.
- `leesVelden` krijgt de fouten van de regels erbij: `uitvoeringRegelFouten` wordt omgezet naar `[inputId, foutId, tekst]`, achter de vier velden, in één `valideerVelden`.
- Na `metOpslaan` met uitkomst `'fout'` en de code `uitvoering-intussen-weg` of `dubbele-uitvoering-vers` zet de bouwer zelf de fouten per regel (`zetVeldFout`, focus op de eerste). Bij `uitvoering-intussen-weg` wordt ook `data-uid` van die regels leeg gemaakt. Om de sleutels te kunnen lezen bewaart de actie de fout in een variabele (zoals `code` nu bij de uitvoeringacties).
- `FOUTTEKSTEN` krijgt `uitvoering-intussen-weg`, `dubbele-uitvoering-vers` en `te-veel-uitvoeringen`. Die gaan **niet** in `WEG_CODES`: het formulier moet blijven staan.

### Opruimen in `src/main.js`
Weg: `openPanelen` (ook in `laadEnRender` en `verwijderActiviteitMetUitvoeringen`), `uvPotlood`, `paneelVan`, `uvToevoegKnop`, `uitklapHTML`, `uitvoeringRijHTML`, `uitvoeringLijstHTML`, `paneelInhoudHTML`, `paneelHTML` (en de aanroep in `rijHTML`), `tekenPaneel`, `sluitUitvoeringForms`, `uvFormHTML`, `paneelMelding`, `naWeg`, `uitvoeringActie`, `klapUit`, `datumVeldenHTML`, `datumRegels`, de optie `metDatum`, de takken `actie === 'uitklap'` en `actie.startsWith('uv-')` in de klikhandler, en uit de import `voegUitvoeringToe`, `bewerkUitvoering`, `verwijderUitvoering` en `voegActiviteitToe`/`bewerkActiviteit` (als die niet meer gebruikt worden). `activiteitWeg()` mag blijven als hulpje. Controleer of `'uitvoering-weg'` in `WEG_CODES` en `FOUTTEKSTEN` nog gebruikt wordt. Zo niet, haal het weg. Pas de kopcommentaar boven `renderActiviteitenBeheer` aan ("De uitvoeringen klappen … uit in een paneel").

### Opruimen in `src/activiteiten.js`
`voegUitvoeringToe`, `bewerkUitvoering`, `verwijderUitvoering`, `controleerUitvoeringVrij` en `schrijfUitvoering` worden niet meer gebruikt. **Voorstel:** haal ze weg en zet de test "beheerder: aanmaken, bewerken, laden, tellen en verwijderen via de app-functies" om naar `bewaarActiviteit`. Haal ook `addDoc` en `deleteDoc` uit de import als die niet meer nodig zijn. De regeltests die rechtstreeks `setDoc`/`updateDoc` gebruiken, blijven zoals ze zijn.

### Controle van de regels (`firestore.rules`, ongewijzigd)
- **`existsAfter`:** een nieuwe activiteit en haar uitvoeringen in één batch slaagt. Een batch die de activiteit bijwerkt of niet aanraakt, ook. Een batch zonder schrijfactie op de activiteit, terwijl die intussen weg is, wordt geweigerd. De app vangt dat af als `activiteit-weg`.
- **`activiteitId` mag niet veranderen:** de app schrijft bij `update` altijd het `activiteitId` van de activiteit zelf, en alleen voor uids die vers gelezen zijn met dat `activiteitId`. Een `update` met een ander `activiteitId` in een batch wordt geweigerd. Dat is in de emulator gecontroleerd.
- **Documentlezingen:** per uitvoering lezen de regels `leden/{uid}` (`isBeheerder`) en, bij create en update, `existsAfter(activiteit)`. De activiteit leest `leden`, `vermogen` en eventueel `commissie`. Dat zijn hoogstens **4 verschillende documenten**, hoe groot de batch ook is. Hetzelfde document telt in een verzoek maar één keer (cache). **In de emulator gecontroleerd (25-11-2026, proef zonder blijvend bestand):** een batch met de activiteit bijwerken plus 30 nieuwe, 30 gewijzigde en 30 verwijderde uitvoeringen (91 schrijfacties) slaagt, en een nieuwe activiteit met 40 uitvoeringen ook. Zonder cache zou de grens van 20 lezingen per batch al bij 10 uitvoeringen bereikt zijn. **Restrisico:** de documentatie van Firebase belooft die cache niet hard. Het verwijderen met al haar uitvoeringen (CK-172, tot 499) leunt er al op. Controleer het op tst met 11 of meer uitvoeringen in één keer opslaan (zie Acceptatiecriteria).
- **Batchgrens:** hoogstens 500 schrijfacties per batch. Dat is de bestaande grens `te-veel-uitvoeringen` (499 uitvoeringen plus de activiteit).
- Conclusie: **de regels hoeven niet te veranderen.** Er is niets gevonden wat niet klopt.

### Tests (`tests/regels.test.mjs`)
**Pure functies (nieuwe suite "CK-174 uitvoeringen in het formulier: pure functies"):**
- `uitvoeringRegelFouten`: lege begindatum, halve begindatum, halve einddatum, einde vóór begin, einde gelijk aan begin (goed), dubbel (de fout bij de lagere regel, met het nummer van de hogere), drie gelijke (twee fouten), twee datums omgeruild (geen fout), een lege regel naast een goede.
- `uitvoeringWijzigingen`: niets gewijzigd → alles leeg; alleen de einddatum anders; `''` en `undefined` zijn gelijk; nieuw, gewijzigd en weg samen; alles weg; een onbekend id → nieuw.
- `controleerUitvoeringEindstand`: gewijzigd maar weg → `intussenWeg`; weg en al weg → `wegAlWeg`; een uitvoering van iemand anders op dezelfde datum → `dubbel`; een datum die vrijkomt doordat je een andere regel wijzigt of weghaalt → geen `dubbel`.
- `uitvoeringWijzigingTekst`: alle combinaties van 0 en 1, het meervoud, en alles 0 → `''`.

**Emulator (nieuwe suite "CK-174 bewaarActiviteit: regels"):**
- Nieuw zonder uitvoering, met 1 en met 3: allemaal met het juiste `activiteitId`.
- Bewerken met nieuw, gewijzigd en weg samen; alleen uitvoeringen (de activiteit wordt niet geschreven); alleen de activiteit.
- Oude datumvelden op de activiteit worden meegenomen (`deleteField()`).
- De activiteit is intussen weg → `activiteit-weg`, er is niets geschreven.
- Een gewijzigde uitvoering is intussen weg → `uitvoering-intussen-weg` met de sleutel, er is niets geschreven.
- Een weggehaalde uitvoering is al weg → het lukt, `verwijderd` telt hem niet.
- Een uitvoering die iemand anders intussen toevoegde, blijft staan. Op dezelfde datum → `dubbele-uitvoering-vers`, er is niets geschreven.
- Meer dan 499 wijzigingen → `te-veel-uitvoeringen`, er is niets geschreven. Bouw dit met `uitvoeringWijzigingen`, zonder 500 documenten in de emulator.
- Een grote gemengde batch (bijvoorbeeld de activiteit plus 30 nieuw, 30 gewijzigd en 30 weg) slaagt: dit legt de cache vast.

`npm run test:regels` blijft helemaal groen. De UI krijgt geen automatische test.

---

## Acceptatiecriteria
- [ ] De lijst heeft geen uitklapknop en geen paneel meer. De kolom Uitvoeringen toont "1 uitvoering", "3 uitvoeringen" of "Geen uitvoeringen". De naamcel toont de eerstvolgende datum, "bezig: …" of "laatst: …", en bij geen uitvoering niets.
- [ ] Het bewerkformulier en het formulier voor een nieuwe activiteit hebben hetzelfde blok "Uitvoeringen (n)", gemaakt door dezelfde functie. Een nieuwe activiteit begint met één lege regel.
- [ ] Elke regel heeft een nummer, een begindatum en een einddatum met de eigen datumkiezer, het label voorbij of bezig, en een prullenbak.
- [ ] "+ Uitvoering toevoegen" zet een lege regel onderaan en geeft de begindatum de focus. Weghalen geeft de volgende regel de focus, of anders de toevoegknop. Beide geven een statusmelding.
- [ ] De regels sorteren zich niet tijdens het typen. De volgordeknop staat in het blok (vanaf 2 regels), sorteert op de huidige waarden, bewaart de keuze in `clubkompas-uitvoering-volgorde` en laat de focus op de knop.
- [ ] De vier fouten per regel (leeg, half, einde vóór begin, dubbel) staan onder het juiste veld. De focus gaat naar het eerste foute veld van het hele formulier. Elk datumveld heeft een eigen `aria-describedby`.
- [ ] Elk datumveld heeft een eigen label voor de schermlezer: "Begindatum uitvoering 2". Na weghalen of verplaatsen kloppen de nummers, ook in de prullenbak en de kalenderknop.
- [ ] Eén klik op Opslaan schrijft de activiteit en alle wijzigingen aan de uitvoeringen in **één batch**. Lukt dat niet, dan is er niets geschreven en staat alles wat je invulde er nog.
- [ ] Haal je opgeslagen uitvoeringen weg, dan komt er één bevestiging met het aantal en de datums. Annuleren slaat niets op.
- [ ] Annuleren sluit het formulier en er is niets veranderd in de database.
- [ ] De laatste uitvoering weghalen en opslaan lukt. De rij toont daarna "Geen uitvoeringen".
- [ ] De melding na opslaan noemt de echte aantallen, bijvoorbeeld "Activiteit ALV opgeslagen (1 uitvoering toegevoegd, 1 verwijderd)."
- [ ] Twee beheerders: wat een ander intussen toevoegde, blijft staan. Een gewijzigde regel die intussen weg is, geeft een melding bij de regel, en er is niets opgeslagen.
- [ ] Bij 760px staat elke uitvoering op één regel. Bij 320px staan de velden onder elkaar, met zichtbare labels, zonder horizontaal scrollen. Onder 700px zijn de knoppen 44px hoog.
- [ ] Niets van het paneel staat nog in `main.js` of `style.css` (grep op `uitklap`, `uitvoering-paneel`, `uv-ok-`, `openPanelen`).
- [ ] `npm run test:regels` is groen, met de nieuwe suites.
- [ ] **Op tst gecontroleerd:** een activiteit met 11 of meer uitvoeringen in één keer opslaan lukt (zo is de cache van de regels in productie bewezen). Ook gecontroleerd: het toetsenbord, 320px, 200% zoom en VoiceOver op de labels en statusmeldingen.

## Wat mag er niet kapotgaan?
- Het datamodel en de regels van CK-172. Er komt geen nieuwe regel en geen ander veld.
- De volgorde van de lijst (`sorteerActiviteiten`), de datum in de naamcel, het filter op soort en de fail-soft als de uitvoeringen niet laden.
- Een activiteit verwijderen met al haar uitvoeringen (tellen, bevestigen, `te-veel-uitvoeringen`, het echte aantal in de melding).
- Een unieke naam voor een activiteit (`dubbele-activiteit` bij Naam), en de blokkade bij vermogens en commissies met activiteiten.
- De eigen datumkiezer en keuzelijst op andere pagina's. De nieuwe export in `keuzelijst.js` verandert niets aan het bestaande gedrag.
- Projecten en samenwerkingen: die gebruiken `.periode-velden` en `.form-rij-datums`.
- De bestaande regeltests van CK-170 en CK-172 (de omgezette app-functietest uitgezonderd).
- `clubkompas-uitvoering-volgorde`: een waarde die al bewaard is, blijft gelden.

## Architectuurlaag
**Model** (M) — activiteiten en uitvoeringen horen bij de modellaag Club → Domein → Vermogen → Activiteit → Uitvoeringen. De logica staat in `src/activiteiten.js`, de UI in `src/main.js`. Het datamodel verandert niet.

## Randgevallen en risico's
- **Een lege nieuwe regel:** bij opslaan is dat een fout ("Vul een begindatum in, of haal deze uitvoering weg."). Hij wordt niet stil overgeslagen. Zie vraag 2.
- **Datums omruilen tussen twee regels:** de eindstand telt, dus dat mag. Het gaat in één batch, zodat er nooit even twee gelijke datums zijn.
- **Iemand anders wijzigde dezelfde uitvoering:** heb jij hem niet aangeraakt, dan blijft zijn wijziging staan (de app schrijft alleen wat jij wijzigde). Heb je hem allebei gewijzigd, dan wint wie het laatst opslaat. Haal je hem weg, dan gaat hij weg.
- **Race tussen vers lezen en de commit:** de batch mislukt in zijn geheel (een `update` op een verdwenen document geeft `not-found`). Er wordt één keer opnieuw gecontroleerd voor de juiste melding.
- **Wees:** een uitvoering die iemand anders toevoegt nadat jij de activiteit verwijderde, kan nog steeds als wees achterblijven (bekend uit CK-172). Dat blijft zo.
- **Veel uitvoeringen** (een wekelijkse training): het formulier wordt lang, zonder paginering. Het toetsenbord en de schermlezer werken, maar het is niet fijn. De oplossing is later CK-161 (herhaling).
- **De stand van het openen is oud** (het formulier staat lang open): het verse lezen bij opslaan vangt dat op. Wat een ander toevoegde, zie je pas na het opslaan.
- **Een activiteit bewerken en tegelijk een nieuwe toevoegen:** dat kan nu ook. De id-voorvoegsels `uv-{id}` en `uv-nieuw` en de ene teller voor `n{teller}` houden de id's uniek.
- **Twee rijen tegelijk in bewerkstand:** dat kan nu ook al. Elk formulier heeft een eigen `uvStaat`. Het opslaan van de ene rij tekent de lijst opnieuw en sluit de andere zonder op te slaan. Dat gedrag is ongewijzigd.
- **`geldigeDatum` controleert alleen het patroon:** de datumkiezer laat `2027-02-31` niet toe, de regels wel (bekend).
- **Cache van de regels in productie:** zie "Controle van de regels". Lukt de controle op tst met 11 of meer uitvoeringen niet, dan moet opslaan in delen. Dan is het niet meer atomair, en is een nieuw besluit nodig.

---

## Vragen voor Paul
1. **Een bevestiging bij Opslaan als er opgeslagen uitvoeringen weg zijn?**
   *Voorstel:* **ja, één `confirm()`**, alleen als er een opgeslagen uitvoering wordt verwijderd, met het aantal en de datums: "2 uitvoeringen van ALV verwijderen (28 okt 2026, 10 mrt 2027)? Dit kan niet ongedaan worden gemaakt." De prullenbak zelf vraagt niets, want Annuleren draait het terug. In het formulier staat ook al "Bij Opslaan wordt 1 uitvoering verwijderd." Dit sluit aan bij besluit 41: verwijderen vraagt altijd om bevestiging. Het alternatief is geen vraag, omdat de zin in het formulier het al zegt. Dan is één klik minder nodig, maar een vergissing is niet terug te draaien.
2. **Een lege regel bij opslaan: fout of overslaan?** Dit geldt vooral voor de lege regel waarmee een nieuwe activiteit begint.
   *Voorstel:* **fout**, met de tekst "Vul een begindatum in, of haal deze uitvoering weg." Dat is duidelijk en er verdwijnt niets stil. Het alternatief is een regel zonder begin- en einddatum stil overslaan. Dat is sneller voor wie een activiteit zonder datum wil aanmaken, maar dan zie je niet dat je een datum vergat.

## Besluiten van Paul (25-11-2026)
Deze besluiten gaan voor alles hierboven.
1. **Alles wordt samen opgeslagen.** Het bewerkformulier (in de rij) en het formulier voor een nieuwe activiteit krijgen onder de velden een blok "Uitvoeringen (n)". Per uitvoering staat er een regel met een nummer, de begindatum en de einddatum (de eigen datumkiezer), het label voorbij of bezig, en een prullenbak. Onder de regels staat "+ Uitvoering toevoegen", wat een lege regel toevoegt. Eén klik op Opslaan bewaart de activiteit en alle wijzigingen aan de uitvoeringen samen, in één batch: nieuwe uitvoeringen, gewijzigde uitvoeringen en uitvoeringen die weg zijn. Annuleren draait alles terug.
2. **Het uitklappaneel in de lijst verdwijnt.** De rij toont alleen het aantal uitvoeringen en de eerstvolgende datum (of "laatst: …" of "Geen uitvoeringen"). Wijzigen gaat via het potlood.
3. **De knop "Nieuwste eerst / Oudste eerst" blijft.** Hij staat in het formulier, boven de lijst met uitvoeringen. De keuze blijft bewaard in `localStorage` `clubkompas-uitvoering-volgorde`.
4. **Er verandert niets aan het datamodel en de regels.**

### Besluiten van Paul na de intake (25-11-2026)
Deze besluiten gaan voor alles wat hierboven staat:
- Haal je opgeslagen uitvoeringen weg, dan vraagt de app bij **Opslaan één `confirm()`** met het aantal en de datums. De prullenbak zelf vraagt niets. Een nieuwe regel die nog niet is opgeslagen, vraagt ook niets.
- Een **lege regel bij Opslaan geeft een fout**: "Vul een begindatum in, of haal deze uitvoering weg." De focus gaat naar die regel.
