// Activiteiten (CK-170) en hun uitvoeringen (CK-172), modellaag: Club → Domein → Vermogen → Activiteit → Uitvoeringen.
// Pure functies met db en clubId als parameter, zonder DOM: gedeeld door Beheer → Activiteiten,
// de verwijderblokkade bij vermogens en commissies, de regeltests en later de vermogenskaart en de plaat.

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, deleteField, query, where, getCountFromServer, writeBatch,
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

// Eerst lezen: op een verdwenen document geven de regels permission-denied, niet not-found.
// De oude datumvelden (van vóór CK-172) gaan bij bewerken mee weg, anders weigeren de regels.
export async function bewerkActiviteit(db, clubId, id, data) {
  const ref = activiteitRef(db, clubId, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw { code: 'activiteit-weg' }
  const oud = snap.data()
  const weg = Object.fromEntries(['begindatum', 'einddatum'].filter(k => k in oud).map(k => [k, deleteField()]))
  try {
    await updateDoc(ref, { ...activiteitVelden(data), ...weg })
  } catch (e) {
    if (e?.code === 'not-found') throw { code: 'activiteit-weg' }
    throw e
  }
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

async function activiteitBestaat(db, clubId, activiteitId) {
  if (!kortId(activiteitId) || !(await getDoc(activiteitRef(db, clubId, activiteitId))).exists()) throw { code: 'activiteit-weg' }
}

async function controleerUitvoeringVrij(db, clubId, activiteitId, begindatum, eigenId = null) {
  if (uitvoeringBezet(await laadUitvoeringenVanActiviteit(db, clubId, activiteitId), begindatum, eigenId)) throw { code: 'dubbele-uitvoering' }
}

// Weigeren de regels (existsAfter) omdat de activiteit intussen weg is, dan activiteit-weg
async function schrijfUitvoering(db, clubId, activiteitId, schrijf) {
  try {
    return await schrijf()
  } catch (e) {
    if (e?.code === 'permission-denied') {
      const snap = await getDoc(activiteitRef(db, clubId, activiteitId)).catch(() => null)
      if (snap && !snap.exists()) throw { code: 'activiteit-weg' }
    }
    throw e
  }
}

export async function voegUitvoeringToe(db, clubId, activiteitId, data) {
  await activiteitBestaat(db, clubId, activiteitId)
  const velden = uitvoeringVelden({ ...data, activiteitId })
  await controleerUitvoeringVrij(db, clubId, activiteitId, velden.begindatum)
  const ref = await schrijfUitvoering(db, clubId, activiteitId, () => addDoc(uitvoeringKolom(db, clubId), velden))
  return { id: ref.id }
}

// activiteitId komt uit het bestaande document: een uitvoering verhuist nooit
export async function bewerkUitvoering(db, clubId, uid, data) {
  const ref = uitvoeringRef(db, clubId, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw { code: 'uitvoering-weg' }
  const { activiteitId } = snap.data()
  await activiteitBestaat(db, clubId, activiteitId)
  const velden = uitvoeringVelden({ ...data, activiteitId })
  await controleerUitvoeringVrij(db, clubId, activiteitId, velden.begindatum, uid)
  try {
    await schrijfUitvoering(db, clubId, activiteitId, () => updateDoc(ref, velden))
  } catch (e) {
    if (e?.code === 'not-found') throw { code: 'uitvoering-weg' }
    throw e
  }
}

export async function verwijderUitvoering(db, clubId, uid) {
  const ref = uitvoeringRef(db, clubId, uid)
  if (!(await getDoc(ref)).exists()) throw { code: 'uitvoering-weg' }
  await deleteDoc(ref)
}
