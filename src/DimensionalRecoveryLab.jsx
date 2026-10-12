import {useMemo,useState} from 'react'
import {
  G2_PROTOCOL,VERTICES,AXES,PROFILES,baselineMasks,enumeratePlans,
  recoveryTrace,signedCoordinates,buildG2Receipt
} from './dimensionalRecovery.js'
import './dimensionalRecovery.css'

const fmt=n=>Number(n.toFixed(2)).toString()
function downloadReceipt(settings){
 const blob=new Blob([JSON.stringify(buildG2Receipt(settings),null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 a.href=url;a.download='NBG-G2-dimensional-recovery-v0.1.0.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function DimensionalRecoveryLab(){
 const [depth,setDepth]=useState(3)
 const [profile,setProfile]=useState('HYBRID')
 const [task,setTask]=useState('FULL_STATE')
 const [budget,setBudget]=useState(3)
 const [state,setState]=useState(5)
 const [stageIndex,setStageIndex]=useState(99)
 const settings={depth,profile,task,budget,state}
 const plan=useMemo(()=>enumeratePlans(depth,profile,task,budget),[depth,profile,task,budget])
 const trace=useMemo(()=>recoveryTrace(state,depth,plan.selected.probes,task),[state,depth,plan,task])
 const index=Math.min(stageIndex,trace.length-1),stage=trace[index]
 const compatible=new Set(stage.compatible)
 const final=trace.at(-1)
 const statusLabel=plan.status==='RECOVERED'?'RECOVERED':plan.status==='BUDGET_INSUFFICIENT'
  ?'BUDGET REFUSAL':'OBSERVER REFUSAL'
 return <section id="dimensional-recovery" className="section g2-section">
  <span className="section-label">NBG-G2 · DIMENSIONAL RECOVERY · SIMULATED</span>
  <h2>What would it take<br/><em>to recover the hidden bit?</em></h2>
  <p className="muted">Choose a projection, observer library and synthetic probe budget.
    An exhaustive GF(2) solver finds the cheapest set of allowed measurements
    sufficient for your declared task. It refuses when the evidence cannot support recovery.</p>
  <div className="g2-controls">
   <label>Visible starting coordinates
    <select value={depth} onChange={e=>{setDepth(Number(e.target.value));setStageIndex(99)}}>
     {[0,1,2,3,4].map(d=><option key={d} value={d}>{d}D Keyhole · {d?AXES.slice(0,d).join(''): 'none'}</option>)}
    </select>
   </label>
   <label>Allowed observer
    <select value={profile} onChange={e=>{setProfile(e.target.value);setStageIndex(99)}}>
      {Object.entries(PROFILES).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}
    </select>
   </label>
   <label>Recovery task
    <select value={task} onChange={e=>{setTask(e.target.value);setStageIndex(99)}}>
      <option value="FULL_STATE">Reconstruct entire 4D state</option>
      <option value="HIDDEN_W">Determine W coordinate only</option>
    </select>
   </label>
   <label>Probe budget · {fmt(budget)} synthetic credits
    <input type="range" min="0" max="12" step=".25" value={budget}
      onChange={e=>{setBudget(Number(e.target.value));setStageIndex(99)}}/>
   </label>
  </div>
  <div className="g2-stats">
   <div><strong>{plan.baselineResidualBits}</strong><small>Unresolved task bits</small></div>
   <div><strong>{2**(4-plan.baselineRank)}</strong><small>Initially compatible states</small></div>
   <div><strong>{plan.optimal?fmt(plan.optimal.cost):'N/A'}</strong><small>Minimum recovery cost</small></div>
   <div><strong>{plan.enumeratedSubsets}</strong><small>Exhaustively checked plans</small></div>
  </div>
  <div className="g2-result">
   <div className="g2-result-head">
    <div>
     <span className="section-label">TASK VERDICT · SYNTHETIC COSTS</span>
     <h3>{statusLabel}</h3>
    </div>
    <strong>{fmt(plan.selected.cost)} / {fmt(budget)} credits used</strong>
   </div>
   <p>{plan.status==='RECOVERED'
    ?'The selected measurements uniquely resolve the declared task within budget.'
    :plan.status==='BUDGET_INSUFFICIENT'
    ?'The library contains a sufficient plan, but the selected budget cannot afford it. No missing information is invented.'
    :'The observer lacks the information to resolve the declared task, even with unlimited budget. No hidden state is guessed.'}</p>
   {plan.optimal&&<p>Cheapest sufficient plan: <strong>
     {plan.optimal.probes.length?plan.optimal.probes.map(x=>x.name).join(' + '):'no probes needed'}
    </strong> ({fmt(plan.optimal.cost)} credits).</p>}
   <p>Selected affordable probes: <strong>
    {plan.selected.probes.length?plan.selected.probes.map(x=>x.name).join(' + '):'none'}
    </strong>. Terminal task uncertainty: <strong>{plan.selected.residualBits} bit(s)</strong>.</p>
  </div>
  <div className="g2-workspace">
   <div>
    <h3>Pick one of the 16 four-coordinate states</h3>
    <p className="muted">Each tile is a vertex of the abstract 4D hypercube. The selected state's sign pattern is
     {signedCoordinates(state).map((v,i)=>' '+AXES[i]+(v>0?'+':'−')).join(',')}.</p>
    <div className="g2-vertices" aria-label="Choose the true synthetic state">
     {VERTICES.map(v=><button type="button" key={v} className={'g2-vertex'+(v===state?' chosen':'')+
       (compatible.has(v)?' compatible':'')} aria-pressed={v===state}
       onClick={()=>setState(v)} title={'State '+v+': '+signedCoordinates(v).join(', ')}>
       <strong>{v.toString(2).padStart(4,'0')}</strong>
       <small>{signedCoordinates(v).map(x=>x>0?'+':'−').join('')}</small>
      </button>)}
    </div>
    <p className="g2-explain">Outlined tiles remain compatible with the current observation. Highlighted
     tile is the hidden ground truth used only to simulate sensor responses, not given to the optimizer.</p>
   </div>
   <div className="g2-timeline">
    <h3>Replay observer refinement</h3>
    <div className="g2-steps">
     {trace.map((t,i)=><button key={i} type="button" aria-pressed={index===i}
       className={index===i?'active':''} onClick={()=>setStageIndex(i)}>
       <span>{i}. {t.step}</span>
       <strong>{t.compatible.length} state{t.compatible.length===1?'':'s'}</strong>
       <small>{t.residualBits} task bit(s) remaining{t.probe? ' · response '+t.response:''}</small>
      </button>)}
    </div>
    <p className="g2-explain">At the selected step, observer rank is <strong>{stage.rank}/4</strong>,
     and the current task is <strong>{stage.resolved?'resolved':'not resolved'}</strong>.
     Final candidate count: {final.compatible.length}.</p>
   </div>
  </div>
  <p className="g2-firewall">Scope: exact 16-state GF(2) model, uniform prior, perfect deterministic
   probes and **fictional query costs**. No measurement noise, continuous geometry, empirical
   spacetime, spiritual imprisonment, historical cause or independent physics validation is modeled.
   A task may resolve before the entire state is recoverable.</p>
  <div className="g2-actions">
   <button type="button" onClick={()=>downloadReceipt(settings)}>Export G2 ledger receipt</button>
   <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/DIMENSIONAL_RECOVERY.md">
    Read frozen protocol ↗
   </a>
  </div>
 </section>
}
