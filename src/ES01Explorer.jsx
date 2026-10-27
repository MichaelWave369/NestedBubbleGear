import { useMemo, useState } from 'react'
import registry from './es01Evidence.json'
import claimAudit from './es01ClaimAudit.json'
import ES01Comparator from './ES01Comparator.jsx'
import './es01Explorer.css'

const ALL = 'All families'
const auditById = Object.fromEntries(claimAudit.records.map(item => [item.recordId, item]))
const tiers = registry.evidenceTiers
const FAMILIES = [ALL, ...registry.families]
const sorted = (records) => [...records].sort((a, b) => registry.families.indexOf(a.family) - registry.families.indexOf(b.family))

export default function ES01Explorer() {
  const [family, setFamily] = useState(ALL)
  const [tier, setTier] = useState('all')
  const [query, setQuery] = useState('')
  const records = useMemo(() => sorted(registry.records).filter(r => {
    if (family !== ALL && r.family !== family) return false
    if (tier !== 'all' && r.evidenceTier !== tier) return false
    const haystack = [r.family,r.compound,r.comparator,r.mechanism,r.desiredEffect,r.undesiredEffect,r.observed,r.relationship].join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [family,tier,query])

  return <section id="es01" className="es01-explorer" aria-labelledby="es01-title">
    <header className="es01-intro">
      <div><span className="es01-eyebrow">ES-01 · LITERATURE ATLAS · E0</span>
        <h3 id="es01-title">Effect Separation Atlas</h3>
        <p>Eight research families. Different mechanisms. One testable question: when can a reported beneficial effect be distinguished from an unwanted one?</p></div>
      <div className="es01-counter"><strong>{registry.families.length}</strong><span>compound families</span><strong>{registry.records.length}</strong><span>source-linked records</span></div>
    </header>
    <p className="es01-boundary"><strong>Research only:</strong> Preclinical readouts are not clinical efficacy. Human safety studies are not proof of treatment. No NBG drug experiment has been performed.</p>
    <div className="es01-controls">
      <label>Search evidence <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search molecules, targets or effects..." /></label>
      <label>Evidence type <select value={tier} onChange={e => setTier(e.target.value)}><option value="all">All evidence types</option>{Object.keys(tiers).map(t => <option value={t} key={t}>{t.replaceAll('-', ' ')}</option>)}</select></label>
    </div>
    <div className="es01-families" aria-label="Filter by substance family">
      {FAMILIES.map(f => <button key={f} type="button" aria-pressed={family === f} className={family === f ? 'active' : ''} onClick={() => setFamily(f)}>{f}</button>)}
    </div>
    <p className="es01-count" aria-live="polite">Showing {records.length} of {registry.records.length} records</p>
    <ES01Comparator />
    <div className="es01-cards">
      {records.map(r => <article className="es01-card" key={r.id}>
        <div className="es01-card-head"><span className="es01-family">{r.family}</span><span className="es01-tier">{r.evidenceTier.replaceAll('-', ' ')}</span></div>
        <h4>{r.compound}</h4>
        <p className="es01-relationship">{r.relationship} · compared with {r.comparator}</p>
        <dl><div><dt>Mechanistic Keyhole</dt><dd>{r.mechanism}</dd></div><div><dt>Desired endpoint</dt><dd>{r.desiredEffect}</dd></div><div><dt>Unwanted endpoint</dt><dd>{r.undesiredEffect}</dd></div></dl>
        <p><strong>Published observation:</strong> {r.observed}</p>
        <p className="es01-limitation"><strong>Claim boundary:</strong> {r.boundary}</p>
        <details className="es01-audit">
          <summary>Claim provenance · E2</summary>
          <div className="es01-audit-content">
            <p className="es01-audit-status">Editorial source-scope check · not independently replicated · {auditById[r.id].reviewDate}</p>
            <p><strong>Scope inspected:</strong> {auditById[r.id].basis}</p>
            <p><strong>Study setting:</strong> {auditById[r.id].observedSetting}</p>
            <p><strong>What the source supports:</strong> {auditById[r.id].supported}</p>
            <p><strong>What is NOT established:</strong> {auditById[r.id].notEstablished}</p>
            <p className="es01-audit-status">Source context: {auditById[r.id].primaryLocation}; no independent verification of study results.</p>
            <a href={auditById[r.id].sourceUrl} target="_blank" rel="noopener noreferrer">Inspect original source ↗</a>
            {auditById[r.id].additionalSource && <> · <a href={auditById[r.id].additionalSource} target="_blank" rel="noopener noreferrer">Prescription label ↗</a></>}
          </div>
        </details>
        <footer><span>{r.studyDesign}</span><a href={r.source.url} target="_blank" rel="noopener noreferrer">Primary source ↗</a></footer>
      </article>)}
    </div>
    {records.length === 0 && <p className="es01-empty">No matching evidence. Try another search or filter.</p>}
    <p className="es01-links"><a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_EFFECT_SEPARATION_ATLAS.md" target="_blank" rel="noopener noreferrer">E0 research protocol ↗</a> · <a href="https://github.com/MichaelWave369/Cannabiverse" target="_blank" rel="noopener noreferrer">Cannabiverse ↗</a> · <a href="https://github.com/MichaelWave369/cannabis-as-sacred-medicine" target="_blank" rel="noopener noreferrer">Cannabis as Sacred Medicine ↗</a></p>
  </section>
}
