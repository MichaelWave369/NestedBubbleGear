import assert from 'node:assert/strict'
import {
  SENSITIVITY_INTERVENTIONS,
  buildSensitivityAtlas,
  buildSensitivityExport,
  classifySensitivity,
  minimalRejectedSingletons,
  mutateTimeline,
  stableStringify,
} from '../src/governanceSensitivity.js'

assert.equal(SENSITIVITY_INTERVENTIONS.length,9)
assert.equal(mutateTimeline('I_REMOVE_DEACTIVATE').length,5)
assert.equal(mutateTimeline('I_ALTER_DEACTIVATE_PAYLOAD_ONLY').length,6)

const atlas=buildSensitivityAtlas(10,10)
assert.equal(atlas.rows.length,9)
assert.equal(atlas.truthClaim,'SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION')
assert.ok(atlas.atlasFingerprint.startsWith('fnv1a32:'))

const remove=classifySensitivity('I_REMOVE_DEACTIVATE',10,10)
assert.equal(remove.targetClass,'OUTCOME_CHANGING')
assert.equal(remove.counterfactualOutcome,'REJECTED')

const alter=classifySensitivity('I_ALTER_DEACTIVATE_VALID10',10,10)
assert.equal(alter.targetClass,'TARGET_INERT')
assert.equal(alter.temporalClass,'TEMPORAL_OUTCOME_LEVERAGE')
assert.equal(alter.firstOutcomeDivergence.knownCutoff,9)
assert.equal(alter.firstOutcomeDivergence.validTime,9)

const activate=classifySensitivity('I_DELAY_ACTIVATE_EMERGENCY_8',10,10)
assert.equal(activate.targetClass,'TARGET_INERT')
assert.equal(activate.temporalClass,'TEMPORAL_POLICY_LEVERAGE')
assert.equal(activate.firstOutcomeDivergence,null)

const payload=classifySensitivity('I_ALTER_DEACTIVATE_PAYLOAD_ONLY',10,10)
assert.equal(payload.targetClass,'TARGET_INERT')
assert.equal(payload.temporalClass,'LEDGER_ONLY_INERT')
assert.notEqual(payload.observedLedgerFingerprint,payload.branchLedgerFingerprint)

const supersede=classifySensitivity('I_REMOVE_SUPERSEDE_NORMAL1',10,10)
assert.equal(supersede.temporalClass,'LEDGER_ONLY_INERT')

const minimal=minimalRejectedSingletons(10,10)
assert.equal(minimal.minimalCardinality,1)
assert.deepEqual(minimal.interventionIds,[
  'I_DELAY_DEACTIVATE_11',
  'I_DELAY_REGISTER_NORMAL2_11',
  'I_REMOVE_DEACTIVATE',
  'I_REMOVE_REGISTER_NORMAL2',
])
assert.equal(minimal.causalClaim,'NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE')

const exported=buildSensitivityExport(10,10)
assert.equal(exported.truthClaim,'SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION')
assert.ok(exported.exportFingerprint.startsWith('fnv1a32:'))
assert.equal(
  stableStringify(buildSensitivityAtlas(10,10)),
  stableStringify(buildSensitivityAtlas(10,10)),
)

console.log('PASS_NBGT13_GOVERNANCE_SENSITIVITY_ATLAS')
