import { useMemo, useState } from 'react'
import { EG03, solveLondonSlab } from './eg03Model.js'
import './eg03Lab.css'

const f = (n, digits=3) => Number(n).toFixed(digits)
function FieldPlot({report}){
  const w=720,h=260, left=51, top=22, dw=646, dh=187
  const {rows,input}=report, denom=input.surfaceFieldmT||1
  const x=i=>left+i/(rows.length-1)*dw
  const y=b=>top+dh*(1-b/Math.max(input.surfaceFieldmT,1))
  const line=(key)=>rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(r[key]).toFixed(2)).join(' ')
  return <div className="eg03-chart">
    <svg viewBox={'0 0 '+w+' '+h} role="img" aria-label="London slab: separate analytic and independently solved finite-difference magnetic screening traces, compared to an unscreened constant field">
      {[0,.25,.5,.75,1].map(p=><g key={p}>
        <line x1={left} x2={w-23} y1={top+dh*(1-p)} y2={top+dh*(1-p)} stroke="#668a9a" strokeOpacity=".25" strokeDasharray="3 5"/>
        <text x={left-9} y={top+dh*(1-p)+4} textAnchor="end" fontSize="11" fill="#a3c0ca">{Math.round(p*100)}%</text>
      </g>)}
      {[0,.25,.5,.75,1].map(p=><text key={p} x={left+p*dw} y={h-20} fontSize="11" fill="#a3c0ca" textAnchor="middle">{Math.round((p-.5)*input.thicknessNm)}</text>)}
      <path d={line('unscreenedmT')} stroke="#a4b2b7" strokeWidth="2" strokeDasharray="6 7" fill="none"/>
      <path d={line('analyticmT')} stroke="#74e8bc" strokeWidth="3.7" fill="none"/>
      <path d={line('numericalmT')} stroke="#84bfff" strokeWidth="1.9" strokeDasharray="5 2" fill="none"/>
      <text x={left} y="13" fontSize="11" fill="#b5d8df">Applied-field fraction (B / Bₛ)</text>
      <text x={left+dw/2} y={h-3} fontSize="11" fill="#b5d8df" textAnchor="middle">Depth x (nm), slab centered at zero</text>
    </svg>
    <div className="eg03-legend" role="list">
      <span role="listitem"><i style={{background:'#74e8bc'}}/> Analytic cosh</span>
      <span role="listitem"><i style={{background:'#84bfff'}}/> Independent finite difference</span>
      <span role="listitem"><i style={{background:'#a4b2b7'}}/> Unscreened reference</span>
    </div>
    {input.surfaceFieldmT===0&&<p className="eg03-tip">Zero-field negative control: all field and current traces are identically zero. Fractions of a zero field are undefined.</p>}
  </div>
}
function SurfaceCurrent({report}){
  const {rows}=report, max=Math.max(1,...rows.map(x=>Math.abs(x.currentApm2)))
  const w=720,h=125,l=51,dx=646,mid=52,scale=41
  const path=rows.map((r,i)=>(i?'L':'M')+(l+i/(rows.length-1)*dx).toFixed(2)+','+(mid-r.currentApm2/max*scale).toFixed(2)).join(' ')
  return <svg className="eg03-current" viewBox={'0 0 '+w+' '+h} role="img" aria-label="Opposite signed superconducting screening current density at the two slab surfaces, vanishing at the midplane">
    <line x1={l} x2={w-23} y1={mid} y2={mid} stroke="#729baa" strokeDasharray="5 6"/>
    <path d={path} fill="none" stroke="#f0b77c" strokeWidth="2.8"/>
    <text x={l} y="13" fontSize="10" fill="#b5d8df">Jz (A/m²) · opposite screening currents on the two faces</text>
    <text x={l} y="111" fontSize="10" fill="#b5d8df">−d/2</text><text x={l+dx/2} y="111" fontSize="10" textAnchor="middle" fill="#b5d8df">center</text><text x={l+dx} y="111" fontSize="10" textAnchor="end" fill="#b5d8df">+d/2</text>
  </svg>
}
export default function EG03Lab(){
  const [penetrationNm,setPenetrationNm]=useState(EG03.defaults.penetrationNm)
  const [thicknessNm,setThicknessNm]=useState(EG03.defaults.thicknessNm)
  const [surfaceFieldmT,setSurfaceFieldmT]=useState(EG03.defaults.surfaceFieldmT)
  const [nodes,setNodes]=useState(EG03.defaults.nodes)
  const report=useMemo(()=>solveLondonSlab({penetrationNm,thicknessNm,surfaceFieldmT,nodes}),[penetrationNm,thicknessNm,surfaceFieldmT,nodes])
  const fine=useMemo(()=>solveLondonSlab({penetrationNm,thicknessNm,surfaceFieldmT,nodes:201}),[penetrationNm,thicknessNm,surfaceFieldmT])
  const coarse=useMemo(()=>solveLondonSlab({penetrationNm,thicknessNm,surfaceFieldmT,nodes:51}),[penetrationNm,thicknessNm,surfaceFieldmT])
  const reset=()=>{
    setPenetrationNm(80);setThicknessNm(400);setSurfaceFieldmT(10);setNodes(101)
  }
  const exportData=()=>{
    const payload=JSON.stringify({...report,refinement:{
      grid51ErrorMicroT:coarse.metrics.maxAbsErrorMicroT,
      grid201ErrorMicroT:fine.metrics.maxAbsErrorMicroT,
    },protocol:'experiments/EG03/PROTOCOL.md',
      notice:'SIMULATED / AUTHORITY NONE; no physical experiment or new gravitational effect',
      exportedAt:new Date().toISOString()},null,2)
    const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}))
    const a=document.createElement('a');a.href=url;a.download='nbg-eg03-london-synthetic.json';a.click();URL.revokeObjectURL(url)
  }
  return <section className="eg03-shell" id="eg03" aria-labelledby="eg03-title">
    <div className="eg03-intro">
      <div>
        <span className="research-overline">EG-03 · MAXWELL–LONDON · CONVENTIONAL PHYSICS BASELINE</span>
        <h3 id="eg03-title">Inside the <em>Meissner field.</em></h3>
        <p>Superconductors can screen magnetic fields without changing gravity. See how the same static London boundary-value problem is solved two different ways: exact slab mathematics and an independent finite-difference algorithm.</p>
      </div>
      <div className="eg03-stamp"><strong>SIMULATED · E0</strong><span>Authority NONE</span><span>Established theory, not anti-gravity evidence</span></div>
    </div>
    <div className="eg03-formula" aria-label="London equation and finite slab solution">
      <span>∇²B = B / λ²</span><b>→</b><span>B(x) = Bₛ cosh(x/λ) / cosh(d/2λ)</span>
    </div>
    <div className="eg03-workbench">
      <div className="eg03-controls">
        <h4>01 / Set the boundary conditions</h4>
        <label htmlFor="eg03-lambda">Penetration length λ <output>{penetrationNm} nm</output></label>
        <input id="eg03-lambda" type="range" min="30" max="250" step="5" value={penetrationNm} onChange={e=>setPenetrationNm(+e.target.value)}/>
        <label htmlFor="eg03-depth">Slab thickness d <output>{thicknessNm} nm</output></label>
        <input id="eg03-depth" type="range" min="40" max="1500" step="20" value={thicknessNm} onChange={e=>setThicknessNm(+e.target.value)}/>
        <label htmlFor="eg03-field">Both-surface magnetic field Bₛ <output>{f(surfaceFieldmT,1)} mT</output></label>
        <input id="eg03-field" type="range" min="0" max="25" step="1" value={surfaceFieldmT} onChange={e=>setSurfaceFieldmT(+e.target.value)}/>
        <label htmlFor="eg03-grid">Independent numerical grid</label>
        <select id="eg03-grid" value={nodes} onChange={e=>setNodes(+e.target.value)}>
          <option value={51}>51 points · coarse</option>
          <option value={101}>101 points · default</option>
          <option value={201}>201 points · fine</option>
          <option value={401}>401 points · finer</option>
        </select>
        <p className="eg03-tip">Model assumes a static Meissner state in an infinite slab, with parallel field and no vortices, finite edges, thermal variation or gravity terms.</p>
        <div className="eg03-actions"><button type="button" onClick={reset}>Reset</button><button type="button" onClick={exportData}>Export SIMULATED receipt</button></div>
      </div>
      <div className="eg03-results">
        <h4>02 / Compare the field profiles</h4>
        <FieldPlot report={report}/>
        <div className="eg03-stats">
          <div><span>Center screening</span><strong>{surfaceFieldmT===0?'N/A':f((1-report.metrics.centerFraction)*100,2)+'%'}</strong><small>Reduction vs same surface field</small></div>
          <div><span>Center field</span><strong>{f(report.metrics.centerNumericmT,3)} mT</strong><small>Independent numerical solution</small></div>
          <div><span>Max analytical deviation</span><strong>{f(report.metrics.maxAbsErrorMicroT,4)} µT</strong><small>Discretization, not sensor error</small></div>
          <div><span>Grid residual</span><strong>{report.metrics.maxDiscreteResidualT.toExponential(2)} T</strong><small>Equation/solver consistency</small></div>
        </div>
        <h4 className="eg03-current-head">03 / The hidden screening-current layer</h4>
        <SurfaceCurrent report={report}/>
        <p className="eg03-tip">Opposite signed currents run along the two slab faces. Their full signed integral cancels, even while they create nonzero local magnetic screening. This is a direct NBG example of why a coarse zero can hide internal structure.</p>
      </div>
    </div>
    <div className="eg03-audit">
      <div>
        <h4>04 / Mesh-refinement audit</h4>
        <p>These are actual solver outputs for the current parameters, calculated independently of the closed-form profile.</p>
        <div className="eg03-compare">
          <div><span>Coarse · N=51</span><strong>{f(coarse.metrics.maxAbsErrorMicroT,4)} µT</strong></div>
          <div><span>Fine · N=201</span><strong>{f(fine.metrics.maxAbsErrorMicroT,4)} µT</strong></div>
          <div><span>Error ratio</span><strong>{coarse.metrics.maxAbsErrorMicroT===0?'N/A':f(coarse.metrics.maxAbsErrorMicroT/Math.max(fine.metrics.maxAbsErrorMicroT,1e-16),1)+'×'}</strong></div>
        </div>
        <p className="eg03-tip">Finite differences approach the exact London curve when the spatial grid is refined. Zero-field case has exactly zero error, hence no ratio.</p>
      </div>
      <div>
        <h4>05 / Read the research</h4>
        <p><strong>Conventional physics:</strong> Maxwell's static Ampère law plus the second London equation describes exponential-like field screening. It does not predict exotic gravitational enhancement.</p>
        <div className="eg03-links">
          <a target="_blank" rel="noopener noreferrer" href="https://archive.nptel.ac.in/content/storage2/courses/115101012/modules/Module-3/lec2/1.2.html">IIT/NPTEL · London slab derivation ↗</a>
          <a target="_blank" rel="noopener noreferrer" href="https://doi.org/10.1103/PhysRevB.62.115">Peer-reviewed finite-geometry London models ↗</a>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG03/PROTOCOL.md">EG-03 methods, tests and scientific claim boundary ↗</a>
        </div>
        <p className="eg03-tip">EG-03 does <strong>not</strong> reproduce Li–Torr's disputed gravitation equations or Kowitt's critique yet. These require separate primary-text derivation and review.</p>
      </div>
    </div>
  </section>
}
