import assert from 'node:assert/strict'
import test from 'node:test'
import {BR1_PRESETS,BR1_PROTOCOL,simulateBR1,buildBR1Receipt,validateBR1} from '../src/balanceRecoveryModel.js'

test('invalid inputs fail closed, including NaN and excessive settings',()=>{
  assert.throws(()=>validateBR1({coupling:NaN}),/coupling/)
  assert.throws(()=>simulateBR1({timeStep:0}),/timeStep/)
  assert.throws(()=>simulateBR1({asymmetry:9}),/asymmetry/)
  assert.throws(()=>simulateBR1({kick:-1}),/kick/)
})
test('zero perturbation has zero trajectory residue',()=>{
  const r=simulateBR1({kick:0})
  assert.equal(r.metrics.finalResidue,0)
  assert.equal(r.metrics.peakResidue,0)
  assert.ok(r.trace.every(v=>v.residue===0))
})
test('stable reciprocal configuration recovers after pulse',()=>{
  const r=simulateBR1(BR1_PRESETS.reciprocal)
  assert.equal(r.protocol,BR1_PROTOCOL)
  assert.equal(r.metrics.recovered,true)
  assert.ok(r.metrics.finalResidue<r.metrics.threshold)
  assert.ok(r.metrics.recoveryTime>0)
})
test('weak damping slows or prevents recovery relative to reciprocal baseline',()=>{
  const strong=simulateBR1(BR1_PRESETS.reciprocal)
  const weak=simulateBR1(BR1_PRESETS.weakDamping)
  assert.ok(!weak.metrics.recovered||weak.metrics.recoveryTime>strong.metrics.recoveryTime)
})
test('uncoupled control cannot establish B velocity correlation',()=>{
  const r=simulateBR1(BR1_PRESETS.uncoupled)
  assert.equal(r.coupling.aReceivesFromB,0)
  assert.equal(r.coupling.bReceivesFromA,0)
  assert.equal(r.metrics.velocityCorrelation,null)
})
test('increased asymmetry explicitly changes directed coupling',()=>{
  const r=simulateBR1(BR1_PRESETS.asymmetric)
  assert.ok(r.coupling.aReceivesFromB<r.coupling.bReceivesFromA)
})
test('negative damping is labeled an unstable control, not chaos',()=>{
  const r=simulateBR1(BR1_PRESETS.negativeDamping)
  assert.equal(r.sourceClass,'SIMULATED')
  assert.equal(r.claimClass,'SYNTHETIC_MODEL_ONLY')
  assert.ok(!r.metrics.recovered)
})
test('repeat execution deterministic and receipt excludes trajectories',()=>{
  const a=simulateBR1(),b=simulateBR1()
  assert.deepEqual(a,b)
  const receipt=buildBR1Receipt(a)
  assert.equal(receipt.origin,'SIMULATED')
  assert.equal(receipt.authority,'NONE')
  assert.ok(!('trace' in receipt))
  assert.ok(!JSON.stringify(receipt).includes('perturbedA'))
})
