import { useMemo, useState } from 'react'
import { EG01_DEFAULTS, runEG01 } from './eg01Model.js'
import './eg01Lab.css'

const round = (n, places = 4) => Number(n).toFixed(places)
const label = (value) => value === 0 ? '0.00' : Number(value).toFixed(2)

function ForceTrace({ records, paired }) {
  const width = 640, height = 220, left = 51, right = 17, top = 18, bottom = 36
  const drawableWidth = width - left - right
  const drawableHeight = height - top - bottom
  const maximum = Math.max(0.5, ...records.map(row => Math.abs(row.force))) * 1.12
  const x = step => left + step / 35 * drawableWidth
  const y = value => top + drawableHeight / 2 - (value / maximum) * drawableHeight / 2
  const line = orientation => records.filter(row => row.orientation === orientation)
    .map((row, i) => (i === 0 ? 'M' : 'L') + x(row.step).toFixed(2) + ',' + y(row.force).toFixed(2)).join(' ')
  const ticks = [-maximum, 0, maximum]
  return <div className="eg01-plot-wrap">
    <svg className="eg01-plot" viewBox={'0 0 '+width+' '+height} role="img"
      aria-label={'Synthetic force traces in illustrative micro-newtons. Run A displayed'+(paired?' with mirrored fixture run B.':' without mirrored fixture run B.')}>
      {ticks.map(tick => <g key={tick}>
        <line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} stroke="rgba(184,224,205,.23)" strokeDasharray="4 5"/>
        <text x={left-7} y={y(tick)+4} fill="#a4bcad" fontSize="11" textAnchor="end">{tick.toFixed(2)}</text>
      </g>)}
      {[0,8,16,24,35].map(tick=><g key={tick}>
        <line x1={x(tick)} x2={x(tick)} y1={top} y2={height-bottom} stroke="rgba(184,224,205,.1)"/>
        <text x={x(tick)} y={height-bottom+19} fill="#a4bcad" fontSize="11" textAnchor="middle">{tick}</text>
      </g>)}
      <path d={line(1)} fill="none" stroke="#75e5c3" strokeWidth="2.7" strokeLinejoin="round"/>
      {paired && <path d={line(-1)} fill="none" stroke="#f2b56e" strokeWidth="2.7" strokeLinejoin="round"/>}
      <text x={width/2} y={height-3} fill="#a4bcad" fontSize="11" textAnchor="middle">Sample step</text>
      <text x="12" y="14" fill="#a4bcad" fontSize="10">µN</text>
    </svg>
    <div className="eg01-legend">
      <span><i className="eg01-key eg01-key--a"/> A · orientation +1</span>
      {paired && <span><i className="eg01-key eg01-key--b"/> B · mirror −1</span>}
      <span>Deterministic toy data</span>
    </div>
  </div>
}

function Stat({ title, value, description }) {
  return <div className="eg01-stat">
    <span>{title}</span>
    <strong>{value}</strong>
    <small>{description}</small>
  </div>
}

export default function EG01Lab() {
  const [amplitude, setAmplitude] = useState(EG01_DEFAULTS.amplitude)
  const [anomaly, setAnomaly] = useState(EG01_DEFAULTS.anomaly)
  const [paired, setPaired] = useState(EG01_DEFAULTS.paired)
  const [noise, setNoise] = useState(EG01_DEFAULTS.noise)
  const report = useMemo(()=>runEG01({amplitude,anomaly,paired,noise}),[amplitude,anomaly,paired,noise])
  const fitted = report.estimate
  const reset=()=>{setAmplitude(1);setAnomaly(0);setPaired(true);setNoise(.003)}
  const exportReceipt=()=>{
    const body=JSON.stringify({ ...report, protocol:'experiments/EG01/PROTOCOL.md',
      exportedAt:new Date().toISOString(), notice:'Synthetic browser receipt, no empirical gravity observation' },null,2)
    const url=URL.createObjectURL(new Blob([body],{type:'application/json'}))
    const anchor=document.createElement('a')
    anchor.href=url
    anchor.download='nbg-eg01-simulated-receipt.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return <section className="eg01-shell" id="eg01" aria-labelledby="eg01-title">
    <div className="eg01-head">
      <div>
        <div className="research-overline">EG-01 · EXOTIC PROPULSION CLAIMS / CONVENTIONAL CONTROLS</div>
        <h3 id="eg01-title">Coupled field <em>observability lab.</em></h3>
        <p>Inspired by Amy Eskridge's 2018 historical survey. A synthetic force can look mysterious until we measure the hidden electrical, thermal and mechanical pathways. Try injecting a hypothetical extra term, then switch the observer.</p>
      </div>
      <div className="eg01-status">
        <b>SIMULATED · E0</b>
        <span>Not an anti-gravity experiment</span>
        <span>No sensors or external APIs</span>
      </div>
    </div>
    <div className="eg01-pipeline" aria-label="Model pathway">
      <span>DRIVE I(t)</span><b aria-hidden="true">→</b>
      <span>MAGNETIC / THERMAL / MOTION / HYPOTHETICAL</span><b aria-hidden="true">→</b>
      <span>FORCE KEYHOLE y(t)</span>
    </div>
    <div className="eg01-workbench">
      <div className="eg01-controls">
        <h4>01 / Configure the system</h4>
        <label htmlFor="eg01-drive">Drive amplitude <output>{label(amplitude)}×</output></label>
        <input id="eg01-drive" type="range" min=".5" max="1.5" step=".05" value={amplitude}
          onChange={e=>setAmplitude(Number(e.target.value))}/>
        <label htmlFor="eg01-anomaly">Synthetic extra coupling α <output>{label(anomaly)} µN/I²</output></label>
        <input id="eg01-anomaly" type="range" min="0" max=".25" step=".01" value={anomaly}
          onChange={e=>setAnomaly(Number(e.target.value))}/>
        <p className="eg01-hint">The α control injects a fictional signal for testing whether our inference can recover it. It never represents a measured force.</p>
        <label htmlFor="eg01-noise">Synthetic perturbation</label>
        <select id="eg01-noise" value={noise} onChange={e=>setNoise(Number(e.target.value))}>
          <option value={0}>Off · exact controls</option>
          <option value={.003}>Low · default</option>
          <option value={.015}>Higher · stress test</option>
        </select>
        <label className="eg01-check">
          <input type="checkbox" checked={paired} onChange={e=>setPaired(e.target.checked)}/>
          <span>Collect matched mirrored-fixture run</span>
        </label>
        <p className="eg01-hint">Only the magnetic pickup reverses sign in this <strong>assumed toy geometry</strong>. The extra term is unchanged by construction.</p>
        <div className="eg01-actions">
          <button type="button" onClick={reset}>Reset null</button>
          <button type="button" onClick={exportReceipt}>Export JSON receipt</button>
        </div>
      </div>
      <div className="eg01-results">
        <h4>02 / Observe the force Keyhole</h4>
        <ForceTrace records={report.records} paired={paired}/>
        <div className="eg01-stats">
          <Stat title="Injection ground truth" value={round(anomaly,3)+' µN/I²'} description={anomaly===0?'Null candidate: α = 0':'You inserted this in software'}/>
          <Stat title="Recovered α (OLS)" value={fitted?round(fitted.anomaly,4)+' µN/I²':'NOT IDENTIFIABLE'} description={fitted?'Assumption-dependent toy fit':'Magnetic pickup and extra term collide'}/>
          <Stat title="Fit residual (RMSE)" value={fitted?round(fitted.rmse,5)+' µN':'NOT ESTIMATED'} description={fitted?'Deterministic injected perturbation':'Requires independent mirrored run'}/>
        </div>
        <p className={fitted?'eg01-verdict eg01-verdict--paired':'eg01-verdict'} aria-live="polite">
          {fitted
            ? 'EXPANDED KEYHOLE · The chosen mirrored fixture and calibrated proxy features separate two toy coefficients. This is not an experimental gravity detection.'
            : 'COARSE KEYHOLE · An ordinary pickup β and the hypothetical α share the same I² signature. One orientation cannot distinguish them, even without noise.'}
        </p>
      </div>
    </div>
    <div className="eg01-bottom">
      <div>
        <h4>03 / Reality and scale checks</h4>
        <p>At 10 T throughout 1 m³, the stored magnetic energy is about <strong>{(report.scale.joules/1e6).toFixed(1)} MJ</strong>.
          Its mass equivalent is <strong>{report.scale.massEquivalentKg.toExponential(2)} kg</strong>, implying a point-source acceleration scale near <strong>{report.scale.accelerationMps2.toExponential(2)} m/s²</strong> at 1 m.
          This crude energy scale is not the toy force scale and not a full general-relativistic magnet calculation.</p>
      </div>
      <div>
        <h4>Source and claim boundary</h4>
        <p>This module is a causal-identifiability demonstration, <strong>not</strong> a numerical reproduction of Li–Torr, a superconductivity simulation, or validation of any gravity-modification claim.</p>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG01/PROTOCOL.md"
          target="_blank" rel="noopener noreferrer">Open EG-01 source, assumptions & primary references ↗</a>
      </div>
    </div>
  </section>
}
