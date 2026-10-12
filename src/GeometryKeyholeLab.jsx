import {useMemo,useState} from 'react'
import {G1_PROTOCOL,cubeCensus,foldCubeNet,CROSS_NET,RECTANGLE_NET,hypercubeCensus,projectionWitness,buildG1Receipt} from './geometryKeyhole.js'
import './geometryKeyhole.css'

function Shape({cells}){
  const maxX=Math.max(...cells.map(p=>p[0])),maxY=Math.max(...cells.map(p=>p[1]))
  return <svg viewBox={'-3 -3 '+((maxX+1)*24+6)+' '+((maxY+1)*24+6)} role="img" aria-label="six square connected shape">
    {cells.map(([x,y])=><rect key={x+':'+y} x={24*x} y={24*y} width="24" height="24" rx="1"
      fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.8"/>)}
  </svg>
}
function downloadReceipt(){
  const blob=new Blob([JSON.stringify(buildG1Receipt(),null,2)+'\n'],{type:'application/json'})
  const url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='NBG-G1-geometry-keyhole-v0.1.0.json'
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}
export default function GeometryKeyholeLab(){
  const census=useMemo(()=>cubeCensus(),[])
  const [filter,setFilter]=useState('all')
  const [selectedId,setSelectedId]=useState(census.nets.find(n=>n.foldable)?.id||'H01')
  const selected=census.nets.find(n=>n.id===selectedId)
  const visible=census.nets.filter(n=>filter==='all'||(filter==='foldable'?n.foldable:!n.foldable))
  const result=foldCubeNet(selected.cells)
  const t=hypercubeCensus(),p=projectionWitness()
  return <section id="geometry-keyhole" className="section g1-section">
    <span className="section-label">NBG-G1 · GEOMETRY KEYHOLE · SIMULATED / FORMAL</span>
    <h2>Same six squares.<br/><em>Different ability to close.</em></h2>
    <p className="muted">A coarse observer counts tiles and sees the same six units in every shape.
      A richer observer checks adjacency and 90-degree face orientations. Only 11 of the 35 distinct hexominoes fold into a cube.</p>
    <div className="g1-kpis" aria-label="Geometry census">
      <div><strong>{census.shapeCount}</strong><span>Free hexominoes</span></div>
      <div><strong>{census.foldableCount}</strong><span>Valid cube nets</span></div>
      <div><strong>{census.nonfoldableCount}</strong><span>Cannot fold to cube</span></div>
      <div><strong>{t.cubicCells}</strong><span>Tesseract cubic cells</span></div>
    </div>
    <div className="g1-layout">
      <div>
        <div className="g1-toolbar"><h3>Observer atlas</h3><label htmlFor="g1-filter">Show</label>
          <select id="g1-filter" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All 35</option><option value="foldable">11 cube nets</option>
            <option value="nonfoldable">24 controls</option>
          </select>
        </div>
        <div className="g1-gallery" aria-label="Six-square shape selector">
          {visible.map(net=><button key={net.id} type="button" aria-pressed={selectedId===net.id}
            className={selectedId===net.id?'g1-tile active':'g1-tile'} onClick={()=>setSelectedId(net.id)}
            title={net.id+': '+(net.foldable?'cube net':'not a cube net')}>
            <Shape cells={net.cells}/><span>{net.id}</span>
          </button>)}
        </div>
      </div>
      <aside className="g1-analysis">
        <span className="section-label">RICH KEYHOLE · FACE ORIENTATION</span>
        <h3>{selected.id}: {result.folds?'CUBE FOLDABLE':'NOT CUBE FOLDABLE'}</h3>
        <div className="g1-selected"><Shape cells={selected.cells}/></div>
        <p>Coarse observation: <strong>6 squares</strong> (identical for all 35).</p>
        <p>Richer verdict: <strong>{result.reason}</strong>.</p>
        <p>Unfolded nets are not prisons or portals in the model; they are different planar representations of a known polyhedron.</p>
        <div className="g1-pair">
          <div><small>Positive control: cross</small><Shape cells={CROSS_NET}/><strong>Folds</strong></div>
          <div><small>Negative control: 2 × 3</small><Shape cells={RECTANGLE_NET}/><strong>Does not fold</strong></div>
        </div>
      </aside>
    </div>
    <div className="g1-projection">
      <div>
        <span className="section-label">DIMENSIONAL KEYHOLE · EXACT TOY WITNESS</span>
        <h3>4D → 3D projection loses information</h3>
        <p>Two 4D vertices differ in their fourth coordinate, yet their first three coordinates match exactly.
          One extra coordinate query separates them. The tesseract has {t.vertices} vertices, {t.edges} edges,
          {t.squareFaces} square faces and {t.cubicCells} cubic cells.</p>
      </div>
      <div className="g1-math">
        <code>π({p.stateA.join(',')}) = ({p.coarseA.join(',')})</code>
        <code>π({p.stateB.join(',')}) = ({p.coarseB.join(',')})</code>
        <code>q₄(A) = {p.probeA} · q₄(B) = {p.probeB}</code>
        <strong>Coarse equal. Rich distinct.</strong>
      </div>
    </div>
    <p className="g1-guard">Scope: {G1_PROTOCOL.origin} finite mathematics only. Geometric identities do not prove historical
      causation, Saturnian control, cosmic imprisonment, consciousness claims, or a physical fourth dimension.</p>
    <div className="g1-actions">
      <button type="button" onClick={downloadReceipt}>Export deterministic G1 receipt</button>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/GEOMETRY_KEYHOLE.md">Protocol &amp; limitations ↗</a>
    </div>
  </section>
}
