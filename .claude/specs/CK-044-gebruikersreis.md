# Gebruikersreis: CK-044 — Eén navigatie, zijmenu op elke pagina

Fase 2 (ervaring), 22 november 2026 · Spec: `.claude/specs/CK-044-zijmenu.md` · Besluiten: `.claude/specs/CK-044-besluiten.md`

## Gebruiker

Een bestuurder van Hockey Club Alphen, bijvoorbeeld de secretaris (in de voorbeelden "Jan de Vries · beheerder"). Werkt 's avonds op een laptop, tussendoor op een iPad, en kijkt soms snel iets na op de telefoon. Wil weten waar hij is, snel naar Domeinen, Bestuursfuncties of Club, en daarna weer weg. Sommige bestuurders werken met het toetsenbord of met VoiceOver.

## Huidige situatie

Er zijn twee navigaties. Op Home staat alles op volle breedte, met een huisje en "Beheer" in de balk. Op de beheerpagina's staat daarnaast een zijmenu. Mijn account en Uitloggen staan in de footer, dus helemaal onderaan, en op lange pagina's zoals Domeinen ver buiten beeld. Boven de pagina staan twee balken (petrol en wit). Wie wisselt tussen Home en Beheer ziet de pagina telkens anders opgebouwd, en moet steeds opnieuw zoeken waar hij is.

## Vaste teksten en labels

| Element | Zichtbare tekst | Naam voor VoiceOver / tooltip |
|---|---|---|
| Zijmenu (`nav`) | — | "Hoofdmenu" |
| Groepskopjes | Overzicht, Beheer | idem (ook ingeklapt, dan visueel verborgen) |
| Inklapknop (uitgeklapt) | «  (pictogram) | "Menu inklappen" (tooltip idem) |
| Inklapknop (ingeklapt) | »  (pictogram) | "Menu uitklappen" (tooltip idem) |
| Menu-items | Home, Domeinen, Bestuursfuncties, Club | idem; ingeklapt als tooltip en verborgen tekst |
| Accountregel | Jan de Vries · beheerder | "Mijn account, Jan de Vries, beheerder" (zie bijstelling 1); ingeklapt tooltip "Mijn account" |
| Uitlogknop | Uitloggen | "Uitloggen" |
| ☰-knop (mobiel) | ☰ | "Menu openen", plus `aria-expanded` |
| ✕-knop (mobiel, bovenin paneel) | ✕ | "Menu sluiten" |
| Kruimelpad (`nav`) | Home › Beheer › Domeinen | "Kruimelpad"; laatste deel met `aria-current="page"` |
| Overslaglink (zie bijstelling 2) | Direct naar inhoud (alleen zichtbaar bij focus) | idem |

Het actieve item heeft een petrol achtergrond en `aria-current="page"`. VoiceOver zegt dan "huidige pagina".

---

## Reis A: desktop (≥1200px), menu uitgeklapt

### Stap 1: Inloggen
**Situatie:** inlogscherm, geen zijmenu (tussenscherm, ongewijzigd).
**Actie:** Jan logt in met Google.
**Resultaat:** het laadscherm verschijnt en daarna Home.

### Stap 2: Home
**Situatie:** Jan komt voor het eerst in de nieuwe opbouw.
**Wat hij ziet, van boven naar beneden:**
- De omgevingsbalk (alleen op Test/Ontwikkel), helemaal bovenaan.
- De petrol balk met oranje onderrand: kompas en "club**KOMPAS** · Hockey Club Alphen" in wit. Rechts het clublogo (78px), half over de balk en half over de witte pagina.
- Links het zijmenu (172px): bovenaan de inklapknop, dan het kopje **Overzicht** met **Home** (actief, petrol), het kopje **Beheer** met Domeinen, Bestuursfuncties en Club. Onderaan, na een scheidingslijn, "Jan de Vries · beheerder" en **Uitloggen**.
- Rechts van het menu het kruimelpad "Home", met daaronder de inhoud van Home (met de bestaande knop "Beheer →").
- Onderaan de footer: links "clubKOMPAS · een product van SVN10", in het midden omgeving · versie (tooltip met bouwdatum).

**Toetsenbord (Tab):** Direct naar inhoud → Menu inklappen → Home → Domeinen → Bestuursfuncties → Club → Jan de Vries · beheerder → Uitloggen → kruimelpad → inhoud → footer. De balk zelf heeft op desktop niets om op te tabben (☰ is verborgen, het logo is geen link). Elke focus krijgt de oranje focusrand.
**VoiceOver:** bij het zijmenu "Hoofdmenu, navigatie". Bij de groep "Overzicht, lijst, 1 onderdeel", dan "Home, huidige pagina, link". Bij het kruimelpad "Kruimelpad, navigatie, Home, huidige pagina".

### Stap 3: Naar de Beheer-items
**Actie:** Jan klikt op **Domeinen**, daarna op **Bestuursfuncties** en op **Club**.
**Resultaat:** alleen de inhoud wisselt. Balk, logo, zijmenu en footer blijven precies staan. Het actieve item schuift mee (petrol), het kruimelpad wordt "Home › Beheer › Domeinen" (en daarna Bestuursfuncties en Club). "Home" en "Beheer" in het kruimelpad zijn links, Beheer gaat naar Domeinen.
Op de lange Domeinen-pagina scrollt Jan naar beneden. Het zijmenu blijft in beeld (sticky), dus account en Uitloggen blijven bereikbaar.
**Toetsenbord:** na een klik op een item begint de focus weer bovenaan de pagina (zoals nu, buiten scope). Met "Direct naar inhoud" komt hij in één stap bij de nieuwe inhoud.
**Meldingen:** "Opgeslagen" of foutmeldingen (CK-023/CK-025) verschijnen op dezelfde plek in de inhoud als nu.

### Stap 4: Mijn account
**Actie:** Jan klikt onderaan het zijmenu op "Jan de Vries · beheerder".
**Resultaat:** de pagina Mijn account. De accountregel is nu actief (petrol, "huidige pagina"), geen item in Overzicht of Beheer is actief. Het kruimelpad is "Home › Mijn account". Jan past zijn naam aan en klikt op "Naam opslaan". De melding verschijnt en de accountregel in het zijmenu toont meteen de nieuwe naam.

### Stap 5: Uitloggen
**Actie:** Jan klikt onderaan op **Uitloggen**.
**Resultaat:** direct het inlogscherm, met het standaard-favicon. Geen bevestigingsvraag (zie pijnpunt "Uitloggen per ongeluk").

---

## Reis B: desktop, menu ingeklapt

### Stap 1–2: Inloggen en Home
Zoals reis A. Jan klikt op **Menu inklappen**.
**Resultaat:** het zijmenu krimpt tot 44px en toont alleen pictogrammen. De kopjes worden dunne scheidingslijnen. De inhoud krijgt meer ruimte. De knop heet nu **Menu uitklappen**. Na herladen of bij een andere pagina blijft het menu ingeklapt.
**Muis:** bij aanwijzen van een pictogram verschijnt een tooltip ("Home", "Domeinen", "Bestuursfuncties", "Club", "Mijn account", "Uitloggen").
**VoiceOver:** hoort hetzelfde als uitgeklapt: de groepsnamen, "Home, huidige pagina, link". De namen staan als verborgen tekst in het menu, ze komen niet alleen uit de tooltip.
**Toetsenbord:** zelfde volgorde als reis A. Let op: een gewone tooltip (`title`) verschijnt niet bij toetsenbordfocus. Een ziende toetsenbordgebruiker ziet dan alleen een pictogram met focusrand (zie bijstelling 3).

### Stap 3–5: Beheer, Mijn account, Uitloggen
Zoals reis A, maar alleen met pictogrammen. Het actieve pictogram staat op petrol. Account (persoon in cirkel) en Uitloggen (uitgang-pijl) staan onderaan, gescheiden door een lijn.

---

## Reis C: tablet (~768px, iPad staand)

Op 768px is er geen ☰: het gewone zijmenu staat er, in- of uitklapbaar (breekpunt 700px, akkoord Paul).

- **Uitgeklapt:** 172px menu, ca. 596px inhoud. Het logo staat rechts. De titel "clubKOMPAS · Hockey Club Alphen" moet links van het logo passen, het kruimelpad houdt rechts ruimte vrij.
- **Ingeklapt:** 44px menu, ruim voldoende inhoud.
- **Aanraken:** op een iPad zijn er geen tooltips. Ingeklapt moet Jan de pictogrammen dus herkennen. Advies: de standaard (eerste keer) is uitgeklapt. Wie inklapt, kiest daar zelf voor.
- **VoiceOver (iPad):** vegen gaat in dezelfde volgorde als Tab in reis A. Aankondigingen zijn gelijk.

De reis (inloggen → Home → Domeinen/Bestuursfuncties/Club → Mijn account → Uitloggen) is verder gelijk aan reis A of B.

---

## Reis D: telefoon (≤700px), uitschuifpaneel

### Stap 1: Inloggen
Zoals reis A.

### Stap 2: Home
**Wat hij ziet:** omgevingsbalk (indien van toepassing), daaronder de petrol balk met links **☰**, dan kompas en titel (een te lange clubnaam wordt afgekapt met "…"), rechts een klein logo (ca. 36px) binnen de balk. Geen zijmenu in beeld. Daaronder het kruimelpad "Home" en de inhoud over de volle breedte.
**VoiceOver:** "Menu openen, knop, ingevouwen".

### Stap 3: Menu openen en naar Beheer
**Actie:** Jan tikt op ☰.
**Resultaat:** het paneel (ca. 260px) schuift van links in, onder de omgevingsbalk (die blijft zichtbaar). De rest wordt gedimd. Bovenin het paneel staat **✕**, daaronder Overzicht/Home, Beheer met de drie items, en onderaan de accountregel en Uitloggen. Het paneel is altijd uitgeklapt, er is geen inklapknop. De pagina erachter scrollt niet mee.
**Focus en VoiceOver:** de focus springt naar ✕: "Hoofdmenu, navigatie, Menu sluiten, knop". Vegen of Tab blijft in het paneel, de pagina erachter is onbereikbaar. Na het laatste item (Uitloggen) gaat Tab niet de pagina in.
**Actie:** Jan tikt op **Domeinen**.
**Resultaat:** het paneel gaat dicht, Domeinen opent, de pagina is weer scrollbaar, het kruimelpad is "Home › Beheer › Domeinen".

### Stap 4: Paneel sluiten zonder te kiezen
**Actie:** Jan opent het paneel en bedenkt zich. Hij tikt op ✕, tikt naast het paneel op de gedimde achtergrond, of drukt op Esc (toetsenbord).
**Resultaat:** het paneel schuift weg, de focus staat weer op ☰. VoiceOver: "Menu openen, knop, ingevouwen".

### Stap 5: Mijn account en Uitloggen
Via ☰ → accountregel opent Mijn account (paneel dicht). Via ☰ → **Uitloggen** gaat hij direct naar het inlogscherm. Het paneel, de dimming en de scroll-blokkade zijn daarna weg.

### Stap 6: Telefoon draaien
Een open paneel bij draaien naar liggend (>700px) gaat vanzelf dicht. Het gewone zijmenu verschijnt.

---

## Navigatieroute

Inlogscherm → inloggen → **Home** (zijmenu: Home actief) → Domeinen / Bestuursfuncties / Club (Beheer-item actief, kruimelpad loopt mee) → accountregel → **Mijn account** (accountregel actief) → Uitloggen → Inlogscherm.
Telefoon: dezelfde route, elke stap via ☰ → item (paneel sluit zelf).

## Pijnpunten en keuzes

- **Logo over de titel:** op 768px met een lange clubnaam en een breed logo kan de titel onder het logo lopen. *Oplossing:* `--logo-ruimte` als rechter-padding op balk en kruimelpad (alleen als er een logo is), en de titel op **alle** breedtes afkappen met "…", niet alleen op mobiel. Het logo krijgt `alt=""`: de clubnaam staat al in de titel, anders hoort VoiceOver de club twee keer.
- **Logo over het kruimelpad:** het logo steekt ca. 39px de pagina in. Een lang kruimelpad mag er niet onder verdwijnen, de ruimte rechts lost dat op. Controleren met "Home › Beheer › Bestuursfuncties" op 768px, uitgeklapt.
- **Uitloggen per ongeluk:** *Advies: geen bevestigingsvraag.* Uitloggen verwijdert niets, en opnieuw inloggen kost twee tikken. Een "Weet je het zeker?" bij elke keer uitloggen went snel en wordt dan blind weggeklikt, terwijl bevestigingen in clubKOMPAS bedoeld zijn voor echt destructieve acties. Wel nodig:
  - Uitloggen staat apart onderaan, met een scheidingslijn boven het accountblok, en niet direct naast een veelgebruikt item.
  - Het is een knop met de tekst "Uitloggen" en een eigen pictogram (uitgang-pijl), ingeklapt met tooltip.
  - Op de telefoon voldoende tikruimte (minstens 44px hoog) tussen accountregel en Uitloggen.
  - Restrisico: niet-opgeslagen invoer (bijv. een half ingevuld Club-formulier) gaat verloren. Dat geldt nu ook voor elk menu-item. Een waarschuwing bij onopgeslagen wijzigingen is een aparte, latere story (geldt voor alle navigatie, niet alleen uitloggen).
- **Steeds opnieuw door het menu tabben:** met het zijmenu op elke pagina moet een toetsenbordgebruiker na elke paginawissel 7 tabstops door. *Oplossing:* een overslaglink "Direct naar inhoud" (bijstelling 2).
- **Ingeklapt en toetsenbord of aanraken:** de tooltip werkt alleen met de muis. *Oplossing:* bijstelling 3. Op de tablet is de standaard uitgeklapt.
- **Focus na paginawissel:** blijft zoals nu (focus bovenaan, buiten scope). VoiceOver-gebruikers krijgen geen aankondiging van de nieuwe pagina. De overslaglink beperkt het ongemak. Een latere story kan de focus naar de paginakop zetten.
- **Twee wegen naar Beheer op Home:** de knop "Beheer →" en de groep Beheer in het zijmenu. Dat is niet erg (actiegericht op Home), wel om in de gaten te houden.
- **Wie ben ik ingelogd?** De naam staat niet meer in de footer maar onderaan het zijmenu, en blijft dankzij sticky altijd zichtbaar (uitgeklapt). Ingeklapt alleen het pictogram met tooltip "Mijn account".

## Bijstellingen voor de spec (voorstel)

1. **Toegankelijke naam accountregel:** zichtbaar "Jan de Vries · beheerder", met verborgen voorvoegsel "Mijn account, " (sr-only). VoiceOver zegt dan "Mijn account, Jan de Vries · beheerder, link", in plaats van alleen een naam waarvan niet duidelijk is waar die heen gaat. Tooltip ingeklapt: "Mijn account".
2. **Overslaglink "Direct naar inhoud":** eerste element in de shell, alleen zichtbaar bij focus, springt naar `main` (`id="inhoud"`, `tabindex="-1"`). Klein, maar nodig nu het menu op elke pagina staat.
3. **Tooltip ingeklapt ook bij focus:** naast `title` een CSS-label dat verschijnt bij `:hover` én `:focus-visible` (of `title` vervangen door dat label, zodat VoiceOver de naam niet dubbel hoort). Anders voldoet "elk pictogram een tooltip" niet voor toetsenbordgebruikers.
4. **Inklapknop:** `aria-label` wisselt tussen "Menu inklappen" en "Menu uitklappen" (tooltip idem). Geen `aria-expanded` erop: de items blijven bereikbaar, alleen de breedte verandert.
5. **☰-knop:** label altijd "Menu openen", met `aria-expanded` false/true. Als het paneel open is, is ☰ toch onbereikbaar (inert). Focus bij openen naar ✕ "Menu sluiten" (de keuze tussen "eerste item of ✕" in de spec vastleggen op ✕).
6. **Kruimelpad:** `nav aria-label="Kruimelpad"` en `aria-current="page"` op het laatste deel (toevoegen aan de acceptatiecriteria als dat nu nog niet zo is).
7. **Titel afkappen op alle breedtes** en `alt=""` op het clublogo (zie pijnpunt logo).
8. **Uitloggen zonder bevestiging** expliciet in de spec opnemen, met scheidingslijn en tikruimte als eis.
9. **Standaard uitgeklapt** zolang `zijmenu-ingeklapt` nog niet bestaat (waarschijnlijk al zo, wel vastleggen).

## Wat de Ontwerp-medewerker nodig heeft

- **Schermen:** Home, Domeinen (lang, met sticky menu), Bestuursfuncties, Club, Mijn account, elk op desktop uitgeklapt, desktop ingeklapt, 768px uitgeklapt en 400px met paneel dicht en open. Ook een variant met omgevingsbalk, met een lange clubnaam en met een breed logo, en een variant zonder logo.
- **Interacties per scherm:** inklappen/uitklappen (pictogram « / »), item kiezen, accountregel, Uitloggen; mobiel ☰, ✕, tik op de achtergrond, Esc.
- **Toestanden om te tekenen:** actief item (petrol), hover, focus (oranje rand), ingeklapte tooltip (ook bij focus), groepskopje uitgeklapt en ingeklapt (scheidingslijn), scheidingslijn boven het accountblok, gedimde achtergrond achter het paneel, overslaglink bij focus.
- **Feedback:** het actieve item en het kruimelpad lopen mee bij elke wissel. De accountregel werkt direct bij na "Naam opslaan". CK-023-meldingen op dezelfde plek. Na uitloggen het inlogscherm.
- **Pictogrammen:** nieuw "account" (persoon in cirkel) en "uitloggen" (uitgang-pijl), lijnstijl 48×48, lijn 3. "huis" in lijnstijl. Bestuursfuncties houdt "persoon".
