# Huisstijlrapport: CK-020 Vermogens beheren

Fase 5b, 23 november 2026. Statische analyse van `src/style.css` en `src/main.js` (werkboom) tegen `CK-020-ontwerp.md`, `CK-020-besluiten.md` (18–21), het bouwverslag en de tokens in `:root`. Niet in een browser bekeken. (Rapport door de hoofdsessie vastgelegd namens de huisstijl-medewerker, die zelf geen bestand mocht schrijven.)

## In orde
- **Kleur:** alle nieuwe CSS (`style.css` ca. 913–1018) gebruikt alleen bestaande tokens; geen nieuwe hex of rgba. Tooltip `--petrol-dark`/`--on-petrol` zoals het ingeklapte zijmenu. Verwijderen kleurt `--fout` bij hover en focus. Soortstip via `SOORT_KLEUR`.
- **Typografie:** geen nieuw webfont, alle groottes via de schaal, alleen geladen gewichten. Groepkop sluit aan op `.card h3`/`.form-label`; "Toon" is een `.form-label`.
- **Componenten:** sectiekoppen ongewijzigd. Puzzelstuk, potlood en prullenbak: 48-viewBox, stroke 3, 18px, `currentColor`, `aria-hidden`; menuvolgorde Domeinen, Vermogens, Bestuursfuncties, Club. Prullenbak 12px van het potlood, op de telefoon rechts, 44×44 op ≤700px. ↑/↓ zelfde hoogte. Balk met "Toon" op alle drie de pagina's gelijk. Groepkoppen met pictogram, naam, soortpill en aantal. Home: vier kerncijfers, "n vermogens"/"Nog geen vermogens" als eigen regel, grijze hint bij laadfout.
- **Responsief:** zijmarges, kaartengrid 3-2-1, container queries (Vermogens ≤400px, Domeinen ≤660px, Bestuursfuncties ≤500px), actiekolom 200px op de telefoon (bewuste afwijking 5 uit het bouwverslag), balk onder elkaar op ≤700px.

## Afwijkingen en suggesties (geen blokkerende fouten)

| # | Ernst | Waar | Probleem | Aanbeveling |
|---|---|---|---|---|
| 1 | Middel | `main.js` 1209, 1633, 2094, 2302, 2433; 1290, 2131; 1320; 1506, 2252; 92; 955, 611 | Inline `style=""` op veel plekken; CK-020 herschreef 1290 ("Geen domeinen van deze soort.") en liet de inline stijl staan. | `style="margin-top:0"` laten vervallen (doet niets); klasse `.lijst-leeg` voor 1290 en 2131; `.domein-rij .pill { margin-top:0 }` voor 1320; `width:100%` weg op 1506/2252; klasse voor de radiolabels op 92. |
| 2 | Laag | `style.css` 984–990 met 265 | `.leeg-blok .btn-toevoegen` erft `margin-top:4px`; op ≤700px 38px hoog. | `margin-top:0` en op ≤700px `min-height:44px`. |
| 3 | Laag | `style.css` 999 | `.groep-leeg` onder 400px `padding-left:28px`, naamkolom begint op 36px. | `padding-left:36px`. |
| 4 | Laag | `style.css` 967; `main.js` 1226–1262, 2102–2113 | Vermogenformulieren max. 480px, andere formulieren volle breedte. | Eén breedte voor alle beheerformulieren. |
| 5 | Laag, app-breed | `style.css` 904–905 | Focusring `.btn`/`.btn-kaart-actie` alleen oranje (ca. 2:1); toevoegknop en shell hebben een donkere binnenlijn. | `box-shadow: 0 0 0 2px var(--text)` op `.btn:focus-visible` en `.btn-kaart-actie:focus-visible`. |
| 6 | Laag, observatie | `style.css` 254–268 | "+ … toevoegen" is gestippeld, niet oranje; huisstijl noemt oranje voor primaire acties. Volgt het ontwerp. | Geen actie in CK-020; besluit bij Paul. |
| 7 | Laag | `main.js` 1310, 1626, 1738 | "Nog geen vermogens" is op Domeinen een onderstreepte link, elders cursief muted. | Optioneel: cursief, onderstrepen alleen bij hover. |
| 8 | Laag | `main.js` 1733, 1746; `style.css` 970 | Lege `.groep-picto` geeft 10px inspringing; "Zonder geldig domein" niet. | `.groep-picto:empty { display:none }`. |
| 9 | Te controleren | `style.css` 102–106, 596–599 | Vier kerncijfers naast elkaar tot 701px; rond 701–900px met uitgeklapt menu ca. 115px per kaart. | Bekijken op 768px; zo nodig 2×2 tot 900px. |
| 10 | Laag, bestond al | `style.css` 571 | Chevron van `select.form-input` hardcoded `%2346797B`; in donker ca. 3,8:1, nu met twee "Toon"-keuzelijsten zichtbaarder. | Aparte `background-image` met `%237DB1B3` in de donker-blokken. |

Suggestie: het puzzelstuk krijgt een inkeping links of onder, zodat het op 18px herkenbaarder is.

## Niet gecontroleerd
375, 768 en ≥1200px, uitgeklapt en ingeklapt menu, licht en donker, tooltips met muis, Tab en Esc — alleen uit de code afgeleid.

## Eindoordeel
🟡 Voldoet in hoofdlijnen aan de huisstijl, met kleine afwijkingen. Geen blokkerende fouten.
