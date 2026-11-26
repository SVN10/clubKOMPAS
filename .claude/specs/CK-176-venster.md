# Specificatie: CK-176, toevoegen en bewerken in een venster

Dit is route **middel**. Het datamodel en de regels blijven gelijk, maar alle beheerschermen veranderen. De versie bij de start is 0.16.0 op branch `test`. Deze story neemt ook CK-175 mee (de beheerformulieren gebruiken de breedte), dat nog niet gecommit is in `src/style.css`.

## Aanleiding en besluiten van Paul (25-11-2026)
In de mockup verschijnt het bewerkscherm als een los venster en niet in de tabel. Paul heeft besloten:
1. **Toevoegen en bewerken gebeuren allebei in een venster**, op alle beheerschermen met een tabel. De tabel verschuift daardoor nooit meer.
2. Het venster is een browser-dialoogvenster (`<dialog>` met `showModal()`). Daarmee krijg je vanzelf de grijze achtergrond, Esc om te sluiten, en een focus die in het venster blijft.

## Om welke schermen het gaat
In `src/main.js` gaat het om:
- Domeinen: `structuur-form` en de bewerkrij
- Vermogens: `vermogen-form` en `vermogen-bewerk`
- Activiteiten: `activiteit-form` en `activiteit-bewerk`
- `renderOnderdeelBeheer` (Commissies, Projecten en Samenwerkingen): `onderdeel-form` en `onderdeel-bewerk`
- Bestuursfuncties: `functie-form` en de bewerkrij

Club (profiel en logo) en Mijn account veranderen niet. Dat zijn gewone formulieren zonder tabel.

## Ontwerp
- **Eén gedeeld onderdeel**, bijvoorbeeld `beheerVenster` in `main.js` of in een eigen module `src/venster.js`. Het opent een `<dialog class="beheer-venster" aria-labelledby="…">` met:
  - een kop, bijvoorbeeld "Activiteit toevoegen", "Activiteit bewerken: ALV" of "Vermogen bewerken: Jeugdopleiding". Gebruik de naam via `esc()` of `textContent`;
  - rechtsboven een sluitknop ✕ (`aria-label="Sluiten"`, 44×44);
  - de bestaande velden van het formulier, met dezelfde ids, foutvelden, `aria-describedby` en meldingen;
  - onderaan Opslaan (primair) en Annuleren.
- **Plaats in de DOM:** zet de `<dialog>` binnen het element waar de huidige click-delegatie op luistert (meestal `lijstEl` of de sectie), maar niet binnen `role="table"`. Dan blijven `data-actie`, `enterSlaatOp` en de eigen keuzelijst werken. Er is één venster per sectie tegelijk.
- **Sluiten** gaat met Annuleren, met ✕ of met Esc (`cancel`-event). Alle drie doen hetzelfde als Annuleren nu: wat er gewijzigd is, gaat verloren en er wordt niets opgeslagen. **Een klik op de grijze achtergrond sluit het venster niet**, zodat er geen ingevulde gegevens per ongeluk verloren gaan. Tijdens het opslaan ("Bezig...") kan het venster niet dicht: Esc en ✕ doen dan niets.
- **Na opslaan** sluit het venster. De sectiemelding komt zoals nu, bijvoorbeeld "✓ Activiteit X opgeslagen.", en de focus gaat naar de rij, zoals `focusInLijst` nu doet.
  - Mislukt het opslaan, dan blijft het venster open. De fout staat dan in het venster, zoals nu in het formulier.
  - Is het item intussen weg (`…-weg`), dan sluit het venster en komt de melding in de sectie.
- **Focus:** bij openen gaat de focus naar het eerste veld. Na sluiten zonder opslaan gaat de focus terug naar de knop die het venster opende, dus het potlood van die rij of "+ … toevoegen".
- **Verwijderen** blijft zoals nu, met de prullenbak in de rij en `confirm()`. Er komt geen verwijderknop in het venster.
- **Rij tijdens het bewerken:** de rij blijft gewoon staan, zonder klasse `bewerken` en zonder formulier in de cel. Code en CSS die alleen voor het bewerken in de rij bestonden, ruim je op: bewerkcellen in het raster, `.bewerken`-regels en de terugvalkolommen tijdens het bewerken. Controleer met grep of iets nog ergens anders gebruikt wordt.
- **Toevoegknop:** die blijft zichtbaar en wordt niet meer `hidden` terwijl het formulier open is. Het venster dekt de pagina immers af.
- **Afmetingen:**
  - breedte `min(960px, calc(100vw - 32px))`;
  - maximale hoogte `calc(100dvh - 32px)`, en de inhoud scrolt binnen het venster;
  - kaartstijl zoals `.pijler-form`: `--card`, rand `--border`, linkerrand 4px `--petrol` en radius 4px;
  - een achtergrond (`::backdrop`) van halfdoorzichtig `--text` of zwart, met alleen bestaande tokens of `rgb(0 0 0 / .4)`;
  - de kop met de bestaande stijl van `.form-label` of `.sectie-kop`.

  Er komen geen nieuwe kleuren.
- **Telefoon (≤ 700px):** het venster vult het hele scherm (`100vw × 100dvh`, geen radius) en de knoppen staan onderaan.
- **Velden:** het raster uit CK-175 blijft (`.pijler-form` en `.pijler-bewerk-form`: kolommen van minstens 280px, de rest op de hele breedte), maar nu binnen het venster.
- **Eigen keuzelijst en datumkiezer:** de uitklaplijst mag niet afgesneden worden door de `overflow` van het venster. Controleer dat en los het op, bijvoorbeeld zo:
  - scroll alleen het binnenste deel;
  - laat de lijst omhoog openklappen;
  - geef het venster `overflow: visible` zolang de inhoud past.
- **CSP:** er komen geen inline styles of inline handlers. De bestaande `vercel.json` laat geen `unsafe-inline` toe.
- **Schermlezer:** het venster krijgt `aria-labelledby` naar de kop. Statusmeldingen bij toevoegen en weghalen van een uitvoering blijven binnen het venster.

## Wat mag er niet kapotgaan?
- **Opslaan:** validatie, foutmeldingen bij het juiste veld met focus op het eerste foute veld, "Bezig...", time-out, en de controle op dubbele namen.
- **Activiteiten (CK-174):** het blok Uitvoeringen, de volgordeknop, één batch, `confirm()` bij het weghalen van opgeslagen uitvoeringen, en een lege regel als fout.
- **Vermogens:** ↑/↓, verplaatsen naar een ander domein en de domein-guard.
- **Domeinen:** de soortkeuze die velden toont of verbergt, en `bevat`.
- **Blokkades bij verwijderen:** bij bestuursfuncties, vermogens en commissies.
- **Enter slaat op** (`enterSlaatOp`) in het venster.
- **Rechten:** een niet-beheerder ziet niets (`geenBeheer`).
- **Lege staat en laadfouten** met "Opnieuw laden".

## Acceptatiecriteria
- [ ] Op alle vijf de schermen opent "+ … toevoegen" een venster, en het potlood ook. In de tabel staat geen formulier meer.
- [ ] Esc, ✕ en Annuleren sluiten het venster zonder op te slaan, en de focus gaat terug naar de knop die het venster opende. Een klik op de achtergrond sluit het venster niet. Tijdens het opslaan blijft het venster open.
- [ ] Na een geslaagde opslag sluit het venster, staat de melding in de sectie en staat de focus op de rij.
- [ ] Bij een fout blijft het venster open, staat de fout bij het veld en staat de focus op het eerste foute veld.
- [ ] Op de telefoon vult het venster het hele scherm. De keuzelijst en de datumkiezer werken in het venster en worden niet afgesneden.
- [ ] De ongebruikte CSS en code voor het bewerken in de rij zijn opgeruimd.
- [ ] `npm run build` en `npm run test:regels` slagen. De regels zijn niet veranderd.
