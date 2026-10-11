import {useMemo,useState} from 'react'
import {
  BSR5_PROTOCOL,REFERENCE_RECORDS,MITDB_SOURCE,mitdbFileUrl,
  parseMITDBHeader,decodeWFDB212,parseMITAnnotations,
  scoreMITDBBenchmark,buildBSR5Receipt,
} from './independentSignalValidation.js'
import './independentSignalValidation.css'

const LABELS={hea:'WFDB header (.hea)',dat:'Interleaved ECG samples (.dat)',atr:'Expert beat annotations (.atr)'}
const scoreText=v=>v===null||!Number.isFinite(v)?'n/a':(v*100).toFixed(1)+'%'
function exportReceipt(report) {
  const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download='NBG_BSR5_independent_validation.json'
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
async function digestSha256(data) {
  if(!globalThis.crypto?.subtle)throw Error('SHA-256 requires a secure browser context.')
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',data)
  return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('')
}
const display=v=>v===null||!Number.isFinite(v)?'n/a':v.toFixed(1)
function Metric({label,value}){
  return <div className="isv-metric"><small>{label}</small><strong>{value}</strong></div>
}
function Result({record,report,exportData}){
  const {wholeRecord:w,byFiveMinutes:chunks}=report
  return <div className="isv-result">
    <div className="isv-verdict">
      <strong>{report.status.replaceAll('_',' ')}</strong>
      <small>{record.id} · {record.partition} · reference-based benchmark · no clinical certification</small>
    </div>
    <div className="isv-metrics">
      <Metric label="Precision" value={scoreText(w.precision)}/>
      <Metric label="Recall / sensitivity" value={scoreText(w.recall)}/>
      <Metric label="F1" value={scoreText(w.f1)}/>
      <Metric label="Median timing error" value={display(w.medianAbsTimingErrorMs)+' ms'}/>
      <Metric label="True-positive matched beats" value={w.tp}/>
      <Metric label="False-positive detections" value={w.fp}/>
      <Metric label="Missed expert beats" value={w.fn}/>
      <Metric label="Expert annotated beats" value={report.referenceBeats}/>
    </div>
    {report.guardrails.length>0&&<p role="status" className="isv-refusal">
      Qualification flags: {report.guardrails.join(' · ')}
    </p>}
    <div className="isv-method-note">Fixed tolerance: ±150 ms; one detected event cannot count for two annotations.
      Metrics include all expert beat types and every detection; low-quality windows remain in the denominator.</div>
    <h3>Five-minute error audit</h3>
    <div className="isv-window-table-wrap"><table className="isv-window-table">
      <thead><tr><th>Interval</th><th>Precision</th><th>Recall</th><th>FP</th><th>FN</th><th>Artifact flags</th></tr></thead>
      <tbody>{chunks.map((chunk,i)=><tr key={i}>
        <td>{Math.floor(chunk.beginSeconds/60)}–{(chunk.endSeconds/60).toFixed(1)} min</td>
        <td>{scoreText(chunk.precision)}</td><td>{scoreText(chunk.recall)}</td>
        <td>{chunk.fp}</td><td>{chunk.fn}</td>
        <td>{chunk.flags.length?chunk.flags.join(', '):'none flagged'}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="isv-shift"><span>Deliberate +1 s event misalignment</span>
      <strong>Recall {scoreText(report.deliberateOneSecondShift.recall)}</strong>
      <p>Sanity check only. It cannot estimate the statistical significance of physiological synchronization.</p>
    </div>
    <button className="isv-button isv-export" type="button" onClick={()=>exportReceipt(exportData)}>
      Export frozen validation receipt · no samples or event timestamps
    </button>
  </div>
}

export default function IndependentSignalValidation(){
  const [recordId,setRecordId]=useState('100')
  const [verified,setVerified]=useState({})
  const [reports,setReports]=useState({})
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const record=REFERENCE_RECORDS.find(r=>r.id===recordId)
  const checks=['hea','dat','atr']
  const fullyVerified=checks.every(k=>verified[k]?.id===recordId)
  const report=reports[recordId]
  const canRun=fullyVerified&&!busy&&(recordId==='100'||Boolean(reports['100']))
  const complete=Boolean(reports['100']&&reports['101'])
  const shared=useMemo(()=>{
    if(!complete)return null
    const p=reports['100'].score,h=reports['101'].score
    return {
      pilot:p.wholeRecord,holdout:h.wholeRecord,
      status:p.status==='BENCHMARK_TARGET_MET_ONLY'&&h.status==='BENCHMARK_TARGET_MET_ONLY'
        ?'TWO_RECORD_ENGINEERING_TARGET_MET':'NOT_QUALIFIED',
    }
  },[reports,complete])
  function changeRecord(id) {
    setRecordId(id);setVerified({});setError('')
  }
  async function checkBytes(kind,buffer) {
    const size={hea:600,dat:2_000_000,atr:12_000}[kind]
    if(buffer.byteLength>size)throw Error(kind+' exceeds the frozen size bound.')
    const hash=await digestSha256(buffer)
    if(hash!==record.digests[kind])throw Error('Checksum mismatch for '+recordId+'.'+kind+'. File refused.')
    setVerified(current=>({...current,[kind]:{id:recordId,bytes:new Uint8Array(buffer),sha256:hash}}))
  }
  async function loadLocal(kind,event){
    const file=event.target.files?.[0];event.target.value=''
    if(!file)return
    setBusy(true);setError('')
    try{
      if(file.size>({hea:600,dat:2_000_000,atr:12_000}[kind]))throw Error('File exceeds '+kind+' size limit.')
      await checkBytes(kind,await file.arrayBuffer())
    }catch(e){setError(e instanceof Error?e.message:'Unable to load file.')}
    finally{setBusy(false)}
  }
  async function fetchOfficial(kind){
    setBusy(true);setError('')
    try{
      const response=await fetch(mitdbFileUrl(recordId,kind),{credentials:'omit',mode:'cors',cache:'no-store'})
      if(!response.ok)throw Error('PhysioNet returned HTTP '+response.status)
      const size={hea:600,dat:2_000_000,atr:12_000}[kind]
      if(Number(response.headers.get('content-length')||0)>size)throw Error('Unexpected source file length.')
      await checkBytes(kind,await response.arrayBuffer())
    }catch(e){setError('Browser download failed: '+(e instanceof Error?e.message:'unknown')+
      '. Download the original source file and import it locally instead.')}
    finally{setBusy(false)}
  }
  async function runBenchmark(){
    if(!canRun)return
    setBusy(true);setError('')
    // Give the progress state a paint opportunity before decoding 650,000 samples.
    await new Promise(resolve=>setTimeout(resolve,30))
    try{
      const header=new TextDecoder('utf-8',{fatal:true}).decode(verified.hea.bytes)
      const config=parseMITDBHeader(header,recordId)
      const signal=decodeWFDB212(verified.dat.bytes,config)
      const expert=parseMITAnnotations(verified.atr.bytes,config.sampleCount)
      const scored=scoreMITDBBenchmark({signal,reference:expert.events,sampleRate:config.sampleRate})
      const metadata={
        recordId,partition:record.partition,
        integrity:'ORIGINAL_SOURCE_SHA256_MATCH',
        expectedDigests:record.digests,originalSource:MITDB_SOURCE.url,
        lead:'MLII',reference:'Expert-reviewed MIT-BIH .atr',
        expertClassCounts:expert.byType,
        detector:'BSR-4 FROZEN CANDIDATE DETECTOR',
        noDetectorTuning:true,
      }
      const receipt=buildBSR5Receipt(scored,metadata)
      setReports(current=>({...current,[recordId]:{score:scored,receipt}}))
    }catch(e){setError(e instanceof Error?e.message:'Benchmark could not complete.')}
    finally{setBusy(false)}
  }
  return <section className="section isv" id="independent-validation">
    <div className="section-label">BSR-5 · INDEPENDENT REFERENCE SIGNAL VALIDATION</div>
    <h2>Make the detector <em>earn it.</em></h2>
    <p className="isv-intro">BSR-4 could see candidate heartbeat peaks but couldn't tell how many were real.
      This benchmark compares that frozen detector with independently expert-reviewed ECG beat annotations from the
      MIT-BIH Arrhythmia Database. It counts every matched, missed, and false detection at a preselected ±150 ms tolerance.
      <strong> A negative result is still a valid result.</strong></p>
    <div className="isv-layout">
      <div className="isv-source">
        <div className="isv-kicker">SOURCE / INTEGRITY / TRUTH LABELS</div>
        <label htmlFor="isv-record">Benchmark recording</label>
        <select id="isv-record" value={recordId} disabled={busy}
          onChange={e=>changeRecord(e.target.value)}>
          {REFERENCE_RECORDS.map(r=><option key={r.id} value={r.id}>
            MIT-BIH {r.id} · {r.partition==='PILOT'?'pilot':'frozen holdout'}
          </option>)}
        </select>
        <p>Original PhysioNet v1.0.0 files. The three SHA-256 digests must match for the selected record.
          Download the files and load them here if the browser blocks direct fetching.</p>
        {checks.map(kind=><div className="isv-file" key={kind}>
          <strong>{LABELS[kind]}</strong>
          <span>{verified[kind]?.id===recordId?'INTEGRITY VERIFIED':'NOT LOADED'}</span>
          <div className="isv-actions">
            <button type="button" disabled={busy} className="isv-button"
              onClick={()=>fetchOfficial(kind)}>Fetch original</button>
            <a href={mitdbFileUrl(recordId,kind)} target="_blank" rel="noreferrer">Download source ↗</a>
          </div>
          <label>Load original from disk
            <input type="file" accept={' .'+kind} disabled={busy} onChange={e=>loadLocal(kind,e)} />
          </label>
        </div>)}
        <button type="button" className="isv-button isv-run" disabled={!canRun} onClick={runBenchmark}>
          {busy?'Verifying / evaluating…':recordId==='101'&&!reports['100']
            ?'Pilot 100 must be scored first':'Run frozen 360 Hz benchmark'}
        </button>
        {error&&<p className="isv-error" role="alert">{error}</p>}
        <p className="isv-small">Files are held in browser memory and never uploaded to an NBG service. Switching record clears waveform bytes; numerical score receipts can remain in this page session.</p>
        <div className="isv-citation">
          <strong>Expert reference dataset</strong>
          <p>{MITDB_SOURCE.name} · v{MITDB_SOURCE.version} · DOI <a href="https://doi.org/10.13026/C2F305" target="_blank" rel="noreferrer">{MITDB_SOURCE.doi}</a>.</p>
          <p>{MITDB_SOURCE.credit}. License: {MITDB_SOURCE.license}.</p>
          <a href={MITDB_SOURCE.url} target="_blank" rel="noreferrer">Database and scientific references ↗</a>
          <a href={MITDB_SOURCE.checksumManifest} target="_blank" rel="noreferrer">Source SHA-256 manifest ↗</a>
        </div>
      </div>
      <div className="isv-main">
        {!report?<div className="isv-empty"><strong>{recordId==='100'?'Pilot benchmark awaiting source files':'Holdout benchmark awaiting source files'}</strong>
          <p>Load the original, verified .hea + .dat + .atr set, then evaluate the frozen BSR-4 detector. No metrics are invented or hard-coded.</p>
          <p>Record 101 remains reserved as a holdout: the detector, tolerance and target must not be changed in response to the pilot score.</p>
        </div>:<Result record={record} report={report.score} exportData={report.receipt}/>}
        <div className="isv-compare">
          <h3>Frozen evaluation ladder</h3>
          <div className="isv-compare-grid">
            {REFERENCE_RECORDS.map(r=><article key={r.id}>
              <span>{r.id} · {r.partition}</span>
              <strong>{reports[r.id]?scoreText(reports[r.id].score.wholeRecord.f1):'NOT RUN'}</strong>
              <small>{reports[r.id]?reports[r.id].score.status:'Awaiting independent source evidence'}</small>
            </article>)}
          </div>
          <p>Two-record verdict: <strong>{shared?shared.status:'INCOMPLETE'}</strong></p>
          <p>Even if both pass the engineering target, this would not certify the detector for clinical use or establish transfer to BIDMC.</p>
        </div>
      </div>
    </div>
    <div className="isv-notes">
      <article><span>01 · INDEPENDENCE</span><h3>External cardiologist consensus</h3><p>Reference times come from expert-reviewed MIT-BIH annotations, not from our own peak detector or synthetic model.</p></article>
      <article><span>02 · FALSE ALARMS</span><h3>Nothing is hidden</h3><p>False positives, missed beats, timing error and basic artifact flags are shown. Flagged sections remain in the scores.</p></article>
      <article><span>03 · HONEST SCOPE</span><h3>Two records aren't a clinic</h3><p>Generalization needs the remaining 46 records, signal-noise challenges, subject-aware partitions, independent adjudication and clinical expert review.</p></article>
    </div>
    <p className="isv-warning"><strong>Evidence gate:</strong> reference-matched beat-detection benchmarking only, not physiology resonance, treatment, diagnosis, or consciousness.
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BSR5_INDEPENDENT_VALIDATION.md"> Frozen study plan and qualifications ↗</a></p>
  </section>
}
