import assert from 'node:assert/strict'
import { EG04, invalidSubstitutionStressTest, londonScreeningRatio, runEG04 } from '../src/eg04Model.js'
import { solveLondonSlab } from '../src/eg03Model.js'
let n=0
const check=(name,fn)=>{fn();n++;console.log('PASS EG04 '+name)}
const near=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=t, a+' not within '+t+' of '+b)
check('EG-03 ordinary London geometry is the only physical screening backend',()=>{
 const eg04=runEG04(),eg03=solveLondonSlab({nodes:201})
 near(eg04.conventional.geometricScreeningRatio,eg03.metrics.averageFraction)
 near(eg04.conventional.centerFieldmT,eg03.metrics.centerAnalyticmT)
 near(eg04.conventional.halfSheetCurrentApm,eg03.metrics.halfSheetCurrentApm)
})
check('as thickness/penetration ratio increases, screening decreases but remains positive',()=>{
 let prev=Infinity
 for(let x=.5;x<=20;x+=.25){
  const ratio=londonScreeningRatio(x)
  assert(ratio>0&&ratio<=1)
  assert(ratio<prev)
  prev=ratio
 }
 const thick=londonScreeningRatio(40)
 near(thick,2/40,1e-10)
 assert.throws(()=>londonScreeningRatio(0),RangeError)
})
check('invalid inverse-square explodes under geometrical thickening despite finite screening',()=>{
 const small=londonScreeningRatio(1),large=londonScreeningRatio(20)
 assert(invalidSubstitutionStressTest(large)>invalidSubstitutionStressTest(small))
 near(invalidSubstitutionStressTest(.5),4)
 assert.throws(()=>invalidSubstitutionStressTest(0),RangeError)
 assert.throws(()=>invalidSubstitutionStressTest(1.5),RangeError)
})
check('fields and energies use dimensional checks not pseudo-permeability claims',()=>{
 const a=runEG04({surfaceFieldmT:10}),b=runEG04({surfaceFieldmT:20})
 near(b.conventional.fieldEnergyPerAreaJm2/a.conventional.fieldEnergyPerAreaJm2,4,1e-11)
 near(a.conventional.geometricScreeningRatio,b.conventional.geometricScreeningRatio)
 near(a.invalidInference.formalInverseSquare,b.invalidInference.formalInverseSquare)
 assert(a.conventional.fieldEnergyPerAreaJm2>0)
 assert(a.conventional.energyFraction>0&&a.conventional.energyFraction<1)
 assert(a.conventional.fieldEnergyPerAreaJm2<a.conventional.unscreenedFieldEnergyPerAreaJm2)
})
check('no applied field means no inferred physical material permeability',()=>{
 const r=runEG04({surfaceFieldmT:0})
 assert.equal(r.conventional.fieldEnergyPerAreaJm2,0)
 assert.equal(r.conventional.energyFraction,null)
 assert.equal(r.conventional.centerFieldmT,0)
 assert(r.invalidInference.inputNotMaterialPermeability)
})
check('signed currents can cancel while local screening remains nonzero',()=>{
 const r=runEG04()
 assert(Math.abs(r.conventional.signedSheetCurrentApm)<1e-7)
 assert(r.conventional.halfSheetCurrentApm>0)
 assert(r.conventional.centerFraction<1)
})
check('audit separates partial text access from exact Li–Torr or Kowitt reproduction',()=>{
 const r=runEG04()
 assert.equal(r.schema,EG04.schema)
 assert.equal(r.provenance,'SIMULATED')
 assert.equal(r.authority,'NONE')
 assert.equal(r.audit.length,3)
 assert(r.audit.every(x=>x.testedHere.includes('NOT')||x.testedHere.includes('ONLY')||x.testedHere.includes('FIREWALL')))
 assert(r.sourceAccess.includes('NOT COMPLETE'))
 assert(!/gravity.*detected/i.test(r.claim))
 assert.deepEqual(r,runEG04())
})
check('survey series has stable endpoints, bounded physical ratios and explicitly invalid demonstration values',()=>{
 const s=runEG04().series
 assert.equal(s.length,81)
 near(s[0].thicknessOverLambda,.5)
 near(s.at(-1).thicknessOverLambda,20)
 assert(s.every(x=>x.geometricRatio>0&&x.geometricRatio<=1&&x.falseAmplification>=1))
 assert(s.at(-1).falseAmplification>s[0].falseAmplification)
})
check('domain guard rejects nonphysical slab inputs and solver configurations',()=>{
 assert.throws(()=>runEG04({thicknessNm:0}),RangeError)
 assert.throws(()=>runEG04({penetrationNm:0}),RangeError)
 assert.throws(()=>runEG04({surfaceFieldmT:-1}),RangeError)
 assert.throws(()=>runEG04({nodes:100}),RangeError)
})
console.log('EG04 '+n+'/'+n+' PASS · provenance and false-inference firewall, no modified gravity')
