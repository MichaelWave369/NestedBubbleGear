import { useMemo, useState } from 'react'
import {NI1,generateNI1,analyzeNI1,detachedDonorSwap,hiddenStateWitness,ni1Receipt} from './ni1Model.js'
import './ni1Lab.css'

const WORLDS=[
  {id:'null',label:'A · No pathway',detail:'Independent noise plus the documented common stimulus'},
  {id:'pathway',label:'B · Conventional pathway',detail:'Known delayed neuroimmune edge injected by software'},
  {id:'shared-driver',label:'C · Shared-driver impostor',detail:'Same external stimulus influences both traces; no brain-to-cell edge'},
  {id:'detached',label:'D · Detached sample',detail:'Post-collection donor state cannot enter a local sample'},
  {id:'artifact',label:'E · Instrument artifact',detail:'Recorded nuisance masquerades as donor-related signal'},
]
const fmt=(x,d=3)=>Number.isFinite(x)?x.toFixed(d):'REFUSED'
const polyline=(rows,key,left,top,width,height,min,max)=>{
  const span=Math.max(max-min,1e-5)
  return rows.map((r,i)=>(i?'L':'M')+(left+i/(rows.length-1)*width).toFixed(1)+','+
    (top+(max-r[key])/span*height).toFixed(1)).join(' ')
}
function Trace({report}){
  const width=820,height=300,left=55,right=20,top=29,bottom=43
  const rows=report.predictions
  const vals=rows.flatMap(r=>[r.immune,r.predicted0,r.predicted1])
  const min=Math.min(...vals)-.1,max=Math.max(...vals)+.1
  const plotWidth=width-left-right,plotHeight=height-top-bottom
  const split=left+(NI1.trainingEnds-1)/(NI1.total-1)*plotWidth
  return <div className="ni1-chart-scroll">
    <svg viewBox={'0 0 '+width+' '+height} role="img"
      aria-label="Synthetic immune marker and two one-step toy model forecasts. Shaded final section is untouched holdout.">
      <rect x={left} y={top} width={plotWidth} height={plotHeight} rx="5" fill="#081920"/>
      <rect x={split} y={top} width={left+plotWidth-split} height={plotHeight} fill="#c9a46c" fillOpacity=".13"/>
      {[0,.25,.5,.75,1].map(f=><g key={f}>
        <line x1={left} y1={top+f*plotHeight} x2={left+plotWidth} y2={top+f*plotHeight}
          stroke="#adcfdb" strokeOpacity=".16" strokeDasharray="4 6"/>
        <text x={left-8} y={top+f*plotHeight+4} textAnchor="end" fontSize="11" fill="#a7c2cd">
          {fmt(max-f*(max-min),2)}
        </text>
      </g>)}
      <line x1={split} y1={top} x2={split} y2={top+plotHeight} stroke="#ffcf8a" strokeDasharray="4 5"/>
      <text x={split+7} y={top+13} fill="#ffd79b" fontSize="11">HOLDOUT</text>
      <path d={polyline(rows,'immune',left,top,plotWidth,plotHeight,min,max)}
        stroke="#75e4bd" strokeWidth="3" fill="none"/>
      <path d={polyline(rows,'predicted0',left,top,plotWidth,plotHeight,min,max)}
        stroke="#a9b9e8" strokeWidth="2" strokeDasharray="7 4" fill="none"/>
      <path d={polyline(rows,'predicted1',left,top,plotWidth,plotHeight,min,max)}
        stroke="#f6b77d" strokeWidth="2" strokeDasharray="3 4" fill="none"/>
      <text x={left} y="17" fill="#b2cdd3" fontSize="12">Dimensionless illustrative immune marker</text>
      <text x={left} y={height-9} fill="#b2cdd3" fontSize="11">t = 0</text>
      <text x={left+plotWidth} y={height-9} textAnchor="end" fill="#b2cdd3" fontSize="11">t = {NI1.total-1}</text>
    </svg>
    <div className="ni1-chart-key">
      <span><i style={{background:'#75e4bd'}}/>Generated observation</span>
      <span><i style={{background:'#a9b9e8'}}/>M0 conventional baseline</span>
      <span><i style={{background:'#f6b77d'}}/>M1 candidate lag</span>
    </div>
  </div>
}
export default function NI1Lab(){
  const [world,setWorld]=useState('pathway')
  const [seed,setSeed]=useState(369)
  const [observeNuisance,setObserveNuisance]=useState(true)
  const recording=useMemo(()=>generateNI1({world,seed}),[world,seed])
  const report=useMemo(()=>analyzeNI1(recording,{observeNuisance}),[recording,observeNuisance])
  const swap=useMemo(()=>detachedDonorSwap(seed),[seed])
  const witness=useMemo(()=>hiddenStateWitness(),[])
  const exportReceipt=()=>{
    const payload=JSON.stringify(ni1Receipt(recording,report),null,2)+'\n'
    const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}))
    const a=document.createElement('a');a.href=url;a.download='nbg-ni1-e1-SIMULATED.json'
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
  }
  return <section className="ni1-shell" id="ni1" aria-labelledby="ni1-title">
    <div className="ni1-hero">
      <div>
        <span className="research-overline">NI1 · NEUROIMMUNE CAUSAL KEYHOLES · E1</span>
        <h3 id="ni1-title">A brain signal, a blood sample, <em>and a false connection.</em></h3>
        <p>Explore five invented worlds that separate ordinary neural–immune feedback, shared inputs,
          post-collection history and measurement artifacts. Compare a known conventional model
          with a fitted candidate using future points held out from training.</p>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/NI1/E1_PROTOCOL.md"
          target="_blank" rel="noopener noreferrer">Review E1 synthetic protocol ↗</a>
      </div>
      <aside className="ni1-stamp">
        <strong>SIMULATED · AUTHORITY NONE</strong>
        <span>Invented dimensionless parameters</span>
        <span>No living subjects or blood tests</span>
        <span>No remote consciousness signal</span>
      </aside>
    </div>
    <div className="ni1-layout">
      <div className="ni1-controls">
        <h4>01 / Select an invented world</h4>
        <fieldset>
          <legend>Simulation model</legend>
          {WORLDS.map(item=><label className={'ni1-world'+(world===item.id?' active':'')} key={item.id}>
            <input type="radio" name="ni1-world" value={item.id}
              checked={world===item.id} onChange={()=>setWorld(item.id)}/>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
          </label>)}
        </fieldset>
        <label className="ni1-seed" htmlFor="ni1-seed">
          <span>Replay seed</span>
          <input id="ni1-seed" type="number" min="1" max="2147483647" step="1" value={seed}
            onChange={e=>{
              const candidate=Number(e.target.value)
              if(Number.isSafeInteger(candidate)&&candidate>=1&&candidate<=2147483647)setSeed(candidate)
            }}/>
        </label>
        <label className="ni1-checkbox">
          <input type="checkbox" checked={observeNuisance} onChange={e=>setObserveNuisance(e.target.checked)}/>
          Include recorded instrument nuisance in baseline
        </label>
        <p className="ni1-footnote">Unchecking the nuisance control in world E can make an ordinary artifact look like an extra pathway. That remains a refusal, not a discovery.</p>
        <button type="button" onClick={exportReceipt}>Export SIMULATED JSON receipt</button>
      </div>
      <div className="ni1-output">
        <div className="ni1-metrics">
          <article><span>Conventional holdout error</span><strong>{fmt(report.metrics.baselineHoldoutRMSE,4)}</strong></article>
          <article><span>Added-lag holdout error</span><strong>{fmt(report.metrics.candidateHoldoutRMSE,4)}</strong></article>
          <article><span>Fitted neural coefficient</span><strong>{fmt(report.estimates.candidateNeural,4)}</strong></article>
        </div>
        <div className="ni1-conclusion" aria-live="polite">
          <strong>{report.status}</strong>
          <p>Window: {report.trainingCount} training observations, {report.holdoutCount} future holdout observations.
            The regression uses the declared synthetic recurrence and does not identify a real-world cause.
            Raw correlation {fmt(report.metrics.rawCorrelation)} cannot distinguish common inputs from transmission.</p>
        </div>
        <Trace report={report}/>
      </div>
    </div>
    <div className="ni1-control-grid">
      <article>
        <span className="research-overline">02 / DONOR-SWAP NEGATIVE CONTROL</span>
        <h4>Disconnected means disconnected.</h4>
        <p>Change only the synthetic donor's state <strong>after</strong> the sample is removed. Under the conventional isolated-sample model, the sample's future trajectory must be exactly invariant.</p>
        <dl><div><dt>Maximum post-detachment sample change</dt><dd>{fmt(swap.postDetachDifference,6)}</dd></div>
          <div><dt>Stored pre-detachment history changes sample?</dt><dd>{swap.beforeSeparationChangesSample?'YES':'NO'}</dd></div>
        </dl>
        <small>Negative control: {swap.invariantAfterSeparation?'PASS':'FAIL'} · SIMULATED only</small>
      </article>
      <article>
        <span className="research-overline">03 / FORMAL KEYHOLE WITNESS</span>
        <h4>Same observable. Different future.</h4>
        <p>Two hidden synthetic material states share K0's initial output of {fmt(witness.initialOutput)}. A declared future probe separates their readings into {fmt(witness.futureA)} and {fmt(witness.futureB)}.</p>
        <dl><div><dt>Initial observed difference</dt><dd>0.000</dd></div>
          <div><dt>Future observed difference</dt><dd>{fmt(witness.separation)}</dd></div>
        </dl>
        <small>Formal toy witness: {witness.witnessValid?'PASS':'FAIL'} · Not evidence of immune memory</small>
      </article>
    </div>
    <footer className="ni1-reality">
      Biological circuits, mental states and immune outcomes are not reducible to these invented coefficients.
      Detached-cell anecdotes, distant “family immunity,” telepathy and treatments are not validated here.
      Source lineage and independent real-data review are separate gates. Ledger Above Ego.
    </footer>
  </section>
}
