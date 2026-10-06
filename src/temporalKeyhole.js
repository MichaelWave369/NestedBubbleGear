import {
  appendEvidenceToEnvelope,
  makeEpistemicEnvelope,
} from './epistemicProvenance.js'

export const TEMPORAL_GENESIS = 'GENESIS'

export const STATUS_OPTIONS = [
  'OBSERVED',
  'CORROBORATED',
  'INFERRED',
  'DISPUTED',
  'ALLEGED',
  'REFUTED',
  'UNKNOWN',
]

export const RELATION_OPTIONS = [
  'ALLEGED_LINK',
  'OCCURRED_BEFORE',
  'INFERRED_INFLUENCE',
]

export const TEMPORAL_BASE_DIGEST =
  '7fb9e13cb1e04e6fb1620d658c15b579e5c57982e1f7919f8686d8dac8d7d127'

export const temporalRecords = [
  {
    recordId: 'C1',
    originKind: 'SOURCE_MAP',
    validTime: 1,
    knownTime: 1,
    subject: 'NODE_A',
    relation: 'ALLEGED_LINK',
    object: 'NODE_B',
    sourceStatus: 'ALLEGED',
    ambiguity: false,
    provenance: {
      layer: 'SOURCE_MAP',
      sourceLocator: 'qweb:p1:fixture-arrow-1',
      sourceLineage: 'QWEB_ORIGINAL',
    },
  },
  {
    recordId: 'A1',
    originKind: 'SOURCE_MAP',
    validTime: 1,
    knownTime: 1,
    subject: 'UNKNOWN',
    relation: 'ALLEGED_LINK',
    object: 'NODE_C',
    sourceStatus: 'UNKNOWN',
    ambiguity: true,
    provenance: {
      layer: 'SOURCE_MAP',
      sourceLocator: 'qweb:p1:tiny-label-1',
      sourceLineage: 'QWEB_ORIGINAL',
    },
  },
  {
    recordId: 'C2',
    originKind: 'SOURCE_MAP',
    validTime: 1,
    knownTime: 1,
    subject: 'EVENT_1',
    relation: 'OCCURRED_BEFORE',
    object: 'EVENT_2',
    sourceStatus: 'OBSERVED',
    ambiguity: false,
    provenance: {
      layer: 'SOURCE_MAP',
      sourceLocator: 'qweb:p1:center-timeline-1',
      sourceLineage: 'QWEB_ORIGINAL',
    },
  },
  {
    recordId: 'H1',
    originKind: 'ANALYST_HYPOTHESIS',
    validTime: 1,
    knownTime: 1,
    subject: 'NODE_A',
    relation: 'INFERRED_INFLUENCE',
    object: 'NODE_C',
    sourceStatus: 'INFERRED',
    ambiguity: false,
    provenance: {
      layer: 'ANALYST_HYPOTHESIS',
      sourceLocator: 'analyst://nbgt5/hypothesis-1',
      sourceLineage: 'ANALYST_SESSION_1',
    },
  },
]

export const temporalReviewEvents = [
  {
    eventId: 'RV1',
    eventType: 'RESOLVE_AMBIGUITY',
    targetRecordId: 'A1',
    knownTime: 3,
    reviewerId: 'REVIEWER_1',
    reason: 'synthetic label-resolution witness',
    payload: { subject: 'NODE_X', object: 'NODE_C' },
    provenance: {
      layer: 'REVIEW_EVENT',
      locator: 'review://nbgt5/RV1',
    },
    prevHash: TEMPORAL_GENESIS,
    eventHash:
      '095ad8f8de0ec42957782756f9c59a69789af86057835b82c127de5b4763e744',
  },
  {
    eventId: 'EV1',
    eventType: 'ADD_EXTERNAL_EVIDENCE',
    targetRecordId: 'C1',
    knownTime: 4,
    reviewerId: 'REVIEWER_1',
    reason: 'synthetic external-corroboration witness',
    payload: {
      evidenceId: 'EXT_E1',
      status: 'CORROBORATED',
      source: {
        sourceId: 'EXT_S1',
        independenceGroup: 'EXT_G1',
        locator: 'synthetic://external/source-1',
        provenance: 'SYNTHETIC_EXTERNAL_EVIDENCE',
      },
    },
    provenance: {
      layer: 'REVIEW_EVENT',
      locator: 'review://nbgt5/EV1',
    },
    prevHash:
      '095ad8f8de0ec42957782756f9c59a69789af86057835b82c127de5b4763e744',
    eventHash:
      '8f4ac706fe0fb6364b0848783bd5ab7449441ef1c619bc16aca15ed1950b10ad',
  },
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((out, key) => {
        out[key] = stable(value[key])
        return out
      }, {})
  }
  return value
}

export function stableStringify(value) {
  return JSON.stringify(stable(value))
}

export function fingerprint(value) {
  const valueText = typeof value === 'string' ? value : stableStringify(value)
  let hash = 2166136261
  for (let i = 0; i < valueText.length; i += 1) {
    hash ^= valueText.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0')
}

function temporalEpistemicEnvelope(record) {
  const analystHypothesis = record.originKind === 'ANALYST_HYPOTHESIS'
  const origin = analystHypothesis ? 'INFERRED' : 'OBSERVED'
  const evidenceKind = analystHypothesis ? 'ANALYST_DERIVATION' : 'OBSERVATION'
  const locator = record.provenance?.sourceLocator ?? null

  return makeEpistemicEnvelope({
    origin,
    confidence: analystHypothesis ? 0.5 : 1,
    evidence: [
      {
        evidenceId: 'BASE:' + record.recordId,
        kind: evidenceKind,
        source: locator,
        knownTime: record.knownTime,
        validTime: record.validTime,
        details: {
          originKind: record.originKind,
          sourceStatus: record.sourceStatus,
          relation: record.relation,
        },
      },
    ],
    lineage: {
      rootMemoryId: record.recordId,
      parentMemoryId: null,
      transitionReceiptIds: [],
      sourceMemoryIds: [],
    },
    authority: {
      retainable: true,
      reasoningUsable: true,
      actionAuthorized: false,
    },
  })
}

function deriveRecord(record) {
  return {
    recordId: record.recordId,
    originKind: record.originKind,
    validTime: record.validTime,
    knownTime: record.knownTime,
    subject: record.subject,
    relation: record.relation,
    object: record.object,
    sourceStatus: record.sourceStatus,
    reviewStatus: record.sourceStatus,
    ambiguity: Boolean(record.ambiguity),
    provenance: clone(record.provenance),
    epistemic: temporalEpistemicEnvelope(record),
    externalEvidence: [],
    appliedEventIds: [],
  }
}

export function visibleReviewEvents(knowledgeCutoff) {
  return temporalReviewEvents
    .filter((event) => event.knownTime <= knowledgeCutoff)
    .map(clone)
}

export function ledgerHeadAt(knowledgeCutoff) {
  const events = visibleReviewEvents(knowledgeCutoff)
  return events.length ? events[events.length - 1].eventHash : TEMPORAL_GENESIS
}

export function deriveTemporalView(
  knowledgeCutoff,
  {
    statuses = [],
    relations = [],
    includeAnalystHypotheses = false,
  } = {},
) {
  const statusSet = new Set(statuses)
  const relationSet = new Set(relations)

  const byId = new Map()

  temporalRecords
    .filter((record) => record.knownTime <= knowledgeCutoff)
    .filter(
      (record) =>
        includeAnalystHypotheses || record.originKind !== 'ANALYST_HYPOTHESIS',
    )
    .forEach((record) => byId.set(record.recordId, deriveRecord(record)))

  visibleReviewEvents(knowledgeCutoff).forEach((event) => {
    const target = byId.get(event.targetRecordId)
    if (!target) return

    if (event.eventType === 'RESOLVE_AMBIGUITY') {
      target.subject = event.payload.subject ?? target.subject
      target.object = event.payload.object ?? target.object
      target.ambiguity = false
      target.appliedEventIds.push(event.eventId)
    }

    if (event.eventType === 'ADD_EXTERNAL_EVIDENCE') {
      target.externalEvidence.push({
        ...clone(event.payload),
        ledgerEventId: event.eventId,
      })
      target.epistemic = appendEvidenceToEnvelope(target.epistemic, {
        evidenceId: event.payload.evidenceId,
        kind: 'EXTERNAL_EVIDENCE',
        source: event.payload.source?.locator ?? null,
        knownTime: event.knownTime,
        validTime: null,
        details: {
          independenceGroup: event.payload.source?.independenceGroup ?? null,
          reviewStatus: event.payload.status,
          ledgerEventId: event.eventId,
        },
      })
      target.reviewStatus = event.payload.status
      target.appliedEventIds.push(event.eventId)
    }
  })

  let items = [...byId.values()].sort((a, b) =>
    a.recordId.localeCompare(b.recordId),
  )

  if (statusSet.size) {
    items = items.filter((item) => statusSet.has(item.reviewStatus))
  }

  if (relationSet.size) {
    items = items.filter((item) => relationSet.has(item.relation))
  }

  const view = {
    experiment: 'NBG-T6',
    semanticsSource: 'NBG-T5',
    knowledgeCutoff,
    filters: {
      statuses: [...statusSet].sort(),
      relations: [...relationSet].sort(),
      includeAnalystHypotheses: Boolean(includeAnalystHypotheses),
    },
    items,
    baseDigest: TEMPORAL_BASE_DIGEST,
    ledgerHead: ledgerHeadAt(knowledgeCutoff),
  }

  return {
    ...view,
    viewFingerprint: fingerprint(view),
  }
}

export function provenanceBundle(recordId, knowledgeCutoff) {
  const baseRecord = temporalRecords.find((record) => record.recordId === recordId)
  if (!baseRecord) return null

  const reviewEvents = visibleReviewEvents(knowledgeCutoff).filter(
    (event) => event.targetRecordId === recordId,
  )

  const derivedRecord = deriveTemporalView(knowledgeCutoff, {
    includeAnalystHypotheses: true,
  }).items.find((item) => item.recordId === recordId) ?? null

  const bundle = {
    recordId,
    knowledgeCutoff,
    baseRecord: clone(baseRecord),
    epistemicMemory: derivedRecord ? clone(derivedRecord.epistemic) : null,
    reviewEvents,
    baseDigest: TEMPORAL_BASE_DIGEST,
    ledgerHeadAtExport:
      reviewEvents.length > 0
        ? reviewEvents[reviewEvents.length - 1].eventHash
        : TEMPORAL_GENESIS,
  }

  return {
    ...bundle,
    bundleFingerprint: fingerprint(bundle),
  }
}

export function ambiguityQueue(knowledgeCutoff) {
  return deriveTemporalView(knowledgeCutoff, {
    includeAnalystHypotheses: true,
  }).items.filter((item) => item.ambiguity)
}

export function compareTemporalViews(left, right) {
  const ids = [...new Set([...left.items, ...right.items].map((item) => item.recordId))].sort()

  return ids.map((recordId) => {
    const a = left.items.find((item) => item.recordId === recordId) ?? null
    const b = right.items.find((item) => item.recordId === recordId) ?? null
    const changed = stableStringify(a) !== stableStringify(b)
    return { recordId, left: a, right: b, changed }
  })
}

export function buildTemporalExport(leftView, rightView) {
  const payload = {
    experiment: 'NBG-T6',
    version: '0.1.0',
    baseDigest: TEMPORAL_BASE_DIGEST,
    baseRecords: clone(temporalRecords),
    reviewLedger: clone(temporalReviewEvents),
    leftView: clone(leftView),
    rightView: clone(rightView),
  }

  return {
    ...payload,
    exportFingerprint: fingerprint(payload),
  }
}
