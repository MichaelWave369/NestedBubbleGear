import { useMemo, useState } from 'react'
import { DISCOVERY_SCENARIOS, DISCOVERY_STAGES,runDiscoveryLoop,discoveryLoopReceipt } from './discoveryLoop.js'
import './discoveryLoop.css'

const labAnchors=['#spiral-gears','#phase-closure','#adaptive-phase','#unknown-gear','#model-recovery']
function saveJSON(name,payload){
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)
}
export default function DiscoveryLoop(){
  const [scenario,setScenario]=useState('UNKNOWN_FAR')
  const [resolutionDegrees,setResolutionDegrees]=useState(4)
  const [injectedNoiseDegrees,setInjectedNoiseDegrees]=useState(1)
  const [declaredNoiseBoundDegrees,setDeclaredNoiseBoundDegrees]=useState(1.5)
  const [holdoutShift,setHoldoutShift]=useState(0)
  const [seed,setSeed]=useState(369)
  const [stage,setStage]=useState(0)
  const experiment=useMemo(()=>runDiscoveryLoop({
    scenario,resolutionDegrees,injectedNoiseDegrees,
    declaredNoiseBoundDegrees,holdoutShift,seed,
  }),[scenario,resolutionDegrees,injectedNoiseDegrees,declaredNoiseBoundDegrees,holdoutShift,seed])
  const current=experiment.stages[stage]
  const blocked=experiment.recovery.candidate===null
  const status=experiment.recovery.status
  const metrics=[
    ['GEAR CLOSURE',experiment.geometry.endpointClosure?'PASS':'FAILED'],
    ['FIRST PLANNED PROBE',experiment.observer.firstPlannedProbeDegrees+'°'],
    ['CATALOG SURVIVORS',String(experiment.mismatch.survivors.length)],
    ['RECOVERY',blocked?'BLOCKED':'QUARANTINED'],
  ]
  function configure(set,val){set(val);setStage(0)}
  return <section id="discovery-loop" className="section dloop">
    <div className="section-label">NBG · SCIENTIFIC DISCOVERY LOOP · READ-ONLY RESEARCH</div>
    <h2>One experiment. <em>Five accountable stages.</em></h2>
    <p className="dloop-intro">Follow the same simulated gear from geometry and observer limits through
      catalog rejection, quarantined recovery and human review. Each claim links back to its
      actual model, with no automatic promotion or changes to frozen evidence.</p>
    <div className="dloop-shell">
      <div className="dloop-main">
        <div className="dloop-track" role="group" aria-label="Experiment stages">
          {DISCOVERY_STAGES.map((s,i)=><button key={s.id}
            aria-pressed={stage===i} className={stage===i?'active':''} onClick={()=>setStage(i)}>
            <small>0{i+1}</small><strong>{s.name}</strong><span>{s.detail}</span>
          </button>)}
        </div>
        <div className="dloop-metrics">
          {metrics.map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}
        </div>
        <div className="dloop-focus">
          <span>STAGE 0{stage+1} · {current.id}</span>
          <h3>{DISCOVERY_STAGES[stage].name}</h3>
          <strong>{current.status.replaceAll('_',' ')}</strong>
          <p>{current.detail}</p>
          {stage===0&&<p className="dloop-fact">Both systems close after a full revolution.
            A trace resolves a {Math.abs(experiment.geometry.phasePeakDegrees).toFixed(3)}°
            sampled difference that the endpoint observer cannot see.</p>}
          {stage===1&&<p className="dloop-fact">The selected angle is a mathematical catalog
            probe, not a measurement of an already identified physical device.</p>}
          {stage===2&&<p className="dloop-fact">The unknown-gear observer used
            {experiment.mismatch.steps.length} synthetic readings.
            Empty catalog membership only rules out profiles under the stated error model.</p>}
          {stage===3&&<p className="dloop-fact">A candidate may be held out of promotion
            after both a successful fit and synthetic holdout compatibility.
            Candidate: {blocked?'none authorized':experiment.recovery.candidate.eccentricity.toFixed(2)}.
            Holdout outcome: {status.replaceAll('_',' ')}.</p>}
          {stage===4&&<p className="dloop-fact">Guardrails: source readings
            {experiment.chainIntegrity.sourceReadingsExactReplay?'replayed exactly':'MISMATCH'},
            frozen evidence untouched, candidate promotion denied.
            This is a simulated protocol demonstration, not an empirical finding.</p>}
          <div className="dloop-actions">
            <a href={labAnchors[stage]}>Open underlying lab ↗</a>
            <button onClick={()=>setStage(v=>Math.min(4,v+1))} disabled={stage===4}>Next stage →</button>
            <button onClick={()=>setStage(0)}>↺ Restart review</button>
          </div>
        </div>
        <div className="dloop-ledger">
          <div className="dloop-head"><strong>Immutable evidence trail (computed view)</strong>
            <span>SIMULATED · DEMONSTRATION ONLY</span></div>
          {experiment.stages.map((row,i)=><div key={row.id} className="dloop-row">
            <span>{i+1}</span><strong>{row.id}</strong><small>{row.status}</small>
          </div>)}
        </div>
      </div>
      <aside className="dloop-console">
        <div className="dloop-head"><strong>Experiment controls</strong><span>NO HARDWARE</span></div>
        <label htmlFor="dloop-scenario">Selected synthetic oracle</label>
        <select id="dloop-scenario" value={scenario}
          onChange={e=>configure(setScenario,e.target.value)}>
          {DISCOVERY_SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label htmlFor="dloop-resolution">Phase rounding</label>
        <select id="dloop-resolution" value={resolutionDegrees}
          onChange={e=>configure(setResolutionDegrees,Number(e.target.value))}>
          {[4,8,12,16].map(v=><option key={v} value={v}>Nearest {v}°</option>)}
        </select>
        <label htmlFor="dloop-injected">Synthetic noise ceiling</label>
        <select id="dloop-injected" value={injectedNoiseDegrees}
          onChange={e=>configure(setInjectedNoiseDegrees,Number(e.target.value))}>
          {[0,1,2,4].map(v=><option key={v} value={v}>±{v}°</option>)}
        </select>
        <label htmlFor="dloop-bound">Declared error bound</label>
        <select id="dloop-bound" value={declaredNoiseBoundDegrees}
          onChange={e=>configure(setDeclaredNoiseBoundDegrees,Number(e.target.value))}>
          {[.5,1,1.5,2,4].map(v=><option key={v} value={v}>±{v}°</option>)}
        </select>
        <label htmlFor="dloop-holdout">Held-out intervention</label>
        <select id="dloop-holdout" value={holdoutShift}
          onChange={e=>configure(setHoldoutShift,Number(e.target.value))}>
          <option value={0}>Stable synthetic system</option>
          <option value={.14}>Introduce +0.14 e drift</option>
        </select>
        <label htmlFor="dloop-seed">Noise seed</label>
        <select id="dloop-seed" value={seed}
          onChange={e=>configure(setSeed,Number(e.target.value))}>
          {[0,7,369,2026].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
        <div className="dloop-gate">
          <span>FINAL AUTHORITY GATE</span>
          <strong><span aria-hidden="true">⛔ </span>NO AUTOMATIC PROMOTION</strong>
          <p>Scientific acceptance requires independent physical tests,
            provenance review and human authorization. No change to AH receipts
            or the existing model catalog is permitted.</p>
        </div>
        <button className="dloop-export"
          onClick={()=>saveJSON('nbg-discovery-loop-simulated-receipt.json',discoveryLoopReceipt(experiment))}>
          ↓ Export complete simulation receipt
        </button>
      </aside>
    </div>
    <p className="dloop-disclaimer"><strong>CLAIM FIREWALL</strong> This unified console orchestrates
      deterministic existing research illustrations, not independently validated discoveries.
      The original hypothesis catalog, experiment freeze and epistemic authority stay unchanged.</p>
  </section>
}
