import assert from 'node:assert/strict'
import test from 'node:test'
import {BR2_GRID,BR2_PROTOCOL,BR2_TOTAL_CELLS,runBR2Slice,runBR2FullSweep,runBR2Controls,buildBR2Receipt} from '../src/resilienceAtlasModel.js'

const reference=runBR2Slice()

test('protocol, frozen dimensions and grid volume',()=>{
  assert.equal(BR2_PROTOCOL,'NBG-BR2-v0.1.0')
  assert.equal(BR2_TOTAL_CELLS,972)
  assert.equal(reference.cells.length,81)
  assert.equal(reference.origin,'SIMULATED')
  assert.equal(BR2_GRID.timeStep,0.04)
  assert.equal(reference.summary.recovered+reference.summary.censored+reference.summary.diverged,81)
})

test('unknown slices refused, no extrapolation beyond frozen plan',()=>{
  assert.throws(()=>runBR2Slice({damping:0.3,detuning:0.12}),/frozen damping/)
  assert.throws(()=>runBR2Slice({damping:0.46,detuning:0.13}),/frozen detuning/)
  assert.throws(()=>runBR2Slice({damping:NaN,detuning:0.12}),/frozen damping/)
})

test('every grid cell exists once and has exact matching reciprocal reference',()=>{
  const keys=new Set()
  for(const c of reference.cells){
    const key=`${c.coupling}|${c.asymmetry}`
    assert.ok(!keys.has(key))
    keys.add(key)
    const reciprocal=reference.cells.find(x=>x.coupling===c.coupling&&x.asymmetry===0)
    assert.ok(reciprocal)
    assert.equal(c.damping,reciprocal.damping)
    assert.equal(c.detuning,reciprocal.detuning)
    assert.equal(c.state==='RECOVERED',c.recoveryTime!==null)
    if(c.recoveryAdvantageSeconds!==null){
      assert.equal(c.state,'RECOVERED')
      assert.equal(reciprocal.state,'RECOVERED')
      assert.ok(Math.abs(c.recoveryAdvantageSeconds-(reciprocal.recoveryTime-c.recoveryTime))<1e-6)
    }
    if(c.mismatch){
      assert.ok(c.coarseHighCoordination)
      assert.notEqual(c.state,'RECOVERED')
    }
  }
  assert.equal(keys.size,81)
  assert.equal(reference.summary.reciprocalBaselines,9)
})

test('zero-coupling negative control is invariant under directional asymmetry',()=>{
  const row=reference.cells.filter(c=>c.coupling===0)
  assert.equal(row.length,BR2_GRID.asymmetry.length)
  for(const c of row){
    assert.equal(c.state,row[0].state)
    assert.equal(c.recoveryTime,row[0].recoveryTime)
    assert.equal(c.finalResidue,row[0].finalResidue)
    assert.equal(c.velocityCorrelation,null)
  }
})

test('reciprocal rows compare only to themselves, with zero advantage',()=>{
  for(const c of reference.cells.filter(c=>c.asymmetry===0)){
    assert.equal(c.comparedToReciprocal,'RECIPROCAL_BASELINE')
    assert.equal(c.recoveryAdvantageSeconds,c.state==='RECOVERED'?0:null)
  }
})

test('time comparison never treats null/censored recovery as an instantaneous success',()=>{
  for(const c of reference.cells){
    const base=reference.cells.find(x=>x.coupling===c.coupling&&x.asymmetry===0)
    if(c.state!=='RECOVERED'||base.state!=='RECOVERED'){
      assert.equal(c.recoveryAdvantageSeconds,null)
    }
    assert.ok(c.recoveryTime===null||c.recoveryTime>=0)
  }
})

test('baseline velocity correlation is not rebranded as recovered state',()=>{
  const slow=runBR2Slice({damping:0.08,detuning:0.12})
  const witnesses=slow.cells.filter(c=>c.mismatch)
  assert.ok(witnesses.length>0,'Frozen sweep must preserve an actual high-correlation non-recovery witness')
  for(const w of witnesses){
    assert.ok(w.velocityCorrelation>=BR2_GRID.correlationThreshold)
    assert.equal(w.state,'HORIZON_CENSORED')
  }
})

test('full 972-cell sweep returns exactly 12 complete slices with accounting invariants',()=>{
  const sweep=runBR2FullSweep()
  assert.equal(sweep.origin,'SIMULATED')
  assert.equal(sweep.slices.length,12)
  assert.equal(sweep.totalCells,972)
  assert.equal(sweep.summary.total,972)
  assert.equal(sweep.summary.recovered+sweep.summary.censored+sweep.summary.diverged,972)
  assert.equal(sweep.summary.reciprocalBaselines,BR2_GRID.coupling.length*BR2_GRID.damping.length*BR2_GRID.detuning.length)
  assert.equal(sweep.summary.highCoordinationWithoutRecovery,
    sweep.slices.reduce((sum,s)=>sum+s.summary.highCoordinationWithoutRecovery,0))
})

test('control arms retain zero-kick and uncoupled semantics',()=>{
  const c=runBR2Controls()
  assert.equal(c.zeroKick.exactlyZero,true)
  assert.equal(c.uncoupled.velocityCorrelation,null)
  assert.equal(c.reciprocal.recovered,true)
  assert.equal(c.weakDamping.recovered,false)
  assert.equal(c.negativeDamping.recovered,false)
})

test('slice receipts are explicitly simulated, stable, and trajectory-free',()=>{
  const receipt=buildBR2Receipt(reference)
  assert.equal(receipt.origin,'SIMULATED')
  assert.equal(receipt.authority,'NONE')
  assert.equal(receipt.cells.length,81)
  assert.ok(!JSON.stringify(receipt).includes('perturbedA'))
  assert.equal(JSON.stringify(buildBR2Receipt(runBR2Slice())),JSON.stringify(receipt))
  assert.throws(()=>buildBR2Receipt({}),/genuine slice/)
})
