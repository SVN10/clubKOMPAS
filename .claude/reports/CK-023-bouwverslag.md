# Build-rapport: CK-023 + CK-025 Meldingen bij opslaan

Branch: `test` (niet gecommit, niet gepusht). Datum: 22 november 2026.
Bronnen: `.claude/specs/CK-023-meldingen-opslaan.md` (incl. antwoorden van Paul en bijstellingen), `.claude/specs/CK-023-gebruikersreis.md`, `.claude/specs/CK-023-ontwerp.md`.

## Wat is gebouwd
Eén meldingspatroon voor alle 14 schrijfacties uit de inventaris:

- **Helpers** (`src/main.js`, sectie "Meldingen bij opslaan", vlak boven `kompasIconSVG`): `foutTekst(e, soort)`, `wisMeldingen`, `toonOk`, `toonFout` (met knop "Opnieuw inloggen" bij `unauthenticated`, `auth/user-token-expired`, `auth/requires-recent-login`), `bindMeldblokken`, `metOpslaan(knop, actie, { soort, fout, weg, lijst, bezig, veldFouten })` → `'ok' | 'fout' | 'weg'`, `focusInLijst`, `meldingenHTML`. Interne hulpjes: `metTijdslimiet` (15 s, timer altijd opgeruimd), `zetBezig`, `wisVeldFouten`.
- **Statusregels** `.meldingen` / `.melding.melding-ok` (`role="status"`) / `.melding.melding-fout` (`role="alert"`), leeg getekend en zonder witruimte. Sectiemeldingen `structuur-ok/-fout`, `functie-ok/-fout`, `profiel-ok/-fout`, `logo-ok/-fout`; formulierfouten `structuur-form-fout`, `functie-form-fout`, `bm-fout-${id}`, `fm-fout-${id}`; Mijn account `geb-naam-ok`, `geb-email-ok`, `geb-ww-ok` + `geb-*-statusfout` (zie afwijkingen).
- **`data-meldblok`** op de Beheer-secties (Domeinen, Bestuursfuncties, Clubprofiel, Clublogo) en op drie `.meld-blok`-wrappers in Mijn account. Een klik op een (niet bezige) knop in het blok wist de meldingen, behalve knoppen in een melding.
- **Knopstatus**: `aria-disabled="true"` + "Bezig..." op de geklikte knop, andere knoppen in dezelfde `.form-rij` gedimd; lijstacties zetten `aria-busy` op de lijst en dimmen alle `button[data-actie]`. Elke klikhandler (ook Annuleren) begint met de `aria-disabled`-controle; lijsthandlers controleren ook `aria-busy`. `knop.disabled` komt in Mijn account niet meer voor.
- **Offline**: `navigator.onLine === false` → niet schrijven, direct melding. Hangende schrijfactie → na 15 s de time-outtekst (lijst- of paginavariant), geen nieuwe poging.
- **Vooraf lezen binnen de actie**: volgorde bepalen bij domein/functie toevoegen, dubbele-naamcheck bij functie toevoegen/bewerken (gooit `{ code: 'dubbele-naam' }` → veldfout onder Naam), actuele lijst bij ↑/↓.
- **↑/↓ atomair**: `schrijfVolgorde(subcollectie, items)` met `writeBatch`; vervangt beide `Promise.all`-regels. Geen succesmelding bij ↑/↓.
- **Focus**: toevoegen/verwijderen gelukt → toevoegknop; bewerken gelukt → Bewerken van dat item; ↑/↓ en mislukt verwijderen → `focusInLijst` (zelfde knop → Bewerken → toevoegknop); `not-found` → toevoegknop; serverveldfout → het veld.
- **CK-025**: `renderClubBeheer(gebruiker, { succes: 'profiel' | 'logo' | 'logo-weg' })`: eerst focus op de knop, na 100 ms de bevestiging. `bindBeheerTabs` roept nog steeds `renderClubBeheer(gebruiker)` aan.
- **Logo**: `<label class="btn">` vervangen door `<button type="button" id="logo-kiezen">` die `logo-input.click()` doet; `resizeAfbeelding`-fout → `bestand-onleesbaar`; `invalid-argument` → "logo te groot"; `logoInput.value = ''` in `finally`.
- **Mijn account**: veldfouten via `veldFouten` (`email-already-in-use`, `invalid-email`, `operation-not-allowed` → Nieuw e-mailadres; `wrong-password`, `invalid-credential` → wachtwoordveld van dat blok; `weak-password` → Nieuw wachtwoord). `aria-describedby` op `functie-naam`, `fn-${id}`, `geb-email`, `geb-email-ww`, `geb-huidig-ww`, `geb-nieuw-ww`. Velden blijven bij fout gevuld en worden bij succes leeggemaakt (zoals voorheen).
- **"Nog in gebruik"** (bestuursfunctie verwijderen): bestaande tekst, nu in `functie-fout` (`role="alert"`). `melding()` en `functie-melding` zijn verwijderd.
- **CSS**: token `--fout` op drie plekken (`:root` `#c0392b`; donkere media query en `:root[data-theme="dark"]` `#FF8A7A`); `#c0392b` vervangen in `.form-input.fout`, `.form-fout`, `.btn-kaart-actie.gevaar:hover`, `.btn.gevaar:hover`; nieuwe regels voor `.meldingen`, `.melding*`, `[aria-disabled]`-knoppen en `.meld-blok` uit het ontwerp; `.profiel-succes` verwijderd.

## Gewijzigde bestanden
- `src/main.js`: import `writeBatch`; `schrijfVolgorde`; meldingshelpers; Domeinen, Bestuursfuncties, Club en Mijn account (markup en handlers).
- `src/style.css`: token `--fout`, vier vervangingen, meldingen- en knopstatusstijlen, `.profiel-succes` weg.
- `CHANGELOG.md`: onder "Ongepubliceerd" de secties Toegevoegd en Opgelost.

Niet aangeraakt: `firestore.rules`, `.env.*.local`, het inlogscherm, de foutkaart en de laadkaart.

## Wat is getest
- `node --check` op `src/main.js` (als .mjs-kopie): geslaagd.
- `npm run build`: geslaagd (25 modules, geen waarschuwingen).
- Scratch-test (`test-meldingen.mjs` in de scratchpad van deze sessie, niet in de repo): de helpers worden uit `src/main.js` geknipt en uitgevoerd tegen een minimale nep-DOM, met de tijdslimiet op 60 ms. Alles geslaagd:
  - `foutTekst`: 27 codes × 4 soorten geven elk een tekst zonder ruwe code (ook `undefined`, `toString`, `__proto__` en onbekende `auth/…`); de juiste staart per soort (I / L / geen); time-out lijst- en paginavariant; `invalid-argument` alleen bij logo; de bestaande teksten voor `dubbele-naam` en `wrong-password`.
  - `metOpslaan`: succes (tijdens het opslaan "Bezig..." en `aria-disabled` op Opslaan en Annuleren, oude melding gewist, na afloop hersteld); `permission-denied` → `'fout'` + `console.error` met code; `not-found` → `'weg'` in het weg-element; veldfout (tekst, `.fout`, `aria-invalid`, focus) en het wissen daarvan bij de volgende poging; offline → actie niet aangeroepen; hangende belofte → time-out en knop hersteld; `auth/requires-recent-login` → knop "Opnieuw inloggen" die `signOut` aanroept; lijstactie met `aria-busy`, gedimde lijstknoppen en `bezig: null` (pijl blijft staan); synchrone throw; knop verdwenen tijdens het opslaan.
  - `toonOk`: vinkje `aria-hidden`, naam als tekstnode (geen HTML-injectie).
  - `meldingenHTML`: geen witruimte in de live regions.
- `grep`: `#c0392b` staat alleen nog in `:root` (`src/style.css`) en nergens in `src/main.js`. Er zijn geen `profiel-succes`, `functie-melding`, `Promise.all`-hernummering of "Opslaan mislukt, probeer opnieuw." meer over. `Fout: ${e.code}` staat alleen nog in het inlogscherm (buiten scope).
- Niet getest in de browser: de devserver op localhost:5173 reageerde op het moment van testen niet, en zonder inloggen zijn de beheerschermen niet bereikbaar. Ik heb niet ingelogd.

## Afwijkingen van het ontwerp
1. **Ids van de foutregels in Mijn account**: het ontwerp noemt `geb-naam-fout` en `geb-email-fout`, maar die ids zijn al in gebruik voor de veldfouten onder Naam en Nieuw e-mailadres (en `geb-email-fout` moet volgens het ontwerp zelf de veldfout blijven, voor `aria-describedby`). De statusregels heten daarom `geb-naam-statusfout`, `geb-email-statusfout` en, voor eenduidigheid, `geb-ww-statusfout`. De succesregels heten zoals ontworpen (`geb-*-ok`).
2. **Extra kleine helpers**: `meldingenHTML(okId, foutId)` (maakt de markup uit §1a), en `metTijdslimiet`, `zetBezig` en `wisVeldFouten` als onderdelen van `metOpslaan`. Het gedrag is ongewijzigd.
3. **`isConnected`-controle** na `metOpslaan` in alle handlers: als de gebruiker tijdens het opslaan naar een ander scherm gaat, wordt er niets meer bijgewerkt (voorheen een fout in de console).
4. **↑/↓ ververst de lijst altijd**, ook als er niets te verplaatsen viel (item intussen weg). Dat doet geen kwaad en toont de echte stand.
5. **`resetForm` bij Bestuursfuncties** haalt ook `.fout` en `aria-invalid` van het naamveld, zodat een eerdere serverveldfout niet blijft hangen na Annuleren.
6. **Dubbele domeinnaam**: geen controle toegevoegd (bijstelling 9, die controle bestaat niet). Voor functies blijft de bestaande tekst "Deze bestuursfunctie bestaat al", niet de reistekst "Er bestaat al een … met deze naam." (het ontwerp schrijft de bestaande tekst voor).
7. **Logo of profiel bij time-out**: `huidigProfiel` wordt bijgewerkt op het moment dat de schrijfactie alsnog lukt (ook na de melding). *Aangescherpt in de herstelronde: alleen als club en gebruiker nog dezelfde zijn.*
8. **Kleine CSS-observatie** (*opgelost in de herstelronde*): `.btn.gevaar:hover` kleurt de tekst ook op een bezige Verwijderen-knop rood; de ontwerp-CSS zet bij `[aria-disabled]` alleen de rand terug. Ik heb het ontwerp exact gevolgd.

Gecontroleerd: het wachtwoordminimum in de validatie (8) is gelijk aan de foutteksten (8).

## Handmatig te controleren (Paul, op tst / lokaal tegen het testproject)
Voorbereiding: inloggen met het testaccount; DevTools open (Console en Network).

1. **Bevestiging (CK-025)**: profiel opslaan → "✓ Profiel opgeslagen." blijft staan, focus op Opslaan, nieuwe naam in de titelbalk. Logo uploaden → "✓ Logo opgeslagen.", favicon verandert. Logo verwijderen → "✓ Logo verwijderd.", kompas-favicon terug. Naam, e-mail en wachtwoord in Mijn account → de drie "✓ …"-teksten. Klik daarna op een andere knop in hetzelfde blok: de melding verdwijnt; typen wist niets.
2. **Domeinen/functies**: toevoegen → "✓ Domein [naam] toegevoegd." en focus op "+ Toevoegen"; bewerken → "opgeslagen." en focus op Bewerken; verwijderen → "verwijderd."; ↑/↓ → geen melding, focus blijft op het item. Functie in gebruik verwijderen → foutmelding direct voorgelezen.
3. **Dubbelklik**: snel twee of drie keer op Opslaan bij domein en bij functie toevoegen → precies één nieuw item; tijdens het opslaan "Bezig...", Annuleren doet niets, focus blijft op de knop.
4. **Offline** (DevTools → Network → Offline): domein toevoegen, domein bewerken, functie toevoegen, profiel opslaan en logo uploaden → binnen 1 s "Je bent niet verbonden met internet…"; formulier en invoer blijven staan. Weer online → dezelfde klik lukt zonder opnieuw invullen.
5. **Time-out** (optioneel): Network-throttling op een zeer trage eigen instelling, of de verbinding verbreken zonder dat de browser offline meldt → na 15 s "Opslaan duurt te lang…". Controleer daarna of de wijziging alsnog in de lijst verschijnt.
6. **Geweigerde toegang (tijdelijk strengere regels, alleen `svn10-clubkompas-test`; Paul publiceert zelf met de hoofdsessie)**:
   - Noteer begintijd. Publiceer in het testproject een tijdelijke variant met `allow write: if false` op `structuurelementen`, `bestuursfuncties` en `instellingen` (lezen blijft toegestaan). Pas `firestore.rules` in de repo **niet** aan; gebruik een tijdelijke kopie of de console van het testproject.
   - Test: domein en functie toevoegen, bewerken, verwijderen, ↑/↓, profiel opslaan, logo uploaden en verwijderen → telkens "Je hebt geen toestemming om dit op te slaan…" (bij verwijderen en ↑/↓ zonder de zin over invoer), de lijst toont daarna de ongewijzigde stand, de nummering blijft 1 t/m n zonder gaten of dubbelen (writeBatch), focus terug op dezelfde knop.
   - Zet daarna de regels terug met `npm run regels:test` en noteer de eindtijd. Controleer dat opslaan weer lukt.
7. **Not-found**: open een domein in Bewerken in tabblad A, verwijder het in tabblad B, sla op in A → "Dit item bestaat niet meer…" in de sectiemelding, lijst ververst, focus op "+ Toevoegen".
8. **Mijn account, fouten**: verkeerd wachtwoord bij e-mail of wachtwoord wijzigen → "Wachtwoord klopt niet." onder het juiste veld, focus daarheen. Een al gebruikt e-mailadres → tekst onder Nieuw e-mailadres. Na lang ingelogd zijn mogelijk `requires-recent-login` → knop "Opnieuw inloggen" logt uit.
9. **Logo**: een niet-afbeelding (bijv. een .txt hernoemd naar .png) → "Dit bestand kan niet als afbeelding worden gelezen…"; meteen hetzelfde bestand opnieuw kiezen geeft dezelfde melding (input wordt geleegd). De logoknop is met Tab bereikbaar en opent met Enter of Spatie de bestandskiezer.
10. **Contrast en donkere modus**: foutmeldingen en veldfouten in licht en donker (systeeminstelling én `document.documentElement.dataset.theme = 'dark'`) → kleur `#FF8A7A` in donker, minimaal 4,5:1 in de DevTools-contrastcheck.
11. **Schermlezer** (VoiceOver): succes wordt beleefd voorgelezen zonder "vinkje", fout direct; "Bezig..." wordt bij focus voorgelezen.
12. **Regressie**: veldvalidatie (verplicht, minimaal n tekens, hashtag), `confirm()` voor verwijderen, filter-tabs, footer-naam na naamwijziging; inlogscherm en foutkaart ongewijzigd.

## Herstelronde (22 november 2026)
Verwerkt: bevindingen uit `.claude/reports/CK-023-{test,huisstijl,beveiliging,compliance,toegankelijkheid}.md`, volgens de 12 punten van de coördinator. Branch `test`, niet gecommit, niet ingelogd, geen regels gepubliceerd. `firestore.rules` en `.env.*.local` zijn ongewijzigd.

### Wat is aangepast
| # | Punt | Oplossing |
|---|---|---|
| 1 | Hoog (beveiliging 1): late profielopslag | Nieuwe helper `profielSessie()` legt bij de klik `huidigClubId` en de uid vast en schrijft naar die club. `huidigProfiel` wordt alleen bijgewerkt als bij binnenkomst club én gebruiker nog gelijk zijn (ook na een time-out). Favicon en opnieuw tekenen gebeuren alleen bij `sessie.geldig()`. Geldt voor profiel opslaan, logo uploaden en logo verwijderen. |
| 2 | Laag (beveiliging 2): profiel en logo overschrijven elkaar | `slaaProfiel(clubId, velden)` doet `setDoc(..., { merge: true })`. Het profiel schrijft alleen `{ naam, afkorting, seizoen }`, het logo `{ logo }`, en verwijderen schrijft `{ logo: deleteField() }`. Dit kan zonder regelwijziging: bij `create`/`update` toetst de regel `request.resource.data`. Dat is het samengevoegde document, dus `geldigLogo` blijft gelden (logo ontbreekt of is een `data:image/`-string) en `docId == 'profiel'` blijft gelden. |
| 3 | Laag (beveiliging 5): logo controleren vóór het inlezen | `leesLogoBestand(file)` weigert eerst als `file.type` niet met `image/` begint (`bestand-onleesbaar`) of als het bestand groter is dan 10 MB (`bestand-te-groot`: "Dit bestand is te groot (maximaal 10 MB)."). Pas daarna wordt het bestand ingelezen via `resizeAfbeelding`. |
| 4 | Laag (beveiliging 6, compliance 1): console | `console.error('Opslaan mislukt:', e?.code, e?.name)`. Het volledige object wordt alleen gelogd als `import.meta.env.DEV`. |
| 5 | Toegankelijkheid 1: focusterugval | `zichtbareTerugval(toevoegKnop, form)` geeft de toevoegknop terug, of het eerste veld van het open formulier als die knop verborgen is (bij Domeinen de aangevinkte soort-radio, bij Bestuursfuncties het naamveld). Wordt gebruikt op alle plekken die eerst `toevoegKnop.focus()` deden of de knop als terugval aan `focusInLijst` gaven. |
| 6 | Toegankelijkheid 2: ↑/↓ voor schermlezers | `<div class="sr-only" id="structuur-volgorde" role="status">` en `functie-volgorde` staan vanaf het tekenen in de sectie (`.sr-only` bestond al). Na een geslaagde verplaatsing: eerst focus, dan bijvoorbeeld "Domein Jeugd staat nu op plaats 2 van 15." of "Bestuursfunctie … staat nu op plaats …". Het element wordt vóór elke poging leeggemaakt. Visueel verandert er niets. |
| 7 | Toegankelijkheid 3: veldfouten | Nieuwe helpers `zetVeldFout(inputId, foutId, tekst, focus = true)` (tekst, `.fout`, `aria-invalid`, focus, en `aria-describedby` als dat nog ontbreekt) en `wisVeldFout(inputId, foutId)`. `valideerVelden([[inputId, foutId, tekst], ...])` wist eerst alle velden, zet daarna de fouten en geeft de focus aan de eerste fout. `minFout(waarde, min, leeg)` geeft de bestaande teksten. Wordt gebruikt bij de clientvalidatie van domein toevoegen en bewerken, functie toevoegen en bewerken, profiel, naam, e-mail en wachtwoord, en voor de serverveldfouten in `metOpslaan`. |
| 8 | Toegankelijkheid 5: focusring | `.btn:focus-visible, .btn-kaart-actie:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; }`. Een bezige knop met focus krijgt `opacity: 1`, zodat de ring niet meedimt. Geen botsing: `.form-input`, `.tussen-link`, `.footer-account` en het zijmenu hebben hun eigen regels; voor `.btn` bestond nog geen focusstijl. |
| 9 | Huisstijl 1 | `.btn.gevaar[aria-disabled="true"]:hover { color: var(--petrol); }` (petrol is de tekstkleur van `.btn` in rust). |
| 10 | Huisstijl 2: lege `.meldingen` | De `gap` op `.meldingen` is weg. Tussenruimte komt er alleen tussen twee gevulde meldingen (`.melding:not(:empty) + .melding:not(:empty) { margin-top: 8px }`). Een lege wrapper is dus 0px hoog en de negatieve marge heft de flex-gap van de ouder precies op. De live regions blijven zichtbaar in de toegankelijkheidsboom. De comment over `<label class="btn">` is bijgewerkt. Extra (huisstijlsuggestie 3): de inline `margin-top:12px` op de logo-`.form-rij` is vervangen door `.logo-upload-wrap .form-rij { margin-top: 12px; }`. |
| 11 | Compliance 4: supportadres | `toonFout` bouwt bij teksten die eindigen op "contact op met SVN10." (toestemming geweigerd en onbekende fout) een `<a class="tussen-link">` met `createElement`. `href` komt uit de bestaande `supportMailto(huidigGebruiker?.email, 'Opslaan lukt niet in clubKOMPAS')` en de tekst is `SUPPORT_EMAIL` als `textContent`. Resultaat: "…neem contact op met SVN10: support@svn10.nl.". In een foutmelding neemt de link de foutkleur over (`.melding .tussen-link { color: inherit; }`). Er is geen `innerHTML` gebruikt; `supportLinkHTML` levert HTML, daarom is gekozen voor `supportMailto` en DOM-opbouw. |
| 12 | Compliance 3: time-out bij e-mail en wachtwoord | Nieuwe soorten `account-email` en `account-wachtwoord` (verder gelijk aan `formulier`). Wachtwoord: "Het opslaan duurt te lang. Je wachtwoord is misschien toch gewijzigd: log uit en probeer in te loggen met je nieuwe wachtwoord." E-mail: "Het opslaan duurt te lang. Misschien is de bevestigingsmail toch verstuurd: kijk in je mailbox voordat je het opnieuw probeert." |

### Gedragswijzigingen die de tester moet weten
- Clientvalidatie toont nu **alle** fouten van een formulier tegelijk en zet de focus op het eerste foute veld. Eerst stopte e-mail en wachtwoord bij de eerste fout en werd de focus niet verplaatst. De teksten zelf zijn gelijk gebleven.
- Inputs met een veldfout krijgen nu ook bij clientvalidatie `.fout` en `aria-invalid`, en zo nodig `aria-describedby` (dat laatste lost ook toegankelijkheidssuggestie 4 op voor `structuur-naam`, `profiel-*` en `geb-naam`, op het moment dat er een fout is).
- Een logo dat geen afbeelding is of groter dan 10 MB, wordt niet meer ingelezen.
- Alle `.btn` en `.btn-kaart-actie` hebben een oranje focusring (alleen bij toetsenbordfocus).

### Getest
- `node --check`: geslaagd. `npm run build`: geslaagd.
- De devserver op :5173 draait nu en serveert `src/main.js` en `src/style.css` zonder transformatiefout (HTTP 200). Niet ingelogd, dus geen schermtest.
- Testscript uitgebreid (`test-meldingen.mjs` in de scratchpad van deze sessie): alles geslaagd, inclusief:
  - **Punt 1**: een late resolve na een clubwissel (club A → B, andere uid) laat `huidigProfiel` op club B staan en `geldig()` geeft `false`. Hetzelfde geldt bij zelfde club met andere gebruiker, en na uitloggen. In de geldige sessie wordt alleen het gewijzigde veld samengevoegd. De schrijfactie gaat altijd naar het pad van de startclub.
  - **Punt 2**: `setDoc` krijgt alleen de gewijzigde velden met `{ merge: true }`; logo verwijderen schrijft `deleteField()` en haalt `logo` uit `huidigProfiel`.
  - **Punt 3**: `text/plain`, een leeg type, een ontbrekend type, 10 MB + 1 byte en een ontbrekende grootte worden geweigerd zonder dat de leesfunctie wordt aangeroepen (teller blijft 0). Precies 10 MB wordt geaccepteerd; een leesfout wordt `bestand-onleesbaar`.
  - **Punt 4**: buiten DEV logt de console precies `['Opslaan mislukt:', code, name]` (geen object, dus geen `customData`); in DEV ook het volledige object.
  - **Punt 5, 7, 11, 12**: terugval naar de aangevinkte radio of het naamveld als de knop verborgen is; `valideerVelden` geeft de focus aan de eerste fout en wist alles bij geldige invoer; de supportlink is een element met `mailto:`-href, en er komt geen link bij een verbindingsfout; de time-outteksten voor account.
- `#c0392b` staat alleen nog in `:root`.

### Niet gedaan / bewust gelaten
- Beveiliging 3 (hernummering zonder transactie) en 4 (duplicaat na time-out bij toevoegen): laag, niet in de opdracht, staan nog open voor de backlog.
- Compliance 2 en 5 (instellingen in de Firebase-console: bescherming tegen e-mailenumeratie, sjabloon voor e-mailwijziging): geen code, voor Paul.
- Toegankelijkheid 6 (een kleurloos ✕-kenmerk bij fouten): optioneel, niet gedaan.
- `.claude/backlog.md` staat als gewijzigd in git status, maar dat is niet door de bouwer gedaan.

### Extra handmatig te testen op tst
- Naast de eerdere lijst:
  - Toevoegformulier open laten staan, dan bij een ander item Verwijderen of ↑/↓ → de focus komt op het eerste veld van het formulier, niet op `<body>`.
  - ↑/↓ met VoiceOver → "… staat nu op plaats n van m." wordt voorgelezen.
  - Tab door de knoppen → oranje ring, ook tijdens "Bezig...".
  - Lege statusregels → geen extra witruimte (DevTools: hoogte van `.meldingen` is 0).
  - Profiel opslaan terwijl een logo-upload loopt → beide blijven bewaard.
  - Een .txt of een bestand > 10 MB als logo kiezen → direct een melding.
  - Een fout met toestemming geweigerd → het supportadres is klikbaar.
- Test voor punt 1, optioneel en alleen in test:
  1. Zet in DevTools de throttling hoog en sla het profiel op.
  2. Log tijdens "Bezig..." uit en log in met een account van een andere testclub.
  3. Controleer dat titel en profiel van de tweede club blijven staan.

## Status
Klaar voor een nieuwe kwaliteitscontrole. Niet gecommit. Een browsertest (ingelogd, op tst) is nog nodig.
