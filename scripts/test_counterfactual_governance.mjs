import assert from 'node:assert/strict'
import {
  COUNTERFACTUAL_OPTIONS,
  buildCounterfactualExport,
  buildCounterfactualTimeline,
  counterfactualComparison,
  firstOutcomeDivergence,
  observedTimeline,
  stableStringify,
} from '../src/counterfactualGovernance.js'

assert.equal(COUNTERFACTUAL_OPTIONS.length,3)
assert.equal(observedTimeline().length,6)
assert.equal(buildCounterfactualTimeline('REMOVE_DEACTIVATE').length,5)
assert.equal(buildCounterfactualTimeline('DELAY_DEACTIVATE').length,6)
assert.equal(buildCounterfactualTimeline('ALTER_DEACTIVATE').length,6)

const remove=counterfactualComparison('REMOVE_DEACTIVATE',10,10)
assert.equal(remove.observed.selectedPolicyVersionId,'NORMAL@2.0')
assert.equal(remove.observed.governanceOutcome,'ABSTAIN_CONFLICT')
assert.equal(remove.counterfactual.selectedPolicyVersionId,'EMERGENCY@1.0')
assert.equal(remove.counterfactual.governanceOutcome,'REJECTED')
assert.equal(remove.policyChanged,true)
assert.equal(remove.outcomeChanged,true)
assert.equal(remove.branchKind,'COUNTERFACTUAL')
assert.equal(remove.truthClaim,'COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY')

const delay=counterfactualComparison('DELAY_DEACTIVATE',10,10)
assert.equal(delay.counterfactual.selectedPolicyVersionId,'EMERGENCY@1.0')
assert.equal(delay.counterfactual.governanceOutcome,'REJECTED')

const alter9=counterfactualComparison('ALTER_DEACTIVATE',9,9)
assert.equal(alter9.counterfactual.selectedPolicyVersionId,'EMERGENCY@1.0')
assert.equal(alter9.counterfactual.governanceOutcome,'REJECTED')
assert.equal(alter9.outcomeChanged,true)

for(const option of COUNTERFACTUAL_OPTIONS){
  const first=firstOutcomeDivergence(option.id)
  assert.equal(first.knownCutoff,9)
  assert.equal(first.validTime,9)
}

const exported=buildCounterfactualExport('REMOVE_DEACTIVATE',10,10)
assert.equal(exported.truthClaim,'COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY')
assert.equal(exported.firstOutcomeDivergence.targetEventId,'EV_DEACTIVATE_EMERGENCY')
assert.ok(exported.exportFingerprint.startsWith('fnv1a32:'))
assert.equal(
  stableStringify(buildCounterfactualExport('REMOVE_DEACTIVATE',10,10)),
  stableStringify(buildCounterfactualExport('REMOVE_DEACTIVATE',10,10)),
)

console.log('PASS_NBGT12_COUNTERFACTUAL_GOVERNANCE')
