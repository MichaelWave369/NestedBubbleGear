import assert from 'node:assert/strict'
import {
  BSR4_PROTOCOL,BIDMC_WAVEFORMS,SAMPLE_RATE,waveformFileUrl,
  parseSignalsCsv,parseBreathAnnotationsCsv,detectECGCandidates,
  phaseAtEvents,phaseResult,analyzePhaseDynamics,buildBSR4Receipt,
} from '../src/phaseDynamicsModel.js'

let count=0
function test(name,fn){fn();count++;console.log('PASS',name)}
const n=125*120
const synthSignals=Array.from({length:n},(_,i)=>{
  const t=i/125
  const phase=(t*1.12)%1
  const qrs=Math.exp(-(((phase-.12)/.018)**2))
  const ecg=.05*Math.sin(2*Math.PI*.3*t)+.65*qrs
  return [t.toFixed(3),Math.sin(2*Math.PI*.22*t).toFixed(5),
    .5,.6,.4,ecg.toFixed(6)].join(',')
})
const signalText=['Time [s], RESP, PLETH, V, AVR, II',...synthSignals].join('\n')
const breathPairs=[]
for(let t=1;t<117;t+=1/.22) breathPairs.push([Math.round(t*125),Math.round(t*125)+2])
const breathText=['breaths ann1 [signal sample no], breaths ann2 [signal sample no]',
  ...breathPairs.map(p=>p.join(','))].join('\n')
const wave=parseSignalsCsv(signalText)
const breaths=parseBreathAnnotationsCsv(breathText,n)
const analysis=analyzePhaseDynamics(wave,breaths)

test('catalog has frozen official SHA-256 digests and fixed resource URLs',()=>{
  assert.equal(BSR4_PROTOCOL,'BSR-4.0.0')
  assert.equal(BIDMC_WAVEFORMS.length,3)
  assert.ok(BIDMC_WAVEFORMS.every(x=>/^[a-f0-9]{64}$/.test(x.signalsSha256)&&/^[a-f0-9]{64}$/.test(x.breathsSha256)))
  assert.match(waveformFileUrl('01','Signals'),/bidmc_01_Signals\.csv$/)
  assert.throws(()=>waveformFileUrl('04','Signals'),/frozen/)
  assert.throws(()=>waveformFileUrl('01','Fix'),/source files/)
})

test('125 Hz official-format waveform parse and time cadence',()=>{
  assert.equal(wave.ecg.length,n)
  assert.equal(wave.resp.length,n)
  assert.equal(wave.missingECG,0)
  assert.equal(wave.durationSeconds,(n-1)/125)
  assert.equal(wave.sampleRateHz,SAMPLE_RATE)
})

test('two independent annotation streams are retained and ordered',()=>{
  assert.equal(breaths.a.length,breaths.b.length)
  assert.ok(breaths.a.length>20)
  assert.equal(breaths.b[0]-breaths.a[0],2)
  assert.deepEqual(parseBreathAnnotationsCsv(breathText,n),breaths)
})

test('candidate peak detector finds intended synthetic sharp pulse frequency',()=>{
  const found=detectECGCandidates(wave.ecg)
  assert.ok(found.events.length>=110&&found.events.length<=150, String(found.events.length))
  assert.equal(found.status,'UNVALIDATED_DETECTOR')
})

test('model measures proximity of two annotators without forcing agreement',()=>{
  assert.equal(analysis.status,'DESCRIPTIVE_ONLY_UNVALIDATED_DETECTOR')
  assert.equal(analysis.input.medianInterannotatorDifferenceSeconds,2/125)
  assert.ok(analysis.primary.eventCount>100)
  assert.ok(analysis.secondAnnotator.eventCount>100)
})

test('fixed split-halves, four shifted diagnostics, and no inferential claims',()=>{
  assert.equal(analysis.splitHalf.length,2)
  assert.deepEqual(analysis.surrogates.map(x=>x.offsetSeconds),[17,37,73,131])
  assert.ok(analysis.surrogates.every(x=>x.strength!==null))
  assert.equal(analysis.detector.candidateCount,detectECGCandidates(wave.ecg).events.length)
})

test('phase concentration vector behaves on reference angles',()=>{
  assert.ok(Math.abs(phaseResult([0,0,0,0]).strength-1)<1e-12)
  assert.ok(phaseResult([0,Math.PI/2,Math.PI,3*Math.PI/2]).strength<1e-12)
  assert.equal(phaseResult([0,0]).strength,null)
  const epochs=phaseAtEvents([200,300,400],[100,350,600])
  assert.equal(epochs.length,3)
})

test('constant ECG produces a refusal instead of false synchronization',()=>{
  const bad={...wave,ecg:new Array(n).fill(.4)}
  const result=analyzePhaseDynamics(bad,breaths)
  assert.equal(result.status,'REFUSE_INTERPRETATION')
  assert.ok(result.refusal.includes('UNRELIABLE_ECG_CANDIDATES'))
})

test('large inter-annotator mismatch triggers a refusal',()=>{
  const bad={a:breaths.a,b:breaths.b.map(v=>v+50)}
  const result=analyzePhaseDynamics(wave,bad)
  assert.equal(result.status,'REFUSE_INTERPRETATION')
  assert.ok(result.refusal.includes('ANNOTATOR_DISAGREEMENT'))
})

test('missingness triggers refusal instead of imputation',()=>{
  const ecg=[...wave.ecg];for(let i=0;i<1500;i++)ecg[i]=null
  const altered={...wave,ecg,missingECG:1500}
  const result=analyzePhaseDynamics(altered,breaths)
  assert.equal(result.status,'REFUSE_INTERPRETATION')
  assert.ok(result.refusal.includes('WAVEFORM_MISSINGNESS'))
})

test('CSV validation catches wrong headers, bad alignment and invalid values',()=>{
  assert.throws(()=>parseSignalsCsv(signalText.replace('Time [s], RESP','Time, RESP')),/header/)
  const lines=signalText.split('\n')
  const row=lines[100].split(',');row[0]='500';lines[100]=row.join(',')
  assert.throws(()=>parseSignalsCsv(lines.join('\n')),/125 Hz/)
  const broken=signalText.split('\n');broken[85]='junk'
  assert.throws(()=>parseSignalsCsv(broken.join('\n')),/six signal/)
  assert.throws(()=>parseSignalsCsv('x'.repeat(4_500_001)),/4.5 MB/)
})

test('annotation validation refuses missing pair, unsorted index and mismatched bounds',()=>{
  assert.throws(()=>parseBreathAnnotationsCsv(breathText.replace('breaths ann1','ann'),n),/header/)
  const lines=breathText.split('\n');lines[4]='-1,3'
  assert.throws(()=>parseBreathAnnotationsCsv(lines.join('\n'),n),/outside waveform/)
  assert.throws(()=>parseBreathAnnotationsCsv(breathText,100),/outside waveform/)
})

test('ledger receipt exports no raw waveforms or candidate timestamps',()=>{
  const receipt=buildBSR4Receipt(wave,breaths,analysis,{
    recordId:'01',verifiedByOfficialSha256:false,
  })
  assert.equal(receipt.protocol,BSR4_PROTOCOL)
  assert.equal(receipt.rawSamplesIncluded,false)
  assert.equal(receipt.detectedEventTimesIncluded,false)
  const json=JSON.stringify(receipt)
  assert.ok(!json.includes('"candidateEvents"'))
  assert.ok(!json.includes('"ecg":'))
  assert.ok(!json.includes('"resp":'))
})

console.log('BSR-4 '+count+'/'+count+' deterministic model checks PASS; no clinical validation or biological discovery.')
