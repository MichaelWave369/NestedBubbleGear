import { useMemo, useState } from 'react'
import { runEG04 } from './eg04Model.js'
import './eg04Lab.css'

const format = (value, places = 4) => Number(value).toFixed(places)

function SweepPlot({ report, type, title, description }) {
  const data = report.series
  const W = 570, H = 190, l = 54, r = 21, t = 18, b = 35
  const width = W - l - r, height = H - t - b
  const horizontal = v => l + (v - .5) / 19.5 * width
  const vertical = v => t + height * (1 - v)
  const maximum = type === 'ratio' ? 1 : Math.ceil(data.at(-1).log10FalseAmplification)
  const getValue = row => type === 'ratio' ? row.geometricRatio : row.log10FalseAmplification / maximum
  const poly = data.map((point, i) =>
    (i === 0 ? 'M' : 'L') +
    horizontal(point.thicknessOverLambda).toFixed(2) + ',' +
    vertical(getValue(point)).toFixed(2)
  ).join(' ')
  const currentX = report.conventional.thicknessOverLambda
  const markerOnPlot = currentX >= .5 && currentX <= 20
  return <figure className="eg04-figure">
    <figcaption><strong>{title}</strong><span>{description}</span></figcaption>
    <svg viewBox={'0 0 ' + W + ' ' + H} role="img"
      aria-label={title + '. Horizontal axis thickness divided by penetration length, from 0.5 to 20. Vertical axis ' + description}>
      {[0,.25,.5,.75,1].map(frac=><g key={frac}>
        <line x1={l} y1={vertical(frac)} x2={W-r} y2={vertical(frac)}
          stroke="rgba(150,202,209,.18)" strokeDasharray="3 4"/>
        <text x={l-9} y={vertical(frac)+4} fontSize="10" fill="#a2bec4" textAnchor="end">
          {type==='ratio'?format(frac,2):format(frac*maximum,1)}
        </text>
      </g>)}
      {[.5,5,10,15,20].map(v=><text key={v} x={horizontal(v)} y={H-14} textAnchor="middle" fontSize="10" fill="#a2bec4">{v}</text>)}
      <path d={poly} fill="none" stroke={type==='ratio'?'#8ee7d1':'#ffc18b'} strokeWidth="2.9"/>
      {markerOnPlot&&<line x1={horizontal(currentX)} x2={horizontal(currentX)} y1={t} y2={t+height}
        stroke="#dae9db" strokeOpacity=".5" strokeDasharray="4 4"/>}
      <text x={W/2} y={H-1} textAnchor="middle" fontSize="10" fill="#a2bec4">Thickness / penetration length (d/λ)</text>
    </svg>
    {!markerOnPlot&&<p className="eg04-note">Selected d/λ lies outside this 0.5–20 sweep; numerical metrics below still use your actual selection.</p>}
  </figure>
}
function AuditLink({ row }) {
  const titles={'L1991':'Li & Torr 1991','L1992':'Li & Torr 1992','K1994':'Kowitt 1994'}
  return <article className="eg04-source" key={row.id}>
    <header><code>{row.id}</code><strong>{titles[row.id]}</strong></header>
    <p>{row.reported}</p>
    <p><b>Access:</b> {row.access}</p>
    <p><b>EG-04 status:</b> {row.testedHere}</p>
    <a target="_blank" rel="noopener noreferrer" href={row.source}>Official publication / DOI ↗</a>
  </article>
}
export default function EG04Lab() {
  const [penetrationNm,setPenetrationNm]=useState(80)
  const [thicknessNm,setThicknessNm]=useState(400)
  const [surfaceFieldmT,setSurfaceFieldmT]=useState(10)
  const [nodes,setNodes]=useState(201)
  const report=useMemo(()=>runEG04({penetrationNm,thicknessNm,surfaceFieldmT,nodes}),
    [penetrationNm,thicknessNm,surfaceFieldmT,nodes])
  const reset=()=>{setPenetrationNm(80);setThicknessNm(400);setSurfaceFieldmT(10);setNodes(201)}
  const download=()=>{
    const body=JSON.stringify({
      ...report,protocol:'experiments/EG04/PROTOCOL.md',exportedAt:new Date().toISOString(),
      warning:'The inverse-square number is an INVALID variable substitution stress test. Not conductivity, gravity, or an experimental result.'
    },null,2)
    const url=URL.createObjectURL(new Blob([body],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=url;a.download='nbg-eg04-permeability-audit-simulated.json';a.click()
    URL.revokeObjectURL(url)
  }
  return <section className="eg04-shell" id="eg04" aria-labelledby="eg04-title">
    <header className="eg04-heading">
      <div>
        <div className="research-overline">EG-04 · LI–TORR / KOWITT · VARIABLE-IDENTITY AUDIT</div>
        <h3 id="eg04-title">When shielding looks like <em>amplification.</em></h3>
        <p>What happens if a scientist mistakes a slab's <strong>geometry-dependent magnetic screening</strong> for a microscopic material permeability? Compare the ordinary London solution to an explicitly invalid inference using the inverse-square dependence discussed in Li and Torr's 1992 paper.</p>
      </div>
      <div className="eg04-stamp"><strong>SIMULATED · E0</strong><span>Authority NONE</span><span>Full source derivation not completed</span></div>
    </header>
    <div className="eg04-formula">
      <div><span>CONVENTIONAL LONDON SLAB</span><strong>R = ⟨B⟩ / Bₛ = (2λ / d) tanh(d / 2λ)</strong></div>
      <div><span>DELIBERATELY WRONG SUBSTITUTION</span><strong>P<sub>invalid</sub> = 1 / R²</strong></div>
    </div>
    <div className="eg04-workbench">
      <div className="eg04-controls">
        <h4>01 / Study a conventional slab</h4>
        <label htmlFor="eg04-lambda">London penetration length <output>{penetrationNm} nm</output></label>
        <input id="eg04-lambda" type="range" min="30" max="250" step="5" value={penetrationNm} onChange={e=>setPenetrationNm(+e.target.value)}/>
        <label htmlFor="eg04-depth">Slab thickness <output>{thicknessNm} nm</output></label>
        <input id="eg04-depth" type="range" min="40" max="1500" step="20" value={thicknessNm} onChange={e=>setThicknessNm(+e.target.value)}/>
        <label htmlFor="eg04-field">Applied tangential surface field <output>{surfaceFieldmT} mT</output></label>
        <input id="eg04-field" type="range" min="0" max="25" step="1" value={surfaceFieldmT} onChange={e=>setSurfaceFieldmT(+e.target.value)}/>
        <label htmlFor="eg04-grid">Integration mesh</label>
        <select id="eg04-grid" value={nodes} onChange={e=>setNodes(+e.target.value)}>
          <option value={51}>51 sample points</option>
          <option value={101}>101 sample points</option>
          <option value={201}>201 sample points</option>
          <option value={401}>401 sample points</option>
        </select>
        <p className="eg04-note">Geometry: infinite planar slab, static parallel field, uniform λ, Meissner regime. Vortices, finite edges and gravity are not modeled. This is a mathematical parameter sweep, not hardware testing.</p>
        <div className="eg04-actions"><button type="button" onClick={reset}>Reset baseline</button><button type="button" onClick={download}>Export SIMULATED receipt</button></div>
      </div>
      <div className="eg04-main">
        <h4>02 / Two mathematical curves, two very different meanings</h4>
        <div className="eg04-graphs">
          <SweepPlot report={report} type="ratio" title="Real conventional screening geometry" description="Dimensionless average field ratio R"/>
          <SweepPlot report={report} type="false" title="Invalid substitution stress test" description="log₁₀ of the constructed 1/R² number"/>
        </div>
        <div className="eg04-stats">
          <div><span>Thickness / λ</span><strong>{format(report.conventional.thicknessOverLambda,2)}</strong><small>Dimensionless geometry</small></div>
          <div><span>London screening ratio R</span><strong>{format(report.conventional.geometricScreeningRatio,5)}</strong><small>Macroscopic average, not material μr</small></div>
          <div><span>False inverse-square proxy</span><strong>{format(report.invalidInference.formalInverseSquare,2)}×</strong><small>Not measured force or conductivity</small></div>
          <div><span>Field energy per area</span><strong>{report.conventional.fieldEnergyPerAreaJm2.toExponential(3)} J/m²</strong><small>Finite, conventional magnetic-field energy only</small></div>
        </div>
        <div className="eg04-warning" role="note">
          <strong>INTERPRETATION FIREWALL</strong>
          <p>The orange number is deliberately <b>not physically meaningful</b>. It results from putting the wrong quantity into a mathematical dependency. EG-04 does not calculate Li–Torr conductivity, change gravitational acceleration or measure a new force.</p>
        </div>
      </div>
    </div>
    <div className="eg04-footer">
      <div>
        <h4>03 / NBG Keyhole connection</h4>
        <p>In this London geometry, the signed screening currents on opposite faces cancel when summed. Yet each face still carries a local current and the field profile changes across the slab. The coarse sum discards information that a spatial observer retains.</p>
        <div className="eg04-minor-stats"><span>Signed current integral <b>{report.conventional.signedSheetCurrentApm.toExponential(2)} A/m</b></span><span>Half-slab sheet current <b>{report.conventional.halfSheetCurrentApm.toExponential(2)} A/m</b></span></div>
        <p className="eg04-note">This is an analogy to NBG's observer semantics, not a new physical law.</p>
      </div>
      <div>
        <h4>04 / Published source trail</h4>
        <p>The 1992 paper's Eq. 48 contains an approximate inverse-square permeability dependence, while Kowitt's 1994 publisher abstract disputes the permeability interpretation. Those texts do not automatically validate either model without independent reproduction and measurement.</p>
        <div className="eg04-sources">{report.audit.map(row=><AuditLink key={row.id} row={row}/>)}</div>
        <a className="eg04-protocol" href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/EG04/PROTOCOL.md"
          target="_blank" rel="noopener noreferrer">Open EG-04 protocol, scanned-paper page references and promotion gates ↗</a>
      </div>
    </div>
  </section>
}
