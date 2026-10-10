import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  balancedTrialOrder,median,percentile,descriptiveStats,
  runQM2Experiment,auditQM2Round,qm2Receipt,
} from '../src/qm2Model.js'
import { QM1_SCHEDULERS,runPoWSchedule } from '../src/qm1Model.js'
const sha256=async data=>new Uint8Array(createHash('sha256').update(data).digest())
for(const rounds of [3,6,9]){
  const schedule=balancedTrialOrder(rounds,369)
  assert.equal(schedule.length,rounds)
  assert.deepEqual(schedule,balancedTrialOrder(rounds,369))
  for(const round of schedule){
    assert.deepEqual([...round.order].sort(),[...QM1_SCHEDULERS].sort())
    assert.ok(round.seed>=0&&round.seed<65536)
  }
  for(const method of QM1_SCHEDULERS){
    for(let pos=0;pos<3;pos++)
      assert.equal(schedule.filter(round=>round.order[pos]===method).length,rounds/3)
  }
}
assert.equal(median([3,1,2]),2)
assert.equal(median([1,2,3,4]),2.5)
assert.equal(percentile([1,3,5,7],.25),2.5)
assert.equal(descriptiveStats([1,2,3]).median,2)
assert.equal(descriptiveStats([1,1,1]).stddev,0)
assert.throws(()=>median([]),RangeError)
assert.throws(()=>descriptiveStats([NaN]),RangeError)
assert.throws(()=>percentile([2],2),RangeError)
let tick=0
const fakeClock=()=>++tick*0.125
const updates=[]
const result=await runQM2Experiment({
  universe:32,rounds:6,bits:6,seed:369,warmup:16,sha256,clock:fakeClock,
  onRound:progress=>updates.push(progress),
})
assert.equal(result.schema,'nbg.qm2.repeated-trial.v1')
assert.equal(result.authority,'DEMONSTRATION_ONLY')
assert.equal(result.origin,'SOFTWARE_MEASURED_WITH_SYNTHETIC_INPUTS')
assert.equal(result.measuredRounds.length,6)
assert.equal(result.referenceAudits.length,6)
assert.equal(result.summaries.length,3)
assert.equal(updates.length,6)
assert.deepEqual(updates.at(-1),{round:6,total:6})
assert.ok(Object.values(result.checks).every(Boolean))
assert.equal(result.promoted,false)
assert.equal(result.physicalEnergyJoulesPerHash,null)
assert.equal(result.settings.fullDomainEveryRound,true)
for(const round of result.measuredRounds){
  assert.equal(round.trials.length,3)
  assert.equal(round.trials[0].executionPosition,1)
  assert.equal(new Set(round.trials.map(t=>t.strategy)).size,3)
  assert.deepEqual(round.trials.map(t=>t.hits),[round.trials[0].hits,round.trials[0].hits,round.trials[0].hits])
  assert.ok(round.trials.every(t=>t.independentRehashPass&&t.hashesComputed===32))
}
for(const summary of result.summaries){
  assert.equal(summary.totalHashes,32*6)
  assert.equal(summary.throughput.n,6)
  assert.ok(summary.throughput.median>0)
}
assert.equal(result.pairedComparisons.perRound.length,6)
assert.ok(result.pairedComparisons.gearVsSequential.median>0)
const receipt=qm2Receipt(result)
assert.equal(receipt.frozenNBGExperimentsModified,false)
assert.equal(receipt.aqlenHandoff,'REQUIRES_SEPARATE_REVIEW_NO_SILENT_LEDGER_IMPORT')
assert.equal(receipt.exportSchema,'nbg.qm2.receipt.v1')
assert.throws(()=>qm2Receipt({schema:'WRONG'}),RangeError)
const seed=33
const original=await runPoWSchedule({
  strategy:'NBG_GEAR',universe:32,budget:32,seed,leadingZeroBits:4,sha256,captureAllHits:true,
})
const originalSequential=await runPoWSchedule({
  strategy:'SEQUENTIAL',universe:32,budget:32,seed,leadingZeroBits:4,sha256,captureAllHits:true,
})
const originalShuffle=await runPoWSchedule({
  strategy:'SEEDED_SHUFFLE',universe:32,budget:32,seed,leadingZeroBits:4,sha256,captureAllHits:true,
})
const audit=await auditQM2Round({runs:[original,originalSequential,originalShuffle],universe:32,bits:4,seed,sha256})
assert.equal(audit.verified,true)
assert.equal(audit.allStrategyHitSetsMatch,true)
const falsified=structuredClone(original)
if(falsified.allHitProofs.length){
  falsified.allHitProofs[0].hash='00'.repeat(32)
  await assert.rejects(()=>auditQM2Round({runs:[falsified,originalSequential,originalShuffle],universe:32,bits:4,seed,sha256}),
    /unverifiable accepted hash/)
}else{
  falsified.hits+=1
  await assert.rejects(()=>auditQM2Round({runs:[falsified,originalSequential,originalShuffle],universe:32,bits:4,seed,sha256}),
    /invariant failure/)
}
for(const bad of [
  {universe:1024},{rounds:2},{bits:9},{seed:-1},{warmup:8},
])await assert.rejects(()=>runQM2Experiment({...bad,sha256}),RangeError)
assert.throws(()=>balancedTrialOrder(2,369),RangeError)
console.log('PASS QM2: balanced crossover, exhaustive hash verification, frozen equal workloads, robust summaries, evidence boundaries')
