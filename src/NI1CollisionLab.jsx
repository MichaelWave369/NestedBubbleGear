import { useMemo, useState } from 'react'
import {NI1B,runNI1B,receiptNI1B} from './ni1Collision.js'
import './ni1CollisionLab.css'

const fmt=(value,digits=4)=>Number.isFinite(value)?Number(value).toFixed(digits):'REFUSED'
function CollisionPlot({result}){
  const width=760,height=266,left=54,right=20,top=20,bottom=38
  const w=width-left-right,h=height-top-bottom
  const series=result.control.concat(result.experimental).map(x=>x.observed)
  const low=Math.min(...series)-.1,high=Math.max(...series)+.1
  const line=rows=>rows.map((r,i)=>(i?'L':'M')+
    (left+i/(NI1B.ticks-1)*w).toFixed(1)+','+
    (top+(high-r.observed)/(high-low)*h).toFixed(1)).join(' ')
  const interventionX=left+(NI1B.interventionAt-.5)/(NI1B.ticks-1)*w
  return <div className="ni1b-chart">
    <svg viewBox={'0 0 '+width+' '+height} role="img"
      aria-label="Two invented readout trajectories overlay exactly before the intervention and may diverge after.">
      <rect x={left} y={top} width={w} height={h} fill="#07191d" rx="5"/>
      <rect x={interventionX} y={top} width={left+w-interventionX} height={h} fill="#c99b5e" fillOpacity=".09"/>
      {[0,.25,.5,.75,1].map(k=><g key={k}>
        <line x1={left} y1={top+h*k} x2={left+w} y2={top+h*k} stroke="#b3dcd2" strokeOpacity=".14" strokeDasharray="4 6"/>
        <text x={left-8} y={top+h*k+3} textAnchor="end" fill="#b8cdc5" fontSize="10">{fmt(high-k*(high-low),2)}</text>
      </g>)}
      <path d={line(result.control)} fill="none" stroke="#85e6c1" strokeWidth="3"/>
      <path d={line(result.experimental)} fill="none" stroke="#efc387" strokeWidth="2.2" strokeDasharray="6 3"/>
      <line x1={interventionX} y1={top} x2={interventionX} y2={top+h} stroke="#e9ca91" strokeDasharray="3 4"/>
      <text x={interventionX+7} y={top+12} fill="#f2d8a1" fontSize="11">PROBE</text>
      <text x={left} y="12" fill="#badcd1" fontSize="11">Dimensionless readout · SIMULATED</text>
      <text x={left} y={height-7} fill="#b8cdc5" fontSize="11">0</text>
      <text x={left+w} y={height-7} textAnchor="end" fill="#b8cdc5" fontSize="11">{NI1B.ticks-1} ticks</text>
    </svg>
    <div className="ni1b-legend">
      <span><i style={{background:'#85e6c1'}}/>No intervention</span>
      <span><i style={{background:'#efc387'}}/>Declared probe</span>
    </div>
  </div>
}
export default function NI1CollisionLab(){
  const [mechanism,setMechanism]=useState('neural')
  const [probe,setProbe]=useState('neural')
  const [crossTalk,setCrossTalk]=useState(false)
  const [seed,setSeed]=useState(369)
  const result=useMemo(()=>runNI1B({mechanism,probe,crossTalk:crossTalk&&probe==='neural',seed}),
    [mechanism,probe,crossTalk,seed])
  const exportReceipt=()=>{
    const blob=new Blob([JSON.stringify(receiptNI1B(result),null,2)+'\n'],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download='nbg-ni1-e1b-SIMULATED.json'
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
  }
  return <section className="ni1b-shell" id="ni1-e1b" aria-labelledby="ni1b-title">
    <div className="ni1b-heading">
      <div>
        <span className="research-overline">NI1 · E1B · BLIND CAUSAL COLLISION LAB</span>
        <h3 id="ni1b-title">One identical signal. <em>Two different causes.</em></h3>
        <p>A neural pathway and an ordinary instrument signal are engineered to produce exactly identical
          observational data. Toggle isolated interventions to reveal why correlation and a good fit
          cannot identify the cause.</p>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/NI1/E1B_PROTOCOL.md"
          target="_blank" rel="noopener noreferrer">Read frozen E1B synthetic protocol ↗</a>
      </div>
      <aside><strong>SIMULATED · NONE</strong><span>No people or blood samples</span><span>No remote donor signal</span><span>Invented dimensionless dynamics</span></aside>
    </div>
    <div className="ni1b-grid">
      <div className="ni1b-controls">
        <h4>01 / Choose a hidden synthetic cause</h4>
        <label htmlFor="ni1b-mechanism">Generator's ground truth (withheld from evaluator)</label>
        <select id="ni1b-mechanism" value={mechanism} onChange={e=>setMechanism(e.target.value)}>
          <option value="neural">Neural-mediated toy</option>
          <option value="instrument">Instrument artifact toy</option>
        </select>
        <label htmlFor="ni1b-probe">Controlled intervention</label>
        <select id="ni1b-probe" value={probe} onChange={e=>{setProbe(e.target.value);setCrossTalk(false)}}>
          <option value="neural">Change neural input alone</option>
          <option value="nuisance">Change instrument input alone</option>
        </select>
        <label className="ni1b-check">
          <input type="checkbox" checked={crossTalk&&probe==='neural'}
            disabled={probe!=='neural'} onChange={e=>setCrossTalk(e.target.checked)}/>
          Simulate intervention leakage into instrument channel
        </label>
        <label htmlFor="ni1b-seed">Replay seed</label>
        <select id="ni1b-seed" value={seed} onChange={e=>setSeed(Number(e.target.value))}>
          {[19,42,369,777].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
        <button type="button" onClick={exportReceipt}>Export E1B SIMULATED receipt</button>
      </div>
      <div className="ni1b-output">
        <div className="ni1b-stat-grid">
          <article><span>Unperturbed observational difference</span><strong>{fmt(result.collision.maximumObservedDifference,6)}</strong></article>
          <article><span>Post-intervention readout difference</span><strong>{fmt(result.afterIntervention.observedEffect,5)}</strong></article>
          <article><span>Off-target channel change</span><strong>{fmt(result.afterIntervention.offTargetChange,5)}</strong></article>
        </div>
        <div className="ni1b-decision" aria-live="polite">
          <strong>{result.decision}</strong>
          <p>Pre-intervention baseline identical: {result.matchedBaseline?'YES':'NO'}.
            Intervention isolated: {result.isolated?'YES':'NO'}.
            The evaluator only receives allowed traces and the declared intervention channel,
            never the selected generator label.</p>
        </div>
        <CollisionPlot result={result}/>
      </div>
    </div>
    <div className="ni1b-conclusion">
      <strong>What the Keyhole actually teaches</strong>
      <p>Before an intervention, the two causes have exactly the same visible trajectory:
      <code> P(X) = P(X′)</code>. A correctly isolated future probe can distinguish them.
      When an intervention also changes the nuisance channel, source attribution must be refused.
      This is a property of deliberately constructed synthetic mathematics, not evidence for a biological
      effect, a healing technique, or consciousness affecting distant blood.</p>
    </div>
  </section>
}
