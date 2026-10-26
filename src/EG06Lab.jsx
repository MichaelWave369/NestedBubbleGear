import { useMemo, useState } from 'react'
import { EG06, runEG06 } from './eg06Model.js'
import './eg06Lab.css'

const fmt=(n,p=4)=>n===null||!Number.isFinite(n)?'REFUSED':Number(n).toFixed(p)
const mn=n=>n===null||!Number.isFinite(n)?'REFUSED':(n*1000).toFixed(3)+' mN'

function Curves({report,massIndex,gradientIndex}){
 const width=730,height=280,left=61,right=28,top=18,bottom=41
 const masses=[...new Set(report.rows.map(x=>x.massKg))].sort((a,b)=>a-b)
 const grad=[...new Set(report.rows.map(x=>x.gradientTPerM))].sort((a,b)=>a-b)
 const rows=report.rows.filter(x=>x.massKg===masses[Math.min(massIndex,masses.length-1)] &&
   x.gradientTPerM===grad[Math.min(gradientIndex,grad.length-1)])
 const values=rows.flatMap(x=>[x.forceN,x.predictedC0N,x.predictedX1N].filter(Number.isFinite))
 const mnY=Math.min(0,...values),mxY=Math.max(0,...values),range=Math.max(mxY-mnY,1e-5)
 const y=v=>top+(mxY-v)/range*(height-top-bottom)
 const x=step=>left+step/11*(width-left-right)
 const line=key=>rows.filter(r=>Number.isFinite(r[key]))
   .map((r,i)=>(i?'L':'M')+x(r.tick).toFixed(2)+','+y(r[key]).toFixed(2)).join(' ')
 const split=(x(8)+x(9))/2
 return <div className="eg06-curve-wrap">
  <svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="Synthetic measured force alongside conventional C0 and generic X1 model predictions, with rightmost three time points reserved for holdout">
    <rect x={split} y={top} width={width-right-split} height={height-top-bottom} fill="#f3c789" fillOpacity=".07"/>
    {[0,.25,.5,.75,1].map(v=><g key={v}>
      <line x1={left} x2={width-right} y1={top+v*(height-top-bottom)} y2={top+v*(height-top-bottom)}
        stroke="#aac6bf" strokeOpacity=".16" strokeDasharray="4 6"/>
      <text x={left-8} y={top+v*(height-top-bottom)+4} fontSize="11" fill="#adc8c1" textAnchor="end">{fmt(1000*(mxY-v*range),1)}</text>
    </g>)}
    {[0,3,6,8,9,11].map(tick=><text key={tick} x={x(tick)} y={height-19} fill="#adc8c1" textAnchor="middle" fontSize="11">{tick}</text>)}
    <path d={line('forceN')} fill="none" stroke="#75e4bd" strokeWidth="3.6"/>
    {report.conventional.identifiable&&<path d={line('predictedC0N')} fill="none" stroke="#b5c4ec" strokeDasharray="6 4" strokeWidth="2.6"/>}
    {report.extra.identifiable&&<path d={line('predictedX1N')} fill="none" stroke="#f3b57d" strokeDasharray="3 3" strokeWidth="2.6"/>}
    <line x1={split} x2={split} y1={top} y2={height-bottom} stroke="#efc087" strokeDasharray="3 5"/>
    <text x={split+5} y={top+12} fontSize="10" fill="#f2c693">HOLDOUT</text>
    <text x={width/2} y={height-3} textAnchor="middle" fill="#adc8c1" fontSize="11">Drive sequence sample</text>
    <text x={left} y="12" fontSize="10" fill="#adc8c1">Force shift (mN)</text>
  </svg>
  <div className="eg06-legend">
   <span><i style={{background:'#75e4bd'}}/>Observed synthetic</span>
   <span><i style={{background:'#b5c4ec'}}/>C0 conventional fit</span>
   <span><i style={{background:'#f3b57d'}}/>X1 generic extra fit</span>
   <span>Shaded = future steps withheld from fitting</span>
  </div>
 </div>
}
export default function EG06Lab(){
 const [massKg,setMassKg]=useState(.1)
 const [gradientTPerM,setGradientTPerM]=useState(.8)
 const [massContrast,setMassContrast]=useState(true)
 const [gradientReversal,setGradientReversal]=useState(true)
 const [massLikeFraction,setMassLikeFraction]=useState(0)
 const [massCorrelatedArtifactFraction,setMassCorrelatedArtifactFraction]=useState(0)
 const [noiseN,setNoiseN]=useState(.0001)
 const [massIndex,setMassIndex]=useState(0)
 const [gradientIndex,setGradientIndex]=useState(0)
 const report=useMemo(()=>runEG06({massKg,gradientTPerM,massContrast,gradientReversal,
   massLikeFraction,massCorrelatedArtifactFraction,noiseN}),[
    massKg,gradientTPerM,massContrast,gradientReversal,massLikeFraction,massCorrelatedArtifactFraction,noiseN])
 const reset=()=>{
  setMassKg(.1);setGradientTPerM(.8);setMassContrast(true);setGradientReversal(true)
  setMassLikeFraction(0);setMassCorrelatedArtifactFraction(0);setNoiseN(.0001)
  setMassIndex(0);setGradientIndex(0)
 }
 const exportReceipt=()=>{
  const json=JSON.stringify({...report,protocol:'experiments/EG06/PROTOCOL.md',
   exportedAt:new Date().toISOString(),
   disclaimer:'SIMULATED only. An X1 model fit never proves modified gravity or Li–Torr.'},null,2)
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}))
  const anchor=document.createElement('a');anchor.href=url
  anchor.download='nbg-eg06-competing-predictions-simulated.json'
  anchor.click();URL.revokeObjectURL(url)
 }
 const rankReady=report.status==='MODEL_COMPARISON_ONLY'
 return <section className="eg06-shell" id="eg06" aria-labelledby="eg06-title">
  <div className="eg06-intro">
   <div>
    <span className="research-overline">EG-06 · CONSTITUTIVE MODELS · COMPETING PREDICTIONS</span>
    <h3 id="eg06-title">Can two causes produce <em>one perfect signal?</em></h3>
    <p>Compare a conventional magnetic/thermal/mechanical force model against a generic mass-scaled extra term. Then inject a different, mass-correlated <strong>ordinary artifact</strong> and watch it fool the same fit. Even good regression cannot resolve a cause the instruments never distinguished.</p>
   </div>
   <aside className="eg06-stamp"><strong>SIMULATED · E0</strong><span>Source/authority: NONE</span><span>Not a Li–Torr prediction</span><span>No gravitational detection</span></aside>
  </div>
  <div className="eg06-models">
   {report.models.map(model=><article key={model.id}>
    <span>{model.id} · {model.origin.replaceAll('_',' ')}</span>
    <strong>{model.label}</strong>
    <code>{model.equation}</code>
    <p>{model.interpretation}</p>
   </article>)}
  </div>
  <div className="eg06-layout">
   <div className="eg06-controls">
    <h4>01 / Construct a synthetic test</h4>
    <label htmlFor="eg06-mass">Reference mass <output>{Math.round(massKg*1000)} g</output></label>
    <input id="eg06-mass" type="range" min=".05" max=".3" step=".01" value={massKg} onChange={e=>setMassKg(+e.target.value)}/>
    <label htmlFor="eg06-gradient">Magnetic gradient magnitude <output>{gradientTPerM.toFixed(2)} T/m</output></label>
    <input id="eg06-gradient" type="range" min=".2" max="2" step=".1" value={gradientTPerM} onChange={e=>setGradientTPerM(+e.target.value)}/>
    <label htmlFor="eg06-extra">Generic mass-like injection <output>{(massLikeFraction*100).toFixed(1)}%</output></label>
    <input id="eg06-extra" type="range" min="0" max=".03" step=".0025" value={massLikeFraction} onChange={e=>setMassLikeFraction(+e.target.value)}/>
    <label htmlFor="eg06-artifact">Mass-correlated artifact injection <output>{(massCorrelatedArtifactFraction*100).toFixed(1)}%</output></label>
    <input id="eg06-artifact" type="range" min="0" max=".03" step=".0025" value={massCorrelatedArtifactFraction} onChange={e=>setMassCorrelatedArtifactFraction(+e.target.value)}/>
    <p className="eg06-help">Both injections are synthetic and can produce exactly the same observed force signature. The physical labels are hidden from the regression.</p>
    <label htmlFor="eg06-noise">Deterministic perturbation</label>
    <select id="eg06-noise" value={noiseN} onChange={e=>setNoiseN(+e.target.value)}>
     <option value={0}>None · noiseless control</option>
     <option value={.0001}>Low · 0.1 mN</option>
     <option value={.0006}>Higher · 0.6 mN</option>
    </select>
    <label className="eg06-check"><input type="checkbox" checked={massContrast} onChange={e=>{setMassContrast(e.target.checked);setMassIndex(0)}}/> Compare M and 2M</label>
    <label className="eg06-check"><input type="checkbox" checked={gradientReversal} onChange={e=>{setGradientReversal(e.target.checked);setGradientIndex(0)}}/> Reverse magnetic-field gradient</label>
    <div className="eg06-actions"><button type="button" onClick={reset}>Reset null</button><button type="button" onClick={exportReceipt}>Export synthetic JSON</button></div>
   </div>
   <div className="eg06-results">
    <h4>02 / Observed force and two fitted predictions</h4>
    <div className="eg06-chart-controls">
     <label htmlFor="eg06-mass-view">Plot mass
      <select id="eg06-mass-view" value={massIndex} onChange={e=>setMassIndex(+e.target.value)}>
       <option value={0}>{Math.round(massKg*1000)} g</option>
       {massContrast&&<option value={1}>{Math.round(2*massKg*1000)} g</option>}
      </select>
     </label>
     <label htmlFor="eg06-grad-view">Plot gradient
      <select id="eg06-grad-view" value={gradientIndex} onChange={e=>setGradientIndex(+e.target.value)}>
       <option value={0}>{gradientReversal?'-':''}{gradientTPerM.toFixed(2)} T/m</option>
       {gradientReversal&&<option value={1}>+{gradientTPerM.toFixed(2)} T/m</option>}
      </select>
     </label>
    </div>
    <Curves report={report} massIndex={massIndex} gradientIndex={gradientIndex}/>
    <div className="eg06-metrics">
     <article><span>Observed fixtures</span><strong>{report.fixture.rows}</strong><small>{report.fixture.training} train / {report.fixture.holdout} holdout</small></article>
     <article><span>C0 holdout RMSE</span><strong>{mn(report.conventional.holdoutRmseN??null)}</strong><small>Conventional-only model</small></article>
     <article><span>X1 holdout RMSE</span><strong>{mn(report.extra.holdoutRmseN??null)}</strong><small>Extra mass term allowed</small></article>
     <article><span>Recovered mass coefficient</span><strong>{rankReady?fmt(100*report.extra.coefficients.massDrive,3)+'%':'REFUSED'}</strong><small>Fitted sum of indistinguishable causes</small></article>
    </div>
    <div className={'eg06-verdict '+(rankReady?'eg06-verdict--ready':'')} aria-live="polite">
     <strong>{rankReady?'MODEL COMPARISON ONLY':'NOT IDENTIFIABLE · OBSERVER REFUSED'}</strong>
     <p>{rankReady
      ?'Both design matrices have full mathematical rank under the frozen synthetic assumptions. A model can be preferred without identifying the actual physical cause.'
      :'One or both control axes are missing. A necessary design matrix is rank-deficient, so the model-comparison result is withheld.'}</p>
     {report.evidence&&<p>ΔBIC (C0 minus X1): <b>{fmt(report.evidence.deltaBIC,2)}</b> · descriptive preference: <b>{report.evidence.favoredByBIC}</b>. This is not an anomalous-gravity significance test.</p>}
    </div>
   </div>
  </div>
  <div className="eg06-audit">
   <article>
    <span className="research-overline">03 / THE CAUSAL-COLLISION TEST</span>
    <h4>Two hidden causes. Identical force observations.</h4>
    <p>Injected extra term <code>f M g I²</code> and mass-correlated conventional pickup <code>c M g I²</code> sum to <code>(f+c) M g I²</code>. No amount of force-only fitting, even with both control contrasts present, can separate the two coefficients. The observer needs an additional independent witness or intervention.</p>
    <p className="eg06-collision">Exact observational collision: <strong>{fmt(100*report.exactCausalCollision.sumFraction,3)}% combined coefficient</strong>. Origin: <strong>NOT PHYSICALLY IDENTIFIABLE</strong>.</p>
   </article>
   <article>
    <span className="research-overline">04 / SCIENTIFIC SOURCE BOUNDARY</span>
    <h4>Published proposals are not validated force laws.</h4>
    <p>Li & Torr proposed gravitational effects in superconductors. Kowitt challenged their permeability assumptions. EG-06 does not implement either contested theory's full predictions. It tests generic causal identifiability using explicitly synthetic fixture coefficients.</p>
    <div className="eg06-links">
     <a target="_blank" rel="noopener noreferrer" href="https://doi.org/10.1103/PhysRevD.43.457">Li & Torr 1991 · theory ↗</a>
     <a target="_blank" rel="noopener noreferrer" href="https://doi.org/10.1103/PhysRevB.46.5489">Li & Torr 1992 · theory ↗</a>
     <a target="_blank" rel="noopener noreferrer" href="https://doi.org/10.1103/PhysRevB.49.704">Kowitt 1994 · critique ↗</a>
     <a target="_blank" rel="noopener noreferrer" href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG06/PROTOCOL.md">EG-06 methods and controls ↗</a>
    </div>
   </article>
  </div>
 </section>
}
