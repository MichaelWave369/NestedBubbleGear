import assert from 'node:assert/strict'
import {OBS_PROTOCOL,projectionWitness,frameWitness,graphWitness,causalWitness,samplingWitness,delayWitness,observerReceipt,verifyObserverInvariants} from '../src/observerRealityMath.js'
const approx=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,a+' != '+b)
assert.equal(OBS_PROTOCOL.authority,'NONE')
assert.equal(projectionWitness(false).indistinguishable,true)
assert.equal(projectionWitness(true).indistinguishable,false)
const base=frameWitness('A',0)
for(const o of ['A','B','C'])for(const angle of [0,90,180]){
 const changed=frameWitness(o,angle)
 changed.distances.forEach((d,i)=>approx(d,base.distances[i]))
}
assert.deepEqual(frameWitness('B',0).relative[1],[0,0])
for(const n of [6,12]){
 assert.equal(graphWitness('ring',n).cycleRank,1)
 assert.equal(graphWitness('distort',n).cycleRank,1)
 assert.equal(graphWitness('cut',n).cycleRank,0)
}
assert.equal(causalWitness(false).observationallyEquivalent,true)
assert.equal(causalWitness(true).observationallyEquivalent,false)
assert.deepEqual(causalWitness(true).discriminatingRow,{h:0,a:1,commonCauseB:0,directCauseB:1})
assert.equal(samplingWitness(1).fastVisible,false)
assert.equal(samplingWitness(.8).fastVisible,true)
assert.ok(delayWitness().visibleRmse>0.001)
assert.ok(delayWitness().delayRmse<1e-10)
assert.ok(Object.values(verifyObserverInvariants()).every(Boolean))
assert.deepEqual(observerReceipt(),observerReceipt(),'receipt determinism')
assert.equal(observerReceipt().protocol.origin,'SIMULATED')
for(const bad of [()=>frameWitness('D'),()=>graphWitness('snake'),()=>samplingWitness(0),()=>observerReceipt({tab:'unknown'})])assert.throws(bad)
console.log('NBG-OBS-01 PASS · projections, frames, topology, interventions, aliasing, delays, guards, deterministic receipts')