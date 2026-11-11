# Ontwerp: CK-010 — Pijlers aanmaken

## Schermen

### Scherm 1: Pijlers & Domeinen sectie — normaal

**Lay-out:** bestaande `.sectie` / `.sectie-kop` / `.sectie-lijf` structuur.
Pijlerkaarten staan in een `.grid`. Onderaan de pijlerkaarten (vóór de
domeinen), een "+ Pijler toevoegen"-knop.

**Componenten:**
- **`+ Pijler toevoegen`-knop**: klasse `.btn` (niet `.btn.primary`) — subtiel,
  niet dominant. Volle breedte binnen de grid-rij, dashed rand in petrol,
  cursor pointer. Tekst: `+ Pijler toevoegen`.

**Klassen:** `.btn-toevoegen` (nieuwe klasse, zie CSS hieronder)

---

### Scherm 2: Inline formulier

**Lay-out:** het formulier verschijnt als een nieuw griditem, direct na de
bestaande pijlerkaarten. Het neemt de volle breedte in op één rij (breekt
de grid-flow).

**Componenten:**
- **Formulier-wrapper** `.pijler-form`: witte kaart (`.card`-stijl), petrol
  linkerbalk (4px, `border-left: 4px solid var(--petrol)`), `padding: 16px`,
  `border-radius: 8px`, subtiele schaduw.
- **Velden:**
  - Naam (`<input type="text">`, placeholder: "Naam van de pijler")
  - Slogan (`<input type="text">`, placeholder: "Ondertitel of slogan")
  - Eindverantwoordelijke (`<input type="text">`, placeholder: "Naam")
  - Elk veld: `<label>` erboven in petrol, 11px uppercase letter-spacing.
- **Knoppen:** `Opslaan` (`.btn.primary`, oranje) + `Annuleren` (`.btn`,
  petrol rand) naast elkaar met `gap: 8px`.
- **Validatiefout:** rode rand op het veld (`border-color: #c0392b`), rode
  tekst eronder (`font-size: 12px; color: #c0392b`).

**Klassen:** `.pijler-form`, `.form-groep`, `.form-label`, `.form-input`,
`.form-input.fout`, `.form-fout`

---

### Scherm 3: Pijlerkaart (nieuw aangemaakt)

**Lay-out:** dezelfde `.card` als de bestaande pijlerkaarten. De `.pill`
onderin toont "Pijler" met een groene stip.

**Componenten:**
- `<h3>` — naam van de pijler
- `<div class="sub">Strategische pijler</div>`
- `<p>` — slogan (als body-tekst)
- `<small style="color:var(--muted)">` — eindverantwoordelijke
- `.pill` met `.stip` in petrolkleur

---

## Nieuwe CSS

```css
/* Toevoegen-knop */
.btn-toevoegen {
  width: 100%;
  grid-column: 1 / -1;
  border: 1.5px dashed var(--petrol);
  background: transparent;
  color: var(--petrol);
  padding: 12px;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}
.btn-toevoegen:hover { background: var(--surface); }

/* Pijler-formulier */
.pijler-form {
  grid-column: 1 / -1;
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--petrol);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-groep { display: flex; flex-direction: column; gap: 4px; }
.form-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--petrol);
}
.form-input {
  padding: 8px 10px;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
}
.form-input:focus { outline: none; border-color: var(--petrol); }
.form-input.fout { border-color: #c0392b; }
.form-fout { font-size: 12px; color: #c0392b; }
.form-rij { display: flex; gap: 8px; }
```

## Responsief gedrag

- Formulier `.pijler-form` is altijd volle breedte (`grid-column: 1 / -1`)
- Op kleine schermen: knoppen "Opslaan" en "Annuleren" stapelen verticaal
  (`flex-direction: column` onder 400px)

## Implementatienotities voor de bouwer

1. Hardcoded pijlers NIET vervangen — ze worden als initiële staat behandeld
   en moeten altijd zichtbaar zijn
2. Pijlers opslaan in `localStorage` als JSON-array: `ck-pijlers`
3. Bij laden: lees `ck-pijlers` uit localStorage en voeg toe ná de hardcoded
   kaarten
4. Formulier tonen/verbergen via `.hidden`-klasse op het formulierelement,
   NIET via `display:none` direct (het HTML-skeleton heeft `[hidden]` als
   display:none)
5. Valideer clientside vóór opslaan — geen server-roundtrip nodig
