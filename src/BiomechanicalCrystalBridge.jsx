import {useMemo,useState} from 'react'
import {
  BSR3_DEFAULTS, compareBSR3, buildBSR3Receipt,
} from './biomechanicalCrystalBridge.js'
import './biomechanicalCrystalBridge.css'

const number=(v,d=3)=>Number(v).toFixed(d)
function trace(samples,key,peak,centerY) {
  const width=640,height=170,denom=Math.max(peak,1e-40)
  return samples.filter((_,i)=>i%4===0).map((row,i)=>
    `${i===0?'M':'L'} ${(row.timeSec/20*width).toFixed(2)} ${(centerY-(row[key]/denom)*(height/2-15)).toFixed(2)}`).join(' ')
}
function TracePlot({candidate,nullCoefficient}) {
  const vp=Math.max(candidate.peaks.voltageV,1e-30)
  return <div className="bcr-plot-panel">
    <div className="bcr-plot-head">
      <strong>STRESS → IDEAL OPEN-CIRCUIT VOLTAGE</strong>
      <span>SIMULATED · 20 s · 100 Hz</span>
    </div>
    <svg viewBox="0 0 700 370" className="bcr-plot" role="img"
      aria-label="Time-series of a synthetic sinusoidal applied stress and modeled piezoelectric voltage, with zero coupling null">
      <rect x="0" y="0" width="700" height="370" fill="#091c23"/>
      {[0,1,2,3,4].map(i=><line key={i} x1="40" y1={52+i*67} x2="678" y2={52+i*67} stroke="#7499ae" strokeOpacity=".15"/>)}
      <g transform="translate(38 2)">
        <line x1="0" y1="90" x2="640" y2="90" stroke="#9ac6de" strokeOpacity=".4" strokeDasharray="4 6"/>
        <path d={trace(candidate.samples,'stressPa',Math.max(candidate.peaks.stressPa,1e-30),90)}
          fill="none" stroke="#75deb8" strokeWidth="2.2"/>
        <text x="6" y="22" fill="#75deb8" fontSize="12" fontFamily="monospace">Applied stress · ±{number(candidate.peaks.stressPa,0)} Pa</text>
      </g>
      <g transform="translate(38 170)">
        <line x1="0" y1="90" x2="640" y2="90" stroke="#9ac6de" strokeOpacity=".4" strokeDasharray="4 6"/>
        <path d={trace(candidate.samples,'voltageV',vp,90)}
          fill="none" stroke="#f5c479" strokeWidth="2.2"/>
        <path d={trace(nullCoefficient.samples,'voltageV',vp,90)}
          fill="none" stroke="#d2dce4" strokeOpacity=".65" strokeWidth="1.5" strokeDasharray="5 6"/>
        <text x="6" y="22" fill="#f5c479" fontSize="12" fontFamily="monospace">Ideal V_oc · ±{number(candidate.peaks.voltageV*1e6,3)} µV</text>
      </g>
      <g fontSize="11" fill="#adcad0" fontFamily="monospace">
        <text x="40" y="359">0 s</text><text x="330" y="359">10 s</text>
        <text x="645" y="359">20 s</text>
      </g>
    </svg>
    <div className="bcr-legend">
      <span><i style={{background:'#75deb8'}}/> Imposed stress</span>
      <span><i style={{background:'#f5c479'}}/> Ideal voltage</span>
      <span><i style={{background:'#d2dce4'}}/> Zero-d null</span>
    </div>
  </div>
}
function Range({name,value,min,max,step,onChange,label,unit}) {
  return <label className="bcr-control">
    <span>{label} <strong>{number(value,step<0.1?2:step<1?1:0)} {unit}</strong></span>
    <input aria-label={name} type="range" min={min} max={max} step={step}
      value={value} onChange={e=>onChange(Number(e.target.value))}/>
  </label>
}
const DOC='https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BSR3_BIOMECHANICAL_CRYSTAL_BRIDGE.md'
function exportReceipt(bundle) {
  const file=new Blob([JSON.stringify(buildBSR3Receipt(bundle),null,2)+'\n'],{type:'application/json'})
  const url=URL.createObjectURL(file)
  const anchor=document.createElement('a')
  anchor.href=url;anchor.download='bsr3-crystal-bridge-receipt.json'
  document.body.appendChild(anchor);anchor.click();anchor.remove()
  setTimeout(()=>URL.revokeObjectURL(url),0)
}
export default function BiomechanicalCrystalBridge(){
  const [settings,setSettings]=useState({...BSR3_DEFAULTS})
  const change=(key,value)=>setSettings(old=>({...old,[key]:value}))
  const bundle=useMemo(()=>compareBSR3(settings),[settings])
  const {candidate,nullCoefficient,nullStress,reference}=bundle
  const peak=candidate.peaks
  const isSubElectron=Math.abs(peak.chargeEquivalentElementaryUnits)<1
  return <section id="crystal-bridge" className="section bcr" aria-labelledby="bcr-title">
    <div className="section-label">BSR-3 · BIOMECHANICAL CRYSTAL BRIDGE · SYNTHETIC ONLY</div>
    <h2 id="bcr-title">Apply stress. <em>Test the coupling.</em></h2>
    <p className="bcr-intro">A deliberately idealized electromechanical element follows
      Q = d<sub>eff</sub> × F and V<sub>oc</sub> = Q / C.
      It explores what an <strong>assumed</strong> piezoelectric coefficient would imply
      under a <strong>synthetically imposed</strong> oscillating stress.
      It neither measures nor simulates stress delivery into a pineal gland.</p>
    <div className="bcr-workspace">
      <TracePlot candidate={candidate} nullCoefficient={nullCoefficient}/>
      <div className="bcr-panel">
        <div className="bcr-panel-head">MODEL CONTROLS <strong>SIMULATED / NOT OBSERVED</strong></div>
        <div className="bcr-presets">
          <button type="button" onClick={()=>setSettings({...BSR3_DEFAULTS,effectiveDPcPerN:0})}>Centrosymmetric null</button>
          <button type="button" onClick={()=>setSettings({...BSR3_DEFAULTS})}>Hypothetical response</button>
          <button type="button" onClick={()=>setSettings({...BSR3_DEFAULTS,effectiveDPcPerN:1})}>Assumed reference</button>
        </div>
        <Range name="stress" label="Applied stress amplitude" value={settings.stressPa}
          min={0} max={1000} step={25} unit="Pa" onChange={v=>change('stressPa',v)}/>
        <Range name="effective piezoelectric coefficient" label="Assumed d_eff" value={settings.effectiveDPcPerN}
          min={0} max={2.5} step={0.05} unit="pC/N" onChange={v=>change('effectiveDPcPerN',v)}/>
        <Range name="element dimension" label="Ideal element dimension" value={settings.crystalSizeUm}
          min={1} max={20} step={1} unit="µm" onChange={v=>change('crystalSizeUm',v)}/>
        <Range name="relative permittivity" label="Assumed relative permittivity" value={settings.relativePermittivity}
          min={3} max={30} step={1} unit="" onChange={v=>change('relativePermittivity',v)}/>
        <Range name="stress oscillation frequency" label="Imposed oscillation" value={settings.frequencyHz}
          min={0.1} max={1} step={0.01} unit="Hz" onChange={v=>change('frequencyHz',v)}/>
        <div className="bcr-metrics">
          <div><small>Ideal peak voltage</small><strong>{number(peak.voltageV*1e6,4)} µV</strong></div>
          <div><small>Peak force</small><strong>{number(peak.forceN*1e9,4)} nN</strong></div>
          <div><small>Ideal peak charge</small><strong>{number(peak.chargeC*1e21,4)} zC</strong></div>
          <div><small>Model capacitance</small><strong>{number(candidate.geometry.capacitanceF*1e15,4)} fF</strong></div>
        </div>
        <p className="bcr-quantum">Idealized continuous charge equivalent: <strong>{number(peak.chargeEquivalentElementaryUnits,4)} e</strong>.
          {isSubElectron?' Below one elementary charge. This continuum approximation must not be read as a discrete charge measurement.':' This is a continuum estimate, not a prediction of observed charge transfer.'}
        </p>
        <button className="bcr-export" type="button" onClick={()=>exportReceipt(bundle)}>
          Export synthetic JSON ledger (summary only)
        </button>
      </div>
    </div>
    <div className="bcr-gates">
      <article><span>CONTROL 01</span><h3>Zero coefficient</h3>
        <strong>{number(nullCoefficient.peaks.voltageV*1e6,4)} µV</strong>
        <p>When the effective coefficient is zero, ideal electrical response must be exactly zero.</p></article>
      <article><span>CONTROL 02</span><h3>Zero applied stress</h3>
        <strong>{number(nullStress.peaks.voltageV*1e6,4)} µV</strong>
        <p>Without an imposed mechanical input, the same constitutive equation gives zero response.</p></article>
      <article><span>REFERENCE 03</span><h3>Assumed d = 1 pC/N</h3>
        <strong>{number(reference.peaks.voltageV*1e6,4)} µV</strong>
        <p>Positive software control checks scaling. Not a measured coefficient for pineal calcite.</p></article>
    </div>
    <p className="bcr-warning"><strong>Research boundary:</strong> Calcite microcrystals have been identified in human pineal tissue,
      and symmetry breaking has been proposed as a possible route to piezoelectricity.
      This lab does not establish that human breathing compresses them, produces a detectable signal,
      stimulates neurons, emits light, or alters consciousness. It omits tissue mechanics,
      ionic screening, dielectric loss, electrodes and instrumental noise.
      <a href={DOC} target="_blank" rel="noopener noreferrer"> Read the BSR-3 protocol ↗</a>
    </p>
  </section>
}
