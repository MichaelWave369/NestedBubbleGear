import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { createEpistemicMemory } from '../src/epistemicProvenance.js'
import { PHIPIE_BRIDGE_COMPAT } from '../src/phipiePhysicalMemory.js'
import { createPhysicalExperienceAdvisory } from '../src/phipiePhysicalAdvisor.js'

const compat = PHIPIE_BRIDGE_COMPAT['phipie-nbg-memory-bridge/v0.1']

function makeMemory({
  id,
  host = 'host-a',
  signals = ['cpu_temp_c'],
  flags = [],
  peak = 'watch',
  closeReason = 'stable_recovery',
  start = 1,
  end = 4,
} = {}) {
  const memoryId = 'phipie:host-health:' + id
  const journalHash = createHash('sha256').update(id).digest('hex')

  return createEpistemicMemory({
    memoryId,
    content: {
      kind: 'PHIPIE_HOST_HEALTH_EPISODE',
      episode: {
        contract: 'phi-host-memory-envelope/v0.1',
        kind: 'host_health_episode',
        episode_id: id,
        host_identity: {
          board_serial_sha256: host,
          machine_id_sha256: host + '-machine',
        },
        start_sequence: start,
        end_sequence: end,
        peak_classification: peak,
        signals,
        new_flags: flags,
        close_reason: closeReason,
        suggested_memory_role: 'evidence',
        authority_effect: 'none',
      },
      producer: {
        system: 'PhiPie',
        bridgeContract: 'phipie-nbg-memory-bridge/v0.1',
        nbgSchemaSource: compat.schemaSource,
        nbgSchemaBlobSha: compat.schemaBlobSha,
      },
      semanticBoundary: {
        episodeIsFault: false,
        stableMeansSafe: false,
        actionAuthorityGranted: false,
      },
    },
    origin: 'INFERRED',
    confidence: 0.5,
    evidence: [
      {
        evidenceId: 'evidence-' + journalHash.slice(0, 16),
        kind: 'OBSERVATION',
        source: {
          system: 'PhiPie',
          journalContract: 'phi-host-health-journal/v0.1',
          episodeContract: 'phi-host-health-episode/v0.1',
          journalRecordHash: journalHash,
        },
        knownTime: null,
        validTime: {
          basis: 'phipie_host_sequence',
          startSequence: start,
          endSequence: end,
        },
        details: {
          episodeId: id,
          sourceRole: 'derived_from_read_only_host_telemetry',
        },
      },
    ],
    authority: {
      retainable: true,
      reasoningUsable: true,
      actionAuthorized: false,
    },
    validTime: {
      basis: 'phipie_host_sequence',
      startSequence: start,
      endSequence: end,
    },
    knownTime: null,
    tags: ['evidence', 'host-health', 'inferred', 'phipie', 'physical-episode'],
  })
}

function check(name, fn) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

check('advisor produces read-only observation prompts from shared evidence', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
    peak: 'notable',
  })
  const prior = makeMemory({
    id: 'prior',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
    peak: 'notable',
  })

  const result = createPhysicalExperienceAdvisory(query, [prior])

  assert.equal(result.historyMatchCount, 1)
  assert.ok(result.prompts.some((row) => row.subject === 'cpu_temp_c'))
  assert.ok(result.prompts.some((row) => row.subject === 'load_1m'))
  assert.ok(result.prompts.some((row) => row.subject === 'under_voltage_now'))
  result.prompts.forEach((row) => {
    assert.equal(typeof row.question, 'string')
    assert.equal(typeof row.readOnlyObservationSuggestion, 'string')
    assert.ok(row.evidenceMemoryIds.includes(prior.memoryId))
    assert.ok(row.evidenceIds.length >= 1)
  })
})

check('advisor never grants diagnosis maintenance safety or action authority', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const result = createPhysicalExperienceAdvisory(query, [prior])

  assert.deepEqual(result.boundaries, {
    causalClaim: false,
    diagnosticConclusion: false,
    safetyConclusion: false,
    maintenanceRecommendation: false,
    physicalActionRecommendation: false,
    actionAuthorized: false,
    hardwareCommand: null,
    allowedOutput:
      'READ_ONLY_OBSERVATION_QUESTIONS_AND_EVIDENCE_REVIEW_ONLY',
  })
})

check('advisor is same-host only', () => {
  const query = makeMemory({ id: 'query', host: 'host-a' })
  const other = makeMemory({ id: 'other', host: 'host-b' })

  const result = createPhysicalExperienceAdvisory(query, [other])
  assert.equal(result.historyMatchCount, 0)
  assert.ok(result.uncertainty.includes('INSUFFICIENT_SIMILAR_HISTORY'))
})

check('advisor reports sparse history when only one match exists', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const result = createPhysicalExperienceAdvisory(query, [prior])

  assert.ok(result.uncertainty.includes('SPARSE_HISTORY_ONE_MATCH'))
})

check('shared evidence across more episodes ranks first', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
  })
  const a = makeMemory({
    id: 'a',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
  })
  const b = makeMemory({
    id: 'b',
    signals: ['cpu_temp_c'],
    flags: ['under_voltage_now'],
  })

  const result = createPhysicalExperienceAdvisory(query, [a, b], {
    minScore: 0,
  })

  assert.equal(result.prompts[0].supportCount, 2)
  assert.ok(
    ['cpu_temp_c', 'under_voltage_now'].includes(result.prompts[0].subject),
  )
})

check('unknown signals get conservative generic observation guidance', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['custom_sensor_delta'],
  })
  const prior = makeMemory({
    id: 'prior',
    signals: ['custom_sensor_delta'],
  })

  const result = createPhysicalExperienceAdvisory(query, [prior])
  const prompt = result.prompts.find(
    (row) => row.subject === 'custom_sensor_delta',
  )
  assert.ok(prompt)
  assert.match(prompt.readOnlyObservationSuggestion, /read-only evidence/)
  assert.match(prompt.boundary, /does not establish cause/)
})

check('tampered candidate is refused upstream', () => {
  const query = makeMemory({ id: 'query' })
  const bad = makeMemory({ id: 'bad' })
  bad.content.episode.signals.push('invented')

  const result = createPhysicalExperienceAdvisory(query, [bad], {
    minScore: 0,
  })
  assert.equal(result.historyMatchCount, 0)
  assert.equal(result.refused.length, 1)
  assert.ok(result.uncertainty.includes('SOME_CANDIDATE_MEMORIES_REFUSED'))
})

check('maxPrompts is validated and enforced', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m', 'memory_available_ratio'],
    flags: ['under_voltage_now'],
  })
  const prior = makeMemory({
    id: 'prior',
    signals: ['cpu_temp_c', 'load_1m', 'memory_available_ratio'],
    flags: ['under_voltage_now'],
  })

  const result = createPhysicalExperienceAdvisory(query, [prior], {
    maxPrompts: 2,
    minScore: 0,
  })
  assert.equal(result.prompts.length, 2)

  assert.throws(
    () => createPhysicalExperienceAdvisory(query, [prior], { maxPrompts: 0 }),
    /positive integer/,
  )
})

console.log('All PhiPie physical-advisor checks passed.')
