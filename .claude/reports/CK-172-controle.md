# CK-172 — Controle (test, huisstijl, toegankelijkheid)

Branch `test`, niet gecommit. Gecontroleerd in de code; geen browser gebruikt.

## Uitslag commando's
- `npm run build`: geslaagd (alleen de bekende waarschuwing over chunkgrootte).
- `npm run test:regels` (emulator): 176 tests, 176 geslaagd, 0 mislukt. Inclusief de nieuwe suites "CK-172 uitvoeringen: regels" en "omzetscript (plan)".
- `npm run lint`: bestaat niet in dit project. Niet gedraaid.
- `node scripts/zet-uitvoeringen-om.mjs --help` werkt. Het script zelf is niet tegen een database gedraaid.

## Acceptatiecriteria
| Criterium | Status | Plek en opmerking |
|---|---|---|
| Activiteit zonder datums, uitvoeringen met precies 3 velden | Geslaagd | `firestore.rules` r. ~190-215 en `380`; `src/activiteiten.js` `VELDEN`, `UITVOERING_VELDEN`; regeltests groen |
| Nieuwe activiteit krijgt eerste uitvoering, samen of niet | Geslaagd | `voegActiviteitToe` (`writeBatch`, `activiteiten.js`); formulier `metDatum: true` (`main.js` r. ~2681, ~2944); regeltest "in één batch" groen |
| Bewerkformulier zonder datumvelden | Geslaagd | `openBewerk` roept `veldenHTML` zonder `metDatum` aan |
| Dubbele naam geeft veldfout bij Naam, hele club | Geslaagd | `activiteitBezet(lijst, naam, eigenId)`, `controleerDubbel`, `dubbelFout` (veld Naam) |
| Per rij aantal en eerstvolgende datum; bezig, komend, voorbij, geen | Geslaagd | `periodeHTML`, `uitklapHTML`, `eerstvolgendeUitvoering` |
| Volgorde vraag 3, filter, rijnummer in hele lijst | Geslaagd | `sorteerActiviteiten` (groepen bezig/komend, voorbij nieuwste eerst, geen op naam); `rijHTML(x, activiteiten.indexOf(x) + 1)` |
| Uitklappen met `aria-expanded`, voorbij-label, toevoegknop | Geslaagd | `klapUit`, `paneelHTML`, `uitvoeringRijHTML`. Het is een gewone `button`, dus Enter en Spatie werken |
| Uitvoering toevoegen, bewerken, verwijderen, veldfouten, `min`, melding, focus | Geslaagd | `uitvoeringActie` (`main.js` r. ~3040-3135); `datumRegels` (badInput, begin/eind), `uitvoeringBezet` vers geladen; `min` op einddatum bij bewerken; focus op potlood of toevoegknop |
| Activiteit verwijderen met mee-verwijderen, vers tellen, geen verwijdering bij telfout | Geslaagd | `verwijderActiviteitMetUitvoeringen`: telfout laat `sectieFout` zien en verwijdert niet; > 499 geweigerd |
| Intussen weg geeft "bestaat niet meer" en herlaadt | Geslaagd | `naWeg`, `activiteitWeg`, `WEG_CODES` met `uitvoering-weg`; `activiteit-weg` / `uitvoering-weg` in `activiteiten.js` |
| Regels: alleen beheerder schrijft, `existsAfter`, `activiteitId` onveranderlijk | Geslaagd | Regeltests groen |
| Omzetscript: `--droog`, idempotent | Deels te controleren | Planfunctie heeft unittests (groen), id = activiteit-id en één batch zijn in de code aanwezig. Een echte run is niet gedaan |
| `activiteiten.js` zonder DOM en zonder import uit `main.js` | Geslaagd | Alleen imports uit `firebase/firestore` en `onderdelen.js` |
| Build en test:regels slagen | Geslaagd | Zie boven |

## Ontwerp gevolgd
- Teksten: knop ("Geen uitvoeringen" bij 0, anders `uitvoeringenTekst`), kop, legenda's, "Eerste uitvoering", melding- en confirm-teksten, tellen-mislukt en te-veel-teksten komen overeen met het ontwerp. Geslaagd.
- Keuzeknop volgorde: `.btn` met "Nieuwste eerst" als de volgorde oud is, geen `aria-pressed`, `hidden` bij minder dan 2, links van "+ Uitvoering toevoegen", `localStorage` onder `clubkompas-uitvoering-volgorde`, onbekende waarde wordt `'oud'`, in `try/catch`. Focus blijft op de knop; `role="status"` met "Nieuwste/Oudste uitvoering bovenaan." via `zetStatus` (leeg, 100 ms later gevuld). Geslaagd. Zie bevinding 2.
- Paneelmeldingen: in het paneel (`uv-ok-` en `uv-fout-`), `paneelMelding` wist de sectiemeldingen en zet de melding na het tekenen. "Activiteit bestaat niet meer" gaat naar `sectieFout`. Geslaagd.
- Focus na opslaan: potlood van de uitvoering (ook op de nieuwe plek). Na verwijderen: volgende, anders vorige, anders toevoegknop; de volgorde komt uit de getoonde DOM-volgorde. Geslaagd.
- Eén open formulier: `sluitUitvoeringForms` sluit toevoeg- en bewerkformulieren in alle panelen voordat een nieuw opent. Geslaagd.
- Afwijking van het ontwerp, in lijn met Paul's besluit 1: de toevoegknop staat bovenaan het paneel (naast de keuzeknop), het formulier eronder. De lege tekst luidt "Voeg hierboven de eerste toe". Dit is geen fout.

## Huisstijl
- Alleen bestaande tokens (`--surface`, `--border`, `--petrol`, `--orange`, `--text`, `--muted`, `--fs-toelichting`, `--meld-gap`); in de toegevoegde css staan geen hexkleuren of `rgb()`. Geslaagd.
- Labels hergebruiken `.status-label.afgerond` en `.lopend`; geen nieuwe kleuren. Datumkolom en tabelkolommen (`#activiteit-lijst > [role=table]`, subgrid, kopregel sr-only onder 760px) volgen de tabelbesluiten. Het paneel springt in `grid-column: 1 / -1` (regel r. 1164). Geslaagd.
- Kolom Uitvoeringen staat na Activiteit; kopregel en cellen hebben zeven kolommen die gelijk lopen met de grid-template (8 in de tabel, 7 in de rij). Geslaagd.

## Toegankelijkheid (WCAG 2.1 AA, in de code)
- `aria-expanded` en `aria-controls="uv-{id}"` staan op de uitklapknop; het paneel bestaat altijd als de uitvoeringen geladen zijn. De naam is "3 uitvoeringen van ALV", zonder `aria-label`. Geslaagd.
- Labels en `aria-describedby`: elk datumveld heeft een `label[for]` en `aria-describedby="{id}-fout"`; `valideerVelden` zet de fouten, de eerste fout krijgt de focus. Geslaagd.
- Statusmeldingen: `meldingenHTML` geeft live regions (status en alert) die er vanaf het tekenen zijn; de volgordestatus komt 100 ms na het tekenen. Geslaagd.
- Toetsenbord: alles zijn echte buttons; Enter slaat in het uitvoeringformulier bewust niet op (datumkiezer); de bestaande Enter-regel voor `.activiteit-bewerk` blijft. Geslaagd.
- Doelen van 44px: onder 700px `.btn-uitklap`, `.uitvoering-balk .btn`, `.btn-toevoegen` en de pictogramknoppen. Opslaan/Annuleren in het uitvoeringformulier gebruiken `.btn` zonder 44px-regel (zie bevinding 4).
- Container query 320px: kolommen herplaatst met vaste rij per cel, paneel zonder inspringen, `.uitvoering-rij` loopt door (`flex-wrap`). Niet visueel te controleren. Zie bevinding 3.

## Niets kapot
- Vermogens: `laadActiviteitenVanVermogen` (blokkade `main.js` r. ~2418) en `telActiviteitenVanCommissie` (r. ~3628) zijn ongewijzigd; `sorteerActiviteiten(lijst)` zonder `perActiviteit` sorteert op naam. Geslaagd.
- Commissies, Projecten, Samenwerkingen: `renderOnderdeelBeheer`, `geldigeDatum` en `geldigePeriode` onaangeroerd; de projectregels in `firestore.rules` (r. 154-168) zijn gelijk. De bestaande regeltests (152) zijn groen binnen de 176.
- Blokkades en P0d: onaangeroerd en groen in de emulator.
- `startEigenVelden` pakt nieuwe `type="date"`-velden vanzelf op (`MutationObserver`, `keuzelijst.js` r. 419-425), dus ook in het paneel en in een `li`.

## Bevindingen
1. **Laag** — `src/main.js`, `renderActiviteitenBeheer`, `tekenLijst()` r. ~2813: `sorteerActiviteiten(activiteiten, perActiviteit, vandaag)` sorteert op de plek en de uitkomst wordt niet gebruikt. Dat werkt, maar het is makkelijk te missen. Een korte opmerking in de code is genoeg.
2. **Laag** — `main.js`, `uitvoeringActie` actie `uv-volgorde` (r. ~3040): `tekenPaneel` tekent alle panelen opnieuw. Een half ingevuld uitvoeringformulier in een paneel gaat daarbij verloren (de keuzeknop staat in hetzelfde paneel). Ook meldingen in andere panelen verdwijnen. Het ontwerp zegt "het paneel opnieuw tekenen"; sluit daarom liever eerst de open formulieren, of teken alleen panelen zonder open formulier.
3. **Laag, niet te controleren zonder browser** — `src/style.css` r. 1055: `.cel-activiteit .cel-periode` heeft `white-space: nowrap`. Op 320px kan een lange tekst ("laatst: 30 dec 2026 – 2 jan 2027") net te breed zijn en de rij horizontaal laten scrollen. Controleer op tst. Een `white-space: normal` binnen de container query lost het op.
4. **Laag** — Opslaan en Annuleren in het uitvoeringformulier zijn onder 700px geen 44px (`.btn` heeft `padding: 8px 18px`, `style.css` r. 182). Dit geldt ook voor de bestaande formulieren, dus geen nieuwe afwijking; ter overweging bij een volgende ronde.
5. **Laag** — Het omzetscript en de uitrol tegen de testdatabase zijn niet gecontroleerd (de regels staan er nog niet). `--droog` is aan Paul.

Geen bevindingen met ernst hoog of middel.

## Eindoordeel
Klaar voor de beoordelaar. Er zijn geen mislukte criteria. Visueel (320px, kleurcontrast, de pijl) en het draaien van het omzetscript blijven handmatig op tst te controleren.
