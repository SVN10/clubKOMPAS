// Eigen keuzelijst en datumkiezer in de stijl van de app (Paul, 23-11-2026).
// Werkt als laag over de bestaande velden: het echte <select> en <input type="date"> blijven bestaan
// (verborgen) en blijven de bron van de waarde. Bestaande code leest dus gewoon .value, krijgt
// 'change'-events en mag .value, .min, .focus() en aria-* zetten; deze laag volgt dat.
// Nieuwe velden worden vanzelf opgepakt (MutationObserver), want pagina's tekenen met innerHTML.

const PROTO_SELECT = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')
const PROTO_INDEX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex')
const PROTO_INPUT = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
const PROTO_VALIDITY = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'validity')

let teller = 0
const nieuwId = voorvoegsel => `${voorvoegsel}-${++teller}`
const CHEVRON = '<svg class="eigen-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>'
const KALENDER = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const DAGEN = [['ma', 'maandag'], ['di', 'dinsdag'], ['wo', 'woensdag'], ['do', 'donderdag'], ['vr', 'vrijdag'], ['za', 'zaterdag'], ['zo', 'zondag']]

// Open popup sluiten bij klikken ernaast (één tegelijk open)
let openSluiter = null
document.addEventListener('pointerdown', e => {
  if (openSluiter && !openSluiter.bevat(e.target)) openSluiter.sluit(false)
}, true)

function verstuur(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

// Label koppelen: id geven, en klikken op het label zet de focus op ons eigen veld
function koppelLabel(veld, doel) {
  const label = veld.id ? document.querySelector(`label[for="${CSS.escape(veld.id)}"]`) : null
  if (!label) return null
  if (!label.id) label.id = nieuwId('eigen-label')
  label.addEventListener('click', e => { e.preventDefault(); doel.focus() })
  return label.id
}

// aria-describedby, aria-invalid, disabled en de foutrand (klasse fout) van het echte veld doorgeven aan ons veld
// aria = false: alleen disabled volgen (de kalenderknop hoort niet bij de foutmelding, CK-056)
function volgAttributen(veld, doel, aria = true) {
  const zet = () => {
    doel.disabled = veld.disabled
    if (!aria) return
    for (const a of ['aria-describedby', 'aria-invalid']) {
      if (veld.hasAttribute(a)) doel.setAttribute(a, veld.getAttribute(a))
      else doel.removeAttribute(a)
    }
    doel.classList.toggle('fout', veld.classList.contains('fout'))
  }
  zet()
  new MutationObserver(zet).observe(veld, { attributes: true, attributeFilter: ['aria-describedby', 'aria-invalid', 'disabled', 'class'] })
}

// ── Keuzelijst ──────────────────────────────────────────────────────────────────
function verbeterSelect(select) {
  select.dataset.eigen = '1'
  const omhulsel = document.createElement('div')
  omhulsel.className = 'eigen-keuze'
  const knop = document.createElement('button')
  knop.type = 'button'
  knop.className = 'form-input eigen-knop'
  knop.id = nieuwId('eigen-knop')
  knop.setAttribute('aria-haspopup', 'listbox')
  knop.setAttribute('aria-expanded', 'false')
  knop.innerHTML = `<span class="eigen-tekst"></span>${CHEVRON}`
  const lijst = document.createElement('ul')
  lijst.className = 'eigen-lijst'
  lijst.id = nieuwId('eigen-lijst')
  lijst.setAttribute('role', 'listbox')
  lijst.tabIndex = -1
  lijst.hidden = true
  knop.setAttribute('aria-controls', lijst.id)
  select.before(omhulsel)
  omhulsel.append(select, knop, lijst)
  select.classList.add('eigen-verborgen')
  select.tabIndex = -1
  select.setAttribute('aria-hidden', 'true')

  const labelId = koppelLabel(select, knop)
  if (labelId) {
    knop.setAttribute('aria-labelledby', `${labelId} ${knop.id}`)
    lijst.setAttribute('aria-labelledby', labelId)
  } else if (select.getAttribute('aria-label')) {
    knop.setAttribute('aria-label', select.getAttribute('aria-label'))
    lijst.setAttribute('aria-label', select.getAttribute('aria-label'))
  }
  volgAttributen(select, knop)
  select.focus = () => knop.focus()

  const tekstEl = knop.querySelector('.eigen-tekst')
  const toonWaarde = () => { tekstEl.textContent = select.selectedOptions[0]?.textContent || '' }
  // Code zet soms select.value of de opties zelf; dan het knoplabel bijwerken
  Object.defineProperty(select, 'value', {
    configurable: true,
    get() { return PROTO_SELECT.get.call(this) },
    set(v) { PROTO_SELECT.set.call(this, v); toonWaarde() },
  })
  Object.defineProperty(select, 'selectedIndex', {
    configurable: true,
    get() { return PROTO_INDEX.get.call(this) },
    set(v) { PROTO_INDEX.set.call(this, v); toonWaarde() },
  })
  new MutationObserver(toonWaarde).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['selected'] })
  toonWaarde()

  let opties = []      // [{ li, optie }]
  let actief = -1

  function bouwLijst() {
    lijst.innerHTML = ''
    opties = []
    for (const kind of select.children) {
      if (kind.tagName === 'OPTGROUP') {
        const kop = document.createElement('li')
        kop.className = 'eigen-groep'
        kop.setAttribute('role', 'presentation')
        kop.textContent = kind.label
        lijst.append(kop)
        for (const o of kind.children) voegOptie(o, true)
      } else if (kind.tagName === 'OPTION') voegOptie(kind, false)
    }
  }
  function voegOptie(optie, ingesprongen) {
    const li = document.createElement('li')
    li.id = nieuwId('eigen-optie')
    li.className = 'eigen-optie' + (ingesprongen ? ' ingesprongen' : '')
    li.setAttribute('role', 'option')
    li.textContent = optie.textContent
    li.setAttribute('aria-selected', String(optie.selected))
    if (optie.disabled) li.setAttribute('aria-disabled', 'true')
    li.addEventListener('pointerdown', e => e.preventDefault())   // focus blijft in de lijst
    li.addEventListener('click', () => { if (!optie.disabled) kies(opties.findIndex(x => x.li === li)) })
    li.addEventListener('pointermove', () => zetActief(opties.findIndex(x => x.li === li), false))
    lijst.append(li)
    opties.push({ li, optie })
  }
  function zetActief(i, scroll = true) {
    if (i < 0 || i >= opties.length) return
    opties[actief]?.li.classList.remove('actief')
    actief = i
    const { li } = opties[i]
    li.classList.add('actief')
    lijst.setAttribute('aria-activedescendant', li.id)
    if (scroll) li.scrollIntoView({ block: 'nearest' })
  }
  function stap(van, richting) {
    let i = van
    do { i += richting } while (i >= 0 && i < opties.length && opties[i].optie.disabled)
    return i >= 0 && i < opties.length ? i : van
  }
  function open() {
    if (knop.disabled || !lijst.hidden) return
    openSluiter?.sluit(false)
    bouwLijst()
    lijst.hidden = false
    knop.setAttribute('aria-expanded', 'true')
    omhulsel.classList.add('open')
    // Lijst naar boven openklappen als er onder te weinig ruimte is
    const r = knop.getBoundingClientRect()
    omhulsel.classList.toggle('omhoog', window.innerHeight - r.bottom < 240 && r.top > window.innerHeight - r.bottom)
    zetActief(Math.max(0, opties.findIndex(x => x.optie.selected)))
    lijst.focus()
    openSluiter = { bevat: el => omhulsel.contains(el), sluit }
  }
  function sluit(focusTerug = true) {
    if (lijst.hidden) return
    lijst.hidden = true
    knop.setAttribute('aria-expanded', 'false')
    omhulsel.classList.remove('open', 'omhoog')
    lijst.removeAttribute('aria-activedescendant')
    if (openSluiter?.sluit === sluit) openSluiter = null
    if (focusTerug) knop.focus()
  }
  function kies(i) {
    const { optie } = opties[i] || {}
    if (!optie) return
    const anders = !optie.selected
    PROTO_SELECT.set.call(select, optie.value)
    toonWaarde()
    sluit()
    if (anders) verstuur(select)
  }

  knop.addEventListener('click', () => (lijst.hidden ? open() : sluit()))
  knop.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open() }
  })
  let zoek = '', zoekTijd = 0
  lijst.addEventListener('keydown', e => {
    const k = e.key
    if (k === 'ArrowDown') zetActief(stap(actief, 1))
    else if (k === 'ArrowUp') zetActief(stap(actief, -1))
    else if (k === 'Home') zetActief(stap(-1, 1))
    else if (k === 'End') zetActief(stap(opties.length, -1))
    else if (k === 'PageDown') zetActief(Math.min(opties.length - 1, actief + 8))
    else if (k === 'PageUp') zetActief(Math.max(0, actief - 8))
    else if (k === 'Enter' || k === ' ') kies(actief)
    else if (k === 'Escape') { e.stopPropagation(); sluit() }
    else if (k === 'Tab') { sluit(false); return }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Typ om te zoeken: springt naar de eerste optie die zo begint
      const nu = Date.now()
      zoek = (nu - zoekTijd > 700 ? '' : zoek) + k.toLowerCase()
      zoekTijd = nu
      const i = opties.findIndex(x => !x.optie.disabled && x.li.textContent.toLowerCase().startsWith(zoek))
      if (i >= 0) zetActief(i)
    } else return
    e.preventDefault()
  })
  lijst.addEventListener('focusout', e => { if (!omhulsel.contains(e.relatedTarget)) sluit(false) })
}

// ── Datumkiezer ─────────────────────────────────────────────────────────────────
const tweeCijfers = n => String(n).padStart(2, '0')
const naarIso = d => `${d.getFullYear()}-${tweeCijfers(d.getMonth() + 1)}-${tweeCijfers(d.getDate())}`
const vanIso = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
const naarTekst = iso => { const d = vanIso(iso); return d ? `${tweeCijfers(d.getDate())}-${tweeCijfers(d.getMonth() + 1)}-${d.getFullYear()}` : '' }
// "1-3-2027", "01/03/2027", "1.3.2027" en "01032027" worden een datum; anders null
function leesTekst(t) {
  const s = t.trim()
  let m = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/.exec(s) || /^(\d{2})(\d{2})(\d{4})$/.exec(s)
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? naarIso(d) : null
}

function verbeterDatum(veld) {
  veld.dataset.eigen = '1'
  const omhulsel = document.createElement('div')
  omhulsel.className = 'eigen-datum'
  const tekst = document.createElement('input')
  tekst.type = 'text'
  tekst.className = 'form-input eigen-datum-tekst'
  tekst.id = nieuwId('eigen-datum')
  tekst.inputMode = 'numeric'
  tekst.autocomplete = 'off'
  tekst.placeholder = 'dd-mm-jjjj'
  const knop = document.createElement('button')
  knop.type = 'button'
  knop.className = 'eigen-datum-knop'
  knop.innerHTML = KALENDER
  const kalender = document.createElement('div')
  kalender.className = 'eigen-kalender'
  kalender.setAttribute('role', 'dialog')
  kalender.tabIndex = -1
  kalender.hidden = true
  veld.before(omhulsel)
  omhulsel.append(veld, tekst, knop, kalender)
  veld.classList.add('eigen-verborgen')
  veld.tabIndex = -1
  veld.setAttribute('aria-hidden', 'true')

  const labelId = koppelLabel(veld, tekst)
  const labelTekst = labelId ? document.getElementById(labelId).textContent.trim() : (veld.getAttribute('aria-label') || 'datum')
  if (labelId) tekst.setAttribute('aria-labelledby', labelId)
  knop.setAttribute('aria-label', `${labelTekst} kiezen uit de kalender`)
  kalender.setAttribute('aria-label', `${labelTekst} kiezen`)
  volgAttributen(veld, tekst)
  volgAttributen(veld, knop, false)
  veld.focus = () => tekst.focus()

  let ongeldig = false
  // De bestaande controle kijkt naar validity.badInput: dat is nu "tekst die geen datum is"
  Object.defineProperty(veld, 'validity', {
    configurable: true,
    get() { const v = PROTO_VALIDITY.get.call(this); return { ...Object.fromEntries(Object.keys(Object.getPrototypeOf(v)).map(k => [k, v[k]])), badInput: ongeldig, valid: v.valid && !ongeldig } },
  })
  Object.defineProperty(veld, 'value', {
    configurable: true,
    get() { return PROTO_INPUT.get.call(this) },
    set(v) { PROTO_INPUT.set.call(this, v); ongeldig = false; tekst.value = naarTekst(PROTO_INPUT.get.call(this)) },
  })
  tekst.value = naarTekst(PROTO_INPUT.get.call(veld))

  function zetWaarde(iso) {
    const oud = PROTO_INPUT.get.call(veld)
    PROTO_INPUT.set.call(veld, iso)
    if (PROTO_INPUT.get.call(veld) !== oud) verstuur(veld)
  }
  tekst.addEventListener('change', () => {
    const t = tekst.value.trim()
    if (!t) { ongeldig = false; zetWaarde(''); return }
    const iso = leesTekst(t)
    ongeldig = !iso
    if (iso) { tekst.value = naarTekst(iso); zetWaarde(iso) } else zetWaarde('')
  })
  tekst.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); open() } })

  // Kalender
  let toon = null          // eerste dag van de getoonde maand
  let focusDag = null      // Date met de focus
  const vandaag = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
  const minDatum = () => vanIso(veld.min)
  const maxDatum = () => vanIso(veld.max)
  const magNiet = d => (minDatum() && d < minDatum()) || (maxDatum() && d > maxDatum())
  // Focus nooit op een uitgeschakelde dag: die kan geen focus krijgen, en dan werkt Escape niet meer (CK-048)
  const binnenGrens = d => {
    if (minDatum() && d < minDatum()) return minDatum()
    if (maxDatum() && d > maxDatum()) return maxDatum()
    return d
  }

  function teken() {
    const jaar = toon.getFullYear(), maand = toon.getMonth()
    const gekozen = PROTO_INPUT.get.call(veld)
    const kopId = `${kalender.id || (kalender.id = nieuwId('eigen-kal'))}-kop`
    const start = new Date(jaar, maand, 1 - ((new Date(jaar, maand, 1).getDay() + 6) % 7))
    let rijen = ''
    for (let w = 0; w < 6; w++) {
      let cellen = ''
      for (let k = 0; k < 7; k++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + k)
        const iso = naarIso(d)
        const klassen = ['eigen-dag', d.getMonth() !== maand ? 'buiten' : '', iso === naarIso(vandaag()) ? 'vandaag' : '', iso === gekozen ? 'gekozen' : ''].filter(Boolean).join(' ')
        const focus = iso === naarIso(focusDag)
        cellen += `<td><button type="button" class="${klassen}" data-iso="${iso}" tabindex="${focus ? 0 : -1}"${iso === gekozen ? ' aria-pressed="true"' : ''}${magNiet(d) ? ' disabled' : ''} aria-label="${DAGEN[k][1]} ${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}">${d.getDate()}</button></td>`
      }
      rijen += `<tr>${cellen}</tr>`
    }
    kalender.innerHTML = `
      <div class="eigen-kal-kop">
        <button type="button" class="eigen-kal-nav" data-stap="-1" aria-label="Vorige maand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="eigen-kal-titel" id="${kopId}" aria-live="polite">${MAANDEN[maand]} ${jaar}</span>
        <button type="button" class="eigen-kal-nav" data-stap="1" aria-label="Volgende maand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
      <table class="eigen-kal-raster" role="grid" aria-labelledby="${kopId}">
        <thead><tr>${DAGEN.map(([kort, lang]) => `<th scope="col" abbr="${lang}">${kort}</th>`).join('')}</tr></thead>
        <tbody>${rijen}</tbody>
      </table>
      <div class="eigen-kal-voet">
        <button type="button" class="eigen-kal-actie" data-actie="vandaag"${magNiet(vandaag()) ? ' disabled' : ''}>Vandaag</button>
        <button type="button" class="eigen-kal-actie" data-actie="leeg">Leegmaken</button>
      </div>`
  }
  function focusOp(gewenst) {
    const d = binnenGrens(gewenst)
    focusDag = d
    if (d.getMonth() !== toon.getMonth() || d.getFullYear() !== toon.getFullYear()) toon = new Date(d.getFullYear(), d.getMonth(), 1)
    teken()
    const dag = kalender.querySelector(`[data-iso="${naarIso(d)}"]:not([disabled])`)
    if (dag) dag.focus()
    else kalender.focus() // vangnet (bijv. min na max): de kalender zelf houdt de focus, Escape blijft werken
  }
  function open() {
    if (!kalender.hidden) return
    openSluiter?.sluit(false)
    const start = vanIso(PROTO_INPUT.get.call(veld)) || (minDatum() && minDatum() > vandaag() ? minDatum() : vandaag())
    toon = new Date(start.getFullYear(), start.getMonth(), 1)
    kalender.hidden = false
    knop.setAttribute('aria-expanded', 'true')
    omhulsel.classList.add('open')
    const r = knop.getBoundingClientRect()
    omhulsel.classList.toggle('omhoog', window.innerHeight - r.bottom < 340 && r.top > window.innerHeight - r.bottom)
    focusOp(start)
    openSluiter = { bevat: el => omhulsel.contains(el), sluit }
  }
  function sluit(focusTerug = true) {
    if (kalender.hidden) return
    kalender.hidden = true
    knop.setAttribute('aria-expanded', 'false')
    omhulsel.classList.remove('open', 'omhoog')
    if (openSluiter?.sluit === sluit) openSluiter = null
    if (focusTerug) knop.focus()
  }
  function kies(iso) {
    ongeldig = false
    tekst.value = naarTekst(iso)
    zetWaarde(iso)
    sluit(false)
    tekst.focus()
  }

  knop.setAttribute('aria-haspopup', 'dialog')
  knop.setAttribute('aria-expanded', 'false')
  knop.addEventListener('click', () => (kalender.hidden ? open() : sluit()))
  kalender.addEventListener('click', e => {
    const b = e.target.closest('button')
    if (!b || b.disabled) return
    if (b.dataset.iso) kies(b.dataset.iso)
    else if (b.dataset.stap) {
      const n = +b.dataset.stap
      const d = new Date(focusDag.getFullYear(), focusDag.getMonth() + n, 1)
      const dag = Math.min(focusDag.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
      focusDag = new Date(d.getFullYear(), d.getMonth(), dag)
      toon = new Date(d.getFullYear(), d.getMonth(), 1)
      teken()
      kalender.querySelector(`[data-stap="${n}"]`)?.focus()
    } else if (b.dataset.actie === 'vandaag') kies(naarIso(vandaag()))
    else if (b.dataset.actie === 'leeg') { ongeldig = false; tekst.value = ''; zetWaarde(''); sluit(false); tekst.focus() }
  })
  kalender.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); sluit(); return }
    if (e.key === 'Tab') {
      // Focus binnen de kalender houden
      const knoppen = [...kalender.querySelectorAll('button:not([disabled])')].filter(b => b.tabIndex !== -1)
      const i = knoppen.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); knoppen.at(-1).focus() }
      else if (!e.shiftKey && i === knoppen.length - 1) { e.preventDefault(); knoppen[0].focus() }
      return
    }
    const iso = e.target.dataset?.iso
    if (!iso) return
    const d = vanIso(iso)
    const plus = n => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
    const maand = n => { const x = new Date(d.getFullYear(), d.getMonth() + n, 1); return new Date(x.getFullYear(), x.getMonth(), Math.min(d.getDate(), new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())) }
    const nieuw = {
      ArrowLeft: () => plus(-1), ArrowRight: () => plus(1), ArrowUp: () => plus(-7), ArrowDown: () => plus(7),
      Home: () => plus(-((d.getDay() + 6) % 7)), End: () => plus(6 - ((d.getDay() + 6) % 7)),
      PageUp: () => maand(e.shiftKey ? -12 : -1), PageDown: () => maand(e.shiftKey ? 12 : 1),
    }[e.key]
    if (nieuw) { e.preventDefault(); focusOp(nieuw()) }
  })
}

export function startEigenVelden() {
  const verbeter = root => {
    root.querySelectorAll?.('select.form-input:not([data-eigen])').forEach(verbeterSelect)
    root.querySelectorAll?.('input.form-input[type="date"]:not([data-eigen])').forEach(verbeterDatum)
  }
  verbeter(document)
  new MutationObserver(lijst => {
    for (const m of lijst) for (const n of m.addedNodes) if (n.nodeType === 1) {
      if (n.matches('select.form-input:not([data-eigen])')) verbeterSelect(n)
      else if (n.matches('input.form-input[type="date"]:not([data-eigen])')) verbeterDatum(n)
      else verbeter(n)
    }
  }).observe(document.body, { childList: true, subtree: true })
}
