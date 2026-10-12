import {useMemo,useState} from 'react'
import {
  BR3_PLAN,BR3_PROTOCOL,BR3_INTEGRATION_COUNT,BR3_OUTCOME_COUNT,
  runBR3Panel,simulateBR3Scenario,buildBR3Receipt
} from './recoveryRobustnessModel.js'
import './recoveryRobustnessLab.css'

const views=[
  ['horizon','Horizon rescue'],
  ['site','Kick-site sensitivity'],
  ['threshold','Threshold sensitivity'],
  ['precision','Step-size sensitivity'],
  ['keyhole','Hidden Keyhole mismatch'],
]
const fmt=(n,d=3)=>n===null||!Number.isFinite(n)?'not observed':n.toFixed(d)
function category(c,view){
  if(view==='horizon')return c.horizonRescue>0?'flag':'clear'
  if(view==='site')return c.kickSiteVariation?'flag':'clear'
  if(view==='threshold')return c.thresholdSensitive?'flag':'clear'
  if(view==='precision')return c.dtFlip?'flag':c.dtDifference!==null&&c.dtDifference>.08?'caution':'clear'
  return c.coarseHighWithoutRecovery?'flag':'clear'
}
function explanation(view){
  return {
    horizon:'At 38 s, this case is censored for at least one kick site but recovered by 120 s (threshold 0.06, dt 0.04).',
    site:'Changing the disturbed oscillator changes recovered/censored status at 38 s (threshold 0.06, dt 0.04).',
    threshold:'Changing only the recovery threshold changes recovered/censored status at 38 s, with a B kick (dt 0.04).',
    precision:'Numerical step changes recovered/censored status, or materially changes the recovery time (>0.08 s). Both use a 38 s B-kick run.',
    keyhole:'The undisturbed velocities correlate ≥0.95, yet B-kick full-state recovery was not observed by 38 s (dt 0.04, threshold 0.06).',
  }[view]
}
function exportJSON(panel){
  const data=JSON.stringify(buildBR3Receipt(panel),null,2)+'\n'
  const href=URL.createObjectURL(new Blob([data],{type:'application/json'}))
  const a=document.createElement('a')
  a.href=href;a.download=`NBG_BR3_damping_${panel.byBase[0].damping}.json`
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(href)
}
function ResidueView({scenario}){
  const values=scenario.trace
  const max=Math.max(.1,...values.map(x=>x.residue??0))
  const w=665,h=175
  const coords=values.map(p=>`${(44+p.time/120*w).toFixed(2)},${(238-(p.residue/max)*h).toFixed(2)}`).join(' ')
  return <div className="br3-trace">
    <svg viewBox="0 0 760 270" role="img" aria-label="Full-state distance from reference over 120 simulated seconds">
      <rect width="760" height="270" rx="10" fill="#081619"/>
      {[0,.5,1].map((f)=><g key={f}><line x1="44" x2="709" y1={63+175*f} y2={63+175*f} stroke="#42655d" strokeWidth=".7"/>
      <text x="5" y={67+175*f} fill="#bdd7c9" fontSize="11">{fmt(max*(1-f),2)}</text></g>)}
      <polyline points={coords} fill="none" stroke="#ffca83" strokeWidth="2"/>
      <line x1="44" x2="709" y1={238-(.06/max)*h} y2={238-(.06/max)*h} stroke="#73ffc5" strokeDasharray="5 4"/>
      <line x1={44+10/120*w} x2={44+10/120*w} y1="50" y2="238" stroke="#e3b5ed" strokeDasharray="3 4"/>
      <text x="45" y="261" fill="#bdd7c9" fontSize="11">0 seconds</text>
      <text x="646" y="261" fill="#bdd7c9" fontSize="11">120 seconds</text>
      <text x="44" y="27" fill="#e4f4f0" fontSize="12">FULL-STATE RESIDUE · 120 s horizon · SYNTHETIC</text>
    </svg>
  </div>
}
export default function RecoveryRobustnessLab(){
  const [damping,setDamping]=useState(.22)
  const [view,setView]=useState('horizon')
  const [selection,setSelection]=useState('0.85|0')
  const [target,setTarget]=useState('B')
  const [threshold,setThreshold]=useState(.06)
  const [timeStep,setTimeStep]=useState(.04)
  const panel=useMemo(()=>runBR3Panel({damping}),[damping])
  const selected=panel.byBase.find(c=>`${c.coupling}|${c.asymmetry}`===selection)||panel.byBase[0]
  const compare=BR3_PLAN.horizons.map(horizon=>{
    const r=panel.runs.find(r=>r.damping===selected.damping&&r.coupling===selected.coupling&&
      r.asymmetry===selected.asymmetry&&r.target===target&&r.timeStep===timeStep&&r.horizon===horizon)
    return {...r,...r.outcomes.find(o=>o.threshold===threshold)}
  })
  const chart=useMemo(()=>simulateBR3Scenario({
    coupling:selected.coupling,asymmetry:selected.asymmetry,damping,
    horizon:120,target,timeStep,includeTrace:true,
  }),[selected.coupling,selected.asymmetry,damping,target,timeStep])
  const flagged=panel.byBase.filter(c=>category(c,view)!=='clear').length
  return <section className="section br3-lab" id="recovery-robustness">
    <div className="section-label">NBG-BR3 · SYNTHETIC ROBUSTNESS / SENSITIVITY PROTOCOL</div>
    <h2>Recovery <em>Boundaries</em></h2>
    <p className="br3-intro">Challenge BR2's conclusions by changing the measuring rule, the horizon, where the kick lands, and the integration step. This deliberately finite stress panel does not assume that a 38-second nonrecovery outcome is permanent. The model remains the same linear oscillator construction, not measured natural gears.</p>
    <div className="br3-stats">
      <div><small>Preselected parameter combinations</small><strong>27</strong></div>
      <div><small>Deterministic integrations</small><strong>{BR3_INTEGRATION_COUNT}</strong></div>
      <div><small>Threshold evaluations</small><strong>{BR3_OUTCOME_COUNT}</strong></div>
      <div><small>Cases flagged in this slice</small><strong>{flagged} / 9</strong></div>
    </div>
    <div className="br3-workspace">
      <div className="br3-main">
        <div className="br3-filters">
          <label>Damping <select value={damping} onChange={e=>setDamping(+e.target.value)}>
            {BR3_PLAN.damping.map(v=><option key={v} value={v}>{v}</option>)}
          </select></label>
          <label>Atlas diagnostic <select value={view} onChange={e=>setView(e.target.value)}>
            {views.map(([v,label])=><option value={v} key={v}>{label}</option>)}
          </select></label>
        </div>
        <p className="br3-small">{explanation(view)}</p>
        <p className="br3-axis">Rows: coupling k · Columns: directional asymmetry a</p>
        <div className="br3-grid" role="group" aria-label="Nine synthetic cases in the selected damping slice">
          <div className="br3-grid-head"><span>k / a</span>{BR3_PLAN.asymmetry.map(a=><span key={a}>{a}</span>)}</div>
          {BR3_PLAN.coupling.map(k=><div className="br3-grid-row" key={k}>
            <span className="br3-row-label">{k}</span>
            {BR3_PLAN.asymmetry.map(a=>{
              const c=panel.byBase.find(x=>x.coupling===k&&x.asymmetry===a)
              return <button key={a} type="button"
                className={`br3-cell br3-${category(c,view)}`} aria-pressed={selected.coupling===k&&selected.asymmetry===a}
                aria-label={`Coupling ${k}, asymmetry ${a}: ${category(c,view)}`}
                onClick={()=>setSelection(`${k}|${a}`)}>{view==='horizon'?c.horizonRescue:
                  category(c,view)==='flag'?'!':category(c,view)==='caution'?'~':'·'}</button>
            })}
          </div>)}
        </div>
        <div className="br3-legend"><span><i className="br3-flag"/>Diagnostic triggered</span>
          <span><i className="br3-clear"/>Not triggered</span>
          {view==='precision'&&<span><i className="br3-caution"/>Time discrepancy >0.08 s</span>}
        </div>
        <div className="br3-method">
          <p><strong>Important:</strong> "not triggered" never means a physical system is safe or resilient. A recover/no-recover flip reflects these chosen equations, thresholds, and observation times.</p>
          <button onClick={()=>exportJSON(panel)} type="button">Export 162-run simulated damping-slice receipt</button>
        </div>
      </div>
      <aside className="br3-detail">
        <small>SELECTED FROZEN CONFIGURATION</small>
        <h3>k={selected.coupling} · a={selected.asymmetry} · γ={damping}</h3>
        <p>Frequency mismatch δ=0.12 · force=0.75 · kick magnitude=2</p>
        <div className="br3-pickers">
          <label>Kick location <select value={target} onChange={e=>setTarget(e.target.value)}>
            {BR3_PLAN.target.map(v=><option key={v} value={v}>{v==='BOTH'?'A + B':v}</option>)}
          </select></label>
          <label>Recovery threshold <select value={threshold} onChange={e=>setThreshold(+e.target.value)}>
            {BR3_PLAN.thresholds.map(v=><option key={v} value={v}>{v}</option>)}
          </select></label>
          <label>RK4 step <select value={timeStep} onChange={e=>setTimeStep(+e.target.value)}>
            {BR3_PLAN.timeStep.map(v=><option key={v} value={v}>{v}</option>)}
          </select></label>
        </div>
        <table className="br3-comparison">
          <thead><tr><th>Horizon</th><th>Outcome</th><th>Recovery time</th></tr></thead>
          <tbody>{compare.map(r=><tr key={r.horizon}>
            <td>{r.horizon} s</td>
            <td>{r.status==='RECOVERED'?'Recovered':'Censored'}</td>
            <td>{r.recoveryTime===null?'n/a':fmt(r.recoveryTime,2)+' s'}</td>
          </tr>)}</tbody>
        </table>
        <p className="br3-small">Undisturbed velocity correlation at 38 s: {fmt(compare[0].baselineCorrelation)}. A high value is not proof of shock recovery.</p>
        <ResidueView scenario={chart}/>
        <p className="br3-small">Chart uses the 120-second trajectory and shows the 0.06 reference line. Recovery decisions above apply the <strong>selected</strong> threshold and require the final two seconds to stay below it.</p>
      </aside>
    </div>
    <p className="br3-disclaimer"><strong>ORIGIN: SIMULATED · AUTHORITY: NONE.</strong> 27 deliberately selected base cases, not the entire BR2 972-cell grid. Every result is a numerical toy-model observation only. This does not validate metaphysical energy, human behavior, clinical effects, physics, or chaos. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/RECOVERY_ROBUSTNESS.md" target="_blank" rel="noreferrer">Frozen BR3 protocol ↗</a></p>
  </section>
}
