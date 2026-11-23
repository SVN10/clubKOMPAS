// Vermogens van HCA (CK-020) en de plan- en controlelogica van de vermogensscripts.
// Zonder Firestore-aanroepen, zodat de regeltests (emulator) dezelfde logica kunnen toetsen.

import { KAN_VERMOGENS, geldigeVermogensnaam, naamSleutel, normaliseerVermogensnaam, bruikbaarId } from '../../src/vermogens.js'

// Bron: .claude/specs/CK-020-bron-vermogensoverzicht.md, namencontrole Paul 23 november 2026
// (Accommodatie: Onderhoud → Parkonderhoud, Beveiliging → Parkbeveiliging). 58 vermogens, 13 domeinen.
export const HCA_VERMOGENS = [
  ['#HCASpeelt', ['Teamindeling', 'Coachaanstelling', 'Lijncoördinatie', 'Teammanagement', 'Trainingsplanning', 'Wedstrijdplanning', 'Scheidsrechtersplanning']],
  ['#HCAGroeit', ['Coachontwikkeling', 'Spelersontwikkeling', 'Keepersontwikkeling', 'Scheidsrechtersontwikkeling', 'Jongerenparticipatie']],
  ['#HCADoet', ['G-hockey']],
  ['Bestuur', ['Regievoering', 'Koersbepaling', 'Beleidsvorming', 'Statutenbeheer', 'Sociale veiligheid', 'Compliance', 'Tuchtzaken']],
  ['Leden', ['Ledenwerving', 'Ledenbeheer', 'Ledenbehoud', 'Oudledenbeheer', 'Lief & Leed']],
  ['Vrijwilligers', ['Vrijwilligerswerving', 'Vrijwilligersbeheer', 'Vrijwilligersbehoud']],
  ['Relaties', ['Sponsorenwerving', 'Sponsorenbeheer', 'Sponsorenbehoud', 'Fondsenwerving', 'Donateursbeheer', 'Kledingpartnerschap']],
  ['Communicatie', ['Contentcreatie', 'Campagnebeheer', 'Nieuwsbriefbeheer', 'Social-mediabeheer', 'Huisstijlbeheer']],
  ['Financiën', ['Contributiebeheer', 'Facturatiebeheer', 'Contractbeheer', 'Boekhouding', 'Begroting', 'Verzekeringsbeheer', 'Kascontrole']],
  ['Accommodatie', ['Parkonderhoud', 'Parkbeveiliging']],
  ['Hospitality', ['Bar- en keukenbeheer', 'Catering', 'Evenementen', 'Verhuur', 'Reserveringen']],
  ['Materiaal', ['Materiaalbeheer', 'Kledingbeheer']],
  ['Digitaal', ['Websitebeheer', 'Licentiebeheer', 'Systeembeheer']],
]

const klein = x => (typeof x === 'string' ? x.trim().toLowerCase() : '')

// Domein op label: eerst op hashtag, dan op naam, hoofdletterongevoelig
export function zoekDomeinen(domeinen, label) {
  const l = klein(label)
  const opHashtag = domeinen.filter(d => klein(d.hashtag) === l)
  return opHashtag.length ? opHashtag : domeinen.filter(d => klein(d.naam) === l)
}

// domeinen: [{ id, ...data }], vermogens: [{ id, ...data }], namen: [{ id: sleutel, vermogenId }]
export function maakImportplan({ domeinen, vermogens, namen }, bron = HCA_VERMOGENS) {
  const fouten = []
  const plan = []
  const overgeslagen = []
  const letOp = []
  const vermogenOpId = new Map(vermogens.map(v => [v.id, v]))
  const naamOpSleutel = new Map(namen.map(n => [n.id, n]))
  const domeinOpId = new Map(domeinen.map(d => [d.id, d]))
  const gezien = new Set()

  for (const [label, lijst] of bron) {
    const gevonden = zoekDomeinen(domeinen, label)
    if (gevonden.length === 0) { fouten.push(`domein "${label}" niet gevonden (op hashtag of naam).`); continue }
    if (gevonden.length > 1) { fouten.push(`domein "${label}" is ${gevonden.length} keer gevonden (${gevonden.map(d => d.id).join(', ')}).`); continue }
    const domein = gevonden[0]
    if (!KAN_VERMOGENS.has(domein.type)) { fouten.push(`domein "${label}" is ${domein.type || 'zonder soort'}; vermogens horen bij een pijler of ondersteunend domein.`); continue }
    for (const ruw of lijst) {
      const naam = normaliseerVermogensnaam(ruw)
      if (naam !== ruw || !geldigeVermogensnaam(naam)) { fouten.push(`naam "${ruw}" voldoet niet aan de naamregels.`); continue }
      const sleutel = naamSleutel(naam)
      if (gezien.has(sleutel)) { fouten.push(`naam "${naam}" staat dubbel in de bronlijst.`); continue }
      gezien.add(sleutel)
      const naamdoc = naamOpSleutel.get(sleutel)
      if (!naamdoc) { plan.push({ naam, domeinId: domein.id, domeinNaam: domein.naam }); continue }
      const bestaand = vermogenOpId.get(naamdoc.vermogenId)
      if (!bestaand) {
        letOp.push(`"${naam}": naamdocument vermogensnamen/${sleutel} zonder vermogen. Draai eerst npm run vermogens:controle; ongemoeid.`)
      } else if (bestaand.domeinId === domein.id) {
        overgeslagen.push(naam)
      } else {
        const elders = domeinOpId.get(bestaand.domeinId)?.naam || bestaand.domeinId
        letOp.push(`"${naam}" staat al bij ${elders} in plaats van bij ${domein.naam}; ongemoeid.`)
      }
    }
  }
  return { fouten, plan, overgeslagen, letOp }
}

function geldigVermogen(v) {
  const sleutels = Object.keys(v).filter(k => k !== 'id')
  return sleutels.length === 3 && ['naam', 'domeinId', 'volgorde'].every(k => sleutels.includes(k))
    && typeof v.naam === 'string' && geldigeVermogensnaam(v.naam) && normaliseerVermogensnaam(v.naam) === v.naam
    && typeof v.domeinId === 'string' && v.domeinId.length > 0 && v.domeinId.length <= 100
    && Number.isInteger(v.volgorde) && v.volgorde >= 1
}

// Controle (CK-020): geeft afwijkingen (tekst) en wat de regels laten herstellen (naamdocumenten).
export function controleerVermogens({ domeinen, vermogens, namen }) {
  const afwijkingen = []
  const herstel = []
  const domeinOpId = new Map(domeinen.map(d => [d.id, d]))
  const vermogenOpId = new Map(vermogens.map(v => [v.id, v]))
  const naamOpSleutel = new Map(namen.map(n => [n.id, n]))
  const label = v => `vermogens/${v.id} ("${typeof v.naam === 'string' ? v.naam : '?'}")`

  // 1 en 6: teller per domein tegenover het echte aantal
  for (const d of domeinen) {
    const echt = vermogens.filter(v => v.domeinId === d.id).length
    const opgeslagen = d.aantalVermogens ?? 0
    if (opgeslagen !== echt) {
      afwijkingen.push(`structuurelementen/${d.id} (${d.naam}): aantalVermogens ${JSON.stringify(opgeslagen)} → ${echt}. Zet dit in de Firebase-console.`)
    }
    if (d.type === 'overkoepelend' && (echt > 0 || opgeslagen > 0)) {
      afwijkingen.push(`structuurelementen/${d.id} (${d.naam}) is overkoepelend maar heeft ${echt} vermogen(s). Verplaats ze in Beheer → Vermogens naar een pijler of ondersteunend domein.`)
    }
  }

  // 4: twee vermogens met dezelfde sleutel
  const perSleutel = new Map()
  for (const v of vermogens) {
    if (typeof v.naam !== 'string') continue
    const s = naamSleutel(v.naam)
    perSleutel.set(s, [...(perSleutel.get(s) || []), v])
  }
  for (const [s, lijst] of perSleutel) {
    if (lijst.length > 1) afwijkingen.push(`${lijst.length} vermogens met de naam "${s}": ${lijst.map(label).join(', ')}. Hernoem of verwijder er één in Beheer → Vermogens.`)
  }

  // 5: ongeldige velden, ontbrekend of overkoepelend domein
  for (const v of vermogens) {
    if (!geldigVermogen(v)) afwijkingen.push(`${label(v)} heeft ongeldige velden (alleen naam, domeinId en volgorde ≥ 1 zijn toegestaan). Herstel of verwijder het in de Firebase-console.`)
    const d = domeinOpId.get(v.domeinId)
    if (!d) afwijkingen.push(`${label(v)} hoort bij een domein dat niet bestaat (${JSON.stringify(v.domeinId)}). Kies in Beheer → Vermogens via Bewerken een ander domein, of verwijder het.`)
    else if (!KAN_VERMOGENS.has(d.type)) afwijkingen.push(`${label(v)} hoort bij ${d.naam}, een ${d.type || 'onbekend'} domein. Kies in Beheer → Vermogens via Bewerken een ander domein.`)
  }

  // 3: naamdocumenten zonder (passend) vermogen → verwijderen
  const weg = new Set()
  for (const n of namen) {
    const v = vermogenOpId.get(n.vermogenId)
    if (!v || typeof v.naam !== 'string' || naamSleutel(v.naam) !== n.id) {
      weg.add(n.id)
      herstel.push({ soort: 'naam-weg', sleutel: n.id, tekst: `vermogensnamen/${n.id} hoort niet (meer) bij een vermogen met die naam: verwijderen.` })
    }
  }

  // 2: vermogens zonder naamdocument, of met een naamdocument dat naar een ander vermogen wijst
  for (const v of vermogens) {
    if (typeof v.naam !== 'string') continue
    const s = naamSleutel(v.naam)
    const n = naamOpSleutel.get(s)
    if (n && n.vermogenId === v.id) continue
    const uniek = perSleutel.get(s)?.length === 1
    if (n && !weg.has(s)) {
      afwijkingen.push(`${label(v)}: vermogensnamen/${s} wijst naar vermogens/${n.vermogenId}. Hernoem of verwijder een van beide in Beheer → Vermogens.`)
    } else if (uniek && geldigeVermogensnaam(v.naam) && bruikbaarId(s)) {
      herstel.push({ soort: 'naam-maken', sleutel: s, vermogenId: v.id, tekst: `vermogensnamen/${s} ontbreekt voor ${label(v)}: aanmaken.` })
    } else if (!uniek) {
      // al gemeld bij 4
    } else {
      afwijkingen.push(`${label(v)} heeft geen naamdocument en de naam voldoet niet aan de naamregels. Hernoem het in de Firebase-console.`)
    }
  }

  return { afwijkingen, herstel }
}
