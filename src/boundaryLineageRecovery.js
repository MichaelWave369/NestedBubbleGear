// NBG-BC2 · exact abstract information-recovery toy model.
// Inspired by the limits of inferring genetic lineage from a copied element.
// No real biological sequence, pathogen, molecular dynamics or medical prediction.
export const BC2_PROTOCOL = Object.freeze({
  id: 'NBG-BC2',
  version: '0.1.0',
  origin: 'SIMULATED',
  authority: 'NONE',
  question: 'Which witness information suffices to recover source lineage, and when must an observer refuse?',
  motivationDOI: '10.1126/science.aeh3441',
  scope: 'Finite 2-bit XOR provenance model; no measured biology or independent experiment.',
})

export const BC2_MODES = Object.freeze([
  'RECIPIENT_ONLY',
  'PARITY_WITNESS',
  'DUPLICATE_PARITY',
  'FULL_WITNESS',
  'FULL_CROSSCHECK',
  'FORGED_UNCHECKED',
  'FORGED_CONFLICT',
  'COORDINATED_FORGERY',
])

const VALUE_SET = Object.freeze([0, 1, 2, 3])
const bit2 = (name, value) => {
  if (!VALUE_SET.includes(value)) throw new RangeError(name + ' must be integer 0..3')
}
export const parity2 = value => {
  bit2('value', value)
  return (value & 1) ^ ((value >> 1) & 1)
}

export function makeBC2World({source, edit}) {
  bit2('source', source)
  bit2('edit', edit)
  return {
    truth: {source, edit},
    recipient: {payload: source ^ edit},
  }
}

export const enumerateBC2Worlds = () =>
  VALUE_SET.flatMap(source => VALUE_SET.map(edit => makeBC2World({source, edit})))

function witness(kind, value, lineage = 'TRACE_A') { return {kind, value, lineage} }

// Simulated observer-facing evidence. The ground-truth source is deliberately absent.
export function makeBC2Observation(world, mode = 'RECIPIENT_ONLY') {
  if (!BC2_MODES.includes(mode)) throw new RangeError('Unknown BC2 mode')
  if (!world || !world.truth || !world.recipient) throw new TypeError('World required')
  const verifiedWorld = makeBC2World(world.truth)
  if (JSON.stringify(world) !== JSON.stringify(verifiedWorld)) throw new TypeError('Inconsistent world')
  const {edit} = world.truth
  const payload = world.recipient.payload
  const parity = parity2(edit)
  const forgedEdit = edit ^ 1
  const observation = {payload, witness: null, duplicate: null, shadow: null}
  if (mode === 'RECIPIENT_ONLY') return observation
  if (mode === 'PARITY_WITNESS') observation.witness = witness('PARITY', parity)
  if (mode === 'DUPLICATE_PARITY') {
    observation.witness = witness('PARITY', parity)
    observation.duplicate = witness('PARITY', parity) // one lineage, not extra evidence
  }
  if (mode === 'FULL_WITNESS') observation.witness = witness('FULL', edit)
  if (mode === 'FULL_CROSSCHECK') {
    observation.witness = witness('FULL', edit)
    observation.shadow = witness('PARITY', parity, 'TRACE_B')
  }
  if (mode === 'FORGED_UNCHECKED') observation.witness = witness('FULL', forgedEdit)
  if (mode === 'FORGED_CONFLICT') {
    observation.witness = witness('FULL', forgedEdit)
    observation.shadow = witness('PARITY', parity, 'TRACE_B')
  }
  if (mode === 'COORDINATED_FORGERY') {
    observation.witness = witness('FULL', forgedEdit)
    observation.shadow = witness('PARITY', parity2(forgedEdit), 'TRACE_B')
  }
  return observation
}

function validateWitness(item, expectedLineage, allowFull) {
  if (item === null) return
  if (!item || typeof item !== 'object' || Array.isArray(item)
    || Object.keys(item).sort().join(',') !== 'kind,lineage,value'
    || item.lineage !== expectedLineage || !['FULL','PARITY'].includes(item.kind)
    || (!allowFull && item.kind !== 'PARITY')) throw new TypeError('Invalid witness schema')
  const max = item.kind === 'FULL' ? 3 : 1
  if (!Number.isInteger(item.value) || item.value < 0 || item.value > max)
    throw new RangeError('Witness value invalid')
}

function validateView(view) {
  if (!view || typeof view !== 'object' || Array.isArray(view)
    || Object.keys(view).sort().join(',') !== 'duplicate,payload,shadow,witness')
    throw new TypeError('Observer view must contain only payload and allowed witnesses; truth is excluded')
  bit2('payload', view.payload)
  validateWitness(view.witness, 'TRACE_A', true)
  validateWitness(view.duplicate, 'TRACE_A', true)
  validateWitness(view.shadow, 'TRACE_B', false)
  if (view.duplicate && !view.witness)
    throw new TypeError('A duplicate requires an original witness')
}

function compatible(edit, item) {
  return item === null || (item.kind === 'FULL' ? edit === item.value : parity2(edit) === item.value)
}

// This function only receives an observer projection, not the hidden ground truth.
// Candidate enumeration is exhaustive; priors are uniform solely within this toy census.
export function inferBC2(view) {
  validateView(view)
  const duplicateCollapsed = view.duplicate !== null
  const declaredLineages = [...new Set([view.witness?.lineage, view.shadow?.lineage]
    .filter(Boolean))].sort()

  const conflict = (view.duplicate && (view.duplicate.kind !== view.witness.kind
    || view.duplicate.value !== view.witness.value))
    || (view.witness && view.shadow && view.witness.kind === 'FULL'
      && parity2(view.witness.value) !== view.shadow.value)
    || (view.witness && view.shadow && view.witness.kind === 'PARITY'
      && view.witness.value !== view.shadow.value)

  if (conflict) return {
    status: 'REFUSE_CONFLICT', recoveredSource: null, candidateSources: [],
    candidateWorlds: 0, residualBits: null, duplicateCollapsed, declaredLineages,
  }

  const consistentWorlds = enumerateBC2Worlds().filter(world =>
    world.recipient.payload === view.payload
    && compatible(world.truth.edit, view.witness)
    && compatible(world.truth.edit, view.shadow))
  const candidateSources = [...new Set(consistentWorlds.map(world => world.truth.source))]
    .sort((a,b) => a-b)
  if (candidateSources.length === 0) return {
    status: 'REFUSE_CONFLICT', recoveredSource: null, candidateSources: [],
    candidateWorlds: 0, residualBits: null, duplicateCollapsed, declaredLineages,
  }

  const unique = candidateSources.length === 1
  return {
    status: unique ? 'RECOVERED_UNIQUE' : 'REFUSE_AMBIGUOUS',
    recoveredSource: unique ? candidateSources[0] : null,
    candidateSources,
    candidateWorlds: consistentWorlds.length,
    residualBits: Math.log2(candidateSources.length),
    duplicateCollapsed, declaredLineages,
  }
}

export function analyzeBC2() {
  const worlds = enumerateBC2Worlds()
  const runs = BC2_MODES.map(mode => {
    const results = worlds.map(world => {
      const observation = makeBC2Observation(world, mode)
      const inferred = inferBC2(observation)
      return {world, inferred}
    })
    const unique = results.filter(row => row.inferred.status === 'RECOVERED_UNIQUE')
    const ambiguous = results.filter(row => row.inferred.status === 'REFUSE_AMBIGUOUS')
    const conflicted = results.filter(row => row.inferred.status === 'REFUSE_CONFLICT')
    return {
      mode,
      total: results.length,
      unique: unique.length,
      ambiguous: ambiguous.length,
      conflicted: conflicted.length,
      correct: unique.filter(row => row.inferred.recoveredSource === row.world.truth.source).length,
      falseUnique: unique.filter(row => row.inferred.recoveredSource !== row.world.truth.source).length,
      residualBits: mode === 'FORGED_CONFLICT' ? null :
        results.reduce((sum,row) => sum + row.inferred.residualBits,0) / results.length,
      duplicateCollapsed: results.every(row => row.inferred.duplicateCollapsed === (mode === 'DUPLICATE_PARITY')),
    }
  })
  return {worlds: worlds.length, modes: runs}
}

export function buildBC2Receipt(config = {source: 0, edit: 0, mode: 'RECIPIENT_ONLY'}) {
  if (!config || typeof config !== 'object' ||
    Object.keys(config).sort().join(',') !== 'edit,mode,source')
    throw new TypeError('BC2 config requires source, edit and mode only')
  const selectedWorld = makeBC2World(config)
  const observation = makeBC2Observation(selectedWorld, config.mode)
  const inference = inferBC2(observation)
  return {
    protocol: BC2_PROTOCOL,
    origin: 'SIMULATED',
    authority: 'NONE',
    selected: {
      mode: config.mode,
      observation,
      inference,
      scoringTruth: selectedWorld.truth, // separated from observer input
      postHocCorrect: inference.recoveredSource === null
        ? null : inference.recoveredSource === selectedWorld.truth.source,
    },
    census: analyzeBC2(),
    claimBoundary: 'In-model exhaustive information accounting, not empirical source attribution or authentication. Matched forged witnesses can deceive this observer.',
  }
}
