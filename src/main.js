import './style.css'
import { auth, db } from './firebase.js'
import { version } from '../package.json'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

let huidigClubId = null
let huidigProfiel = null
let huidigGebruiker = null
let laadTimer = null
let foutPogingen = 0

// Algemeen SVN10-supportadres (PO-besluit 2). Leeg = zin zonder adres, nooit een lege link.
const SUPPORT_EMAIL = ''

function veiligLogo(waarde) {
  return typeof waarde === 'string' && waarde.startsWith('data:image/') ? waarde : ''
}

// Zet het clublogo als favicon, of zet het standaard kompas-icoon terug als er geen logo is.
// Het type moet meeveranderen: met type="image/svg+xml" negeren browsers een PNG/JPEG-logo.
function setFavicon(base64) {
  const link = document.getElementById('favicon')
  if (!link) return
  const logo = veiligLogo(base64)
  if (logo) {
    link.type = logo.slice(5, logo.indexOf(';'))
    link.href = logo
  } else {
    link.type = 'image/svg+xml'
    link.href = '/favicon.svg'
  }
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

// ── Structuurelementen (pijlers & domeinen in één collectie) ──────────────────

async function laadStructuurelementen() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'structuurelementen'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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

async function laadClub(gebruiker) {
  huidigClubId = null
  huidigProfiel = null
  try {
    const clubId = await bepaalClubId(gebruiker)
    if (huidigGebruiker?.uid !== gebruiker.uid) return { status: 'afgebroken' }
    if (!clubId) return { status: 'geen-club' }
    huidigClubId = clubId
    const profiel = await laadProfiel()
    if (huidigGebruiker?.uid !== gebruiker.uid) return { status: 'afgebroken' }
    huidigProfiel = profiel
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
      <a href="#" class="nav-structuur${actief === 'structuur' ? ' active' : ''}">Pijlers &amp; Domeinen</a>
      <a href="#" class="nav-instellingen${actief === 'instellingen' ? ' active' : ''}">Instellingen</a>
    </nav>`
}

function footerHTML() {
  const gebruikerLabel = huidigGebruiker
    ? `<span>${esc(huidigGebruiker.displayName || huidigGebruiker.email)}</span>`
    : ''
  return `
    <footer>
      <span>clubKOMPAS · een product van SVN10</span>
      <span>Versie ${version}</span>
      <span class="footer-rechts">
        ${gebruikerLabel}
        <button class="btn uitlog-knop" id="uitlog-knop">Uitloggen</button>
      </span>
    </footer>`
}

function bindNavListeners(gebruiker) {
  document.getElementById('uitlog-knop').addEventListener('click', () => signOut(auth))
  document.querySelector('.nav-home').addEventListener('click', e => { e.preventDefault(); renderDashboard(gebruiker) })
  document.querySelector('.nav-structuur')?.addEventListener('click', e => { e.preventDefault(); renderPijlersDomeinenBeheer(gebruiker) })
  document.querySelector('.nav-instellingen').addEventListener('click', e => { e.preventDefault(); renderInstellingen(gebruiker) })
}

// ── Structuur grid (dashboard, read-only) ────────────────────────────────────

async function renderStructuurGrid() {
  const grid = document.getElementById('structuur-grid')
  if (!grid) return
  grid.querySelectorAll('.structuur-dyn').forEach(el => el.remove())
  const items = await laadStructuurelementen()
  if (!grid.isConnected) return
  const telPijlers = document.getElementById('cijfer-pijlers')
  const telDomeinen = document.getElementById('cijfer-domeinen')
  if (telPijlers) telPijlers.textContent = items.filter(i => i.type === 'pijler').length
  if (telDomeinen) telDomeinen.textContent = items.filter(i => i.type === 'domein').length
  if (items.length === 0) {
    const leeg = document.createElement('p')
    leeg.className = 'structuur-dyn'
    leeg.style.color = 'var(--muted)'
    leeg.textContent = 'Nog geen pijlers of domeinen. Voeg ze toe via Beheer.'
    grid.appendChild(leeg)
    return
  }
  items.forEach(item => {
    const isPijler = item.type === 'pijler'
    const div = document.createElement('div')
    div.className = 'structuur-dyn'
    div.innerHTML = `
      <div class="card">
        <h3>${esc(item.naam)}</h3>
        <div class="sub">${isPijler ? 'Strategische pijler' : 'Domein'}</div>
        <p>${esc(item.omschrijving || '')}</p>
        <span class="pill"><span class="stip" style="${isPijler ? '' : 'background:var(--orange)'}"></span>${isPijler ? 'Pijler' : 'Domein'}</span>
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
  const sectieKopTitel = huidigProfiel?.naam
    ? esc(huidigProfiel.naam)
    : 'Verenigingsbeheer voor sportclubs'
  const sectieKopToel = huidigProfiel?.seizoen
    ? `Seizoen ${esc(huidigProfiel.seizoen)}`
    : 'Jouw club. Jouw kompas.'

  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('home')}

    <main>
      <div class="wrap">

        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>${sectieKopTitel}</h2>
            <span class="toel">${sectieKopToel}</span>
          </div>
          <div class="sectie-lijf">
            <div class="kolommen">
              <div class="hero-tekst">
                <h1>Alles wat je club <b>kan</b>, op één plek.</h1>
                <p>
                  clubKOMPAS geeft sportclubs overzicht over hun pijlers, domeinen en
                  vermogens — van ledenbeheer tot sponsoring, van strategie tot activiteiten.
                  Ontworpen voor bestuurders die meer willen doen en minder willen zoeken.
                </p>
                <div class="hero-rij">
                  <button class="btn primary">Kom met ons in contact</button>
                  <button class="btn">Meer informatie</button>
                </div>
              </div>
              <div>
                <div class="cijfers" style="grid-template-columns:repeat(2,1fr);margin-bottom:0">
                  <div class="cijfer"><span class="n" id="cijfer-pijlers">–</span><span class="l">Strategische pijlers</span></div>
                  <div class="cijfer"><span class="n" id="cijfer-domeinen">–</span><span class="l">Operationele domeinen</span></div>
                  <div class="cijfer"><span class="n">∞</span><span class="l">Vermogens per club</span></div>
                  <div class="cijfer"><span class="n">1</span><span class="l">Overzicht voor alles</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sectie">
          <div class="sectie-kop">
            <h2>Pijlers &amp; Domeinen</h2>
            <span class="toel">De structuur van jouw club</span>
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

async function renderPijlersDomeinenBeheer(gebruiker) {
  document.querySelector('#app').innerHTML = `
    ${topBarHTML()}
    ${navHTML('structuur')}
    <main>
      <div class="wrap">
        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>Pijlers &amp; Domeinen</h2>
            <span class="toel">Structuur van jouw club</span>
          </div>
          <div class="sectie-lijf">
            <div class="filter-tabs" role="group" aria-label="Filter">
              <button class="btn filter-knop active" data-filter="alles">Alles</button>
              <button class="btn filter-knop" data-filter="pijler">Pijlers</button>
              <button class="btn filter-knop" data-filter="domein">Domeinen</button>
            </div>
            <div id="structuur-lijst"></div>
            <button class="btn-toevoegen" id="structuur-toevoegen-knop" style="margin-top:0">+ Toevoegen</button>
            <div class="pijler-form" id="structuur-form" hidden>
              <div class="form-groep">
                <span class="form-label">Type</span>
                <div class="form-rij" style="gap:16px;margin-top:4px">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px">
                    <input type="radio" name="structuur-type" value="pijler" checked> Pijler
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px">
                    <input type="radio" name="structuur-type" value="domein"> Domein
                  </label>
                </div>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-naam">Naam</label>
                <input class="form-input" id="structuur-naam" name="naam" type="text" placeholder="Naam" autocomplete="off">
                <span class="form-fout" id="structuur-naam-fout"></span>
              </div>
              <div class="form-groep">
                <label class="form-label" for="structuur-omschr">Omschrijving</label>
                <input class="form-input" id="structuur-omschr" name="omschrijving" type="text" placeholder="Korte omschrijving" autocomplete="off">
                <span class="form-fout" id="structuur-omschr-fout"></span>
              </div>
              <div class="form-groep" id="structuur-verantw-groep">
                <label class="form-label" for="structuur-verantw">Eindverantwoordelijke</label>
                <input class="form-input" id="structuur-verantw" name="verantwoordelijke" type="text" placeholder="Naam" autocomplete="off">
                <span class="form-fout" id="structuur-verantw-fout"></span>
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
      lijst.innerHTML = `<p style="color:var(--muted);font-style:italic;font-size:13px">Geen items gevonden.</p>`
      return
    }
    lijst.innerHTML = gefilterd.map(item => {
      const isPijler = item.type === 'pijler'
      return `
        <div class="structuur-rij" data-id="${esc(item.id)}">
          <div class="structuur-rij-info">
            <strong>${esc(item.naam)}</strong>
            <span class="pill" style="margin-top:0"><span class="stip" style="${isPijler ? '' : 'background:var(--orange)'}"></span>${isPijler ? 'Pijler' : 'Domein'}</span>
            ${item.omschrijving ? `<span style="color:var(--muted);font-size:13px">${esc(item.omschrijving)}</span>` : ''}
          </div>
          <div class="kaart-acties" style="margin-top:0;flex-shrink:0">
            <button class="btn-kaart-actie" data-actie="bewerk" data-id="${esc(item.id)}">Bewerken</button>
            <button class="btn-kaart-actie gevaar" data-actie="verwijder" data-id="${esc(item.id)}">Verwijderen</button>
          </div>
        </div>`
    }).join('')
  }

  await laadEnRender()

  document.querySelector('.filter-tabs').addEventListener('click', async e => {
    const knop = e.target.closest('.filter-knop')
    if (!knop) return
    document.querySelectorAll('.filter-knop').forEach(k => k.classList.remove('active'))
    knop.classList.add('active')
    actiefFilter = knop.dataset.filter
    await laadEnRender()
  })

  document.querySelectorAll('[name="structuur-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const groep = document.getElementById('structuur-verantw-groep')
      if (groep) groep.hidden = document.querySelector('[name="structuur-type"]:checked').value === 'domein'
    })
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
    document.getElementById('structuur-omschr').value = ''
    document.getElementById('structuur-verantw').value = ''
    const radios = document.querySelectorAll('[name="structuur-type"]')
    if (radios[0]) radios[0].checked = true
    const groep = document.getElementById('structuur-verantw-groep')
    if (groep) groep.hidden = false
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
      ...(type === 'pijler' ? [[verAntwEl, 'structuur-verantw-fout', 3]] : [])
    ]
    checks.forEach(([el, foutId, min]) => {
      const fout = document.getElementById(foutId)
      if (!el.value.trim() || el.value.trim().length < min) {
        fout.textContent = el.value.trim() ? `Minimaal ${min} tekens` : 'Verplicht veld'
        el.classList.add('fout'); el.setAttribute('aria-invalid', 'true'); ok = false
      } else {
        fout.textContent = ''; el.classList.remove('fout'); el.removeAttribute('aria-invalid')
      }
    })
    if (!ok) return

    const item = { type, naam: naamEl.value.trim(), omschrijving: omschrEl.value.trim() }
    if (type === 'pijler') item.verantwoordelijke = verAntwEl.value.trim()
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

    if (actie === 'verwijder') {
      if (confirm('Item verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        await verwijderStructuurelement(id)
        await laadEnRender()
      }
    } else if (actie === 'bewerk') {
      const items = await laadStructuurelementen()
      const item = items.find(x => x.id === id)
      if (!item) return
      const isPijler = item.type === 'pijler'
      rij.innerHTML = `
        <div class="pijler-bewerk-form" style="width:100%">
          <div style="display:flex;gap:16px;margin-bottom:4px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px">
              <input type="radio" name="bewerk-type-${esc(id)}" value="pijler" ${isPijler ? 'checked' : ''}> Pijler
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px">
              <input type="radio" name="bewerk-type-${esc(id)}" value="domein" ${!isPijler ? 'checked' : ''}> Domein
            </label>
          </div>
          <div class="form-groep">
            <label class="form-label">Naam</label>
            <input class="form-input" id="bn-${esc(id)}" value="${esc(item.naam)}" autocomplete="off">
            <span class="form-fout" id="bn-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep">
            <label class="form-label">Omschrijving</label>
            <input class="form-input" id="bo-${esc(id)}" value="${esc(item.omschrijving || '')}" autocomplete="off">
            <span class="form-fout" id="bo-fout-${esc(id)}"></span>
          </div>
          <div class="form-groep" id="bv-groep-${esc(id)}" ${!isPijler ? 'hidden' : ''}>
            <label class="form-label">Eindverantwoordelijke</label>
            <input class="form-input" id="bv-${esc(id)}" value="${esc(item.verantwoordelijke || '')}" autocomplete="off">
            <span class="form-fout" id="bv-fout-${esc(id)}"></span>
          </div>
          <div class="form-rij">
            <button class="btn primary" data-actie="bewerk-opslaan" data-id="${esc(id)}">Opslaan</button>
            <button class="btn" data-actie="bewerk-annuleer" data-id="${esc(id)}">Annuleren</button>
          </div>
        </div>`
      rij.querySelectorAll(`[name="bewerk-type-${id}"]`).forEach(r => {
        r.addEventListener('change', () => {
          const groep = document.getElementById(`bv-groep-${id}`)
          if (groep) groep.hidden = rij.querySelector(`[name="bewerk-type-${id}"]:checked`).value === 'domein'
        })
      })
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
        ...(type === 'pijler' ? [[verantw, `bv-fout-${id}`, 3]] : [])
      ]
      checks.forEach(([val, foutId, min]) => {
        const el = document.getElementById(foutId)
        if (!val || val.length < min) { el.textContent = val ? `Minimaal ${min} tekens` : 'Verplicht veld'; ok = false }
        else el.textContent = ''
      })
      if (!ok) return
      const data = { type, naam, omschrijving: omschr }
      if (type === 'pijler') data.verantwoordelijke = verantw
      await bewerkStructuurelement(id, data)
      await laadEnRender()
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
            <span class="toel">Basisinformatie van jouw club</span>
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
            <span class="toel">Zichtbaar in de titelbalk en als browser-icoon</span>
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
            <span class="toel">Jouw accountgegevens</span>
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
            <span class="toel">Versie-informatie</span>
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
    foutPogingen = 0
    setFavicon('')
    renderInlogscherm()
  }
})
