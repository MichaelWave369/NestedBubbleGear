import { useMemo, useState } from 'react'
import {
  DEFAULT_BSR, simulateBodyShip, compareToNull, buildBodyShipReceipt,
} from './bodyShipResonance.js'
import './bodyShipResonanceLab.css'

const PALETTE = ['#73ffc5', '#8bc9ff', '#ffc56f']
const X0 = 156, XSPAN = 408, YC = 250, SCALE = 95
const xFor = time => X0 + time / 12 * XSPAN
const yFor = position => YC - position * SCALE
const plotPath = (samples, channel) => samples.map((row, index) =>
  (index ? 'L' : 'M') + xFor(row.time).toFixed(2) + ',' + yFor(row.q[channel]).toFixed(2)
).join(' ')
const fmt = (value, digits = 5) => Number(value).toFixed(digits)

function WaveDiagram({ candidate, nullControl, rotated, showNull }) {
  const pathSets = useMemo(
    () => [0, 1, 2].map(channel => plotPath(candidate.samples, channel)),
    [candidate],
  )
  const nullPath = useMemo(() => plotPath(nullControl.samples, 0), [nullControl])
  const firstTurns = useMemo(() => [1, 2, 3].map(channel =>
    candidate.turns.find(turn => turn.oscillator === channel),
  ).filter(Boolean), [candidate])

  return (
    <div className="bsr-plot-panel">
      <div className="bsr-plot-heading">
        <span>{rotated ? 'BODY-SHIP VIEW · 90° PROJECTION' : 'WAVE VIEW · TIME HORIZONTAL'}</span>
        <span>Dimensionless synthetic system</span>
      </div>
      <svg viewBox="0 0 720 500" role="img" className="bsr-plot"
        aria-label="Three synthetic oscillator displacement traces. Body-ship view rotates the same plot ninety degrees.">
        <defs>
          <pattern id="bsr-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0 L0 0 0 32" fill="none" stroke="#b3d6ff" strokeOpacity=".08" />
          </pattern>
        </defs>
        <rect width="720" height="500" fill="#050d14" />
        <rect width="720" height="500" fill="url(#bsr-grid)" />
        <g transform={rotated ? 'rotate(90 360 250)' : undefined}>
          <rect x="142" y="116" width="436" height="268" rx="12" fill="#092016" fillOpacity=".46"
            stroke="#73ffc5" strokeOpacity=".24" strokeDasharray="3 8" />
          {[165, 250, 335].map(y => (
            <line key={y} x1={X0} x2={X0 + XSPAN} y1={y} y2={y}
              stroke="#a8bdd4" strokeOpacity=".15" strokeDasharray="5 8" />
          ))}
          <line x1={X0} x2={X0 + XSPAN} y1={YC} y2={YC}
            stroke="#e8fff2" strokeOpacity=".35" />
          {showNull && <path d={nullPath} fill="none" stroke="#fff" strokeOpacity=".34"
            strokeDasharray="7 8" strokeWidth="2.5" />}
          {pathSets.map((path, index) => (
            <path key={index} d={path} fill="none" stroke={PALETTE[index]}
              strokeWidth="3" strokeLinecap="round" />
          ))}
          {firstTurns.map(turn => (
            <circle key={turn.oscillator}
              cx={xFor(turn.time)} cy={yFor(turn.displacement)}
              r="5" fill={PALETTE[turn.oscillator - 1]} stroke="#09120d" strokeWidth="2" />
          ))}
          <text x={X0} y="411" className="bsr-axis">t = 0</text>
          <text x={X0 + XSPAN - 69} y="411" className="bsr-axis">t = 12</text>
          <text x="147" y="102" className="bsr-axis">displacement q (arbitrary units)</text>
        </g>
        <text x="21" y="34" className="bsr-stamp">BSR-1 // SIMULATED</text>
        <text x="21" y="477" className="bsr-stamp">ROTATION CHANGES THE DRAWING, NOT THE PHYSICS</text>
      </svg>
      <div className="bsr-legend">
        {PALETTE.map((color, index) => (
          <span key={color}><i style={{ background: color }} /> Oscillator {index + 1}</span>
        ))}
        {showNull && <span><i className="bsr-null-legend" /> Null trace, oscillator 1</span>}
      </div>
    </div>
  )
}

function saveReceipt(receipt) {
  const blob = new Blob([JSON.stringify(receipt, null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'NBG_BSR1_simulated_receipt.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function BodyShipResonanceLab() {
  const [coupling, setCoupling] = useState(DEFAULT_BSR.coupling)
  const [detuning, setDetuning] = useState(DEFAULT_BSR.detuning)
  const [rotated, setRotated] = useState(false)
  const [showNull, setShowNull] = useState(true)
  const candidate = useMemo(() => simulateBodyShip({ coupling, detuning }), [coupling, detuning])
  const nullControl = useMemo(() => simulateBodyShip({ coupling: 0, detuning }), [detuning])
  const rmsDifference = useMemo(() => compareToNull(candidate, nullControl), [candidate, nullControl])
  const firstTurn = candidate.turns.find(turn => turn.oscillator === 1)
  const presets = [
    { label: 'Uncoupled null', coupling: 0, detuning: 0.16 },
    { label: 'Coupled chain', coupling: 0.24, detuning: 0.16 },
    { label: 'Stronger links', coupling: 0.65, detuning: 0.16 },
  ]

  return <section id="body-ship" className="section bsr-lab">
    <div className="section-label">BSR-1 · RESONANCE / HISTORICAL INSPIRATION</div>
    <h2>Body-Ship <em>Resonance</em></h2>
    <p className="bsr-intro">
      Inspired by Itzhak Bentov's oscillation diagrams and a rotated “body ship” visual
      analogy. This is an original, reproducible numerical toy model, not a model of
      actual human anatomy or a demonstration that energy exits spacetime.
    </p>
    <div className="bsr-workspace">
      <WaveDiagram candidate={candidate} nullControl={nullControl}
        rotated={rotated} showNull={showNull} />
      <div className="bsr-controls">
        <div className="bsr-controls-title">EXPERIMENT CONSOLE <span>UNITS: ABSTRACT</span></div>
        <div className="bsr-presets">
          {presets.map(preset => <button type="button" key={preset.label}
            onClick={() => { setCoupling(preset.coupling); setDetuning(preset.detuning) }}
            aria-pressed={coupling === preset.coupling && detuning === preset.detuning}>
            {preset.label}
          </button>)}
        </div>
        <label className="bsr-slider-label" htmlFor="bsr-coupling">
          Link coupling k <strong>{fmt(coupling, 2)}</strong>
        </label>
        <input id="bsr-coupling" type="range" min="0" max="0.8" step="0.01"
          value={coupling} onChange={event => setCoupling(Number(event.target.value))} />
        <label className="bsr-slider-label" htmlFor="bsr-detuning">
          Frequency spread Δω <strong>{fmt(detuning, 2)}</strong>
        </label>
        <input id="bsr-detuning" type="range" min="0" max="0.45" step="0.01"
          value={detuning} onChange={event => setDetuning(Number(event.target.value))} />
        <div className="bsr-options">
          <label><input type="checkbox" checked={rotated}
            onChange={event => setRotated(event.target.checked)} />
            Rotate plot 90°: body-ship view</label>
          <label><input type="checkbox" checked={showNull}
            onChange={event => setShowNull(event.target.checked)} />
            Show uncoupled negative control</label>
        </div>
        <div className="bsr-metrics">
          <div><small>RMS difference from null</small><strong>{fmt(rmsDifference)}</strong></div>
          <div><small>Max relative energy drift</small><strong>{candidate.maxRelativeEnergyDrift.toExponential(2)}</strong></div>
          <div><small>System energy, initial</small><strong>{fmt(candidate.initialEnergy)}</strong></div>
          <div><small>System energy, final</small><strong>{fmt(candidate.finalEnergy)}</strong></div>
        </div>
        <div className="bsr-turn-note">
          <strong>TURNING POINT PROBE</strong>
          <p>{firstTurn
            ? `Oscillator 1 reverses near t=${fmt(firstTurn.time, 2)} with system energy ${fmt(firstTurn.totalSystemEnergy)} still in the model. Nothing is “clicked out.”`
            : 'No turning point detected in this interval.'}</p>
        </div>
        <button type="button" className="bsr-export"
          onClick={() => saveReceipt(buildBodyShipReceipt(candidate, nullControl, rotated))}>
          Export deterministic JSON ledger receipt
        </button>
      </div>
    </div>
    <div className="bsr-method">
      <article><span>01 / BASELINE</span><h3>Same starting state</h3>
        <p>The uncoupled control sets k=0 while preserving initial conditions, frequencies, and sample times.</p></article>
      <article><span>02 / ENERGY ACCOUNTING</span><h3>No disappearing energy</h3>
        <p>Velocity Verlet estimates conservative motion. A bounded numerical drift is recorded, not hidden.</p></article>
      <article><span>03 / CLAIM BOUNDARY</span><h3>Analogy is not evidence</h3>
        <p>Rotating an SVG is a coordinate choice. It establishes neither an anatomical correspondence nor Bentov's proposed “Absolute.”</p></article>
    </div>
    <p className="bsr-protocol">
      <strong>Research status: SIMULATED.</strong> Oscillators 1–3 are mathematical nodes, not heart,
      breath, or EEG measurements. The only supported result is a comparison of a conservative
      coupled chain with its uncoupled control. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BODY_SHIP_RESONANCE.md">Protocol and falsification rules ↗</a>
    </p>
  </section>
}
