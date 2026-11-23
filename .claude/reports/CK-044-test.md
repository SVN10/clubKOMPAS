# Testrapport: CK-044 — Eén navigatie, zijmenu op elke pagina

Branch `test`, 22 november 2026. Niet ingelogd, niets naar Firestore, niet gecommit.

## Uitgevoerd
- `npm run build`: geslaagd (alleen de bestaande chunk-grootte-waarschuwing). Er is geen lint-script.
- Bouwer-jsdom-test (`scratchpad/jsd/test.mjs`, bundel opnieuw gebouwd van de huidige `src/`): **60/60 geslaagd**.
- Aanvullende jsdom-test (`scratchpad/jsd/extra.mjs`): **38/38 geslaagd**. Controleert per pagina (home, domeinen, functies, club, account) unieke ids, precies één `aria-current` in het zijmenu, één shell/footer/balk, footer zonder knoppen of links, meldingen met `role` status/alert en alleen binnen `main#inhoud`, alle `data-nav`-doelen bekend. Controleert ook de tussenschermen (inlog, geen club) zonder shell, en uitloggen vanuit een open paneel met opruimen van `paneel-open` en `inert`.
- grep op verwijderde namen (`top-nav`, `nav-home`, `nav-beheer`, `footer-rechts`, `footer-account`, `uitlog-knop`, `data-beheer`, `beheerZijmenuHTML`, `paginaLijfHTML`, `bindBeheerTabs`, `bindNavListeners`, `BEHEER_ITEMS`, `BEHEER_NAAM`, `navHTML`): 0 treffers in `src/` en `index.html`. De overgebleven "uitlog" zijn `geen-club-uitlog`, `fout-uitlog` (tussenschermen) en de nieuwe `.zijmenu-uitlog`.
- CSS-klassen zonder gebruik in JS/HTML: alleen `functie-label`, `picto-groot`, `structuur-rij-info`, `volgorde-nr` (bestaand van vóór CK-044, zie bouwverslag) en dynamisch samengestelde `omgeving-balk--test/--productie` (in gebruik). Geen id-verwijzingen naar verdwenen elementen.

## Acceptatiecriteria
| Criterium | Status | Opmerking |
|---|---|---|
| Elke pagina: petrol balk, zelfde zijmenu met Overzicht/Beheer, juiste actieve item (`aria-current`), kruimelpad; oude titelbalk, huisje en Beheer in balk weg; tussenschermen zonder zijmenu | ✅ (logica) | jsdom: één `aria-current` per pagina, kruimels kloppen, tussenschermen zonder shell. Kleur, 22px en oranje rand staan in CSS (`style.css` r. 643-657), visueel niet getest |
| Inklappen tot 44px op elke pagina, stand bewaard, tooltip en naam per pictogram | ✅ (logica) / ⚠ visueel | Klasse, `localStorage`, tekstwissel en behoud bij paginawissel getest. Tooltip en 44px alleen in CSS gelezen |
| Onderaan: "naam · rol" naar Mijn account, Uitloggen, naam direct bijgewerkt na opslaan, footer zonder naam/uitlog | ✅ | Getest, ook uitloggen incl. opruimen. Favicon-reset loopt via ongewijzigde `onAuthStateChanged`-route; echte favicon niet getest |
| Clublogo 78px, half over balk, geen overlap, kleiner binnen balk op mobiel, zonder logo geen lege ruimte | ⚠ Alleen code | CSS: 78px, `top:13px` op balk van 52px (juist gecentreerd op de onderrand), mobiel 36px binnen balk. `heeft-logo` alleen met logo (getest). Overlap niet te meten zonder browser |
| Mobiel: ☰, aria-expanded/-controls, focus naar ✕, `inert` op de rest, Esc/✕/achtergrond sluiten met focus terug, item kiezen sluit, vergroten sluit | ✅ (logica) | Alle paden getest in jsdom, één matchMedia-listener. Echte Tab-gedrag en scroll-lock visueel niet getest |
| Toetsenbord en VoiceOver | ⚠ Handmatig | DOM-volgorde en ARIA kloppen; de echte uitkomst moet op tst |
| Niets verschoven: omgevingsbalk boven alles en niet bedekt, CK-023/025-meldingen op dezelfde plek en één keer, geen ongebruikte selectors | ✅ (logica) | Omgevingsbalk blijft buiten `#app`, `inert` en `--paneel-top` getest. Meldingen zitten onveranderd in `main`. Positie in de browser niet getest |

## Regressiecheck
- ✅ Build slaagt, geen verwijzingen naar verwijderde functies of ids.
- ✅ Omgevingsbalk blijft na elke render en na uitloggen staan, `inert` en `paneel-open` blijven niet hangen.
- ✅ CK-023-meldingen (structuur, functie, profiel, logo, gebruiker) hebben nog de rollen status/alert.
- ✅ Naam opslaan op Mijn account werkt en werkt de accountregel bij.
- ✅ Tussenschermen (inlog, geen club) tonen geen shell.
- ⚠ Niet getest: Firebase-stroom, drag-en-drop/volgorde, opnieuw tekenen met focus op Club (alleen via code gelezen, niet gewijzigd).

## Randgevallen
| Geval | Status | Detail |
|---|---|---|
| Zonder logo | ✅ | Geen `heeft-logo`, geen img |
| Clubnaam met HTML | ✅ | Geëscaped |
| Opgeslagen ingeklapt bij start / geen opslag | ✅ | Beide getest |
| Esc zonder open paneel | ✅ | Geen focuswissel |
| Paneel open, navigeren of uitloggen | ✅ | Alles opgeruimd |
| `matchMedia` ontbreekt | ✅ | Optional chaining |
| Lange clubnaam, breed logo, 768px, donkere modus | ⚠ Handmatig | CSS heeft ellipsis en `max-width:160px`, niet visueel gecontroleerd |

## Bevindingen voor de bouwer
Geen blokkerende bevindingen.
Opmerkingen (geen fout):
- `navNaam('beheer')` valt terug op de id-string; wordt nu niet aangeroepen (kruimel "Beheer" is een letterlijke tekst). Niet-kritiek.
- Bij een open paneel zonder `matchMedia`-wissel (bijv. venster vergroten op een browser zonder event) is er geen extra vangnet. Normaal gedrag in alle moderne browsers.
- Stripje onder het zijmenu met omgevingsbalk (bouwverslag punt 10) is een bewust ontwerpgevolg; Paul moet het beoordelen.

## Handmatig op tst
Zie "Handmatig te controleren" in `.claude/reports/CK-044-bouwverslag.md` (punten 1-11). Prioriteit: (a) logo-overlap op 768px en 400px met in/uitgeklapt menu en een breed logo, (b) paneel op een echte telefoon (Tab blijft in paneel, Esc/✕/tik-naast, scroll-lock, draaien), (c) tooltips ingeklapt bij hover én Tab, (d) VoiceOver-uitspraak, (e) sticky zijmenu op Domeinen met en zonder omgevingsbalk, (f) domein-rijen op 768px bij uitgeklapt menu (bekend CK-037-risico), (g) favicon na uitloggen, (h) donkere modus.

## Eindoordeel
✅ Klaar voor beoordelaar (logica en build groen; visuele criteria vereisen handmatige controle op tst)
