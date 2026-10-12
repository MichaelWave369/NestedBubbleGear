import {useMemo,useState} from 'react'
import {
  BC3_PROTOCOL,BC3_MODES,BC3_PUBLIC_ROOTS,
  makeBC3World,observeBC3,adjudicateBC3,analyzeBC3,buildBC3Receipt,
} from './boundaryCustody.js'
import './boundaryCustody.css'

const MODE_LABELS={
  NO_EVIDENCE:'No witness evidence',
  UNSIGNED_CLAIM:'Unsigned edit claim',
  SIGNED_SINGLE:'One correctly signed claim',
  DUPLICATED_SINGLE:'Repeated record from one signer',
  TAMPERED_SINGLE:'Changed claim, old signature',
  DUAL_HONEST:'Two honestly agreeing signers',
  DUAL_CONFLICT:'Signed conflicting edit claims',
  DUAL_COORDINATED_FALSE:'Two signers on the same false edit',
  UNKNOWN_ISSUER:'One unrecognized signer',
}
const bitString=n=>Number(n).toString(2).padStart(2,'0')
function exportReceipt(config){
  const body=JSON.stringify(buildBC3Receipt(config),null,2)+'\n'
  const url=URL.createObjectURL(new Blob([body],{type:'application/json'}))
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download='NBG-BC3-evidence-custody-v0.1.0.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
export default function BoundaryCustodyLab(){
  const [source,setSource]=useState(0)
  const [edit,setEdit]=useState(1)
  const [mode,setMode]=useState('DUAL_HONEST')
  const [reveal,setReveal]=useState(false)
  const config={source,edit,mode}
  const world=useMemo(()=>makeBC3World({source,edit}),[source,edit])
  const observation=useMemo(()=>observeBC3(world,mode),[world,mode])
  const result=useMemo(()=>adjudicateBC3(observation),[observation])
  const census=useMemo(()=>analyzeBC3(),[])
  const active=census.rows.find(row=>row.mode===mode)
  const falseAccepted=result.quorum&&result.admittedSource!==world.truth.source
  return <section id="boundary-custody" className="section bc3-section">
    <span className="section-label">NBG-BC3 · EVIDENCE CUSTODY VS TRUTH · SIMULATED</span>
    <h2>Two signed witnesses.<br/><em>Still not necessarily the truth.</em></h2>
    <p className="muted">BC2 exposed forged provenance. BC3 tests the distinction between a valid toy signature,
      distinct credential identities and a factually correct claim. The signing keys are tiny, public and deliberately
      insecure: this is a <strong>finite demonstration</strong>, not an authentication service or a biological model.</p>
    <div className="bc3-stats">
      <div><strong>{census.worlds}</strong><span>Source/edit worlds</span></div>
      <div><strong>{BC3_MODES.length}</strong><span>Witness conditions</span></div>
      <div><strong>{census.evaluations}</strong><span>Exact evaluations</span></div>
      <div><strong>{active.falseAccepted}</strong><span>False admissions in selected condition</span></div>
    </div>
    <div className="bc3-layout">
      <div className="bc3-panel">
        <h3>Construct the world</h3>
        <p className="muted">Only the payload and simulated signer records reach the observer. Source and edit
          controls are hidden from the adjudicator, but retained by an experimenter for scoring.</p>
        <div className="bc3-controls">
          <label htmlFor="bc3-source">Experimenter source
            <select id="bc3-source" value={source} onChange={e=>setSource(Number(e.target.value))}>
              {[0,1,2,3].map(v=><option value={v} key={v}>{bitString(v)}</option>)}
            </select>
          </label>
          <label htmlFor="bc3-edit">Experimenter edit
            <select id="bc3-edit" value={edit} onChange={e=>setEdit(Number(e.target.value))}>
              {[0,1,2,3].map(v=><option value={v} key={v}>{bitString(v)}</option>)}
            </select>
          </label>
          <label htmlFor="bc3-mode" className="bc3-wide">Observer witness condition
            <select id="bc3-mode" value={mode} onChange={e=>setMode(e.target.value)}>
              {BC3_MODES.map(key=><option value={key} key={key}>{MODE_LABELS[key]}</option>)}
            </select>
          </label>
        </div>
        <div className="bc3-payload"><span>RECEIVED PAYLOAD</span><strong>{bitString(observation.payload)}</strong></div>
        <div className="bc3-witness-list">
          {observation.records.length===0
            ? <p className="muted">No witness statements were provided.</p>
            : observation.records.map((row,i)=><div key={i} className="bc3-witness">
                <span>Record {i+1} · declared issuer {row.issuer}</span>
                <code>claim={bitString(row.claim)} · signature={row.signature===null?'ABSENT':row.signature}</code>
              </div>)
          }
        </div>
        <p className="bc3-note">Demo public credentials:
          A (n={BC3_PUBLIC_ROOTS.A.n}, e={BC3_PUBLIC_ROOTS.A.e});
          B (n={BC3_PUBLIC_ROOTS.B.n}, e={BC3_PUBLIC_ROOTS.B.e}).
          Hardcoded toy private keys are available in the source and **not secure**.</p>
      </div>
      <div className="bc3-panel">
        <h3>Custody admission gate</h3>
        <div className={'bc3-verdict'+(result.quorum?' admitted':' refused')} role="status" aria-live="polite">
          <strong>{result.status.replaceAll('_',' ')}</strong>
          <p>{result.quorum
            ? 'Two distinct model signer identities agree and pass toy equations. This admits a claim under policy, not an established fact.'
            : 'The observer refuses to admit a source based on the evidence and credential policy presented.'}</p>
        </div>
        <div className="bc3-metrics">
          <div><small>Distinct accepted credential roots</small><strong>{result.acceptedRoots} / 2</strong></div>
          <div><small>Copied records collapsed</small><strong>{result.duplicatesCollapsed}</strong></div>
          <div><small>Policy-admitted origin</small><strong>{result.admittedSource===null?'REFUSED':bitString(result.admittedSource)}</strong></div>
          <div><small>Compatible source claims</small><strong>{result.candidates.length}</strong></div>
        </div>
        <label className="bc3-check">
          <input type="checkbox" checked={reveal} onChange={e=>setReveal(e.target.checked)}/>
          Reveal experimenter-only truth and scoring
        </label>
        {reveal&&<div className={'bc3-truth'+(falseAccepted?' incorrect':'')}>
          <span>NOT SENT TO THE OBSERVER</span>
          <code>source={bitString(world.truth.source)} · edit={bitString(world.truth.edit)}</code>
          <strong>{result.quorum?(falseAccepted?'FALSE ATTRIBUTION':'CORRECT ATTRIBUTION'):'NOT ADMITTED'}</strong>
        </div>}
        <p className="bc3-note">A perfectly valid equation certifies only that a number matches an issued statement
          under this toy key. Neither signatures nor multiple issuers independently verify measurements.</p>
      </div>
    </div>
    <div className="bc3-table-wrap">
      <h3>Fixed outcome matrix</h3>
      <p className="bc3-note">Nine regimes, each evaluated exhaustively across 16 model worlds. False admission is explicitly counted, never hidden in the success column.</p>
      <table className="bc3-table">
        <thead><tr><th>Condition</th><th>Admitted</th><th>Correct</th><th>False admitted</th><th>Refused</th></tr></thead>
        <tbody>{census.rows.map(row=><tr key={row.mode} className={row.mode===mode?'selected':''}>
          <td>{MODE_LABELS[row.mode]}</td><td>{row.accepted}</td><td>{row.correct}</td>
          <td className={row.falseAccepted?'warn':undefined}>{row.falseAccepted}</td><td>{row.refused}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="bc3-firewall">Claim firewall: BC3 is a deterministic, finite educational model, not an evaluation
      of secure cryptographic protocols, genomic evidence, BC200 transfer, viral biology, or any new NBG physical law.
      Distinct credential labels do not guarantee independent measurements. Even a real valid signature authenticates
      an issuer's statement, not the statement's factual truth. Origin={BC3_PROTOCOL.origin};
      authority={BC3_PROTOCOL.authority}.</p>
    <div className="bc3-actions">
      <button type="button" onClick={()=>exportReceipt(config)}>Export BC3 SIMULATED receipt</button>
      <a href="#boundary-lineage">Review BC2 ↗</a>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/BC3/SPEC.md">Frozen BC3 protocol ↗</a>
      <a href="https://doi.org/10.1126/science.aeh3441" target="_blank" rel="noopener noreferrer">Scientific motivation ↗</a>
    </div>
  </section>
}
