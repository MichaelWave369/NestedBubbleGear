import { useState } from 'react'
import evidence from './es01Evidence.json'
import hypotheses from './es01Hypotheses.json'

const sourceById = Object.fromEntries(evidence.records.map(record => [record.id, record]))
const questions = hypotheses.records

export default function ES01HypothesisLab() {
  const [selectedId, setSelectedId] = useState(questions[0].id)
  const selected = questions.find(h => h.id === selectedId) ?? questions[0]
  const source = sourceById[selected.sourceRecordId]
  return <section id="es01-e3" className="es01-e3" aria-labelledby="es01-e3-title">
    <div className="es01-e3-head">
      <span className="es01-eyebrow">E3 · QUESTION CONTRACTS · DRAFT ONLY</span>
      <h4 id="es01-e3-title">What would prove our hypothesis wrong?</h4>
      <p>Every candidate explanation has an alternative and a potential disconfirming observation.
        These are research questions, not predictions, preregistrations, or new experimental results.</p>
    </div>
    <label className="es01-e3-selector" htmlFor="es01-e3-picker">
      Choose a research question
      <select id="es01-e3-picker" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
        {questions.map(h => <option key={h.id} value={h.id}>{h.family} · {sourceById[h.sourceRecordId].compound}</option>)}
      </select>
    </label>
    <article className="es01-e3-card" aria-live="polite">
      <div className="es01-e3-meta"><span>{selected.id}</span><strong>{selected.status === 'DRAFT_UNTESTED' ? 'DRAFT · NOT TESTED' : 'UNRECOGNIZED STATUS'}</strong></div>
      <h5>{selected.question}</h5>
      <div className="es01-e3-contrasts">
        <section><h6>Candidate interpretation</h6><p>{selected.candidate}</p></section>
        <section><h6>Competing explanation</h6><p>{selected.alternative}</p></section>
      </div>
      <section className="es01-e3-falsifier">
        <h6>What evidence could distinguish the explanations?</h6>
        <p>{selected.discriminatingEvidence}</p>
        <h6>What observation could count against the candidate?</h6>
        <p>{selected.couldCountAgainst}</p>
      </section>
      <details className="es01-e3-gaps">
        <summary>Missing evidence and interpretation boundaries</summary>
        <ul>{selected.requiredEvidence.map(item => <li key={item}>{item}</li>)}</ul>
        <p><strong>Boundary:</strong> {selected.interpretationBoundary}</p>
      </details>
      <div className="es01-e3-footer">
        <p><strong>Evidence authority:</strong> NONE · <strong>Result:</strong> NONE · not preregistered, replicated or run</p>
        <a href={source.source.url} target="_blank" rel="noopener noreferrer">Source record ↗</a>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E3_FALSIFIABILITY_CONTRACTS.md" target="_blank" rel="noopener noreferrer">E3 methods ↗</a>
      </div>
    </article>
  </section>
}
