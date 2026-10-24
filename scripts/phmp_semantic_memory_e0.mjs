/**
 * PHMP-SM1 E0: an original, synthetic, dependency-free semantic phase study.
 * Structured polarity is supplied explicitly; this is not an NLP parser.
 * No inference, external model, network request, or external evidence.
 */
import { createHash } from 'node:crypto';

const D = 96;
const ORIGINS = new Set(['OBSERVED', 'VERIFIED', 'INFERRED', 'DREAMED', 'SIMULATED', 'UNKNOWN']);
const MODES = new Set(['plain', 'signed-real', 'phase']);

function insist(ok, message) { if (!ok) throw new Error(message); }
function textValue(value) { return typeof value === 'string' && value.length > 0 && value.length <= 256; }
function dateValue(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
function hash(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function key(claim) { return [claim.subject, claim.predicate, claim.object].join('\u001f'); }
function checkClaim(c) {
  insist(c && typeof c === 'object', 'claim required');
  for (const k of ['subject', 'predicate', 'object']) insist(textValue(c[k]), `claim.${k} required`);
  insist(c.polarity === 1 || c.polarity === -1, 'claim.polarity must be +1 or -1');
}
export function validateRecord(r) {
  insist(r && typeof r === 'object', 'record required');
  insist(textValue(r.id) && textValue(r.scope) && textValue(r.sourceId), 'id, scope and sourceId required');
  insist(ORIGINS.has(r.origin), 'invalid provenance origin');
  insist(r.authority === 'NONE' || r.authority === 'OPERATOR_ATTESTED', 'invalid authority label');
  checkClaim(r.claim);
  insist(dateValue(r.validFrom) && (r.validTo === null || dateValue(r.validTo)), 'invalid validity date');
  insist(r.validTo === null || r.validFrom < r.validTo, 'validTo must be after validFrom');
  return r;
}
function indexFor(token) {
  const b = createHash('sha256').update(token).digest();
  return b.readUInt32LE(0) % D;
}
/** Fixed sparse-to-dense feature hashing. No claim of learned semantics. */
export function amplitude(claim) {
  checkClaim(claim);
  const a = new Float64Array(D);
  for (const [token, weight] of [
    [`subject:${claim.subject}`, 2],
    [`predicate:${claim.predicate}`, 1.5],
    [`object:${claim.object}`, 1.5],
    [`triple:${key(claim)}`, 3],
  ]) a[indexFor(token)] += weight;
  return a;
}
function cosineParts(a, b, phaseDelta = 0) {
  insist(a.length === b.length && a.length > 0, 'vector length mismatch');
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2;
  }
  if (!aa || !bb) return 0;
  return Math.max(-1, Math.min(1, dot * Math.cos(phaseDelta) / Math.sqrt(aa * bb)));
}
/** Mean relative coherence; binary sign is an explicitly supplied phase. */
export function scoreClaims(query, record, mode = 'phase') {
  insist(MODES.has(mode), 'unknown retrieval mode');
  checkClaim(query); checkClaim(record);
  const a = amplitude(query), b = amplitude(record);
  const delta = mode === 'plain' ? 0 : (query.polarity - record.polarity) * Math.PI / 2;
  return (1 + cosineParts(a, b, delta)) / 2;
}
/** Important control: a complex inner product is a real dot in 2x dimensions. */
export function complexAndRealAgreement(a, b, phasesA, phasesB) {
  insist(a.length === b.length && a.length === phasesA.length && a.length === phasesB.length && a.length > 0, 'vector lengths mismatch');
  let real = 0, expanded = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    const t = phasesA[i] - phasesB[i];
    real += a[i] * b[i] * Math.cos(t);
    expanded += a[i] * Math.cos(phasesA[i]) * b[i] * Math.cos(phasesB[i]);
    expanded += a[i] * Math.sin(phasesA[i]) * b[i] * Math.sin(phasesB[i]);
    aa += a[i] ** 2; bb += b[i] ** 2;
  }
  insist(aa > 0 && bb > 0, 'zero magnitude');
  return { complex: real / Math.sqrt(aa * bb), real2D: expanded / Math.sqrt(aa * bb) };
}
export function rank(records, query, { mode = 'phase', origins = ['OBSERVED', 'VERIFIED'], topK = 5 } = {}) {
  insist(query && textValue(query.scope) && dateValue(query.asOf), 'scope and asOf required');
  checkClaim(query.claim);
  insist(MODES.has(mode), 'invalid mode');
  insist(Array.isArray(origins) && origins.every(x => ORIGINS.has(x)), 'invalid origin allowlist');
  insist(Number.isInteger(topK) && topK >= 1 && topK <= 100, 'invalid topK');
  const ids = new Set();
  for (const rec of records) {
    validateRecord(rec);
    insist(!ids.has(rec.id), 'duplicate id'); ids.add(rec.id);
  }
  const eligible = records.filter(r =>
    r.scope === query.scope && origins.includes(r.origin) && r.validFrom <= query.asOf &&
    (r.validTo === null || query.asOf < r.validTo)
  );
  const candidates = eligible.map(r => ({ id: r.id, score: scoreClaims(query.claim, r.claim, mode), claim: r.claim, origin: r.origin, sourceId: r.sourceId }));
  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const relevant = eligible.filter(r => key(r.claim) === key(query.claim));
  const signs = new Set(relevant.map(r => r.claim.polarity));
  const status = signs.size > 1 ? 'CONFLICT' : candidates.length ? 'CANDIDATES_ONLY' : 'INSUFFICIENT';
  const ranked = candidates.slice(0, topK).map(({ id, score, origin }) => ({ id, score: Number(score.toFixed(12)), origin }));
  const body = { schema: 'PHMP-SM1-E0', mode, scope: query.scope, asOf: query.asOf,
    queryHash: hash(query.claim), eligibleRecords: eligible.map(r => ({ id: r.id, digest: hash(r) })).sort((a, b) => a.id.localeCompare(b.id)),
    status, results: ranked, origin: 'SIMULATED', authority: 'NONE' };
  return { ...body, receiptSha256: hash(body) };
}
export function verifyReceipt(receipt) {
  const { receiptSha256, ...body } = receipt;
  return typeof receiptSha256 === 'string' && hash(body) === receiptSha256;
}
