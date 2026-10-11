// BSR-3: original descriptive analysis for BIDMC's 1 Hz *rate* trends.
// No inference about cardiac/respiratory phase, EEG, synchrony, health, or causation.
export const BSR3_VERSION = 'BSR-3.0.0'
export const BIDMC_SOURCE = Object.freeze({
  title: 'BIDMC PPG and Respiration Dataset', version: '1.0.0',
  doi: '10.13026/C2208R', license: 'ODC Attribution 1.0',
  landing: 'https://physionet.org/content/bidmc/1.0.0/',
  checksumManifest: 'https://physionet.org/files/bidmc/1.0.0/SHA256SUMS.txt',
  authorCredit: 'Pimentel, Johnson, Charlton, Clifton',
  context: 'Critically ill patients in hospital care; monitor-derived rate numerics sampled at 1 Hz',
})
export const BIDMC_RECORDS = Object.freeze([
  { id: '01', sha256: '27d43794cf2e7150db10e8bfe61d2bfdb26873a8f1629ffc5fbee5c9a4eb6ef5' },
  { id: '02', sha256: '99aef20b2846815d45ecde184da753de58c8a85b7dd7af74a2f4c5282013704d' },
  { id: '03', sha256: '6666475c072fe079f35f1fffe089a0a97b56d1086985f8a5a85b7e2e530b42e4' },
])
export function bidmcUrl(id) {
  if (!BIDMC_RECORDS.some(record => record.id === id)) throw Error('Record not in frozen catalog.')
  return 'https://physionet.org/files/bidmc/1.0.0/bidmc_csv/bidmc_' + id + '_Numerics.csv'
}
export function parseBidmcNumerics(text, provenance = 'USER_SUPPLIED_UNVERIFIED') {
  if (typeof text !== 'string' || text.length > 150000) throw Error('CSV exceeds 150 kB.')
  const lines = text.replace(/\r/g, '').trim().split('\n')
  if (lines.length < 241 || lines.length > 1001) throw Error('Require 240–1000 sampled seconds.')
  const header = lines.shift().replace(/^\uFEFF/, '').split(',').map(s => s.trim())
  if (header.join('|') !== 'Time [s]|HR|PULSE|RESP|SpO2') {
    throw Error('Expected BIDMC header: Time [s], HR, PULSE, RESP, SpO2')
  }
  const parseValue = value => {
    const token = value.trim()
    if (!token || /^(nan|na)$/i.test(token)) return null
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) {
      throw Error('Invalid numeric token in CSV.')
    }
    const n = Number(token)
    if (!Number.isFinite(n)) throw Error('Nonfinite token in CSV.')
    return n
  }
  const keys = ['t', 'heartRate', 'pulseRate', 'respiratoryRate', 'spo2']
  let firstTime = null
  const rows = lines.map((line, index) => {
    const tokens = line.split(',')
    if (tokens.length !== 5) throw Error('CSV row must have five columns.')
    const values = tokens.map(parseValue)
    const row = Object.fromEntries(keys.map((key, i) => [key, values[i]]))
    if (!Number.isInteger(row.t) || row.t < 0) throw Error('Time must be nonnegative integer seconds.')
    if (firstTime === null) firstTime = row.t
    if (row.t !== firstTime + index) throw Error('Time must increase by exactly 1 second per row.')
    if (keys.slice(1).some(key => row[key] !== null && row[key] < 0)) {
      throw Error('Negative physiological rates/saturation are not valid.')
    }
    return row
  })
  return { version: BSR3_VERSION, provenance, rows, sampleRateHz: 1 }
}
const values = (rows, key) => rows.map(row => row[key])
function correlate(a, b, lag = 0) {
  const x = [], y = []
  for (let i = 0; i < a.length; i++) {
    const j = i + lag
    if (j >= 0 && j < b.length && a[i] !== null && b[j] !== null) {
      x.push(a[i]); y.push(b[j])
    }
  }
  if (x.length < 3) return { r: null, paired: x.length }
  const mx = x.reduce((s,n) => s+n,0)/x.length
  const my = y.reduce((s,n) => s+n,0)/y.length
  let xy = 0, xx = 0, yy = 0
  for (let i = 0; i < x.length; i++) {
    const dx = x[i]-mx, dy = y[i]-my
    xy += dx*dy; xx += dx*dx; yy += dy*dy
  }
  return { r: xx > 1e-12 && yy > 1e-12 ? xy/Math.sqrt(xx*yy) : null, paired:x.length }
}
const diff = x => x.slice(1).map((v,i) => v === null || x[i] === null ? null : v-x[i])
const shift = (x,n) => x.map((_,i) => x[(i+n)%x.length])
export function analyzeBidmcNumerics(recording) {
  const rows = recording?.rows
  if (!Array.isArray(rows) || rows.length < 240) throw Error('Analysis requires at least 240 rows.')
  const hr = values(rows,'heartRate'), rr = values(rows,'respiratoryRate'), pulse=values(rows,'pulseRate')
  const n = rows.length, half=Math.floor(n/2)
  const primary = correlate(hr,rr)
  const halves=[correlate(hr.slice(0,half),rr.slice(0,half)),
                correlate(hr.slice(half),rr.slice(half))]
  const changes=correlate(diff(hr),diff(rr))
  const shifts=[60,90,120,150,180].map(offset=>({offsetSeconds:offset,...correlate(hr,shift(rr,offset))}))
  const lags=[-30,-20,-10,0,10,20,30].map(lag=>({lagSeconds:lag,...correlate(hr,rr,lag)}))
  const quality={
    total:n, paired:primary.paired, coverage:primary.paired/n,
    missingHeartRate:hr.filter(v=>v===null).length,
    missingRespiratoryRate:rr.filter(v=>v===null).length,
    missingPulseRate:pulse.filter(v=>v===null).length,
  }
  const refusal=[]
  if (primary.paired < 180 || quality.coverage < .75) refusal.push('INSUFFICIENT_COVERAGE')
  if (halves.some(h=>h.paired<60)) refusal.push('SPLIT_HALF_INSUFFICIENT')
  if (primary.r===null) refusal.push('ZERO_VARIANCE')
  if (changes.paired<90 || changes.r===null) refusal.push('NO_CHANGE_SIGNAL')
  if (shifts.some(s=>s.paired<90||s.r===null)) refusal.push('SHIFT_DIAGNOSTIC_UNAVAILABLE')
  return {
    protocol:BSR3_VERSION, sourceClass:recording.provenance,
    scientificStatus:refusal.length?'REFUSE_INTERPRETATION':'DESCRIPTIVE_ONLY',
    refusal, quality, primary, halves, changes, pulse:correlate(hr,pulse),
    shifts,lags,
    methods:{
      primary:'pairwise Pearson HR versus RESP rates at 1 Hz',
      changes:'pairwise first-difference Pearson of adjacent valid rates',
      shifts:'circular shifts of RESP by frozen 60/90/120/150/180 s; descriptive only',
      significanceTests:false, phaseOrNeuralInference:false,
    },
  }
}
export function buildBSR3Receipt(recording, results, metadata = {}) {
  return {
    protocol:BSR3_VERSION, provenance:recording.provenance,
    source:metadata.source??null, actualSha256:metadata.actualSha256??null,
    matchingOfficialChecksum:metadata.matchingOfficialChecksum===true,
    dataset:BIDMC_SOURCE, rawSamplesIncluded:false,
    timeResolution:'1 Hz', units:{heartRate:'bpm',respiratoryRate:'breaths/min',pulseRate:'bpm'},
    results,
    limitations:[
      'Monitor rate trends cannot establish physiological phase locking or synchronization.',
      'Shifted and lagged correlations are exploratory and not inferential p-values.',
      'Autocorrelation, nonstationarity, and confounding may produce relationships.',
      'No ECG wave morphology or neural/EEG measurement is analyzed.',
      'No causal, clinical, treatment, or consciousness claims.',
    ],
  }
}
