import assert from 'node:assert/strict'
import {
  BSR5_PROTOCOL,REFERENCE_RECORDS,MITDB_RATE,mitdbFileUrl,
  parseMITDBHeader,decodeWFDB212,parseMITAnnotations,BEAT_TYPES,
  matchBeatEvents,scoreMITDBBenchmark,buildBSR5Receipt,
} from '../src/independentSignalValidation.js'
import { detectECGCandidates } from '../src/phaseDynamicsModel.js'

let passed=0
const test=(name,fn)=>{fn();passed++;console.log('PASS',name)}
const header='100 2 360 650000\n100.dat 212 200 11 1024 995 -22131 0 MLII\n100.dat 212 200 11 1024 1011 20052 0 V5\n# no patient metadata needed'
const meta=parseMITDBHeader(header,'100')
const encodePair=(a,b)=>{
  const a12=a<0?a+4096:a,b12=b<0?b+4096:b
  return [a12&255,((b12>>8)<<4)|(a12>>8),b12&255]
}
const encodeAnn=(delta,type)=>[delta&255,(type<<2)|(delta>>8)]
const atrBytes=Uint8Array.from([
  ...encodeAnn(10,1),...encodeAnn(30,28),...encodeAnn(12,5),
  ...encodeAnn(3,63),65,66,67,0,...encodeAnn(2,1),0,0,
])
test('public reference catalog freezes two nonoverlapping records and official hashes',()=>{
  assert.equal(BSR5_PROTOCOL,'BSR-5.0.0')
  assert.deepEqual(REFERENCE_RECORDS.map(x=>x.partition),['PILOT','FROZEN_HOLDOUT'])
  for(const r of REFERENCE_RECORDS)for(const hash of Object.values(r.digests)) assert.match(hash,/^[0-9a-f]{64}$/)
  assert.match(mitdbFileUrl('100','atr'),/100\.atr$/)
  assert.throws(()=>mitdbFileUrl('102','hea'),/frozen/)
  assert.throws(()=>mitdbFileUrl('100','js'),/Unsupported/)
})
test('WFDB header enforces record identity, 360 Hz, 212 format and MLII lead',()=>{
  assert.equal(meta.sampleCount,650000)
  assert.equal(meta.sampleRate,360)
  assert.equal(meta.channel,0)
  assert.throws(()=>parseMITDBHeader(header,'101'),/record/)
  assert.throws(()=>parseMITDBHeader(header.replace('MLII','V1'),'100'),/Lead 0/)
  assert.throws(()=>parseMITDBHeader(header.replace(' 212 ',' 16 '),'100'),/signal format/)
})
test('WFDB format 212 bit packing recovers signed channel-zero samples',()=>{
  const small={...meta,sampleCount:3,baseline:0}
  const dat=Uint8Array.from([...encodePair(123,-320),...encodePair(-2048,2047),...encodePair(2047,-2048)])
  assert.deepEqual(decodeWFDB212(dat,small),[123,-2048,2047])
  assert.throws(()=>decodeWFDB212(dat.slice(1),small),/byte length/)
})
test('MIT ATR parser excludes rhythm annotations and AUX text while preserving beat classes',()=>{
  const decoded=parseMITAnnotations(atrBytes,500)
  assert.deepEqual(decoded.events,[10,52,54])
  assert.deepEqual(decoded.byType,{1:2,5:1})
  assert.ok(BEAT_TYPES.includes(13))
  assert.ok(!BEAT_TYPES.includes(28))
})
test('ATR parser handles binary SKIP high-word/low-word time intervals',()=>{
  const long=Uint8Array.from([
    ...encodeAnn(100,1),
    ...encodeAnn(0,59),1,0,44,1,  // 65536 + 300 = 65836
    ...encodeAnn(5,5),...encodeAnn(10,1),0,0,
  ])
  assert.deepEqual(parseMITAnnotations(long,70000).events,[100,65941,65951])
})
test('ATR parser refuses truncated metadata, missing sentinel and out-of-range events',()=>{
  assert.throws(()=>parseMITAnnotations(Uint8Array.from([...encodeAnn(1,1),...encodeAnn(1,1)])),/terminator/)
  assert.throws(()=>parseMITAnnotations(Uint8Array.from([...encodeAnn(1,1),...encodeAnn(3,63),7,8])),/Truncated/)
  assert.throws(()=>parseMITAnnotations(atrBytes,20),/beyond/)
})
test('one-to-one matching counts TP, FP, FN without double assignment',()=>{
  const m=matchBeatEvents([90,101,201,330],[100,200,301],10)
  assert.deepEqual([m.tp,m.fp,m.fn],[2,2,1])
  assert.ok(Math.abs(m.precision-.5)<1e-12)
  assert.ok(Math.abs(m.recall-2/3)<1e-12)
  assert.ok(Math.abs(m.f1-4/7)<1e-12)
  assert.throws(()=>matchBeatEvents([3,2],[1,2]),/sorted/)
})
test('frozen tolerance and timing error are never optimized from results',()=>{
  const m=matchBeatEvents([54,400],[0,400])
  assert.equal(m.tp,2)
  assert.equal(m.toleranceMs,150)
  assert.equal(m.medianAbsTimingErrorMs,0) // ordered lower median
  assert.throws(()=>matchBeatEvents([],[],361),/tolerance/)
})
test('missed beats and unmatched detections affect recall and precision',()=>{
  const m=matchBeatEvents([5,100,150],[5,50,100],5)
  assert.deepEqual([m.tp,m.fp,m.fn],[2,1,1])
  assert.equal(matchBeatEvents([],[1,2,3]).recall,0)
})
test('BSR-4 ECG candidate detector runs with independent 360 Hz sample rate',()=>{
  const fs=MITDB_RATE,signal=Array.from({length:fs*40},(_,i)=>{
    const t=i/fs,cycle=(t*1.1)%1,peak=Math.exp(-(((cycle-.13)/.014)**2))
    return 20*Math.sin(2*Math.PI*.3*t)+320*peak
  })
  const result=detectECGCandidates(signal,MITDB_RATE)
  assert.ok(result.events.length>=37&&result.events.length<=50)
  assert.equal(result.status,'UNVALIDATED_DETECTOR')
})
const large=new Array(650000).fill(0)
const gold=Array.from({length:600},(_,i)=>1000+i*1000)
const perfectDetector=()=>({status:'FROZEN_FIXTURE',threshold:1,events:[...gold]})
const injected=scoreMITDBBenchmark({signal:large,reference:gold},perfectDetector)
test('synthetic fixture supports full-length benchmark and predeclared per-window metrics',()=>{
  assert.equal(injected.wholeRecord.tp,600)
  assert.equal(injected.wholeRecord.fp,0)
  assert.equal(injected.wholeRecord.fn,0)
  assert.equal(injected.byFiveMinutes.length,7)
  assert.equal(injected.exclusionsFromScoring,0)
  assert.equal(injected.status,'NOT_QUALIFIED') // flagged flat signal, no cherry-picking
})
test('benchmark refuses low accuracy while retaining full unmatched count',()=>{
  const detector=()=>({status:'TEST',threshold:1,events:gold.filter((_,i)=>i%3===0)})
  const scored=scoreMITDBBenchmark({signal:large,reference:gold},detector)
  assert.ok(scored.wholeRecord.recall<.4)
  assert.ok(scored.guardrails.includes('BELOW_FROZEN_95_PERCENT_BENCHMARK_TARGET'))
  assert.equal(scored.wholeRecord.fn,400)
})
test('moving all candidate beats by one second damages toy matching',()=>{
  assert.ok(injected.deliberateOneSecondShift.recall < 1)
})
test('ledger has exact reference name and summary only, without raw signal/event lists',()=>{
  const receipt=buildBSR5Receipt(injected,{record:'100',fileHashesVerified:true})
  assert.equal(receipt.provenance.record,'100')
  assert.equal(receipt.rawECGSamplesIncluded,false)
  assert.equal(receipt.beatTimestampsIncluded,false)
  assert.ok(!JSON.stringify(receipt).includes('"events":'))
  assert.ok(!JSON.stringify(receipt).includes('"signal":'))
})
console.log('BSR-5 '+passed+'/'+passed+' deterministic tests PASS; no real-world detector accuracy measured by this fixture.')
