import {
  RELATION_OPTIONS,
  STATUS_OPTIONS,
  TEMPORAL_BASE_DIGEST,
  ambiguityQueue as coreAmbiguityQueue,
  buildTemporalExport as coreBuildTemporalExport,
  compareTemporalViews,
  deriveTemporalView as coreDeriveTemporalView,
  provenanceBundle as coreProvenanceBundle,
} from './temporalKeyhole.js'

import {
  appendEvidenceToEnvelope,
  epistemicFingerprint,
  makeEpistemicEnvelope,
} from './epistemicProvenance.js'

export {
  RELATION_OPTIONS,
  STATUS_OPTIONS,
  TEMPORAL_BASE_DIGEST,
  compareTemporalViews,
}

function attachEpistemic(item) {
  const analystHypothesis = item.originKind === 'ANALYST_HYPOTHESIS'
  let epistemic = makeEpistemicEnvelope({
    origin: analystHypothesis ? 'INFERRED' : 'OBSERVED',
    confidence: analystHypothesis ? 0.5 : 1,
    evidence: [
      {
        evidenceId: 'BASE:' + item.recordId,
        kind: analystHypothesis ? 'ANALYST_DERIVATION' : 'OBSERVATION',
        source: item.provenance?.sourceLocator ?? null,
        knownTime: item.knownTime,
        validTime: item.validTime,
        details: {
          originKind: item.originKind,
          sourceStatus: item.sourceStatus,
          relation: item.relation,
        },
      },
    ],
    lineage: {
      rootMemoryId: item.recordId,
      parentMemoryId: null,
      transitionReceiptIds: [],
      sourceMemoryIds: [],
      compactedFrom: [],
    },
    authority: {
      retainable: true,
      reasoningUsable: true,
      actionAuthorized: false,
    },
  })

  for (const event of item.externalEvidence ?? []) {
    epistemic = appendEvidenceToEnvelope(epistemic, {
      evidenceId: event.evidenceId,
      kind: 'EXTERNAL_EVIDENCE',
      source: event.source?.locator ?? null,
      knownTime: null,
      validTime: null,
      details: {
        independenceGroup: event.source?.independenceGroup ?? null,
        reviewStatus: event.status ?? null,
        ledgerEventId: event.ledgerEventId ?? null,
      },
    })
  }

  return {
    ...item,
    epistemic,
  }
}

export function deriveTemporalView(knowledgeCutoff, options = {}) {
  const core = coreDeriveTemporalView(knowledgeCutoff, options)
  const items = core.items.map(attachEpistemic)
  const layered = {
    ...core,
    items,
    epistemicLayer: 'NBG_EPISTEMIC_1',
  }
  return {
    ...layered,
    epistemicViewFingerprint: epistemicFingerprint(layered),
  }
}

export function ambiguityQueue(knowledgeCutoff) {
  return coreAmbiguityQueue(knowledgeCutoff).map(attachEpistemic)
}

export function provenanceBundle(recordId, knowledgeCutoff) {
  const core = coreProvenanceBundle(recordId, knowledgeCutoff)
  if (!core) return null

  const item = deriveTemporalView(knowledgeCutoff, {
    includeAnalystHypotheses: true,
  }).items.find((row) => row.recordId === recordId)

  const layered = {
    ...core,
    epistemicLayer: 'NBG_EPISTEMIC_1',
    epistemicMemory: item?.epistemic ?? null,
  }

  return {
    ...layered,
    epistemicBundleFingerprint: epistemicFingerprint(layered),
  }
}

export function buildTemporalExport(leftView, rightView) {
  const core = coreBuildTemporalExport(leftView, rightView)
  const layered = {
    ...core,
    epistemicLayer: 'NBG_EPISTEMIC_1',
  }
  return {
    ...layered,
    epistemicExportFingerprint: epistemicFingerprint(layered),
  }
}
