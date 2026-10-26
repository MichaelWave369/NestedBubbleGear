import { useMemo, useState } from 'react'
import { findResearch, RESEARCH_CATEGORIES, RESEARCH_STATUS, RESEARCH_TRACKS } from './researchAtlasData.js'
import EG01Lab from './EG01Lab.jsx'
import EG02Lab from './EG02Lab.jsx'
import EG03Lab from './EG03Lab.jsx'
import EG04Lab from './EG04Lab.jsx'
import EG05Lab from './EG05Lab.jsx'
import EG06Lab from './EG06Lab.jsx'
import './researchAtlas.css'

const PINNED = ['EG-06','EG-05','EG-04','EG-03']
function SourceLink({ track, children = 'Read research ↗' }) {
  return <a className="research-link" href={track.url} target="_blank" rel="noopener noreferrer">
    {children}<span className="research-link-path">{track.path}</span>
  </a>
}
function TrackCard({ track }) {
  return <article className="research-card">
    <div className="research-card-top">
      <span className="research-code">{track.id}</span>
      <span className={'research-state research-state--'+track.status.toLowerCase().replace(/\s+/g,'-')}
        title={RESEARCH_STATUS[track.status]}>{track.status}</span>
    </div>
    <h4>{track.title}</h4>
    <p>{track.summary}</p>
    {track.note && <p className="research-disclaimer">{track.note}</p>}
    <footer className="research-card-footer">
      <span>{track.category}</span><SourceLink track={track} />
    </footer>
  </article>
}
function PolarityToy() {
  const [query, setQuery] = useState(1)
  const records = [
    { id:'r-positive', label:'The bridge passed acceptance.', polarity:1 },
    { id:'r-negative', label:'The bridge did not pass acceptance.', polarity:-1 },
  ]
  return <div className="research-toy">
    <div className="research-toy-heading">
      <div>
        <span className="research-overline">RUN IN YOUR BROWSER · MATHEMATICAL TOY</span>
        <h3>One claim, opposite meanings.</h3>
        <p>Switch the query polarity. Both memories share the same constructed magnitude.
          This illustration assigns signs <strong>manually</strong>; it does not understand language.</p>
      </div>
      <div className="research-toy-toggle" role="group" aria-label="Query polarity">
        <button type="button" aria-pressed={query===1} className={query===1?'selected':''}
          onClick={()=>setQuery(1)}>Passed</button>
        <button type="button" aria-pressed={query===-1} className={query===-1?'selected':''}
          onClick={()=>setQuery(-1)}>Did not pass</button>
      </div>
    </div>
    <div className="research-toy-grid" role="table" aria-label="Two synthetic statements and three scoring rules">
      <div className="research-toy-row research-toy-head" role="row">
        <span role="columnheader">Synthetic memory</span>
        <span role="columnheader">Unsigned cosine</span>
        <span role="columnheader">Signed real</span>
        <span role="columnheader">Phase 0 / π</span>
      </div>
      {records.map(record=>{
        const match=record.polarity===query
        return <div className={'research-toy-row'+(match?' is-match':'')} role="row" key={record.id}>
          <span role="cell">{record.label}</span>
          <strong role="cell">+1.0 <small>tie</small></strong>
          <strong role="cell" className={match?'toy-match':'toy-opposite'}>{match?'+1.0':'−1.0'}</strong>
          <strong role="cell" className={match?'toy-match':'toy-opposite'}>{match?'+1.0':'−1.0'}</strong>
        </div>
      })}
    </div>
    <div className="research-toy-footnote">
      <span>Equal information ⇒ signed-real and binary-phase scores are mathematically identical.</span>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/PHMP1/PHMP_SM1_E0.md"
         target="_blank" rel="noopener noreferrer">Review the E0 protocol ↗</a>
    </div>
  </div>
}
export default function ResearchAtlas() {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const filtered = useMemo(()=>findResearch(query,category),[query,category])
  const pinned = PINNED.map(id=>RESEARCH_TRACKS.find(track=>track.id===id)).filter(Boolean)
  const visible = expanded ? filtered : filtered.slice(0,12)
  const setFilter = next => { setCategory(next); setExpanded(false) }
  return <section id="research-atlas" className="section research-atlas" aria-labelledby="research-atlas-title">
    <div className="section-label">THE LIVING RESEARCH INDEX · SOURCE-LINKED</div>
    <div className="research-intro">
      <div>
        <h2 id="research-atlas-title">All the new work.<br /><em>One place to find it.</em></h2>
        <p>Our interactive demos are only one part of NBG. This index surfaces the newer protocols,
          experimental software and independent-review gates that were previously buried in repository folders.</p>
      </div>
      <aside className="research-reality">
        <span>RESEARCH STATUS</span>
        <strong>{RESEARCH_TRACKS.length} indexed studies</strong>
        <small>Not a count of validated discoveries. CI tests source behavior;
          it doesn't establish physical truth or improve real-world AI memory automatically.</small>
        <a href="#experiments">Jump to AH2–AH44 evidence ladder ↓</a>
      </aside>
    </div>
    <div className="research-feature-label">START HERE · RECENT TRACKS</div>
    <div className="research-feature-grid">
      {pinned.map(track=><TrackCard key={track.id} track={track} />)}
    </div>
    <EG01Lab />
    <EG02Lab />
    <EG03Lab />
    <EG04Lab />
    <EG05Lab />
    <EG06Lab />
    <PolarityToy />
    <div className="research-browser-head">
      <div>
        <span className="research-overline">EXPLORE THE ARCHIVE</span>
        <h3>Find a study, test or research gate.</h3>
      </div>
      <span className="research-count" aria-live="polite">{filtered.length} matches</span>
    </div>
    <div className="research-controls">
      <label className="research-search-label" htmlFor="research-search">
        <span>Search studies, identifiers and concepts</span>
        <input id="research-search" type="search" value={query} onChange={event=>{setQuery(event.target.value);setExpanded(false)}}
          placeholder="Try phase, RB3, provenance, K7, semantic memory…"/>
      </label>
      <div className="research-categories" role="group" aria-label="Filter by research track">
        {RESEARCH_CATEGORIES.map(name=>
          <button type="button" key={name} aria-pressed={category===name}
            className={category===name?'active':''} onClick={()=>setFilter(name)}>{name}</button>)}
      </div>
    </div>
    <div className="research-results" aria-live="polite">
      {visible.map(track=><TrackCard key={track.id} track={track} />)}
    </div>
    {filtered.length===0 && <p className="research-empty">No matching studies. Try another term or select All.</p>}
    {filtered.length>visible.length && <button type="button" className="research-show-all"
      onClick={()=>setExpanded(true)}>Show all {filtered.length} matching studies ↓</button>}
    {expanded && filtered.length>12 && <button type="button" className="research-show-all"
      onClick={()=>setExpanded(false)}>Show fewer ↑</button>}
    <div className="research-bottom">
      <strong>Ledger above ego.</strong>
      <p>Statuses are editorial summaries of repository documents, not live GitHub Actions statuses.
        Work marked REVIEW BLOCKED, PROPOSED or PREPARED remains unproven or gated.
        The browser demo runs without APIs, your private files or an Ollama connection.</p>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear" target="_blank" rel="noopener noreferrer">Open full NBG source ↗</a>
    </div>
  </section>
}
