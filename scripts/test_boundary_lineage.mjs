import assert from 'node:assert/strict'
import {
  BC2_PROTOCOL, BC2_MODES, parity2, makeBC2World, enumerateBC2Worlds,
  makeBC2Observation, inferBC2, analyzeBC2, buildBC2Receipt,
} from '../src/boundaryLineageRecovery.js'

const tests = [
  ['two-bit worlds enumerate 16 unique source/edit configurations', () => {
    const worlds = enumerateBC2Worlds()
    assert.equal(worlds.length,16)
    assert.equal(new Set(worlds.map(world => JSON.stringify(world.truth))).size,16)
    assert.deepEqual([0,1,2,3].map(parity2),[0,1,1,0])
  }],
  ['ground-truth origin never enters the inference input', () => {
    for (const world of enumerateBC2Worlds()) for (const mode of BC2_MODES) {
      const view = makeBC2Observation(world,mode)
      assert.deepEqual(Object.keys(view).sort(), ['duplicate','payload','shadow','witness'])
      assert.ok(!JSON.stringify(view).includes('"source"'))
      assert.ok(!JSON.stringify(view).includes('"edit"'))
      assert.throws(() => inferBC2({...view,truth:world.truth}),TypeError)
    }
  }],
  ['recipient-only observer has four compatible sources and refuses', () => {
    for (const world of enumerateBC2Worlds()) {
      const r = inferBC2(makeBC2Observation(world,'RECIPIENT_ONLY'))
      assert.equal(r.status,'REFUSE_AMBIGUOUS')
      assert.equal(r.candidateSources.length,4)
      assert.equal(r.residualBits,2)
    }
  }],
  ['parity witness retains two candidates, so the observer refuses', () => {
    for (const world of enumerateBC2Worlds()) {
      const r = inferBC2(makeBC2Observation(world,'PARITY_WITNESS'))
      assert.equal(r.status,'REFUSE_AMBIGUOUS')
      assert.equal(r.candidateSources.length,2)
      assert.equal(r.residualBits,1)
      assert.ok(r.candidateSources.includes(world.truth.source))
    }
  }],
  ['duplicated evidence from one lineage cannot manufacture certainty', () => {
    for (const world of enumerateBC2Worlds()) {
      const simple = inferBC2(makeBC2Observation(world,'PARITY_WITNESS'))
      const copied = inferBC2(makeBC2Observation(world,'DUPLICATE_PARITY'))
      assert.deepEqual(simple.candidateSources,copied.candidateSources)
      assert.equal(copied.duplicateCollapsed,true)
      assert.deepEqual(copied.declaredLineages,['TRACE_A'])
      assert.equal(copied.status,'REFUSE_AMBIGUOUS')
    }
  }],
  ['honest full witness uniquely recovers the source', () => {
    for (const mode of ['FULL_WITNESS','FULL_CROSSCHECK']) {
      for (const world of enumerateBC2Worlds()) {
        const result = inferBC2(makeBC2Observation(world,mode))
        assert.equal(result.status,'RECOVERED_UNIQUE')
        assert.equal(result.recoveredSource,world.truth.source)
        assert.equal(result.residualBits,0)
      }
    }
  }],
  ['uncontested false edit witness yields confidently incorrect attribution', () => {
    for (const world of enumerateBC2Worlds()) {
      const result = inferBC2(makeBC2Observation(world,'FORGED_UNCHECKED'))
      assert.equal(result.status,'RECOVERED_UNIQUE')
      assert.notEqual(result.recoveredSource,world.truth.source)
    }
  }],
  ['discordant independent-looking parity record triggers refusal, not guessing', () => {
    for (const world of enumerateBC2Worlds()) {
      const result = inferBC2(makeBC2Observation(world,'FORGED_CONFLICT'))
      assert.equal(result.status,'REFUSE_CONFLICT')
      assert.equal(result.recoveredSource,null)
      assert.equal(result.residualBits,null)
    }
  }],
  ['coordinated false records defeat the consistency check', () => {
    for (const world of enumerateBC2Worlds()) {
      const result = inferBC2(makeBC2Observation(world,'COORDINATED_FORGERY'))
      assert.equal(result.status,'RECOVERED_UNIQUE')
      assert.notEqual(result.recoveredSource,world.truth.source)
      assert.deepEqual(result.declaredLineages,['TRACE_A','TRACE_B'])
    }
  }],
  ['invalid input, duplicate contradictions, and unknown observation fields are refused', () => {
    assert.throws(() => makeBC2World({source:4,edit:0}),RangeError)
    assert.throws(() => makeBC2Observation(makeBC2World({source:0,edit:0}),'WHO_KNOWS'),RangeError)
    const view = makeBC2Observation(makeBC2World({source:0,edit:0}),'DUPLICATE_PARITY')
    view.duplicate.value ^= 1
    assert.equal(inferBC2(view).status,'REFUSE_CONFLICT')
    assert.throws(() => inferBC2({payload:0,witness:null,shadow:null}),TypeError)
    assert.throws(() => inferBC2({payload:0,witness:null,duplicate:null,shadow:null,secret:1}),TypeError)
    assert.throws(() => inferBC2({payload:0,witness:{kind:'FULL',value:7,lineage:'TRACE_A'},duplicate:null,shadow:null}),RangeError)
  }],
  ['frozen census catches both successes and hard failure controls', () => {
    const byMode = Object.fromEntries(analyzeBC2().modes.map(row => [row.mode,row]))
    for (const name of ['RECIPIENT_ONLY','PARITY_WITNESS','DUPLICATE_PARITY']) {
      assert.equal(byMode[name].ambiguous,16)
      assert.equal(byMode[name].unique,0)
    }
    assert.equal(byMode.RECIPIENT_ONLY.residualBits,2)
    assert.equal(byMode.PARITY_WITNESS.residualBits,1)
    assert.equal(byMode.DUPLICATE_PARITY.residualBits,1)
    for (const name of ['FULL_WITNESS','FULL_CROSSCHECK']) {
      assert.equal(byMode[name].correct,16)
      assert.equal(byMode[name].falseUnique,0)
    }
    for (const name of ['FORGED_UNCHECKED','COORDINATED_FORGERY']) {
      assert.equal(byMode[name].falseUnique,16)
      assert.equal(byMode[name].correct,0)
    }
    assert.equal(byMode.FORGED_CONFLICT.conflicted,16)
    assert.equal(byMode.FORGED_CONFLICT.unique,0)
    assert.equal(byMode.FORGED_CONFLICT.residualBits,null)
  }],
  ['receipt reproducible, source cited and governed as SIMULATED', () => {
    assert.equal(BC2_PROTOCOL.origin,'SIMULATED')
    assert.equal(BC2_PROTOCOL.authority,'NONE')
    assert.equal(BC2_PROTOCOL.motivationDOI,'10.1126/science.aeh3441')
    assert.deepEqual(buildBC2Receipt(),buildBC2Receipt())
    assert.equal(buildBC2Receipt().selected.observation.source,undefined)
    assert.equal(buildBC2Receipt().selected.scoringTruth.source,0)
    assert.equal(buildBC2Receipt().origin,'SIMULATED')
  }],
]
let passed = 0
for (const [name,test] of tests) {
  test()
  passed++
  console.log('PASS '+name)
}
console.log('NBG-BC2 '+passed+'/'+tests.length+' PASS · exact toy inference only')
