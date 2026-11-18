// Eenmalige migratie: pijlers + domeinen → structuurelementen
// Gebruik: node scripts/migrate.mjs

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore'
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
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    if (verborgen) process.stdout.write(prompt)
    rl.question(verborgen ? '' : prompt, ans => { rl.close(); if (verborgen) console.log(); resolve(ans) })
  })
}

const env = leesEnv()

const email = process.argv[2] || await vraag('E-mailadres: ')
const wachtwoord = process.argv[3] || await vraag('Wachtwoord: ', true)

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

const uid = user.uid
console.log(`Ingelogd (uid: ${uid})\n`)

const pijlersSnap = await getDocs(collection(db, 'clubs', uid, 'pijlers'))
const pijlers = pijlersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

const domeinenSnap = await getDocs(collection(db, 'clubs', uid, 'domeinen'))
const domeinen = domeinenSnap.docs.map(d => ({ id: d.id, ...d.data() }))

console.log(`Gevonden: ${pijlers.length} pijler(s), ${domeinen.length} domein(en)`)

if (pijlers.length === 0 && domeinen.length === 0) {
  console.log('Niets te migreren.')
  process.exit(0)
}

console.log()
for (const p of pijlers) {
  await addDoc(collection(db, 'clubs', uid, 'structuurelementen'), {
    type: 'pijler',
    naam: p.naam || '',
    omschrijving: p.slogan || '',
    ...(p.verantwoordelijke ? { verantwoordelijke: p.verantwoordelijke } : {}),
  })
  console.log(`  ✓ Pijler: ${p.naam}`)
}

for (const d of domeinen) {
  await addDoc(collection(db, 'clubs', uid, 'structuurelementen'), {
    type: 'domein',
    naam: d.naam || '',
    omschrijving: d.omschrijving || '',
  })
  console.log(`  ✓ Domein: ${d.naam}`)
}

console.log('\nMigratie voltooid!')
console.log('Tip: de originele pijlers/domeinen collecties zijn niet verwijderd (veiligheid).')
process.exit(0)
