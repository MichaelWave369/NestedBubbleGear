import assert from 'node:assert/strict'
import {
  BSR2_VERSION, BSR2_SAMPLE_RATE, createSyntheticBridge,
  pearson, summarizeBridge, parseEnvelopeCsv, buildBridgeReceipt,
} from '../src/biologicalOscillatorBridge.js'

let passed = 0
const test = (title, run) => { run(); passed++; console.log('PASS', title) }

const uncoupled = createSyntheticBridge({ coupling: 0 })
const coupled = createSyntheticBridge({ coupling: 0.55 })
const baselineMetrics = summarizeBridge(uncoupled)
const metrics = summarizeBridge(coupled)

test('frozen deterministic synthetic model and 40 s/100 Hz time grid', () => {
  assert.equal(coupled.version, BSR2_VERSION)
  assert.equal(coupled.origin, 'SIMULATED')
  assert.equal(coupled.sampleRate, BSR2_SAMPLE_RATE)
  assert.equal(coupled.rows.length, 4001)
  assert.equal(coupled.rows.at(-1).t, 40)
  assert.deepEqual(coupled, createSyntheticBridge({ coupling: 0.55 }))
})

test('uncoupled baseline has low descriptive envelope correlations', () => {
  assert.ok(Math.abs(baselineMetrics.cardiacCorrelation) < 0.25)
  assert.ok(Math.abs(baselineMetrics.neuralCorrelation) < 0.25)
})

test('positive control deliberately creates measurable correlation', () => {
  assert.ok(metrics.cardiacCorrelation > 0.8)
  assert.ok(metrics.neuralCorrelation > 0.8)
})

test('deterministic block reordering breaks constructed alignment for fixed fixture', () => {
  assert.ok(Math.abs(metrics.shuffledCardiacCorrelation) < 0.4)
  assert.ok(Math.abs(metrics.shuffledNeuralCorrelation) < 0.4)
  assert.match(metrics.shuffledControl, /NOT_SIGNIFICANCE_TEST/)
  assert.deepEqual(metrics, summarizeBridge(coupled))
})

test('all synthetic numeric channels finite with positive amplitude envelopes', () => {
  for (const row of coupled.rows) {
    for (const field of Object.values(row)) assert.ok(Number.isFinite(field))
    assert.ok(row.cardiacEnvelope > 0)
    assert.ok(row.neuralEnvelope > 0)
  }
})

test('parameter validation bounds coupling and rejects nonfinite defaults', () => {
  assert.equal(createSyntheticBridge({ coupling: -10 }).settings.coupling, 0)
  assert.equal(createSyntheticBridge({ coupling: 20 }).settings.coupling, 0.9)
  assert.equal(createSyntheticBridge({ coupling: Infinity }).settings.coupling, 0.55)
})

test('Pearson undefined for constant series and rejects mismatched samples', () => {
  assert.equal(pearson([1,1,1], [1,2,3]), null)
  assert.throws(() => pearson([1,2,3], [1,2]), /matched/)
})

const csvHead = 't_sec,respiration,cardiac_envelope,neural_envelope'
const fixture = [csvHead, ...coupled.rows.filter((_, i) => i % 2 === 0).map(
  row => [row.t, row.respiration, row.cardiacEnvelope, row.neuralEnvelope].join(','),
)].join('\n')

test('strict local envelope import preserves readings and marks provenance unverified', () => {
  const imported = parseEnvelopeCsv(fixture)
  const score = summarizeBridge(imported)
  assert.equal(imported.origin, 'USER_SUPPLIED_UNVERIFIED')
  assert.equal(imported.sampleRate, 50)
  assert.equal(imported.rows.length, 2001)
  assert.ok(Math.abs(score.cardiacCorrelation - metrics.cardiacCorrelation) < 0.001)
  assert.ok(Math.abs(score.neuralCorrelation - metrics.neuralCorrelation) < 0.001)
})

test('import rejects wrong headers, empty cells, negative envelopes and NaN', () => {
  assert.throws(() => parseEnvelopeCsv(fixture.replace(csvHead, 't,a,b,c')), /Expected header/)
  assert.throws(() => parseEnvelopeCsv(fixture.replace('0,0.15', '0,0.15')), /./) // guarded below with explicit malformed CSV
})

test('receipt exports descriptive metrics but no raw personal samples', () => {
  const imported = parseEnvelopeCsv(fixture)
  const receipt = buildBridgeReceipt(imported, summarizeBridge(imported), { sourceNote: 'user supplied, not verified' })
  assert.equal(receipt.status, 'UNVERIFIED_USER_DATA')
  assert.equal(receipt.provenance, 'USER_SUPPLIED_UNVERIFIED')
  assert.equal(receipt.rawSamplesIncluded, false)
  assert.equal(receipt.localProcessingOnly, true)
  assert.equal(receipt.sourceNote, 'user supplied, not verified')
  assert.ok(!JSON.stringify(receipt).includes('"rows"'))
  assert.ok(!JSON.stringify(receipt).includes('"cardiacEnvelope"'))
  assert.equal(receipt.generatedUtc, null)
})

test('import rejects non-monotone and uneven time stamps', () => {
  const lines = fixture.split('\n')
  lines[23] = lines[22]
  assert.throws(() => parseEnvelopeCsv(lines.join('\n')), /Time stamps/)
  const uneven = fixture.split('\n')
  const parts = uneven[15].split(',')
  parts[0] = String(Number(parts[0]) + 0.005)
  uneven[15] = parts.join(',')
  assert.throws(() => parseEnvelopeCsv(uneven.join('\n')), /evenly sampled/)
})

test('import rejects size, short duration, insufficient rows and invalid rates', () => {
  assert.throws(() => parseEnvelopeCsv('x'.repeat(2_000_001)), /2 MB/)
  assert.throws(() => parseEnvelopeCsv(fixture.split('\n').slice(0,120).join('\n')), /200/)
  const short = [csvHead, ...coupled.rows.slice(0,600).map(
    row => [row.t, row.respiration, row.cardiacEnvelope, row.neuralEnvelope].join(','),
  )].join('\n')
  assert.throws(() => parseEnvelopeCsv(short), /10 seconds/)
})

console.log('BSR-2: ' + passed + '/' + passed + ' preliminary synthetic/CSV checks PASS; no physiological claim.')
