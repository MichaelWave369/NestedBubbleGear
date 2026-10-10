import { useMemo,useState } from 'react'
import {
  comparePoWSchedules,simulateToyGrover,qm1Receipt,toAqlenReceiptGraph,
  QM1_UNIVERSES,QM1_DIFFICULTIES,
} from './qm1Model.js'
import './qm1Lab.css'

function exportJSON(name,value){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}))
  const link=document.createElement('a');link.href=url;link.download=name;link.click()
  URL.revokeObjectURL(url)
}
const schedulerLabels={
  SEQUENTIAL:'Sequential',SEEDED_SHUFFLE:'Seeded shuffle',NBG_GEAR:'NBG Gear stride',
}
export default function QM1Lab(){
  const [universe,setUniverse]=useState(128)
  const [bits,setBits]=useState(8)
  const [seed,setSeed]=useState(369)
  const [qubits,setQubits]=useState(6)
  const [iterations,setIterations]=useState(5)
  const [busy,setBusy]=useState(false)
  const [data,setData]=useState(null)
  const [error,setError]=useState('')
  const grover=useMemo(()=>simulateToyGrover({
    qubits,markedIndex:13,iterations:Math.min(iterations,Math.ceil(2*Math.sqrt(2**qubits))),
  }),[qubits,iterations])
  const configChanged=(change)=>{change();setData(null);setError('')}
  async function run(){
    if(busy)return
    if(!globalThis.crypto?.subtle){
      setError('Secure-context WebCrypto unavailable. Open the HTTPS GitHub Page, or use the Node CLI benchmark.')
      return
    }
    setBusy(true);setError('');setData(null)
    try{
      const sha256=async bytes=>new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))
      const results=await comparePoWSchedules({
        sha256,universe,budget:universe,leadingZeroBits:bits,seed,
      })
      setData(results)
    }catch(e){setError(e?.message||'Benchmark failed')}
    finally{setBusy(false)}
  }
  const maxHps=Math.max(1,...(data?.trials.map(t=>t.hashesPerSecond||0)||[]))
  const receipt=data?qm1Receipt(data,grover):null
  return <section id="qm1" className="section qm1">
    <div className="section-label">NBG-QM1 · QUANTUM-INSPIRED MINING RESEARCH · SOFTWARE ONLY</div>
    <h2>Does the gear <em>change the search?</em></h2>
    <p className="qm1-intro">One synthetic 80-byte header. Three classical nonce schedulers.
      The same double-SHA-256 function and nonce universe. Compare coverage and local
      runtime, then explore a separate idealized Grover state-vector simulation.
      No wallets, pools, real Bitcoin mining or quantum hardware.</p>
    <div className="qm1-surface">
      <div className="qm1-primary">
        <div className="qm1-head"><span>01 · CLASSICAL NONCE SEARCH</span><small>RUN ON THIS BROWSER'S CPU / WEBCRYPTO</small></div>
        <div className="qm1-settings">
          <label htmlFor="qm1-universe">Full nonce domain
            <select id="qm1-universe" disabled={busy} value={universe}
              onChange={e=>configChanged(()=>setUniverse(Number(e.target.value)))}>
              {QM1_UNIVERSES.map(v=><option value={v} key={v}>{v} nonces</option>)}
            </select>
          </label>
          <label htmlFor="qm1-bits">Toy difficulty target
            <select id="qm1-bits" disabled={busy} value={bits}
              onChange={e=>configChanged(()=>setBits(Number(e.target.value)))}>
              {QM1_DIFFICULTIES.map(v=><option key={v} value={v}>{v} leading zero bits</option>)}
            </select>
          </label>
          <label htmlFor="qm1-seed">Header / scheduler seed
            <select id="qm1-seed" disabled={busy} value={seed}
              onChange={e=>configChanged(()=>setSeed(Number(e.target.value)))}>
              {[7,369,2026,9001].map(v=><option value={v} key={v}>{v}</option>)}
            </select>
          </label>
        </div>
        <button className="qm1-run" onClick={run} disabled={busy}>
          {busy?'⏳ Computing equal-work comparisons…':'▶ Run double-SHA-256 benchmark'}
        </button>
        {error&&<p role="alert" className="qm1-error">{error}</p>}
        <div className="qm1-results">
          {['SEQUENTIAL','SEEDED_SHUFFLE','NBG_GEAR'].map(strategy=>{
            const trial=data?.trials.find(t=>t.strategy===strategy)
            return <article key={strategy} className={strategy==='NBG_GEAR'?'qm1-gear':''}>
              <div className="qm1-strategy-head"><strong>{schedulerLabels[strategy]}</strong>
                <span>{strategy==='NBG_GEAR'?'MODULAR GEAR PERMUTATION':'BASELINE'}</span></div>
              <div className="qm1-metric"><strong>{trial?trial.hashesPerSecond?.toLocaleString():'—'}</strong>
                <span>local double hashes/sec</span></div>
              <div className="qm1-bar"><div style={{width:trial?
                Math.max(0.7,100*(trial.hashesPerSecond||0)/maxHps)+'%':'0%'}}/></div>
              <dl>
                <div><dt>Hashes tested</dt><dd>{trial?.hashesComputed??'—'}</dd></div>
                <div><dt>Unique coverage</dt><dd>{trial?Math.round(trial.coverage*100)+'%':'—'}</dd></div>
                <div><dt>Duplicate nonces</dt><dd>{trial?.collisions??'—'}</dd></div>
                <div><dt>Accepted toy hashes</dt><dd>{trial?.hits??'—'}</dd></div>
                <div><dt>First hit attempt</dt><dd>{trial?.firstHit?.attempt??'none / not run'}</dd></div>
                <div><dt>Energy J/hash</dt><dd>NOT MEASURED</dd></div>
              </dl>
            </article>
          })}
        </div>
        <div className="qm1-notice">
          <strong>WHAT COMPARISON MEANS</strong>
          <p>All three strategies hash exactly the same nonce set when running the full domain.
            Hit count must match. Their order can change which success appears first, but
            not SHA-256's underlying search difficulty. Browser timing includes
            asynchronous WebCrypto overhead; we cannot claim better ASIC or GPU performance.</p>
        </div>
        <div className="qm1-head"><span>02 · TOY GROVER AMPLITUDE SIMULATOR</span><small>SEPARATE CLASSICAL SIMULATION</small></div>
        <div className="qm1-grover-settings">
          <label htmlFor="qm1-qubits">Simulated qubits
            <select id="qm1-qubits" value={qubits} onChange={e=>{
              const next=Number(e.target.value);setQubits(next)
              setIterations(v=>Math.min(v,Math.ceil(2*Math.sqrt(2**next))))
            }}>
              {[3,4,5,6,7,8].map(v=><option key={v} value={v}>{v} · {2**v} states</option>)}
            </select>
          </label>
          <label htmlFor="qm1-iterations">Grover iterations <strong>{grover.iterations}</strong>
            <input id="qm1-iterations" type="range" min="0"
              max={Math.ceil(2*Math.sqrt(2**qubits))}
              step="1" value={grover.iterations} onChange={e=>setIterations(Number(e.target.value))}/>
          </label>
        </div>
        <div className="qm1-prob-display">
          <div><small>SIMULATED MARKED-STATE PROBABILITY</small>
            <strong>{(grover.successProbability*100).toFixed(2)}%</strong></div>
          <div><small>IDEALIZED ORACLE CALLS</small><strong>{grover.oracleCalls}</strong></div>
          <div><small>STATE NORM</small><strong>{grover.stateNormSquared.toFixed(6)}</strong></div>
        </div>
        <svg className="qm1-graph" viewBox="0 0 680 184" role="img"
          aria-label="Toy Grover success probability by idealized oracle iteration">
          <rect width="680" height="184" fill="#091a11"/>
          {[.25,.5,.75,1].map(v=><g key={v}>
            <line x1="38" x2="656" y1={157-135*v} y2={157-135*v}
              stroke="#73ffc5" opacity=".14"/>
            <text x="4" y={160-135*v} fill="#97b6a3" fontSize="10">{Math.round(v*100)}%</text>
          </g>)}
          <path d={grover.history.map((v,i)=>
            (i?'L':'M')+(38+(618*i/Math.max(1,grover.history.length-1))).toFixed(2)+','+
            (157-135*v).toFixed(2)).join(' ')}
            stroke="#73ffc5" strokeWidth="3" fill="none"/>
          {grover.history.map((v,i)=><circle key={i}
            cx={38+618*i/Math.max(1,grover.history.length-1)}
            cy={157-135*v} r="3.5" fill="#ffc56f"/>)}
          <text x="330" y="178" fill="#a6c9b0" fontSize="11" textAnchor="middle">Simulated Grover iterations</text>
        </svg>
        <p className="qm1-caveat">This is a tiny idealized classical state-vector simulation with one
          premarked target. It does not include a reversible SHA-256 quantum circuit, error
          correction, real quantum hardware cost, or real mining speed measurements.</p>
      </div>
      <aside className="qm1-side">
        <div className="qm1-head"><span>03 · EVIDENCE &amp; AQLEN BRIDGE</span></div>
        <p>Export the actual local software measurements alongside the separate
          toy quantum simulation. Every receipt preserves its epistemic origin.</p>
        <div className="qm1-boundary"><span>CLAIM AUTHORITY</span>
          <strong>DEMONSTRATION ONLY</strong>
          <p>Not a Bitcoin miner, not a quantum miner, and not proof that
            NBG can reduce cryptographic search complexity.</p></div>
        <button disabled={!data||busy} onClick={()=>
          exportJSON('nbg-qm1-simulation-receipt.json',receipt)}>
          ↓ Export QM1 experiment receipt
        </button>
        <button disabled={!data||busy} onClick={()=>
          exportJSON('nbg-qm1-aqlen-graph.json',toAqlenReceiptGraph(receipt))}>
          ↓ Export AQLEN receipt graph
        </button>
        <p className="qm1-small">The AQLEN file follows its existing
          receipt-graph node and edge types. It is an export, not an automatic
          import or an assertion of access to silicon qubits.</p>
        <a href="https://github.com/MichaelWave369/aqlen-quantum-ledger" target="_blank"
          rel="noreferrer">Explore AQLEN Quantum Ledger ↗</a>
        <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/QM1_MINING_PROTOCOL.md"
          target="_blank" rel="noreferrer">Read QM1 mathematical protocol ↗</a>
        <div className="qm1-checks">
          <span>CONTROL CONTRACT</span>
          <p>Equal hash function · Equal domain · Equal work budget ·
            Independent digest re-verification · Deterministic
            schedule · No measured energy.</p>
        </div>
      </aside>
    </div>
  </section>
}
