// Projecten en samenwerkingen van HCA (CK-046): bronlijst en planlogica van het inrichtscript.
// Zonder Firestore-aanroepen, zodat de regeltests (emulator) dezelfde logica kunnen toetsen.

import { SOORT_ONDERDEEL, PLAAT_SOORTEN, STATUS_LABEL, onderdeelnaamFout, normaliseerNaam, naamSleutel, hoogsteVolgorde, onderdeelVelden, geldigOnderdeel } from '../../src/onderdelen.js'

// Bron: .claude/specs/CK-020-bron-vermogensoverzicht.md, sectie "Overkoepelende domeinen"
export const HCA_ONDERDELEN = {
  projecten: [
    ['Ver(nieuw)bouw', 'lopend'],
    ['Hoofdsponsoring 27/28+', 'lopend'],
    ['Kledinglijn 27/28+', 'lopend'],
    ['LED-scorebord', 'in-voorbereiding'],
    ['Buitenopslag (blaashal)', 'in-voorbereiding'],
  ],
  samenwerkingen: [['KNHB'], ['Gemeente'], ['Junis'], ['Scholen'], ['Hulpdiensten']],
}
export const HCA_DOMEINNAAM = { projecten: 'Projecten', samenwerkingen: 'Samenwerkingen' }
export const HCA_EIGENAAR = 'Voorzitter'

const klein = x => (typeof x === 'string' ? x.trim().toLowerCase() : '')

// Overkoepelend domein per soort: eerst op bevat, anders op naam. Geeft { domein } of { fout }.
export function zoekBlok(domeinen, soort, naam = HCA_DOMEINNAAM[soort]) {
  const opBevat = domeinen.filter(d => d.bevat === soort)
  const gevonden = opBevat.length ? opBevat : domeinen.filter(d => klein(d.naam) === klein(naam))
  if (!gevonden.length) return { fout: `domein "${naam}" niet gevonden (op bevat of naam).` }
  if (gevonden.length > 1) return { fout: `domein "${naam}" is ${gevonden.length} keer gevonden (${gevonden.map(d => d.id).join(', ')}).` }
  const domein = gevonden[0]
  if (domein.type !== 'overkoepelend') return { fout: `domein "${domein.naam}" is ${domein.type || 'zonder soort'}; projecten en samenwerkingen horen bij een overkoepelend domein.` }
  if ('bevat' in domein && domein.bevat !== soort) return { fout: `domein "${domein.naam}" toont al ${JSON.stringify(domein.bevat)}; dat laat het script ongemoeid.` }
  return { domein }
}

// domeinen, functies, projecten, samenwerkingen: [{ id, ...data }]
export function maakOnderdelenPlan({ domeinen, functies, projecten, samenwerkingen }, bron = HCA_ONDERDELEN) {
  const fouten = []
  const nieuw = []
  const bevat = []
  const overgeslagen = []
  const letOp = []
  const bestaand = { projecten, samenwerkingen }

  const eigenaars = functies.filter(f => klein(f.naam) === klein(HCA_EIGENAAR))
  if (eigenaars.length !== 1) fouten.push(`bestuursfunctie "${HCA_EIGENAAR}" is ${eigenaars.length} keer gevonden; verwacht precies 1.`)
  const bestuursfunctieId = eigenaars.length === 1 ? eigenaars[0].id : ''

  for (const soort of PLAAT_SOORTEN) {
    const cfg = SOORT_ONDERDEEL[soort]
    const { domein, fout } = zoekBlok(domeinen, soort)
    if (fout) fouten.push(fout)
    else if (domein.bevat !== soort) bevat.push({ domeinId: domein.id, domeinNaam: domein.naam, soort })

    const lijst = bestaand[soort]
    const opSleutel = new Map(lijst.filter(x => typeof x.naam === 'string').map(x => [naamSleutel(normaliseerNaam(x.naam)), x]))
    const gezien = new Set()
    let volgorde = hoogsteVolgorde(lijst)
    for (const [ruw, status] of bron[soort]) {
      const naam = normaliseerNaam(ruw)
      if (naam !== ruw || onderdeelnaamFout(naam)) { fouten.push(`naam "${ruw}" voldoet niet aan de naamregels.`); continue }
      const sleutel = naamSleutel(naam)
      if (gezien.has(sleutel)) { fouten.push(`naam "${naam}" staat dubbel in de bronlijst.`); continue }
      gezien.add(sleutel)
      const er = opSleutel.get(sleutel)
      if (er) {
        overgeslagen.push(`${cfg.enkel} ${naam}`)
        if (cfg.status && er.status !== status) {
          letOp.push(`${er.naam} staat er al met status ${STATUS_LABEL[er.status] ? STATUS_LABEL[er.status].toLowerCase() : JSON.stringify(er.status)}, ongemoeid.`)
        }
        continue
      }
      volgorde += 1
      const velden = onderdeelVelden(soort, { naam, omschrijving: '', bestuursfunctieId, status, begindatum: '', einddatum: '', volgorde })
      if (!geldigOnderdeel(soort, velden)) { fouten.push(`${cfg.enkel} "${naam}" heeft ongeldige velden.`); continue }
      nieuw.push({ soort, velden })
    }
  }
  return { fouten, nieuw, bevat, overgeslagen, letOp }
}
