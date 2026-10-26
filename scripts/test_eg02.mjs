import assert from 'node:assert/strict'
import { EG02, forceBudget, fitEG02, runEG02 } from '../src/eg02Model.js'
let n=0
function check(name,fn){fn();n++;console.log('PASS EG02 '+name)}
check('SI force identity and 1% apparent weight confound',()=>{
 const b=forceBudget()
 assert(Math.abs(b.weightN-0.980665)<1e-12)
 assert(Math.abs(b.magneticN-0.01)<1e-12)
 assert(Math.abs(b.magneticPercent-1.019716)<1e-4)
 assert.equal(b.injectedN,0)
 const g=forceBudget({fractionalWeight:.01})
 assert(Math.abs(g.injectedN-.00980665)<1e-12)
 assert(Math.abs(g.matchingMomentAm2-.0196133)<1e-12)
})
check('a magnetic force reverses sign with field gradient, injected term does not',()=>{
 const a=forceBudget({fractionalWeight:.01,gradientTPerM:.5})
 const b=forceBudget({fractionalWeight:.01,gradientTPerM:-.5})
 assert.equal(a.magneticN,-b.magneticN)
 assert.equal(a.injectedN,b.injectedN)
})
check('mass-only design cannot separate magnetic moment from drift',()=>{
 const r=runEG02({reverseGradient:false,noiseN:0})
 assert.equal(r.identifiable,false)
 assert(r.rank<3)
 assert.equal(r.fit,null)
})
check('gradient-only design cannot separate mass-scaled response from drift',()=>{
 const r=runEG02({dualMass:false,noiseN:0})
 assert.equal(r.identifiable,false)
 assert(r.rank<3)
 assert.equal(r.fit,null)
})
check('single mass and orientation is insufficient',()=>{
 const r=runEG02({dualMass:false,reverseGradient:false})
 assert.equal(r.identifiable,false)
 assert(r.rank<=2)
})
check('complete factorial clean synthetic design recovers injected coefficients',()=>{
 const r=runEG02({fractionalWeight:.017,momentAm2:.031,offsetN:.004,noiseN:0})
 assert.equal(r.records.length,12)
 assert.equal(r.rank,3)
 assert.equal(r.provenance,'SIMULATED')
 assert.equal(r.authority,'NONE')
 assert(Math.abs(r.fit.fractionalWeight-.017)<1e-10)
 assert(Math.abs(r.fit.momentAm2-.031)<1e-10)
 assert(Math.abs(r.fit.sensorOffsetN-.004)<1e-10)
 assert(r.fit.rmseN<1e-9)
})
check('default is null and perturbation deterministic',()=>{
 const a=runEG02({noiseN:0.0002}), b=runEG02({noiseN:0.0002})
 assert.deepEqual(a,b)
 assert(Math.abs(a.fit.fractionalWeight)<.0002)
 assert(Math.abs(a.fit.momentAm2-.02)<.0002)
})
check('unit validity and non-measurement boundary',()=>{
 assert.throws(()=>forceBudget({massKg:0}),RangeError)
 assert.throws(()=>runEG02({gradientTPerM:0}),RangeError)
 assert.throws(()=>runEG02({fractionalWeight:2}),RangeError)
 assert.throws(()=>fitEG02([{massKg:1,gradientTPerM:0,observedN:NaN}]),TypeError)
 assert.equal(runEG02().claim.includes('no measured gravitational effect'),true)
})
console.log('EG02 '+n+'/'+n+' PASS · conventional force budget and synthetic identifiability only')
