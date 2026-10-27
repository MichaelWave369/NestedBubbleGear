import {useState} from 'react'
import evidence from './es01Evidence.json'
import readiness from './es01Readiness.json'
import hypotheses from './es01Hypotheses.json'
import {ES01_E4_FIELDS,checkES01ReviewReadiness} from './es01ReadinessModel.js'

const sourceById=Object.fromEntries(evidence.records.map(r=>[r.id,r]))
const hypothesisById=Object.fromEntries(hypotheses.records.map(r=>[r.id,r]))
const recordName=r=>r.family+' · '+r.compound

export default function ES01ReadinessPanel(){
  const [selectedId,setSelectedId]=useState(readiness.records[0].recordId)
  const row=readiness.records.find(r=>r.recordId===selectedId)??readiness.records[0]
  const source=sourceById[row.recordId]
  const question=hypothesisById[row.hypothesisId]
  const gate=checkES01ReviewReadiness(row)
  return <section id="es01-e4" className="es01-e4" aria-labelledby="es01-e4-title">
    <header className="es01-e4-header">
      <span className="es01-eyebrow">E4 · RESEARCH REVIEW QUEUE · NOT A CLINICAL ASSESSMENT</span>
      <h4 id="es01-e4-title">What's missing before a scientific comparison?</h4>
      <p>Six documentary checks for each source-linked question. A pending review is not a negative result, and this tool does not calculate therapeutic benefit or harm.</p>
    </header>
    <label htmlFor="es01-e4-source" className="es01-e4-select">Choose a study and evidence need
      <select id="es01-e4-source" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
        {readiness.records.map(r=><option value={r.recordId} key={r.recordId}>{recordName(sourceById[r.recordId])}</option>)}
      </select>
    </label>
    <article className="es01-e4-report" aria-live="polite">
      <div className="es01-e4-gate">
        <strong>{gate.result==='HOLD_REVIEW_INCOMPLETE'?'REVIEW REQUIRED · CLAIM HELD':'UNRECOGNIZED GATE STATUS'}</strong>
        <span>Software checks documentation status only. No clinical recommendation, pooled estimate or validated effect separation.</span>
      </div>
      <h5>{source.compound}</h5>
      <p className="es01-e4-question"><strong>E3 question:</strong> {question.question}</p>
      <div className="es01-e4-grid">
        {ES01_E4_FIELDS.map(field=><div className="es01-e4-check" key={field.key}>
          <span>{field.label}</span><strong>{row[field.key].replaceAll('_',' ').toLowerCase()}</strong>
        </div>)}
      </div>
      <div className="es01-e4-actions">
        <p><strong>Priority source-data need:</strong> {row.nextExtraction}</p>
        <p><strong>Key confound to check:</strong> {row.mostImportantConfound}</p>
        <p><strong>Claim not permitted:</strong> {row.prohibitedInference}</p>
      </div>
      <footer className="es01-e4-links">
        <a href={source.source.url} target="_blank" rel="noopener noreferrer">Original source ↗</a>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E4_EVIDENCE_READINESS.md" target="_blank" rel="noopener noreferrer">E4 documentation ↗</a>
      </footer>
    </article>
    <p className="es01-e4-note">NOT EXTRACTED ≠ NOT REPORTED. NOT SEARCHED ≠ NO REPLICATION EXISTS. No live source inspection or independent method review was performed by this panel.</p>
  </section>
}
