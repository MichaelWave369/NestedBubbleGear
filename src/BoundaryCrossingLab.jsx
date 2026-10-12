import {useMemo,useState} from 'react'
import {
  BC1_PROTOCOL, analyzeBC1, buildBC1Receipt, observeBC1, simulateBC1,
} from './boundaryCrossingPersistence.js'
import './boundaryCrossing.css'

function exportBC1Receipt(config) {
  const receipt = buildBC1Receipt(config)
  const blob = new Blob([JSON.stringify(receipt, null, 2) + '\n'], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'NBG-BC1-boundary-crossing-v0.1.0.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
function BinaryChoice({id, label, value, onChange, off, on}) {
  return <label htmlFor={id}>{label}
    <select id={id} value={value} onChange={event => onChange(Number(event.target.value))}>
      <option value={0}>{off}</option>
      <option value={1}>{on}</option>
    </select>
  </label>
}
function Keyhole({name, label, info, value}) {
  return <div className="bc1-keyhole">
    <div><strong>{name}</strong><small>{label}</small></div>
    <p>{info}</p>
    <code>{value}</code>
  </div>
}
export default function BoundaryCrossingLab() {
  const [sourceBit, setSourceBit] = useState(0)
  const [machinery, setMachinery] = useState(1)
  const [gate, setGate] = useState(1)
  const [edit, setEdit] = useState(0)
  const config = {sourceBit, machinery, gate, edit}
  const current = useMemo(() => simulateBC1(config), [sourceBit, machinery, gate, edit])
  const census = useMemo(() => analyzeBC1(), [])
  const selectedK0 = observeBC1(current, 'K0')
  const selectedK1 = observeBC1(current, 'K1')
  const selectedK2 = observeBC1(current, 'K2')
  return <section id="boundary-crossing" className="section bc1-section">
    <span className="section-label">NBG-BC1 · BOUNDARY-CROSSING PERSISTENCE · SIMULATED</span>
    <h2>Same working source.<br/><em>Different futures across the boundary.</em></h2>
    <p className="muted">Inspired by a real study of BC200-derived DNA in a human poxvirus, BC1 deliberately uses
      only synthetic bits. Toggle a source label, external copier, interface gate, and optional bit edit.
      Compare what different observers can actually know about the resulting transfer.</p>

    <div className="bc1-metrics" aria-label="Finite-state census">
      <div><strong>{census.scenarios}</strong><span>Synthetic states</span></div>
      <div><strong>{census.inserted}</strong><span>Defined insertions</span></div>
      <div><strong>{census.blocked}</strong><span>Blocked controls</span></div>
      <div><strong>{census.donorFunctionRetained}/{census.scenarios}</strong><span>Source role preserved</span></div>
    </div>

    <div className="bc1-layout">
      <div className="bc1-panel">
        <h3>Run the boundary experiment</h3>
        <p className="muted">These are model rules, not gene-expression or viral-infection measurements.</p>
        <div className="bc1-controls">
          <BinaryChoice id="bc1-source" label="Source information" value={sourceBit} onChange={setSourceBit}
            off="Bit 0" on="Bit 1"/>
          <BinaryChoice id="bc1-machine" label="External copying machinery" value={machinery} onChange={setMachinery}
            off="Absent" on="Available"/>
          <BinaryChoice id="bc1-gate" label="Boundary permission" value={gate} onChange={setGate}
            off="Closed" on="Open"/>
          <BinaryChoice id="bc1-edit" label="After-copy edit" value={edit} onChange={setEdit}
            off="Keep bit" on="Toggle bit"/>
        </div>
        <div className="bc1-transport" aria-label="Abstract donor to receiver schematic">
          <div className="bc1-domain"><small>DONOR</small><strong>{sourceBit}</strong><span>Role: active</span></div>
          <div className="bc1-arrow" aria-hidden="true"><strong>→</strong><span>{machinery && gate ? 'COPY' : 'BLOCKED'}</span></div>
          <div className="bc1-domain"><small>RECEIVER</small>
            <strong>{current.after.recipientPayload ?? '∅'}</strong>
            <span>{current.event.kind === 'INSERTION' ? 'Payload inserted' : 'Empty'}</span>
          </div>
        </div>
        <div className="bc1-verdict" role="status" aria-live="polite">
          <strong>{current.event.kind} · {current.event.reason.replaceAll('_', ' ')}</strong>
          <p>Source role afterward: <b>active</b>. Model lineage: <b>{current.lineage ? 'recorded' : 'no transfer recorded'}</b>.</p>
        </div>
      </div>
      <div className="bc1-panel">
        <h3>Three Keyholes, one simulated run</h3>
        <Keyhole name="K0" label="Before transfer" info="Same observation for all 16 states."
          value={'role=' + selectedK0.donorFunction + ', receiver=empty'} />
        <Keyhole name="K1" label="Destination snapshot" info="Reveals an inserted bit, not where it came from."
          value={'payload=' + (selectedK1.recipientPayload ?? 'empty')} />
        <Keyhole name="K2" label="Declared lineage" info="Adds the full model trace, copying prerequisites and edit status."
          value={'source=' + selectedK2.sourceBit + ', copier=' + selectedK2.machinery +
            ', gate=' + selectedK2.gate + ', edit=' + selectedK2.edit} />
      </div>
    </div>

    <div className="bc1-findings">
      <div>
        <h3>Observer blind spot</h3>
        <p>K0 has <strong>{census.observerClasses.K0}</strong> view across 16 cases, but future insertion differs.
          K1 has <strong>{census.observerClasses.K1}</strong> views: empty, 0, or 1.
          Only K2 retains the source/edit distinction across all <strong>{census.observerClasses.K2}</strong> cases.</p>
      </div>
      <div>
        <h3>Lineage collision</h3>
        <p><code>source 0 + edit 1 → bit 1</code><br/>
          <code>source 1 + edit 0 → bit 1</code></p>
        <p>The recipient looks identical, yet the source histories differ. Both are constructed examples.</p>
      </div>
      <div>
        <h3>Controls matter</h3>
        <p>No machinery: <strong>{census.missingMachineryInsertions} insertions</strong>.
          Closed gate: <strong>{census.closedGateInsertions} insertions</strong>.
          A K0-only majority predictor gets <strong>{census.coarseMajorityCorrect}/16</strong>;
          a predictor given the model's own transition rules gets <strong>{census.knownMechanismCorrect}/16</strong>.</p>
      </div>
    </div>
    <p className="bc1-firewall">Evidence wall: BC1 is an exactly enumerable binary toy world. It does not
      model actual BC200 genes, LINE-1 dynamics, viruses, biological mutation, or clinical outcomes.
      Its positive result is defined by its own rules, not independent biological validation.
      Origin: {BC1_PROTOCOL.origin}. Authority: {BC1_PROTOCOL.authority}.</p>
    <div className="bc1-actions">
      <button type="button" onClick={() => exportBC1Receipt(config)}>Export SIMULATED BC1 receipt</button>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/BC1/SPEC.md">
        Frozen protocol &amp; disconfirmation criteria ↗
      </a>
      <a href="https://doi.org/10.1126/science.aeh3441" target="_blank" rel="noopener noreferrer">
        Motivating Science paper ↗
      </a>
    </div>
  </section>
}
