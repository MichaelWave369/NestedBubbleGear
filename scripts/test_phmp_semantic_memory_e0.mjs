/** E0 experiment, synthetic records only. Never touches any PHMP reserved split. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { rank, scoreClaims, complexAndRealAgreement, validateRecord, verifyReceipt } from './phmp_semantic_memory_e0.mjs';

const claim = (subject, polarity = 1) => ({ subject, predicate: 'passes', object: 'acceptance', polarity });
const record = (id, subject, polarity, options = {}) => ({
  id, scope: options.scope ?? 'lab', sourceId: options.sourceId ?? `synthetic-${id}`,
  claim: claim(subject, polarity), origin: options.origin ?? 'VERIFIED', authority: 'NONE',
  validFrom: options.validFrom ?? '2026-01-01', validTo: options.validTo ?? null,
});
const query = (subject, polarity, options = {}) => ({
  scope: options.scope ?? 'lab', asOf: options.asOf ?? '2026-02-01', claim: claim(subject, polarity),
});

// Every query has two equal-magnitude candidates; fixed lexical ID tie-breaking
// deliberately disadvantages the plain unsigned baseline for negated cases.
const records = Array.from({ length: 12 }, (_, i) =>
  [record(`c${i.toString().padStart(2, '0')}-a`, `project-${i}`, 1),
   record(`c${i.toString().padStart(2, '0')}-b`, `project-${i}`, -1)]).flat();
let checks = 0;
for (const r of records) { validateRecord(r); checks++; }
const scores = Object.fromEntries(['plain', 'signed-real', 'phase'].map(m => [m, { correct: 0, total: 0 }]));
for (let i = 0; i < 12; i++) for (const sign of [1, -1]) {
  const q = query(`project-${i}`, sign);
  for (const mode of Object.keys(scores)) {
    const result = rank(records, q, { mode, topK: 1 });
    assert.equal(result.status, 'CONFLICT');
    assert(verifyReceipt(result));
    const expected = `c${i.toString().padStart(2, '0')}-${sign === 1 ? 'a' : 'b'}`;
    scores[mode].correct += Number(result.results[0].id === expected);
    scores[mode].total++; checks += 2;
  }
}
assert.equal(scores.phase.correct, scores.phase.total, 'phase should rank synthetic sign-matched claim first');
assert.equal(scores['signed-real'].correct, scores.phase.correct, 'signed real control must tie phase');
assert(scores.plain.correct < scores.phase.correct, 'unsigned baseline should fail at least one signed case');

// The full complex dot product with arbitrary nonzero phases is exactly the
// conventional doubled-real-vector dot product. A built-in anti-hype control.
const eq = complexAndRealAgreement([2, 1, 3], [3, 4, 2], [0.3, 1.1, -0.4], [0.7, -0.2, 2.1]);
assert(Math.abs(eq.complex - eq.real2D) < 1e-12); checks++;
assert(Math.abs(scoreClaims(claim('same', 1), claim('same', -1), 'phase')) < 1e-12); checks++;
assert.equal(scoreClaims(claim('same', 1), claim('same', -1), 'plain'), 1); checks++;

// Temporal validity is a separate filter, not a wave score.
const timeline = [
  record('old', 'bridge', 1, { validFrom: '2026-01-01', validTo: '2026-03-01' }),
  record('new', 'bridge', -1, { validFrom: '2026-03-01' }),
];
assert.deepEqual(rank(timeline, query('bridge', 1, { asOf: '2026-02-01' })).results.map(x => x.id), ['old']); checks++;
assert.deepEqual(rank(timeline, query('bridge', -1, { asOf: '2026-04-01' })).results.map(x => x.id), ['new']); checks++;

// Scope / provenance gate precedes scoring. DREAMED has no evidence authority.
const fenced = [record('other-scope', 'vault', 1, { scope: 'private' }),
                record('dream-only', 'vault', 1, { origin: 'DREAMED' })];
assert.equal(rank(fenced, query('vault', 1)).status, 'INSUFFICIENT'); checks++;
assert.deepEqual(rank(fenced, query('vault', 1), { origins: ['DREAMED'] }).results.map(x => x.id), ['dream-only']); checks++;

// Conflicting evidence must yield an explicit conflict, NOT automatic truth.
const contradiction = [record('yes', 'release', 1), record('no', 'release', -1)];
assert.equal(rank(contradiction, query('release', 1)).status, 'CONFLICT'); checks++;

// Integrity / fail-closed input controls.
const receipt = rank(timeline, query('bridge', -1, { asOf: '2026-04-01' }));
assert(verifyReceipt(receipt)); checks++;
assert(!verifyReceipt({ ...receipt, status: 'CANDIDATES_ONLY-EDITED' })); checks++;
assert.throws(() => rank([...timeline, timeline[0]], query('bridge', 1)), /duplicate id/); checks++;
assert.throws(() => rank(timeline, query('bridge', 1, { asOf: 'yesterday' })), /scope and asOf/); checks++;
assert.throws(() => rank(timeline, query('bridge', 1), { origins: ['ALIEN'] }), /origin allowlist/); checks++;

const report = {
  schema: 'PHMP-SM1-E0-REPORT', source: 'SIMULATED', authority: 'NONE',
  note: 'Synthetic typed polarity is given to each mode; unsigned cosine is deliberately information-poor. Phase and signed-real comparison tie by mathematical equivalence. No real semantic quality claim.',
  checks, retrieval: scores, realComplexDifference: Math.abs(eq.complex - eq.real2D),
  temporal: 'PASS', scopeAndProvenance: 'PASS', conflict: 'PASS', tamper: 'PASS',
};
const argv = process.argv.slice(2);
if (argv.length) {
  assert.equal(argv.length, 2, 'expected --out FILE only');
  assert.equal(argv[0], '--out', 'expected --out FILE only');
  writeFileSync(argv[1], JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify(report, null, 2));
