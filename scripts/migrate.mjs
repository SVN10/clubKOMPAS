// VEROUDERD: werkte op de oude structuur clubs/{uid}/pijlers en clubs/{uid}/domeinen (vóór P0c).
// Sinds P0e weigert dit script altijd; de oorspronkelijke code staat in de git-geschiedenis.
// Gebruik: geen. Zie scripts/import-hca.mjs of scripts/seed-testclub.mjs.

import { stop } from './lib/omgeving.mjs'

stop('dit script is verouderd en draait niet meer.', [
  'Het werkte op de oude structuur clubs/{uid} van vóór P0c en zou nu dubbele domeinen maken.',
  'Gebruik scripts/import-hca.mjs of, voor de testclub, scripts/seed-testclub.mjs.',
])
