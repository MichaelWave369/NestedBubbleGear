import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { createEpistemicMemory } from '../src/epistemicProvenance.js'
import {
  comparePhysicalEpisodes,
  physicalEpisodeFeatures,
  recallSimilarPhysicalEpisodes,
} from '../src/phipiePhysicalRecall.js'
import { PHIPIE_BRIDGE_COMPAT } from '../src/phipiePhysicalMemory.js'

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

check('extracts deterministic structural episode features', () => {
  const memory = makeMemory({
    id: 'episode-a',
    signals: ['load_1m', 'cpu_temp_c', 'cpu_temp_c'],
    flags: ['under_voltage_now', 'under_voltage_now'],
  })
  const features = physicalEpisodeFeatures(memory)
  assert.deepEqual(features.signals, ['cpu_temp_c', 'load_1m'])
  assert.deepEqual(features.flags, ['under_voltage_now'])
  assert.equal(features.duration, 4)
})

check('structurally identical episodes score one without causal claims', () => {
  const left = makeMemory({ id: 'episode-a' })
  const right = makeMemory({ id: 'episode-b' })
  const result = comparePhysicalEpisodes(left, right)

  assert.equal(result.score, 1)
  assert.equal(result.causalClaim, false)
  assert.equal(result.actionAuthorized, false)
  assert.equal(result.interpretation, 'STRUCTURAL_EPISODE_SIMILARITY_ONLY')
})

check('same-host recall ranks closer structure ahead of weaker match', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
    peak: 'notable',
    start: 1,
    end: 5,
  })
  const close = makeMemory({
    id: 'close',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
    peak: 'notable',
    start: 20,
    end: 24,
  })
  const weak = makeMemory({
    id: 'weak',
    signals: ['memory_available_ratio'],
    flags: [],
    peak: 'watch',
    closeReason: 'identity_mismatch',
    start: 30,
    end: 40,
  })

  const result = recallSimilarPhysicalEpisodes(query, [weak, close])
  assert.equal(result.matches.length, 2)
  assert.equal(result.matches[0].candidateMemoryId, close.memoryId)
  assert.ok(result.matches[0].score > result.matches[1].score)
  assert.equal(result.causalClaim, false)
  assert.equal(result.actionAuthorized, false)
  assert.equal(result.boundary, 'SIMILAR_HISTORY_IS_NOT_CAUSAL_PROOF')
})

check('default recall excludes other hosts', () => {
  const query = makeMemory({ id: 'query' })
  const same = makeMemory({ id: 'same' })
  const other = makeMemory({ id: 'other', host: 'host-b' })

  const result = recallSimilarPhysicalEpisodes(query, [same, other])
  assert.deepEqual(
    result.matches.map((row) => row.candidateMemoryId),
    [same.memoryId],
  )
})

check('cross-host recall requires explicit opt-in', () => {
  const query = makeMemory({ id: 'query' })
  const other = makeMemory({ id: 'other', host: 'host-b' })

  const result = recallSimilarPhysicalEpisodes(query, [other], {
    sameHostOnly: false,
  })
  assert.equal(result.matches.length, 1)
  assert.equal(result.matches[0].sameHost, false)
})

check('self match is excluded by default', () => {
  const query = makeMemory({ id: 'query' })
  const result = recallSimilarPhysicalEpisodes(query, [query])
  assert.equal(result.matches.length, 0)
})

check('ranking is deterministic under candidate reordering', () => {
  const query = makeMemory({ id: 'query' })
  const a = makeMemory({ id: 'episode-a' })
  const b = makeMemory({ id: 'episode-b' })

  const first = recallSimilarPhysicalEpisodes(query, [b, a])
  const second = recallSimilarPhysicalEpisodes(query, [a, b])

  assert.deepEqual(
    first.matches.map((row) => row.candidateMemoryId),
    second.matches.map((row) => row.candidateMemoryId),
  )
  assert.deepEqual(
    first.matches.map((row) => row.candidateMemoryId),
    [a.memoryId, b.memoryId],
  )
})

check('tampered candidate is refused rather than ranked', () => {
  const query = makeMemory({ id: 'query' })
  const bad = makeMemory({ id: 'bad' })
  bad.content.episode.signals.push('tampered')

  const result = recallSimilarPhysicalEpisodes(query, [bad])
  assert.equal(result.matches.length, 0)
  assert.equal(result.refused.length, 1)
  assert.equal(result.refused[0].memoryId, bad.memoryId)
})

check('topK and minScore are bounded inputs', () => {
  const query = makeMemory({ id: 'query' })
  assert.throws(
    () => recallSimilarPhysicalEpisodes(query, [], { topK: 0 }),
    /positive integer/,
  )
  assert.throws(
    () => recallSimilarPhysicalEpisodes(query, [], { minScore: 2 }),
    /\[0, 1\]/,
  )
})

console.log('All PhiPie physical-recall checks passed.')
