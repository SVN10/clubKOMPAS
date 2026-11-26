// Veldcontrole van de P0d-regels in JavaScript, voor scripts/controleer-p0d.mjs.
// Spiegel van geldigProfiel, geldigeBestuursfunctie en geldigDomein in firestore.rules; de regeltests
// toetsen beide tegen dezelfde voorbeelden. Wijzig je de regels, wijzig dit bestand mee.

export const PROFIEL_VELDEN = ['naam', 'afkorting', 'seizoen', 'logo']
export const FUNCTIE_VELDEN = ['naam', 'volgorde']
// Geen omschrijving meer (CK-179): een oude telt als onbekend veld en mag weg
export const DOMEIN_VELDEN = ['type', 'naam', 'hashtag', 'bestuursfunctieId', 'icoon',
  'volgorde', 'aantalVermogens', 'laatsteVermogenId', 'bevat']
export const LOGO_MAX_TEKENS = 700000

const tekens = v => [...v].length
const tekst = (v, max) => typeof v === 'string' && tekens(v) <= max
const nietLeeg = (v, max) => tekst(v, max) && v.trim().length > 0
const isInt = v => Number.isInteger(v)
const LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/
const HASHTAG = /^#[^\s#]{1,49}$/
// CK-056: geen stuur-, nul-breedte- of bidi-tekens in namen; pictogram uit de vaste lijst
const STUURTEKENS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u   // gelijk aan geenStuurtekens in firestore.rules (CK-057)
const zonderStuurtekens = v => !STUURTEKENS.test(v)
export const PICTOGRAMMEN = ['', 'hcaspeelt', 'hcagroeit', 'hcadoet', 'bestuur', 'leden', 'vrijwilligers', 'relaties',
  'communicatie', 'financien', 'accommodatie', 'hospitality', 'materiaal', 'digitaal', 'projecten', 'samenwerkingen']

function controleer(d, velden, regels) {
  const onbekend = Object.keys(d).filter(k => !velden.includes(k))
  const fouten = regels.filter(([veld, ok]) => veld in d && !ok(d[veld])).map(([veld, , uitleg]) => `${veld}: ${uitleg}`)
  return { onbekend, fouten }
}

export function geldigLogoTekst(v) {
  return typeof v === 'string' && v.length <= LOGO_MAX_TEKENS && LOGO.test(v)
}

export function controleerProfiel(d) {
  return controleer(d, PROFIEL_VELDEN, [
    ['naam', v => nietLeeg(v, 100) && zonderStuurtekens(v), 'tekst van 1 tot 100 tekens, zonder onzichtbare tekens'],
    ['afkorting', v => nietLeeg(v, 20), 'tekst van 1 tot 20 tekens'],
    ['seizoen', v => nietLeeg(v, 20), 'tekst van 1 tot 20 tekens'],
    ['logo', geldigLogoTekst, `PNG, JPEG of WebP als base64, max. ${LOGO_MAX_TEKENS} tekens`],
  ])
}

export function controleerBestuursfunctie(d) {
  const r = controleer(d, FUNCTIE_VELDEN, [
    ['naam', v => typeof v === 'string' && tekens(v.trim()) >= 2 && tekens(v) <= 100 && zonderStuurtekens(v), 'tekst van 2 tot 100 tekens, niet alleen spaties, zonder onzichtbare tekens'],
    ['volgorde', v => isInt(v) && v >= 1 && v <= 100000, 'geheel getal van 1 tot 100000'],
  ])
  if (!('naam' in d)) r.fouten.unshift('naam: ontbreekt')
  return r
}

export function controleerDomein(d) {
  const r = controleer(d, DOMEIN_VELDEN, [
    ['type', v => ['pijler', 'domein', 'overkoepelend'].includes(v), 'pijler, domein of overkoepelend'],
    ['naam', v => nietLeeg(v, 200) && zonderStuurtekens(v), 'tekst van 1 tot 200 tekens, niet alleen spaties, zonder onzichtbare tekens'],
    ['hashtag', v => typeof v === 'string' && (v === '' || HASHTAG.test(v)), 'leeg, of # en max. 49 tekens zonder spatie'],
    ['bestuursfunctieId', v => tekst(v, 100), 'tekst van max. 100 tekens'],
    ['icoon', v => PICTOGRAMMEN.includes(v), 'leeg of een pictogram uit de vaste lijst'],
    ['volgorde', v => isInt(v) && v >= 1 && v <= 100000, 'geheel getal van 1 tot 100000'],
    ['aantalVermogens', v => isInt(v) && v >= 0, 'geheel getal vanaf 0'],
    ['laatsteVermogenId', v => tekst(v, 100), 'tekst van max. 100 tekens'],
    ['bevat', v => ['projecten', 'samenwerkingen'].includes(v), 'projecten of samenwerkingen'],
  ])
  for (const veld of ['type', 'naam']) if (!(veld in d)) r.fouten.unshift(`${veld}: ontbreekt`)
  if ('bevat' in d && d.type !== 'overkoepelend') r.fouten.push('bevat: alleen op een overkoepelend domein')
  return r
}

// functies en domeinen: [{ id, data }], zodat een dataveld 'id' het document-id niet overschrijft.
// Alles in één keer: afwijkingen die met de hand moeten (Beheer of console) en velden die het script
// mag weghalen (onbekende velden, zoals het oude 'verantwoordelijke').
export function controleerP0d({ rol, profiel, functies, domeinen }) {
  const afwijkingen = []
  const herstel = []
  if (rol !== 'beheerder') {
    afwijkingen.push(`Jouw rol in leden is ${JSON.stringify(rol ?? null)}, niet "beheerder". Na het publiceren van de P0d-regels kun je dan niets meer wijzigen. Zet rol op "beheerder" in de Firebase-console vóór je de regels publiceert.`)
  }
  const verwerk = (pad, naam, { onbekend, fouten }) => {
    for (const f of fouten) afwijkingen.push(`${pad} (${naam}): ${f}`)
    if (onbekend.length) herstel.push({ pad, naam, velden: onbekend })
  }
  if (profiel) verwerk('instellingen/profiel', profiel.naam ?? '', controleerProfiel(profiel))
  for (const { id, data } of functies) verwerk(`bestuursfuncties/${id}`, data.naam ?? '', controleerBestuursfunctie(data))
  for (const { id, data } of domeinen) verwerk(`structuurelementen/${id}`, data.naam ?? '', controleerDomein(data))
  return { afwijkingen, herstel }
}
