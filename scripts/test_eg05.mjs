import assert from 'node:assert/strict'
import { EG05,EG05_CUSTODY,SI_DIMENSIONS,auditSIDimensions,
  matchesDim,multiplyDim,conditionalEq49,conventionalReference,runEG05 } from '../src/eg05Model.js'
let count=0
function check(name,fn){fn();count++;console.log('PASS EG05 '+name)}
function near(a,b,t=1e-12){assert(Math.abs(a-b)<=t, 'expected '+a+' ≈ '+b)}
check('source custody is unique and exact equations have known source location',()=>{
 const ids=EG05_CUSTODY.map(x=>x.id)
 assert.equal(ids.length,8)
 assert.equal(new Set(ids).size,ids.length)
 assert(EG05_CUSTODY.every(x=>x.source.startsWith('https://')&&x.blocked.length>35))
 for(const id of ['L92-46','L92-47','L92-48','L92-49','L92-50','L92-54']){
  assert(EG05_CUSTODY.find(x=>x.id===id).location.includes('Printed p.'))
 }
 assert.equal(EG05_CUSTODY.find(x=>x.id==='K1994').access,'ABSTRACT_ONLY')
 assert.equal(EG05_CUSTODY.find(x=>x.id==='L1991').reproduction,'NOT_REPRODUCED')
})
check('SI dimensional algebra passes ordinary Eq. 46 conductivity',()=>{
 const s=auditSIDimensions()
 assert(s.eq46Pass)
 assert(matchesDim(s.eq46,SI_DIMENSIONS.conductivity))
 assert(!matchesDim(multiplyDim(SI_DIMENSIONS.density,SI_DIMENSIONS.time),SI_DIMENSIONS.conductivity))
})
check('SI dimensional algebra passes Eq. 47 time expression',()=>{
 const s=auditSIDimensions()
 assert(s.eq47Pass)
 assert(matchesDim(s.eq47,SI_DIMENSIONS.time))
 assert(s.eq48.startsWith('UNRESOLVED'))
 assert(s.eq54.startsWith('UNRESOLVED'))
})
check('finite relaxation-time reference follows inverse temperature and coupling',()=>{
 const a=conventionalReference(),b=conventionalReference({temperatureK:8,couplingLambdaStar:1})
 near(a.tauSeconds/(b.tauSeconds),2)
 near(a.conductivitySperM/b.conductivitySperM,2)
 assert(a.conductivitySperM>0)
 assert(a.limits.includes('NOT measured'))
})
check('conventional scaling doubles with independent carrier-density increase',()=>{
 const a=conventionalReference({carrierDensityM3:1e27})
 const b=conventionalReference({carrierDensityM3:2e27})
 near(b.conductivitySperM/a.conductivitySperM,2)
 assert.throws(()=>conventionalReference({temperatureK:0}),RangeError)
})
check('Eq.49 conditional inverse-square in log coordinates',()=>{
 const a=conditionalEq49(-20)
 const b=conditionalEq49(-21)
 near(b.log10ConductivitySperM-a.log10ConductivitySperM,2)
 near(b.conductivitySperM/a.conductivitySperM,100,1e-9)
 near(conditionalEq49(0).conductivitySperM,1e-29,1e-38)
 assert.throws(()=>conditionalEq49(5),RangeError)
})
check('microscopic relative permeability cannot be silently sourced from bulk geometry',()=>{
 const r=runEG05()
 assert(r.geometricCounterexample.screeningRatio>0&&r.geometricCounterexample.screeningRatio<1)
 assert(r.geometricCounterexample.invalidSourceUse.startsWith('REJECT'))
 assert.notEqual(Math.log10(r.geometricCounterexample.screeningRatio),r.input.log10MuRelative)
 assert(r.missing.some(x=>x.includes('same physical observable')))
})
check('original Eq.54 and Kowitt full derivation are never marked reproduced',()=>{
 const r=runEG05()
 assert(r.custody.find(x=>x.id==='L92-54').reproduction==='TRANSCRIPTION_ONLY')
 assert(r.custody.find(x=>x.id==='K1994').reproduction==='NOT_REPRODUCED')
 assert(r.dimensions.eq48.includes('UNRESOLVED'))
 assert(r.status.includes('UNVERIFIED'))
})
check('source sweep replay, null authority, and no unintended merge promotion',()=>{
 const r=runEG05()
 assert.equal(r.sourceSweep.length,71)
 near(r.sourceSweep[0].log10MuRelative,-35)
 near(r.sourceSweep.at(-1).log10MuRelative,0)
 assert.equal(r.schema,EG05.schema)
 assert.equal(r.provenance,'SIMULATED')
 assert.equal(r.authority,'NONE')
 assert.deepEqual(r,runEG05())
})
check('domain controls reject invalid gate parameters',()=>{
 assert.throws(()=>runEG05({densityExponent:40}),RangeError)
 assert.throws(()=>runEG05({temperatureK:-1}),RangeError)
 assert.throws(()=>runEG05({log10MuRelative:-40}),RangeError)
 assert.throws(()=>runEG05({penetrationNm:0}),RangeError)
})
console.log('EG05 '+count+'/'+count+' PASS · limited source custody and SI checks, no gravity validation')
