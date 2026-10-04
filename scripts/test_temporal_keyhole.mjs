import assert from 'node:assert/strict'
import {
  TEMPORAL_BASE_DIGEST,
  TEMPORAL_GENESIS,
  ambiguityQueue,
  buildTemporalExport,
  compareTemporalViews,
  deriveTemporalView,
  ledgerHeadAt,
  provenanceBundle,
  stableStringify,
  temporalRecords,
  temporalReviewEvents,
} from '../src/temporalKeyhole.js'

const k1 = deriveTemporalView(1)
const k3 = deriveTemporalView(3)
const k4 = deriveTemporalView(4)

assert.equal(k1.ledgerHead, TEMPORAL_GENESIS)
assert.equal(k3.ledgerHead, temporalReviewEvents[0].eventHash)
assert.equal(k4.ledgerHead, temporalReviewEvents[1].eventHash)

const a1k1 = k1.items.find((item) => item.recordId === 'A1')
const a1k3 = k3.items.find((item) => item.recordId === 'A1')
assert.equal(a1k1.subject, 'UNKNOWN')
assert.equal(a1k1.ambiguity, true)
assert.equal(a1k3.subject, 'NODE_X')
assert.equal(a1k3.ambiguity, false)
assert.deepEqual(a1k3.appliedEventIds, ['RV1'])

const baseA1 = temporalRecords.find((record) => record.recordId === 'A1')
assert.equal(baseA1.subject, 'UNKNOWN')

const c1k1 = k1.items.find((item) => item.recordId === 'C1')
const c1k4 = k4.items.find((item) => item.recordId === 'C1')
assert.equal(c1k1.sourceStatus, 'ALLEGED')
assert.equal(c1k1.reviewStatus, 'ALLEGED')
assert.equal(c1k4.sourceStatus, 'ALLEGED')
assert.equal(c1k4.reviewStatus, 'CORROBORATED')
assert.equal(c1k4.externalEvidence[0].source.independenceGroup, 'EXT_G1')

const filtered = deriveTemporalView(4, { statuses: ['CORROBORATED'] })
assert.deepEqual(filtered.items.map((item) => item.recordId), ['C1'])

const relations = deriveTemporalView(4, { relations: ['ALLEGED_LINK'] })
assert.deepEqual(relations.items.map((item) => item.recordId), ['A1', 'C1'])

const analystOff = deriveTemporalView(4)
const analystOn = deriveTemporalView(4, { includeAnalystHypotheses: true })
assert.equal(analystOff.items.some((item) => item.recordId === 'H1'), false)
assert.equal(analystOn.items.some((item) => item.recordId === 'H1'), true)

assert.deepEqual(ambiguityQueue(1).map((item) => item.recordId), ['A1'])
assert.deepEqual(ambiguityQueue(3), [])

const bundle = provenanceBundle('C1', 4)
assert.equal(bundle.baseRecord.provenance.layer, 'SOURCE_MAP')
assert.deepEqual(bundle.reviewEvents.map((event) => event.eventId), ['EV1'])
assert.equal(bundle.baseDigest, TEMPORAL_BASE_DIGEST)

const comparison = compareTemporalViews(k1, k4)
assert.equal(comparison.find((row) => row.recordId === 'C1').changed, true)
assert.equal(comparison.find((row) => row.recordId === 'C2').changed, false)

const exportPayload = buildTemporalExport(k1, k4)
assert.equal(exportPayload.baseDigest, TEMPORAL_BASE_DIGEST)
assert.equal(exportPayload.reviewLedger.length, 2)
assert.ok(exportPayload.exportFingerprint.startsWith('fnv1a32:'))

const k1Replay = deriveTemporalView(1)
assert.equal(stableStringify(k1), stableStringify(k1Replay))
assert.equal(ledgerHeadAt(4), temporalReviewEvents[1].eventHash)

console.log('PASS_NBGT6_MODEL')
