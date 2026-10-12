// NBG-BC1: finite boundary-transfer thought experiment inspired by BC200 literature.
// No biological sequences, causal inference from molecular data, or pathogen modeling.
export const BC1_PROTOCOL = Object.freeze({
  id: 'NBG-BC1',
  version: '0.1.0',
  origin: 'SIMULATED',
  authority: 'NONE',
  title: 'Boundary-Crossing Persistence',
  scientificMotivation: {
    title: 'Escape of the BC200 gene to a human poxvirus reveals its persistent transposition in primates',
    doi: '10.1126/science.aeh3441',
    publication: 'Science (2026), Gao et al.',
    interpretation: 'The study reports two BC200-derived insertions in molluscum contagiosum virus and proposes LINE-1-mediated retrotransposition.',
  },
  scope: 'Exact abstract binary-state experiment; not a model of actual BC200 sequences or infection.',
})

const BITS = Object.freeze([0, 1])
const requireBit = (name, value) => {
  if (!BITS.includes(value)) throw new RangeError(name + ' must be exactly 0 or 1')
}
export const BC1_DEFAULT = Object.freeze({ sourceBit: 0, machinery: 1, gate: 1, edit: 0 })

// Here "function" is an independent state variable, not a measured biological activity.
// Copying requires BOTH an external copying mechanism and an open modeled interface.
// A synthetic edit toggles one abstract bit after copying; it is not a BC200 mutation rate.
export function simulateBC1(config = BC1_DEFAULT) {
  if (!config || typeof config !== 'object') throw new TypeError('BC1 configuration object required')
  const {sourceBit, machinery, gate, edit} = config
  for (const [name, value] of Object.entries({sourceBit, machinery, gate, edit})) requireBit(name, value)
  const input = {sourceBit, machinery, gate, edit}
  const inserted = machinery === 1 && gate === 1
  const targetPayload = inserted ? sourceBit ^ edit : null
  const reason = inserted ? 'BOTH_PERMITTED' : machinery === 0 && gate === 0
    ? 'NO_MACHINERY_AND_CLOSED_GATE' : machinery === 0 ? 'NO_MACHINERY' : 'CLOSED_GATE'
  return {
    input,
    before: {donorFunction: 1, recipientPayload: null},
    after: {donorFunction: 1, recipientPayload: targetPayload},
    event: {kind: inserted ? 'INSERTION' : 'BLOCKED', reason},
    // A model-side trace, not authenticated evidence that a biological event happened.
    lineage: inserted ? {
      origin: 'SIMULATED_DONOR',
      destination: 'SIMULATED_RECEIVER',
      sourceBit,
      copiedBy: 'ABSTRACT_EXTERNAL_MACHINERY',
      editApplied: edit,
      targetPayload,
    } : null,
  }
}

export function observeBC1(run, level = 'K0') {
  if (!run || !run.before || !run.after || !run.input) throw new TypeError('BC1 run required')
  if (level === 'K0') return {donorFunction: run.before.donorFunction, recipientInitiallyEmpty: true}
  if (level === 'K1') return {
    donorFunction: run.after.donorFunction,
    recipientPayload: run.after.recipientPayload,
  }
  if (level === 'K2') return {
    ...observeBC1(run, 'K1'),
    sourceBit: run.input.sourceBit,
    machinery: run.input.machinery,
    gate: run.input.gate,
    edit: run.input.edit,
    lineage: run.lineage,
  }
  throw new RangeError('Unknown BC1 Keyhole')
}

export function enumerateBC1() {
  const rows = []
  for (const sourceBit of BITS)
    for (const machinery of BITS)
      for (const gate of BITS)
        for (const edit of BITS)
          rows.push(simulateBC1({sourceBit, machinery, gate, edit}))
  return rows
}

// A declared-input consistency check only. No signatures or tamper-proof storage.
export function verifyBC1Run(run) {
  if (!run || typeof run !== 'object' || !run.input) return false
  try {
    return JSON.stringify(simulateBC1(run.input)) === JSON.stringify(run)
  } catch {
    return false
  }
}
export function analyzeBC1(rows = enumerateBC1()) {
  if (!Array.isArray(rows) || rows.length !== 16 || rows.some(row => !verifyBC1Run(row)))
    throw new Error('BC1 analysis requires the exact canonical 16-state census')
  const distinct = level => new Set(rows.map(row => JSON.stringify(observeBC1(row, level)))).size
  const inserted = rows.filter(row => row.event.kind === 'INSERTION')
  const out0 = inserted.filter(row => row.after.recipientPayload === 0)
  const out1 = inserted.filter(row => row.after.recipientPayload === 1)
  const k0 = new Set(rows.map(row => JSON.stringify(observeBC1(row, 'K0'))))
  const insertionResults = new Set(rows.map(row => row.event.kind))
  // K0 is identical across all cases. The best constant insertion prediction is BLOCKED.
  const baselineCorrect = Math.max(inserted.length, rows.length - inserted.length)
  return {
    scenarios: rows.length,
    inserted: inserted.length,
    blocked: rows.length - inserted.length,
    donorFunctionRetained: rows.filter(row => row.after.donorFunction === 1).length,
    missingMachineryInsertions: rows.filter(row => row.input.machinery === 0 && row.event.kind === 'INSERTION').length,
    closedGateInsertions: rows.filter(row => row.input.gate === 0 && row.event.kind === 'INSERTION').length,
    observerClasses: {K0: distinct('K0'), K1: distinct('K1'), K2: distinct('K2')},
    coarseAliasing: k0.size === 1 && insertionResults.size > 1,
    identicalRecipientBitFromDistinctSources:
      [out0, out1].every(group => new Set(group.map(row => row.input.sourceBit)).size === 2),
    coarseMajorityCorrect: baselineCorrect,
    knownMechanismCorrect: rows.filter(row =>
      (row.input.machinery === 1 && row.input.gate === 1) === (row.event.kind === 'INSERTION')).length,
  }
}

export function buildBC1Receipt(config = BC1_DEFAULT) {
  const selected = simulateBC1(config)
  return {
    protocol: BC1_PROTOCOL,
    origin: 'SIMULATED',
    authority: 'NONE',
    selected,
    census: analyzeBC1(),
    controls: {
      positive: simulateBC1({sourceBit: 0, machinery: 1, gate: 1, edit: 0}),
      negativeNoMachinery: simulateBC1({sourceBit: 0, machinery: 0, gate: 1, edit: 0}),
      negativeClosedGate: simulateBC1({sourceBit: 0, machinery: 1, gate: 0, edit: 0}),
      mutationCollision: [
        simulateBC1({sourceBit: 0, machinery: 1, gate: 1, edit: 1}),
        simulateBC1({sourceBit: 1, machinery: 1, gate: 1, edit: 0}),
      ],
    },
    claimBoundary: 'Toy copying is defined by model rules. Does not predict BC200 biology, gene therapy, viral traits, or prove NBG is a law of nature.',
  }
}
