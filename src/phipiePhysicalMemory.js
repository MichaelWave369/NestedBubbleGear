import {
  factualStatus,
  logicalMemoryRegion,
  validateEpistemicMemory,
} from './epistemicProvenance.js'

export const PHIPIE_PHYSICAL_MEMORY_KIND = 'PHIPIE_HOST_HEALTH_EPISODE'

export const PHIPIE_BRIDGE_COMPAT = Object.freeze({
  'phipie-nbg-memory-bridge/v0.1': Object.freeze({
    schemaVersion: 'NBG_EPISTEMIC_1',
    schemaSource:
      'MichaelWave369/NestedBubbleGear:schemas/epistemic-memory.schema.json',
    schemaBlobSha: '56d39e4c9823ce4186affb5ea3a0df8783675121',
  }),
})

const EXPECTED_AUTHORITY = Object.freeze({
  retainable: true,
  reasoningUsable: true,
  actionAuthorized: false,
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function sameAuthority(authority) {
  return (
    authority?.retainable === EXPECTED_AUTHORITY.retainable &&
    authority?.reasoningUsable === EXPECTED_AUTHORITY.reasoningUsable &&
    authority?.actionAuthorized === EXPECTED_AUTHORITY.actionAuthorized
  )
}

function validSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)
}

function findPhiPieObservationEvidence(memory) {
  return (memory?.epistemic?.evidence ?? []).find(
    (row) =>
      row?.kind === 'OBSERVATION' &&
      row?.source?.system === 'PhiPie' &&
      row?.source?.journalContract === 'phi-host-health-journal/v0.1' &&
      row?.source?.episodeContract === 'phi-host-health-episode/v0.1' &&
      validSha256(row?.source?.journalRecordHash),
  )
}

export function inspectPhiPiePhysicalMemory(memory) {
  const reasons = []

  if (!validateEpistemicMemory(memory)) {
    reasons.push('INVALID_NBG_EPISTEMIC_MEMORY')
    return {
      accepted: false,
      reasons,
      logicalRegion: null,
      factualStatus: null,
    }
  }

  if (!memory.memoryId.startsWith('phipie:host-health:')) {
    reasons.push('UNSUPPORTED_MEMORY_ID_NAMESPACE')
  }

  if (memory.epistemic.origin !== 'INFERRED') {
    reasons.push('PHYSICAL_EPISODE_MUST_REMAIN_INFERRED')
  }

  if (!sameAuthority(memory.epistemic.authority)) {
    reasons.push('PHYSICAL_MEMORY_AUTHORITY_MISMATCH')
  }

  if (memory.content?.kind !== PHIPIE_PHYSICAL_MEMORY_KIND) {
    reasons.push('UNSUPPORTED_PHYSICAL_MEMORY_KIND')
  }

  const producer = memory.content?.producer
  if (producer?.system !== 'PhiPie') {
    reasons.push('UNSUPPORTED_PRODUCER')
  }

  const compat = PHIPIE_BRIDGE_COMPAT[producer?.bridgeContract]
  if (!compat) {
    reasons.push('UNSUPPORTED_PHIPIE_BRIDGE_CONTRACT')
  } else {
    if (memory.schemaVersion !== compat.schemaVersion) {
      reasons.push('NBG_SCHEMA_VERSION_MISMATCH')
    }
    if (producer?.nbgSchemaSource !== compat.schemaSource) {
      reasons.push('NBG_SCHEMA_SOURCE_MISMATCH')
    }
    if (producer?.nbgSchemaBlobSha !== compat.schemaBlobSha) {
      reasons.push('NBG_SCHEMA_BLOB_MISMATCH')
    }
  }

  const boundary = memory.content?.semanticBoundary
  if (
    boundary?.episodeIsFault !== false ||
    boundary?.stableMeansSafe !== false ||
    boundary?.actionAuthorityGranted !== false
  ) {
    reasons.push('SEMANTIC_BOUNDARY_MISMATCH')
  }

  const episode = memory.content?.episode
  if (episode?.kind !== 'host_health_episode') {
    reasons.push('UNSUPPORTED_EPISODE_KIND')
  }
  if (episode?.suggested_memory_role !== 'evidence') {
    reasons.push('UNSUPPORTED_MEMORY_ROLE')
  }
  if (episode?.authority_effect !== 'none') {
    reasons.push('EPISODE_AUTHORITY_EFFECT_MUST_BE_NONE')
  }

  if (!findPhiPieObservationEvidence(memory)) {
    reasons.push('PHIPIE_JOURNAL_OBSERVATION_EVIDENCE_REQUIRED')
  }

  const region = logicalMemoryRegion(memory)
  const status = factualStatus(memory)
  if (region !== 'DERIVED_MEMORY') {
    reasons.push('PHYSICAL_EPISODE_MUST_ROUTE_TO_DERIVED_MEMORY')
  }
  if (status !== 'UNVERIFIED_INFERENCE') {
    reasons.push('PHYSICAL_EPISODE_FACTUAL_STATUS_MISMATCH')
  }

  return {
    accepted: reasons.length === 0,
    reasons,
    logicalRegion: region,
    factualStatus: status,
  }
}

export function importPhiPiePhysicalMemory(memory) {
  const inspection = inspectPhiPiePhysicalMemory(memory)
  if (!inspection.accepted) {
    return {
      importStatus: 'REFUSED',
      reasons: inspection.reasons,
      memory: null,
      logicalRegion: inspection.logicalRegion,
      factualStatus: inspection.factualStatus,
      actionAuthorized: false,
    }
  }

  return {
    importStatus: 'IMPORTED',
    reasons: [],
    memory: clone(memory),
    logicalRegion: inspection.logicalRegion,
    factualStatus: inspection.factualStatus,
    actionAuthorized: false,
  }
}

export class PhiPiePhysicalMemoryStore {
  constructor() {
    this.byId = new Map()
  }

  ingest(memory) {
    const result = importPhiPiePhysicalMemory(memory)
    if (result.importStatus !== 'IMPORTED') return result

    const existing = this.byId.get(memory.memoryId)
    if (existing) {
      if (existing.recordFingerprint === memory.recordFingerprint) {
        return {
          ...result,
          importStatus: 'DUPLICATE',
          memory: clone(existing),
        }
      }
      return {
        importStatus: 'CONFLICT',
        reasons: ['MEMORY_ID_FINGERPRINT_CONFLICT'],
        memory: null,
        logicalRegion: result.logicalRegion,
        factualStatus: result.factualStatus,
        actionAuthorized: false,
      }
    }

    this.byId.set(memory.memoryId, clone(memory))
    return result
  }

  all() {
    return [...this.byId.values()]
      .sort((a, b) => a.memoryId.localeCompare(b.memoryId))
      .map(clone)
  }

  get(memoryId) {
    const memory = this.byId.get(memoryId)
    return memory ? clone(memory) : null
  }
}
