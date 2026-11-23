// Controle van vermogens, naamdocumenten en tellers (CK-020).
// Herstelt wat de regels toestaan (naamdocumenten aanmaken of opruimen). Tellers, dubbele namen en
// vermogens bij een verdwenen domein herstelt het bewust niet: het meldt wat er in de console moet.
// Gebruik: node scripts/controleer-vermogens.mjs [--droog] [--omgeving=test|productie]
//          npm run vermogens:controle -- --droog

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { DROOG, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw, stop, veilig } from './lib/omgeving.mjs'
import { controleerVermogens } from './lib/vermogens-hca.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Vermogens controleren (CK-020)

Gebruik:  node scripts/controleer-vermogens.mjs [--droog] [--omgeving=test|productie]

  --droog              alleen controleren, niets herstellen
  --omgeving=test      standaard
  --omgeving=productie vraagt eerst de projectnaam (behalve met --droog)

Controleert tellers per domein, naamdocumenten, dubbele namen, ongeldige velden en vermogens
bij een ontbrekend of overkoepelend domein. Herstelt alleen naamdocumenten (na "ja").
Exitcode 0 = alles klopt, 1 = er zijn afwijkingen.`)
  process.exit(0)
}

const { omgeving, projectId, firebaseConfig } = await startScript()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log('Ingelogd.\n')

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const lees = async naam => (await getDocs(collection(db, 'clubs', clubId, naam))).docs.map(d => ({ id: d.id, ...d.data() }))
let domeinen, vermogens, namen
try {
  ;[domeinen, vermogens, namen] = await Promise.all([lees('structuurelementen'), lees('vermogens'), lees('vermogensnamen')])
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const { afwijkingen, herstel } = controleerVermogens({ domeinen, vermogens, namen })
console.log(`${vermogens.length} vermogens, ${namen.length} naamdocumenten, ${domeinen.length} domeinen gecontroleerd.`)

if (afwijkingen.length === 0 && herstel.length === 0) {
  gelukt('Alles klopt.')
  process.exit(0)
}

if (afwijkingen.length) {
  waarschuw(`${afwijkingen.length} afwijking(en) die dit script niet herstelt:`, afwijkingen.map(a => `- ${a}`))
}
if (herstel.length) {
  console.log(`${herstel.length} herstelbare afwijking(en):`)
  for (const h of herstel) console.log(veilig(`  ${h.soort === 'naam-weg' ? '-' : '+'} ${h.tekst}`))
}

if (DROOG || herstel.length === 0) {
  console.log(DROOG && herstel.length ? '\nDroogtest klaar. Niets hersteld.' : '')
  process.exit(1)
}

const antwoord = await vraag(`\nDeze ${herstel.length} naamdocument(en) herstellen in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets hersteld.'); process.exit(1) }

let gedaan = 0
for (const h of herstel) {
  const ref = doc(db, 'clubs', clubId, 'vermogensnamen', h.sleutel)
  try {
    if (h.soort === 'naam-weg') await deleteDoc(ref)
    else await setDoc(ref, { vermogenId: h.vermogenId })
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}

if (afwijkingen.length) {
  stop(`${gedaan} naamdocument(en) hersteld; ${afwijkingen.length} afwijking(en) blijven over (zie hierboven).`, ['Draai het script opnieuw na het herstel in de console of in Beheer.'], null, 'LET OP')
}
gelukt(`${gedaan} naamdocument(en) hersteld in ${projectId}.`, ['Draai het script nog eens: dan hoort er "Alles klopt" te staan.'])
process.exit(0)
