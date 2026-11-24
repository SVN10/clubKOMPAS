// Eenmalig: HCA-domeinen inrichten volgens het Vermogensoverzicht v1.4 (CK-027).
// Zet volgorde 1-13, pictogram en eindverantwoordelijke; voegt ontbrekende domeinen toe.
// Bestaande omschrijvingen blijven staan.
// Gebruik: node scripts/inrichten-domeinen-hca.mjs [--droog] [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore'
import { startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, veilig } from './lib/omgeving.mjs'

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

const { omgeving, projectId, firebaseConfig, droog: DROOG } = await startScript()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log('Ingelogd.\n')

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const col = collection(db, 'clubs', clubId, 'structuurelementen')
const sleutel = naam => (naam || '').trim().toLowerCase()
let bestaand
try {
  bestaand = new Map((await getDocs(col)).docs.map(d => [sleutel(d.data().naam), d]))
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

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
  console.log(veilig(`  ${p.actie === 'toevoegen' ? '+' : '~'} ${p.naam}: ${velden}`))
}
for (const d of bestaand.values()) console.log(veilig(`  LET OP: "${d.data().naam}" staat niet in het Vermogensoverzicht; ongemoeid gelaten.`))

if (DROOG || plan.length === 0) {
  console.log(DROOG ? '\nDroogtest klaar. Niets geschreven.' : '\nNiets te doen.')
  process.exit(0)
}
const antwoord = await vraag(`\nDeze ${plan.length} wijzigingen uitvoeren? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets gewijzigd.'); process.exit(0) }

let gedaan = 0
for (const p of plan) {
  try {
    if (p.actie === 'toevoegen') await addDoc(col, p.data)
    else await updateDoc(doc(col, p.id), p.data)
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}
gelukt(`${plan.filter(p => p.actie === 'toevoegen').length} toegevoegd, ${plan.filter(p => p.actie === 'bijwerken').length} bijgewerkt in ${projectId}.`)
process.exit(0)
