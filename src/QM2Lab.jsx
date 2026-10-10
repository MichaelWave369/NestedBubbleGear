import { useState } from 'react'
import { QM1_DIFFICULTIES } from './qm1Model.js'
import { QM2_DOMAINS, QM2_ROUNDS, runQM2Experiment } from './qm2Model.js'
import './qm2Lab.css'

const names={SEQUENTIAL:'Sequential',SEEDED_SHUFFLE:'Seeded shuffle',NBG_GEAR:'NBG Gear stride'}
function fmtRate(n){return n===null?'N/A':Math.round(n).toLocaleString()}
function fmtMs(n){return n.toFixed(2)}
function download(result){
  if(!result)return
  const payload={...result,exportSchema:'nbg.qm2.receipt.v1',
    frozenNBGExperimentsModified:false,aqlenHandoff:'REQUIRES_SEPARATE_REVIEW_NO_SILENT_LEDGER_IMPORT'}
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='nbg-qm2-repeated-trial-receipt.json'
  a.click();URL.revokeObjectURL(url)
}
function ThroughputChart({results}){
  if(!results)return <div className="qm2-empty">Run the repeated trials to reveal the throughput distribution and paired comparison.</div>
  const max=Math.max(1,...results.summaries.map(s=>s.throughput.max))
  return <div className="qm2-chart">
    <div className="qm2-heading"><span>PER-STRATEGY SOFTWARE THROUGHPUT</span>
      <small>Min · Q1 · Median · Q3 · Max (descriptive only)</small></div>
    {results.summaries.map(row=>{
      const stat=row.throughput
      const x=v=>14+(v/max)*340
      return <div className="qm2-chart-row" key={row.strategy}>
        <strong>{names[row.strategy]}</strong>
        <svg viewBox="0 0 370 38" role="img"
          aria-label={names[row.strategy]+': median '+fmtRate(stat.median)+' evaluated double hashes per second'}>
          <line x1={x(stat.min)} y1="19" x2={x(stat.max)} y2="19"
            stroke="#a8c4b3" strokeWidth="2"/>
          <rect x={x(stat.q1)} y="12" width={Math.max(1,x(stat.q3)-x(stat.q1))}
            height="14" fill={row.strategy==='NBG_GEAR'?'#ffc56f':'#73ffc5'} opacity=".7"/>
          <line x1={x(stat.median)} x2={x(stat.median)}
            y1="6" y2="32" stroke="#f4fffa" strokeWidth="3"/>
          <circle cx={x(stat.min)} cy="19" r="3" fill="#b8d2bf"/>
          <circle cx={x(stat.max)} cy="19" r="3" fill="#b8d2bf"/>
        </svg>
        <span>{fmtRate(stat.median)} / sec</span>
      </div>
    })}
    <small className="qm2-chart-note">Scale is linear and shared within this run.
      Benchmarks are software-runtime observations, not algorithmic complexity measurements.</small>
  </div>
}
export default function QM2Lab(){
  const [universe,setUniverse]=useState(128)
  const [rounds,setRounds]=useState(6)
  const [bits,setBits]=useState(8)
  const [seed,setSeed]=useState(369)
  const [warmup,setWarmup]=useState(16)
  const [busy,setBusy]=useState(false)
  const [progress,setProgress]=useState(0)
  const [results,setResults]=useState(null)
  const [error,setError]=useState('')
  function config(fn){fn();setResults(null);setProgress(0);setError('')}
  async function execute(){
    if(busy)return
    if(!globalThis.crypto?.subtle){
      setError('WebCrypto requires a secure browser context. Use this HTTPS GitHub Page or the Node CLI.')
      return
    }
    setBusy(true);setProgress(0);setResults(null);setError('')
    try{
      const sha256=async bytes=>new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))
      const data=await runQM2Experiment({
        universe,rounds,bits,seed,warmup,sha256,
        onRound:({round})=>setProgress(round),
      })
      setResults(data)
    }catch(e){setError(e?.message||'Benchmark did not finish')}
    finally{setBusy(false)}
  }
  const ratio=results?.pairedComparisons.gearVsSequential?.median??null
  const passed=results&&Object.values(results.checks).every(Boolean)
  return <section className="section qm2" id="qm2">
    <div className="section-label">NBG-QM2 · REPEATED-TRIAL HASHING · SOFTWARE-ONLY EVIDENCE</div>
    <h2>A faster result, <em>or just a faster run?</em></h2>
    <p className="qm2-intro">Compare SHA-256 nonce schedulers through balanced repeated trials.
      A seeded rotation gives every strategy equal turns running first, second and third,
      while full-domain hashing keeps the work identical. A complete off-clock digest
      audit checks every successful nonce.</p>
    <div className="qm2-shell">
      <div className="qm2-work">
        <div className="qm2-heading"><span>01 · MEASUREMENT PROTOCOL</span>
          <small>DOUBLE-SHA-256 · SYNTHETIC HEADER · NO WALLET</small></div>
        <div className="qm2-settings">
          <label htmlFor="qm2-domain">Full nonce universe
            <select id="qm2-domain" disabled={busy} value={universe}
              onChange={e=>config(()=>setUniverse(Number(e.target.value)))}>
              {QM2_DOMAINS.map(v=><option key={v} value={v}>{v} candidate nonces</option>)}
            </select>
          </label>
          <label htmlFor="qm2-rounds">Paired rounds
            <select id="qm2-rounds" disabled={busy} value={rounds}
              onChange={e=>config(()=>setRounds(Number(e.target.value)))}>
              {QM2_ROUNDS.map(v=><option key={v} value={v}>{v} rounds, {v*3} scheduled runs</option>)}
            </select>
          </label>
          <label htmlFor="qm2-target">Toy hash target
            <select id="qm2-target" disabled={busy} value={bits}
              onChange={e=>config(()=>setBits(Number(e.target.value)))}>
              {QM1_DIFFICULTIES.map(v=><option key={v} value={v}>{v} raw leading-zero bits</option>)}
            </select>
          </label>
          <label htmlFor="qm2-seed">Deterministic trial seed
            <select id="qm2-seed" disabled={busy} value={seed}
              onChange={e=>config(()=>setSeed(Number(e.target.value)))}>
              {[7,369,2026,9001].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label htmlFor="qm2-warmup">Untimed warmups per block
            <select id="qm2-warmup" disabled={busy} value={warmup}
              onChange={e=>config(()=>setWarmup(Number(e.target.value)))}>
              <option value={16}>16 nonces per scheduler</option>
              <option value={0}>Disabled</option>
            </select>
          </label>
        </div>
        <button disabled={busy} className="qm2-go" onClick={execute}>
          {busy?'⏳ Repeated benchmark in progress…':'▶ Start balanced QM2 trial experiment'}
        </button>
        {busy&&<div className="qm2-progress" role="status">
          {progress} / {rounds} rounds measured and audited
          <div><span style={{width:Math.round(progress/rounds*100)+'%'}}/></div>
        </div>}
        {error&&<p className="qm2-error" role="alert">{error}</p>}
        <ThroughputChart results={results}/>
        {results&&<div className="qm2-overview">
          <div><small>REPEATED TRIALS</small><strong>{results.settings.rounds}</strong><span>each scheduler</span></div>
          <div><small>PAIRED MEDIAN RATE RATIO</small>
            <strong>{ratio===null?'N/A':ratio.toFixed(3)+'×'}</strong>
            <span>NBG / sequential</span></div>
          <div><small>REFERENCE DIGESTS</small>
            <strong>{results.referenceAudits.reduce((s,a)=>s+a.referenceRecomputations,0).toLocaleString()}</strong>
            <span>outside timing</span></div>
          <div><small>VERIFICATION</small><strong>{passed?'PASS':'FAIL'}</strong>
            <span>full hit proof audit</span></div>
        </div>}
        <div className="qm2-heading qm2-results-heading"><span>02 · REPLAYABLE PAIRED TRIALS</span>
          <small>All methods hash the same full domain each round</small></div>
        {results?
          <div className="qm2-rounds">
            {results.measuredRounds.map(round=><article key={round.round}>
              <div><strong>ROUND {round.round}</strong><span>Header seed: {round.seed}</span></div>
              <div className="qm2-round-order">{round.trials.map(t=><span key={t.strategy}>
                {t.executionPosition}. {names[t.strategy]}</span>)}</div>
              <div className="qm2-round-rates">{round.trials.map(t=><div key={t.strategy}>
                <span>{names[t.strategy]}</span>
                <strong>{fmtRate(t.hashesPerSecond)}/s</strong>
                <small>{fmtMs(t.elapsedMs)} ms · {t.hits} hits · verified</small>
              </div>)}</div>
            </article>)}
          </div>:
          <p className="qm2-placeholder">No results recorded yet. Execute a benchmark to generate per-round raw timings.</p>}
        <div className="qm2-boundary">
          <strong>INTERPRETATION FIREWALL</strong>
          <p>Runtime throughput differences do not demonstrate reduced SHA-256 search
            complexity or a quantum advantage. All three permutations find the exact same
            accepted nonce set when run across the full domain. Quartiles and paired ratios
            are descriptive statistics only, not significance tests.</p>
        </div>
      </div>
      <aside className="qm2-sidebar">
        <div className="qm2-heading"><span>03 · SCIENTIFIC CONTROLS</span></div>
        <div className="qm2-checks">
          {[
            ['Equal work','Every scheduler hashes the full domain'],
            ['Position balance','Equal appearances in positions 1, 2 and 3'],
            ['Complete re-verification','Every accepted nonce checked after timing'],
            ['Paired by seed','Same synthetic header and target within each round'],
            ['No quantum hardware','Grover remains a separate QM1 simulation'],
            ['No energy claim','Joules per hash are not measured'],
          ].map(([title,description])=><article key={title}>
            <span aria-hidden="true">✓</span>
            <div><strong>{title}</strong><p>{description}</p></div>
          </article>)}
        </div>
        {results&&<div className="qm2-verified">
          <span>OBSERVED RUN CONTROL CHECKS</span>
          {Object.entries(results.checks).map(([name,ok])=><div key={name}>
            <strong>{name.replaceAll(/([A-Z])/g,' $1')}</strong>
            <span>{ok?'PASS':'FAILED'}</span>
          </div>)}
        </div>}
        <button className="qm2-export" disabled={!results||busy} onClick={()=>download(results)}>
          ↓ Export full QM2 experiment receipt
        </button>
        <p className="qm2-small">Local JSON export includes trial order, raw timings,
          reference-hit counts, verification results, descriptive statistics and
          explicit DEMONSTRATION_ONLY provenance.</p>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/QM2_REPEATED_TRIAL_PROTOCOL.md"
          target="_blank" rel="noreferrer">Read frozen QM2 comparison protocol ↗</a>
        <a href="#qm1">Back to QM1's quantum toy comparison ↗</a>
        <div className="qm2-aqlen">
          <strong>AQLEN LINKAGE</strong>
          <p>AQLEN's current importer understands QM1's evidence graph contract.
            QM2's expanded multi-trial receipt requires a separately reviewed
            schema extension before AQLEN can import it. No silent ledger writes.</p>
        </div>
      </aside>
    </div>
  </section>
}
