import { useMemo, useState } from 'react'
import { EG02, runEG02 } from './eg02Model.js'
import './eg02Lab.css'

const papers = [
  {year:'1991',who:'Li & Torr',tag:'THEORY',text:'Published a coupled magnetic/gravitomagnetic model for a pure superconductor. Prediction is not verified hardware.',url:'https://doi.org/10.1103/PhysRevD.43.457'},
  {year:'1992',who:'Li & Torr',tag:'THEORY',text:'Explored gravitational corrections to magnetic attenuation and superconducting constitutive parameters.',url:'https://doi.org/10.1103/PhysRevB.46.5489'},
  {year:'1994',who:'Kowitt',tag:'DIRECT CRITIQUE',text:'Challenged the 1992 model’s interpretation of magnetic permeability and the claimed magnitude.',url:'https://doi.org/10.1103/PhysRevB.49.704'},
  {year:'2003',who:'Hathaway et al.',tag:'NEGATIVE REPLICATION',text:'Tested a DIFFERENT Podkletnov spinning-disk claim; no gravity-like weight modification to apparatus sensitivity.',url:'https://doi.org/10.1016/S0921-4534(02)02284-0'},
]
const num=(x,d=4)=>Number(x).toFixed(d)

export default function EG02Lab(){
  const [massKg,setMassKg]=useState(.1)
  const [momentAm2,setMomentAm2]=useState(.02)
  const [gradientTPerM,setGradientTPerM]=useState(.5)
  const [fractionalWeight,setFractionalWeight]=useState(0)
  const [dualMass,setDualMass]=useState(true)
  const [reverseGradient,setReverseGradient]=useState(true)
  const [noiseN,setNoiseN]=useState(0)
  const report=useMemo(()=>runEG02({
    massKg,momentAm2,gradientTPerM,fractionalWeight,
    dualMass,reverseGradient,noiseN
  }),[massKg,momentAm2,gradientTPerM,fractionalWeight,dualMass,reverseGradient,noiseN])
  const download=()=>{
    const payload=JSON.stringify({...report, protocol:'experiments/EG02/PROTOCOL.md',
      exportedAt:new Date().toISOString(),warning:'No empirical gravity measurement or Li–Torr reproduction'},null,2)
    const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=url;a.download='nbg-eg02-simulated-audit.json';a.click();URL.revokeObjectURL(url)
  }
  const reset=()=>{
    setMassKg(.1);setMomentAm2(.02);setGradientTPerM(.5);setFractionalWeight(0)
    setDualMass(true);setReverseGradient(true);setNoiseN(0)
  }
  const fit=report.fit
  return <section className="eg02-shell" id="eg02" aria-labelledby="eg02-title">
    <div className="eg02-heading">
      <div>
        <div className="research-overline">EG-02 · INDEPENDENT MODEL AUDIT · FIELD & GRAVITY</div>
        <h3 id="eg02-title">The force <em>forensics lab.</em></h3>
        <p>Could an ordinary magnetic force imitate a change in weight? Explore the known SI force law, introduce a <strong>fictional</strong> extra term, and test what paired mass and field-gradient controls can or cannot identify.</p>
      </div>
      <div className="eg02-claim"><strong>SIMULATED · E0</strong><span>Authority NONE</span><span>Not a real gravity or superconductor experiment</span></div>
    </div>
    <div className="eg02-equation" aria-label="Synthetic change in scale force">
      <span>ΔF =</span><b>f · M · g</b><span>+</span><b>m<sub>z</sub> · ∂B<sub>z</sub>/∂z</b><span>+</span><b>offset</b><span>+</span><b>noise</b>
      <small>injected weight term</small><small>conventional magnetic force</small>
    </div>
    <div className="eg02-layout">
      <div className="eg02-panel eg02-settings">
        <h4>01 / Synthetic fixture</h4>
        <label htmlFor="eg02-mass">Sample mass <output>{Math.round(massKg*1000)} g</output></label>
        <input id="eg02-mass" type="range" min=".05" max=".4" step=".01" value={massKg} onChange={e=>setMassKg(+e.target.value)}/>
        <label htmlFor="eg02-moment">Fixed pickup moment <output>{num(momentAm2,3)} A·m²</output></label>
        <input id="eg02-moment" type="range" min="0" max=".06" step=".002" value={momentAm2} onChange={e=>setMomentAm2(+e.target.value)}/>
        <label htmlFor="eg02-gradient">Magnetic gradient magnitude <output>{num(gradientTPerM,2)} T/m</output></label>
        <input id="eg02-gradient" type="range" min=".1" max="2" step=".1" value={gradientTPerM} onChange={e=>setGradientTPerM(+e.target.value)}/>
        <label htmlFor="eg02-injection">Injected fractional weight term <output>{num(fractionalWeight*100,1)}%</output></label>
        <input id="eg02-injection" type="range" min="0" max=".03" step=".002" value={fractionalWeight} onChange={e=>setFractionalWeight(+e.target.value)}/>
        <p className="eg02-note">Default f = 0. Any other value is inserted in software and has no evidentiary meaning.</p>
        <label className="eg02-toggle"><input type="checkbox" checked={dualMass} onChange={e=>setDualMass(e.target.checked)}/> Test both M and 2M sample masses</label>
        <label className="eg02-toggle"><input type="checkbox" checked={reverseGradient} onChange={e=>setReverseGradient(e.target.checked)}/> Reverse the signed field gradient</label>
        <label htmlFor="eg02-noise">Perturbation</label>
        <select id="eg02-noise" value={noiseN} onChange={e=>setNoiseN(+e.target.value)}>
          <option value={0}>Off · exact fixture</option>
          <option value={0.0002}>Low · 0.2 mN</option>
          <option value={0.001}>Higher · 1.0 mN</option>
        </select>
        <div className="eg02-buttons"><button type="button" onClick={reset}>Reset null</button><button type="button" onClick={download}>Export synthetic JSON</button></div>
      </div>
      <div className="eg02-panel eg02-output">
        <h4>02 / SI force budget · one nominal condition</h4>
        <div className="eg02-metrics">
          <div><span>Nominal weight</span><strong>{num(report.budget.weightN,5)} N</strong><small>M × g, no modification</small></div>
          <div><span>Ordinary magnetic pickup</span><strong>{num(report.budget.magneticN,5)} N</strong><small>m<sub>z</sub> · gradient</small></div>
          <div><span>Equivalent scale shift</span><strong>{num(report.budget.magneticPercent,2)}%</strong><small>Magnetic force / nominal weight</small></div>
          <div><span>Artificial f contribution</span><strong>{num(report.budget.injectedN,5)} N</strong><small>Software-injected control only</small></div>
        </div>
        <div className="eg02-keyhole">
          <span className="eg02-label">03 / NBG IDENTIFIABILITY KEYHOLE</span>
          <strong className={fit?'eg02-result-ok':'eg02-result-hold'}>{fit?'DISTINGUISHABLE IN TOY':'NOT IDENTIFIABLE'}</strong>
          <p>{fit
            ? 'Two masses × reversed gradients span all three assumed signal terms. Under this synthetic fixture’s strict invariance conditions, ordinary least squares can separate the injected response.'
            : 'Missing at least one independent control. The model cannot disentangle a weight-like term, magnetic pickup and instrument offset. No anomaly conclusion is permitted.'}</p>
          <div className="eg02-fits">
            <div><span>Design rank</span><strong>{report.rank} / 3</strong></div>
            <div><span>Recovered f</span><strong>{fit?num(fit.fractionalWeight*100,3)+'%':'REFUSED'}</strong></div>
            <div><span>Recovered moment</span><strong>{fit?num(fit.momentAm2,4)+' A·m²':'REFUSED'}</strong></div>
            <div><span>Fit RMSE</span><strong>{fit?num(fit.rmseN,6)+' N':'REFUSED'}</strong></div>
          </div>
        </div>
        <div className="eg02-fixtures">
          <h4>04 / Distinct measurement configurations</h4>
          <div className="eg02-table-wrap">
            <table>
              <thead><tr><th scope="col">Mass</th><th scope="col">Gradient</th><th scope="col">Force shift</th></tr></thead>
              <tbody>
                {report.records.filter(row=>row.replica===0).map((row,i)=>
                  <tr key={i}><td>{Math.round(row.massKg*1000)} g</td><td>{num(row.gradientTPerM,2)} T/m</td><td>{num(row.observedN*1000,3)} mN</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="eg02-note">The dipole moment is deliberately held constant across different sample masses, which is usually <strong>not</strong> guaranteed in a physical apparatus. Real experiments need calibrated material and fixture controls.</p>
        </div>
      </div>
    </div>
    <div className="eg02-history">
      <div>
        <span className="eg02-label">05 / PRIMARY-SOURCE EVIDENCE LADDER</span>
        <h4>What was claimed, challenged, and independently tested?</h4>
        <p>These are separate publications and mechanisms. A failed spinning-disk replication is not a direct numerical test of Li and Torr's theoretical derivation.</p>
      </div>
      <div className="eg02-papers">
        {papers.map(p=><article key={p.year}>
          <span>{p.year} · {p.tag}</span>
          <strong>{p.who}</strong>
          <p>{p.text}</p>
          <a href={p.url} target="_blank" rel="noopener noreferrer">Primary publication ↗</a>
        </article>)}
      </div>
      <p className="eg02-flag">This source audit uses published abstracts and accessible publication summaries. Full paper equation transcription and independent derivation comparison are reserved for a later phase. Amy Eskridge's HAL5 historical survey is context, not a new experimental result.</p>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG02/PROTOCOL.md"
        rel="noopener noreferrer" target="_blank">Open EG-02 assumptions, literature ledger, tests and promotion gates ↗</a>
    </div>
  </section>
}
