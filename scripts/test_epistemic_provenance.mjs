import assert from 'node:assert/strict'

import {
  EPISTEMIC_ORIGINS,
  appendEvidenceToEnvelope,
  compactMemories,
  createEpistemicMemory,
  decayMemory,
  epistemicFingerprint,
  exportMemoryBundle,
  factualRecall,
  handoffMemories,
  importMemoryBundle,
  logicalMemoryRegion,
  mergeMemorySets,
  promoteMemory,
  recordObservationFromPossibility,
  reloadMemoryStore,
  repeatMemory,
  retrieveMemories,
  serializeMemoryStore,
  summarizeMemories,
  validateEpistemicMemory,
} from '../src/epistemicProvenance.js'

import {
  deriveTemporalView,
  provenanceBundle,
} from '../src/temporalKeyhole.js'

assert.deepEqual(EPISTEMIC_ORIGINS, [
  'OBSERVED',
  'VERIFIED',
  'INFERRED',
  'DREAMED',
  'SIMULATED',
  'UNKNOWN',
])

const dream = createEpistemicMemory({
  memoryId: 'dream:93',
  content: {
    chamber: 7,
    proposition: 'Chamber 7 contains a red sphere.',
  },
  origin: 'DREAMED',
  confidence: 0.63,
  evidence: [],
  authority: {
    retainable: true,
    reasoningUsable: true,
    actionAuthorized: false,
  },
})

assert.equal(validateEpistemicMemory(dream), true)
assert.equal(dream.epistemic.origin, 'DREAMED')
assert.equal(logicalMemoryRegion(dream), 'DREAM_POSSIBILITY_BUBBLE')
assert.equal(dream.epistemic.authority.reasoningUsable, true)
assert.equal(dream.epistemic.authority.actionAuthorized, false)

const recall = factualRecall([dream], {
  predicate: (memory) => memory.content?.chamber === 7,
})
assert.equal(recall.status, 'UNKNOWN')
assert.equal(
  recall.reason,
  'NO_OBSERVATION_OR_VERIFICATION_SUPPORTS_THE_CLAIM',
)
assert.equal(recall.factualMemories.length, 0)
assert.equal(recall.knownPossibilities.length, 1)
assert.equal(recall.knownPossibilities[0].origin, 'DREAMED')
assert.equal(
  recall.knownPossibilities[0].memory.content.proposition,
  'Chamber 7 contains a red sphere.',
)

const repeated = repeatMemory(dream, 10000)
assert.equal(repeated.length, 10000)
assert.equal(
  repeated.every((memory) => memory.epistemic.origin === 'DREAMED'),
  true,
)
assert.equal(
  repeated.every((memory) => memory.epistemic.evidence.length === 0),
  true,
)

const retrievedRepeatedly = Array.from({ length: 100 }, () =>
  retrieveMemories([dream])[0],
)
assert.equal(
  retrievedRepeatedly.every((row) => row.origin === 'DREAMED'),
  true,
)

const compacted = compactMemories(repeated)
assert.equal(compacted.length, 1)
assert.equal(compacted[0].epistemic.origin, 'DREAMED')
assert.equal(compacted[0].repetitionCount, 10000)
assert.equal(compacted[0].epistemic.evidence.length, 0)
assert.equal(
  factualRecall(compacted, {
    predicate: (memory) => memory.content?.chamber === 7,
  }).status,
  'UNKNOWN',
)

const restarted = reloadMemoryStore(serializeMemoryStore(compacted))
assert.equal(restarted.importStatus, 'OK')
assert.equal(restarted.memories.length, 1)
assert.equal(restarted.memories[0].epistemic.origin, 'DREAMED')
assert.equal(restarted.memories[0].repetitionCount, 10000)

const summary = summarizeMemories(restarted.memories)
assert.equal(summary.summaryMode, 'EPISTEMIC_STRUCTURED_SUMMARY')
assert.equal(summary.groups.length, 1)
assert.equal(summary.groups[0].origin, 'DREAMED')
assert.equal(summary.groups[0].entries[0].factualStatus, 'UNVERIFIED_POSSIBILITY')
assert.deepEqual(
  summary.groups[0].entries[0].content,
  dream.content,
)

const exportedDream = exportMemoryBundle([dream], {
  bundleId: 'DREAM_ONLY_EXPORT',
})
const importedDream = importMemoryBundle(exportedDream)
assert.equal(importedDream.importStatus, 'OK')
assert.equal(importedDream.memories[0].epistemic.origin, 'DREAMED')

const handed = handoffMemories([dream], {
  fromAgent: 'AGENT_A',
  toAgent: 'AGENT_B',
})
assert.equal(handed.importStatus, 'OK')
assert.equal(handed.memories[0].epistemic.origin, 'DREAMED')

const mergedDreams = mergeMemorySets(
  repeatMemory(dream, 3),
  repeatMemory(dream, 4),
)
assert.equal(mergedDreams.length, 1)
assert.equal(mergedDreams[0].epistemic.origin, 'DREAMED')
assert.equal(mergedDreams[0].repetitionCount, 7)

const decayedDream = decayMemory(dream, 0.01)
assert.equal(decayedDream.epistemic.origin, 'DREAMED')
assert.equal(decayedDream.epistemic.confidence, 0.0063)
assert.equal(
  factualRecall([decayedDream], {
    predicate: () => true,
  }).status,
  'UNKNOWN',
)

const highConfidenceDream = createEpistemicMemory({
  memoryId: 'dream:high-confidence',
  content: 'The object is red.',
  origin: 'DREAMED',
  confidence: 0.999999,
  evidence: [],
})
assert.equal(
  factualRecall([highConfidenceDream], { predicate: () => true }).status,
  'UNKNOWN',
)

assert.throws(
  () =>
    promoteMemory(dream, {
      targetOrigin: 'INFERRED',
      evidenceEvent: {
        evidenceId: 'REPEAT_10000',
        kind: 'REPETITION',
        source: 'memory://self',
      },
      transitionId: 'T_BAD_REPEAT',
      derivedMemoryId: 'bad:repeat',
    }),
  /does not qualify/,
)

assert.throws(
  () =>
    promoteMemory(dream, {
      targetOrigin: 'VERIFIED',
      evidenceEvent: {
        evidenceId: 'V_DIRECT',
        kind: 'INDEPENDENT_VERIFICATION',
        source: 'synthetic://verification',
      },
      transitionId: 'T_BAD_DIRECT',
      derivedMemoryId: 'bad:direct',
    }),
  /is not allowed/,
)

const simulated = createEpistemicMemory({
  memoryId: 'sim:1',
  content: 'Simulation predicts a blue chamber.',
  origin: 'SIMULATED',
  confidence: 0.91,
  evidence: [
    {
      evidenceId: 'SIM_RUN_1',
      kind: 'SIMULATION_RESULT',
      source: 'simulator://world-model/1',
    },
  ],
})
assert.equal(
  factualRecall([simulated], { predicate: () => true }).status,
  'UNKNOWN',
)
assert.equal(
  compactMemories(repeatMemory(simulated, 20))[0].epistemic.origin,
  'SIMULATED',
)

const dreamPromotionSource = createEpistemicMemory({
  memoryId: 'dream:red-object',
  content: 'The object may be red.',
  origin: 'DREAMED',
  confidence: 0.63,
  evidence: [],
  authority: {
    retainable: true,
    reasoningUsable: true,
    actionAuthorized: false,
  },
})

const evidenceE37 = {
  evidenceId: 'E37',
  kind: 'OBSERVATION',
  source: 'sensor://camera-7',
  knownTime: 1107,
  details: { observedColor: 'red' },
}

const observation = recordObservationFromPossibility(dreamPromotionSource, {
  observationId: 'OBS:E37',
  observedMemoryId: 'obs:E37',
  evidenceEvent: evidenceE37,
  knownTime: 1107,
})

assert.equal(dreamPromotionSource.epistemic.origin, 'DREAMED')
assert.equal(dreamPromotionSource.epistemic.evidence.length, 0)
assert.equal(observation.observed.epistemic.origin, 'OBSERVED')
assert.equal(observation.observed.epistemic.evidence[0].evidenceId, 'E37')
assert.equal(
  observation.observed.epistemic.lineage.parentMemoryId,
  'dream:red-object',
)
assert.equal(
  observation.receipt.receiptType,
  'EPISTEMIC_OBSERVATION_DERIVATION',
)
assert.equal(observation.receipt.authorityChanged, false)

const inferred = promoteMemory(dreamPromotionSource, {
  targetOrigin: 'INFERRED',
  evidenceEvent: evidenceE37,
  transitionId: 'INF:I12',
  derivedMemoryId: 'inference:I12',
  knownTime: 1108,
})

assert.equal(inferred.derived.epistemic.origin, 'INFERRED')
assert.equal(inferred.derived.epistemic.evidence[0].evidenceId, 'E37')
assert.equal(
  inferred.derived.epistemic.lineage.parentMemoryId,
  'dream:red-object',
)
assert.equal(
  inferred.derived.epistemic.lineage.rootMemoryId,
  'dream:red-object',
)
assert.deepEqual(
  inferred.derived.epistemic.lineage.transitionReceiptIds,
  ['INF:I12'],
)
assert.equal(inferred.receipt.receiptType, 'EPISTEMIC_PROMOTION')
assert.equal(inferred.receipt.authorityChanged, false)
assert.equal(
  inferred.derived.epistemic.authority.actionAuthorized,
  false,
)

const verified = promoteMemory(inferred.derived, {
  targetOrigin: 'VERIFIED',
  evidenceEvent: {
    evidenceId: 'E42',
    kind: 'INDEPENDENT_VERIFICATION',
    source: 'lab://independent-check',
    knownTime: 1114,
  },
  transitionId: 'VER:V4',
  derivedMemoryId: 'verification:V4',
  knownTime: 1114,
})

assert.equal(verified.derived.epistemic.origin, 'VERIFIED')
assert.deepEqual(
  verified.derived.epistemic.evidence.map((row) => row.evidenceId),
  ['E37', 'E42'],
)
assert.equal(
  verified.derived.epistemic.lineage.parentMemoryId,
  'inference:I12',
)
assert.deepEqual(
  verified.derived.epistemic.lineage.transitionReceiptIds,
  ['INF:I12', 'VER:V4'],
)
assert.equal(verified.receipt.authorityChanged, false)
assert.equal(
  verified.derived.epistemic.authority.actionAuthorized,
  false,
)

const explicitlyActionAuthorizedVerified = createEpistemicMemory({
  memoryId: 'verified:action-authorized',
  content: 'A separately governed verified memory.',
  origin: 'VERIFIED',
  confidence: 0.9,
  evidence: [
    {
      evidenceId: 'V99',
      kind: 'VERIFICATION',
      source: 'validator://99',
    },
  ],
  authority: {
    retainable: true,
    reasoningUsable: true,
    actionAuthorized: true,
  },
})
assert.equal(
  explicitlyActionAuthorizedVerified.epistemic.authority.actionAuthorized,
  true,
)

const sameContentDream = createEpistemicMemory({
  memoryId: 'dream:same-content',
  content: 'X causes Z',
  origin: 'DREAMED',
  confidence: 0.5,
  evidence: [],
})
const sameContentVerified = createEpistemicMemory({
  memoryId: 'verified:same-content',
  content: 'X causes Z',
  origin: 'VERIFIED',
  confidence: 0.9,
  evidence: [
    {
      evidenceId: 'VZ',
      kind: 'VERIFICATION',
      source: 'validator://z',
    },
  ],
})

const mergedMixed = mergeMemorySets(
  [sameContentDream],
  [sameContentVerified],
)
assert.equal(mergedMixed.length, 2)
assert.deepEqual(
  mergedMixed.map((memory) => memory.epistemic.origin).sort(),
  ['DREAMED', 'VERIFIED'],
)

const mixedSummary = summarizeMemories(mergedMixed)
assert.deepEqual(
  mixedSummary.groups.map((group) => group.origin).sort(),
  ['DREAMED', 'VERIFIED'],
)
assert.equal(
  mixedSummary.groups.flatMap((group) => group.entries).length,
  2,
)

const corruptedBundle = JSON.parse(JSON.stringify(exportedDream))
corruptedBundle.payload.memories[0].epistemic.origin = 'VERIFIED'
const corruptedImport = importMemoryBundle(corruptedBundle)
assert.equal(corruptedImport.importStatus, 'PROVENANCE_INVALID')
assert.equal(corruptedImport.memories[0].epistemic.origin, 'UNKNOWN')
assert.equal(
  corruptedImport.memories[0].epistemic.authority.reasoningUsable,
  false,
)
assert.equal(
  corruptedImport.memories[0].epistemic.authority.actionAuthorized,
  false,
)

const maliciouslyRehashed = JSON.parse(JSON.stringify(exportedDream))
delete maliciouslyRehashed.payload.memories[0].epistemic.origin
maliciouslyRehashed.bundleFingerprint = epistemicFingerprint(
  maliciouslyRehashed.payload,
)
const missingOriginImport = importMemoryBundle(maliciouslyRehashed)
assert.equal(missingOriginImport.importStatus, 'PARTIAL_UNKNOWN')
assert.equal(missingOriginImport.memories[0].epistemic.origin, 'UNKNOWN')
assert.equal(
  missingOriginImport.memories[0].epistemic.authority.actionAuthorized,
  false,
)

const badSerialized = reloadMemoryStore('{not-json')
assert.equal(badSerialized.importStatus, 'PROVENANCE_INVALID')
assert.deepEqual(badSerialized.memories, [])

const appendedDreamEvidence = appendEvidenceToEnvelope(
  dream.epistemic,
  {
    evidenceId: 'SIMILAR_1',
    kind: 'SIMILARITY',
    source: 'memory://nearest-neighbor',
  },
)
assert.equal(appendedDreamEvidence.origin, 'DREAMED')

const temporalK1 = deriveTemporalView(1, {
  includeAnalystHypotheses: true,
})
const temporalK4 = deriveTemporalView(4, {
  includeAnalystHypotheses: true,
})

const c1k1 = temporalK1.items.find((item) => item.recordId === 'C1')
const c1k4 = temporalK4.items.find((item) => item.recordId === 'C1')
const h1k4 = temporalK4.items.find((item) => item.recordId === 'H1')

assert.equal(c1k1.epistemic.origin, 'OBSERVED')
assert.equal(c1k1.sourceStatus, 'ALLEGED')
assert.equal(c1k1.reviewStatus, 'ALLEGED')

assert.equal(c1k4.epistemic.origin, 'OBSERVED')
assert.equal(c1k4.sourceStatus, 'ALLEGED')
assert.equal(c1k4.reviewStatus, 'CORROBORATED')
assert.equal(
  c1k4.epistemic.evidence.some((row) => row.evidenceId === 'EXT_E1'),
  true,
)

assert.equal(h1k4.epistemic.origin, 'INFERRED')
assert.equal(h1k4.sourceStatus, 'INFERRED')

const c1Bundle = provenanceBundle('C1', 4)
assert.equal(c1Bundle.epistemicMemory.origin, 'OBSERVED')
assert.equal(
  c1Bundle.epistemicMemory.evidence.some(
    (row) => row.evidenceId === 'EXT_E1',
  ),
  true,
)

console.log('PASS_EPISTEMIC_PROVENANCE_DREAM_ISOLATION')
