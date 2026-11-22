# Beveiligingsrapport: CK-023 + CK-025 Meldingen bij opslaan

Datum: 22 november 2026. Branch `test`, niet gecommitte wijzigingen in `src/main.js` en `src/style.css` (`git diff`).
Gelezen: `.claude/specs/CK-023-meldingen-opslaan.md`, `.claude/specs/CK-023-gebruikersreis.md`, `.claude/specs/CK-023-ontwerp.md`, `.claude/reports/CK-023-bouwverslag.md`, `firestore.rules` (ongewijzigd). Niet ingelogd en niets in de browser getest; alleen de code beoordeeld.

## Wat in orde is

- **XSS in meldingen: geen risico gevonden.** `toonOk` en `toonFout` gebruiken `replaceChildren(...)` met strings. Die worden tekstnodes, dus geen HTML. Namen van domeinen en functies (`item.naam`, `naam` uit `.cel-naam`.textContent), het e-mailadres in de bevestiging en de tekst "nog in gebruik" (`sectieFout.textContent`) worden nooit als HTML geïnterpreteerd. `meldingenHTML` zet ids met een document-id (`bm-fout-${id}`, `fm-fout-${id}`) via `esc()` in een attribuut tussen dubbele aanhalingstekens. `esc` escapet `"`, dus dat is veilig. `focusInLijst` gebruikt nu `CSS.escape(id)` in de selector. De oude code zette `id` rechtstreeks in `querySelector`, dus dit is een verbetering.
- **Geen ruwe foutcodes of stacktraces in beeld.** `foutTekst` geeft altijd een vaste tekst. Het zoeken gebeurt met `Object.hasOwn`, dus `__proto__`, `toString` en dergelijke vallen terug op de algemene tekst. Alle `Fout: ${e.code}`-teksten in Mijn account zijn weg. Codes en het foutobject gaan alleen naar `console.error`. In het inlogscherm staat nog `Fout: ${e.code}`, maar dat valt buiten scope.
- **Knop "Opnieuw inloggen".** Die wordt via `createElement` met `textContent` gemaakt en roept alleen `signOut(auth)` aan. Er is geen redirect-parameter en er is geen open redirect. `onAuthStateChanged` wist bij uitloggen `huidigClubId`, `huidigProfiel` en `huidigeRol` en tekent het inlogscherm opnieuw. Ingevulde wachtwoordvelden verdwijnen dus uit de DOM.
- **writeBatch voor de volgorde omzeilt geen rechten.** Elke `batch.update` wordt afzonderlijk aan de Security Rules getoetst (`isLid(clubId)` plus de naam- en typecontrole op het samengevoegde document). Het pad is altijd `clubs/{huidigClubId}/{subcollectie}/{id}`. Alleen het veld `volgorde` wordt geschreven. De batch is atomair: één geweigerd document laat de hele batch mislukken, dus de nummering blijft heel. Dat is een verbetering ten opzichte van `Promise.all`. Bij n ≤ 500 is er geen risico op de batchlimiet.
- **Logo blijft veilig.** `accept="image/*"` blijft staan. `resizeAfbeelding` codeert elk bestand opnieuw via canvas naar `image/png` van maximaal 300 px, dus ingebedde scripts (bijv. uit SVG) komen niet mee. `veiligLogo` en de regel `geldigLogo` (`data:image/...`) zijn ongewijzigd. Is een bestand onleesbaar, dan krijgt de gebruiker een nette melding.
- **Dubbelklik en gelijktijdige klikken.** Elke handler controleert eerst `aria-disabled`, lijsthandlers ook `aria-busy`. `zetBezig` zet ook Annuleren en de lijstknoppen op bezig. `metTijdslimiet` ruimt de timer altijd op.
- **Geen nieuwe dependencies** (`writeBatch` komt uit de bestaande `firebase/firestore`). `firestore.rules` en de `.env`-bestanden zijn niet aangeraakt. Er zijn geen nieuwe secrets of keys in de clientcode gekomen.
- **CSRF** is niet van toepassing: schrijfacties gaan via de Firebase SDK met een bearer-token, niet via cookies.

## Bevindingen

### 1. Late profielschrijfactie kan `huidigProfiel` van een andere club overschrijven
**Ernst:** 🟡 Hoog (kleine kans, maar raakt de scheiding tussen clubs)
**Type:** Autorisatie / multi-tenancy (data-isolatie in de client)
**Locatie:** `src/main.js`: logo-upload (`metOpslaan(logoKiezen, ...)`, `huidigProfiel = nieuwProfiel`), logo verwijderen (`huidigProfiel = rest`), profiel opslaan (`huidigProfiel = nieuwProfiel`). Zie ook bouwverslag afwijking 7.
**Probleem:** Na de time-out van 15 s worden de knoppen weer vrijgegeven, maar de schrijfactie loopt door. Komt die later toch binnen, dan zet de callback `huidigProfiel` op het profiel van de club waarvoor de actie gestart is. Logt de gebruiker in de tussentijd uit en weer in met een account van een andere club in hetzelfde tabblad, dan staat club A's profiel (naam, afkorting, logo) in het geheugen van club B. Dat kan via "Opnieuw inloggen" of via gewoon uitloggen. De volgende "Profiel opslaan" of logo-actie doet `{ ...huidigProfiel, ... }` en `setDoc` zonder merge. Daarmee worden gegevens van club A naar club B geschreven, waar de leden van club B ze zien. De Firestore-regels houden dit niet tegen: de gebruiker is lid van B. Het patroon bestond al vóór deze wijziging, maar de time-out (UI weer vrij terwijl de schrijfactie nog loopt) en de nieuwe knop "Opnieuw inloggen" maken het makkelijker bereikbaar. De kans is klein: de SDK verstuurt wachtende schrijfacties van een vorige gebruiker meestal niet meer, alleen een schrijfactie die al onderweg is kan nog bevestigd worden. Met de gedeelde Firebase-omgeving en testers die van account wisselen is dit toch relevant.
**Aanbeveling:** Leg de club en de gebruiker vast bij de start en werk de globale stand alleen bij als die nog gelijk zijn. Bijvoorbeeld:
```js
const clubId = huidigClubId, uid = huidigGebruiker?.uid
await slaaProfiel(nieuwProfiel)
if (huidigClubId === clubId && huidigGebruiker?.uid === uid) huidigProfiel = nieuwProfiel
```
Doe dit op alle drie de plekken. Laat `slaaProfiel` eventueel `clubId` als parameter krijgen in plaats van de globale te lezen.

### 2. Gelijktijdige logo- en profielactie: verloren update (zelfde club)
**Ernst:** 🟢 Laag
**Type:** Race condition / data-integriteit
**Locatie:** `src/main.js`, `renderClubBeheer`: profiel- en logohandlers (`{ ...(huidigProfiel || {}), ... }` + `slaaProfiel` = `setDoc` zonder merge)
**Probleem:** Clubprofiel en Clublogo zijn aparte meldblokken. Beide kunnen tegelijk bezig zijn, en zeker na een time-out. Elke actie neemt een kopie van `huidigProfiel` en overschrijft het hele document. Wie het laatst schrijft wint: een profielopslag kan een net geüpload logo wissen, of andersom. Er is geen escalatie van rechten, wel stil gegevensverlies.
**Aanbeveling:** Schrijf alleen de gewijzigde velden: `setDoc(ref, { naam, afkorting, seizoen }, { merge: true })` voor het profiel, en `{ logo }` met merge, of `updateDoc(ref, { logo: deleteField() })`, voor het logo. Dan kunnen de twee acties elkaar niet meer overschrijven.

### 3. Hernummering is lezen-dan-schrijven zonder transactie
**Ernst:** 🟢 Laag
**Type:** Race condition / data-integriteit
**Locatie:** `src/main.js`: `schrijfVolgorde` en de ↑/↓-handlers (domeinen en bestuursfuncties)
**Probleem:** `writeBatch` voorkomt een half geschreven batch, maar de lijst wordt eerst los gelezen. Doen twee tabbladen of bestuurders tegelijk ↑/↓, dan schrijft elke batch alleen de gewijzigde documenten op basis van zijn eigen lezing. De mix kan dubbele `volgorde`-waarden opleveren. Er is geen beveiligingsimpact.
**Aanbeveling:** Voor nu acceptabel. Wordt gelijktijdig beheer gebruikelijk, gebruik dan `runTransaction` (lezen en schrijven in één transactie), of laat de lijst bij het tonen altijd normaliseren op volgorde plus naam.

### 4. Dubbele schrijfactie na time-out bij toevoegen
**Ernst:** 🟢 Laag
**Type:** Integriteit (geen beveiligingslek)
**Locatie:** `src/main.js`: `metOpslaan` / `metTijdslimiet` in combinatie met `structuur-opslaan` en `functie-opslaan` (`addDoc`)
**Probleem:** Na 15 s komt de knop terug terwijl de eerste `addDoc` nog kan doorkomen. Klikt de gebruiker opnieuw, dan ontstaan twee domeinen of functies. De dubbele-naamcheck bij functies leest vóór het schrijven, dus die vangt dit niet. Volgens de spec is dit bewust zo, en de time-outtekst waarschuwt ervoor.
**Aanbeveling:** Optioneel: maak het document-id vooraf aan (`doc(collection(...))` + `setDoc`) en hergebruik hetzelfde id bij een nieuwe poging binnen hetzelfde open formulier. Een tweede klik overschrijft dan hetzelfde document in plaats van een duplicaat te maken.

### 5. Geen limiet op bestandsgrootte of -type vóór het inlezen van het logo
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie
**Locatie:** `src/main.js`: `resizeAfbeelding` (r. ~38) en de `logo-input`-handler
**Probleem:** Er wordt alleen gecontroleerd op `accept="image/*"`, en dat is in de bestandskiezer te omzeilen. Een heel groot bestand wordt volledig met `readAsDataURL` in het geheugen gelezen. Dat kan alleen het eigen tabblad laten vastlopen, en de uitvoer blijft door het opnieuw coderen veilig. Dit is niet veranderd ten opzichte van vóór CK-023. De vraag in de opdracht ("nog gevalideerd?") is dus: gelijk gebleven, niet verslechterd. De regel `geldigLogo` heeft ook geen groottelimiet. Daar geldt alleen de documentlimiet van Firestore (1 MiB), die nu netjes als "logo te groot" wordt gemeld.
**Aanbeveling:** Weiger vóór `resizeAfbeelding` bestanden met `!file.type.startsWith('image/')` of `file.size > 10 * 1024 * 1024`, met de tekst van `bestand-onleesbaar` of een eigen tekst. Overweeg in `firestore.rules` `data.logo.size() < 500000` (in een aparte wijziging, eerst test).

### 6. Volledig foutobject in de console
**Ernst:** 🟢 Laag
**Type:** Blootgestelde data (alleen lokaal)
**Locatie:** `src/main.js`: `metOpslaan`, `console.error('Opslaan mislukt:', e?.code, e)`
**Probleem:** Het hele `FirebaseError`-object wordt gelogd, inclusief stack en `customData`. Bij auth-fouten kan daar het e-mailadres van de gebruiker in staan. Het blijft in de eigen browser en is niet zichtbaar in de UI, maar in PRD wordt het wel opgepikt als er ooit console-logging naar een externe dienst komt.
**Aanbeveling:** Log in PRD alleen `e?.code` en `e?.name`, of filter `customData`. Bijvoorbeeld: `console.error('Opslaan mislukt:', e?.code ?? e?.name)` als `VERCEL_ENV === 'production'`.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 1 (nr. 1: late profielschrijfactie kan na uitloggen en inloggen in een andere club terechtkomen)
- 🟢 Lage aanbevelingen: 5 (nr. 2 verloren update profiel/logo, nr. 3 hernummering zonder transactie, nr. 4 duplicaat na time-out, nr. 5 geen grootte- of typecontrole vóór inlezen logo, nr. 6 foutobject in de console)

Specifiek gevraagde punten: XSS in meldingen: in orde. Ruwe foutcodes in de UI: in orde. "Opnieuw inloggen": in orde. writeBatch: geen rechtenomzeiling, wel atomair. Time-out: kan duplicaten en een late statusupdate geven (nr. 1 en 4). Logo-validatie: ongewijzigd, niet verslechterd (nr. 5). Race conditions: nr. 1 tot en met 3.

## Eindoordeel
🟡 Naar TST met aandachtspunten. Bevinding 1 oplossen vóór PRD (kleine wijziging van twee regels op drie plekken). De lage aanbevelingen kunnen naar de backlog.
