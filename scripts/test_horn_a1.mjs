import assert from 'node:assert/strict';
import {
  HORN_A1_PROTOCOL, hornAreaBetween, hornLayer, hornPrefix,
  makeHornState, observeHorn, probeHorn, buildHornA1Receipt,
} from '../src/hornA1.js';

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) < tolerance, actual + ' != ' + expected);

// Separate log-coordinate Simpson quadrature checks the closed-form area.
function numericArea(a, b, steps = 2048) {
  const from = Math.log(a), to = Math.log(b);
  const h = (to - from) / steps;
  const integrand = u => Math.sqrt(1 + Math.exp(-4 * u));
  let total = integrand(from) + integrand(to);
  for (let i = 1; i < steps; i++)
    total += (i % 2 ? 4 : 2) * integrand(from + i * h);
  return 2 * Math.PI * total * h / 3;
}

const tests = [
  ['H1: exact finite-volume formula and partition', () => {
    close(hornLayer(1).volume, Math.PI / 2);
    for (const count of [1, 2, 4, 8, 16, 128]) {
      const prefix = hornPrefix(count);
      close(prefix.volume + prefix.remainingVolume, Math.PI);
      let layers = 0;
      for (let i = 1; i <= count; i++) layers += hornLayer(i).volume;
      close(layers, prefix.volume);
    }
  }],
  ['H1: volume rises to pi while unfilled volume shrinks', () => {
    const sequence = [1, 2, 4, 8, 16, 128].map(hornPrefix);
    assert.ok(sequence.every(row => row.volume < Math.PI && row.remainingVolume > 0));
    for (let i = 1; i < sequence.length; i++) {
      assert.ok(sequence[i].volume > sequence[i - 1].volume);
      assert.ok(sequence[i].remainingVolume < sequence[i - 1].remainingVolume);
    }
  }],
  ['H2: closed-form lateral area matches independent quadrature', () => {
    for (const [a, b] of [[1,2], [2,3], [3,4], [1,5], [1,129]]) {
      close(hornAreaBetween(a, b), numericArea(a, b), 1e-8);
    }
    close(hornAreaBetween(1, 3), hornLayer(1).lateralArea + hornLayer(2).lateralArea);
  }],
  ['H2: divergent lower bound and valid upper bound for each finite cutoff', () => {
    for (const n of [1, 2, 4, 16, 128, 1024]) {
      const {lateralArea, areaLowerBound, areaUpperBound} = hornPrefix(n);
      assert.ok(lateralArea >= areaLowerBound - 1e-10);
      assert.ok(lateralArea <= areaUpperBound + 1e-10);
    }
    assert.ok(hornPrefix(1024).lateralArea > hornPrefix(128).lateralArea);
    assert.ok(hornPrefix(128).lateralArea > hornPrefix(16).lateralArea);
  }],
  ['H3: identical coarse observations but distinct refined interface order', () => {
    const a = makeHornState([1, -1]);
    const b = makeHornState([-1, 1]);
    assert.deepEqual(observeHorn(a, 'K0'), observeHorn(b, 'K0'));
    assert.notDeepEqual(observeHorn(a, 'K1'), observeHorn(b, 'K1'));
    assert.equal(observeHorn(a, 'K0').netLabel, 0);
    assert.equal(observeHorn(a, 'K0').readout, null);
  }],
  ['H3: stipulated area-weighted future probe distinguishes coarse twins', () => {
    const a = makeHornState([1, -1]);
    const b = makeHornState([-1, 1]);
    const ra = observeHorn(probeHorn(a), 'K0');
    const rb = observeHorn(probeHorn(b), 'K0');
    close(ra.readout, hornLayer(1).lateralArea - hornLayer(2).lateralArea);
    close(ra.readout, -rb.readout);
    assert.ok(ra.readout > 0 && rb.readout < 0);
    assert.notDeepEqual(ra, rb);
    assert.equal(a.readout, null); // no mutation of witness input
  }],
  ['H3 negative: uniform coupling erases positional advantage', () => {
    const a = makeHornState([1, -1]);
    const b = makeHornState([-1, 1]);
    assert.deepEqual(observeHorn(probeHorn(a, 'UNIFORM')), observeHorn(probeHorn(b, 'UNIFORM')));
    assert.equal(probeHorn(a, 'UNIFORM').readout, 0);
  }],
  ['H3 negative: disabled coupling yields no measured residue', () => {
    const a = makeHornState([1, -1]);
    const b = makeHornState([-1, 1]);
    assert.deepEqual(observeHorn(probeHorn(a, 'DISABLED')), observeHorn(probeHorn(b, 'DISABLED')));
    assert.equal(probeHorn(b, 'DISABLED').readout, 0);
  }],
  ['H4: K1 already reveals what K0 misses before intervention', () => {
    const a = makeHornState([1, -1]);
    const b = makeHornState([-1, 1]);
    assert.deepEqual(observeHorn(a).volume, observeHorn(b).volume);
    assert.deepEqual(observeHorn(probeHorn(a), 'K1').interfaceLabels, [1, -1]);
    assert.deepEqual(observeHorn(probeHorn(b), 'K1').interfaceLabels, [-1, 1]);
  }],
  ['negative: invalid endpoints, states, observations and probes fail closed', () => {
    for (const n of [0, -1, 2.5, Infinity, NaN, 100001]) assert.throws(() => hornPrefix(n), RangeError);
    for (const [a, b] of [[0,2], [2,2], [3,2], [1,Infinity], [1,100002]])
      assert.throws(() => hornAreaBetween(a, b), RangeError);
    for (const labels of [[1], [0,-1], [true,false], [1,1,1]])
      assert.throws(() => makeHornState(labels), RangeError);
    assert.throws(() => probeHorn(makeHornState(), 'FAKE'), RangeError);
    assert.throws(() => observeHorn(makeHornState(), 'K99'), RangeError);
    assert.throws(() => probeHorn({...makeHornState(), secret:1}), TypeError);
    assert.throws(() => observeHorn({labels:[1,-1], readout:NaN}), RangeError);
  }],
  ['deterministic provenance receipt and explicit claim boundary', () => {
    assert.equal(HORN_A1_PROTOCOL.id, 'NBG-HORN-A1');
    assert.equal(HORN_A1_PROTOCOL.origin, 'SIMULATED');
    assert.equal(HORN_A1_PROTOCOL.authority, 'NONE');
    const receipt = buildHornA1Receipt();
    assert.deepEqual(receipt, buildHornA1Receipt());
    assert.equal(receipt.origin, 'SIMULATED');
    assert.equal(receipt.authority, 'NONE');
    assert.equal(receipt.geometry.length, 6);
    assert.notDeepEqual(receipt.twoSectionWitness.K0AfterAreaProbe[0], receipt.twoSectionWitness.K0AfterAreaProbe[1]);
    assert.deepEqual(receipt.twoSectionWitness.K0AfterUniformControl[0], receipt.twoSectionWitness.K0AfterUniformControl[1]);
  }],
];

let passed = 0;
for (const [name, test] of tests) {
  test();
  console.log('PASS ' + name);
  passed++;
}
console.log('NBG-HORN-A1 ' + passed + '/' + tests.length + ' PASS · formal mathematics / SIMULATED toy coupling only');
