import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { createEpistemicMemory } from '../src/epistemicProvenance.js'
import { PHIPIE_BRIDGE_COMPAT } from '../src/phipiePhysicalMemory.js'
import {
  createPhiBotPhysicalHandoff,
  receivePhiBotPhysicalHandoff,
  validatePhiBotPhysicalHandoff,
} from '../src/phibotPhysicalHandoff.js'

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

check('creates a valid advisory-only PhiBot handoff', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
  })
  const prior = makeMemory({
    id: 'prior',
    signals: ['cpu_temp_c', 'load_1m'],
    flags: ['under_voltage_now'],
  })

  const packet = createPhiBotPhysicalHandoff(query, [prior], {
    handoffId: 'handoff-test-001',
    knownTime: { basis: 'test', sequence: 1 },
  })

  assert.deepEqual(validatePhiBotPhysicalHandoff(packet), [])
  assert.equal(packet.handoffId, 'handoff-test-001')
  assert.equal(packet.recipient.role, 'PHIBOT_PHYSICAL_OBSERVER')
  assert.equal(packet.authority.grantsAuthority, false)
  assert.equal(packet.authority.actionAuthorized, false)
  assert.equal(packet.authority.mayInvokeTools, false)
  assert.equal(packet.authority.mayIssueHardwareCommands, false)
  assert.equal(packet.authority.requiresIndependentToolAuthorization, true)
  assert.deepEqual(packet.toolRequests, [])
  assert.deepEqual(packet.physicalCommands, [])
})

check('handoff contains evidence index for advisor prompts', () => {
  const query = makeMemory({
    id: 'query',
    signals: ['cpu_temp_c'],
  })
  const prior = makeMemory({
    id: 'prior',
    signals: ['cpu_temp_c'],
  })

  const packet = createPhiBotPhysicalHandoff(query, [prior])
  assert.ok(packet.evidenceIndex.memoryIds.includes(prior.memoryId))
  assert.ok(packet.evidenceIndex.evidenceIds.length >= 1)
})

check('receiver accepts valid packet only as advisory', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  const result = receivePhiBotPhysicalHandoff(packet)
  assert.equal(result.receiveStatus, 'ACCEPTED_ADVISORY_ONLY')
  assert.equal(result.authorityGranted, false)
  assert.deepEqual(result.errors, [])
})

check('fingerprint detects payload tampering', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  packet.advisory.uncertainty.push('INVENTED')
  const errors = validatePhiBotPhysicalHandoff(packet)

  assert.ok(errors.includes('HANDOFF_FINGERPRINT_MISMATCH'))
})

check('receiver refuses authority escalation', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  packet.authority.actionAuthorized = true
  const result = receivePhiBotPhysicalHandoff(packet)

  assert.equal(result.receiveStatus, 'REFUSED')
  assert.equal(result.authorityGranted, false)
  assert.ok(result.errors.includes('HANDOFF_AUTHORITY_BOUNDARY_MISMATCH'))
})

check('receiver refuses tool request injection', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  packet.toolRequests.push({ tool: 'gpio.write', value: 1 })
  const result = receivePhiBotPhysicalHandoff(packet)

  assert.equal(result.receiveStatus, 'REFUSED')
  assert.ok(result.errors.includes('TOOL_REQUESTS_MUST_BE_EMPTY'))
})

check('receiver refuses physical command injection', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  packet.physicalCommands.push('relay.on')
  const result = receivePhiBotPhysicalHandoff(packet)

  assert.equal(result.receiveStatus, 'REFUSED')
  assert.ok(result.errors.includes('PHYSICAL_COMMANDS_MUST_BE_EMPTY'))
})

check('receiver refuses advisor boundary escalation', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })
  const packet = createPhiBotPhysicalHandoff(query, [prior])

  packet.advisory.boundaries.maintenanceRecommendation = true
  const result = receivePhiBotPhysicalHandoff(packet)

  assert.equal(result.receiveStatus, 'REFUSED')
  assert.ok(result.errors.includes('UNSAFE_ADVISORY_PAYLOAD'))
})

check('handoff remains deterministic for identical inputs', () => {
  const query = makeMemory({ id: 'query' })
  const prior = makeMemory({ id: 'prior' })

  const first = createPhiBotPhysicalHandoff(query, [prior], {
    handoffId: 'same-id',
  })
  const second = createPhiBotPhysicalHandoff(query, [prior], {
    handoffId: 'same-id',
  })

  assert.deepEqual(first, second)
})

console.log('All PhiBot physical-handoff checks passed.')
