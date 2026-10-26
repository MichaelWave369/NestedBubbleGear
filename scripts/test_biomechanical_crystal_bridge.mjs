import assert from 'node:assert/strict'
import {
  BSR3_VERSION, BSR3_DEFAULTS, BSR3_ELEMENTARY_CHARGE, normalizeBSR3,
  simulateBSR3, compareBSR3, buildBSR3Receipt,
} from '../src/biomechanicalCrystalBridge.js'
let passed = 0
const check = (title, run) => { run(); passed++; console.log('PASS',title) }
const near = (a,b,tol=1e-12) => assert.ok(Math.abs(a-b) <= tol*Math.max(1,Math.abs(a),Math.abs(b)),`expected ${a} ≈ ${b}`)
const bundle = compareBSR3()
check('frozen sample grid and finite synthetic traces', () => {
  const x=bundle.candidate
  assert.equal(x.version, BSR3_VERSION)
  assert.equal(x.provenance,'SIMULATED')
  assert.equal(x.samples.length,2001)
  assert.equal(x.samples[0].timeSec,0)
  assert.equal(x.samples.at(-1).timeSec,20)
  assert.ok(x.samples.every(row=>Object.values(row).every(Number.isFinite)))
  assert.deepEqual(x,simulateBSR3())
})
check('zero coefficient null gives exactly zero voltage and charge',()=>{
  assert.equal(bundle.nullCoefficient.peaks.voltageV,0)
  assert.ok(bundle.nullCoefficient.samples.every(x=>x.voltageV===0 && x.chargeC===0))
})
check('zero applied stress gives exactly zero voltage and charge',()=>{
  assert.equal(bundle.nullStress.peaks.voltageV,0)
  assert.ok(bundle.nullStress.samples.every(x=>x.voltageV===0 && x.chargeC===0))
})
check('positive coefficient and stress yield positive peak response',()=>{
  assert.ok(bundle.reference.peaks.voltageV>0)
  assert.ok(bundle.candidate.peaks.voltageV>0)
})
check('voltage and charge obey constitutive equation at every sample',()=>{
  const x=bundle.candidate, {capacitanceF,areaM2}=x.geometry
  for(const row of x.samples){
    near(row.forceN,row.stressPa*areaM2)
    near(row.chargeC,row.forceN*x.settings.effectiveDPcPerN*1e-12)
    near(row.voltageV,row.chargeC/capacitanceF)
  }
})
check('doubling d_eff doubles charge and voltage, not applied force',()=>{
  const a=simulateBSR3({effectiveDPcPerN:0.4})
  const b=simulateBSR3({effectiveDPcPerN:0.8})
  near(b.peaks.chargeC,2*a.peaks.chargeC)
  near(b.peaks.voltageV,2*a.peaks.voltageV)
  near(b.peaks.forceN,a.peaks.forceN)
})
check('doubling stress doubles voltage and charge',()=>{
  const a=simulateBSR3({stressPa:200}),b=simulateBSR3({stressPa:400})
  near(b.peaks.chargeC,2*a.peaks.chargeC)
  near(b.peaks.voltageV,2*a.peaks.voltageV)
})
check('larger length changes voltage while force scales with assumed area',()=>{
  const a=simulateBSR3({crystalSizeUm:5})
  const b=simulateBSR3({crystalSizeUm:10})
  near(b.peaks.voltageV,2*a.peaks.voltageV)
  near(b.peaks.forceN,4*a.peaks.forceN)
})
check('oscillating stresses and electrical signals reverse sign',()=>{
  const samples=bundle.candidate.samples
  assert.ok(samples.some(x=>x.stressPa>0 && x.voltageV>0))
  assert.ok(samples.some(x=>x.stressPa<0 && x.voltageV<0))
})
check('inputs are bounded and invalid entries fall back to frozen defaults',()=>{
  const p=normalizeBSR3({stressPa:-1,effectiveDPcPerN:1e9,frequencyHz:NaN,crystalSizeUm:Infinity})
  assert.equal(p.stressPa,0)
  assert.equal(p.effectiveDPcPerN,2.5)
  assert.equal(p.frequencyHz,BSR3_DEFAULTS.frequencyHz)
  assert.equal(p.crystalSizeUm,BSR3_DEFAULTS.crystalSizeUm)
})
check('charge equivalent to elementary charge is explicitly recorded',()=>{
  const x=bundle.candidate
  near(x.peaks.chargeEquivalentElementaryUnits,x.peaks.chargeC/BSR3_ELEMENTARY_CHARGE)
})
check('receipt is summary-only with no inferred physiological evidence',()=>{
  const receipt=buildBSR3Receipt(bundle)
  assert.equal(receipt.provenance,'SIMULATED')
  assert.equal(receipt.rawSamplesIncluded,false)
  assert.ok(!('samples' in receipt))
  assert.equal(receipt.controls.zeroCouplingPeakVoltageV,0)
  assert.equal(receipt.controls.zeroStressPeakVoltageV,0)
  assert.match(receipt.exclusions.join(' '),/pineal/)
  assert.ok(receipt.references.length>=3)
})
console.log(`BSR-3: ${passed}/${passed} synthetic tests PASS; biological claim NOT established.`)
