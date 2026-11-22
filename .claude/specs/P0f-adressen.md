# Specificatie: P0f — Eigen adressen voor live en online test

Bron: backlog P0f, besluiten Paul 22 november 2026. Bouwt voort op P0e (`P0e-testomgeving.md`, `P0e-ontwerp.md`, `.claude/docs/P0e-technisch.md`).

## 1. Doel en afbakening

**Doel:** aan het adres en de balk zie je welke omgeving en welk Firebase-project erachter zit. Niemand test op live of werkt per ongeluk op test.

| Omgeving | Adres | Vercel | Firebase-project | Label (footer) | Balk |
|---|---|---|---|---|---|
| Ontwikkel | `localhost:5173` (`npm run dev`) | – | `svn10-clubkompas-test` | `Ontwikkel · Versie …` | "Ontwikkelomgeving · project svn10-clubkompas-test" |
| Test (online) | `tst.clubkompas.svn10.nl` | Preview, branch `test` | `svn10-clubkompas-test` | `Test · Versie …` | "Testomgeving · project svn10-clubkompas-test · fictieve data" |
| Productie | `clubkompas.svn10.nl` | Production, branch `main` | `svn10-clubkompas` | `Productie · Versie …` | geen |
| (oud) | `dev.clubkompas.svn10.nl` | tijdelijke doorsturing naar live | – | – | – |

`npm run dev:productie` blijft zoals het is (oranje balk "Let op: echte clubdata").

**Binnen scope:** omgevingsbepaling in de app, extra veiligheidsslot voor online builds, `.env.test.local.voorbeeld`, README/technische documentatie, handmatige stappen in Vercel, DNS en Firebase.
**Buiten scope:** een eigen ontwikkelproject of de emulator, Vercel Pro (custom environments), wijzigingen aan scripts, Firestore-regels, data.

## 2. Codewijzigingen

### 2.1 Eén bron voor de omgeving

Verplaats de bepaling van `OMGEVING`, `SOORT` en `OMGEVING_LABEL` van `src/main.js` naar `src/firebase.js` (exporteren), zodat de veiligheidscontrole (`configFout`) en de weergave dezelfde waarde gebruiken. `main.js` importeert ze.

Nieuwe regel: **lokaal (DEV) bepaalt de Vite-modus, online (build) bepaalt `VITE_OMGEVING`.** Zo hoeft Paul lokaal niets te wijzigen en kan een variabele in Vercel nooit een lokale app een verkeerd label geven.

| SOORT | Wanneer (in deze volgorde) | Balk | Footer | Tabtitel |
|---|---|---|---|---|
| `productie-lokaal` | DEV en modus `productie` | oranje, ongewijzigd | `Productie (lokaal)` | ongewijzigd |
| `ontwikkel` | DEV (elke andere modus) | petrol: **Ontwikkelomgeving** · project `<projectId>` | `Ontwikkel · Versie …` | `ONTWIKKEL · clubKOMPAS` |
| `test` | build en `VITE_OMGEVING` = test | petrol: **Testomgeving** · project `<projectId>` · fictieve data | `Test · Versie …` | `TEST · clubKOMPAS` |
| `productie` | build en `VITE_OMGEVING` = productie | geen | `Productie · Versie …` | ongewijzigd |
| `ontwikkel` | build en `VITE_OMGEVING` = ontwikkel (lokale `npx vite build --mode test`) | als ontwikkel | als ontwikkel | als ontwikkel |
| terugval | build, `VITE_OMGEVING` leeg of onbekend | project = productie: als `productie` (plus `console.warn`); anders: als `test` | idem | idem |

Vergelijkingen blijven hoofdletterongevoelig voor het label en exact (`===`) voor project-ID's. Principe: **elke build die niet naar het productieproject wijst, toont een balk.**

Overal waar nu `SOORT === 'test'` staat voor hints en projectvermelding (hint M5 op het inlogscherm, hint M6 bij "Geen club gekoppeld", `toonProject` in de footer): ook `ontwikkel` meenemen, want lokaal en tst delen het testproject. `toonOmgevingsBalk()` krijgt de derde variant; CSS hergebruikt `.omgeving-balk--test` (geen nieuwe kleur; onderscheid zit in de tekst). Eventuele vormkeuze is aan de Ervaring-medewerker.

### 2.2 Vercel-omgeving meegeven

`vite.config.js`: extra `define` `__VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV || '')`. Vercel zet `VERCEL_ENV` tijdens de build op `production`, `preview` of `development`; lokaal is het leeg. Dit is geen `VITE_`-variabele en kan dus niet per ongeluk in het dashboard worden overschreven.

### 2.3 Beveiliging in `src/firebase.js`

Nieuwe `configFout`-variant, alleen buiten Vercel Production:

| Waarde | Wanneer | Gevolg |
|---|---|---|
| `test-met-productie` | `!DEV`, `__VERCEL_ENV__ !== 'production'`, SOORT `test` of `ontwikkel`, en `projectId === PRODUCTIE_PROJECT_ID` | Firebase start niet; foutpagina (stijl M2, oranje rand): "Gestopt: deze testomgeving wijst naar de echte clubdata. Er is niets gelezen of opgeslagen." Stap: Preview-variabelen in Vercel nakijken. |
| `gemengde-config` (uitbreiding) | ook bij `!DEV` en `__VERCEL_ENV__ !== 'production'`: een van de zes waarden leeg of `authDomain` begint niet met `${projectId}.` | zoals nu, met een tekst voor online in plaats van `.env.test.local` |

**Live mag nooit breken:** bij `__VERCEL_ENV__ === 'production'` geldt geen enkele nieuwe stop. Wijkt daar iets af (label niet `Productie`, of project niet `svn10-clubkompas`), dan alleen `console.warn`; een testproject op live krijgt via de terugvalregel vanzelf een zichtbare balk. `geen-config` blijft zoals het is.

De `__MODUS_SLEUTELS__`-controle blijft alleen voor DEV (in Vercel bestaan geen modusbestanden).

### 2.4 `.env`-bestanden en scripts

- `.env.test.local.voorbeeld`: laatste regel wordt `VITE_OMGEVING=Ontwikkel`, met een kopregel dat lokaal altijd "Ontwikkel" toont. `controleerVoorbeeld` negeert `VITE_OMGEVING` al; geen scriptwijziging.
- Pauls eigen `.env.test.local`: `VITE_OMGEVING=Test` mag blijven staan (lokaal wint DEV). Advies in de README: wijzig naar `Ontwikkel`, zodat ook een lokale `npx vite build --mode test` "Ontwikkel" toont.
- `.env.productie.local`, `package.json`-scripts en `scripts/` blijven ongewijzigd.

### 2.5 Documentatie

- `README.md` → "Omgevingen": tabel met drie omgevingen en adressen, "Dagelijks gebruik" (balk heet nu "Ontwikkelomgeving"), stap 8 tekst, stap 10 vervangen door verwijzing naar P0f, nieuw kopje "Online test en werkwijze branch `test`".
- `.claude/docs/P0e-technisch.md` → SOORT-tabel en configFout-tabel bijwerken (of `P0f-technisch.md`), backlogpunt "Vercel Preview" afvinken.
- `CHANGELOG.md` en backlog.

## 3. Handmatige stappen voor Paul

Volgorde is zo gekozen dat live (nu op `dev.`) blijft werken tot het nieuwe adres bewezen werkt. Kijk bij elke stap eerst welk project/omgeving open staat.

**Stap 0 — Voorbereiden (5 min, geen effect op live)**
- Zoek de DNS-beheerder van svn10.nl: terminal `dig NS svn10.nl +short` (of via een whois-site). De naamservers vertellen bij welke partij je moet inloggen (bijv. TransIP, Cloudflare, Vimexx). Kijk daar of `dev.clubkompas` al als CNAME staat; dan weet je hoe het eruitziet.
- Vercel → project → **Settings → Environment Variables**: maak een schermafdruk van de huidige stand (terugvaloptie).

**Stap 1 — Firebase Authorized domains (geen effect op live)**
- Console, project **`svn10-clubkompas`** → Authentication → Settings → **Authorized domains** → Add domain → `clubkompas.svn10.nl`. Laat `dev.clubkompas.svn10.nl` voorlopig staan.
- Console, project **`svn10-clubkompas-test`** → idem → `tst.clubkompas.svn10.nl`.
- Controle: beide lijsten tonen het nieuwe domein onder het juiste project.

**Stap 2 — Live-domein toevoegen (dev blijft werken)**
- Vercel → project → **Settings → Domains** → Add → `clubkompas.svn10.nl` → omgeving **Production**. Vercel toont een DNS-record (CNAME, waarde bijv. `cname.vercel-dns.com` of een projectspecifieke `…vercel-dns-0xx.com`). Gebruik exact wat Vercel toont.
- Bij de DNS-beheerder: nieuw record, type **CNAME**, naam `clubkompas`, waarde zoals Vercel aangeeft. TTL mag laag (bijv. 300 s).
- Wacht tot Vercel "Valid Configuration" en een certificaat toont (minuten, soms langer).
- Controle: `https://clubkompas.svn10.nl` laadt, geen balk, footer "Productie · Versie 0.4.x", inloggen met je eigen account lukt, HCA-data zichtbaar. `dev.` werkt nog.

**Stap 3 — Code en branch `test` (Claude op verzoek)**
- Claude bouwt de codewijzigingen van §2 op `main`, laat ze controleren, en maakt daarna de branch `test` vanaf `main` en pusht die. Vercel bouwt `test` als Preview, nog met de oude (productie)waarden. Het nieuwe slot `test-met-productie` grijpt dan nog niet in, omdat Preview nog geen `VITE_OMGEVING` heeft (terugval: project productie → gedrag als productie). Open die preview-URL dus niet om te werken.
- Merge naar `main` deployt naar live. Controle na deploy: live onveranderd (geen balk, footer "Productie").

**Stap 4 — Environment Variables scheiden**
In Vercel → Settings → Environment Variables:
- Bij elk van de zes `VITE_FIREBASE_*`: **Edit** → vink **Preview** (en Development) **uit**, alleen **Production** blijft. Waarden niet wijzigen.
- Voeg de zes `VITE_FIREBASE_*` opnieuw toe met de waarden van **`svn10-clubkompas-test`** (dezelfde als in je `.env.test.local`), alleen **Preview**, voor **alle Preview-branches** (niet alleen `test`; zie open vraag 2).
- Voeg `VITE_OMGEVING=Test` toe, alleen **Preview**.
- `VITE_OMGEVING=Productie` blijft alleen **Production**.
- Controle: de lijst toont elke sleutel twee keer: één regel "Production" (productiewaarden), één regel "Preview" (testwaarden). Nergens Production én Preview op dezelfde regel.
- Deployments → laatste deploy van `test` → **Redeploy** (variabelen gelden pas na een nieuwe build). Production niet opnieuw deployen.

**Stap 5 — Testdomein koppelen**
- Settings → Domains → Add → `tst.clubkompas.svn10.nl` → **Preview** → Git branch **`test`**.
- DNS: CNAME, naam `tst.clubkompas`, waarde zoals Vercel aangeeft.
- **Deployment Protection**: Settings → Deployment Protection. Staat "Vercel Authentication" aan (standaard voor previews), dan vraagt `tst.` eerst om een Vercel-login. Zie open vraag 3.
- Controle: `https://tst.clubkompas.svn10.nl` → petrol balk "Testomgeving · project svn10-clubkompas-test", footer "Test · Versie …", inloggen met `test-beheerder@svn10.nl` → "Testclub clubKOMPAS". Je eigen HCA-account moet hier **niet** werken (bestaat niet in test).

**Stap 6 — `dev.` doorsturen**
- Pas nu, nadat stap 2 en 5 werken. Laat HCA vooraf weten: nieuw adres, bladwijzer aanpassen, één keer opnieuw inloggen.
- Settings → Domains → `dev.clubkompas.svn10.nl` → Edit → **Redirect to** `clubkompas.svn10.nl`, statuscode **307 (tijdelijk)**. Tijdelijk, zodat browsers het niet permanent onthouden als `dev.` later een andere rol krijgt.
- Controle: `https://dev.clubkompas.svn10.nl` komt uit op `https://clubkompas.svn10.nl`, ook met een pad of `#…` erachter.

**Stap 7 — Opheffen (na afgesproken termijn, bijv. 4 weken)**
- Vercel: domein `dev.clubkompas.svn10.nl` verwijderen. DNS: CNAME `dev.clubkompas` verwijderen. Firebase productie: `dev.clubkompas.svn10.nl` uit Authorized domains halen.

**Lokaal (geen Vercel):** `npm run dev` → balk "Ontwikkelomgeving · project svn10-clubkompas-test", footer "Ontwikkel · Versie …". Optioneel: in `.env.test.local` `VITE_OMGEVING=Ontwikkel` zetten.

### Werkwijze branch `test` — aanbeveling

**Code gaat eerst naar `test`, daarna naar `main`.** Werk op `test` (of een kortlevende featurebranch die in `test` wordt gemerged), push, controleer op `tst.clubkompas.svn10.nl`, en zet het dan live met een fast-forward:

```
git checkout main && git merge --ff-only test && git push
```

Een spoedfix direct op `main` wordt daarna teruggemerged in `test` (`git checkout test && git merge main`). Zo is wat live staat altijd eerst online getest, en loopt `test` nooit achter op `main`. Claude merget en pusht alleen op verzoek. De andersom-variant (main → test) maakt tst een kopie van live achteraf en voegt niets toe.

Let op: Firestore-regels staan niet in Vercel; die blijven via `npm run regels:test` en daarna `regels:productie` gaan (P0e).

## 4. Acceptatiecriteria

- [ ] `https://clubkompas.svn10.nl` toont de live app (`svn10-clubkompas`), zonder balk, footer "Productie · Versie …"; inloggen met een bestaand HCA-account werkt.
- [ ] `https://tst.clubkompas.svn10.nl` volgt branch `test`, praat met `svn10-clubkompas-test` en toont de balk "Testomgeving · project svn10-clubkompas-test" en footer "Test · Versie …".
- [ ] `npm run dev` toont de balk "Ontwikkelomgeving · project svn10-clubkompas-test" en footer "Ontwikkel · Versie …", ongeacht `VITE_OMGEVING` in `.env.test.local`.
- [ ] Een niet-productiebuild (Preview of lokaal) met testlabel en productie-projectId start Firebase niet en toont "Gestopt"; een Production-build start altijd, ook met een afwijkend label of ontbrekende variabele (aangetoond met nep-env, zie P0e-aanpak).
- [ ] In Vercel staan de zes `VITE_FIREBASE_*` per omgeving gescheiden (Production = productie, Preview = test); `VITE_OMGEVING` is `Productie` op Production en `Test` op Preview.
- [ ] Authorized domains: `clubkompas.svn10.nl` in `svn10-clubkompas`, `tst.clubkompas.svn10.nl` in `svn10-clubkompas-test`.
- [ ] `dev.clubkompas.svn10.nl` stuurt door (307) naar `clubkompas.svn10.nl`; de opheffingsdatum staat in de backlog.

## Wat mag er niet kapotgaan?

- Live voor HCA: tijdens de hele overgang is minstens één werkend adres beschikbaar.
- `npm run dev:productie` (oranje balk, `productie-lokaal`) en alle P0e-sloten (`productie-lokaal`, `gemengde-config` lokaal, `__MODUS_SLEUTELS__`).
- Scripts en `regels:*` (lezen `.env.<omgeving>.local`, niet Vite).
- Exacte project-ID-vergelijkingen (test-ID begint met de productie-ID).

## Architectuurlaag

Platform (P0) — omgevingen, hosting en authenticatie gelden voor alle clubs/tenants.

## 5. Risico's

- **Inloggen faalt op een nieuw domein.** Ontbreekt het domein in Authorized domains, dan werken popup/redirect-login en links in wachtwoordmails niet. Heeft de API-key in Google Cloud Console (APIs & Services → Credentials) **HTTP-referrerbeperkingen**, dan faalt ook gewoon inloggen. Controle in stap 1: staan er referrers, voeg dan `clubkompas.svn10.nl/*` en `tst.clubkompas.svn10.nl/*` toe aan de key van het juiste project.
- **Sessies zijn per adres.** Wie via `dev.` was ingelogd, moet op het nieuwe adres opnieuw inloggen; wachtwoordmanagers kennen het nieuwe adres nog niet. HCA vooraf informeren.
- **HCA-bladwijzers en gedeelde links** naar `dev.` breken na opheffing. Doorsturing ruim laten staan; daarna pas weghalen.
- **Cache:** browsers houden de oude `index.html`/bundel soms vast; na de omzetting een harde herlaadactie. Een 308/301 wordt lang onthouden, daarom 307.
- **Vercel Hobby:** branch-domeinen en branch-specifieke Preview-variabelen zijn toegestaan (max. 50 domeinen per project); custom environments niet. Hobby is volgens de voorwaarden voor **niet-commercieel** gebruik; voor een product van SVN10 met clubs als klant kan Pro nodig worden (zie open vraag 4).
- **Preview met productiewaarden** tot stap 4 klaar is: elke preview-deploy (ook de nieuwe branch `test`) praat dan met de echte data. Stap 3 en 4 kort na elkaar doen.
- **Deployment Protection** op Preview kan `tst.` achter een Vercel-login zetten; testers zonder Vercel-account komen er dan niet in.
- **DNS-propagatie en certificaat** kunnen even duren; daarom pas doorsturen als het nieuwe adres groen is.
- **Vergeten redeploy:** variabelen gelden pas na een nieuwe build; zonder redeploy toont `tst.` nog productie. Het slot `test-met-productie` vangt dit af zodra `VITE_OMGEVING=Test` er staat.

## 6. Open vragen voor Paul

1. **Wie doet de DNS en bij welke partij?** Advies: draai `dig NS svn10.nl +short`; heb je geen toegang tot die partij, regel dat eerst, want stap 2 en 5 hangen ervan af.
2. **Testwaarden voor alle Preview-branches of alleen voor `test`?** Advies: alle Preview-branches. Dan praat geen enkele preview ooit met productie; met alleen `test` blijven andere branches op productiewaarden.
3. **Moet `tst.` openbaar bereikbaar zijn of achter een Vercel-login?** Advies: voorlopig achter Vercel Authentication laten (alleen jij test), uitzetten zodra een HCA-tester mee moet kijken; de data is fictief, dus openbaar is aanvaardbaar.
4. **Hoe lang blijft `dev.` doorsturen, en blijft het Hobby-plan?** Advies: 4 weken na de mail aan HCA, dan opheffen (stap 7). Hobby volstaat technisch; besluit vóór een tweede club of betaalde afspraak of je naar Pro gaat vanwege de niet-commercieel-voorwaarde.

## Antwoorden van Paul (22 november 2026)
1. DNS van svn10.nl: **Hostnet** (ns01/ns02.hostnet.nl, vastgesteld met `dig`). `dev.clubkompas.svn10.nl` is nu een CNAME naar Vercel; `clubkompas.svn10.nl` bestaat nog niet. Paul regelt zijn Hostnet-inlog.
2. Testwaarden voor **alle** Preview-branches. **Akkoord.**
3. `tst.` voorlopig **achter de Vercel-login** (Deployment Protection); openzetten zodra een HCA-tester meekijkt. **Akkoord.**
4. `dev.` **4 weken** doorsturen na bericht aan HCA; Hobby-plan voorlopig, vóór een tweede club of betaalde afspraak beslissen over Pro. **Akkoord.**

## Bijstellingen na de gebruikersreis (22 november 2026)
Overgenomen uit `.claude/specs/P0f-gebruikersreis.md`:
1. **Volgorde:** eerst de Vercel-variabelen scheiden (Preview = test), pas daarna de branch `test` pushen. Geen periode meer waarin een preview productiewaarden gebruikt; geen redeploy nodig.
2. **Risico inloggen preciezer:** e-mail/wachtwoord wordt meestal niet geblokkeerd door een ontbrekend authorized domain; wel door een websitebeperking op de API-key (`auth/requests-from-referer-*`). Het inlogscherm vangt `auth/unauthorized-domain`, `auth/unauthorized-continue-uri` en `auth/requests-from-referer*` af met melding **M16** in plaats van "wachtwoord klopt niet".
3. **Stap 0:** DNS bij Hostnet staat vast; vergelijk met de bestaande regel `dev.clubkompas` en controleer met `dig @ns01.hostnet.nl <adres> CNAME +short`.
4. **Balkteksten:** "Ontwikkelomgeving · op deze computer · project … · fictieve data" en "Testomgeving · online · project … · fictieve data". Geen nieuwe kleur.
5. **Hints M5 en M16** ook in Ontwikkel (zelfde testproject).

## Bijstelling na de kwaliteitscontroles (22 november 2026)
- **Stap 7 (dev. opheffen) omgedraaid:** eerst de CNAME bij Hostnet verwijderen en met `dig @ns01.hostnet.nl dev.clubkompas.svn10.nl CNAME +short` controleren dat de uitvoer leeg is; daarna pas het domein in Vercel, het authorized domain in Firebase en eventueel de API-keybeperking. De README volgt deze volgorde.
- **Preview naar het productieproject stopt altijd** (`test-met-productie`), ongeacht het label; alleen `VERCEL_ENV=production` mag het productieproject gebruiken.
