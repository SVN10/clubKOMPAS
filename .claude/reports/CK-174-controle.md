# Controle CK-174: uitvoeringen in het bewerkformulier (test, huisstijl, toegankelijkheid, beveiliging)

Branch `test`, niet gecommit. Zonder browser: alles is in de code gecontroleerd.

## Uitgevoerd
- `npm run build`: geslaagd (alleen de bekende waarschuwing over chunkgrootte).
- `npm run test:regels` (emulator): 194 van 194 geslaagd, 0 mislukt. Dat zijn ook de nieuwe suites "CK-174 ... pure functies" en "CK-174 bewaarActiviteit: regels" (inclusief de gemengde batch van 91 schrijfacties en nieuw met 40).
- `npm run lint` bestaat niet in dit project (geen script).
- `firestore.rules`: niet gewijzigd (`git status` toont het bestand niet).

## Acceptatiecriteria
| Criterium | Status | Plek |
|---|---|---|
| Geen uitklapknop of paneel; kolom toont "n uitvoering(en)" / "Geen uitvoeringen"; naamcel zonder tekst bij geen | Geslaagd | `aantalHTML` main.js:2878, `periodeHTML` main.js:2869 (stand `geen` geeft ''), `rijHTML` 2884 |
| Beide formulieren hetzelfde blok, één functie, nieuw begint met één lege regel | Geslaagd | `uitvoeringBlokHTML` 2704; bewerken 2995, nieuw 3133 (`[nieuweRegel()]`) |
| Regel: nummer, begin, eind (datumkiezer), voorbij/bezig, prullenbak | Geslaagd | `uvRegelHTML` 2683, `uvStandHTML` 2676 |
| Toevoegen: lege regel onderaan, focus op begindatum, status; weghalen: focus op volgende of toevoegknop, status | Geslaagd | `uvBlokKlik` 2796-2823; focus na toevoegen via `queueMicrotask` na de MutationObserver (volgorde klopt) |
| Geen hersortering tijdens typen; volgordeknop vanaf 2 regels, sorteert op huidige waarden, localStorage, focus op knop | Geslaagd | `uvWijzig` 2773 (alleen label), `uvBlokKlik` 2825-2838, `hernummer` 2762, `VOLGORDE_SLEUTEL` 2561 |
| Vier fouten per regel onder het juiste veld; focus op eerste fout; eigen `aria-describedby` | Geslaagd | `uitvoeringRegelFouten` activiteiten.js (BEGIN_LEEG, BEGIN_HALF, EIND_HALF, EIND_VOOR_BEGIN, dubbel); `leesVelden` 2843 in één `valideerVelden`; `aria-describedby` main.js:2690, 2695 |
| Eigen label per datumveld; nummers kloppen na weghalen/verplaatsen (ook prullenbak en kalenderknop) | Geslaagd (code) | label 2689/2694; `hernummer` 2752-2759 roept `werkDatumLabelBij` (keuzelijst.js:240) aan |
| Eén klik Opslaan = één batch; bij fout niets geschreven en invoer blijft | Geslaagd | `bewaarActiviteit` activiteiten.js (één `writeBatch`, één commit); fouten komen vóór de batch; formulier blijft staan (main.js 3083-3095) |
| Opgeslagen uitvoeringen weg: één confirm met aantal en datums; Annuleren slaat niets op | Geslaagd | `bevestigUitvoeringenWeg` 3024, aanroep 3064 (focus terug op Opslaan) |
| Annuleren sluit zonder wijziging in de database | Geslaagd | 3150-3153 (nieuw), 3247-3249 (bewerken); `tekenLijst` leegt `uvStaat` (2901) |
| Laatste uitvoering weghalen en opslaan lukt; rij toont "Geen uitvoeringen" | Geslaagd | `leegBlok` mogelijk (`oud` = [] is truthy), `uitvoeringWijzigingen` geeft weg; `aantalHTML` |
| Melding met echte aantallen | Geslaagd | `uitvoeringWijzigingTekst(uit)` 3123; `uit.toegevoegd` 3113; aantallen komen uit `bewaarActiviteit` |
| Twee beheerders: andermans toevoeging blijft; intussen-weg geeft melding bij regel en niets opgeslagen | Geslaagd | verse leesactie in `controleer()`; emulatortests; regelfouten 3083-3094 (uid wordt leeg, `oud` bijgewerkt) |
| 760px één regel; 320px onder elkaar met labels; 44px onder 700px | Niet te controleren (zonder browser) | CSS aanwezig: container query style.css (`@container uv-blok (max-width: 479px)`), 44px voor `.uv-regel .btn-icoon`, `.uv-volgorde`, `.uv-toevoegen` in `@media (max-width: 700px)` |
| Niets van het paneel meer in `main.js` of `style.css` | Geslaagd | grep op `uitklap`, `uitvoering-paneel`, `uv-ok-`, `openPanelen`, `btn-uitklap`, `uitvoering-(rij|lijst|balk|cel|kop|datum|form)`: alleen onverwante treffers (zijmenu "uitklappen", `paneel-open`) |
| `npm run test:regels` groen met nieuwe suites | Geslaagd | 194/194 |
| Op tst: 11 of meer uitvoeringen, toetsenbord, 320px, 200% zoom, VoiceOver | Niet te controleren | moet Paul op tst doen; emulator bewijst wel 91 schrijfacties en 40 nieuw |

## Besluiten van Paul
- Alles in één batch: gevolgd (`bewaarActiviteit`).
- Annuleren draait alles terug: gevolgd (formulier alleen in DOM/`uvStaat`, niets geschreven).
- Paneel weg: gevolgd (functies, CSS, imports en `WEG_CODES`/`FOUTTEKSTEN` voor `uitvoering-weg` zijn verwijderd).
- Volgordeknop in het formulier met localStorage `clubkompas-uitvoering-volgorde`: gevolgd; bewaarde waarde blijft gelden.
- Eén `confirm()` bij weghalen van opgeslagen uitvoeringen, niet bij nieuwe regels: gevolgd (3064: alleen uids uit `oud`).
- Lege regel geeft een fout met focus op die regel: gevolgd (BEGIN_LEEG; er is geen stil overslaan).

## Logica van `bewaarActiviteit` en de verschilfuncties
- Verse leesactie: `controleer()` leest eerst de activiteit (`activiteit-weg`), dan `laadUitvoeringenVanActiviteit`, alleen als er wijzigingen zijn. Goed.
- Intussen weg: gewijzigd en niet meer in vers geeft `uitvoering-intussen-weg` met sleutels; weggehaald en al weg wordt overgeslagen (`wegAlWeg`) en telt niet mee.
- Dubbele datums: binnen het formulier door `uitvoeringRegelFouten` (eindstand, omruilen mag); tegen andermans uitvoering door `controleerUitvoeringEindstand` (een uitvoering die jij zelf wijzigt of weghaalt telt niet als blokkade).
- Batchgrens: `nieuw + gewijzigd + weg > 499` geeft `te-veel-uitvoeringen` voor het schrijven; met de activiteit zelf maximaal 500. Goed.
- Andere activiteit: gewijzigde en verwijderde uids komen alleen door als ze in `oud` staan en in `vers` van deze activiteit (`versIds`); `activiteitId` wordt altijd van deze activiteit gezet. Een geknoeid `data-uid` leidt dus tot `intussenWeg` of een nieuwe regel, nooit tot een schrijfactie op een ander document.
- Commit-fout: bij `not-found` of `permission-denied` wordt opnieuw gecontroleerd voor de juiste code, anders de oorspronkelijke fout. Goed.
- Verdwenen vermogen of commissie: vermogen weg geeft "Kies een vermogen." (de lijst bevat het niet meer, plus hint bij openen, 3002); commissie weg valt terug op "Geen commissie" met hint (`commissieVeldHTML`). Commissies niet geladen: bestaande commissie blijft behouden (2847). Vermogens niet geladen: Opslaan is uitgeschakeld.
- Fail-soft (`perActiviteit` null): blok toont alleen de hint, `oud = null`, alleen de activiteit wordt opgeslagen.

## Beveiliging
- Alle dynamische waarden in HTML gaan door `esc()`: ids, `for`, `aria-describedby`, `data-eind`, `data-sleutel`, `data-uid`, `value`, `min`, `aria-label` (main.js 2684-2699, 2707, 2714-2724). Latere aria-labels en statusteksten worden met `setAttribute` en `textContent` gezet, niet via innerHTML. `uvWijzig` zet via `innerHTML` alleen vaste teksten uit `uvStandHTML`.
- `confirm()` krijgt platte tekst (juist zonder `esc`).
- `getElementById` en `CSS.escape` voor opzoeken, geen selectorstrings met invoer (de nieuwe `datumLabelTekst` in keuzelijst.js gebruikt `CSS.escape`).
- `firestore.rules` ongewijzigd; de client schrijft alleen uids die in de verse lezing van deze activiteit staan.

## Toegankelijkheid
- Label per datumveld ("Begindatum uitvoering n", sr-only nummer), `aria-describedby` per veld naar een eigen foutregel met vaste id's.
- Focus: na toevoegen op de nieuwe begindatum, na weghalen op de volgende regel of de toevoegknop, na een fout op het eerste foute veld (ook bij de fouten uit de batch), na volgorde op de knop, na annuleren van de confirm op Opslaan.
- Statusmelding: `role="status"` per blok via `zetStatus`, voor toevoegen, weghalen en volgorde. Enter in een datumveld slaat niet op.
- 44px: bij minder dan 700px voor prullenbak, volgordeknop en toevoegknop. Niet te controleren: de hoogte van het datumveld en de kalenderknop van de datumkiezer op mobiel, en 320px/200% zoom (browser nodig).

## Huisstijl
Alleen bestaande tokens in de nieuwe CSS: `--border`, `--muted`, `--petrol`, `--fs-toelichting`. De opgeruimde klassen komen nergens anders voor (grep over `src/` en `index.html`). `.cel-periode.geen` is uit de CSS en `periodeHTML` geeft die klasse niet meer. `.periode-velden` en `.form-rij-datums` blijven (projecten, main.js:3328-3330). `.activiteit-rij` kolombreedtes zijn behouden.

## Regressie
- Activiteitenlijst: `sorteerActiviteiten`, filter, `rijHTML` en `tekenLijst` onveranderd in opzet; de kolom Uitvoeringen is nu tekst.
- Verwijderen met uitvoeringen (`verwijderActiviteitMetUitvoeringen`, 3166): ongewijzigd.
- Blokkades bij vermogens en commissies: `activiteitBezet`/`telActiviteitenVanCommissie` en `laadActiviteitenVanVermogen` zijn niet aangeraakt; de regeltests blijven groen.
- Andere beheerpagina's: de diff in `keuzelijst.js` herstructureert alleen de label-toekenning (nu `zetDatumLabels`) en voegt de export `werkDatumLabelBij` toe; het gedrag bij start is gelijk. Het `leesVelden` van projecten (main.js:3362) is een aparte functie.
- `bewerkActiviteit` bestaat nog (nu via `bewaarActiviteit` met `oud = null`); `voegActiviteitToe` is in de app ongebruikt maar blijft voor de CK-170-tests, zoals de spec toestaat.

## Bevindingen
Geen hoge of middelzware bevindingen.

| Ernst | Bevinding | Plek |
|---|---|---|
| Laag | `voegActiviteitToe`, `uitvoeringBezet` en `uitvoeringDatumFout` zijn in de app ongebruikt (alleen tests). Spec staat dit toe; kan later weg. | activiteiten.js:201, 165, 64 |
| Laag | Regelfouten blijven staan tot de volgende keer opslaan, ook als je het veld al verbetert. Dit is zo in de spec ("net als in de andere formulieren"). | `valideerVelden`/`wisVeldFout` |
| Laag | `fieldset` met `container-type: inline-size` en `display: flex`: werkt in moderne browsers, maar is niet in een browser gecontroleerd (vooral Safari). Bekijk dit op tst bij 320px en 760px. | style.css `.uv-blok` |
| Laag | Tijdens het opslaan blijven de datumvelden bewerkbaar (toevoegen/weghalen is wel geblokkeerd via `aria-disabled`). De invoer wordt vóór het opslaan gelezen, dus geen dataprobleem. | main.js:2790 |
| Laag | Geen `lint`-script aanwezig, dus geen lintcontrole mogelijk. | package.json |

## Niet te controleren zonder browser
Uiterlijk bij 320px/760px, 44px op de datumvelden, 200% zoom, VoiceOver, de datumkiezer-interactie (focus via `queueMicrotask`, `validity.badInput`), en het opslaan van 11 of meer uitvoeringen op tst (cache van de regels in productie).

## Eindoordeel
Klaar voor de beoordelaar. De handmatige controle op tst (met 11 of meer uitvoeringen, 320px en VoiceOver) moet nog door Paul.
