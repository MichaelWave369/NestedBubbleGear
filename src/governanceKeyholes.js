const POLICY_RECORDS = [
  {
    policyVersionId: 'NORMAL@1.0',
    familyId: 'NORMAL_GOVERNANCE',
    revision: 1,
    kind: 'NORMAL',
    validFrom: 1,
    validUntil: 30,
    knownAt: 2,
    priority: 10,
    mode: 'WEIGHTED_THRESHOLD',
    outcome: 'REJECTED',
  },
  {
    policyVersionId: 'EMERGENCY@1.0',
    familyId: 'EMERGENCY_GOVERNANCE',
    revision: 1,
    kind: 'EMERGENCY',
    validFrom: 6,
    validUntil: 12,
    knownAt: 6,
    priority: 100,
    mode: 'WEIGHTED_THRESHOLD',
    outcome: 'REJECTED',
  },
  {
    policyVersionId: 'NORMAL@2.0',
    familyId: 'NORMAL_GOVERNANCE',
    revision: 2,
    kind: 'NORMAL',
    validFrom: 7,
    validUntil: 30,
    knownAt: 8,
    priority: 10,
    mode: 'UNANIMOUS',
    outcome: 'ABSTAIN_CONFLICT',
  },
]

const POLICY_EVENTS = [
  { eventId: 'EV_REGISTER_NORMAL_1', type: 'REGISTER_POLICY', knownTime: 2, validTime: 1, target: 'NORMAL@1.0' },
  { eventId: 'EV_ACTIVATE_EMERGENCY', type: 'ACTIVATE_EMERGENCY', knownTime: 6, validTime: 6, target: 'EMERGENCY@1.0' },
  { eventId: 'EV_REGISTER_EMERGENCY_1', type: 'REGISTER_POLICY', knownTime: 6, validTime: 6, target: 'EMERGENCY@1.0' },
  { eventId: 'EV_REGISTER_NORMAL_2', type: 'REGISTER_POLICY', knownTime: 8, validTime: 7, target: 'NORMAL@2.0' },
  { eventId: 'EV_SUPERSEDE_NORMAL_1', type: 'SUPERSEDE_POLICY', knownTime: 8, validTime: 7, target: 'NORMAL@1.0', replacement: 'NORMAL@2.0' },
  { eventId: 'EV_DEACTIVATE_EMERGENCY', type: 'DEACTIVATE_EMERGENCY', knownTime: 9, validTime: 9, target: 'EMERGENCY@1.0' },
].sort((a, b) => a.knownTime - b.knownTime || a.eventId.localeCompare(b.eventId))

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stable(value[key])
      return out
    }, {})
  }
  return value
}

export function stableStringify(value) {
  return JSON.stringify(stable(value))
}

export function displayFingerprint(value) {
  const text = typeof value === 'string' ? value : stableStringify(value)
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0')
}

function visibleEvents(knownCutoff) {
  return POLICY_EVENTS.filter((event) => event.knownTime <= knownCutoff)
}

function visiblePolicyIds(knownCutoff) {
  return [...new Set(
    visibleEvents(knownCutoff)
      .filter((event) => event.type === 'REGISTER_POLICY')
      .map((event) => event.target),
  )].sort()
}

function emergencyState(policyVersionId, knownCutoff, validTime) {
  let state = 'INACTIVE'
  visibleEvents(knownCutoff).forEach((event) => {
    if (event.target !== policyVersionId || event.validTime > validTime) return
    if (event.type === 'ACTIVATE_EMERGENCY') state = 'ACTIVE'
    if (event.type === 'DEACTIVATE_EMERGENCY') state = 'INACTIVE'
  })
  return state
}

function policyStatus(record, knownCutoff, validTime, registered) {
  if (!registered.includes(record.policyVersionId)) return 'NOT_YET_KNOWN'
  if (validTime < record.validFrom || validTime > record.validUntil) return 'OUT_OF_VALIDITY'
  if (record.kind === 'EMERGENCY') {
    return emergencyState(record.policyVersionId, knownCutoff, validTime)
  }

  const superseded = visibleEvents(knownCutoff).some((event) =>
    event.type === 'SUPERSEDE_POLICY'
    && event.target === record.policyVersionId
    && event.validTime <= validTime
    && registered.includes(event.replacement)
  )
  return superseded ? 'SUPERSEDED' : 'ACTIVE'
}

export function governanceKeyhole(knownCutoff, validTime) {
  const registered = visiblePolicyIds(knownCutoff)
  const statuses = Object.fromEntries(
    POLICY_RECORDS.map((record) => [
      record.policyVersionId,
      policyStatus(record, knownCutoff, validTime, registered),
    ]),
  )
  const active = POLICY_RECORDS.filter((record) => statuses[record.policyVersionId] === 'ACTIVE')
  const emergencies = active.filter((record) => record.kind === 'EMERGENCY')
  const candidates = emergencies.length ? emergencies : active.filter((record) => record.kind === 'NORMAL')
  const selected = [...candidates].sort(
    (a, b) => b.priority - a.priority || b.revision - a.revision || b.policyVersionId.localeCompare(a.policyVersionId),
  )[0] ?? null

  const view = {
    experiment: 'NBG-T11',
    knownCutoff,
    validTime,
    visibleEventIds: visibleEvents(knownCutoff).map((event) => event.eventId),
    visiblePolicyVersionIds: registered,
    policyStatuses: statuses,
    selectedPolicyVersionId: selected?.policyVersionId ?? null,
    selectedPolicyMode: selected?.mode ?? null,
    governanceOutcome: selected?.outcome ?? 'NO_POLICY',
    ledgerHead: displayFingerprint(visibleEvents(knownCutoff)),
  }
  return { ...view, keyholeFingerprint: displayFingerprint(view) }
}

export function compareGovernanceKeyholes(left, right) {
  return {
    left,
    right,
    selectedPolicyChanged: left.selectedPolicyVersionId !== right.selectedPolicyVersionId,
    governanceOutcomeChanged: left.governanceOutcome !== right.governanceOutcome,
    ledgerHeadChanged: left.ledgerHead !== right.ledgerHead,
  }
}

export function governanceTimeline() {
  return POLICY_EVENTS.map((event) => ({ ...event }))
}

export function buildGovernanceExport(left, right) {
  const payload = {
    experiment: 'NBG-T11',
    version: '0.1.0',
    left,
    right,
    comparison: compareGovernanceKeyholes(left, right),
    policyRecords: POLICY_RECORDS.map((row) => ({ ...row })),
    policyEvents: governanceTimeline(),
    truthClaim: 'NONE_POLICY_OUTCOME_IS_OBJECTIVE_TRUTH',
  }
  return { ...payload, exportFingerprint: displayFingerprint(payload) }
}
