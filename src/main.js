import './style.css'
import { auth, db } from './firebase.js'
import { version } from '../package.json'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

let huidigClubId = null
let huidigProfiel = null
let huidigGebruiker = null
let huidigeRol = null

// Omgeving waarin de app draait (midden in de footer). Per deploy in te stellen met
// VITE_OMGEVING (bijv. "Productie"); zonder instelling is het "Ontwikkel".
const OMGEVING = (import.meta.env.VITE_OMGEVING || 'Ontwikkel').trim()
let laadTimer = null
let foutPogingen = 0

// Algemeen SVN10-supportadres (PO-besluit 2). Leeg = zin zonder adres, nooit een lege link.
const SUPPORT_EMAIL = 'support@svn10.nl'

function veiligLogo(waarde) {
  return typeof waarde === 'string' && waarde.startsWith('data:image/') ? waarde : ''
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

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── Domeinen (structuurelementen) ────────────────────────────────────────────
// Eén begrip "domein" met twee soorten. In de database blijft het veld `type`
// 'pijler' (strategisch domein) of 'domein' (ondersteunend domein); alleen de
// weergave gebruikt de nieuwe woorden.
// Soorten domein. 'overkoepelend' (Projecten, Samenwerkingen) loopt dwars door de andere domeinen.
const SOORTEN = [['pijler', 'Pijler'], ['domein', 'Ondersteunend domein'], ['overkoepelend', 'Overkoepelend domein']]
const SOORT_LABEL = { pijler: 'Pijler', domein: 'Ondersteunend', overkoepelend: 'Overkoepelend' }
const SOORT_SUB = { pijler: 'Pijler', domein: 'Ondersteunend domein', overkoepelend: 'Overkoepelend domein' }
const SOORT_KLEUR = { pijler: '', domein: 'background:var(--orange)', overkoepelend: 'background:var(--muted)' }

// Optionele #hashtag per domein (bijv. #HCASpeelt): begint met #, geen spaties, max. 50 tekens
function hashtagFout(waarde) {
  if (!waarde) return ''
  if (!/^#[^\s#]{1,49}$/.test(waarde)) return 'Begin met # en gebruik geen spaties (max. 50 tekens)'
  return ''
}

function soortKeuzeHTML(naam, huidig) {
  return SOORTEN.map(([k, label]) => `
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--fs-lopend)">
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

async function slaaProfiel(data) {
  await setDoc(doc(db, 'clubs', huidigClubId, 'instellingen', 'profiel'), data)
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
    return typeof rol === 'string' && rol.trim() ? rol.trim() : null
  } catch {
    return null
  }
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

function topBarHTML() {
  const titel = huidigProfiel?.naam
    ? `club<b>KOMPAS</b> · ${esc(huidigProfiel.naam)}`
    : `club<b>KOMPAS</b>`
  const logoSrc = veiligLogo(huidigProfiel?.logo)
  const logo = logoSrc
    ? `<img src="${esc(logoSrc)}" class="club-logo" alt="Club logo">`
    : ''
  return `
    <header class="top-bar${logoSrc ? ' heeft-logo' : ''}">
      ${kompasIconSVG()}
      <span class="app-title">${titel}</span>
      ${logo}
    </header>`
}

function navHTML(actief) {
  return `
    <nav class="top-nav">
      <a href="#" class="nav-home${actief === 'home' ? ' active' : ''}">Home</a>
      <a href="#" class="nav-beheer${actief === 'beheer' ? ' active' : ''}">Beheer</a>
      <a href="#" class="nav-instellingen${actief === 'instellingen' ? ' active' : ''}">Instellingen</a>
    </nav>`
}

function footerHTML() {
  // Midden: OMGEVING · VERSIE; rechtsonder: NAAM · ROL (hoofdletters via de footer-stijl)
  const delen = []
  if (huidigGebruiker) delen.push(huidigGebruiker.displayName || huidigGebruiker.email)
  if (huidigeRol) delen.push(huidigeRol)
  const gebruikerLabel = delen.length ? `<span class="footer-sessie">${delen.map(esc).join(' · ')}</span>` : ''
  return `
    <footer>
      <span>clubKOMPAS · een product van SVN10</span>
      <span>${esc(OMGEVING)} · Versie ${version}</span>
      <span class="footer-rechts">
        ${gebruikerLabel}
        <button class="btn uitlog-knop" id="uitlog-knop">Uitloggen</button>
      </span>
    </footer>`
}

function bindNavListeners(gebruiker) {
  document.getElementById('uitlog-knop').addEventListener('click', () => signOut(auth))
  document.querySelector('.nav-home').addEventListener('click', e => { e.preventDefault(); renderDashboard(gebruiker) })
  document.querySelector('.nav-beheer')?.addEventListener('click', e => { e.preventDefault(); renderPijlersDomeinenBeheer(gebruiker) })
  document.querySelector('.nav-instellingen').addEventListener('click', e => { e.preventDefault(); renderInstellingen(gebruiker) })
}

// ── Structuur grid (dashboard, read-only) ────────────────────────────────────

async function renderStructuurGrid() {
  const grid = document.getElementById('structuur-grid')
  if (!grid) return
  grid.querySelectorAll('.structuur-dyn').forEach(el => el.remove())
  const items = await laadStructuurelementen()
  if (!grid.isConnected) return
  const zet = (id, waarde) => { const el = document.getElementById(id); if (el) el.textContent = waarde }
  zet('cijfer-pijlers', items.filter(i => i.type === 'pijler').length)
  zet('cijfer-domeinen', items.filter(i => i.type === 'domein').length)
  zet('cijfer-overkoepelend', items.filter(i => i.type === 'overkoepelend').length)
  if (items.length === 0) {
    const leeg = document.createElement('p')
    leeg.className = 'structuur-dyn'
    leeg.style.color = 'var(--muted)'
    leeg.textContent = 'Nog geen domeinen. Voeg ze toe via Beheer.'
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
        <div class="kaart-voet">
          <span class="pill"><span class="stip" style="${SOORT_KLEUR[item.type] || ''}"></span>${SOORT_LABEL[item.type] || ''}</span>
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
          <input class="form-input" id="inlog-email" type="email" placeholder="naam@voorbeeld.nl" autocomplete="email">
          <span class="form-fout" id="inlog-email-fout"></span>
        </div>
        <div class="form-groep">
          <label class="form-label" for="inlog-wachtwoord">Wachtwoord</label>
          <input class="form-input" id="inlog-wachtwoord" type="password" placeholder="••••••••" autocomplete="current-password">
          <span class="form-fout" id="inlog-wachtwoord-fout"></span>
        </div>
        <div class="form-fout" id="inlog-algemeen-fout"></div>
        <button class="btn primary inlog-knop" id="inlog-knop">Inloggen</button>
      </div>
    </div>
  `

  document.getElementById('inlog-knop').addEventListener('click', async () => {
    const email = document.getElementById('inlog-email').value.trim()
    const wachtwoord = document.getElementById('inlog-wachtwoord').value
    const algFout = document.getElementById('inlog-algemeen-fout')
    const emailFout = document.getElementById('inlog-email-fout')
    const wwFout = document.getElementById('inlog-wachtwoord-fout')

    emailFout.textContent = ''
    wwFout.textContent = ''
    algFout.textContent = ''

    if (!email) { emailFout.textContent = 'Verplicht veld'; return }
    if (!wachtwoord) { wwFout.textContent = 'Verplicht veld'; return }

    document.getElementById('inlog-knop').textContent = 'Bezig...'
    document.getElementById('inlog-knop').disabled = true

    try {
      await signInWithEmailAndPassword(auth, email, wachtwoord)
    } catch (e) {
      document.getElementById('inlog-knop').textContent = 'Inloggen'
      document.getElementById('inlog-knop').disabled = false
      const foutcodes = {
        'auth/invalid-credential': 'E-mailadres of wachtwoord klopt niet.',
        'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
        'auth/wrong-password': 'Wachtwoord klopt niet.',
        'auth/invalid-email': 'Ongeldig e-mailadres.',
        'auth/too-many-requests': 'Te veel pogingen. Probeer het later opnieuw.',
      }
      algFout.textContent = foutcodes[e.code] || `Fout: ${e.code}`
    }
  })

  document.getElementById('inlog-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('inlog-wachtwoord').focus()
  })
  document.getElementById('inlog-wachtwoord').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('inlog-knop').click()
  })
}

function toonTussenkaart(inhoudHTML, { laden = false } = {}) {
  document.querySelector('#app').innerHTML = `
    <div class="inlog-wrap">
      <div class="inlog-kaart">
        <div class="inlog-logo${laden ? ' laadt' : ''}">
          ${kompasIconSVG()}
          <span class="app-title">club<b>KOMPAS</b></span>
        </div>
        ${inhoudHTML}
      </div>
    </div>`
  document.getElementById('tussen-titel')?.focus()
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
    <button class="btn primary inlog-knop" id="geen-club-uitlog">Uitloggen</button>`)
  document.getElementById('geen-club-uitlog').addEventListener('click', () => signOut(auth))
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

  document.getElementById('fout-uitlog').addEventListener('click', () => signOut(auth))

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
    renderDashboard(gebruiker)
  } else if (status === 'geen-club') {
    foutPogingen = 0
    renderGeenClub(gebruiker)
  } else {
    foutPogingen = 1
    renderFoutkaart(gebruiker)
  }
}

function renderDashboard(gebruiker) {
  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('home')}

    <main>
      <div class="wrap">

        <div class="pagina-kop">
          <h1 class="pagina-titel">Domeinen<b>overzicht</b></h1>
        </div>

        <div class="cijfers cijfers-3" aria-label="Kerncijfers">
          <div class="cijfer"><span class="n" id="cijfer-pijlers">–</span><span class="l">Pijlers</span></div>
          <div class="cijfer"><span class="n" id="cijfer-domeinen">–</span><span class="l">Ondersteunende domeinen</span></div>
          <div class="cijfer"><span class="n" id="cijfer-overkoepelend">–</span><span class="l">Overkoepelende domeinen</span></div>
        </div>

        <div class="sectie">
          <div class="sectie-kop">
            <h2>Domeinen</h2>
          </div>
          <div class="sectie-lijf">
            <div class="grid" id="structuur-grid">
            </div>
            <div style="text-align:right;margin-top:8px">
              <button class="btn" id="naar-structuur-beheer">Beheer →</button>
            </div>
          </div>
        </div>

      </div>
    </main>

    ${footerHTML()}
  `

  bindNavListeners(gebruiker)
  document.getElementById('naar-structuur-beheer').addEventListener('click', () => renderPijlersDomeinenBeheer(gebruiker))

  renderStructuurGrid()
}

// Tabbladen binnen Beheer (masterdata)
function beheerTabsHTML(actief) {
  return `
        <div class="filter-tabs beheer-tabs" role="group" aria-label="Beheer">
          <button class="btn filter-knop${actief === 'domeinen' ? ' active' : ''}" data-beheer="domeinen"${actief === 'domeinen' ? ' aria-current="page"' : ''}>Domeinen</button>
          <button class="btn filter-knop${actief === 'functies' ? ' active' : ''}" data-beheer="functies"${actief === 'functies' ? ' aria-current="page"' : ''}>Bestuursfuncties</button>
        </div>`
}
function bindBeheerTabs(gebruiker) {
  document.querySelector('.beheer-tabs')?.addEventListener('click', e => {
    const knop = e.target.closest('[data-beheer]')
    if (!knop) return
    if (knop.dataset.beheer === 'functies') renderBestuursfunctiesBeheer(gebruiker)
    else renderPijlersDomeinenBeheer(gebruiker)
  })
}

async function renderPijlersDomeinenBeheer(gebruiker) {
  const functies = await laadBestuursfuncties()
  const functieNaam = new Map(functies.map(f => [f.id, f.naam]))
  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('beheer')}
    <main>
      <div class="wrap">
        ${beheerTabsHTML('domeinen')}
        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>Domeinen</h2>
          </div>
          <div class="sectie-lijf">
            <div class="filter-tabs" role="group" aria-label="Filter">
              <button class="btn filter-knop active" data-filter="alles">Alles</button>
              <button class="btn filter-knop" data-filter="pijler">Pijlers</button>
              <button class="btn filter-knop" data-filter="domein">Ondersteunend</button>
              <button class="btn filter-knop" data-filter="overkoepelend">Overkoepelend</button>
            </div>
            <div id="structuur-lijst"></div>
            <button class="btn-toevoegen" id="structuur-toevoegen-knop" style="margin-top:0">+ Toevoegen</button>
            <div class="pijler-form" id="structuur-form" hidden>
              <div class="form-groep" role="radiogroup" aria-labelledby="structuur-soort-label">
                <span class="form-label" id="structuur-soort-label">Soort</span>
                <div class="form-rij soort-keuze">
                  ${soortKeuzeHTML('structuur-type', 'pijler')}
                </div>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-naam">Naam</label>
                <input class="form-input" id="structuur-naam" name="naam" type="text" placeholder="Naam" autocomplete="off">
                <span class="form-fout" id="structuur-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-hashtag">#Hashtag</label>
                <input class="form-input" id="structuur-hashtag" type="text" placeholder="Optioneel, bijv. #HCASpeelt" autocomplete="off">
                <span class="form-fout" id="structuur-hashtag-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-omschr">Omschrijving</label>
                <input class="form-input" id="structuur-omschr" name="omschrijving" type="text" placeholder="Korte omschrijving" autocomplete="off">
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
                <button class="btn primary" id="structuur-opslaan">Opslaan</button>
                <button class="btn" id="structuur-annuleer">Annuleren</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${footerHTML()}
  `

  bindNavListeners(gebruiker)

  let actiefFilter = 'alles'

  async function laadEnRender() {
    const lijst = document.getElementById('structuur-lijst')
    if (!lijst) return
    const items = await laadStructuurelementen()
    if (!lijst.isConnected) return
    const gefilterd = actiefFilter === 'alles' ? items : items.filter(i => i.type === actiefFilter)
    if (gefilterd.length === 0) {
      lijst.innerHTML = `<p style="color:var(--muted);font-style:italic;font-size:var(--fs-toelichting)">Geen items gevonden.</p>`
      return
    }
    const kanVerplaatsen = actiefFilter === 'alles'
    const kop = `
        <div class="beheer-rij beheer-kop domein-rij" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader"><span class="sr-only">Pictogram</span></span>
          <span role="columnheader">Domein</span>
          <span role="columnheader">Soort</span>
          <span role="columnheader">Eindverantwoordelijke</span>
          <span role="columnheader"><span class="sr-only">Acties</span></span>
        </div>`
    lijst.setAttribute('role', 'table')
    lijst.setAttribute('aria-label', 'Domeinen')
    lijst.innerHTML = kop + gefilterd.map((item, i) => {
      // Verplaatsknoppen alleen bij "Alles"; anders onzichtbaar zodat de kolommen gelijk blijven
      const verborgen = kanVerplaatsen ? '' : ' onzichtbaar" tabindex="-1" aria-hidden="true'
      return `
        <div class="structuur-rij beheer-rij domein-rij" role="row" data-id="${esc(item.id)}">
          <span class="cel-nr" role="cell">${kanVerplaatsen ? i + 1 : ''}</span>
          <span class="cel-picto" role="cell">${pictogramHTML(item, 'picto-klein')}</span>
          <strong class="cel-naam" role="cell">${esc(item.naam)}</strong>
          <span role="cell"><span class="pill" style="margin-top:0"><span class="stip" style="${SOORT_KLEUR[item.type] || ''}"></span>${SOORT_LABEL[item.type] || ''}</span></span>
          <span class="cel-functie" role="cell">${esc(functieNaam.get(item.bestuursfunctieId) || '—')}</span>
          <div class="kaart-acties cel-acties" role="cell">
            <button class="btn-kaart-actie btn-volgorde${verborgen}" data-actie="omhoog" data-id="${esc(item.id)}" aria-label="${esc(item.naam)} omhoog"${!kanVerplaatsen || i === 0 ? ' disabled' : ''}>↑</button>
            <button class="btn-kaart-actie btn-volgorde${verborgen}" data-actie="omlaag" data-id="${esc(item.id)}" aria-label="${esc(item.naam)} omlaag"${!kanVerplaatsen || i === gefilterd.length - 1 ? ' disabled' : ''}>↓</button>
            <button class="btn-kaart-actie" data-actie="bewerk" data-id="${esc(item.id)}">Bewerken</button>
            <button class="btn-kaart-actie gevaar" data-actie="verwijder" data-id="${esc(item.id)}">Verwijderen</button>
          </div>
        </div>`
    }).join('')
  }

  bindBeheerTabs(gebruiker)
  await laadEnRender()

  document.querySelector('.filter-tabs:not(.beheer-tabs)').addEventListener('click', async e => {
    const knop = e.target.closest('.filter-knop')
    if (!knop) return
    knop.closest('.filter-tabs').querySelectorAll('.filter-knop').forEach(k => k.classList.remove('active'))
    knop.classList.add('active')
    actiefFilter = knop.dataset.filter
    await laadEnRender()
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
    ;['structuur-naam-fout', 'structuur-omschr-fout', 'structuur-verantw-fout'].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.textContent = ''
    })
  }

  document.getElementById('structuur-annuleer').addEventListener('click', resetForm)

  document.getElementById('structuur-opslaan').addEventListener('click', async () => {
    const type = document.querySelector('[name="structuur-type"]:checked').value
    const naamEl = document.getElementById('structuur-naam')
    const omschrEl = document.getElementById('structuur-omschr')
    const verAntwEl = document.getElementById('structuur-verantw')
    let ok = true

    const checks = [
      [naamEl, 'structuur-naam-fout', 2],
      [omschrEl, 'structuur-omschr-fout', 2],
      [verAntwEl, 'structuur-verantw-fout', 1]
    ]
    checks.forEach(([el, foutId, min]) => {
      const fout = document.getElementById(foutId)
      if (!el.value.trim() || el.value.trim().length < min) {
        fout.textContent = el.value.trim() ? `Minimaal ${min} tekens` : (foutId === 'structuur-verantw-fout' ? 'Kies een bestuursfunctie' : 'Verplicht veld')
        el.classList.add('fout'); el.setAttribute('aria-invalid', 'true'); ok = false
      } else {
        fout.textContent = ''; el.classList.remove('fout'); el.removeAttribute('aria-invalid')
      }
    })
    const hashtag = document.getElementById('structuur-hashtag').value.trim()
    const tagFout = hashtagFout(hashtag)
    document.getElementById('structuur-hashtag-fout').textContent = tagFout
    if (tagFout) ok = false
    if (!ok) return

    const bestaand = await laadStructuurelementen()
    const hoogste = bestaand.reduce((m, x) => (typeof x.volgorde === 'number' ? Math.max(m, x.volgorde) : m), 0)
    const item = {
      type, naam: naamEl.value.trim(), hashtag, omschrijving: omschrEl.value.trim(), bestuursfunctieId: verAntwEl.value,
      icoon: document.getElementById('structuur-icoon').value, volgorde: hoogste + 1,
    }
    await voegStructuurelementToe(item)
    resetForm()
    await laadEnRender()
  })

  document.getElementById('structuur-lijst').addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    const actie = knop.dataset.actie
    const id = knop.dataset.id
    const rij = knop.closest('.structuur-rij')

    if (actie === 'omhoog' || actie === 'omlaag') {
      const items = await laadStructuurelementen()
      const i = items.findIndex(x => x.id === id)
      const j = actie === 'omhoog' ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= items.length) return
      ;[items[i], items[j]] = [items[j], items[i]]
      // Hernummer 1 t/m n en schrijf alleen wat veranderd is
      await Promise.all(items.map((x, k) => (x.volgorde === k + 1 ? null : bewerkStructuurelement(x.id, { volgorde: k + 1 }))))
      await laadEnRender()
      // Focus blijft bij het verplaatste domein
      const knopNa = document.querySelector(`[data-actie="${actie}"][data-id="${id}"]`)
      ;(knopNa && !knopNa.disabled ? knopNa : document.querySelector(`[data-actie="bewerk"][data-id="${id}"]`))?.focus()
    } else if (actie === 'verwijder') {
      if (confirm('Item verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        await verwijderStructuurelement(id)
        await laadEnRender()
      }
    } else if (actie === 'bewerk') {
      const items = await laadStructuurelementen()
      const item = items.find(x => x.id === id)
      if (!item) return
      const isPijler = item.type === 'pijler'
      rij.classList.add('bewerken')
      rij.innerHTML = `
        <div class="pijler-bewerk-form" style="width:100%">
          <div class="form-groep" role="radiogroup" aria-labelledby="bs-${esc(id)}">
            <span class="form-label" id="bs-${esc(id)}">Soort</span>
            <div class="form-rij soort-keuze">
              ${soortKeuzeHTML(`bewerk-type-${id}`, item.type)}
            </div>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bn-${esc(id)}">Naam</label>
            <input class="form-input" id="bn-${esc(id)}" value="${esc(item.naam)}" autocomplete="off">
            <span class="form-fout" id="bn-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bh-${esc(id)}">#Hashtag</label>
            <input class="form-input" id="bh-${esc(id)}" value="${esc(item.hashtag || '')}" placeholder="Optioneel, bijv. #HCASpeelt" autocomplete="off">
            <span class="form-fout" id="bh-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label" for="bo-${esc(id)}">Omschrijving</label>
            <input class="form-input" id="bo-${esc(id)}" value="${esc(item.omschrijving || '')}" autocomplete="off">
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
            <button class="btn primary" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
        </div>`
      document.getElementById(`bn-${id}`)?.focus()
    } else if (actie === 'bewerk-opslaan') {
      const type = rij.querySelector(`[name="bewerk-type-${id}"]:checked`)?.value
      const naam = document.getElementById(`bn-${id}`)?.value.trim()
      const omschr = document.getElementById(`bo-${id}`)?.value.trim()
      const verantw = document.getElementById(`bv-${id}`)?.value.trim()
      let ok = true
      const checks = [
        [naam, `bn-fout-${id}`, 2],
        [omschr, `bo-fout-${id}`, 2],
        [verantw, `bv-fout-${id}`, 1]
      ]
      checks.forEach(([val, foutId, min]) => {
        const el = document.getElementById(foutId)
        if (!val || val.length < min) { el.textContent = val ? `Minimaal ${min} tekens` : (foutId.startsWith('bv-') ? 'Kies een bestuursfunctie' : 'Verplicht veld'); ok = false }
        else el.textContent = ''
      })
      const hashtag = document.getElementById(`bh-${id}`)?.value.trim() || ''
      const tagFout = hashtagFout(hashtag)
      document.getElementById(`bh-fout-${id}`).textContent = tagFout
      if (tagFout) ok = false
      if (!ok) return
      const icoon = document.getElementById(`bi-${id}`)?.value || ''
      const data = { type, naam, hashtag, omschrijving: omschr, bestuursfunctieId: verantw, icoon }
      await bewerkStructuurelement(id, data)
      await laadEnRender()
    } else if (actie === 'bewerk-annuleer') {
      await laadEnRender()
    }
  })
}

async function renderBestuursfunctiesBeheer(gebruiker) {
  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('beheer')}
    <main>
      <div class="wrap">
        ${beheerTabsHTML('functies')}
        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>Bestuursfuncties</h2>
          </div>
          <div class="sectie-lijf">
            <div id="functie-lijst"></div>
            <p class="form-fout" id="functie-melding" role="status"></p>
            <button class="btn-toevoegen" id="functie-toevoegen-knop" style="margin-top:0">+ Toevoegen</button>
            <div class="pijler-form" id="functie-form" hidden>
              <div class="form-groep">
                <label class="form-label" for="functie-naam">Naam</label>
                <input class="form-input" id="functie-naam" type="text" placeholder="Bijv. Bestuurslid Hockey" autocomplete="off">
                <span class="form-fout" id="functie-naam-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn primary" id="functie-opslaan">Opslaan</button>
                <button class="btn" id="functie-annuleer">Annuleren</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${footerHTML()}
  `
  bindNavListeners(gebruiker)
  bindBeheerTabs(gebruiker)

  const melding = tekst => { const el = document.getElementById('functie-melding'); if (el) el.textContent = tekst }
  const geldigeNaam = naam => naam.length >= 2 && naam.length <= 100

  async function laadEnRender() {
    const lijst = document.getElementById('functie-lijst')
    if (!lijst) return
    const [functies, domeinen] = await Promise.all([laadBestuursfuncties(), laadStructuurelementen()])
    if (!lijst.isConnected) return
    if (functies.length === 0) {
      lijst.innerHTML = `<p style="color:var(--muted);font-style:italic;font-size:var(--fs-toelichting)">Nog geen bestuursfuncties.</p>`
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
      const aantal = domeinen.filter(d => d.bestuursfunctieId === f.id).length
      return `
        <div class="structuur-rij beheer-rij functie-rij" role="row" data-id="${esc(f.id)}">
          <span class="cel-nr" role="cell">${i + 1}</span>
          <strong class="cel-naam" role="cell">${esc(f.naam)}</strong>
          <span class="cel-functie" role="cell">${aantal === 0 ? 'Geen domeinen' : aantal === 1 ? '1 domein' : `${aantal} domeinen`}</span>
          <div class="kaart-acties cel-acties" role="cell">
            <button class="btn-kaart-actie btn-volgorde" data-actie="omhoog" data-id="${esc(f.id)}" aria-label="${esc(f.naam)} omhoog"${i === 0 ? ' disabled' : ''}>↑</button>
            <button class="btn-kaart-actie btn-volgorde" data-actie="omlaag" data-id="${esc(f.id)}" aria-label="${esc(f.naam)} omlaag"${i === functies.length - 1 ? ' disabled' : ''}>↓</button>
            <button class="btn-kaart-actie" data-actie="bewerk" data-id="${esc(f.id)}">Bewerken</button>
            <button class="btn-kaart-actie gevaar" data-actie="verwijder" data-id="${esc(f.id)}" data-aantal="${aantal}">Verwijderen</button>
          </div>
        </div>`
    }).join('')
  }

  await laadEnRender()

  const resetForm = () => {
    document.getElementById('functie-form').hidden = true
    document.getElementById('functie-toevoegen-knop').hidden = false
    document.getElementById('functie-naam').value = ''
    document.getElementById('functie-naam-fout').textContent = ''
  }
  document.getElementById('functie-toevoegen-knop').addEventListener('click', () => {
    document.getElementById('functie-form').hidden = false
    document.getElementById('functie-toevoegen-knop').hidden = true
    document.getElementById('functie-naam').focus()
  })
  document.getElementById('functie-annuleer').addEventListener('click', resetForm)
  document.getElementById('functie-opslaan').addEventListener('click', async () => {
    const naam = document.getElementById('functie-naam').value.trim()
    const fout = document.getElementById('functie-naam-fout')
    if (!geldigeNaam(naam)) { fout.textContent = naam ? 'Tussen 2 en 100 tekens' : 'Verplicht veld'; return }
    const functies = await laadBestuursfuncties()
    if (functies.some(f => f.naam.toLowerCase() === naam.toLowerCase())) { fout.textContent = 'Deze bestuursfunctie bestaat al'; return }
    const hoogste = functies.reduce((m, x) => (typeof x.volgorde === 'number' ? Math.max(m, x.volgorde) : m), 0)
    try {
      await voegBestuursfunctieToe({ naam, volgorde: hoogste + 1 })
      resetForm(); melding('')
      await laadEnRender()
    } catch { fout.textContent = 'Opslaan mislukt, probeer opnieuw.' }
  })

  document.getElementById('functie-lijst').addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    const { actie, id } = knop.dataset
    const rij = knop.closest('.structuur-rij')
    melding('')
    if (actie === 'omhoog' || actie === 'omlaag') {
      const functies = await laadBestuursfuncties()
      const i = functies.findIndex(x => x.id === id)
      const j = actie === 'omhoog' ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= functies.length) return
      ;[functies[i], functies[j]] = [functies[j], functies[i]]
      await Promise.all(functies.map((x, k) => (x.volgorde === k + 1 ? null : bewerkBestuursfunctie(x.id, { volgorde: k + 1 }))))
      await laadEnRender()
      const knopNa = document.querySelector(`#functie-lijst [data-actie="${actie}"][data-id="${id}"]`)
      ;(knopNa && !knopNa.disabled ? knopNa : document.querySelector(`#functie-lijst [data-actie="bewerk"][data-id="${id}"]`))?.focus()
    } else if (actie === 'verwijder') {
      // Masterdata: een functie die nog bij een domein hoort, kan niet weg
      const aantal = Number(knop.dataset.aantal || 0)
      if (aantal > 0) { melding(`Deze bestuursfunctie is nog eindverantwoordelijke van ${aantal === 1 ? '1 domein' : `${aantal} domeinen`}. Kies daar eerst een andere bestuursfunctie.`); return }
      if (confirm('Bestuursfunctie verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        await verwijderBestuursfunctie(id)
        await laadEnRender()
      }
    } else if (actie === 'bewerk') {
      const f = (await laadBestuursfuncties()).find(x => x.id === id)
      if (!f) return
      rij.classList.add('bewerken')
      rij.innerHTML = `
        <div class="pijler-bewerk-form" style="width:100%">
          <div class="form-groep">
            <label class="form-label" for="fn-${esc(id)}">Naam</label>
            <input class="form-input" id="fn-${esc(id)}" value="${esc(f.naam)}" autocomplete="off">
            <span class="form-fout" id="fn-fout-${esc(id)}"></span>
          </div>
          <div class="form-rij">
            <button class="btn primary" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
        </div>`
      document.getElementById(`fn-${id}`)?.focus()
    } else if (actie === 'bewerk-opslaan') {
      const naam = document.getElementById(`fn-${id}`)?.value.trim() || ''
      const fout = document.getElementById(`fn-fout-${id}`)
      if (!geldigeNaam(naam)) { fout.textContent = naam ? 'Tussen 2 en 100 tekens' : 'Verplicht veld'; return }
      const functies = await laadBestuursfuncties()
      if (functies.some(x => x.id !== id && x.naam.toLowerCase() === naam.toLowerCase())) { fout.textContent = 'Deze bestuursfunctie bestaat al'; return }
      try {
        await bewerkBestuursfunctie(id, { naam })
        await laadEnRender()
      } catch { fout.textContent = 'Opslaan mislukt, probeer opnieuw.' }
    } else if (actie === 'bewerk-annuleer') {
      await laadEnRender()
    }
  })
}

function renderInstellingen(gebruiker) {
  const logoSrc = veiligLogo(huidigProfiel?.logo)
  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('instellingen')}

    <main>
      <div class="wrap">
        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>Clubprofiel</h2>
          </div>
          <div class="sectie-lijf">
            <div class="profiel-form-wrap">
              <div class="form-groep">
                <label class="form-label" for="profiel-naam">Clubnaam</label>
                <input class="form-input" id="profiel-naam" type="text" placeholder="Volledige naam van de club" autocomplete="off" value="${esc(huidigProfiel?.naam || '')}">
                <span class="form-fout" id="profiel-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="profiel-afkorting">Afkorting</label>
                <input class="form-input" id="profiel-afkorting" type="text" placeholder="bv. FCE" autocomplete="off" value="${esc(huidigProfiel?.afkorting || '')}">
                <span class="form-fout" id="profiel-afkorting-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="profiel-seizoen">Huidig seizoen</label>
                <input class="form-input" id="profiel-seizoen" type="text" placeholder="bv. 2026–2027" autocomplete="off" value="${esc(huidigProfiel?.seizoen || '')}">
                <span class="form-fout" id="profiel-seizoen-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn primary" id="profiel-opslaan">Opslaan</button>
              </div>
              <p class="profiel-succes" id="profiel-succes" hidden>✓ Profiel opgeslagen.</p>
            </div>
          </div>
        </div>

        <div class="sectie">
          <div class="sectie-kop">
            <h2>Clublogo</h2>
          </div>
          <div class="sectie-lijf">
            <div class="logo-upload-wrap">
              ${logoSrc
                ? `<img src="${esc(logoSrc)}" class="logo-preview" alt="Huidig logo">`
                : `<div class="logo-leeg">Nog geen logo geüpload</div>`}
              <div class="form-rij" style="margin-top:12px">
                <label class="btn" style="cursor:pointer">
                  <span>${logoSrc ? 'Logo wijzigen' : 'Logo uploaden'}</span>
                  <input type="file" id="logo-input" accept="image/*" hidden>
                </label>
                ${logoSrc
                  ? `<button class="btn gevaar" id="logo-verwijderen">Verwijderen</button>`
                  : ''}
              </div>
              <p class="profiel-succes" id="logo-succes" hidden>✓ Logo opgeslagen.</p>
            </div>
          </div>
        </div>

        <div class="sectie">
          <div class="sectie-kop">
            <h2>Gebruiker</h2>
          </div>
          <div class="sectie-lijf">
            <div class="profiel-form-wrap">

              <div class="form-groep">
                <label class="form-label" for="geb-naam">Naam</label>
                <input class="form-input" id="geb-naam" type="text" placeholder="Jouw naam" autocomplete="name" value="${esc(huidigGebruiker?.displayName || '')}">
                <span class="form-fout" id="geb-naam-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn primary" id="geb-naam-opslaan">Naam opslaan</button>
              </div>
              <p class="profiel-succes" id="geb-naam-succes" hidden>✓ Naam opgeslagen.</p>

              <hr class="sectie-hr">

              <p class="geb-info">Huidig e-mailadres: ${esc(huidigGebruiker?.email || '')}</p>
              <div class="form-groep">
                <label class="form-label" for="geb-email">Nieuw e-mailadres</label>
                <input class="form-input" id="geb-email" type="email" placeholder="nieuw@voorbeeld.nl" autocomplete="off">
                <span class="form-fout" id="geb-email-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="geb-email-ww">Wachtwoord ter bevestiging</label>
                <input class="form-input" id="geb-email-ww" type="password" placeholder="••••••••" autocomplete="current-password">
                <span class="form-fout" id="geb-email-ww-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn primary" id="geb-email-opslaan">E-mailadres wijzigen</button>
              </div>
              <p class="profiel-succes" id="geb-email-succes" hidden>✓ E-mailadres gewijzigd.</p>

              <hr class="sectie-hr">

              <div class="form-groep">
                <label class="form-label" for="geb-huidig-ww">Huidig wachtwoord</label>
                <input class="form-input" id="geb-huidig-ww" type="password" placeholder="••••••••" autocomplete="current-password">
                <span class="form-fout" id="geb-huidig-ww-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="geb-nieuw-ww">Nieuw wachtwoord</label>
                <input class="form-input" id="geb-nieuw-ww" type="password" placeholder="Minimaal 8 tekens" autocomplete="new-password">
                <span class="form-fout" id="geb-nieuw-ww-fout"></span>
              </div>
              <div class="form-rij">
                <button class="btn primary" id="geb-ww-opslaan">Wachtwoord wijzigen</button>
              </div>
              <p class="profiel-succes" id="geb-ww-succes" hidden>✓ Wachtwoord gewijzigd.</p>

            </div>
          </div>
        </div>

        <div class="sectie">
          <div class="sectie-kop">
            <h2>Over clubKOMPAS</h2>
          </div>
          <div class="sectie-lijf">
            <dl class="versie-info">
              <dt>Versie</dt><dd>v${version}</dd>
              <dt>Gebouwd op</dt><dd>${new Date(__APP_BUILD__).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })}</dd>
            </dl>
          </div>
        </div>

      </div>
    </main>

    ${footerHTML()}
  `

  bindNavListeners(gebruiker)

  document.getElementById('logo-input').addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    const knop = e.target.closest('label')
    knop.querySelector('span').textContent = 'Bezig...'
    try {
      const base64 = await resizeAfbeelding(file)
      const nieuwProfiel = { ...(huidigProfiel || {}), logo: base64 }
      await slaaProfiel(nieuwProfiel)
      huidigProfiel = nieuwProfiel
      setFavicon(base64)
      renderInstellingen(gebruiker)
    } catch {
      knop.querySelector('span').textContent = 'Fout — probeer opnieuw'
    }
  })

  const verwijderKnop = document.getElementById('logo-verwijderen')
  if (verwijderKnop) {
    verwijderKnop.addEventListener('click', async () => {
      const { logo: _removed, ...rest } = huidigProfiel || {}
      await slaaProfiel(rest)
      huidigProfiel = rest
      setFavicon('')
      renderInstellingen(gebruiker)
    })
  }

  document.getElementById('profiel-opslaan').addEventListener('click', async () => {
    const naam = document.getElementById('profiel-naam').value.trim()
    const afkorting = document.getElementById('profiel-afkorting').value.trim()
    const seizoen = document.getElementById('profiel-seizoen').value.trim()

    let ok = true
    const checks = [
      [naam, 'profiel-naam-fout', 2],
      [afkorting, 'profiel-afkorting-fout', 2],
      [seizoen, 'profiel-seizoen-fout', 4],
    ]
    checks.forEach(([val, foutId, min]) => {
      const el = document.getElementById(foutId)
      if (!val || val.length < min) { el.textContent = val ? `Minimaal ${min} tekens` : 'Verplicht veld'; ok = false }
      else el.textContent = ''
    })
    if (!ok) return

    const nieuwProfiel = { ...(huidigProfiel || {}), naam, afkorting, seizoen }
    try {
      await slaaProfiel(nieuwProfiel)
      huidigProfiel = nieuwProfiel
      renderInstellingen(gebruiker)
    } catch {
      document.getElementById('profiel-naam-fout').textContent = 'Opslaan mislukt, probeer opnieuw.'
    }
  })

  document.getElementById('geb-naam-opslaan').addEventListener('click', async () => {
    const naam = document.getElementById('geb-naam').value.trim()
    const naamFout = document.getElementById('geb-naam-fout')
    naamFout.textContent = ''
    if (!naam || naam.length < 2) {
      naamFout.textContent = naam ? 'Minimaal 2 tekens' : 'Verplicht veld'
      return
    }
    const knop = document.getElementById('geb-naam-opslaan')
    knop.textContent = 'Bezig...'
    knop.disabled = true
    try {
      await updateProfile(huidigGebruiker, { displayName: naam })
      document.getElementById('geb-naam-succes').hidden = false
      const footerSpan = document.querySelector('footer .footer-rechts span')
      if (footerSpan) footerSpan.textContent = huidigGebruiker.displayName || huidigGebruiker.email
    } catch (e) {
      naamFout.textContent = `Fout: ${e.code || e.message}`
    } finally {
      knop.textContent = 'Naam opslaan'
      knop.disabled = false
    }
  })

  document.getElementById('geb-email-opslaan').addEventListener('click', async () => {
    const email = document.getElementById('geb-email').value.trim()
    const ww = document.getElementById('geb-email-ww').value
    const fout = document.getElementById('geb-email-fout')
    const wwFout = document.getElementById('geb-email-ww-fout')
    fout.textContent = ''
    wwFout.textContent = ''
    if (!email) { fout.textContent = 'E-mailadres verplicht'; return }
    if (!ww) { wwFout.textContent = 'Wachtwoord verplicht'; return }
    const knop = document.getElementById('geb-email-opslaan')
    knop.textContent = 'Bezig...'
    knop.disabled = true
    try {
      const credential = EmailAuthProvider.credential(huidigGebruiker.email, ww)
      await reauthenticateWithCredential(huidigGebruiker, credential)
      await verifyBeforeUpdateEmail(huidigGebruiker, email)
      const succesEl = document.getElementById('geb-email-succes')
      succesEl.textContent = `✓ Verificatiemail gestuurd naar ${email}.`
      succesEl.hidden = false
      document.getElementById('geb-email').value = ''
      document.getElementById('geb-email-ww').value = ''
    } catch (e) {
      const foutcodes = {
        'auth/wrong-password': 'Wachtwoord klopt niet.',
        'auth/invalid-credential': 'Wachtwoord klopt niet.',
        'auth/email-already-in-use': 'Dit e-mailadres is al in gebruik.',
        'auth/invalid-email': 'Ongeldig e-mailadres.',
        'auth/operation-not-allowed': 'E-mailwijziging niet toegestaan in dit project.',
      }
      fout.textContent = foutcodes[e.code] || `Fout: ${e.code}`
    } finally {
      knop.textContent = 'E-mailadres wijzigen'
      knop.disabled = false
    }
  })

  document.getElementById('geb-ww-opslaan').addEventListener('click', async () => {
    const huidigWw = document.getElementById('geb-huidig-ww').value
    const nieuwWw = document.getElementById('geb-nieuw-ww').value
    const huidigFout = document.getElementById('geb-huidig-ww-fout')
    const nieuwFout = document.getElementById('geb-nieuw-ww-fout')
    huidigFout.textContent = ''
    nieuwFout.textContent = ''
    if (!huidigWw) { huidigFout.textContent = 'Verplicht veld'; return }
    if (!nieuwWw || nieuwWw.length < 8) { nieuwFout.textContent = nieuwWw ? 'Minimaal 8 tekens' : 'Verplicht veld'; return }
    const knop = document.getElementById('geb-ww-opslaan')
    knop.textContent = 'Bezig...'
    knop.disabled = true
    try {
      const credential = EmailAuthProvider.credential(huidigGebruiker.email, huidigWw)
      await reauthenticateWithCredential(huidigGebruiker, credential)
      await updatePassword(huidigGebruiker, nieuwWw)
      document.getElementById('geb-ww-succes').hidden = false
      document.getElementById('geb-huidig-ww').value = ''
      document.getElementById('geb-nieuw-ww').value = ''
    } catch (e) {
      const foutcodes = {
        'auth/wrong-password': 'Wachtwoord klopt niet.',
        'auth/invalid-credential': 'Wachtwoord klopt niet.',
        'auth/weak-password': 'Nieuw wachtwoord is te zwak.',
      }
      huidigFout.textContent = foutcodes[e.code] || `Fout: ${e.code}`
    } finally {
      knop.textContent = 'Wachtwoord wijzigen'
      knop.disabled = false
    }
  })
}

onAuthStateChanged(auth, async gebruiker => {
  clearTimeout(laadTimer)
  laadTimer = null
  if (gebruiker) {
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
    setFavicon('')
    renderInlogscherm()
  }
})
