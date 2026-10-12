import assert from 'node:assert/strict'
import {
  BC1_PROTOCOL, BC1_DEFAULT, simulateBC1, observeBC1, enumerateBC1,
  analyzeBC1, buildBC1Receipt, verifyBC1Run,
} from '../src/boundaryCrossingPersistence.js'

const tests = [
  ['finite census is exhaustive and unique', () => {
    const rows = enumerateBC1()
    assert.equal(rows.length, 16)
    assert.equal(new Set(rows.map(r => JSON.stringify(r.input))).size, 16)
  }],
  ['baseline donor function survives both blocked and inserted outcomes', () => {
    assert.ok(enumerateBC1().every(r => r.before.donorFunction === 1 && r.after.donorFunction === 1))
  }],
  ['insertion requires BOTH machinery and interface permission', () => {
    const rows = enumerateBC1()
    assert.equal(rows.filter(r => r.event.kind === 'INSERTION').length, 4)
    assert.ok(rows.every(r => (r.event.kind === 'INSERTION') === (r.input.machinery === 1 && r.input.gate === 1)))
  }],
  ['negative controls block transfer independently', () => {
    assert.equal(simulateBC1({sourceBit: 0,machinery: 0,gate: 1,edit: 0}).event.reason, 'NO_MACHINERY')
    assert.equal(simulateBC1({sourceBit: 0,machinery: 1,gate: 0,edit: 0}).event.reason, 'CLOSED_GATE')
    assert.equal(simulateBC1({sourceBit: 0,machinery: 0,gate: 0,edit: 0}).lineage, null)
  }],
  ['coarse pre-transfer Keyhole aliases divergent futures', () => {
    const a = simulateBC1({sourceBit: 0,machinery: 1,gate: 1,edit: 0})
    const b = simulateBC1({sourceBit: 0,machinery: 0,gate: 1,edit: 0})
    assert.deepEqual(observeBC1(a,'K0'), observeBC1(b,'K0'))
    assert.notEqual(a.after.recipientPayload, b.after.recipientPayload)
  }],
  ['recipient-only K1 collides across distinct source lineages', () => {
    const a = simulateBC1({sourceBit: 0,machinery: 1,gate: 1,edit: 1})
    const b = simulateBC1({sourceBit: 1,machinery: 1,gate: 1,edit: 0})
    assert.deepEqual(observeBC1(a,'K1'), observeBC1(b,'K1'))
    assert.notDeepEqual(observeBC1(a,'K2'), observeBC1(b,'K2'))
    assert.equal(a.lineage.sourceBit, 0)
    assert.equal(b.lineage.sourceBit, 1)
  }],
  ['all 16 scenarios have declared consistent traces', () => {
    assert.ok(enumerateBC1().every(verifyBC1Run))
  }],
  ['tampered lineage and output are rejected by consistency check', () => {
    const run = simulateBC1()
    run.lineage.sourceBit = 1
    assert.equal(verifyBC1Run(run), false)
    const another = simulateBC1()
    another.after.recipientPayload = 1
    assert.equal(verifyBC1Run(another), false)
  }],
  ['invalid values and invalid observers are refused', () => {
    assert.throws(() => simulateBC1({sourceBit: 2,machinery: 1,gate: 1,edit: 0}), RangeError)
    assert.throws(() => simulateBC1({sourceBit: 0,machinery: true,gate: 1,edit: 0}), RangeError)
    assert.throws(() => observeBC1(simulateBC1(), 'K99'), RangeError)
    assert.throws(() => analyzeBC1([]))
  }],
  ['exact census observability and baseline criteria', () => {
    const a = analyzeBC1()
    assert.equal(a.scenarios, 16)
    assert.equal(a.inserted, 4)
    assert.equal(a.blocked, 12)
    assert.equal(a.donorFunctionRetained, 16)
    assert.equal(a.missingMachineryInsertions, 0)
    assert.equal(a.closedGateInsertions, 0)
    assert.deepEqual(a.observerClasses, {K0: 1, K1: 3, K2: 16})
    assert.equal(a.coarseAliasing, true)
    assert.equal(a.identicalRecipientBitFromDistinctSources, true)
    assert.equal(a.coarseMajorityCorrect, 12)
    assert.equal(a.knownMechanismCorrect, 16)
  }],
  ['receipt is deterministic, source-attributed and simulation-labelled', () => {
    assert.equal(BC1_PROTOCOL.origin, 'SIMULATED')
    assert.equal(BC1_PROTOCOL.authority, 'NONE')
    assert.equal(BC1_PROTOCOL.scientificMotivation.doi, '10.1126/science.aeh3441')
    assert.deepEqual(buildBC1Receipt(), buildBC1Receipt({...BC1_DEFAULT}))
    assert.equal(buildBC1Receipt().origin, 'SIMULATED')
    assert.equal(buildBC1Receipt().authority, 'NONE')
  }],
]
let passed = 0
for (const [name, test] of tests) {
  test()
  passed++
  console.log('PASS ' + name)
}
console.log('NBG-BC1 ' + passed + '/' + tests.length + ' PASS · SIMULATED finite-state model only')
