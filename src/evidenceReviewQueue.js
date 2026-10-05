export const T8_SOURCE_STATUS = 'ALLEGED'

export const T8_CAPTURES = [
  {
    captureId: 'CAP_SUPPORT_V1',
    retrievalStatus: 'CAPTURED',
    stance: 'SUPPORT',
    independenceGroup: 'EXT_G1',
    locator: 'https://archive.example/document-1',
    retrievedAt: 5,
    contentSha256: '64fa564ed44a69a78316c3eca32cf0f2973a7f90eca65be90b8cd50e540e24db',
    drift: false,
  },
  {
    captureId: 'CAP_SUPPORT_V2',
    retrievalStatus: 'CAPTURED',
    stance: 'SUPPORT',
    independenceGroup: 'EXT_G1',
    locator: 'https://archive.example/document-1',
    retrievedAt: 7,
    contentSha256: 'bda112195d8a3e8d39fd44b49a4b99d5c1ee1f4faafd0d567518e1fa37cd6418',
    drift: true,
  },
  {
    captureId: 'CAP_OPPOSE',
    retrievalStatus: 'CAPTURED',
    stance: 'OPPOSE',
    independenceGroup: 'EXT_G2',
    locator: 'https://register.example/document-9',
    retrievedAt: 8,
    contentSha256: '322e1c9754dbbb6d520c436c6e88ea1eb2d5e8956ed70d9fa7522d412961d7c0',
    drift: false,
  },
  {
    captureId: 'CAP_AMBIGUOUS',
    retrievalStatus: 'AMBIGUOUS',
    stance: 'UNKNOWN',
    independenceGroup: 'EXT_G2',
    locator: 'https://register.example/empty',
    retrievedAt: 5,
    contentSha256: null,
    drift: false,
  },
  {
    captureId: 'CAP_FAILED',
    retrievalStatus: 'FAILED',
    stance: 'UNKNOWN',
    independenceGroup: 'EXT_G1',
    locator: 'https://archive.example/missing',
    retrievedAt: 5,
    contentSha256: null,
    drift: false,
  },
]

export const T8_FROZEN_DECISIONS = {
  CAP_SUPPORT_V1: 'ACCEPT',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function queueRows(decisions = T8_FROZEN_DECISIONS) {
  return T8_CAPTURES.map((capture) => {
    let queueState = decisions[capture.captureId] ?? 'PENDING'
    if (capture.retrievalStatus !== 'CAPTURED') queueState = 'BLOCKED'
    return { ...clone(capture), queueState }
  })
}

export function applyQueueDecision(decisions, captureId, decision) {
  const capture = T8_CAPTURES.find((row) => row.captureId === captureId)
  if (!capture) throw new Error('Unknown capture')
  if (capture.retrievalStatus !== 'CAPTURED') {
    throw new Error('Only CAPTURED receipts may be reviewed')
  }
  if (!['ACCEPT', 'REJECT'].includes(decision)) {
    throw new Error('Unsupported decision')
  }
  return { ...decisions, [captureId]: decision }
}

export function deriveQueueStatus(decisions = T8_FROZEN_DECISIONS) {
  const rows = queueRows(decisions)
  const accepted = rows.filter((row) => row.queueState === 'ACCEPT')
  const support = [...new Set(
    accepted.filter((row) => row.stance === 'SUPPORT').map((row) => row.independenceGroup),
  )].sort()
  const oppose = [...new Set(
    accepted.filter((row) => row.stance === 'OPPOSE').map((row) => row.independenceGroup),
  )].sort()

  let reviewStatus = T8_SOURCE_STATUS
  if (support.length && oppose.length) reviewStatus = 'DISPUTED'
  else if (support.length) reviewStatus = 'CORROBORATED'
  else if (oppose.length) reviewStatus = 'DISPUTED'

  return {
    sourceStatus: T8_SOURCE_STATUS,
    reviewStatus,
    supportGroups: support,
    opposeGroups: oppose,
    acceptedCaptureIds: accepted.map((row) => row.captureId).sort(),
  }
}

export function buildQueueExport(decisions = T8_FROZEN_DECISIONS) {
  return {
    experiment: 'NBG-T8',
    version: '0.1.0',
    mode: 'REVIEW_QUEUE_EXPORT',
    sourceStatus: T8_SOURCE_STATUS,
    captures: clone(T8_CAPTURES),
    decisions: clone(decisions),
    derived: deriveQueueStatus(decisions),
  }
}
