import {useMemo,useState} from 'react'
import {BR1_DEFAULTS,BR1_PRESETS,simulateBR1,buildBR1Receipt} from './balanceRecoveryModel.js'
import './balanceRecoveryLab.css'

const format=(n,d=3)=>n===null||!Number.isFinite(n)?'n/a':n.toFixed(d)
function points(trace,key,min,max,x0,y0,width,height){
  const d=Math.max(1e-6,max-min)
  return trace.map(p=>`${(x0+p.time/trace.at(-1).time*width).toFixed(1)},${(y0+(max-p[key])/d*height).toFixed(1)}`).join(' ')
}
function Plot({result}){
  const {trace,parameters,metrics}=result
  const visible=trace.flatMap(p=>[p.a,p.b,p.perturbedA,p.perturbedB])
  const scale=Math.max(0.25,...visible.map(Math.abs))
  const residueScale=Math.max(.1,metrics.peakResidue)
  const options=[
    ['a','#73ffc5','A reference'],['b','#8bc9ff','B reference'],
    ['perturbedA','#ffbe76','A after B kick'],['perturbedB','#e3adfc','B after kick'],
  ]
  return <div className="br1-chart-wrap">
    <svg viewBox="0 0 780 420" className="br1-chart" role="img"
      aria-label="Reference and perturbed oscillator displacement above, and full state distance between perturbed and baseline below">
      <rect x="0" y="0" width="780" height="420" rx="9" fill="#071410"/>
      <text x="30" y="28" fill="#d6eeea" fontSize="14">OSCILLATOR DISPLACEMENT · SYNTHETIC</text>
      <text x="30" y="255" fill="#d6eeea" fontSize="14">FULL-STATE DISTANCE TO UNDISTURBED REFERENCE</text>
      {[65,110,155,200].map(y=><line key={y} x1="30" y1={y} x2="745" y2={y} stroke="#34544c" strokeWidth=".7"/>)}
      {options.map(([key,color])=><polyline key={key} points={points(trace,key,-scale,scale,30,50,715,175)} fill="none" stroke={color} strokeWidth="1.5" opacity={key.startsWith('perturbed')?0.95:0.7}/>)}
      <line x1={30+715*parameters.pulseTime/parameters.duration} x2={30+715*parameters.pulseTime/parameters.duration} y1="48" y2="398" stroke="#ffd37f" strokeDasharray="5 4" strokeWidth="1.3"/>
      {[0,0.5,1].map(f=><line key={f} x1="30" y1={275+110*f} x2="745" y2={275+110*f} stroke="#34544c" strokeWidth=".7"/>)}
      <polyline points={points(trace,'residue',0,residueScale,30,275,715,110)} fill="none" stroke="#ffbe76" strokeWidth="2"/>
      <line x1="30" y1={385-metrics.threshold/residueScale*110} x2="745" y2={385-metrics.threshold/residueScale*110} stroke="#73ffc5" strokeDasharray="5 4" opacity=".8"/>
      <text x="34" y="410" fill="#b4c9c3" fontSize="11">0 s</text>
      <text x="680" y="410" fill="#b4c9c3" fontSize="11">{parameters.duration} s</text>
      <text x="34" y="271" fill="#b4c9c3" fontSize="10">{format(residueScale,2)}</text>
    </svg>
    <div className="br1-legend">
      {options.map(([key,color,label])=><span key={key}><i style={{background:color}}/>{label}</span>)}
      <span><i style={{background:'#ffbe76'}}/>Distance</span>
    </div>
  </div>
}
const fields=[
  ['coupling','Feedback coupling',0,2,0.05],
  ['asymmetry','Directional asymmetry',-1,1,0.05],
  ['damping','Damping / active gain',-0.6,1,0.02],
  ['detuning','Natural-frequency mismatch',0,0.65,0.01],
  ['kick','Disturbance to B',0,4,0.1],
]
function exportReceipt(result){
  const payload=JSON.stringify(buildBR1Receipt(result),null,2)+'\n'
  const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='NBG-BR1_balance_recovery_receipt.json'
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function BalanceRecoveryLab(){
  const [params,setParams]=useState({...BR1_DEFAULTS})
  const [preset,setPreset]=useState('reciprocal')
  const result=useMemo(()=>simulateBR1(params),[params])
  const {metrics,coupling}=result
  function choose(name){setPreset(name);setParams({...BR1_DEFAULTS,...BR1_PRESETS[name]})}
  function change(key,value){setPreset('custom');setParams(p=>({...p,[key]:Number(value)}))}
  return <section className="section br1-lab" id="balance-recovery">
    <div className="section-label">NBG-BR1 · SYNTHETIC COUPLED-DYNAMICS EXPERIMENT</div>
    <h2>Balance &amp; <em>Recovery</em> Lab</h2>
    <p className="br1-intro">When two different oscillators are coupled, does unequal influence disrupt coordination or recovery after a shock? Experiment with reciprocal and directional feedback, frequency mismatch, and damping. The undisturbed and shocked systems receive identical forcing; only oscillator B gets a velocity kick.</p>
    <div className="br1-layout">
      <div>
        <Plot result={result}/>
        <div className="br1-metrics" aria-live="polite">
          <div><small>2-second sustained return below threshold</small><strong>{metrics.recovered?'RECOVERED':'NOT OBSERVED'}</strong></div>
          <div><small>Time from kick to sustained return</small><strong>{metrics.recoveryTime===null?'n/a':format(metrics.recoveryTime,2)+' s'}</strong></div>
          <div><small>Final full-state residue</small><strong>{format(metrics.finalResidue,4)}</strong></div>
          <div><small>Last 8 s: baseline velocity correlation</small><strong>{format(metrics.velocityCorrelation)}</strong></div>
        </div>
        <p className="br1-small">Recovery is operationally defined as the <strong>full four-state Euclidean distance</strong> remaining below {metrics.threshold} for at least {metrics.holdSeconds} consecutive seconds at the end of the simulation. Velocity correlation is a separate observer, not proof of global recovery or causal influence.</p>
      </div>
      <div className="br1-control-panel">
        <h3>Change the relationships</h3>
        <div className="br1-presets">
          {Object.entries(BR1_PRESETS).map(([key,item])=><button key={key} type="button" aria-pressed={preset===key} onClick={()=>choose(key)}>{item.label}</button>)}
        </div>
        {fields.map(([key,label,min,max,step])=><label className="br1-slider" key={key}>
          <span>{label}<strong>{params[key].toFixed(2)}</strong></span>
          <input type="range" min={min} max={max} step={step} value={params[key]} onChange={e=>change(key,e.target.value)}/>
        </label>)}
        <div className="br1-coupling"><span>B → A: {format(coupling.aReceivesFromB,2)}</span><span>A → B: {format(coupling.bReceivesFromA,2)}</span></div>
        <button type="button" className="br1-export" onClick={()=>exportReceipt(result)}>Export simulated provenance receipt</button>
      </div>
    </div>
    <div className="br1-notes">
      <article><h3>Imbalance is not the same as instability</h3><p>Directional coupling may still yield a functioning system. Test it rather than assuming asymmetry is harmful.</p></article>
      <article><h3>Coordination is not recovery</h3><p>A high phase or velocity correlation alone cannot establish return of the complete state after a disturbance.</p></article>
      <article><h3>Instability is not automatically chaos</h3><p>Negative damping is an intentionally unstable control. No Lyapunov exponent, chaos diagnosis, or empirical claim is made.</p></article>
    </div>
    <p className="br1-disclaimer"><strong>Claim firewall:</strong> This is a dimensionless, simulated two-oscillator illustration, not a physical gear measurement, human-behavior model, historical proof, or evidence for metaphysical duality. It can suggest testable questions but cannot confirm them. See <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BALANCE_RECOVERY.md" target="_blank" rel="noreferrer">protocol and limitations ↗</a>.</p>
  </section>
}
