import './style.css'
import { auth, db } from './firebase.js'
import { version } from '../package.json'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

let huidigClubId = null
let huidigProfiel = null
let huidigGebruiker = null

function setFavicon(base64) {
  const link = document.getElementById('favicon')
  if (link && base64) link.href = base64
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

// ── Pijlers ───────────────────────────────────────────────────────────────────

async function laadPijlers() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'pijlers'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function voegPijlerToe(pijler) {
  await addDoc(collection(db, 'clubs', huidigClubId, 'pijlers'), pijler)
}

async function bewerkPijler(id, data) {
  await updateDoc(doc(db, 'clubs', huidigClubId, 'pijlers', id), data)
}

async function verwijderPijler(id) {
  await deleteDoc(doc(db, 'clubs', huidigClubId, 'pijlers', id))
}

// ── Domeinen ─────────────────────────────────────────────────────────────────

async function laadDomeinen() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'domeinen'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function voegDomeinToe(domein) {
  await addDoc(collection(db, 'clubs', huidigClubId, 'domeinen'), domein)
}

async function bewerkDomein(id, data) {
  await updateDoc(doc(db, 'clubs', huidigClubId, 'domeinen', id), data)
}

async function verwijderDomein(id) {
  await deleteDoc(doc(db, 'clubs', huidigClubId, 'domeinen', id))
}

// ── Profiel ───────────────────────────────────────────────────────────────────

async function laadProfiel() {
  const snap = await getDoc(doc(db, 'clubs', huidigClubId, 'instellingen', 'profiel'))
  return snap.exists() ? snap.data() : null
}

async function slaaProfiel(data) {
  await setDoc(doc(db, 'clubs', huidigClubId, 'instellingen', 'profiel'), data)
}

// ── Gedeelde UI-helpers ───────────────────────────────────────────────────────

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
  const logo = huidigProfiel?.logo
    ? `<img src="${huidigProfiel.logo}" class="club-logo" alt="Club logo">`
    : ''
  return `
    <header class="top-bar${huidigProfiel?.logo ? ' heeft-logo' : ''}">
      ${kompasIconSVG()}
      <span class="app-title">${titel}</span>
      ${logo}
    </header>`
}

function navHTML(actief) {
  return `
    <nav class="top-nav">
      <a href="#" class="nav-home${actief === 'home' ? ' active' : ''}">Home</a>
      <a href="#" class="nav-instellingen${actief === 'instellingen' ? ' active' : ''}">Instellingen</a>
    </nav>`
}

function footerHTML() {
  const clubnaam = huidigProfiel?.naam ? esc(huidigProfiel.naam) : 'clubKOMPAS'
  const gebruikerLabel = huidigGebruiker
    ? `<span>${esc(huidigGebruiker.displayName || huidigGebruiker.email)}</span>`
    : ''
  return `
    <footer>
      <span>${clubnaam} · een product van SVN10</span>
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
  document.querySelector('.nav-instellingen').addEventListener('click', e => { e.preventDefault(); renderInstellingen(gebruiker) })
}

// ── Pijler UI ─────────────────────────────────────────────────────────────────

function pijlerKaartHTML(p, isHardcoded = false) {
  const verantw = isHardcoded ? '' : `<small style="color:var(--muted);display:block;margin-top:4px;font-size:12px">${esc(p.verantwoordelijke)}</small>`
  const acties = isHardcoded ? '' : `
    <div class="kaart-acties">
      <button class="btn-kaart-actie" data-actie="bewerk" data-id="${esc(p.id)}">Bewerken</button>
      <button class="btn-kaart-actie gevaar" data-actie="verwijder" data-id="${esc(p.id)}">Verwijderen</button>
    </div>`
  return `
    <div class="card">
      <h3>${esc(p.naam)}</h3>
      <div class="sub">Strategische pijler</div>
      <p>${esc(p.slogan)}</p>
      ${verantw}
      <span class="pill"><span class="stip"></span>Pijler</span>
      ${acties}
    </div>`
}

async function renderPijlers() {
  const grid = document.getElementById('pijlers-grid')
  if (!grid) return
  grid.querySelectorAll('.pijler-dyn').forEach(el => el.remove())
  const opgeslagen = await laadPijlers()
  if (!grid.isConnected) return
  opgeslagen.forEach(p => {
    const div = document.createElement('div')
    div.className = 'pijler-dyn'
    div.innerHTML = pijlerKaartHTML(p)
    const toevoegKnop = grid.querySelector('.btn-toevoegen')
    grid.insertBefore(div, toevoegKnop)
  })
}

function bewerkFormHTML(p) {
  return `
    <div class="pijler-bewerk-form">
      <div class="form-groep">
        <label class="form-label" for="bewerk-naam">Naam</label>
        <input class="form-input" id="bewerk-naam" value="${esc(p.naam)}" autocomplete="off">
        <span class="form-fout" id="bewerk-naam-fout"></span>
      </div>
      <div class="form-groep">
        <label class="form-label" for="bewerk-slogan">Slogan</label>
        <input class="form-input" id="bewerk-slogan" value="${esc(p.slogan)}" autocomplete="off">
        <span class="form-fout" id="bewerk-slogan-fout"></span>
      </div>
      <div class="form-groep">
        <label class="form-label" for="bewerk-verantw">Eindverantwoordelijke</label>
        <input class="form-input" id="bewerk-verantw" value="${esc(p.verantwoordelijke)}" autocomplete="off">
        <span class="form-fout" id="bewerk-verantw-fout"></span>
      </div>
      <div class="form-rij">
        <button class="btn primary" data-actie="bewerk-opslaan" data-id="${esc(p.id)}">Opslaan</button>
        <button class="btn" data-actie="bewerk-annuleer">Annuleren</button>
      </div>
    </div>`
}

function toonFormulier(zichtbaar) {
  const form = document.getElementById('pijler-form')
  const knop = document.getElementById('pijler-toevoegen-knop')
  if (!form || !knop) return
  form.hidden = !zichtbaar
  knop.hidden = zichtbaar
  if (zichtbaar) form.querySelector('[name="naam"]').focus()
}

async function valideerEnSla() {
  const naam = document.querySelector('#pijler-form [name="naam"]')
  const slogan = document.querySelector('#pijler-form [name="slogan"]')
  const verantw = document.querySelector('#pijler-form [name="verantwoordelijke"]')
  let ok = true

  ;[naam, slogan, verantw].forEach(input => {
    const fout = input.parentElement.querySelector('.form-fout')
    const min = input.name === 'verantwoordelijke' ? 3 : 2
    if (!input.value.trim() || input.value.trim().length < min) {
      input.classList.add('fout')
      input.setAttribute('aria-invalid', 'true')
      fout.textContent = input.value.trim() ? `Minimaal ${min} tekens` : 'Verplicht veld'
      ok = false
    } else {
      input.classList.remove('fout')
      input.removeAttribute('aria-invalid')
      fout.textContent = ''
    }
  })

  if (!ok) return

  await voegPijlerToe({ naam: naam.value.trim(), slogan: slogan.value.trim(), verantwoordelijke: verantw.value.trim() })

  naam.value = ''
  slogan.value = ''
  verantw.value = ''
  await renderPijlers()
  toonFormulier(false)
}

function domeinKaartHTML(d, isHardcoded = false) {
  const acties = isHardcoded ? '' : `
    <div class="kaart-acties">
      <button class="btn-kaart-actie" data-actie="bewerk-domein" data-id="${esc(d.id)}">Bewerken</button>
      <button class="btn-kaart-actie gevaar" data-actie="verwijder-domein" data-id="${esc(d.id)}">Verwijderen</button>
    </div>`
  return `
    <div class="card">
      <h3>${esc(d.naam)}</h3>
      <div class="sub">Domein</div>
      <p>${esc(d.omschrijving)}</p>
      <span class="pill"><span class="stip" style="background:var(--muted)"></span>Domein</span>
      ${acties}
    </div>`
}

function bewerkDomeinFormHTML(d) {
  return `
    <div class="pijler-bewerk-form">
      <div class="form-groep">
        <label class="form-label" for="bewerk-domein-naam">Naam</label>
        <input class="form-input" id="bewerk-domein-naam" value="${esc(d.naam)}" autocomplete="off">
        <span class="form-fout" id="bewerk-domein-naam-fout"></span>
      </div>
      <div class="form-groep">
        <label class="form-label" for="bewerk-domein-omschrijving">Omschrijving</label>
        <input class="form-input" id="bewerk-domein-omschrijving" value="${esc(d.omschrijving)}" autocomplete="off">
        <span class="form-fout" id="bewerk-domein-omschrijving-fout"></span>
      </div>
      <div class="form-rij">
        <button class="btn primary" data-actie="bewerk-domein-opslaan" data-id="${esc(d.id)}">Opslaan</button>
        <button class="btn" data-actie="bewerk-domein-annuleer">Annuleren</button>
      </div>
    </div>`
}

async function renderDomeinen() {
  const grid = document.getElementById('pijlers-grid')
  if (!grid) return
  grid.querySelectorAll('.domein-dyn').forEach(el => el.remove())
  const opgeslagen = await laadDomeinen()
  if (!grid.isConnected) return
  const toevoegKnop = document.getElementById('domein-toevoegen-knop')
  opgeslagen.forEach(d => {
    const div = document.createElement('div')
    div.className = 'domein-dyn'
    div.innerHTML = domeinKaartHTML(d)
    grid.insertBefore(div, toevoegKnop)
  })
}

function toonDomeinFormulier(zichtbaar) {
  const form = document.getElementById('domein-form')
  const knop = document.getElementById('domein-toevoegen-knop')
  if (!form || !knop) return
  form.hidden = !zichtbaar
  knop.hidden = zichtbaar
  if (zichtbaar) form.querySelector('[name="naam"]').focus()
}

async function valideerEnSlaDomein() {
  const naam = document.querySelector('#domein-form [name="naam"]')
  const omschrijving = document.querySelector('#domein-form [name="omschrijving"]')
  let ok = true

  ;[naam, omschrijving].forEach(input => {
    const fout = input.parentElement.querySelector('.form-fout')
    if (!input.value.trim() || input.value.trim().length < 2) {
      input.classList.add('fout')
      input.setAttribute('aria-invalid', 'true')
      fout.textContent = input.value.trim() ? 'Minimaal 2 tekens' : 'Verplicht veld'
      ok = false
    } else {
      input.classList.remove('fout')
      input.removeAttribute('aria-invalid')
      fout.textContent = ''
    }
  })

  if (!ok) return

  await voegDomeinToe({ naam: naam.value.trim(), omschrijving: omschrijving.value.trim(), type: 'Domein' })
  naam.value = ''
  omschrijving.value = ''
  await renderDomeinen()
  toonDomeinFormulier(false)
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
                  <div class="cijfer"><span class="n">3</span><span class="l">Strategische pijlers</span></div>
                  <div class="cijfer"><span class="n">12</span><span class="l">Operationele domeinen</span></div>
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
            <div class="grid" id="pijlers-grid">
              <div class="card">
                <h3>#JouwClubSpeelt</h3>
                <div class="sub">Strategische pijler</div>
                <p>Het sportaanbod van de club. Teams, trainingen en wedstrijden — overzichtelijk beheerd.</p>
                <span class="pill"><span class="stip"></span>Pijler</span>
              </div>
              <div class="card">
                <h3>#JouwClubGroeit</h3>
                <div class="sub">Strategische pijler</div>
                <p>Talentontwikkeling en ledenaanwas. Van jeugdprogramma's tot instroompaden.</p>
                <span class="pill"><span class="stip"></span>Pijler</span>
              </div>
              <div class="card">
                <h3>#JouwClubDoet</h3>
                <div class="sub">Strategische pijler</div>
                <p>Maatschappelijke betrokkenheid. Initiatieven die de club verbinden met de buurt.</p>
                <span class="pill"><span class="stip"></span>Pijler</span>
              </div>

              <button class="btn-toevoegen" id="pijler-toevoegen-knop">+ Pijler toevoegen</button>

              <div class="pijler-form" id="pijler-form" hidden>
                <div class="form-groep">
                  <label class="form-label" for="pijler-naam">Naam</label>
                  <input class="form-input" id="pijler-naam" name="naam" type="text" placeholder="Naam van de pijler" autocomplete="off" aria-describedby="pijler-naam-fout">
                  <span class="form-fout" id="pijler-naam-fout"></span>
                </div>
                <div class="form-groep">
                  <label class="form-label" for="pijler-slogan">Slogan</label>
                  <input class="form-input" id="pijler-slogan" name="slogan" type="text" placeholder="Ondertitel of slogan" autocomplete="off" aria-describedby="pijler-slogan-fout">
                  <span class="form-fout" id="pijler-slogan-fout"></span>
                </div>
                <div class="form-groep">
                  <label class="form-label" for="pijler-verantw">Eindverantwoordelijke</label>
                  <input class="form-input" id="pijler-verantw" name="verantwoordelijke" type="text" placeholder="Naam" autocomplete="off" aria-describedby="pijler-verantw-fout">
                  <span class="form-fout" id="pijler-verantw-fout"></span>
                </div>
                <div class="form-rij">
                  <button class="btn primary" id="pijler-opslaan">Opslaan</button>
                  <button class="btn" id="pijler-annuleer">Annuleren</button>
                </div>
              </div>

              <div class="card">
                <h3>Bestuur</h3>
                <div class="sub">Domein</div>
                <p>Eindverantwoordelijkheid, beleid en governance — helder belegd per functie.</p>
                <span class="pill"><span class="stip" style="background:var(--muted)"></span>Domein</span>
              </div>
              <div class="card">
                <h3>Financiën</h3>
                <div class="sub">Domein</div>
                <p>Begroting, contributie en sponsorinkomsten — per seizoen bijgehouden.</p>
                <span class="pill"><span class="stip" style="background:var(--muted)"></span>Domein</span>
              </div>
              <div class="card">
                <h3>Communicatie</h3>
                <div class="sub">Domein</div>
                <p>Huisstijl, berichtgeving en kanalen — op één plek beheerd.</p>
                <span class="pill"><span class="stip" style="background:var(--muted)"></span>Domein</span>
              </div>

              <button class="btn-toevoegen" id="domein-toevoegen-knop">+ Domein toevoegen</button>

              <div class="pijler-form" id="domein-form" hidden>
                <div class="form-groep">
                  <label class="form-label" for="domein-naam">Naam</label>
                  <input class="form-input" id="domein-naam" name="naam" type="text" placeholder="Naam van het domein" autocomplete="off" aria-describedby="domein-naam-fout">
                  <span class="form-fout" id="domein-naam-fout"></span>
                </div>
                <div class="form-groep">
                  <label class="form-label" for="domein-omschrijving">Omschrijving</label>
                  <input class="form-input" id="domein-omschrijving" name="omschrijving" type="text" placeholder="Korte omschrijving van het domein" autocomplete="off" aria-describedby="domein-omschrijving-fout">
                  <span class="form-fout" id="domein-omschrijving-fout"></span>
                </div>
                <div class="form-rij">
                  <button class="btn primary" id="domein-opslaan">Opslaan</button>
                  <button class="btn" id="domein-annuleer">Annuleren</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    ${footerHTML()}
  `

  bindNavListeners(gebruiker)
  document.getElementById('pijler-toevoegen-knop').addEventListener('click', () => toonFormulier(true))
  document.getElementById('pijler-annuleer').addEventListener('click', () => toonFormulier(false))
  document.getElementById('pijler-opslaan').addEventListener('click', valideerEnSla)

  document.getElementById('pijlers-grid').addEventListener('click', async e => {
    const knop = e.target.closest('[data-actie]')
    if (!knop) return
    const actie = knop.dataset.actie
    const id = knop.dataset.id
    const kaartDiv = knop.closest('.pijler-dyn')

    if (actie === 'bewerk') {
      const pijlers = await laadPijlers()
      const p = pijlers.find(x => x.id === id)
      if (p) { kaartDiv.innerHTML = bewerkFormHTML(p); kaartDiv.querySelector('#bewerk-naam').focus() }
    } else if (actie === 'verwijder') {
      if (confirm('Pijler verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        await verwijderPijler(id)
        await renderPijlers()
      }
    } else if (actie === 'bewerk-opslaan') {
      const naam = document.getElementById('bewerk-naam').value.trim()
      const slogan = document.getElementById('bewerk-slogan').value.trim()
      const verantw = document.getElementById('bewerk-verantw').value.trim()
      let ok = true
      const checks = [
        [naam, 'bewerk-naam-fout', 2],
        [slogan, 'bewerk-slogan-fout', 2],
        [verantw, 'bewerk-verantw-fout', 3],
      ]
      checks.forEach(([val, foutId, min]) => {
        const el = document.getElementById(foutId)
        if (!val || val.length < min) { el.textContent = val ? `Minimaal ${min} tekens` : 'Verplicht veld'; ok = false }
        else el.textContent = ''
      })
      if (!ok) return
      await bewerkPijler(id, { naam, slogan, verantwoordelijke: verantw })
      await renderPijlers()
    } else if (actie === 'bewerk-annuleer') {
      await renderPijlers()
    } else if (actie === 'bewerk-domein') {
      const domeinen = await laadDomeinen()
      const d = domeinen.find(x => x.id === id)
      const domeinKaartDiv = knop.closest('.domein-dyn')
      if (d) { domeinKaartDiv.innerHTML = bewerkDomeinFormHTML(d); domeinKaartDiv.querySelector('#bewerk-domein-naam').focus() }
    } else if (actie === 'verwijder-domein') {
      if (confirm('Domein verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        await verwijderDomein(id)
        await renderDomeinen()
      }
    } else if (actie === 'bewerk-domein-opslaan') {
      const naam = document.getElementById('bewerk-domein-naam').value.trim()
      const omschrijving = document.getElementById('bewerk-domein-omschrijving').value.trim()
      let ok = true
      const checks = [
        [naam, 'bewerk-domein-naam-fout', 2],
        [omschrijving, 'bewerk-domein-omschrijving-fout', 2],
      ]
      checks.forEach(([val, foutId, min]) => {
        const el = document.getElementById(foutId)
        if (!val || val.length < min) { el.textContent = val ? `Minimaal ${min} tekens` : 'Verplicht veld'; ok = false }
        else el.textContent = ''
      })
      if (!ok) return
      await bewerkDomein(id, { naam, omschrijving })
      await renderDomeinen()
    } else if (actie === 'bewerk-domein-annuleer') {
      await renderDomeinen()
    }
  })

  document.getElementById('domein-toevoegen-knop').addEventListener('click', () => toonDomeinFormulier(true))
  document.getElementById('domein-annuleer').addEventListener('click', () => toonDomeinFormulier(false))
  document.getElementById('domein-opslaan').addEventListener('click', valideerEnSlaDomein)

  renderPijlers()
  renderDomeinen()
}

function renderInstellingen(gebruiker) {
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
              ${huidigProfiel?.logo
                ? `<img src="${huidigProfiel.logo}" class="logo-preview" alt="Huidig logo">`
                : `<div class="logo-leeg">Nog geen logo geüpload</div>`}
              <div class="form-rij" style="margin-top:12px">
                <label class="btn" style="cursor:pointer">
                  <span>${huidigProfiel?.logo ? 'Logo wijzigen' : 'Logo uploaden'}</span>
                  <input type="file" id="logo-input" accept="image/*" hidden>
                </label>
                ${huidigProfiel?.logo
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
  if (gebruiker) {
    huidigClubId = gebruiker.uid
    huidigGebruiker = gebruiker
    huidigProfiel = await laadProfiel()
    if (huidigProfiel?.logo) setFavicon(huidigProfiel.logo)
    renderDashboard(gebruiker)
  } else {
    huidigClubId = null
    huidigGebruiker = null
    huidigProfiel = null
    renderInlogscherm()
  }
})
