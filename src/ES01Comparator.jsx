import { useState } from 'react'
import registry from './es01Evidence.json'
import { compareES01Records, ES01_STUDY_CONTEXT } from './es01Comparison.js'

const all = registry.records
const named = r => r.family+' · '+r.compound

export default function ES01Comparator() {
 const [leftId,setLeftId]=useState('ES01-MDMA-RMDDMA')
 const [rightId,setRightId]=useState('ES01-MDA-COMP')
 const left=all.find(r=>r.id===leftId)
 const right=all.find(r=>r.id===rightId)
 const result=compareES01Records(left,right)
 return <section className="es01-comparator" aria-labelledby="es01-e1-title">
   <div className="es01-comparator-head"><span className="es01-eyebrow">E1 · EVIDENCE COMPARISON GATE</span><h4 id="es01-e1-title">Compare the studies, not imaginary cure scores.</h4>
     <p>Choose two source records. The gate displays what the literature supports and what additional measurements would be needed. It never calculates clinical efficacy or a safe dose.</p></div>
   <div className="es01-compare-selects">
     <label>First evidence record<select value={leftId} onChange={e=>setLeftId(e.target.value)}>{all.map(r=><option key={r.id} value={r.id}>{named(r)}</option>)}</select></label>
     <label>Second evidence record<select value={rightId} onChange={e=>setRightId(e.target.value)}>{all.map(r=><option key={r.id} value={r.id}>{named(r)}</option>)}</select></label>
   </div>
   <div className="es01-compare-summary" aria-live="polite">
     <strong>{result.admissibility==='SAME_RECORD'?'Not an independent comparison':'Context comparison only'}</strong>
     <p>{result.supported}</p>
     <div className="es01-compare-context"><p><b>{left.compound}</b><span>{ES01_STUDY_CONTEXT[left.id].setting}</span></p><p><b>{right.compound}</b><span>{ES01_STUDY_CONTEXT[right.id].setting}</span></p></div>
     <h5>Inference boundaries</h5><ul>{result.blockers.map((item,i)=><li key={i}>{item}</li>)}</ul>
     <p className="es01-compare-next"><b>Next admissible measurement:</b> {result.nextMeasurement}</p>
     <div className="es01-compare-citations"><a href={left.source.url} target="_blank" rel="noopener noreferrer">Source A ↗</a>{left.id!==right.id&&<a href={right.source.url} target="_blank" rel="noopener noreferrer">Source B ↗</a>}
     <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E1_COMPARABILITY_GATES.md" target="_blank" rel="noopener noreferrer">E1 method ↗</a></div>
   </div>
 </section>
}
