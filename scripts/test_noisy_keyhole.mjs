import assert from 'node:assert/strict'
import {parity} from '../src/dimensionalRecovery.js'
import {G3_PROTOCOL,G3_REPEATS,G3_NOISE,G3_THRESHOLDS,binomial,
 countLikelihood,inferW,evaluateG3,g3Curve,selectedWitness,buildG3Receipt
} from '../src/noisyKeyhole.js'
const near=(x,y,eps=1e-10)=>assert.ok(Math.abs(x-y)<eps,String(x)+' != '+String(y))
let passed=0
function test(label,fn){fn();passed++;console.log('PASS '+label)}
test('exact integer binomial coefficients',()=>assert.deepEqual([0,1,2,3,4,5].map(k=>binomial(5,k)),[1,5,10,10,5,1]))
test('both likelihood families normalize',()=>{
 for(const n of G3_REPEATS)for(const p of G3_NOISE)for(const regime of ['IID','COMMON_CAUSE'])
 for(let w=0;w<=1;w++)near(Array.from({length:n+1},(_,k)=>countLikelihood(w,n,k,p,regime)).reduce((a,b)=>a+b,0),1)
})
test('G2 exact parity 15 yields W after K3',()=>{
 for(let s=0;s<16;s++){
  assert.equal(parity(s,15)^parity(s,7),parity(s,8))
  assert.equal(parity(s,15)^parity(s^8,15),1)
 }
})
test('zero noise gives certain correct decisions',()=>{
 for(const n of G3_REPEATS){
  const m=evaluateG3({repeats:n,noise:0,threshold:.99,regime:'IID'})
  near(m.coverage,1);near(m.conditionalError,0);near(m.meanClaimedConfidence,1)
 }
})
test('uninformative p=0.5 cannot pass confidence threshold',()=>{
 for(const n of G3_REPEATS)for(const regime of ['IID','COMMON_CAUSE']){
  const m=evaluateG3({repeats:n,noise:.5,threshold:.6,regime})
  near(m.coverage,0);assert.equal(m.verdict,'NO_DECISIONS')
 }
})
test('matched IID observer is calibrated on accepted decisions',()=>{
 for(const n of G3_REPEATS)for(const p of G3_NOISE)for(const t of G3_THRESHOLDS){
  const m=evaluateG3({repeats:n,noise:p,threshold:t,regime:'IID',assumption:'MATCHED'})
  if(m.coverage>1e-12)near(m.confidenceGap,0)
 }
})
test('matched shared-cause observer is calibrated on accepted decisions',()=>{
 for(const n of G3_REPEATS)for(const p of G3_NOISE)for(const t of G3_THRESHOLDS){
  const m=evaluateG3({repeats:n,noise:p,threshold:t,regime:'COMMON_CAUSE',assumption:'MATCHED'})
  if(m.coverage>1e-12)near(m.confidenceGap,0)
 }
})
test('matched shared error stays at fixed 10% across repeats',()=>{
 for(const n of G3_REPEATS){
  const m=evaluateG3({repeats:n,noise:.1,threshold:.8,regime:'COMMON_CAUSE',assumption:'MATCHED'})
  near(m.coverage,1);near(m.conditionalError,.1);near(m.meanClaimedConfidence,.9)
 }
})
test('frozen warning: naive IID on shared errors is overconfident',()=>{
 const m=evaluateG3({repeats:5,noise:.1,threshold:.95,regime:'COMMON_CAUSE',assumption:'NAIVE_IID'})
 near(m.coverage,1);near(m.conditionalError,.1);near(m.meanClaimedConfidence,.9999830651989841)
 assert.ok(m.confidenceGap>.09)
})
test('shared-cause aware observer refuses unsupported 95%',()=>{
 const m=evaluateG3({repeats:5,noise:.1,threshold:.95,regime:'COMMON_CAUSE',assumption:'MATCHED'})
 near(m.coverage,0);assert.equal(m.conditionalError,null)
})
test('independent repetition reduces conditional error',()=>{
 const c=g3Curve({noise:.1,threshold:.95,regime:'IID',assumption:'MATCHED'})
 assert.deepEqual(c.map(x=>x.repeats),[1,3,5,9])
 assert.ok(c[1].conditionalError>c[2].conditionalError)
 assert.ok(c[2].conditionalError>c[3].conditionalError)
 near(c[2].coverage,.919)
})
test('exact distribution is normalized over all 384 configurations',()=>{
 for(const n of G3_REPEATS)for(const p of G3_NOISE)for(const t of G3_THRESHOLDS)
 for(const regime of ['IID','COMMON_CAUSE'])for(const assumption of ['MATCHED','NAIVE_IID']){
  const a=evaluateG3({repeats:n,noise:p,threshold:t,regime,assumption})
  near(a.outcomeMass,1)
  near(a.counts.reduce((s,x)=>s+x.probability,0),1)
  assert.ok(a.coverage>=0&&a.coverage<=1+1e-9)
  assert.ok(a.unconditionalWrongMass>=0&&a.unconditionalWrongMass<=a.coverage+1e-9)
  assert.ok(a.impossibleMass<1e-9)
 }
})
test('naive shared error does not shrink as confidence climbs',()=>{
 const a=g3Curve({noise:.1,threshold:.95,regime:'COMMON_CAUSE',assumption:'NAIVE_IID'})
 for(const x of a.filter(x=>x.repeats>1))near(x.conditionalError,.1)
 assert.ok(a[1].confidence<a[2].confidence&&a[2].confidence<a[3].confidence)
})
test('synthetic sensor witness decodes known G2 parity',()=>{
 const w=selectedWitness({state:13,repeats:5,flippedSamples:2,noise:.2,threshold:.8})
 assert.equal(w.trueW,1);assert.deepEqual(w.decodedBits,[0,0,1,1,1])
 assert.deepEqual(w.rawBits,w.decodedBits.map(b=>b^w.knownXYZ))
 assert.equal(w.ones,3);assert.ok(w.likelihood>0)
})
test('shared cause cannot create mixed flips',()=>{
 assert.throws(()=>selectedWitness({regime:'COMMON_CAUSE',repeats:5,flippedSamples:2}))
 assert.equal(selectedWitness({regime:'COMMON_CAUSE',repeats:5,flippedSamples:5}).ones,5)
})
test('shared model refuses impossible mixed observations',()=>{
 assert.equal(inferW({repeats:5,ones:2,noise:.1,assumedRegime:'COMMON_CAUSE'}).status,'IMPOSSIBLE_UNDER_ASSUMED_MODEL')
})
test('deterministic receipt preserves provenance and controls',()=>{
 const o={repeats:5,noise:.1,threshold:.95,regime:'COMMON_CAUSE',assumption:'NAIVE_IID',state:5,flippedSamples:5}
 const r=buildG3Receipt(o)
 assert.deepEqual(r,buildG3Receipt(o))
 assert.equal(r.origin,'SIMULATED');assert.equal(r.authority,'NONE')
 assert.equal(r.protocol.id,G3_PROTOCOL.id)
 near(r.comparison.commonNaive.confidenceGap,.0999830651989841)
 assert.equal(r.comparison.commonMatched.verdict,'NO_DECISIONS')
})
test('invalid settings are rejected',()=>{
 assert.throws(()=>evaluateG3({repeats:2}))
 assert.throws(()=>evaluateG3({noise:.51}))
 assert.throws(()=>evaluateG3({threshold:1.1}))
 assert.throws(()=>evaluateG3({regime:'BAD'}))
 assert.throws(()=>evaluateG3({assumption:'BAD'}))
 assert.throws(()=>selectedWitness({state:18}))
 assert.throws(()=>selectedWitness({flippedSamples:-1}))
 assert.throws(()=>inferW({repeats:5,ones:6,noise:.1}))
})
console.log('NBG-G3 '+passed+'/'+passed+' PASS · exact finite analytical model')
