import assert from 'node:assert/strict'
import { EG01_ASSUMPTIONS, driveAt, fieldEnergyScale, fitPairedEG01, runEG01 } from '../src/eg01Model.js'

let checks = 0
function check(label, fn) { fn(); checks += 1; console.log('PASS EG01 '+label) }
check('field-energy scale has SI dimensions and B squared dependence', () => {
 const p=fieldEnergyScale(), double=fieldEnergyScale({tesla:20})
 assert(Math.abs(p.joules-39788735.7729)<1)
 assert(Math.abs(double.joules / p.joules - 4)<1e-12)
 assert(p.accelerationMps2>0 && p.accelerationMps2<1e-18)
 assert.throws(()=>fieldEnergyScale({distanceM:0}),RangeError)
})
check('drive includes baseline, plateaus, current inversion and zero', () => {
 assert.equal(driveAt(0),0)
 assert.equal(driveAt(10),0.85)
 assert.equal(driveAt(30),-1)
 assert.equal(driveAt(34),0)
})
check('one orientation is unidentifiable, not claimed as anomaly', () => {
 const r=runEG01({paired:false,anomaly:.11,noise:0})
 assert.equal(r.records.length,EG01_ASSUMPTIONS.steps)
 assert.equal(r.identifiable,false)
 assert.equal(r.estimate,null)
 assert.equal(fitPairedEG01(r.records),null)
 assert(r.collisionMaxError < 1e-12)
})
check('paired clean run resolves coefficients by fixture inversion under toy assumptions', () => {
 const r=runEG01({paired:true,anomaly:.11,noise:0})
 assert.equal(r.records.length,EG01_ASSUMPTIONS.steps*2)
 assert.equal(r.provenance,'SIMULATED')
 assert.equal(r.authority,'NONE')
 assert(r.identifiable)
 for(const [key,value] of Object.entries({magnetic:.36,thermal:.14,vibration:.095,anomaly:.11})){
   assert(Math.abs(r.estimate[key]-value)<1e-9,key)
 }
 assert(r.estimate.rmse<1e-9)
})
check('null candidate recovers approximately zero with deterministic perturbation',()=>{
 const r=runEG01({paired:true,anomaly:0})
 assert(Math.abs(r.estimate.anomaly)<.005)
 assert(r.estimate.rmse<.005)
})
check('toy amplitude and noise validation prevents invalid receipts',()=>{
 assert.throws(()=>runEG01({amplitude:0}),RangeError)
 assert.throws(()=>runEG01({anomaly:2}),RangeError)
 assert.throws(()=>runEG01({noise:-1}),RangeError)
 const a=runEG01({amplitude:1.25,anomaly:.2})
 assert.deepEqual(a,runEG01({amplitude:1.25,anomaly:.2}))
})
console.log('EG01 '+checks+'/'+checks+' PASS · synthetic controls only; no physical gravity evidence')
