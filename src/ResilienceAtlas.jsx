import {useMemo,useState} from 'react'
import {BR1_DEFAULTS,simulateBR1} from './balanceRecoveryModel.js'
import {
  BR2_GRID,BR2_PROTOCOL,runBR2Slice,buildBR2Receipt,
} from './resilienceAtlasModel.js'
import './resilienceAtlas.css'

const show=(value,precision=3)=>value===null||!Number.isFinite(value)?'not observed':value.toFixed(precision)
const compact=value=>value.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')
const viewNames={
  recovery:'Full-state recovery',
  advantage:'Directional vs reciprocal',
  keyhole:'Correlation Keyhole',
}
function outcomeLabel(cell){
  if(!cell)return 'Select a cell'
  if(cell.state==='DIVERGED')return 'Numeric runaway: analysis refused'
  if(cell.state==='HORIZON_CENSORED')return 'Recovery not observed before the horizon'
  return 'Recovered by the prespecified criterion'
}
function classify(cell,view){
  if(view==='recovery')return cell.state==='RECOVERED'?'recovered':cell.state==='DIVERGED'?'diverged':'censored'
  if(view==='keyhole')return cell.mismatch?'mismatch':cell.velocityCorrelation===null?'undefined':
    cell.coarseHighCoordination?'high':'low'
  if(cell.state==='DIVERGED')return 'diverged'
  return {
    DIRECTIONAL_FASTER:'faster',
    RECIPROCAL_FASTER:'slower',
    DIRECTIONAL_ONLY_RECOVERS:'faster',
    RECIPROCAL_ONLY_RECOVERS:'slower',
    TIED:'tied',
    RECIPROCAL_BASELINE:'baseline',
    BOTH_CENSORED:'censored',
  }[cell.comparedToReciprocal]||'censored'
}
function legendFor(view){
  if(view==='recovery')return [
    ['recovered','Recovered'],['censored','Not observed by horizon'],['diverged','Numerical runaway'],
  ]
  if(view==='advantage')return [
    ['faster','Directional advantage'],['slower','Reciprocal advantage'],
    ['tied','Equal recovery time'],['baseline','Reciprocal reference'],
    ['censored','Neither/both censored'],
  ]
  return [
    ['mismatch','High correlation, no recovery'],['high','High baseline correlation, recovered'],
    ['low','Lower baseline correlation'],['undefined','No valid correlation'],
  ]
}
function ResidueComparison({selected,reciprocal}){
  const configs=[selected,reciprocal].map(c=>({...BR1_DEFAULTS,
    coupling:c.coupling,asymmetry:c.asymmetry,damping:c.damping,detuning:c.detuning,
    duration:BR2_GRID.duration,pulseTime:BR2_GRID.pulseTime,
    timeStep:BR2_GRID.timeStep,kick:BR2_GRID.kick,driveAmplitude:BR2_GRID.driveAmplitude,
  }))
  const traces=useMemo(()=>configs.map(c=>simulateBR1(c).trace),[
    selected.coupling,selected.asymmetry,selected.damping,selected.detuning,
    reciprocal.coupling,reciprocal.asymmetry,reciprocal.damping,reciprocal.detuning,
  ])
  const max=Math.max(0.1,...traces.flatMap(t=>t.map(x=>x.residue)))
  const x=v=>46+v/BR2_GRID.duration*676
  const y=v=>240-Math.min(v/max,1)*176
  const path=trace=>trace.map((p,i)=>`${i===0?'M':'L'}${x(p.time).toFixed(2)},${y(p.residue).toFixed(2)}`).join(' ')
  return <div className="br2-plot-wrap">
    <svg viewBox="0 0 754 286" role="img"
      aria-label="Full-state residue of selected directional configuration versus its same-coupling reciprocal reference">
      <rect x="0" y="0" width="754" height="286" fill="#071510" rx="9"/>
      <text x="45" y="22" fontSize="12" fill="#cbdfd5">POST-KICK FULL-STATE RESIDUE</text>
      {[0,.5,1].map(f=><g key={f}>
        <line x1="45" x2="723" y1={64+176*f} y2={64+176*f} stroke="#2c5043" strokeWidth=".75"/>
        <text x="10" y={68+176*f} fontSize="10" fill="#8eafa2">{show(max*(1-f),2)}</text>
      </g>)}
      <path d={path(traces[1])} fill="none" stroke="#8bc9ff" strokeWidth="2"/>
      <path d={path(traces[0])} fill="none" stroke="#ffca83" strokeWidth="2"/>
      <line x1="45" x2="723" y1={y(.06)} y2={y(.06)}
        stroke="#73ffc5" strokeWidth="1.3" strokeDasharray="5 4"/>
      <line x1={x(BR2_GRID.pulseTime)} x2={x(BR2_GRID.pulseTime)} y1="47" y2="240"
        stroke="#cc94d7" strokeDasharray="4 4"/>
      <text x="46" y="268" fontSize="11" fill="#b9d0c4">0s</text>
      <text x="677" y="268" fontSize="11" fill="#b9d0c4">{BR2_GRID.duration}s</text>
    </svg>
    <div className="br2-legend"><span><i className="br2-gold"/>Selected</span>
      <span><i className="br2-blue"/>Reciprocal at same coupling</span>
      <span><i className="br2-green"/>Recovery threshold</span></div>
  </div>
}
function download(slice){
  const text=JSON.stringify(buildBR2Receipt(slice),null,2)+'\n'
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}))
  const a=document.createElement('a')
  a.href=url;a.download=`NBG_BR2_d${slice.damping}_delta${slice.detuning}.json`
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function ResilienceAtlas(){
  const [damping,setDamping]=useState(0.46)
  const [detuning,setDetuning]=useState(0.12)
  const [view,setView]=useState('recovery')
  const [selectedKey,setSelectedKey]=useState('0.75|0.75')
  const slice=useMemo(()=>runBR2Slice({damping,detuning}),[damping,detuning])
  const selected=slice.cells.find(c=>`${c.coupling}|${c.asymmetry}`===selectedKey)||slice.cells[0]
  const reciprocal=slice.cells.find(c=>c.coupling===selected.coupling&&c.asymmetry===0)
  return <section id="resilience-atlas" className="section br2-section">
    <div className="section-label">NBG-BR2 · FROZEN SYNTHETIC FACTORIAL SWEEP</div>
    <h2>Resilience <em>Atlas</em></h2>
    <p className="br2-intro">Does directional coupling help, hurt, or have no measurable effect on recovery? Explore a bounded factorial sweep of the original BR1 equations. Each cell compares the same 38-second simulation horizon, threshold, forcing, kick, and integration step. Correlation is a separate observer, not a measure of resilience.</p>
    <div className="br2-summary">
      <div><small>Full preregistered grid</small><strong>972 cells</strong></div>
      <div><small>Current slice</small><strong>{slice.summary.total} cells</strong></div>
      <div><small>Recovered in slice</small><strong>{slice.summary.recovered}</strong></div>
      <div><small>High correlation, no recovery</small><strong>{slice.summary.highCoordinationWithoutRecovery}</strong></div>
    </div>
    <div className="br2-panel">
      <div className="br2-controls">
        <label>Common damping γ
          <select value={damping} onChange={e=>setDamping(Number(e.target.value))}>
            {BR2_GRID.damping.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Frequency mismatch δ
          <select value={detuning} onChange={e=>setDetuning(Number(e.target.value))}>
            {BR2_GRID.detuning.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Atlas Keyhole
          <select value={view} onChange={e=>setView(e.target.value)}>
            {Object.entries(viewNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="button" className="br2-export" onClick={()=>download(slice)}>Export slice receipt</button>
      </div>
      <div className="br2-map-layout">
        <div className="br2-map-area">
          <p className="br2-axis-label">Y: Coupling strength k · X: Directional asymmetry a</p>
          <div className="br2-matrix" role="group" aria-label="Synthetic resilience heatmap. Each button is a configuration with explicit accessibility label.">
            <span className="br2-corner">k \ a</span>
            {BR2_GRID.asymmetry.map(a=><span key={a} className="br2-axis">{compact(a)}</span>)}
            {BR2_GRID.coupling.map(k=><div className="br2-matrix-row" key={k}>
              <span className="br2-axis br2-yaxis">{compact(k)}</span>
              {BR2_GRID.asymmetry.map(a=>{
                const cell=slice.cells.find(c=>c.coupling===k&&c.asymmetry===a)
                const active=selected.coupling===k&&selected.asymmetry===a
                return <button key={a} type="button"
                  className={`br2-cell br2-${classify(cell,view)}`}
                  aria-pressed={active}
                  aria-label={`Coupling ${k}, asymmetry ${a}: ${outcomeLabel(cell)}, baseline velocity correlation ${cell.velocityCorrelation??'undefined'}`}
                  title={`k=${k} · a=${a} · ${cell.state} · ${cell.comparedToReciprocal}`}
                  onClick={()=>setSelectedKey(`${k}|${a}`)}>
                  {cell.mismatch?'!':''}
                </button>
              })}
            </div>)}
          </div>
          <div className="br2-legend">{legendFor(view).map(([name,label])=><span key={name}>
            <i className={`br2-swatch br2-${name}`}/>{label}</span>)}</div>
          <p className="br2-small">A cell is horizon-censored if recovery was not observed by 38 s. It is <strong>not</strong> classified as permanently unstable. Exclamation marks flag high baseline velocity correlation (≥0.95) without observed recovery.</p>
        </div>
        <aside className="br2-detail">
          <div className="br2-eyebrow">SELECTED SIMULATION · <code>{BR2_PROTOCOL}</code></div>
          <h3>k = {selected.coupling} · a = {selected.asymmetry}</h3>
          <p><strong>{outcomeLabel(selected)}</strong></p>
          <dl>
            <div><dt>Directional comparison</dt><dd>{selected.comparedToReciprocal.replaceAll('_',' ')}</dd></div>
            <div><dt>Recovery time</dt><dd>{selected.recoveryTime===null?'Censored':show(selected.recoveryTime,2)+' s'}</dd></div>
            <div><dt>Reciprocal recovery</dt><dd>{reciprocal.recoveryTime===null?'Censored':show(reciprocal.recoveryTime,2)+' s'}</dd></div>
            <div><dt>Directional advantage</dt><dd>{selected.recoveryAdvantageSeconds===null?'Not comparable':show(selected.recoveryAdvantageSeconds,2)+' s'}</dd></div>
            <div><dt>Final full-state residue</dt><dd>{show(selected.finalResidue,4)}</dd></div>
            <div><dt>Baseline velocity correlation</dt><dd>{show(selected.velocityCorrelation,4)}</dd></div>
            <div><dt>Keyhole mismatch</dt><dd>{selected.mismatch?'YES':'No'}</dd></div>
          </dl>
        </aside>
      </div>
      <ResidueComparison selected={selected} reciprocal={reciprocal}/>
    </div>
    <div className="br2-bottom">
      <article><h3>Symmetry is a question, not a verdict</h3><p>Every directional configuration is compared to a reciprocal case with matching coupling, damping and detuning. Neither asymmetry nor reciprocity is assumed superior.</p></article>
      <article><h3>Two Keyholes, different answers</h3><p>Full-state shock recovery and undisturbed velocity correlation are computed separately. High correlation can coexist with poor recovery.</p></article>
      <article><h3>Numerics and boundaries</h3><p>Fixed-step RK4 (0.04), 10-second kick, 38-second horizon, strict full-state threshold 0.06 sustained for two final seconds. No Lyapunov or chaotic-dynamics claim.</p></article>
    </div>
    <p className="br2-disclaimer"><strong>SIMULATED · EXPLORATORY · NO AUTHORITY.</strong> This is a model comparison, not measured physics, biological prediction, social theory, evidence for metaphysical duality, or proof that imbalance causes chaos. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/RESILIENCE_ATLAS.md" target="_blank" rel="noreferrer">Protocol &amp; falsifiers ↗</a></p>
  </section>
}
