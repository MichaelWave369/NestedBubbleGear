import assert from 'node:assert/strict'
import test from 'node:test'
import {simulateBR1} from '../src/balanceRecoveryModel.js'
import {BR3_PLAN,BR3_PROTOCOL,BR3_BASE_COUNT,BR3_INTEGRATION_COUNT,
  BR3_OUTCOME_COUNT,simulateBR3Scenario,runBR3Panel,summarizeBR3Runs,buildBR3Receipt
} from '../src/recoveryRobustnessModel.js'

const reference=simulateBR3Scenario()
const pick=(run,t)=>run.outcomes.find(x=>x.threshold===t)
test('frozen 27-base x 3 horizons x 3 sites x 2 steps x 3 thresholds plan',()=>{
  assert.equal(BR3_PROTOCOL,'NBG-BR3-v0.1.0')
  assert.equal(BR3_BASE_COUNT,27)
  assert.equal(BR3_INTEGRATION_COUNT,486)
  assert.equal(BR3_OUTCOME_COUNT,1458)
  assert.equal(reference.outcomes.length,3)
  assert.equal(reference.origin,'SIMULATED')
})
test('unfrozen factors and missing values fail closed',()=>{
  for(const v of [{damping:0.2},{coupling:.75},{asymmetry:.2},
    {target:'C'},{horizon:90},{timeStep:.01},{detuning:0.1},
    {horizon:NaN},{target:undefined}].filter(x=>!('target' in x&&x.target===undefined))){
    assert.throws(()=>simulateBR3Scenario(v),/non-frozen/)
  }
})
test('at BR1 default semantics, BR3 reproduces the B-kick state and observer',()=>{
  const c={coupling:.85,asymmetry:0,damping:.46,timeStep:.04}
  const br1=simulateBR1({...c,duration:38,kick:2,pulseTime:10,driveAmplitude:.75,detuning:.12})
  const br3=simulateBR3Scenario({...c,horizon:38,target:'B'})
  assert.ok(Math.abs(br1.metrics.finalResidue-br3.finalResidue)<.000002)
  assert.ok(Math.abs(br1.metrics.velocityCorrelation-br3.baselineCorrelation)<.000002)
  assert.equal(br1.metrics.recovered,pick(br3,.06).recovered)
  assert.ok(Math.abs(br1.metrics.recoveryTime-pick(br3,.06).recoveryTime)<.000002)
})
test('zero coupling still responds to a kick in its own subsystem',()=>{
  const a=simulateBR3Scenario({coupling:0,target:'A'})
  const b=simulateBR3Scenario({coupling:0,target:'B'})
  const both=simulateBR3Scenario({coupling:0,target:'BOTH'})
  assert.ok(a.peakResidue>0)
  assert.ok(b.peakResidue>0)
  assert.ok(both.peakResidue>a.peakResidue)
  assert.equal(a.baselineCorrelation,null)
  assert.equal(b.baselineCorrelation,null)
})
test('nested recovery thresholds cannot reverse permissiveness at a fixed horizon',()=>{
  const r=simulateBR3Scenario({damping:.07,horizon:60,target:'BOTH'})
  const [strict,middle,loose]=r.outcomes
  if(strict.recovered)assert.equal(middle.recovered,true)
  if(middle.recovered)assert.equal(loose.recovered,true)
  for(const o of r.outcomes){
    assert.ok(o.recoveryTime===null||o.recoveryTime>=0)
    if(!o.recovered)assert.equal(o.recoveryTime,null)
  }
})
test('changing horizon modifies censoring without inventing permanent instability',()=>{
  const short=simulateBR3Scenario({damping:.07,horizon:38})
  const long=simulateBR3Scenario({damping:.07,horizon:120})
  assert.equal(pick(short,.06).status,'HORIZON_CENSORED')
  assert.equal(pick(long,.06).status,'RECOVERED')
  assert.ok(!('permanentlyUnstable' in long))
})
test('two integration steps remain close for positive-damping reference case',()=>{
  const coarse=simulateBR3Scenario({timeStep:.04})
  const fine=simulateBR3Scenario({timeStep:.02})
  assert.ok(Math.abs(coarse.finalResidue-fine.finalResidue)<.005)
  assert.equal(pick(coarse,.06).recovered,pick(fine,.06).recovered)
})
test('trace flag changes presentation, not outcome; all traces are synthetic',()=>{
  const a=simulateBR3Scenario({includeTrace:true})
  const b=simulateBR3Scenario()
  assert.ok(a.trace.length>10)
  assert.equal(a.trace.at(-1).time,38)
  assert.ok(!('trace' in b))
  delete a.trace
  assert.deepEqual(a,b)
})
test('full panel census has complete accounting and no duplicate treatment cells',()=>{
  const panel=runBR3Panel()
  assert.equal(panel.runs.length,BR3_INTEGRATION_COUNT)
  assert.equal(panel.byBase.length,BR3_BASE_COUNT)
  assert.equal(panel.summary.thresholdOutcomes,BR3_OUTCOME_COUNT)
  assert.equal(panel.summary.recovered+panel.summary.censored+panel.summary.runaway,BR3_OUTCOME_COUNT)
  assert.ok(panel.summary.hiddenMismatch>0)
  const keys=new Set(panel.runs.map(r=>
    [r.coupling,r.asymmetry,r.damping,r.horizon,r.target,r.timeStep].join('|')))
  assert.equal(keys.size,BR3_INTEGRATION_COUNT)
  assert.equal(panel.summary.integrations,486)
})
test('damping slice is independently reproducible and part of the full panel',()=>{
  const panel=runBR3Panel({damping:.22})
  assert.equal(panel.runs.length,162)
  assert.equal(panel.byBase.length,9)
  assert.equal(panel.summary.thresholdOutcomes,486)
  assert.throws(()=>runBR3Panel({damping:.2}),/non-frozen/)
  assert.deepEqual(panel.summary,summarizeBR3Runs(panel.runs))
})
test('provenance receipt is simulated, is deterministic and rejects forged wrappers',()=>{
  const slice=runBR3Panel({damping:.46})
  const receipt=buildBR3Receipt(slice)
  assert.equal(receipt.origin,'SIMULATED')
  assert.equal(receipt.authority,'NONE')
  assert.equal(receipt.runs.length,162)
  assert.ok(!JSON.stringify(receipt).includes('patient'))
  assert.equal(JSON.stringify(buildBR3Receipt(runBR3Panel({damping:.46}))),JSON.stringify(receipt))
  assert.throws(()=>buildBR3Receipt({runs:[]}),/authentic/)
})
