import { inspectPhiPiePhysicalMemory } from './phipiePhysicalMemory.js'

export const PHIPIE_RECALL_CONTRACT = 'phipie-physical-recall/v0.1'

const WEIGHTS = Object.freeze({
  signals: 0.4,
  flags: 0.2,
  peak: 0.15,
  closeReason: 0.1,
  duration: 0.15,
})

const PEAK_LEVEL = Object.freeze({
  stable: 0,
  watch: 1,
  notable: 2,
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function asSortedSet(values = []) {
  return [...new Set((values ?? []).map(String))].sort()
}

function jaccard(a, b) {
  const left = new Set(a)
  const right = new Set(b)
  const union = new Set([...left, ...right])
  if (union.size === 0) return null

  let intersection = 0
  left.forEach((value) => {
    if (right.has(value)) intersection += 1
  })
  return intersection / union.size
}

function peakSimilarity(a, b) {
  if (!(a in PEAK_LEVEL) || !(b in PEAK_LEVEL)) return null
  const distance = Math.abs(PEAK_LEVEL[a] - PEAK_LEVEL[b])
  if (distance === 0) return 1
  if (distance === 1) return 0.5
  return 0
}

function durationOf(episode) {
  const start = Number(episode?.start_sequence)
  const end = Number(episode?.end_sequence)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null
  }
  return end - start + 1
}

function durationSimilarity(a, b) {
  const left = durationOf(a)
  const right = durationOf(b)
  if (left === null || right === null) return null
  if (left === 0 && right === 0) return 1
  const high = Math.max(left, right)
  if (high === 0) return null
  return Math.min(left, right) / high
}

function sameHost(a, b) {
  const left = a?.host_identity ?? {}
  const right = b?.host_identity ?? {}

  const comparableKeys = [
    'board_serial_sha256',
    'machine_id_sha256',
  ].filter((key) => left[key] != null && right[key] != null)

  if (comparableKeys.length === 0) return null
  return comparableKeys.every((key) => left[key] === right[key])
}

export function physicalEpisodeFeatures(memory) {
  const inspection = inspectPhiPiePhysicalMemory(memory)
  if (!inspection.accepted) {
    throw new Error(
      'invalid PhiPie physical memory: ' + inspection.reasons.join(','),
    )
  }

  const episode = memory.content.episode
  return {
    memoryId: memory.memoryId,
    hostIdentity: clone(episode.host_identity ?? {}),
    signals: asSortedSet(episode.signals),
    flags: asSortedSet(episode.new_flags),
    peakClassification: episode.peak_classification ?? null,
    closeReason: episode.close_reason ?? null,
    duration: durationOf(episode),
    recordFingerprint: memory.recordFingerprint,
  }
}

export function comparePhysicalEpisodes(queryMemory, candidateMemory) {
  const query = physicalEpisodeFeatures(queryMemory)
  const candidate = physicalEpisodeFeatures(candidateMemory)

  const channels = {
    signals: jaccard(query.signals, candidate.signals),
    flags: jaccard(query.flags, candidate.flags),
    peak: peakSimilarity(
      query.peakClassification,
      candidate.peakClassification,
    ),
    closeReason:
      query.closeReason == null || candidate.closeReason == null
        ? null
        : query.closeReason === candidate.closeReason
          ? 1
          : 0,
    duration: durationSimilarity(
      queryMemory.content.episode,
      candidateMemory.content.episode,
    ),
  }

  let weighted = 0
  let weightTotal = 0
  Object.entries(channels).forEach(([name, value]) => {
    if (value === null) return
    weighted += value * WEIGHTS[name]
    weightTotal += WEIGHTS[name]
  })

  const score = weightTotal === 0 ? 0 : weighted / weightTotal

  return {
    contract: PHIPIE_RECALL_CONTRACT,
    queryMemoryId: query.memoryId,
    candidateMemoryId: candidate.memoryId,
    score,
    channels,
    sameHost: sameHost(queryMemory.content.episode, candidateMemory.content.episode),
    causalClaim: false,
    actionAuthorized: false,
    interpretation: 'STRUCTURAL_EPISODE_SIMILARITY_ONLY',
  }
}

export function recallSimilarPhysicalEpisodes(
  queryMemory,
  memories,
  {
    topK = 5,
    minScore = 0,
    sameHostOnly = true,
    includeSelf = false,
  } = {},
) {
  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error('topK must be a positive integer')
  }
  if (
    typeof minScore !== 'number' ||
    !Number.isFinite(minScore) ||
    minScore < 0 ||
    minScore > 1
  ) {
    throw new Error('minScore must be in [0, 1]')
  }

  physicalEpisodeFeatures(queryMemory)

  const matches = []
  const refused = []

  for (const candidate of memories) {
    const inspection = inspectPhiPiePhysicalMemory(candidate)
    if (!inspection.accepted) {
      refused.push({
        memoryId: candidate?.memoryId ?? null,
        reasons: inspection.reasons,
      })
      continue
    }

    if (!includeSelf && candidate.memoryId === queryMemory.memoryId) {
      continue
    }

    const comparison = comparePhysicalEpisodes(queryMemory, candidate)
    if (sameHostOnly && comparison.sameHost !== true) {
      continue
    }
    if (comparison.score < minScore) {
      continue
    }

    matches.push({
      ...comparison,
      memory: clone(candidate),
    })
  }

  matches.sort(
    (a, b) =>
      b.score - a.score ||
      a.candidateMemoryId.localeCompare(b.candidateMemoryId),
  )

  return {
    contract: PHIPIE_RECALL_CONTRACT,
    queryMemoryId: queryMemory.memoryId,
    sameHostOnly,
    minScore,
    topK,
    matches: matches.slice(0, topK),
    refused,
    causalClaim: false,
    actionAuthorized: false,
    boundary: 'SIMILAR_HISTORY_IS_NOT_CAUSAL_PROOF',
  }
}
