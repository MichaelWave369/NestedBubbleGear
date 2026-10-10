import { useMemo, useState } from 'react'
import { PHASE_CATALOG, PHASE_RESOLUTIONS, oraclePhaseDegrees } from './adaptivePhaseKeyhole.js'
import {
  UNKNOWN_GEAR_PRESETS, UNKNOWN_NOISE_LEVELS, UNKNOWN_BOUNDS,
  runUnknownGearExperiment, unknownGearReceipt,
} from './unknownGearModel.js'
import './unknownGearLab.css'

const xAngle = d => 47 + d * 612 / 360
const yPhase = d => 30 - d * 263 / 360
const predictedCurves = PHASE_CATALOG.map(profile => ({
  ...profile,
  path: Array.from({ length: 121 }, (_, i) => {
    const angle = i * 3
    return (i ? 'L' : 'M') + xAngle(angle).toFixed(2) + ',' +
      yPhase(oraclePhaseDegrees(profile.eccentricity, angle)).toFixed(2)
  }).join(' '),
}))
function GearEvidencePlot({ steps, remaining, truthEccentricity, revealTruth }) {
  const truthPath = useMemo(() => Array.from({ length: 121 }, (_, i) => {
    const angle = i * 3
    return (i ? 'L' : 'M') + xAngle(angle).toFixed(2) + ',' +
      yPhase(oraclePhaseDegrees(truthEccentricity, angle)).toFixed(2)
  }).join(' '), [truthEccentricity])
  return <div className="ugl-plot-panel">
    <div className="ugl-panel-title">
      <span>OPEN-WORLD PHASE OBSERVER</span>
      <small>Catalog predictions, not external measurements</small>
    </div>
    <svg className="ugl-plot" viewBox="0 0 714 340" role="img"
      aria-label="Elliptical gear phase predictions, surviving hypotheses and observed noisy phase readings">
      <defs><pattern id="ugl-grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M28 0 L0 0 0 28" fill="none" stroke="#73ffc5" strokeOpacity=".075"/>
      </pattern></defs>
      <rect width="714" height="340" fill="url(#ugl-grid)"/>
      {[0,90,180,270,360].map(deg=><g key={deg}>
        <line x1={xAngle(deg)} x2={xAngle(deg)} y1="28" y2="293"
          stroke="#8ea99b" strokeOpacity=".15"/>
        <line x1="47" x2="659" y1={yPhase(-deg)} y2={yPhase(-deg)}
          stroke="#8ea99b" strokeOpacity=".15"/>
        <text x={xAngle(deg)} y="323" fill="#a4bead" textAnchor="middle" fontSize="11">
          {deg}°
        </text>
      </g>)}
      <text x="5" y="34" fill="#9ebbac" fontSize="11">0°</text>
      <text x="3" y="294" fill="#9ebbac" fontSize="11">−360°</text>
      {predictedCurves.map(profile=><path key={profile.id} d={profile.path}
        fill="none" stroke={remaining.includes(profile.id)?'#73ffc5':'#82968b'}
        opacity={remaining.includes(profile.id)?.7:.15}
        strokeWidth={remaining.includes(profile.id)?2.3:1}/>)}
      {revealTruth&&<path d={truthPath} fill="none" stroke="#f8bf70"
        strokeWidth="3" strokeDasharray="6 4"/>}
      {steps.map(step=><g key={step.index}>
        <line x1={xAngle(step.angle)} x2={xAngle(step.angle)}
          y1="28" y2="293" stroke="#f8bf70" strokeDasharray="4 5" opacity=".4"/>
        <circle cx={xAngle(step.angle)} cy={yPhase(step.observedDegrees)}
          r="6.5" fill={step.after.length?'#8bc9ff':'#ff8989'}
          stroke="#06120b" strokeWidth="2"/>
        <text x={xAngle(step.angle)+8}
          y={Math.max(22,yPhase(step.observedDegrees)-9)} fontSize="11"
          fill="#ffce8b">{step.index}</text>
      </g>)}
    </svg>
    <div className="ugl-chart-legend">
      <span><i className="ugl-live-line"/> Surviving predictions</span>
      <span><i className="ugl-cut-line"/> Eliminated profiles</span>
      <span><i className="ugl-observed-dot"/> Simulated noisy readings</span>
      {revealTruth&&<span><i className="ugl-oracle-line"/> Oracle (revealed)</span>}
    </div>
  </div>
}

const statusDescription = {
  NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS: 'No catalog profile remains consistent with the noisy observations, given the declared error bound. This is conditional rejection, not universal proof of a new mechanism.',
  PROVISIONAL_SINGLETON: 'One catalog profile survives, but the required fresh confirmation probes have not completed. Identification is withheld.',
  CONSISTENT_WITH_CATALOG_PROFILE: 'One catalog profile survived the required additional probes. This is compatibility, not proof that the actual eccentricity belongs to the catalog.',
  UNRESOLVED_CATALOG_SET: 'The available measurements and budget leave multiple plausible catalog candidates. Do not force a winner.',
  MODEL_ASSUMPTIONS_VIOLATED: 'The simulator injected noise beyond the stated model bound. Its privileged settings invalidate the experiment conclusions. A real sensor would require independent calibration.',
}

export default function UnknownGearLab() {
  const [truthEccentricity, setTruthEccentricity] = useState(.72)
  const [resolutionDegrees, setResolutionDegrees] = useState(4)
  const [injectedNoiseDegrees, setInjectedNoiseDegrees] = useState(1)
  const [declaredNoiseBoundDegrees, setDeclaredNoiseBoundDegrees] = useState(1.5)
  const [queryBudget, setQueryBudget] = useState(6)
  const [requiredConfirmations, setRequiredConfirmations] = useState(2)
  const [seed, setSeed] = useState(369)
  const [shown, setShown] = useState(0)
  const [revealTruth, setRevealTruth] = useState(false)
  const run = useMemo(() => runUnknownGearExperiment({
    truthEccentricity, resolutionDegrees, injectedNoiseDegrees,
    declaredNoiseBoundDegrees, queryBudget, requiredConfirmations, seed,
  }), [truthEccentricity,resolutionDegrees,injectedNoiseDegrees,
    declaredNoiseBoundDegrees,queryBudget,requiredConfirmations,seed])
  const count = Math.min(shown, run.steps.length)
  const visible = run.steps.slice(0,count)
  const last = visible[visible.length-1]
  const remaining = last?.after ?? PHASE_CATALOG.map(profile=>profile.id)
  const stopped = count===run.steps.length
  const status = stopped ? run.status : 'MEASURING'
  const mismatch = injectedNoiseDegrees > declaredNoiseBoundDegrees
  function reconfigure(change) {
    change()
    setShown(0)
    setRevealTruth(false)
  }
  function choosePreset(id) {
    const preset=UNKNOWN_GEAR_PRESETS.find(item=>item.id===id)
    if (preset) reconfigure(()=>setTruthEccentricity(preset.eccentricity))
  }
  function exportReceipt() {
    if (!stopped) return
    const data=unknownGearReceipt(run)
    const objectUrl=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{
      type:'application/json',
    }))
    const link=document.createElement('a')
    link.href=objectUrl
    link.download='nbg-unknown-gear-simulation-receipt.json'
    link.click()
    URL.revokeObjectURL(objectUrl)
  }
  const lastRadius=last?.uncertaintyRadiusDegrees ?? run.acceptanceRadius
  return <section id="unknown-gear" className="section ugl">
    <div className="section-label">NBG · UNKNOWN GEAR LAB · OPEN-WORLD MODEL CHECK</div>
    <h2>What if the answer <em>isn't in the catalog?</em></h2>
    <p className="ugl-intro">
      A model that always picks a winner is not necessarily discovering anything.
      Send deliberately unseen eccentricities and bounded noisy observations to
      our adaptive observer. Can it reject all catalog candidates instead of pretending?
    </p>
    <div className="ugl-shell">
      <div className="ugl-analysis">
        <div className="ugl-metrics">
          <div><small>INITIAL CATALOG</small><strong>{PHASE_CATALOG.length}</strong><span>known models</span></div>
          <div><small>SURVIVING</small><strong>{remaining.length}</strong><span>compatible candidates</span></div>
          <div><small>PROBES</small><strong>{count}/{queryBudget}</strong><span>budget consumed</span></div>
          <div><small>ACCEPTANCE RADIUS</small><strong>±{lastRadius}°</strong><span>noise + rounding</span></div>
        </div>
        <GearEvidencePlot steps={visible} remaining={remaining}
          truthEccentricity={truthEccentricity} revealTruth={revealTruth}/>
        <div className="ugl-actions">
          <button className="ugl-primary" disabled={stopped}
            onClick={()=>setShown(value=>Math.min(run.steps.length,value+1))}>
            {stopped?'Sequence complete':'⊕ Take next probe'}
          </button>
          <button disabled={stopped} onClick={()=>setShown(run.steps.length)}>▶ Run all probes</button>
          <button onClick={()=>setShown(0)}>↺ Reset</button>
        </div>
        <div className={'ugl-verdict '+(stopped&&status==='NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS'?'ugl-rejected':'')}>
          <span>{stopped?'FINAL MODEL-RELATIVE VERDICT':'EXPERIMENT IN PROGRESS'}</span>
          <strong>{status.replaceAll('_',' ')}</strong>
          <p>{stopped?statusDescription[status]:
            'The observer has received '+count+' of '+run.steps.length+
            ' planned synthetic readings. Continue before interpreting the final result.'}</p>
        </div>
        <div className="ugl-ledger-header">
          <strong>Candidate Ledger</strong>
          <label><input type="checkbox" checked={revealTruth}
            onChange={event=>setRevealTruth(event.target.checked)}/>
            Reveal oracle for analysis</label>
        </div>
        <div className="ugl-candidates">
          {PHASE_CATALOG.map(profile=><article key={profile.id}
            className={'ugl-candidate '+(remaining.includes(profile.id)?'survivor':'excluded')}>
            <span>{profile.id}</span><strong>e = {profile.eccentricity.toFixed(2)}</strong>
            <small>{remaining.includes(profile.id)?'STILL CONSISTENT':'RULED OUT'}</small>
          </article>)}
        </div>
        <div className="ugl-observations">
          <div className="ugl-panel-head"><strong>Measurement receipts</strong>
            <small>One query at a time · declared bounded error</small></div>
          {visible.length===0&&<p>No observations recorded yet. The catalog remains untested.</p>}
          {visible.map(step=><article key={step.index} className="ugl-step">
            <div><strong>#{step.index} · {step.angle}° probe</strong>
              <span>{step.before.length} → {step.after.length} candidates</span></div>
            <p>Observed phase {step.observedDegrees.toFixed(1)}°,
              tolerance ±{step.uncertaintyRadiusDegrees.toFixed(1)}°,
              {step.eliminated} eliminated.
              {step.confirmedSingletonAtStep?' Fresh singleton verification recorded.':''}</p>
          </article>)}
        </div>
      </div>
      <aside className="ugl-console">
        <div className="ugl-panel-head"><strong>Simulator & assumptions</strong><small>NO REAL SENSOR</small></div>
        <label htmlFor="ugl-preset">Hidden eccentricity scenario</label>
        <select id="ugl-preset" value={UNKNOWN_GEAR_PRESETS.find(p=>p.eccentricity===truthEccentricity)?.id}
          onChange={event=>choosePreset(event.target.value)}>
          {UNKNOWN_GEAR_PRESETS.map(preset=><option value={preset.id} key={preset.id}>{preset.label}</option>)}
        </select>
        <label htmlFor="ugl-resolution">Measurement rounding</label>
        <select id="ugl-resolution" value={resolutionDegrees}
          onChange={event=>reconfigure(()=>setResolutionDegrees(Number(event.target.value)))}>
          {PHASE_RESOLUTIONS.map(value=><option value={value} key={value}>Nearest {value}°</option>)}
        </select>
        <label htmlFor="ugl-injected">Injected synthetic noise (maximum)</label>
        <select id="ugl-injected" value={injectedNoiseDegrees}
          onChange={event=>reconfigure(()=>setInjectedNoiseDegrees(Number(event.target.value)))}>
          {UNKNOWN_NOISE_LEVELS.map(value=><option value={value} key={value}>±{value}°</option>)}
        </select>
        <label htmlFor="ugl-bound">Assumed noise bound</label>
        <select id="ugl-bound" value={declaredNoiseBoundDegrees}
          onChange={event=>reconfigure(()=>setDeclaredNoiseBoundDegrees(Number(event.target.value)))}>
          {UNKNOWN_BOUNDS.map(value=><option value={value} key={value}>±{value}°</option>)}
        </select>
        <label htmlFor="ugl-budget">Maximum probes <strong>{queryBudget}</strong></label>
        <input type="range" id="ugl-budget" min="1" max="12" step="1" value={queryBudget}
          onChange={event=>reconfigure(()=>setQueryBudget(Number(event.target.value)))}/>
        <label htmlFor="ugl-confirm">Additional verification probes <strong>{requiredConfirmations}</strong></label>
        <input type="range" id="ugl-confirm" min="1" max="3" step="1" value={requiredConfirmations}
          onChange={event=>reconfigure(()=>setRequiredConfirmations(Number(event.target.value)))}/>
        <label htmlFor="ugl-seed">Noise seed</label>
        <select id="ugl-seed" value={seed}
          onChange={event=>reconfigure(()=>setSeed(Number(event.target.value)))}>
          {[7,369,2026,9001].map(value=><option key={value} value={value}>{value}</option>)}
        </select>
        <div className={'ugl-assumption '+(mismatch?'invalid':'valid')}>
          <span>ASSUMPTION CHECK</span>
          <strong>{mismatch?'DECLARED BOUND VIOLATED':'INJECTED NOISE WITHIN DECLARED BOUND'}</strong>
          <p>{mismatch
            ? 'The simulated noise maximum exceeds what the observer assumes. Any conclusion must be refused, regardless of the survivors.'
            : 'The simulated jitter magnitude is bounded by the declared maximum. This is not a real-world sensor calibration.'}</p>
        </div>
        <div className="ugl-controls-note">
          <span>NEGATIVE-CONTROL RULES</span>
          <p>When the truth is exactly in the catalog and the noise bound is valid,
            that hypothesis must remain. A singleton is provisional until fresh
            probes agree. Near-catalog unknowns may be impossible to reject.</p>
        </div>
        <button className="ugl-export" disabled={!stopped} onClick={exportReceipt}>
          ↓ Export full simulation receipt JSON
        </button>
      </aside>
    </div>
    <div className="ugl-lesson-grid">
      <article><span>01 · OUT-OF-CATALOG</span><h3>Reject the forced winner.</h3>
        <p>An unfamiliar model may contradict every known profile. NONE OF THE ABOVE
          is justified only relative to the stated measurement-error bound.</p></article>
      <article><span>02 · MEASUREMENT LIMITS</span><h3>Noise can hide differences.</h3>
        <p>Rounding and synthetic jitter can leave multiple catalog profiles consistent.
          Failure to reject does not prove that the catalog contains the truth.</p></article>
      <article><span>03 · EPISTEMIC DISCIPLINE</span><h3>Confidence must be earned.</h3>
        <p>Fresh observations test a provisional survivor. Even a confirmed match
          means compatible with the model, not independently verified physics.</p></article>
    </div>
    <div className="ugl-boundary">
      <strong>CLAIM FIREWALL · DEMONSTRATION ONLY</strong>
      <p>Every reading here comes from a deterministic synthetic oracle. No real-world
        sensor, measured Gaussian distribution, statistical confidence calibration,
        new physical residue, or frozen AH experiment promotion is involved.
        The full protocol is documented in the repository.</p>
    </div>
  </section>
}
