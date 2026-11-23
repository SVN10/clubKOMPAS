# Compliancerapport: CK-044 Eén navigatie, zijmenu op elke pagina

Datum: 22 november 2026. Branch `test`, niet gecommit.
Bronnen: `.claude/specs/CK-044-besluiten.md`, `.claude/specs/CK-044-zijmenu.md` (incl. antwoorden en bijstellingen), `.claude/reports/CK-044-bouwverslag.md`, `src/main.js` (`sessieLabel`/`footerHTML` r. 491-511, shell r. ~890-1064, `renderMijnAccount` r. ~1650-1768), `src/style.css` (shell-blok r. 640-804), `.claude/reports/CK-023-compliance.md` (eerdere EAA-conclusie).
Werkwijze: `git diff` was in deze sessie niet beschikbaar (geen shell). De code is daarom direct gelezen, met de nadruk op alles wat persoonsgegevens in beeld brengt of lokaal opslaat.

## Verwerkte persoonsgegevens

Deze wijziging voegt **geen nieuwe persoonsgegevens, velden, opslag of verwerkers** toe. Ze verplaatst een bestaand gegeven naar een andere plek in de UI.

| Gegeven | Waar | Wat verandert er |
|---|---|---|
| Weergavenaam (Auth `displayName`), bij ontbreken het **e-mailadres** | Accountregel onderaan het zijmenu (`sessieLabel()`) | Verhuist uit de footer naar het zijmenu. Het zijmenu is sticky, dus de regel staat nu **altijd in beeld**, ook op lange pagina's. Ingeklapt is de regel visueel verborgen en verschijnt alleen als tooltip bij hover of focus. Ge-escaped (`esc`), na "Naam opslaan" bijgewerkt met `textContent`. |
| Rol (`huidigeRol`, bv. "beheerder") | Zelfde accountregel | Idem. |
| Clubnaam, clublogo | Petrol balk | Geen persoonsgegevens. Naam ge-escaped, logo via `veiligLogo()`, `alt=""`. |
| Projectnaam en bouwdatum | Tooltip in de footer (niet in productie) | Ongewijzigd, geen persoonsgegevens. |
| `localStorage['zijmenu-ingeklapt']` = `'0'`/`'1'` | Browser | Bestaande sleutel, nu op elke pagina gebruikt. Geen persoonsgegevens. |

Geen nieuwe netwerkverzoeken, geen cookies, geen nieuwe afhankelijkheden. `firestore.rules` en `.env.*.local` zijn niet aangeraakt.

## Bevindingen

### 1. Accountregel altijd zichtbaar, ook op gedeelde schermen
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 onder c (minimale gegevensverwerking), art. 25 lid 2 (standaardinstellingen die privacy beschermen)
**Probleem:** door het sticky zijmenu staat "naam · rol" nu permanent in beeld. Vroeger stond dat in de footer en verdween het op lange pagina's onder de vouw. Bij schermdelen (beamer in de bestuursvergadering, Teams) of op een kantinelaptop is de regel dus altijd zichtbaar. Het gaat om gegevens van de **ingelogde gebruiker zelf**, en de presentator kiest zelf om te delen. Het risico is daarom klein. Eén randgeval verdient aandacht: `sessieLabel()` valt terug op het **volledige e-mailadres** als er geen weergavenaam is ingesteld (`displayName || email`, bestaand gedrag). Dat e-mailadres staat dan voortdurend groot in beeld. Het is een direct identificerend gegeven dat ook bruikbaar is voor phishing.
**Aanbeveling:** laat bij een ontbrekende weergavenaam niet het volledige e-mailadres zien. Toon bijvoorbeeld alleen het deel vóór de `@`, of "Naam instellen" met een link naar Mijn account. Op Mijn account staat het volledige adres al. Een kleine wijziging, kan mee of als vervolgpunt. Positief: ingeklapt verbergt het menu de naam en toont die alleen bij hover of focus. Zo kan een gebruiker die vaak deelt de naam zelf uit beeld houden.

### 2. Rol zichtbaar in de accountregel
**Ernst:** 🟢 Aanbeveling (geen actie nodig)
**Regelgeving:** AVG art. 32 (passende beveiliging)
**Probleem:** de rol ("beheerder") staat permanent in beeld. Op zich onschuldig, en de gebruiker heeft er voordeel van (hij ziet met welke rechten hij werkt). In combinatie met P0d (rolafhankelijk menu) wordt de rol belangrijker. Belangrijk: het verbergen van de groep Beheer in de UI is **geen** autorisatie.
**Aanbeveling:** zorg er bij P0d voor dat beheerrechten in `firestore.rules` worden afgedwongen, niet alleen door `zichtbaar()` in `ZIJMENU`. Voor CK-044 zelf geen actie.

### 3. Toegankelijkheid: juridisch kader (EAA), kort
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** Richtlijn (EU) 2019/882 (EAA), Implementatiewet toegankelijkheidsvoorschriften producten en diensten (sinds 28 juni 2025); norm EN 301 549 / WCAG 2.1 AA
**Kader:** zie de conclusie in `CK-023-compliance.md`, bevinding 6. clubKOMPAS is een besloten beheertool voor een vereniging, geen consumentendienst uit de EAA-lijst, en SVN10 is waarschijnlijk een micro-onderneming. **Naar verwachting dus geen wettelijke EAA-plicht.** WCAG 2.1 AA blijft de richtlijn, omdat clubs of bonden die in contracten kunnen eisen.
**Beoordeling van deze wijziging (op basis van de code):** sterk verbeterd ten opzichte van de oude navigatie.
- 2.4.1 Blokken omzeilen: overslaglink "Direct naar inhoud" naar `main#inhoud`. Nieuw.
- 1.3.1 / 4.1.2: landmarks (`header`, `nav` "Hoofdmenu", `nav` "Kruimelpad", `main`, `footer`), groepen via `aria-labelledby`, precies één `aria-current="page"`, ☰ met `aria-expanded`/`aria-controls`.
- 2.1.1 / 2.1.2 / 2.4.3: het mobiele paneel zet de achtergrond op `inert`, sluit met Esc en zet de focus terug op ☰. Geen toetsenbordval.
- 2.4.7 Focus zichtbaar: oranje focusring met binnenlijn. 2.5.8 doelgrootte: items van minimaal 44px. 2.3.3: `prefers-reduced-motion`.

Restpunten (geen blokkade):
- **1.4.13 Inhoud bij hover of focus:** de tooltip in het ingeklapte menu heeft `pointer-events: none`. Daardoor verdwijnt hij als de muis erop beweegt (niet "hoverable"), en hij is niet met Esc weg te halen zonder de focus te verplaatsen. Het risico is klein, want de tooltip dekt weinig af. Wie formeel AA wil halen, kan de tooltip hoverable maken en Esc laten sluiten.
- **1.4.3 Contrast:** wit op de lichte petrol in de balk en de footer haalt in donkere modus geen AA. Dat is bekend en valt buiten scope (bouwverslag punt 9).
- **2.4.3 Focus na paginawissel:** blijft zoals nu, bekende beperking voor een latere story.
- **Test:** browser- en VoiceOver-test op tst staan nog open (bouwverslag punten 1-11). Claim pas WCAG-conformiteit na die test.

### Gecontroleerd zonder bevinding
- **localStorage `zijmenu-ingeklapt`:** slaat alleen `'0'`/`'1'` op. Dat is een voorkeur die de gebruiker zelf instelt, zonder identificatie of tracking, en de sleutel bestond al. Valt onder de uitzondering van art. 11.7a lid 3 onder b Telecommunicatiewet (strikt noodzakelijk voor de door de gebruiker gevraagde dienst). Er is geen toestemming nodig en ook geen vermelding in een cookiebanner. Op een gedeeld apparaat delen gebruikers deze voorkeur, maar daarbij lekt niets.
- **Uitloggen altijd in beeld, zonder bevestiging:** dankzij het sticky zijmenu is Uitloggen op elke pagina met één klik bereikbaar, ook op mobiel. Dat verkleint het risico van een open sessie op een gedeeld apparaat (AVG art. 32). Positief. Het loopt via dezelfde `signOut` → `onAuthStateChanged`, en `paneel-open`/`inert` worden opgeruimd. (Bestaand en buiten scope: Firebase Auth bewaart de sessie standaard over browsersessies heen. Zie eventueel een latere story over sessiepersistentie op gedeelde apparaten.)
- **Injectie:** naam, rol, clubnaam en kruimels gaan via `esc()`. De update na "Naam opslaan" gebruikt `textContent`, het logo gaat via `veiligLogo()`.
- **Geen gegevens van anderen in de shell:** alleen de eigen naam en rol van de ingelogde gebruiker.
- **Fictieve-data-principe:** de jsdom-test van de bouwer gebruikte nep-modules en fictieve gegevens ("Jan de Vries", "Piet Jansen") in de scratchpad, buiten de repo. Productiedata is niet aangeraakt.
- **Firebase / verwerkers:** geen nieuwe diensten of datastromen.
- **Jongeren onder 16 / vertrouwenspersoon:** niet van toepassing, want er worden geen ledengegevens verwerkt.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 0
- 🟢 Aanbevelingen: 3

## Eindoordeel
✅ **Compliant.** CK-044 verwerkt geen nieuwe persoonsgegevens. Het verplaatst alleen de eigen naam en rol van de gebruiker uit de footer naar het zijmenu. De localStorage-sleutel is puur functioneel. Toegankelijkheid gaat er duidelijk op vooruit (overslaglink, landmarks, toegankelijk paneel). Aanbeveling 1, geen volledig e-mailadres als terugval in de altijd zichtbare accountregel, is klein en kan in deze oplevering mee. Aanbeveling 2 hoort bij P0d. De punten onder aanbeveling 3 zijn optioneel, zolang er geen wettelijke EAA-plicht is.
