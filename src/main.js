import './style.css'

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
          <div class="grid">
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
