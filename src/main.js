import './style.css'

document.querySelector('#app').innerHTML = `
  <header>
    <div class="logo">CK</div>
    <span class="brand">clubKOMPAS</span>
  </header>

  <main>
    <div class="hero">
      <span class="hero-badge">Verenigingsbeheer voor sportclubs</span>
      <h1>Jouw club. <span>Jouw kompas.</span></h1>
      <p>
        clubKOMPAS helpt sportclubs met het beheren van leden, activiteiten,
        sponsoren en communicatie — overzichtelijk op één plek.
      </p>
      <div class="cta-row">
        <button class="btn btn-primary">Kom in contact</button>
        <button class="btn btn-secondary">Meer informatie</button>
      </div>
    </div>
  </main>

  <footer>
    <span>Een product van <strong>SVN10</strong> · svn10.nl</span>
  </footer>
`
