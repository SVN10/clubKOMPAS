# Beveiligingsrapport: CK-010 — Pijlers aanmaken

## Bevindingen

### Gebruikersinvoer in innerHTML — XSS-risico
**Ernst:** 🟡 Hoog
**Type:** XSS (Cross-Site Scripting)
**Locatie:** `src/main.js` — functie `pijlerKaartHTML()`
**Probleem:** De waarden `p.naam`, `p.slogan` en `p.verantwoordelijke` worden
direct via template literals in `innerHTML` geplaatst zonder sanitatie. Een
aanvaller die `<script>alert(1)</script>` als pijlernaam invoert, kan
JavaScript uitvoeren in de context van de pagina.
**Aanbeveling:** Saniteer gebruikersinvoer vóór gebruik in HTML. Gebruik
`document.createElement()` + `.textContent` in plaats van `innerHTML`, of
een sanitatiefunctie:
```js
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
```

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 1 (XSS in innerHTML)
- 🟢 Lage aanbevelingen: 0

## Eindoordeel

🟡 Naar TST met aandachtspunt — XSS-risico aanpakken vóór PRD. Voor DEV en TST
met fictieve data acceptabel; voor PRD is sanitatie verplicht.
