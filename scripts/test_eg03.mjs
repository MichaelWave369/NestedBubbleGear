import assert from 'node:assert/strict'
import { EG03, solveLondonSlab, londonLengthSI } from '../src/eg03Model.js'
let checks=0
const test=(name,fn)=>{fn();checks++;console.log('PASS EG03 '+name)}
const near=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=t,'expected '+a+' ≈ '+b)
test('London penetration depth formula obeys density and mass scaling',()=>{
 const electron=9.1093837e-31, charge=1.602176634e-19, density=1e28
 const lambda=londonLengthSI({carrierMassKg:electron,carrierDensityM3:density,carrierChargeC:charge})
 assert(lambda>0 && lambda<1e-6)
 near(londonLengthSI({carrierMassKg:electron,carrierDensityM3:density*4,carrierChargeC:charge}),lambda/2,1e-18)
 assert.throws(()=>londonLengthSI({carrierMassKg:electron,carrierDensityM3:0,carrierChargeC:charge}),RangeError)
})
test('exact equal-surface boundary, symmetry and screening',()=>{
 const r=solveLondonSlab(),pts=r.rows
 near(pts[0].numericalmT,10)
 near(pts.at(-1).numericalmT,10)
 near(pts[0].analyticmT,10)
 assert(r.metrics.centerFraction>0 && r.metrics.centerFraction<1)
 assert(r.metrics.maxAbsErrorMicroT<25)
 for(let i=0;i<pts.length;i++){
   near(pts[i].numericalmT,pts[pts.length-i-1].numericalmT,1e-9)
   near(pts[i].analyticmT,pts[pts.length-i-1].analyticmT,1e-9)
   near(pts[i].currentApm2,-pts[pts.length-i-1].currentApm2,1e-4)
 }
})
test('analytic cosh limit matches specified center and average formula',()=>{
 const r=solveLondonSlab({thicknessNm:400,penetrationNm:80})
 near(r.metrics.centerFraction,1/Math.cosh(2.5),1e-13)
 near(r.metrics.averageFraction,Math.tanh(2.5)/2.5,1e-13)
})
test('independent finite difference converges about quadratically',()=>{
 const args={thicknessNm:420,penetrationNm:75,surfaceFieldmT:12}
 const errors=[41,81,161].map(nodes=>solveLondonSlab({...args,nodes}).metrics.maxAbsErrorMicroT)
 assert(errors[0]>errors[1]*3.1,JSON.stringify(errors))
 assert(errors[1]>errors[2]*3.1,JSON.stringify(errors))
 assert(errors[2]<10)
})
test('numerical solution satisfies discretized equation',()=>{
 const r=solveLondonSlab({penetrationNm:40,thicknessNm:1100,nodes:101})
 assert(r.metrics.maxDiscreteResidualT<1e-15)
 assert(r.metrics.centerFraction<1e-4)
 assert(Number.isFinite(r.metrics.maxAbsErrorMicroT))
})
test('zero surface field and normal unscreened control',()=>{
 const r=solveLondonSlab({surfaceFieldmT:0})
 assert(r.rows.every(x=>x.analyticmT===0&&x.numericalmT===0&&x.unscreenedmT===0&&x.currentApm2===0))
 const b=solveLondonSlab({surfaceFieldmT:20})
 near(b.metrics.centerAnalyticmT,2*solveLondonSlab().metrics.centerAnalyticmT,1e-10)
 assert(b.rows.every(x=>x.unscreenedmT===20))
})
test('current sheet agrees with Ampere and integrates to cancellation',()=>{
 const r=solveLondonSlab({penetrationNm:80,thicknessNm:400,nodes:201})
 assert(Math.abs(r.metrics.signedSheetCurrentApm)<1e-8)
 const mid=(r.rows.length-1)/2
 assert(Math.abs(r.rows[mid].currentApm2)<1e-4)
 const expected=(.01-r.metrics.centerAnalyticmT*.001)/EG03.mu0
 near(r.metrics.halfSheetCurrentApm,expected,1e-8)
})
test('thick slab shields more, larger lambda shields less',()=>{
 const thin=solveLondonSlab({thicknessNm:100})
 const thick=solveLondonSlab({thicknessNm:800})
 assert(thick.metrics.centerFraction<thin.metrics.centerFraction)
 const long=solveLondonSlab({penetrationNm:160})
 assert(long.metrics.centerFraction>solveLondonSlab().metrics.centerFraction)
})
test('inputs, provenance and claim firewall are explicit',()=>{
 assert.throws(()=>solveLondonSlab({nodes:10}),RangeError)
 assert.throws(()=>solveLondonSlab({penetrationNm:0}),RangeError)
 assert.throws(()=>solveLondonSlab({surfaceFieldmT:60}),RangeError)
 const a=solveLondonSlab(),b=solveLondonSlab()
 assert.deepEqual(a,b)
 assert.equal(a.provenance,'SIMULATED')
 assert.equal(a.authority,'NONE')
 assert(a.claim.includes('not evidence of gravity modification'))
})
console.log('EG03 '+checks+'/'+checks+' PASS · SI London analytic and independent finite difference, no anomalous gravity')
