import { useEffect, useMemo, useState } from 'react'
import { analyzePhaseClosure, buildPhaseReceipt, KEYHOLES } from './phaseClosureMath.js'
import './phaseClosureLab.css'

const WIDTH = 708, X0 = 52, XSPAN = 608
const presetOptions = [
  { id: 'CIRCLE_ELLIPSE', label: 'Circular → elliptical', a: 0, b: .32 },
  { id: 'NEGATIVE', label: 'Negative control · both circular', a: 0, b: 0 },
  { id: 'SAME_ELLIPSE', label: 'Matched ellipses', a: .32, b: .32 },
  { id: 'DIFFERENT', label: 'Two elliptical profiles', a: .16, b: .48 },
]
const atX = degrees => X0 + XSPAN * degrees / 360
const phaseY = degrees => 264 + degrees * .605
const speedY = ratio => 146 + 79 * Math.log(-ratio)
function lineFor(rows, value, mode) {
  return rows.map((r, i) =>
    (i === 0 ? 'M' : 'L') + atX(r.inputDegrees).toFixed(2) + ',' +
    (mode === 'ratio' ? speedY(r[value]) : phaseY(r[value])).toFixed(2)
  ).join(' ')
}
function metricNumber(value) { return Number(value).toFixed(5) }
function ScopePlot({ result }) {
  const { keyhole, probeDegrees } = result.settings
  const [aPath, bPath] = useMemo(() => {
    const ratio = keyhole === 'SPEED_TRACE'
    return [
      lineFor(result.rows, ratio ? 'referenceRatio' : 'referenceDegrees', ratio ? 'ratio' : 'phase'),
      lineFor(result.rows, ratio ? 'comparisonRatio' : 'comparisonDegrees', ratio ? 'ratio' : 'phase'),
    ]
  }, [result, keyhole])
  const isSpeed = keyhole === 'SPEED_TRACE'
  const showTrace = keyhole === 'PHASE_TRACE' || isSpeed
  const y0 = isSpeed ? speedY(-1) : phaseY(0)
  const y1 = isSpeed ? speedY(-1) : phaseY(-360)
  const probeAngle = probeDegrees * Math.PI / 180
  const probeA = useMemo(() =>
    analyzePhaseClosure({
      referenceE: result.settings.referenceE, comparisonE: result.settings.comparisonE,
      probeDegrees, keyhole: 'PROBE', samples: 16,
    }).probeDifferenceDegrees,
  [result.settings.referenceE, result.settings.comparisonE, probeDegrees])
  // The exact local phase values come from the same model as the endpoints.
  const probeRow = useMemo(() => {
    const eA = result.settings.referenceE, eB = result.settings.comparisonE
    const qA = (1 - eA) / (1 + eA), qB = (1 - eB) / (1 + eB)
    const phase = q => -2 * Math.atan2(q * Math.sin(probeAngle / 2), Math.cos(probeAngle / 2)) * 180 / Math.PI
    return { reference: phase(qA), comparison: phase(qB) }
  }, [result.settings.referenceE, result.settings.comparisonE, probeAngle])
  const peakDegrees = isSpeed ? result.speedPeak.inputDegrees : result.phasePeak.inputDegrees
  return <div className="pcl-plotbox">
    <div className="pcl-plot-head">
      <span>{isSpeed ? 'VELOCITY-RATIO TRAJECTORY' : 'UNWRAPPED OUTPUT PHASE'}</span>
      <span className="pcl-legend"><i className="pcl-reference"/> Reference <i className="pcl-candidate"/> Comparison</span>
    </div>
    <svg viewBox={'0 0 '+WIDTH+' 306'} role="img" className="pcl-plot"
      aria-label={keyhole === 'ENDPOINT' ? 'Only two endpoint observations are shown'
        : keyhole === 'PROBE' ? 'Endpoint observations and one measured intermediate phase are shown'
        : isSpeed ? 'Two sampled instantaneous speed-ratio traces' : 'Two sampled output-phase histories'}>
      <defs><pattern id="pcl-grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0 L0 0 0 32" fill="none" stroke="#73ffc5" strokeOpacity=".075"/>
      </pattern></defs>
      <rect width={WIDTH} height="306" fill="url(#pcl-grid)"/>
      <path d={'M'+X0+',24 V275 H'+(X0+XSPAN)} fill="none" stroke="#86a89a" strokeWidth="1.1"/>
      <line x1={X0} x2={X0+XSPAN} y1={isSpeed?speedY(-1):phaseY(-180)}
        y2={isSpeed?speedY(-1):phaseY(-180)}
        stroke="#86a89a" opacity=".3" strokeDasharray="5 7"/>
      <text x="6" y="28" className="pcl-axis">{isSpeed ? 'ratio' : '0°'}</text>
      {!isSpeed && <><text x="6" y={phaseY(-180)} className="pcl-axis">−180°</text>
        <text x="6" y={phaseY(-360)} className="pcl-axis">−360°</text></>}
      <text x={X0} y="295" className="pcl-axis">0° input</text>
      <text x={X0+XSPAN-72} y="295" className="pcl-axis">360° input</text>
      {showTrace && <>
        <path d={aPath} className="pcl-line-a"/>
        <path d={bPath} className="pcl-line-b"/>
        <line x1={atX(peakDegrees)} x2={atX(peakDegrees)} y1="24" y2="275"
          stroke="#ffc56f" strokeDasharray="4 6" opacity=".65"/>
      </>}
      {!isSpeed && (keyhole === 'ENDPOINT' || keyhole === 'PROBE') && <>
        {[X0, X0+XSPAN].map((x,i)=><g key={i}>
          <circle cx={x} cy={i ? y1 : y0} r="8" stroke="#8bc9ff" fill="#07130e" strokeWidth="2"/>
          <circle cx={x} cy={i ? y1 : y0} r="3.8" fill="#73ffc5"/>
        </g>)}
      </>}
      {keyhole === 'PROBE' && <>
        <line x1={atX(probeDegrees)} x2={atX(probeDegrees)}
          y1="24" y2="275" stroke="#ffc56f" strokeDasharray="5 5"/>
        <circle cx={atX(probeDegrees)} cy={phaseY(probeRow.reference)}
          r="6" fill="#73ffc5"/>
        <circle cx={atX(probeDegrees)} cy={phaseY(probeRow.comparison)}
          r="4.2" fill="#8bc9ff" stroke="#07130e" strokeWidth=".8"/>
      </>}
    </svg>
    <div className="pcl-plot-footer">
      {keyhole === 'ENDPOINT' && 'O₀ deliberately hides intermediate motion. Coincident endpoint marks do not establish identical paths.'}
      {keyhole === 'PROBE' && 'Single-probe measurement at '+probeDegrees+'°: '+Math.abs(probeA).toFixed(4)+'° of output-phase separation.'}
      {keyhole === 'PHASE_TRACE' && 'Finite sample trace. Largest observed phase difference: '+Math.abs(result.phasePeak.differenceDegrees).toFixed(4)+'°.'}
      {keyhole === 'SPEED_TRACE' && 'Finite sample trace. Largest observed velocity-ratio difference: '+Math.abs(result.speedPeak.difference).toFixed(5)+'.'}
    </div>
  </div>
}
export default function PhaseClosureLab() {
  const [referenceE, setReferenceE] = useState(0)
  const [comparisonE, setComparisonE] = useState(.32)
  const [keyhole, setKeyhole] = useState('ENDPOINT')
  const [probeDegrees, setProbeDegrees] = useState(90)
  const [samples, setSamples] = useState(128)
  const [retainHistory, setRetainHistory] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const result = useMemo(() => analyzePhaseClosure({
    referenceE, comparisonE, keyhole, probeDegrees, samples, retainHistory,
  }), [referenceE, comparisonE, keyhole, probeDegrees, samples, retainHistory])
  const negativeControl = useMemo(() => analyzePhaseClosure({
    referenceE: 0, comparisonE: 0, keyhole: 'PHASE_TRACE', samples,
  }), [samples])
  useEffect(() => {
    if (!sweeping || keyhole !== 'PROBE') return undefined
    let frame, previous
    const tick = now => {
      if (previous !== undefined) {
        setProbeDegrees(current => (current + Math.min((now-previous)/1000, .05)*30)%360)
      }
      previous = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [sweeping, keyhole])
  function usePreset(preset) {
    setReferenceE(preset.a)
    setComparisonE(preset.b)
    setSweeping(false)
  }
  function downloadReceipt() {
    const receipt = buildPhaseReceipt(result)
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'nbg-phase-closure-simulation-receipt.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const controlPass = negativeControl.checks.endpointClosure
    && !negativeControl.observers.PHASE_TRACE.distinguishes
    && !negativeControl.observers.SPEED_TRACE.distinguishes
  const observedValue = result.observed.unit === 'ratio'
    ? metricNumber(result.observed.difference)
    : (result.observed.difference * 180 / Math.PI).toFixed(5)+'°'
  return <section id="phase-closure" className="section pcl">
    <div className="section-label">NBG · PHASE &amp; CLOSURE LAB · SIMULATED</div>
    <div className="pcl-heading">
      <h2>Same return. <em>Different journey.</em></h2>
      <p>Two ideal elliptical pitch systems make the same net output revolution.
        Can an observer tell them apart? Change what the observer is permitted to see,
        then try to hide the difference with a deliberately bad measurement.</p>
    </div>
    <div className="pcl-workspace">
      <div className="pcl-observation">
        <div className="pcl-section-label">01 · SELECT THE OBSERVER KEYHOLE</div>
        <div className="pcl-keyholes" role="group" aria-label="Observation keyhole">
          {KEYHOLES.map(channel=><button key={channel.id}
            aria-pressed={keyhole===channel.id}
            className={keyhole===channel.id?'pcl-keyhole active':'pcl-keyhole'}
            onClick={()=>{setKeyhole(channel.id);setSweeping(false)}}>
            <strong>{channel.name}</strong><small>{channel.description}</small>
          </button>)}
        </div>
        <ScopePlot result={result}/>
        <div className="pcl-observation-summary">
          <span>OBSERVER VERDICT</span>
          <strong className={result.observed.distinguishes?'pcl-found':'pcl-hidden'}>
            {result.observed.distinguishes?'DISTINGUISHABLE':'INDISTINGUISHABLE AT THIS KEYHOLE'}
          </strong>
          <p>{result.observed.distinguishes
            ? 'A difference is accessible through the selected observation channel.'
            : 'This channel does not resolve a difference. That alone does not prove the underlying histories match.'}</p>
          <div className="pcl-metric-grid">
            <div><small>OBSERVED DIFFERENCE</small><strong>{observedValue}</strong></div>
            <div><small>ENDPOINT CLOSURE</small>
              <strong>{result.checks.endpointClosure?'BOTH CLOSE':'CHECK FAILED'}</strong></div>
            <div><small>FULL CYCLE OUTPUT</small><strong>−360° / −360°</strong></div>
            <div><small>CONTACT CONSTRAINT</small>
              <strong>{result.checks.pitchContactConsistent?'WITHIN TOLERANCE':'CHECK FAILED'}</strong></div>
          </div>
        </div>
      </div>
      <div className="pcl-console">
        <div className="pcl-section-label">02 · CONFIGURE THE EXPERIMENT</div>
        <div className="pcl-presets">
          {presetOptions.map(preset=><button key={preset.id}
            onClick={()=>usePreset(preset)}
            aria-pressed={referenceE===preset.a && comparisonE===preset.b}>
            {preset.label}
          </button>)}
        </div>
        <label className="pcl-range-label" htmlFor="pcl-ref">Reference eccentricity <strong>{referenceE.toFixed(2)}</strong></label>
        <input id="pcl-ref" type="range" min="0" max=".55" step=".01"
          value={referenceE} onChange={event=>setReferenceE(Number(event.target.value))}/>
        <label className="pcl-range-label" htmlFor="pcl-comp">Comparison eccentricity <strong>{comparisonE.toFixed(2)}</strong></label>
        <input id="pcl-comp" type="range" min="0" max=".55" step=".01"
          value={comparisonE} onChange={event=>setComparisonE(Number(event.target.value))}/>
        <div className="pcl-probe-controls">
          <label className="pcl-range-label" htmlFor="pcl-probe">One-probe angle <strong>{probeDegrees.toFixed(1)}°</strong></label>
          <div className="pcl-mini-actions">
            <button onClick={()=>{setProbeDegrees(90);setKeyhole('PROBE');setSweeping(false)}}>90° · Witness</button>
            <button onClick={()=>{setProbeDegrees(180);setKeyhole('PROBE');setSweeping(false)}}>180° · Blind spot</button>
            <button onClick={()=>{setKeyhole('PROBE');setSweeping(v=>!v)}}>{sweeping&&keyhole==='PROBE'?'Ⅱ Stop scan':'▶ Scan'}</button>
          </div>
          <input id="pcl-probe" type="range" min="0" max="360" step=".5"
            value={probeDegrees} onChange={event=>{setProbeDegrees(Number(event.target.value));setKeyhole('PROBE');setSweeping(false)}}/>
        </div>
        <label className="pcl-select-label" htmlFor="pcl-samples">Sample resolution
          <select id="pcl-samples" value={samples}
            onChange={event=>setSamples(Number(event.target.value))}>
            <option value={32}>32 intervals</option>
            <option value={64}>64 intervals</option>
            <option value={128}>128 intervals</option>
            <option value={256}>256 intervals</option>
          </select>
        </label>
        <label className="pcl-retain"><input type="checkbox" checked={retainHistory}
          onChange={event=>setRetainHistory(event.target.checked)}/>
          Retain the sampled motion history in an explicit observer log</label>
        <div className="pcl-controls-report">
          <span>NEGATIVE CONTROL · CIRCLE VS CIRCLE</span>
          <strong className={controlPass?'pcl-pass':'pcl-fail'}>{controlPass?'PASS · NO DIFFERENCE':'FAILED CHECK'}</strong>
          <span>MEMORY / RESIDUE STATUS</span>
          <strong>{result.retainedMemoryStatus.replaceAll('_',' ')}</strong>
          <p>Adding a stored trace changes the observer's information.
            It does not demonstrate a physical residue in either gear.</p>
        </div>
        <button className="pcl-export" onClick={downloadReceipt}>↓ Export deterministic simulation receipt (JSON)</button>
      </div>
    </div>
    <div className="pcl-method">
      <article><span>O₀</span><h3>Closure is coarse.</h3>
        <p>Same output after 360° says nothing about how fast the two outputs
          turned in between. The endpoint keyhole discards that information.</p></article>
      <article><span>O₁</span><h3>The blind-probe trap.</h3>
        <p>Even mismatched ellipses meet at −180° when the input reaches 180°.
          A single poorly chosen probe can falsely suggest matching trajectories.</p></article>
      <article><span>O₂ / O₃</span><h3>A history witness, not magic.</h3>
        <p>A sampled phase or speed trace can distinguish the two models.
          The trace is evidence of their paths, not proof of hidden physical energy.</p></article>
    </div>
    <div className="pcl-footnote">
      <strong>CLAIM FIREWALL · SIMULATION ONLY</strong>
      <p>Analytic elliptical-pitch model, deterministic sampling, user-selected tolerance
        and explicitly simulated provenance. Neither the AH-series ledger nor any frozen
        experimental claim is modified. See <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/PHASE_CLOSURE_LAB.md"
          target="_blank" rel="noreferrer">the protocol notes ↗</a> after merge.</p>
    </div>
  </section>
}
