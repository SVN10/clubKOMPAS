# CK-041 Commissies: gecombineerde controle (test, huisstijl, toegankelijkheid)

## Uitvoering
- `npm run build`: geslaagd (alleen de bekende chunk-grootte-waarschuwing).
- `npm run test:regels`: 100/100 geslaagd.

## Besluiten 3-8
- 3 Zijmenu: Club, Bestuursfuncties, Commissies, Domeinen, Vermogens, Projecten, Samenwerkingen (main.js 1212-1219), NAV_DOEL aanwezig (1233). OK.
- 4/5 Velden naam, omschrijving, eigenaar, volgorde; geen status, periode of koppeling. Regels hergebruiken `geldigeSamenwerking`; tests weigeren extra velden. OK.
- 6 Geen personen of leden in model of regels. OK.
- 7 Alleen Beheer: `PLAAT_SOORTEN` (opPlaat) filtert renderPlaat, laadEnTeken en kerncijfers. Plaat-hint verdwijnt via `!cfg.opPlaat` (2510). Bevat 'commissies' wordt door de regels geweigerd (test). OK.
- 8 Bestuursfuncties: laadVerwijzers en telling lopen over `SOORT_ONDERDEEL` (dus incl. commissies); kolom, blokkade, ONVOLLEDIG-tekst en verwijdermelding noemen commissies. Volgorde laden en tellen is gelijk. OK.
- Foutcodes `dubbele-commissie` en `commissie-weg` hebben tekst (main.js 331-332); `commissie-weg` staat in WEG_CODES. OK.

## Inrichtscript
- onderdelen-hca.mjs loopt nu over `PLAAT_SOORTEN`: alleen projecten en samenwerkingen. OK (bestaande plan-tests slagen).

## Huisstijl en toegankelijkheid
- Kolomkop "Commissie" via `cfg.Enkel`; tabel `aria-label="Commissies"`; kolom Acties met sr-only. OK.
- Lege staat: "Nog geen commissies" met uitleg uit `cfg.uitleg`, zelfde patroon als de andere soorten. OK.
- Icoon `groep`: viewBox 48, lijnen zonder vulling, in dezelfde stroke-stijl als `persoon`; drie figuren zonder overlap. OK.
- Huisregels CK-046 19-38: rijnummers, aanpassing met pijlen (aria-label "<naam> omhoog/omlaag"), eigenaar met sr-only "nog niet gekozen", geen filter (cfg.status false), unieke naam via dubbelCode. Hergebruikt dezelfde code, geen afwijkingen gevonden.
- Rij gebruikt `samenwerking-rij` (grid 4 kolommen, responsief): past bij 3 kolommen + acties. OK.

## Te herstellen (klein)
1. src/main.js, regel 2492 (`testHint`): de tekst staat tussen enkele aanhalingstekens, dus `${cfg.meer}` wordt niet ingevuld en de testomgeving toont letterlijk "voor ${cfg.meer} al gepubliceerd". Maak er een template string (backticks) van, of laat de oude tekst staan. Dit raakt ook Projecten en Samenwerkingen.

## Niet getest
- Visueel gedrag in de browser en schermlezer (afgesproken: geen browser).

## Eindoordeel
Klaar voor beoordelaar, na herstel van punt 1 (cosmetisch, alleen op test/ontwikkel bij permission-denied).
