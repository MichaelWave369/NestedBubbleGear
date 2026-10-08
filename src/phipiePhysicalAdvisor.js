import { explainPhysicalRecall } from './phipiePhysicalExplanation.js'

export const PHIPIE_ADVISOR_CONTRACT = 'phipie-physical-experience-advisor/v0.1'

const SIGNAL_GUIDANCE = Object.freeze({
  cpu_temp_c: Object.freeze({
    question: 'Is the temperature drift still present under a comparable observed workload?',
    observation:
      'Collect another read-only CPU-temperature observation and preserve the workload context if available.',
    boundary:
      'Operating-system temperature telemetry is not a calibrated thermal-safety measurement.',
  }),
  load_1m: Object.freeze({
    question: 'Did the recalled episodes and the current episode share a similar load pattern?',
    observation:
      'Collect or review read-only load telemetry around the episode boundary.',
    boundary:
      'Load correlation does not establish that workload caused the physical episode.',
  }),
  memory_available_ratio: Object.freeze({
    question: 'Was reduced available memory present near the same episode stage?',
    observation:
      'Collect or review read-only memory-availability telemetry around the episode.',
    boundary:
      'Memory pressure similarity is not a hardware-fault diagnosis.',
  }),
  core_voltage_v: Object.freeze({
    question: 'Did software-reported voltage observations move in the same direction across episodes?',
    observation:
      'Review another read-only software voltage observation if available.',
    boundary:
      'Software-reported voltage is not electrical qualification and should not be treated as a safety measurement.',
  }),
  carrier_up_count: Object.freeze({
    question: 'Did network carrier state change near the same episode stage?',
    observation:
      'Review read-only interface carrier and operstate history.',
    boundary:
      'Network-state similarity does not establish a physical root cause.',
  }),
})

const FLAG_GUIDANCE = Object.freeze({
  under_voltage_now: Object.freeze({
    question: 'Is the under-voltage flag still present in current read-only telemetry?',
    observation:
      'Collect another read-only throttling-status observation before drawing a conclusion.',
    boundary:
      'A firmware under-voltage flag is evidence to inspect, not a certified diagnosis of the power source.',
  }),
  frequency_capped_now: Object.freeze({
    question: 'Is frequency capping still present in the current observation?',
    observation:
      'Collect another read-only throttling-status observation and compare episode context.',
    boundary:
      'Frequency capping can have multiple explanations and is not a root-cause claim.',
  }),
  throttled_now: Object.freeze({
    question: 'Is throttling still present in current read-only telemetry?',
    observation:
      'Collect another read-only throttling-status observation and compare it with temperature and load evidence.',
    boundary:
      'Throttling similarity is not proof of a shared cause.',
  }),
  soft_temperature_limit_now: Object.freeze({
    question: 'Is the soft-temperature-limit flag still present?',
    observation:
      'Collect another read-only thermal and throttling observation.',
    boundary:
      'The flag is an operating-system/firmware observation, not an independent safety interlock.',
  }),
})

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function guidanceForSignal(signal) {
  return (
    SIGNAL_GUIDANCE[signal] ?? {
      question:
        'Does the signal ' + signal + ' recur in comparable physical episodes?',
      observation:
        'Collect more read-only evidence for ' + signal + ' before interpreting the pattern.',
      boundary:
        'Repeated structural similarity for this signal does not establish cause, diagnosis, or required action.',
    }
  )
}

function guidanceForFlag(flag) {
  return (
    FLAG_GUIDANCE[flag] ?? {
      question:
        'Does the observed flag ' + flag + ' recur in comparable episodes?',
      observation:
        'Collect more read-only evidence for flag ' + flag + ' before interpreting the pattern.',
      boundary:
        'A repeated flag is evidence for review, not proof of a shared physical cause.',
    }
  )
}

function aggregateSharedFeatures(explanation) {
  const signalRows = new Map()
  const flagRows = new Map()

  explanation.matches.forEach((match) => {
    const signalReason = match.reasons.find(
      (row) => row.kind === 'SHARED_SIGNALS',
    )
    const flagReason = match.reasons.find(
      (row) => row.kind === 'SHARED_FLAGS',
    )

    ;(signalReason?.values ?? []).forEach((signal) => {
      if (!signalRows.has(signal)) {
        signalRows.set(signal, {
          subject: signal,
          kind: 'SIGNAL',
          scores: [],
          memoryIds: [],
          evidenceIds: [],
        })
      }
      const row = signalRows.get(signal)
      row.scores.push(match.similarityScore)
      row.memoryIds.push(match.candidateMemoryId)
      row.evidenceIds.push(...match.evidence.candidateEvidenceIds)
    })

    ;(flagReason?.values ?? []).forEach((flag) => {
      if (!flagRows.has(flag)) {
        flagRows.set(flag, {
          subject: flag,
          kind: 'FLAG',
          scores: [],
          memoryIds: [],
          evidenceIds: [],
        })
      }
      const row = flagRows.get(flag)
      row.scores.push(match.similarityScore)
      row.memoryIds.push(match.candidateMemoryId)
      row.evidenceIds.push(...match.evidence.candidateEvidenceIds)
    })
  })

  return [...signalRows.values(), ...flagRows.values()]
}

function advisoryPrompt(row) {
  const guide =
    row.kind === 'SIGNAL'
      ? guidanceForSignal(row.subject)
      : guidanceForFlag(row.subject)

  return {
    kind: row.kind,
    subject: row.subject,
    supportCount: row.memoryIds.length,
    meanSimilarity: average(row.scores),
    question: guide.question,
    readOnlyObservationSuggestion: guide.observation,
    evidenceMemoryIds: [...new Set(row.memoryIds)].sort(),
    evidenceIds: [...new Set(row.evidenceIds)].sort(),
    boundary: guide.boundary,
  }
}

function uncertaintyFor(explanation, prompts) {
  const notes = []

  if (explanation.matches.length === 0) {
    notes.push('INSUFFICIENT_SIMILAR_HISTORY')
  } else if (explanation.matches.length === 1) {
    notes.push('SPARSE_HISTORY_ONE_MATCH')
  }

  if (prompts.length === 0) {
    notes.push('NO_SHARED_SIGNAL_OR_FLAG_EVIDENCE')
  }

  if (explanation.refused.length) {
    notes.push('SOME_CANDIDATE_MEMORIES_REFUSED')
  }

  return notes
}

export function createPhysicalExperienceAdvisory(
  queryMemory,
  memories,
  {
    topK = 5,
    minScore = 0.35,
    maxPrompts = 6,
  } = {},
) {
  if (!Number.isInteger(maxPrompts) || maxPrompts < 1) {
    throw new Error('maxPrompts must be a positive integer')
  }

  const explanation = explainPhysicalRecall(queryMemory, memories, {
    topK,
    minScore,
    sameHostOnly: true,
    includeSelf: false,
  })

  const prompts = aggregateSharedFeatures(explanation)
    .map(advisoryPrompt)
    .sort(
      (a, b) =>
        b.supportCount - a.supportCount ||
        b.meanSimilarity - a.meanSimilarity ||
        a.kind.localeCompare(b.kind) ||
        a.subject.localeCompare(b.subject),
    )
    .slice(0, maxPrompts)

  return {
    contract: PHIPIE_ADVISOR_CONTRACT,
    queryMemoryId: explanation.queryMemoryId,
    historyMatchCount: explanation.matches.length,
    prompts,
    uncertainty: uncertaintyFor(explanation, prompts),
    refused: explanation.refused,
    boundaries: {
      causalClaim: false,
      diagnosticConclusion: false,
      safetyConclusion: false,
      maintenanceRecommendation: false,
      physicalActionRecommendation: false,
      actionAuthorized: false,
      hardwareCommand: null,
      allowedOutput:
        'READ_ONLY_OBSERVATION_QUESTIONS_AND_EVIDENCE_REVIEW_ONLY',
    },
  }
}
