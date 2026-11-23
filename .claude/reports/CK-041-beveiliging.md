# Beveiligingsrapport: CK-041 Commissies

Scope: `git diff` CK-041 op branch test. Regeltests: 100/100 geslaagd.

## Bevindingen
### 1. Firestore-regels commissies: dicht
**Ernst:** geen bevinding (in orde)
**Locatie:** `firestore.rules:161-165`, `firestore.rules:270-274`
**Toelichting:** `match /commissies/{id}` hergebruikt `geldigeSamenwerking`: `hasOnly` + `hasAll` op exact naam, omschrijving, bestuursfunctieId, volgorde, met typecontrole via `geldigeBasis`. Alles achter `isLid(clubId)`, dus geen toegang tot commissies van een andere club. Tests dekken extra velden (leden, voorzitter, status), ontbrekende velden, types, grenzen en niet-leden.
**Aanbeveling:** geen; eventueel `geldigeSamenwerking` later hernoemen (bijv. `geldigNaamOnderdeel`).

### 2. `bevat` kan niet op 'commissies'
**Ernst:** geen bevinding (in orde)
**Locatie:** `firestore.rules:167-169`; getest
**Toelichting:** `geldigBevat` staat alleen 'projecten' en 'samenwerkingen' toe; ongewijzigd en getest. Client-side gebruikt de plaat `PLAAT_SOORTEN` (zonder commissies) en `opPlaat` onderdrukt de plaathint.

### 3. XSS in rendering
**Ernst:** geen bevinding (in orde)
**Locatie:** `src/main.js:2453-2478`
**Toelichting:** `cfg.uitleg`, `cfg.Enkel`, `cfg.Meer` en `cfg.meer` zijn hardgecodeerde constanten uit `SOORT_ONDERDEEL`; `soort` komt alleen uit de vaste `NAV_DOEL`-tabel. Gebruikersdata (`x.naam`, `x.id`, eigenaar, periode) gaat in `rijHTML` overal door `esc()`.
**Aanbeveling:** houd de regel aan dat `cfg.*` nooit uit Firestore of de URL komt; anders alsnog `esc()` toevoegen.

### 4. Testhint toont letterlijk `${cfg.meer}`
**Ernst:** Laag (functioneel, geen beveiligingsrisico)
**Locatie:** `src/main.js:2492`
**Probleem:** de string staat tussen enkele aanhalingstekens, dus de interpolatie gebeurt niet; in DEV/TST verschijnt "regels voor ${cfg.meer}".
**Aanbeveling:** backticks gebruiken: `` `<p class="tussen-hint">... voor ${cfg.meer} al gepubliceerd?</p>` ``.

### 5. P0d: elk lid mag schrijven (bekend restrisico)
**Ernst:** Hoog (geaccepteerd, gelijk aan CK-046)
**Locatie:** `firestore.rules:271-272`
**Aanbeveling:** meenemen in P0d (`isBeheerder` op create/update/delete).

## Samenvatting
- Kritieke bevindingen: 0
- Hoge bevindingen: 1 (P0d, bekend en geaccepteerd)
- Lage aanbevelingen: 1 (testhint-interpolatie)

## Eindoordeel
Veilig voor TST (P0d blijft openstaan vóór PRD, zoals afgesproken)
