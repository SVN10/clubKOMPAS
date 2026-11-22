# Eindoordeel: CK-023 + CK-025 Meldingen bij opslaan

Datum: 22 november 2026. Branch `test`, niet gecommit. Beoordeeld: specs (incl. antwoorden en bijstellingen), bouwverslag (incl. herstelronde), de vijf kwaliteitsrapporten (geschreven vóór de herstelronde), beide docs, en zelf `src/main.js` (meldingshelpers, `profielSessie`, Club- en Mijn-account-handlers) en `firestore.rules`. Niets in de browser getest.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen | Na herstelronde |
|-------|-----------|---------|---------------------|-----------------|
| Functioneel testen | Tester | ✅ | 0 | Geen open punten; browserstappen staan nog open |
| Huisstijl | Huisstijl | ✅ | 0 | Beide lage punten opgelost (rode hover op bezige knop, lege-melding-witruimte); inline style naar klasse |
| Beveiliging | Beveiliging | ✅ (was 🟡) | 0 | Hoog punt 1 opgelost en door mij nagelezen; laag 2, 5, 6 opgelost; laag 3, 4 naar backlog |
| Compliance | Compliance | ✅ | 0 | 1, 3, 4 opgelost; 2 en 5 zijn Firebase-console-instellingen voor Paul |
| Toegankelijkheid | Toegankelijkheid | ✅ (was 🟡) | 0 | 1, 2, 3 en 5 opgelost; 4 deels; 6 optioneel niet gedaan |

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/CK-023-technisch.md`) | ✅ Actueel, inclusief herstelronde (`profielSessie`, merge, logo-check, console) |
| Gebruikersdocs (`.claude/docs/CK-023-voor-gebruikers.md`) | ✅ Klare taal, foutmeldingentabel klopt met de code |

## Eigen controle: hoog beveiligingspunt (late profielopslag)

Opgelost zoals aanbevolen. `profielSessie()` (`src/main.js` r. 190-201) legt bij de klik `huidigClubId` en de uid vast, schrijft altijd naar die club en werkt `huidigProfiel` alleen bij als club én gebruiker nog gelijk zijn. Alle drie de handlers (logo uploaden r. 1592, logo verwijderen r. 1612, profiel opslaan r. 1636) gebruiken het en controleren `sessie.geldig()` vóór favicon en opnieuw tekenen. Het profiel schrijft alleen `{ naam, afkorting, seizoen }` met `merge`, waardoor ook een late opslag geen gegevens van club A meer kopieert. Uitloggen zet `huidigClubId` op `null`, dus `geldig()` wordt `false`. Dit past bij `firestore.rules` (`geldigLogo` toetst het samengevoegde document, `deleteField` is toegestaan).

Restpunt (laag, geen blokkade): bij Domeinen en Bestuursfuncties leest de actie eerst (volgorde, dubbele naam) en pakt daarna pas `huidigClubId`. Als iemand binnen die fractie van een seconde uitlogt en bij een andere club inlogt, kan het item bij de nieuwe club terechtkomen. In de praktijk bijna onmogelijk. Hoort bij de backlogpunten over gelijktijdigheid.

## Aandachtspunten voor Paul

1. **Strengere testregels: vervang, voeg niet toe.** Firestore-regels werken met OF. Een extra regel `allow write: if false` naast de bestaande `allow create, update` / `allow delete` blokkeert niets. Haal in de tijdelijke versie de bestaande schrijfregels voor `instellingen`, `bestuursfuncties` en `structuurelementen` weg (of zet ze op `if false`). Laat `read` staan. Alleen in `svn10-clubkompas-test`, begin- en eindtijd noteren, daarna `npm run regels:test`.
2. **Firebase-console (test en productie), los van de code:** zet Email enumeration protection aan en controleer dat het sjabloon "E-mailadreswijziging" (met terugdraailink) aan staat en Nederlands is. Dit blokkeert live niet, maar het is wel nodig.
3. **Bewust geaccepteerd, staat in de backlog ("Na CK-023"):** ↑/↓ zonder transactie (twee tabbladen), mogelijk dubbel item na een time-out bij toevoegen, geen groottelimiet voor het logo in de regels, geen ✕-kenmerk bij fouten, `aria-describedby` pas bij een fout.
4. Er is nog nooit ingelogd getest. Alle oordelen gaan over code, de bouw en een tijdelijk testscript. Daarom is de checklist hieronder de echte acceptatie.

## Blokkades

Geen voor commit op `test`.

## Mijn aanbeveling

**🟢 GO voor commit op `test`** (Vercel → tst.clubkompas.svn10.nl). Nog **geen** GO voor main: dat hangt af van de checklist hieronder.

---

## Testchecklist voor Paul op tst

Voorbereiding: inloggen met een testaccount, DevTools open (Console en Network). Controleer na elke stap: geen rode fouten in de console, behalve de verwachte `Opslaan mislukt: <code>`.

1. **Profiel opslaan** (Beheer → Club): wijzig de afkorting en klik Opslaan. Verwacht: "Bezig...", daarna "✓ Profiel opgeslagen." onder de knop. De focus staat op Opslaan en de titelbalk is bijgewerkt.
2. **Logo uploaden en verwijderen:** verwacht "✓ Logo opgeslagen." en het nieuwe favicon. Bij verwijderen "✓ Logo verwijderd." en het kompas-favicon. Klik daarna een andere knop in hetzelfde blok: de melding verdwijnt. Typen wist hem niet.
3. **Profiel en logo tegelijk:** start een logo-upload (throttling op "Slow 4G") en klik meteen Profiel opslaan. Verwacht: na herladen zijn zowel het logo als de profielvelden bewaard.
4. **Logo, verkeerd bestand:** kies een .txt (hernoemd naar .png) en daarna een bestand groter dan 10 MB. Verwacht: direct "kan niet als afbeelding worden gelezen" of "te groot (maximaal 10 MB)". Kies hetzelfde bestand opnieuw: je krijgt dezelfde melding. Het oude logo blijft staan.
5. **Domein en functie:** toevoegen, bewerken en verwijderen. Verwacht: "✓ Domein [naam] toegevoegd./opgeslagen./verwijderd." Na toevoegen staat de focus op "+ Toevoegen", na bewerken op Bewerken. Bij ↑/↓ komt er geen zichtbare melding en blijft de focus op de pijl.
6. **Dubbelklik:** klik drie keer snel op Opslaan bij domein toevoegen en bij functie toevoegen. Verwacht: precies één nieuw item. Tijdens "Bezig..." doet Annuleren niets.
7. **Functie in gebruik verwijderen:** verwacht de foutmelding "nog in gebruik". Er wordt niets verwijderd.
8. **Focus met open formulier:** laat het toevoegformulier openstaan en klik bij een ander item op Verwijderen of ↑/↓. Verwacht: de focus komt op het eerste veld van het formulier, niet bovenaan de pagina.
9. **Offline** (Network → Offline): probeer domein toevoegen, domein bewerken, functie toevoegen, profiel opslaan en logo uploaden. Verwacht: binnen 1 s "Je bent niet verbonden met internet…", het formulier blijft gevuld. Zet de verbinding terug online en klik dezelfde knop: het opslaan lukt.
10. **Geweigerde toegang** (tijdelijke regels, zie aandachtspunt 1): probeer domein en functie toevoegen, bewerken, verwijderen en ↑/↓, profiel opslaan en logo uploaden en verwijderen. Verwacht: "Je hebt geen toestemming…: support@svn10.nl." met een klikbare link. De lijst is ongewijzigd en de nummering loopt 1 t/m n zonder gaten of dubbele nummers. Zet daarna de regels terug met `npm run regels:test`. Verwacht: opslaan lukt weer.
11. **Item bestaat niet meer:** open een domein in Bewerken in tabblad A, verwijder het in tabblad B en sla op in A. Verwacht: "Dit item bestaat niet meer…", de lijst is ververst en de focus staat op "+ Toevoegen".
12. **Mijn account:** wijzig je naam. Verwacht: "✓ Naam opgeslagen." en de footer is bijgewerkt. Probeer een verkeerd wachtwoord bij e-mail en bij wachtwoord wijzigen. Verwacht: "Wachtwoord klopt niet." onder het juiste veld, met de focus daar. Probeer een te kort nieuw wachtwoord en een leeg formulier. Verwacht: alle fouten tegelijk, met de focus op de eerste. Wijzig het wachtwoord met succes. Verwacht: "✓ Je wachtwoord is gewijzigd." en lege velden.
13. **Geen codes in beeld:** in geen enkele melding van de stappen hierboven staat `auth/…`, `permission-denied` of een andere code.
14. **Donker en contrast:** zet je systeem op donker en ook `document.documentElement.dataset.theme = 'dark'`. Verwacht: fouttekst in zachtrood (`#FF8A7A`), contrast minimaal 4,5:1 in de DevTools-check. Lege meldingen geven geen extra witruimte (`.meldingen` heeft hoogte 0).
15. **Toetsenbord en VoiceOver:** loop met Tab door de knoppen. Verwacht: een oranje ring, ook tijdens "Bezig...". De logoknop opent met Enter of Spatie. Met VoiceOver: een gelukte actie wordt rustig voorgelezen (zonder "vinkje"), een fout direct, en bij ↑/↓ hoor je "… staat nu op plaats n van m."
16. **Mobiel** (breedte ongeveer 400 px): verwacht dat meldingen onder de gestapelde knoppen staan en dat de pagina niet horizontaal scrollt.
17. *(Optioneel)* **Late opslag na wisselen van account:** zet throttling zeer traag, sla het profiel op, log tijdens "Bezig..." uit en log in bij een andere testclub. Verwacht: de titel en het profiel van de tweede club blijven ongewijzigd.

## Wat GO voor live (main) vereist

1. Stap 1 t/m 15 van de checklist zijn op tst geslaagd (16 en 17 aanbevolen). Een afwijking gaat terug naar de bouwer, daarna opnieuw testen op tst.
2. De testregels zijn teruggezet met `npm run regels:test`, met begin- en eindtijd genoteerd. Bevestig met één geslaagde opslag. De productieregels zijn niet aangeraakt (deze oplevering wijzigt geen regels).
3. De backlogpunten "Na CK-023" (aandachtspunt 3) en de console-instellingen (aandachtspunt 2) staan in `.claude/backlog.md`.
4. Daarna `git merge --ff-only test` naar main. Controleer na de deploy op productie kort stap 1 en 5 met een echte club.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
