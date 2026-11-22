# Testrapport: CK-023 + CK-025 Meldingen bij opslaan

Datum: 22 november 2026. Branch `test`, ongecommitte wijzigingen (`CHANGELOG.md`, `src/main.js`, `src/style.css`).
Methode: code-review van de diff tegen spec, ontwerp en bouwverslag; testscript van de bouwer; `npm run build`. Niet ingelogd, niets naar Firestore, geen regels gepubliceerd, niets gecommit, geen branchwissel. Geen browsertest mogelijk.

## Uitgevoerd
- `node .../scratchpad/test-meldingen.mjs src/main.js`: ALLE TESTS GESLAAGD (foutTekst 27 codes x 4 soorten, metOpslaan-paden, toonOk, meldingenHTML).
- `npm run build`: geslaagd (25 modules, geen waarschuwingen).
- Statische controles: alle schrijfaanroepen (addDoc, updateDoc, deleteDoc, setDoc, writeBatch.commit, updateProfile, verifyBeforeUpdateEmail, updatePassword) zitten achter `metOpslaan`; alle 16 meldings-ids komen voor in de markup; `#c0392b` staat alleen nog in `:root` (style.css r. 17); `Fout: ${e.code}` staat alleen nog in het inlogscherm (main.js r. 584, buiten scope); `.profiel-succes`, `functie-melding`, `Promise.all`-hernummering zijn weg (de enige `Promise.all` zijn leesacties, r. 215 en 1295).

## Alle 14 schrijfacties via metOpslaan
| # | Actie | Regel main.js | soort | Status |
|---|---|---|---|---|
| 1 | Domein toevoegen | 1133 | formulier-lijst (vooraf lezen binnen actie) | ✅ |
| 2 | Domein bewerken | 1242 | formulier-lijst, weg = sectiefout | ✅ |
| 3 | Domein verwijderen | 1167 | lijstactie | ✅ |
| 4 | Domein ↑/↓ | 1154 | lijstactie, `bezig: null`, writeBatch | ✅ |
| 5 | Functie toevoegen | 1358 | formulier-lijst, dubbele-naam als veldfout | ✅ |
| 6 | Functie bewerken | ~1430 | idem | ✅ |
| 7 | Functie verwijderen | 1401 | lijstactie; "nog in gebruik" in `functie-fout` | ✅ |
| 8 | Functie ↑/↓ | 1382 | lijstactie | ✅ |
| 9 | Profiel opslaan | 1590 | formulier, fout in `profiel-fout` | ✅ |
| 10 | Logo uploaden | 1540 | logo | ✅ |
| 11 | Logo verwijderen | 1558 | logo | ✅ |
| 12 | Naam | 1694 | formulier | ✅ |
| 13 | E-mailadres | 1716 | formulier, veldFouten | ✅ |
| 14 | Wachtwoord | 1749 | formulier, veldFouten | ✅ |

## Acceptatiecriteria
| Criterium | Status | Opmerking |
|-----------|--------|-----------|
| Offline: melding binnen 1 s, invoer blijft, knop weer bruikbaar | ✅ code / ⏳ handmatig | `navigator.onLine === false` gooit `offline` vóór de schrijfactie (r. ~368); `finally` herstelt knop; formulier wordt pas bij `'ok'` gereset. Scripttest dekt offline. Browser nodig. |
| Geweigerde toegang: toestemmingsmelding, lijst toont echte stand | ✅ code / ⏳ handmatig | `permission-denied` in FOUTTEKSTEN; na `'fout'` bij lijstacties altijd `laadEnRender()` en `focusInLijst`. Echte regels testen kan alleen op tst (Paul publiceert). |
| Bevestiging (CK-025): ✓-melding bij profiel, logo up/weg, naam/e-mail/ww; verdwijnt bij volgende actie | ✅ code / ⏳ handmatig | `renderClubBeheer(..., {succes})` (CLUB_SUCCES, focus dan `setTimeout` 100 ms); naam/e-mail/ww via `toonOk` op `role="status"`; `bindMeldblokken` wist in capture-fase. Domeinen en functies tonen ook succes (toegevoegd/opgeslagen/verwijderd). |
| Dubbelklik: één item; knop "Bezig..." en niet bruikbaar | ✅ code / ⏳ handmatig | Elke handler begint met `aria-disabled`-check vóór validatie; lijsthandlers ook `aria-busy`; zetBezig dimt knop en `.form-rij`-knoppen. Scripttest dekt de knopstatus. Daadwerkelijk één document alleen in browser te bevestigen. |
| Geen technische codes in beeld | ✅ | Onbekende code, `undefined`, `toString`, `__proto__` geven algemene tekst; code alleen in `console.error` (r. ~376). Inlogscherm buiten scope. |
| Volgorde atomair | ✅ code / ⏳ handmatig | `schrijfVolgorde` (r. 162-168) gebruikt één `writeBatch` + `commit`, alleen gewijzigde items; beide `Promise.all`-regels vervangen. Gedrag onder echte weigering moet op tst. |
| Contrast licht en donker | ⏳ handmatig | Tokens aanwezig op drie plekken (r. 17, 42, 58): licht #c0392b, donker #FF8A7A; waarden komen overeen met de berekende verhoudingen in de spec. DevTools-meting nog te doen. |

## Specifieke punten uit de opdracht
- Veldfouten: ✅ dubbele functienaam → `functie-naam-fout` / `fn-fout-${id}` met focus op input; auth-codes op het juiste veld (email-already-in-use, invalid-email, operation-not-allowed → Nieuw e-mailadres; wrong-password/invalid-credential → wachtwoordveld van het blok; weak-password → Nieuw wachtwoord); `aria-describedby` op alle zes genoemde inputs; veldfouten worden bij nieuwe poging gewist.
- ↑/↓ atomair zonder succesmelding: ✅ geen `toonOk` in de ↑/↓-takken (r. 1154-1163, 1382-1392); wel foutmelding in sectiefout.
- renderClubBeheer-succes: ✅ profiel, logo en logo-weg met juiste melding en focusdoel.
- Logoknop: ✅ echte `<button id="logo-kiezen">` opent `logo-input.click()` (niet bij `aria-disabled`); `input.value = ''` in `finally`; `bestand-onleesbaar` apart.
- Token `--fout`: ✅ vier vervangingen (`.form-input.fout`, `.form-fout`, beide `.gevaar:hover`) + nieuwe `.melding-fout`.

## Regressiecheck
- ✅ Veldvalidatie (verplicht, minimaal n tekens, hashtag, tussen 2 en 100 tekens, wachtwoord min. 8) onveranderd en draait vóór `metOpslaan`.
- ✅ `confirm()` vóór verwijderen aanwezig bij domein en functie; blokkade "nog in gebruik" blijft (nu `role="alert"`).
- ✅ Favicon (`setFavicon`) bij logo up/weg; footer-naam bij naamwijziging bijgewerkt.
- ✅ Inlogscherm, Foutkaart en laadkaart niet gewijzigd; `firestore.rules` en `.env*` niet aangeraakt (git status toont alleen CHANGELOG.md, src/main.js, src/style.css).
- ✅ Build slaagt.
- ⏳ Focus na ↑/↓ via `focusInLijst`: logica klopt, gedrag in browser nog te zien.

## Randgevallen
| Geval | Status | Detail |
|-------|--------|--------|
| Time-out 15 s, timer opgeruimd, geen auto-retry | ✅ | `metTijdslimiet` met `finally clearTimeout`; scripttest gelukt. |
| Late schrijfactie na time-out (`huidigProfiel` bijgewerkt) | ✅ | Afwijking 7 uit bouwverslag, redelijk. |
| `not-found` bij bewerken | ✅ | `weg` → sectiefout, lijst vernieuwd, focus op toevoegknop. |
| Gebruiker verlaat scherm tijdens opslaan | ✅ | `isConnected`-controles. |
| Fout in verversen na gelukte opslag | ✅ | `laadEnRender().catch(console.error)`; geen valse foutmelding. |
| `requires-recent-login` / `unauthenticated` | ✅ | Knop "Opnieuw inloggen" roept `signOut(auth)`. |
| Dubbele domeinnaam | ✅ n.v.t. | Controle bestond niet, niet toegevoegd (bijstelling 9). |
| Statusregel leeg: lay-out | ⏳ | `.meldingen:not(:has(...))` met negatieve marge is alleen visueel te beoordelen. |

## Opmerkingen (geen blokkade)
- `.btn.gevaar:hover` kleurt de tekst ook op een bezige Verwijderen-knop rood (bouwverslag afwijking 8); cosmetisch.
- In `bewerk-annuleer` (domein, r. ~1256 en functie) staat `await laadEnRender()` zonder `.catch`; bestond al, valt buiten scope.
- `:has()` in de CSS vraagt een moderne browser; geen probleem voor de doelgroep, wel noteren.

## Handmatig te testen op tst (Paul, met hoofdsessie)
1. Succesmeldingen: profiel, logo uploaden/verwijderen (favicon!), naam, e-mail, wachtwoord, domein/functie toevoegen/bewerken/verwijderen; melding verdwijnt bij klik op andere knop in hetzelfde blok, niet bij typen. VoiceOver leest succes beleefd, fout direct.
2. Dubbelklik op Opslaan bij domein en functie toevoegen: precies één item; "Bezig..."; Annuleren doet niets; focus blijft.
3. Offline (DevTools): domein toevoegen/bewerken, functie toevoegen, profiel, logo uploaden → melding binnen 1 s, invoer blijft; online → zelfde klik lukt.
4. Geweigerde toegang: Paul publiceert tijdelijk `allow write: if false` in `svn10-clubkompas-test` (begin- en eindtijd noteren); alle schrijfacties inclusief ↑/↓ → toestemmingsmelding, lijst ongewijzigd, nummering 1..n zonder gaten; terugzetten met `npm run regels:test` en controleren dat opslaan weer werkt.
5. Not-found via twee tabbladen; ↑/↓ en bewerken.
6. Mijn account: verkeerd wachtwoord, bestaand e-mailadres, ongeldig adres, zwak wachtwoord → onder het juiste veld met focus; `requires-recent-login` → knop Opnieuw inloggen.
7. Logo: .txt hernoemd naar .png → onleesbaar-melding, opnieuw kiezen werkt; logoknop met Tab/Enter/Spatie.
8. Contrast en donker: `#FF8A7A` in donker (systeem en `data-theme`), >= 4,5:1; lay-out van lege statusregels (geen gat); mobiel/stapeling onder 700 px.
9. Optioneel time-out (15 s) en regressie: filter-tabs, validatieteksten, `confirm()`.

## Bevindingen voor de bouwer
Geen ❌.

## Eindoordeel
✅ Klaar voor beoordelaar. Code, bouw en scripttest zijn in orde; de acceptatiecriteria die een browser of tst-regels vragen zijn niet te toetsen zonder inloggen en staan hierboven als handmatige stappen.
