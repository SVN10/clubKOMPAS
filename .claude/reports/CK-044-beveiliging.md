# Beveiligingsrapport: CK-044 — Eén navigatie, zijmenu op elke pagina

Branch: `test` (niet gecommit). Datum: 22 november 2026.
Gescand: `git diff src/main.js src/style.css`, de omliggende helpers (`esc`, `veiligLogo`, `sessieLabel`, `kruimelpadHTML`, `laadClub`, `onAuthStateChanged`), `firestore.rules`, `.claude/specs/CK-044-*.md` en `.claude/reports/CK-044-bouwverslag.md`. Niet ingelogd, niets uitgevoerd.

## Gecontroleerd en in orde

- **Clubnaam in de titel** (`topBarHTML`): `esc(huidigProfiel.naam)`. In orde.
- **Accountregel** (`zijmenuHTML`): `esc(sessieLabel())`; naam/e-mail en rol gaan dus geëscaped de HTML in. Na het wijzigen van de naam wordt `textContent` gebruikt. In orde.
- **Logo**: `veiligLogo()` laat alleen `data:image/...` door (de rules dwingen hetzelfde af met `geldigLogo`), daarna `esc()` in een `src="..."` tussen dubbele aanhalingstekens. Een `data:image/svg+xml` in een `<img>` voert geen script uit. `alt=""` is een a11y-keuze, geen risico. In orde.
- **Tooltips**: in het zijmenu staan geen `title`-attributen meer; de footer-tooltip escapet `projectId` en de bouwdatum. In orde.
- **Navigatie**: alle links zijn `href="#"` met `data-nav`; het doel komt uit de vaste tabel `NAV_DOEL` (functieverwijzingen). Geen `eval`, geen `new Function`, geen `location`-toewijzing, geen URL-parameters of hash-routing: er is dus geen open redirect mogelijk. De skiplink zet alleen de focus. In orde.
- **Uitloggen vanuit het paneel**: `sluitPaneel({ focus: false })` en daarna `signOut(auth)`. `onAuthStateChanged` maakt `huidigClubId`, `huidigGebruiker`, `huidigProfiel` en `huidigeRol` leeg, zet de favicon terug en vervangt `#app` door het inlogscherm. Er blijft dus geen clubdata in het geheugen of de DOM achter. In orde (zie bevinding 5 voor een randgeval).
- **localStorage**: alleen `zijmenu-ingeklapt` = `'1'`/`'0'`, wordt strikt vergeleken (`=== '1'`) en zit in try/catch. Geen tokens, geen persoons- of clubgegevens. In orde.
- **Multi-tenancy**: CK-044 verandert geen Firestore-query of pad. Data-isolatie blijft geregeld met `isLid(clubId)` in de rules. In orde.
- **Dependencies**: `package.json`/`package-lock.json` zijn niet gewijzigd. In orde.
- **CSS**: geen `url(...)`, `@import` of externe bronnen toegevoegd. In orde.

## Bevindingen

### Bevinding 1: Beheer verbergen in het zijmenu is geen autorisatie (voorbereiding P0d)
**Ernst:** 🟢 Laag voor CK-044 (geen regressie). Wordt 🔴 Kritiek voor P0d als het alleen in de UI wordt opgelost.
**Type:** Autorisatie
**Locatie:** `src/main.js:898` (`zichtbaar: () => true /* P0d: huidigeRol === 'beheerder' */`), `src/main.js:1062-1066` (`NAV_DOEL`-afhandeling), `firestore.rules:44,51-52,60-61`
**Probleem:** `zichtbaar()` bepaalt alleen of de groep Beheer in het menu wordt getekend. Drie dingen staan daar los van:
1. `NAV_DOEL` en de render-functies (`renderPijlersDomeinenBeheer`, `renderBestuursfunctiesBeheer`, `renderClubBeheer`) controleren zelf geen rol. Wie de groep niet ziet, kan de pagina toch openen via het kruimelpad (`data-nav="beheer"`), de knop "naar-structuur-beheer" op Home of een aanroep vanuit de console.
2. De Firestore-rules geven elk lid (`isLid`) create/update/delete op `instellingen`, `bestuursfuncties` en `structuurelementen`. Met de Firebase SDK in de browser-console kan elk lid dus elke beheeractie uitvoeren, ongeacht wat de UI laat zien.
3. `huidigeRol` komt uit het `leden`-document. Dat is veilig, want `leden` is `write: if false`. De UI-waarde is wel alleen weergave, geen controle.
Vandaag is dit geen regressie: ook vóór CK-044 zag elk lid "Beheer".
**Aanbeveling:** Regel P0d op drie lagen:
- **Rules (verplicht, de echte grens):** voeg een functie toe, bijvoorbeeld `isBeheerder(clubId)` = `isLid(clubId) && get(/databases/$(database)/documents/clubs/$(clubId)/leden/$(request.auth.uid)).data.rol == 'beheerder'`, en gebruik die voor create/update/delete op de beheercollecties.
- **Navigatie:** laat de NAV_DOEL-afhandeling ook `zichtbaar()` van het bijbehorende item controleren, of geef `NAV_DOEL`-items een eigen `magOpenen()`.
- **Render-functies:** zet een guard bovenaan elke beheer-render (`if (!magBeheren()) return renderDashboard(gebruiker)`). Het kruimelpad en de Home-knop naar Beheer moeten dezelfde voorwaarde volgen.
Test in de emulator dat een niet-beheerder een `permission-denied` krijgt bij een schrijfactie.

### Bevinding 2: Opzoeken in NAV_DOEL via een gewoon object
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie
**Locatie:** `src/main.js:1062-1066` (`NAV_DOEL[link.dataset.nav]`)
**Probleem:** `NAV_DOEL` is een object literal, dus ook prototype-sleutels zoals `constructor` of `toString` geven een functie terug. Een `data-nav="constructor"` zou `Object(gebruiker)` aanroepen. Vandaag kan dat niet, want alle `data-nav`-waarden komen uit vaste code. Het wordt wel een risico als menu-items later uit data komen (bijvoorbeeld clubspecifieke pagina's).
**Aanbeveling:** Gebruik `Object.hasOwn(NAV_DOEL, id)` als voorwaarde, of maak `NAV_DOEL` een `Map` of `Object.freeze(Object.assign(Object.create(null), {...}))`.

### Bevinding 3: Ids ongeëscaped in attributen
**Ernst:** 🟢 Laag
**Type:** XSS (alleen in de toekomst)
**Locatie:** `src/main.js` `zijmenuHTML` (`data-nav="${item.id}"`, `data-groep="${groep.id}"`, `id="zm-kop-${groep.id}"`, `aria-labelledby`), `kruimelpadHTML` (`data-nav="${doel}"`)
**Probleem:** Namen en koppen gaan wel door `esc()`, de ids niet. Alle ids zijn nu vaste constanten in de code, dus er is geen actueel risico. Als `ZIJMENU` of het kruimelpad later (deels) uit Firestore of clubinstellingen wordt gevuld, ontstaat een attribuut-injectie.
**Aanbeveling:** Zet ook de ids door `esc()`, of leg in een commentaar bij `ZIJMENU` vast dat het een vaste constante moet blijven. Valideer ids eventueel tegen `/^[a-z0-9-]+$/`.

### Bevinding 4: esc() escapet geen enkele aanhalingstekens
**Ernst:** 🟢 Laag (bestond al vóór CK-044)
**Type:** XSS (hardening)
**Locatie:** `src/main.js:61-63`
**Probleem:** `esc()` vervangt `& < > "` maar niet `'`. Alle attributen in de nieuwe shell gebruiken dubbele aanhalingstekens, dus het is nu veilig. Eén toekomstig attribuut met enkele aanhalingstekens (`title='${esc(x)}'`) maakt het lek.
**Aanbeveling:** Voeg `.replace(/'/g, '&#39;')` toe aan `esc()`.

### Bevinding 5: Paneelstatus niet opgeruimd bij uitloggen via een andere weg
**Ernst:** 🟢 Laag (robuustheid en toegankelijkheid, geen datalek)
**Type:** Sessiebeheer
**Locatie:** `src/main.js:1849-1857` (else-tak van `onAuthStateChanged`), `src/main.js` `sluitPaneel`/`PANEEL_INERT`
**Probleem:** Alleen de uitlogknop in het paneel roept `sluitPaneel()` aan. Eindigt de sessie terwijl het mobiele paneel open is, op een andere manier (token ingetrokken, uitgelogd in een ander tabblad, account uitgeschakeld), dan rendert `renderInlogscherm()` zonder op te ruimen. `body.paneel-open` (scroll-lock) en `inert` op `.omgeving-balk` (buiten `#app`) blijven dan staan. De gebruikersstaat wordt wel correct gewist. Daarnaast heeft `signOut(auth)` geen `.catch`. Bij een fout blijft de gebruiker ingelogd zonder melding, en het paneel is al gesloten.
**Aanbeveling:** Roep `sluitPaneel({ focus: false })` aan in de else-tak van `onAuthStateChanged`, of centraal in `renderInlogscherm`. Geef `signOut(auth)` een `.catch(...)` met een melding.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 0
- 🟢 Lage aanbevelingen: 5 (waarvan bevinding 1 een harde voorwaarde is voor P0d: autorisatie in de rules, niet alleen `zichtbaar()`)

## Eindoordeel
✅ Veilig voor TST
