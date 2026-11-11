# Specificatie: CK-010 — Pijlers aanmaken

## Wat wordt er gebouwd?

Een interface waarmee een clubbeheerder nieuwe strategische pijlers kan aanmaken.
Een pijler heeft een naam, een slogan en een eindverantwoordelijke. De pijler
verschijnt direct in het pijlersoverzicht na aanmaken. In dit prototype slaan
we pijlers op in localStorage (geen Firebase nog).

## Gebruikersreis (samenvatting)

De beheerder ziet het pijlersoverzicht op de homepagina. Er staat een "Pijler
toevoegen"-knop. Die opent een formulier (inline of modal). Na invullen en
opslaan verschijnt de nieuwe pijler direct in het overzicht.

## Betrokken bestanden

- `src/main.js` — pijlerlogica en HTML-templating toevoegen
- `src/style.css` — formulier-stijlen en eventueel modal-stijlen

## Acceptatiecriteria

- [ ] Pijler aanmaken met: naam (verplicht), slogan (verplicht),
      eindverantwoordelijke (verplicht)
- [ ] Validatie: naam en slogan minimaal 2 tekens, eindverantwoordelijke
      minimaal 3 tekens
- [ ] Na opslaan: pijler zichtbaar als kaart in het overzicht
- [ ] Pijlers blijven zichtbaar na pagina-herlaad (localStorage)
- [ ] Annuleren sluit het formulier zonder iets op te slaan
- [ ] Bestaande hardcoded pijlers (#JouwClubSpeelt etc.) blijven zichtbaar

## Wat mag er niet kapotgaan?

- De bestaande pijlerkaarten (#JouwClubSpeelt, #JouwClubGroeit, #JouwClubDoet)
- De bestaande domeinenkaarten (Bestuur, Financiën, Communicatie)
- De huisstijl (kleuren, typografie, sectie-patroon)
- De navigatiebalk

## Architectuurlaag

**Model-laag (M0)** — Pijlers zijn het configureerbare organisatiemodel van
een club. Ze worden beheerd door de beheerder en vormen de basis van de
club-structuur (Club → Pijlers → Vermogens).

## Randgevallen en risico's

- Lege localStorage bij eerste bezoek: toon standaard de drie hardcoded pijlers
- Pijler met dezelfde naam: voorlopig toestaan (duplicaatcontrole is M0 backlog)
- Lange namen: kaart moet niet doorbreken — overflow afvangen
- localStorage kan vol zijn: foutafhandeling met try/catch
