# Compliancerapport: CK-023 + CK-025 Meldingen bij opslaan

Datum: 22 november 2026. Branch `test`, niet gecommit.
Bronnen: `.claude/specs/CK-023-meldingen-opslaan.md`, `.claude/specs/CK-023-gebruikersreis.md`, `.claude/reports/CK-023-bouwverslag.md`, `src/main.js` (helpers r. 241-404, Club r. ~1500-1605, Mijn account r. 1607-1767, Domeinen r. ~943-1140), `package.json`.
Werkwijze: de code is direct gelezen (geen `git diff` beschikbaar in deze sessie). Daarbij is gekeken naar alles wat naar `console.*` en naar de meldingselementen gaat.

## Verwerkte persoonsgegevens

Deze wijziging voegt **geen nieuwe persoonsgegevens, velden of opslag** toe. Ze verandert alleen hoe bestaande schrijfacties terugkoppelen.

| Gegeven | Waar | Wat verandert er |
|---|---|---|
| Weergavenaam (Auth `displayName`) | Mijn account, blok Naam; footer | Alleen de bevestiging "✓ Naam opgeslagen." komt erbij. De naam zelf staat niet in de melding. |
| E-mailadres (huidig en nieuw) | Mijn account, blok E-mailadres | De succesmelding noemt het **nieuwe** adres ("We hebben een bevestigingsmail gestuurd naar …"). Dat gebeurt alleen op het eigen scherm van de ingelogde gebruiker, als tekstnode (geen HTML-injectie). Was al zo vóór deze wijziging. |
| Wachtwoord (huidig/nieuw) | Mijn account | Gaat alleen naar Firebase Auth. Komt **niet** in een melding of in de console. Bij een fout blijven de velden gevuld (`type="password"`), bij succes worden ze geleegd. |
| Foutobjecten van Firebase Auth/Firestore | `console.error('Opslaan mislukt:', e?.code, e)` in `metOpslaan` | Nieuw centraal logpunt, zie bevinding 1. |
| Domeinen, bestuursfuncties, clubprofiel, logo | Beheer | Geen persoonsgegevens: domeinen verwijzen naar een **functie** (`bestuursfunctieId`), niet naar een persoon. Succesteksten noemen alleen de naam van het domein of de functie. |

Geen telemetrie of foutrapportage naar derden: `package.json` bevat alleen `firebase` (geen Sentry of iets vergelijkbaars). Wat in de console komt, blijft in de browser van de gebruiker.

## Bevindingen

### 1. Volledig foutobject in de console
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 onder c (minimale gegevensverwerking), art. 25 (privacy door ontwerp)
**Probleem:** `metOpslaan` logt naast de code het **hele** foutobject (`console.error('Opslaan mislukt:', e?.code, e)`). Firebase Auth-fouten (`FirebaseError`) kunnen in `customData` gegevens bevatten zoals `appName` en in sommige gevallen een e-mailadres of `_tokenResponse`. In de huidige flows (herauthenticatie, `verifyBeforeUpdateEmail`, `updatePassword`) is het risico klein: wachtwoorden staan niet in het foutobject, en de console verlaat de browser niet. Op een gedeeld apparaat (kantinelaptop) is de console wel in te zien zolang het tabblad openstaat. De spec vraagt ook alleen "code in de console".
**Aanbeveling:** log alleen wat nodig is om te debuggen, bijvoorbeeld `console.error('Opslaan mislukt:', e?.code, e?.name)`. Of log het volledige object alleen buiten productie (`SOORT !== 'productie'`). Kleine wijziging, kan bij een volgende gelegenheid.

### 2. "E-mailadres al in gebruik" laat zien dat een account bestaat
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 32 (passende beveiliging)
**Probleem:** de veldfout bij `auth/email-already-in-use` ("Dit e-mailadres wordt al gebruikt door een ander account") maakt zichtbaar dat een bepaald adres een clubKOMPAS-account heeft (account-enumeratie). Het risico is beperkt: de melding komt pas na een geslaagde herauthenticatie met het eigen wachtwoord, dus alleen voor een ingelogde gebruiker die zijn wachtwoord kent. De tekst komt uit de door Paul goedgekeurde gebruikersreis.
**Aanbeveling:** controleer in de Firebase-console van beide projecten of **E-mail enumeration protection** aan staat. Staat die aan, dan geeft Firebase deze code bij `verifyBeforeUpdateEmail` meestal niet terug en is de tekst vooral een terugval. Geen codewijziging nodig.

### 3. Time-outtekst bij accountacties is niet uitvoerbaar
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 12 lid 1 (beknopte, begrijpelijke informatie in duidelijke taal); art. 5 lid 1 onder d (juistheid)
**Probleem:** bij een time-out in Mijn account (`soort: 'formulier'`) staat er: "… herlaad daarna de pagina om te zien of je wijziging is opgeslagen". Voor naam en profiel klopt dat. Voor **wachtwoord** en **e-mailadres** kan de gebruiker het niet zien door te herladen: een wachtwoordwijziging die na 15 s alsnog doorkomt is onzichtbaar, en een e-mailwijziging blijkt pas uit de mail. Dan probeert de gebruiker het opnieuw met het oude wachtwoord en krijgt hij "Wachtwoord klopt niet." Dat is verwarrend, en hij kan denken dat zijn account is overgenomen.
**Aanbeveling:** geef accountacties een eigen time-outtekst, bijvoorbeeld bij wachtwoord: "Het is niet zeker of je wachtwoord is gewijzigd. Log uit en probeer in te loggen met je nieuwe wachtwoord; lukt dat niet, gebruik dan je oude." Bij e-mail: "Kijk of je een bevestigingsmail hebt ontvangen voordat je het opnieuw probeert." Kan als vervolgpunt.

### 4. "Neem contact op met SVN10" zonder contactgegevens
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 12 lid 1 en 2 (transparantie, uitoefening van rechten makkelijk maken)
**Probleem:** de teksten bij `permission-denied` en bij een onbekende fout verwijzen naar SVN10, maar geven geen adres. In de code staan al `SUPPORT_EMAIL` en `supportLinkHTML()` (PO-besluit 2). De gebruiker moet nu zelf zoeken waar hij terecht kan, ook als hij wil weten waarom hij geen toegang (meer) heeft.
**Aanbeveling:** zet het supportadres als link in deze twee meldingen (met `toonFout`, als element en niet via `innerHTML`). `supportMailto` zet het e-mailadres van het account in de body. Dat mag: de gebruiker stuurt het zelf en het is nodig om hem te helpen.

### 5. Melding bij e-mailwijziging en bescherming tegen overname
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 32 en art. 33/34 (incidenten opmerken)
**Probleem:** deze wijziging gebruikt terecht `verifyBeforeUpdateEmail` na herauthenticatie: het nieuwe adres moet bevestigd worden en de melding legt dat duidelijk uit. Of het **oude** adres een melding krijgt ("je e-mailadres is gewijzigd", met een link om het terug te draaien), hangt af van de Firebase-sjablooninstelling. Die melding is voor de gebruiker de enige manier om een account-overname op te merken.
**Aanbeveling:** controleer in Firebase Authentication → Templates dat het sjabloon "E-mailadreswijziging" (intrekken) aan staat en in het Nederlands is, in test en productie. Dat valt buiten deze code, maar hoort bij het account-scherm.

### 6. Toegankelijkheid: juridisch kader (EAA)
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** Richtlijn (EU) 2019/882 (European Accessibility Act), in Nederland omgezet via de Implementatiewet toegankelijkheidsvoorschriften producten en diensten (van toepassing sinds 28 juni 2025); norm EN 301 549 / WCAG 2.1 AA
**Kader (kort):** de EAA geldt voor een vaste lijst consumentendiensten (onder meer e-commerce, bankdiensten, e-books, vervoer, elektronische communicatie). Micro-ondernemingen die diensten leveren (< 10 medewerkers en ≤ € 2 mln omzet of balanstotaal) zijn uitgezonderd. clubKOMPAS is een besloten beheertool voor bestuurders en vrijwilligers van een vereniging en geen consumentendienst uit die lijst. Waarschijnlijk is SVN10 bovendien een micro-onderneming. **Naar verwachting valt clubKOMPAS dus niet onder de EAA.** Het Besluit digitale toegankelijkheid overheid geldt evenmin. Contracten met grotere clubs of bonden (NOC*NSF-context) kunnen wel WCAG 2.1 AA eisen. Gebruik die norm daarom als richtlijn.
**Beoordeling van deze wijziging tegen WCAG 2.1 AA (op basis van de code):** goed opgezet.
- 4.1.3 Statusberichten: `role="status"` voor succes en `role="alert"` voor fouten. De live regions staan er al leeg vóór de tekst erin komt.
- 3.3.1 Fout identificeren / 3.3.3 Foutsuggestie: klare taal met een vervolgstap, `aria-invalid` en `aria-describedby` op de velden, geen ruwe codes meer.
- 1.4.3 Contrast: `--fout` is 5,44:1 in licht en 6,48:1 in donker.
- 2.2.1 Timing: meldingen hebben geen timer.
- 2.1.1 Toetsenbord: de logo-uploadknop is nu een echte `<button>`.
- Focus blijft bewaard: `aria-disabled` in plaats van `disabled`.

**Aanbeveling:** volgens het bouwverslag is er nog niet in de browser en met VoiceOver getest (punten 10-11). Laat die test op tst doen voordat er WCAG-conformiteit wordt geclaimd. Overweeg later een korte toegankelijkheidsverklaring, zeker als een club of bond daarom vraagt.

### Gecontroleerd zonder bevinding
- **Geen technische codes of persoonsgegevens van anderen in beeld:** `foutTekst` geeft voor onbekende codes een algemene tekst. Succesteksten in Beheer noemen alleen domein- of functienamen. `toonOk` gebruikt tekstnodes.
- **Geen wachtwoorden in console of UI.**
- **Mijn account geeft geen informatie over andere gebruikers prijs,** behalve het randgeval uit bevinding 2.
- **"Opnieuw inloggen"** (`signOut`) bij verlopen sessie of `requires-recent-login` beperkt het risico op een gedeeld apparaat. Positief.
- **Fictieve-data-principe:** tests met strengere regels gebeuren alleen in `svn10-clubkompas-test`. Paul publiceert zelf, `firestore.rules` in de repo is niet gewijzigd en productiedata wordt niet aangeraakt.
- **Geen cookies, geen lokale opslag van persoonsgegevens:** alleen het bestaande `localStorage`-item `zijmenu-ingeklapt` (functioneel, valt buiten toestemmingsplicht art. 11.7a Tw).
- **Jongeren onder 16 / vertrouwenspersoon:** niet van toepassing, want er worden geen ledengegevens verwerkt.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 0
- 🟢 Aanbevelingen: 6

## Eindoordeel
✅ **Compliant.** De wijziging verwerkt geen nieuwe persoonsgegevens en laat geen gegevens van anderen of wachtwoorden zien. Ruwe foutcodes verdwijnen uit beeld, wat de transparantie verbetert. De aanbevelingen 1 (minder loggen) en 4 (supportlink) zijn klein en kunnen in deze oplevering mee. Aanbevelingen 2 en 5 zijn instellingen in de Firebase-console. Aanbeveling 3 is een vervolgpunt.
