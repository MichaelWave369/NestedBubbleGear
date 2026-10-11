/**
 * BSR-2: Biological Oscillator Bridge
 * An illustrative signal laboratory, not an ECG, EEG, or medical model.
 * Synthetic envelopes are CONSTRUCTED to respond to respiratory phase:
 * observed association is expected by design and does not establish biology.
 */
export const BSR2_VERSION = 'BSR-2.0.0'
export const BSR2_SAMPLE_RATE = 100
export const BSR2_DURATION = 40
export const IMPORT_COLUMNS = ['t_sec', 'respiration', 'cardiac_envelope', 'neural_envelope']
export const BSR2_CONTROLS = Object.freeze({ coupling: 0.55 })

const clamp = (value, fallback, lower, upper) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(lower, Math.min(upper, n)) : fallback
}

export function createSyntheticBridge({ coupling = BSR2_CONTROLS.coupling } = {}) {
  const k = clamp(coupling, BSR2_CONTROLS.coupling, 0, 0.9)
  let breathPhase = 0, cardiacPhase = 0, neuralPhase = 0
  const sampleRate = BSR2_SAMPLE_RATE
  const dt = 1 / sampleRate
  const rows = []
  for (let step = 0; step <= BSR2_DURATION * sampleRate; step++) {
    const t = step * dt
    if (step) {
      const prev = t - dt / 2
      const breathHz = 0.22 + 0.045 * Math.sin(0.19 * prev) + 0.03 * Math.sin(0.45 * prev + 0.9)
      const cardiacHz = 1.18 + 0.035 * Math.sin(0.11 * prev + 0.8)
      const neuralHz = 9.8 + 0.15 * Math.sin(0.12 * prev + 1.6)
      breathPhase += 2 * Math.PI * breathHz * dt
      cardiacPhase += 2 * Math.PI * cardiacHz * dt
      neuralPhase += 2 * Math.PI * neuralHz * dt
    }
    const respiration = Math.sin(breathPhase)
    const cardiacEnvelope = 1 + 0.08 * Math.sin(2 * Math.PI * 0.067 * t + 0.7)
      + 0.04 * Math.sin(2 * Math.PI * 0.17 * t + 0.2) + 0.65 * k * respiration
    const neuralEnvelope = 1 + 0.1 * Math.sin(2 * Math.PI * 0.13 * t + 2)
      + 0.42 * k * respiration
    rows.push({
      t,
      respiration,
      cardiac: cardiacEnvelope * Math.sin(cardiacPhase),
      neural: neuralEnvelope * Math.sin(neuralPhase),
      cardiacEnvelope,
      neuralEnvelope,
    })
  }
  return {
    version: BSR2_VERSION,
    origin: 'SIMULATED',
    sampleRate,
    rows,
    settings: { coupling: k, durationSeconds: BSR2_DURATION, sampleRate },
    description: 'Synthetic sinusoidal carrier examples; not an ECG or EEG reconstruction.',
  }
}

export function pearson(x, y) {
  if (x.length !== y.length || x.length < 3) throw new Error('At least three matched samples required.')
  const mx = x.reduce((s, v) => s + v, 0) / x.length
  const my = y.reduce((s, v) => s + v, 0) / y.length
  let numerator = 0, xx = 0, yy = 0
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx, dy = y[i] - my
    numerator += dx * dy
    xx += dx * dx
    yy += dy * dy
  }
  if (xx <= 1e-16 || yy <= 1e-16) return null
  return numerator / Math.sqrt(xx * yy)
}

function permuteBlocks(values, sampleRate) {
  // Block order permutation is a VISUAL/DIAGNOSTIC negative control only.
  // It is not an exchangeability-valid hypothesis test for physiological signals.
  const length = values.length
  const blockSize = Math.max(3, Math.round(sampleRate * 1.25))
  const blocks = []
  for (let i = 0; i < length; i += blockSize) blocks.push(values.slice(i, i + blockSize))
  let seed = 0x369b5a17
  for (let i = blocks.length - 1; i > 0; i--) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
    const j = (seed >>> 0) % (i + 1)
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
  }
  return blocks.flat()
}

export function summarizeBridge(recording) {
  const { rows, sampleRate } = recording
  if (!Array.isArray(rows) || rows.length < 3 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error('Invalid signal recording.')
  }
  const breath = rows.map(row => row.respiration)
  const heartEnvelope = rows.map(row => row.cardiacEnvelope)
  const neuralEnvelope = rows.map(row => row.neuralEnvelope)
  return {
    seconds: (rows.at(-1).t - rows[0].t),
    sampleCount: rows.length,
    sampleRate,
    cardiacCorrelation: pearson(breath, heartEnvelope),
    neuralCorrelation: pearson(breath, neuralEnvelope),
    shuffledCardiacCorrelation: pearson(breath, permuteBlocks(heartEnvelope, sampleRate)),
    shuffledNeuralCorrelation: pearson(breath, permuteBlocks(neuralEnvelope, sampleRate)),
    shuffledControl: 'DETERMINISTIC_BLOCK_REORDER_NOT_SIGNIFICANCE_TEST',
  }
}

/**
 * Import ONLY already-preprocessed, evenly sampled envelope data in CSV.
 * No uploading and no raw ECG/EEG in this pilot.
 * Header must exactly equal t_sec,respiration,cardiac_envelope,neural_envelope.
 */
export function parseEnvelopeCsv(input) {
  if (typeof input !== 'string' || input.length > 2_000_000) throw new Error('CSV is missing or exceeds the 2 MB limit.')
  const lines = input.replace(/\r/g, '').trim().split('\n')
  if (lines.length > 20002) throw new Error('CSV exceeds 20,000 sample rows.')
  if (lines[0]?.replace(/^\uFEFF/, '').trim() !== IMPORT_COLUMNS.join(',')) {
    throw new Error('Expected header: ' + IMPORT_COLUMNS.join(','))
  }
  const rows = []
  for (const [index, line] of lines.slice(1).entries()) {
    const fields = line.split(',')
    if (fields.length !== 4 || fields.some(field => !field.trim() || !Number.isFinite(Number(field)))) {
      throw new Error('Invalid numeric CSV row ' + (index + 2))
    }
    const [t, respiration, cardiacEnvelope, neuralEnvelope] = fields.map(Number)
    if (cardiacEnvelope < 0 || neuralEnvelope < 0) {
      throw new Error('Envelopes must be nonnegative at CSV row ' + (index + 2))
    }
    rows.push({ t, respiration, cardiacEnvelope, neuralEnvelope, cardiac: cardiacEnvelope, neural: neuralEnvelope })
  }
  if (rows.length < 200) throw new Error('At least 200 sample rows are required.')
  const dt = (rows.at(-1).t - rows[0].t) / (rows.length - 1)
  const sampleRate = 1 / dt
  if (!(dt > 0) || !Number.isFinite(sampleRate) || sampleRate < 5 || sampleRate > 500) {
    throw new Error('Sample frequency must be 5–500 Hz.')
  }
  if (rows.at(-1).t - rows[0].t < 10) throw new Error('At least 10 seconds of data are required.')
  for (let i = 1; i < rows.length; i++) {
    const gap = rows[i].t - rows[i - 1].t
    if (gap <= 0 || Math.abs(gap - dt) > dt * 0.05 + 1e-9) {
      throw new Error('Time stamps must be strictly increasing and evenly sampled (within 5%).')
    }
  }
  // Relative t starts at zero for plotting; raw text is not retained.
  const start = rows[0].t
  for (const row of rows) row.t -= start
  if (pearson(rows.map(r => r.respiration), rows.map((r, i) => i)) === null) {
    throw new Error('Respiration channel has no measurable variation.')
  }
  return {
    version: BSR2_VERSION,
    origin: 'USER_SUPPLIED_UNVERIFIED',
    sampleRate,
    rows,
    settings: { preprocessing: 'SUPPLIED_EXTERNALLY', sampleRate, durationSeconds: rows.at(-1).t },
    description: 'Local CSV envelopes, externally preprocessed; physiological provenance and methods unverified.',
  }
}

export function buildBridgeReceipt(recording, summary, { sourceNote = '' } = {}) {
  return {
    protocol: BSR2_VERSION,
    provenance: recording.origin,
    status: recording.origin === 'SIMULATED' ? 'SYNTHETIC_EXPERIMENT' : 'UNVERIFIED_USER_DATA',
    sourceNote: recording.origin === 'SIMULATED' ? null : String(sourceNote).slice(0, 240),
    localProcessingOnly: true,
    rawSamplesIncluded: false,
    generatedUtc: null,
    settings: recording.settings,
    summary,
    guardrails: [
      'Correlation is descriptive and does not demonstrate causation or phase locking.',
      'Block-shuffled diagnostic does not establish statistical significance.',
      'No diagnosis, treatment or consciousness claim is supported.',
      'Imported envelopes are not automatically verified physiological measurements.',
    ],
  }
}
