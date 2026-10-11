import { useMemo, useState } from 'react'
import {
  BSR3_VERSION, BIDMC_RECORDS, BIDMC_SOURCE, bidmcUrl,
  parseBidmcNumerics, analyzeBidmcNumerics, buildBSR3Receipt,
} from './resonanceObservatoryModel.js'
import './resonanceObservatory.css'

const fmt = x => x === null || x === undefined || !Number.isFinite(x) ? 'n/a' : x.toFixed(3)
async function hashSha256(bytes) {
  if (!globalThis.crypto?.subtle) throw Error('Secure-context SHA-256 verification is unavailable.')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), n=>n.toString(16).padStart(2,'0')).join('')
}
function exportReceipt(receipt) {
  const blob = new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href=url; link.download='NBG_BSR3_observatory_receipt.json'
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
}
function trace(rows, key, bounds, x0=52, width=648, yCenter=100) {
  let data = ''
  let active = false
  const radius = Math.max((bounds.max-bounds.min)/2, 1)
  const middle = (bounds.max+bounds.min)/2
  rows.forEach((row,i)=>{
    const value = row[key]
    if (value===null) { active=false; return }
    const x = x0 + width*i/(rows.length-1)
    const y = yCenter - (value-middle)/radius*48
    data += (active?'L':'M')+x.toFixed(2)+','+y.toFixed(2)+' '
    active=true
  })
  return data
}
function boundsOf(rows,key) {
  const values=rows.map(row=>row[key]).filter(v=>v!==null)
  if (!values.length) return {min:0,max:1}
  return {min:Math.min(...values),max:Math.max(...values)}
}
function TrendsPlot({recording}) {
  const rows=recording.rows
  const paths=useMemo(()=>{
    return [
      {key:'heartRate',label:'HEART RATE · beats/min',color:'#ffc56f',center:112},
      {key:'respiratoryRate',label:'RESPIRATORY RATE · breaths/min',color:'#73ffc5',center:280},
    ].map(channel=>{
      const bounds=boundsOf(rows,channel.key)
      return {...channel,bounds,d:trace(rows,channel.key,bounds,52,648,channel.center)}
    })
  },[rows])
  return <div className="rob-plot">
    <div className="rob-plot-header"><strong>REAL MONITOR RATE TRENDS</strong>
      <span>1 Hz · independently scaled · gaps remain gaps</span></div>
    <svg viewBox="0 0 752 420" role="img" aria-label="Two vertically separated time-series panels displaying real recorded heart-rate and respiratory-rate data with missing sample gaps.">
      <rect width="752" height="420" fill="#061019" />
      {paths.map(p=><g key={p.key}>
        <rect x="40" y={p.center-57} width="670" height="118" rx="8" fill="#102533" fillOpacity=".8" stroke="#8bc9ff" strokeOpacity=".18"/>
        <line x1="52" y1={p.center} x2="700" y2={p.center} stroke="#a1c5d3" strokeDasharray="5 9" strokeOpacity=".3"/>
        <path d={p.d} stroke={p.color} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <text x="52" y={p.center-74} fill={p.color} fontSize="13" fontFamily="ui-monospace,monospace">{p.label}</text>
        <text x="632" y={p.center-74} fill="#b5c8d7" fontSize="11" fontFamily="ui-monospace,monospace">
          {p.bounds.min.toFixed(0)} to {p.bounds.max.toFixed(0)}
        </text>
      </g>)}
      <text x="52" y="407" fill="#b9d1da" fontSize="12" fontFamily="ui-monospace,monospace">0 s</text>
      <text x="602" y="407" fill="#b9d1da" fontSize="12" fontFamily="ui-monospace,monospace">
        {rows.length-1} s
      </text>
    </svg>
    <div className="rob-plot-note">Two rate trends, not waveform phases. Equal-looking height does not mean equal amplitude or frequency.</div>
  </div>
}
export default function ResonanceObservatory() {
  const [selected,setSelected]=useState('01')
  const [recording,setRecording]=useState(null)
  const [metadata,setMetadata]=useState(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const result=useMemo(()=>recording?analyzeBidmcNumerics(recording):null,[recording])
  const record=BIDMC_RECORDS.find(item=>item.id===selected)

  async function loadBytes(bytes, {isOfficial=false, filename='local data'}={}) {
    if (bytes.byteLength>150000) throw Error('Numerics CSV exceeds 150 kB.')
    const hash=await hashSha256(bytes)
    const match=BIDMC_RECORDS.find(item=>item.sha256===hash)
    if (isOfficial && (!match || match.id!==selected)) {
      throw Error('Official CSV SHA-256 does not match the frozen PhysioNet manifest. Refusing to analyze.')
    }
    const provenance=match?'PUBLIC_SHA256_VERIFIED':'USER_SUPPLIED_UNVERIFIED'
    const csv=new TextDecoder('utf-8',{fatal:true}).decode(bytes)
    const parsed=parseBidmcNumerics(csv,provenance)
    setRecording(parsed)
    setMetadata({
      actualSha256:hash,
      matchingOfficialChecksum:Boolean(match),
      source:match?bidmcUrl(match.id):null,
      filename:match?'bidmc_'+match.id+'_Numerics.csv':filename,
    })
  }
  async function loadOfficial() {
    setLoading(true); setError(''); setRecording(null); setMetadata(null)
    try {
      // Browser-origin fetch may be blocked by source CORS. A local-download
      // fallback is always visible; no proxy or credential forwarding is used.
      const response=await fetch(bidmcUrl(selected),{credentials:'omit',mode:'cors',cache:'no-store'})
      if (!response.ok) throw Error('PhysioNet returned HTTP '+response.status)
      await loadBytes(await response.arrayBuffer(),{isOfficial:true})
    } catch (err) {
      setError('Direct download failed or was blocked by browser CORS: '+
        (err instanceof Error?err.message:'unknown error')+
        '. Download the original CSV from PhysioNet and choose it below.')
    } finally { setLoading(false) }
  }
  async function importLocal(event) {
    const file=event.target.files?.[0]
    event.target.value=''
    if (!file) return
    setLoading(true); setError(''); setRecording(null); setMetadata(null)
    try { await loadBytes(await file.arrayBuffer(),{filename:file.name}) }
    catch(err) { setError(err instanceof Error?err.message:'Could not read CSV.') }
    finally { setLoading(false) }
  }
  const sourceLabel=recording?.provenance==='PUBLIC_SHA256_VERIFIED'
    ? 'SHA-256 VERIFIED · PUBLIC PHYSIONET CSV'
    : 'LOCAL INPUT · UNVERIFIED'

  return <section id="resonance-observatory" className="section rob">
    <div className="section-label">BSR-3 · DOCUMENTED PUBLIC PHYSIOLOGICAL DATA</div>
    <h2>Resonance <em>Observatory</em></h2>
    <p className="rob-intro">Now we can investigate <strong>actual measurements</strong> rather than only synthetic analogies.
      BIDMC recordings include heart-rate and respiratory-rate trends obtained from patients during
      hospital care. This station studies monitor-reported <strong>rates at 1 Hz</strong>, not raw ECG,
      breathing phase or EEG. All statistics are descriptive and exploratory.</p>
    <div className="rob-layout">
      <div className="rob-source-console">
        <div className="rob-console-caption">VERIFIABLE OPEN DATA SOURCE</div>
        <label htmlFor="rob-record">PhysioNet public recording</label>
        <select id="rob-record" value={selected} disabled={loading} onChange={e=>setSelected(e.target.value)}>
          {BIDMC_RECORDS.map(item=><option key={item.id} value={item.id}>BIDMC record {item.id} · 1 Hz numerics</option>)}
        </select>
        <button type="button" onClick={loadOfficial} disabled={loading} className="rob-primary">
          {loading?'Checking original bytes…':'Load and verify public recording'}
        </button>
        <a href={bidmcUrl(selected)} target="_blank" rel="noreferrer" className="rob-link">
          Download original CSV (fallback) ↗
        </a>
        <label htmlFor="rob-file">Or inspect a local BIDMC-format numerics CSV</label>
        <input id="rob-file" type="file" accept=".csv,text/csv" onChange={importLocal} disabled={loading}/>
        <p className="rob-mini">SHA-256 is checked against PhysioNet's frozen manifest before any file is called verified. Unknown local files remain unverified. The browser does not upload their data.</p>
        {error && <p role="alert" className="rob-error">{error}</p>}
        {recording && <div className="rob-provenance">
          <strong>{sourceLabel}</strong>
          <span>{metadata.filename}</span>
          <code>SHA-256 {metadata.actualSha256}</code>
        </div>}
        <div className="rob-credit">
          <strong>Source and license</strong>
          <p>{BIDMC_SOURCE.title}, v{BIDMC_SOURCE.version},
            DOI <a href="https://doi.org/10.13026/C2208R" target="_blank" rel="noreferrer">{BIDMC_SOURCE.doi}</a>.
            {BIDMC_SOURCE.authorCredit}. Open Data Commons Attribution 1.0.</p>
          <a href={BIDMC_SOURCE.landing} target="_blank" rel="noreferrer">Full dataset, methods and license ↗</a>
          <a href={BIDMC_SOURCE.checksumManifest} target="_blank" rel="noreferrer">Original checksum manifest ↗</a>
        </div>
      </div>
      <div className="rob-results">
        {!recording ? <div className="rob-empty">
          <strong>Awaiting a recording</strong>
          <p>Choose an original public record and verify its bytes, or open the official CSV locally.
            No patient data are bundled, loaded automatically, or sent to an NBG server.</p>
          <p>This pilot uses 1 Hz monitor rate trends. It deliberately refuses to infer biological
            synchronization from curves that happen to look similar.</p>
        </div> : <>
          <TrendsPlot recording={recording}/>
          <div className="rob-metrics">
            <div><small>Heart vs breathing rate r</small><strong>{fmt(result.primary.r)}</strong></div>
            <div><small>First-difference rate r</small><strong>{fmt(result.changes.r)}</strong></div>
            <div><small>Paired coverage</small><strong>{(result.quality.coverage*100).toFixed(1)}%</strong></div>
            <div><small>Heart rate / breathing rate gaps</small><strong>{result.quality.missingHeartRate} / {result.quality.missingRespiratoryRate}</strong></div>
          </div>
          <div className="rob-checks">
            <div className="rob-check-header">
              <strong>{result.scientificStatus.replaceAll('_',' ')}</strong>
              <span>NO INFERENTIAL P-VALUES</span>
            </div>
            {result.refusal.length>0 && <p className="rob-refusal">Analysis quality gate: {result.refusal.join(', ')}</p>}
            <h3>Split-half stability</h3>
            <div className="rob-two">
              <span>First half r: <b>{fmt(result.halves[0].r)}</b></span>
              <span>Second half r: <b>{fmt(result.halves[1].r)}</b></span>
            </div>
            <h3>Frozen circular-shift diagnostics</h3>
            <div className="rob-shift-grid">
              {result.shifts.map(item=><div key={item.offsetSeconds}>
                <span>{item.offsetSeconds}s shift</span><strong>{fmt(item.r)}</strong>
              </div>)}
            </div>
            <p>These shifts preserve each rate series' local temporal order but disrupt alignment.
              Clinical rate trends can be nonstationary, so these are <em>diagnostics</em>, not a valid
              significance test. A high or low value cannot establish synchronization.</p>
            <h3>Exploratory lag view</h3>
            <div className="rob-lag-grid">
              {result.lags.map(item=><div key={item.lagSeconds}><span>{item.lagSeconds>0?'+':''}{item.lagSeconds}s</span><b>{fmt(item.r)}</b></div>)}
            </div>
          </div>
          <button className="rob-export" type="button" onClick={()=>exportReceipt(buildBSR3Receipt(recording,result,metadata))}>
            Export source-verified analysis receipt (no raw samples)
          </button>
        </>}
      </div>
    </div>
    <div className="rob-footer-grid">
      <article><span>01 / REAL DATA</span><h3>Integrity before interpretation</h3><p>Only a byte-for-byte match against a pinned official checksum earns the public-verified label. Filenames alone are not evidence.</p></article>
      <article><span>02 / NEGATIVE CONTROLS</span><h3>Missingness and shifted alignment</h3><p>Gaps are preserved. We compare original, rate-change, split-half, and rotated-time trends without manufacturing a p-value.</p></article>
      <article><span>03 / CLAIM FIREWALL</span><h3>Rates are not phases</h3><p>Neural rhythms are absent, and clinical context creates confounds. This is not an EEG, diagnostic tool, or consciousness demonstration.</p></article>
    </div>
    <p className="rob-warning">
      <strong>Evidence status:</strong> public-source descriptive analysis, not clinical or causal inference.
      Original recordings must be attributed according to their license.
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BSR3_RESONANCE_OBSERVATORY.md"> Frozen research protocol ↗</a>
    </p>
  </section>
}
