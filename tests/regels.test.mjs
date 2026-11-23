// Regeltests CK-020 met de Firestore-emulator (besluit 11). Geen login, geen echt project.
// Draaien: npm run test:regels (start de emulator met project demo-clubkompas en draait dit bestand).

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, setLogLevel,
} from 'firebase/firestore'
import {
  voegVermogenToe, hernoemVermogen, verplaatsVermogen, verwijderVermogen, controleerNaamVrij,
  laadVermogens, normaliseerVermogensnaam, vermogensnaamFout, naamSleutel,
} from '../src/vermogens.js'
import { HCA_VERMOGENS, maakImportplan, controleerVermogens } from '../scripts/lib/vermogens-hca.mjs'
import {
  SOORT_ONDERDEEL, onderdeelnaamFout, periodeTekst, datumFout, geldigOnderdeel, onderdeelVelden, naamBezet,
  laadOnderdelen, voegOnderdeelToe, bewerkOnderdeel, verwijderOnderdeel,
} from '../src/onderdelen.js'
import { HCA_ONDERDELEN, maakOnderdelenPlan } from '../scripts/lib/onderdelen-hca.mjs'

const CLUB = 'club1'
// De bronlijst (CK-020-bron-vermogensoverzicht.md) bevat 58 namen (13 + 45), bevestigd tegen het HCA-overzicht v1.4.
// Zie het bouwverslag: het script importeert precies de namen uit de bron.
const BRON_AANTAL = 58
let env
let db
let buiten

const pad = (...delen) => ['clubs', CLUB, ...delen]
const admin = async fn => {
  let uitkomst
  await env.withSecurityRulesDisabled(async ctx => { uitkomst = await fn(ctx.firestore()) })
  return uitkomst
}
const lees = async (...delen) => admin(async a => {
  const s = await getDoc(doc(a, ...pad(...delen)))
  return s.exists() ? s.data() : null
})
const aantal = async naam => admin(async a => (await getDocs(collection(a, ...pad(naam)))).size)
const fout = async belofte => {
  try { await belofte } catch (e) { return e }
  assert.fail('verwacht een fout')
}

// Domeinen zoals in de testclub: zonder tellerveld (= 0)
const DOMEINEN = {
  speelt: { type: 'pijler', naam: '#HCASpeelt', volgorde: 6 },
  leden: { type: 'domein', naam: 'Leden', volgorde: 2 },
  vrijw: { type: 'domein', naam: 'Vrijwilligers', volgorde: 3 },
  fin: { type: 'domein', naam: 'Financiën', volgorde: 9 },
  proj: { type: 'overkoepelend', naam: 'Projecten', volgorde: 14 },
}

before(async () => {
  setLogLevel('silent')
  env = await initializeTestEnvironment({
    projectId: 'demo-clubkompas',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

after(async () => { await env?.cleanup() })

beforeEach(async () => {
  await env.clearFirestore()
  await admin(async a => {
    await setDoc(doc(a, 'gebruikers', 'jan'), { clubId: CLUB })
    await setDoc(doc(a, 'clubs', CLUB), { naam: 'Testclub' })
    await setDoc(doc(a, ...pad('leden', 'jan')), { rol: 'beheerder' })
    for (const [id, d] of Object.entries(DOMEINEN)) await setDoc(doc(a, ...pad('structuurelementen', id)), d)
    await setDoc(doc(a, ...pad('bestuursfuncties', 'vz')), { naam: 'Voorzitter', volgorde: 1 })
  })
  db = env.authenticatedContext('jan').firestore()
  buiten = env.authenticatedContext('piet').firestore()
})

// Schrijft een vermogen buiten het app-protocol om (zoals via devtools), met instelbare onderdelen
function rauwToevoegen(fs, {
  id = 'v1', naam = 'Teamindeling', domeinId = 'speelt', volgorde = 1, extra = {},
  sleutel = naam.toLowerCase(), metNaam = true, naamVoor = id, stap = 1, laatste = id, metTeller = true, tellerVan = 0,
} = {}) {
  const b = writeBatch(fs)
  b.set(doc(fs, ...pad('vermogens', id)), { naam, domeinId, volgorde, ...extra })
  if (metNaam) b.set(doc(fs, ...pad('vermogensnamen', sleutel)), { vermogenId: naamVoor })
  if (metTeller) b.update(doc(fs, ...pad('structuurelementen', domeinId)), { aantalVermogens: tellerVan + stap, laatsteVermogenId: laatste })
  return b.commit()
}

describe('naamregels in de app', () => {
  test('normaliseren: NFC, trim en enkele spaties', () => {
    assert.equal(normaliseerVermogensnaam('  Lief   &  Leed '), 'Lief & Leed')
    assert.equal(normaliseerVermogensnaam('Café'), 'Café')
  })
  test('veldfouten volgens het ontwerp', () => {
    assert.equal(vermogensnaamFout(''), 'Vul een naam in.')
    assert.equal(vermogensnaamFout('A'), 'Een naam heeft minimaal 2 tekens.')
    assert.match(vermogensnaamFout('x'.repeat(104)), /maximaal 100 tekens\. Nu zijn het er 104\./)
    assert.equal(vermogensnaamFout('-Catering'), 'Begin de naam met een letter of cijfer.')
    assert.match(vermogensnaamFout('a/b'), /^Het teken \/ kan niet in een naam\. Gebruik letters/)
    assert.match(vermogensnaamFout('a/b_c#d@e'), /^De tekens \/, _ en # kunnen niet in een naam\./)
    assert.match(vermogensnaamFout('Feest 🎉'), /^Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji\./)
    assert.match(vermogensnaamFout('İstanbul'), /^Het teken İ kan niet/)
    assert.match(vermogensnaamFout('<b>'), /^De tekens < en > kunnen niet/)
    assert.equal(vermogensnaamFout('xy'), '')
    assert.equal(vermogensnaamFout('x'.repeat(100)), '')
    for (const n of ['Lief & Leed', 'Bar- en keukenbeheer', 'G-hockey', 'Ver(nieuw)bouw', 'Hoofdsponsoring 27+', 'Ærø, Ñandú en ß']) {
      assert.equal(vermogensnaamFout(n), '', n)
    }
  })
  test('alle HCA-namen uit de bron voldoen', () => {
    const namen = HCA_VERMOGENS.flatMap(([, l]) => l)
    assert.equal(namen.length, BRON_AANTAL)
    assert.equal(HCA_VERMOGENS.length, 13)
    for (const n of namen) assert.equal(vermogensnaamFout(n), '', n)
    assert.ok(namen.includes('Parkonderhoud') && namen.includes('Parkbeveiliging'))
    assert.ok(!namen.includes('Onderhoud') && !namen.includes('Beveiliging'))
  })
})

describe('app-protocol (transacties) slaagt', () => {
  test('toevoegen: vermogen, naamdocument en teller +1', async () => {
    const { id, volgorde } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    assert.equal(volgorde, 1)
    assert.deepEqual(await lees('vermogens', id), { naam: 'Teamindeling', domeinId: 'speelt', volgorde: 1 })
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    const d = await lees('structuurelementen', 'speelt')
    assert.equal(d.aantalVermogens, 1)
    assert.equal(d.laatsteVermogenId, id)
    const tweede = await voegVermogenToe(db, CLUB, { naam: 'Coachaanstelling', domeinId: 'speelt' })
    assert.equal(tweede.volgorde, 2)
    assert.equal((await lees('structuurelementen', 'speelt')).aantalVermogens, 2)
  })

  test('namen met accenten (Latin-1) en hoofdletters: regex en lower() in de regels', async () => {
    for (const naam of ['Lijncoördinatie', 'ÉÉN ÇA ÑÜ', 'Ærø Øst', 'ÀÖØöøÿ', 'Straße', 'Lief & Leed', "Bar- en keuken (oud), 2+'s."]) {
      await assertSucceeds(voegVermogenToe(db, CLUB, { naam, domeinId: 'fin' }))
      assert.ok(await lees('vermogensnamen', naamSleutel(naam)), naam)
    }
    const e = await fout(voegVermogenToe(db, CLUB, { naam: 'één ça ñü', domeinId: 'leden' }))
    assert.equal(e.code, 'dubbel-vermogen')
  })

  test('hoofdletter met accent: zelfde sleutel als in de app, hernoemen alleen hoofdletters', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Éénheid', domeinId: 'leden' })
    assert.deepEqual(await lees('vermogensnamen', 'éénheid'), { vermogenId: id })
    await assertSucceeds(hernoemVermogen(db, CLUB, id, 'ÉÉNHEID'))
    assert.deepEqual(await lees('vermogensnamen', 'éénheid'), { vermogenId: id })
    await assertFails(rauwToevoegen(db, { id: 'v9', naam: 'ÉénHeid', domeinId: 'fin', sleutel: 'Éénheid' }))
    await assertFails(rauwToevoegen(db, { id: 'v9', naam: 'Öland', domeinId: 'fin', sleutel: 'Öland' }))
    await assertSucceeds(rauwToevoegen(db, { id: 'v9', naam: 'Öland', domeinId: 'fin', sleutel: 'öland' }))
  })

  test('alle HCA-namen worden door de regels geaccepteerd', async () => {
    for (const [, lijst] of HCA_VERMOGENS) {
      for (const naam of lijst) await voegVermogenToe(db, CLUB, { naam, domeinId: 'leden' })
    }
    assert.equal(await aantal('vermogens'), BRON_AANTAL)
    assert.equal(await aantal('vermogensnamen'), BRON_AANTAL)
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, BRON_AANTAL)
  })

  test('dubbele naam (andere hoofdletters, extra spaties, ander domein) geweigerd met het domein', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const e = await fout(voegVermogenToe(db, CLUB, { naam: normaliseerVermogensnaam('  teamINDELING '), domeinId: 'leden' }))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, '#HCASpeelt')
    assert.equal(e.zelfdeDomein, false)
    const z = await fout(voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' }))
    assert.equal(z.zelfdeDomein, true)
    assert.equal(await aantal('vermogens'), 1)
  })

  test('los naamdocument zonder vermogen geeft naam-bezet', async () => {
    await admin(a => setDoc(doc(a, ...pad('vermogensnamen', 'kascontrole')), { vermogenId: 'weg' }))
    const e = await fout(voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' }))
    assert.equal(e.code, 'naam-bezet')
  })

  test('domein verdwenen of overkoepelend: eigen foutcode, niets geschreven', async () => {
    assert.equal((await fout(voegVermogenToe(db, CLUB, { naam: 'Nieuw', domeinId: 'bestaatniet' }))).code, 'domein-weg')
    assert.equal((await fout(voegVermogenToe(db, CLUB, { naam: 'Nieuw', domeinId: 'proj' }))).code, 'domein-overkoepelend')
    assert.equal(await aantal('vermogens'), 0)
  })

  test('hernoemen: alleen hoofdletters houdt het naamdocument; andere naam ruimt het oude op', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await hernoemVermogen(db, CLUB, id, 'teamindeling')
    assert.equal((await lees('vermogens', id)).naam, 'teamindeling')
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    await hernoemVermogen(db, CLUB, id, 'Teamsamenstelling')
    assert.equal(await lees('vermogensnamen', 'teamindeling'), null)
    assert.deepEqual(await lees('vermogensnamen', 'teamsamenstelling'), { vermogenId: id })
    await assertSucceeds(voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'leden' }))
    const e = await fout(hernoemVermogen(db, CLUB, id, 'TEAMINDELING'))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, 'Leden')
  })

  test('verplaatsen: onderaan in het nieuwe domein, tellers −1 en +1', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Vrijwilligerswerving', domeinId: 'vrijw' })
    const { volgorde } = await verplaatsVermogen(db, CLUB, a.id, 'vrijw')
    assert.equal(volgorde, 2)
    assert.equal((await lees('vermogens', a.id)).domeinId, 'vrijw')
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 0)
    assert.equal((await lees('structuurelementen', 'vrijw')).aantalVermogens, 2)
    assert.equal((await fout(verplaatsVermogen(db, CLUB, a.id, 'proj'))).code, 'domein-overkoepelend')
  })

  test('hernoemen én verplaatsen: naamcheck vooraf, dan twee transacties', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Kledingpartnerschap', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Contentcreatie', domeinId: 'fin' })
    const e = await fout(controleerNaamVrij(db, CLUB, 'contentcreatie', a.id, 'vrijw'))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, 'Financiën')
    await controleerNaamVrij(db, CLUB, 'Kledingafspraken', a.id, 'vrijw')
    await verplaatsVermogen(db, CLUB, a.id, 'vrijw')
    await hernoemVermogen(db, CLUB, a.id, 'Kledingafspraken')
    assert.deepEqual(await lees('vermogens', a.id), { naam: 'Kledingafspraken', domeinId: 'vrijw', volgorde: 1 })
  })

  test('verwijderen: vermogen en naamdocument weg, teller −1, naam weer vrij', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await verwijderVermogen(db, CLUB, id)
    assert.equal(await lees('vermogens', id), null)
    assert.equal(await lees('vermogensnamen', 'kascontrole'), null)
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 0)
    await assertSucceeds(voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' }))
    assert.equal((await fout(verwijderVermogen(db, CLUB, 'bestaatniet'))).code, 'vermogen-weg')
  })

  test('↑/↓: alleen volgorde in één batch, ook voor alle HCA-vermogens tegelijk', async () => {
    for (const [, lijst] of HCA_VERMOGENS) for (const naam of lijst) await voegVermogenToe(db, CLUB, { naam, domeinId: 'leden' })
    const lijst = (await laadVermogens(db, CLUB)).sort((x, y) => x.volgorde - y.volgorde).reverse()
    const b = writeBatch(db)
    lijst.forEach((v, k) => b.update(doc(db, ...pad('vermogens', v.id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
  })

  test('verweesd vermogen (domein via de console verwijderd) is te verplaatsen en te verwijderen', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const b = await voegVermogenToe(db, CLUB, { naam: 'Twee', domeinId: 'leden' })
    await admin(x => deleteDoc(doc(x, ...pad('structuurelementen', 'leden'))))
    await assertSucceeds(verplaatsVermogen(db, CLUB, a.id, 'fin'))
    await assertSucceeds(verwijderVermogen(db, CLUB, b.id))
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 1)
  })

  test('twee tabbladen tegelijk dezelfde naam: één wint, tellers kloppen', async () => {
    const db2 = env.authenticatedContext('jan').firestore()
    const uitkomst = await Promise.allSettled([
      voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' }),
      voegVermogenToe(db2, CLUB, { naam: 'Ledenwerving', domeinId: 'vrijw' }),
    ])
    assert.equal(uitkomst.filter(u => u.status === 'fulfilled').length, 1)
    const mis = uitkomst.find(u => u.status === 'rejected').reason
    assert.ok(['dubbel-vermogen', 'aborted', 'permission-denied'].includes(mis.code), mis.code)
    assert.equal(await aantal('vermogens'), 1)
    assert.equal(await aantal('vermogensnamen'), 1)
    const som = ((await lees('structuurelementen', 'leden')).aantalVermogens ?? 0) + ((await lees('structuurelementen', 'vrijw')).aantalVermogens ?? 0)
    assert.equal(som, 1)
  })
})

describe('regels weigeren buiten het protocol om', () => {
  test('vermogen zonder naamdocument en teller (addDoc)', async () => {
    await assertFails(addDoc(collection(db, ...pad('vermogens')), { naam: 'Teamindeling', domeinId: 'speelt', volgorde: 1 }))
  })
  test('vermogen zonder teller +1', async () => {
    await assertFails(rauwToevoegen(db, { metTeller: false }))
  })
  test('vermogen zonder naamdocument', async () => {
    await assertFails(rauwToevoegen(db, { metNaam: false }))
  })
  test('vermogen met teller +2', async () => {
    await assertFails(rauwToevoegen(db, { stap: 2 }))
  })
  test('teller +1 toegeschreven aan een ander vermogen', async () => {
    await assertFails(rauwToevoegen(db, { laatste: 'ander' }))
  })
  test('naamdocument dat naar een ander vermogen wijst', async () => {
    await assertFails(rauwToevoegen(db, { naamVoor: 'ander' }))
  })
  test('naamdocument met een andere sleutel dan de naam', async () => {
    await assertFails(rauwToevoegen(db, { sleutel: 'iets-anders' }))
  })
  test('bij een overkoepelend of niet-bestaand domein', async () => {
    await assertFails(rauwToevoegen(db, { domeinId: 'proj' }))
    await assertFails(rauwToevoegen(db, { domeinId: 'bestaatniet', metTeller: false }))
  })
  test('extra velden of geen geldige volgorde', async () => {
    await assertFails(rauwToevoegen(db, { extra: { status: 'x' } }))
    await assertFails(rauwToevoegen(db, { volgorde: 1.5 }))
    await assertFails(rauwToevoegen(db, { volgorde: 0 }))
    await assertFails(rauwToevoegen(db, { volgorde: '1' }))
  })
  test('het protocol zelf is geldig (controle op rauwToevoegen)', async () => {
    await assertSucceeds(rauwToevoegen(db))
  })
  test('ongeldige namen, ook met correct protocol', async () => {
    const namen = ['A', 'x'.repeat(101), 'a_b', 'Feest 🎉', 'İstanbul', '<b>', ' Voorspatie', 'Achterspatie ', 'Dubbel  spatie', '-Catering', 'a:b', 'Tab\tje', 'µ-meting', 'a×b', 'Œuvre']
    for (const [k, naam] of namen.entries()) await assertFails(rauwToevoegen(db, { id: `o${k}`, naam }))
  })
  test('lengtegrenzen 2 en 100 tekens toegestaan', async () => {
    await assertSucceeds(rauwToevoegen(db, { id: 'kort', naam: 'Ab' }))
    const lang = 'L'.repeat(100)
    await assertSucceeds(rauwToevoegen(db, { id: 'lang', naam: lang, tellerVan: 1 }))
  })
  test('tweede vermogen met een bestaande sleutel', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(rauwToevoegen(db, { id: 'v2', naam: 'TeamIndeling', domeinId: 'leden' }))
    await assertFails(rauwToevoegen(db, { id: 'v2', naam: 'TeamIndeling', domeinId: 'leden', metNaam: false }))
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
  })
  test('naamdocument wijzigen of te vroeg verwijderen', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const ref = doc(db, ...pad('vermogensnamen', 'teamindeling'))
    await assertFails(updateDoc(ref, { vermogenId: 'ander' }))
    await assertFails(setDoc(ref, { vermogenId: id }))
    await assertFails(deleteDoc(ref))
    await assertFails(setDoc(doc(db, ...pad('vermogensnamen', 'kascontrole')), { vermogenId: id }))
  })
  test('hernoemen zonder het oude naamdocument op te ruimen', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { naam: 'Teamsamenstelling' })
    b.set(doc(db, ...pad('vermogensnamen', 'teamsamenstelling')), { vermogenId: id })
    await assertFails(b.commit())
  })
  test('vermogen verwijderen zonder teller −1 of met het naamdocument nog staand', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await assertFails(deleteDoc(doc(db, ...pad('vermogens', id))))
    const b = writeBatch(db)
    b.delete(doc(db, ...pad('vermogens', id)))
    b.update(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
  })
  test('verplaatsen met maar één teller', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { domeinId: 'vrijw', volgorde: 1 })
    b.update(doc(db, ...pad('structuurelementen', 'vrijw')), { aantalVermogens: 1, laatsteVermogenId: id })
    await assertFails(b.commit())
    await assertFails(updateDoc(doc(db, ...pad('vermogens', id)), { domeinId: 'vrijw' }))
  })
  test('niet-lid kan niets lezen of schrijven', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(getDocs(collection(buiten, ...pad('vermogens'))))
    await assertFails(getDoc(doc(buiten, ...pad('vermogensnamen', 'teamindeling'))))
    await assertFails(voegVermogenToe(buiten, CLUB, { naam: 'Iets', domeinId: 'leden' }))
  })
})

describe('domeinen en de teller', () => {
  test('domein met vermogens: niet verwijderen, niet naar overkoepelend', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertFails(deleteDoc(doc(db, ...pad('structuurelementen', 'leden'))))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'overkoepelend' }))
  })
  test('pijler ↔ ondersteunend mag met vermogens; overkoepelend blijft bewerkbaar', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'pijler', naam: 'Leden', omschrijving: 'x' }))
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'proj')), { naam: 'Projecten 2027' }))
  })
  test('na verwijderen van alle vermogens (teller 0) kan het domein weg', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await verwijderVermogen(db, CLUB, id)
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'overkoepelend' }))
    await assertSucceeds(deleteDoc(doc(db, ...pad('structuurelementen', 'leden'))))
  })
  test('teller vervalsen: los wijzigen, met laatsteVermogenId, onder 0, of +1 zonder echte wijziging', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const ref = doc(db, ...pad('structuurelementen', 'leden'))
    await assertFails(updateDoc(ref, { aantalVermogens: 0 }))
    await assertFails(updateDoc(ref, { aantalVermogens: 0, laatsteVermogenId: id }))
    await assertFails(updateDoc(ref, { aantalVermogens: 2, laatsteVermogenId: id }))
    await assertFails(updateDoc(ref, { aantalVermogens: 1.5 }))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: -1, laatsteVermogenId: id }))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 1, laatsteVermogenId: id }))
    await assertSucceeds(updateDoc(ref, { laatsteVermogenId: 'onschuldig' }))
  })
  test('nieuw domein alleen met teller 0 (of zonder)', async () => {
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nieuw', volgorde: 20 }))
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nieuw2', aantalVermogens: 0 }))
    await assertFails(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nep', aantalVermogens: 3 }))
  })
})

describe('bestaande bewerkingen (v0.6.0-app en scripts) blijven werken', () => {
  test('domein bewerken zoals de app (updateDoc zonder tellervelden), ook met teller > 0', async () => {
    const data = { type: 'domein', naam: 'Leden', hashtag: '', omschrijving: 'Ledenzaken', bestuursfunctieId: 'vz', icoon: 'leden' }
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), data))
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { ...data, naam: 'Leden & co' }))
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })
  test('domein toevoegen en een leeg domein verwijderen', async () => {
    const ref = await addDoc(collection(db, ...pad('structuurelementen')), { type: 'pijler', naam: 'Test', hashtag: '', omschrijving: 'xx', bestuursfunctieId: 'vz', icoon: '', volgorde: 16 })
    await assertSucceeds(deleteDoc(ref))
    await assertSucceeds(deleteDoc(doc(db, ...pad('structuurelementen', 'proj'))))
  })
  test('↑/↓ van domeinen in één batch (schrijfVolgorde)', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    Object.keys(DOMEINEN).forEach((id, k) => b.update(doc(db, ...pad('structuurelementen', id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
  })
  test('seed-testclub: batch.set met merge laat de teller staan', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.set(doc(db, ...pad('structuurelementen', 'leden')), { type: 'domein', naam: 'Leden', icoon: 'leden', volgorde: 2, bestuursfunctieId: 'vz' }, { merge: true })
    await assertSucceeds(b.commit())
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })
  test('bestuursfuncties en clubprofiel', async () => {
    const ref = await assertSucceeds(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'Secretaris', volgorde: 2 }))
    await assertSucceeds(updateDoc(ref, { naam: 'Secretaris HCA' }))
    await assertSucceeds(deleteDoc(ref))
    await assertSucceeds(setDoc(doc(db, ...pad('instellingen', 'profiel')), { naam: 'Testclub', afkorting: 'TST', seizoen: '2026–2027' }, { merge: true }))
    await assertSucceeds(getDocs(collection(db, ...pad('structuurelementen'))))
  })
})

describe('limieten van get/getAfter (max. 10 per document, 20 per verzoek)', () => {
  test('toevoegen, verplaatsen, hernoemen en verwijderen blijven binnen de limiet (zie boven)', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    await assertSucceeds(verplaatsVermogen(db, CLUB, id, 'fin'))
    await assertSucceeds(hernoemVermogen(db, CLUB, id, 'Twee'))
    await assertSucceeds(verwijderVermogen(db, CLUB, id))
  })
  test('hernoemen én verplaatsen in één schrijfactie (ter informatie; de app splitst dit)', async t => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { naam: 'Twee', domeinId: 'fin', volgorde: 1 })
    b.delete(doc(db, ...pad('vermogensnamen', 'een')))
    b.set(doc(db, ...pad('vermogensnamen', 'twee')), { vermogenId: id })
    b.update(doc(db, ...pad('structuurelementen', 'leden')), { aantalVermogens: 0, laatsteVermogenId: id })
    b.update(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 1, laatsteVermogenId: id })
    let uitkomst = 'toegestaan'
    try { await b.commit() } catch (e) { uitkomst = e.code }
    t.diagnostic(`gecombineerde schrijfactie: ${uitkomst}`)
  })
})

describe('scripts: importplan en controle', () => {
  const leesAlles = async () => admin(async a => {
    const l = async naam => (await getDocs(collection(a, ...pad(naam)))).docs.map(d => ({ id: d.id, ...d.data() }))
    return { domeinen: await l('structuurelementen'), vermogens: await l('vermogens'), namen: await l('vermogensnamen') }
  })

  async function hcaDomeinen() {
    await env.clearFirestore()
    await admin(async a => {
      await setDoc(doc(a, ...pad('leden', 'jan')), { rol: 'beheerder' })
      for (const [k, [label]] of HCA_VERMOGENS.entries()) {
        await setDoc(doc(a, ...pad('structuurelementen', `d${k}`)), { type: k < 3 ? 'pijler' : 'domein', naam: label, volgorde: k + 1 })
      }
      await setDoc(doc(a, ...pad('structuurelementen', 'proj')), { type: 'overkoepelend', naam: 'Projecten', volgorde: 14 })
    })
  }

  test('import: alle bronnamen nieuw over 13 domeinen, tweede keer 0, controle klopt', async () => {
    await hcaDomeinen()
    const eerste = maakImportplan(await leesAlles())
    assert.deepEqual(eerste.fouten, [])
    assert.equal(eerste.plan.length, BRON_AANTAL)
    assert.equal(new Set(eerste.plan.map(p => p.domeinId)).size, 13)
    for (const p of eerste.plan) await voegVermogenToe(db, CLUB, { naam: p.naam, domeinId: p.domeinId })
    const tweede = maakImportplan(await leesAlles())
    assert.equal(tweede.plan.length, 0)
    assert.equal(tweede.overgeslagen.length, BRON_AANTAL)
    const c = controleerVermogens(await leesAlles())
    assert.deepEqual(c, { afwijkingen: [], herstel: [] })
    const accommodatie = (await leesAlles()).domeinen.find(d => d.naam === 'Accommodatie')
    assert.equal(accommodatie.aantalVermogens, 2)
  })

  test('import vindt een pijler op hashtag en stopt bij een ontbrekend of overkoepelend domein', async () => {
    await hcaDomeinen()
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'd0')), { naam: 'Hockey', hashtag: '#hcaspeelt' }))
    assert.deepEqual(maakImportplan(await leesAlles()).fouten, [])
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'd3')), { type: 'overkoepelend' }))
    await admin(a => deleteDoc(doc(a, ...pad('structuurelementen', 'd4'))))
    const { fouten } = maakImportplan(await leesAlles())
    assert.equal(fouten.length, 2)
  })

  test('import laat een vermogen in een ander domein en een los naamdocument ongemoeid', async () => {
    await hcaDomeinen()
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'd3' })
    await admin(a => setDoc(doc(a, ...pad('vermogensnamen', 'begroting')), { vermogenId: 'weg' }))
    const { plan, letOp } = maakImportplan(await leesAlles())
    assert.equal(plan.length, BRON_AANTAL - 2)
    assert.equal(letOp.length, 2)
  })

  test('controle meldt consoleschade precies en herstelt naamdocumenten binnen de regels', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = await voegVermogenToe(db, CLUB, { naam: 'Ledenbeheer', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await admin(async x => {
      await deleteDoc(doc(x, ...pad('vermogens', a.id)))
      await deleteDoc(doc(x, ...pad('vermogensnamen', 'ledenbeheer')))
      await deleteDoc(doc(x, ...pad('structuurelementen', 'fin')))
    })
    const { afwijkingen, herstel } = controleerVermogens(await leesAlles())
    assert.ok(afwijkingen.some(t => t.includes('structuurelementen/leden (Leden): aantalVermogens 2 → 1')), afwijkingen.join('\n'))
    assert.ok(afwijkingen.some(t => t.includes('domein dat niet bestaat')), afwijkingen.join('\n'))
    assert.deepEqual(herstel.map(h => [h.soort, h.sleutel]).sort(), [['naam-maken', 'ledenbeheer'], ['naam-weg', 'ledenwerving']])
    for (const h of herstel.sort((x, y) => (x.soort === 'naam-weg' ? -1 : 1))) {
      const ref = doc(db, ...pad('vermogensnamen', h.sleutel))
      await assertSucceeds(h.soort === 'naam-weg' ? deleteDoc(ref) : setDoc(ref, { vermogenId: h.vermogenId }))
    }
    assert.deepEqual(await lees('vermogensnamen', 'ledenbeheer'), { vermogenId: b.id })
    assert.deepEqual(controleerVermogens(await leesAlles()).herstel, [])
  })
})

// Aanvullende regeltests (tester, fase 5a): rechtstreekse updates buiten het app-protocol om
describe('aanvullend: rechtstreekse updates en regressie (tester)', () => {
  const vRef = id => doc(db, ...pad('vermogens', id))
  const dRef = id => doc(db, ...pad('structuurelementen', id))
  const nRef = sleutel => doc(db, ...pad('vermogensnamen', sleutel))

  test('hernoemen rechtstreeks volgens het protocol slaagt; alleen hoofdletters ook zonder naamdocument', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertSucceeds(updateDoc(vRef(id), { naam: 'TEAMINDELING' }))
    const b = writeBatch(db)
    b.update(vRef(id), { naam: 'Teamsamenstelling' })
    b.delete(nRef('teamindeling'))
    b.set(nRef('teamsamenstelling'), { vermogenId: id })
    await assertSucceeds(b.commit())
  })

  test('hernoemen naar een naam van een ander vermogen of zonder naamdocument: geweigerd', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await assertFails(updateDoc(vRef(a.id), { naam: 'Kascontrole' }))
    const b = writeBatch(db)
    b.update(vRef(a.id), { naam: 'kascontrole' })
    b.delete(nRef('teamindeling'))
    b.set(nRef('kascontrole'), { vermogenId: a.id })
    await assertFails(b.commit())
    assert.equal((await lees('vermogens', a.id)).naam, 'Teamindeling')
  })

  test('update met extra veld, ongeldige naam of ongeldige volgorde: geweigerd; alleen volgorde mag', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(updateDoc(vRef(id), { status: 'x' }))
    await assertFails(updateDoc(vRef(id), { naam: 'Teamindeling ' }))
    await assertFails(updateDoc(vRef(id), { naam: '<b>' }))
    await assertFails(updateDoc(vRef(id), { volgorde: 0 }))
    await assertFails(updateDoc(vRef(id), { volgorde: 2.5 }))
    await assertSucceeds(updateDoc(vRef(id), { volgorde: 7 }))
  })

  test('verplaatsen rechtstreeks naar overkoepelend of niet-bestaand domein: geweigerd, ook met tellers', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(vRef(id), { domeinId: 'proj', volgorde: 1 })
    b.update(dRef('proj'), { aantalVermogens: 1, laatsteVermogenId: id })
    b.update(dRef('leden'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
    await assertFails(updateDoc(vRef(id), { domeinId: 'bestaatniet', volgorde: 1 }))
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })

  test('verplaatsen rechtstreeks volgens het protocol slaagt; twee vermogens met één tellerstap niet', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const c = await voegVermogenToe(db, CLUB, { naam: 'Twee', domeinId: 'leden' })
    const dubbel = writeBatch(db)
    dubbel.update(vRef(a.id), { domeinId: 'fin', volgorde: 1 })
    dubbel.update(vRef(c.id), { domeinId: 'fin', volgorde: 2 })
    dubbel.update(dRef('fin'), { aantalVermogens: 2, laatsteVermogenId: a.id })
    dubbel.update(dRef('leden'), { aantalVermogens: 0, laatsteVermogenId: a.id })
    await assertFails(dubbel.commit())
    const b = writeBatch(db)
    b.update(vRef(a.id), { domeinId: 'fin', volgorde: 1 })
    b.update(dRef('fin'), { aantalVermogens: 1, laatsteVermogenId: a.id })
    b.update(dRef('leden'), { aantalVermogens: 1, laatsteVermogenId: a.id })
    await assertSucceeds(b.commit())
  })

  test('verwijderen rechtstreeks volgens het protocol slaagt; teller onder 0 niet', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.delete(vRef(id))
    b.delete(nRef('kascontrole'))
    b.update(dRef('fin'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertSucceeds(b.commit())
    await assertFails(updateDoc(dRef('fin'), { aantalVermogens: -1, laatsteVermogenId: id }))
    await assertFails(updateDoc(dRef('leden'), { aantalVermogens: -1, laatsteVermogenId: id }))
  })

  test('domein zonder tellerveld: bewerken en verwijderen zoals voorheen; ongeldig type of naam blijft geweigerd', async () => {
    await assertSucceeds(updateDoc(dRef('fin'), { naam: 'Financiën en fondsen' }))
    await assertFails(updateDoc(dRef('fin'), { type: 'iets' }))
    await assertFails(updateDoc(dRef('fin'), { naam: 'x'.repeat(201) }))
    await assertSucceeds(deleteDoc(dRef('fin')))
  })

  test('bestuursfuncties en clubprofiel: bestaande grenzen blijven gelden', async () => {
    await assertFails(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'S', volgorde: 2 }))
    await assertFails(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'x'.repeat(101), volgorde: 2 }))
    await assertFails(setDoc(doc(db, ...pad('instellingen', 'anders')), { naam: 'x' }))
    await assertFails(setDoc(doc(db, ...pad('instellingen', 'profiel')), { logo: 'http://example.com/x.png' }, { merge: true }))
    await assertSucceeds(setDoc(doc(db, ...pad('instellingen', 'profiel')), { logo: 'data:image/png;base64,AAAA' }, { merge: true }))
    await assertFails(updateDoc(doc(buiten, ...pad('structuurelementen', 'leden')), { naam: 'Hack' }))
    await assertFails(setDoc(doc(db, ...pad('onbekend', 'x')), { a: 1 }))
  })
})

// Aanvallende tests (fase 5c, beveiliging): pogingen om uniciteit, domein-guard en tenant-isolatie te omzeilen
describe('beveiliging: aanvallen via de API worden geweigerd', () => {
  const ref = (fs, ...delen) => doc(fs, ...pad(...delen))

  test('tenant-isolatie: lid van club1 kan niets in club2 lezen of schrijven', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2'), { naam: 'Andere club' })
      await setDoc(doc(a, 'clubs', 'club2', 'leden', 'piet'), { rol: 'beheerder' })
      await setDoc(doc(a, 'clubs', 'club2', 'structuurelementen', 'd2'), { type: 'pijler', naam: 'Anders' })
      await setDoc(doc(a, 'clubs', 'club2', 'vermogens', 'w1'), { naam: 'Geheim', domeinId: 'd2', volgorde: 1 })
    })
    await assertFails(getDoc(doc(db, 'clubs', 'club2', 'vermogens', 'w1')))
    await assertFails(getDocs(collection(db, 'clubs', 'club2', 'vermogensnamen')))
    const b = writeBatch(db)
    b.set(doc(db, 'clubs', 'club2', 'vermogens', 'x1'), { naam: 'Inbraak', domeinId: 'd2', volgorde: 1 })
    b.set(doc(db, 'clubs', 'club2', 'vermogensnamen', 'inbraak'), { vermogenId: 'x1' })
    b.update(doc(db, 'clubs', 'club2', 'structuurelementen', 'd2'), { aantalVermogens: 1, laatsteVermogenId: 'x1' })
    await assertFails(b.commit())
  })

  test('domeinId met een pad (traversal) wordt geweigerd', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2', 'structuurelementen', 'd2'), { type: 'pijler', naam: 'Anders' })
    })
    for (const domeinId of ['../../club2/structuurelementen/d2', 'speelt/x/y', 'speelt/']) {
      const b = writeBatch(db)
      b.set(ref(db, 'vermogens', 'v9'), { naam: 'Padtruc', domeinId, volgorde: 1 })
      b.set(ref(db, 'vermogensnamen', 'padtruc'), { vermogenId: 'v9' })
      b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: 1, laatsteVermogenId: 'v9' })
      await assertFails(b.commit())
    }
  })

  test('naamdocument kapen: verwijderen en opnieuw zetten in één batch lukt niet', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const b = writeBatch(db)
    b.delete(ref(db, 'vermogensnamen', 'teamindeling'))
    b.set(ref(db, 'vermogensnamen', 'teamindeling'), { vermogenId: 'v2' })
    b.set(ref(db, 'vermogens', 'v2'), { naam: 'TEAMINDELING', domeinId: 'leden', volgorde: 1 })
    b.update(ref(db, 'structuurelementen', 'leden'), { aantalVermogens: 1, laatsteVermogenId: 'v2' })
    await assertFails(b.commit())
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    assert.equal(await lees('vermogens', 'v2'), null)
  })

  test('twee vermogens in één batch met één tellerstap: geweigerd', async () => {
    const b = writeBatch(db)
    b.set(ref(db, 'vermogens', 'a1'), { naam: 'Eerste', domeinId: 'speelt', volgorde: 1 })
    b.set(ref(db, 'vermogensnamen', 'eerste'), { vermogenId: 'a1' })
    b.set(ref(db, 'vermogens', 'a2'), { naam: 'Tweede', domeinId: 'speelt', volgorde: 2 })
    b.set(ref(db, 'vermogensnamen', 'tweede'), { vermogenId: 'a2' })
    b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: 2, laatsteVermogenId: 'a2' })
    await assertFails(b.commit())
  })

  test('domein naar overkoepelend in dezelfde batch als een nieuw vermogen: geweigerd', async () => {
    const b = writeBatch(db)
    b.set(ref(db, 'vermogens', 'o1'), { naam: 'Stiekem', domeinId: 'leden', volgorde: 1 })
    b.set(ref(db, 'vermogensnamen', 'stiekem'), { vermogenId: 'o1' })
    b.update(ref(db, 'structuurelementen', 'leden'), { type: 'overkoepelend', aantalVermogens: 1, laatsteVermogenId: 'o1' })
    await assertFails(b.commit())
  })

  test('domein met vermogens verwijderen samen met zijn laatste vermogen: geweigerd (teller is nog 1)', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.delete(ref(db, 'vermogens', id))
    b.delete(ref(db, 'vermogensnamen', 'kascontrole'))
    b.delete(ref(db, 'structuurelementen', 'fin'))
    await assertFails(b.commit())
  })

  test('teller verlagen door het vermogen naar een niet-bestaand domein te zetten: geweigerd', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.update(ref(db, 'vermogens', id), { domeinId: 'bestaatniet' })
    b.update(ref(db, 'structuurelementen', 'fin'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 1)
  })

  test('nieuw domein met teller als string: geweigerd', async () => {
    await assertFails(setDoc(ref(db, 'structuurelementen', 'n1'), { type: 'pijler', naam: 'X', aantalVermogens: '0' }))
  })

  test('naamdocument voor een niet-bestaand vermogen: geweigerd', async () => {
    await assertFails(setDoc(ref(db, 'vermogensnamen', 'spook'), { vermogenId: 'bestaatniet' }))
  })

  // Herstelronde (beveiliging 2): volgorde heeft nu een bovengrens van 100000
  test('volgorde boven 100000 geweigerd, 100000 toegestaan', async () => {
    const poging = (id, naam, volgorde, teller) => {
      const b = writeBatch(db)
      b.set(ref(db, 'vermogens', id), { naam, domeinId: 'speelt', volgorde })
      b.set(ref(db, 'vermogensnamen', naam.toLowerCase()), { vermogenId: id })
      b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: teller, laatsteVermogenId: id })
      return b.commit()
    }
    await assertFails(poging('g1', 'Groot', Number.MAX_SAFE_INTEGER, 1))
    await assertFails(poging('g1', 'Groot', 100001, 1))
    await assertSucceeds(poging('g2', 'Grens', 100000, 1))
    await assertFails(updateDoc(ref(db, 'vermogens', 'g2'), { volgorde: 100001 }))
  })

  test('laatsteVermogenId altijd een string van max. 100 tekens', async () => {
    const d = ref(db, 'structuurelementen', 'leden')
    await assertSucceeds(updateDoc(d, { laatsteVermogenId: 'x'.repeat(100) }))
    await assertFails(updateDoc(d, { laatsteVermogenId: 'x'.repeat(101) }))
    await assertFails(updateDoc(d, { laatsteVermogenId: 42 }))
    await assertFails(updateDoc(d, { laatsteVermogenId: { groot: 'x' } }))
    await assertFails(setDoc(ref(db, 'structuurelementen', 'n2'), { type: 'domein', naam: 'Nieuw', laatsteVermogenId: 7 }))
    await assertSucceeds(setDoc(ref(db, 'structuurelementen', 'n3'), { type: 'domein', naam: 'Nieuw' }))
  })
})

describe('scripts: terminaluitvoer (beveiliging 3)', () => {
  test('veilig() maakt stuurtekens en richtingstekens zichtbaar', async () => {
    const { veilig } = await import('../scripts/lib/omgeving.mjs')
    assert.equal(veilig('Leden\u001b[2J\nnep\u202Eregel'), 'Leden\\u{1B}[2J\\u{A}nep\\u{202E}regel')
    assert.equal(veilig('Lief & Leed — Financiën'), 'Lief & Leed — Financiën')
  })
})

// ── Projecten en samenwerkingen (CK-046) ──
const PROJECT = { naam: 'LED-scorebord', omschrijving: '', bestuursfunctieId: 'vz', status: 'in-voorbereiding', begindatum: '', einddatum: '', volgorde: 1 }
const SAMENWERKING = { naam: 'KNHB', omschrijving: '', bestuursfunctieId: 'vz', volgorde: 1 }
const HCA_NAMEN = Object.values(HCA_ONDERDELEN).flatMap(l => l.map(([n]) => n))

describe('CK-046 app-functies', () => {
  test('naamregels: tekenset met / en dezelfde opbouw als vermogens', () => {
    assert.equal(onderdeelnaamFout(''), 'Vul een naam in.')
    assert.equal(onderdeelnaamFout('A'), 'Een naam heeft minimaal 2 tekens.')
    assert.match(onderdeelnaamFout('x'.repeat(101)), /maximaal 100 tekens\. Nu zijn het er 101\./)
    assert.equal(onderdeelnaamFout('-Bouw'), 'Begin de naam met een letter of cijfer.')
    assert.equal(onderdeelnaamFout('Seizoen 27/28'), '')
    assert.match(onderdeelnaamFout('Feest 🎉'), /^Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji\..*\( \) \+ \/$/)
    assert.match(onderdeelnaamFout('a_b'), /^Het teken _ kan niet in een naam\. Gebruik letters .*& ' - \. , \( \) \+ \/$/)
    assert.match(vermogensnaamFout('a/b'), /^Het teken \/ kan niet in een naam\..*\( \) \+$/)
  })
  test('alle 10 HCA-namen voldoen', () => {
    assert.equal(HCA_NAMEN.length, 10)
    for (const n of HCA_NAMEN) assert.equal(onderdeelnaamFout(n), '', n)
  })
  test('periodeTekst volgens de tabel in het ontwerp', () => {
    assert.equal(periodeTekst('2026-09-01', '2028-06-30'), 'sep 2026 – jun 2028')
    assert.equal(periodeTekst('2027-03-01', '2027-03-31'), 'mrt 2027')
    assert.equal(periodeTekst('2026-09-01', ''), 'vanaf sep 2026')
    assert.equal(periodeTekst('', '2028-06-30'), 't/m jun 2028')
    assert.equal(periodeTekst('', ''), '')
    assert.equal(periodeTekst(undefined, undefined), '')
  })
  test('datumFout: einde vóór begin bij de einddatum, half ingevulde datum', () => {
    assert.deepEqual(datumFout('2027-06-01', '2027-05-31'), { eind: 'De einddatum ligt vóór de begindatum.' })
    assert.deepEqual(datumFout('2027-06-01', '2027-06-01'), {})
    assert.deepEqual(datumFout('', '2027-01-01'), {})
    assert.deepEqual(datumFout('2027-6-1', ''), { begin: 'Vul een hele datum in, of maak het veld leeg.' })
  })
  test('naamBezet: hoofdletters en spaties tellen niet, eigen id telt niet', () => {
    const lijst = [{ id: 'a', naam: 'Ver(nieuw)bouw' }]
    assert.ok(naamBezet(lijst, 'ver(NIEUW)bouw  '))
    assert.ok(!naamBezet(lijst, 'VER(nieuw)bouw', 'a'))
    assert.ok(!naamBezet(lijst, 'Verbouw'))
  })
  test('geldigOnderdeel spiegelt de regels', () => {
    assert.ok(geldigOnderdeel('projecten', PROJECT))
    assert.ok(geldigOnderdeel('samenwerkingen', SAMENWERKING))
    assert.ok(!geldigOnderdeel('samenwerkingen', { ...SAMENWERKING, status: 'lopend' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, status: 'bezig' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2027' }))
  })
})

describe('CK-046 regels: projecten en samenwerkingen slagen', () => {
  test('project toevoegen (lege velden), status en periode wijzigen, verwijderen', async () => {
    const { id, volgorde } = await assertSucceeds(voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Hoofdsponsoring 27/28+', status: 'lopend' }))
    assert.equal(volgorde, 1)
    assert.deepEqual(await lees('projecten', id), { naam: 'Hoofdsponsoring 27/28+', omschrijving: '', bestuursfunctieId: '', status: 'lopend', begindatum: '', einddatum: '', volgorde: 1 })
    const tweede = await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Ver(nieuw)bouw', status: 'in-voorbereiding' })
    assert.equal(tweede.volgorde, 2)
    await assertSucceeds(bewerkOnderdeel(db, CLUB, 'projecten', id, {
      naam: 'Hoofdsponsoring 27/28+', omschrijving: 'Café & co <b>', bestuursfunctieId: 'vz', status: 'afgerond', begindatum: '2026-09-01', einddatum: '2028-06-30',
    }))
    assert.equal((await lees('projecten', id)).status, 'afgerond')
    assert.equal((await lees('projecten', id)).volgorde, 1)
    await assertSucceeds(verwijderOnderdeel(db, CLUB, 'projecten', id))
    assert.equal(await lees('projecten', id), null)
    const e = await fout(verwijderOnderdeel(db, CLUB, 'projecten', id))
    assert.equal(e.code, 'project-weg')
    const e2 = await fout(bewerkOnderdeel(db, CLUB, 'projecten', id, { naam: 'Weg', status: 'lopend' }))
    assert.equal(e2.code, 'project-weg')
  })
  test('samenwerking toevoegen, bewerken en verwijderen', async () => {
    const { id } = await assertSucceeds(voegOnderdeelToe(db, CLUB, 'samenwerkingen', { naam: 'KNHB' }))
    assert.deepEqual(await lees('samenwerkingen', id), { naam: 'KNHB', omschrijving: '', bestuursfunctieId: '', volgorde: 1 })
    await assertSucceeds(bewerkOnderdeel(db, CLUB, 'samenwerkingen', id, { naam: 'KNHB', omschrijving: 'De bond', bestuursfunctieId: 'vz' }))
    assert.equal((await laadOnderdelen(db, CLUB, 'samenwerkingen')).length, 1)
    await assertSucceeds(verwijderOnderdeel(db, CLUB, 'samenwerkingen', id))
  })
  test('alle HCA-namen geaccepteerd; ↑/↓ als batch over alle HCA-projecten', async () => {
    for (const [soort, lijst] of Object.entries(HCA_ONDERDELEN)) {
      for (const [naam, status] of lijst) await assertSucceeds(voegOnderdeelToe(db, CLUB, soort, { naam, status }))
    }
    const projecten = await laadOnderdelen(db, CLUB, 'projecten')
    assert.deepEqual(projecten.map(p => p.volgorde), [1, 2, 3, 4, 5])
    const b = writeBatch(db)
    projecten.reverse().forEach((p, k) => b.update(doc(db, ...pad('projecten', p.id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
    assert.equal((await laadOnderdelen(db, CLUB, 'projecten'))[0].naam, 'Buitenopslag (blaashal)')
  })
  test('grenzen: naam 2 en 100 tekens, omschrijving 500, Latin-1', async () => {
    const r = n => doc(db, ...pad('projecten', n))
    await assertSucceeds(setDoc(r('a'), { ...PROJECT, naam: 'xy' }))
    await assertSucceeds(setDoc(r('b'), { ...PROJECT, naam: 'x'.repeat(100), omschrijving: 'o'.repeat(500) }))
    await assertSucceeds(setDoc(r('c'), { ...PROJECT, naam: 'Ærø Øst / Ñandú (ÀÖØöøÿ)' }))
  })
  test('domein: bewerken zonder bevat blijft slagen, bevat zetten op projecten of samenwerkingen slaagt', async () => {
    const d = doc(db, ...pad('structuurelementen', 'proj'))
    await assertSucceeds(updateDoc(d, { type: 'overkoepelend', naam: 'Projecten', omschrijving: 'Trajecten', bestuursfunctieId: 'vz', hashtag: '', icoon: '' }))
    await assertSucceeds(updateDoc(d, { bevat: 'projecten' }))
    await assertSucceeds(updateDoc(d, { naam: 'Trajecten' }))
    assert.equal((await lees('structuurelementen', 'proj')).bevat, 'projecten')
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'overkoepelend', naam: 'Partners', bevat: 'samenwerkingen' }))
  })
})

describe('CK-046 regels weigeren', () => {
  const r = (soort, id = 'x') => doc(db, ...pad(soort, id))
  test('niet-lid kan niet lezen of schrijven', async () => {
    await admin(a => setDoc(doc(a, ...pad('projecten', 'p1')), PROJECT))
    await assertFails(getDocs(collection(buiten, ...pad('projecten'))))
    await assertFails(getDoc(doc(buiten, ...pad('projecten', 'p1'))))
    await assertFails(setDoc(doc(buiten, ...pad('projecten', 'p2')), PROJECT))
    await assertFails(deleteDoc(doc(buiten, ...pad('projecten', 'p1'))))
    await assertFails(setDoc(doc(buiten, ...pad('samenwerkingen', 's1')), SAMENWERKING))
    await assertFails(getDocs(collection(buiten, ...pad('samenwerkingen'))))
  })
  test('extra of ontbrekend veld', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, contactpersoon: 'Jan' }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, periode: '2026–2028' }))
    const { omschrijving, ...zonder } = PROJECT
    await assertFails(setDoc(r('projecten'), zonder))
    const { einddatum, ...zonderEinde } = PROJECT
    await assertFails(setDoc(r('projecten'), zonderEinde))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, status: 'lopend' }))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, begindatum: '' }))
    const { bestuursfunctieId, ...zonderEigenaar } = SAMENWERKING
    await assertFails(setDoc(r('samenwerkingen'), zonderEigenaar))
  })
  test('status en datums', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, status: 'bezig' }))
    for (const datum of ['2027', '2027-3-1', '01-03-2027', '2027-03-01T00:00', 20270301, null]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: datum }), String(datum))
      await assertFails(setDoc(r('projecten'), { ...PROJECT, einddatum: datum }), String(datum))
    }
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2026-09-01', einddatum: '2028-06-30' }))
  })
  test('datums inhoudelijk: maand 01-12, dag 01-31, einde niet vóór begin (herstelronde)', async () => {
    for (const datum of ['2026-13-45', '2026-00-10', '2026-12-32', '2026-02-00', '0000-00-00']) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: datum }), datum)
      await assertFails(setDoc(r('projecten'), { ...PROJECT, einddatum: datum }), datum)
    }
    await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-05-31' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-06-01' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '', einddatum: '2027-05-31' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2026-01-31', einddatum: '2026-12-01' }))
    await assertSucceeds(setDoc(r('projecten', 'p'), { ...PROJECT, begindatum: '2027-01-01', einddatum: '2027-12-31' }))
    await assertFails(updateDoc(r('projecten', 'p'), { einddatum: '2026-12-31' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2026-13-45' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-05-31' }))
    assert.deepEqual(datumFout('2026-13-45', ''), { begin: 'Vul een hele datum in, of maak het veld leeg.' })
  })
  test('ongeldige namen', async () => {
    for (const naam of ['x', 'x'.repeat(101), ' Bouw', 'Bouw ', 'Ver  bouw', 'a_b', 'Feest 🎉', '-Bouw', 'a\nb', 42]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, naam }), String(naam))
      await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, naam }), String(naam))
    }
  })
  test('omschrijving, eigenaar en volgorde', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, omschrijving: 'o'.repeat(501) }))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, omschrijving: 'o'.repeat(501) }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, bestuursfunctieId: 7 }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, bestuursfunctieId: 'x'.repeat(101) }))
    for (const volgorde of [0, 1.5, '1', 100001]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, volgorde }), String(volgorde))
      await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, volgorde }), String(volgorde))
    }
  })
  test('update naar ongeldig wordt geweigerd', async () => {
    await assertSucceeds(setDoc(r('projecten', 'p'), PROJECT))
    await assertFails(updateDoc(r('projecten', 'p'), { status: 'weg' }))
    await assertFails(updateDoc(r('projecten', 'p'), { extra: true }))
    await assertSucceeds(updateDoc(r('projecten', 'p'), { volgorde: 2 }))
  })
  test('bevat met een andere waarde', async () => {
    const d = doc(db, ...pad('structuurelementen', 'proj'))
    await assertFails(updateDoc(d, { bevat: 'vermogens' }))
    await assertFails(updateDoc(d, { bevat: '' }))
    await assertFails(updateDoc(d, { bevat: ['projecten'] }))
    await assertFails(addDoc(collection(db, ...pad('structuurelementen')), { type: 'overkoepelend', naam: 'X', bevat: 'leden' }))
  })
})

describe('CK-046 inrichtscript: plan', () => {
  const leesAlles = async () => admin(async a => {
    const l = async naam => (await getDocs(collection(a, ...pad(naam)))).docs.map(d => ({ id: d.id, ...d.data() }))
    return { domeinen: await l('structuurelementen'), functies: await l('bestuursfuncties'), projecten: await l('projecten'), samenwerkingen: await l('samenwerkingen') }
  })
  const voerUit = async plan => {
    const b = writeBatch(db)
    for (const { soort, velden } of plan.nieuw) b.set(doc(collection(db, ...pad(soort))), velden)
    for (const x of plan.bevat) b.update(doc(db, ...pad('structuurelementen', x.domeinId)), { bevat: x.soort })
    await b.commit()
  }
  beforeEach(async () => {
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'Samenwerkingen', volgorde: 15 }))
  })

  test('eerste keer 10 items en 2 keer bevat in één batch, tweede keer niets; Voorzitter is eigenaar', async () => {
    const eerste = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual(eerste.fouten, [])
    assert.equal(eerste.nieuw.length, 10)
    assert.equal(eerste.bevat.length, 2)
    await assertSucceeds(voerUit(eerste))
    const p = await laadOnderdelen(db, CLUB, 'projecten')
    assert.deepEqual(p.map(x => [x.naam, x.status, x.volgorde, x.bestuursfunctieId]), HCA_ONDERDELEN.projecten.map(([n, s], k) => [n, s, k + 1, 'vz']))
    assert.equal((await lees('structuurelementen', 'proj')).bevat, 'projecten')
    assert.equal((await lees('structuurelementen', 'samen')).bevat, 'samenwerkingen')
    const tweede = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual([tweede.fouten, tweede.nieuw, tweede.bevat, tweede.letOp], [[], [], [], []])
    assert.equal(tweede.overgeslagen.length, 10)
  })
  test('bestaand item met andere status: ongemoeid, LET OP; nieuwe volgorde na de hoogste', async () => {
    await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Eigen project', status: 'lopend' })
    await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'buitenopslag (BLAASHAL)', status: 'lopend' })
    const plan = maakOnderdelenPlan(await leesAlles())
    assert.equal(plan.nieuw.filter(x => x.soort === 'projecten').length, 4)
    assert.equal(plan.nieuw[0].velden.volgorde, 3)
    assert.deepEqual(plan.letOp, ['buitenopslag (BLAASHAL) staat er al met status lopend, ongemoeid.'])
  })
  test('stopt bij ontbrekend, dubbel of niet-overkoepelend domein, andere bevat of geen Voorzitter', async () => {
    await admin(a => deleteDoc(doc(a, ...pad('structuurelementen', 'samen'))))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'domein', naam: 'Samenwerkingen' }))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'samenwerkingen ', bevat: 'projecten' }))
    const { fouten } = maakOnderdelenPlan(await leesAlles())
    assert.equal(fouten.length, 1)
    assert.match(fouten[0], /toont al "projecten"/)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'Samenwerkingen' }))
    await admin(a => setDoc(doc(a, ...pad('bestuursfuncties', 'vz')), { naam: 'Penningmeester', volgorde: 1 }))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
  })
  test('vindt een hernoemd domein op bevat', async () => {
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'proj')), { naam: 'Trajecten', bevat: 'projecten' }))
    const plan = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual(plan.fouten, [])
    assert.deepEqual(plan.bevat.map(x => x.soort), ['samenwerkingen'])
  })
})
