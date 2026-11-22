# Meldingen bij opslaan — technische documentatie

Voor ontwikkelaars die een schrijfactie toevoegen of aanpassen. Alles staat in `src/main.js` (sectie "Meldingen bij opslaan") en `src/style.css` (sectie "Meldingen bij opslaan"). Afspraak voor de gebruiker: na elke schrijfactie zie je direct onder de knoppen of het gelukt is, en zo niet, wat je kunt doen. Geen pop-up, geen toast.

## Het patroon in het kort

1. Het scherm tekent per blok een **meldblok** (`data-meldblok`) met daarin `meldingenHTML(okId, foutId)`: een `role="status"`-regel (succes) en een `role="alert"`-regel (fout). Ze staan er vanaf het tekenen, leeg en zonder witruimte.
2. De klik-handler valideert eerst op de client (`valideerVelden`), roept dan `metOpslaan(knop, actie, opties)` aan en krijgt `'ok' | 'fout' | 'weg'` terug.
3. `metOpslaan` toont **alleen fouten**. Succes toont de aanroeper zelf met `toonOk`, ná het verversen van de lijst en het zetten van de focus.

### Codevoorbeeld: een nieuwe feature

```js
// HTML: meldblok om de sectie, meldingen onder de knoppen
`<div class="sectie" data-meldblok>
   ...
   <div class="form-rij"><button class="btn primary" id="x-opslaan">Opslaan</button></div>
   ${meldingenHTML('x-ok', 'x-fout')}
 </div>`

// Handler
const knop = document.getElementById('x-opslaan')
knop.addEventListener('click', async () => {
  if (knop.getAttribute('aria-disabled') === 'true') return   // tweede klik doet niets

  const naam = document.getElementById('x-naam').value.trim()
  if (!valideerVelden([['x-naam', 'x-naam-fout', minFout(naam, 2)]])) return

  const uitkomst = await metOpslaan(knop, () => schrijfIets({ naam }), {
    soort: 'formulier-lijst',                       // bepaalt tekst en staart, zie "Foutsoorten"
    fout: document.getElementById('x-fout'),
    veldFouten: { 'dubbele-naam': ['x-naam-fout', 'x-naam'] },   // servercode -> onder dit veld
  })
  if (uitkomst !== 'ok' || !knop.isConnected) return   // scherm kan intussen opnieuw getekend zijn

  await laadEnRender().catch(e => console.error(e))
  document.getElementById('x-nieuw')?.focus()          // focus eerst...
  toonOk(document.getElementById('x-ok'), `Ding ${naam} opgeslagen.`)   // ...dan de melding
})
```

Let op:
- De `actie` moet de belofte **teruggeven** (of `await`en). Het vooraf lezen (dubbele-naamcheck, hoogste volgorde) hoort **binnen** de actie, anders valt een leesfout buiten de foutafhandeling.
- Gooi je zelf een fout, gooi dan `{ code: '...' }` en voeg de tekst toe aan `FOUTTEKSTEN` (zie `dubbele-naam`, `bestand-te-groot`).
- Wordt het scherm bij succes opnieuw getekend (zoals clubprofiel), geef dan een sleutel door en toon de melding ná het tekenen (`CLUB_SUCCES`, `renderClubBeheer(gebruiker, { succes })`). Een melding in oude DOM verdwijnt anders meteen.

## Helpers

| Helper | Doet | Let op |
|---|---|---|
| `metOpslaan(knop, actie, opties)` | Wist de meldingen van het blok, zet de knop op bezig, controleert `navigator.onLine`, voert `actie` uit met tijdslimiet (15 s), vangt fouten, logt en toont ze, herstelt de knop (`finally`). | Opties: `soort`, `fout` (element), `weg` (element voor "bestaat niet meer", standaard `fout`), `lijst` (element, blokkeert alle `data-actie`-knoppen en zet `aria-busy`), `bezig` (knoptekst, `null` = niet wijzigen, standaard "Bezig..."), `veldFouten` (`{ code: [foutId, inputId, tekst?] }`). |
| `zetBezig(knop, lijst, bezig)` | Zet `aria-disabled="true"` op de knop, de knoppen in dezelfde `.form-rij` en de actieknoppen van de lijst. Geeft een herstelfunctie terug. | Gebruikt bewust **geen** `disabled`: de focus blijft op de knop en schermlezers blijven hem melden. De handler moet zelf `aria-disabled` controleren. |
| `metTijdslimiet(belofte, ms)` | Race tegen een timer; gooit `{ code: 'tijd-op' }`. | Annuleert het schrijven niet: Firestore kan het later alsnog afronden. Zie beperkingen. |
| `foutTekst(e, soort)` | Zet een fout om naar een Nederlandse zin. Onbekend wordt de algemene tekst met verwijzing naar SVN10. | Nooit ruwe codes in beeld. |
| `toonFout(el, e, soort)` | Zet `foutTekst` in `el`. Bij een tekst die op "contact op met SVN10." eindigt komt het supportadres als `mailto:`-link; bij `INLOG_CODES` komt er een knop "Opnieuw inloggen" (`signOut`). | Bouwt met `createElement`/`textContent`, geen `innerHTML`. |
| `toonOk(el, tekst)` | Zet "✓ " (`aria-hidden`) plus tekst. | `tekst` mag gebruikersinvoer bevatten: het gaat via een tekstknoop. |
| `wisMeldingen(blok)` | Leegt alle `.melding` in het blok. | |
| `bindMeldblokken()` | Eén capture-listener per `[data-meldblok]`: een klik op een knop wist de meldingen van dat blok. Negeert bezige knoppen, knoppen binnen een melding en knoppen van een geneste meldblok. | Elke render-functie roept hem aan na het tekenen; hij is idempotent (`data-meld-gebonden`). |
| `meldingenHTML(okId, foutId)` | HTML voor de twee live regions. `okId` mag `null` zijn. | |
| `valideerVelden(regels)` | `[inputId, foutId, tekst]` per veld; wist alles, zet de fouten en geeft de focus aan de eerste. Geeft `true` als alles geldig is. | Toont alle fouten tegelijk. Lege tekst = geldig. |
| `zetVeldFout` / `wisVeldFout` | Tekst onder het veld, klasse `fout`, `aria-invalid`, `aria-describedby` (als nog leeg) en optioneel focus; wissen draait dit terug. | |
| `minFout(waarde, min, leeg)` | Standaardteksten "Verplicht veld" / "Minimaal n tekens". | |
| `zichtbareTerugval(toevoegKnop, form)` | Geeft de toevoegknop, of het eerste veld van het open formulier als die knop verborgen is. | Gebruik als terugval voor focus na verwijderen of verplaatsen. Nooit de focus op `<body>` laten vallen. |
| `focusInLijst(lijstEl, actie, id, terugval)` | Focus na verversen: dezelfde knop, anders "Bewerken" van dat item, anders de terugval. | |
| `schrijfVolgorde(subcollectie, items)` | Hernummert 1 t/m n in één `writeBatch`. | Alles of niets. Niet atomair tegenover een tweede tabblad, zie vervolgpunten. |
| `slaaProfiel(clubId, velden)` | `setDoc(..., { merge: true })` met alleen de meegegeven velden. | Profiel schrijft `{ naam, afkorting, seizoen }`, logo `{ logo }`, verwijderen `{ logo: deleteField() }`. De Firestore-regel toetst het samengevoegde document, dus `geldigLogo` blijft gelden. |
| `profielSessie()` | Legt bij de klik club en gebruiker vast. `schrijf(velden, bijwerken)` schrijft naar die club en werkt `huidigProfiel` alleen bij als `geldig()` nog klopt. | Gebruik `sessie.geldig()` ook voor alles na het schrijven (favicon, opnieuw tekenen). Voorkomt dat een late opslag na een time-out en opnieuw inloggen een andere club beschrijft of bijwerkt. |
| `leesLogoBestand(file, lees)` | Weigert vóór het inlezen als het geen `image/*` is (`bestand-onleesbaar`) of groter dan 10 MB (`bestand-te-groot`). Leest daarna via `resizeAfbeelding`. | `lees` is injecteerbaar voor tests. |

## Foutsoorten

`soort` kiest de staart en de time-outtekst:

| Soort | Gebruik | Staart bij verbindingsfout |
|---|---|---|
| `formulier-lijst` | Toevoegen/bewerken in een lijst | "Wat je hebt ingevuld, staat er nog." |
| `lijstactie` | Verwijderen, omhoog, omlaag | "De lijst is niet gewijzigd." |
| `formulier` | Losstaand formulier (clubprofiel, naam) | "Wat je hebt ingevuld, staat er nog." |
| `account-email` | E-mailadres wijzigen | als `formulier`; time-out: kijk eerst in je mailbox |
| `account-wachtwoord` | Wachtwoord wijzigen | als `formulier`; time-out: je wachtwoord is misschien al gewijzigd |
| `logo` | Logo kiezen of verwijderen | geen; `invalid-argument` = "logo te groot" |

Bij een time-out in een lijstsoort wordt verwezen naar de lijst ("kijk of je wijziging in de lijst staat"), bij de overige naar herladen. Zo probeert niemand blind opnieuw en maakt een dubbel item.

### Codes

| Code | Bron | Gedrag |
|---|---|---|
| `offline` | `navigator.onLine === false` | Er wordt niet geschreven. |
| `unavailable`, `deadline-exceeded`, `auth/network-request-failed` (`VERBINDING_CODES`) | Firebase | "Geen verbinding met de server", plus staart. |
| `tijd-op` | `metTijdslimiet`, 15 s | Soortafhankelijke tekst, geen automatische nieuwe poging. |
| `permission-denied` | Firestore | "Geen toestemming", met supportlink. |
| `unauthenticated`, `auth/user-token-expired` (`INLOG_CODES`) | Firebase | "Automatisch uitgelogd" plus knop "Opnieuw inloggen". |
| `auth/requires-recent-login` (`INLOG_CODES`) | Auth | Idem, andere tekst. |
| `not-found`, `failed-precondition` (`WEG_CODES`) | Firestore | Uitkomst `'weg'`: item bestaat niet meer. Gebruik `weg` voor de melding en ververs de lijst. |
| `resource-exhausted`, `auth/too-many-requests` | Firebase | "Druk / te veel pogingen, wacht even." |
| `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, `auth/wrong-password`, `auth/invalid-credential` | Auth | Horen bij een veld: koppel ze via `veldFouten`. |
| `dubbele-naam` | Eigen, bij bestuursfuncties | Onder het naamveld. |
| `bestand-onleesbaar`, `bestand-te-groot` | Eigen, `leesLogoBestand` | Onder de logoknop. |
| (overig) | | Algemene tekst met supportlink. |

Console: buiten DEV alleen `e.code` en `e.name`, in DEV het hele object (een foutobject kan `customData` met persoonsgegevens bevatten).

## Focus- en toegankelijkheidsafspraken

- **Statusregels**: succes in `role="status"`, fout in `role="alert"`. Ze staan er vanaf het tekenen; een regel die later wordt ingevoegd wordt door schermlezers vaak niet voorgelezen. Daarom nooit een melding-element on-the-fly aanmaken.
- **Volgorde bij succes**: eerst `focus()`, dan `toonOk`. Anders onderbreekt de focusverplaatsing de melding.
- **Focus verdwijnt nooit naar `<body>`**: na verwijderen of verversen focus je dezelfde knop, anders Bewerken, anders `zichtbareTerugval`. Bij uitkomst `'weg'` direct de terugval.
- **Bezig**: `aria-disabled` in plaats van `disabled`, zodat de focus blijft. De CSS dimt de knop (`opacity: .6`, cursor `progress`), maar een bezige knop met focus houdt `opacity: 1` zodat de oranje ring zichtbaar blijft. Hover verandert niets (ook niet rood bij `.gevaar`).
- **Veldfouten**: tekst onder het veld plus `.fout` (rode rand) plus `aria-invalid` plus `aria-describedby`. Kleur is nooit het enige kenmerk: de tekst staat erbij.
- **↑/↓**: een verborgen `role="status"` (`.sr-only`, `structuur-volgorde` en `functie-volgorde`) meldt de nieuwe plaats ("Domein X staat nu op plaats 2 van 15."). Leeg het element vóór elke poging, vul het ná de focus.
- **Kleur**: foutkleur is altijd `var(--fout)` (licht `#c0392b`, donker `#FF8A7A`). Nieuwe hardgecodeerde rode kleuren vermijden. Succes is `var(--petrol)`, vet, met vinkje.
- **Focusring**: `.btn` en `.btn-kaart-actie` hebben `:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px }`. Eigen focusstijlen bestaan voor `.form-input`, `.tussen-link`, `.footer-account` en het zijmenu.
- **Lege meldingen nemen geen ruimte in.** `.meldingen` heeft geen `gap`; ruimte tussen twee gevulde meldingen komt van `.melding:not(:empty) + .melding:not(:empty)`. De negatieve marge `.meldingen:not(:has(.melding:not(:empty)))` heft de flex-gap van de ouder op. Pas de ouder-gap aan via `--meld-gap` op de wrapper (zie `.pijler-form`, `.logo-upload-wrap`), anders blijft er een gat. Schrijf de HTML van een melding daarom zonder witruimte tussen de tags (`:empty` werkt anders niet).

## Architectuurbeslissingen

- **Statusregel onder de knoppen, geen toast of pop-up.** Een toast verdwijnt voordat een schermlezer of een trage lezer hem heeft gezien, en past slecht bij de wisselende telefoonsituatie in de kantine.
- **`aria-disabled` in plaats van `disabled`.** `disabled` haalt de knop uit de tabvolgorde en laat de focus op `<body>` vallen. Het kost wel een expliciete controle in elke handler en een `data-actie`-controle in lijsten (`aria-busy`).
- **Geen automatische retry na een time-out.** Een time-out betekent niet dat het schrijven mislukt is. Opnieuw proberen kan een dubbel item geven; de tekst stuurt de gebruiker naar de lijst of de mailbox.
- **`merge` in plaats van de regels aanpassen.** Profiel en logo schrijven alleen hun eigen velden. Zo overschrijven ze elkaar niet (relevant voor CK-019), terwijl de Firestore-regel ongewijzigd het samengevoegde document toetst.
- **`profielSessie` legt club en uid vast bij de klik.** Een late uitkomst mag niet naar een andere club of gebruiker doorsijpelen.

## Beperkingen en vervolgpunten

Zie `.claude/backlog.md`, "Na CK-023":

- Firebase-console (handwerk, test en productie): Email enumeration protection aan; sjabloon "E-mailadreswijziging" (met terugdraailink) aan en in het Nederlands.
- ↑/↓ gebruikt een `writeBatch` op een eerder gelezen lijst. Twee tabbladen tegelijk kunnen dubbele volgordenummers geven; oplossing: `runTransaction`.
- Na een time-out kan het schrijven alsnog slagen. Een nieuwe poging bij **toevoegen** kan dan een dubbel item geven. Oplossing: document-id vooraf vastleggen en hergebruiken.
- `aria-describedby` en `aria-invalid` staan pas op het moment dat er een veldfout is; vooraf koppelen voor `structuur-naam`, `profiel-naam`, `profiel-afkorting`, `geb-naam` ontbreekt nog.
- Groottelimiet voor het logo ontbreekt in de Firestore-regels (de client weigert > 10 MB, de server niet).
- Fouten zijn alleen met kleur en tekst onderscheiden van succes (✓ bij succes, geen symbool bij fout); een kleurloos kenmerk bij fouten is optioneel niet gedaan.
- Niet ingelogd getest: de unit-achtige controles liepen in een tijdelijk script, er is nog geen testsuite in de repo. Een browsertest op tst is nodig.
