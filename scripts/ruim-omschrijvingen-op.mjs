// Omschrijvingen opruimen (CK-179): haalt het veld omschrijving weg bij domeinen, commissies, projecten
// en samenwerkingen. De app vraagt er niet meer om; de regels laten een oude alleen ongewijzigd staan.
// Een tweede keer draaien doet niets meer.
// Gebruik: node scripts/ruim-omschrijvingen-op.mjs [--droog] [--omgeving=test|productie]
//          npm run omschrijvingen:opruimen -- --droog

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, deleteField } from 'firebase/firestore'
import { DROOG, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, veilig } from './lib/omgeving.mjs'
import { OPRUIM_LIJSTEN, planOpruimen } from './lib/omschrijvingen-opruimen.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Omschrijvingen opruimen (CK-179)

Gebruik:  node scripts/ruim-omschrijvingen-op.mjs [--droog] [--omgeving=test|productie]

  --droog              alleen tonen welke omschrijvingen weggaan, niets schrijven
  --omgeving=test      standaard
  --omgeving=productie de productieclub (vraagt de projectnaam ter bevestiging)

Haalt het veld omschrijving weg bij domeinen, commissies, projecten en samenwerkingen.
Dit kan niet ongedaan worden gemaakt: de droogtest toont de teksten, bewaar ze als je ze wilt houden.
Publiceer eerst de CK-179-regels (npm run regels:test of regels:productie).
Exitcode 0 = alles opgeruimd of niets te doen, 1 = droogtest of afgebroken.`)
  process.exit(0)
}

const { projectId, omgeving, firebaseConfig } = await startScript()
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
const lijsten = {}
try {
  for (const naam of OPRUIM_LIJSTEN) lijsten[naam] = await lees(naam)
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const weg = planOpruimen(lijsten)
if (!weg.length) {
  gelukt('Niets te doen: er staat geen omschrijving meer in de database.')
  process.exit(0)
}

console.log(`Omschrijvingen die weggaan (${weg.length}):`)
for (const w of weg) console.log(veilig(`  ${w.lijst} / ${w.naam}: ${w.tekst || '(leeg)'}`))

if (DROOG) {
  console.log('\nDroogtest klaar. Er is niets geschreven.')
  process.exit(1)
}

const antwoord = await vraag(`\nDeze ${weg.length} omschrijving(en) definitief weghalen in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, er is niets geschreven.'); process.exit(1) }

let gedaan = 0
for (const w of weg) {
  try {
    await updateDoc(doc(db, 'clubs', clubId, w.lijst, w.id), { omschrijving: deleteField() })
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}
gelukt(`${gedaan} omschrijving(en) weggehaald in ${projectId}.`, ['Draai het script nog eens: dan hoort er "Niets te doen" te staan.'])
process.exit(0)
