import assert from 'node:assert/strict'
import {
  EQUIVALENCE_BOUNDARY,
  buildEquivalenceExport,
  buildInterventionEquivalenceAtlas,
  defaultEquivalencePairs,
  interventionPairReceipt,
} from '../src/interventionEquivalence.js'

const pairs=defaultEquivalencePairs()
assert.equal(pairs.length,4)

const deactivation=interventionPairReceipt('I_REMOVE_DEACTIVATE','I_DELAY_DEACTIVATE_11')
assert.equal(deactivation.targetEquivalent,true)
assert.equal(deactivation.temporalEquivalent,false)
assert.equal(deactivation.classification,'KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT')
assert.equal(deactivation.minimalSeparatorCardinality,1)
assert.ok(deactivation.residueCount>0)
assert.ok(deactivation.firstSeparatingKeyhole)

const normal2=interventionPairReceipt('I_REMOVE_REGISTER_NORMAL2','I_DELAY_REGISTER_NORMAL2_11')
assert.equal(normal2.targetEquivalent,true)
assert.equal(normal2.temporalEquivalent,false)

const controls=interventionPairReceipt('I_ALTER_DEACTIVATE_PAYLOAD_ONLY','I_REMOVE_SUPERSEDE_NORMAL1')
assert.equal(controls.targetEquivalent,true)
assert.equal(controls.temporalEquivalent,true)
assert.equal(controls.classification,'TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY')
assert.equal(controls.residueCount,0)
assert.equal(controls.minimalSeparatorCardinality,0)
assert.equal(controls.firstSeparatingKeyhole,null)

const alter=interventionPairReceipt('I_ALTER_DEACTIVATE_VALID10','I_ALTER_DEACTIVATE_PAYLOAD_ONLY')
assert.equal(alter.targetEquivalent,true)
assert.equal(alter.temporalEquivalent,false)

const atlas=buildInterventionEquivalenceAtlas()
assert.equal(atlas.counts.interventions,9)
assert.equal(atlas.counts.pairs,36)
assert.ok(atlas.counts.targetEquivalentPairs>0)
assert.ok(atlas.counts.hiddenResiduePairs>0)
assert.ok(atlas.counts.temporallyEquivalentPairs>0)
assert.equal(atlas.truthClaim,EQUIVALENCE_BOUNDARY)
assert.ok(atlas.atlasFingerprint.startsWith('fnv1a32:'))

const exported=buildEquivalenceExport()
assert.equal(exported.truthClaim,EQUIVALENCE_BOUNDARY)
assert.equal(exported.receipt.classification,'KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT')
assert.ok(exported.exportFingerprint.startsWith('fnv1a32:'))

assert.deepEqual(
  interventionPairReceipt('I_REMOVE_DEACTIVATE','I_DELAY_DEACTIVATE_11'),
  interventionPairReceipt('I_DELAY_DEACTIVATE_11','I_REMOVE_DEACTIVATE'),
)

console.log('PASS_NBGT14_INTERVENTION_EQUIVALENCE')
