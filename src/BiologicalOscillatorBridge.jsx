import { useMemo, useState } from 'react'
import {
  BSR2_CONTROLS, createSyntheticBridge, summarizeBridge, parseEnvelopeCsv, buildBridgeReceipt,
} from './biologicalOscillatorBridge.js'
import './biologicalOscillatorBridge.css'

const CHANNELS = [
  { name: 'Respiration-inspired', key: 'respiration', color: '#73ffc5', hz: 'variable ≈ 0.22 Hz' },
  { name: 'Cardiac-inspired', key: 'cardiac', color: '#ffc56f', hz: 'carrier ≈ 1.18 Hz' },
  { name: 'Neural-inspired', key: 'neural', color: '#8bc9ff', hz: 'carrier ≈ 9.8 Hz' },
]

const numeric = value => value === null ? 'undefined' : Number(value).toFixed(3)
function downloadReceipt(data) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'NBG_BSR2_local_summary.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function SignalPlot({ recording, envelopes }) {
  const series = useMemo(() => {
    const end = Math.min(recording.rows.at(-1).t, 10)
    const source = recording.rows.filter(row => row.t <= end + 1e-8)
    const stride = Math.max(1, Math.ceil(source.length / 850))
    const rows = source.filter((_, i) => i % stride === 0)
    const channels = CHANNELS.map((channel, index) => {
      const key = index === 1 && envelopes ? 'cardiacEnvelope'
        : index === 2 && envelopes ? 'neuralEnvelope' : channel.key
      const allValues = source.map(row => row[key])
      const min = Math.min(...allValues), max = Math.max(...allValues)
      const midpoint = (min + max) / 2
      const radius = Math.max((max - min) / 2, 1e-9)
      const centerY = 102 + index * 122
      const path = rows.map((row, i) => {
        const x = 56 + (row.t / end) * 620
        const y = centerY - (row[key] - midpoint) / radius * 39
        return (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)
      }).join(' ')
      return { ...channel, key, path, centerY }
    })
    return { end, channels }
  }, [recording, envelopes])

  return <div className="bobr-plot-wrap">
    <div className="bobr-plot-title">
      <span>{recording.origin === 'SIMULATED' ? 'ILLUSTRATIVE SIGNALS' : 'IMPORTED ENVELOPE PREVIEW'}</span>
      <span>First {series.end.toFixed(1)} seconds · auto-scaled per channel</span>
    </div>
    <svg viewBox="0 0 730 440" className="bobr-plot" role="img"
      aria-label="Three stacked signal traces for respiration, cardiac-inspired and neural-inspired recordings">
      <defs>
        <pattern id="bobr-grid" width="38" height="38" patternUnits="userSpaceOnUse">
          <path d="M38 0 L0 0 0 38" stroke="#77bad0" strokeOpacity=".09" fill="none" />
        </pattern>
      </defs>
      <rect width="730" height="440" fill="#061015" />
      <rect width="730" height="440" fill="url(#bobr-grid)" />
      {series.channels.map(channel => <g key={channel.key}>
        <rect x="48" y={channel.centerY - 45} width="636" height="92" rx="5"
          fill="#8bc9ff" fillOpacity=".024" stroke="#8bc9ff" strokeOpacity=".1" />
        <line x1="56" x2="676" y1={channel.centerY} y2={channel.centerY}
          stroke="#b1c9bf" strokeOpacity=".2" strokeDasharray="4 7" />
        <path d={channel.path} fill="none" stroke={channel.color} strokeWidth="2" />
        <text x="56" y={channel.centerY - 53} fill={channel.color}
          fontFamily="ui-monospace,monospace" fontSize="13">{channel.name}</text>
      </g>)}
      <text x="56" y="418" fill="#9bbfc7" fontFamily="ui-monospace,monospace" fontSize="12">
        t = 0 s
      </text>
      <text x="590" y="418" fill="#9bbfc7" fontFamily="ui-monospace,monospace" fontSize="12">
        t = {series.end.toFixed(1)} s
      </text>
      <text x="485" y="26" fill="#ffc56f" fontFamily="ui-monospace,monospace" fontSize="11">
        {recording.origin}
      </text>
    </svg>
    <div className="bobr-key">
      {CHANNELS.map(channel => <span key={channel.key}>
        <i style={{ background: channel.color }} /> {channel.name}
      </span>)}
    </div>
  </div>
}

function Metric({ name, value, control, explanation }) {
  return <div className="bobr-metric">
    <small>{name}</small>
    <strong>{numeric(value)}</strong>
    <span>Block-reordered diagnostic: {numeric(control)}</span>
    <p>{explanation}</p>
  </div>
}

export default function BiologicalOscillatorBridge() {
  const [coupling, setCoupling] = useState(BSR2_CONTROLS.coupling)
  const [imported, setImported] = useState(null)
  const [sourceNote, setSourceNote] = useState('')
  const [localName, setLocalName] = useState('')
  const [fileError, setFileError] = useState('')
  const [envelopes, setEnvelopes] = useState(false)
  const synthetic = useMemo(() => createSyntheticBridge({ coupling }), [coupling])
  const baseline = useMemo(() => createSyntheticBridge({ coupling: 0 }), [])
  const recording = imported || synthetic
  const summary = useMemo(() => summarizeBridge(recording), [recording])
  const nullSummary = useMemo(() => summarizeBridge(baseline), [baseline])

  async function loadCsv(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFileError('')
    try {
      if (file.size > 2_000_000) throw new Error('Only local CSV files up to 2 MB are accepted.')
      const text = await file.text()
      const parsed = parseEnvelopeCsv(text)
      setImported(parsed)
      setLocalName(file.name)
      setEnvelopes(true)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  function resetSynthetic() {
    setImported(null)
    setLocalName('')
    setSourceNote('')
    setFileError('')
    setEnvelopes(false)
  }

  return <section id="biological-bridge" className="section bobr">
    <div className="section-label">BSR-2 · BIOLOGICAL OSCILLATOR BRIDGE</div>
    <h2>Three rhythms. <em>One honest experiment.</em></h2>
    <p className="bobr-intro">
      Explore respiration-, heartbeat-, and neural-rhythm-inspired signals, then check
      descriptive envelope correlations against a known uncoupled synthetic baseline
      and a deliberately reordered diagnostic. The model is synthetic by default.
      Locally imported CSVs are <strong>unverified</strong> and never uploaded by this lab.
    </p>
    <div className="bobr-layout">
      <SignalPlot recording={recording} envelopes={envelopes || Boolean(imported)} />
      <div className="bobr-console">
        <div className="bobr-console-heading">
          <span>MODEL / SOURCE CONSOLE</span>
          <strong>{recording.origin}</strong>
        </div>
        <div className="bobr-presets">
          {[0, 0.55, 0.9].map(value => <button key={value} type="button"
            disabled={Boolean(imported)} aria-pressed={!imported && coupling === value}
            onClick={() => setCoupling(value)}>
            {value === 0 ? 'Uncoupled null' : value === 0.55 ? 'Coupled example' : 'Strong example'}
          </button>)}
        </div>
        <label className="bobr-slider-label" htmlFor="bobr-coupling">
          Constructed envelope coupling <strong>k = {coupling.toFixed(2)}</strong>
        </label>
        <input id="bobr-coupling" type="range" min="0" max="0.9" step="0.05"
          disabled={Boolean(imported)} value={coupling}
          onChange={event => setCoupling(Number(event.target.value))} />
        <label className="bobr-toggle">
          <input type="checkbox" checked={envelopes || Boolean(imported)}
            disabled={Boolean(imported)}
            onChange={event => setEnvelopes(event.target.checked)} />
          View amplitude envelopes instead of carrier traces
        </label>
        <div className="bobr-stats">
          <Metric name="Respiration ↔ cardiac-envelope r" value={summary.cardiacCorrelation}
            control={summary.shuffledCardiacCorrelation}
            explanation="Pearson association across the whole recording, not phase locking." />
          <Metric name="Respiration ↔ neural-envelope r" value={summary.neuralCorrelation}
            control={summary.shuffledNeuralCorrelation}
            explanation="A constructed relationship for synthetic data. Association is not causation." />
          <div className="bobr-meta">
            <span>{summary.sampleCount.toLocaleString()} samples</span>
            <span>{summary.sampleRate.toFixed(2)} Hz</span>
            <span>{summary.seconds.toFixed(2)} seconds</span>
          </div>
        </div>
        <div className="bobr-baseline">
          <strong>Independent synthetic baseline (k = 0)</strong>
          <span>Cardiac r = {numeric(nullSummary.cardiacCorrelation)} · Neural r = {numeric(nullSummary.neuralCorrelation)}</span>
          <p>Displayed as context even for imports. It is <strong>not</strong> a matched control for someone else's recording.</p>
        </div>
        <button className="bobr-download" type="button"
          onClick={() => downloadReceipt(buildBridgeReceipt(recording, summary, { sourceNote }))}>
          Export summary receipt (no raw samples)
        </button>
      </div>
    </div>

    <div className="bobr-import">
      <div>
        <span className="section-label">LOCAL-ONLY DATA BRIDGE</span>
        <h3>Bring your own preprocessed envelopes</h3>
        <p>CSV columns: <code>t_sec,respiration,cardiac_envelope,neural_envelope</code>.
          Use uniformly sampled finite numbers, nonnegative envelopes, 10+ seconds and 5–500 Hz.
          These columns are <em>already processed signals</em>, not raw ECG or EEG.
          The browser reads your file locally. Do not publish identifiable health data.</p>
        <p className="bobr-file-note">{imported
          ? 'Loaded this session: ' + localName + ' · USER_SUPPLIED_UNVERIFIED'
          : 'No recording loaded. Showing synthetic demonstration.'}</p>
        {fileError && <p className="bobr-error" role="alert">{fileError}</p>}
      </div>
      <div className="bobr-import-actions">
        <label className="bobr-file-input">
          Read local CSV
          <input type="file" accept=".csv,text/csv" onChange={loadCsv} />
        </label>
        <label className="bobr-source-label" htmlFor="bobr-source">Source / preprocessing notes (user-reported)</label>
        <input id="bobr-source" type="text" value={sourceNote} maxLength={240}
          placeholder="Dataset source, filtering method, consent status…"
          onChange={event => setSourceNote(event.target.value)} />
        <button type="button" className="bobr-reset" onClick={resetSynthetic}>
          Clear local data / return to synthetic
        </button>
      </div>
    </div>
    <div className="bobr-method">
      <article><span>01 / CONTROL</span><h3>Known by construction</h3>
        <p>Increasing k mathematically injects respiration-dependent modulation into synthetic amplitude envelopes. Detecting it does not prove a biological mechanism.</p></article>
      <article><span>02 / SHUFFLE</span><h3>Diagnostic, not p-value</h3>
        <p>Deterministic block reordering disrupts the displayed alignment. Autocorrelation means this is not a valid significance test for arbitrary physiological recordings.</p></article>
      <article><span>03 / PROVENANCE</span><h3>Real data needs real checks</h3>
        <p>Imported data remain unverified without consent, instrument details, units, preprocessing, artifact handling, held-out tests and independent review.</p></article>
    </div>
    <p className="bobr-claim">
      <strong>Evidence status: illustrative and exploratory.</strong> Correlation between these channels
      does not imply neural synchronization, medical benefit, consciousness states, or a connection
      to the “Absolute.” See the <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BSR2_BIOLOGICAL_BRIDGE.md">
      BSR-2 protocol and falsification gates ↗</a>.
    </p>
  </section>
}
