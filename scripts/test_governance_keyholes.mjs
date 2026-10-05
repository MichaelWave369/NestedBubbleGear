import assert from 'node:assert/strict'
import {
  buildGovernanceExport,
  compareGovernanceKeyholes,
  governanceKeyhole,
  governanceTimeline,
  stableStringify,
} from '../src/governanceKeyholes.js'

const k5 = governanceKeyhole(5, 5)
const k7 = governanceKeyhole(7, 7)
const k8 = governanceKeyhole(8, 7)
const k10 = governanceKeyhole(10, 10)
const historical = governanceKeyhole(10, 7)

assert.equal(k5.selectedPolicyVersionId, 'NORMAL@1.0')
assert.equal(k5.governanceOutcome, 'REJECTED')
assert.equal(k7.selectedPolicyVersionId, 'EMERGENCY@1.0')
assert.equal(k7.visiblePolicyVersionIds.includes('NORMAL@2.0'), false)
assert.equal(k8.visiblePolicyVersionIds.includes('NORMAL@2.0'), true)
assert.equal(k8.selectedPolicyVersionId, 'EMERGENCY@1.0')
assert.equal(k10.selectedPolicyVersionId, 'NORMAL@2.0')
assert.equal(k10.governanceOutcome, 'ABSTAIN_CONFLICT')
assert.equal(k10.policyStatuses['NORMAL@1.0'], 'SUPERSEDED')
assert.equal(k10.policyStatuses['EMERGENCY@1.0'], 'INACTIVE')
assert.equal(historical.selectedPolicyVersionId, 'EMERGENCY@1.0')

const comparison = compareGovernanceKeyholes(k5, k10)
assert.equal(comparison.selectedPolicyChanged, true)
assert.equal(comparison.governanceOutcomeChanged, true)
assert.equal(comparison.ledgerHeadChanged, true)

const exported = buildGovernanceExport(k5, k10)
assert.equal(exported.truthClaim, 'NONE_POLICY_OUTCOME_IS_OBJECTIVE_TRUTH')
assert.equal(exported.policyRecords.length, 3)
assert.equal(governanceTimeline().length, 6)
assert.ok(exported.exportFingerprint.startsWith('fnv1a32:'))
assert.equal(stableStringify(k10), stableStringify(governanceKeyhole(10, 10)))

console.log('PASS_NBGT11_GOVERNANCE_KEYHOLES')
