// Eenmalig: HCA-domeinen inrichten volgens het Vermogensoverzicht v1.4 (CK-027).
// Zet volgorde 1-13, pictogram en eindverantwoordelijke; voegt ontbrekende domeinen toe.
// Bestaande omschrijvingen blijven staan. Gebruik: node scripts/inrichten-domeinen-hca.mjs [--droog]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore'
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

// [volgorde, type, naam, eindverantwoordelijke, icoon, omschrijving (alleen voor nieuwe domeinen)]
const DOMEINEN = [
  [1, 'domein', 'Bestuur', 'Voorzitter', 'bestuur'],
  [2, 'domein', 'Leden', 'Secretaris', 'leden', 'Ledenwerving, ledenbeheer, ledenbehoud, oudleden en lief & leed.'],
  [3, 'domein', 'Vrijwilligers', 'Secretaris', 'vrijwilligers', 'Werving, beheer en behoud van vrijwilligers.'],
  [4, 'domein', 'Relaties', 'Penningmeester', 'relaties', 'Sponsoren, fondsen, donateurs en kledingpartnerschap.'],
  [5, 'domein', 'Communicatie', 'Secretaris', 'communicatie'],
  [6, 'pijler', '#HCASpeelt', 'Bestuurslid Hockey', 'hcaspeelt'],
  [7, 'pijler', '#HCAGroeit', 'Bestuurslid Hockey', 'hcagroeit'],
  [8, 'pijler', '#HCADoet', 'Voorzitter', 'hcadoet'],
  [9, 'domein', 'Financiën', 'Penningmeester', 'financien'],
  [10, 'domein', 'Accommodatie', 'Bestuurslid Accommodatie', 'accommodatie', 'Onderhoud en beveiliging van ons park en clubhuis.'],
  [11, 'domein', 'Hospitality', 'Bestuurslid Hospitality', 'hospitality', 'Bar en keuken, catering, evenementen, verhuur en reserveringen.'],
  [12, 'domein', 'Materiaal', 'Bestuurslid Accommodatie', 'materiaal', 'Spelmateriaal en kleding.'],
  [13, 'domein', 'Digitaal', 'Voorzitter', 'digitaal', 'Website, licenties en systemen.'],
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

const col = collection(db, 'clubs', clubId, 'structuurelementen')
const sleutel = naam => (naam || '').trim().toLowerCase()
const bestaand = new Map((await getDocs(col)).docs.map(d => [sleutel(d.data().naam), d]))

const plan = []
for (const [volgorde, type, naam, verantwoordelijke, icoon, omschrijving] of DOMEINEN) {
  const d = bestaand.get(sleutel(naam))
  if (d) {
    const huidig = d.data()
    const wijziging = {}
    if (huidig.type !== type) wijziging.type = type
    if (huidig.volgorde !== volgorde) wijziging.volgorde = volgorde
    if (huidig.icoon !== icoon) wijziging.icoon = icoon
    if (huidig.verantwoordelijke !== verantwoordelijke) wijziging.verantwoordelijke = verantwoordelijke
    if (Object.keys(wijziging).length) plan.push({ actie: 'bijwerken', naam, id: d.id, data: wijziging })
    bestaand.delete(sleutel(naam))
  } else {
    plan.push({ actie: 'toevoegen', naam, data: { type, naam, omschrijving, verantwoordelijke, icoon, volgorde } })
  }
}

console.log(`${plan.length} wijzigingen:`)
for (const p of plan) {
  const velden = Object.entries(p.data).filter(([k]) => k !== 'naam' && k !== 'omschrijving').map(([k, v]) => `${k}=${v}`).join(', ')
  console.log(`  ${p.actie === 'toevoegen' ? '+' : '~'} ${p.naam}: ${velden}`)
}
for (const d of bestaand.values()) console.log(`  LET OP: "${d.data().naam}" staat niet in het Vermogensoverzicht; ongemoeid gelaten.`)

if (DROOG || plan.length === 0) {
  console.log(DROOG ? '\nDroogtest klaar. Niets geschreven.' : '\nNiets te doen.')
  process.exit(0)
}
const antwoord = await vraag(`\nDeze ${plan.length} wijzigingen uitvoeren? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets gewijzigd.'); process.exit(0) }

for (const p of plan) {
  if (p.actie === 'toevoegen') await addDoc(col, p.data)
  else await updateDoc(doc(col, p.id), p.data)
}
console.log(`\nKlaar: ${plan.filter(p => p.actie === 'toevoegen').length} toegevoegd, ${plan.filter(p => p.actie === 'bijwerken').length} bijgewerkt.`)
process.exit(0)
