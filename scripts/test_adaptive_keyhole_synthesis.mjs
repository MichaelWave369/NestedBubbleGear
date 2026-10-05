import assert from 'node:assert/strict'
import {
  DISTINGUISHABLE_EIGHT,
  FULL_SYNTHESIS_FAMILY,
  OBSERVER_CHANNELS,
  RESTRICTED_OUTCOME_PAIR,
  SYNTHESIS_BOUNDARY,
  buildObserverSynthesisExport,
  chooseNextKeyhole,
  synthesizeAdaptiveObserver,
  synthesizeStaticObserver,
  synthesisKeyholes,
} from '../src/adaptiveKeyholeSynthesis.js'

assert.deepEqual(OBSERVER_CHANNELS,['POLICY','OUTCOME','JOINT'])
assert.equal(synthesisKeyholes().length,144)
assert.equal(FULL_SYNTHESIS_FAMILY.length,9)
assert.equal(DISTINGUISHABLE_EIGHT.length,8)

const staticJoint=synthesizeStaticObserver(DISTINGUISHABLE_EIGHT,'JOINT')
assert.equal(staticJoint.status,'PASS')
assert.ok(staticJoint.minimalCardinality>0)
assert.equal(staticJoint.selectedKeyholes.length,staticJoint.minimalCardinality)
assert.equal(staticJoint.unseparablePairs.length,0)

const policyPair=synthesizeStaticObserver(RESTRICTED_OUTCOME_PAIR,'POLICY')
assert.equal(policyPair.status,'PASS')
assert.equal(policyPair.minimalCardinality,1)

const outcomePair=synthesizeStaticObserver(RESTRICTED_OUTCOME_PAIR,'OUTCOME')
assert.equal(outcomePair.status,'REFUSE_UNSEPARABLE')
assert.equal(outcomePair.unseparablePairs.length,1)

const full9=synthesizeStaticObserver(FULL_SYNTHESIS_FAMILY,'JOINT')
assert.equal(full9.status,'REFUSE_UNSEPARABLE')
assert.ok(full9.unseparablePairs.some((pair)=>
  pair.includes('I_ALTER_DEACTIVATE_PAYLOAD_ONLY')
  && pair.includes('I_REMOVE_SUPERSEDE_NORMAL1')
))

const next=chooseNextKeyhole(DISTINGUISHABLE_EIGHT,'JOINT')
assert.ok(next)
assert.ok(next.splitScore>0)
assert.equal(next.selectionRule,'MAX_PAIR_SPLIT_THEN_MIN_COST_THEN_EARLIEST_KEYHOLE')

const adaptive8=synthesizeAdaptiveObserver(DISTINGUISHABLE_EIGHT,'JOINT')
assert.equal(adaptive8.status,'PASS')
assert.equal(adaptive8.stats.resolvedLeafCount,8)
assert.equal(adaptive8.stats.unresolvedLeafCount,0)
assert.ok(adaptive8.stats.worstCaseDepth>0)

const adaptive9=synthesizeAdaptiveObserver(FULL_SYNTHESIS_FAMILY,'JOINT')
assert.equal(adaptive9.status,'REFUSE_UNSEPARABLE')
assert.ok(adaptive9.stats.unresolvedLeafCount>=1)

const exported=buildObserverSynthesisExport('EIGHT','JOINT')
assert.equal(exported.truthClaim,SYNTHESIS_BOUNDARY)
assert.equal(exported.staticObserver.status,'PASS')
assert.equal(exported.adaptiveObserver.status,'PASS')
assert.ok(exported.exportFingerprint.startsWith('fnv1a32:'))

console.log('PASS_NBGT15_ADAPTIVE_KEYHOLE_SYNTHESIS')
