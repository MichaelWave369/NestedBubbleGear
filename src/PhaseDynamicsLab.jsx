import {useMemo,useState} from 'react'
import {
  BSR4_PROTOCOL,BIDMC_WAVEFORMS,BSR4_DATASET,waveformFileUrl,
  parseSignalsCsv,parseBreathAnnotationsCsv,analyzePhaseDynamics,buildBSR4Receipt,
} from './phaseDynamicsModel.js'
import './phaseDynamicsLab.css'

const display=n=>n===null||!Number.isFinite(n)?'n/a':Number(n).toFixed(3)
const hex=bytes=>[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('')
async function sha256(buffer){
  if(!globalThis.crypto?.subtle)throw Error('WebCrypto requires a secure browser context.')
  return hex(await globalThis.crypto.subtle.digest('SHA-256',buffer))
}
function exportJSON(json){
  const url=URL.createObjectURL(new Blob([JSON.stringify(json,null,2)+'\n'],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='NBG_BSR4_phase_dynamics_receipt.json'
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)
}
function scaledPath(values,width=650,height=115){
  const selected=values.filter(v=>v!==null)
  if(!selected.length)return ''
  const low=Math.min(...selected),high=Math.max(...selected)
  const middle=(high+low)/2,range=Math.max((high-low)/2,1e-9)
  let path='',previous=false
  values.forEach((value,i)=>{
    if(value===null){previous=false;return}
    const x=34+i*width/(values.length-1), y=height-(value-middle)/range*46
    path+=(previous?'L':'M')+x.toFixed(2)+','+y.toFixed(2)+' '
    previous=true
  })
  return path
}
function Preview({wave,annotations,analysis}){
  const preview=useMemo(()=>{
    const seconds=8,n=seconds*125,start=0
    const ecg=wave.ecg.slice(start,n),resp=wave.resp.slice(start,n)
    const beats=analysis.candidateEvents.filter(i=>i>=start&&i<start+n)
    const breaths=annotations.a.filter(i=>i>=start&&i<start+n)
    return {ecg:scaledPath(ecg),resp:scaledPath(resp),beats,breaths,seconds}
  },[wave,annotations,analysis])
  return <div className="phd-preview">
    <div className="phd-caption">FIRST 8 SECONDS · ECG II CANDIDATES + MANUAL BREATH MARKS</div>
    <svg viewBox="0 0 720 275" role="img"
      aria-label="First eight seconds of recorded ECG and respiratory waveforms with provisional ECG candidates and annotated breaths">
      <rect width="720" height="275" fill="#07131a"/>
      <text x="32" y="24" fill="#ffc56f" fontSize="12">ECG lead II · unvalidated R-peak candidates</text>
      <path d={preview.ecg} fill="none" stroke="#ffc56f" strokeWidth="1.7"/>
      {preview.beats.map(i=><line key={i} x1={34+i/(preview.seconds*125-1)*650}
        x2={34+i/(preview.seconds*125-1)*650} y1="44" y2="155"
        stroke="#e4b0fc" strokeWidth=".9" strokeOpacity=".8"/>)}
      <text x="32" y="166" fill="#73ffc5" fontSize="12">Impedance respiration · annotator 1 breath marks</text>
      <g transform="translate(0 100)">
        <path d={preview.resp} fill="none" stroke="#73ffc5" strokeWidth="1.8"/>
        {preview.breaths.map(i=><line key={i} x1={34+i/(preview.seconds*125-1)*650}
          x2={34+i/(preview.seconds*125-1)*650} y1="44" y2="160"
          stroke="#8bc9ff" strokeWidth="1.4" strokeOpacity=".75"/>)}
      </g>
    </svg>
    <div className="phd-small">Traces are independently normalized for visibility. Markers show candidate events, not validated clinical beat detection.</div>
  </div>
}
function Result({analysis,record,verified,wave,annotations}){
  return <div className="phd-analysis">
    <Preview wave={wave} annotations={annotations} analysis={analysis}/>
    <div className="phd-stats">
      <div><span>Annotated breath count</span><strong>{analysis.input.breathAnnotations}</strong></div>
      <div><span>ECG candidate events</span><strong>{analysis.detector.candidateCount}</strong></div>
      <div><span>Phase concentration R · annotator 1</span><strong>{display(analysis.primary.strength)}</strong></div>
      <div><span>Phase concentration R · annotator 2</span><strong>{display(analysis.secondAnnotator.strength)}</strong></div>
    </div>
    <div className="phd-gate">
      <strong>{analysis.status.replaceAll('_',' ')}</strong>
      <span>Unvalidated detector · no hypothesis test</span>
      {analysis.refusal.length>0&&<p className="phd-error">{analysis.refusal.join(' · ')}</p>}
      <p>R ranges from 0 to 1 and measures concentration of detected ECG candidate phases within consecutive annotated breath cycles. It is not a finding of physiological coupling.</p>
      <p>Median annotator disagreement: {display(analysis.input.medianInterannotatorDifferenceSeconds)} s · ECG completeness: {(analysis.input.ecgCoverage*100).toFixed(1)}%</p>
      <h3>Split-half diagnostics</h3>
      <div className="phd-pairs"><span>First half: {display(analysis.splitHalf[0].strength)}</span><span>Second half: {display(analysis.splitHalf[1].strength)}</span></div>
      <h3>Preselected circular event-time shifts</h3>
      <div className="phd-shifts">{analysis.surrogates.map(s=><div key={s.offsetSeconds}>
        <small>+{s.offsetSeconds} s</small><b>{display(s.strength)}</b>
      </div>)}</div>
      <p>Time shifts are descriptive diagnostics only. They do not provide valid p-values for nonstationary recordings.</p>
    </div>
    <button className="phd-button phd-export" type="button" onClick={()=>exportJSON(buildBSR4Receipt(wave,annotations,analysis,{
      recordId:record.id,sourceUrls:[waveformFileUrl(record.id,'Signals'),waveformFileUrl(record.id,'Breaths')],
      verifiedByOfficialSha256:verified,
    }))}>Export event-phase summary receipt (no raw signals or event timestamps)</button>
  </div>
}
export default function PhaseDynamicsLab(){
  const [id,setId]=useState('01')
  const [wave,setWave]=useState(null),[annotations,setAnnotations]=useState(null)
  const [signalVerified,setSignalVerified]=useState(false),[breathVerified,setBreathVerified]=useState(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const record=BIDMC_WAVEFORMS.find(r=>r.id===id)
  const result=useMemo(()=>wave&&annotations?analyzePhaseDynamics(wave,annotations):null,[wave,annotations])
  const clear=()=>{setWave(null);setAnnotations(null);setSignalVerified(false);setBreathVerified(false);setError('')}
  const decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b)
  async function processBytes(fileType,bytes){
    const limit=fileType==='Signals'?4_500_000:40_000
    if(bytes.byteLength>limit)throw Error(fileType+' exceeds file size limit.')
    const digest=await sha256(bytes)
    const expected=fileType==='Signals'?record.signalsSha256:record.breathsSha256
    // Pairing an arbitrary waveform with somebody else's annotated breaths is invalid.
    if(digest!==expected)throw Error(fileType+' SHA-256 does not match the pinned BIDMC '+id+' file. Select the original matching CSV.')
    const text=decode(bytes)
    if(fileType==='Signals'){
      const parsed=parseSignalsCsv(text)
      parsed.sourceClass='PUBLIC_SHA256_VERIFIED'
      setWave(parsed);setSignalVerified(true)
    }else{
      // Annotations are validated against the expected full-length 125 Hz recording
      // and then checked against actual signal bounds after both files load.
      const parsed=parseBreathAnnotationsCsv(text,60_000)
      parsed.sourceClass='PUBLIC_SHA256_VERIFIED'
      setAnnotations(parsed);setBreathVerified(true)
    }
  }
  async function importOne(event,fileType){
    const file=event.target.files?.[0];event.target.value=''
    if(!file)return
    setBusy(true);setError('')
    try{
      const limit=fileType==='Signals'?4_500_000:40_000
      if(file.size>limit)throw Error('File exceeds the accepted size limit.')
      await processBytes(fileType,await file.arrayBuffer())
    }catch(e){setError(e instanceof Error?e.message:'Could not verify the file.')}
    finally{setBusy(false)}
  }
  async function fetchOne(fileType){
    setBusy(true);setError('')
    try{
      const response=await fetch(waveformFileUrl(id,fileType),{credentials:'omit',mode:'cors',cache:'no-store'})
      if(!response.ok)throw Error('HTTP '+response.status)
      const limit=fileType==='Signals'?4_500_000:40_000
      if(Number(response.headers.get('content-length')||0)>limit)throw Error('Unexpected source file size.')
      await processBytes(fileType,await response.arrayBuffer())
    }catch(e){
      setError('Direct PhysioNet fetch failed (possibly browser CORS): '+
        (e instanceof Error?e.message:'unknown')+'. Download the original CSV and import locally.')
    }finally{setBusy(false)}
  }
  return <section className="section phd" id="phase-dynamics">
    <div className="section-label">BSR-4 · PUBLIC WAVEFORM PHASE EXPERIMENT</div>
    <h2>Physiological <em>Phase Dynamics</em></h2>
    <p className="phd-intro">Explore real 125 Hz ECG and impedance-respiration waveforms with independently annotated breath events.
      We detect <em>candidate</em> ECG events, assign their position within human-annotated breathing cycles, and compare both annotators, recording halves, and frozen time shifts.
      This is exploratory research instrumentation, not a clinical heartbeat detector or proof of synchronization.</p>
    <div className="phd-layout">
      <div className="phd-source">
        <div className="phd-eyebrow">SOURCE / INTEGRITY CONSOLE</div>
        <label htmlFor="phd-record">PhysioNet BIDMC recording</label>
        <select id="phd-record" value={id} disabled={busy} onChange={e=>{setId(e.target.value);clear()}}>
          {BIDMC_WAVEFORMS.map(r=><option key={r.id} value={r.id}>BIDMC {r.id} · 125 Hz ECG + breathing</option>)}
        </select>
        {['Signals','Breaths'].map(type=><div className="phd-file" key={type}>
          <strong>{type==='Signals'?'1 / Raw waveform CSV':'2 / Two-annotator breaths CSV'}</strong>
          <div className="phd-file-actions">
            <button className="phd-button" type="button" disabled={busy} onClick={()=>fetchOne(type)}>
              Verify from PhysioNet
            </button>
            <a target="_blank" rel="noreferrer" href={waveformFileUrl(id,type)}>Download official CSV ↗</a>
          </div>
          <label className="phd-file-input">
            Load downloaded original locally
            <input type="file" accept=".csv,text/csv" disabled={busy} onChange={event=>importOne(event,type)}/>
          </label>
          <small>{type==='Signals'?(signalVerified?'Verified waveform loaded':'Awaiting SHA-256 verification'):(breathVerified?'Verified annotations loaded':'Awaiting SHA-256 verification')}</small>
        </div>)}
        {busy&&<p>Verifying the original source bytes…</p>}
        {error&&<p className="phd-error" role="alert">{error}</p>}
        <button type="button" className="phd-clear" onClick={clear} disabled={busy}>Clear loaded data</button>
        <div className="phd-license"><strong>Dataset provenance</strong>
          <p>{BSR4_DATASET.title} v{BSR4_DATASET.version}, <a target="_blank" rel="noreferrer"
            href="https://doi.org/10.13026/C2208R">DOI {BSR4_DATASET.doi}</a>.
            {BSR4_DATASET.authors}. {BSR4_DATASET.license}.</p>
          <a href={BSR4_DATASET.checksums} target="_blank" rel="noreferrer">Original SHA-256 manifest ↗</a>
        </div>
      </div>
      <div className="phd-main">
        {!result?<div className="phd-empty"><strong>Awaiting two matched verified files</strong>
          <p>Load the original Signals and Breaths files for the same recording.
          We refuse nonmatching files instead of inventing a pairing between different patients.</p>
          <p>Everything runs in your browser, with no recording upload, backend or bundled patient data.</p>
        </div>:<Result analysis={result} wave={wave} annotations={annotations} record={record}
          verified={signalVerified&&breathVerified}/>}
      </div>
    </div>
    <div className="phd-notes">
      <article><span>01 · ECG</span><h3>Unvalidated event detection</h3><p>Simple high-pass extrema can detect candidate beats, but may also detect noise or miss genuine QRS peaks. Quality gates can refuse.</p></article>
      <article><span>02 · BREATHS</span><h3>Independent human annotations</h3><p>Both annotators are preserved. Disagreement is measured and exposed, not silently averaged away.</p></article>
      <article><span>03 · INFERENCE</span><h3>No manufactured certainty</h3><p>Phase concentration and time-shift comparisons are exploratory. We do not compute significance or claim physiological coupling.</p></article>
    </div>
    <p className="phd-warning"><strong>Research boundary:</strong> BSR-4 is not a diagnostic ECG, brain-wave analysis, treatment protocol, or evidence that energy exits spacetime. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BSR4_PHASE_DYNAMICS.md">Frozen BSR-4 methods and failure gates ↗</a></p>
  </section>
}
