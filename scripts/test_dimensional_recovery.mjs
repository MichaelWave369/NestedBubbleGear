import assert from 'node:assert/strict'
import {
 G2_PROTOCOL,VERTICES,parity,signedCoordinates,rankGF2,baselineMasks,
 isTaskResolved,entropyBits,compatibleVertices,allowedProbes,
 enumeratePlans,recoveryTrace,buildG2Receipt
} from '../src/dimensionalRecovery.js'

let passed=0
function test(name,run){run();passed++;console.log('PASS '+name)}
test('four dimensional binary hypercube has exactly 16 vertices',()=>{
 assert.equal(VERTICES.length,16)
 assert.equal(new Set(VERTICES).size,16)
 assert.deepEqual(signedCoordinates(0),[-1,-1,-1,-1])
 assert.deepEqual(signedCoordinates(15),[1,1,1,1])
})
test('each new direct coordinate doubles observable partitions',()=>{
 for(let d=0;d<=4;d++){
  const base=baselineMasks(d)
  assert.equal(rankGF2(base),d)
  assert.equal(entropyBits(base),4-d)
  for(const v of VERTICES)assert.equal(compatibleVertices(v,base).length,2**(4-d))
 }
})
test('GF(2) rank is order independent and dependent probes add zero',()=>{
 assert.equal(rankGF2([1,2,4,7]),3)
 assert.equal(rankGF2([7,4,2,1]),3)
 assert.equal(rankGF2([1,1,1]),1)
 assert.equal(rankGF2([1,2,4,15]),4)
})
test('G1 witness: x/y/z cannot distinguish a W flip',()=>{
 const a=0,b=8,coarse=[1,2,4]
 assert.deepEqual(coarse.map(k=>parity(a,k)),coarse.map(k=>parity(b,k)))
 assert.notEqual(parity(a,8),parity(b,8))
 assert.equal(entropyBits(coarse,'HIDDEN_W'),1)
 assert.equal(entropyBits([...coarse,15],'HIDDEN_W'),0)
})
test('cheap XYZ parity is a zero-gain control when XYZ are visible',()=>{
 assert.equal(rankGF2([1,2,4,7]),3)
 assert.equal(entropyBits([1,2,4,7]),1)
})
test('a parity probe can restore W without directly reading W',()=>{
 const p=enumeratePlans(3,'HYBRID','FULL_STATE',1)
 assert.equal(p.status,'RECOVERED')
 assert.deepEqual(p.optimal.probes.map(q=>q.id),['XYZW'])
 assert.equal(p.optimal.cost,1)
 assert.equal(p.optimal.rank,4)
})
test('direct-only profile requires explicit W query at depth three',()=>{
 const p=enumeratePlans(3,'DIRECT','FULL_STATE',12)
 assert.deepEqual(p.optimal.probes.map(q=>q.id),['W'])
 assert.equal(p.optimal.cost,3)
})
test('full recovery from 2D keyhole needs two independent extra bits',()=>{
 const p=enumeratePlans(2,'HYBRID','FULL_STATE',12)
 assert.equal(p.baselineResidualBits,2)
 assert.equal(p.optimal.residualBits,0)
 assert.equal(p.optimal.probes.length,2)
 assert.equal(p.optimal.cost,1.25)
})
test('blind-to-W negative control refuses full recovery',()=>{
 for(let d=0;d<4;d++){
  const p=enumeratePlans(d,'BLIND','FULL_STATE',100)
  assert.equal(p.status,'UNOBSERVABLE_LIBRARY')
  assert.equal(p.optimal,null)
  assert.ok(p.selected.residualBits>0)
 }
})
test('full 4D initial keyhole requires zero queries or budget',()=>{
 const p=enumeratePlans(4,'BLIND','FULL_STATE',0)
 assert.equal(p.status,'RECOVERED')
 assert.equal(p.optimal.cost,0)
 assert.equal(p.optimal.probes.length,0)
})
test('insufficient budget refuses success rather than guessing',()=>{
 const p=enumeratePlans(3,'HYBRID','FULL_STATE',.5)
 assert.equal(p.status,'BUDGET_INSUFFICIENT')
 assert.equal(p.selected.resolved,false)
 assert.equal(p.selected.residualBits,1)
})
test('task-scoped W recovery is not the same as full recovery',()=>{
 assert.equal(isTaskResolved([8],'HIDDEN_W'),true)
 assert.equal(isTaskResolved([8],'FULL_STATE'),false)
 assert.equal(entropyBits([8],'HIDDEN_W'),0)
 assert.equal(entropyBits([8],'FULL_STATE'),3)
})
test('rank-based task equivalence matches explicit witness pairs for all probe subsets',()=>{
 const library=allowedProbes('HYBRID')
 for(let subset=0;subset<1<<library.length;subset++){
  const masks=library.filter((_,i)=>subset&(1<<i)).map(q=>q.mask)
  for(const task of ['FULL_STATE','HIDDEN_W']){
   const actual=isTaskResolved(masks,task)
   let brute=true
   for(const a of VERTICES)for(const b of VERTICES){
    const identical=masks.every(k=>parity(a,k)===parity(b,k))
    if(identical&&(task==='FULL_STATE'?a!==b:parity(a,8)!==parity(b,8)))brute=false
   }
   assert.equal(actual,brute,'probe subset '+subset+' / '+task)
  }
 }
})
test('all 16 state traces really narrow to their reported ambiguity',()=>{
 for(const d of [0,1,2,3,4]){
  const p=enumeratePlans(d,'HYBRID','FULL_STATE',12)
  for(const v of VERTICES){
   const trace=recoveryTrace(v,d,p.selected.probes)
   for(const t of trace){
    assert.ok(t.compatible.includes(v))
    assert.equal(t.compatible.length,2**(4-t.rank))
   }
   assert.deepEqual(trace.at(-1).compatible,[v])
  }
 }
})
test('exact reproducible provenance receipt keeps refusal visible',()=>{
 const options={depth:3,profile:'BLIND',task:'FULL_STATE',budget:15,state:7}
 const a=buildG2Receipt(options),b=buildG2Receipt(options)
 assert.deepEqual(a,b)
 assert.equal(a.protocol.id,'NBG-G2')
 assert.equal(a.origin,'SIMULATED')
 assert.equal(a.authority,'NONE')
 assert.equal(a.status,'UNOBSERVABLE_LIBRARY')
 assert.equal(a.witness.terminalAmbiguity,2)
})
test('invalid depths, profiles, tasks, states, and budgets are rejected',()=>{
 assert.throws(()=>baselineMasks(-1))
 assert.throws(()=>baselineMasks(1.5))
 assert.throws(()=>rankGF2([0]))
 assert.throws(()=>enumeratePlans(3,'NO','FULL_STATE',3))
 assert.throws(()=>enumeratePlans(3,'HYBRID','NO',3))
 assert.throws(()=>enumeratePlans(3,'HYBRID','FULL_STATE',-2))
 assert.throws(()=>compatibleVertices(17,[1]))
})
console.log('NBG-G2 '+passed+'/'+passed+' PASS · exact finite exhaustive tests')
