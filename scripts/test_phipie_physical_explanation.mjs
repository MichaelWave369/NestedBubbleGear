import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { createEpistemicMemory } from '../src/epistemicProvenance.js'
import { PHIPIE_BRIDGE_COMPAT } from '../src/phipiePhysicalMemory.js'
import {
  explainPhysicalEpisodeMatch,
  explainPhysicalRecall,
} from '../src/phipiePhysicalExplanation.js'

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

check('explains shared structural evidence and contrasts', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
    peak: 'notable',
    start: 1,
    end: 5,
  })
  const candidate = makeMemory({
    id: 'candidate',
    signals: ['cpu_temp_c', 'memory_available_ratio'],
    flags: ['under_voltage_now'],
    peak: 'notable',
    start: 20,
    end: 23,
  })

  const result = explainPhysicalEpisodeMatch(query, candidate)

  assert.deepEqual(
    result.reasons.find((row) => row.kind === 'SHARED_SIGNALS').values,
    ['cpu_temp_c'],
  )
  assert.deepEqual(
    result.reasons.find((row) => row.kind === 'SHARED_FLAGS').values,
    ['under_voltage_now'],
  )
  assert.deepEqual(result.contrasts.queryOnlySignals, ['load_1m'])
  assert.deepEqual(
    result.contrasts.candidateOnlySignals,
    ['memory_available_ratio'],
  )
})

check('links explanation back to both record fingerprints and evidence ids', () => {
  const query = makeMemory({ id: 'query' })
  const candidate = makeMemory({ id: 'candidate' })
  const result = explainPhysicalEpisodeMatch(query, candidate)

  assert.equal(
    result.evidence.queryRecordFingerprint,
    query.recordFingerprint,
  )
  assert.equal(
    result.evidence.candidateRecordFingerprint,
    candidate.recordFingerprint,
  )
  assert.deepEqual(
    result.evidence.queryEvidenceIds,
    query.epistemic.evidence.map((row) => row.evidenceId),
  )
  assert.deepEqual(
    result.evidence.candidateEvidenceIds,
    candidate.epistemic.evidence.map((row) => row.evidenceId),
  )
})

check('reports what happened afterward without turning it into prescription', () => {
  const query = makeMemory({ id: 'query' })
  const candidate = makeMemory({
    id: 'candidate',
    peak: 'notable',
    closeReason: 'stable_recovery',
    start: 10,
    end: 15,
  })

  const result = explainPhysicalEpisodeMatch(query, candidate)
  assert.deepEqual(result.priorEpisodeOutcome, {
    peakClassification: 'notable',
    closeReason: 'stable_recovery',
    duration: 6,
  })
  assert.equal(result.boundaries.maintenanceRecommendation, false)
  assert.equal(result.boundaries.diagnosticConclusion, false)
  assert.equal(result.boundaries.causalClaim, false)
  assert.equal(result.boundaries.actionAuthorized, false)
})

check('explanation text is deterministic under repeated calls', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['load_1m', 'cpu_temp_c'],
  })
  const candidate = makeMemory({
    id: 'candidate',
    signals: ['cpu_temp_c', 'load_1m'],
  })

  const first = explainPhysicalEpisodeMatch(query, candidate)
  const second = explainPhysicalEpisodeMatch(query, candidate)
  assert.deepEqual(first, second)
})

check('recall explanation preserves recall ordering', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    peak: 'notable',
  })
  const close = makeMemory({
    id: 'close',
    signals: ['cpu_temp_c', 'load_1m'],
    peak: 'notable',
  })
  const weaker = makeMemory({
    id: 'weaker',
    signals: ['memory_available_ratio'],
    peak: 'watch',
  })

  const result = explainPhysicalRecall(query, [weaker, close])
  assert.deepEqual(
    result.matches.map((row) => row.candidateMemoryId),
    [close.memoryId, weaker.memoryId],
  )
  assert.equal(result.boundaries.causalClaim, false)
  assert.equal(result.boundaries.actionAuthorized, false)
})

check('tampered memories are refused upstream and never explained', () => {
  const query = makeMemory({ id: 'query' })
  const tampered = makeMemory({ id: 'tampered' })
  tampered.content.episode.signals.push('invented_signal')

  const result = explainPhysicalRecall(query, [tampered])
  assert.equal(result.matches.length, 0)
  assert.equal(result.refused.length, 1)
  assert.equal(result.refused[0].memoryId, tampered.memoryId)
})

check('cross-host memory remains excluded by default', () => {
  const query = makeMemory({ id: 'query', host: 'host-a' })
  const other = makeMemory({ id: 'other', host: 'host-b' })

  const result = explainPhysicalRecall(query, [other])
  assert.equal(result.matches.length, 0)
})

console.log('All PhiPie physical-explanation checks passed.')
