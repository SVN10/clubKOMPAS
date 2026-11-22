# Specificatie: CK-023 Melding bij mislukt opslaan (+ CK-025 Bevestiging na opslaan)

## 1. Wat wordt er gebouwd?
Eén herbruikbaar meldingspatroon voor alle schrijfacties in Beheer en Mijn account. Bij een fout ziet de bestuurder een begrijpelijke melding, blijft wat hij heeft ingevuld staan en kan hij het meteen opnieuw proberen. Bij succes ziet hij een korte bevestiging, ook als de pagina daarna opnieuw getekend wordt. Tijdens het opslaan staat de knop op "Bezig..." en kan hij niet twee keer klikken.

**Advies afbakening: CK-023 en CK-025 samen bouwen.** Het is hetzelfde mechanisme (één statusregel, maar dan voor fout of voor succes), het raakt dezelfde handlers, en CK-025 los bouwen betekent die handlers twee keer openbreken. Samen blijft het klein tot middelgroot. **Foutkleur in donkere modus** (vervolgpunt P0e) gaat mee, omdat de nieuwe meldingen dezelfde kleur gebruiken: token `--fout` per modus.

Buiten scope: foutafhandeling bij het **laden** van lijsten (lezen), behalve waar dat lezen deel uitmaakt van een opslagactie (zie inventaris). Geen nieuwe schrijfacties, geen wijziging aan de Firestore-regels in productie.

## Gebruikersreis (samenvatting)
1. Bestuurder past iets aan (domein, bestuursfunctie, profiel, logo, account) en klikt Opslaan.
2. De knop toont "Bezig..." en doet niets bij een tweede klik.
3a. Gelukt: de lijst of pagina wordt ververst en er staat "✓ … opgeslagen." (wordt voorgelezen, verdwijnt bij de volgende actie).
3b. Mislukt: formulier en invoer blijven staan, er staat een foutmelding in klare taal bij de actie (wordt direct voorgelezen), de knop is weer bruikbaar.

## 2. Inventaris schrijfacties (huidig gedrag, `src/main.js`)

| # | Actie | Waar | Bij succes | Bij fout | Dubbelklik |
|---|---|---|---|---|---|
| 1 | Domein toevoegen | `structuur-opslaan` (r. ~920) | form dicht, lijst ververst, geen bevestiging | **geen try/catch**: stil falen, unhandled rejection; invoer blijft toevallig staan. Het vooraf lezen (`laadStructuurelementen` voor `volgorde`) faalt ook stil | **mogelijk**: twee klikken = twee domeinen met dezelfde `volgorde` |
| 2 | Domein bewerken | `bewerk-opslaan` (r. ~1030) | lijst ververst | **geen try/catch**: stil falen, bewerkformulier blijft staan zonder melding | mogelijk (gevolg onschuldig) |
| 3 | Domein verwijderen | `verwijder` + `confirm()` | lijst ververst | **geen try/catch**: stil falen | n.v.t. |
| 4 | Domein ↑/↓ | `omhoog`/`omlaag` | lijst ververst, focus blijft goed | **geen try/catch**; `Promise.all` van losse `updateDoc`'s: bij een fout halverwege is de volgorde **half geschreven** | snel klikken = overlappende hernummering |
| 5 | Bestuursfunctie toevoegen | `functie-opslaan` | form dicht, lijst ververst | try/catch: "Opslaan mislukt, probeer opnieuw." in `functie-naam-fout`; vooraf lezen (dubbele-naamcheck) **buiten** try | mogelijk: dubbele functie |
| 6 | Bestuursfunctie bewerken | `bewerk-opslaan` | lijst ververst | try/catch, zelfde algemene tekst; vooraf lezen buiten try | mogelijk |
| 7 | Bestuursfunctie verwijderen | `verwijder` | lijst ververst | **geen try/catch** (alleen check "nog in gebruik" via `functie-melding`) | n.v.t. |
| 8 | Bestuursfunctie ↑/↓ | idem 4 | idem 4 | idem 4 | idem 4 |
| 9 | Clubprofiel opslaan | `profiel-opslaan` | `renderClubBeheer()` tekent opnieuw → "✓ Profiel opgeslagen." staat `hidden` en **wordt nooit getoond** (CK-025) | try/catch: algemene tekst in `profiel-naam-fout` (verkeerde plek, lijkt op een fout in de clubnaam) | mogelijk, geen knopstatus |
| 10 | Logo uploaden | `logo-input` change | opnieuw getekend, "✓ Logo opgeslagen." **nooit getoond** | try/catch: knoptekst wordt "Fout — probeer opnieuw" (geen live region; geen onderscheid tussen "bestand onleesbaar" en "opslaan mislukt"); `input.value` wordt niet gereset, dus hetzelfde bestand opnieuw kiezen doet niets | label is geen echte knop, niet uit te schakelen |
| 11 | Logo verwijderen | `logo-verwijderen` | opnieuw getekend, geen bevestiging | **geen try/catch**: stil falen | mogelijk |
| 12 | Naam (Auth) | `geb-naam-opslaan` | "✓ Naam opgeslagen." **wordt wel getoond** (geen re-render), maar blijft daarna altijd staan en heeft geen `role` | `Fout: auth/…` (technische code) | goed: knop disabled + "Bezig..." |
| 13 | E-mailadres (Auth) | `geb-email-opslaan` | "✓ Verificatiemail gestuurd naar …" wordt getoond | foutcodes deels vertaald, rest `Fout: auth/…`; geen tekst voor `auth/too-many-requests`, `auth/network-request-failed` | goed |
| 14 | Wachtwoord (Auth) | `geb-ww-opslaan` | "✓ Wachtwoord gewijzigd." wordt getoond | idem 13; fout altijd onder "Huidig wachtwoord", ook als het nieuwe wachtwoord het probleem is | goed |

**Correctie op CK-025:** de meldingen bij Mijn account (12–14) worden wél zichtbaar; het probleem zit bij profiel en logo (9–11), die de pagina opnieuw tekenen. Bij 12–14 ontbreekt alleen `role="status"` en het opruimen bij een volgende poging.

**Bestaande patronen om op voort te bouwen:**
- `.form-fout` per veld (validatie) – blijft voor veldfouten.
- `.profiel-succes` (petrol, 600) – wordt de succesvariant.
- `functie-melding` (`<p class="form-fout" role="status">`) – sectiebrede melding, maar met verkeerde rol voor fouten.
- Inlogscherm en Foutkaart: knop "Bezig..." + disabled/`aria-disabled`, `role="alert"`, foutcodes-tabel – het model voor de nieuwe helper.

**Offline-gedrag Firestore (belangrijk):** de app gebruikt `getFirestore()` zonder persistente cache. Een schrijfactie offline **faalt niet**: de belofte blijft hangen tot de verbinding terug is (en wordt dan alsnog verstuurd, zolang het tabblad open is). Een lees-actie offline faalt na enkele seconden met `unavailable`. Zonder maatregel blijft de knop dus eindeloos op "Bezig...".

## 3. Voorgestelde aanpak

### 3a. Eén helper en één statusregel
- Nieuw element per sectie (Domeinen, Bestuursfuncties, Clubprofiel, Clublogo, en per blok in Mijn account): `<p class="melding" id="…-melding" role="status" aria-live="polite"></p>` voor succes, en voor fouten hetzelfde element met `role="alert"` – of twee elementen (`-succes`/`-fout`). Advies: **twee vaste elementen**, al aanwezig bij het tekenen en leeg (live regions moeten bestaan vóór de tekst erin komt). De bestaande `.profiel-succes`-elementen worden de succes-elementen; `functie-melding` wordt het fout-element voor Bestuursfuncties.
- Helper, bijvoorbeeld:
  - `foutTekst(e)` – vertaalt Firebase-codes naar klare taal (tabel hieronder).
  - `async function metOpslaan(knop, actie, { bezig = 'Bezig...', fout, succes })` – zet knop op disabled + "Bezig...", wist eerdere meldingen, voert `actie()` uit met een **time-out van 15 s**, toont bij fout `foutTekst(e)` in `fout`, zet knop terug (`finally`), retourneert `true/false`. Lijst-acties (↑/↓, verwijderen) zetten tijdens de actie alle actieknoppen in de lijst op disabled.
- **Succes na opnieuw tekenen (CK-025):** `renderClubBeheer(gebruiker, { succes: 'profiel' | 'logo' | 'logo-weg' })` tekent de pagina met de juiste bevestiging zichtbaar. Domeinen/functies: na `laadEnRender()` de succestekst in de sectiemelding zetten (die staat buiten `#…-lijst` en overleeft het verversen).
- Melding verdwijnt bij de volgende actie in dezelfde sectie (niet op een timer – timers zijn slecht voor schermlezers en langzame lezers).

### 3b. Foutteksten (klare taal)
| Code | Tekst |
|---|---|
| `permission-denied` | "Je hebt geen toestemming om dit op te slaan. Herlaad de pagina; lukt het dan nog niet, neem contact op met SVN10." |
| `unavailable`, `auth/network-request-failed`, time-out, `navigator.onLine === false` | "Geen verbinding met de server. Controleer je internet en probeer het opnieuw. Je invoer staat er nog." |
| `resource-exhausted` (quota) | "De server is tijdelijk overbelast. Probeer het over een paar minuten opnieuw." |
| `unauthenticated`, `auth/user-token-expired`, `auth/requires-recent-login` | "Je sessie is verlopen. Log opnieuw in." (+ knop/link Uitloggen) |
| `failed-precondition` / `not-found` (bijv. item al verwijderd in ander tabblad) | "Dit item bestaat niet meer. De lijst is ververst." (lijst opnieuw laden) |
| `invalid-argument` (bijv. logo te groot, >1 MB) | "Dit kon niet worden opgeslagen. Probeer een kleiner bestand." / algemeen |
| `auth/too-many-requests` | "Te veel pogingen. Wacht even en probeer het opnieuw." |
| bestaande auth-codes (wrong-password e.d.) | blijven zoals nu |
| onbekend | "Opslaan is niet gelukt. Probeer het opnieuw." (code alleen in `console.error`, niet in beeld) |

### 3c. Offline en time-out
- Vóór elke schrijfactie: is `navigator.onLine` false → niet schrijven, direct offline-melding.
- Time-out 15 s → offline-melding. Let op: de schrijfactie kan daarna alsnog doorkomen. Daarom bij time-out de tekst: "Opslaan duurt te lang. Controleer je verbinding; ververs daarna de lijst om te zien of het gelukt is." en geen automatische nieuwe poging.

### 3d. Ingevulde gegevens
- Toevoegen/bewerken: formulier blijft open met alle waarden; focus terug op de Opslaan-knop.
- Verwijderen/volgorde: lijst blijft zoals hij was (opnieuw laden om de echte stand te tonen).
- Profiel: velden behouden; fout niet meer onder "Clubnaam" maar in de sectiemelding.
- Logo: `input.value = ''` na elke poging; aparte tekst als het bestand niet te lezen is ("Dit bestand kan niet als afbeelding worden gelezen.").
- Account: wachtwoordvelden niet wissen bij een fout (nu ook niet); wel bij succes (zoals nu).

### 3e. Volgorde atomair
↑/↓ (domeinen en functies) via `writeBatch` in plaats van `Promise.all`: alles of niets, dus geen half geschreven volgorde. Kleine wijziging in dezelfde handlers.

### 3f. Foutkleur
`--fout` als token: licht `#c0392b` (5,44:1 op wit), donker `#FF8A7A` (6,48:1 op `--card` `#1B2A2C`, 7,27:1 op `--surface`). Vervangen in `.form-fout`, `.form-input.fout`, `.gevaar:hover` en de nieuwe `.melding-fout`. Ook in `[data-theme="dark"]`.

## Betrokken bestanden
- `src/main.js` – helper `foutTekst` + `metOpslaan`; handlers 1–14; `renderClubBeheer` krijgt optie `succes`; ↑/↓ via `writeBatch` (import uitbreiden); meldingselementen in de HTML van de vier beheer-/accountschermen.
- `src/style.css` – token `--fout` in `:root`, donkere media query en `[data-theme="dark"]`; klassen `.melding-succes`/`.melding-fout` (gebaseerd op `.profiel-succes`, met `:empty { display:none }`); `#c0392b` overal vervangen door `var(--fout)`.
- `firestore.rules` – **niet** wijzigen in de repo. Voor de test eventueel tijdelijk strenger publiceren in `svn10-clubkompas-test` en daarna terugzetten met `npm run regels:test`.

## 4. Acceptatiecriteria
- [ ] **Offline:** in de testomgeving met DevTools op "Offline": domein toevoegen, domein bewerken, functie toevoegen, profiel opslaan en logo uploaden tonen elk binnen 1 s een verbindingsmelding; invoer en formulier blijven staan; de knop is weer bruikbaar. Na weer online zetten lukt dezelfde actie zonder iets opnieuw in te vullen.
- [ ] **Geweigerde toegang:** met in **test** tijdelijk `allow write: if false` op `structuurelementen`, `bestuursfuncties` en `instellingen`: toevoegen, bewerken, verwijderen en ↑/↓ geven de toestemmingsmelding, en de lijst toont daarna de echte (ongewijzigde) stand. Daarna regels terugzetten met `npm run regels:test`.
- [ ] **Bevestiging (CK-025):** na opslaan van profiel, uploaden en verwijderen van het logo, en wijzigen van naam/e-mail/wachtwoord is een "✓ …"-melding zichtbaar en wordt die voorgelezen (`role="status"`); bij de volgende actie in die sectie verdwijnt hij.
- [ ] **Dubbelklik:** snel twee keer op Opslaan bij domein of functie toevoegen levert precies één nieuw item op; tijdens het opslaan staat de knop op "Bezig..." en is hij uitgeschakeld.
- [ ] **Geen technische codes in beeld:** geen enkele melding toont nog `Fout: auth/…` of een andere ruwe code; onbekende fouten geven de algemene tekst en schrijven de code naar de console.
- [ ] **Volgorde atomair:** ↑/↓ met geweigerde toegang laat de bestaande nummering 1 t/m n intact (geen dubbele of ontbrekende nummers).
- [ ] **Contrast:** foutmeldingen halen minimaal 4,5:1 in licht én donker (handmatig of met de DevTools-contrastcheck), zowel via systeeminstelling als via `data-theme`.

## Wat mag er niet kapotgaan?
- Bestaande veldvalidatie (verplicht, minimaal n tekens, hashtag, dubbele functienaam).
- Focus na ↑/↓ blijft op het verplaatste item.
- `confirm()` vóór verwijderen; blokkade "functie nog in gebruik".
- Inlogscherm, Foutkaart en laadkaart (eigen foutpatroon, niet aanraken).
- Favicon na logo-wijziging; footer-naam na naamwijziging.
- Productieregels en productiedata: alle tests met strengere regels **alleen** in `svn10-clubkompas-test`.

## Architectuurlaag
Platform (P0, generieke UI-basis) – het meldingspatroon en de foutvertaling zijn clubonafhankelijk en worden door elke latere feature (vermogens CK-020, documenten, workflows) hergebruikt.

## Randgevallen en risico's
- **Oud tabblad na P0c:** een tabblad dat nog de oude code draait, krijgt deze verbetering niet; de melding helpt pas vanaf de volgende deploy (bijv. bij latere regelwijzigingen of een ingetrokken lidmaatschap). Het criterium uit CK-023 geldt dus voor de nieuwe code.
- **Time-out vs. late schrijfactie:** offline gestarte schrijfacties kunnen later alsnog doorkomen; daarom eerst `navigator.onLine` controleren en bij time-out niet automatisch opnieuw proberen.
- **Fout bij het vooraf lezen** (volgorde bepalen, dubbele-naamcheck) moet binnen dezelfde try vallen, anders blijft het stil.
- **Gelijktijdig bewerken in twee tabbladen:** `updateDoc` op een verwijderd item geeft `not-found` → lijst verversen.
- **Logo bijna 1 MB:** `resizeAfbeelding` houdt het klein, maar een fout van Firestore moet een eigen tekst krijgen.
- **Live regions:** tekst in een element zetten dat net met `innerHTML` is aangemaakt wordt soms niet voorgelezen; succes na re-render daarom met een korte vertraging (zoals bij `fout-hint`, 100 ms) of het element vooraf leeg tekenen en daarna vullen.

## 5. Open vragen voor Paul
1. **CK-023 en CK-025 samen in één oplevering?** Advies: ja, zelfde mechanisme en dezelfde handlers; plus de foutkleur in donkere modus.
2. **Waar staat de melding: bij de sectie (statusregel) of rechtsonder (toast)?** Advies: statusregel in de sectie, onder de knoppen. Past bij wat er al is, blijft staan tot de volgende actie en werkt goed met schermlezers en op mobiel. Een toast pas overwegen als er later veel meldingen buiten formulieren komen.
3. **Volgorde ↑/↓ omzetten naar een atomaire batch (`writeBatch`)?** Advies: ja, nu meenemen. Het is klein, en zonder deze wijziging kan een mislukte verplaatsing de nummering beschadigen, ook als er een melding komt.
4. **Mag de bouwer in `svn10-clubkompas-test` tijdelijk strengere regels publiceren om "geweigerde toegang" te testen?** Advies: ja, alleen in test, kort, en direct terugzetten met `npm run regels:test`; noteer begin- en eindtijd in de testnotities. (Een testaccount zonder `leden`-document werkt niet als alternatief: dat komt niet langs het laden van de club.)

## Antwoorden van Paul (22 november 2026)
1. CK-023 en CK-025 in één oplevering, plus token `--fout` (licht #c0392b, donker #FF8A7A). **Akkoord.**
2. Statusregel in de sectie, onder de knoppen (geen toast). **Akkoord.**
3. ↑/↓ omzetten naar één atomaire `writeBatch`. **Akkoord.**
4. Strengere regels alleen in `svn10-clubkompas-test`, kort, en daarna terug met `npm run regels:test`. **Akkoord**, maar **Paul publiceert zelf** samen met de hoofdsessie tijdens het testen op tst; de bouwer publiceert geen regels.

## Bijstellingen na de gebruikersreis (22 november 2026)
Overgenomen uit `.claude/specs/CK-023-gebruikersreis.md`:
1. Time-out krijgt een eigen tekst: "… kijk of je wijziging in de lijst staat, voordat je het opnieuw probeert."
2. `requires-recent-login` krijgt een eigen tekst (extra beveiliging, geen verlopen sessie) met knop **Opnieuw inloggen**; ook bij een verlopen sessie.
3. Bij verwijderen en ↑/↓: "De lijst is niet gewijzigd." in plaats van "Je invoer staat er nog".
4. Offline ("niet verbonden met internet") en `unavailable` ("geen verbinding met de server") apart.
5. Knop tijdens opslaan via `aria-disabled="true"` + klikken negeren (focus blijft); acceptatiecriterium daarop afgestemd.
6. Geen succesmelding bij ↑/↓ (de verschuiving en focus zijn de bevestiging); wel een foutmelding.
7. Veldgerichte auth-fouten onder het veld (weak-password, email-already-in-use, invalid-email); de rest in de statusregel.
8. Vinkje `aria-hidden`; succestekst noemt het item; focus na toevoegen terug op de toevoegknop; "functie nog in gebruik" wordt een foutmelding (`role="alert"`).
9. Bouwer controleert in de code: wachtwoordminimum gelijk aan bestaande validatie; een controle op dubbele domeinnamen bestaat alleen als die er al is — anders niet toevoegen (geen nieuwe functionaliteit) en de regel uit de reis laten vallen.
