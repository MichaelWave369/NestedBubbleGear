/**
 * BSR-4: ECG candidate-event / manually annotated breathing-phase diagnostics.
 * Mathematical methods are self-contained and descriptive only.
 * No diagnostic QRS validation, clinical inference or significance test.
 */
export const BSR4_PROTOCOL = 'BSR-4.0.0'
export const SAMPLE_RATE = 125
export const BIDMC_WAVEFORMS = Object.freeze([
  { id: '01', signalsSha256: '21495169cc36e82352d8e12cc6430927946d02d240b030715088d02396ea2d5c',
    breathsSha256: '698846517e27e7789d855875bae9774db3c189900efae8e486c300ed5ce58037' },
  { id: '02', signalsSha256: 'cbe4cc6532df50aaa56382cc6348effc76ed2347f6562a590876a0dfb747e2ea',
    breathsSha256: 'b17230d3a2b3f7063b3a2e9b4dc94e46bf02c1dc7b3f71ee0507e0598d6609ac' },
  { id: '03', signalsSha256: 'c8a642b9d5c0054d401489a96b050f8977890fa45c7ffe1f778bd32ce7086c53',
    breathsSha256: '13369112102198ee51b291164c61614a06c73cc9edfa66af6b7070b786dded5f' },
])
export const BSR4_DATASET = Object.freeze({
  title: 'BIDMC PPG and Respiration Dataset', version: '1.0.0',
  doi: '10.13026/C2208R',
  license: 'Open Data Commons Attribution License v1.0',
  authors: 'Pimentel, Johnson, Charlton, Clifton',
  source: 'https://physionet.org/content/bidmc/1.0.0/',
  checksums: 'https://physionet.org/files/bidmc/1.0.0/SHA256SUMS.txt',
})
export function waveformFileUrl(id, type) {
  if (!BIDMC_WAVEFORMS.some(row => row.id === id)) throw Error('Record is not frozen in BSR-4.')
  if (!['Signals','Breaths'].includes(type)) throw Error('Only the specified source files are allowed.')
  return 'https://physionet.org/files/bidmc/1.0.0/bidmc_csv/bidmc_' + id + '_' + type + '.csv'
}
const parseNumeric = (token, name) => {
  const v = token.trim()
  if (v === '' || /^(nan|na)$/i.test(v)) return null
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v)) throw Error('Invalid ' + name + ' numeric token.')
  const n = Number(v)
  if (!Number.isFinite(n)) throw Error('Nonfinite ' + name + ' value.')
  return n
}
export function parseSignalsCsv(input) {
  if (typeof input !== 'string' || input.length > 4_500_000) throw Error('Signals CSV exceeds 4.5 MB.')
  const lines = input.replace(/\r/g,'').trim().split('\n')
  if (lines.length < 10001 || lines.length > 63002) throw Error('Waveform needs 10,000–63,000 rows.')
  const columns = lines.shift().replace(/^\uFEFF/,'').split(',').map(s=>s.trim())
  if (columns.join('|') !== 'Time [s]|RESP|PLETH|V|AVR|II') {
    throw Error('Unsupported waveform header. Expected: Time [s], RESP, PLETH, V, AVR, II')
  }
  const resp = new Array(lines.length), ecg = new Array(lines.length)
  let missingResp = 0, missingECG = 0
  for (let i=0;i<lines.length;i++) {
    const row = lines[i].split(',')
    if (row.length !== 6) throw Error('Exactly six signal fields required at row '+(i+2))
    const t = parseNumeric(row[0],'time')
    if (t === null || Math.abs(t - i / SAMPLE_RATE) > 0.001) throw Error('125 Hz time grid is not aligned at row '+(i+2))
    const r = parseNumeric(row[1],'respiration')
    const e = parseNumeric(row[5],'ECG II')
    resp[i] = r
    ecg[i] = e
    if (r === null) missingResp++
    if (e === null) missingECG++
    // The unexamined PLETH, V, and AVR channels must still be valid CSV tokens.
    for (const value of row.slice(2,5)) parseNumeric(value,'other channel')
  }
  return {
    sampleRateHz:SAMPLE_RATE, durationSeconds:(lines.length-1)/SAMPLE_RATE,
    resp, ecg, missingResp, missingECG, sourceClass:'USER_SUPPLIED_UNVERIFIED',
  }
}
export function parseBreathAnnotationsCsv(input, sampleCount) {
  if (typeof input !== 'string' || input.length>40000) throw Error('Breaths CSV exceeds 40 kB.')
  const lines = input.replace(/\r/g,'').trim().split('\n')
  if (lines.length < 13 || lines.length > 450) throw Error('Require at least 12 and at most 449 breathing annotations.')
  const cols=lines.shift().replace(/^\uFEFF/,'').split(',').map(s=>s.trim())
  if (cols.join('|') !== 'breaths ann1 [signal sample no]|breaths ann2 [signal sample no]') {
    throw Error('Unsupported manual breath annotation header.')
  }
  const a=[],b=[]
  for (const [i,line] of lines.entries()) {
    const parts=line.split(',')
    if (parts.length!==2) throw Error('Two annotators required at row '+(i+2))
    const n1=parseNumeric(parts[0],'annotator 1'), n2=parseNumeric(parts[1],'annotator 2')
    if (!Number.isInteger(n1)||!Number.isInteger(n2)||n1<0||n2<0||n1>=sampleCount||n2>=sampleCount) {
      throw Error('Breath annotation index outside waveform bounds.')
    }
    if (i>0&&(n1<=a[i-1]||n2<=b[i-1])) throw Error('Breath annotations must increase strictly.')
    a.push(n1);b.push(n2)
  }
  return {a,b,units:'waveform sample index, 125 Hz',sourceClass:'USER_SUPPLIED_UNVERIFIED'}
}
function quantile(values,q) {
  const sorted=[...values].sort((a,b)=>a-b)
  return sorted[Math.max(0,Math.min(sorted.length-1,Math.floor((sorted.length-1)*q)))]
}
/**
 * High-pass via symmetric box-average subtraction and polarity-agnostic
 * absolute extrema. This is only an UNVALIDATED candidate detector.
 * No claims of R-peak specificity/sensitivity on clinical recordings.
 */
export function detectECGCandidates(signal,sampleRate=SAMPLE_RATE) {
  if (!Array.isArray(signal)||signal.length<sampleRate*20) throw Error('Too little ECG data.')
  const n=signal.length, radius=Math.max(3,Math.round(sampleRate*0.12))
  const prefix=new Float64Array(n+1), counts=new Uint32Array(n+1)
  for(let i=0;i<n;i++){
    prefix[i+1]=prefix[i]+(signal[i]===null?0:signal[i])
    counts[i+1]=counts[i]+(signal[i]===null?0:1)
  }
  const env=new Float64Array(n)
  const pool=[]
  for(let i=radius;i<n-radius;i++){
    if(signal[i]===null)continue
    const lo=i-radius,hi=i+radius+1
    const observed=counts[hi]-counts[lo]
    if(observed<(hi-lo)*.95) continue
    const residual=Math.abs(signal[i]-(prefix[hi]-prefix[lo])/observed)
    env[i]=residual
    if(i%3===0)pool.push(residual)
  }
  const threshold=pool.length?quantile(pool,.94):Infinity
  if(!Number.isFinite(threshold)||threshold<1e-7) {
    return {events:[],threshold:null,status:'FLAT_OR_MISSING_ECG'}
  }
  const refractory=Math.round(sampleRate*.34), found=[]
  for(let i=radius+3;i<n-radius-3;i++){
    if(env[i]<threshold||env[i]<=env[i-1]||env[i]<env[i+1])continue
    if(found.length && i-found.at(-1)<refractory){
      // Use larger amplitude inside refractory window to suppress double peaks.
      if(env[i]>env[found.at(-1)]) found[found.length-1]=i
      continue
    }
    found.push(i)
  }
  return {events:found,threshold,status:'UNVALIDATED_DETECTOR'}
}
export function phaseAtEvents(events,annotations,shiftSamples=0,durationSamples=null) {
  const a=annotations
  if(!a||a.length<3) return []
  const max=durationSamples??a.at(-1)+1
  const selected=[]
  let j=0
  for(const e of events){
    const moved=(e+shiftSamples+max)%max
    // Use modulo offsets for surrogates, but sort and interpolate over original breath timeline.
    selected.push(moved)
  }
  selected.sort((x,y)=>x-y)
  const phases=[]
  for(const e of selected) {
    while(j<a.length-2 && e>=a[j+1]) j++
    if(e<a[j]||e>=a[j+1])continue
    const gap=a[j+1]-a[j]
    if(gap < SAMPLE_RATE*.8 || gap > SAMPLE_RATE*15) continue
    phases.push(2*Math.PI*(e-a[j])/gap)
  }
  return phases
}
export function phaseResult(phases) {
  if(phases.length<3)return {strength:null,eventCount:phases.length,angleRadians:null}
  let x=0,y=0
  for(const phase of phases){x+=Math.cos(phase);y+=Math.sin(phase)}
  x/=phases.length;y/=phases.length
  return {strength:Math.hypot(x,y),eventCount:phases.length,angleRadians:Math.atan2(y,x)}
}
const median=x=> x.length? quantile(x,.5):null
export function analyzePhaseDynamics(wave, annotations) {
  if(!wave||!annotations)throw Error('Both signals and two breath annotations are needed.')
  const detected=detectECGCandidates(wave.ecg)
  const a=annotations.a,b=annotations.b
  const alignmentSeconds=median(a.map((v,i)=>Math.abs(v-b[i])/SAMPLE_RATE))
  const ecgCoverage=1-wave.missingECG/wave.ecg.length
  const respCoverage=1-wave.missingResp/wave.resp.length
  const bpm=detected.events.length/wave.durationSeconds*60
  const primary=phaseResult(phaseAtEvents(detected.events,a))
  const second=phaseResult(phaseAtEvents(detected.events,b))
  const half=Math.floor(wave.ecg.length/2)
  const first=phaseResult(phaseAtEvents(detected.events.filter(e=>e<half),a))
  const latter=phaseResult(phaseAtEvents(detected.events.filter(e=>e>=half),a))
  const seconds=[17,37,73,131]
  const surrogates=seconds.map(offsetSeconds=>({
    offsetSeconds,
    ...phaseResult(phaseAtEvents(detected.events,a,offsetSeconds*SAMPLE_RATE,wave.ecg.length)),
  }))
  const refusal=[]
  if(ecgCoverage<.95||respCoverage<.95)refusal.push('WAVEFORM_MISSINGNESS')
  if(alignmentSeconds===null || alignmentSeconds>.25)refusal.push('ANNOTATOR_DISAGREEMENT')
  if(a.length<12||b.length<12)refusal.push('TOO_FEW_BREATH_ANNOTATIONS')
  if(detected.events.length<30 || bpm<35 || bpm>200)refusal.push('UNRELIABLE_ECG_CANDIDATES')
  if(primary.eventCount<25||second.eventCount<25)refusal.push('INSUFFICIENT_PHASE_COVERAGE')
  if(first.eventCount<10||latter.eventCount<10)refusal.push('INSUFFICIENT_SPLIT_HALF_COVERAGE')
  if(surrogates.some(item=>item.eventCount<25))refusal.push('SHIFT_DIAGNOSTIC_UNAVAILABLE')
  return {
    protocol:BSR4_PROTOCOL,
    status:refusal.length?'REFUSE_INTERPRETATION':'DESCRIPTIVE_ONLY_UNVALIDATED_DETECTOR',
    refusal,
    input:{samples:wave.ecg.length,durationSeconds:wave.durationSeconds,
      ecgCoverage,respCoverage,breathAnnotations:a.length,
      medianInterannotatorDifferenceSeconds:alignmentSeconds},
    detector:{status:detected.status,candidateCount:detected.events.length,
      approximateRateBpm:bpm,threshold:detected.threshold},
    candidateEvents:detected.events,primary,secondAnnotator:second,
    splitHalf:[first,latter],surrogates,
    limitations:['Candidate peaks are NOT validated clinical QRS detections.',
      'Breath marks are manual annotations of respiratory cycles, not neural phases.',
      'Surrogates are visual alignment diagnostics, NOT valid inferential nulls for all nonstationary clinical recordings.',
      'Phase concentration does not establish coupling, mechanism, causation or medical value.'],
  }
}
export function buildBSR4Receipt(wave,annotations,analysis,source) {
  const {candidateEvents,...statistics}=analysis
  return {
    protocol:BSR4_PROTOCOL,
    source,
    dataset:BSR4_DATASET,
    rawSamplesIncluded:false,
    detectedEventTimesIncluded:false,
    metadata:{waveformSampleRateHz:SAMPLE_RATE,breathCount:annotations.a.length},
    statistics,
    verdict:'DESCRIPTIVE_EVENT_PHASE_PROBE_ONLY',
  }
}
