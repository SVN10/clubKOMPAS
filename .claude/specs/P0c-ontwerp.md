# Ontwerp: P0c — Club loskoppelen van gebruiker (tussenschermen)

Gebaseerd op `P0c-club-loskoppelen.md` en `P0c-gebruikersreis.md`, inclusief beide "Besluiten PO" (19 november 2026). Dit ontwerp beschrijft alleen de drie nieuwe tussenschermen. Inlogscherm, dashboard, Pijlers & Domeinen en Instellingen blijven visueel ongewijzigd.

## Uitgangspunten

- Alle drie de kaarten zijn een variant van het inlogscherm: `.inlog-wrap` > `.inlog-kaart`, met bovenaan `.inlog-logo` (kompas-icoon + "club**KOMPAS**").
- `#app` bevat op deze schermen **alleen** de `.inlog-wrap`. Geen `topBarHTML()`, geen `navHTML()`, geen `footerHTML()`.
- Kleuren uitsluitend via bestaande tokens (`--petrol`, `--orange`, `--text`, `--muted`, `--card`, `--border`, `--surface`). Geen nieuwe kleuren. Donkere modus werkt daardoor vanzelf.
- Elke kaart heeft één `h1` met `id="tussen-titel"`, `class="inlog-titel"` en `tabindex="-1"`. Na elke wissel van kaart krijgt deze `h1` programmatisch de focus. Zo hoort een schermlezer de nieuwe toestand en begint de tabvolgorde bovenaan de kaart.
- Geen technische foutcodes in beeld (dus geen `Fout: ${e.code}` op deze kaarten).

## Gedeelde bouwstenen (main.js)

### Constante supportadres
Bovenaan `src/main.js`, direct onder de `let`-regels (r. 7–9):

```js
// Algemeen SVN10-supportadres (PO-besluit 2). Leeg = zin zonder adres, nooit een lege link.
const SUPPORT_EMAIL = ''
```

### Helper: mail-link
```js
function supportMailto(accountEmail) {
  const onderwerp = encodeURIComponent('Toegang clubKOMPAS')
  const tekst = encodeURIComponent(`Mijn account: ${accountEmail || ''}\n\n`)
  return `mailto:${SUPPORT_EMAIL}?subject=${onderwerp}&body=${tekst}`
}

function supportLinkHTML(accountEmail) {
  return `<a class="tussen-link" href="${esc(supportMailto(accountEmail))}">${esc(SUPPORT_EMAIL)}</a>`
}
```
Alleen aanroepen als `SUPPORT_EMAIL` niet leeg is.

### Helper: kaart renderen en focussen
```js
function toonTussenkaart(inhoudHTML, { laden = false } = {}) {
  document.querySelector('#app').innerHTML = `
    <div class="inlog-wrap">
      <div class="inlog-kaart">
        <div class="inlog-logo${laden ? ' laadt' : ''}">
          ${kompasIconSVG()}
          <span class="app-title">club<b>KOMPAS</b></span>
        </div>
        ${inhoudHTML}
      </div>
    </div>`
  document.getElementById('tussen-titel')?.focus()
}
```
De opbouw is identiek aan `renderInlogscherm()` (r. 174–180), alleen de inhoud onder het logo verschilt.

---

## Schermen

### Scherm 1: Laadkaart — "Je club wordt geladen..."

**Lay-out:** inlogkaart met logo, daaronder één regel tekst. Geen knoppen, geen links.

**HTML (inhoud voor `toonTussenkaart(..., { laden: true })`):**
```html
<h1 class="inlog-titel tussen-laad-titel" id="tussen-titel" tabindex="-1">Je club wordt geladen...</h1>
```

**Componenten:**
- Logo-rij met klasse `laadt`: het kompas-icoon pulseert rustig (opacity, zie Nieuwe CSS). Uitgeschakeld bij `prefers-reduced-motion: reduce`.
- Titel in rustigere stijl (`.tussen-laad-titel`): normaal gewicht, `--muted`, 18px. Het is een `h1` (eis gebruikersreis), maar het moet niet als melding ogen.

**Interacties:**
- Geen. De kaart wordt vanzelf vervangen door dashboard, geen-club-kaart of foutkaart.

**Wanneer tonen (vertraging 500 ms):**
- In `onAuthStateChanged` bij een ingelogde gebruiker: start `const laadTimer = setTimeout(renderLaadkaart, 500)` vóór `bepaalClubId()` + `laadProfiel()`. Zodra er een uitkomst is: `clearTimeout(laadTimer)` en direct de uitkomst renderen.
- Na inloggen blijft dus eerst het inlogscherm met "Bezig..." staan; pas na 500 ms verschijnt de laadkaart. Bij herladen met actieve sessie is `#app` de eerste 500 ms leeg (zoals nu), daarna de laadkaart.
- De laadkaart wordt **niet** gebruikt bij "Opnieuw proberen" op de foutkaart (zie scherm 3).

**Schermlezer:** de `h1` krijgt focus via `toonTussenkaart`; de tekst wordt daarmee voorgelezen. Geen `aria-live` nodig.

**Focusvolgorde:** `h1` (programmatisch). Geen tabstops.

**Klassen:** `.inlog-wrap`, `.inlog-kaart`, `.inlog-logo`, `.app-icon`, `.app-title`, `.inlog-titel` (bestaand); `.laadt`, `.tussen-laad-titel` (nieuw).

---

### Scherm 2: Geen-club-kaart — "Geen club gekoppeld"

**Lay-out:** logo, titel, twee alinea's, één brede primaire knop (zelfde breedte en stijl als "Inloggen").

**HTML, variant A — supportadres ingevuld (`SUPPORT_EMAIL !== ''`):**
```html
<h1 class="inlog-titel" id="tussen-titel" tabindex="-1">Geen club gekoppeld</h1>
<p class="tussen-tekst">Je bent ingelogd als <strong>${esc(email)}</strong>, maar je account is nog niet aan een club gekoppeld.</p>
<p class="tussen-tekst">Neem contact op met SVN10 om toegang te krijgen: ${supportLinkHTML(email)}</p>
<button class="btn primary inlog-knop" id="geen-club-uitlog">Uitloggen</button>
```

**HTML, variant B — supportadres leeg (`SUPPORT_EMAIL === ''`):**
```html
<h1 class="inlog-titel" id="tussen-titel" tabindex="-1">Geen club gekoppeld</h1>
<p class="tussen-tekst">Je bent ingelogd als <strong>${esc(email)}</strong>, maar je account is nog niet aan een club gekoppeld.</p>
<p class="tussen-tekst">Neem contact op met SVN10 om toegang te krijgen.</p>
<button class="btn primary inlog-knop" id="geen-club-uitlog">Uitloggen</button>
```
Variant B heeft geen dubbele punt, geen link en geen placeholder.

**Teksten (exact):**
| Element | Tekst |
|---|---|
| Titel | Geen club gekoppeld |
| Alinea 1 | Je bent ingelogd als **{e-mail}**, maar je account is nog niet aan een club gekoppeld. |
| Alinea 2 (A) | Neem contact op met SVN10 om toegang te krijgen: **{supportadres}** (link) |
| Alinea 2 (B) | Neem contact op met SVN10 om toegang te krijgen. |
| Knop | Uitloggen |

`{e-mail}` = `gebruiker.email`. Is dat (theoretisch) leeg, dan luidt alinea 1: "Je bent ingelogd, maar je account is nog niet aan een club gekoppeld." Nooit een lege `<strong>`.

**Componenten:**
- E-mailadres in `<strong>` (vet, kleur `--text`): de gebruiker ziet met welk account hij is ingelogd.
- Supportlink `.tussen-link`: petrol, vet, onderstreept; `mailto:` met onderwerp "Toegang clubKOMPAS" en het account-e-mailadres vooraf in de berichttekst (PO-besluit 1).
- Knop "Uitloggen": `.btn.primary.inlog-knop` (oranje, volle breedte). Enige knop; geen "Opnieuw controleren" (PO-besluit 5).

**Interacties:**
- Klik "Uitloggen" → `signOut(auth)` → bestaande `onAuthStateChanged`-tak rendert het inlogscherm met lege velden.
- Klik supportadres → mailprogramma opent met onderwerp en tekst ingevuld.

**Schermlezer:** focus op `h1` na renderen; de lezer leest "Geen club gekoppeld, kop niveau 1" en kan daarna doorlezen.

**Focusvolgorde (Tab):** `h1` (programmatisch) → supportlink (alleen variant A) → "Uitloggen".

**Klassen:** `.inlog-wrap`, `.inlog-kaart`, `.inlog-logo`, `.inlog-titel`, `.btn`, `.primary`, `.inlog-knop` (bestaand); `.tussen-tekst`, `.tussen-link` (nieuw).

---

### Scherm 3: Foutkaart — "Club laden lukt niet"

**Lay-out:** logo, titel, één alinea, knoppenrij (primair + gewoon), daaronder een hint-regel die pas na de tweede mislukte poging gevuld wordt.

**HTML (eerste render):**
```html
<h1 class="inlog-titel" id="tussen-titel" tabindex="-1">Club laden lukt niet</h1>
<p class="tussen-tekst">We konden je clubgegevens niet ophalen. Controleer je internetverbinding en probeer het opnieuw.</p>
<div class="form-rij">
  <button class="btn primary" id="fout-opnieuw">Opnieuw proberen</button>
  <button class="btn" id="fout-uitlog">Uitloggen</button>
</div>
<p class="tussen-hint" id="fout-hint" role="status"></p>
```
`#fout-hint` staat er altijd (leeg) zodat de live-regio al bestaat vóórdat er tekst in komt. Niet `hidden` gebruiken: een verborgen live-regio wordt bij tonen vaak niet voorgelezen.

**Inhoud `#fout-hint` vanaf de tweede mislukte poging:**
- Variant A (adres ingevuld):
  `Lukt het na een paar pogingen nog steeds niet? Mail naar ${supportLinkHTML(email)}.`
- Variant B (adres leeg):
  `Lukt het na een paar pogingen nog steeds niet? Neem contact op met SVN10.`

**Teksten (exact):**
| Element | Tekst |
|---|---|
| Titel | Club laden lukt niet |
| Alinea | We konden je clubgegevens niet ophalen. Controleer je internetverbinding en probeer het opnieuw. |
| Primaire knop | Opnieuw proberen (tijdens actie: Bezig...) |
| Gewone knop | Uitloggen |
| Hint (A) | Lukt het na een paar pogingen nog steeds niet? Mail naar **{supportadres}**. |
| Hint (B) | Lukt het na een paar pogingen nog steeds niet? Neem contact op met SVN10. |

**Componenten:**
- Knoppenrij: bestaande `.form-rij` (flex, gap 8px; onder 700px automatisch onder elkaar en dan volle breedte). "Opnieuw proberen" = `.btn.primary` (oranje), "Uitloggen" = `.btn` (petrol tekst, rand).
- Hint `.tussen-hint`: 13px, `--muted`; link daarin `.tussen-link`.

**Interacties:**
- Klik "Opnieuw proberen":
  1. Knop: `textContent = 'Bezig...'`, `disabled = true`. De kaart blijft staan (geen laadkaart, geen re-render).
  2. Volledige keten opnieuw: `bepaalClubId()` én `laadProfiel()` (gebruikersreis reis 4: "alles opnieuw doen").
  3. Uitkomst:
     - Club + profiel geladen → `renderDashboard(gebruiker)` (favicon eerst zetten, zoals nu).
     - Geen club / `permission-denied` → `renderGeenClub(gebruiker)`.
     - Weer een fout → kaart **niet** opnieuw renderen. Knop terug naar "Opnieuw proberen", `disabled = false`, `focus()` op de knop. Pogingenteller ophogen; is de teller ≥ 2, dan de hint vullen (zie Schermlezer).
- Klik "Uitloggen" → `signOut(auth)` → inlogscherm.
- Klik supportlink in de hint → mailprogramma (zelfde onderwerp en tekst als op de geen-club-kaart).

**Pogingenteller:** de eerste mislukking (bij het eerste laden) is poging 1 en toont de kaart zonder hint. De eerste mislukte "Opnieuw proberen" is poging 2 en toont de hint. Teller resetten bij succes, bij geen-club en bij uitloggen.

**Schermlezer:**
- Eerste render: focus op `h1` via `toonTussenkaart`.
- Na een mislukte nieuwe poging: focus terug op "Opnieuw proberen" (eis gebruikersreis). De hint-regio meldt de herhaalde fout. Zodat ook poging 3, 4, ... opnieuw gemeld wordt, eerst leegmaken en dan vullen:
  ```js
  hint.textContent = ''
  setTimeout(() => { hint.innerHTML = hintHTML }, 100)
  ```

**Focusvolgorde (Tab):** `h1` (programmatisch) → "Opnieuw proberen" → "Uitloggen" → supportlink in hint (alleen variant A en pas na poging 2).

**Klassen:** `.inlog-wrap`, `.inlog-kaart`, `.inlog-logo`, `.inlog-titel`, `.form-rij`, `.btn`, `.primary` (bestaand); `.tussen-tekst`, `.tussen-hint`, `.tussen-link` (nieuw).

---

## Nieuwe CSS

Toevoegen in `src/style.css` direct na het blok `/* ── Inlogscherm ── */` (na `.uitlog-knop`, r. 408). Alleen bestaande tokens.

```css
/* ── Tussenkaarten (laden / geen club / fout) ── */
.inlog-titel[tabindex="-1"]:focus { outline: none; }

.tussen-laad-titel {
  font-size: 18px;
  font-weight: 400;
  color: var(--muted);
  margin-bottom: 0;
}

.tussen-tekst {
  font-size: 15px;
  line-height: 23px;
  color: var(--text);
  overflow-wrap: anywhere;
}
.tussen-tekst strong { font-weight: 700; }

.tussen-hint {
  font-size: 13px;
  line-height: 19px;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.tussen-hint:empty { margin-top: -16px; } /* heft de flex-gap van .inlog-kaart op zolang de hint leeg is */

.tussen-link {
  color: var(--petrol);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.tussen-link:hover { color: var(--text); }
.tussen-link:focus-visible {
  outline: 2px solid var(--petrol);
  outline-offset: 2px;
}

.inlog-logo.laadt .app-icon { animation: kompas-puls 1.6s ease-in-out infinite; }
@keyframes kompas-puls {
  0%, 100% { opacity: 1; }
  50%      { opacity: .45; }
}
@media (prefers-reduced-motion: reduce) {
  .inlog-logo.laadt .app-icon { animation: none; }
}
```

Toelichting per nieuwe klasse (waarom nodig):
- `.tussen-tekst`: er is geen bestaande klasse voor lopende tekst in een kaart op 15px in `--text` (`.card p` is 13px en hoort bij de grid-kaarten, `.hero-tekst p` is gescoped en `--muted`). `overflow-wrap` voorkomt dat een lang e-mailadres de kaart op mobiel breder maakt.
- `.tussen-hint`: kleinere, rustige vervolgregel; leeg zonder extra witruimte.
- `.tussen-link`: er bestaat nog geen linkstijl in de content (alleen `footer a` en `.top-nav a`).
- `.tussen-laad-titel` en `.laadt`: rustige laadtoestand zonder spinner (gebruikersreis: "geen draaiend wieltje").
- `.inlog-titel[tabindex="-1"]:focus`: geen focusring om een kop die alleen programmatisch focus krijgt.

## Responsief gedrag

- `.inlog-wrap` (padding 24px) en `.inlog-kaart` (`max-width: 400px`, `width: 100%`) werken al op 320–400px; niets aanpassen.
- Foutkaart: `.form-rij` zet de knoppen onder 700px onder elkaar, elk op volle kaartbreedte, "Opnieuw proberen" bovenaan. Daarboven staan ze naast elkaar, links uitgelijnd.
- Geen-club-kaart: "Uitloggen" is altijd volle breedte (`.inlog-knop`).
- Lange e-mailadressen en het supportadres breken af binnen de kaart (`overflow-wrap: anywhere`).

## Implementatienotities voor de bouwer

1. **Nieuwe functies in `src/main.js`** (in het blok `// ── Schermen ──`, na `renderInlogscherm`): `toonTussenkaart`, `renderLaadkaart()`, `renderGeenClub(gebruiker)`, `renderFoutkaart(gebruiker)`, plus `supportMailto`/`supportLinkHTML` bij de UI-helpers. `SUPPORT_EMAIL` als constante bovenaan.
2. **Eén laadfunctie** voor eerste laden en "Opnieuw proberen", bijv. `async function laadClub(gebruiker)` die `{ status: 'ok' | 'geen-club' | 'fout' }` teruggeeft en bij `ok` `huidigClubId` en `huidigProfiel` zet. `permission-denied` → `'geen-club'`; elke andere fout → `'fout'`. Geen foutcode naar de UI.
3. **Volgorde bij `ok`:** eerst `setFavicon(huidigProfiel.logo)`, dan `renderDashboard(gebruiker)` (favicon en logo direct in beeld).
4. **Race bij uitloggen:** controleer na elke `await` of `huidigGebruiker` nog dezelfde gebruiker is (`if (huidigGebruiker?.uid !== gebruiker.uid) return`). Wis de laadtimer in de uitlog-tak van `onAuthStateChanged`. Zo kan een late uitkomst niet over het inlogscherm heen renderen.
5. **Event listeners** na elke render binden: `#geen-club-uitlog`, `#fout-opnieuw`, `#fout-uitlog` → `signOut(auth)` resp. opnieuw laden. Geen `bindNavListeners` aanroepen (er is geen nav/footer).
6. **Geen-club-kaart doet geen reads op `clubs/...`** en de laadkaart/foutkaart tonen geen clubnaam of logo (`huidigProfiel` is dan `null`).
7. **Escapen:** `email` en `SUPPORT_EMAIL` altijd via `esc()`; de `href` als geheel ook via `esc()` (de `encodeURIComponent`-delen bevatten geen quotes, maar consistent blijven).
8. **Niet overschrijven:** `src/main.js` bevat niet-gecommitte wijzigingen (CK-017, dashboardcijfers). Alleen toevoegen en `onAuthStateChanged` aanpassen.
9. **Bestaande stijlen niet wijzigen:** alleen het nieuwe CSS-blok toevoegen.

## Controlelijst voor de bouwer

- [ ] Laadkaart verschijnt alleen als laden langer duurt dan 500 ms; bij snel laden geen flits.
- [ ] Geen top-bar, nav of footer op alle drie de kaarten.
- [ ] `SUPPORT_EMAIL = ''` → geen link, geen dubbele punt, geen "{supportadres}" in beeld (beide kaarten).
- [ ] `SUPPORT_EMAIL = 'test@voorbeeld.nl'` → klikbare link; mail opent met onderwerp "Toegang clubKOMPAS" en het account-e-mailadres in de tekst.
- [ ] Foutkaart: hint pas na de eerste mislukte "Opnieuw proberen"; focus staat daarna op "Opnieuw proberen".
- [ ] Na elke kaartwissel staat de focus op de `h1` (controleer met Tab: volgende tabstop is de eerste link of knop van de kaart).
- [ ] Op 360px breed: knoppen foutkaart onder elkaar, geen horizontale scroll, lange e-mail breekt af.
- [ ] Donkere modus: kaarten leesbaar (alleen tokens gebruikt).

## Besluiten PO (19 november 2026)
1. **"Opnieuw proberen":** de foutkaart blijft staan; alleen de knop toont "Bezig...". Geen laadkaart tussendoor.
2. **Hint zonder supportadres:** de volledige zin "Lukt het na een paar pogingen nog steeds niet? Neem contact op met SVN10."
3. **Mail-onderwerp op de foutkaart:** een eigen onderwerp, "Storing clubKOMPAS". De geen-club-kaart houdt "Toegang clubKOMPAS".
