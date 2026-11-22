# Gebruikersreis: P0f — Eigen adressen voor live en online test

Bron: `P0f-adressen.md` (incl. antwoorden van Paul, 22-11-2026), voortbouwend op `P0e-gebruikersreis.md`.

## Gebruikers
- **Paul** — product owner en beheerder. Richt eenmalig in (Firebase-console, Vercel, Hostnet) en werkt daarna dagelijks volgens lokaal → test → live. Hij wil aan het adres, de balk, de footer en de tabtitel altijd zien waar hij zit.
- **HCA-gebruiker** — bestuurslid of vrijwilliger, niet technisch. Heeft een bladwijzer op `dev.clubkompas.svn10.nl` en wil gewoon verder werken.

## Huidige situatie
- Live draait op `dev.clubkompas.svn10.nl`. Het woord "dev" suggereert een testversie, terwijl daar de echte HCA-data staat.
- Een online testversie bestaat niet. Previews in Vercel gebruiken de productiewaarden en praten dus met de echte data.
- Lokaal toont `npm run dev` de balk "Testomgeving", hetzelfde woord dat straks de online test krijgt. Daardoor zie je niet of je lokaal of online test.

---

## Reis A — Eenmalig inrichten (Paul)

Algemene regel: **kijk bij elke stap eerst welk project of welke omgeving er openstaat** (Firebase linksboven, Vercel: projectnaam en tab Production/Preview).

### A0: Voorbereiden
**Situatie:** Paul heeft zijn Hostnet-inlog geregeld.
**Actie:** Hij logt in bij Mijn Hostnet → Domeinnamen → `svn10.nl` → DNS-beheer (de naam van het menu kan iets afwijken). Hij zoekt de regel `dev.clubkompas` (CNAME naar Vercel). In Vercel maakt hij een schermafdruk van Settings → Environment Variables.
**Resultaat:** Hij weet hoe een werkend Vercel-record er bij Hostnet uitziet en heeft een terugvaloptie voor de variabelen.
**Valkuil (Hostnet):** in het naamveld vul je alleen het deel vóór `svn10.nl` in (`clubkompas`, `tst.clubkompas`). Kijk na het opslaan of het doel niet is uitgebreid tot iets als `cname.vercel-dns.com.svn10.nl`. Vergelijk het met de bestaande `dev.clubkompas`-regel. Gebruikt die een punt achter het doel, doe dat dan ook.

### A1: Firebase Authorized domains
**Actie:** In de console, project **`svn10-clubkompas`**: Authentication → Settings → Authorized domains → Add domain → `clubkompas.svn10.nl`. Daarna in project **`svn10-clubkompas-test`**: `tst.clubkompas.svn10.nl` toevoegen.
**Resultaat:** Het nieuwe domein staat in de lijst. `dev.clubkompas.svn10.nl` blijft voorlopig staan.
**Controle:** de projectnaam linksboven klopt bij elke lijst.
**Ook nu:** Google Cloud Console → APIs & Services → Credentials → de Browser key van elk project. Staat er bij "Website restrictions" een lijst, voeg dan het nieuwe adres toe met `/*` erachter. Staat er niets, dan hoeft er niets te gebeuren.
**Valkuil:** domein in het verkeerde project. Dat zie je pas bij het inloggen (zie D2).

### A2: Live-adres koppelen
**Actie:** Vercel → Settings → Domains → Add → `clubkompas.svn10.nl` → Production. Vercel toont een CNAME-waarde. Paul neemt die **exact** over in Hostnet: nieuw record, type CNAME, naam `clubkompas`, TTL laag als Hostnet dat toestaat.
**Resultaat:** In Vercel gaat de status van "Invalid Configuration" naar **"Valid Configuration"**, en daarna is er een certificaat (meestal binnen minuten, soms een uur).
**Controle:** terminal `dig @ns01.hostnet.nl clubkompas.svn10.nl CNAME +short` toont de Vercel-waarde. Dit vraagt het rechtstreeks aan Hostnet, zonder tussengeheugen. Daarna `https://clubkompas.svn10.nl`: **geen balk**, footer "Productie · Versie 0.4.x", tabtitel "clubKOMPAS", inloggen met het eigen account, HCA-data zichtbaar. `dev.` werkt nog.
**Valkuil (DNS-propagatie):** open het nieuwe adres **niet** in de browser voordat Vercel "Valid" toont. Doe je dat wel, dan onthouden je computer of provider soms een tijd dat het adres "niet bestaat". Gebeurt dat toch, wacht dan, of probeer het op je telefoon via 4G. De melding "Je verbinding is niet privé" betekent dat het certificaat nog niet klaar is. Niet doorklikken, wachten.

### A3: Variabelen scheiden (voorstel: vóór de branch `test`, zie bijstelling 1)
**Actie:** Vercel → Settings → Environment Variables. Bij elk van de zes `VITE_FIREBASE_*`: Edit → Preview en Development uitvinken, alleen Production blijft aan. Daarna dezelfde zes opnieuw toevoegen met de testwaarden (uit `.env.test.local`), **alleen Preview, alle branches**. Ook `VITE_OMGEVING=Test` toevoegen, alleen Preview.
**Resultaat en controle:** elke sleutel staat twee keer in de lijst: één regel "Production" en één regel "Preview". Nergens staan Production en Preview op dezelfde regel. Production niet opnieuw deployen.
**Valkuil:** bij het opnieuw toevoegen staat Production soms standaard aangevinkt. Altijd nakijken voordat je op Save klikt.

### A4: Code en branch `test` (Claude, op verzoek)
**Actie:** Claude zet de P0f-code op `main`. Na Pauls akkoord volgt de deploy naar live, daarna maakt Claude de branch `test` en pusht die.
**Controle live:** nog steeds geen balk, footer "Productie".
**Controle preview:** de eerste build van `test` gebruikt meteen de testwaarden, want A3 is al gedaan.

### A5: Testadres koppelen
**Actie:** Vercel → Domains → Add → `tst.clubkompas.svn10.nl` → **Preview** → Git branch **`test`**. In Hostnet: CNAME, naam `tst.clubkompas`, met de waarde die Vercel toont. Deployment Protection (Vercel Authentication) blijft aan.
**Resultaat:** wie `tst.` opent, ziet **eerst een Vercel-inlogscherm** (zwart-wit, "Log in to Vercel"). Dat is goed en hoort zo. Daarna verschijnt de app.
**Controle:** petrol balk "Testomgeving · project svn10-clubkompas-test · fictieve data", footer "Test · Versie …", tabtitel "TEST · clubKOMPAS". Inloggen met `test-beheerder@svn10.nl` geeft "Testclub clubKOMPAS". Het eigen HCA-account werkt hier **niet** (melding M5). Dat is ook de bedoeling.
**Valkuil:** kies je bij Add per ongeluk "Production", dan toont `tst.` de live app: geen balk, echte data. Zie D3.

### A6: HCA informeren en `dev.` doorsturen
**Actie:** Eerst gaat het bericht naar HCA (zie reis C). Daarna: Vercel → Domains → `dev.clubkompas.svn10.nl` → Edit → Redirect to `clubkompas.svn10.nl`, statuscode **307**.
**Controle:** `https://dev.clubkompas.svn10.nl` en `https://dev.clubkompas.svn10.nl/#/iets` komen allebei uit op `clubkompas.svn10.nl`. Zet de opheffingsdatum (4 weken na het bericht) in de backlog.

### A7: Opheffen (na 4 weken)
Domein `dev.` weghalen in Vercel, de CNAME `dev.clubkompas` in Hostnet en het authorized domain `dev.clubkompas.svn10.nl` in Firebase productie.

---

## Reis B — Dagelijks werken (Paul)

| Waar | Adresbalk | Balk bovenaan | Footer | Tabtitel | Data |
|---|---|---|---|---|---|
| 1. Lokaal | `localhost:5173` | petrol: **Ontwikkelomgeving** · project svn10-clubkompas-test | Ontwikkel · Versie … | ONTWIKKEL · clubKOMPAS | testclub |
| 2. Online test | `tst.clubkompas.svn10.nl` (na de Vercel-login) | petrol: **Testomgeving** · project svn10-clubkompas-test · fictieve data | Test · Versie … | TEST · clubKOMPAS | testclub |
| 3. Live | `clubkompas.svn10.nl` | **geen** | Productie · Versie … | clubKOMPAS | HCA |
| (nood) lokaal tegen productie | `localhost:5173` | oranje: Let op: echte clubdata | Productie (lokaal) | ongewijzigd | HCA |

### B1: Lokaal bouwen en proberen
`npm run dev`. Paul ziet de balk "Ontwikkelomgeving". Hij logt in met het testaccount en probeert de wijziging uit.

### B2: Naar online test
Paul vraagt Claude om te committen en te pushen naar `test`. Na een minuut of twee toont Vercel dat de deploy klaar is. Paul opent `tst.clubkompas.svn10.nl`. Het **versienummer in de footer** is het eerste controlepunt: staat de nieuwe versie er, dan kijkt hij naar de nieuwe code.

### B3: Naar live
Is alles goed op tst, dan vraagt Paul om de merge: `git checkout main && git merge --ff-only test && git push`. Daarna ververst hij `clubkompas.svn10.nl`: geen balk, en **hetzelfde versienummer als op tst**. Dat laatste is de snelste check dat live en test gelijk lopen.
**Let op:** Firestore-regels gaan niet mee met Vercel. Die blijven `npm run regels:test` en daarna `regels:productie`.

### B4: Andere previews
Elke andere branch krijgt een `…vercel.app`-adres met dezelfde balk "Testomgeving" en testdata. Ongevaarlijk. Het adres zegt welke branch het is.

---

## Reis C — HCA-gebruiker na de adreswissel

### C1: Bericht vooraf
De HCA-gebruiker leest het bericht van Paul (concept hieronder).

### C2: Bladwijzer gebruiken
**Situatie:** de gebruiker klikt op de oude bladwijzer `dev.clubkompas.svn10.nl`.
**Resultaat:** de browser komt vanzelf uit op `clubkompas.svn10.nl` en toont het **inlogscherm**, ook als de gebruiker gisteren nog ingelogd was. Een inlogsessie geldt namelijk per adres.

### C3: Opnieuw inloggen
Dezelfde gegevens als altijd. De wachtwoordmanager vult misschien niet automatisch in, omdat het adres nieuw is. Daarna is alles zoals voorheen: dezelfde club, dezelfde gegevens, geen balk.

### C4: Bladwijzer aanpassen
De gebruiker zet een nieuwe bladwijzer op `clubkompas.svn10.nl`. Na 4 weken werkt de oude niet meer.

### Concept-bericht aan HCA
> **Onderwerp:** clubKOMPAS heeft een nieuw adres
>
> Beste collega's,
>
> Vanaf [datum] staat clubKOMPAS op een nieuw adres:
> **https://clubkompas.svn10.nl**
>
> Wat betekent dit voor jou?
> - Het oude adres (dev.clubkompas.svn10.nl) stuurt je de komende vier weken automatisch door. Na [datum + 4 weken] werkt het niet meer.
> - Je moet **één keer opnieuw inloggen**, met je gewone e-mailadres en wachtwoord. Vult je wachtwoordmanager niets in? Controleer dan eerst dat je op https://clubkompas.svn10.nl bent, en sla het daarna op.
> - Typ het adres zelf in of gebruik je bladwijzer. Ik vraag je nooit om je wachtwoord, niet per mail en niet per telefoon. Het adres eindigt altijd op **svn10.nl**.
> - Pas je bladwijzer aan, of maak een nieuwe.
> - Je gegevens blijven gewoon staan. Er verandert niets aan je clubgegevens, pijlers, domeinen en alles wat je hebt ingevuld.
>
> Lukt inloggen niet of zie je iets vreemds? Laat het me weten.
>
> Groet,
> Paul

---

## Reis D — Foutsituaties en teksten

Zelfde regel als in P0e: zeg **wat er aan de hand is**, **wat er níet gebeurd is** en **wat je nu doet**.

### D1: Testversie met productie-instellingen (online, `test-met-productie`)
**Situatie:** op tst of een andere preview staan in Vercel per ongeluk de productiewaarden met `VITE_OMGEVING=Test`.
**Wat Paul ziet** (pagina in plaats van het inlogscherm, stijl M2, oranje rand):
> **Gestopt: deze testomgeving wijst naar de echte clubdata (svn10-clubkompas).** Er is niets gelezen of opgeslagen.
> Waarschijnlijk staan bij Vercel onder **Preview** nog de productiewaarden.
> Wat te doen: Vercel → Settings → Environment Variables. Zorg dat elke `VITE_FIREBASE_*` onder Preview de waarden van **svn10-clubkompas-test** heeft. Doe daarna een Redeploy van de branch `test`.
> Je wilde de echte clubdata? Ga naar **clubkompas.svn10.nl**.

**`gemengde-config` online:**
> **Gestopt: de instellingen van deze testomgeving zijn onvolledig of passen niet bij elkaar.** Er is niets gelezen of opgeslagen. Controleer in Vercel (Environment Variables, Preview) of alle zes `VITE_FIREBASE_*` gevuld zijn en bij hetzelfde project horen. Doe daarna een Redeploy.

### D2: Inloggen geweigerd op een nieuw adres
**Belangrijk voor de bouw:** inloggen met e-mail en wachtwoord wordt meestal **niet** tegengehouden door een ontbrekend authorized domain. Dat raakt vooral popup/redirect-login en de links in mails (bijv. `auth/unauthorized-continue-uri`). Wat wél gewoon inloggen blokkeert, is een **websitebeperking op de API-key** (Firebase geeft dan een foutcode die begint met `auth/requests-from-referer-`).
Voorstel: vang in het inlogscherm `auth/unauthorized-domain`, `auth/unauthorized-continue-uri` en codes die met `auth/requests-from-referer` beginnen af met één melding in plaats van "wachtwoord klopt niet".

**M16 — Adres niet toegestaan** (onder het inlogformulier, alle omgevingen):
> Inloggen is op dit adres (**[adres]**) nog niet toegestaan. Je gegevens zijn in orde, er is niets gewijzigd. Probeer het later opnieuw of meld het aan de beheerder.
> *(Bij Ontwikkel/Test extra regel:)* Voeg [adres] toe in de Firebase-console van **[projectId]** (Authentication → Settings → Authorized domains) en, als die er is, aan de websitebeperking van de API-key in Google Cloud Console.

Zo krijgt een HCA-gebruiker geen verwijtende melding als het aan de inrichting ligt, en ziet Paul meteen in welk project hij moet zijn.

### D3: tst toont geen balk of de productieversie
| Wat Paul ziet op `tst.` | Waarschijnlijke oorzaak | Wat te doen |
|---|---|---|
| Geen balk, footer "Productie", HCA-account werkt | Domein in Vercel aan **Production** gekoppeld in plaats van Preview/`test` | **Niet verder werken, dit is live.** Domains → `tst.` → Edit → Preview, branch `test`. |
| Geen balk, footer "Productie", HCA-account werkt niet of het blijft leeg | Preview mist `VITE_OMGEVING` en gebruikt nog de productiewaarden (de oude build van vóór A3) | A3 nakijken, Redeploy `test`. |
| Balk "Testomgeving", maar de versie is oud | Nog niet opnieuw gedeployd, of de browser toont een oude versie uit het geheugen | Deployments → `test` → Redeploy. Daarna harde herlaadactie (Cmd+Shift+R). |
| Balk "Ontwikkelomgeving" online | `VITE_OMGEVING=Ontwikkel` staat bij Preview | Wijzig naar `Test`. Onschuldig, wel verwarrend. |
| Vercel-inlogscherm | Deployment Protection (zo gewild) | Inloggen bij Vercel. Een HCA-tester komt hier niet langs tot Protection uit staat. |

**Vuistregel voor Paul:** *zie je op tst geen balk, log dan niet in.*

### D4: Overige
- **"Deze site is niet bereikbaar"** op een nieuw adres: DNS nog niet klaar of verkeerd ingevuld. Controleer met `dig @ns01.hostnet.nl <adres> CNAME +short`.
- **"Je verbinding is niet privé"**: het certificaat wordt nog aangemaakt. Wachten, niet doorklikken.
- **`dev.` stuurt niet door**: na het opslaan van de redirect even wachten en de cache legen. Daarom 307: een fout wordt dan niet permanent onthouden.

---

## Navigatieroute
- **Inrichten:** Hostnet (kijken) → Firebase prod + test: Authorized domains → (Cloud Console: key-beperkingen) → Vercel Domains + Hostnet CNAME `clubkompas` → controle live → Vercel Environment Variables scheiden → Claude: code op `main`, branch `test` → Vercel Domains `tst.` (Preview/`test`) + Hostnet CNAME `tst.clubkompas` → controle tst → bericht HCA → redirect `dev.` → na 4 weken opheffen.
- **Dagelijks:** `npm run dev` (Ontwikkelomgeving) → push `test` → tst (Testomgeving, versie checken) → ff-merge `main` → live (geen balk, zelfde versie).
- **HCA:** oude bladwijzer → doorgestuurd → inlogscherm → zelfde gegevens → nieuwe bladwijzer.

## Pijnpunten en keuzes
- **Twee petrol balken die op elkaar lijken:** het enige verschil zit in het eerste woord. Voorstel: de balk zegt ook wáár, dus "Ontwikkelomgeving · **op deze computer** · project …" en "Testomgeving · **online** · project … · fictieve data". Zet "fictieve data" in beide balken, want beide gebruiken het testproject. Geen nieuwe kleur nodig.
- **Geen balk = live:** de afwezigheid van een balk is het signaal voor live. Dat werkt alleen als Paul het weet. Daarom staat de vuistregel in de README en in D3.
- **Vercel-login voor tst:** voor Paul een extra klik. Voor een toekomstige HCA-tester een muur. Het openzetten moet een bewuste stap zijn (README: "tester toevoegen").
- **Hostnet-interface:** veld voor naam en doel, met of zonder punt. Daarom altijd vergelijken met de bestaande `dev.`-regel en controleren met `dig` rechtstreeks bij Hostnet.
- **Inlogfout op een nieuw adres oogt als een fout wachtwoord:** M16 voorkomt dat HCA-gebruikers hun wachtwoord gaan resetten.
- **Wachtwoordmanager en sessie:** onvermijdelijk. Het bericht aan HCA vangt het op.

## Wat de Ontwerp-medewerker nodig heeft
- **Geen nieuwe schermen.**
- **Balk:** twee petrol-varianten (Ontwikkel, Test) met de bestaande `.omgeving-balk--test`. Het verschil zit in de tekst (zie pijnpunten). De oranje variant en "geen balk" blijven ongewijzigd.
- **Footer en tabtitel:** zie de tabel in reis B.
- **Foutpagina:** de bestaande M2-stijl (oranje rand) met twee nieuwe teksten (D1). Bij voorkeur een link naar `clubkompas.svn10.nl`.
- **Inlogscherm:** melding M16 onder het formulier, op de plek van de bestaande foutmelding, met een extra regel in Ontwikkel/Test. De hint M5 verschijnt nu ook bij Ontwikkel.
