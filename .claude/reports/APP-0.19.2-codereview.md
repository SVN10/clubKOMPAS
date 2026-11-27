# Codereview van src/ — v0.19.2

**Datum:** 27 november 2026
**Omvang:** alle bestanden in `src/` (branch `test`, versie 0.19.2), via `/code-review medium src/`
**Uitkomst:** 5 bevindingen. Ze zitten allemaal in code die er al was. Er zijn geen beveiligingslekken gevonden en er is niets aangepast.
**Let op:** de bevindingen zijn bij het lezen nagelopen, maar niet getest. Er is geen `CLAUDE.md` met projectregels, dus aan huisregels is niet getoetst.

## Bevindingen

### 1. Na een time-out meldt de app "mislukt", terwijl het opslaan toch kan lukken
- **Waar:** `src/main.js:481` (`metTijdslimiet`)
- **Wat er gebeurt:** na 15 seconden toont de app een foutmelding. Het opslaan in Firestore loopt op de achtergrond gewoon door en kan daarna nog slagen.
- **Voorbeeld:** bij een trage verbinding voegt een beheerder een uitvoering toe en krijgt na 15 seconden een fout. Het opslaan lukt daarna toch. Klikt de beheerder nog een keer op Opslaan, dan staat er: "Deze activiteit heeft intussen al een uitvoering op deze datum." Bij een nieuwe activiteit zegt de melding dat de naam al bestaat.
- **Oplossing:** bij `tijd-op` de lijst opnieuw laden en melden dat de wijziging misschien toch is opgeslagen. Of eerst nagaan wat er is gebeurd voordat de app "mislukt" zegt.

### 2. Twee beheerders die tegelijk iets toevoegen, krijgen hetzelfde volgnummer
- **Waar:** `src/vermogens.js:145` (`voegVermogenToe`), ook `src/vermogens.js:185` (`verplaatsVermogen`) en `src/onderdelen.js:139` (`voegOnderdeelToe`)
- **Wat er gebeurt:** de app bepaalt het volgnummer vóór de transactie en leest het daarbinnen niet opnieuw.
- **Voorbeeld:** twee beheerders voegen tegelijk een vermogen toe aan hetzelfde domein. Allebei krijgen ze nummer 5. De pijlknoppen verwisselen dan twee items met hetzelfde nummer.
- **Oplossing:** het volgnummer binnen de transactie bepalen, bijvoorbeeld met een teller op het domein. Of dubbele nummers herstellen zodra ze opduiken.

### 3. Herordenen loopt vast bij meer dan 500 items
- **Waar:** `src/main.js:214` (`schrijfVolgorde`)
- **Wat er gebeurt:** alle nieuwe nummers gaan in één batch. Firestore staat maximaal 500 schrijfacties per batch toe.
- **Voorbeeld:** een domein met 600 vermogens. Het onderste vermogen gaat naar boven, het opslaan mislukt en de volgorde blijft zoals hij was.
- **Oplossing:** opsplitsen in meerdere batches, of een maximale lengte vastleggen.

### 4. Keuzelijst: met PageDown en Enter kun je een uitgeschakelde optie kiezen (klein)
- **Waar:** `src/keuzelijst.js:198` en `kies()` op regel 177
- **Wat er gebeurt:** PageDown en PageUp springen 8 plaatsen en slaan uitgeschakelde opties niet over. `kies()` controleert niet of een optie uitgeschakeld is.
- **Gevolg nu:** geen. Er staan nu nergens uitgeschakelde opties in de app.
- **Oplossing:** `kies()` laten stoppen bij een uitgeschakelde optie, en PageDown en PageUp via `stap()` laten lopen.

### 5. Datumkiezer: een jaartal onder 100 wordt ongemerkt 19xx (klein)
- **Waar:** `src/keuzelijst.js:229` (`leesTekst`)
- **Wat er gebeurt:** `new Date()` maakt van de jaren 0 tot en met 99 de jaren 1900 tot en met 1999. De controle daarna kijkt alleen naar de dag en de maand.
- **Voorbeeld:** wie 01-03-0027 typt (bedoeld: 2027), krijgt zonder foutmelding 01-03-1927.
- **Oplossing:** ook controleren of `d.getFullYear() === +m[3]`.
