// Eenmalig: de 58 HCA-vermogens neerzetten (CK-020), verdeeld over 13 pijlers en ondersteunende domeinen.
// Idempotent: een vermogen dat al bij zijn domein staat, wordt overgeslagen. Verwijdert, hernoemt en verplaatst nooit.
// Eén transactie per vermogen (vermogen + naamdocument + teller op het domein), zoals de app.
// Gebruik: node scripts/inrichten-vermogens-hca.mjs [--droog] [--omgeving=test|productie]
//          npm run vermogens:import -- --droog

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { DROOG, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw, stop, veilig } from './lib/omgeving.mjs'
import { voegVermogenToe } from '../src/vermogens.js'
import { maakImportplan, HCA_VERMOGENS } from './lib/vermogens-hca.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Vermogens van HCA inrichten (CK-020)

Gebruik:  node scripts/inrichten-vermogens-hca.mjs [--droog] [--omgeving=test|productie]

  --droog              toon het plan, schrijf niets
  --omgeving=test      standaard
  --omgeving=productie vraagt eerst de projectnaam

Eerst wordt het hele plan opgesteld. Ontbreekt een domein, is het dubbel of overkoepelend,
of voldoet een naam niet, dan stopt het script zonder te schrijven. Daarna "ja" typen.
Controleer het resultaat met npm run vermogens:controle.`)
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

const { fouten, plan, overgeslagen, letOp } = maakImportplan({ domeinen, vermogens, namen })
const totaal = HCA_VERMOGENS.reduce((n, [, lijst]) => n + lijst.length, 0)

if (fouten.length) stop('het plan klopt niet.', fouten.map(f => `- ${f}`))

console.log(`${totaal} vermogens in de bronlijst: ${plan.length} nieuw, ${overgeslagen.length} al aanwezig, ${letOp.length} met een opmerking.\n`)
const volgende = new Map()
for (const p of plan) {
  const bestaand = vermogens.filter(v => v.domeinId === p.domeinId).reduce((m, v) => (Number.isInteger(v.volgorde) ? Math.max(m, v.volgorde) : m), 0)
  const nr = (volgende.get(p.domeinId) ?? bestaand) + 1
  volgende.set(p.domeinId, nr)
  console.log(veilig(`  + ${p.naam} → ${p.domeinNaam} (${nr})`))
}
if (letOp.length) waarschuw(`${letOp.length} vermogen(s) ongemoeid gelaten:`, letOp)

if (DROOG || plan.length === 0) {
  console.log(DROOG ? '\nDroogtest klaar. Niets geschreven.' : '\nNiets te doen.')
  process.exit(0)
}
const antwoord = await vraag(`\nDeze ${plan.length} vermogens toevoegen in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets geschreven.'); process.exit(0) }

let gedaan = 0
for (const p of plan) {
  try {
    await voegVermogenToe(db, clubId, { naam: p.naam, domeinId: p.domeinId })
  } catch (e) {
    if (e?.code === 'dubbel-vermogen' || e?.code === 'naam-bezet') {
      waarschuw(`"${p.naam}" bestaat intussen al; overgeslagen.`)
      continue
    }
    console.error(veilig(`Gestopt bij "${p.naam}" → ${p.domeinNaam} (${gedaan} van ${plan.length} toegevoegd).`))
    geweigerd(e?.oorzaak || e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}
gelukt(`${gedaan} vermogens toegevoegd in ${projectId}.`, ['Controleer met npm run vermogens:controle.'])
process.exit(0)
