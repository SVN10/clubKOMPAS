// Activiteiten (CK-170) en hun uitvoeringen (CK-172), modellaag: Club → Domein → Vermogen → Activiteit → Uitvoeringen.
// Pure functies met db en clubId als parameter, zonder DOM: gedeeld door Beheer → Activiteiten,
// de verwijderblokkade bij vermogens en commissies, de regeltests en later de vermogenskaart en de plaat.

import {
  collection, doc, getDoc, getDocs, deleteField, query, where, getCountFromServer, writeBatch,
} from 'firebase/firestore'
import { geldigeOnderdeelnaam, geldigeDatum, naamBezet } from './onderdelen.js'

export const ACTIVITEIT_SOORTEN = [
  ['toernooi', 'Toernooi'],
  ['clinic', 'Clinic of training'],
  ['evenement', 'Evenement'],
  ['bijeenkomst', 'Bijeenkomst'],
  ['opleiding', 'Opleiding'],
  ['actie', 'Actie'],
  ['overig', 'Overig'],
]
export const ACTIVITEIT_SOORT_LABEL = Object.fromEntries(ACTIVITEIT_SOORTEN)

// Een onbekende soort (oude data) telt als Overig, ook in het filter
export const activiteitSoort = x => (Object.hasOwn(ACTIVITEIT_SOORT_LABEL, x?.soort) ? x.soort : 'overig')
export const activiteitSoortLabel = x => ACTIVITEIT_SOORT_LABEL[activiteitSoort(x)]

const VELDEN = ['naam', 'soort', 'vermogenIds', 'commissieId']
const UITVOERING_VELDEN = ['activiteitId', 'begindatum', 'einddatum']

// Alle velden die de regels verwachten, ook als lege tekst
export function activiteitVelden({ naam, soort, vermogenIds, commissieId = '' }) {
  return { naam, soort, vermogenIds: [...vermogenIds], commissieId: commissieId || '' }
}

export function uitvoeringVelden({ activiteitId, begindatum, einddatum = '' }) {
  return { activiteitId, begindatum, einddatum: einddatum || '' }
}

const kortId = v => typeof v === 'string' && v.length > 0 && v.length <= 100
const precies = (d, velden) => {
  const eigen = Object.keys(d).filter(k => k !== 'id')
  return eigen.length === velden.length && velden.every(k => eigen.includes(k))
}

// Spiegel van geldigeActiviteit in firestore.rules (zonder de exists()-controles)
export function geldigeActiviteit(d) {
  if (!d || typeof d !== 'object') return false
  return precies(d, VELDEN)
    && geldigeOnderdeelnaam(d.naam)
    && Object.hasOwn(ACTIVITEIT_SOORT_LABEL, d.soort)
    && Array.isArray(d.vermogenIds) && d.vermogenIds.length === 1 && kortId(d.vermogenIds[0])
    && typeof d.commissieId === 'string' && d.commissieId.length <= 100
}

// Spiegel van geldigeUitvoering in firestore.rules (zonder existsAfter op de activiteit)
export function geldigeUitvoering(d) {
  if (!d || typeof d !== 'object') return false
  return precies(d, UITVOERING_VELDEN)
    && kortId(d.activiteitId)
    && geldigeDatum(d.begindatum) && d.begindatum !== ''
    && geldigeDatum(d.einddatum)
    && (d.einddatum === '' || d.einddatum >= d.begindatum)
}

// Veldfouten voor de datum: { begin?, eind? }. Een onvolledige datum in de kiezer (badInput) controleert de app zelf.
export function uitvoeringDatumFout(begin, eind) {
  const fout = {}
  if (!begin) fout.begin = 'Vul een begindatum in.'
  else if (!geldigeDatum(begin)) fout.begin = 'Vul een hele datum in.'
  if (!geldigeDatum(eind)) fout.eind = 'Vul een hele datum in, of maak het veld leeg.'
  if (!fout.begin && !fout.eind && eind && eind < begin) fout.eind = 'De einddatum ligt vóór de begindatum.'
  return fout
}
export const activiteitDatumFout = uitvoeringDatumFout

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// Alleen splitsen, nooit new Date(): een tijdzone kan de dag verschuiven
function delen(datum) {
  const [jaar, maand, dag] = datum.split('-')
  return { jaar, maand: MAANDEN[Number(maand) - 1] || maand, dag: String(Number(dag)) }
}

export function datumTekst(begin, eind) {
  if (!begin || !geldigeDatum(begin)) return ''
  const b = delen(begin)
  if (!eind || !geldigeDatum(eind) || eind <= begin) return `${b.dag} ${b.maand} ${b.jaar}`
  const e = delen(eind)
  if (b.jaar !== e.jaar) return `${b.dag} ${b.maand} ${b.jaar} – ${e.dag} ${e.maand} ${e.jaar}`
  if (b.maand !== e.maand) return `${b.dag} ${b.maand} – ${e.dag} ${e.maand} ${e.jaar}`
  return `${b.dag} – ${e.dag} ${e.maand} ${e.jaar}`
}

// Lokale datum als JJJJ-MM-DD (nooit toISOString(): dat is UTC)
export function vandaagTekst(nu = new Date()) {
  const twee = n => String(n).padStart(2, '0')
  return `${String(nu.getFullYear()).padStart(4, '0')}-${twee(nu.getMonth() + 1)}-${twee(nu.getDate())}`
}

const tekst = v => (typeof v === 'string' ? v : '')
const bruikbaar = u => typeof u?.begindatum === 'string' && u.begindatum !== '' && geldigeDatum(u.begindatum)
const einde = u => (u.einddatum && geldigeDatum(u.einddatum) && u.einddatum > u.begindatum ? u.einddatum : u.begindatum)

// 'bezig' | 'komend' | 'voorbij' voor één uitvoering ten opzichte van vandaag (JJJJ-MM-DD)
export function uitvoeringStand(u, vandaag) {
  if (u.begindatum > vandaag) return 'komend'
  return einde(u) >= vandaag ? 'bezig' : 'voorbij'
}

// richting 'oud': de oudste bovenaan (begindatum, einddatum, id); 'nieuw': precies andersom
export function sorteerUitvoeringen(lijst, richting = 'oud') {
  const teken = richting === 'nieuw' ? -1 : 1
  return lijst.sort((a, b) => teken * (tekst(a.begindatum).localeCompare(tekst(b.begindatum))
    || tekst(a.einddatum).localeCompare(tekst(b.einddatum))
    || tekst(a.id).localeCompare(tekst(b.id))))
}

export function uitvoeringenPerActiviteit(lijst) {
  const per = new Map()
  for (const u of lijst) {
    if (!per.has(u.activiteitId)) per.set(u.activiteitId, [])
    per.get(u.activiteitId).push(u)
  }
  for (const l of per.values()) sorteerUitvoeringen(l)
  return per
}

// Bezig telt als eerstvolgende; anders de vroegste komende; anders de laatste voorbije; anders geen
export function eerstvolgendeUitvoering(lijst = [], vandaag) {
  const bruikbare = sorteerUitvoeringen(lijst.filter(bruikbaar))
  const bezig = bruikbare.find(u => uitvoeringStand(u, vandaag) === 'bezig')
  if (bezig) return { stand: 'bezig', uitvoering: bezig }
  const komend = bruikbare.find(u => u.begindatum > vandaag)
  if (komend) return { stand: 'komend', uitvoering: komend }
  if (!bruikbare.length) return { stand: 'geen', uitvoering: null }
  const laatst = bruikbare.reduce((a, b) => (einde(b) > einde(a) || (einde(b) === einde(a) && b.begindatum >= a.begindatum) ? b : a))
  return { stand: 'voorbij', uitvoering: laatst }
}

const opNaam = (a, b) => String(a.naam).localeCompare(String(b.naam), 'nl') || tekst(a.id).localeCompare(tekst(b.id))

// Zonder uitvoeringen: op naam. Met uitvoeringen (Map op activiteitId): eerst bezig of komend op de
// eerstvolgende datum, dan voorbij met de meest recente eerst, dan zonder uitvoering op naam.
export function sorteerActiviteiten(lijst, perActiviteit = null, vandaag = vandaagTekst()) {
  if (!perActiviteit) return lijst.sort(opNaam)
  const groep = { bezig: 0, komend: 0, voorbij: 1, geen: 2 }
  const sleutel = new Map(lijst.map(x => {
    const { stand, uitvoering } = eerstvolgendeUitvoering(perActiviteit.get(x.id) || [], vandaag)
    return [x, { groep: groep[stand], datum: uitvoering ? (stand === 'voorbij' ? einde(uitvoering) : uitvoering.begindatum) : '' }]
  }))
  return lijst.sort((a, b) => {
    const sa = sleutel.get(a)
    const sb = sleutel.get(b)
    if (sa.groep !== sb.groep) return sa.groep - sb.groep
    if (sa.groep === 0 && sa.datum !== sb.datum) return sa.datum.localeCompare(sb.datum)
    if (sa.groep === 1 && sa.datum !== sb.datum) return sb.datum.localeCompare(sa.datum)
    return opNaam(a, b)
  })
}

// Dubbel = dezelfde naam (hoofdletters en spaties tellen niet) bij een andere activiteit in de club
export function activiteitBezet(lijst, naam, eigenId = null) {
  return naamBezet(lijst, naam, eigenId)
}

// Dubbel = een andere uitvoering (van dezelfde activiteit) op dezelfde begindatum
export function uitvoeringBezet(uitvoeringen, begindatum, eigenId = null) {
  return uitvoeringen.some(u => u.id !== eigenId && u.begindatum === begindatum)
}

const kolom = (db, clubId) => collection(db, 'clubs', clubId, 'activiteiten')
const uitvoeringKolom = (db, clubId) => collection(db, 'clubs', clubId, 'uitvoeringen')
const activiteitRef = (db, clubId, id) => doc(db, 'clubs', clubId, 'activiteiten', id)
const uitvoeringRef = (db, clubId, uid) => doc(db, 'clubs', clubId, 'uitvoeringen', uid)
const metId = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))
const MAX_UITVOERINGEN_MEE = 499

export async function laadActiviteiten(db, clubId) {
  return sorteerActiviteiten(metId(await getDocs(kolom(db, clubId))))
}

export async function laadActiviteitenVanVermogen(db, clubId, vermogenId) {
  return sorteerActiviteiten(metId(await getDocs(query(kolom(db, clubId), where('vermogenIds', 'array-contains', vermogenId)))))
}

export async function telActiviteitenVanCommissie(db, clubId, commissieId) {
  return (await getCountFromServer(query(kolom(db, clubId), where('commissieId', '==', commissieId)))).data().count
}

export async function laadUitvoeringen(db, clubId) {
  return sorteerUitvoeringen(metId(await getDocs(uitvoeringKolom(db, clubId))))
}

export async function laadUitvoeringenVanActiviteit(db, clubId, activiteitId) {
  return sorteerUitvoeringen(metId(await getDocs(query(uitvoeringKolom(db, clubId), where('activiteitId', '==', activiteitId)))))
}

export async function telUitvoeringenVanActiviteit(db, clubId, activiteitId) {
  return (await getCountFromServer(query(uitvoeringKolom(db, clubId), where('activiteitId', '==', activiteitId)))).data().count
}

// Activiteit en eerste uitvoering samen in één batch: allebei of geen van beide
export async function voegActiviteitToe(db, clubId, data, eersteUitvoering = null) {
  const ref = doc(kolom(db, clubId))
  const batch = writeBatch(db)
  batch.set(ref, activiteitVelden(data))
  let uitvoeringId = null
  if (eersteUitvoering) {
    const uRef = doc(uitvoeringKolom(db, clubId))
    uitvoeringId = uRef.id
    batch.set(uRef, uitvoeringVelden({ ...eersteUitvoering, activiteitId: ref.id }))
  }
  await batch.commit()
  return { id: ref.id, uitvoeringId }
}

// Alleen de activiteit (de uitvoeringen blijven zoals ze zijn); de oude datumvelden gaan mee weg
export async function bewerkActiviteit(db, clubId, id, data) {
  await bewaarActiviteit(db, clubId, { id, velden: data, oud: null })
}

// Verwijdert de activiteit met al haar uitvoeringen in één batch; geeft het aantal verwijderde uitvoeringen
export async function verwijderActiviteit(db, clubId, id) {
  const ref = activiteitRef(db, clubId, id)
  if (!(await getDoc(ref)).exists()) throw { code: 'activiteit-weg' }
  const uitvoeringen = await laadUitvoeringenVanActiviteit(db, clubId, id)
  if (uitvoeringen.length > MAX_UITVOERINGEN_MEE) throw { code: 'te-veel-uitvoeringen', aantal: uitvoeringen.length }
  const batch = writeBatch(db)
  for (const u of uitvoeringen) batch.delete(uitvoeringRef(db, clubId, u.id))
  batch.delete(ref)
  await batch.commit()
  return uitvoeringen.length
}

// ── Uitvoeringen in het formulier van de activiteit (CK-174) ──

const BEGIN_LEEG = 'Vul een begindatum in, of haal deze uitvoering weg.'
const BEGIN_HALF = 'Vul een hele datum in.'
const EIND_HALF = 'Vul een hele datum in, of maak het veld leeg.'
const EIND_VOOR_BEGIN = 'De einddatum ligt vóór de begindatum.'

// Fouten per regel, in de volgorde van het formulier: [{ begin?, eind? }].
// regels: [{ sleutel, begindatum, einddatum, beginHalf, eindHalf }] (half = validity.badInput in de datumkiezer).
// Een dubbele begindatum is een fout bij de lagere regel, met het nummer van de eerste regel met die datum.
export function uitvoeringRegelFouten(regels) {
  const eerste = new Map()
  return regels.map((r, i) => {
    const fout = {}
    const begin = tekst(r.begindatum)
    const eind = tekst(r.einddatum)
    if (r.beginHalf) fout.begin = BEGIN_HALF
    else if (!begin) fout.begin = BEGIN_LEEG
    else if (!geldigeDatum(begin)) fout.begin = BEGIN_HALF
    if (r.eindHalf || !geldigeDatum(eind)) fout.eind = EIND_HALF
    if (!fout.begin && !fout.eind && eind && eind < begin) fout.eind = EIND_VOOR_BEGIN
    if (!fout.begin) {
      if (eerste.has(begin)) fout.begin = `Deze begindatum staat al bij uitvoering ${eerste.get(begin)}.`
      else eerste.set(begin, i + 1)
    }
    return fout
  })
}

// Verschil tussen de stand bij het openen (oud: [{ id, begindatum, einddatum }]) en de regels bij opslaan
// ([{ sleutel, id (uid of ''), begindatum, einddatum }]). Ongewijzigde regels staan er niet in.
// Een id dat niet in oud staat (of twee keer voorkomt), wordt een nieuwe regel.
export function uitvoeringWijzigingen(oud, regels) {
  const perId = new Map((oud || []).map(u => [u.id, u]))
  const gezien = new Set()
  const nieuw = []
  const gewijzigd = []
  for (const r of regels || []) {
    const begindatum = tekst(r.begindatum)
    const einddatum = tekst(r.einddatum)
    const o = r.id ? perId.get(r.id) : null
    if (!o || gezien.has(r.id)) { nieuw.push({ sleutel: r.sleutel, begindatum, einddatum }); continue }
    gezien.add(r.id)
    if (tekst(o.begindatum) !== begindatum || tekst(o.einddatum) !== einddatum) gewijzigd.push({ id: r.id, sleutel: r.sleutel, begindatum, einddatum })
  }
  return { nieuw, gewijzigd, weg: [...perId.keys()].filter(id => !gezien.has(id)) }
}

// Eindstand na de wijzigingen, tegen de vers gelezen uitvoeringen van deze activiteit.
// intussenWeg: gewijzigd, maar niet meer in vers. wegAlWeg: weggehaald en al verwijderd (overslaan).
// dubbel: een nieuwe of gewijzigde regel op de begindatum van een uitvoering die blijft staan en die
// deze wijzigingen niet raken (de dubbels binnen het formulier vangt uitvoeringRegelFouten al af).
export function controleerUitvoeringEindstand(vers, { nieuw = [], gewijzigd = [], weg = [] }) {
  const versIds = new Set(vers.map(u => u.id))
  const geraakt = new Set([...weg, ...gewijzigd.map(g => g.id)])
  const blijft = new Set(vers.filter(u => !geraakt.has(u.id)).map(u => u.begindatum))
  const intussenWeg = gewijzigd.filter(g => !versIds.has(g.id)).map(g => g.sleutel)
  const wegAlWeg = weg.filter(id => !versIds.has(id))
  const dubbel = [...nieuw, ...gewijzigd.filter(g => versIds.has(g.id))].filter(r => blijft.has(r.begindatum)).map(r => r.sleutel)
  return { dubbel, intussenWeg, wegAlWeg }
}

// "1 uitvoering toegevoegd, 1 verwijderd"; '' als alles 0 is
export function uitvoeringWijzigingTekst({ toegevoegd = 0, gewijzigd = 0, verwijderd = 0 }) {
  return [[toegevoegd, 'toegevoegd'], [gewijzigd, 'gewijzigd'], [verwijderd, 'verwijderd']]
    .filter(([n]) => n > 0)
    .map(([n, woord], i) => `${i === 0 ? (n === 1 ? '1 uitvoering' : `${n} uitvoeringen`) : n} ${woord}`)
    .join(', ')
}

const zelfdeVelden = (a, b) => a.naam === b.naam && a.soort === b.soort && a.commissieId === (b.commissieId ?? '')
  && Array.isArray(b.vermogenIds) && b.vermogenIds.length === a.vermogenIds.length && a.vermogenIds.every((v, i) => v === b.vermogenIds[i])

// De activiteit en alle wijzigingen aan haar uitvoeringen in één batch: alles of niets.
// id = null: nieuwe activiteit. oud = null: de uitvoeringen waren niet geladen, alleen de activiteit opslaan.
// Geeft { id, nieuweIds, toegevoegd, gewijzigd, verwijderd } met de echte aantallen.
export async function bewaarActiviteit(db, clubId, { id = null, velden, oud = [], regels = [] }) {
  const nieuweActiviteit = !id
  const ref = nieuweActiviteit ? doc(kolom(db, clubId)) : activiteitRef(db, clubId, id)
  const activiteitId = ref.id
  const data = activiteitVelden(velden)
  const wijzigingen = oud === null ? { nieuw: [], gewijzigd: [], weg: [] } : uitvoeringWijzigingen(nieuweActiviteit ? [] : oud, regels)

  // Eerst lezen: op een verdwenen document geven de regels permission-denied, niet not-found
  async function controleer() {
    if (nieuweActiviteit) return { bestaand: null, weg: [] }
    const snap = await getDoc(ref)
    if (!snap.exists()) throw { code: 'activiteit-weg' }
    let weg = wijzigingen.weg
    if (wijzigingen.nieuw.length || wijzigingen.gewijzigd.length || weg.length) {
      const c = controleerUitvoeringEindstand(await laadUitvoeringenVanActiviteit(db, clubId, activiteitId), wijzigingen)
      if (c.intussenWeg.length) throw { code: 'uitvoering-intussen-weg', sleutels: c.intussenWeg }
      if (c.dubbel.length) throw { code: 'dubbele-uitvoering-vers', sleutels: c.dubbel }
      weg = weg.filter(uid => !c.wegAlWeg.includes(uid))
    }
    return { bestaand: snap.data(), weg }
  }

  const { bestaand, weg } = await controleer()
  const { nieuw, gewijzigd } = wijzigingen
  if (nieuw.length + gewijzigd.length + weg.length > MAX_UITVOERINGEN_MEE) throw { code: 'te-veel-uitvoeringen' }

  const batch = writeBatch(db)
  let schrijfacties = 0
  if (nieuweActiviteit) {
    batch.set(ref, data)
    schrijfacties++
  } else {
    const oudeDatums = ['begindatum', 'einddatum'].filter(k => k in bestaand)
    if (oudeDatums.length || !zelfdeVelden(data, bestaand)) {
      batch.update(ref, { ...data, ...Object.fromEntries(oudeDatums.map(k => [k, deleteField()])) })
      schrijfacties++
    }
  }
  const nieuweIds = []
  for (const n of nieuw) {
    const uRef = doc(uitvoeringKolom(db, clubId))
    nieuweIds.push(uRef.id)
    batch.set(uRef, uitvoeringVelden({ activiteitId, begindatum: n.begindatum, einddatum: n.einddatum }))
  }
  for (const g of gewijzigd) batch.update(uitvoeringRef(db, clubId, g.id), uitvoeringVelden({ activiteitId, begindatum: g.begindatum, einddatum: g.einddatum }))
  for (const uid of weg) batch.delete(uitvoeringRef(db, clubId, uid))
  schrijfacties += nieuw.length + gewijzigd.length + weg.length

  if (schrijfacties) {
    try {
      await batch.commit()
    } catch (e) {
      // Iets verdween tussen het lezen en de commit: opnieuw controleren geeft de juiste code
      if (e?.code === 'not-found' || e?.code === 'permission-denied') {
        let opnieuw = null
        try { await controleer() } catch (c) { opnieuw = c }
        if (typeof opnieuw?.code === 'string' && ['activiteit-weg', 'uitvoering-intussen-weg', 'dubbele-uitvoering-vers'].includes(opnieuw.code)) throw opnieuw
      }
      throw e
    }
  }
  return { id: activiteitId, nieuweIds, toegevoegd: nieuw.length, gewijzigd: gewijzigd.length, verwijderd: weg.length }
}
