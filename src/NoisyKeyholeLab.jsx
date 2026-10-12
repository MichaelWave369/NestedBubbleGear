import {useMemo,useState} from 'react'
import {G3_PROTOCOL,G3_NOISE,G3_REPEATS,G3_THRESHOLDS,evaluateG3,g3Curve,selectedWitness,buildG3Receipt} from './noisyKeyhole.js'
import './noisyKeyhole.css'
const pct=n=>n===null?'n/a':(100*n).toFixed(2)+'%'
const signed=n=>n===null?'n/a':(n>=0?'+':'')+(100*n).toFixed(2)+' pp'
function exportReceipt(config){
 const blob=new Blob([JSON.stringify(buildG3Receipt(config),null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob),a=document.createElement('a')
 a.href=url;a.download='NBG-G3-noisy-keyhole-v0.1.0.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
function Metric({label,value,note}){return <div className="g3-metric"><small>{label}</small><strong>{value}</strong>{note&&<span>{note}</span>}</div>}
export default function NoisyKeyholeLab(){
 const [repeats,setRepeats]=useState(5)
 const [noise,setNoise]=useState(.10)
 const [threshold,setThreshold]=useState(.95)
 const [regime,setRegime]=useState('COMMON_CAUSE')
 const [assumption,setAssumption]=useState('NAIVE_IID')
 const [state,setState]=useState(5)
 const [rawFlips,setRawFlips]=useState(5)
 const flippedSamples=regime==='COMMON_CAUSE'&&rawFlips!==0&&rawFlips!==repeats?0:Math.min(repeats,rawFlips)
 const settings={repeats,noise,threshold,regime,assumption}
 const report=useMemo(()=>evaluateG3(settings),[repeats,noise,threshold,regime,assumption])
 const witness=useMemo(()=>selectedWitness({...settings,state,flippedSamples}),[repeats,noise,threshold,regime,assumption,state,flippedSamples])
 const comparisons=useMemo(()=>[
  evaluateG3({...settings,regime:'IID',assumption:'MATCHED'}),
  evaluateG3({...settings,regime:'COMMON_CAUSE',assumption:'MATCHED'}),
  evaluateG3({...settings,regime:'COMMON_CAUSE',assumption:'NAIVE_IID'})
 ],[repeats,noise,threshold])
 const curve=useMemo(()=>g3Curve(settings),[noise,threshold,regime,assumption])
 return <section id="noisy-keyhole" className="section g3-section">
  <span className="section-label">NBG-G3 · NOISY KEYHOLE · EXACT SYNTHETIC ANALYSIS</span>
  <h2>More readings.<br/><em>More truth, or just more confidence?</em></h2>
  <p className="muted">G2 assumed a perfect sensor. G3 adds a known synthetic bit-error probability and
   compares independent flips against one shared error copied into every reading.
   See what an observer reports when its statistical assumption is wrong.</p>
  <div className="g3-controls">
   <label>Sensor error probability
    <select value={noise} onChange={e=>setNoise(Number(e.target.value))}>
     {G3_NOISE.map(p=><option value={p} key={p}>{pct(p)}</option>)}
    </select>
   </label>
   <label>Repeated measurements
    <select value={repeats} onChange={e=>{setRepeats(Number(e.target.value));setRawFlips(0)}}>
     {G3_REPEATS.map(n=><option key={n} value={n}>{n} reading{n===1?'':'s'}</option>)}
    </select>
   </label>
   <label>True error mechanism
    <select value={regime} onChange={e=>{setRegime(e.target.value);setRawFlips(0)}}>
     <option value="IID">Independent flips</option>
     <option value="COMMON_CAUSE">One shared flip</option>
    </select>
   </label>
   <label>What the observer assumes
    <select value={assumption} onChange={e=>setAssumption(e.target.value)}>
     <option value="MATCHED">Correct mechanism</option>
     <option value="NAIVE_IID">Always assumes independence</option>
    </select>
   </label>
   <label>Minimum confidence to make a decision
    <select value={threshold} onChange={e=>setThreshold(Number(e.target.value))}>
     {G3_THRESHOLDS.map(t=><option key={t} value={t}>{pct(t)}</option>)}
    </select>
   </label>
  </div>
  <div className="g3-metrics">
   <Metric label="Decision coverage" value={pct(report.coverage)} note="Fraction of scenarios accepted"/>
   <Metric label="Actual accuracy when accepted" value={pct(report.actualAccuracy)} note="Exact expected correctness"/>
   <Metric label="Observer's stated confidence" value={pct(report.meanClaimedConfidence)} note="Mean across accepted decisions"/>
   <Metric label="Confidence overstatement" value={signed(report.confidenceGap)} note="Claimed minus actual accuracy"/>
  </div>
  <div className="g3-verdict" role="status">
   <strong>{report.verdict.replaceAll('_',' ')}</strong>
   <p>{report.coverage===0
      ?'The declared confidence threshold cannot be met. The observer abstains rather than manufacturing an answer.'
      :regime==='COMMON_CAUSE'&&assumption==='NAIVE_IID'&&repeats>1
      ?'Warning: repeated readings share one possible mistake. The IID observer treats copies as independent evidence and can become overconfident.'
      :'These are analytical expected metrics, not measured performance on an external device.'}</p>
  </div>
  <div className="g3-layout">
   <div className="g3-panel">
    <h3>Repeat-count comparison</h3>
    <p className="muted">Exact results for the selected error mechanism and observer assumption. Blank accuracy means no decisions.</p>
    <table className="g3-table"><thead><tr><th>Reads</th><th>Coverage</th><th>Actual correct</th><th>Claimed</th></tr></thead>
     <tbody>{curve.map(row=><tr key={row.repeats} className={row.repeats===repeats?'selected':''}>
      <td>{row.repeats}</td><td>{pct(row.coverage)}</td>
      <td>{pct(row.actualAccuracy)}</td><td>{pct(row.confidence)}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <div className="g3-panel">
    <h3>Same conditions, three observers</h3>
    <p className="muted">Hold error rate, repetitions and threshold fixed. Change the physical error assumption and the observer model.</p>
    <table className="g3-table"><thead><tr><th>Scenario</th><th>Actual</th><th>Claimed</th></tr></thead>
     <tbody>{comparisons.map((c,i)=><tr key={i}>
      <td>{['IID / aware','Shared / aware','Shared / naive'][i]}</td>
      <td>{pct(c.actualAccuracy)}</td><td>{pct(c.meanClaimedConfidence)}</td>
     </tr>)}</tbody>
    </table>
   </div>
  </div>
  <div className="g3-layout">
   <div className="g3-panel">
    <h3>Exact distribution of observed 1-bits</h3>
    <p className="muted">Marginal probabilities over the two equally likely hidden W values.
     The bars are theoretical, not sampled readings.</p>
    <div className="g3-distribution">{report.counts.map(row=><div className="g3-barrow" key={row.ones}>
     <span>{row.ones} / {repeats}</span><div className="g3-track">
      <div style={{width:(row.probability*100)+'%'}}/></div>
     <strong>{pct(row.probability)}</strong>
     </div>)}</div>
   </div>
   <div className="g3-panel">
    <h3>Constructed witness, not a sensor log</h3>
    <div className="g3-witness-controls">
     <label>Hidden hypercube vertex
      <select value={state} onChange={e=>setState(Number(e.target.value))}>
       {Array.from({length:16},(_,v)=><option value={v} key={v}>{v.toString(2).padStart(4,'0')}</option>)}
      </select>
     </label>
     <label>Illustrated sensor flips
      <select value={flippedSamples} onChange={e=>setRawFlips(Number(e.target.value))}>
       {(regime==='COMMON_CAUSE'?[0,repeats]:Array.from({length:repeats+1},(_,v)=>v))
        .filter((v,i,a)=>a.indexOf(v)===i)
        .map(v=><option value={v} key={v}>{v} flip{v===1?'':'s'}</option>)}
      </select>
     </label>
    </div>
    <p>True W: <strong>{witness.trueW}</strong> · Known XYZ parity: <strong>{witness.knownXYZ}</strong>.</p>
    <p>Raw XOR-probe reads: <code>{witness.rawBits.join(' ')}</code></p>
    <p>Decoded W reads: <code>{witness.decodedBits.join(' ')}</code></p>
    <p>Posterior confidence: <strong>{pct(witness.inference.confidence)}</strong></p>
    <p>Observer decision: <strong>{witness.inference.decision===null?'ABSTAIN':('W='+witness.inference.decision)}</strong> · {witness.inference.status}</p>
    <p className="muted">Exact probability of this decoded count under the true regime: {pct(witness.likelihood)}.
     This is a manually constructed illustrative sequence.</p>
   </div>
  </div>
  <p className="g3-firewall">G3 evaluates a uniform sixteen-state toy world and the G2 parity-15 sensor analytically.
   There is no real-world data, stochastic experiment, empirically observed correlation, human measurement,
   physical extra dimension, religious causation, or evidence of cosmic imprisonment. Reports have
   origin={G3_PROTOCOL.origin}, authority={G3_PROTOCOL.authority}. All percentage scores are mathematical expectations.</p>
  <div className="g3-actions"><button type="button" onClick={()=>exportReceipt({...settings,state,flippedSamples})}>
   Export exact G3 ledger receipt
   </button><a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/NOISY_KEYHOLE.md">Read the frozen protocol ↗</a></div>
 </section>
}
