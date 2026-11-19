# Toegankelijkheidsrapport: P0c — Club loskoppelen van gebruiker (tussenschermen)

Methode: statische analyse van `src/main.js` (r. 283-365, 966-987), `src/style.css` (r. 410-456) en `index.html`, vergeleken met `.claude/specs/P0c-ontwerp.md` en `P0c-gebruikersreis.md`. Contrast berekend met de WCAG-formule. Geen browser- of schermlezertest gedaan, geen Firebase-verbinding.

## Wat voldoet

| Onderdeel | Criterium | Resultaat |
|---|---|---|
| Taal `lang="nl"` | 3.1.1 | Voldoet (`index.html:2`) |
| h1 met `tabindex="-1"` + `.focus()` na elke kaartwissel (`toonTussenkaart`, r. 294) | 2.4.3, 4.1.3 | Voldoet; focusring op h1 uit is terecht (niet-interactief) |
| Geen toetsenbordval; tabvolgorde h1 > Opnieuw proberen > Uitloggen > link in hint | 2.1.1, 2.1.2, 2.4.3 | Voldoet; native `<button>` en `<a>`, DOM-volgorde = visuele volgorde |
| Focus terug op "Opnieuw proberen" na mislukte poging (r. 339) | 2.4.3 | Voldoet |
| Live-regio `#fout-hint` aanwezig vóór vulling, leeg-dan-vul met 100 ms (r. 342-344) | 4.1.3 | Voldoet; `isConnected`-check voorkomt schrijven in vervangen DOM |
| `prefers-reduced-motion` schakelt puls uit (`style.css:453`) | 2.3.3 / best practice | Voldoet |
| Pulse: 1,6 s cyclus, alleen opacity | 2.3.1 | Voldoet (ruim onder 3 flitsen/s) |
| Kompas-icoon `aria-hidden="true"` | 1.1.1 | Voldoet (decoratief) |
| Linkfocus `:focus-visible` 2 px outline | 2.4.7 | Voldoet; knoppen houden de standaard browser-focusring (geen `outline:none` op `.btn`) |
| Link onderscheidt zich niet enkel door kleur (vet + onderstreept) | 1.4.1 | Voldoet |
| Geen technische foutcodes in beeld | 3.3.1 | Voldoet |
| Foutkaart noemt oorzaak en herstelactie | 3.3.3 | Voldoet |
| 360 px (en 320 px): kaart-inhoud 206-246 px; `.form-rij` zet knoppen onder 700 px onder elkaar op volle breedte; `overflow-wrap:anywhere` op tekst en hint; geen horizontale scroll verwacht | 1.4.10 Reflow | Voldoet (statisch; visueel niet getest) |
| Knoplabel "Bezig..." identiek aan bestaande patronen (r. 256 e.a.) | 3.2.4 | Consistent |

### Contrast (nieuwe tekst)

| Combinatie | Verhouding | Eis | Resultaat |
|---|---|---|---|
| `--muted` #6F6E6E op wit (laadtitel 18 px, hint 13 px) | 5,08:1 | 4,5:1 | Voldoet |
| `--petrol` #46797B op wit (link, 15 px vet) | 4,90:1 | 4,5:1 | Voldoet |
| `--text` #111212 op wit (tekst, link-hover) | 18,77:1 | 4,5:1 | Voldoet |
| Donker: muted #A3B0B0 op card #1B2A2C | 6,64:1 | 4,5:1 | Voldoet |
| Donker: petrol #7DB1B3 op card | 6,23:1 | 4,5:1 | Voldoet |
| Donker: text #E8EEEE op card | 12,65:1 | 4,5:1 | Voldoet |
| Focusring petrol op wit / donker petrol op card | 4,90 / 6,23:1 | 3:1 (1.4.11) | Voldoet |
| Primaire knop #111212 op oranje #FF9E16 | 9,07:1 | 4,5:1 | Voldoet (oranje alleen als achtergrond, niet als tekst) |

## Bevindingen

### 1. "Bezig..." op de foutkaart wordt niet aangekondigd en de focus kan vervallen
**Ernst:** Aandacht (best practice, 🟡)
**Succescriterium:** 4.1.3 Statusberichten (AA), raakt 2.4.3 Focusvolgorde
**Locatie:** `src/main.js:331-333` (`knop.textContent = 'Bezig...'; knop.disabled = true`)
**Probleem:** De knop die focus heeft wordt `disabled`. Browsers laten de focus dan verdwijnen of laten een schermlezer de tekstwijziging niet melden. De gebruiker hoort niets tot de uitkomst (nieuwe kaart of focus terug op knop). `#fout-hint` wordt hier niet voor gebruikt. Bij succes wordt de kaart vervangen en focust de h1 (goed); bij herhaald falen herstelt `knop.focus()` het (goed). Het gat zit dus alleen in de wachttijd, die bij geen verbinding enkele seconden kan duren.
**Aanbeveling:** Houd de knop focusbaar met `aria-disabled="true"` in plaats van `disabled` (en negeer clicks zolang die staat actief is), en/of meld de status in de bestaande live-regio:
```js
knop.setAttribute('aria-disabled', 'true')
document.getElementById('fout-hint').textContent = 'Bezig met laden...'
```
Zorg dan dat de hint na afloop weer leeg of de support-zin is. Dit mag ook als suggestie blijven als de PO de huidige afweging bewust wil houden.

### 2. Na tussenkaart naar dashboard verdwijnt de focus
**Ernst:** Aandacht (🟡)
**Succescriterium:** 2.4.3 Focusvolgorde
**Locatie:** `src/main.js:963-974` (`toonUitkomst` > `renderDashboard`)
**Probleem:** De tussenkaart zet de focus op de h1; daarna vervangt `renderDashboard` de DOM. De gefocuste h1 verdwijnt, de focus valt terug op `<body>` en een toetsenbord- of schermlezergebruiker begint onderaan niets (bij herladen en bij Opnieuw proberen > succes). Dat is gelijk aan het bestaande gedrag na inloggen, maar is nu vaker zichtbaar. De spec vraagt alleen focus bij kaartwissels tussen tussenkaarten, dus geen afwijking van het ontwerp.
**Aanbeveling:** Optioneel, in een aparte story: na `renderDashboard` de dashboard-h1 (`.hero-tekst h1`) `tabindex="-1"` geven en focussen, of `main` focussen.

### 3. Laadkaart heeft geen eigen live-regio; flits van twee focusverplaatsingen
**Ernst:** Suggestie (🟢)
**Succescriterium:** 4.1.3 Statusberichten
**Locatie:** `src/main.js:283-285`, `onAuthStateChanged` r. 969-972
**Probleem:** Het ontwerp kiest bewust voor focus op h1 in plaats van `aria-live`; dat voldoet. Na 500 ms verplaatst echter de focus van het inlogscherm (waar "Bezig..." op de knop stond) naar de laadkaart en meteen daarna naar de uitkomst. Een schermlezer kan zo twee koppen kort na elkaar voorlezen.
**Aanbeveling:** Geen actie nodig; eventueel de vertraging iets verhogen of de laadkaart bij een snelle uitkomst niet meer renderen (is al gedaan met `clearTimeout`).

### 4. Pulserende animatie kan langer dan 5 s lopen
**Ernst:** Suggestie (🟢)
**Succescriterium:** 2.2.2 Pauzeren, stoppen, verbergen (A)
**Locatie:** `src/style.css:448`
**Probleem:** De puls (opacity) herhaalt oneindig zolang de laadkaart zichtbaar is; zonder verbinding kan dat >5 s zijn. Het is een laadindicator (essentieel) en geen verplaatsing, en gebruikers met `prefers-reduced-motion` krijgen hem niet. Daarom geen fout.
**Aanbeveling:** Geen actie. Eventueel `animation-iteration-count: 5` zodat de puls vanzelf stopt.

### 5. Documenttitel en landmark ontbreken op de tussenkaarten
**Ernst:** Suggestie (🟢)
**Succescriterium:** 2.4.2 Paginatitel, 1.3.1 Info en relaties / 2.4.1 Blokken omzeilen
**Locatie:** `index.html:7`; `src/main.js:283-292`
**Probleem:** `<title>` blijft "clubKOMPAS" bij elke kaart. De kaarten staan niet in een `<main>`. Dit geldt ook voor het bestaande inlogscherm en dus niet nieuw, maar een schermlezergebruiker mist de landmark.
**Aanbeveling:** `<main class="inlog-wrap">` in `toonTussenkaart` (en inlogscherm) en optioneel `document.title = 'Geen club gekoppeld - clubKOMPAS'` per kaart.

### 6. Linkpad met `SUPPORT_EMAIL` is ongetest in de huidige configuratie
**Ernst:** Suggestie (🟢)
**Succescriterium:** 2.4.4 Linkdoel, 3.3.x
**Locatie:** `src/main.js:12`, `supportLinkHTML` r. 114-117
**Probleem:** `SUPPORT_EMAIL = ''` betekent dat alleen variant B (geen link) in gebruik is. De linkstijl, focus en de hint-met-link (innerHTML in live-regio) zijn dus statisch beoordeeld. De linktekst is het e-mailadres zelf, dat is een duidelijk linkdoel. Bij invullen: controleer dat de zin "Mail naar adres." in de live-regio goed wordt voorgelezen en dat de link met Tab bereikbaar is na "Uitloggen".
**Aanbeveling:** Handmatig testen zodra het adres bekend is.

## Samenvatting
- Kritieke bevindingen: 0
- Aandachtspunten: 2 (nr. 1, 2)
- Suggesties: 4 (nr. 3, 4, 5, 6)

## Eindoordeel
Kleine tekortkomingen: geen blokkerende WCAG 2.1 AA-schendingen gevonden; de aandachtspunten (statusmelding en focusbehoud bij "Bezig...") zijn aan te raden, niet verplicht om door te mogen. Kleurcontrast, reduced-motion, focusbeheer, toetsenbordbediening en reflow op 360 px voldoen in de statische analyse. Handmatige controle met een schermlezer (VoiceOver) en op een echt 360 px-scherm blijft nodig.
