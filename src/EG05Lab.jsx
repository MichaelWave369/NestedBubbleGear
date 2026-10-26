import { useMemo, useState } from 'react'
import { runEG05 } from './eg05Model.js'
import './eg05Lab.css'

const exp = (value, n=3) => Number(value).toExponential(n)

function SensitivityPlot({report}) {
  const W=680, H=244, l=74, r=28, t=22, b=48
  const dx=W-l-r,dy=H-t-b, rows=report.sourceSweep
  const x=v=>l+(v+35)/35*dx
  const y=v=>t+(41-v)/70*dy
  const d=rows.map((row,i)=>(i?'L':'M')+x(row.log10MuRelative).toFixed(2)+','+
    y(row.log10ConductivitySperM).toFixed(2)).join(' ')
  return <div className="eg05-plot">
    <svg viewBox={'0 0 '+W+' '+H} role="img"
      aria-label="Conditional, disputed Li–Torr 1992 equation 49 log-log inverse square relation, not measurements. One decade change in relative permeability creates two decades of conditional conductivity change.">
      {[-35,-30,-25,-20,-15,-10,-5,0].map(v=><g key={'x'+v}>
        <line x1={x(v)} y1={t} x2={x(v)} y2={t+dy} stroke="rgba(145,212,198,.12)"/>
        <text x={x(v)} y={H-27} fontSize="11" textAnchor="middle" fill="#a3c6bf">{v}</text>
      </g>)}
      {[-29,-15,0,15,30,41].map(v=><g key={'y'+v}>
        <line x1={l} y1={y(v)} x2={l+dx} y2={y(v)} stroke="rgba(145,212,198,.2)" strokeDasharray="3 5"/>
        <text x={l-8} y={y(v)+4} fontSize="11" textAnchor="end" fill="#a3c6bf">{v}</text>
      </g>)}
      <path d={d} stroke="#e7b17f" strokeWidth="2.9" fill="none"/>
      <line x1={x(report.input.log10MuRelative)} y1={t} x2={x(report.input.log10MuRelative)} y2={t+dy}
        stroke="#d6eadc" strokeWidth="1.4" strokeDasharray="5 4"/>
      <circle cx={x(report.input.log10MuRelative)} cy={y(report.conditional.log10ConductivitySperM)}
        r="5" fill="#d6eadc" stroke="#e7b17f" strokeWidth="2"/>
      <text x={W/2} y={H-5} textAnchor="middle" fontSize="11" fill="#c0d7cd">log₁₀ assumed μᵣ · NOT measured</text>
      <text x={l} y={12} fontSize="11" fill="#c0d7cd">log₁₀ conditional σ [S/m]</text>
    </svg>
    <p>Eq. (49) source-estimate scaling only; this graph is <strong>not experimental conductivity or evidence of modified gravity</strong>.</p>
  </div>
}
const DIMENSIONS=[{symbol:'Eq. 46 · conductivity',value:'nˢ q² τ₀ / m',meaning:'Expected [S/m]',key:'eq46Pass'},
 {symbol:'Eq. 47 · relaxation time',value:'ℏ / (2π kᵦ T λ*)',meaning:'Expected seconds',key:'eq47Pass'}]

export default function EG05Lab(){
  const [temperatureK,setTemperatureK]=useState(4)
  const [couplingLambdaStar,setCouplingLambdaStar]=useState(1)
  const [densityExponent,setDensityExponent]=useState(28)
  const [log10MuRelative,setLog10MuRelative]=useState(-20)
  const [penetrationNm,setPenetrationNm]=useState(80)
  const [thicknessNm,setThicknessNm]=useState(400)
  const report=useMemo(()=>runEG05({temperatureK,couplingLambdaStar,densityExponent,
    log10MuRelative,penetrationNm,thicknessNm}),
  [temperatureK,couplingLambdaStar,densityExponent,log10MuRelative,penetrationNm,thicknessNm])
  const reset=()=>{
    setTemperatureK(4);setCouplingLambdaStar(1);setDensityExponent(28)
    setLog10MuRelative(-20);setPenetrationNm(80);setThicknessNm(400)
  }
  const exportReceipt=()=>{
    const data=JSON.stringify({...report,
      protocol:'experiments/EG05/PROTOCOL.md',
      savedAt:new Date().toISOString(),
      disclaimer:'SIMULATED conditional theory sensitivity; not measured gravity or independent derivation of contested theory'},null,2)
    const blob=URL.createObjectURL(new Blob([data],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=blob;a.download='nbg-eg05-source-audit-simulated.json';a.click()
    URL.revokeObjectURL(blob)
  }
  return <section id="eg05" className="eg05-shell" aria-labelledby="eg05-title">
    <div className="eg05-intro">
      <div><span className="research-overline">EG-05 · EQUATION CUSTODY · 1991 / 1992 / 1994 PRIMARY LITERATURE</span>
        <h3 id="eg05-title">Follow the equation. <em>Audit the assumptions.</em></h3>
        <p>Li & Torr's 1992 paper can be read equation by equation. But seeing a formula in print is not the same thing as proving it. This lab separates <strong>ordinary SI dimensional checks</strong>, a <strong>disputed conditional conductivity scaling</strong>, and <strong>unverified source derivations</strong>.</p>
      </div>
      <div className="eg05-stamp"><b>PARTIAL SOURCE CUSTODY</b><span>SIMULATED · AUTHORITY NONE</span><span>No anomalous gravity validated</span></div>
    </div>
    <div className="eg05-roadmap">
      <div><span>1992 EQS. 46–47</span><strong>SI dimensions checked</strong></div>
      <div><span>1992 EQ. 49</span><strong>Conditional shape only</strong></div>
      <div><span>1992 EQS. 48 / 54</span><strong>Derivation unresolved</strong></div>
      <div><span>1991 / KOWITT 1994</span><strong>Full papers pending</strong></div>
    </div>
    <div className="eg05-workbench">
      <div className="eg05-settings">
        <h4>01 / Explicit assumptions</h4>
        <label htmlFor="eg05-temp">Temperature in source reference <output>{temperatureK} K</output></label>
        <input id="eg05-temp" type="range" min="1" max="30" step="1" value={temperatureK} onChange={e=>setTemperatureK(+e.target.value)}/>
        <label htmlFor="eg05-coupling">Assumed dimensionless λ* <output>{couplingLambdaStar.toFixed(1)}</output></label>
        <input id="eg05-coupling" type="range" min=".5" max="5" step=".1" value={couplingLambdaStar} onChange={e=>setCouplingLambdaStar(+e.target.value)}/>
        <label htmlFor="eg05-density">Assumed carrier density <output>10^{densityExponent} m⁻³</output></label>
        <input id="eg05-density" type="range" min="24" max="29" step="1" value={densityExponent} onChange={e=>setDensityExponent(+e.target.value)}/>
        <label htmlFor="eg05-mu">Assumed log₁₀ relative μᵣ <output>{log10MuRelative}</output></label>
        <input id="eg05-mu" type="range" min="-35" max="0" step="1" value={log10MuRelative} onChange={e=>setLog10MuRelative(+e.target.value)}/>
        <p className="eg05-warning-inline">The μᵣ slider is a hypothetical input to a disputed 1992 source approximation. No real material permeability is inferred from it.</p>
        <label htmlFor="eg05-lambda">Conventional London penetration <output>{penetrationNm} nm</output></label>
        <input id="eg05-lambda" type="range" min="30" max="250" step="5" value={penetrationNm} onChange={e=>setPenetrationNm(+e.target.value)}/>
        <label htmlFor="eg05-thick">Conventional slab thickness <output>{thicknessNm} nm</output></label>
        <input id="eg05-thick" type="range" min="40" max="1500" step="20" value={thicknessNm} onChange={e=>setThicknessNm(+e.target.value)}/>
        <div className="eg05-actions"><button onClick={reset} type="button">Reset assumptions</button><button onClick={exportReceipt} type="button">Export simulated ledger</button></div>
      </div>
      <div className="eg05-results">
        <h4>02 / Verified dimensions versus unresolved derivations</h4>
        <div className="eg05-dimensions">
          {DIMENSIONS.map(d=><article key={d.key}>
            <span>{d.symbol}</span><strong>{d.value}</strong><small>{d.meaning}</small>
            <b className="eg05-ok">{report.dimensions[d.key]?'PASS · SI ONLY':'FAIL · DIMENSIONS'}</b>
          </article>)}
          <article><span>Eq. 48 · gravitomagnetic coupling</span><strong>μᵣ, μg, material model</strong><small>Conventions/prefactors not independently derived</small><b className="eg05-hold">UNRESOLVED</b></article>
          <article><span>Eq. 54 · σ–μ model</span><strong>Additional model terms</strong><small>Not equivalent to Eq. 49's approximation</small><b className="eg05-hold">UNRESOLVED</b></article>
        </div>
        <div className="eg05-metrics">
          <div><span>Eq. 47 toy τ₀</span><strong>{exp(report.reference.tauSeconds)} s</strong><small>Finite relaxation reference, not measured</small></div>
          <div><span>Eq. 46 toy σ₀</span><strong>{exp(report.reference.conductivitySperM)} S/m</strong><small>Finite-τ formula, not superconducting DC data</small></div>
          <div><span>Eq. 49 conditional σ</span><strong>10^{report.conditional.log10ConductivitySperM.toFixed(1)} S/m</strong><small>Disputed estimated scaling, not measured</small></div>
          <div><span>London slab R</span><strong>{report.geometricCounterexample.screeningRatio.toFixed(5)}</strong><small>Geometry ratio, NOT the same μᵣ</small></div>
        </div>
        <SensitivityPlot report={report}/>
        <div className="eg05-refusal"><b>KEYHOLE REFUSAL · DO NOT SUBSTITUTE</b>
          <p>Macroscopic London screening ratio <strong>R = {report.geometricCounterexample.screeningRatio.toFixed(5)}</strong> is not authenticated as the microscopic/material permeability in the Li–Torr model. EG-05 will not turn it into a measured μᵣ or a gravity signal.</p>
        </div>
      </div>
    </div>
    <div className="eg05-custody">
      <header>
        <span className="research-overline">03 / SOURCE-BY-SOURCE CUSTODY</span>
        <h4>Every equation has an access level and a claim ceiling.</h4>
        <p>The 1992 scanned paper's printed pages 5493 and 5494 were inspected visually. The 1991 Li–Torr and 1994 Kowitt full derivations are still unverified, so their records remain abstract-only.</p>
      </header>
      <div className="eg05-audit-table">
        <table><thead><tr><th scope="col">Source</th><th scope="col">Actual source access</th><th scope="col">Current audit</th><th scope="col">Blocker</th></tr></thead>
          <tbody>{report.custody.map(row=><tr key={row.id}>
            <td><a target="_blank" rel="noopener noreferrer" href={row.source}>{row.id} ↗</a><small>{row.location}</small></td>
            <td>{row.access.replaceAll('_',' ')}</td>
            <td>{row.reproduction.replaceAll('_',' ')}</td>
            <td>{row.blocked}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="eg05-footer">
        <p><strong>Source checked ≠ theory confirmed.</strong> Units that pass for the ordinary relaxation-time formulas do not validate disputed gravitomagnetic constitutive assumptions. The conditional conductivity graph is an illustration of the *published sensitivity shape*, not an independent physical prediction.</p>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG05/PROTOCOL.md" target="_blank" rel="noopener noreferrer">Open EG-05 complete protocol, source locations and next-stage gates ↗</a>
      </div>
    </div>
  </section>
}
