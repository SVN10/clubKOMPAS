// Venster voor toevoegen en bewerken op de beheerschermen (CK-176).
// Een <dialog> met showModal(): grijze achtergrond, Esc en een focus die in het venster blijft.
// Sluiten (Annuleren, ✕, Esc) slaat niets op en zet de focus terug op de knop die het venster opende.
// Een klik op de achtergrond sluit niet, en tijdens het opslaan kan het venster niet dicht.

let teller = 0

export function beheerVenster(houder) {
  const id = `beheer-venster-${++teller}`
  const dialoog = document.createElement('dialog')
  dialoog.className = 'beheer-venster'
  dialoog.setAttribute('aria-labelledby', `${id}-titel`)
  dialoog.innerHTML = `
    <div class="venster-kaart">
      <div class="venster-kop">
        <h2 class="venster-titel form-label" id="${id}-titel"></h2>
        <button class="venster-sluit" type="button" aria-label="Sluiten" data-venster="sluit"><span aria-hidden="true">✕</span></button>
      </div>
      <div class="venster-lijf"></div>
      <div class="form-rij venster-knoppen">
        <button class="btn opslaan" type="button" data-venster="opslaan">Opslaan</button>
        <button class="btn" type="button" data-venster="sluit">Annuleren</button>
      </div>
    </div>`
  houder.append(dialoog)
  const titel = dialoog.querySelector('.venster-titel')
  const lijf = dialoog.querySelector('.venster-lijf')
  const opslaanKnop = dialoog.querySelector('[data-venster="opslaan"]')
  const sluitKnoppen = dialoog.querySelectorAll('[data-venster="sluit"]')

  let huidig = null       // { opslaan, terug, opSluiten }
  let bezig = false

  function zetBezig(aan) {
    bezig = aan
    sluitKnoppen.forEach(k => { if (aan) k.setAttribute('aria-disabled', 'true'); else k.removeAttribute('aria-disabled') })
  }

  // Inhoud tonen; staat het venster al open, dan alleen de inhoud vervangen
  function open({ titel: tekst, inhoud, klasse = 'pijler-form', opslaan, terug, opSluiten = null, opslaanUit = false }) {
    titel.textContent = tekst
    lijf.className = `venster-lijf ${klasse}`
    lijf.innerHTML = inhoud
    opslaanKnop.disabled = opslaanUit
    huidig = { opslaan, terug: huidig && dialoog.open ? huidig.terug : terug, opSluiten }
    if (!dialoog.open) {
      dialoog.showModal()
      dialoog.scrollTop = 0
    }
    return lijf
  }

  // Sluiten; terug = true: de focus naar de knop die het venster opende (zonder opslaan)
  function sluit({ terug = false } = {}) {
    if (!huidig) return
    const { terug: terugNaar, opSluiten } = huidig
    huidig = null
    zetBezig(false)
    if (dialoog.open) dialoog.close()
    lijf.innerHTML = ''
    opSluiten?.()
    if (terug) terugNaar?.()?.focus()
  }

  dialoog.addEventListener('click', async e => {
    const knop = e.target.closest('[data-venster]')
    if (!knop || !huidig) return
    if (knop.dataset.venster === 'sluit') {
      if (!bezig) sluit({ terug: true })
      return
    }
    if (bezig || knop.disabled || knop.getAttribute('aria-disabled') === 'true') return
    const { opslaan } = huidig
    zetBezig(true)
    try {
      await opslaan(knop)
    } finally {
      if (bezig) zetBezig(false)
    }
  })

  // Esc: hetzelfde als Annuleren, maar niet tijdens het opslaan
  dialoog.addEventListener('cancel', e => {
    e.preventDefault()
    if (!bezig) sluit({ terug: true })
  })
  // Sommige browsers sluiten bij een tweede Esc toch; dan alsnog opruimen, of tijdens het opslaan weer openen
  dialoog.addEventListener('close', () => {
    if (!huidig || dialoog.open) return
    if (bezig) dialoog.showModal()
    else sluit({ terug: true })
  })

  return {
    el: dialoog,
    lijf,
    opslaanKnop,
    open,
    sluit,
    get isOpen() { return !!huidig },
  }
}
