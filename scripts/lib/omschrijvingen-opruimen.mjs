// Omschrijvingen opruimen (CK-179): domeinen, commissies, projecten en samenwerkingen hebben geen
// omschrijving meer. Zonder Firestore-aanroepen, zodat de regeltests dezelfde logica kunnen toetsen.

export const OPRUIM_LIJSTEN = ['structuurelementen', 'commissies', 'projecten', 'samenwerkingen']

// lijsten: { structuurelementen: [{ id, ...data }], ... } → [{ lijst, id, naam, tekst }]
export function planOpruimen(lijsten) {
  const weg = []
  for (const lijst of OPRUIM_LIJSTEN) {
    for (const x of lijsten[lijst] || []) {
      if (!Object.hasOwn(x, 'omschrijving')) continue
      const naam = typeof x.naam === 'string' && x.naam ? x.naam : `(zonder naam, ${x.id})`
      weg.push({ lijst, id: x.id, naam, tekst: typeof x.omschrijving === 'string' ? x.omschrijving : JSON.stringify(x.omschrijving) })
    }
  }
  return weg
}
