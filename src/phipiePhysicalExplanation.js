import {
  comparePhysicalEpisodes,
  physicalEpisodeFeatures,
  recallSimilarPhysicalEpisodes,
} from './phipiePhysicalRecall.js'

export const PHIPIE_EXPLANATION_CONTRACT =
  'phipie-physical-explanation/v0.1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function intersection(left = [], right = []) {
  const rightSet = new Set(right)
  return [...new Set(left)].filter((value) => rightSet.has(value)).sort()
}

function difference(left = [], right = []) {
  const rightSet = new Set(right)
  return [...new Set(left)].filter((value) => !rightSet.has(value)).sort()
}

function evidenceIds(memory) {
  return (memory?.epistemic?.evidence ?? [])
    .map((row) => row?.evidenceId)
    .filter((value) => typeof value === 'string' && value.length)
    .sort()
}

function explainPeak(queryPeak, candidatePeak) {
  if (queryPeak == null || candidatePeak == null) {
    return {
      relation: 'UNAVAILABLE',
      statement: 'Peak classification could not be compared.',
    }
  }
  if (queryPeak === candidatePeak) {
    return {
      relation: 'SAME',
      statement: `Both episodes reached peak classification ${queryPeak}.`,
    }
  }
  return {
    relation: 'DIFFERENT',
    statement:
      `The query peaked at ${queryPeak}; the recalled episode peaked at ${candidatePeak}.`,
  }
}

function explainCloseReason(queryReason, candidateReason) {
  if (queryReason == null || candidateReason == null) {
    return {
      relation: 'UNAVAILABLE',
      statement: 'Close reason could not be compared.',
    }
  }
  if (queryReason === candidateReason) {
    return {
      relation: 'SAME',
      statement: `Both episodes closed with ${queryReason}.`,
    }
  }
  return {
    relation: 'DIFFERENT',
    statement:
      `The query closed with ${queryReason}; the recalled episode closed with ${candidateReason}.`,
  }
}

function durationStatement(queryDuration, candidateDuration) {
  if (queryDuration == null || candidateDuration == null) {
    return 'Episode duration could not be compared.'
  }
  if (queryDuration === candidateDuration) {
    return `Both episodes span ${queryDuration} PhiPie sequence observations.`
  }
  return (
    `The query spans ${queryDuration} sequence observations; ` +
    `the recalled episode spans ${candidateDuration}.`
  )
}

export function explainPhysicalEpisodeMatch(
  queryMemory,
  candidateMemory,
) {
  const query = physicalEpisodeFeatures(queryMemory)
  const candidate = physicalEpisodeFeatures(candidateMemory)
  const comparison = comparePhysicalEpisodes(queryMemory, candidateMemory)

  const sharedSignals = intersection(query.signals, candidate.signals)
  const queryOnlySignals = difference(query.signals, candidate.signals)
  const candidateOnlySignals = difference(candidate.signals, query.signals)

  const sharedFlags = intersection(query.flags, candidate.flags)
  const queryOnlyFlags = difference(query.flags, candidate.flags)
  const candidateOnlyFlags = difference(candidate.flags, query.flags)

  const peak = explainPeak(
    query.peakClassification,
    candidate.peakClassification,
  )
  const closeReason = explainCloseReason(
    query.closeReason,
    candidate.closeReason,
  )

  const reasons = []

  if (sharedSignals.length) {
    reasons.push({
      kind: 'SHARED_SIGNALS',
      values: sharedSignals,
      statement:
        'Both episodes include changed signals: ' +
        sharedSignals.join(', ') +
        '.',
    })
  }

  if (sharedFlags.length) {
    reasons.push({
      kind: 'SHARED_FLAGS',
      values: sharedFlags,
      statement:
        'Both episodes include newly observed flags: ' +
        sharedFlags.join(', ') +
        '.',
    })
  }

  if (comparison.channels.peak !== null) {
    reasons.push({
      kind: 'PEAK_CLASSIFICATION',
      score: comparison.channels.peak,
      ...peak,
    })
  }

  if (comparison.channels.closeReason !== null) {
    reasons.push({
      kind: 'CLOSE_REASON',
      score: comparison.channels.closeReason,
      ...closeReason,
    })
  }

  if (comparison.channels.duration !== null) {
    reasons.push({
      kind: 'DURATION',
      score: comparison.channels.duration,
      statement: durationStatement(query.duration, candidate.duration),
    })
  }

  return {
    contract: PHIPIE_EXPLANATION_CONTRACT,
    queryMemoryId: query.memoryId,
    candidateMemoryId: candidate.memoryId,
    similarityScore: comparison.score,
    sameHost: comparison.sameHost,
    reasons,
    contrasts: {
      queryOnlySignals,
      candidateOnlySignals,
      queryOnlyFlags,
      candidateOnlyFlags,
    },
    priorEpisodeOutcome: {
      peakClassification: candidate.peakClassification,
      closeReason: candidate.closeReason,
      duration: candidate.duration,
    },
    evidence: {
      queryRecordFingerprint: query.recordFingerprint,
      candidateRecordFingerprint: candidate.recordFingerprint,
      queryEvidenceIds: evidenceIds(queryMemory),
      candidateEvidenceIds: evidenceIds(candidateMemory),
    },
    boundaries: {
      causalClaim: false,
      diagnosticConclusion: false,
      maintenanceRecommendation: false,
      actionAuthorized: false,
      explanationMode: 'EVIDENCE_LINKED_STRUCTURAL_COMPARISON',
    },
  }
}

export function explainPhysicalRecall(
  queryMemory,
  memories,
  options = {},
) {
  const recall = recallSimilarPhysicalEpisodes(
    queryMemory,
    memories,
    options,
  )

  return {
    contract: PHIPIE_EXPLANATION_CONTRACT,
    queryMemoryId: recall.queryMemoryId,
    matches: recall.matches.map((match) =>
      explainPhysicalEpisodeMatch(queryMemory, match.memory),
    ),
    refused: clone(recall.refused),
    boundaries: {
      causalClaim: false,
      diagnosticConclusion: false,
      maintenanceRecommendation: false,
      actionAuthorized: false,
      summary:
        'Similar historical structure is evidence for comparison, not proof of cause, diagnosis, safety, or required action.',
    },
  }
}
