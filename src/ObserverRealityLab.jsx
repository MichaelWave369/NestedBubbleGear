import {useMemo,useState} from 'react'
import {
 OBS_PROTOCOL,OBS_TABS,projectionWitness,frameWitness,graphWitness,
 causalWitness,samplingWitness,delayWitness,observerReceipt,verifyObserverInvariants
} from './observerRealityMath.js'
import './observerRealityLab.css'

const fmt=n=>Number(n.toFixed(5)).toString()
const pointsString=(points,key)=>points.map((p,i)=>
 (22+i*18)+','+(87-36*p[key]).toFixed(2)).join(' ')
function downloadReceipt(settings){
 const receipt=observerReceipt(settings)
 const blob=new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'})
 const url=URL.createObjectURL(blob)
 const a=document.createElement('a')
 a.href=url;a.download='NBG-OBS-01-observer-reality.json'
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
function Pill({children,good=true}){
 return <span className={'obs-pill '+(good?'obs-good':'obs-change')}>{children}</span>
}
function Projection({reveal,setReveal}){
 const witness=projectionWitness(reveal)
 return <div className="obs-panel-grid">
  <article className="obs-card">
   <div className="obs-overline">Projection · 4 coordinates → 3 visible</div>
   <h3>Two states. One shadow?</h3>
   <p>Two hypercube vertices differ only in their fourth coordinate. The observer first receives X, Y and Z.</p>
   <div className="obs-state-pair">
    <div><small>Hidden state A</small><code>[{witness.a.join(', ')}]</code><small>Observed</small><strong>[{witness.observationA.join(', ')}]</strong></div>
    <div><small>Hidden state B</small><code>[{witness.b.join(', ')}]</code><small>Observed</small><strong>[{witness.observationB.join(', ')}]</strong></div>
   </div>
   <button type="button" className="obs-action" onClick={()=>setReveal(!reveal)}>
    {reveal?'Return to three-coordinate keyhole':'Measure fourth coordinate'}
   </button>
  </article>
  <aside className="obs-card obs-result">
   <div className="obs-overline">Observer verdict</div>
   <Pill good={!reveal}>{witness.indistinguishable?'INDISTINGUISHABLE':'DISTINGUISHED'}</Pill>
   <h3>{witness.indistinguishable?'Different realities, identical reading.':'A new measurement separates them.'}</h3>
   <p>Projection discards information. Adding an allowed probe recovers one hidden bit for this particular finite model.</p>
   <p className="obs-note">The fourth coordinate is part of an abstract toy state, not a demonstrated physical dimension.</p>
   <a href="#dimensional-recovery">Continue into the existing G2 recovery solver ↗</a>
  </aside>
 </div>
}
function Frames({origin,setOrigin,rotation,setRotation}){
 const frame=frameWitness(origin,rotation)
 const coords=frame.relative.map(([x,y])=>[160+x*.63,102+y*.63])
 const names=['A','B','C']
 return <div className="obs-panel-grid">
  <article className="obs-card">
   <div className="obs-overline">Change description · preserve distances</div>
   <h3>No absolute origin required</h3>
   <div className="obs-input-row">
    <label>Reference origin
     <select value={origin} onChange={e=>setOrigin(e.target.value)}>
      {names.map(n=><option key={n} value={n}>Object {n}</option>)}
     </select>
    </label>
    <label>Rotate coordinates
     <select value={rotation} onChange={e=>setRotation(Number(e.target.value))}>
      {[0,90,180].map(n=><option key={n} value={n}>{n}°</option>)}
     </select>
    </label>
   </div>
   <svg role="img" aria-label="Triangle repositioned relative to the selected origin" viewBox="0 0 330 214">
    <path d={'M '+coords.map(p=>p.join(' ')).join(' L ')+' Z'} stroke="#8bc9ff" strokeWidth="2" fill="#8bc9ff" fillOpacity=".1"/>
    {coords.map((p,i)=><g key={names[i]}>
     <circle cx={p[0]} cy={p[1]} r={14} fill={names[i]===origin?'#d8b074':'#5d9cc5'}/>
     <text x={p[0]} y={p[1]+4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#07120e">{names[i]}</text>
    </g>)}
    <circle cx="160" cy="102" r="24" stroke="#d8b074" strokeDasharray="3 4" fill="none"/>
   </svg>
  </article>
  <aside className="obs-card obs-result">
   <div className="obs-overline">Invariant measurement</div>
   <Pill>UNCHANGED</Pill>
   <h3>Same triangle, different coordinates.</h3>
   {frame.distances.map((v,i)=><div className="obs-metric" key={i}>
     <span>{['A–B','B–C','C–A'][i]} distance</span><strong>{fmt(v)}</strong></div>)}
   <p className="obs-note">This is an invertible change of reference frame. It is not the same as a lossy projection.</p>
  </aside>
 </div>
}
function Topology({graphMode,setGraphMode,graphSize,setGraphSize}){
 const graph=graphWitness(graphMode,graphSize)
 return <div className="obs-panel-grid">
  <article className="obs-card">
   <div className="obs-overline">Graph topology · β₁ = E − V + C</div>
   <h3>Change the picture. Or the structure?</h3>
   <div className="obs-choices" role="group" aria-label="Topology transform">
    {[['ring','Original'],['distort','Distort drawing'],['cut','Cut connection']].map(([id,label])=>
     <button type="button" key={id} aria-pressed={graphMode===id} onClick={()=>setGraphMode(id)}>{label}</button>)}
   </div>
   <label className="obs-wide-label">Number of nodes
    <select value={graphSize} onChange={e=>setGraphSize(Number(e.target.value))}>
     <option value="6">6 nodes</option><option value="12">12 nodes</option>
    </select>
   </label>
   <svg role="img" aria-label="Synthetic graph with selected connection rule" viewBox="0 0 330 225">
    {graph.edges.map(([a,b],i)=><line key={i} x1={graph.nodes[a].x+14} y1={graph.nodes[a].y} x2={graph.nodes[b].x+14} y2={graph.nodes[b].y} stroke="#8bc9ff" strokeWidth="2.5"/>)}
    {graph.nodes.map(node=><g key={node.id}>
     <circle cx={node.x+14} cy={node.y} r="11" fill="#73ffc5"/>
     <text x={node.x+14} y={node.y+3} textAnchor="middle" fill="#06100c" fontSize="10" fontWeight="700">{node.id+1}</text>
    </g>)}
   </svg>
  </article>
  <aside className="obs-card obs-result">
   <div className="obs-overline">Topological fingerprint</div>
   <Pill good={graph.cycleRank===1}>{graph.cycleRank?'CYCLE PRESERVED':'CYCLE BROKEN'}</Pill>
   <div className="obs-metric"><span>Vertices V</span><strong>{graph.size}</strong></div>
   <div className="obs-metric"><span>Edges E</span><strong>{graph.edges.length}</strong></div>
   <div className="obs-metric"><span>Connected components C</span><strong>{graph.components}</strong></div>
   <div className="obs-metric"><span>Independent cycles β₁</span><strong>{graph.cycleRank}</strong></div>
   <p className="obs-note">Moving nodes on screen does not change connectivity. Removing one link changes this graph's first Betti number. This is a finite graph fact, not evidence of cosmic nesting.</p>
  </aside>
 </div>
}
function Causality({intervene,setIntervene}){
 const result=causalWitness(intervene)
 return <div className="obs-panel-grid">
  <article className="obs-card">
   <div className="obs-overline">Same observation · different causal explanations</div>
   <h3>Watch the shadows, then intervene.</h3>
   <div className="obs-choices" role="group" aria-label="Causal experiment">
    <button type="button" aria-pressed={!intervene} onClick={()=>setIntervene(false)}>Observe only</button>
    <button type="button" aria-pressed={intervene} onClick={()=>setIntervene(true)}>Set A = 1</button>
   </div>
   <div className="obs-causal">
    <div><strong>World 1</strong><code>H → A</code><code>H → B</code><small>A and B share a hidden cause.</small></div>
    <div><strong>World 2</strong><code>H → A → B</code><small>A directly affects B.</small></div>
   </div>
   <table className="obs-table">
    <thead><tr><th>H</th><th>A</th><th>B · common cause</th><th>B · direct cause</th></tr></thead>
    <tbody>{result.rows.map(r=><tr key={r.h}><td>{r.h}</td><td>{r.a}</td><td>{r.commonCauseB}</td><td>{r.directCauseB}</td></tr>)}</tbody>
   </table>
  </article>
  <aside className="obs-card obs-result">
   <div className="obs-overline">Identifiability test</div>
   <Pill good={intervene}>{result.observationallyEquivalent?'EQUIVALENT UNDER OBSERVATION':'MODELS DISCRIMINATED'}</Pill>
   <h3>{intervene?'The intervention exposes the hidden difference.':'Correlation alone cannot choose the model.'}</h3>
   <p>{intervene?'With H = 0, fixing A to 1 leaves B = 0 in World 1 but makes B = 1 in World 2.':'Both models produce the same values for A and B when A is not manipulated.'}</p>
   <p className="obs-note">The intervention is defined in the causal toy equations. Real interventions require valid assumptions and controls.</p>
  </aside>
 </div>
}
function Time({interval,setInterval}){
 const samples=useMemo(()=>samplingWitness(interval),[interval])
 const delays=useMemo(()=>delayWitness(),[])
 const delayPts=delays.predictions
 const actual=delayPts.map((p,i)=>(22+i*20)+','+(105-55*p.actual))
 const visible=delayPts.map((p,i)=>(22+i*20)+','+(105-55*p.visibleOnly))
 const history=delayPts.map((p,i)=>(22+i*20)+','+(105-55*p.delayed))
 return <div className="obs-panel-grid">
  <article className="obs-card">
   <div className="obs-overline">Sampling · hidden oscillations</div>
   <h3>What disappears between measurements?</h3>
   <div className="obs-choices" role="group" aria-label="Sampling interval">
    <button type="button" aria-pressed={interval===1} onClick={()=>setInterval(1)}>Every 1.0 s</button>
    <button type="button" aria-pressed={interval===0.8} onClick={()=>setInterval(0.8)}>Every 0.8 s</button>
   </div>
   <svg role="img" aria-label="Low-frequency samples and high-frequency component" viewBox="0 0 330 180">
    <line x1="20" x2="316" y1="87" y2="87" stroke="currentColor" strokeOpacity=".25" strokeDasharray="3 4"/>
    <polyline points={pointsString(samples.points,'low')} fill="none" stroke="#8bc9ff" strokeWidth="2"/>
    <polyline points={pointsString(samples.points,'observed')} fill="none" stroke="#e0b56e" strokeWidth="2.8"/>
    {samples.points.map(p=><circle key={p.i} cx={22+p.i*18} cy={87-36*p.observed} r="3.2" fill="#e0b56e"/>)}
    <text x="20" y="168" fill="currentColor" opacity=".6" fontSize="11">Blue: slow component · Gold: sampled mixture</text>
   </svg>
   <p className="obs-note">A 2 Hz component sampled at whole seconds can vanish at every sample. Changing the interval reveals a nonzero residual. This is aliasing in a specified toy signal.</p>
  </article>
  <aside className="obs-card obs-result">
   <div className="obs-overline">Temporal reconstruction</div>
   <Pill good={samples.fastVisible}>{samples.fastVisible?'RESIDUAL VISIBLE':'RESIDUAL MISSED'}</Pill>
   <div className="obs-metric"><span>Max hidden residual at samples</span><strong>{fmt(samples.maxResidual)}</strong></div>
   <h3>Can history restore missing state?</h3>
   <svg role="img" aria-label="Prediction traces for one-state and two-delay models" viewBox="0 0 330 150">
    <polyline points={visible.join(' ')} stroke="#df8f85" fill="none" strokeWidth="2"/>
    <polyline points={actual.join(' ')} stroke="#8bc9ff" fill="none" strokeWidth="3"/>
    <polyline points={history.join(' ')} stroke="#73ffc5" fill="none" strokeWidth="1.5" strokeDasharray="4 3"/>
    <text x="22" y="140" fill="currentColor" fontSize="10" opacity=".7">Actual (blue), fixed x-only (coral), two-delay (green)</text>
   </svg>
   <div className="obs-metric"><span>Fixed visible-only RMSE</span><strong>{fmt(delays.visibleRmse)}</strong></div>
   <div className="obs-metric"><span>Two-delay RMSE</span><strong>{fmt(delays.delayRmse)}</strong></div>
   <p className="obs-note">The exact two-delay law is derived from a known deterministic two-state model. It is not learned from data, and this is not proof of hidden time dimensions.</p>
  </aside>
 </div>
}
export default function ObserverRealityLab(){
 const [tab,setTab]=useState('projection')
 const [reveal,setReveal]=useState(false)
 const [origin,setOrigin]=useState('A'),[rotation,setRotation]=useState(0)
 const [graphMode,setGraphMode]=useState('ring'),[graphSize,setGraphSize]=useState(6)
 const [intervene,setIntervene]=useState(false),[interval,setInterval]=useState(1)
 const settings={tab,reveal,origin,rotation,graphMode,graphSize,intervene,interval}
 const checks=useMemo(()=>verifyObserverInvariants(),[])
 return <section className="section obs-lab" id="observer-reality" aria-labelledby="observer-reality-heading">
  <div className="section-label">NBG-OBS-01 · OBSERVER &amp; REALITY LAB · SIMULATED / AUTHORITY NONE</div>
  <h2 id="observer-reality-heading">Plato's Cave,<br/><em>with testable shadows.</em></h2>
  <p className="obs-lede">Change what an observer can measure. Rotate its frame. Distort a network.
   Intervene on a causal mechanism. Change when it samples. See which patterns survive and which explanations fail.</p>
  <div className="obs-tabs" role="group" aria-label="Observer experiment">
   {OBS_TABS.map(item=><button type="button" key={item.id} aria-pressed={tab===item.id}
    onClick={()=>setTab(item.id)}>{item.label}</button>)}
  </div>
  {tab==='projection'&&<Projection reveal={reveal} setReveal={setReveal}/>}
  {tab==='frame'&&<Frames origin={origin} setOrigin={setOrigin} rotation={rotation} setRotation={setRotation}/>}
  {tab==='topology'&&<Topology graphMode={graphMode} setGraphMode={setGraphMode} graphSize={graphSize} setGraphSize={setGraphSize}/>}
  {tab==='causality'&&<Causality intervene={intervene} setIntervene={setIntervene}/>}
  {tab==='time'&&<Time interval={interval} setInterval={setInterval}/>}
  <div className="obs-bottom">
   <div><div className="obs-overline">Deterministic verification</div>
    <h3>Invariants, negative controls, and visible failures.</h3>
    <p>Finite examples are checked against their full simulated state. The observer cannot claim inaccessible information without a discriminating measurement.</p>
    <div className="obs-checks">{Object.entries(checks).map(([name,passed])=>
     <span key={name} className={passed?'obs-pass':'obs-fail'}>{passed?'✓':'✕'} {name.replace(/([A-Z])/g,' $1').toLowerCase()}</span>)}</div>
   </div>
   <div className="obs-links">
    <button type="button" className="obs-action" onClick={()=>downloadReceipt(settings)}>Export current experiment ledger</button>
    <a href="#geometry-keyhole">G1 Geometry Keyhole ↗</a>
    <a href="#dimensional-recovery">G2 Dimensional Recovery ↗</a>
    <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/OBSERVER_REALITY_LAB.md" target="_blank" rel="noopener noreferrer">Protocol, equations &amp; limitations ↗</a>
   </div>
  </div>
  <p className="obs-firewall">{OBS_PROTOCOL.id}: finite, deterministic mathematical demonstrations only.
   No real-world measurements, cosmic captivity, higher physical dimension, holographic universe, consciousness,
   general causal discovery, or experimentally validated new physics is established by these examples.</p>
 </section>
}