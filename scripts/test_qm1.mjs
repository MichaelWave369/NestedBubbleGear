import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  nonceOrder,makeToyHeader,doubleSha256,leadingZeroBits,verifyEducationalPoW,
  runPoWSchedule,comparePoWSchedules,simulateToyGrover,
  qm1Receipt,toAqlenReceiptGraph,QM1_SCHEDULERS,
} from '../src/qm1Model.js'
const sha256=async bytes=>new Uint8Array(createHash('sha256').update(bytes).digest())
for(const strategy of QM1_SCHEDULERS){
  for(const universe of [32,64,128,256,512,1024]){
    const order=nonceOrder(strategy,universe,369)
    assert.equal(order.length,universe)
    assert.equal(new Set(order).size,universe)
    assert.ok(order.every(n=>n>=0&&n<universe))
    assert.deepEqual(order,nonceOrder(strategy,universe,369))
  }
}
const header=makeToyHeader(369,77)
assert.equal(header.length,80)
assert.deepEqual([...header.slice(76)],[77,0,0,0])
const expected=createHash('sha256').update(
  createHash('sha256').update(header).digest()).digest('hex')
const digest=await doubleSha256(header,sha256)
assert.equal(Buffer.from(digest).toString('hex'),expected)
assert.equal(leadingZeroBits(Uint8Array.from([0,0,4,255])),21)
const verified=await verifyEducationalPoW({nonce:77,seed:369,leadingZeroBits:8,sha256})
assert.equal(verified.hash,expected)
assert.equal(verified.valid,leadingZeroBits(digest)>=8)
const benchmark=await comparePoWSchedules({
  sha256,universe:128,budget:128,seed:369,leadingZeroBits:6,
})
assert.equal(benchmark.trials.length,3)
assert.equal(benchmark.fairBudget,true)
assert.equal(benchmark.equalDomain,true)
assert.equal(benchmark.noMonetaryMining,true)
assert.deepEqual(benchmark.trials.map(t=>t.hits),Array(3).fill(benchmark.trials[0].hits))
for(const run of benchmark.trials){
  assert.equal(run.hashesComputed,128)
  assert.equal(run.collisions,0)
  assert.equal(run.coverage,1)
  assert.equal(run.energyMeasurement,'NOT_MEASURED')
  assert.equal(run.joulesPerHash,null)
  for(const p of run.proofSamples){
    assert.equal((await verifyEducationalPoW({
      nonce:p.nonce,seed:369,leadingZeroBits:6,sha256})).hash,p.hash)
  }
}
const short=await runPoWSchedule({
  strategy:'NBG_GEAR',universe:128,budget:32,seed:369,
  leadingZeroBits:8,sha256,
})
assert.equal(short.hashesComputed,32)
assert.equal(short.coverage,.25)
const grover=simulateToyGrover({qubits:6,markedIndex:13,iterations:5})
assert.ok(Math.abs(grover.stateNormSquared-1)<1e-10)
assert.ok(grover.successProbability>.75)
assert.ok(grover.successProbability>grover.classicalRandomSuccessAtSameNumberOfGuesses)
assert.equal(grover.hardware,'NONE')
for(const size of [2,3,4,5,6,7,8]){
  const result=simulateToyGrover({qubits:size,markedIndex:1,iterations:1})
  assert.ok(Math.abs(result.stateNormSquared-1)<1e-10)
}
const receipt=qm1Receipt(benchmark,grover)
assert.equal(receipt.claims.hardwareQuantumAdvantage,false)
assert.equal(receipt.claims.SHA256ImprovementProven,false)
const graph=toAqlenReceiptGraph(receipt)
assert.equal(graph.nodes.length,3)
assert.equal(graph.edges.length,2)
assert.ok(graph.nodes.every(n=>['module','evidence_anchor'].includes(n.type)))
assert.ok(graph.edges.every(e=>['derived_from'].includes(e.type)))
assert.ok(graph.nodes.every(n=>n.claim_boundary.length>0))
assert.throws(()=>toAqlenReceiptGraph({schema:'forged',authority:'VERIFIED'}),RangeError)
for(const bad of [
  ()=>nonceOrder('FICTION',128,369),
  ()=>nonceOrder('SEQUENTIAL',127,369),
  ()=>makeToyHeader(369,-1),
  ()=>simulateToyGrover({qubits:9}),
  ()=>simulateToyGrover({qubits:6,markedIndex:64}),
  ()=>simulateToyGrover({qubits:6,iterations:100}),
])assert.throws(bad,RangeError)
await assert.rejects(()=>runPoWSchedule({sha256,universe:32,budget:33}),RangeError)
console.log('PASS QM1: deterministic permutations, SHA-256 correctness, equal budgets, coverage, toy Grover norm, AQLEN graph')
