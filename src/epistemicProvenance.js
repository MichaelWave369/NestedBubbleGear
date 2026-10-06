export const EPISTEMIC_ORIGINS = Object.freeze([
  'OBSERVED',
  'VERIFIED',
  'INFERRED',
  'DREAMED',
  'SIMULATED',
  'UNKNOWN',
])

export const POSSIBILITY_ORIGINS = Object.freeze([
  'DREAMED',
  'SIMULATED',
])

export const DEFAULT_MEMORY_AUTHORITY = Object.freeze({
  retainable: true,
  reasoningUsable: true,
  actionAuthorized: false,
})

const PROMOTION_GRAPH = Object.freeze({
  DREAMED: new Set(['INFERRED']),
  SIMULATED: new Set(['INFERRED']),
  UNKNOWN: new Set(['INFERRED']),
  INFERRED: new Set(['VERIFIED']),
  OBSERVED: new Set(['VERIFIED']),
  VERIFIED: new Set(),
})

const QUALIFYING_EVIDENCE = Object.freeze({
  OBSERVED: new Set(['OBSERVATION', 'MEASUREMENT', 'AUTHORITATIVE_TOOL']),
  INFERRED: new Set([
    'OBSERVATION',
    'MEASUREMENT',
    'AUTHORITATIVE_TOOL',
    'EXTERNAL_EVIDENCE',
    'SIMULATION_RESULT',
    'INDEPENDENT_VERIFICATION',
  ]),
  VERIFIED: new Set([
    'VERIFICATION',
    'EXTERNAL_VERIFICATION',
    'INDEPENDENT_VERIFICATION',
  ]),
})

const NON_EVIDENCE_KINDS = new Set([
  'REPETITION',
  'SIMILARITY',
  'CONFIDENCE',
  'MODEL_AGREEMENT_ONLY',
])

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

export function epistemicFingerprint(value) {
  const text = typeof value === 'string' ? value : stableStringify(value)
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0')
}

function assertOrigin(origin) {
  if (!EPISTEMIC_ORIGINS.includes(origin)) {
    throw new Error('Unsupported epistemic origin: ' + origin)
  }
  return origin
}

function normalizeConfidence(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Error('confidence must be a finite number in [0, 1]')
  }
  return number
}

function normalizeAuthority(authority = DEFAULT_MEMORY_AUTHORITY) {
  const merged = {
    ...DEFAULT_MEMORY_AUTHORITY,
    ...clone(authority),
  }
  for (const key of ['retainable', 'reasoningUsable', 'actionAuthorized']) {
    if (typeof merged[key] !== 'boolean') {
      throw new Error('authority.' + key + ' must be boolean')
    }
  }
  return merged
}

export function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    throw new Error('evidence object required')
  }
  if (!evidence.evidenceId || typeof evidence.evidenceId !== 'string') {
    throw new Error('evidenceId required')
  }
  if (!evidence.kind || typeof evidence.kind !== 'string') {
    throw new Error('evidence kind required')
  }

  const body = {
    evidenceId: evidence.evidenceId,
    kind: evidence.kind,
    source: evidence.source ?? null,
    knownTime: evidence.knownTime ?? null,
    validTime: evidence.validTime ?? null,
    details: clone(evidence.details ?? null),
  }
  return {
    ...body,
    evidenceFingerprint: epistemicFingerprint(body),
  }
}

function dedupeEvidence(evidence = []) {
  const byId = new Map()
  evidence.map(normalizeEvidence).forEach((row) => {
    const prior = byId.get(row.evidenceId)
    if (prior && stableStringify(prior) !== stableStringify(row)) {
      throw new Error('conflicting evidence id: ' + row.evidenceId)
    }
    byId.set(row.evidenceId, row)
  })
  return [...byId.values()].sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId),
  )
}

function normalizeLineage(lineage = {}) {
  return {
    rootMemoryId: lineage.rootMemoryId ?? null,
    parentMemoryId: lineage.parentMemoryId ?? null,
    transitionReceiptIds: [
      ...new Set(lineage.transitionReceiptIds ?? []),
    ],
    sourceMemoryIds: [...new Set(lineage.sourceMemoryIds ?? [])],
    compactedFrom: [...new Set(lineage.compactedFrom ?? [])],
  }
}

export function makeEpistemicEnvelope({
  origin,
  confidence = 0.5,
  evidence = [],
  lineage = {},
  authority = DEFAULT_MEMORY_AUTHORITY,
} = {}) {
  return {
    origin: assertOrigin(origin ?? 'UNKNOWN'),
    confidence: normalizeConfidence(confidence),
    evidence: dedupeEvidence(evidence),
    lineage: normalizeLineage(lineage),
    authority: normalizeAuthority(authority),
  }
}

function memoryBody(memory) {
  const { recordFingerprint: _recordFingerprint, ...body } = memory
  return body
}

function withMemoryFingerprint(memory) {
  const body = memoryBody(memory)
  return {
    ...body,
    recordFingerprint: epistemicFingerprint(body),
  }
}

export function createEpistemicMemory({
  memoryId,
  content,
  origin,
  confidence = 0.5,
  evidence = [],
  lineage = {},
  authority = DEFAULT_MEMORY_AUTHORITY,
  validTime = null,
  knownTime = null,
  tags = [],
} = {}) {
  if (!memoryId || typeof memoryId !== 'string') {
    throw new Error('memoryId required')
  }

  const epistemic = makeEpistemicEnvelope({
    origin,
    confidence,
    evidence,
    lineage: {
      rootMemoryId: lineage.rootMemoryId ?? memoryId,
      parentMemoryId: lineage.parentMemoryId ?? null,
      transitionReceiptIds: lineage.transitionReceiptIds ?? [],
      sourceMemoryIds: lineage.sourceMemoryIds ?? [],
      compactedFrom: lineage.compactedFrom ?? [],
    },
    authority,
  })

  if (
    epistemic.origin === 'OBSERVED' &&
    !epistemic.evidence.some((row) =>
      QUALIFYING_EVIDENCE.OBSERVED.has(row.kind),
    )
  ) {
    throw new Error('OBSERVED memory requires qualifying observation evidence')
  }

  if (
    epistemic.origin === 'VERIFIED' &&
    !epistemic.evidence.some((row) =>
      QUALIFYING_EVIDENCE.VERIFIED.has(row.kind),
    )
  ) {
    throw new Error('VERIFIED memory requires qualifying verification evidence')
  }

  const record = {
    schemaVersion: 'NBG_EPISTEMIC_1',
    memoryId,
    content: clone(content),
    epistemic,
    validTime,
    knownTime,
    tags: [...new Set(tags)].sort(),
  }
  return withMemoryFingerprint(record)
}

export function validateEpistemicMemory(memory, { requireFingerprint = true } = {}) {
  try {
    if (!memory || typeof memory !== 'object') return false
    if (memory.schemaVersion !== 'NBG_EPISTEMIC_1') return false
    if (!memory.memoryId || typeof memory.memoryId !== 'string') return false
    makeEpistemicEnvelope(memory.epistemic)
    if (
      memory.epistemic.origin === 'OBSERVED' &&
      !memory.epistemic.evidence.some((row) =>
        QUALIFYING_EVIDENCE.OBSERVED.has(row.kind),
      )
    ) {
      return false
    }
    if (
      memory.epistemic.origin === 'VERIFIED' &&
      !memory.epistemic.evidence.some((row) =>
        QUALIFYING_EVIDENCE.VERIFIED.has(row.kind),
      )
    ) {
      return false
    }
    if (
      requireFingerprint &&
      memory.recordFingerprint !== epistemicFingerprint(memoryBody(memory))
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export function logicalMemoryRegion(memory) {
  const origin = memory.epistemic.origin
  if (origin === 'DREAMED' || origin === 'SIMULATED') {
    return 'DREAM_POSSIBILITY_BUBBLE'
  }
  if (origin === 'UNKNOWN') return 'PROVENANCE_QUARANTINE'
  if (origin === 'INFERRED') return 'DERIVED_MEMORY'
  return 'REALITY_MEMORY'
}

export function factualStatus(memory) {
  switch (memory.epistemic.origin) {
    case 'VERIFIED':
      return 'VERIFIED'
    case 'OBSERVED':
      return 'OBSERVED'
    case 'INFERRED':
      return 'UNVERIFIED_INFERENCE'
    case 'DREAMED':
    case 'SIMULATED':
      return 'UNVERIFIED_POSSIBILITY'
    default:
      return 'UNKNOWN'
  }
}

export function retrieveMemories(memories, { predicate = () => true } = {}) {
  return memories
    .filter(predicate)
    .map((memory) => ({
      memory: clone(memory),
      origin: memory.epistemic.origin,
      confidence: memory.epistemic.confidence,
      evidence: clone(memory.epistemic.evidence),
      factualStatus: factualStatus(memory),
      logicalRegion: logicalMemoryRegion(memory),
      authority: clone(memory.epistemic.authority),
    }))
}

export function factualRecall(memories, { predicate = () => true } = {}) {
  const matches = memories.filter(predicate)
  const factual = matches.filter((memory) =>
    ['OBSERVED', 'VERIFIED'].includes(memory.epistemic.origin),
  )
  const possibilities = matches.filter((memory) =>
    ['DREAMED', 'SIMULATED', 'INFERRED', 'UNKNOWN'].includes(
      memory.epistemic.origin,
    ),
  )

  if (!factual.length) {
    return {
      status: 'UNKNOWN',
      factualMemories: [],
      knownPossibilities: retrieveMemories(possibilities),
      reason: 'NO_OBSERVATION_OR_VERIFICATION_SUPPORTS_THE_CLAIM',
    }
  }

  return {
    status: 'KNOWN',
    factualMemories: retrieveMemories(factual),
    knownPossibilities: retrieveMemories(possibilities),
    reason: 'FACTUAL_MEMORY_PRESENT',
  }
}

export function appendEvidenceToEnvelope(envelope, evidence) {
  const normalized = makeEpistemicEnvelope(envelope)
  return makeEpistemicEnvelope({
    ...normalized,
    evidence: [...normalized.evidence, normalizeEvidence(evidence)],
  })
}

function rebuildMemory(memory, overrides = {}) {
  const body = {
    ...clone(memoryBody(memory)),
    ...clone(overrides),
  }
  return withMemoryFingerprint(body)
}

export function repeatMemory(memory, count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('repeat count must be a positive integer')
  }
  return Array.from({ length: count }, (_, index) =>
    rebuildMemory(memory, {
      memoryId: memory.memoryId + ':repeat:' + (index + 1),
      epistemic: makeEpistemicEnvelope({
        ...memory.epistemic,
        lineage: {
          ...memory.epistemic.lineage,
          sourceMemoryIds: [
            ...(memory.epistemic.lineage.sourceMemoryIds ?? []),
            memory.memoryId,
          ],
        },
      }),
      repetitionCount: 1,
    }),
  )
}

function compactionKey(memory) {
  return stableStringify({
    content: memory.content,
    origin: memory.epistemic.origin,
    confidence: memory.epistemic.confidence,
    evidence: memory.epistemic.evidence,
    authority: memory.epistemic.authority,
    validTime: memory.validTime,
    knownTime: memory.knownTime,
    tags: memory.tags,
  })
}

export function compactMemories(memories) {
  const groups = new Map()
  memories.forEach((memory) => {
    if (!validateEpistemicMemory(memory)) {
      throw new Error('invalid memory in compaction: ' + (memory?.memoryId ?? 'UNKNOWN'))
    }
    const key = compactionKey(memory)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(memory)
  })

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const base = rows[0]
      const compactedFrom = [
        ...new Set(
          rows.flatMap((row) => [
            row.memoryId,
            ...(row.epistemic.lineage.compactedFrom ?? []),
          ]),
        ),
      ].sort()

      const repetitionCount = rows.reduce(
        (sum, row) => sum + (row.repetitionCount ?? 1),
        0,
      )

      return rebuildMemory(base, {
        memoryId:
          rows.length === 1
            ? base.memoryId
            : 'compact:' + epistemicFingerprint(key),
        repetitionCount,
        epistemic: makeEpistemicEnvelope({
          ...base.epistemic,
          lineage: {
            ...base.epistemic.lineage,
            compactedFrom,
            sourceMemoryIds: [
              ...new Set(
                rows.flatMap((row) => [
                  ...(row.epistemic.lineage.sourceMemoryIds ?? []),
                  row.memoryId,
                ]),
              ),
            ].sort(),
          },
        }),
      })
    })
}

export function mergeMemorySets(...sets) {
  return compactMemories(sets.flat())
}

export function summarizeMemories(memories) {
  const groups = EPISTEMIC_ORIGINS.map((origin) => {
    const rows = memories.filter(
      (memory) => memory.epistemic.origin === origin,
    )
    return {
      origin,
      entries: rows.map((memory) => ({
        memoryId: memory.memoryId,
        content: clone(memory.content),
        confidence: memory.epistemic.confidence,
        evidenceIds: memory.epistemic.evidence.map(
          (row) => row.evidenceId,
        ),
        authority: clone(memory.epistemic.authority),
        factualStatus: factualStatus(memory),
        repetitionCount: memory.repetitionCount ?? 1,
      })),
    }
  }).filter((group) => group.entries.length)

  return {
    summaryMode: 'EPISTEMIC_STRUCTURED_SUMMARY',
    groups,
  }
}

export function decayMemory(memory, factor) {
  const value = Number(factor)
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('decay factor must be in [0, 1]')
  }
  return rebuildMemory(memory, {
    memoryId: memory.memoryId + ':decay:' + value,
    epistemic: makeEpistemicEnvelope({
      ...memory.epistemic,
      confidence: memory.epistemic.confidence * value,
      lineage: {
        ...memory.epistemic.lineage,
        parentMemoryId: memory.memoryId,
        sourceMemoryIds: [
          ...(memory.epistemic.lineage.sourceMemoryIds ?? []),
          memory.memoryId,
        ],
      },
    }),
  })
}

function safeUnknownFrom(raw, index = 0) {
  const memoryId =
    raw?.memoryId && typeof raw.memoryId === 'string'
      ? raw.memoryId + ':provenance-unknown'
      : 'imported-unknown-' + index

  return createEpistemicMemory({
    memoryId,
    content: clone(raw?.content ?? null),
    origin: 'UNKNOWN',
    confidence: 0,
    evidence: [],
    lineage: {
      rootMemoryId: raw?.memoryId ?? memoryId,
      parentMemoryId: raw?.memoryId ?? null,
      sourceMemoryIds: raw?.memoryId ? [raw.memoryId] : [],
    },
    authority: {
      retainable: true,
      reasoningUsable: false,
      actionAuthorized: false,
    },
    validTime: raw?.validTime ?? null,
    knownTime: raw?.knownTime ?? null,
    tags: ['PROVENANCE_FAIL_CLOSED'],
  })
}

export function exportMemoryBundle(
  memories,
  { bundleId = 'NBG_EPISTEMIC_EXPORT', metadata = {} } = {},
) {
  memories.forEach((memory) => {
    if (!validateEpistemicMemory(memory)) {
      throw new Error('cannot export invalid memory: ' + (memory?.memoryId ?? 'UNKNOWN'))
    }
  })

  const payload = {
    schemaVersion: 'NBG_EPISTEMIC_BUNDLE_1',
    bundleId,
    metadata: clone(metadata),
    memories: clone(memories),
  }

  return {
    payload,
    bundleFingerprint: epistemicFingerprint(payload),
  }
}

export function importMemoryBundle(bundle) {
  const rawMemories = bundle?.payload?.memories ?? []
  const bundleValid =
    bundle?.payload?.schemaVersion === 'NBG_EPISTEMIC_BUNDLE_1' &&
    bundle?.bundleFingerprint === epistemicFingerprint(bundle.payload)

  if (!bundleValid) {
    return {
      importStatus: 'PROVENANCE_INVALID',
      memories: rawMemories.map(safeUnknownFrom),
      bundleFingerprint: bundle?.bundleFingerprint ?? null,
    }
  }

  let degraded = false
  const memories = rawMemories.map((memory, index) => {
    if (validateEpistemicMemory(memory)) return clone(memory)
    degraded = true
    return safeUnknownFrom(memory, index)
  })

  return {
    importStatus: degraded ? 'PARTIAL_UNKNOWN' : 'OK',
    memories,
    bundleFingerprint: bundle.bundleFingerprint,
  }
}

export function serializeMemoryStore(memories) {
  return stableStringify(
    exportMemoryBundle(memories, {
      bundleId: 'NBG_EPISTEMIC_RESTART_IMAGE',
    }),
  )
}

export function reloadMemoryStore(serialized) {
  try {
    return importMemoryBundle(JSON.parse(serialized))
  } catch {
    return {
      importStatus: 'PROVENANCE_INVALID',
      memories: [],
      bundleFingerprint: null,
    }
  }
}

export function handoffMemories(
  memories,
  { fromAgent = 'UNKNOWN_AGENT', toAgent = 'UNKNOWN_AGENT' } = {},
) {
  const bundle = exportMemoryBundle(memories, {
    bundleId: 'HANDOFF:' + fromAgent + ':' + toAgent,
    metadata: { fromAgent, toAgent },
  })
  return importMemoryBundle(bundle)
}

function evidenceQualifies(targetOrigin, evidence) {
  if (NON_EVIDENCE_KINDS.has(evidence.kind)) return false
  return Boolean(
    QUALIFYING_EVIDENCE[targetOrigin]?.has(evidence.kind),
  )
}

function transitionReceipt(body) {
  return {
    ...body,
    receiptFingerprint: epistemicFingerprint(body),
  }
}

export function promoteMemory(
  memory,
  {
    targetOrigin,
    evidenceEvent,
    transitionId,
    derivedMemoryId,
    knownTime = null,
  } = {},
) {
  if (!validateEpistemicMemory(memory)) {
    throw new Error('source memory is invalid')
  }
  assertOrigin(targetOrigin)

  if (!PROMOTION_GRAPH[memory.epistemic.origin].has(targetOrigin)) {
    throw new Error(
      'promotion ' + memory.epistemic.origin + ' -> ' + targetOrigin + ' is not allowed',
    )
  }

  const evidence = normalizeEvidence(evidenceEvent)
  if (
    memory.epistemic.evidence.some(
      (row) => row.evidenceId === evidence.evidenceId,
    )
  ) {
    throw new Error('promotion requires new evidence')
  }
  if (!evidenceQualifies(targetOrigin, evidence)) {
    throw new Error(
      'evidence kind ' + evidence.kind + ' does not qualify for ' + targetOrigin,
    )
  }
  if (!transitionId || !derivedMemoryId) {
    throw new Error('transitionId and derivedMemoryId are required')
  }

  const derived = createEpistemicMemory({
    memoryId: derivedMemoryId,
    content: memory.content,
    origin: targetOrigin,
    confidence: memory.epistemic.confidence,
    evidence: [...memory.epistemic.evidence, evidence],
    lineage: {
      rootMemoryId:
        memory.epistemic.lineage.rootMemoryId ?? memory.memoryId,
      parentMemoryId: memory.memoryId,
      transitionReceiptIds: [
        ...memory.epistemic.lineage.transitionReceiptIds,
        transitionId,
      ],
      sourceMemoryIds: [
        ...memory.epistemic.lineage.sourceMemoryIds,
        memory.memoryId,
      ],
    },
    authority: memory.epistemic.authority,
    validTime: memory.validTime,
    knownTime: knownTime ?? memory.knownTime,
    tags: memory.tags,
  })

  const receipt = transitionReceipt({
    receiptType: 'EPISTEMIC_PROMOTION',
    transitionId,
    fromMemoryId: memory.memoryId,
    toMemoryId: derived.memoryId,
    fromOrigin: memory.epistemic.origin,
    toOrigin: targetOrigin,
    evidenceId: evidence.evidenceId,
    evidenceFingerprint: evidence.evidenceFingerprint,
    sourceMemoryFingerprint: memory.recordFingerprint,
    derivedMemoryFingerprint: derived.recordFingerprint,
    knownTime,
    authorityChanged: false,
  })

  return { derived, receipt }
}

export function recordObservationFromPossibility(
  memory,
  {
    observationId,
    observedMemoryId,
    evidenceEvent,
    knownTime = null,
  } = {},
) {
  if (!validateEpistemicMemory(memory)) {
    throw new Error('source memory is invalid')
  }
  const evidence = normalizeEvidence(evidenceEvent)
  if (!evidenceQualifies('OBSERVED', evidence)) {
    throw new Error('observation requires qualifying observation evidence')
  }
  if (!observationId || !observedMemoryId) {
    throw new Error('observationId and observedMemoryId are required')
  }

  const observed = createEpistemicMemory({
    memoryId: observedMemoryId,
    content: memory.content,
    origin: 'OBSERVED',
    confidence: memory.epistemic.confidence,
    evidence: [evidence],
    lineage: {
      rootMemoryId:
        memory.epistemic.lineage.rootMemoryId ?? memory.memoryId,
      parentMemoryId: memory.memoryId,
      transitionReceiptIds: [observationId],
      sourceMemoryIds: [memory.memoryId],
    },
    authority: memory.epistemic.authority,
    validTime: memory.validTime,
    knownTime: knownTime ?? memory.knownTime,
    tags: memory.tags,
  })

  const receipt = transitionReceipt({
    receiptType: 'EPISTEMIC_OBSERVATION_DERIVATION',
    transitionId: observationId,
    fromMemoryId: memory.memoryId,
    toMemoryId: observed.memoryId,
    fromOrigin: memory.epistemic.origin,
    toOrigin: 'OBSERVED',
    evidenceId: evidence.evidenceId,
    evidenceFingerprint: evidence.evidenceFingerprint,
    sourceMemoryFingerprint: memory.recordFingerprint,
    derivedMemoryFingerprint: observed.recordFingerprint,
    knownTime,
    authorityChanged: false,
  })

  return { observed, receipt }
}
