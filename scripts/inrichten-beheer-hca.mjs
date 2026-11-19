// Eenmalig (CK-028): bestuursfuncties als masterdata en de overkoepelende domeinen.
// - maakt de 6 officiële bestuursfuncties aan (als ze ontbreken)
// - voegt Projecten (14) en Samenwerkingen (15) toe als overkoepelend domein
// - koppelt elk domein via bestuursfunctieId en verwijdert het oude tekstveld 'verantwoordelijke'
// Gebruik: node scripts/inrichten-beheer-hca.mjs [--droog]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteField } from 'firebase/firestore'
import { createInterface } from 'readline'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function leesEnv() {
  return Object.fromEntries(
    readFileSync(join(__dir, '..', '.env'), 'utf-8').split('\n')
      .map(r => r.trim())
      .filter(r => r && !r.startsWith('#') && r.includes('='))
      .map(r => { const i = r.indexOf('='); return [r.slice(0, i).trim(), r.slice(i + 1).trim()] })
  )
}

function vraag(prompt, verborgen = false) {
  if (verborgen && process.stdin.isTTY) return vraagVerborgen(prompt)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(prompt, ans => { rl.close(); resolve(ans) })
  })
}

// Leest invoer zonder iets op het scherm te tonen (geen tekens, geen sterretjes)
function vraagVerborgen(prompt) {
  return new Promise(resolve => {
    const stdin = process.stdin
    let invoer = ''
    process.stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const opToets = tekens => {
      for (const t of tekens) {
        if (t === '\r' || t === '\n' || t === '\u0004') {        // Enter / Ctrl+D
          stdin.setRawMode(false)
          stdin.pause()
          stdin.removeListener('data', opToets)
          process.stdout.write('\n')
          return resolve(invoer)
        } else if (t === '\u0003') {                             // Ctrl+C
          stdin.setRawMode(false)
          process.stdout.write('\n')
          process.exit(130)
        } else if (t === '\u007f' || t === '\b') {              // Backspace
          invoer = invoer.slice(0, -1)
        } else if (t >= ' ') {
          invoer += t
        }
      }
    }
    stdin.on('data', opToets)
  })
}

const DROOG = process.argv.includes('--droog')

const FUNCTIES = ['Voorzitter', 'Secretaris', 'Penningmeester', 'Bestuurslid Hockey', 'Bestuurslid Accommodatie', 'Bestuurslid Hospitality']

// domein → bestuursfunctie (Vermogensoverzicht v1.4; Projecten en Samenwerkingen: Voorzitter)
const KOPPELING = {
  'Bestuur': 'Voorzitter', 'Leden': 'Secretaris', 'Vrijwilligers': 'Secretaris', 'Relaties': 'Penningmeester',
  'Communicatie': 'Secretaris', '#HCASpeelt': 'Bestuurslid Hockey', '#HCAGroeit': 'Bestuurslid Hockey',
  '#HCADoet': 'Voorzitter', 'Financiën': 'Penningmeester', 'Accommodatie': 'Bestuurslid Accommodatie',
  'Hospitality': 'Bestuurslid Hospitality', 'Materiaal': 'Bestuurslid Accommodatie', 'Digitaal': 'Voorzitter',
  'Projecten': 'Voorzitter', 'Samenwerkingen': 'Voorzitter',
}

const NIEUWE_DOMEINEN = [
  { type: 'overkoepelend', naam: 'Projecten', omschrijving: 'Tijdelijke trajecten, zoals verbouw, LED-scorebord en buitenopslag.', icoon: 'projecten', volgorde: 14 },
  { type: 'overkoepelend', naam: 'Samenwerkingen', omschrijving: 'Partners buiten de club: KNHB, gemeente, Junis, scholen en hulpdiensten.', icoon: 'samenwerkingen', volgorde: 15 },
]

if (DROOG) console.log('DROOGTEST: er wordt niets geschreven.\n')


const env = leesEnv()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
let user
try {
  ({ user } = await signInWithEmailAndPassword(auth, email, wachtwoord))
} catch (e) {
  console.error(`Inloggen mislukt: ${e.code}`)
  process.exit(1)
}
console.log('Ingelogd.\n')

let clubId = null
try {
  const g = await getDoc(doc(db, 'gebruikers', user.uid))
  clubId = g.exists() ? g.data().clubId : null
} catch (e) {
  console.error(`Club opzoeken mislukt: ${e.code || e.message}`)
  process.exit(1)
}
if (!clubId) {
  console.error('Dit account is niet aan een club gekoppeld.')
  process.exit(1)
}

const sleutel = naam => (naam || '').trim().toLowerCase()
const colF = collection(db, 'clubs', clubId, 'bestuursfuncties')
const colD = collection(db, 'clubs', clubId, 'structuurelementen')
const functies = new Map((await getDocs(colF)).docs.map(d => [sleutel(d.data().naam), { id: d.id, ...d.data() }]))
const domeinen = (await getDocs(colD)).docs.map(d => ({ id: d.id, ...d.data() }))

// 1. Bestuursfuncties
const nieuweFuncties = FUNCTIES.filter(n => !functies.has(sleutel(n)))
console.log(`Bestuursfuncties: ${FUNCTIES.length - nieuweFuncties.length} bestaan al, ${nieuweFuncties.length} nieuw`)
nieuweFuncties.forEach(n => console.log(`  + ${n}`))

// 2. Nieuwe domeinen
const bestaandeNamen = new Set(domeinen.map(d => sleutel(d.naam)))
const nieuweDomeinen = NIEUWE_DOMEINEN.filter(d => !bestaandeNamen.has(sleutel(d.naam)))
console.log(`\nNieuwe domeinen: ${nieuweDomeinen.length}`)
nieuweDomeinen.forEach(d => console.log(`  + ${d.naam} (overkoepelend, plek ${d.volgorde}, ${KOPPELING[d.naam]})`))

// 3. Koppelingen
const alleDomeinen = [...domeinen, ...nieuweDomeinen.map(d => ({ ...d, nieuw: true }))]
console.log('\nKoppeling domein → bestuursfunctie:')
let ontbreekt = 0
for (const d of alleDomeinen) {
  const f = KOPPELING[d.naam]
  if (!f) { console.log(`  LET OP: geen koppeling bekend voor "${d.naam}"; ongemoeid gelaten.`); ontbreekt++; continue }
  console.log(`  ${d.naam} → ${f}${d.verantwoordelijke && d.verantwoordelijke !== f ? `  (was "${d.verantwoordelijke}")` : ''}`)
}

if (DROOG) { console.log('\nDroogtest klaar. Niets geschreven.'); process.exit(0) }
const antwoord = await vraag('\nUitvoeren? Typ "ja": ')
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets gewijzigd.'); process.exit(0) }

let volgorde = Math.max(0, ...[...functies.values()].map(f => (typeof f.volgorde === 'number' ? f.volgorde : 0)))
for (const naam of FUNCTIES) {
  if (functies.has(sleutel(naam))) continue
  const ref = await addDoc(colF, { naam, volgorde: ++volgorde })
  functies.set(sleutel(naam), { id: ref.id, naam })
}
const idVan = naam => functies.get(sleutel(naam))?.id

for (const d of nieuweDomeinen) await addDoc(colD, { ...d, bestuursfunctieId: idVan(KOPPELING[d.naam]) })
let gekoppeld = 0
for (const d of domeinen) {
  const f = KOPPELING[d.naam]
  if (!f) continue
  const data = { bestuursfunctieId: idVan(f) }
  if ('verantwoordelijke' in d) data.verantwoordelijke = deleteField()
  await updateDoc(doc(colD, d.id), data)
  gekoppeld++
}
console.log(`\nKlaar: ${nieuweFuncties.length} bestuursfuncties en ${nieuweDomeinen.length} domeinen toegevoegd, ${gekoppeld} domeinen gekoppeld.${ontbreekt ? ` ${ontbreekt} zonder koppeling.` : ''}`)
process.exit(0)
