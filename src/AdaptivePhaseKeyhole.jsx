import { useMemo, useState } from 'react'
import {
  PHASE_CATALOG, PHASE_RESOLUTIONS, oraclePhaseDegrees,
  runAdaptivePhaseObserver, adaptivePhaseReceipt,
} from './adaptivePhaseKeyhole.js'
import './adaptivePhaseKeyhole.css'

const chartX = degrees => 48 + degrees * 620 / 360
const chartY = phase => 28 - phase * 268 / 360
function drawHypothesis(e) {
  return Array.from({ length: 97 }, (_, i) => {
    const angle = i * 360 / 96
    return (i ? 'L' : 'M') + chartX(angle).toFixed(2) + ',' +
      chartY(oraclePhaseDegrees(e, angle)).toFixed(2)
  }).join(' ')
}
const phaseLines = PHASE_CATALOG.map(row => ({...row, path: drawHypothesis(row.eccentricity)}))
function PhaseAtlas({ survivors, visibleSteps, showOracle, truthId }) {
  return <div className="apk-atlas">
    <div className="apk-panel-heading">
      <span>HYPOTHESIS PHASE ATLAS</span>
      <small>Curves are model predictions, not observed readings</small>
    </div>
    <svg viewBox="0 0 720 342" className="apk-graph" role="img"
      aria-label="Predicted output phase trajectories for catalog eccentricities, with surviving candidates and observed probe positions marked">
      <defs><pattern id="apk-graph-grid" width="31" height="31" patternUnits="userSpaceOnUse">
        <path d="M31 0 L0 0 0 31" fill="none" stroke="#73ffc5" strokeOpacity=".075"/>
      </pattern></defs>
      <rect width="720" height="342" fill="url(#apk-graph-grid)"/>
      {[0, 90, 180, 270, 360].map(deg =>
        <g key={deg}>
          <line x1={chartX(deg)} x2={chartX(deg)} y1="28" y2="296"
            stroke="#8ea99b" opacity=".17"/>
          <text x={chartX(deg)} y="323" fill="#90ab9c" fontSize="11"
            textAnchor="middle">{deg}°</text>
          <line x1="48" x2="668" y1={chartY(-deg)} y2={chartY(-deg)}
            stroke="#8ea99b" opacity=".17"/>
        </g>)}
      <text x="8" y="32" fill="#a1bdaf" fontSize="11">0°</text>
      <text x="5" y="299" fill="#a1bdaf" fontSize="11">−360°</text>
      {phaseLines.map(row => <path key={row.id} d={row.path} fill="none"
        stroke={survivors.includes(row.id) ? '#73ffc5' : '#7b9292'}
        strokeWidth={survivors.includes(row.id) ? 2.3 : 1}
        opacity={survivors.includes(row.id) ? .73 : .15}/>)}
      {showOracle && phaseLines.filter(row => row.id === truthId).map(row =>
        <path key={row.id} d={row.path} fill="none" stroke="#ffc56f"
          strokeWidth="3.5" opacity=".95"/>)}
      {visibleSteps.map((step, index) => <g key={index}>
        <line x1={chartX(step.angle)} x2={chartX(step.angle)}
          y1="28" y2="296" stroke="#ffc56f" strokeDasharray="4 5" opacity=".45"/>
        <circle cx={chartX(step.angle)} cy={chartY(step.outcomeDegrees)}
          r="7" fill="#ffc56f" stroke="#08140f" strokeWidth="2"/>
        <text x={chartX(step.angle)+10} y={Math.max(23,chartY(step.outcomeDegrees)-8)}
          fill="#ffc56f" fontSize="11">{index+1}</text>
      </g>)}
    </svg>
    <div className="apk-graph-caption">
      <span><i className="apk-line-green"/> Surviving predictions</span>
      <span><i className="apk-line-grey"/> Eliminated predictions</span>
      <span><i className="apk-dot"/> Rounded observations</span>
    </div>
    <p className="apk-honesty">The observer receives only probe readings.
      Candidate curves are predictions supplied by the declared model;
      revealing the simulated oracle is an analyst aid, not an algorithm input.</p>
  </div>
}
function CandidateTiles({ remaining, truthId, reveal }) {
  return <div className="apk-candidates">
    {PHASE_CATALOG.map(row => {
      const present = remaining.includes(row.id)
      return <div key={row.id} className={present?'apk-candidate live':'apk-candidate removed'}>
        <span>{row.id}</span><strong>e = {row.eccentricity.toFixed(2)}</strong>
        <small>{present?'STILL POSSIBLE':'ELIMINATED'}</small>
        {reveal && truthId === row.id && <small className="apk-truth">ORACLE</small>}
      </div>
    })}
  </div>
}
export default function AdaptivePhaseKeyhole() {
  const [truthId, setTruthId] = useState('E4')
  const [resolutionDegrees, setResolutionDegrees] = useState(12)
  const [maxQueries, setMaxQueries] = useState(5)
  const [shown, setShown] = useState(0)
  const [showOracle, setShowOracle] = useState(false)
  const adaptive = useMemo(() => runAdaptivePhaseObserver({
    truthId, resolutionDegrees, maxQueries, method: 'ADAPTIVE',
  }), [truthId,resolutionDegrees,maxQueries])
  const fixed = useMemo(() => runAdaptivePhaseObserver({
    truthId, resolutionDegrees, maxQueries, method: 'FIXED',
  }), [truthId,resolutionDegrees,maxQueries])
  const visibleCount = Math.min(shown, adaptive.steps.length)
  const visibleSteps = adaptive.steps.slice(0, visibleCount)
  const survivorIds = visibleSteps.length
    ? visibleSteps[visibleSteps.length-1].after
    : PHASE_CATALOG.map(row => row.id)
  const fixedVisible = fixed.steps.slice(0, visibleCount)
  const fixedRemaining = fixedVisible.length
    ? fixedVisible[fixedVisible.length-1].after.length
    : PHASE_CATALOG.length
  const next = adaptive.steps[visibleCount]
  const finished = visibleCount === adaptive.steps.length
  function resetParameters(action) {
    action()
    setShown(0)
    setShowOracle(false)
  }
  function download() {
    if (!finished) return
    const json = adaptivePhaseReceipt(adaptive,fixed)
    const url = URL.createObjectURL(new Blob([JSON.stringify(json,null,2)],{type:'application/json'}))
    const anchor = document.createElement('a')
    anchor.href=url
    anchor.download='nbg-adaptive-phase-keyhole-simulation.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return <section id="adaptive-phase" className="section apk">
    <div className="section-label">NBG · ADAPTIVE PHASE KEYHOLE · SIMULATED</div>
    <div className="apk-introduction">
      <h2>Let the observer <em>choose where to look.</em></h2>
      <p>Eight possible eccentricities, rounded phase measurements, and a limited query budget.
        Instead of picking an angle at random, the observer searches for the measurement
        that best separates the hypotheses still standing.</p>
    </div>
    <div className="apk-shell">
      <div className="apk-left">
        <div className="apk-overview">
          <div><small>CATALOG</small><strong>8</strong><span>declared profiles</span></div>
          <div><small>REMAINING</small><strong>{survivorIds.length}</strong><span>consistent profiles</span></div>
          <div><small>PROBES USED</small><strong>{visibleCount}/{maxQueries}</strong><span>adaptive budget</span></div>
          <div><small>FIXED SCAN</small><strong>{fixedRemaining}</strong><span>survive {visibleCount} probes</span></div>
        </div>
        <PhaseAtlas survivors={survivorIds} visibleSteps={visibleSteps}
          truthId={truthId} showOracle={showOracle}/>
        <div className="apk-controls-play">
          <button className="apk-primary" disabled={finished} onClick={() => setShown(v => v+1)}>
            {finished?'CYCLE COMPLETE':'⊕ Take next probe'}
          </button>
          <button disabled={finished} onClick={() => setShown(adaptive.steps.length)}>▶ Run to stopping point</button>
          <button onClick={() => setShown(0)}>↺ Reset observations</button>
        </div>
        <div className="apk-next">
          <span>{finished ? 'STOP CONDITION' : 'ADAPTIVE SELECTION'}</span>
          <strong>{finished ? adaptive.stopReason.replaceAll('_',' ')
            : next ? 'Next probe: '+next.angle+'°' : 'No additional probe available'}</strong>
          <p>{finished
            ? survivorIds.length === 1
              ? 'Identified one profile within the declared finite catalog. No physical measurement was made.'
              : 'Not fully resolved at this quantization and query budget. Remaining possibilities are preserved.'
            : next
              ? 'One-step minimax: predicted worst-case '+next.worstCase+
                ' survivors; sum of squared partition sizes '+next.pairCount+
                '. Angle selected without consulting the simulated oracle.'
              : 'No further improvement is available under this declared query language.'}</p>
        </div>
        <div className="apk-tiles-title">
          <strong>Hypothesis ledger</strong>
          <label><input type="checkbox" checked={showOracle}
            onChange={event=>setShowOracle(event.target.checked)}/>
            Reveal simulation oracle</label>
        </div>
        <CandidateTiles remaining={survivorIds} truthId={truthId} reveal={showOracle}/>
      </div>
      <aside className="apk-right">
        <div className="apk-panel-heading"><span>EXPERIMENT SETTINGS</span><small>FINITE CLOSED-WORLD SIMULATION</small></div>
        <label htmlFor="apk-truth">Synthetic oracle profile</label>
        <select id="apk-truth" value={truthId}
          onChange={event=>resetParameters(()=>setTruthId(event.target.value))}>
          {PHASE_CATALOG.map(row=><option key={row.id} value={row.id}>
            {row.id} · eccentricity {row.eccentricity.toFixed(2)}</option>)}
        </select>
        <label htmlFor="apk-resolution">Measurement rounding</label>
        <select id="apk-resolution" value={resolutionDegrees}
          onChange={event=>resetParameters(()=>setResolutionDegrees(Number(event.target.value)))}>
          {PHASE_RESOLUTIONS.map(value=><option key={value} value={value}>Nearest {value}°</option>)}
        </select>
        <label htmlFor="apk-budget">Probe budget <strong>{maxQueries}</strong></label>
        <input id="apk-budget" type="range" min="1" max="8" step="1"
          value={maxQueries}
          onChange={event=>resetParameters(()=>setMaxQueries(Number(event.target.value)))}/>
        <div className="apk-compare">
          <div className="apk-compare-head">
            <span>ADAPTIVE VS FIXED CONTROL</span>
            <small>Equal budget · identical simulated oracle</small>
          </div>
          <div className="apk-compare-row"><span>Adaptive probes (full plan)</span>
            <strong>{adaptive.steps.length}</strong></div>
          <div className="apk-compare-row"><span>Fixed-scan probes (full plan)</span>
            <strong>{fixed.steps.length}</strong></div>
          <div className="apk-compare-row"><span>Adaptive final candidates</span>
            <strong>{adaptive.remaining.length}</strong></div>
          <div className="apk-compare-row"><span>Fixed final candidates</span>
            <strong>{fixed.remaining.length}</strong></div>
          <p>Fixed comparison begins at 180°, an intentionally blind angle.
            Improvement in this control is not proof of universal optimality.</p>
        </div>
        <div className="apk-steps">
          <div className="apk-panel-heading"><span>PROBE RECEIPTS</span><small>ROUNDING IS DETERMINISTIC</small></div>
          {visibleSteps.length===0&&<p>Run a probe to create your first observation receipt.</p>}
          {visibleSteps.map(step=><div className="apk-step" key={step.index}>
            <div><span>QUERY {step.index} · {step.angle}°</span>
              <strong>{step.before.length} → {step.after.length}</strong></div>
            <p>Reported {step.outcomeDegrees}° (bucket {step.outcomeBucket}).
              Eliminated {step.eliminationCount} hypotheses.</p>
            <small>Remaining: {step.after.join(', ')}</small>
          </div>)}
        </div>
        <div className="apk-negative">
          <span>NEGATIVE CONTROLS</span>
          <strong>{adaptive.checks.blind180CannotSeparate
            && adaptive.checks.allModelsCloseAfterOneTurn
            && adaptive.checks.truthStillPresent
            && adaptive.checks.neverReusedAngle ? 'PASS' : 'FAILED'}</strong>
          <p>All models close at 360°. Every model agrees at the 180° probe.
            The simulated oracle is never eliminated.</p>
        </div>
        <button className="apk-export" disabled={!finished} onClick={download}>
          ↓ Export full replay receipt
        </button>
        {!finished&&<small className="apk-export-help">Complete the adaptive probe sequence before export.</small>}
      </aside>
    </div>
    <div className="apk-explain">
      <article><span>01 · CHOOSE</span><h3>Minimize the worst bucket.</h3>
        <p>Every unused angle partitions the surviving profiles by predicted
          rounded readings. The greedy selector minimizes the worst-case group size.</p></article>
      <article><span>02 · OBSERVE</span><h3>Reveal only one reading.</h3>
        <p>The synthetic oracle returns a rounded value after the angle is chosen.
          Inconsistent catalog profiles are removed, with a deterministic receipt.</p></article>
      <article><span>03 · REFUSE</span><h3>No invented certainty.</h3>
        <p>If the budget ends or probes cannot split the candidates,
          the unresolved set stays visible. No claim is made outside this toy catalog.</p></article>
    </div>
    <div className="apk-warning"><strong>CLAIM FIREWALL · MODEL-RELATIVE RESULT</strong>
      <p>These are ideal mathematical curves and simulated, deterministically rounded
        oracle measurements. This is a new demonstration, not a previously qualified NBG
        experiment, a calibrated physical sensor result, or evidence of hidden physical residue.
        Existing AH receipts and epistemic authority remain unchanged.</p></div>
  </section>
}
