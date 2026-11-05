import {useMemo,useState} from 'react'
import {BD03_PROTOCOL,ORACLES,TASKS,SPLITS,runBD03,compareBD03} from './boundaryRuleSynthesis.js'
import './boundaryRuleSynthesis.css'

const oracleLabels={
 RIGHT_PAIR:'Neighbor product: right',
 LEFT_PAIR:'Neighbor product: left',
 SHIFT_RIGHT:'Shift-right neighborhood',
 TRIPLE_PRODUCT:'Three-neighbor product',
 MAJORITY_THREE:'Three-neighbor majority',
 ALL_NEGATIVE:'Always negative',
 GLOBAL_PARITY:'Global six-site parity (nonlocal)',
 POSITIONAL_FLIP:'Position-specific flip (inhomogeneous)'
}
const statusText=value=>value.replaceAll('_',' ')
const fmtScore=s=>s?(s.accuracy*100).toFixed(0)+'% · MAE '+s.meanAbsoluteError.toFixed(2):'Not scored'
function exportJSON(content){
 const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 a.href=url;a.download='NBG-BD03-compositional-synthesis.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function BoundaryRuleSynthesisLab(){
 const [oracle,setOracle]=useState('TRIPLE_PRODUCT')
 const [task,setTask]=useState('SUM')
 const [split,setSplit]=useState('INTERLEAVED')
 const [policy,setPolicy]=useState('ENTROPY')
 const [budget,setBudget]=useState(9)
 const [maxCost,setMaxCost]=useState(5)
 const settings={oracle,task,split,policy,budget,maxCost}
 const result=useMemo(()=>runBD03(settings),[oracle,task,split,policy,budget,maxCost])
 const comparison=useMemo(()=>compareBD03({oracle,task,split,budget,maxCost}),
  [oracle,task,split,budget,maxCost])
 return <section className="section bd03-section" id="boundary-rule-synthesis">
  <span className="section-label">NBG-BD03 · RULE SYNTHESIS · SIMULATED / AUTHORITY NONE</span>
  <h2>Can a machine assemble<br/><em>an explanation from primitives?</em></h2>
  <p className="muted">Candidate transition rules are composed from local left/center/right inputs
   and NOT, MUL, and MAJ operations. Probe choices use training predictions only.
   The selected shortest compatible expression is frozen before held-out scoring.</p>
  <div className="bd03-controls">
   <label>Hidden oracle (researcher only)
    <select value={oracle} onChange={e=>setOracle(e.target.value)}>
     {ORACLES.map(m=><option key={m} value={m}>{oracleLabels[m]}</option>)}
    </select>
   </label>
   <label>Observer Keyhole
    <select value={task} onChange={e=>setTask(e.target.value)}>
     {TASKS.map(m=><option key={m} value={m}>{m==='SUM'?'Total next-step sum':'One anchored next-step site'}</option>)}
    </select>
   </label>
   <label>Reserved evaluation split
    <select value={split} onChange={e=>setSplit(e.target.value)}>
     {SPLITS.map(m=><option key={m} value={m}>{m==='INTERLEAVED'?'Interleaved (48 train / 16 holdout)':'Parity shift (32 / 32 OOD)'}</option>)}
    </select>
   </label>
   <label>Planning policy
    <select value={policy} onChange={e=>setPolicy(e.target.value)}>
     <option value="ENTROPY">Prediction entropy + novelty</option>
     <option value="FIXED">Fixed increasing state IDs</option>
    </select>
   </label>
   <label>Maximum expression nodes: {maxCost}
    <input aria-label="Maximum expression complexity" type="range" min="1" max="6" step="1"
     value={maxCost} onChange={e=>setMaxCost(Number(e.target.value))}/>
   </label>
   <label>Training queries: {budget}
    <input aria-label="Training query budget" type="range" min="0" max="48" step="1"
     value={budget} onChange={e=>setBudget(Number(e.target.value))}/>
   </label>
  </div>
  <div className="bd03-stats">
   <div><strong>{result.grammar.uniqueTruthTables}</strong><small>Generated local truth tables</small></div>
   <div><strong>{result.observations.length}</strong><small>Training queries used</small></div>
   <div><strong>{result.decision.trainingConsistentRules}</strong><small>Rules consistent with training</small></div>
   <div><strong>{fmtScore(result.holdout.scores?.synthesized)}</strong><small>Untouched holdout result</small></div>
  </div>
  <div className="bd03-grid">
   <div className="bd03-panel">
    <h3>Frozen synthesis decision</h3>
    <p><strong>{statusText(result.decision.status)}</strong></p>
    {result.decision.frozenRule?
     <div className="bd03-rule"><small>Shortest training-consistent expression</small>
      <code>{result.decision.frozenRule.expr}</code>
      <span>Operator-tree node cost: {result.decision.frozenRule.cost}</span>
     </div>:
     <p className="muted">No predictive rule frozen. Results from the reserved set remain unscored.</p>}
    <p>Distinct observable behaviors remaining: <strong>{result.decision.distinctTaskPredictionClasses}</strong></p>
    <p className="muted">{result.decision.status==='PROVISIONAL_MDL'?
      'Multiple survivors still disagree on possible observations. This is a provisional shortest-rule choice, not identification.':
      result.decision.status==='GRAMMAR_REJECTED'?
      'No expression within the declared grammar explains the training readings. The system refuses to invent one.':
      result.decision.status==='TASK_PREDICTION_IDENTIFIED_WITHIN_GRAMMAR'?
      'Remaining expressions agree on all 64 outputs for this Keyhole. They do not necessarily identify the generating mechanism.':
      'Training data are not sufficient to freeze a model.'}</p>
    <h4>Training trace</h4>
    <div className="bd03-trace">
     {result.observations.length?result.observations.map(q=><div key={q.step}>
      <strong>#{q.step} · input {q.state}</strong>
      <span>Reading {q.response} · {q.remainingRules} compatible rules</span>
      <small>Expected entropy {q.plannedEntropy.toFixed(3)} bits</small>
     </div>):<p>No training queries issued.</p>}
    </div>
   </div>
   <div className="bd03-panel">
    <h3>Blind holdout audit</h3>
    <p><strong>{statusText(result.holdout.assessment||result.holdout.status)}</strong></p>
    {result.holdout.scores?<div className="bd03-scores">
     <div><span>Composed candidate</span><strong>{fmtScore(result.holdout.scores.synthesized)}</strong></div>
     <div><span>Fixed neighbor rule</span><strong>{fmtScore(result.holdout.scores.fixedRightPair)}</strong></div>
     <div><span>No-change observable</span><strong>{fmtScore(result.holdout.scores.currentObservable)}</strong></div>
     <div><span>Training modal constant</span><strong>{fmtScore(result.holdout.scores.trainConstant)}</strong></div>
    </div>:<p className="muted">No scored holdout for a rejected or untrained model.</p>}
    <h4>Equal-budget policy comparison</h4>
    <div className="bd03-scores">
     <div><span>Entropy + novelty</span><strong>{fmtScore(comparison.adaptive.holdout.scores?.synthesized)}</strong></div>
     <div><span>Fixed input order</span><strong>{fmtScore(comparison.fixed.holdout.scores?.synthesized)}</strong></div>
    </div>
    <p className="muted">The parity-shift fixture intentionally tests transfer to a different input family.
     A perfect fit on training may fail every held-out case. No post-holdout repair is permitted.</p>
   </div>
  </div>
  <p className="bd03-firewall">Synthesis searches a predeclared finite mathematical grammar. It does not
   establish independent scientific discovery, physical dimensions, religious symbolism, consciousness,
   or a novel law of nature. High held-out accuracy is only a result for these finite fixtures.
   Mechanism identity is never claimed from one coarse observable.</p>
  <div className="bd03-actions">
   <button type="button" onClick={()=>exportJSON({selected:result,policies:comparison})}>Export BD-03 evidence JSON</button>
   <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BOUNDARY_DISCOVERY_BD03.md">
    Read reproducibility protocol ↗
   </a>
  </div>
  <small className="muted">Protocol {BD03_PROTOCOL.version} · Synthetic and offline · No authority</small>
 </section>
}
