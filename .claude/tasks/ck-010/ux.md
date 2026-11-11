# Gebruikersreis: CK-010 — Pijlers aanmaken

## Gebruiker

**Rol:** clubbeheerder (bijv. voorzitter of secretaris)
**Context:** eerste keer dat de club clubKOMPAS inricht — wil de drie pijlers
van de club vastleggen zodat de rest van het platform hierop aansluit.

## Huidige situatie

Er zijn drie vaste pijlers hardcoded in de applicatie (#JouwClubSpeelt,
#JouwClubGroeit, #JouwClubDoet). Een beheerder kan ze niet aanpassen of
eigen pijlers toevoegen. De club kan het platform nog niet personalisseren.

## Nieuwe gebruikersreis

### Stap 1: Overzicht bekijken
**Situatie:** de beheerder is ingelogd op de homepagina
**Actie:** bladert door de "Pijlers & Domeinen"-sectie
**Resultaat:** ziet de bestaande pijlerkaarten én een "+ Pijler toevoegen"-knop
onderaan de pijlerkaarten

### Stap 2: Formulier openen
**Situatie:** de beheerder wil een nieuwe pijler toevoegen
**Actie:** klikt op "+ Pijler toevoegen"
**Resultaat:** een inline formulier verschijnt direct onder de knop (geen
popup, geen navigatie). Het formulier heeft drie velden: naam, slogan,
eindverantwoordelijke.

### Stap 3: Formulier invullen
**Situatie:** het formulier is zichtbaar
**Actie:** vult naam in ("Jeugdbeleid"), slogan ("Talenten van morgen, spelers
van vandaag"), eindverantwoordelijke ("Marieke van den Berg")
**Resultaat:** de velden zijn gevuld, geen foutmeldingen

### Stap 4: Opslaan
**Situatie:** alle velden zijn ingevuld
**Actie:** klikt op "Opslaan"
**Resultaat:**
- Formulier verdwijnt
- Nieuwe pijlerkaart verschijnt direct in het overzicht
- De knop "+ Pijler toevoegen" is weer zichtbaar

### Stap 5: Pagina herladen
**Situatie:** de beheerder herlaadt de pagina
**Actie:** F5 of ververs de browser
**Resultaat:** de nieuwe pijler staat er nog steeds

### Foutpad: validatie
**Situatie:** de beheerder klikt op "Opslaan" met een leeg naam-veld
**Actie:** klikt op "Opslaan"
**Resultaat:** het naam-veld krijgt een rode rand en een foutmelding
"Naam is verplicht". Het formulier sluit niet.

### Foutpad: annuleren
**Situatie:** het formulier is open, de beheerder bedenkt zich
**Actie:** klikt op "Annuleren"
**Resultaat:** formulier verdwijnt, niets is opgeslagen

## Navigatieroute

[Homepagina — Pijlers & Domeinen sectie]
  → [+ Pijler toevoegen knop]
  → [Inline formulier]
  → [Invullen + Opslaan]
  → [Pijlerkaart zichtbaar in overzicht]

## Pijnpunten en keuzes

- **Inline vs. modal**: inline formulier is eenvoudiger en minder onderbrekend
  voor een beheerstaak. Modal is complexer in implementatie en biedt hier geen
  meerwaarde.
- **Volgorde kaarten**: nieuwe pijlers komen na de hardcoded pijlers. Volgorde
  aanpassen is CK-012 (buiten scope).
- **Duplicaten**: nog niet controleren — scope is aanmaken, niet beheren.

## Wat de Ontwerp-medewerker nodig heeft

- Scherm 1: Pijlers & Domeinen sectie met "+ Pijler toevoegen"-knop
- Scherm 2: Diezelfde sectie met het inline formulier zichtbaar
- Scherm 3: De nieuwe pijlerkaart in het overzicht
- Validatiestatus: veld met foutmelding
