import { epistemicFingerprint } from './epistemicProvenance.js'
import {
  PHIPIE_ADVISOR_CONTRACT,
  createPhysicalExperienceAdvisory,
} from './phipiePhysicalAdvisor.js'

export const PHIBOT_PHYSICAL_HANDOFF_CONTRACT =
  'phibot-physical-experience-handoff/v0.1'

export const PHIBOT_PHYSICAL_RECIPIENT_ROLE =
  'PHIBOT_PHYSICAL_OBSERVER'

const ALLOWED_PURPOSES = Object.freeze([
  'READ_ONLY_EVIDENCE_REVIEW',
  'FORMULATE_OBSERVATION_QUESTIONS',
])

const FORBIDDEN_USES = Object.freeze([
  'HARDWARE_ACTUATION',
  'SAFETY_LIMIT_CHANGE',
  'DIAGNOSIS_AS_FACT',
  'CAUSAL_CLAIM_AS_FACT',
  'MAINTENANCE_AS_REQUIRED_ACTION',
])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function bodyWithoutFingerprint(packet) {
  const { handoffFingerprint: _handoffFingerprint, ...body } = packet
  return body
}

function evidenceIndex(advisory) {
  const memoryIds = new Set()
  const evidenceIds = new Set()

  advisory.prompts.forEach((prompt) => {
    ;(prompt.evidenceMemoryIds ?? []).forEach((value) => memoryIds.add(value))
    ;(prompt.evidenceIds ?? []).forEach((value) => evidenceIds.add(value))
  })

  return {
    memoryIds: [...memoryIds].sort(),
    evidenceIds: [...evidenceIds].sort(),
  }
}

function assertSafeAdvisory(advisory) {
  const boundaries = advisory?.boundaries
  if (!boundaries) {
    throw new Error('advisor boundaries required')
  }

  const expectedFalse = [
    'causalClaim',
    'diagnosticConclusion',
    'safetyConclusion',
    'maintenanceRecommendation',
    'physicalActionRecommendation',
    'actionAuthorized',
  ]

  expectedFalse.forEach((key) => {
    if (boundaries[key] !== false) {
      throw new Error('unsafe advisor boundary: ' + key)
    }
  })

  if (boundaries.hardwareCommand !== null) {
    throw new Error('physical advisor must not contain a hardware command')
  }

  if (
    boundaries.allowedOutput !==
    'READ_ONLY_OBSERVATION_QUESTIONS_AND_EVIDENCE_REVIEW_ONLY'
  ) {
    throw new Error('unsupported physical advisor output class')
  }
}

export function createPhiBotPhysicalHandoff(
  queryMemory,
  memories,
  {
    handoffId = null,
    knownTime = null,
    topK = 5,
    minScore = 0.35,
    maxPrompts = 6,
  } = {},
) {
  const advisory = createPhysicalExperienceAdvisory(
    queryMemory,
    memories,
    { topK, minScore, maxPrompts },
  )
  assertSafeAdvisory(advisory)

  const resolvedHandoffId =
    handoffId ?? 'phibot-physical:' + advisory.queryMemoryId

  if (
    typeof resolvedHandoffId !== 'string' ||
    resolvedHandoffId.length === 0
  ) {
    throw new Error('handoffId must be a non-empty string')
  }

  const body = {
    contract: PHIBOT_PHYSICAL_HANDOFF_CONTRACT,
    handoffId: resolvedHandoffId,
    knownTime,
    producer: {
      system: 'NestedBubbleGear',
      sourceAdvisorContract: PHIPIE_ADVISOR_CONTRACT,
    },
    recipient: {
      role: PHIBOT_PHYSICAL_RECIPIENT_ROLE,
      agentId: null,
    },
    queryMemoryId: advisory.queryMemoryId,
    advisory: clone(advisory),
    evidenceIndex: evidenceIndex(advisory),
    authority: {
      grantsAuthority: false,
      actionAuthorized: false,
      mayInvokeTools: false,
      mayIssueHardwareCommands: false,
      requiresIndependentToolAuthorization: true,
      safetyPlaneUnaffected: true,
    },
    purposes: [...ALLOWED_PURPOSES],
    forbiddenUses: [...FORBIDDEN_USES],
    toolRequests: [],
    physicalCommands: [],
    boundary:
      'HANDOFF_CONVEYS_EVIDENCE_AND_QUESTIONS_NOT_AUTHORITY_OR_COMMANDS',
  }

  return {
    ...body,
    handoffFingerprint: epistemicFingerprint(body),
  }
}

export function validatePhiBotPhysicalHandoff(packet) {
  const errors = []

  if (!packet || typeof packet !== 'object') {
    return ['HANDOFF_OBJECT_REQUIRED']
  }

  if (packet.contract !== PHIBOT_PHYSICAL_HANDOFF_CONTRACT) {
    errors.push('HANDOFF_CONTRACT_MISMATCH')
  }

  if (
    typeof packet.handoffId !== 'string' ||
    packet.handoffId.length === 0
  ) {
    errors.push('HANDOFF_ID_REQUIRED')
  }

  if (packet.producer?.system !== 'NestedBubbleGear') {
    errors.push('HANDOFF_PRODUCER_MISMATCH')
  }

  if (
    packet.producer?.sourceAdvisorContract !== PHIPIE_ADVISOR_CONTRACT
  ) {
    errors.push('ADVISOR_CONTRACT_MISMATCH')
  }

  if (
    packet.recipient?.role !== PHIBOT_PHYSICAL_RECIPIENT_ROLE
  ) {
    errors.push('RECIPIENT_ROLE_MISMATCH')
  }

  const authority = packet.authority
  if (
    authority?.grantsAuthority !== false ||
    authority?.actionAuthorized !== false ||
    authority?.mayInvokeTools !== false ||
    authority?.mayIssueHardwareCommands !== false ||
    authority?.requiresIndependentToolAuthorization !== true ||
    authority?.safetyPlaneUnaffected !== true
  ) {
    errors.push('HANDOFF_AUTHORITY_BOUNDARY_MISMATCH')
  }

  if (
    !Array.isArray(packet.toolRequests) ||
    packet.toolRequests.length !== 0
  ) {
    errors.push('TOOL_REQUESTS_MUST_BE_EMPTY')
  }

  if (
    !Array.isArray(packet.physicalCommands) ||
    packet.physicalCommands.length !== 0
  ) {
    errors.push('PHYSICAL_COMMANDS_MUST_BE_EMPTY')
  }

  if (
    JSON.stringify(packet.purposes) !== JSON.stringify(ALLOWED_PURPOSES)
  ) {
    errors.push('HANDOFF_PURPOSES_MISMATCH')
  }

  if (
    JSON.stringify(packet.forbiddenUses) !== JSON.stringify(FORBIDDEN_USES)
  ) {
    errors.push('FORBIDDEN_USES_MISMATCH')
  }

  try {
    assertSafeAdvisory(packet.advisory)
  } catch {
    errors.push('UNSAFE_ADVISORY_PAYLOAD')
  }

  if (packet.queryMemoryId !== packet.advisory?.queryMemoryId) {
    errors.push('QUERY_MEMORY_ID_MISMATCH')
  }

  const expectedEvidence = packet.advisory
    ? evidenceIndex(packet.advisory)
    : { memoryIds: [], evidenceIds: [] }

  if (
    JSON.stringify(packet.evidenceIndex) !==
    JSON.stringify(expectedEvidence)
  ) {
    errors.push('EVIDENCE_INDEX_MISMATCH')
  }

  const fingerprint = packet.handoffFingerprint
  const expectedFingerprint = epistemicFingerprint(
    bodyWithoutFingerprint(packet),
  )
  if (fingerprint !== expectedFingerprint) {
    errors.push('HANDOFF_FINGERPRINT_MISMATCH')
  }

  return errors
}

export function receivePhiBotPhysicalHandoff(packet) {
  const errors = validatePhiBotPhysicalHandoff(packet)
  if (errors.length) {
    return {
      receiveStatus: 'REFUSED',
      errors,
      handoff: null,
      authorityGranted: false,
    }
  }

  return {
    receiveStatus: 'ACCEPTED_ADVISORY_ONLY',
    errors: [],
    handoff: clone(packet),
    authorityGranted: false,
  }
}
