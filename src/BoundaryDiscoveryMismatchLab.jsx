import {useMemo,useState} from 'react'
import {ORACLES,POLICIES,runBD02,comparePolicies} from './boundaryDiscoveryMismatch.js'
import './boundaryDiscoveryMismatch.css'

const labels={
 RIGHT_PAIR:'Right neighbor product (known)',LEFT_PAIR:'Left neighbor product (known)',
 SHIFT_RIGHT:'Shift right (known)',TRIPLE_PRODUCT:'Three-site product (outside initial catalog)',
 MAJORITY_THREE:'Three-site majority (outside initial catalog)',
 ALL_NEGATIVE:'Always negative (outside registered grammar)'
}
function downloadReceipt(payload){
 const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 a.href=url;a.download='NBG-BD02-model-mismatch-holdout.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
const pct=x=>x===null?'N/A':(x*100).toFixed(0)+'%'
export default function BoundaryDiscoveryMismatchLab(){
 const [oracle,setOracle]=useState('TRIPLE_PRODUCT')
 const [policy,setPolicy]=useState('ADAPTIVE')
 const [budget,setBudget]=useState(3)
 const receipt=useMemo(()=>runBD02({oracle,policy,budget}),[oracle,policy,budget])
 const paired=useMemo(()=>comparePolicies({oracle,budget}),[oracle,budget])
 const decision=receipt.decision
 return <section className="section bd02-section" id="boundary-discovery-mismatch">
  <span className="section-label">NBG-BD02 · MODEL MISMATCH &amp; RECOVERY · SIMULATED / AUTHORITY NONE</span>
  <h2>What if the observer's<br/><em>model catalog is wrong?</em></h2>
  <p className="muted">Select a hidden synthetic transition rule. The observer sees only coarse next-step sums,
   chooses training inputs, and can reject its original model catalog. Predeclared alternative rules
   may then survive verification on an untouched sixteen-state holdout.</p>
  <div className="bd02-controls">
   <label>Researcher-only oracle rule
    <select value={oracle} onChange={e=>setOracle(e.target.value)}>
     {ORACLES.map(m=><option value={m} key={m}>{labels[m]}</option>)}
    </select>
   </label>
   <label>Experiment planner
    <select value={policy} onChange={e=>setPolicy(e.target.value)}>
     {POLICIES.map(p=><option value={p} key={p}>{p==='ADAPTIVE'?'Entropy / diversity':'Fixed train-state order'}</option>)}
    </select>
   </label>
   <label>Training probe budget: {budget}
    <input aria-label="Training budget" type="range" min="0" max="8" value={budget}
     onChange={e=>setBudget(Number(e.target.value))}/>
   </label>
  </div>
  <div className="bd02-kpis">
   <div><strong>{decision.status.replaceAll('_',' ')}</strong><small>Claim status</small></div>
   <div><strong>{receipt.queries.length}</strong><small>Training probes used</small></div>
   <div><strong>{decision.firstCatalogContradictionStep??'None'}</strong><small>First catalog contradiction</small></div>
   <div><strong>{pct(receipt.holdout.candidateScore?.exactAccuracy??null)}</strong><small>Untouched holdout accuracy</small></div>
  </div>
  <div className="bd02-columns">
   <div className="bd02-panel">
    <h3>Training diagnostics</h3>
    <p className="muted">The probe is selected before the oracle response is observed.</p>
    {receipt.queries.length?
     <ol className="bd02-queries">{receipt.queries.map(q=><li key={q.state}>
      <strong>State #{q.state}</strong> · next sum {q.response}
      <small>Expected discrimination: {q.plannedEntropy.toFixed(3)} bits</small>
      <small>Initial catalog: {q.catalogRemaining.join(', ')||'REJECTED'}</small>
      <small>Registered alternatives: {q.grammarRemaining.join(', ')||'NONE'}</small>
     </li>)}</ol>:
     <p>No training observations. The observer refuses to claim a model.</p>}
    <p><strong>Frozen predictive candidates:</strong> {decision.frozenModels.join(', ')||'none'}</p>
    <p className="muted">{decision.status==='TASK_EQUIVALENT_MODELS_UNIDENTIFIED'?
     'Different transition mechanisms produce exactly the same observed one-step sum for every six-site input. Predictions are identifiable; mechanism identity is not.':
     decision.status==='OUTSIDE_REGISTERED_GRAMMAR'?'No registered rule explains all training observations. No fallback model was invented.':
     decision.status==='RECOVERED_REGISTERED_CANDIDATE'?'The initial catalog was contradicted. A previously registered alternative survived training.':
     decision.status==='UNRESOLVED_MODEL_AMBIGUITY'?'Remaining models disagree on possible outputs, so model identity and predictions are refused.':
     'Only results justified by the current synthetic observations are displayed.'}</p>
   </div>
   <div className="bd02-panel">
    <h3>Holdout and conventional baselines</h3>
    {receipt.holdout.candidateScore?<div className="bd02-scores">
     <div><strong>Frozen candidate</strong><span>{pct(receipt.holdout.candidateScore.exactAccuracy)} · MAE {receipt.holdout.candidateScore.meanAbsoluteError.toFixed(2)}</span></div>
     <div><strong>Fixed right-pair</strong><span>{pct(receipt.holdout.baselines.fixedRightPair.exactAccuracy)} · MAE {receipt.holdout.baselines.fixedRightPair.meanAbsoluteError.toFixed(2)}</span></div>
     <div><strong>Training-only modal constant</strong><span>{pct(receipt.holdout.baselines.trainModeConstant.exactAccuracy)} · MAE {receipt.holdout.baselines.trainModeConstant.meanAbsoluteError.toFixed(2)}</span></div>
    </div>:<p>Holdout not scored. The evidence did not justify freezing a predictive candidate.</p>}
    <h4>Equal-budget planner comparison</h4>
    <div className="bd02-scores">
     <div><strong>Adaptive</strong><span>{paired.adaptive.decision.status.replaceAll('_',' ')} · {pct(paired.adaptive.holdout.candidateScore?.exactAccuracy??null)}</span></div>
     <div><strong>Fixed</strong><span>{paired.fixed.decision.status.replaceAll('_',' ')} · {pct(paired.fixed.holdout.candidateScore?.exactAccuracy??null)}</span></div>
    </div>
    <p className="muted">The fixed planner, a constant learned from training, and the fixed original rule are separate baselines.
      No performance advantage is assumed.</p>
   </div>
  </div>
  <p className="bd02-firewall">The five-rule recovery grammar is explicitly provided to the planning algorithm.
   Recovered means registered-model consistency, not discovery of an unknown physical law.
   No empirical physics, consciousness, planetary cosmology, or external network authority is implied.
   Holdout data cannot repair a failed training model.</p>
  <div className="bd02-actions">
   <button type="button" onClick={()=>downloadReceipt({selected:receipt,comparisons:paired})}>Export BD-02 evidence JSON</button>
   <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BOUNDARY_DISCOVERY_BD02.md">Read the protocol and limitations ↗</a>
  </div>
 </section>
}
