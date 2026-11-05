import {useMemo,useState} from 'react'
import {STATES,PROFILES,BD01_PROTOCOL,total,sites,runBD01} from './boundaryDiscovery.js'
import './boundaryDiscovery.css'

const fmt=n=>Number(n.toFixed(3)).toString()
const download=receipt=>{
 const blob=new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 a.href=url;a.download='NBG-BD01-boundary-discovery-v0.1.0.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function BoundaryDiscoveryLab(){
 const [state,setState]=useState(7),[budget,setBudget]=useState(3)
 const [profile,setProfile]=useState('ALL'),[horizon,setHorizon]=useState(1)
 const [shown,setShown]=useState(99)
 const receipt=useMemo(()=>runBD01({state,budget,profile,horizon}),[state,budget,profile,horizon])
 const trace=[{number:0,name:'Coarse Keyhole',response:receipt.initial.visibleTotal,
  candidatesAfter:receipt.initial.candidateCount,riskAfter:receipt.initial.bayesRisk,
  outcomeCounts:receipt.initial.outcomeCounts},...receipt.steps]
 const current=trace[Math.min(shown,trace.length-1)]
 return <section id="boundary-discovery" className="section bd01-section">
  <span className="section-label">NBG-BD01 · BOUNDARY DISCOVERY · SIMULATED / AUTHORITY NONE</span>
  <h2>Can an observer find<br/><em>the missing distinction?</em></h2>
  <p className="muted">A six-site deterministic ring hides different futures behind an identical sum.
   The planner selects authorized probes using expected prediction improvement per synthetic credit,
   then sees each probe response. It cannot inspect the oracle state while planning.</p>
  <div className="bd01-controls">
   <label>Hidden synthetic state
    <select value={state} onChange={e=>{setState(Number(e.target.value));setShown(99)}}>
     {STATES.map(s=><option key={s} value={s}>#{s.toString().padStart(2,'0')} · current sum {total(s)}</option>)}
    </select>
   </label>
   <label>Probe permissions
    <select value={profile} onChange={e=>{setProfile(e.target.value);setShown(99)}}>
     {Object.entries(PROFILES).map(([key,p])=><option value={key} key={key}>{p.name}</option>)}
    </select>
   </label>
   <label>Prediction horizon
    <select value={horizon} onChange={e=>{setHorizon(Number(e.target.value));setShown(99)}}>
     <option value={1}>One update</option><option value={2}>Two updates</option>
    </select>
   </label>
   <label>Budget: {budget} synthetic credits
    <input aria-label="Probe budget" type="range" min="0" max="8" step="1"
      value={budget} onChange={e=>{setBudget(Number(e.target.value));setShown(99)}}/>
   </label>
  </div>
  <div className="bd01-ring" role="img" aria-label={'Six site oracle signs: '+sites(state).join(', ')}>
   {sites(state).map((sign,i)=><div key={i} className={'bd01-site '+(sign>0?'positive':'negative')}>
    <small>{i+1}</small><strong>{sign>0?'+1':'−1'}</strong>
   </div>)}
  </div>
  <p className="muted bd01-note">Researcher-only ground truth above. The planner gets just the present sum and
   responses to its chosen probes, not these six internal signs.</p>
  <div className="bd01-kpis">
   <div><strong>{receipt.initial.candidateCount}</strong><span>Initially compatible states</span></div>
   <div><strong>{fmt(receipt.initial.bayesRisk)}</strong><span>Initial Bayes 0–1 risk</span></div>
   <div><strong>{fmt(receipt.final.bayesRisk)}</strong><span>Final Bayes 0–1 risk</span></div>
   <div><strong>{receipt.final.spent}</strong><span>Synthetic credits spent</span></div>
  </div>
  <div className="bd01-columns">
   <div className="bd01-panel">
    <h3>Observer's experiment sequence</h3>
    <div className="bd01-step-list">
     {trace.map((row,i)=><button type="button" key={i} className={current.number===row.number?'active':''}
      onClick={()=>setShown(i)} aria-pressed={current.number===row.number}>
      <span>{i===0?'0. Sum-only Keyhole':i+'. '+row.name}</span>
      <small>{row.candidatesAfter} possible states · risk {fmt(row.riskAfter)}
       {i>0?' · reading '+row.response:''}</small>
     </button>)}
    </div>
   </div>
   <div className="bd01-panel">
    <h3>Predicted outcomes at selected step</h3>
    <div className="bd01-bars">
     {current.outcomeCounts.map(row=><div key={row.outcome} className="bd01-bar-row">
      <span>{row.outcome>0?'+':''}{row.outcome}</span>
      <div><div style={{width:((row.count/current.candidatesAfter)*100)+'%'}}/></div>
      <strong>{row.count}/{current.candidatesAfter}</strong>
     </div>)}
    </div>
    <p>Result: <strong>{receipt.final.status.replaceAll('_',' ')}</strong>.</p>
    <p>Predicted future sum: <strong>{receipt.final.predictedOutcome??'REFUSED'}</strong>.
     Oracle future sum for verification: <strong>{receipt.oracle.actualFutureTotal}</strong>.</p>
    <p className="muted">{receipt.final.status==='GREEDY_STALLED'?
     'A useful combination may exist, but no single permitted probe has immediate positive gain. Greedy refusal is not an impossibility proof.':
     receipt.final.status==='UNOBSERVABLE_LIBRARY'?'The authorized probe library cannot distinguish all relevant outcomes for this remaining cohort.':
     receipt.final.status==='BUDGET_EXHAUSTED'?'A further authorized query requires more synthetic credits.':
     'The selected observations uniquely determine this specified future sum, not the full state or all later outcomes.'}</p>
   </div>
  </div>
  <p className="bd01-firewall">No real sensors, planetary forces, spiritual phenomena, or subjective awareness are tested.
   The transition rule and probe catalog are known to the synthetic planner; model mismatch,
   unseen dynamics, and independent holdout validation are reserved for later rungs.</p>
  <div className="bd01-actions">
   <button type="button" onClick={()=>download(receipt)}>Export BD-01 evidence JSON</button>
   <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BOUNDARY_DISCOVERY_BD01.md">Research protocol &amp; limitations ↗</a>
  </div>
  <small className="muted">Protocol {BD01_PROTOCOL.version} · Pure deterministic model · No authority</small>
 </section>
}
