import assert from 'node:assert/strict'

import {
  createEpistemicMemory,
  validateEpistemicMemory,
} from '../src/epistemicProvenance.js'
import {
  PHIPIE_BRIDGE_COMPAT,
  PhiPiePhysicalMemoryStore,
  importPhiPiePhysicalMemory,
  inspectPhiPiePhysicalMemory,
} from '../src/phipiePhysicalMemory.js'

const compat = PHIPIE_BRIDGE_COMPAT['phipie-nbg-memory-bridge/v0.1']

function makeMemory({
  memoryId = 'phipie:host-health:episode-test-001',
  origin = 'INFERRED',
  actionAuthorized = false,
  schemaBlobSha = compat.schemaBlobSha,
  stableMeansSafe = false,
  episodeIsFault = false,
  bridgeContract = 'phipie-nbg-memory-bridge/v0.1',
  journalHash = 'a'.repeat(64),
  signal = 'cpu_temp_c',
} = {}) {
  return createEpistemicMemory({
    memoryId,
    content: {
      kind: 'PHIPIE_HOST_HEALTH_EPISODE',
      episode: {
        contract: 'phi-host-memory-envelope/v0.1',
        kind: 'host_health_episode',
        episode_id: memoryId.split(':').at(-1),
        host_identity: {
          board_serial_sha256: 'board-hash',
          machine_id_sha256: 'machine-hash',
        },
        start_sequence: 4,
        end_sequence: 8,
        peak_classification: 'notable',
        signals: [signal],
        new_flags: ['under_voltage_now'],
        close_reason: 'stable_recovery',
        suggested_memory_role: 'evidence',
        authority_effect: 'none',
      },
      producer: {
        system: 'PhiPie',
        bridgeContract,
        nbgSchemaSource: compat.schemaSource,
        nbgSchemaBlobSha: schemaBlobSha,
      },
      semanticBoundary: {
        episodeIsFault,
        stableMeansSafe,
        actionAuthorityGranted: false,
      },
    },
    origin,
    confidence: 0.5,
    evidence: [
      {
        evidenceId: 'phipie:episode-journal:' + journalHash.slice(0, 16),
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
          startSequence: 4,
          endSequence: 8,
        },
        details: {
          episodeId: memoryId.split(':').at(-1),
          sourceRole: 'derived_from_read_only_host_telemetry',
        },
      },
    ],
    authority: {
      retainable: true,
      reasoningUsable: true,
      actionAuthorized,
    },
    validTime: {
      basis: 'phipie_host_sequence',
      startSequence: 4,
      endSequence: 8,
    },
    knownTime: null,
    tags: [
      'evidence',
      'host-health',
      'inferred',
      'phipie',
      'physical-episode',
    ],
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

check('accepts pinned PhiPie physical episode memory', () => {
  const memory = makeMemory()
  assert.equal(validateEpistemicMemory(memory), true)

  const result = importPhiPiePhysicalMemory(memory)
  assert.equal(result.importStatus, 'IMPORTED')
  assert.equal(result.logicalRegion, 'DERIVED_MEMORY')
  assert.equal(result.factualStatus, 'UNVERIFIED_INFERENCE')
  assert.equal(result.actionAuthorized, false)
  assert.deepEqual(result.reasons, [])
})

check('keeps imported physical episodes inferred rather than factual', () => {
  const result = inspectPhiPiePhysicalMemory(makeMemory())
  assert.equal(result.accepted, true)
  assert.equal(result.logicalRegion, 'DERIVED_MEMORY')
  assert.equal(result.factualStatus, 'UNVERIFIED_INFERENCE')
})

check('refuses action-authorized physical memory', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ actionAuthorized: true }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(result.reasons.includes('PHYSICAL_MEMORY_AUTHORITY_MISMATCH'))
})

check('refuses origin laundering from inferred to observed', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ origin: 'OBSERVED' }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(
    result.reasons.includes('PHYSICAL_EPISODE_MUST_REMAIN_INFERRED'),
  )
})

check('refuses unknown PhiPie bridge revisions', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ bridgeContract: 'phipie-nbg-memory-bridge/v9.9' }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(
    result.reasons.includes('UNSUPPORTED_PHIPIE_BRIDGE_CONTRACT'),
  )
})

check('refuses schema blob drift', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ schemaBlobSha: 'b'.repeat(40) }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(result.reasons.includes('NBG_SCHEMA_BLOB_MISMATCH'))
})

check('refuses semantic promotion of stable to safe', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ stableMeansSafe: true }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(result.reasons.includes('SEMANTIC_BOUNDARY_MISMATCH'))
})

check('refuses semantic promotion of episode to fault', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ episodeIsFault: true }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(result.reasons.includes('SEMANTIC_BOUNDARY_MISMATCH'))
})

check('refuses invalid source journal digest shape', () => {
  const result = importPhiPiePhysicalMemory(
    makeMemory({ journalHash: 'not-a-sha256' }),
  )
  assert.equal(result.importStatus, 'REFUSED')
  assert.ok(
    result.reasons.includes('PHIPIE_JOURNAL_OBSERVATION_EVIDENCE_REQUIRED'),
  )
})

check('fails closed on tampered NBG record fingerprint', () => {
  const memory = makeMemory()
  memory.content.episode.signals.push('load_1m')

  const result = importPhiPiePhysicalMemory(memory)
  assert.equal(result.importStatus, 'REFUSED')
  assert.deepEqual(result.reasons, ['INVALID_NBG_EPISTEMIC_MEMORY'])
})

check('store is idempotent for identical memory', () => {
  const store = new PhiPiePhysicalMemoryStore()
  const memory = makeMemory()

  assert.equal(store.ingest(memory).importStatus, 'IMPORTED')
  assert.equal(store.ingest(memory).importStatus, 'DUPLICATE')
  assert.equal(store.all().length, 1)
})

check('store refuses same memory id with a different fingerprint', () => {
  const store = new PhiPiePhysicalMemoryStore()
  const first = makeMemory()
  const second = makeMemory({ signal: 'load_1m' })

  assert.equal(store.ingest(first).importStatus, 'IMPORTED')
  const conflict = store.ingest(second)
  assert.equal(conflict.importStatus, 'CONFLICT')
  assert.deepEqual(conflict.reasons, ['MEMORY_ID_FINGERPRINT_CONFLICT'])
  assert.equal(store.all().length, 1)
})

check('store returns defensive copies', () => {
  const store = new PhiPiePhysicalMemoryStore()
  const memory = makeMemory()
  store.ingest(memory)

  const loaded = store.get(memory.memoryId)
  loaded.content.episode.signals.push('mutated')
  const loadedAgain = store.get(memory.memoryId)

  assert.deepEqual(loadedAgain.content.episode.signals, ['cpu_temp_c'])
})

console.log('All PhiPie physical-memory ingress checks passed.')
