# Toegankelijkheidsrapport: CK-010 — Pijlers aanmaken

## Bevindingen

### Foutmelding niet gekoppeld aan invoerveld
**Ernst:** 🟡 Aandacht (WCAG 1.3.1 Info and Relationships, AA)
**WCAG-criterium:** 1.3.1 Info and Relationships
**Locatie:** `src/main.js` — `.form-fout` span naast de inputs
**Probleem:** De foutmeldingen staan in een `<span class="form-fout">` maar zijn
niet gekoppeld aan het bijbehorende `<input>` via `aria-describedby`. Een
schermlezer kondigt het invoerveld aan, maar niet de foutmelding die eronder
verschijnt.
**Aanbeveling:**
```html
<input ... id="pijler-naam" aria-describedby="pijler-naam-fout">
<span class="form-fout" id="pijler-naam-fout"></span>
```
Voeg ook `aria-invalid="true"` toe aan het veld wanneer het een fout heeft.

## Positieve bevindingen

- ✅ Alle invoervelden hebben `<label>` elementen met `for`-attribuut
- ✅ Knoppen zijn `<button>` elementen (semantisch correct)
- ✅ Toetsenbordnavigatie werkt via Tab/Enter
- ✅ Kleurcontrast petrol `#46797B` op witte achtergrond: 4.6:1 — net voldoende (AA)
- ✅ Pijler toevoegen-knop is een `<button>` (geen `<div>` of `<a>`)

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 1 (aria-describedby ontbreekt)
- 🟢 Suggesties: 0

## Eindoordeel

🟡 Kleine tekortkoming — `aria-describedby` ontbreekt bij validatiefouten.
Toevoegen vóór PRD; niet-blokkerend voor DEV/TST.
