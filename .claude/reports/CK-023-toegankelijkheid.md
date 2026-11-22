# Toegankelijkheidsrapport: CK-023 + CK-025 Meldingen bij opslaan

Fase 5e, 22 november 2026. Statische analyse van `git diff src/main.js src/style.css` en het ontwerp, plus contrastberekening. Niet in een browser of met een schermlezer getest. (Rapport door de hoofdsessie vastgelegd namens de toegankelijkheid-medewerker.)

## Bevindingen

1. **Focus raakt zoek bij Verwijderen/bewerken terwijl het toevoegformulier openstaat** — Aandacht, WCAG 2.4.3. `+ Toevoegen` is dan `hidden`; focus herstellen daarop valt naar `<body>`. Locaties: `src/main.js` ~1141–1248 (Domeinen), ~1371–1443 (Bestuursfuncties); `hidden` op ~1068 en ~1346. Aanbeveling: terugval op een zichtbaar element (eerste veld van het open formulier, of sectiekop met `tabindex="-1"`). **Vóór oplevering oplossen.**
2. **Geen statusmelding bij ↑/↓ voor schermlezers** — Aandacht, WCAG 4.1.3. Aanbeveling: visueel verborgen `role="status"` (bijv. "Domein Jeugd staat nu op plaats 2 van 5."), vanaf het tekenen aanwezig.
3. **Verouderde `aria-invalid`/rode rand en inconsistente clientvalidatie** — Aandacht, WCAG 3.3.1. Locaties ~1682–1688, ~1744–1746, ~1357. Aanbeveling: helpers `zetVeldFout`/`wisVeldFout` die tekst, `.fout`, `aria-invalid` en focus samen zetten; wissen vóór validatie.
4. Overige velden met foutspan zonder `aria-describedby` (`structuur-naam`, `profiel-naam`, `profiel-afkorting`, `geb-naam`) — Suggestie, apart ticket.
5. `opacity: .6` op bezige knop dimt ook de focusring — Suggestie, WCAG 2.4.7. Aanbeveling: `.btn:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; }`.
6. Foutmelding zonder kleurloos kenmerk naast de balk — Suggestie, WCAG 1.4.1 (voldaan). Optioneel ✕ met `aria-hidden`.

## In orde
Live regions vanaf het tekenen aanwezig (niet verborgen); vinkje `aria-hidden`, tekst als tekstnode; `aria-disabled` met focusbehoud en vroege return in alle handlers; `aria-busy` op lijsten; focus na opslaan en opnieuw tekenen (behalve bevinding 1); veldfouten bij serverfouten met `aria-describedby`, `aria-invalid` en focus; knop "Opnieuw inloggen" als echte button; logoknop als echte button; geen timer (2.2.1).

## Contrast (berekend)
| Combinatie | Licht | Donker |
|---|---|---|
| `--fout` op `--surface` | 5,00:1 | 7,27:1 |
| `--fout` op `--card` | 5,44:1 | 6,48:1 |
| succes-petrol op `--surface` | 4,51:1 (grens) | 6,98:1 |
| succes-petrol op `--card` | 4,90:1 | 6,23:1 |

## Eindoordeel
🟡 Kleine tekortkomingen, geen A/AA-blokkade in de meldingen zelf. Bevinding 1 vóór oplevering oplossen; 2 en 3 in dezelfde ronde of apart ticket.
