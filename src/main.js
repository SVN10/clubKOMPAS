import './style.css'
import { startEigenVelden } from './keuzelijst.js'
import { auth, db, projectId, configFout, SOORT, OMGEVING_LABEL, VERCEL_ENV } from './firebase.js'
import { version } from '../package.json'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, writeBatch, deleteField } from 'firebase/firestore'
import {
  KAN_VERMOGENS, normaliseerVermogensnaam, vermogensnaamFout, laadVermogens, leesAantalVermogens, controleerNaamVrij,
  voegVermogenToe, hernoemVermogen, verplaatsVermogen, verwijderVermogen,
} from './vermogens.js'
import {
  SOORT_ONDERDEEL, PLAAT_SOORTEN, STATUSSEN, STATUS_LABEL, OP_PLAAT, normaliseerNaam, onderdeelnaamFout, normaliseerOmschrijving,
  omschrijvingFout, periodeTekst, datumFout, naamBezet, laadOnderdelen, voegOnderdeelToe,
  bewerkOnderdeel, verwijderOnderdeel,
} from './onderdelen.js'

let huidigClubId = null
let huidigProfiel = null
let huidigGebruiker = null
let huidigeRol = null

let laadTimer = null
let foutPogingen = 0

// Algemeen SVN10-supportadres (PO-besluit 2). Leeg = zin zonder adres, nooit een lege link.
const SUPPORT_EMAIL = 'support@svn10.nl'

// Alleen PNG, JPG en WebP; geen SVG (CK-052). De app slaat zelf altijd PNG op.
const LOGO_SOORTEN = ['image/png', 'image/jpeg', 'image/webp']
// Zelfde grens en patroon als geldigLogo in firestore.rules (P0d)
const LOGO_MAX_TEKENS = 700000
function veiligLogo(waarde) {
  return typeof waarde === 'string' && waarde.length <= LOGO_MAX_TEKENS
    && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(waarde) ? waarde : ''
}

// Zet het clublogo als favicon, of zet het standaard kompas-icoon terug als er geen logo is.
// Het type moet meeveranderen: met type="image/svg+xml" negeren browsers een PNG/JPEG-logo.
// Het <link>-element wordt vervangen in plaats van aangepast: Safari pikt een gewijzigde href
// na het laden van de pagina niet op, een nieuw element wel.
function setFavicon(base64) {
  const oud = document.getElementById('favicon')
  if (!oud) return
  const logo = veiligLogo(base64)
  const nieuw = document.createElement('link')
  nieuw.id = 'favicon'
  nieuw.rel = 'icon'
  nieuw.type = logo ? logo.slice(5, logo.indexOf(';')) : 'image/svg+xml'
  nieuw.href = logo || '/favicon.svg'
  oud.replaceWith(nieuw)
}

async function resizeAfbeelding(file, maxPx = 300) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function uitloggen() {
  signOut(auth).catch(e => console.error('Uitloggen mislukt:', e?.code))
}

// ── Automatisch uitloggen na 8 uur zonder gebruik (CK-052) ──
// Klikken en typen tellen als gebruik. Het tijdstip staat in localStorage, zodat alle tabbladen het delen
// en een herladen pagina na 8 uur ook uitlogt. Zonder localStorage telt alleen dit tabblad.
const STIL_MAX_MS = 8 * 60 * 60 * 1000
const STIL_SLEUTEL = 'clubkompas-laatst-actief'
const STIL_MELDING = 'Je bent uitgelogd omdat je 8 uur niets in clubKOMPAS hebt gedaan. Log opnieuw in.'
let stilUitgelogd = false
const leesLaatstActief = () => { try { return Number(localStorage.getItem(STIL_SLEUTEL)) || 0 } catch { return 0 } }
let laatstActief = leesLaatstActief() || Date.now()
function markeerActief(altijd = false) {
  const nu = Date.now()
  if (!altijd && nu - laatstActief < 60_000) return
  laatstActief = nu
  try { localStorage.setItem(STIL_SLEUTEL, String(nu)) } catch {}
}
const teLangStil = () => Date.now() - Math.max(laatstActief, leesLaatstActief()) > STIL_MAX_MS
function stilUitloggen() {
  stilUitgelogd = true
  signOut(auth).catch(e => { stilUitgelogd = false; console.error('Uitloggen mislukt:', e?.code) })
}
function startStilteBewaking() {
  for (const soort of ['pointerdown', 'keydown', 'click']) document.addEventListener(soort, () => markeerActief(), { capture: true, passive: true })
  setInterval(() => { if (huidigGebruiker && teLangStil()) stilUitloggen() }, 60_000)
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

// ── Domeinen (structuurelementen) ────────────────────────────────────────────
// Eén begrip "domein" met twee soorten. In de database blijft het veld `type`
// 'pijler' (strategisch domein) of 'domein' (ondersteunend domein); alleen de
// weergave gebruikt de nieuwe woorden.
// Soorten domein. 'overkoepelend' (Projecten, Samenwerkingen) loopt dwars door de andere domeinen.
const SOORTEN = [['pijler', 'Pijler'], ['domein', 'Ondersteunend domein'], ['overkoepelend', 'Overkoepelend domein']]
const SOORT_LABEL = { pijler: 'Pijler', domein: 'Ondersteunend', overkoepelend: 'Overkoepelend' }
const SOORT_SUB = { pijler: 'Pijler', domein: 'Ondersteunend domein', overkoepelend: 'Overkoepelend domein' }
// Kleur van het stipje per soort via een klasse (geen style-attribuut: de CSP staat geen inline stijl toe, CK-047)
const SOORT_KLEUR = { pijler: '', domein: ' stip-domein', overkoepelend: ' stip-overkoepelend' }

// Optionele #hashtag per domein (bijv. #HCASpeelt): begint met #, geen spaties, max. 50 tekens
function hashtagFout(waarde) {
  if (!waarde) return ''
  if (!/^#[^\s#]{1,49}$/.test(waarde)) return 'Begin met # en gebruik geen spaties (max. 50 tekens)'
  return ''
}

function soortKeuzeHTML(naam, huidig) {
  return SOORTEN.map(([k, label]) => `
    <label class="soort-optie">
      <input type="radio" name="${esc(naam)}" value="${k}"${k === huidig ? ' checked' : ''}> ${label}
    </label>`).join('')
}

// Vaste lijnpictogrammen uit de huisstijl (public/pictogrammen/<sleutel>.svg, petrol).
// Een domein bewaart alleen de sleutel in het veld `icoon`.
const PICTOGRAMMEN = [
  ['hcaspeelt', 'Hockeystick met bal'],
  ['hcagroeit', 'Kiemplantje'],
  ['hcadoet', 'Groepje mensen'],
  ['bestuur', 'Kompas'],
  ['leden', 'Persoon'],
  ['vrijwilligers', 'Hart'],
  ['relaties', 'Twee cirkels'],
  ['communicatie', 'Spraakwolk'],
  ['financien', 'Euroteken'],
  ['accommodatie', 'Clubhuis'],
  ['hospitality', 'Kop koffie'],
  ['materiaal', 'Doos'],
  ['digitaal', 'Beeldscherm'],
  ['projecten', 'Klembord met vinkje'],
  ['samenwerkingen', 'Schakel'],
]
const PICTOGRAM_SLEUTELS = new Set(PICTOGRAMMEN.map(([k]) => k))

function pictogramHTML(item, klasse) {
  if (!PICTOGRAM_SLEUTELS.has(item?.icoon)) return ''
  return `<img src="/pictogrammen/${item.icoon}.svg" class="${klasse}" alt="" aria-hidden="true">`
}

function pictogramKeuzeHTML(id, huidig) {
  const opties = PICTOGRAMMEN.map(([k, label]) =>
    `<option value="${k}"${k === huidig ? ' selected' : ''}>${esc(label)}</option>`).join('')
  return `<select class="form-input" id="${esc(id)}"><option value="">Geen pictogram</option>${opties}</select>`
}

// Domeinen staan in een vaste volgorde (veld `volgorde`, 1 t/m n); zonder volgorde achteraan, op naam.
function sorteerDomeinen(items) {
  const v = x => (typeof x.volgorde === 'number' ? x.volgorde : Infinity)
  return items.sort((a, b) => v(a) - v(b) || String(a.naam).localeCompare(String(b.naam), 'nl'))
}

async function laadStructuurelementen() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'structuurelementen'))
  return sorteerDomeinen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
}

async function voegStructuurelementToe(item) {
  await addDoc(collection(db, 'clubs', huidigClubId, 'structuurelementen'), item)
}

async function bewerkStructuurelement(id, data) {
  await updateDoc(doc(db, 'clubs', huidigClubId, 'structuurelementen', id), data)
}

async function verwijderStructuurelement(id) {
  await deleteDoc(doc(db, 'clubs', huidigClubId, 'structuurelementen', id))
}

// ── Bestuursfuncties (masterdata) ─────────────────────────────────────────────
// Vaste lijst per club; een domein verwijst naar een functie via `bestuursfunctieId`.

async function laadBestuursfuncties() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'bestuursfuncties'))
  return sorteerDomeinen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
}
async function voegBestuursfunctieToe(item) {
  await addDoc(collection(db, 'clubs', huidigClubId, 'bestuursfuncties'), item)
}
async function bewerkBestuursfunctie(id, data) {
  await updateDoc(doc(db, 'clubs', huidigClubId, 'bestuursfuncties', id), data)
}
async function verwijderBestuursfunctie(id) {
  await deleteDoc(doc(db, 'clubs', huidigClubId, 'bestuursfuncties', id))
}

// Hernummer 1 t/m n in één batch: alles of niets, nooit een half geschreven volgorde
async function schrijfVolgorde(subcollectie, items, clubId = huidigClubId) {
  const batch = writeBatch(db)
  items.forEach((x, k) => {
    if (x.volgorde !== k + 1) batch.update(doc(db, 'clubs', clubId, subcollectie, x.id), { volgorde: k + 1 })
  })
  await batch.commit()
}

// Keuzelijst met pijlers en ondersteunende domeinen (CK-020); overkoepelende domeinen staan er nooit in
function domeinOptiesHTML(domeinen, gekozen, { alle = false } = {}) {
  const groep = (type, label) => {
    const lijst = domeinen.filter(d => d.type === type)
    if (!lijst.length) return ''
    const opties = lijst.map(d => `<option value="${esc(d.id)}"${d.id === gekozen ? ' selected' : ''}>${esc(d.naam)}</option>`).join('')
    return `<optgroup label="${label}">${opties}</optgroup>`
  }
  const eerste = alle
    ? `<option value="alle"${gekozen === 'alle' ? ' selected' : ''}>Alle domeinen</option>`
    : `<option value=""${gekozen ? '' : ' selected'}>Kies een domein</option>`
  return eerste + groep('pijler', 'Pijlers') + groep('domein', 'Ondersteunende domeinen')
}

const vermogensTekst = n => (n === 1 ? '1 vermogen' : `${n} vermogens`)

function bestuursfunctieKeuzeHTML(id, huidig, functies) {
  const opties = functies.map(f =>
    `<option value="${esc(f.id)}"${f.id === huidig ? ' selected' : ''}>${esc(f.naam)}</option>`).join('')
  return `<select class="form-input" id="${esc(id)}"><option value="">Kies een bestuursfunctie</option>${opties}</select>`
}

// ── Profiel ───────────────────────────────────────────────────────────────────

async function laadProfiel() {
  const snap = await getDoc(doc(db, 'clubs', huidigClubId, 'instellingen', 'profiel'))
  return snap.exists() ? snap.data() : null
}

// Schrijft alleen de meegegeven velden (merge), zodat profiel en logo elkaar niet overschrijven
async function slaaProfiel(clubId, velden) {
  await setDoc(doc(db, 'clubs', clubId, 'instellingen', 'profiel'), velden, { merge: true })
}

// Legt club en gebruiker vast bij de start. Een (late) uitkomst werkt huidigProfiel alleen bij
// als dezelfde gebruiker nog in dezelfde club zit, ook na een time-out of opnieuw inloggen.
function profielSessie() {
  const clubId = huidigClubId
  const uid = huidigGebruiker?.uid
  const geldig = () => clubId !== null && huidigClubId === clubId && huidigGebruiker?.uid === uid
  return {
    geldig,
    async schrijf(velden, bijwerken) {
      await slaaProfiel(clubId, velden)
      if (geldig()) huidigProfiel = bijwerken({ ...(huidigProfiel || {}) })
    },
  }
}

const LOGO_MAX_BYTES = 10 * 1024 * 1024

// Weigert een bestand vóór het inlezen als het geen afbeelding is of groter dan 10 MB
async function leesLogoBestand(file, lees = resizeAfbeelding) {
  if (typeof file?.type !== 'string' || !LOGO_SOORTEN.includes(file.type)) throw { code: 'bestand-onleesbaar' }
  if (!(file.size <= LOGO_MAX_BYTES)) throw { code: 'bestand-te-groot' }
  let logo
  try { logo = await lees(file) } catch { throw { code: 'bestand-onleesbaar' } }
  if (logo.length > LOGO_MAX_TEKENS) throw { code: 'logo-te-groot' }
  return logo
}

// ── Club bepalen ──────────────────────────────────────────────────────────────

async function bepaalClubId(gebruiker) {
  const snap = await getDoc(doc(db, 'gebruikers', gebruiker.uid))
  const clubId = snap.exists() ? snap.data().clubId : null
  return typeof clubId === 'string' && clubId.trim() ? clubId : null
}

// Rol van de gebruiker in de club (clubs/{clubId}/leden/{uid}.rol). Mag de app niet blokkeren.
async function laadRol(gebruiker) {
  try {
    const snap = await getDoc(doc(db, 'clubs', huidigClubId, 'leden', gebruiker.uid))
    const rol = snap.exists() ? snap.data().rol : null
    // Niet trimmen: de regels vergelijken de rol letterlijk (P0d)
    return typeof rol === 'string' && rol ? rol : null
  } catch {
    return null
  }
}

const isBeheerder = () => huidigeRol === 'beheerder'

// Guard bovenaan elke beheer-render (P0d): geen beheerder, dan Home in plaats van de beheerpagina
function geenBeheer(gebruiker) {
  if (isBeheerder()) return false
  renderHome(gebruiker)
  document.title = paginaTitel(navNaam('home'))
  return true
}

async function laadClub(gebruiker) {
  huidigClubId = null
  huidigProfiel = null
  huidigeRol = null
  try {
    const clubId = await bepaalClubId(gebruiker)
    if (huidigGebruiker?.uid !== gebruiker.uid) return { status: 'afgebroken' }
    if (!clubId) return { status: 'geen-club' }
    huidigClubId = clubId
    const [profiel, rol] = await Promise.all([laadProfiel(), laadRol(gebruiker)])
    if (huidigGebruiker?.uid !== gebruiker.uid) return { status: 'afgebroken' }
    huidigProfiel = profiel
    huidigeRol = rol
    return { status: 'ok' }
  } catch (e) {
    if (huidigGebruiker?.uid === gebruiker.uid) {
      huidigClubId = null
      huidigProfiel = null
    }
    return { status: e?.code === 'permission-denied' ? 'geen-club' : 'fout' }
  }
}

// ── Gedeelde UI-helpers ───────────────────────────────────────────────────────

function supportMailto(accountEmail, onderwerp = 'Toegang clubKOMPAS') {
  const o = encodeURIComponent(onderwerp)
  const tekst = encodeURIComponent(`Mijn account: ${accountEmail || ''}\n\n`)
  return `mailto:${SUPPORT_EMAIL}?subject=${o}&body=${tekst}`
}

function supportLinkHTML(accountEmail, onderwerp = 'Toegang clubKOMPAS') {
  return `<a class="tussen-link" href="${esc(supportMailto(accountEmail, onderwerp))}">${esc(SUPPORT_EMAIL)}</a>`
}

// ── Meldingen bij opslaan (CK-023/CK-025) ─────────────────────────────────────

const OPSLAAN_TIJDSLIMIET = 15000
const INLOG_CODES = new Set(['unauthenticated', 'auth/user-token-expired', 'auth/requires-recent-login'])
const WEG_CODES = new Set(['not-found', 'failed-precondition', 'vermogen-weg', 'project-weg', 'samenwerking-weg', 'commissie-weg'])
const VERBINDING_CODES = new Set(['unavailable', 'deadline-exceeded', 'auth/network-request-failed'])
const STAART_INVOER = ' Wat je hebt ingevuld, staat er nog.'
const STAART_LIJST = ' De lijst is niet gewijzigd.'
const UITGELOGD = 'Je bent automatisch uitgelogd. Log opnieuw in en probeer het daarna nog een keer.'
const BESTAAT_NIET = 'Dit item bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt.'
const WW_KLOPT_NIET = 'Wachtwoord klopt niet.'
const FOUTTEKSTEN = {
  'permission-denied': 'Je hebt geen toestemming om dit op te slaan. Herlaad de pagina. Lukt het dan nog niet, neem contact op met SVN10.',
  'resource-exhausted': 'Het is op dit moment erg druk op de server. Probeer het over een paar minuten opnieuw.',
  unauthenticated: UITGELOGD,
  'auth/user-token-expired': UITGELOGD,
  'auth/requires-recent-login': 'Voor deze wijziging moet je eerst opnieuw inloggen. Dat is een extra beveiliging.',
  'auth/too-many-requests': 'Te veel pogingen achter elkaar. Wacht een paar minuten en probeer het opnieuw.',
  'not-found': BESTAAT_NIET,
  'failed-precondition': BESTAAT_NIET,
  'bestand-onleesbaar': 'Dit bestand kan niet als logo worden gebruikt. Kies een PNG-, JPG- of WebP-bestand.',
  'bestand-te-groot': 'Dit bestand is te groot (maximaal 10 MB).',
  'logo-te-groot': 'Dit logo is na het verkleinen nog te groot om op te slaan. Kies een eenvoudiger afbeelding.',
  'auth/email-already-in-use': 'Dit e-mailadres wordt al gebruikt door een ander account. Kies een ander adres.',
  'auth/invalid-email': 'Dit is geen geldig e-mailadres. Controleer of er een @ en een punt in staan.',
  'auth/weak-password': 'Dit wachtwoord is te zwak. Gebruik minimaal 8 tekens, liefst met cijfers of leestekens.',
  'auth/wrong-password': WW_KLOPT_NIET,
  'auth/invalid-credential': WW_KLOPT_NIET,
  'auth/operation-not-allowed': 'E-mailwijziging niet toegestaan in dit project.',
  'dubbele-naam': 'Er is al een bestuursfunctie met deze naam.',
  aborted: 'Iemand anders wijzigde dit tegelijk. De lijst is bijgewerkt. Kijk of je wijziging nodig is en probeer het zo nodig opnieuw.',
  'vermogen-weg': 'Dit vermogen bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt.',
  'dubbel-project': 'Er is al een project met deze naam.',
  'dubbele-samenwerking': 'Er is al een samenwerking met deze naam.',
  'project-weg': 'Dit project bestaat niet meer.',
  'samenwerking-weg': 'Deze samenwerking bestaat niet meer.',
  'dubbele-commissie': 'Er is al een commissie met deze naam.',
  'commissie-weg': 'Deze commissie bestaat niet meer.',
}

const TIJD_OP_ACCOUNT = {
  'account-wachtwoord': 'Het opslaan duurt te lang. Je wachtwoord is misschien toch gewijzigd: log uit en probeer in te loggen met je nieuwe wachtwoord.',
  'account-email': 'Het opslaan duurt te lang. Misschien is de bevestigingsmail toch verstuurd: kijk in je mailbox voordat je het opnieuw probeert.',
}

// soort: 'formulier-lijst' | 'lijstactie' | 'formulier' | 'account-email' | 'account-wachtwoord' | 'logo'
function foutTekst(e, soort = 'formulier-lijst') {
  const code = e?.code
  const lijstVariant = soort === 'formulier-lijst' || soort === 'lijstactie'
  const staart = soort === 'lijstactie' ? STAART_LIJST : soort === 'logo' ? '' : STAART_INVOER
  if (code === 'offline') return `Je bent niet verbonden met internet. Controleer je verbinding en probeer het opnieuw.${staart}`
  if (VERBINDING_CODES.has(code)) return `Geen verbinding met de server. Controleer je internet en probeer het opnieuw.${staart}`
  if (code === 'tijd-op') {
    if (TIJD_OP_ACCOUNT[soort]) return TIJD_OP_ACCOUNT[soort]
    return lijstVariant
      ? 'Opslaan duurt te lang. Controleer je verbinding en kijk daarna of je wijziging in de lijst staat, voordat je het opnieuw probeert.'
      : 'Opslaan duurt te lang. Controleer je verbinding en herlaad daarna de pagina om te zien of je wijziging is opgeslagen, voordat je het opnieuw probeert.'
  }
  if (code === 'invalid-argument' && soort === 'logo') return 'Dit logo is te groot om op te slaan. Kies een kleiner bestand.'
  if (typeof code === 'string' && Object.hasOwn(FOUTTEKSTEN, code)) return FOUTTEKSTEN[code]
  return 'Opslaan is niet gelukt. Probeer het opnieuw. Blijft dit gebeuren, neem dan contact op met SVN10.'
}

function wisMeldingen(blok) {
  blok?.querySelectorAll('.melding').forEach(el => { el.textContent = '' })
}

function toonOk(el, tekst) {
  if (!el) return
  const vinkje = document.createElement('span')
  vinkje.setAttribute('aria-hidden', 'true')
  vinkje.textContent = '✓ '
  el.replaceChildren(vinkje, tekst)
}

const SUPPORT_STAART = 'contact op met SVN10.'

function toonFout(el, e, soort) {
  if (!el) return
  const tekst = foutTekst(e, soort)
  if (SUPPORT_EMAIL && tekst.endsWith(SUPPORT_STAART)) {
    const link = document.createElement('a')
    link.className = 'tussen-link'
    link.href = supportMailto(huidigGebruiker?.email, 'Opslaan lukt niet in clubKOMPAS')
    link.textContent = SUPPORT_EMAIL
    el.replaceChildren(`${tekst.slice(0, -1)}: `, link, '.')
  } else {
    el.replaceChildren(tekst)
  }
  if (!INLOG_CODES.has(e?.code)) return
  const knop = document.createElement('button')
  knop.type = 'button'
  knop.className = 'btn melding-actie'
  knop.textContent = 'Opnieuw inloggen'
  knop.addEventListener('click', uitloggen)
  el.append(' ', knop)
}

// Een klik op een knop in een blok wist de meldingen van dat blok (niet: bezige knoppen en knoppen in een melding)
function bindMeldblokken() {
  document.querySelectorAll('[data-meldblok]').forEach(blok => {
    if (blok.dataset.meldGebonden) return
    blok.dataset.meldGebonden = '1'
    blok.addEventListener('click', e => {
      const knop = e.target.closest('button')
      if (!knop || !blok.contains(knop)) return
      if (knop.getAttribute('aria-disabled') === 'true') return
      if (knop.closest('.melding')) return
      if (knop.closest('[data-meldblok]') !== blok) return
      wisMeldingen(blok)
    }, true)
  })
}

function metTijdslimiet(belofte, ms = OPSLAAN_TIJDSLIMIET) {
  let timer
  const tijdOp = new Promise((_, reject) => { timer = setTimeout(() => reject({ code: 'tijd-op' }), ms) })
  return Promise.race([belofte, tijdOp]).finally(() => clearTimeout(timer))
}

function zetBezig(knop, lijst, bezig) {
  const rij = knop.closest('.form-rij')
  const knoppen = new Set([knop, ...(rij ? rij.querySelectorAll('button') : []), ...(lijst ? lijst.querySelectorAll('button[data-actie]') : [])])
  const oudeTekst = knop.textContent
  knoppen.forEach(k => k.setAttribute('aria-disabled', 'true'))
  if (bezig) knop.textContent = bezig
  if (lijst) lijst.setAttribute('aria-busy', 'true')
  return () => {
    knoppen.forEach(k => { if (k.isConnected) k.removeAttribute('aria-disabled') })
    if (bezig && knop.isConnected) knop.textContent = oudeTekst
    if (lijst?.isConnected) lijst.removeAttribute('aria-busy')
  }
}

// Veldfout: tekst onder het veld, rode rand, aria-invalid en (standaard) focus op het veld
function zetVeldFout(inputId, foutId, tekst, focus = true) {
  const input = document.getElementById(inputId)
  const fout = document.getElementById(foutId)
  if (fout) fout.textContent = tekst
  if (!input) return
  input.classList.add('fout')
  input.setAttribute('aria-invalid', 'true')
  if (!input.getAttribute('aria-describedby')) input.setAttribute('aria-describedby', foutId)
  if (focus) input.focus()
}

function wisVeldFout(inputId, foutId) {
  const input = document.getElementById(inputId)
  const fout = document.getElementById(foutId)
  if (fout) fout.textContent = ''
  if (input) { input.classList.remove('fout'); input.removeAttribute('aria-invalid') }
}

// Clientvalidatie: [inputId, foutId, foutTekst of ''] per veld. Wist alles, zet de fouten, focus op de eerste.
function valideerVelden(regels) {
  regels.forEach(([inputId, foutId]) => wisVeldFout(inputId, foutId))
  const fouten = regels.filter(([, , tekst]) => tekst)
  fouten.forEach(([inputId, foutId, tekst], i) => zetVeldFout(inputId, foutId, tekst, i === 0))
  return fouten.length === 0
}

// ── Gelijke teksten en gedrag in alle beheertabellen (CK-050) ──
// Zelfde zinnen als de naamregels van vermogens en onderdelen (vermogens.js)
// Onzichtbare stuur-, nul-breedte- en bidi-tekens: de regels weigeren ze (CK-056)
const ONZICHTBARE_TEKENS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u   // gelijk aan geenStuurtekens in firestore.rules (CK-057)
const ONZICHTBAAR_FOUT = 'Er staat een onzichtbaar teken in de naam, bijvoorbeeld uit een gekopieerde tekst of een samengestelde emoji (zoals een gezin of een beroep). Typ de naam opnieuw, zonder zo\'n emoji.'
function naamFout(naam, max = 100) {
  if (!naam) return 'Vul een naam in.'
  if (ONZICHTBARE_TEKENS.test(naam)) return ONZICHTBAAR_FOUT
  const n = [...naam].length
  if (n < 2) return 'Een naam heeft minimaal 2 tekens.'
  if (n > max) return `Een naam heeft maximaal ${max} tekens. Nu zijn het er ${n}.`
  return ''
}
function omschrijvingVerplichtFout(tekst) {
  if (!tekst) return 'Vul een omschrijving in.'
  return [...tekst].length < 2 ? 'Een omschrijving heeft minimaal 2 tekens.' : omschrijvingFout(tekst)
}
const KIES_FUNCTIE = 'Kies een bestuursfunctie.'
// Eén vaste tekst bij verwijderen (besluit 41)
function bevestigVerwijderen(wat, naam) {
  return confirm(`${wat}${naam ? ` ${naam}` : ''} verwijderen? Dit kan niet ongedaan worden gemaakt.`)
}
// Enter in een tekstveld van een formulier = op Opslaan klikken. Niet in een tekstvak, keuze of datumveld.
function enterSlaatOp(container, opslaanKnop) {
  container.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing) return
    if (!e.target.matches?.('input.form-input[type="text"]:not(.eigen-datum-tekst), input.form-input:not([type])')) return
    const knop = opslaanKnop(e.target)
    if (!knop) return
    e.preventDefault()
    knop.click()
  })
}

function minFout(waarde, min, leeg = 'Vul dit veld in.') {
  if (!waarde) return leeg
  return waarde.length < min ? `Gebruik minimaal ${min} tekens.` : ''
}
// Zelfde grenzen als geldigProfiel in firestore.rules (P0d)
function maxFout(waarde, max) {
  const n = [...waarde].length
  return n > max ? `Gebruik maximaal ${max} tekens. Nu zijn het er ${n}.` : ''
}

// Terugval voor de focus: de toevoegknop, of het eerste veld van het open formulier als die verborgen is
function zichtbareTerugval(toevoegKnop, form) {
  if (!toevoegKnop?.hidden) return toevoegKnop
  return form?.querySelector('input:not([type="radio"]), input[type="radio"]:checked, select, textarea') || null
}

// Retourneert 'ok' | 'fout' | 'weg'. Toont zelf alleen fouten; succes doet de aanroeper.
async function metOpslaan(knop, actie, {
  soort = 'formulier-lijst',
  fout,
  weg = fout,
  lijst = null,
  bezig = 'Bezig...',
  veldFouten = {},
} = {}) {
  wisMeldingen(knop.closest('[data-meldblok]'))
  Object.values(veldFouten).forEach(([foutId, inputId]) => wisVeldFout(inputId, foutId))
  const herstel = zetBezig(knop, lijst, bezig)
  try {
    if (navigator.onLine === false) throw { code: 'offline' }
    await metTijdslimiet(actie())
    return 'ok'
  } catch (e) {
    if (import.meta.env.DEV) console.error('Opslaan mislukt:', e?.code, e?.name, e)
    else console.error('Opslaan mislukt:', e?.code, e?.name)
    const veld = veldFouten[e?.code]
    if (veld) {
      const [foutId, inputId, tekst] = veld
      zetVeldFout(inputId, foutId, tekst || e?.tekst || foutTekst(e, soort))
      return 'fout'
    }
    if (WEG_CODES.has(e?.code)) { toonFout(weg, e, soort); return 'weg' }
    toonFout(fout, e, soort)
    return 'fout'
  } finally {
    herstel()
  }
}

// Focus na verversen: dezelfde knop, anders Bewerken van dat item, anders de terugval
function focusInLijst(lijstEl, actie, id, terugval) {
  const zoek = a => lijstEl?.querySelector(`[data-actie="${a}"][data-id="${CSS.escape(id)}"]`)
  const knop = zoek(actie)
  const doel = knop && !knop.disabled && !knop.classList.contains('onzichtbaar') ? knop : (zoek('bewerk') || terugval)
  doel?.focus()
}

// Sectiemelding staat boven de lijst: na een rijactie verder op de pagina in beeld scrollen (ná het focussen)
function meldingInBeeld(el) {
  if (!el?.isConnected || !el.textContent) return
  const r = el.getBoundingClientRect()
  if (r.bottom < 0 || r.top > innerHeight) el.scrollIntoView({ block: 'nearest' })
}

// Pictogramknop in een beheerrij (besluit 19): naam per rij voor de schermlezer, tooltip = het zichtbare label
const ACTIEKNOP = { bewerk: ['Bewerken', 'potlood', ''], verwijder: ['Verwijderen', 'prullenbak', ' gevaar'] }
function actieKnopHTML(actie, id, soort, naam, extra = '') {
  const [label, ico, klasse] = ACTIEKNOP[soort]
  return `<button class="btn-kaart-actie btn-icoon${klasse}" type="button" data-actie="${esc(actie)}" data-id="${esc(id)}" aria-label="${label}: ${esc(naam)}"${extra}>${menuIcoon(ico)}<span class="tip" aria-hidden="true">${label}</span></button>`
}

// Statusregel voor de schermlezer: eerst leeg, na 100 ms gevuld
function zetStatus(el, tekst) {
  if (!el) return
  el.textContent = ''
  setTimeout(() => { if (el.isConnected) el.textContent = tekst }, 100)
}

// Melding bij een domein met vermogens (CK-020): tekst + knop naar Beheer → Vermogens met het filter op dat domein
function toonVermogensBlokkade(el, domein, tekst) {
  if (!el) return
  const link = document.createElement('a')
  link.href = '#'
  link.className = 'btn melding-actie'
  link.dataset.nav = 'vermogensbeheer'
  link.dataset.filter = domein.id
  link.textContent = `Naar de vermogens van ${domein.naam}`
  el.replaceChildren(tekst, link)
}

// Laadfout: één melding met "Opnieuw laden", op elke pagina gelijk (CK-048).
// regelsVoor: in test/ontwikkel bij permission-denied een hint over de Firestore-regels.
function laadfoutHTML(tekst, knopId, e, regelsVoor = '') {
  const testHint = regelsVoor && e?.code === 'permission-denied' && (SOORT === 'test' || SOORT === 'ontwikkel')
    ? `<p class="tussen-hint">Testomgeving: zijn de Firestore-regels voor ${esc(regelsVoor)} al gepubliceerd?</p>` : ''
  return `<div class="meldingen"><div class="melding melding-fout" role="alert">${esc(tekst)} Controleer je verbinding en probeer het opnieuw.<button type="button" class="btn melding-actie" id="${esc(knopId)}">Opnieuw laden</button></div></div>${testHint}`
}

// Klik op "Opnieuw laden": knop op bezig, dan opnieuw() (geeft true als het gelukt is) en de focus terugzetten
function bindHerlaad(container, knopId, opnieuw, focusNaGelukt) {
  container.addEventListener('click', async e => {
    const knop = e.target.closest(`#${knopId}`)
    if (!knop || knop.getAttribute('aria-disabled') === 'true') return
    knop.textContent = 'Bezig...'
    knop.setAttribute('aria-disabled', 'true')
    const gelukt = await opnieuw()
    if (gelukt) focusNaGelukt?.()?.focus()
    else document.getElementById(knopId)?.focus()
  })
}

// Live regions staan er vanaf het tekenen, leeg en zonder witruimte (anders werkt :empty niet)
function meldingenHTML(okId, foutId) {
  const okEl = okId ? `<div class="melding melding-ok" id="${esc(okId)}" role="status"></div>` : ''
  return `<div class="meldingen">${okEl}<div class="melding melding-fout" id="${esc(foutId)}" role="alert"></div></div>`
}

function kompasIconSVG() {
  return `<svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <line x1="12" y1="2.5" x2="12" y2="3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="20.5" x2="12" y2="21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="2.5" y1="12" x2="3.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="20.5" y1="12" x2="21.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="rotate(-45 12 12)">
      <path d="M12 5L10 12L12 10.5L14 12Z"/>
      <path d="M12 19L14 12L12 13.5L10 12Z" opacity="0.35"/>
      <circle cx="12" cy="12" r="1.5"/>
    </g>
  </svg>`
}

// Naam van de ingelogde gebruiker; zonder weergavenaam het deel vóór de @
function gebruikersNaam() {
  return huidigGebruiker ? huidigGebruiker.displayName || (huidigGebruiker.email || '').split('@')[0] : ''
}
// Accountregel onderaan het zijmenu: alleen de naam (rol weggelaten, besluit Paul 23-11-2026)
function sessieLabel() {
  return gebruikersNaam()
}

function footerHTML() {
  // Links het product, rechts OMGEVING · VERSIE (bouwdatum als tooltip)
  const gebouwd = new Date(__APP_BUILD__).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })
  const toonProject = SOORT !== 'productie'
  const label = SOORT === 'productie-lokaal'
    ? `<span class="omgeving-label--waarschuwing">${esc(OMGEVING_LABEL)}</span>`
    : esc(OMGEVING_LABEL)
  return `
    <footer>
      <span>clubKOMPAS · een product van SVN10</span>
      <span title="${toonProject ? `Project ${esc(projectId)} · ` : ''}Gebouwd op ${esc(gebouwd)}">${label} · Versie ${version}</span>
    </footer>`
}

// ── Structuur grid (dashboard, read-only) ────────────────────────────────────

async function renderStructuurGrid() {
  const grid = document.getElementById('structuur-grid')
  if (!grid) return
  grid.querySelectorAll('.structuur-dyn').forEach(el => el.remove())
  // Vermogens mogen Home niet blokkeren: mislukt dat laden, dan de domeinen zoals altijd (CK-020)
  const [domeinUitkomst, vermogenUitkomst] = await Promise.allSettled([laadStructuurelementen(), laadVermogens(db, huidigClubId)])
  if (domeinUitkomst.status === 'rejected') throw domeinUitkomst.reason
  const items = domeinUitkomst.value
  const vermogens = vermogenUitkomst.status === 'fulfilled' ? vermogenUitkomst.value : null
  if (!grid.isConnected) return
  const zet = (id, waarde) => { const el = document.getElementById(id); if (el) el.textContent = waarde }
  zet('cijfer-pijlers', items.filter(i => i.type === 'pijler').length)
  zet('cijfer-domeinen', items.filter(i => i.type === 'domein').length)
  zet('cijfer-overkoepelend', items.filter(i => i.type === 'overkoepelend').length)
  const perDomein = new Map()
  if (vermogens) {
    const geldig = new Set(items.filter(i => KAN_VERMOGENS.has(i.type)).map(i => i.id))
    vermogens.filter(v => geldig.has(v.domeinId)).forEach(v => perDomein.set(v.domeinId, (perDomein.get(v.domeinId) || 0) + 1))
    zet('cijfer-vermogens', [...perDomein.values()].reduce((a, b) => a + b, 0))
  } else {
    if (vermogenUitkomst.reason) console.error('Vermogens laden mislukt:', vermogenUitkomst.reason?.code)
    const streep = document.createElement('span')
    streep.setAttribute('aria-hidden', 'true')
    streep.textContent = '–'
    const uitleg = document.createElement('span')
    uitleg.className = 'sr-only'
    uitleg.textContent = 'niet geladen'
    document.getElementById('cijfer-vermogens')?.replaceChildren(streep, uitleg)
    const hint = document.getElementById('vermogens-hint')
    if (hint) hint.textContent = 'Het aantal vermogens kon niet worden geladen. Herlaad de pagina om het opnieuw te proberen.'

  }
  if (items.length === 0) {
    const leeg = document.createElement('p')
    leeg.className = 'structuur-dyn grid-leeg'
    leeg.textContent = isBeheerder() ? 'Nog geen domeinen. Voeg ze toe via Beheer.' : 'Er zijn nog geen domeinen. Vraag een beheerder ze toe te voegen.'
    grid.appendChild(leeg)
    return
  }
  items.forEach(item => {
    const div = document.createElement('div')
    div.className = 'structuur-dyn'
    div.innerHTML = `
      <div class="card domein-kaart">
        <h3 class="card-titel">${pictogramHTML(item, 'picto-kaart')}<span>${esc(item.naam)}</span></h3>
        <div class="sub">${SOORT_SUB[item.type] || ''}</div>
        <p class="kaart-omschrijving">${esc(item.omschrijving || '')}</p>
        ${vermogens && KAN_VERMOGENS.has(item.type) ? (perDomein.get(item.id)
          ? `<p class="kaart-vermogens">${vermogensTekst(perDomein.get(item.id))}</p>`
          : '<p class="kaart-vermogens leeg">Nog geen vermogens</p>') : ''}
        <div class="kaart-voet">
          <span class="pill"><span class="stip${SOORT_KLEUR[item.type] || ''}"></span>${SOORT_LABEL[item.type] || ''}</span>
          ${item.hashtag ? `<span class="kaart-hashtag">${esc(item.hashtag)}</span>` : ''}
        </div>
      </div>`
    grid.appendChild(div)
  })
}

// ── Schermen ──────────────────────────────────────────────────────────────────

function renderInlogscherm() {
  document.querySelector('#app').innerHTML = `
    <div class="inlog-wrap">
      <div class="inlog-kaart">
        <div class="inlog-logo">
          ${kompasIconSVG()}
          <span class="app-title">club<b>KOMPAS</b></span>
        </div>
        <h1 class="inlog-titel">Inloggen</h1>
        <div class="form-groep">
          <label class="form-label" for="inlog-email">E-mailadres</label>
          <input class="form-input" id="inlog-email" type="email" placeholder="naam@voorbeeld.nl" autocomplete="email" aria-describedby="inlog-email-fout inlog-algemeen-fout">
          <span class="form-fout" id="inlog-email-fout"></span>
        </div>
        <div class="form-groep">
          <label class="form-label" for="inlog-wachtwoord">Wachtwoord</label>
          <input class="form-input" id="inlog-wachtwoord" type="password" placeholder="••••••••" autocomplete="current-password" aria-describedby="inlog-wachtwoord-fout inlog-algemeen-fout">
          <span class="form-fout" id="inlog-wachtwoord-fout"></span>
        </div>
        <div class="form-fout" id="inlog-algemeen-fout" role="alert"></div>
        <button class="btn primary inlog-knop" id="inlog-knop">Inloggen</button>
      </div>
    </div>
  `

  // Fouten via zetVeldFout (aria-invalid, beschrijving, focus); de algemene fout is een live-region (CK-048)
  document.getElementById('inlog-knop').addEventListener('click', async () => {
    const knop = document.getElementById('inlog-knop')
    if (knop.getAttribute('aria-disabled') === 'true') return
    const email = document.getElementById('inlog-email').value.trim()
    const wachtwoord = document.getElementById('inlog-wachtwoord').value
    const algFout = document.getElementById('inlog-algemeen-fout')

    algFout.textContent = ''
    if (!valideerVelden([
      ['inlog-email', 'inlog-email-fout', email ? '' : 'Vul je e-mailadres in.'],
      ['inlog-wachtwoord', 'inlog-wachtwoord-fout', wachtwoord ? '' : 'Vul je wachtwoord in.'],
    ])) return

    knop.textContent = 'Bezig...'
    knop.setAttribute('aria-disabled', 'true')

    try {
      await signInWithEmailAndPassword(auth, email, wachtwoord)
    } catch (e) {
      knop.textContent = 'Inloggen'
      knop.removeAttribute('aria-disabled')
      // Fout bij één veld: daar tonen. Combinatie klopt niet: beide velden ongeldig, tekst in de algemene melding.
      const veldfouten = {
        'auth/user-not-found': ['inlog-email', 'inlog-email-fout', 'Geen account gevonden met dit e-mailadres.'],
        'auth/invalid-email': ['inlog-email', 'inlog-email-fout', 'Ongeldig e-mailadres.'],
        'auth/wrong-password': ['inlog-wachtwoord', 'inlog-wachtwoord-fout', 'Wachtwoord klopt niet.'],
      }
      const foutcodes = {
        'auth/invalid-credential': 'E-mailadres of wachtwoord klopt niet.',
        'auth/too-many-requests': 'Te veel pogingen. Probeer het later opnieuw.',
      }
      const testProject = SOORT === 'test' || SOORT === 'ontwikkel'
      if (e.code === 'auth/unauthorized-domain' || e.code === 'auth/unauthorized-continue-uri' || String(e.code).startsWith('auth/requests-from-referer')) {
        toonAdresNietToegestaan(algFout, testProject)
        return
      }
      if (veldfouten[e.code]) {
        zetVeldFout(...veldfouten[e.code])
      } else {
        algFout.textContent = foutcodes[e.code] || 'Inloggen is niet gelukt. Probeer het opnieuw.'
        if (e.code === 'auth/invalid-credential') {
          zetVeldFout('inlog-wachtwoord', 'inlog-wachtwoord-fout', '', false)
          zetVeldFout('inlog-email', 'inlog-email-fout', '', true)
        }
      }
      if (testProject && ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(e.code)) {
        const hint = document.createElement('span')
        hint.className = 'inlog-test-hint'
        hint.append('Let op: je zit in de ')
        const sterk = document.createElement('strong')
        sterk.textContent = SOORT === 'ontwikkel' ? 'ontwikkelomgeving' : 'testomgeving'
        hint.append(sterk, '. Gebruik je testaccount, niet je gewone clubKOMPAS-account.')
        algFout.append(' ', hint)
      }
    }
  })

  if (stilUitgelogd) {
    stilUitgelogd = false
    // Pas na het tekenen vullen: een live-region die al gevuld verschijnt, wordt vaak niet voorgelezen (CK-056)
    setTimeout(() => { const el = document.getElementById('inlog-algemeen-fout'); if (el) el.textContent = STIL_MELDING }, 150)
  }

  document.getElementById('inlog-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('inlog-wachtwoord').focus()
  })
  document.getElementById('inlog-wachtwoord').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('inlog-knop').click()
  })
}

function toonAdresNietToegestaan(algFout, testProject) {
  const adres = location.host
  const metTag = (tag, tekst) => {
    const el = document.createElement(tag)
    el.textContent = tekst
    return el
  }
  algFout.replaceChildren('Inloggen is op dit adres (', metTag('strong', adres), ') nog niet toegestaan.')
  const gerust = metTag('span', 'Dit ligt niet aan je e-mailadres of wachtwoord; er is niets gewijzigd. Probeer het later opnieuw of meld het aan de beheerder.')
  gerust.className = 'inlog-test-hint'
  algFout.append(' ', gerust)
  if (!testProject) return
  const hint = document.createElement('span')
  hint.className = 'inlog-test-hint'
  hint.append('Voeg ', metTag('code', adres), ' toe in de Firebase-console van ', metTag('strong', projectId),
    ' (Authentication → Settings → Authorized domains) en, als die er is, aan de websitebeperking van de API-key in Google Cloud Console.')
  algFout.append(' ', hint)
}

function toonTussenkaart(inhoudHTML, { laden = false, gestopt = false } = {}) {
  document.querySelector('#app').innerHTML = `
    <div class="inlog-wrap">
      <div class="inlog-kaart${gestopt ? ' kaart-gestopt' : ''}">
        <div class="inlog-logo${laden ? ' laadt' : ''}">
          ${kompasIconSVG()}
          <span class="app-title">club<b>KOMPAS</b></span>
        </div>
        ${inhoudHTML}
      </div>
    </div>`
  document.getElementById('tussen-titel')?.focus()
}

function renderConfigFout(fout) {
  const bestand = import.meta.env.MODE === 'productie' ? '.env.productie.local' : '.env.test.local'
  let titel, alinea, gerust = 'Er is niets gelezen of opgeslagen.', stappen = [], hint = ''
  if (fout === 'productie-lokaal') {
    titel = 'Gestopt: deze lokale app wijst naar de echte clubdata'
    alinea = `Het project in de configuratie is <code>${esc(projectId)}</code> (productie). Lokaal mag dat alleen bewust, met <code>npm run dev:productie</code>.`
    stappen = [
      'Verwijder het oude bestand <code>.env</code> uit de projectmap, als dat er nog staat.',
      'Controleer dat <code>.env.test.local</code> de waarden van het testproject bevat, niet die van productie.',
      'Stop de app (Ctrl+C) en start opnieuw met <code>npm run dev</code>.',
    ]
    hint = 'Bewust op productie werken? Gebruik <code>npm run dev:productie</code>.'
  } else if (fout === 'test-met-productie' && VERCEL_ENV) {
    titel = 'Gestopt: deze testomgeving wijst naar de echte clubdata'
    alinea = `Het project in de configuratie is <code>${esc(projectId)}</code> (productie). Waarschijnlijk staan bij Vercel onder <strong>Preview</strong> nog de productiewaarden.`
    stappen = [
      'Open in Vercel: Settings → Environment Variables.',
      'Zorg dat elke <code>VITE_FIREBASE_*</code> onder Preview de waarden van <code>svn10-clubkompas-test</code> heeft.',
      'Doe daarna een Redeploy van de branch <code>test</code>.',
    ]
    hint = 'Je wilde de echte clubdata? Ga naar <a class="tussen-link" href="https://clubkompas.svn10.nl">clubkompas.svn10.nl</a>.'
  } else if (fout === 'test-met-productie') {
    titel = 'Gestopt: deze testbuild wijst naar de echte clubdata'
    alinea = `Het project in de configuratie is <code>${esc(projectId)}</code> (productie), terwijl het label een testomgeving aangeeft.`
    stappen = [
      `Controleer dat <code>.env.${esc(import.meta.env.MODE)}.local</code> de waarden van het testproject bevat.`,
      'Bouw opnieuw (<code>npx vite build --mode test</code>) en laad deze pagina opnieuw.',
    ]
  } else if (fout === 'gemengde-config' && import.meta.env.DEV) {
    titel = 'Gestopt: de configuratie is onvolledig of gemengd'
    alinea = `In <code>${bestand}</code> ontbreekt een van de zes Firebase-waarden, of de waarden horen niet bij hetzelfde project (<code>${esc(projectId)}</code>). Een ontbrekende waarde vult Vite aan uit het oude bestand <code>.env</code> (productie).`
    stappen = [
      `Zet alle zes Firebase-waarden van het testproject in <code>${bestand}</code>, met dezelfde project-ID in <code>VITE_FIREBASE_PROJECT_ID</code> en <code>VITE_FIREBASE_AUTH_DOMAIN</code>, en met hetzelfde projectnummer in <code>VITE_FIREBASE_APP_ID</code> en <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code> (zie README, “Omgevingen”).`,
      'Stop de app (Ctrl+C) en start opnieuw met <code>npm run dev</code>.',
    ]
  } else if (fout === 'gemengde-config' && VERCEL_ENV) {
    titel = 'Gestopt: de instellingen van deze testomgeving zijn onvolledig of passen niet bij elkaar'
    alinea = `Een van de zes Firebase-waarden ontbreekt, of de waarden horen niet bij hetzelfde project (<code>${esc(projectId)}</code>).`
    stappen = [
      'Controleer in Vercel (Settings → Environment Variables, Preview) of alle zes <code>VITE_FIREBASE_*</code> gevuld zijn en bij hetzelfde project horen; <code>VITE_FIREBASE_AUTH_DOMAIN</code> begint met de project-ID en het getal na de eerste dubbele punt in <code>VITE_FIREBASE_APP_ID</code> is gelijk aan <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>.',
      'Doe daarna een Redeploy van de branch <code>test</code>.',
    ]
  } else if (fout === 'gemengde-config') {
    const modusBestand = `.env.${esc(import.meta.env.MODE)}.local`
    titel = 'Gestopt: de configuratie is onvolledig of gemengd'
    alinea = `In <code>${modusBestand}</code> ontbreekt een van de zes Firebase-waarden, of de waarden horen niet bij hetzelfde project (<code>${esc(projectId)}</code>).`
    stappen = [
      `Controleer in <code>${modusBestand}</code> of alle zes <code>VITE_FIREBASE_*</code> gevuld zijn en bij hetzelfde project horen; <code>VITE_FIREBASE_AUTH_DOMAIN</code> begint met de project-ID en het getal na de eerste dubbele punt in <code>VITE_FIREBASE_APP_ID</code> is gelijk aan <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>.`,
      'Bouw opnieuw en laad deze pagina opnieuw.',
    ]
  } else if (import.meta.env.DEV) {
    titel = 'Geen verbinding ingesteld'
    alinea = `De app weet niet met welke database hij moet praten: het bestand <code>${bestand}</code> ontbreekt of is leeg.`
    stappen = [
      `Zet de zes Firebase-waarden van het testproject in <code>${bestand}</code> (zie README, “Omgevingen”).`,
      'Stop de app in de terminal (Ctrl+C) en start opnieuw met <code>npm run dev</code>.',
      'Laad deze pagina daarna opnieuw.',
    ]
  } else {
    titel = 'clubKOMPAS is tijdelijk niet beschikbaar'
    alinea = 'De verbinding met de database is niet ingesteld. Probeer het later opnieuw.'
    gerust = ''
    hint = `Blijft dit zo? Mail naar ${supportLinkHTML('', 'Storing clubKOMPAS')}`
  }
  toonTussenkaart(`
    <div role="alert">
      <h1 class="inlog-titel" id="tussen-titel" tabindex="-1" aria-describedby="config-uitleg">${titel}</h1>
      <p class="tussen-tekst" id="config-uitleg">${alinea}</p>
    </div>
    ${gerust ? `<p class="tussen-tekst config-gerust">${gerust}</p>` : ''}
    ${stappen.length ? `<p class="form-label">Wat nu?</p>
    <ol class="config-stappen">${stappen.map(s => `<li>${s}</li>`).join('')}</ol>` : ''}
    ${hint ? `<p class="tussen-hint">${hint}</p>` : ''}
    <button class="btn inlog-knop" id="config-herlaad">Opnieuw laden</button>`, { gestopt: fout !== 'geen-config' })
  document.getElementById('config-herlaad').addEventListener('click', () => location.reload())
  document.title = 'Gestopt · clubKOMPAS'
  const tekst = html => html.replace(/<[^>]+>/g, '')
  console.error(`${titel}. ${tekst(alinea)}`)
}

// Omgevingsbalk: test grijs, ontwikkel oranje, productie lokaal met waarschuwing. In productie geen balk (Paul, 23-11-2026: overbodig)
const OMGEVINGS_BALK = {
  productie: { klasse: 'productie', titel: '', tekst: () => '' },
  ontwikkel: { klasse: 'ontwikkel', titel: 'ONTWIKKEL', tekst: () => `<strong>Ontwikkelomgeving</strong> · op deze computer · project ${esc(projectId)} · fictieve data` },
  test: { klasse: 'test', titel: 'TEST', tekst: () => `<strong>Testomgeving</strong> · online · project ${esc(projectId)} · fictieve data` },
  'productie-lokaal': { klasse: 'productie-lokaal', titel: 'PRODUCTIE LOKAAL', tekst: () => `<strong>Let op: echte clubdata</strong> · lokaal tegen ${esc(projectId)}` },
}

// "<pagina> · clubKOMPAS", met het omgevingsvoorvoegsel (P0e/P0f) als dat er is
function paginaTitel(pagina) {
  return [OMGEVINGS_BALK[SOORT]?.titel, pagina, 'clubKOMPAS'].filter(Boolean).join(' · ')
}

// De omgevingsbalk staat onderaan, boven de footer (Paul, 23-11-2026). In de app-shell tekent
// appShellHTML hem zelf; voor inlog- en laadschermen staat er één los onderaan de body.
function omgevingsBalkHTML() {
  const variant = OMGEVINGS_BALK[SOORT]
  if (!variant) return ''
  const tekst = variant.tekst()
  if (!tekst) return ''   // productie: geen balk
  return `<div class="omgeving-balk omgeving-balk--${variant.klasse}" data-soort="${esc(SOORT)}" role="note" aria-label="Omgeving">${tekst}</div>`
}

function toonOmgevingsBalk() {
  if (!OMGEVINGS_BALK[SOORT]) return
  if (document.querySelector('body > .omgeving-balk')) return
  document.body.insertAdjacentHTML('beforeend', omgevingsBalkHTML())
  document.body.classList.add('met-omgeving-balk')
  document.title = paginaTitel()
}

function renderLaadkaart() {
  toonTussenkaart(`
    <h1 class="inlog-titel tussen-laad-titel" id="tussen-titel" tabindex="-1">Je club wordt geladen...</h1>`, { laden: true })
}

function renderGeenClub(gebruiker) {
  const email = gebruiker?.email || ''
  const alinea1 = email
    ? `Je bent ingelogd als <strong>${esc(email)}</strong>, maar je account is nog niet aan een club gekoppeld.`
    : 'Je bent ingelogd, maar je account is nog niet aan een club gekoppeld.'
  const alinea2 = SUPPORT_EMAIL
    ? `Neem contact op met SVN10 om toegang te krijgen: ${supportLinkHTML(email)}`
    : 'Neem contact op met SVN10 om toegang te krijgen.'
  toonTussenkaart(`
    <h1 class="inlog-titel" id="tussen-titel" tabindex="-1">Geen club gekoppeld</h1>
    <p class="tussen-tekst">${alinea1}</p>
    <p class="tussen-tekst">${alinea2}</p>
    ${SOORT === 'test' || SOORT === 'ontwikkel' ? `<p class="tussen-hint">
      <strong>${SOORT === 'ontwikkel' ? 'Ontwikkelomgeving' : 'Testomgeving'}:</strong> controleer in de testconsole (project <code>${esc(projectId)}</code>)
      of <code>gebruikers/${esc(gebruiker?.uid || 'UID')}</code> bestaat met het veld <code>clubId</code>,
      en of <code>clubs/&lt;clubId&gt;/leden/${esc(gebruiker?.uid || 'UID')}</code> bestaat met <code>rol</code> = <code>beheerder</code>.
    </p>` : ''}
    <button class="btn primary inlog-knop" id="geen-club-uitlog">Uitloggen</button>`)
  document.getElementById('geen-club-uitlog').addEventListener('click', uitloggen)
}

function renderFoutkaart(gebruiker) {
  toonTussenkaart(`
    <h1 class="inlog-titel" id="tussen-titel" tabindex="-1">Club laden lukt niet</h1>
    <p class="tussen-tekst">We konden je clubgegevens niet ophalen. Controleer je internetverbinding en probeer het opnieuw.</p>
    <div class="form-rij">
      <button class="btn primary" id="fout-opnieuw">Opnieuw proberen</button>
      <button class="btn" id="fout-uitlog">Uitloggen</button>
    </div>
    <p class="tussen-hint" id="fout-hint" role="status"></p>`)

  document.getElementById('fout-uitlog').addEventListener('click', uitloggen)

  const knop = document.getElementById('fout-opnieuw')
  const hint = document.getElementById('fout-hint')
  knop.addEventListener('click', async () => {
    if (knop.getAttribute('aria-disabled') === 'true') return
    knop.textContent = 'Bezig...'
    knop.setAttribute('aria-disabled', 'true')
    hint.textContent = 'Bezig met laden...'
    const { status } = await laadClub(gebruiker)
    if (huidigGebruiker?.uid !== gebruiker.uid || status === 'afgebroken') return
    if (status !== 'fout') { toonUitkomst(gebruiker, status); return }
    foutPogingen++
    if (!knop.isConnected) return
    knop.textContent = 'Opnieuw proberen'
    knop.removeAttribute('aria-disabled')
    knop.focus()
    hint.textContent = ''
    if (foutPogingen >= 2) {
      const hintHTML = SUPPORT_EMAIL
        ? `Lukt het na een paar pogingen nog steeds niet? Mail naar ${supportLinkHTML(gebruiker?.email, 'Storing clubKOMPAS')}.`
        : 'Lukt het na een paar pogingen nog steeds niet? Neem contact op met SVN10.'
      setTimeout(() => { if (hint.isConnected) hint.innerHTML = hintHTML }, 100)
    }
  })
}

function toonUitkomst(gebruiker, status) {
  if (status === 'ok') {
    foutPogingen = 0
    setFavicon(huidigProfiel?.logo)
    renderHome(gebruiker)
  } else if (status === 'geen-club') {
    foutPogingen = 0
    renderGeenClub(gebruiker)
  } else {
    foutPogingen = 1
    renderFoutkaart(gebruiker)
  }
}

// Home: welkomspagina voor de ingelogde gebruiker (later: laatst gewijzigd, taken)
function renderHome(gebruiker) {
  const clubNaam = huidigProfiel?.naam
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'home', kruimels: [[navNaam('home')]], inhoud: `
        <div class="pagina-kop">
          <h1 class="pagina-titel">Welkom, ${esc(gebruikersNaam())}</h1>
        </div>
        <p class="welkom-tekst">Bij het clubKOMPAS${clubNaam ? ` van ${esc(clubNaam)}` : ''}.</p>
` })
  bindAppShell(gebruiker)
}

// Kerncijfer als link naar een pagina; mag je daar niet heen (Beheer zonder rol beheerder), dan een vak zonder link
function cijferHTML(getal, label, nav, filter = '') {
  if (!magNaar(nav)) return `<div class="cijfer">${getal}<span class="l">${label}</span></div>`
  return `<a href="#" class="cijfer cijfer-link" data-nav="${nav}"${filter ? ` data-filter="${filter}"` : ''}>${getal}<span class="l">${label}<span aria-hidden="true"> →</span></span></a>`
}

function renderDomeinenoverzicht(gebruiker) {
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'domeinenoverzicht', kruimels: [['Home', 'home'], [navNaam('domeinenoverzicht')]], inhoud: `
        <div class="pagina-kop">
          <h1 class="pagina-titel">Domeinenoverzicht</h1>
        </div>

        <div class="cijfers" aria-label="Kerncijfers">
          ${cijferHTML('<span class="n" id="cijfer-pijlers">–</span>', 'Pijlers', 'domeinen', 'pijler')}
          ${cijferHTML('<span class="n" id="cijfer-domeinen">–</span>', 'Ondersteunende domeinen', 'domeinen', 'domein')}
          ${cijferHTML('<span class="n" id="cijfer-overkoepelend">–</span>', 'Overkoepelende domeinen', 'domeinen', 'overkoepelend')}
          ${cijferHTML('<span class="n" id="cijfer-vermogens"><span aria-hidden="true">–</span><span class="sr-only">wordt geladen</span></span>', 'Vermogens', 'vermogens')}
        </div>

        <div class="sectie" role="region" aria-labelledby="sectie-kop-1">
          <div class="sectie-kop">
            <h2 id="sectie-kop-1">Domeinen</h2>
          </div>
          <div class="sectie-lijf">
            <p class="vermogens-hint" id="vermogens-hint" role="status"></p>
            <div class="grid" id="structuur-grid">
            </div>
          </div>
        </div>
` })

  bindAppShell(gebruiker)

  const grid = document.getElementById('structuur-grid')
  const laadGrid = async () => {
    try {
      await renderStructuurGrid()
      return true
    } catch (e) {
      console.error('Domeinen laden mislukt:', e?.code)
      if (!grid.isConnected) return false
      grid.querySelectorAll('.structuur-dyn').forEach(el => el.remove())
      const fout = document.createElement('div')
      fout.className = 'structuur-dyn grid-fout'
      fout.innerHTML = laadfoutHTML('De domeinen konden niet worden geladen.', 'grid-herlaad', e, 'domeinen')
      grid.appendChild(fout)
      const sr = document.querySelector('#cijfer-vermogens .sr-only')
      if (sr) sr.textContent = 'niet geladen'
      return false
    }
  }
  bindHerlaad(grid, 'grid-herlaad', laadGrid, () => document.querySelector('.cijfer-link') || document.getElementById('inhoud'))
  laadGrid()
}

// ── Vermogens: de plaat (CK-021) ──────────────────────────────────────────────

function plaatSectieHTML(kop, toel, klasse, kaarten) {
  if (!kaarten.length) return ''
  return `
          <div class="sectie plaat-sectie">
            <div class="sectie-kop">
              <h2>${kop}</h2>
              <span class="toel">${toel}</span>
            </div>
            <div class="sectie-lijf">
              <ul class="plaat-rij ${klasse}" role="list">${kaarten.join('')}</ul>
            </div>
          </div>`
}

// Kaartjes van projecten of samenwerkingen in het overkoepelende blok met bevat (CK-046, besluiten 11, 12 en 18)
function plaatOnderdelenHTML(d, { soort, items }) {
  if (!items.length) return `<p class="plaat-leeg">Er zijn geen ${SOORT_ONDERDEEL[soort].meer}.</p>`
  const kaartje = x => {
    // "In voorbereiding" toont de plaat alleen met de stippellijn (Paul); voor schermlezers blijft het als verborgen tekst
    const sub = soort === 'projecten' ? periodeTekst(x.begindatum, x.einddatum) : ''
    const voorbereiding = soort === 'projecten' && x.status === 'in-voorbereiding'
    return `<li class="plaat-onderdeel${voorbereiding ? ' voorbereiding' : ''}">${esc(x.naam)}${voorbereiding ? `<span class="sr-only">, ${STATUS_LABEL['in-voorbereiding'].toLowerCase()}</span>` : ''}${sub ? `<span class="plaat-onderdeel-sub"><span class="sr-only">, </span>${esc(sub)}</span>` : ''}</li>`
  }
  return `<ul class="plaat-onderdelen" role="list" aria-label="${esc(d.naam)}">${items.map(kaartje).join('')}</ul>`
}

function plaatKaartHTML(d, lijst, functieNaam, onderdelen = null) {
  const soort = d.type === 'pijler' ? 'pijler' : d.type === 'domein' ? 'steun' : 'over'
  const sub = d.type !== 'overkoepelend' && d.hashtag ? `<p class="plaat-sub">${esc(d.hashtag)}</p>` : ''
  const verantw = functieNaam
    ? `<p class="plaat-verantw"><span class="sr-only">Eindverantwoordelijke: </span><strong>${esc(functieNaam.get(d.bestuursfunctieId) || 'nog niet gekozen')}</strong></p>`
    : ''
  let rest
  if (d.type === 'overkoepelend' && onderdelen) {
    rest = plaatOnderdelenHTML(d, onderdelen)
  } else if (d.type === 'overkoepelend') {
    rest = d.omschrijving ? `<p class="plaat-omschrijving">${esc(d.omschrijving)}</p>` : ''
  } else if (lijst.length) {
    rest = `<ul class="plaat-vermogens" role="list">${lijst.map(v => `<li class="plaat-vermogen">${esc(v.naam)}</li>`).join('')}</ul>`
  } else {
    rest = '<p class="plaat-leeg">Nog geen vermogens</p>'
  }
  return `
                <li class="plaat-domein ${soort}">
                  <h3 class="plaat-kop">${pictogramHTML(d, 'picto-klein')}<span>${esc(d.naam)}</span></h3>
                  ${sub}${verantw}${rest}
                </li>`
}

async function renderPlaat(gebruiker) {
  const clubId = huidigClubId
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'vermogens', kruimels: [['Home', 'home'], [navNaam('vermogens')]], inhoud: `
        <div class="pagina-kop">
          <h1 class="pagina-titel">Vermogensoverzicht</h1>
        </div>
        <p class="vermogens-hint" id="plaat-hint" role="status"></p>
        <div id="plaat"><p class="lijst-laden">De plaat wordt geladen...</p></div>
` })
  bindAppShell(gebruiker)
  const plaatEl = document.getElementById('plaat')
  const hintEl = document.getElementById('plaat-hint')

  function toonLaadfout(e) {
    if (!plaatEl.isConnected) return
    plaatEl.innerHTML = laadfoutHTML('De plaat kon niet worden geladen.', 'plaat-herlaad', e, 'vermogens')
  }

  // onderdelen: { projecten: lijst | null, samenwerkingen: lijst | null }; null = laden mislukt
  function teken(domeinen, vermogens, functies, onderdelen) {
    const functieNaam = functies ? new Map(functies.map(f => [f.id, f.naam])) : null
    const blokVan = new Map()
    let onderdelenMislukt = false
    for (const soort of PLAAT_SOORTEN) {
      const blok = domeinen.find(d => d.type === 'overkoepelend' && d.bevat === soort)
      if (!blok) continue
      const lijst = onderdelen[soort]
      if (!lijst) { onderdelenMislukt = true; continue }
      const items = soort === 'projecten' ? lijst.filter(x => OP_PLAAT.has(x.status)) : lijst
      blokVan.set(blok.id, { soort, items })
    }
    hintEl.textContent = [
      functies ? '' : 'De eindverantwoordelijken konden niet worden geladen. Herlaad de pagina om het opnieuw te proberen.',
      onderdelenMislukt ? 'De projecten en samenwerkingen konden niet worden geladen. Herlaad de pagina om het opnieuw te proberen.' : '',
    ].filter(Boolean).join(' ')
    const geldig = new Set(domeinen.filter(d => KAN_VERMOGENS.has(d.type)).map(d => d.id))
    const perDomein = new Map()
    vermogens.filter(v => geldig.has(v.domeinId)).forEach(v => {
      if (!perDomein.has(v.domeinId)) perDomein.set(v.domeinId, [])
      perDomein.get(v.domeinId).push(v)
    })
    perDomein.forEach(lijst => sorteerDomeinen(lijst))
    const aantalWees = vermogens.length - [...perDomein.values()].reduce((a, l) => a + l.length, 0)
    const vanType = type => domeinen.filter(d => d.type === type)
    const telling = lijst => {
      const n = lijst.reduce((a, d) => a + (perDomein.get(d.id)?.length || 0), 0)
      return n ? vermogensTekst(n) : 'nog geen vermogens'
    }
    const kaarten = lijst => lijst.map(d => plaatKaartHTML(d, perDomein.get(d.id) || [], functieNaam, blokVan.get(d.id)))
    const pijlers = vanType('pijler')
    const steun = vanType('domein')
    const over = vanType('overkoepelend')
    let leeg = ''
    if (!pijlers.length && !steun.length) {
      leeg = `
          <div class="leeg-blok">
            <h2>Nog geen domeinen</h2>
            <p>De plaat toont de pijlers en ondersteunende domeinen van de club met hun vermogens. Die zijn er nog niet; ${isBeheerder() ? 'ze worden toegevoegd via Beheer' : 'een beheerder voegt ze toe'}.</p>
          </div>`
    } else if (!perDomein.size) {
      leeg = `
          <div class="leeg-blok">
            <h2>Nog geen vermogens</h2>
            <p>Een vermogen is iets wat de club moet kunnen om een domein te laten werken. ${isBeheerder() ? 'Ze worden toegevoegd via Beheer → Vermogens' : 'Een beheerder voegt ze toe'}.</p>
          </div>`
    }
    const voetnoot = aantalWees
      ? `<p class="lijst-voetnoot">${aantalWees === 1 ? '1 vermogen hoort' : `${aantalWees} vermogens horen`} niet bij een pijler of ondersteunend domein en staat${aantalWees === 1 ? '' : 'n'} daarom niet op de plaat.</p>`
      : ''
    // Kerncijfers bovenaan de plaat, in dezelfde vorm als op het Domeinenoverzicht
    const aantalOnderdelen = soort => {
      const lijst = onderdelen[soort]
      if (!lijst) return '<span aria-hidden="true">–</span><span class="sr-only">niet geladen</span>'
      return (soort === 'projecten' ? lijst.filter(x => OP_PLAAT.has(x.status)) : lijst).length
    }
    // Elk kerncijfer is een link naar de beheerpagina (zoals Vermogens op het Domeinenoverzicht); zonder Beheer een vak
    const cijfer = (n, label, nav, filter = '') => cijferHTML(`<span class="n">${n}</span>`, label, nav, filter)
    const cijfers = `
        <div class="cijfers cijfers-5" aria-label="Kerncijfers">
          ${cijfer(pijlers.length, 'Pijlers', 'domeinen', 'pijler')}
          ${cijfer(steun.length, 'Ondersteunende domeinen', 'domeinen', 'domein')}
          ${cijfer(vermogens.length - aantalWees, 'Vermogens', 'vermogensbeheer')}
          ${cijfer(aantalOnderdelen('projecten'), 'Projecten', 'projecten')}
          ${cijfer(aantalOnderdelen('samenwerkingen'), 'Samenwerkingen', 'samenwerkingen')}
        </div>`
    plaatEl.innerHTML = cijfers + leeg
      + plaatSectieHTML('Pijlers', telling(pijlers), 'plaat-pijlers', kaarten(pijlers))
      + plaatSectieHTML('Ondersteunende domeinen', telling(steun), 'plaat-steun', kaarten(steun))
      + plaatSectieHTML('Overkoepelende domeinen', 'zonder vermogens', 'plaat-over', kaarten(over))
      + voetnoot
  }

  async function laadEnTeken() {
    const functiesBelofte = Promise.allSettled([laadBestuursfuncties()])
    const onderdelenBelofte = Promise.allSettled(PLAAT_SOORTEN.map(soort => laadOnderdelen(db, clubId, soort)))
    let domeinen, vermogens
    try {
      [domeinen, vermogens] = await Promise.all([laadStructuurelementen(), laadVermogens(db, clubId)])
    } catch (e) {
      console.error('Plaat laden mislukt:', e?.code)
      toonLaadfout(e)
      return false
    }
    const [functieUitkomst] = await functiesBelofte
    const onderdeelUitkomsten = await onderdelenBelofte
    if (!plaatEl.isConnected) return false
    if (functieUitkomst.status === 'rejected') console.error('Bestuursfuncties laden mislukt:', functieUitkomst.reason?.code)
    const onderdelen = {}
    PLAAT_SOORTEN.forEach((soort, k) => {
      const u = onderdeelUitkomsten[k]
      if (u.status === 'rejected') console.error(`${SOORT_ONDERDEEL[soort].Meer} laden mislukt:`, u.reason?.code)
      onderdelen[soort] = u.status === 'fulfilled' ? u.value : null
    })
    teken(domeinen, vermogens, functieUitkomst.status === 'fulfilled' ? functieUitkomst.value : null, onderdelen)
    return true
  }

  plaatEl.addEventListener('click', async e => {
    const knop = e.target.closest('#plaat-herlaad')
    if (!knop || knop.getAttribute('aria-disabled') === 'true') return
    knop.textContent = 'Bezig...'
    knop.setAttribute('aria-disabled', 'true')
    const gelukt = await laadEnTeken()
    if (!plaatEl.isConnected) return
    if (gelukt) document.getElementById('inhoud')?.focus({ preventScroll: true })
    else document.getElementById('plaat-herlaad')?.focus()
  })

  await laadEnTeken()
}

// ── App-shell: petrol balk, zijmenu, kruimelpad en footer (CK-044) ─────────────

// Lijnpictogrammen voor het zijmenu (48×48, lijndikte 3), uit de clubKOMPAS-mockup
const MENU_ICOON = {
  huis: '<path d="M7 22 L24 8 L41 22"/><path d="M11 19 V40 H37 V19"/><path d="M20 40 V29 H28 V40"/>',
  tegels: '<rect x="7" y="7" width="9" height="9" rx="1.5"/><rect x="19.5" y="7" width="9" height="9" rx="1.5"/><rect x="32" y="7" width="9" height="9" rx="1.5"/><rect x="7" y="19.5" width="9" height="9" rx="1.5"/><rect x="19.5" y="19.5" width="9" height="9" rx="1.5"/><rect x="32" y="19.5" width="9" height="9" rx="1.5"/><rect x="7" y="32" width="9" height="9" rx="1.5"/><rect x="19.5" y="32" width="9" height="9" rx="1.5"/><rect x="32" y="32" width="9" height="9" rx="1.5"/>',
  blokken: '<rect x="7" y="7" width="15" height="15" rx="2"/><rect x="26" y="7" width="15" height="15" rx="2"/><rect x="7" y="26" width="15" height="15" rx="2"/><rect x="26" y="26" width="15" height="15" rx="2"/>',
  plaat: '<rect x="6" y="8" width="10" height="32" rx="1.5"/><rect x="19" y="8" width="10" height="14" rx="1.5"/><rect x="19" y="26" width="10" height="14" rx="1.5"/><rect x="32" y="8" width="10" height="32" rx="1.5"/>',
  persoon: '<circle cx="24" cy="16" r="7"/><path d="M10 41 C10 31.5 16 27 24 27 C32 27 38 31.5 38 41"/>',
  groep: '<circle cx="24" cy="17" r="6"/><path d="M13 40 C13 31.5 18 27.5 24 27.5 C30 27.5 35 31.5 35 40"/><circle cx="11" cy="20" r="4.5"/><path d="M4 36 C4 30.5 7 27.5 11.5 27.5"/><circle cx="37" cy="20" r="4.5"/><path d="M44 36 C44 30.5 41 27.5 36.5 27.5"/>',
  vlag: '<path d="M12 42 V6"/><path d="M12 8 H37 L31.5 15.5 L37 23 H12"/>',
  account: '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="20" r="6"/><path d="M13 36.5 C15.5 31 19.5 29 24 29 C28.5 29 32.5 31 35 36.5"/>',
  uitloggen: '<path d="M20 8 H10 a2 2 0 0 0 -2 2 V38 a2 2 0 0 0 2 2 H20"/><path d="M19 24 H40"/><path d="M32 16 L40 24 L32 32"/>',
  inklappen: '<path d="M24 12 L12 24 L24 36"/><path d="M36 12 L24 24 L36 36"/>',
  menu: '<path d="M8 13 H40"/><path d="M8 24 H40"/><path d="M8 35 H40"/>',
  sluiten: '<path d="M12 12 L36 36"/><path d="M36 12 L12 36"/>',
  puzzel: '<path d="M9 15 H19 A4 4 0 1 1 27 15 H37 V25 A4 4 0 1 1 37 33 V39 H9 Z"/>',
  // Volgorde-knoppen (CK-046): pijl in dezelfde lijnstijl als potlood en prullenbak
  'pijl-omhoog': '<path d="M24 38 V10"/><path d="M13 21 L24 10 L35 21"/>',
  'pijl-omlaag': '<path d="M24 10 V38"/><path d="M13 27 L24 38 L35 27"/>',
  potlood: '<path d="M31 9 L39 17 L18 38 L9 39 L10 30 Z"/><path d="M27 13 L35 21"/>',
  klembord: '<rect x="10" y="10" width="28" height="32" rx="3"/><rect x="18" y="6" width="12" height="8" rx="2"/><path d="M17 22 H31"/><path d="M17 29 H31"/><path d="M17 36 H25"/>',
  schakels: '<g transform="rotate(-45 24 24)"><rect x="4" y="18" width="24" height="12" rx="6"/><rect x="20" y="18" width="24" height="12" rx="6"/></g>',
  prullenbak: '<path d="M8 13 H40"/><path d="M19 13 V8 H29 V13"/><path d="M12 13 L14.5 40 H33.5 L36 13"/><path d="M20 20 V33"/><path d="M28 20 V33"/>',
}
function menuIcoon(naam) {
  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MENU_ICOON[naam] || ''}</svg>`
}

// Zijmenu als data; nieuwe pagina's krijgen hier één regel plus een doel in NAV_DOEL
const ZIJMENU = [
  { id: 'overzicht', kop: 'Overzicht', items: [
    { id: 'home', naam: 'Home', ico: 'huis' },
    { id: 'domeinenoverzicht', naam: 'Domeinenoverzicht', ico: 'blokken' },
    { id: 'vermogens', naam: 'Vermogensoverzicht', ico: 'tegels' },
  ]},
  { id: 'beheer', kop: 'Beheer', zichtbaar: () => isBeheerder(), items: [
    { id: 'club', naam: 'Club', ico: 'vlag' },
    { id: 'functies', naam: 'Bestuursfuncties', ico: 'persoon' },
    { id: 'commissies', naam: 'Commissies', ico: 'groep' },
    { id: 'domeinen', naam: 'Domeinen', ico: 'plaat' },
    { id: 'vermogensbeheer', naam: 'Vermogens', ico: 'puzzel' },
    { id: 'projecten', naam: 'Projecten', ico: 'klembord' },
    { id: 'samenwerkingen', naam: 'Samenwerkingen', ico: 'schakels' },
  ]},
]
const zichtbaar = x => x.zichtbaar ? x.zichtbaar() : true
// Beheerpagina's (P0d): alleen voor de rol beheerder. Dit is gemak, geen beveiliging; de Firestore-regels
// weigeren elke schrijfactie op masterdata van iemand die geen beheerder is.
const BEHEER_PAGINAS = new Set(['beheer', ...ZIJMENU.find(g => g.id === 'beheer').items.map(i => i.id)])
const magNaar = id => !BEHEER_PAGINAS.has(id) || isBeheerder()
const PAGINA_NAAM = { beheer: 'Domeinen', account: 'Mijn account' }
const navNaam = id => ZIJMENU.flatMap(g => g.items).find(i => i.id === id)?.naam || PAGINA_NAAM[id] || id

const NAV_DOEL = new Map([
  ['home', renderHome],
  ['domeinenoverzicht', renderDomeinenoverzicht],
  ['vermogens', renderPlaat],
  ['beheer', renderPijlersDomeinenBeheer],
  ['domeinen', renderPijlersDomeinenBeheer],
  ['vermogensbeheer', renderVermogensBeheer],
  ['commissies', g => renderOnderdeelBeheer(g, 'commissies')],
  ['projecten', g => renderOnderdeelBeheer(g, 'projecten')],
  ['samenwerkingen', g => renderOnderdeelBeheer(g, 'samenwerkingen')],
  ['functies', renderBestuursfunctiesBeheer],
  ['club', renderClubBeheer],
  ['account', renderMijnAccount],
])

// Paginawissel door de gebruiker: titel bijwerken en focus naar de nieuwe inhoud (niet bij de eerste render).
// opties gaan naar de render-functie, bijv. { filter: domeinId } voor Beheer → Vermogens.
async function navigeer(id, gebruiker, opties = {}) {
  if (!magNaar(id)) return navigeer('home', gebruiker)
  const doel = NAV_DOEL.get(id)
  if (!doel) return
  sluitPaneel({ focus: false })
  await doel(gebruiker, opties)
  document.title = paginaTitel(navNaam(id))
  document.querySelector('.app-kolom')?.scrollTo(0, 0)
  document.getElementById('inhoud')?.focus({ preventScroll: true })
}

function zijmenuIngeklapt() {
  try { return localStorage.getItem('zijmenu-ingeklapt') === '1' } catch { return false }
}

function huidig(id, actief) {
  return id === actief ? ' aria-current="page"' : ''
}

function zijmenuHTML(actief) {
  const klein = zijmenuIngeklapt()
  const groepen = ZIJMENU.filter(zichtbaar).map(groep => {
    const items = groep.items.filter(zichtbaar)
    if (!items.length) return ''
    const lijst = items.map(item => `
            <li><a href="#" class="zijmenu-item" data-nav="${esc(item.id)}"${huidig(item.id, actief)}>${menuIcoon(item.ico)}<span class="naam">${esc(item.naam)}</span></a></li>`).join('')
    return `
        <div class="zijmenu-groep" data-groep="${esc(groep.id)}">
          <span class="zijmenu-kop" id="zm-kop-${esc(groep.id)}">${esc(groep.kop)}</span>
          <ul role="list" aria-labelledby="zm-kop-${esc(groep.id)}">${lijst}
          </ul>
        </div>`
  }).join('')
  return `
    <nav class="zijmenu${klein ? ' ingeklapt' : ''}" id="zijmenu" aria-label="Hoofdmenu">
      <div class="zijmenu-binnen">
        <div class="zijmenu-paneelkop">
          <button class="zijmenu-sluit" type="button" aria-label="Menu sluiten">${menuIcoon('sluiten')}</button>
        </div>
${groepen}
        <div class="zijmenu-onder">
          <a href="#" class="zijmenu-item zijmenu-account" data-nav="account"${huidig('account', actief)}>
            ${menuIcoon('account')}
            <span class="naam"><span class="naam-voor">Mijn account<span class="sr-only">, </span></span><span class="naam-sessie">${esc(sessieLabel())}</span></span>
          </a>
          <button class="zijmenu-item zijmenu-uitlog" type="button">${menuIcoon('uitloggen')}<span class="naam">Uitloggen</span></button>
          <button class="zijmenu-item zijmenu-knop" type="button">${menuIcoon('inklappen')}<span class="naam">${klein ? 'Menu uitklappen' : 'Menu inklappen'}</span></button>
        </div>
      </div>
    </nav>`
}

function topBarHTML(logoSrc) {
  const titel = huidigProfiel?.naam
    ? `club<b>KOMPAS</b> · ${esc(huidigProfiel.naam)}`
    : `club<b>KOMPAS</b>`
  return `
    <header class="top-bar">
      <button class="menu-knop" type="button" aria-controls="zijmenu" aria-expanded="false" aria-label="Menu openen">${menuIcoon('menu')}</button>
      ${kompasIconSVG()}
      <span class="app-title">${titel}</span>
      ${logoSrc ? `<img src="${esc(logoSrc)}" class="club-logo" alt="">` : ''}
    </header>`
}

// Kruimelpad: [['Home','home'], ['Beheer','beheer'], ['Domeinen']] — laatste deel is de huidige pagina
function kruimelpadHTML(delen) {
  const sep = '<span class="kruimel-sep" aria-hidden="true">›</span>'
  const html = delen.map(([naam, doel], i) => i === delen.length - 1
    ? `<span class="kruimel-huidig" aria-current="page">${esc(naam)}</span>`
    : `<a href="#" class="kruimel" data-nav="${esc(doel)}">${esc(naam)}</a>`).join(sep)
  return `<nav class="kruimelpad" aria-label="Kruimelpad">${html}</nav>`
}

// actief: 'home' | 'domeinenoverzicht' | 'vermogens' | 'domeinen' | 'vermogensbeheer' | 'functies' | 'club' | 'account'
function appShellHTML({ actief, kruimels, inhoud }) {
  const logoSrc = veiligLogo(huidigProfiel?.logo)
  return `
  <div class="app-shell${logoSrc ? ' heeft-logo' : ''}">
    <a class="overslaan" href="#inhoud">Direct naar inhoud</a>
    ${topBarHTML(logoSrc)}
    <div class="app-lijf">
      ${zijmenuHTML(actief)}
      <div class="zijmenu-achtergrond" hidden></div>
      <div class="app-kolom">
        ${kruimelpadHTML(kruimels)}
        <main id="inhoud" tabindex="-1">
          <div class="wrap">
${inhoud}
          </div>
        </main>
      </div>
    </div>
    ${omgevingsBalkHTML()}
    ${footerHTML()}
  </div>`
}

// Mobiel uitschuifpaneel; inert en scroll-lock staan deels buiten #app en worden bij elke render opgeruimd
const PANEEL_INERT = ['.overslaan', '.top-bar', '.app-kolom', 'footer', '.omgeving-balk']

function openPaneel() {
  const nav = document.getElementById('zijmenu')
  if (!nav) return
  nav.classList.add('open')
  document.querySelector('.zijmenu-achtergrond').hidden = false
  document.querySelector('.menu-knop').setAttribute('aria-expanded', 'true')
  PANEEL_INERT.forEach(s => document.querySelector(s)?.setAttribute('inert', ''))
  document.body.classList.add('paneel-open')
  nav.querySelector('.zijmenu-sluit').focus()
}

function sluitPaneel({ focus = true } = {}) {
  document.body.classList.remove('paneel-open')
  PANEEL_INERT.forEach(s => document.querySelector(s)?.removeAttribute('inert'))
  const nav = document.getElementById('zijmenu')
  if (!nav?.classList.contains('open')) return
  nav.classList.remove('open')
  document.querySelector('.zijmenu-achtergrond').hidden = true
  const knop = document.querySelector('.menu-knop')
  knop.setAttribute('aria-expanded', 'false')
  if (focus) knop.focus()
}

// Tooltip in het ingeklapte menu en bij pictogramknoppen: Esc verbergt hem tot de volgende hover of
// focus op een ander item of een andere knop (WCAG 1.4.13)
let tipItem = null
let tipKnop = null

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return
  if (document.querySelector('.zijmenu.open')) { sluitPaneel(); return }
  const nav = document.querySelector('.zijmenu.ingeklapt')
  if (nav) {
    tipItem = document.activeElement?.closest?.('.zijmenu-item') || nav.querySelector('.zijmenu-item:hover')
    nav.classList.add('tip-uit')
  }
  const inhoud = document.getElementById('inhoud')
  const knop = document.activeElement?.closest?.('.btn-icoon') || inhoud?.querySelector('.btn-icoon:hover')
  if (inhoud && knop) {
    tipKnop = knop
    inhoud.classList.add('tip-uit')
  }
})
window.matchMedia?.('(min-width: 701px)').addEventListener('change', e => {
  if (e.matches) sluitPaneel({ focus: false })
})

// Na elke render van de shell; .app-shell wordt per render vervangen, dus listeners stapelen niet op
function bindAppShell(gebruiker) {
  sluitPaneel({ focus: false })
  const shell = document.querySelector('.app-shell')
  const nav = shell.querySelector('.zijmenu')
  const tipWeerToe = e => {
    if (nav.classList.contains('tip-uit') && e.target.closest('.zijmenu-item') !== tipItem) nav.classList.remove('tip-uit')
  }
  nav.addEventListener('pointerover', tipWeerToe)
  nav.addEventListener('focusin', tipWeerToe)
  const inhoud = shell.querySelector('#inhoud')
  const knopTipWeerToe = e => {
    const knop = e.target.closest?.('.btn-icoon')
    if (knop && knop !== tipKnop && inhoud.classList.contains('tip-uit')) inhoud.classList.remove('tip-uit')
  }
  inhoud.addEventListener('pointerover', knopTipWeerToe)
  inhoud.addEventListener('focusin', knopTipWeerToe)
  shell.addEventListener('click', e => {
    const t = e.target
    if (t.closest('.overslaan')) { e.preventDefault(); document.getElementById('inhoud').focus(); return }
    if (t.closest('.menu-knop')) { openPaneel(); return }
    if (t.closest('.zijmenu-sluit') || t.closest('.zijmenu-achtergrond')) { sluitPaneel(); return }
    if (t.closest('.zijmenu-uitlog')) { sluitPaneel({ focus: false }); uitloggen(); return }
    const knop = t.closest('.zijmenu-knop')
    if (knop) {
      const klein = !nav.classList.contains('ingeklapt')
      try { localStorage.setItem('zijmenu-ingeklapt', klein ? '1' : '0') } catch {}
      nav.classList.toggle('ingeklapt', klein)
      knop.querySelector('.naam').textContent = klein ? 'Menu uitklappen' : 'Menu inklappen'
      return
    }
    const link = t.closest('[data-nav]')
    if (link && NAV_DOEL.has(link.dataset.nav)) {
      e.preventDefault()
      navigeer(link.dataset.nav, gebruiker, link.dataset.filter ? { filter: link.dataset.filter } : {})
    }
  })
}

// alsNog: bij "Opnieuw laden" niet tekenen als de gebruiker intussen naar een andere pagina ging
async function renderPijlersDomeinenBeheer(gebruiker, { filter = 'alles', alsNog = null } = {}) {
  if (geenBeheer(gebruiker)) return
  // Zonder bestuursfuncties kan de lijst niet goed getekend worden: dan een laadfout (CK-048)
  let functies = []
  let functiesFout = null
  try {
    functies = await laadBestuursfuncties()
  } catch (e) {
    functiesFout = e
  }
  if (alsNog && !alsNog.isConnected) return
  const functieNaam = new Map(functies.map(f => [f.id, f.naam]))
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'domeinen', kruimels: [['Home', 'home'], ['Beheer', 'beheer'], [navNaam('domeinen')]], inhoud: `
        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-2">
          <div class="sectie-kop">
            <h1 id="sectie-kop-2">Domeinen</h1>
          </div>
          <div class="sectie-lijf">
            <div class="beheer-balk">
              <div class="filter-keuze">
                <label class="sr-only" for="structuur-filter">Toon</label>
                <select class="form-input" id="structuur-filter">
                  <option value="alles">Alle soorten</option>
                  <option value="pijler">Pijlers</option>
                  <option value="domein">Ondersteunende domeinen</option>
                  <option value="overkoepelend">Overkoepelende domeinen</option>
                </select>
              </div>
              <button class="btn-toevoegen" type="button" id="structuur-toevoegen-knop">+ Domein toevoegen</button>
            </div>
            <div class="pijler-form" id="structuur-form" hidden>
              <div class="form-groep" role="radiogroup" aria-labelledby="structuur-soort-label">
                <span class="form-label" id="structuur-soort-label">Soort</span>
                <div class="form-rij soort-keuze">
                  ${soortKeuzeHTML('structuur-type', 'pijler')}
                </div>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-naam">Naam</label>
                <input class="form-input" id="structuur-naam" name="naam" type="text" placeholder="Naam" autocomplete="off" maxlength="200">
                <span class="form-fout" id="structuur-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-hashtag">#Hashtag</label>
                <input class="form-input" id="structuur-hashtag" type="text" placeholder="Optioneel, bijv. #HCASpeelt" autocomplete="off">
                <span class="form-fout" id="structuur-hashtag-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-omschr">Omschrijving</label>
                <textarea class="form-input" id="structuur-omschr" name="omschrijving" rows="3" maxlength="500" placeholder="Korte omschrijving"></textarea>
                <span class="form-fout" id="structuur-omschr-fout"></span>
              </div>
              <div class="form-groep" id="structuur-verantw-groep">
                <label class="form-label" for="structuur-verantw">Eindverantwoordelijke</label>
                ${bestuursfunctieKeuzeHTML('structuur-verantw', '', functies)}
                <span class="form-fout" id="structuur-verantw-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-icoon">Pictogram</label>
                ${pictogramKeuzeHTML('structuur-icoon', '')}
              </div>
              <div class="form-rij">
                <button class="btn opslaan" id="structuur-opslaan">Opslaan</button>
                <button class="btn" id="structuur-annuleer">Annuleren</button>
              </div>
              ${meldingenHTML(null, 'structuur-form-fout')}
            </div>
            ${meldingenHTML('structuur-ok', 'structuur-fout')}
            <div class="sr-only" id="structuur-volgorde" role="status"></div>
            <div class="sr-only" id="structuur-filter-status" role="status"></div>
            <p class="lijst-voetnoot" id="structuur-volgorde-hint" hidden>De volgorde wijzig je bij Alle soorten.</p>
            <div id="structuur-lijst"></div>
          </div>
        </div>
` })

  bindAppShell(gebruiker)
  bindMeldblokken()
  // Deze render werkt alleen op zijn eigen lijst, ook als de gebruiker intussen weg en terug ging (CK-057)
  const mijnLijst = document.getElementById('structuur-lijst')

  const clubId = huidigClubId
  // Filter kan meekomen vanaf een kerncijfer (Domeinenoverzicht, Vermogensoverzicht)
  let actiefFilter = ['alles', 'pijler', 'domein', 'overkoepelend'].includes(filter) ? filter : 'alles'
  let huidigeItems = []

  function toonLaadfout(e) {
    const lijst = mijnLijst
    if (!lijst?.isConnected) return
    console.error('Domeinen laden mislukt:', e?.code)
    document.querySelector('.beheer-balk').hidden = true
    document.getElementById('structuur-form').hidden = true
    const hint = document.getElementById('structuur-volgorde-hint')
    if (hint) hint.hidden = true
    lijst.removeAttribute('role')
    lijst.innerHTML = laadfoutHTML('De domeinen konden niet worden geladen.', 'structuur-herlaad', e, 'domeinen')
  }

  async function laadEnRender() {
    const lijst = mijnLijst
    if (!lijst) return false
    if (functiesFout) { toonLaadfout(functiesFout); return false }
    let items
    try {
      items = await laadStructuurelementen()
    } catch (e) {
      toonLaadfout(e)
      return false
    }
    if (!lijst.isConnected) return false
    document.querySelector('.beheer-balk').hidden = false
    huidigeItems = items
    const gefilterd = actiefFilter === 'alles' ? items : items.filter(i => i.type === actiefFilter)
    const hint = document.getElementById('structuur-volgorde-hint')
    if (hint) hint.hidden = actiefFilter === 'alles' || gefilterd.length === 0
    if (gefilterd.length === 0) {
      lijst.removeAttribute('role')
      lijst.innerHTML = `<p class="lijst-leeg">${items.length === 0 ? 'Nog geen domeinen.' : 'Geen domeinen van deze soort.'}</p>`
      return
    }
    const kanVerplaatsen = actiefFilter === 'alles'
    const kop = `
        <div class="beheer-rij beheer-kop domein-rij" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Icon</span>
          <span role="columnheader">Domein</span>
          <span role="columnheader">Soort</span>
          <span role="columnheader">Eindverantwoordelijke</span>
          <span role="columnheader">Vermogens</span>
          <span role="columnheader"><span class="sr-only">Acties</span></span>
        </div>`
    lijst.setAttribute('role', 'table')
    lijst.setAttribute('aria-label', 'Domeinen')
    lijst.innerHTML = kop + gefilterd.map((item, i) => {
      // Nummer = plaats in de hele lijst, ook met een filter; pijlknoppen alleen bij "Alle soorten" (Paul, 23-11-2026)
      const plaats = huidigeItems.indexOf(item) + 1
      const pijlen = kanVerplaatsen ? `
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omhoog" data-id="${esc(item.id)}" aria-label="Omhoog: ${esc(item.naam)}"${i === 0 ? ' disabled' : ''}>${menuIcoon('pijl-omhoog')}</button>
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omlaag" data-id="${esc(item.id)}" aria-label="Omlaag: ${esc(item.naam)}"${i === gefilterd.length - 1 ? ' disabled' : ''}>${menuIcoon('pijl-omlaag')}</button>` : ''
      const aantal = Number.isInteger(item.aantalVermogens) ? item.aantalVermogens : 0
      const link = KAN_VERMOGENS.has(item.type)
        ? `<a href="#" class="tussen-link cel-sub" data-nav="vermogensbeheer" data-filter="${esc(item.id)}" aria-label="${aantal ? `${vermogensTekst(aantal)} van ${esc(item.naam)}` : `Nog geen vermogens bij ${esc(item.naam)}`}">${aantal ? vermogensTekst(aantal) : 'Nog geen vermogens'}</a>`
        : ''
      return `
        <div class="structuur-rij beheer-rij domein-rij" role="row" data-id="${esc(item.id)}">
          <span class="cel-nr" role="cell">${plaats}</span>
          <span class="cel-picto" role="cell">${pictogramHTML(item, 'picto-klein')}</span>
          <span class="cel-naam" role="cell">${esc(item.naam)}</span>
          <span role="cell"><span class="pill"><span class="stip${SOORT_KLEUR[item.type] || ''}"></span>${SOORT_LABEL[item.type] || ''}</span></span>
          <span class="cel-functie" role="cell">${esc(functieNaam.get(item.bestuursfunctieId) || '—')}</span>
          <span class="cel-vermogens" role="cell">${link}</span>
          <div class="kaart-acties cel-acties" role="cell">${pijlen}
            ${actieKnopHTML('bewerk', item.id, 'bewerk', item.naam)}
            ${actieKnopHTML('verwijder', item.id, 'verwijder', item.naam)}
          </div>
        </div>`
    }).join('')
  }

  await laadEnRender()

  // Opnieuw laden: de hele pagina opnieuw, want ook de bestuursfuncties kunnen ontbroken hebben
  const lijstNu = mijnLijst
  if (!lijstNu?.isConnected) return   // intussen naar een andere pagina gegaan (CK-056)
  bindHerlaad(lijstNu, 'structuur-herlaad', async () => {
    await renderPijlersDomeinenBeheer(gebruiker, { filter: actiefFilter, alsNog: lijstNu })
    return !document.getElementById('structuur-herlaad')
  }, () => document.getElementById('structuur-filter'))

  const filterEl = document.getElementById('structuur-filter')
  filterEl.value = actiefFilter
  const filterStatus = document.getElementById('structuur-filter-status')
  const FILTER_TEKST = {
    alles: n => `${n} ${n === 1 ? 'domein' : 'domeinen'}.`,
    pijler: n => `${n} ${n === 1 ? 'pijler' : 'pijlers'}.`,
    domein: n => `${n} ${n === 1 ? 'ondersteunend domein' : 'ondersteunende domeinen'}.`,
    overkoepelend: n => `${n} ${n === 1 ? 'overkoepelend domein' : 'overkoepelende domeinen'}.`,
  }
  filterEl.addEventListener('change', async () => {
    actiefFilter = filterEl.value
    await laadEnRender().catch(e => console.error(e))
    const n = actiefFilter === 'alles' ? huidigeItems.length : huidigeItems.filter(i => i.type === actiefFilter).length
    zetStatus(filterStatus, FILTER_TEKST[actiefFilter](n) + (actiefFilter === 'alles' ? '' : ' Volgorde wijzigen kan bij Alle soorten.'))
  })

  document.getElementById('structuur-toevoegen-knop').addEventListener('click', () => {
    document.getElementById('structuur-form').hidden = false
    document.getElementById('structuur-toevoegen-knop').hidden = true
    document.getElementById('structuur-naam').focus()
  })

  function resetForm() {
    document.getElementById('structuur-form').hidden = true
    document.getElementById('structuur-toevoegen-knop').hidden = false
    document.getElementById('structuur-naam').value = ''
    document.getElementById('structuur-hashtag').value = ''
    document.getElementById('structuur-hashtag-fout').textContent = ''
    document.getElementById('structuur-omschr').value = ''
    document.getElementById('structuur-verantw').value = ''
    document.getElementById('structuur-icoon').value = ''
    const radios = document.querySelectorAll('[name="structuur-type"]')
    if (radios[0]) radios[0].checked = true
    ;['naam', 'hashtag', 'omschr', 'verantw'].forEach(v => wisVeldFout(`structuur-${v}`, `structuur-${v}-fout`))
  }

  const lijstEl = document.getElementById('structuur-lijst')
  enterSlaatOp(document.getElementById('structuur-form'), () => document.getElementById('structuur-opslaan'))
  enterSlaatOp(lijstEl, t => t.closest('.pijler-bewerk-form')?.querySelector('[data-actie="bewerk-opslaan"]'))
  const toevoegKnop = document.getElementById('structuur-toevoegen-knop')
  const terugval = () => zichtbareTerugval(toevoegKnop, document.getElementById('structuur-form'))
  const volgordeStatus = document.getElementById('structuur-volgorde')
  const sectieOk = document.getElementById('structuur-ok')
  const sectieFout = document.getElementById('structuur-fout')
  const opslaanKnop = document.getElementById('structuur-opslaan')
  const annuleerKnop = document.getElementById('structuur-annuleer')

  // Aantal vermogens vers lezen; lukt dat niet, dan 0 (de regels beschermen toch)
  const aantalVermogens = id => leesAantalVermogens(db, clubId, id).catch(() => 0)

  function wisSoortBlokkade(id) {
    const fout = document.getElementById(`bs-fout-${id}`)
    if (fout) fout.replaceChildren()
    document.getElementById(`bs-${id}`)?.closest('[role="radiogroup"]')?.removeAttribute('aria-invalid')
    document.querySelector(`[name="bewerk-type-${CSS.escape(id)}"][value="overkoepelend"]`)?.removeAttribute('aria-describedby')
  }

  function toonSoortBlokkade(id, domein, aantal) {
    const fout = document.getElementById(`bs-fout-${id}`)
    if (!fout) return
    const formFout = document.getElementById(`bm-fout-${id}`)
    if (formFout) formFout.textContent = ''
    toonVermogensBlokkade(fout, domein, `Een overkoepelend domein heeft geen vermogens, en ${domein.naam} heeft er nog ${aantal}. Verplaats of verwijder die eerst, of kies Pijler of Ondersteunend domein.`)
    document.getElementById(`bs-${id}`)?.closest('[role="radiogroup"]')?.setAttribute('aria-invalid', 'true')
    const rondje = document.querySelector(`[name="bewerk-type-${CSS.escape(id)}"][value="overkoepelend"]`)
    rondje?.setAttribute('aria-describedby', `bs-fout-${id}`)
    rondje?.focus()
  }

  function toonVerwijderBlokkade(knop, domein, aantal) {
    toonVermogensBlokkade(sectieFout, domein, `${domein.naam} heeft nog ${vermogensTekst(aantal)}. Een domein met vermogens kan niet weg. Verplaats of verwijder die vermogens eerst.`)
    // De link in de melding is de volgende stap; de focus gaat erheen (bijstelling op besluit 15, toegankelijkheid)
    ;(sectieFout.querySelector('a') || knop).focus()
    meldingInBeeld(sectieFout)
  }

  annuleerKnop.addEventListener('click', () => {
    if (annuleerKnop.getAttribute('aria-disabled') === 'true') return
    resetForm()
  })

  opslaanKnop.addEventListener('click', async () => {
    if (opslaanKnop.getAttribute('aria-disabled') === 'true') return
    const type = document.querySelector('[name="structuur-type"]:checked').value
    const naamEl = document.getElementById('structuur-naam')
    const omschrEl = document.getElementById('structuur-omschr')
    const verAntwEl = document.getElementById('structuur-verantw')
    const hashtag = document.getElementById('structuur-hashtag').value.trim()
    if (!valideerVelden([
      ['structuur-naam', 'structuur-naam-fout', naamFout(naamEl.value.trim(), 200)],
      ['structuur-hashtag', 'structuur-hashtag-fout', hashtagFout(hashtag)],
      ['structuur-omschr', 'structuur-omschr-fout', omschrijvingVerplichtFout(omschrEl.value.trim())],
      ['structuur-verantw', 'structuur-verantw-fout', verAntwEl.value.trim() ? '' : KIES_FUNCTIE],
    ])) return

    const item = {
      type, naam: naamEl.value.trim(), hashtag, omschrijving: omschrEl.value.trim(), bestuursfunctieId: verAntwEl.value,
      icoon: document.getElementById('structuur-icoon').value,
    }
    const uitkomst = await metOpslaan(opslaanKnop, async () => {
      const bestaand = await laadStructuurelementen()
      const hoogste = bestaand.reduce((m, x) => (typeof x.volgorde === 'number' ? Math.max(m, x.volgorde) : m), 0)
      await voegStructuurelementToe({ ...item, volgorde: hoogste + 1 })
    }, { soort: 'formulier-lijst', fout: document.getElementById('structuur-form-fout') })
    if (uitkomst !== 'ok' || !opslaanKnop.isConnected) return
    resetForm()
    await laadEnRender().catch(e => console.error(e))
    terugval()?.focus()
    toonOk(sectieOk, `Domein ${item.naam} toegevoegd.`)
  })

  lijstEl.addEventListener('change', e => {
    const naam = e.target?.name || ''
    if (naam.startsWith('bewerk-type-')) wisSoortBlokkade(naam.slice('bewerk-type-'.length))
  })

  lijstEl.addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    if (lijstEl.getAttribute('aria-busy') === 'true' || knop.getAttribute('aria-disabled') === 'true') return
    const actie = knop.dataset.actie
    const id = knop.dataset.id
    const rij = knop.closest('.structuur-rij')

    if (actie === 'omhoog' || actie === 'omlaag') {
      let plaats = ''
      volgordeStatus.textContent = ''
      const uitkomst = await metOpslaan(knop, async () => {
        const items = await laadStructuurelementen()
        const i = items.findIndex(x => x.id === id)
        const j = actie === 'omhoog' ? i - 1 : i + 1
        if (i < 0 || j < 0 || j >= items.length) return
        ;[items[i], items[j]] = [items[j], items[i]]
        await schrijfVolgorde('structuurelementen', items)
        plaats = `Domein ${items[j].naam} staat nu op plaats ${j + 1} van ${items.length}.`
      }, { soort: 'lijstactie', lijst: lijstEl, bezig: null, fout: sectieFout })
      await laadEnRender().catch(e => console.error(e))
      focusInLijst(lijstEl, actie, id, terugval())
      if (uitkomst === 'ok' && plaats && volgordeStatus.isConnected) volgordeStatus.textContent = plaats
      else meldingInBeeld(sectieFout)
    } else if (actie === 'verwijder') {
      const domein = huidigeItems.find(x => x.id === id) || { id, naam: rij?.querySelector('.cel-naam')?.textContent || '' }
      wisMeldingen(knop.closest('[data-meldblok]'))
      // Domein met vermogens: geen bevestigingsvraag, meteen de melding (besluit 15)
      const vooraf = await aantalVermogens(id)
      if (!knop.isConnected) return
      if (vooraf > 0) { toonVerwijderBlokkade(knop, domein, vooraf); return }
      if (!bevestigVerwijderen('Domein', domein.naam)) return
      let blokkade = 0
      const uitkomst = await metOpslaan(knop, async () => {
        try {
          await verwijderStructuurelement(id)
        } catch (fout) {
          if (fout?.code === 'permission-denied') blokkade = await aantalVermogens(id)
          throw fout
        }
      }, { soort: 'lijstactie', lijst: lijstEl, fout: sectieFout, bezig: null })
      await laadEnRender().catch(e => console.error(e))
      if (uitkomst === 'ok') {
        terugval()?.focus()
        toonOk(sectieOk, `Domein ${domein.naam} verwijderd.`)
      } else if (uitkomst === 'weg') {
        terugval()?.focus()
      } else {
        const nieuweKnop = lijstEl.querySelector(`[data-actie="verwijder"][data-id="${CSS.escape(id)}"]`)
        if (blokkade > 0 && nieuweKnop) toonVerwijderBlokkade(nieuweKnop, domein, blokkade)
        else { focusInLijst(lijstEl, 'verwijder', id, terugval()); meldingInBeeld(sectieFout) }
      }
    } else if (actie === 'bewerk') {
      const items = await laadStructuurelementen()
      const item = items.find(x => x.id === id)
      if (!item) return
      rij.classList.add('bewerken')
      rij.innerHTML = `
        <div class="pijler-bewerk-form" role="cell">
          <div class="form-groep" role="radiogroup" aria-labelledby="bs-${esc(id)}">
            <span class="form-label" id="bs-${esc(id)}">Soort</span>
            <div class="form-rij soort-keuze">
              ${soortKeuzeHTML(`bewerk-type-${id}`, item.type)}
            </div>
            <div class="form-fout" id="bs-fout-${esc(id)}"></div>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bn-${esc(id)}">Naam</label>
            <input class="form-input" id="bn-${esc(id)}" type="text" value="${esc(item.naam)}" autocomplete="off" maxlength="200">
            <span class="form-fout" id="bn-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bh-${esc(id)}">#Hashtag</label>
            <input class="form-input" id="bh-${esc(id)}" type="text" value="${esc(item.hashtag || '')}" placeholder="Optioneel, bijv. #HCASpeelt" autocomplete="off">
            <span class="form-fout" id="bh-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bo-${esc(id)}">Omschrijving</label>
            <textarea class="form-input" id="bo-${esc(id)}" rows="3" maxlength="500">${esc(item.omschrijving || '')}</textarea>
            <span class="form-fout" id="bo-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep" id="bv-groep-${esc(id)}">
            <label class="form-label" for="bv-${esc(id)}">Eindverantwoordelijke</label>
            ${bestuursfunctieKeuzeHTML(`bv-${id}`, item.bestuursfunctieId || '', functies)}
            <span class="form-fout" id="bv-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bi-${esc(id)}">Pictogram</label>
            ${pictogramKeuzeHTML(`bi-${id}`, item.icoon || '')}
          </div>
          <div class="form-rij">
            <button class="btn opslaan" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
          ${meldingenHTML(null, `bm-fout-${id}`)}
        </div>`
      rij.dataset.type = item.type
      rij.dataset.naam = item.naam
      document.getElementById(`bn-${id}`)?.focus()
    } else if (actie === 'bewerk-opslaan') {
      const type = rij.querySelector(`[name="bewerk-type-${CSS.escape(id)}"]:checked`)?.value
      const naam = document.getElementById(`bn-${id}`)?.value.trim()
      const omschr = document.getElementById(`bo-${id}`)?.value.trim()
      const verantw = document.getElementById(`bv-${id}`)?.value.trim()
      const hashtag = document.getElementById(`bh-${id}`)?.value.trim() || ''
      wisSoortBlokkade(id)
      if (!valideerVelden([
        [`bn-${id}`, `bn-fout-${id}`, naamFout(naam, 200)],
        [`bh-${id}`, `bh-fout-${id}`, hashtagFout(hashtag)],
        [`bo-${id}`, `bo-fout-${id}`, omschrijvingVerplichtFout(omschr || '')],
        [`bv-${id}`, `bv-fout-${id}`, verantw ? '' : KIES_FUNCTIE],
      ])) return
      const domein = { id, naam: rij.dataset.naam || naam }
      // Naar overkoepelend kan alleen zonder vermogens: eerst vers tellen, dan pas opslaan
      const naarOverkoepelend = type === 'overkoepelend' && rij.dataset.type !== 'overkoepelend'
      if (naarOverkoepelend) {
        wisMeldingen(knop.closest('[data-meldblok]'))
        const vooraf = await aantalVermogens(id)
        if (!knop.isConnected) return
        if (vooraf > 0) { toonSoortBlokkade(id, domein, vooraf); return }
      }
      const icoon = document.getElementById(`bi-${id}`)?.value || ''
      const data = { type, naam, hashtag, omschrijving: omschr, bestuursfunctieId: verantw, icoon }
      // bevat hoort alleen bij een overkoepelend domein; bij een andere soort weghalen (CK-057)
      if (type !== 'overkoepelend') data.bevat = deleteField()
      let blokkade = 0
      const uitkomst = await metOpslaan(knop, async () => {
        try {
          await bewerkStructuurelement(id, data)
        } catch (fout) {
          if (naarOverkoepelend && fout?.code === 'permission-denied') blokkade = await aantalVermogens(id)
          throw fout
        }
      }, {
        soort: 'formulier-lijst', fout: document.getElementById(`bm-fout-${id}`), weg: sectieFout,
      })
      if (uitkomst === 'fout') {
        if (blokkade > 0) toonSoortBlokkade(id, domein, blokkade)
        return
      }
      await laadEnRender().catch(e => console.error(e))
      if (uitkomst === 'weg') { terugval()?.focus(); return }
      focusInLijst(lijstEl, 'bewerk', id, terugval())
      toonOk(sectieOk, `Domein ${naam} opgeslagen.`)
      meldingInBeeld(sectieOk)
    } else if (actie === 'bewerk-annuleer') {
      await laadEnRender()
      focusInLijst(lijstEl, 'bewerk', id, terugval())
    }
  })
}

// ── Beheer → Vermogens (CK-020) ───────────────────────────────────────────────

const NAAM_VELD_ATTR = 'autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false"'

// Veldtekst bij een fout uit de vermogenstransacties; '' = de algemene CK-023-tekst
function vermogenFoutTekst(e, domeinNaam = '') {
  const bij = e?.domeinNaam ? ` bij ${e.domeinNaam}` : ''
  switch (e?.code) {
    case 'dubbel-vermogen':
      return e.zelfdeDomein
        ? `Dit vermogen staat al${bij}. Misschien is een eerdere poging toch gelukt: kijk in de lijst.`
        : `Dit vermogen bestaat al${bij}. Kies een andere naam, of verplaats het bestaande vermogen via Bewerken.`
    case 'naam-bezet':
      return `Deze naam is al in gebruik, maar het vermogen is niet te vinden. Kies voorlopig een andere naam en meld het aan SVN10${SUPPORT_EMAIL ? `: ${SUPPORT_EMAIL}` : ''}.`
    case 'domein-weg':
      return `Het domein ${domeinNaam} bestaat niet meer. Kies een ander domein.`
    case 'domein-overkoepelend':
      return `${e.domeinNaam || domeinNaam} is nu een overkoepelend domein en kan geen vermogens hebben. Kies een ander domein.`
    default:
      return ''
  }
}

const NAAM_CODES = new Set(['dubbel-vermogen', 'naam-bezet'])
const DOMEIN_CODES = new Set(['domein-weg', 'domein-overkoepelend'])
const VERVERS_CODES = new Set([...NAAM_CODES, ...DOMEIN_CODES, 'aborted'])

function vermogenVeldFouten(naamId, domeinId) {
  const naam = [`${naamId}-fout`, naamId]
  const domein = [`${domeinId}-fout`, domeinId]
  return { 'dubbel-vermogen': naam, 'naam-bezet': naam, 'domein-weg': domein, 'domein-overkoepelend': domein }
}

async function renderVermogensBeheer(gebruiker, { filter = 'alle' } = {}) {
  if (geenBeheer(gebruiker)) return
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'vermogensbeheer', kruimels: [['Home', 'home'], ['Beheer', 'beheer'], [navNaam('vermogensbeheer')]], inhoud: `
        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-3">
          <div class="sectie-kop">
            <h1 id="sectie-kop-3">Vermogens</h1>
          </div>
          <div class="sectie-lijf">
            <div class="beheer-balk" id="vermogen-balk" hidden>
              <div class="filter-keuze">
                <label class="sr-only" for="vermogen-filter">Toon</label>
                <select class="form-input" id="vermogen-filter"></select>
              </div>
              <button class="btn-toevoegen" type="button" id="vermogen-toevoegen-knop">+ Vermogen toevoegen</button>
            </div>
            <div class="pijler-form vermogen-form" id="vermogen-form" hidden>
              <div class="form-groep">
                <label class="form-label" for="vermogen-naam">Naam</label>
                <input class="form-input" id="vermogen-naam" type="text" placeholder="Bijv. Ledenwerving" ${NAAM_VELD_ATTR} aria-describedby="vermogen-naam-fout">
                <span class="form-fout" id="vermogen-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="vermogen-domein">Domein</label>
                <select class="form-input" id="vermogen-domein" aria-describedby="vermogen-domein-fout"></select>
                <span class="form-fout" id="vermogen-domein-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn opslaan" type="button" id="vermogen-opslaan">Opslaan</button>
                <button class="btn" type="button" id="vermogen-annuleer">Annuleren</button>
              </div>
              ${meldingenHTML(null, 'vermogen-form-fout')}
            </div>
            ${meldingenHTML('vermogen-ok', 'vermogen-fout')}
            <div class="sr-only" id="vermogen-volgorde" role="status"></div>
            <div class="sr-only" id="vermogen-filter-status" role="status"></div>
            <div id="vermogen-lijst"><p class="lijst-laden">Vermogens worden geladen...</p></div>
          </div>
        </div>
` })

  bindAppShell(gebruiker)
  bindMeldblokken()

  const clubId = huidigClubId
  const el = id => document.getElementById(id)
  const balk = el('vermogen-balk')
  const filterEl = el('vermogen-filter')
  const form = el('vermogen-form')
  const naamEl = el('vermogen-naam')
  const domeinEl = el('vermogen-domein')
  const opslaanKnop = el('vermogen-opslaan')
  const annuleerKnop = el('vermogen-annuleer')
  const lijstEl = el('vermogen-lijst')
  const sectieOk = el('vermogen-ok')
  const sectieFout = el('vermogen-fout')
  const volgordeStatus = el('vermogen-volgorde')
  const filterStatus = el('vermogen-filter-status')
  const toevoegKnop = el('vermogen-toevoegen-knop')

  let domeinen = []
  let vermogens = []
  let actiefFilter = filter

  const geldigeDomeinen = () => domeinen.filter(d => KAN_VERMOGENS.has(d.type))
  const geldigDomein = id => geldigeDomeinen().find(d => d.id === id) || null
  const vanDomein = id => sorteerDomeinen(vermogens.filter(v => v.domeinId === id))
  const zonderDomein = () => sorteerDomeinen(vermogens.filter(v => !geldigDomein(v.domeinId)))
  const groepVan = v => (geldigDomein(v.domeinId) ? vanDomein(v.domeinId) : zonderDomein())
  const terugval = () => zichtbareTerugval(toevoegKnop, form)
  const potlood = id => lijstEl.querySelector(`[data-actie="bewerk"][data-id="${CSS.escape(id)}"]`)

  function vulFormDomeinen(gekozen) {
    domeinEl.innerHTML = domeinOptiesHTML(geldigeDomeinen(), geldigDomein(gekozen) ? gekozen : '')
  }

  function rijHTML(v, k, n, { metVolgorde = true } = {}) {
    const verborgen = metVolgorde ? '' : ' onzichtbaar" tabindex="-1" aria-hidden="true'
    return `
        <div class="structuur-rij beheer-rij vermogen-rij" role="row" data-id="${esc(v.id)}">
          <span class="cel-nr" role="cell">${k + 1}</span>
          <span class="cel-naam" role="cell">${esc(v.naam)}</span>
          <div class="kaart-acties cel-acties" role="cell">
            <button class="btn-kaart-actie btn-volgorde${verborgen}" type="button" data-actie="omhoog" data-id="${esc(v.id)}" aria-label="Omhoog: ${esc(v.naam)}"${!metVolgorde || k === 0 ? ' disabled' : ''}>${menuIcoon('pijl-omhoog')}</button>
            <button class="btn-kaart-actie btn-volgorde${verborgen}" type="button" data-actie="omlaag" data-id="${esc(v.id)}" aria-label="Omlaag: ${esc(v.naam)}"${!metVolgorde || k === n - 1 ? ' disabled' : ''}>${menuIcoon('pijl-omlaag')}</button>
            ${actieKnopHTML('bewerk', v.id, 'bewerk', v.naam)}
            ${actieKnopHTML('verwijder', v.id, 'verwijder', v.naam)}
          </div>
        </div>`
  }

  function tabelHTML(lijst, label, opties) {
    return `
          <div role="table" aria-label="${esc(label)}">
            <div class="beheer-rij beheer-kop vermogen-rij" role="row"><span role="columnheader">#</span><span role="columnheader">Vermogen</span><span role="columnheader"><span class="sr-only">Acties</span></span></div>
            ${lijst.map((v, k) => rijHTML(v, k, lijst.length, opties)).join('')}
          </div>`
  }

  function groepHTML(d) {
    const lijst = vanDomein(d.id)
    return `
        <section class="vermogen-groep" aria-labelledby="vg-kop-${esc(d.id)}">
          <h3 class="groep-kop" id="vg-kop-${esc(d.id)}">
            <span class="groep-picto">${pictogramHTML(d, 'picto-klein')}</span>
            <span class="groep-naam">${esc(d.naam)}</span>
          </h3>
          ${lijst.length ? tabelHTML(lijst, `Vermogens bij ${d.naam}`) : '<p class="groep-leeg">Nog geen vermogens.</p>'}
        </section>`
  }

  function zonderDomeinHTML(lijst) {
    return `
        <section class="vermogen-groep" aria-labelledby="vg-kop-zonder">
          <h3 class="groep-kop" id="vg-kop-zonder">
            <span class="groep-naam">Zonder geldig domein</span>
          </h3>
          <p class="groep-uitleg">Deze vermogens horen bij een domein dat niet meer bestaat of overkoepelend is. Kies via Bewerken een ander domein, of verwijder ze.</p>
          ${tabelHTML(lijst, 'Vermogens zonder geldig domein', { metVolgorde: false })}
        </section>`
  }

  function voetnootHTML() {
    const namen = domeinen.filter(d => d.type === 'overkoepelend').map(d => d.naam)
    if (!namen.length) return ''
    const lijst = namen.length === 1 ? namen[0] : `${namen.slice(0, -1).join(', ')} en ${namen[namen.length - 1]}`
    const zin = namen.length === 1
      ? `${lijst} is een overkoepelend domein. Dat heeft geen vermogens.`
      : `${lijst} zijn overkoepelende domeinen. Die hebben geen vermogens.`
    return `<p class="lijst-voetnoot">${esc(zin)}</p>`
  }

  // Tekent de lijst uit de geladen gegevens; de toevoegknop staat in de balk of in de lege staat
  function tekenLijst() {
    if (!lijstEl.isConnected) return
    const geldig = geldigeDomeinen()
    if (actiefFilter !== 'alle' && !geldigDomein(actiefFilter)) actiefFilter = 'alle'
    const wezen = zonderDomein()
    if (!geldig.length) {
      balk.hidden = true
      balk.append(toevoegKnop)
      lijstEl.innerHTML = `<p class="sectie-uitleg">Er zijn nog geen pijlers of ondersteunende domeinen. Een vermogen hoort altijd bij zo'n domein. <a href="#" class="tussen-link" data-nav="domeinen">Ga naar Domeinen</a> om er een toe te voegen.</p>${wezen.length ? zonderDomeinHTML(wezen) : ''}`
      return
    }
    if (!vermogens.length) {
      balk.hidden = true
      lijstEl.innerHTML = `
        <div class="leeg-blok">
          <h3>Nog geen vermogens</h3>
          <p>Een vermogen is iets wat de club moet kunnen om een domein te laten werken, bijvoorbeeld <em>Ledenwerving</em> bij Leden of <em>Kascontrole</em> bij Financiën. Voeg het eerste vermogen toe.</p>
        </div>`
      lijstEl.querySelector('.leeg-blok').append(toevoegKnop)
      return
    }
    filterEl.innerHTML = domeinOptiesHTML(geldig, actiefFilter, { alle: true })
    balk.hidden = false
    balk.append(toevoegKnop)
    if (actiefFilter === 'alle') {
      lijstEl.innerHTML = geldig.map(groepHTML).join('') + (wezen.length ? zonderDomeinHTML(wezen) : '') + voetnootHTML()
    } else {
      lijstEl.innerHTML = groepHTML(geldigDomein(actiefFilter))
    }
  }

  function toonLaadfout(e) {
    if (!lijstEl.isConnected) return
    balk.hidden = true
    balk.append(toevoegKnop)
    form.hidden = true
    lijstEl.innerHTML = laadfoutHTML('De vermogens konden niet worden geladen.', 'vermogen-herlaad', e, 'vermogens')
  }

  async function laadEnRender() {
    try {
      const [d, v] = await Promise.all([laadStructuurelementen(), laadVermogens(db, clubId)])
      domeinen = d
      vermogens = v
    } catch (e) {
      console.error('Vermogens laden mislukt:', e?.code)
      toonLaadfout(e)
      return false
    }
    tekenLijst()
    return true
  }

  function sluitForm() {
    form.hidden = true
    toevoegKnop.hidden = false
    naamEl.value = ''
    wisVeldFout('vermogen-naam', 'vermogen-naam-fout')
    wisVeldFout('vermogen-domein', 'vermogen-domein-fout')
    el('vermogen-form-fout').textContent = ''
  }

  function meldFilter() {
    if (actiefFilter === 'alle') {
      const n = vermogens.filter(v => geldigDomein(v.domeinId)).length
      const m = geldigeDomeinen().length
      zetStatus(filterStatus, `${vermogensTekst(n)} bij ${m} ${m === 1 ? 'domein' : 'domeinen'}.`)
    } else {
      const d = geldigDomein(actiefFilter)
      const n = vanDomein(actiefFilter).length
      zetStatus(filterStatus, n ? `${vermogensTekst(n)} bij ${d.naam}.` : `Nog geen vermogens bij ${d.naam}.`)
    }
  }

  // Bewerkformulier in de rij; waarden = { naam, domeinId } (bijv. de invoer na een fout)
  function openBewerk(id, waarden) {
    const rij = lijstEl.querySelector(`.vermogen-rij[data-id="${CSS.escape(id)}"]`)
    const v = vermogens.find(x => x.id === id)
    if (!rij || !v) return null
    const naam = waarden?.naam ?? v.naam
    const domeinId = waarden?.domeinId ?? v.domeinId
    rij.classList.add('bewerken')
    rij.innerHTML = `
        <div class="pijler-bewerk-form vermogen-bewerk" role="cell">
          <div class="form-groep">
            <label class="form-label" for="vn-${esc(id)}">Naam</label>
            <input class="form-input" id="vn-${esc(id)}" type="text" value="${esc(naam)}" ${NAAM_VELD_ATTR} aria-describedby="vn-${esc(id)}-fout">
            <span class="form-fout" id="vn-${esc(id)}-fout"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="vd-${esc(id)}">Domein</label>
            <select class="form-input" id="vd-${esc(id)}" aria-describedby="vd-${esc(id)}-fout">${domeinOptiesHTML(geldigeDomeinen(), geldigDomein(domeinId) ? domeinId : '')}</select>
            <span class="form-fout" id="vd-${esc(id)}-fout"></span>
          </div>
          <div class="form-rij">
            <button class="btn opslaan" type="button" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" type="button" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
          ${meldingenHTML(null, `vm-fout-${id}`)}
        </div>`
    return rij
  }

  // ── Toevoegen ──
  toevoegKnop.addEventListener('click', () => {
    form.hidden = false
    toevoegKnop.hidden = true
    vulFormDomeinen(actiefFilter === 'alle' ? '' : actiefFilter)
    naamEl.focus()
  })
  naamEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); opslaanKnop.click() } })
  annuleerKnop.addEventListener('click', () => {
    if (annuleerKnop.getAttribute('aria-disabled') === 'true') return
    sluitForm()
    toevoegKnop.focus()
  })
  opslaanKnop.addEventListener('click', async () => {
    if (opslaanKnop.getAttribute('aria-disabled') === 'true') return
    const naam = normaliseerVermogensnaam(naamEl.value)
    const domeinId = domeinEl.value
    if (!valideerVelden([
      ['vermogen-naam', 'vermogen-naam-fout', vermogensnaamFout(naam)],
      ['vermogen-domein', 'vermogen-domein-fout', domeinId ? '' : 'Kies een domein.'],
    ])) return
    const domeinNaam = geldigDomein(domeinId)?.naam || ''
    let foutCode = null
    const uitkomst = await metOpslaan(opslaanKnop, async () => {
      try {
        await voegVermogenToe(db, clubId, { naam, domeinId })
      } catch (e) {
        foutCode = e?.code
        throw Object.assign(e, { tekst: vermogenFoutTekst(e, domeinNaam) })
      }
    }, { soort: 'formulier-lijst', fout: el('vermogen-form-fout'), veldFouten: vermogenVeldFouten('vermogen-naam', 'vermogen-domein') })
    if (!opslaanKnop.isConnected) return
    if (uitkomst !== 'ok') {
      if (VERVERS_CODES.has(foutCode)) {
        await laadEnRender()
        if (DOMEIN_CODES.has(foutCode)) vulFormDomeinen('')
      }
      return
    }
    sluitForm()
    if (actiefFilter !== 'alle' && actiefFilter !== domeinId) actiefFilter = domeinId
    await laadEnRender()
    toevoegKnop.focus()
    toonOk(sectieOk, `Vermogen ${naam} toegevoegd aan ${domeinNaam}.`)
  })

  // ── Filter ──
  filterEl.addEventListener('change', () => {
    actiefFilter = filterEl.value
    tekenLijst()
    meldFilter()
  })

  // ── Opnieuw laden na een laadfout ──
  lijstEl.addEventListener('click', async e => {
    const knop = e.target.closest('#vermogen-herlaad')
    if (!knop || knop.getAttribute('aria-disabled') === 'true') return
    knop.textContent = 'Bezig...'
    knop.setAttribute('aria-disabled', 'true')
    const gelukt = await laadEnRender()
    if (gelukt) (balk.hidden ? toevoegKnop : filterEl).focus()
    else el('vermogen-herlaad')?.focus()
  })

  // ── Rijacties ──
  lijstEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches?.('.vermogen-bewerk input')) {
      e.preventDefault()
      e.target.closest('.vermogen-bewerk').querySelector('[data-actie="bewerk-opslaan"]')?.click()
    }
  })

  lijstEl.addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    if (lijstEl.getAttribute('aria-busy') === 'true' || knop.getAttribute('aria-disabled') === 'true') return
    const { actie, id } = knop.dataset
    const v = vermogens.find(x => x.id === id)

    if (actie === 'omhoog' || actie === 'omlaag') {
      if (!v) return
      const domeinId = v.domeinId
      const domeinNaam = geldigDomein(domeinId)?.naam || ''
      let plaats = ''
      volgordeStatus.textContent = ''
      const uitkomst = await metOpslaan(knop, async () => {
        const vers = sorteerDomeinen((await laadVermogens(db, clubId)).filter(x => x.domeinId === domeinId))
        const i = vers.findIndex(x => x.id === id)
        if (i < 0) throw { code: 'vermogen-weg' }
        const j = actie === 'omhoog' ? i - 1 : i + 1
        if (j < 0 || j >= vers.length) return
        ;[vers[i], vers[j]] = [vers[j], vers[i]]
        await schrijfVolgorde('vermogens', vers, clubId)
        plaats = `Vermogen ${vers[j].naam} staat nu op plaats ${j + 1} van ${vers.length} in ${domeinNaam}.`
      }, { soort: 'lijstactie', lijst: lijstEl, bezig: null, fout: sectieFout })
      await laadEnRender()
      if (uitkomst === 'weg') terugval()?.focus()
      else focusInLijst(lijstEl, actie, id, terugval())
      if (uitkomst === 'ok' && plaats) zetStatus(volgordeStatus, plaats)
      else meldingInBeeld(sectieFout)
    } else if (actie === 'verwijder') {
      if (!v) return
      if (!bevestigVerwijderen('Vermogen', v.naam)) return
      const groep = groepVan(v)
      const k = groep.findIndex(x => x.id === id)
      const uitkomst = await metOpslaan(knop, () => verwijderVermogen(db, clubId, id), {
        soort: 'lijstactie', lijst: lijstEl, fout: sectieFout, bezig: null,
      })
      await laadEnRender()
      if (uitkomst === 'ok') {
        const buur = potlood(groep[k + 1]?.id || '') || potlood(groep[k - 1]?.id || '')
        ;(buur || terugval())?.focus()
        toonOk(sectieOk, `Vermogen ${v.naam} verwijderd.`)
        meldingInBeeld(sectieOk)
      } else if (uitkomst === 'weg') {
        terugval()?.focus()
        meldingInBeeld(sectieFout)
      } else {
        focusInLijst(lijstEl, 'verwijder', id, terugval())
        meldingInBeeld(sectieFout)
      }
    } else if (actie === 'bewerk') {
      if (!v) return
      openBewerk(id)
      el(`vn-${id}`)?.focus()
    } else if (actie === 'bewerk-annuleer') {
      tekenLijst()
      ;(potlood(id) || terugval())?.focus()
    } else if (actie === 'bewerk-opslaan') {
      if (!v) return
      const naamId = `vn-${id}`
      const domeinVeldId = `vd-${id}`
      const naam = normaliseerVermogensnaam(el(naamId)?.value)
      const domeinId = el(domeinVeldId)?.value || ''
      if (!valideerVelden([
        [naamId, `${naamId}-fout`, vermogensnaamFout(naam)],
        [domeinVeldId, `${domeinVeldId}-fout`, domeinId ? '' : 'Kies een domein.'],
      ])) return
      const naamAnders = naam !== v.naam
      const domeinAnders = domeinId !== v.domeinId
      if (!naamAnders && !domeinAnders) {
        tekenLijst()
        potlood(id)?.focus()
        return
      }
      const doelNaam = geldigDomein(domeinId)?.naam || ''
      const oudeGroep = groepVan(v)
      const k = oudeGroep.findIndex(x => x.id === id)
      let verplaatst = false
      let laatsteFout = null
      const uitkomst = await metOpslaan(knop, async () => {
        try {
          if (naamAnders && domeinAnders) await controleerNaamVrij(db, clubId, naam, id, domeinId)
          if (domeinAnders) { await verplaatsVermogen(db, clubId, id, domeinId); verplaatst = true }
          if (naamAnders) await hernoemVermogen(db, clubId, id, naam)
        } catch (fout) {
          laatsteFout = fout
          throw Object.assign(fout, { tekst: vermogenFoutTekst(fout, doelNaam) })
        }
      }, { soort: 'formulier-lijst', fout: el(`vm-fout-${id}`), weg: sectieFout, veldFouten: vermogenVeldFouten(naamId, domeinVeldId) })
      if (!lijstEl.isConnected) return

      if (uitkomst === 'weg') {
        await laadEnRender()
        terugval()?.focus()
        meldingInBeeld(sectieFout)
        return
      }

      if (uitkomst === 'fout') {
        const code = laatsteFout?.code
        // Halve uitkomst: wel verplaatst, naam niet. Formulier opnieuw open op de nieuwe plek.
        if (verplaatst) {
          if (actiefFilter !== 'alle') actiefFilter = domeinId
          await laadEnRender()
          if (!openBewerk(id, { naam, domeinId })) { terugval()?.focus(); return }
          const meld = el(`vm-fout-${id}`)
          const begin = `Het vermogen is verplaatst naar ${doelNaam}, maar de nieuwe naam is niet opgeslagen.`
          const slot = 'Klik nog eens op Opslaan om de naam te wijzigen.'
          if (NAAM_CODES.has(code)) {
            meld.textContent = `${begin} ${slot}`
            zetVeldFout(naamId, `${naamId}-fout`, laatsteFout.tekst)
          } else {
            const reden = foutTekst(laatsteFout, 'formulier-lijst').replace(STAART_INVOER, '')
            meld.textContent = `${begin} ${reden} ${slot}`
            lijstEl.querySelector(`[data-actie="bewerk-opslaan"][data-id="${CSS.escape(id)}"]`)?.focus()
          }
          return
        }
        // Dubbel, domein weg/overkoepelend of tegelijk gewijzigd: lijst verversen, invoer en fout terugzetten
        if (VERVERS_CODES.has(code)) {
          await laadEnRender()
          if (!openBewerk(id, { naam, domeinId: DOMEIN_CODES.has(code) ? '' : domeinId })) { terugval()?.focus(); return }
          if (NAAM_CODES.has(code)) zetVeldFout(naamId, `${naamId}-fout`, laatsteFout.tekst)
          else if (DOMEIN_CODES.has(code)) zetVeldFout(domeinVeldId, `${domeinVeldId}-fout`, laatsteFout.tekst)
          else {
            toonFout(el(`vm-fout-${id}`), laatsteFout, 'formulier-lijst')
            lijstEl.querySelector(`[data-actie="bewerk-opslaan"][data-id="${CSS.escape(id)}"]`)?.focus()
          }
        }
        return
      }

      await laadEnRender()
      if (!domeinAnders) potlood(id)?.focus()
      else if (actiefFilter === 'alle') potlood(id)?.focus()
      else {
        const nu = vanDomein(actiefFilter)
        const doel = nu[k] || nu[nu.length - 1]
        ;(doel ? potlood(doel.id) : terugval())?.focus()
      }
      const tekst = naamAnders && domeinAnders ? `Vermogen ${naam} opgeslagen en verplaatst naar ${doelNaam}.`
        : domeinAnders ? `Vermogen ${naam} verplaatst naar ${doelNaam}.`
        : `Vermogen ${naam} opgeslagen.`
      toonOk(sectieOk, tekst)
      meldingInBeeld(sectieOk)
    }
  })

  await laadEnRender()
}

// ── Projecten en samenwerkingen (CK-046), commissies (CK-041) ─────────────────
// Eén beheerpagina voor alle soorten; id-voorvoegsel onderdeel- (er is er één tegelijk open)

async function renderOnderdeelBeheer(gebruiker, soort) {
  if (geenBeheer(gebruiker)) return
  const cfg = SOORT_ONDERDEEL[soort]
  const filterHTML = cfg.status ? `
              <div class="filter-keuze">
                <label class="sr-only" for="onderdeel-filter">Toon</label>
                <select class="form-input" id="onderdeel-filter">
                  <option value="alle">Alle projecten</option>
                  ${STATUSSEN.map(([k, label]) => `<option value="${k}">${label}</option>`).join('')}
                </select>
              </div>` : ''
  document.querySelector('#app').innerHTML = appShellHTML({ actief: soort, kruimels: [['Home', 'home'], ['Beheer', 'beheer'], [navNaam(soort)]], inhoud: `
        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-4">
          <div class="sectie-kop">
            <h1 id="sectie-kop-4">${cfg.Meer}</h1>
          </div>
          <div class="sectie-lijf">
            <div class="beheer-balk" id="onderdeel-balk" hidden>${filterHTML}
              <button class="btn-toevoegen" type="button" id="onderdeel-toevoegen-knop">+ ${cfg.Enkel} toevoegen</button>
            </div>
            <div class="pijler-form" id="onderdeel-form" hidden></div>
            ${meldingenHTML('onderdeel-ok', 'onderdeel-fout')}
            <p class="vermogens-hint" id="onderdeel-functies-hint" role="status"></p>
            <p class="tussen-hint" id="onderdeel-plaat-hint"></p>
            <div class="sr-only" id="onderdeel-volgorde" role="status"></div>
            <div class="sr-only" id="onderdeel-filter-status" role="status"></div>
            <div id="onderdeel-lijst"><p class="lijst-laden">${cfg.Meer} worden geladen...</p></div>
          </div>
        </div>
` })

  bindAppShell(gebruiker)
  bindMeldblokken()

  const clubId = huidigClubId
  const el = id => document.getElementById(id)
  const balk = el('onderdeel-balk')
  const filterEl = el('onderdeel-filter')
  const form = el('onderdeel-form')
  const lijstEl = el('onderdeel-lijst')
  const sectieOk = el('onderdeel-ok')
  const sectieFout = el('onderdeel-fout')
  const functiesHint = el('onderdeel-functies-hint')
  const plaatHint = el('onderdeel-plaat-hint')
  const volgordeStatus = el('onderdeel-volgorde')
  const filterStatus = el('onderdeel-filter-status')
  const toevoegKnop = el('onderdeel-toevoegen-knop')

  let onderdelen = []
  let functies = null
  let actiefFilter = 'alle'

  const aantalTekst = n => `${n} ${n === 1 ? cfg.enkel : cfg.meer}`
  const getoond = () => (actiefFilter === 'alle' ? onderdelen : onderdelen.filter(x => x.status === actiefFilter))
  const terugval = () => zichtbareTerugval(toevoegKnop, form)
  const potlood = id => lijstEl.querySelector(`[data-actie="bewerk"][data-id="${CSS.escape(id)}"]`)
  const functieNaam = id => functies?.find(f => f.id === id)?.naam || ''
  const leeg = label => `<span class="leeg-streep"><span aria-hidden="true">—</span><span class="sr-only">${label}</span></span>`
  const idsVoor = id => ({ naam: `on-${id}`, status: `os-${id}`, begin: `ob-${id}`, eind: `oe-${id}`, eigenaar: `ow-${id}`, omschrijving: `oo-${id}` })
  const NIEUW = { naam: 'onderdeel-naam', status: 'onderdeel-status', begin: 'onderdeel-begin', eind: 'onderdeel-eind', eigenaar: 'onderdeel-eigenaar', omschrijving: 'onderdeel-omschrijving' }

  function veldenHTML(ids, w) {
    const status = cfg.status ? `
              <div class="form-groep">
                <label class="form-label" for="${esc(ids.status)}">Status</label>
                <select class="form-input" id="${esc(ids.status)}">${STATUSSEN.map(([k, label]) => `<option value="${k}"${k === w.status ? ' selected' : ''}>${label}</option>`).join('')}</select>
              </div>
              <fieldset class="periode-velden">
                <legend class="form-label">Periode (optioneel)</legend>
                <div class="form-rij-datums">
                  <div class="form-groep">
                    <label class="datum-label" for="${esc(ids.begin)}">Begindatum</label>
                    <input class="form-input" id="${esc(ids.begin)}" type="date" value="${esc(w.begindatum)}" aria-describedby="${esc(ids.begin)}-fout" data-eind="${esc(ids.eind)}">
                    <span class="form-fout" id="${esc(ids.begin)}-fout"></span>
                  </div>
                  <div class="form-groep">
                    <label class="datum-label" for="${esc(ids.eind)}">Einddatum</label>
                    <input class="form-input" id="${esc(ids.eind)}" type="date" value="${esc(w.einddatum)}"${w.begindatum ? ` min="${esc(w.begindatum)}"` : ''} aria-describedby="${esc(ids.eind)}-fout">
                    <span class="form-fout" id="${esc(ids.eind)}-fout"></span>
                  </div>
                </div>
              </fieldset>` : ''
    const eigenaar = functies?.some(f => f.id === w.bestuursfunctieId) ? w.bestuursfunctieId : ''
    return `
              <div class="form-groep">
                <label class="form-label" for="${esc(ids.naam)}">Naam</label>
                <input class="form-input" id="${esc(ids.naam)}" type="text" value="${esc(w.naam)}" placeholder="${esc(cfg.voorbeeld)}" ${NAAM_VELD_ATTR} aria-describedby="${esc(ids.naam)}-fout" data-naamveld>
                <span class="form-fout" id="${esc(ids.naam)}-fout"></span>
              </div>${status}
              <div class="form-groep">
                <label class="form-label" for="${esc(ids.eigenaar)}">Eigenaar</label>
                ${bestuursfunctieKeuzeHTML(ids.eigenaar, eigenaar, functies || [])}
              </div>
              <div class="form-groep">
                <label class="form-label" for="${esc(ids.omschrijving)}">Omschrijving</label>
                <textarea class="form-input" id="${esc(ids.omschrijving)}" rows="3" aria-describedby="${esc(ids.omschrijving)}-fout">${esc(w.omschrijving)}</textarea>
                <span class="form-fout" id="${esc(ids.omschrijving)}-fout"></span>
              </div>`
  }

  // Invoer lezen en controleren; geeft de velden of null (fouten staan dan bij de velden, focus op de eerste)
  function leesVelden(ids, bestaand = null) {
    const naam = normaliseerNaam(el(ids.naam)?.value)
    const omschrijving = normaliseerOmschrijving(el(ids.omschrijving)?.value)
    const gekozen = el(ids.eigenaar)?.value || ''
    const behoud = bestaand && !gekozen && !functies?.some(f => f.id === bestaand.bestuursfunctieId)
    const velden = { naam, omschrijving, bestuursfunctieId: behoud ? (bestaand.bestuursfunctieId || '') : gekozen }
    const regels = [[ids.naam, `${ids.naam}-fout`, onderdeelnaamFout(naam)]]
    if (cfg.status) {
      const beginEl = el(ids.begin)
      const eindEl = el(ids.eind)
      Object.assign(velden, { status: el(ids.status)?.value || 'in-voorbereiding', begindatum: beginEl?.value || '', einddatum: eindEl?.value || '' })
      const half = 'Vul een hele datum in, of maak het veld leeg.'
      const d = datumFout(velden.begindatum, velden.einddatum)
      regels.push([ids.begin, `${ids.begin}-fout`, beginEl?.validity?.badInput ? half : d.begin || ''])
      regels.push([ids.eind, `${ids.eind}-fout`, eindEl?.validity?.badInput ? half : d.eind || ''])
    }
    regels.push([ids.omschrijving, `${ids.omschrijving}-fout`, omschrijvingFout(omschrijving)])
    return valideerVelden(regels) ? velden : null
  }

  function rijHTML(x, plaats, k, n) {
    const periode = cfg.status ? periodeTekst(x.begindatum, x.einddatum) : ''
    const eigenaar = functieNaam(x.bestuursfunctieId)
    const statusCel = cfg.status ? `
          <span class="cel-status" role="cell">${Object.hasOwn(STATUS_LABEL, x.status) ? `<span class="status-label ${x.status}">${STATUS_LABEL[x.status]}</span>` : leeg('geen status')}</span>` : ''
    // Pijlknoppen alleen in het volledige overzicht (zonder filter); anders weg (Paul, 23-11-2026)
    const pijlen = actiefFilter === 'alle' ? `
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omhoog" data-id="${esc(x.id)}" aria-label="Omhoog: ${esc(x.naam)}"${k === 0 ? ' disabled' : ''}>${menuIcoon('pijl-omhoog')}</button>
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omlaag" data-id="${esc(x.id)}" aria-label="Omlaag: ${esc(x.naam)}"${k === n - 1 ? ' disabled' : ''}>${menuIcoon('pijl-omlaag')}</button>` : ''
    return `
        <div class="structuur-rij beheer-rij ${cfg.status ? 'project-rij' : 'samenwerking-rij'}" role="row" data-id="${esc(x.id)}">
          <span class="cel-nr" role="cell">${plaats}</span>
          <span class="cel-project" role="cell"><span class="cel-naam">${esc(x.naam)}</span>${periode ? `<span class="cel-periode"><span class="sr-only">, periode </span>${esc(periode)}</span>` : ''}</span>${statusCel}
          <span class="cel-eigenaar" role="cell"><span class="cel-label" aria-hidden="true">Eigenaar: </span>${eigenaar ? esc(eigenaar) : leeg('nog niet gekozen')}</span>
          <div class="kaart-acties cel-acties" role="cell">${pijlen}
            ${actieKnopHTML('bewerk', x.id, 'bewerk', x.naam)}${actieKnopHTML('verwijder', x.id, 'verwijder', x.naam)}
          </div>
        </div>`
  }

  function tekenLijst() {
    if (!lijstEl.isConnected) return
    balk.hidden = false
    if (filterEl) filterEl.closest('.filter-keuze').hidden = !onderdelen.length
    if (!onderdelen.length) {
      lijstEl.innerHTML = `
        <div class="leeg-blok">
          <h3>Nog geen ${cfg.meer}</h3>
          <p>${cfg.uitleg}</p>
        </div>`
      return
    }
    if (filterEl) filterEl.value = actiefFilter
    const lijst = getoond()
    if (!lijst.length) {
      lijstEl.innerHTML = `<p class="lijst-leeg">Geen ${cfg.meer} met status ${STATUS_LABEL[actiefFilter]}.</p>`
      return
    }
    const kop = cfg.status
      ? '<span role="columnheader">#</span><span role="columnheader">Project</span><span role="columnheader">Status</span><span role="columnheader">Eigenaar</span>'
      : `<span role="columnheader">#</span><span role="columnheader">${cfg.Enkel}</span><span role="columnheader">Eigenaar</span>`
    lijstEl.innerHTML = `
          <div role="table" aria-label="${cfg.Meer}">
            <div class="beheer-rij beheer-kop ${cfg.status ? 'project-rij' : 'samenwerking-rij'}" role="row">${kop}<span role="columnheader"><span class="sr-only">Acties</span></span></div>
            ${lijst.map((x, k) => rijHTML(x, onderdelen.indexOf(x) + 1, k, lijst.length)).join('')}
          </div>`
  }

  function toonLaadfout(e) {
    if (!lijstEl.isConnected) return
    balk.hidden = true
    form.hidden = true
    toevoegKnop.hidden = false
    lijstEl.innerHTML = laadfoutHTML(`De ${cfg.meer} konden niet worden geladen.`, 'onderdeel-herlaad', e, cfg.meer)
  }

  async function laadEnRender() {
    const bijzaken = Promise.allSettled([laadBestuursfuncties(), laadStructuurelementen()])
    try {
      onderdelen = await laadOnderdelen(db, clubId, soort)
    } catch (e) {
      console.error(`${cfg.Meer} laden mislukt:`, e?.code)
      toonLaadfout(e)
      return false
    }
    const [f, d] = await bijzaken
    if (!lijstEl.isConnected) return false
    if (f.status === 'rejected') console.error('Bestuursfuncties laden mislukt:', f.reason?.code)
    functies = f.status === 'fulfilled' ? f.value : null
    functiesHint.textContent = functies ? '' : 'De bestuursfuncties konden niet worden geladen. Herlaad de pagina om een eigenaar te kiezen.'
    const opPlaat = !cfg.opPlaat || d.status !== 'fulfilled' || d.value.some(x => x.type === 'overkoepelend' && x.bevat === soort)
    plaatHint.textContent = opPlaat ? '' : `Deze ${cfg.meer} staan nog niet op de plaat: geen overkoepelend domein toont ${cfg.meer}.`
    tekenLijst()
    return true
  }

  function sluitForm() {
    form.hidden = true
    form.innerHTML = ''
    toevoegKnop.hidden = false
  }

  function meldFilter() {
    const n = getoond().length
    zetStatus(filterStatus, n || actiefFilter === 'alle' ? `${aantalTekst(n)} getoond.` : `Geen ${cfg.meer} met status ${STATUS_LABEL[actiefFilter]}.`)
  }

  function openBewerk(id) {
    const rij = lijstEl.querySelector(`.structuur-rij[data-id="${CSS.escape(id)}"]`)
    const x = onderdelen.find(o => o.id === id)
    if (!rij || !x) return null
    rij.classList.add('bewerken')
    rij.innerHTML = `
        <div class="pijler-bewerk-form onderdeel-bewerk" role="cell">${veldenHTML(idsVoor(id), x)}
          <div class="form-rij">
            <button class="btn opslaan" type="button" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" type="button" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
          ${meldingenHTML(null, `om-fout-${id}`)}
        </div>`
    return rij
  }

  const dubbelFout = ids => ({ [cfg.dubbelCode]: [`${ids.naam}-fout`, ids.naam] })
  async function controleerDubbel(naam, eigenId = null) {
    if (naamBezet(await laadOnderdelen(db, clubId, soort), naam, eigenId)) throw { code: cfg.dubbelCode }
  }

  // Begindatum gekozen: einddatum niet eerder laten kiezen (hulp in de kiezer; de controle zit in leesVelden)
  const bijBegin = e => {
    const eindId = e.target.dataset?.eind
    if (!eindId) return
    const eind = el(eindId)
    if (eind) eind.min = e.target.value || ''
  }
  const enterIsOpslaan = (e, knop) => {
    if (e.key === 'Enter' && e.target.matches?.('[data-naamveld]')) { e.preventDefault(); knop()?.click() }
  }

  // ── Toevoegen ──
  toevoegKnop.addEventListener('click', () => {
    const status = Object.hasOwn(STATUS_LABEL, actiefFilter) ? actiefFilter : 'in-voorbereiding'
    form.innerHTML = `${veldenHTML(NIEUW, { naam: '', omschrijving: '', bestuursfunctieId: '', status, begindatum: '', einddatum: '' })}
              <div class="form-rij">
                <button class="btn opslaan" type="button" id="onderdeel-opslaan">Opslaan</button>
                <button class="btn" type="button" id="onderdeel-annuleer">Annuleren</button>
              </div>
              ${meldingenHTML(null, 'onderdeel-form-fout')}`
    form.hidden = false
    toevoegKnop.hidden = true
    el(NIEUW.naam).focus()
  })
  form.addEventListener('change', bijBegin)
  form.addEventListener('keydown', e => enterIsOpslaan(e, () => el('onderdeel-opslaan')))
  form.addEventListener('click', async e => {
    const knop = e.target.closest('button')
    if (!knop || knop.getAttribute('aria-disabled') === 'true') return
    if (knop.id === 'onderdeel-annuleer') {
      sluitForm()
      toevoegKnop.focus()
      return
    }
    if (knop.id !== 'onderdeel-opslaan') return
    const velden = leesVelden(NIEUW)
    if (!velden) return
    const uitkomst = await metOpslaan(knop, async () => {
      await controleerDubbel(velden.naam)
      await voegOnderdeelToe(db, clubId, soort, velden)
    }, { soort: 'formulier-lijst', fout: el('onderdeel-form-fout'), veldFouten: dubbelFout(NIEUW) })
    if (uitkomst !== 'ok' || !lijstEl.isConnected) return
    sluitForm()
    let staart = ''
    if (actiefFilter !== 'alle' && actiefFilter !== velden.status) {
      actiefFilter = 'alle'
      staart = ' Het filter staat weer op Alle projecten.'
    }
    await laadEnRender()
    toevoegKnop.focus()
    toonOk(sectieOk, `${cfg.Enkel} ${velden.naam} toegevoegd.${staart}`)
  })

  // ── Filter ──
  filterEl?.addEventListener('change', () => {
    actiefFilter = filterEl.value
    tekenLijst()
    meldFilter()
  })

  // ── Rijacties ──
  lijstEl.addEventListener('change', bijBegin)
  lijstEl.addEventListener('keydown', e => {
    const formEl = e.target.closest?.('.onderdeel-bewerk')
    if (formEl) enterIsOpslaan(e, () => formEl.querySelector('[data-actie="bewerk-opslaan"]'))
  })

  lijstEl.addEventListener('click', async e => {
    const herlaad = e.target.closest('#onderdeel-herlaad')
    if (herlaad) {
      if (herlaad.getAttribute('aria-disabled') === 'true') return
      herlaad.textContent = 'Bezig...'
      herlaad.setAttribute('aria-disabled', 'true')
      const gelukt = await laadEnRender()
      if (gelukt) (filterEl && !filterEl.closest('.filter-keuze').hidden ? filterEl : toevoegKnop).focus()
      else el('onderdeel-herlaad')?.focus()
      return
    }
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    if (lijstEl.getAttribute('aria-busy') === 'true' || knop.getAttribute('aria-disabled') === 'true') return
    const { actie, id } = knop.dataset
    const x = onderdelen.find(o => o.id === id)
    if (!x) return

    if (actie === 'omhoog' || actie === 'omlaag') {
      let plaats = ''
      volgordeStatus.textContent = ''
      const filter = actiefFilter
      const uitkomst = await metOpslaan(knop, async () => {
        const vers = await laadOnderdelen(db, clubId, soort)
        const zichtbaarVers = filter === 'alle' ? vers : vers.filter(o => o.status === filter)
        const i = zichtbaarVers.findIndex(o => o.id === id)
        if (i < 0) throw { code: cfg.wegCode }
        const j = actie === 'omhoog' ? i - 1 : i + 1
        if (j < 0 || j >= zichtbaarVers.length) {
          plaats = `${zichtbaarVers[i].naam} staat al ${j < 0 ? 'bovenaan' : 'onderaan'}. De lijst is bijgewerkt.`
          return
        }
        const a = vers.indexOf(zichtbaarVers[i])
        const b = vers.indexOf(zichtbaarVers[j])
        ;[vers[a], vers[b]] = [vers[b], vers[a]]
        await schrijfVolgorde(soort, vers, clubId)
        plaats = `${vers[b].naam} staat nu op plaats ${b + 1} van ${vers.length}.`
      }, { soort: 'lijstactie', lijst: lijstEl, bezig: null, fout: sectieFout })
      await laadEnRender()
      if (uitkomst === 'weg') terugval()?.focus()
      else focusInLijst(lijstEl, actie, id, terugval())
      if (uitkomst === 'ok') { if (plaats) zetStatus(volgordeStatus, plaats) }
      else meldingInBeeld(sectieFout)
    } else if (actie === 'verwijder') {
      if (!bevestigVerwijderen(cfg.Enkel, x.naam)) return
      const lijst = getoond()
      const k = lijst.indexOf(x)
      const uitkomst = await metOpslaan(knop, () => verwijderOnderdeel(db, clubId, soort, id), {
        soort: 'lijstactie', lijst: lijstEl, fout: sectieFout, bezig: null,
      })
      await laadEnRender()
      if (uitkomst === 'ok') {
        const buur = potlood(lijst[k + 1]?.id || '') || potlood(lijst[k - 1]?.id || '')
        ;(buur || terugval())?.focus()
        toonOk(sectieOk, `${cfg.Enkel} ${x.naam} verwijderd.`)
        meldingInBeeld(sectieOk)
      } else if (uitkomst === 'weg') {
        terugval()?.focus()
        meldingInBeeld(sectieFout)
      } else {
        focusInLijst(lijstEl, 'verwijder', id, terugval())
        meldingInBeeld(sectieFout)
      }
    } else if (actie === 'bewerk') {
      if (openBewerk(id)) el(idsVoor(id).naam)?.focus()
    } else if (actie === 'bewerk-annuleer') {
      tekenLijst()
      ;(potlood(id) || terugval())?.focus()
    } else if (actie === 'bewerk-opslaan') {
      const ids = idsVoor(id)
      const velden = leesVelden(ids, x)
      if (!velden) return
      const ongewijzigd = Object.keys(velden).every(k => velden[k] === (x[k] ?? ''))
      if (ongewijzigd) {
        tekenLijst()
        potlood(id)?.focus()
        return
      }
      const lijst = getoond()
      const k = lijst.indexOf(x)
      const uitkomst = await metOpslaan(knop, async () => {
        await controleerDubbel(velden.naam, id)
        await bewerkOnderdeel(db, clubId, soort, id, velden)
      }, { soort: 'formulier-lijst', fout: el(`om-fout-${id}`), weg: sectieFout, veldFouten: dubbelFout(ids) })
      if (!lijstEl.isConnected || uitkomst === 'fout') return
      await laadEnRender()
      if (uitkomst === 'weg') {
        terugval()?.focus()
        meldingInBeeld(sectieFout)
        return
      }
      const nu = getoond()
      const doel = potlood(id) || potlood((nu[k] || nu[nu.length - 1])?.id || '')
      ;(doel || terugval())?.focus()
      const afgerond = cfg.status && velden.status === 'afgerond' && x.status !== 'afgerond'
        ? ` ${velden.naam} is afgerond en staat niet meer op de plaat.` : ''
      toonOk(sectieOk, `${cfg.Enkel} ${velden.naam} opgeslagen.${afgerond}`)
      meldingInBeeld(sectieOk)
    }
  })

  await laadEnRender()
}

async function renderBestuursfunctiesBeheer(gebruiker) {
  if (geenBeheer(gebruiker)) return
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'functies', kruimels: [['Home', 'home'], ['Beheer', 'beheer'], [navNaam('functies')]], inhoud: `
        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-5">
          <div class="sectie-kop">
            <h1 id="sectie-kop-5">Bestuursfuncties</h1>
          </div>
          <div class="sectie-lijf">
            <div class="beheer-balk">
              <button class="btn-toevoegen" type="button" id="functie-toevoegen-knop">+ Bestuursfunctie toevoegen</button>
            </div>
            <div class="pijler-form" id="functie-form" hidden>
              <div class="form-groep">
                <label class="form-label" for="functie-naam">Naam</label>
                <input class="form-input" id="functie-naam" type="text" placeholder="Bijv. Bestuurslid Hockey" autocomplete="off" maxlength="100" aria-describedby="functie-naam-fout">
                <span class="form-fout" id="functie-naam-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn opslaan" id="functie-opslaan">Opslaan</button>
                <button class="btn" id="functie-annuleer">Annuleren</button>
              </div>
              ${meldingenHTML(null, 'functie-form-fout')}
            </div>
            ${meldingenHTML('functie-ok', 'functie-fout')}
            <div class="sr-only" id="functie-volgorde" role="status"></div>
            <p class="vermogens-hint" id="functie-hint" role="status"></p>
            <div id="functie-lijst"></div>
          </div>
        </div>
` })
  bindAppShell(gebruiker)
  bindMeldblokken()
  const mijnLijst = document.getElementById('functie-lijst')   // eigen lijst, ook na weg en terug (CK-057)


  // Waar een functie eindverantwoordelijke (domeinen) of eigenaar (commissies, projecten, samenwerkingen) van is (CK-046, CK-041)
  // Domeinen moeten laden; commissies, projecten en samenwerkingen fail-soft (null), dan is de telling onvolledig
  const laadVerwijzers = async () => {
    const [domeinen, ...rest] = await Promise.all([
      laadStructuurelementen(),
      ...Object.keys(SOORT_ONDERDEEL).map(soort => laadOnderdelen(db, huidigClubId, soort).catch(e => {
        console.error(`${SOORT_ONDERDEEL[soort].Meer} laden mislukt:`, e?.code)
        return null
      })),
    ])
    return [domeinen, ...rest]
  }
  const telling = (verwijzers, id) => {
    const [domeinen, ...onderdelen] = verwijzers
    const tel = lijst => (lijst || []).filter(x => x.bestuursfunctieId === id).length
    const delen = [[tel(domeinen), 'domein', 'domeinen']]
    Object.values(SOORT_ONDERDEEL).forEach((cfg, k) => delen.push([tel(onderdelen[k]), cfg.enkel, cfg.meer]))
    const tekst = delen.filter(([n]) => n > 0).map(([n, enkel, meer]) => `${n} ${n === 1 ? enkel : meer}`)
    const volledig = onderdelen.every(Boolean)
    return { domeinen: delen[0][0], overig: delen.slice(1).reduce((a, [n]) => a + n, 0), tekst, volledig }
  }
  const ONVOLLEDIG = 'De commissies, projecten en samenwerkingen konden niet worden geladen. De kolom Eindverantwoordelijk voor telt daarom alleen de domeinen, en een bestuursfunctie verwijderen kan pas als alles geteld kan worden. Herlaad de pagina om het opnieuw te proberen.'
  const enLijst = delen => (delen.length < 2 ? delen.join('') : `${delen.slice(0, -1).join(', ')} en ${delen[delen.length - 1]}`)

  async function laadEnRender() {
    const lijst = mijnLijst
    if (!lijst) return false
    const balk = document.querySelector('.beheer-balk')
    let functies, verwijzers
    try {
      [functies, verwijzers] = await Promise.all([laadBestuursfuncties(), laadVerwijzers()])
    } catch (e) {
      if (!lijst.isConnected) return false
      console.error('Bestuursfuncties laden mislukt:', e?.code)
      balk.hidden = true
      document.getElementById('functie-form').hidden = true
      document.getElementById('functie-hint').textContent = ''
      lijst.removeAttribute('role')
      lijst.removeAttribute('aria-label')
      lijst.innerHTML = laadfoutHTML('De bestuursfuncties konden niet worden geladen.', 'functie-herlaad', e, 'bestuursfuncties')
      return false
    }
    if (!lijst.isConnected) return false
    balk.hidden = false
    const hint = document.getElementById('functie-hint')
    if (hint) hint.textContent = verwijzers.slice(1).every(Boolean) ? '' : ONVOLLEDIG
    if (functies.length === 0) {
      lijst.innerHTML = `<p class="lijst-leeg">Nog geen bestuursfuncties.</p>`
      return
    }
    lijst.setAttribute('role', 'table')
    lijst.setAttribute('aria-label', 'Bestuursfuncties')
    lijst.innerHTML = `
        <div class="beheer-rij beheer-kop functie-rij" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Bestuursfunctie</span>
          <span role="columnheader">Eindverantwoordelijk voor</span>
          <span role="columnheader"><span class="sr-only">Acties</span></span>
        </div>` + functies.map((f, i) => {
      const { tekst, volledig } = telling(verwijzers, f.id)
      return `
        <div class="structuur-rij beheer-rij functie-rij" role="row" data-id="${esc(f.id)}">
          <span class="cel-nr" role="cell">${i + 1}</span>
          <span class="cel-naam" role="cell">${esc(f.naam)}</span>
          <span class="cel-functie" role="cell">${tekst.length ? tekst.join(', ') : volledig ? 'Niets' : 'Geen domeinen'}</span>
          <div class="kaart-acties cel-acties" role="cell">
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omhoog" data-id="${esc(f.id)}" aria-label="Omhoog: ${esc(f.naam)}"${i === 0 ? ' disabled' : ''}>${menuIcoon('pijl-omhoog')}</button>
            <button class="btn-kaart-actie btn-volgorde" type="button" data-actie="omlaag" data-id="${esc(f.id)}" aria-label="Omlaag: ${esc(f.naam)}"${i === functies.length - 1 ? ' disabled' : ''}>${menuIcoon('pijl-omlaag')}</button>
            ${actieKnopHTML('bewerk', f.id, 'bewerk', f.naam)}
            ${actieKnopHTML('verwijder', f.id, 'verwijder', f.naam)}
          </div>
        </div>`
    }).join('')
  }

  await laadEnRender()

  const lijstEl = mijnLijst
  if (!lijstEl?.isConnected) return   // intussen naar een andere pagina gegaan (CK-056)
  const toevoegKnop = document.getElementById('functie-toevoegen-knop')
  bindHerlaad(lijstEl, 'functie-herlaad', async () => (await laadEnRender()) !== false, () => toevoegKnop)
  enterSlaatOp(document.getElementById('functie-form'), () => document.getElementById('functie-opslaan'))
  enterSlaatOp(lijstEl, t => t.closest('.pijler-bewerk-form')?.querySelector('[data-actie="bewerk-opslaan"]'))
  const sectieOk = document.getElementById('functie-ok')
  const sectieFout = document.getElementById('functie-fout')
  const opslaanKnop = document.getElementById('functie-opslaan')
  const annuleerKnop = document.getElementById('functie-annuleer')
  const naamInput = document.getElementById('functie-naam')
  const terugval = () => zichtbareTerugval(toevoegKnop, document.getElementById('functie-form'))
  const volgordeStatus = document.getElementById('functie-volgorde')
  const naamRegel = naam => naamFout(naam, 100)

  const resetForm = () => {
    document.getElementById('functie-form').hidden = true
    toevoegKnop.hidden = false
    naamInput.value = ''
    wisVeldFout('functie-naam', 'functie-naam-fout')
  }
  toevoegKnop.addEventListener('click', () => {
    document.getElementById('functie-form').hidden = false
    toevoegKnop.hidden = true
    naamInput.focus()
  })
  annuleerKnop.addEventListener('click', () => {
    if (annuleerKnop.getAttribute('aria-disabled') === 'true') return
    resetForm()
  })
  opslaanKnop.addEventListener('click', async () => {
    if (opslaanKnop.getAttribute('aria-disabled') === 'true') return
    const naam = naamInput.value.trim()
    if (!valideerVelden([['functie-naam', 'functie-naam-fout', naamRegel(naam)]])) return
    const uitkomst = await metOpslaan(opslaanKnop, async () => {
      const functies = await laadBestuursfuncties()
      if (functies.some(f => f.naam.toLowerCase() === naam.toLowerCase())) throw { code: 'dubbele-naam' }
      const hoogste = functies.reduce((m, x) => (typeof x.volgorde === 'number' ? Math.max(m, x.volgorde) : m), 0)
      await voegBestuursfunctieToe({ naam, volgorde: hoogste + 1 })
    }, {
      soort: 'formulier-lijst',
      fout: document.getElementById('functie-form-fout'),
      veldFouten: { 'dubbele-naam': ['functie-naam-fout', 'functie-naam'] },
    })
    if (uitkomst !== 'ok' || !opslaanKnop.isConnected) return
    resetForm()
    await laadEnRender().catch(e => console.error(e))
    terugval()?.focus()
    toonOk(sectieOk, `Bestuursfunctie ${naam} toegevoegd.`)
  })

  lijstEl.addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    if (lijstEl.getAttribute('aria-busy') === 'true' || knop.getAttribute('aria-disabled') === 'true') return
    const { actie, id } = knop.dataset
    const rij = knop.closest('.structuur-rij')
    if (actie === 'omhoog' || actie === 'omlaag') {
      let plaats = ''
      volgordeStatus.textContent = ''
      const uitkomst = await metOpslaan(knop, async () => {
        const functies = await laadBestuursfuncties()
        const i = functies.findIndex(x => x.id === id)
        const j = actie === 'omhoog' ? i - 1 : i + 1
        if (i < 0 || j < 0 || j >= functies.length) return
        ;[functies[i], functies[j]] = [functies[j], functies[i]]
        await schrijfVolgorde('bestuursfuncties', functies)
        plaats = `Bestuursfunctie ${functies[j].naam} staat nu op plaats ${j + 1} van ${functies.length}.`
      }, { soort: 'lijstactie', lijst: lijstEl, bezig: null, fout: sectieFout })
      await laadEnRender().catch(e => console.error(e))
      focusInLijst(lijstEl, actie, id, terugval())
      if (uitkomst === 'ok' && plaats && volgordeStatus.isConnected) volgordeStatus.textContent = plaats
      else meldingInBeeld(sectieFout)
    } else if (actie === 'verwijder') {
      // Masterdata: een functie die nog bij een domein, commissie, project of samenwerking hoort, kan niet weg. Vers tellen.
      let t
      try {
        t = telling(await metTijdslimiet(laadVerwijzers()), id)
      } catch (fout) {
        console.error('Telling voor verwijderen mislukt:', fout?.code)
        toonFout(sectieFout, fout, 'lijstactie')
        meldingInBeeld(sectieFout)
        return
      }
      if (!lijstEl.isConnected) return
      if (t.tekst.length) {
        const rol = t.domeinen && t.overig ? 'eindverantwoordelijke of eigenaar' : t.domeinen ? 'eindverantwoordelijke' : 'eigenaar'
        sectieFout.textContent = `Deze bestuursfunctie is nog ${rol} van ${enLijst(t.tekst)}. Kies daar eerst een andere bestuursfunctie.`
        meldingInBeeld(sectieFout)
        return
      }
      if (!t.volledig) {
        sectieFout.textContent = 'Deze bestuursfunctie kan nu niet worden verwijderd: de commissies, projecten en samenwerkingen konden niet worden geteld. Herlaad de pagina en probeer het opnieuw.'
        meldingInBeeld(sectieFout)
        return
      }
      const naam = rij?.querySelector('.cel-naam')?.textContent || ''
      if (!bevestigVerwijderen('Bestuursfunctie', naam)) return
      const uitkomst = await metOpslaan(knop, () => verwijderBestuursfunctie(id), { soort: 'lijstactie', lijst: lijstEl, fout: sectieFout, bezig: null })
      await laadEnRender().catch(e => console.error(e))
      if (uitkomst === 'ok') {
        terugval()?.focus()
        toonOk(sectieOk, `Bestuursfunctie ${naam} verwijderd.`)
      } else if (uitkomst === 'weg') terugval()?.focus()
      else { focusInLijst(lijstEl, 'verwijder', id, terugval()); meldingInBeeld(sectieFout) }
    } else if (actie === 'bewerk') {
      const f = (await laadBestuursfuncties()).find(x => x.id === id)
      if (!f) return
      rij.classList.add('bewerken')
      rij.innerHTML = `
        <div class="pijler-bewerk-form" role="cell">
          <div class="form-groep">
            <label class="form-label" for="fn-${esc(id)}">Naam</label>
            <input class="form-input" id="fn-${esc(id)}" type="text" maxlength="100" value="${esc(f.naam)}" autocomplete="off" aria-describedby="fn-fout-${esc(id)}">
            <span class="form-fout" id="fn-fout-${esc(id)}"></span>
          </div>
          <div class="form-rij">
            <button class="btn opslaan" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
          ${meldingenHTML(null, `fm-fout-${id}`)}
        </div>`
      document.getElementById(`fn-${id}`)?.focus()
    } else if (actie === 'bewerk-opslaan') {
      const naam = document.getElementById(`fn-${id}`)?.value.trim() || ''
      if (!valideerVelden([[`fn-${id}`, `fn-fout-${id}`, naamRegel(naam)]])) return
      const uitkomst = await metOpslaan(knop, async () => {
        const functies = await laadBestuursfuncties()
        if (functies.some(x => x.id !== id && x.naam.toLowerCase() === naam.toLowerCase())) throw { code: 'dubbele-naam' }
        await bewerkBestuursfunctie(id, { naam })
      }, {
        soort: 'formulier-lijst',
        fout: document.getElementById(`fm-fout-${id}`),
        weg: sectieFout,
        veldFouten: { 'dubbele-naam': [`fn-fout-${id}`, `fn-${id}`] },
      })
      if (uitkomst === 'fout') return
      await laadEnRender().catch(e => console.error(e))
      if (uitkomst === 'weg') { terugval()?.focus(); return }
      focusInLijst(lijstEl, 'bewerk', id, terugval())
      toonOk(sectieOk, `Bestuursfunctie ${naam} opgeslagen.`)
      meldingInBeeld(sectieOk)
    } else if (actie === 'bewerk-annuleer') {
      await laadEnRender()
      focusInLijst(lijstEl, 'bewerk', id, terugval())
    }
  })
}

// Bevestiging na opnieuw tekenen: [melding, tekst, knop die de focus krijgt]
const CLUB_SUCCES = {
  profiel: ['profiel-ok', 'Profiel opgeslagen.', 'profiel-opslaan'],
  logo: ['logo-ok', 'Logo opgeslagen.', 'logo-kiezen'],
  'logo-weg': ['logo-ok', 'Logo verwijderd.', 'logo-kiezen'],
}

// Club (profiel en logo) — tabblad onder Beheer
function renderClubBeheer(gebruiker, { succes } = {}) {
  if (geenBeheer(gebruiker)) return
  const logoSrc = veiligLogo(huidigProfiel?.logo)
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'club', kruimels: [['Home', 'home'], ['Beheer', 'beheer'], [navNaam('club')]], inhoud: `
        <h1 class="sr-only">Club</h1>
        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-6">
          <div class="sectie-kop">
            <h2 id="sectie-kop-6">Clubprofiel</h2>
          </div>
          <div class="sectie-lijf">
            <div class="profiel-form-wrap">
              <div class="form-groep">
                <label class="form-label" for="profiel-naam">Clubnaam</label>
                <input class="form-input" id="profiel-naam" type="text" placeholder="Volledige naam van de club" autocomplete="off" maxlength="100" value="${esc(huidigProfiel?.naam || '')}">
                <span class="form-fout" id="profiel-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="profiel-afkorting">Afkorting</label>
                <input class="form-input" id="profiel-afkorting" type="text" placeholder="bv. FCE" autocomplete="off" maxlength="20" value="${esc(huidigProfiel?.afkorting || '')}">
                <span class="form-fout" id="profiel-afkorting-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="profiel-seizoen">Huidig seizoen</label>
                <input class="form-input" id="profiel-seizoen" type="text" placeholder="bv. 2026–2027" autocomplete="off" maxlength="20" value="${esc(huidigProfiel?.seizoen || '')}">
                <span class="form-fout" id="profiel-seizoen-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn opslaan" id="profiel-opslaan">Opslaan</button>
              </div>
              ${meldingenHTML('profiel-ok', 'profiel-fout')}
            </div>
          </div>
        </div>

        <div class="sectie" data-meldblok role="region" aria-labelledby="sectie-kop-7">
          <div class="sectie-kop">
            <h2 id="sectie-kop-7">Clublogo</h2>
          </div>
          <div class="sectie-lijf">
            <div class="logo-upload-wrap">
              ${logoSrc
                ? `<img src="${esc(logoSrc)}" class="logo-preview" alt="Huidig logo">`
                : `<div class="logo-leeg">Nog geen logo geüpload</div>`}
              <div class="form-rij">
                <button type="button" class="btn" id="logo-kiezen">${logoSrc ? 'Logo wijzigen' : 'Logo uploaden'}</button>
                <input type="file" id="logo-input" accept="image/png,image/jpeg,image/webp" hidden>
                ${logoSrc
                  ? `<button class="btn gevaar" id="logo-verwijderen">Verwijderen</button>`
                  : ''}
              </div>
              ${meldingenHTML('logo-ok', 'logo-fout')}
            </div>
          </div>
        </div>

` })

  bindAppShell(gebruiker)
  bindMeldblokken()

  const logoKiezen = document.getElementById('logo-kiezen')
  const logoInput = document.getElementById('logo-input')
  const logoFout = document.getElementById('logo-fout')

  logoKiezen.addEventListener('click', () => {
    if (logoKiezen.getAttribute('aria-disabled') === 'true') return
    logoInput.click()
  })

  logoInput.addEventListener('change', async () => {
    const file = logoInput.files[0]
    if (!file) return
    const sessie = profielSessie()
    let base64 = ''
    let uitkomst
    try {
      uitkomst = await metOpslaan(logoKiezen, async () => {
        base64 = await leesLogoBestand(file)
        await sessie.schrijf({ logo: base64 }, p => ({ ...p, logo: base64 }))
      }, { soort: 'logo', fout: logoFout })
    } finally {
      logoInput.value = ''
    }
    if (uitkomst !== 'ok' || !logoKiezen.isConnected || !sessie.geldig()) return
    setFavicon(base64)
    renderClubBeheer(gebruiker, { succes: 'logo' })
  })

  const verwijderKnop = document.getElementById('logo-verwijderen')
  if (verwijderKnop) {
    verwijderKnop.addEventListener('click', async () => {
      if (verwijderKnop.getAttribute('aria-disabled') === 'true') return
      if (!bevestigVerwijderen('Clublogo')) return
      const sessie = profielSessie()
      const uitkomst = await metOpslaan(verwijderKnop, () => sessie.schrijf({ logo: deleteField() }, ({ logo: _weg, ...rest }) => rest), {
        soort: 'logo', fout: logoFout,
      })
      if (uitkomst !== 'ok' || !verwijderKnop.isConnected || !sessie.geldig()) return
      setFavicon('')
      renderClubBeheer(gebruiker, { succes: 'logo-weg' })
    })
  }

  const profielKnop = document.getElementById('profiel-opslaan')
  profielKnop.addEventListener('click', async () => {
    if (profielKnop.getAttribute('aria-disabled') === 'true') return
    const naam = document.getElementById('profiel-naam').value.trim()
    const afkorting = document.getElementById('profiel-afkorting').value.trim()
    const seizoen = document.getElementById('profiel-seizoen').value.trim()

    if (!valideerVelden([
      ['profiel-naam', 'profiel-naam-fout', minFout(naam, 2) || maxFout(naam, 100) || (ONZICHTBARE_TEKENS.test(naam) ? ONZICHTBAAR_FOUT : '')],
      ['profiel-afkorting', 'profiel-afkorting-fout', minFout(afkorting, 2) || maxFout(afkorting, 20)],
      ['profiel-seizoen', 'profiel-seizoen-fout', minFout(seizoen, 4) || maxFout(seizoen, 20)],
    ])) return

    const velden = { naam, afkorting, seizoen }
    const sessie = profielSessie()
    const uitkomst = await metOpslaan(profielKnop, () => sessie.schrijf(velden, p => ({ ...p, ...velden })), {
      soort: 'formulier', fout: document.getElementById('profiel-fout'),
    })
    if (uitkomst !== 'ok' || !profielKnop.isConnected || !sessie.geldig()) return
    renderClubBeheer(gebruiker, { succes: 'profiel' })
  })

  const bevestiging = CLUB_SUCCES[succes]
  if (bevestiging) {
    const [meldId, tekst, knopId] = bevestiging
    const el = document.getElementById(meldId)
    document.getElementById(knopId)?.focus()
    setTimeout(() => { if (el?.isConnected) toonOk(el, tekst) }, 100)
  }
}

// Mijn account — bereikbaar via de accountregel in het zijmenu
function renderMijnAccount(gebruiker) {
  document.querySelector('#app').innerHTML = appShellHTML({ actief: 'account', kruimels: [['Home', 'home'], [navNaam('account')]], inhoud: `
        <div class="sectie" role="region" aria-labelledby="sectie-kop-8">
          <div class="sectie-kop">
            <h1 id="sectie-kop-8">Mijn account</h1>
          </div>
          <div class="sectie-lijf">
            <div class="profiel-form-wrap">

              <div class="meld-blok" data-meldblok>
                <div class="form-groep">
                  <label class="form-label" for="geb-naam">Naam</label>
                  <input class="form-input" id="geb-naam" type="text" placeholder="Jouw naam" autocomplete="name" value="${esc(huidigGebruiker?.displayName || '')}">
                  <span class="form-fout" id="geb-naam-fout"></span>
                </div>
                <div class="form-rij">
                  <button class="btn opslaan" id="geb-naam-opslaan">Naam opslaan</button>
                </div>
                ${meldingenHTML('geb-naam-ok', 'geb-naam-statusfout')}
              </div>

              <hr class="sectie-hr">

              <div class="meld-blok" data-meldblok>
                <p class="geb-info">Huidig e-mailadres: ${esc(huidigGebruiker?.email || '')}</p>
                <div class="form-groep">
                  <label class="form-label" for="geb-email">Nieuw e-mailadres</label>
                  <input class="form-input" id="geb-email" type="email" placeholder="nieuw@voorbeeld.nl" autocomplete="off" aria-describedby="geb-email-fout">
                  <span class="form-fout" id="geb-email-fout"></span>
                </div>
                <div class="form-groep">
                  <label class="form-label" for="geb-email-ww">Wachtwoord ter bevestiging</label>
                  <input class="form-input" id="geb-email-ww" type="password" placeholder="••••••••" autocomplete="current-password" aria-describedby="geb-email-ww-fout">
                  <span class="form-fout" id="geb-email-ww-fout"></span>
                </div>
                <div class="form-rij">
                  <button class="btn opslaan" id="geb-email-opslaan">E-mailadres wijzigen</button>
                </div>
                ${meldingenHTML('geb-email-ok', 'geb-email-statusfout')}
              </div>

              <hr class="sectie-hr">

              <div class="meld-blok" data-meldblok>
                <div class="form-groep">
                  <label class="form-label" for="geb-huidig-ww">Huidig wachtwoord</label>
                  <input class="form-input" id="geb-huidig-ww" type="password" placeholder="••••••••" autocomplete="current-password" aria-describedby="geb-huidig-ww-fout">
                  <span class="form-fout" id="geb-huidig-ww-fout"></span>
                </div>
                <div class="form-groep">
                  <label class="form-label" for="geb-nieuw-ww">Nieuw wachtwoord</label>
                  <input class="form-input" id="geb-nieuw-ww" type="password" placeholder="Minimaal 8 tekens" autocomplete="new-password" aria-describedby="geb-nieuw-ww-fout">
                  <span class="form-fout" id="geb-nieuw-ww-fout"></span>
                </div>
                <div class="form-rij">
                  <button class="btn opslaan" id="geb-ww-opslaan">Wachtwoord wijzigen</button>
                </div>
                ${meldingenHTML('geb-ww-ok', 'geb-ww-statusfout')}
              </div>

            </div>
          </div>
        </div>

` })

  bindAppShell(gebruiker)
  bindMeldblokken()

  const naamKnop = document.getElementById('geb-naam-opslaan')
  naamKnop.addEventListener('click', async () => {
    if (naamKnop.getAttribute('aria-disabled') === 'true') return
    const naam = document.getElementById('geb-naam').value.trim()
    if (!valideerVelden([['geb-naam', 'geb-naam-fout', minFout(naam, 2)]])) return
    const uitkomst = await metOpslaan(naamKnop, () => updateProfile(huidigGebruiker, { displayName: naam }), {
      soort: 'formulier', fout: document.getElementById('geb-naam-statusfout'),
    })
    if (uitkomst !== 'ok' || !naamKnop.isConnected) return
    toonOk(document.getElementById('geb-naam-ok'), 'Naam opgeslagen.')
    const sessie = document.querySelector('.zijmenu-account .naam-sessie')
    if (sessie) sessie.textContent = sessieLabel()
  })

  const emailKnop = document.getElementById('geb-email-opslaan')
  emailKnop.addEventListener('click', async () => {
    if (emailKnop.getAttribute('aria-disabled') === 'true') return
    const email = document.getElementById('geb-email').value.trim()
    const ww = document.getElementById('geb-email-ww').value
    if (!valideerVelden([
      ['geb-email', 'geb-email-fout', email ? '' : 'Vul het nieuwe e-mailadres in.'],
      ['geb-email-ww', 'geb-email-ww-fout', ww ? '' : 'Vul je wachtwoord in.'],
    ])) return
    const emailVeld = ['geb-email-fout', 'geb-email']
    const wwVeld = ['geb-email-ww-fout', 'geb-email-ww']
    const uitkomst = await metOpslaan(emailKnop, async () => {
      const credential = EmailAuthProvider.credential(huidigGebruiker.email, ww)
      await reauthenticateWithCredential(huidigGebruiker, credential)
      await verifyBeforeUpdateEmail(huidigGebruiker, email)
    }, {
      soort: 'account-email',
      fout: document.getElementById('geb-email-statusfout'),
      veldFouten: {
        'auth/email-already-in-use': emailVeld,
        'auth/invalid-email': emailVeld,
        'auth/operation-not-allowed': emailVeld,
        'auth/wrong-password': wwVeld,
        'auth/invalid-credential': wwVeld,
      },
    })
    if (uitkomst !== 'ok' || !emailKnop.isConnected) return
    toonOk(document.getElementById('geb-email-ok'), `We hebben een bevestigingsmail gestuurd naar ${email}. Klik op de link in die mail om de wijziging af te ronden.`)
    document.getElementById('geb-email').value = ''
    document.getElementById('geb-email-ww').value = ''
  })

  const wwKnop = document.getElementById('geb-ww-opslaan')
  wwKnop.addEventListener('click', async () => {
    if (wwKnop.getAttribute('aria-disabled') === 'true') return
    const huidigWw = document.getElementById('geb-huidig-ww').value
    const nieuwWw = document.getElementById('geb-nieuw-ww').value
    if (!valideerVelden([
      ['geb-huidig-ww', 'geb-huidig-ww-fout', huidigWw ? '' : 'Vul je huidige wachtwoord in.'],
      ['geb-nieuw-ww', 'geb-nieuw-ww-fout', minFout(nieuwWw, 8)],
    ])) return
    const huidigVeld = ['geb-huidig-ww-fout', 'geb-huidig-ww']
    const uitkomst = await metOpslaan(wwKnop, async () => {
      const credential = EmailAuthProvider.credential(huidigGebruiker.email, huidigWw)
      await reauthenticateWithCredential(huidigGebruiker, credential)
      await updatePassword(huidigGebruiker, nieuwWw)
    }, {
      soort: 'account-wachtwoord',
      fout: document.getElementById('geb-ww-statusfout'),
      veldFouten: {
        'auth/wrong-password': huidigVeld,
        'auth/invalid-credential': huidigVeld,
        'auth/weak-password': ['geb-nieuw-ww-fout', 'geb-nieuw-ww'],
      },
    })
    if (uitkomst !== 'ok' || !wwKnop.isConnected) return
    toonOk(document.getElementById('geb-ww-ok'), 'Je wachtwoord is gewijzigd.')
    document.getElementById('geb-huidig-ww').value = ''
    document.getElementById('geb-nieuw-ww').value = ''
  })
}

if (configFout) {
  renderConfigFout(configFout)
} else {
  toonOmgevingsBalk()
  startEigenVelden()   // eigen keuzelijst en datumkiezer in plaats van die van de browser
  startStilteBewaking()
  onAuthStateChanged(auth, async gebruiker => {
    clearTimeout(laadTimer)
    laadTimer = null
    if (gebruiker) {
      if (teLangStil()) { stilUitloggen(); return }
      markeerActief(true)
      huidigGebruiker = gebruiker
      foutPogingen = 0
      laadTimer = setTimeout(renderLaadkaart, 500)
      const { status } = await laadClub(gebruiker)
      if (huidigGebruiker?.uid !== gebruiker.uid || status === 'afgebroken') return
      clearTimeout(laadTimer)
      laadTimer = null
      toonUitkomst(gebruiker, status)
    } else {
      huidigClubId = null
      huidigGebruiker = null
      huidigProfiel = null
      huidigeRol = null
      foutPogingen = 0
      sluitPaneel({ focus: false })
      document.title = paginaTitel()
      setFavicon('')
      renderInlogscherm()
    }
  })
}
