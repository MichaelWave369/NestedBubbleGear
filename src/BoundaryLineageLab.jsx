import {useMemo,useState} from 'react'
import {
  BC2_PROTOCOL, BC2_MODES, analyzeBC2, makeBC2World, makeBC2Observation,
  inferBC2, buildBC2Receipt,
} from './boundaryLineageRecovery.js'
import './boundaryLineage.css'

const MODE_NAMES = {
  RECIPIENT_ONLY: 'No provenance witness',
  PARITY_WITNESS: 'Partial one-bit edit witness',
  DUPLICATE_PARITY: 'Same partial witness, duplicated',
  FULL_WITNESS: 'Full edit witness',
  FULL_CROSSCHECK: 'Full witness + matching shadow',
  FORGED_UNCHECKED: 'False full witness (unchecked)',
  FORGED_CONFLICT: 'False full witness + honest shadow',
  COORDINATED_FORGERY: 'Two mutually consistent false witnesses',
}
const binary = number => Number(number).toString(2).padStart(2,'0')
const witnessLabel = record =>
  record ? record.kind + ' · value ' + record.value + ' · declared ' + record.lineage : 'Not observed'
function downloadBC2Receipt(config) {
  const receipt = buildBC2Receipt(config)
  const url = URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}))
  const a = document.createElement('a')
  a.href = url
  a.download = 'NBG-BC2-blind-lineage-v0.1.0.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function BoundaryLineageLab() {
  const [source,setSource] = useState(0)
  const [edit,setEdit] = useState(1)
  const [mode,setMode] = useState('RECIPIENT_ONLY')
  const [showTruth,setShowTruth] = useState(false)
  const config = {source, edit, mode}
  const world = useMemo(() => makeBC2World({source,edit}),[source,edit])
  const view = useMemo(() => makeBC2Observation(world,mode),[world,mode])
  const inference = useMemo(() => inferBC2(view),[view])
  const census = useMemo(() => analyzeBC2(),[])
  const chosen = census.modes.find(row => row.mode === mode)
  const candidates = new Set(inference.candidateSources)
  const isWrong = inference.status === 'RECOVERED_UNIQUE' &&
    inference.recoveredSource !== world.truth.source
  const warning = inference.status !== 'RECOVERED_UNIQUE' || isWrong
  return <section id="boundary-lineage" className="section bc2-section">
    <span className="section-label">NBG-BC2 · BLIND LINEAGE RECOVERY · SIMULATED / FORMAL</span>
    <h2>Same destination.<br/><em>Can you recover the missing origin?</em></h2>
    <p className="muted bc2-hero">BC1 showed hidden histories. BC2 removes the answer from the observer's input.
      Compare partial witnesses, duplicated evidence, honest full records and forged records. A correct observer
      must sometimes refuse to attribute source. All symbols are invented two-bit integers, not DNA.</p>

    <div className="bc2-kpis" aria-label="BC2 exhaustive model census">
      <div><strong>{census.worlds}</strong><span>Source/edit worlds</span></div>
      <div><strong>{BC2_MODES.length}</strong><span>Evidence regimes</span></div>
      <div><strong>{census.worlds * BC2_MODES.length}</strong><span>Exact evaluations</span></div>
      <div><strong>{chosen.falseUnique}/{census.worlds}</strong><span>Incorrect unique claims in chosen regime</span></div>
    </div>

    <div className="bc2-layout">
      <div className="bc2-panel">
        <h3>Experimenter controls</h3>
        <p className="bc2-note">The scorer defines the hidden source and edit mask. The inference engine receives only
          the recipient payload and chosen witness records. It cannot read either hidden control.</p>
        <div className="bc2-controls">
          <label htmlFor="bc2-source">Hidden source (2 bits)
            <select id="bc2-source" value={source} onChange={e => setSource(Number(e.target.value))}>
              {[0,1,2,3].map(n=><option key={n} value={n}>{binary(n)}</option>)}
            </select>
          </label>
          <label htmlFor="bc2-edit">Hidden edit mask (2 bits)
            <select id="bc2-edit" value={edit} onChange={e => setEdit(Number(e.target.value))}>
              {[0,1,2,3].map(n=><option key={n} value={n}>{binary(n)}</option>)}
            </select>
          </label>
          <label htmlFor="bc2-mode" className="wide">Observer evidence scenario
            <select id="bc2-mode" value={mode} onChange={e=>setMode(e.target.value)}>
              {BC2_MODES.map(value=><option key={value} value={value}>{MODE_NAMES[value]}</option>)}
            </select>
          </label>
        </div>
        <div className="bc2-bits" aria-label="Visible destination and witness channels">
          <div><small>RECEIVED PAYLOAD</small><strong>{binary(view.payload)}</strong></div>
          <span aria-hidden="true">→</span>
          <div><small>PROVENANCE CHANNELS</small><strong>{[view.witness,view.shadow].filter(Boolean).length}</strong></div>
        </div>
        <div className="bc2-witness"><span>TRACE A · edit witness</span><code>{witnessLabel(view.witness)}</code></div>
        <div className="bc2-witness"><span>TRACE B · nominal shadow record</span><code>{witnessLabel(view.shadow)}</code></div>
        <div className="bc2-witness"><span>Duplicate from TRACE A</span><code>{witnessLabel(view.duplicate)}</code></div>
        <p className="bc2-note">Lineage labels identify modeled record origins. They are not authenticated signatures
          or proof that two records are genuinely independent.</p>
      </div>

      <div className="bc2-panel">
        <h3>Blind observer verdict</h3>
        <div className={'bc2-status'+(warning?' warning':'')} role="status" aria-live="polite">
          <strong>{inference.status.replaceAll('_',' ')}</strong>
          <p>{inference.status === 'REFUSE_CONFLICT'
            ? 'The supplied records contradict one another. No valid attribution is issued.'
            : inference.status === 'REFUSE_AMBIGUOUS'
            ? 'More than one source explains this observation. The observer abstains.'
            : 'A unique source is compatible with the supplied records. Uniqueness does not authenticate them.'}</p>
        </div>
        <p className="bc2-note">Compatible sources: <strong>{inference.candidateSources.length}</strong>.
          Residual ambiguity: <strong>{inference.residualBits === null ? 'undefined' : inference.residualBits+' bits'}</strong>.
          Same-lineage duplicate collapsed: <strong>{inference.duplicateCollapsed?'yes':'not present'}</strong>.</p>
        <div className="bc2-candidates" aria-label="Four candidate source lineages">
          {[0,1,2,3].map(n => <div key={n} className={'bc2-candidate '+
            (inference.status === 'REFUSE_CONFLICT'?'contradiction':candidates.has(n)?'possible':'excluded')}>
            <strong>{binary(n)}</strong>
            <small>{inference.status === 'REFUSE_CONFLICT'?'CONFLICT':candidates.has(n)?'POSSIBLE':'EXCLUDED'}</small>
          </div>)}
        </div>
        <p>Blind attribution: <strong>{inference.recoveredSource === null ? 'REFUSED' : binary(inference.recoveredSource)}</strong></p>
        <label className="bc2-note">
          <input type="checkbox" checked={showTruth} onChange={e=>setShowTruth(e.target.checked)} /> Reveal experimenter-only scoring truth
        </label>
        {showTruth && <div className="bc2-witness">
          <span>Not part of observer input</span>
          <code>source={binary(world.truth.source)} · edit={binary(world.truth.edit)} · {inference.recoveredSource===null?'not scored: abstained':isWrong?'INCORRECT ATTRIBUTION':'CORRECT ATTRIBUTION'}</code>
        </div>}
        <p className="bc2-note">This deliberately does not certify the authenticity of a witness.
          In the coordinated-forgery control, matching records still produce a wrong unique source.</p>
      </div>
    </div>

    <div className="bc2-census">
      <h3>Exhaustive controls · 16 worlds per evidence mode</h3>
      <p className="bc2-note">Counts are mathematical outputs of the frozen XOR rules, not external measurements.</p>
      <table className="bc2-table">
        <thead><tr><th>Scenario</th><th>Unique</th><th>Refuse</th><th>Wrong unique</th><th>Residual bits</th></tr></thead>
        <tbody>{census.modes.map(row=><tr key={row.mode} className={row.mode===mode?'selected':''}>
          <td>{MODE_NAMES[row.mode]}</td><td>{row.unique}</td>
          <td>{row.ambiguous+row.conflicted}</td>
          <td className={row.falseUnique>0?'bad':undefined}>{row.falseUnique}</td>
          <td>{row.residualBits===null?'undefined':row.residualBits.toFixed(0)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="bc2-wall">Evidence wall: BC2 contains no biological sequences, actual transfer observations or fitted predictive
      performance. Its unique-source recoveries follow from synthetic witness definitions. A consistent statement
      is not necessarily an authentic one. This experiment does not establish an NBG mechanism in genetic evolution,
      pathogen behavior, consciousness or gene therapies. Origin: {BC2_PROTOCOL.origin}. Authority: {BC2_PROTOCOL.authority}.</p>
    <div className="bc2-actions">
      <button type="button" onClick={()=>downloadBC2Receipt(config)}>Export BC2 SIMULATED receipt</button>
      <a href="#boundary-crossing">Explore BC1 ↗</a>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/BC2/SPEC.md">BC2 protocol &amp; falsifiers ↗</a>
      <a href="https://doi.org/10.1126/science.aeh3441" target="_blank" rel="noopener noreferrer">Scientific motivation ↗</a>
    </div>
  </section>
}
