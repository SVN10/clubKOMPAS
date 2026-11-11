# Huisstijlrapport: CK-010 — Pijlers aanmaken

## Kleurgebruik

- ✅ `.pijler-form` gebruikt `var(--petrol)` voor linkerbalk
- ✅ `.form-label` gebruikt `var(--petrol)` als tekstkleur
- ✅ `.form-input:focus` gebruikt `border-color: var(--petrol)`
- ✅ `.btn-toevoegen` gebruikt `var(--petrol)` voor rand en tekst
- ✅ `.btn.primary` (Opslaan) gebruikt `var(--orange)` conform bestaande stijl
- ⚠️ Foutkleur `#c0392b` is hardcoded, niet via token — acceptabel voor eerste versie,
     aanbeveling: voeg `--error: #c0392b` toe aan de tokenset

## Typografie

- ✅ `.form-label`: 11px, uppercase, letter-spacing — conform `.arch-label`-patroon
- ✅ `.form-input`: Barlow Semi Condensed via `var(--font)`
- ✅ `.form-fout`: 12px, rode kleur — consistent met foutpatronen in design

## Componenten

- ✅ `.btn-toevoegen`: dashed rand, petrolkleur, hover-effect met `var(--surface)` ✓
- ✅ `.pijler-form`: border-left patroon consistent met andere sectie-accenten
- ✅ Nieuwe pijlerkaart volgt exact `.card`-structuur (h3, .sub, p, .pill)
- ✅ `.stip` in petrolkleur op de Pijler-badge

## Responsief gedrag

- ✅ `.btn-toevoegen` heeft `grid-column: 1 / -1` → volle breedte op alle schermen
- ✅ `.pijler-form` heeft `grid-column: 1 / -1` → volle breedte op alle schermen
- ✅ `.form-rij` heeft `flex-direction: column` onder 400px

## Eindoordeel

✅ Voldoet aan huisstijl — één aanbeveling (foutkleur als token)
