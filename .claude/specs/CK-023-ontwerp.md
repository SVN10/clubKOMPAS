# Ontwerp: CK-023 + CK-025 Meldingen bij opslaan

Bronnen: `CK-023-meldingen-opslaan.md` (incl. antwoorden Paul en bijstellingen), `CK-023-gebruikersreis.md`, `src/main.js`, `src/style.css`.
Geen nieuwe kleuren behalve het token `--fout`. Geen toast, geen timers op meldingen.

---

## 1. Bouwstenen (gelden op alle schermen)

### 1a. Statusregel (succes / fout)

**Plaats:** direct onder de knoppenrij (`.form-rij`) van het blok, over de volle breedte van dat blok.

**Markup** (altijd bij het tekenen al aanwezig en leeg; geen spatie of regeleinde tussen de tags, anders werkt `:empty` niet):

```html
<div class="meldingen">
  <div class="melding melding-ok"   id="X-ok"   role="status"></div>
  <div class="melding melding-fout" id="X-fout" role="alert"></div>
</div>
```

- Er staat nooit tegelijk tekst in beide: de helper wist altijd beide voordat hij er één vult.
- Formulieren in een lijst (toevoegen, inline bewerken) krijgen **alleen** een fout-element (succes gaat naar de sectiemelding, want het formulier sluit). Zie per scherm.
- Geen `hidden` en geen `display:none` op de live regions of hun wrapper: een live region moet in de toegankelijkheidsboom staan vóór de tekst erin komt.

**Inhoud succes** (via DOM, nooit `innerHTML` met een naam erin):

```html
<span aria-hidden="true">✓ </span>Domein Jeugd toegevoegd.
```

**Inhoud fout:** platte tekst. Alleen bij sessie-/herinlogfouten volgt een knop (zie 1c).

**CSS (nieuw):**

```css
/* ── Meldingen bij opslaan (CK-023/CK-025) ── */
.meldingen { display: flex; flex-direction: column; gap: 8px; }
/* Leeg: heft de flex-gap van de ouder op (zelfde truc als .tussen-hint:empty) */
.meldingen:not(:has(.melding:not(:empty))) { margin-top: calc(-1 * var(--meld-gap, 16px)); }
.pijler-form        { --meld-gap: 12px; }
.pijler-bewerk-form { --meld-gap: 10px; }
.logo-upload-wrap   { --meld-gap: 8px; }

.melding {
  font-size: var(--fs-toelichting);
  line-height: 19px;
  font-weight: 600;
  margin: 0;
  padding-left: 10px;
  border-left: 3px solid currentColor;
  overflow-wrap: anywhere;
}
.melding:empty { border-left: 0; padding: 0; }
.melding-ok   { color: var(--petrol); }
.melding-fout { color: var(--fout); }
.melding .melding-actie { display: flex; width: fit-content; margin-top: 8px; }
```

De oude klasse `.profiel-succes` vervalt (alle gebruikers worden `.melding.melding-ok`); de regel mag uit `style.css`.

### 1b. Knopstatus "Bezig..."

- Klik → helper zet op de geklikte knop `aria-disabled="true"` en tekst `Bezig...`; de andere knoppen in dezelfde `.form-rij` (bijv. Annuleren) krijgen ook `aria-disabled="true"`, zonder tekstwijziging.
- **Niet** het attribuut `disabled` gebruiken: de focus blijft op de knop staan (bijstelling 5).
- Elke klikhandler begint met `if (knop.getAttribute('aria-disabled') === 'true') return` (vóór de validatie).
- Lijstacties (↑/↓, Verwijderen): op de lijstcontainer `aria-busy="true"` en op alle `button[data-actie]` in de lijst `aria-disabled="true"`. De lijsthandler begint met `if (lijst.getAttribute('aria-busy') === 'true') return`. Verwijderen krijgt tekst `Bezig...`; ↑/↓ houden hun pijl (de kolom is 32px).
- Na afloop (`finally`): oude tekst terug, attributen weg, alleen voor knoppen die nog `isConnected` zijn.

```css
.btn[aria-disabled="true"],
.btn-kaart-actie[aria-disabled="true"] { opacity: .6; cursor: progress; }
.btn[aria-disabled="true"]:hover { border-color: var(--border); }
.btn.primary[aria-disabled="true"]:hover { border-color: var(--orange); }
.btn-kaart-actie[aria-disabled="true"]:hover { border-color: var(--border); color: var(--muted); }
```

### 1c. Knop "Opnieuw inloggen" in een foutmelding

Bij `unauthenticated`, `auth/user-token-expired` en `auth/requires-recent-login`:

```html
<div class="melding melding-fout" id="X-fout" role="alert">
  Je bent automatisch uitgelogd. Log opnieuw in en probeer het daarna nog een keer.
  <button type="button" class="btn melding-actie">Opnieuw inloggen</button>
</div>
```

- Klik → `signOut(auth)`; `onAuthStateChanged` toont het inlogscherm.
- Focus blijft op de Opslaan-knop; de inlogknop is de eerstvolgende Tab-stop (de statusregel staat direct onder de knoppen).
- Het klikken op deze knop wist de meldingen niet (zie 1e).

### 1d. Veldfouten

- Bestaande `.form-fout` onder het veld, plus `.fout` en `aria-invalid="true"` op de input (zoals bij domein toevoegen).
- Server-veldfouten (auth-codes, dubbele functienaam): tekst onder het juiste veld, **focus naar dat veld**.
- Geef deze inputs `aria-describedby="<id van hun .form-fout>"`, zodat de fout bij focus wordt voorgelezen: `functie-naam`, `fn-${id}`, `geb-email`, `geb-email-ww`, `geb-huidig-ww`, `geb-nieuw-ww`.
- Bij een nieuwe poging wist de helper de veldfouten die hij zelf gezet heeft.

### 1e. Wanneer verdwijnt een melding

- Elk blok krijgt `data-meldblok`. Blok = de `.sectie` in Beheer, een `.meld-blok` in Mijn account.
- Na elk tekenen `bindMeldblokken()` aanroepen: per blok een click-listener in de **capture**-fase die alle `.melding` in dat blok leegmaakt als er op een `button` is geklikt die (a) niet `aria-disabled="true"` is, (b) niet in een `.melding` staat, en (c) als dichtstbijzijnde `[data-meldblok]` dit blok heeft.
- Typen wist niets. Naar een ander scherm gaan wist alles (de pagina wordt opnieuw getekend).

---

## 2. Schermen

### Scherm 1: Beheer → Domeinen
**Lay-out (`.sectie-lijf`, `data-meldblok` op `.sectie`):** filter-tabs → `#structuur-lijst` → **sectiemelding** (`structuur-ok` / `structuur-fout`) → `+ Toevoegen` → `#structuur-form`.
In `#structuur-form`, onder de `.form-rij`: `<div class="meldingen"><div class="melding melding-fout" id="structuur-form-fout" role="alert"></div></div>`.
In het inline bewerkformulier, onder de `.form-rij`: idem met `id="bm-fout-${id}"`.

| Actie | Bezig | Gelukt | Mislukt |
|---|---|---|---|
| Toevoegen (`structuur-opslaan`) | knop "Bezig...", Annuleren gedimd | `resetForm()`; `structuur-ok`: "✓ Domein [naam] toegevoegd."; focus op `#structuur-toevoegen-knop`; lijst verversen | formulier open met invoer; tekst in `structuur-form-fout`; focus blijft op Opslaan |
| Bewerken opslaan | idem | `structuur-ok`: "✓ Domein [naam] opgeslagen."; lijst verversen; focus op `[data-actie="bewerk"][data-id]` | bewerkformulier open; tekst in `bm-fout-${id}`. Bij `not-found`: tekst in `structuur-fout`, lijst verversen, focus op toevoegknop |
| Verwijderen (na `confirm()`) | knop "Bezig...", lijst `aria-busy` | `structuur-ok`: "✓ Domein [naam] verwijderd." (naam vooraf uit `.cel-naam`); lijst verversen; focus op toevoegknop | tekst in `structuur-fout` (staart "De lijst is niet gewijzigd."); lijst verversen (echte stand); focus terug op dezelfde knop |
| ↑ / ↓ | lijst `aria-busy`, pijl blijft | **geen** melding; lijst verversen; focus zoals nu | tekst in `structuur-fout`; lijst verversen; focus terug op dezelfde knop (of Bewerken als hij nu `disabled` is) |

Dubbele domeinnaam: er bestaat geen controle in de huidige code, dus **niet** toevoegen (bijstelling 9).

### Scherm 2: Beheer → Bestuursfuncties
Zelfde opbouw als Domeinen. `<p class="form-fout" id="functie-melding" role="status">` wordt vervangen door de sectiemelding `functie-ok` / `functie-fout` (zelfde plek: onder de lijst, boven `+ Toevoegen`). Formulierfout: `functie-form-fout`; inline bewerken: `fm-fout-${id}`. De helper `melding()` vervalt.

- Teksten: "✓ Bestuursfunctie [naam] toegevoegd." / "opgeslagen." / "verwijderd."
- "Nog in gebruik" (bestaande tekst ongewijzigd) → in `functie-fout` (alert), zonder te schrijven.
- Dubbele naam: de controle (het vooraf lezen) gaat **binnen** de actie; bij een dubbele naam gooit de actie `{ code: 'dubbele-naam' }`, die als veldfout onder Naam komt met de bestaande tekst "Deze bestuursfunctie bestaat al". Een leesfout geeft dus de verbindingsmelding.

### Scherm 3: Beheer → Club
**Clubprofiel (`data-meldblok` op de sectie):** `<p id="profiel-succes">` vervalt; onder de `.form-rij` met `#profiel-opslaan` komt `profiel-ok` / `profiel-fout`. Fout staat niet meer onder Clubnaam.
- Gelukt → `renderClubBeheer(gebruiker, { succes: 'profiel' })` → "✓ Profiel opgeslagen.", focus op `#profiel-opslaan`.

**Clublogo (`data-meldblok` op de sectie):** de `<label class="btn">` wordt een echte knop (anders is hij niet te focussen en niet op "Bezig..." te zetten):

```html
<div class="form-rij" style="margin-top:12px">
  <button type="button" class="btn" id="logo-kiezen">Logo wijzigen | Logo uploaden</button>
  <input type="file" id="logo-input" accept="image/*" hidden>
  <!-- bestaande Verwijderen-knop -->
</div>
<div class="meldingen"><div class="melding melding-ok" id="logo-ok" role="status"></div><div class="melding melding-fout" id="logo-fout" role="alert"></div></div>
```

- `#logo-kiezen` klik → (niet bezig) `logo-input.click()`.
- `change` → `metOpslaan(logoKiezen, …, { soort: 'logo' })`; in `finally` altijd `input.value = ''`.
- Gelukt uploaden → `renderClubBeheer(gebruiker, { succes: 'logo' })` → "✓ Logo opgeslagen.", focus op `#logo-kiezen`.
- Gelukt verwijderen → `{ succes: 'logo-weg' }` → "✓ Logo verwijderd.", focus op `#logo-kiezen`.
- Fout: oud logo blijft, tekst in `logo-fout`.

### Scherm 4: Mijn account
Elk van de drie groepen gaat in `<div class="meld-blok" data-meldblok>` (de `<hr class="sectie-hr">` blijft ertussen, buiten de blokken). De `<p class="profiel-succes" … hidden>` worden vervangen door statusregels:

| Blok | ids | Gelukt | Veldfouten (code → veld) |
|---|---|---|---|
| Naam | `geb-naam-ok/-fout` | "✓ Naam opgeslagen." + footer bijwerken (zoals nu) | — |
| E-mailadres | `geb-email-ok/-fout` | "✓ We hebben een bevestigingsmail gestuurd naar [adres]. Klik op de link in die mail om de wijziging af te ronden." Velden leeg (zoals nu) | `email-already-in-use`, `invalid-email`, `operation-not-allowed` → `geb-email`; `wrong-password`, `invalid-credential` → `geb-email-ww` |
| Wachtwoord | `geb-ww-ok/-fout` | "✓ Je wachtwoord is gewijzigd." Velden leeg (zoals nu) | `wrong-password`, `invalid-credential` → `geb-huidig-ww`; `weak-password` → `geb-nieuw-ww` |

Bij een fout blijven alle velden gevuld. `knop.disabled` vervalt overal (vervangen door de helper). Wachtwoordminimum 8 in de validatie = 8 in de foutteksten (klopt al).

```css
.meld-blok { display: flex; flex-direction: column; gap: 16px; }
```

---

## 3. Foutteksten (definitief)

Staarten: **I** = " Wat je hebt ingevuld, staat er nog." · **L** = " De lijst is niet gewijzigd."

Soorten (parameter `soort`):
- `formulier-lijst` – domein/functie toevoegen en bewerken → staart I, time-out lijstvariant
- `lijstactie` – verwijderen, ↑/↓ → staart L, time-out lijstvariant
- `formulier` – clubprofiel, Mijn account → staart I, time-out paginavariant
- `logo` – logo uploaden/verwijderen → geen staart, time-out paginavariant

| Code | Tekst | Waar |
|---|---|---|
| `offline` (`navigator.onLine === false`) | "Je bent niet verbonden met internet. Controleer je verbinding en probeer het opnieuw." + staart | statusregel |
| `unavailable`, `deadline-exceeded`, `auth/network-request-failed` | "Geen verbinding met de server. Controleer je internet en probeer het opnieuw." + staart | statusregel |
| `tijd-op` (15 s), lijstvariant | "Opslaan duurt te lang. Controleer je verbinding en kijk daarna of je wijziging in de lijst staat, voordat je het opnieuw probeert." | statusregel |
| `tijd-op`, paginavariant | "Opslaan duurt te lang. Controleer je verbinding en herlaad daarna de pagina om te zien of je wijziging is opgeslagen, voordat je het opnieuw probeert." | statusregel |
| `permission-denied` | "Je hebt geen toestemming om dit op te slaan. Herlaad de pagina. Lukt het dan nog niet, neem contact op met SVN10." | statusregel |
| `resource-exhausted` | "Het is op dit moment erg druk op de server. Probeer het over een paar minuten opnieuw." | statusregel |
| `unauthenticated`, `auth/user-token-expired` | "Je bent automatisch uitgelogd. Log opnieuw in en probeer het daarna nog een keer." + knop **Opnieuw inloggen** | statusregel |
| `auth/requires-recent-login` | "Voor deze wijziging moet je eerst opnieuw inloggen. Dat is een extra beveiliging." + knop **Opnieuw inloggen** | statusregel |
| `auth/too-many-requests` | "Te veel pogingen achter elkaar. Wacht een paar minuten en probeer het opnieuw." | statusregel |
| `not-found`, `failed-precondition` | "Dit item bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt." | sectiemelding (+ lijst verversen) |
| `bestand-onleesbaar` (eigen code, uit `resizeAfbeelding`) | "Dit bestand kan niet als afbeelding worden gelezen. Kies een JPG- of PNG-bestand." | `logo-fout` |
| `invalid-argument` bij soort `logo` | "Dit logo is te groot om op te slaan. Kies een kleiner bestand." | `logo-fout` |
| `auth/email-already-in-use` | "Dit e-mailadres wordt al gebruikt door een ander account. Kies een ander adres." | onder Nieuw e-mailadres |
| `auth/invalid-email` | "Dit is geen geldig e-mailadres. Controleer of er een @ en een punt in staan." | onder Nieuw e-mailadres |
| `auth/weak-password` | "Dit wachtwoord is te zwak. Gebruik minimaal 8 tekens, liefst met cijfers of leestekens." | onder Nieuw wachtwoord |
| `auth/wrong-password`, `auth/invalid-credential` | "Wachtwoord klopt niet." (bestaand) | onder het wachtwoordveld van dat blok |
| `auth/operation-not-allowed` | "E-mailwijziging niet toegestaan in dit project." (bestaand) | onder Nieuw e-mailadres |
| `dubbele-naam` (eigen code) | "Deze bestuursfunctie bestaat al" (bestaand) | onder Naam |
| al het andere (ook `invalid-argument` buiten logo) | "Opslaan is niet gelukt. Probeer het opnieuw. Blijft dit gebeuren, neem dan contact op met SVN10." | statusregel |

Iedere fout gaat met code naar `console.error`; geen ruwe code in beeld.

---

## 4. Implementatie-aanwijzingen

### 4a. Helpers (in `main.js`, bij "Gedeelde UI-helpers")

```js
const OPSLAAN_TIJDSLIMIET = 15000
const INLOG_CODES = new Set(['unauthenticated', 'auth/user-token-expired', 'auth/requires-recent-login'])
const WEG_CODES = new Set(['not-found', 'failed-precondition'])

function foutTekst(e, soort = 'formulier-lijst')   // → string, volgens de tabel in §3
function wisMeldingen(blok)                         // alle .melding in blok: textContent = ''
function toonOk(el, tekst)                          // el.replaceChildren(<span aria-hidden="true">✓ </span>, tekst)
function toonFout(el, e, soort)                     // tekst + bij INLOG_CODES de knop uit §1c
function bindMeldblokken()                          // §1e
```

```js
// Retourneert 'ok' | 'fout' | 'weg'. Toont zelf alleen fouten; succes doet de aanroeper.
async function metOpslaan(knop, actie, {
  soort = 'formulier-lijst',
  fout,                // element: statusregel-fout van dit formulier/blok
  weg = fout,          // element voor not-found (bij inline bewerken: de sectiemelding)
  lijst = null,        // container bij lijstacties: aria-busy + alle button[data-actie] aria-disabled
  bezig = 'Bezig...',  // null = knoptekst niet wijzigen (↑/↓)
  veldFouten = {},     // { code: [foutElId, inputId, tekst?] }
} = {})
```

Volgorde binnen `metOpslaan`:
1. Wis meldingen van `knop.closest('[data-meldblok]')` en eerder gezette veldfouten.
2. Zet knopstatus (§1b).
3. `try`: `if (navigator.onLine === false) throw { code: 'offline' }`; daarna `await metTijdslimiet(actie())` (race met een timer die na 15 s `{ code: 'tijd-op' }` gooit; timer altijd opruimen). Return `'ok'`.
4. `catch (e)`: `console.error('Opslaan mislukt:', e?.code, e)`. Veldfout? → tekst onder veld, `.fout` + `aria-invalid`, focus op input, return `'fout'`. `WEG_CODES`? → `toonFout(weg, …)`, return `'weg'`. Anders `toonFout(fout, …)`, return `'fout'`.
5. `finally`: knopstatus terug (§1b). Bij `tijd-op` geen automatische nieuwe poging.

**De actie bevat:** het vooraf lezen (volgorde, dubbele-naamcheck, actuele lijst bij ↑/↓) en de schrijfactie, **niet** het verversen van de lijst. Verversen daarna: `await laadEnRender().catch(e => console.error(e))` (laadfouten zijn buiten scope; een mislukte verversing mag een gelukte opslag niet als fout melden).

**Na `'fout'` of `'weg'` bij een lijstactie, en na `'weg'` bij bewerken:** lijst verversen, dan focus herstellen.

### 4b. `renderClubBeheer(gebruiker, { succes } = {})`

```js
const CLUB_SUCCES = {
  profiel:    ['profiel-ok', 'Profiel opgeslagen.', 'profiel-opslaan'],
  logo:       ['logo-ok',    'Logo opgeslagen.',    'logo-kiezen'],
  'logo-weg': ['logo-ok',    'Logo verwijderd.',    'logo-kiezen'],
}
```
Na tekenen en binden: focus op het knop-id, daarna `setTimeout(() => toonOk(el, tekst), 100)` als `el.isConnected` (zelfde patroon als `fout-hint`). Eerst focus, dan melding, zodat de schermlezer de melding na de knopnaam voorleest. `bindBeheerTabs` blijft `renderClubBeheer(gebruiker)` aanroepen (zonder succes).

### 4c. ↑/↓ atomair via `writeBatch`
`writeBatch` toevoegen aan de import uit `firebase/firestore`. Eén helper voor beide lijsten:

```js
async function schrijfVolgorde(subcollectie, items) {
  const batch = writeBatch(db)
  items.forEach((x, k) => {
    if (x.volgorde !== k + 1) batch.update(doc(db, 'clubs', huidigClubId, subcollectie, x.id), { volgorde: k + 1 })
  })
  await batch.commit()
}
```
Vervangt beide `Promise.all(...)`-regels. Lezen + wisselen + `schrijfVolgorde` vormen samen de actie in `metOpslaan(knop, …, { soort: 'lijstactie', lijst, bezig: null, fout: sectieFout })`.

### 4d. Focusbeheer (samengevat)
- Tijdens opslaan: focus blijft op de knop (`aria-disabled`, geen `disabled`).
- Fout in formulier: focus blijft op Opslaan; serverveldfout: focus naar het veld.
- Toevoegen gelukt: `#…-toevoegen-knop`. Bewerken gelukt: Bewerken-knop van dat item (na verversen).
- Verwijderen gelukt: `#…-toevoegen-knop`.
- ↑/↓ gelukt of mislukt, verwijderen mislukt: na verversen dezelfde knop (`[data-actie][data-id]`), anders Bewerken van dat item, anders de toevoegknop. Maak hiervoor één helper `focusInLijst(lijstEl, actie, id, terugval)`; de bestaande ↑/↓-focusregels gebruiken hem ook.
- `not-found`: na verversen de toevoegknop.
- Club na opnieuw tekenen: zie 4b.

### 4e. Token `--fout` en vervangingen in `style.css`
- `:root` → `--fout: #c0392b;`
- `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` → `--fout: #FF8A7A;`
- `:root[data-theme="dark"]` → `--fout: #FF8A7A;`
- `#c0392b` vervangen door `var(--fout)` in: `.form-input.fout`, `.form-fout`, `.btn-kaart-actie.gevaar:hover`, `.btn.gevaar:hover`. Daarna mag `#c0392b` alleen nog in `:root` staan.

---

## 5. Responsief gedrag
- Statusregel is een blokelement in een flex-kolom: altijd volle breedte onder de knoppen, tekst loopt door over meerdere regels (`overflow-wrap: anywhere` voor lange namen/e-mailadressen).
- De knop "Opnieuw inloggen" staat op een eigen regel onder de tekst (`.melding-actie` flex, `fit-content`).
- Onder 700px blijft `.form-rij` gestapeld (bestaand); de statusregel staat dan onder de laatste knop.
- Geen vaste breedtes, geen extra marges: de bestaande 16px zijmarges van `.wrap` blijven gelden.

## 6. Contrast en toegankelijkheid (WCAG 2.2 AA)
| Combinatie | Licht | Donker |
|---|---|---|
| `--fout` op `--surface` | 4,99:1 | 7,27:1 |
| `--fout` op `--card` (formulieren) | 5,44:1 | 6,48:1 |
| `--petrol` (succes) op `--surface` | 4,50:1 (net voldoende) | 6,98:1 |
| `--petrol` op `--card` | 4,91:1 | 6,23:1 |

- Succes op lichte `--surface` zit precies op de grens: zet `.melding-ok` **nooit** op een donkerdere achtergrond dan `--surface` en verlaag nooit de opacity.
- Kleur is niet de enige drager: succes heeft ✓ (verborgen voor schermlezers), beide varianten hebben een linkerbalk en de tekst zegt zelf wat er is gebeurd.
- `role="status"` (beleefd) voor succes, `role="alert"` (direct) voor fout; beide elementen staan er vanaf het tekenen.
- Gedimde "Bezig..."-knoppen vallen onder de uitzondering voor inactieve bedieningselementen (1.4.3); ze blijven focusbaar met de normale focusring.
- Geen tijdslimiet op meldingen (2.2.1); foutmelding met een oplossing (3.3.3); veldfouten aan het veld gekoppeld via `aria-describedby` (3.3.1).

## 7. Implementatienotities voor de bouwer
- Niet aanraken: inlogscherm, Foutkaart, laadkaart, `firestore.rules`. Geen regels publiceren (Paul doet dat zelf bij de test).
- Bestaande veldvalidatie, `confirm()` bij verwijderen en de blokkade "nog in gebruik" blijven inhoudelijk gelijk; de validatie draait vóór `metOpslaan`.
- Namen in succesteksten altijd als tekst invoegen (`toonOk` met string), nooit via `innerHTML`.
- `resizeAfbeelding`-fout in de actie omzetten: `catch { throw { code: 'bestand-onleesbaar' } }`.
- Favicon (`setFavicon`) en footer-naam blijven bij succes bijgewerkt zoals nu.
- Live-region-markup zonder witruimte tussen de tags schrijven (anders klopt `:empty` niet).
