// Eenmalige migratie P0c: clubs/{uid}/... → clubs/{clubId}/... met lidmaatschap en gebruikerswijzer
// Kopieert alleen; de brondata onder clubs/{uid} wordt niet gewijzigd of verwijderd.
// Gebruik: node scripts/migreer-club.mjs [--droog] [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { startScript, vraag, inloggen, stop, waarschuw, gelukt } from './lib/omgeving.mjs'

const MAX_DOCS = 450

// Diepe vergelijking van Firestore-waarden (Timestamp, GeoPoint, DocumentReference en Bytes hebben isEqual)
function gelijk(a, b) {
  if (a === b) return true
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false
  if (typeof a.isEqual === 'function') return a.constructor === b.constructor && a.isEqual(b)
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => gelijk(v, b[i]))
  const ka = Object.keys(a), kb = Object.keys(b)
  return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && gelijk(a[k], b[k]))
}

function verschilVelden(a, b) {
  const sleutels = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  return [...sleutels].filter(k => !gelijk(a?.[k], b?.[k]))
}

async function leesClubdata(db, clubId) {
  const profielSnap = await getDoc(doc(db, 'clubs', clubId, 'instellingen', 'profiel'))
  const structuurSnap = await getDocs(collection(db, 'clubs', clubId, 'structuurelementen'))
  return {
    profiel: profielSnap.exists() ? profielSnap.data() : null,
    structuur: new Map(structuurSnap.docs.map(d => [d.id, d.data()])),
  }
}

function vergelijkClubdata(bron, doel) {
  const verschillen = []
  if (!gelijk(bron.profiel, doel.profiel)) {
    if (!bron.profiel) verschillen.push('profiel: staat in doel maar niet in bron')
    else if (!doel.profiel) verschillen.push('profiel: ontbreekt in doel')
    else verschillen.push(`profiel: velden verschillen (${verschilVelden(bron.profiel, doel.profiel).join(', ')})`)
  }
  for (const [id, data] of bron.structuur) {
    if (!doel.structuur.has(id)) verschillen.push(`structuurelement ${id} (${data.naam}): ontbreekt in doel`)
    else if (!gelijk(data, doel.structuur.get(id))) verschillen.push(`structuurelement ${id} (${data.naam}): velden verschillen (${verschilVelden(data, doel.structuur.get(id)).join(', ')})`)
  }
  for (const [id, data] of doel.structuur) {
    if (!bron.structuur.has(id)) verschillen.push(`structuurelement ${id} (${data.naam}): staat in doel maar niet in bron`)
  }
  return verschillen
}

const { projectId, firebaseConfig, droog: DROOG } = await startScript()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
const uid = user.uid
console.log(`Ingelogd (uid: ${uid})\n`)

let gebruikerSnap, bron
try {
  gebruikerSnap = await getDoc(doc(db, 'gebruikers', uid))
  bron = await leesClubdata(db, uid)
} catch (e) {
  if (e.code === 'permission-denied') stop(`Firestore weigert het lezen in ${projectId}.`, ['Zijn de overgangsregels (scripts/firestore.rules.migratie) gepubliceerd met de juiste uid?'])
  stop(`lezen mislukt in ${projectId} (${e.code || e.message}).`)
}

if (!bron.profiel && bron.structuur.size === 0) {
  stop(`geen brondata gevonden onder clubs/${uid}.`, ['Niets te migreren (verkeerd account?).'])
}

const waarschuwingen = []
try {
  const instellingen = await getDocs(collection(db, 'clubs', uid, 'instellingen'))
  const extra = instellingen.docs.map(d => d.id).filter(id => id !== 'profiel')
  if (extra.length) waarschuwingen.push(`instellingen bevat onbekende documenten (niet gekopieerd): ${extra.join(', ')}`)
  for (const oud of ['pijlers', 'domeinen']) {
    const snap = await getDocs(collection(db, 'clubs', uid, oud))
    if (!snap.empty) waarschuwingen.push(`oude collectie "${oud}" bevat ${snap.size} documenten (niet gekopieerd, blijft in de bron staan)`)
  }
} catch (e) {
  waarschuwingen.push(`controle op onverwachte collecties mislukt: ${e.code || e.message}`)
}

const bestaandClubId = gebruikerSnap.exists() ? gebruikerSnap.data().clubId : null
const hergebruik = typeof bestaandClubId === 'string' && bestaandClubId.trim() !== ''
const clubId = hergebruik ? bestaandClubId : doc(collection(db, 'clubs')).id

let doelClub = null, doelLid = null, doel = { profiel: null, structuur: new Map() }
if (hergebruik) {
  try {
    const clubSnap = await getDoc(doc(db, 'clubs', clubId))
    const lidSnap = await getDoc(doc(db, 'clubs', clubId, 'leden', uid))
    doelClub = clubSnap.exists() ? clubSnap.data() : null
    doelLid = lidSnap.exists() ? lidSnap.data() : null
    doel = await leesClubdata(db, clubId)
  } catch (e) {
    stop(`lezen van bestaande doelclub mislukt (${e.code || e.message}).`)
  }
  if (doelClub?.gemigreerdVan && doelClub.gemigreerdVan !== uid) {
    stop(`doelclub ${clubId} is gemigreerd vanaf een ander account.`)
  }
}

const items = [...bron.structuur.values()]
const pijlers = items.filter(i => i.type === 'pijler').length
const domeinen = items.filter(i => i.type === 'domein').length
const overig = items.length - pijlers - domeinen

console.log('Samenvatting bron')
console.log(`  Bron:           clubs/${uid}`)
console.log(`  Clubnaam:       ${bron.profiel?.naam || '(geen)'}`)
console.log(`  Pijlers:        ${pijlers}`)
console.log(`  Domeinen:       ${domeinen}`)
if (overig) console.log(`  Overig type:    ${overig}`)
console.log(`  Logo aanwezig:  ${bron.profiel?.logo ? 'ja' : 'nee'}`)
console.log(`  Doel-clubId:    ${clubId}${hergebruik ? ' (bestaand, uit gebruikers/{uid})' : DROOG ? ' (voorbeeld; bij de echte run wordt een nieuw ID gemaakt)' : ' (nieuw)'}`)
for (const w of waarschuwingen) console.log(`  LET OP: ${w}`)

const aantalSchrijfacties = 3 + (bron.profiel ? 1 : 0) + bron.structuur.size
if (aantalSchrijfacties > MAX_DOCS) {
  stop(`te veel documenten voor één batch (${aantalSchrijfacties} > ${MAX_DOCS}).`)
}

const doelVerschillen = hergebruik ? vergelijkClubdata(bron, doel) : []
const doelHeeftData = !!doel.profiel || doel.structuur.size > 0
const koppelingCompleet = hergebruik && doelClub && doelLid?.rol && gebruikerSnap.data().clubId === clubId

if (hergebruik && doelHeeftData && doelVerschillen.length === 0 && koppelingCompleet) {
  console.log('\nDoel is al gelijk aan de bron en de koppeling is compleet. Niets te doen.')
  process.exit(0)
}

if (hergebruik && doelHeeftData && doelVerschillen.length) {
  console.log('\nWAARSCHUWING: de doelclub bevat al gegevens die afwijken van de bron.')
  console.log('Doorgaan overschrijft deze doeldocumenten met de bronversie (wijzigingen na de migratie gaan dan verloren).')
  for (const v of doelVerschillen) console.log(`  – ${v}`)
}

if (DROOG) {
  gelukt(`droogtest: ${aantalSchrijfacties} schrijfacties zouden worden uitgevoerd in ${projectId}.`, ['Er is niets geschreven.'])
  process.exit(0)
}

const antwoord = await vraag(`\nMigratie naar clubs/${clubId} uitvoeren (${aantalSchrijfacties} schrijfacties)? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets geschreven.'); process.exit(0) }

const batch = writeBatch(db)
batch.set(doc(db, 'clubs', clubId), {
  naam: bron.profiel?.naam || '',
  aangemaaktOp: doelClub?.aangemaaktOp || serverTimestamp(),
  gemigreerdVan: uid,
})
if (bron.profiel) batch.set(doc(db, 'clubs', clubId, 'instellingen', 'profiel'), bron.profiel)
for (const [id, data] of bron.structuur) batch.set(doc(db, 'clubs', clubId, 'structuurelementen', id), data)
batch.set(doc(db, 'clubs', clubId, 'leden', uid), {
  rol: 'beheerder',
  email: user.email,
  toegevoegdOp: doelLid?.toegevoegdOp || serverTimestamp(),
})
batch.set(doc(db, 'gebruikers', uid), { clubId })

console.log('\nSchrijven...')
try {
  await batch.commit()
} catch (e) {
  stop(`schrijven mislukt in ${projectId} (${e.code || e.message}).`, ['Een batch schrijft alles of niets.'])
}

console.log('Controleren...')
const fouten = []
try {
  const terug = await leesClubdata(db, clubId)
  fouten.push(...vergelijkClubdata(bron, terug))
  if (terug.structuur.size !== bron.structuur.size) fouten.push(`aantal structuurelementen: bron ${bron.structuur.size}, doel ${terug.structuur.size}`)

  const clubSnap = await getDoc(doc(db, 'clubs', clubId))
  if (!clubSnap.exists() || clubSnap.data().gemigreerdVan !== uid) fouten.push('clubdocument ontbreekt of heeft verkeerde gemigreerdVan')
  const lidSnap = await getDoc(doc(db, 'clubs', clubId, 'leden', uid))
  if (!lidSnap.exists() || lidSnap.data().rol !== 'beheerder') fouten.push('ledendocument ontbreekt of heeft geen rol "beheerder"')
  const gebSnap = await getDoc(doc(db, 'gebruikers', uid))
  if (!gebSnap.exists() || gebSnap.data().clubId !== clubId) fouten.push('gebruikers/{uid}.clubId wijst niet naar de doelclub')

  const bronNa = await leesClubdata(db, uid)
  const bronGewijzigd = vergelijkClubdata(bron, bronNa)
  if (bronGewijzigd.length) fouten.push(...bronGewijzigd.map(v => `BRON GEWIJZIGD: ${v}`))
} catch (e) {
  fouten.push(`terugleescontrole mislukt: ${e.code || e.message}`)
}

if (fouten.length) {
  console.log('\nVerschillen gevonden:')
  for (const f of fouten) console.log(`  – ${f}`)
  process.exit(1)
}

gelukt(`OK: profiel${bron.profiel?.logo ? ' (incl. logo)' : ''} en ${bron.structuur.size} structuurelementen gekopieerd naar clubs/${clubId} in ${projectId}. Bron ongewijzigd.`)
waarschuw('VOLGENDE STAP (3): publiceer nu firestore.rules.', ['De overgangsregels geven dit account toegang tot de hele database en mogen niet blijven staan.'])
process.exit(0)
