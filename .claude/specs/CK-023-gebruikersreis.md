# Gebruikersreis: CK-023 + CK-025 Meldingen bij opslaan

## Gebruiker
Een bestuurder of vrijwilliger die in Beheer de structuur van de club bijhoudt (domeinen, bestuursfuncties, clubprofiel en logo) of in Mijn account zijn eigen gegevens aanpast. Werkt soms op een laptop thuis, soms op een telefoon in de kantine met wisselend wifi. Wil maar één ding weten: **is het gelukt, en zo niet, wat moet ik doen?**

## Huidige situatie
- Bij domeinen, logo verwijderen en verwijderen van functies gebeurt bij een fout **niets**: geen melding, de bestuurder denkt dat het gelukt is of klikt nog eens.
- Waar wel een melding komt, is die algemeen ("Opslaan mislukt, probeer opnieuw."), staat hij op de verkeerde plek (onder "Clubnaam") of is hij technisch (`Fout: auth/...`).
- Na opslaan van profiel of logo zie je **geen bevestiging**: de pagina wordt opnieuw getekend en het vinkje verdwijnt meteen.
- Twee keer snel klikken kan twee dezelfde domeinen of functies opleveren.
- Zonder internet blijft de knop eindeloos hangen.

## Vaste afspraken voor alle schermen

### Waar staat de melding?
Eén statusregel per blok, **direct onder de knoppen** van dat blok (geen pop-up, geen toast). Veldfouten (verplicht, te kort, dubbele naam, ongeldig e-mailadres, zwak wachtwoord) blijven onder het veld zelf.

### Hoe ziet hij eruit?
- **Gelukt:** petrolkleurig, vet, begint met een vinkje: "✓ Domein toegevoegd."
- **Mislukt:** foutkleur (`--fout`, licht en donker leesbaar), geen vinkje, één of twee korte zinnen: wat er mis is + wat je kunt doen.

### Wat hoort de schermlezer?
- **Gelukt:** wordt rustig voorgelezen na wat er op dat moment gezegd wordt (`role="status"`). Het vinkje zelf wordt niet voorgelezen (alleen "Domein toegevoegd.").
- **Mislukt:** wordt meteen voorgelezen (`role="alert"`).
- **Bezig:** de knop heet tijdens het opslaan "Bezig..."; de focus blijft op de knop staan (knop niet uit de focusvolgorde halen, zie bijstelling 5).

### Hoe lang blijft een melding staan?
- **Geen timer.** Een melding blijft staan tot de bestuurder iets nieuws doet in **hetzelfde blok**: op een knop klikken (Toevoegen, Opslaan, Bewerken, ↑/↓, Verwijderen, Annuleren) of een nieuw logo kiezen.
- Een foutmelding verdwijnt ook zodra de volgende poging gelukt is (dan staat de succesmelding er).
- Naar een ander scherm gaan wist alle meldingen.
- Typen in een veld wist de melding **niet** (anders verdwijnt de uitleg terwijl je hem nog leest).

### Dubbelklik
Na de eerste klik staat de knop op "Bezig..." en doet een tweede klik niets. Bij lijstacties (↑/↓, Verwijderen) doen tijdens het opslaan ook de andere actieknoppen in die lijst niets. Na afloop krijgt de knop zijn oude naam terug.

### Invoer blijft staan
Bij elke fout blijft alles wat de bestuurder heeft ingevuld staan; het formulier gaat niet dicht. Hij kan na het oplossen meteen opnieuw op Opslaan klikken.

## Teksten per foutcode

| Situatie / code | Tekst in beeld | Waar |
|---|---|---|
| Gelukt (algemeen) | "✓ [Wat] opgeslagen." (zie per scherm) | statusregel |
| `offline` (`navigator.onLine` false) | "Je bent niet verbonden met internet. Controleer je verbinding en probeer het opnieuw. Wat je hebt ingevuld, staat er nog." | statusregel |
| `unavailable`, `auth/network-request-failed` | "Geen verbinding met de server. Controleer je internet en probeer het opnieuw. Wat je hebt ingevuld, staat er nog." | statusregel |
| time-out (15 s) | "Opslaan duurt te lang. Controleer je verbinding en kijk daarna of je wijziging in de lijst staat, voordat je het opnieuw probeert." | statusregel |
| `permission-denied` | "Je hebt geen toestemming om dit op te slaan. Herlaad de pagina. Lukt het dan nog niet, neem contact op met SVN10." | statusregel |
| `resource-exhausted` | "Het is op dit moment erg druk op de server. Probeer het over een paar minuten opnieuw." | statusregel |
| `unauthenticated`, `auth/user-token-expired` | "Je bent automatisch uitgelogd. Log opnieuw in en probeer het daarna nog een keer." + knop **Opnieuw inloggen** | statusregel |
| `auth/requires-recent-login` | "Voor deze wijziging moet je eerst opnieuw inloggen. Dat is een extra beveiliging." + knop **Opnieuw inloggen** | statusregel |
| `auth/email-already-in-use` | "Dit e-mailadres wordt al gebruikt door een ander account. Kies een ander adres." | onder veld Nieuw e-mailadres |
| `auth/invalid-email` | "Dit is geen geldig e-mailadres. Controleer of er een @ en een punt in staan." | onder veld Nieuw e-mailadres |
| `auth/weak-password` | "Dit wachtwoord is te zwak. Gebruik minimaal 8 tekens, liefst met cijfers of leestekens." (minimum afstemmen op de bestaande validatie) | onder veld Nieuw wachtwoord |
| `auth/too-many-requests` | "Te veel pogingen achter elkaar. Wacht een paar minuten en probeer het opnieuw." | statusregel |
| bestaande auth-codes (bijv. verkeerd huidig wachtwoord) | blijven zoals nu | onder veld Huidig wachtwoord |
| dubbele naam (bestaande validatie) | "Er bestaat al een [domein/bestuursfunctie] met deze naam." | onder veld Naam |
| `not-found` / `failed-precondition` | "Dit item bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt." | statusregel |
| bestand onleesbaar (logo) | "Dit bestand kan niet als afbeelding worden gelezen. Kies een JPG- of PNG-bestand." | statusregel logo |
| `invalid-argument` (logo te groot) | "Dit logo is te groot om op te slaan. Kies een kleiner bestand." | statusregel logo |
| onbekend | "Opslaan is niet gelukt. Probeer het opnieuw. Blijft dit gebeuren, neem dan contact op met SVN10." (code alleen in de console) | statusregel |

Bij **verwijderen en ↑/↓** valt de zin "Wat je hebt ingevuld, staat er nog." weg (er is niets ingevuld); in plaats daarvan: "De lijst is niet gewijzigd."

## Nieuwe gebruikersreis per scherm

### Scherm 1: Beheer → Domeinen

**Stap 1: Domein toevoegen**
**Situatie:** De bestuurder staat op Domeinen, klikt **Domein toevoegen**, vult naam (en eventueel omschrijving) in.
**Actie:** Klikt **Opslaan**.
**Resultaat:**
- *Bezig:* knop wordt "Bezig...", tweede klik doet niets.
- *Gelukt:* formulier sluit, nieuw domein staat onderaan de lijst, onder de knoppen: "✓ Domein [naam] toegevoegd." Focus gaat naar de knop Domein toevoegen.
- *Dubbele naam / leeg veld:* melding onder het veld Naam, focus op dat veld (zoals nu).
- *Geen verbinding / time-out / geen toegang / sessie verlopen:* formulier blijft open met de ingevulde tekst, melding onder de knoppen, focus terug op **Opslaan**.

**Stap 2: Domein bewerken**
**Actie:** Klikt **Bewerken** bij een domein, past aan, klikt **Opslaan**.
**Resultaat:** gelukt: "✓ Domein [naam] opgeslagen."; fout: bewerkformulier blijft open met de wijzigingen, melding eronder. Bestaat het domein niet meer: lijst ververst, melding "Dit item bestaat niet meer...".

**Stap 3: Domein verwijderen**
**Actie:** Klikt **Verwijderen**, bevestigt in de vraag "Weet je het zeker?".
**Resultaat:** gelukt: domein weg, "✓ Domein [naam] verwijderd."; fout: domein blijft staan, melding met "De lijst is niet gewijzigd."

**Stap 4: Volgorde wijzigen (↑/↓)**
**Actie:** Klikt ↑ of ↓.
**Resultaat:** gelukt: domein schuift op, focus blijft op het verplaatste domein, **geen** succesmelding (de verschuiving zelf is de bevestiging; anders praat de schermlezer bij elke klik). Fout: volgorde blijft precies zoals hij was (alles of niets), melding "... De lijst is niet gewijzigd."

### Scherm 2: Beheer → Bestuursfuncties
Zelfde reis als Domeinen, met teksten:
- "✓ Bestuursfunctie [naam] toegevoegd." / "opgeslagen." / "verwijderd."
- Verwijderen van een functie die nog in gebruik is: bestaande blokkade-melding blijft, maar wordt een foutmelding (direct voorgelezen) in de statusregel.
- Dubbele functienaam: onder het veld Naam (bestaand). Ook als de controle zelf mislukt door een verbindingsfout, komt de verbindingsmelding (niet stil falen).

### Scherm 3: Beheer → Club

**Clubprofiel**
**Actie:** Past naam, hashtag of andere velden aan, klikt **Profiel opslaan**.
**Resultaat:** gelukt: pagina ververst, onder de knop "✓ Profiel opgeslagen." (blijft nu wél zichtbaar), nieuwe naam ook in de footer. Fout: alle velden behouden, melding onder de knop (niet meer onder Clubnaam).

**Clublogo uploaden**
**Actie:** Klikt **Logo kiezen**, selecteert een bestand.
**Resultaat:** tijdens verwerken: knoptekst "Bezig...". Gelukt: nieuw logo zichtbaar (ook als favicon), "✓ Logo opgeslagen." Fout: oud logo blijft, melding onder de knop (onleesbaar bestand, te groot, of verbinding). Hetzelfde bestand opnieuw kiezen werkt direct.

**Clublogo verwijderen**
**Actie:** Klikt **Logo verwijderen**.
**Resultaat:** gelukt: "✓ Logo verwijderd."; fout: logo blijft staan, melding.

### Scherm 4: Mijn account
Drie blokken, elk met eigen statusregel.

| Blok | Gelukt | Typische fouten |
|---|---|---|
| Naam | "✓ Naam opgeslagen." (naam ook in footer) | verbinding, sessie verlopen |
| E-mailadres | "✓ We hebben een bevestigingsmail gestuurd naar [adres]. Klik op de link in die mail om de wijziging af te ronden." | e-mailadres al in gebruik, ongeldig, opnieuw inloggen nodig, te veel pogingen |
| Wachtwoord | "✓ Je wachtwoord is gewijzigd." Wachtwoordvelden worden leeggemaakt. | huidig wachtwoord onjuist (onder Huidig), te zwak (onder **Nieuw**), opnieuw inloggen nodig |

Bij een fout blijven de wachtwoordvelden gevuld. Bij "opnieuw inloggen nodig" ziet de bestuurder de knop **Opnieuw inloggen**; die logt uit en brengt hem naar het inlogscherm.

## Navigatieroute
Beheer → Domeinen → [Domein toevoegen] → formulier → [Opslaan] → Bezig... → lijst + "✓ ..." óf formulier + foutmelding → [Opslaan] opnieuw
Beheer → Bestuursfuncties → idem
Beheer → Club → [Profiel opslaan] / [Logo kiezen] / [Logo verwijderen] → pagina ververst + "✓ ..." óf foutmelding
Mijn account → [Opslaan] per blok → "✓ ..." óf foutmelding → bij sessie verlopen: [Opnieuw inloggen] → inlogscherm

## Pijnpunten en keuzes
- **Time-out kan toch gelukt zijn:** de wijziging kan later alsnog doorkomen. Daarom vragen we eerst te kijken of hij in de lijst staat, en proberen we niet automatisch opnieuw.
- **Geen timer op meldingen:** langzame lezers en schermlezers missen anders de tekst.
- **Geen succesmelding bij ↑/↓:** zichtbare verschuiving + focus volstaat; voorkomt een kakofonie bij herhaald klikken.
- **Dubbelklik:** knop in "Bezig..."-stand, maar wel focusbaar, zodat toetsenbordgebruikers niet "kwijtraken" waar ze waren.
- **Sessie verlopen:** niet alleen zeggen wat er mis is, maar een knop geven om het op te lossen.

## Wat de Ontwerp-medewerker nodig heeft
- **Schermen:** Domeinen, Bestuursfuncties, Club (profiel + logo), Mijn account (naam, e-mail, wachtwoord).
- **Elementen per blok:** één statusregel onder de knoppen (leeg = onzichtbaar), twee varianten: succes (petrol, vinkje) en fout (`--fout`, licht en donker). Optionele knop **Opnieuw inloggen** in de foutvariant.
- **Knopstatus:** normaal / "Bezig..." (gedimd, niet klikbaar, wel focusbaar).
- **Veldfout:** bestaande `.form-fout` onder het veld; bij Mijn account onder het juiste veld (Nieuw e-mailadres, Huidig of Nieuw wachtwoord).
- **Mobiel:** statusregel over de volle breedte onder de knoppen, tekst mag over twee regels lopen.
