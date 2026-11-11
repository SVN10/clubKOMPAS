import './style.css'
import { auth, db } from './firebase.js'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, addDoc } from 'firebase/firestore'

let huidigClubId = null

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

async function laadPijlers() {
  const snap = await getDocs(collection(db, 'clubs', huidigClubId, 'pijlers'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function voegPijlerToe(pijler) {
  await addDoc(collection(db, 'clubs', huidigClubId, 'pijlers'), pijler)
}

function pijlerKaartHTML(p, isHardcoded = false) {
  const verantw = isHardcoded ? '' : `<small style="color:var(--muted);display:block;margin-top:4px;font-size:12px">${esc(p.verantwoordelijke)}</small>`
  return `
    <div class="card">
      <h3>${esc(p.naam)}</h3>
      <div class="sub">Strategische pijler</div>
      <p>${esc(p.slogan)}</p>
      ${verantw}
      <span class="pill"><span class="stip"></span>Pijler</span>
    </div>`
}

async function renderPijlers() {
  const grid = document.getElementById('pijlers-grid')
  if (!grid) return
  grid.querySelectorAll('.pijler-dyn').forEach(el => el.remove())
  const opgeslagen = await laadPijlers()
  opgeslagen.forEach(p => {
    const div = document.createElement('div')
    div.className = 'pijler-dyn'
    div.innerHTML = pijlerKaartHTML(p)
    const toevoegKnop = grid.querySelector('.btn-toevoegen')
    grid.insertBefore(div, toevoegKnop)
  })
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

function renderInlogscherm() {
  document.querySelector('#app').innerHTML = `
    <div class="inlog-wrap">
      <div class="inlog-kaart">
        <div class="inlog-logo">
          <svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
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
          </svg>
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
  document.querySelector('#app').innerHTML = `
    <header class="top-bar">
      <svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
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
      </svg>
      <span class="app-title">club<b>KOMPAS</b></span>
      <div class="top-bar-rechts">
        <span class="inlog-email">${esc(gebruiker.email)}</span>
        <button class="btn uitlog-knop" id="uitlog-knop">Uitloggen</button>
      </div>
    </header>

    <nav class="top-nav">
      <a href="#" class="active">Home</a>
      <a href="#">Functies</a>
      <a href="#">Over clubKOMPAS</a>
      <a href="#">Contact</a>
    </nav>

    <main>
      <div class="wrap">

        <div class="sectie" style="margin-top:0">
          <div class="sectie-kop">
            <h2>Verenigingsbeheer voor sportclubs</h2>
            <span class="toel">Jouw club. Jouw kompas.</span>
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
                  <div class="cijfer">
                    <span class="n">3</span>
                    <span class="l">Strategische pijlers</span>
                  </div>
                  <div class="cijfer">
                    <span class="n">12</span>
                    <span class="l">Operationele domeinen</span>
                  </div>
                  <div class="cijfer">
                    <span class="n">∞</span>
                    <span class="l">Vermogens per club</span>
                  </div>
                  <div class="cijfer">
                    <span class="n">1</span>
                    <span class="l">Overzicht voor alles</span>
                  </div>
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
            </div>
          </div>
        </div>

      </div>
    </main>

    <footer>
      <span>club<b>KOMPAS</b> — een product van SVN10</span>
      <span>svn10.nl</span>
    </footer>
  `

  document.getElementById('uitlog-knop').addEventListener('click', () => signOut(auth))
  document.getElementById('pijler-toevoegen-knop').addEventListener('click', () => toonFormulier(true))
  document.getElementById('pijler-annuleer').addEventListener('click', () => toonFormulier(false))
  document.getElementById('pijler-opslaan').addEventListener('click', valideerEnSla)
  renderPijlers()
}

onAuthStateChanged(auth, gebruiker => {
  if (gebruiker) {
    huidigClubId = gebruiker.uid
    renderDashboard(gebruiker)
  } else {
    huidigClubId = null
    renderInlogscherm()
  }
})
