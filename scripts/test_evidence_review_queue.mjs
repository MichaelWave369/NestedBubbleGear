import assert from 'node:assert/strict'
import {
  T8_FROZEN_DECISIONS,
  applyQueueDecision,
  buildQueueExport,
  deriveQueueStatus,
  queueRows,
} from '../src/evidenceReviewQueue.js'

const initial = deriveQueueStatus(T8_FROZEN_DECISIONS)
assert.equal(initial.sourceStatus, 'ALLEGED')
assert.equal(initial.reviewStatus, 'CORROBORATED')
assert.deepEqual(initial.acceptedCaptureIds, ['CAP_SUPPORT_V1'])

const rows = queueRows(T8_FROZEN_DECISIONS)
assert.equal(rows.find((row) => row.captureId === 'CAP_SUPPORT_V2').drift, true)
assert.equal(rows.find((row) => row.captureId === 'CAP_SUPPORT_V2').queueState, 'PENDING')
assert.equal(rows.find((row) => row.captureId === 'CAP_AMBIGUOUS').queueState, 'BLOCKED')
assert.equal(rows.find((row) => row.captureId === 'CAP_FAILED').queueState, 'BLOCKED')

const withOpposition = applyQueueDecision(
  T8_FROZEN_DECISIONS,
  'CAP_OPPOSE',
  'ACCEPT',
)
const disputed = deriveQueueStatus(withOpposition)
assert.equal(disputed.reviewStatus, 'DISPUTED')
assert.deepEqual(disputed.supportGroups, ['EXT_G1'])
assert.deepEqual(disputed.opposeGroups, ['EXT_G2'])

const rejectDrift = applyQueueDecision(
  T8_FROZEN_DECISIONS,
  'CAP_SUPPORT_V2',
  'REJECT',
)
const afterReject = deriveQueueStatus(rejectDrift)
assert.equal(afterReject.reviewStatus, 'CORROBORATED')
assert.deepEqual(afterReject.acceptedCaptureIds, ['CAP_SUPPORT_V1'])

assert.throws(
  () => applyQueueDecision(T8_FROZEN_DECISIONS, 'CAP_FAILED', 'ACCEPT'),
  /Only CAPTURED/,
)

const exported = buildQueueExport(withOpposition)
assert.equal(exported.sourceStatus, 'ALLEGED')
assert.equal(exported.derived.reviewStatus, 'DISPUTED')
assert.equal(exported.captures.length, 5)

console.log('PASS_NBGT8_REVIEW_QUEUE')
