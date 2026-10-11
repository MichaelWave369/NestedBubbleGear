import assert from 'node:assert/strict'
import {
  BSR_VERSION, totalEnergy, simulateBodyShip,
  compareToNull, buildBodyShipReceipt,
} from '../src/bodyShipResonance.js'

const checks = []
const check = (name, fn) => { fn(); checks.push(name); console.log('PASS', name) }

const options = { coupling: 0.24, detuning: 0.16 }
const candidate = simulateBodyShip(options)
const nullControl = simulateBodyShip({ ...options, coupling: 0 })

check('same initial state and sample grid', () => {
  assert.equal(candidate.samples.length, 151)
  assert.equal(candidate.samples.length, nullControl.samples.length)
  assert.deepEqual(candidate.samples[0].q, nullControl.samples[0].q)
  assert.deepEqual(candidate.samples[0].v, nullControl.samples[0].v)
  assert.equal(candidate.samples[0].time, 0)
  assert.equal(candidate.samples.at(-1).time, 12)
})

check('uncoupled negative control agrees exactly with itself', () => {
  assert.equal(compareToNull(nullControl, nullControl), 0)
  assert.deepEqual(nullControl, simulateBodyShip({ coupling: 0, detuning: 0.16 }))
})

check('coupling changes displacement relative to zero-coupling control', () => {
  const difference = compareToNull(candidate, nullControl)
  assert.ok(difference > 0.01 && Number.isFinite(difference), String(difference))
})

check('candidate and negative-control numerical energy drift are bounded', () => {
  assert.ok(candidate.maxRelativeEnergyDrift < 0.001, String(candidate.maxRelativeEnergyDrift))
  assert.ok(nullControl.maxRelativeEnergyDrift < 0.001, String(nullControl.maxRelativeEnergyDrift))
  assert.ok(candidate.initialEnergy > 0 && nullControl.initialEnergy > 0)
})

check('kinetic plus on-site plus links equals declared total energy', () => {
  assert.equal(totalEnergy([1, 0, -1], [0, 0, 0], [1, 1, 1], 0.5), 2.5)
  assert.equal(totalEnergy([0, 0, 0], [1, 0, 0], [1, 1, 1], 0), 0.5)
})

check('turning points are recorded with nonzero system energy', () => {
  assert.ok(candidate.turns.length >= 3)
  assert.ok(candidate.turns.every(turn => turn.totalSystemEnergy > 0))
  assert.ok(candidate.turns.some(turn => turn.oscillator === 1))
})

check('presentation rotation does not alter physics fields', () => {
  const straight = buildBodyShipReceipt(candidate, nullControl, false)
  const rotated = buildBodyShipReceipt(candidate, nullControl, true)
  assert.equal(straight.protocol, BSR_VERSION)
  assert.equal(straight.provenance, 'SIMULATED')
  assert.deepEqual(straight.parameters, rotated.parameters)
  assert.deepEqual(straight.outcomes, rotated.outcomes)
  assert.equal(straight.presentation.altersPhysics, false)
  assert.equal(rotated.presentation.rotated90Degrees, true)
})

check('parameter bounds prevent invalid numerical inputs', () => {
  const bounded = simulateBodyShip({ coupling: Infinity, detuning: -9 })
  assert.equal(bounded.settings.coupling, 0.24)
  assert.equal(bounded.settings.detuning, 0)
  assert.deepEqual(bounded.omega, [1, 1, 1])
})

check('time grid mismatch is rejected', () => {
  assert.throws(() => compareToNull(candidate,
    { samples: nullControl.samples.slice(1) }), /same time grid/)
})

console.log(`BSR-1: ${checks.length}/${checks.length} synthetic checks PASS; no biological or metaphysical inference.`)
