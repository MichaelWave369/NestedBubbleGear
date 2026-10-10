import { useMemo, useState } from 'react'
import { oraclePhaseDegrees } from './adaptivePhaseKeyhole.js'
import {
  RECOVERY_GRIDS, RECOVERY_SCENARIOS, runModelMismatchRecovery, modelRecoveryReceipt,
} from './modelMismatchRecovery.js'
import './modelMismatchRecoveryLab.css'

const chartX = d => 50 + d * 618 / 360
const chartY = d => 28 - d * 260 / 360
function pathFor(e) {
  return Array.from({length:121},(_,i)=>{
    const angle=i*3
    return (i?'L':'M')+chartX(angle).toFixed(2)+','+
      chartY(oraclePhaseDegrees(e,angle)).toFixed(2)
  }).join(' ')
}
const STEPS=[
  {title:'Rejection gate',subtitle:'Inherited Unknown Gear result'},
  {title:'Candidate freeze',subtitle:'Training-only fitting'},
  {title:'Untouched holdout',subtitle:'Independent-angle falsification'},
]
const statusNotes={
  REFUSED_NO_CATALOG_REJECTION:'The original catalog was not rejected. Recovery is unauthorized; it would be wrong to replace a model simply because a newer one looks appealing.',
  REFUSED_INVALID_NOISE_ASSUMPTIONS:'The simulated injected noise exceeds the declared error bound. The rejection is not admissible evidence for proposing a replacement.',
  NO_TRAINING_COMPATIBLE_PROPOSAL:'No member of the predeclared proposal grid fits every training observation. The lab refuses to enlarge the grid after seeing the data.',
  INSUFFICIENT_INDEPENDENT_HOLDOUT:'Not enough unused angles remain for the required untouched holdout. No validation outcome may be claimed.',
  HOLDOUT_REFUTED:'At least one held-out measurement falls outside the permitted error bound. The frozen candidate failed this out-of-sample test.',
  HOLDOUT_COMPATIBLE_UNVERIFIED:'All held-out synthetic measurements agree within the declared bound. The candidate remains quarantined and is not verified in nature.',
}
function RecoveryPlot({run,stage,reveal}) {
  const showFit=stage>=1&&Boolean(run.candidate)
  const showHoldout=stage>=2&&run.holdout.length>0
  const candidateCurve=useMemo(()=>
    run.candidate?pathFor(run.candidate.eccentricity):'',[run.candidate?.eccentricity])
  const truthCurve=useMemo(()=>pathFor(run.settings.truthEccentricity),
    [run.settings.truthEccentricity])
  const shiftCurve=useMemo(()=>pathFor(run.settings.truthEccentricity+run.settings.holdoutShift),
    [run.settings.truthEccentricity,run.settings.holdoutShift])
  return <div className="mrl-chart">
    <div className="mrl-chart-head">
      <span>TRAINING vs HELD-OUT PHASE MEASUREMENTS</span>
      <small>Predictions are mathematical curves · readings are simulated</small>
    </div>
    <svg className="mrl-svg" viewBox="0 0 712 328" role="img"
      aria-label="Gear phase-versus-input-angle plot showing the frozen candidate, original training observations and reserved holdout observations">
      <defs><pattern id="mrl-grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M28 0 L0 0 0 28" fill="none" stroke="#73ffc5" strokeOpacity=".07"/>
      </pattern></defs>
      <rect width="712" height="328" fill="url(#mrl-grid)"/>
      {[0,90,180,270,360].map(d=><g key={d}>
        <line x1={chartX(d)} x2={chartX(d)} y1="28" y2="288"
          stroke="#8ba997" strokeOpacity=".16"/>
        <text x={chartX(d)} y="313" textAnchor="middle"
          fill="#9cb9a6" fontSize="11">{d}°</text>
      </g>)}
      <text x="7" y="34" fill="#9cb9a6" fontSize="11">0°</text>
      <text x="5" y="290" fill="#9cb9a6" fontSize="11">−360°</text>
      {showFit&&<path d={candidateCurve} stroke="#73ffc5" strokeWidth="3"
        fill="none" opacity=".9"/>}
      {reveal&&<path d={truthCurve} stroke="#ffc56f" strokeWidth="2"
        strokeDasharray="8 5" fill="none"/>}
      {reveal&&showHoldout&&run.settings.holdoutShift>0&&
        <path d={shiftCurve} stroke="#ff9797" strokeWidth="2"
          strokeDasharray="3 5" fill="none"/>}
      {run.originalTraining.map(row=><circle key={row.index}
        cx={chartX(row.angle)} cy={chartY(row.observedDegrees)}
        r="5.4" fill="#8bc9ff" stroke="#07140b" strokeWidth="1.5"/>)}
      {showHoldout&&run.holdout.map(row=><g key={row.index}>
        <circle cx={chartX(row.angle)} cy={chartY(row.observedDegrees)}
          r="7" stroke="#07140b" strokeWidth="1.7"
          fill={row.consistent?'#ffc56f':'#ff8181'}/>
        <text x={chartX(row.angle)+8} y={chartY(row.observedDegrees)-9}
          fill={row.consistent?'#ffc56f':'#ff9393'}
          fontSize="10">H{row.index}</text>
      </g>)}
    </svg>
    <div className="mrl-legend">
      <span><i className="mrl-dot-blue"/> Rejected-catalog training</span>
      {showFit&&<span><i className="mrl-line-green"/> Frozen candidate</span>}
      {showHoldout&&<span><i className="mrl-dot-gold"/> Held-out readings</span>}
      {reveal&&<span><i className="mrl-line-gold"/> Synthetic oracle</span>}
    </div>
  </div>
}
function Status({status,stage}) {
  const text = stage<2&&status==='HOLDOUT_COMPATIBLE_UNVERIFIED'
    ? 'PENDING INDEPENDENT HOLDOUT'
    : stage<2&&status==='HOLDOUT_REFUTED'
      ? 'PENDING INDEPENDENT HOLDOUT' : status.replaceAll('_',' ')
  return <strong className={'mrl-status '+(
    status==='HOLDOUT_REFUTED'||status.startsWith('REFUSED')||status.startsWith('NO_')
      ? 'mrl-refused' : status==='HOLDOUT_COMPATIBLE_UNVERIFIED'&&stage===2
        ? 'mrl-compatible':'mrl-pending')}>{text}</strong>
}
export default function ModelMismatchRecoveryLab() {
  const [scenario,setScenario]=useState('FAR_UNKNOWN')
  const [proposalGrid,setProposalGrid]=useState('FINE')
  const [holdoutShift,setHoldoutShift]=useState(0)
  const [holdoutCount,setHoldoutCount]=useState(3)
  const [resolutionDegrees,setResolutionDegrees]=useState(4)
  const [injectedNoiseDegrees,setInjectedNoiseDegrees]=useState(1)
  const [declaredNoiseBoundDegrees,setDeclaredNoiseBoundDegrees]=useState(1.5)
  const [seed,setSeed]=useState(369)
  const [stage,setStage]=useState(0)
  const [reveal,setReveal]=useState(false)
  const truthEccentricity=RECOVERY_SCENARIOS.find(row=>row.id===scenario).truth
  const result=useMemo(()=>runModelMismatchRecovery({
    truthEccentricity,proposalGrid,holdoutShift,holdoutCount,
    resolutionDegrees,injectedNoiseDegrees,declaredNoiseBoundDegrees,seed,
  }),[truthEccentricity,proposalGrid,holdoutShift,holdoutCount,
    resolutionDegrees,injectedNoiseDegrees,declaredNoiseBoundDegrees,seed])
  const isBlocked=!result.candidate
  function configure(fn){fn();setStage(0);setReveal(false)}
  function exportReceipt() {
    if(stage!==2)return
    const content=JSON.stringify(modelRecoveryReceipt(result),null,2)
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=url
    a.download='nbg-model-mismatch-recovery-simulation.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return <section id="model-recovery" className="section mrl">
    <div className="section-label">NBG · MODEL MISMATCH &amp; RECOVERY · QUARANTINED</div>
    <h2>Reject. Propose. <em>Try to falsify.</em></h2>
    <p className="mrl-intro">
      The Unknown Gear observer has rejected its eight-profile catalog.
      Can a new predeclared family explain those observations, and then
      survive fresh measurements that were never used to select it?
      A promising fit stays in quarantine, not in the verified ledger.
    </p>
    <div className="mrl-shell">
      <div className="mrl-analysis">
        <div className="mrl-stages" role="group" aria-label="Audit stages">
          {STEPS.map((step,i)=><button key={step.title}
            aria-pressed={stage===i} onClick={()=>setStage(i)}
            className={stage===i?'active':''}>
            <small>0{i+1} · {step.title}</small><span>{step.subtitle}</span>
          </button>)}
        </div>
        <div className="mrl-metrics">
          <div><small>ORIGINAL SURVIVORS</small><strong>{result.originalSurvivors.length}</strong>
            <span>rejected catalog</span></div>
          <div><small>TRAINING READINGS</small><strong>{result.originalTraining.length}</strong>
            <span>frozen probes</span></div>
          <div><small>TRAINING FITS</small><strong>{stage>=1?result.eligibleProposals.length:'—'}</strong>
            <span>predeclared grid</span></div>
          <div><small>HOLDOUT</small><strong>{stage>=2?result.holdout.length:'—'}</strong>
            <span>reserved probes</span></div>
        </div>
        <RecoveryPlot run={result} stage={stage} reveal={reveal}/>
        <div className="mrl-actions">
          <button className="mrl-primary" disabled={stage===2} onClick={()=>setStage(n=>Math.min(2,n+1))}>
            {stage===2?'Audit sequence complete':'→ Next audit stage'}
          </button>
          <button onClick={()=>setStage(2)}>▶ Run complete audit</button>
          <button onClick={()=>setStage(0)}>↺ Return to gate</button>
        </div>
        <div className="mrl-outcome">
          <div className="mrl-outcome-head">
            <span>{stage===0?'01 · REJECTION GATE':stage===1?'02 · FROZEN PROPOSAL':'03 · HOLDOUT RESULT'}</span>
            <label><input type="checkbox" checked={reveal}
              onChange={e=>setReveal(e.target.checked)}/> Reveal synthetic oracle</label>
          </div>
          {stage===0?<><strong className="mrl-status">
            {result.rejectedCatalogStatus.replaceAll('_',' ')}
          </strong><p>{isBlocked?
              statusNotes[result.status]:
              'The original catalog has no consistent candidate under the declared error bound. This permits training-only proposal evaluation, not automatic scientific promotion.'}
            </p></>:stage===1?<>
            {result.candidate?<><strong className="mrl-status mrl-pending">
              QUARANTINED CANDIDATE · e = {result.candidate.eccentricity.toFixed(2)}
            </strong><p>Selected using training data only. This candidate and the reserved-angle
              policy were frozen before the holdout was revealed.</p></>:
              <><Status status={result.status} stage={stage}/><p>{statusNotes[result.status]}</p></>}
          </>:<><Status status={result.status} stage={stage}/>
            <p>{statusNotes[result.status]}</p></>}
        </div>
        <div className="mrl-evidence">
          <div className="mrl-panel-title"><strong>Observation ledger</strong>
            <small>Training and holdout remain separate</small></div>
          <div className="mrl-rows">
            {result.originalTraining.map(row=><div key={row.index} className="mrl-row">
              <span>TRAIN {row.index}</span><strong>{row.angle}°</strong>
              <span>Observed {row.observedDegrees.toFixed(1)}°</span>
            </div>)}
          </div>
          {stage>=1&&result.candidate&&<div className="mrl-fit">
            <strong>FROZEN · e = {result.candidate.eccentricity.toFixed(2)}</strong>
            <span>Training max residual {result.candidate.maximumTrainingResidual.toFixed(3)}°
              {' · '}bound ±{result.errorRadiusDegrees.toFixed(3)}°</span>
          </div>}
          {stage>=2&&<div className="mrl-rows mrl-holdout">
            {result.holdout.length===0&&<p>No held-out readings authorized for this outcome.</p>}
            {result.holdout.map(row=><div className="mrl-row" key={row.index}>
              <span>HOLDOUT {row.index}</span><strong>{row.angle}°</strong>
              <span>{row.consistent?'FIT':'REFUTED'} · residual {row.absoluteResidual.toFixed(3)}°</span>
            </div>)}
          </div>}
        </div>
      </div>
      <aside className="mrl-console">
        <div className="mrl-panel-title"><strong>Experiment inputs</strong><small>SIMULATED / READ ONLY</small></div>
        <label htmlFor="mrl-scenario">Source scenario</label>
        <select id="mrl-scenario" value={scenario}
          onChange={e=>configure(()=>setScenario(e.target.value))}>
          {RECOVERY_SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label htmlFor="mrl-grid">Predeclared recovery family</label>
        <select id="mrl-grid" value={proposalGrid}
          onChange={e=>configure(()=>setProposalGrid(e.target.value))}>
          <option value="FINE">Fine grid · e 0.56–0.90</option>
          <option value="COARSE">Coarse grid · five profiles</option>
          <option value="EXCLUDES_TRUTH">Inadequate grid · negative control</option>
        </select>
        <label htmlFor="mrl-res">Measurement rounding</label>
        <select id="mrl-res" value={resolutionDegrees}
          onChange={e=>configure(()=>setResolutionDegrees(Number(e.target.value)))}>
          {[4,8,12,16].map(v=><option key={v} value={v}>Nearest {v}°</option>)}
        </select>
        <label htmlFor="mrl-noise">Synthetic maximum jitter</label>
        <select id="mrl-noise" value={injectedNoiseDegrees}
          onChange={e=>configure(()=>setInjectedNoiseDegrees(Number(e.target.value)))}>
          {[0,1,2,4].map(v=><option key={v} value={v}>±{v}°</option>)}
        </select>
        <label htmlFor="mrl-bound">Assumed noise bound</label>
        <select id="mrl-bound" value={declaredNoiseBoundDegrees}
          onChange={e=>configure(()=>setDeclaredNoiseBoundDegrees(Number(e.target.value)))}>
          {[.5,1,1.5,2,4].map(v=><option key={v} value={v}>±{v}°</option>)}
        </select>
        <label htmlFor="mrl-holdouts">Reserved holdout readings <strong>{holdoutCount}</strong></label>
        <input type="range" min="2" max="5" step="1" id="mrl-holdouts"
          value={holdoutCount} onChange={e=>configure(()=>setHoldoutCount(Number(e.target.value)))}/>
        <label htmlFor="mrl-shift">Holdout-only regime intervention</label>
        <select id="mrl-shift" value={holdoutShift}
          onChange={e=>configure(()=>setHoldoutShift(Number(e.target.value)))}>
          <option value={0}>Stable gear · no change</option>
          <option value={.14}>Changed gear · +0.14 eccentricity</option>
        </select>
        <label htmlFor="mrl-seed">Deterministic noise seed</label>
        <select id="mrl-seed" value={seed}
          onChange={e=>configure(()=>setSeed(Number(e.target.value)))}>
          {[0,7,369,2026].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
        <div className="mrl-gate">
          <span>MANDATORY GOVERNANCE BOUNDARY</span>
          <strong>QUARANTINE · NO MODEL PROMOTION</strong>
          <p>Even a successful holdout is only model-relative synthetic compatibility.
            A real release requires independent physical evidence, a separate
            qualification process, and explicit human approval.</p>
        </div>
        <button className="mrl-export" disabled={stage!==2} onClick={exportReceipt}>
          ↓ Export replayable audit JSON
        </button>
        {stage!==2&&<small className="mrl-export-hint">Complete the audit sequence to export all recorded stages.</small>}
      </aside>
    </div>
    <div className="mrl-lessons">
      <article><span>01 · REJECTION</span><h3>Don't retrofit certainty.</h3>
        <p>Catalog mismatch is a reason to investigate a new candidate, not
          permission to rewrite the model or ignore the original error bound.</p></article>
      <article><span>02 · FREEZE</span><h3>No peeking at holdout.</h3>
        <p>All candidate selection uses the rejected catalog's training observations.
          The candidate and probe policy freeze before separate readings are produced.</p></article>
      <article><span>03 · FALSIFY</span><h3>A pass remains unverified.</h3>
        <p>New measurements may refute the candidate or leave it compatible.
          Neither outcome authorizes automatic promotion into the NBG evidence ledger.</p></article>
    </div>
    <div className="mrl-disclaimer">
      <strong>CLAIM FIREWALL · INDEPENDENCE IS WITHIN THIS SIMULATOR ONLY</strong>
      <p>The holdout angles are disjoint from the training angles, not independent empirical experiments.
        The synthetic oracle, noise, and elliptical model family are shared. These results make no
        claim about real gear manufacturing or unknown laws of physics.</p>
    </div>
  </section>
}
