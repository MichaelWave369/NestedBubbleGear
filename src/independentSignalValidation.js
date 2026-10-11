/**
 * BSR-5: independent reference heartbeat-event benchmarking.
 * Own WFDB 212/ATR reader and deterministic evaluation of the frozen BSR-4
 * candidate event detector. This is NOT independent clinical validation.
 */
import { detectECGCandidates } from './phaseDynamicsModel.js'

export const BSR5_PROTOCOL='BSR-5.0.0'
export const MITDB_RATE=360
export const TOLERANCE_SAMPLES=54 // 150 ms @ 360 Hz; frozen before evaluation
export const MITDB_SOURCE=Object.freeze({
  name:'MIT-BIH Arrhythmia Database',
  version:'1.0.0',
  doi:'10.13026/C2F305',
  url:'https://physionet.org/content/mitdb/1.0.0/',
  checksumManifest:'https://physionet.org/files/mitdb/1.0.0/SHA256SUMS.txt',
  license:'Open Data Commons Attribution 1.0',
  credit:'Moody and Mark; expert-reviewed clinical heartbeat reference annotations',
})
export const REFERENCE_RECORDS=Object.freeze([
  {id:'100',partition:'PILOT',digests:{
    hea:'60ebc904c7bf3e04d142638d3fd5c903e8dc9f10f1ea3264e07926aa089ee75e',
    dat:'b2ea3c250e56e48f4b7b90697832b8ecd1afa1e0bb31f2dcfea4ed6e1075a639',
    atr:'8d8a5349fb16638ebbf649f1779d12e96d91b736b2aafe59db43719ae583d471',
  }},
  {id:'101',partition:'FROZEN_HOLDOUT',digests:{
    hea:'d5f02fbe8673fa05465442191b98ca0d28a1670e7ef0e83fb9ef8723113a311c',
    dat:'698d1ea6f472d23ca50317c72c96cda2698badd8578220ed0380cdf241e39006',
    atr:'441cdd6486cfdf4c53e344d1048ab81296773e7058d53069022adc68543a0663',
  }},
])
export function mitdbFileUrl(recordId,kind) {
  if(!REFERENCE_RECORDS.some(r=>r.id===recordId))throw Error('Only frozen benchmark records may be loaded.')
  if(!['hea','dat','atr'].includes(kind))throw Error('Unsupported WFDB source file type.')
  return 'https://physionet.org/files/mitdb/1.0.0/'+recordId+'.'+kind
}
export function parseMITDBHeader(content,id) {
  if(typeof content!=='string'||content.length>5000)throw Error('Header file is missing or oversized.')
  const lines=content.replace(/\r/g,'').trim().split('\n').filter(x=>x.trim()&&!x.startsWith('#'))
  if(lines.length!==3)throw Error('Expected two-channel WFDB header.')
  const first=lines[0].trim().split(/\s+/)
  if(first.length<4||first[0]!==id||first[1]!=='2'||first[2]!=='360')throw Error('Unsupported record, channels or sample rate.')
  const sampleCount=Number(first[3])
  if(!Number.isInteger(sampleCount)||sampleCount!==650000)throw Error('Unfrozen sample count.')
  const signals=lines.slice(1).map(s=>s.trim().split(/\s+/))
  for(const s of signals) {
    if(s[0]!==id+'.dat'||s[1]!=='212'||s[2]!=='200'||s[4]!=='1024') {
      throw Error('Unsupported signal format, gain or baseline.')
    }
  }
  if(signals[0].at(-1)!=='MLII')throw Error('Lead 0 is not MLII, refuse channel substitution.')
  return {id,sampleCount,sampleRate:MITDB_RATE,channels:2,format:212,channel:0,gain:200,baseline:1024}
}
export function decodeWFDB212(bytes,header) {
  if(!(bytes instanceof Uint8Array))throw Error('Expected Uint8Array signal bytes.')
  if(bytes.length!==header.sampleCount*3)throw Error('Unexpected packed WFDB signal byte length.')
  const signal=new Array(header.sampleCount)
  for(let i=0,p=0;i<signal.length;i++,p+=3) {
    const value=(bytes[p]|((bytes[p+1]&15)<<8))
    signal[i]=(value>=2048?value-4096:value)-header.baseline
  }
  return signal
}
// Expert labels corresponding to beat events; nonbeat rhythm, noise and notes
// MUST NOT be evaluated as expected heartbeats. Ambiguous class Q kept in
// the evaluation, and class counts reported, no cherry-picked normal beats.
export const BEAT_TYPES=Object.freeze([1,2,3,4,5,6,7,8,9,10,11,12,13,34,35,38,41])
export function parseMITAnnotations(bytes,expectedSampleCount=650000) {
  if(!(bytes instanceof Uint8Array)||bytes.length<4||bytes.length>20000||bytes.length%2)throw Error('Invalid ATR bytes.')
  const beatTypes=new Set(BEAT_TYPES),events=[],byType={}
  let offset=0,time=0,ended=false
  while(offset+1<bytes.length) {
    const low=bytes[offset],high=bytes[offset+1];offset+=2
    const type=high>>2,interval=((high&3)<<8)|low
    if(type===0&&interval===0){ended=true;break}
    if(type===59){
      if(offset+4>bytes.length)throw Error('Truncated ATR SKIP interval.')
      const hi=bytes[offset]+256*bytes[offset+1]
      const lo=bytes[offset+2]+256*bytes[offset+3]
      time+=hi*65536+lo
      offset+=4;continue
    }
    if(type===60||type===61||type===62)continue
    if(type===63){
      const size=interval+(interval%2)
      if(offset+size>bytes.length)throw Error('Truncated ATR auxiliary text.')
      offset+=size;continue
    }
    if(type>41)throw Error('Unsupported annotation type code '+type)
    time+=interval
    if(time>=expectedSampleCount)throw Error('Annotation lies beyond signal.')
    if(beatTypes.has(type)){
      if(events.length&&events.at(-1)>=time)throw Error('Beat reference times not increasing.')
      events.push(time)
      byType[type]=(byType[type]||0)+1
    }
  }
  if(!ended)throw Error('ATR terminator missing.')
  if(events.length<2)throw Error('Too few expert beat annotations.')
  return {events,byType,allBeats:events.length,referenceClass:'EXPERT_REVIEWED_MITDB'}
}
/**
 * Strict 1:1 chronological event matching within tolerance.
 * Monotone earliest feasible matching maximizes cardinality for ordered
 * 1D tolerance windows. No beat can match multiple references.
 */
export function matchBeatEvents(detected,reference,toleranceSamples=TOLERANCE_SAMPLES) {
  if(!Number.isInteger(toleranceSamples)||toleranceSamples<0||toleranceSamples>MITDB_RATE)throw Error('Invalid matching tolerance.')
  if(!Array.isArray(detected)||!Array.isArray(reference))throw Error('Expected event arrays.')
  for(const values of [detected,reference]){
    for(let i=0;i<values.length;i++) if(!Number.isInteger(values[i])||values[i]<0||(i&&values[i]<=values[i-1]))throw Error('Events must be sorted unique nonnegative indexes.')
  }
  let i=0,j=0,tp=0,fp=0,fn=0
  const absErrors=[]
  while(i<detected.length&&j<reference.length) {
    const d=detected[i],r=reference[j]
    if(d<r-toleranceSamples){fp++;i++}
    else if(r<d-toleranceSamples){fn++;j++}
    else{tp++;absErrors.push(Math.abs(d-r));i++;j++}
  }
  fp+=detected.length-i;fn+=reference.length-j
  const precision=tp+fp?tp/(tp+fp):null
  const recall=tp+fn?tp/(tp+fn):null
  const f1=precision===null||recall===null||precision+recall===0?0:2*precision*recall/(precision+recall)
  const errors=absErrors.slice().sort((a,b)=>a-b)
  return {
    tp,fp,fn,precision,recall,f1,
    medianAbsTimingErrorMs:errors.length?1000*errors[Math.floor((errors.length-1)/2)]/MITDB_RATE:null,
    toleranceMs:1000*toleranceSamples/MITDB_RATE,
    matchMethod:'ONE_TO_ONE_EARLIEST_FEASIBLE',
  }
}
export function scoreMITDBBenchmark({signal,reference,sampleRate=MITDB_RATE},detector=detectECGCandidates) {
  if(sampleRate!==MITDB_RATE||signal.length!==650000)throw Error('Full-length MITDB 360 Hz record required.')
  if(!Array.isArray(reference)||reference.length<100)throw Error('Insufficient expert annotations.')
  const result=detector(signal,MITDB_RATE)
  const events=result.events
  const global=matchBeatEvents(events,reference,TOLERANCE_SAMPLES)
  const WINDOW=MITDB_RATE*300
  const windows=[]
  for(let start=0;start<signal.length;start+=WINDOW){
    const end=Math.min(start+WINDOW,signal.length)
    const subDetected=events.filter(x=>x>=start&&x<end)
    const subRef=reference.filter(x=>x>=start&&x<end)
    const changes=0
    const score=matchBeatEvents(subDetected,subRef,TOLERANCE_SAMPLES)
    const averageBpm=subDetected.length*60/((end-start)/MITDB_RATE)
    const nonfinite=signal.slice(start,end).filter(x=>x===null||!Number.isFinite(x)).length
    const variance=Math.max(...signal.slice(start,Math.min(end,start+2000)))-
      Math.min(...signal.slice(start,Math.min(end,start+2000)))
    const flags=[]
    if(nonfinite)flags.push('NONFINITE_OR_MISSING')
    if(variance<1)flags.push('FLAT_INITIAL_SEGMENT')
    if(averageBpm<35||averageBpm>200)flags.push('CANDIDATE_RATE_OUTSIDE_35_200')
    windows.push({
      beginSeconds:start/MITDB_RATE,endSeconds:end/MITDB_RATE,
      detected:subDetected.length,reference:subRef.length,...score,
      flags,
    })
  }
  // Repeated shifted events act as conspicuously misaligned diagnostic
  // and are *not* a statistical significance test.
  const shift=MITDB_RATE
  const shifted=events.map(x=>x+shift).filter(x=>x<signal.length)
  const shiftedScore=matchBeatEvents(shifted,reference,TOLERANCE_SAMPLES)
  const guardrails=[]
  if(global.recall<.95||global.precision<.95)guardrails.push('BELOW_FROZEN_95_PERCENT_BENCHMARK_TARGET')
  if(windows.some(w=>w.flags.length))guardrails.push('ARTIFACT_FLAGS_PRESENT')
  if(windows.some(w=>w.reference<60))guardrails.push('LOW_REFERENCE_COUNT_IN_WINDOW')
  return {
    protocol:BSR5_PROTOCOL, status:guardrails.length?'NOT_QUALIFIED':'BENCHMARK_TARGET_MET_ONLY',
    guardrails,referenceBeats:reference.length,detectedBeats:events.length,
    detectorStatus:result.status,threshold:result.threshold,
    wholeRecord:global,byFiveMinutes:windows,
    deliberateOneSecondShift:shiftedScore,
    exclusionsFromScoring:0,
    fixedTargets:{precision:0.95,recall:0.95,toleranceMs:150},
    clinicalValidation:false,independentAcrossDatasets:false,
  }
}
export function buildBSR5Receipt(score,metadata) {
  return {
    protocol:BSR5_PROTOCOL,
    dataset:MITDB_SOURCE,
    provenance:metadata,
    score,
    rawECGSamplesIncluded:false,
    beatTimestampsIncluded:false,
    conclusion:'ONE_RECORD_EXPERT_REFERENCE_BENCHMARK_ONLY',
    exclusions:['No QRS or arrhythmia classification claim','No clinically certified detection',
      'Performance on MITDB does not validate BIDMC without cross-dataset transfer testing',
      'No treatment, consciousness, entrainment or phase-coherence claim'],
  }
}
