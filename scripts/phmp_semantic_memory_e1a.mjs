/**
 * PHMP-SM1 E1A: Offline evaluation of externally supplied fixed embeddings.
 * Does not create embeddings, infer polarity, connect to a model, or alter memory.
 * Every mode has access to the same structured polarity; raw cosine deliberately
 * ignores it, while the sign-aware real and complex-phase modes are equivalent.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const MODES = Object.freeze(['raw_cosine', 'metadata_filter', 'signed_real', 'complex_phase']);
const ORIGINS = new Set(['OBSERVED', 'VERIFIED', 'INFERRED', 'DREAMED', 'SIMULATED', 'UNKNOWN']);
const ALLOWED = new Set(['OBSERVED', 'VERIFIED']);
const MAX_FILE = 16 * 1024 * 1024;
function requireThat(ok, message) { if (!ok) throw new Error(message); }
function str(s, max = 300) { return typeof s === 'string' && s.length > 0 && s.length <= max; }
function iso(s) { return str(s) && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s; }
function sha(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function key(claim) { return [claim.subject, claim.predicate, claim.object].join('\u001f'); }
function validClaim(c) {
  requireThat(c && typeof c === 'object' && ['subject','predicate','object'].every(k => str(c[k])), 'invalid claim triple');
  requireThat(c.polarity === 1 || c.polarity === -1, 'invalid claim polarity');
}
function validVector(v, d) {
  requireThat(Array.isArray(v) && v.length === d && v.every(x => typeof x === 'number' && Number.isFinite(x)), 'invalid embedding vector');
  requireThat(v.some(x => x !== 0), 'zero vector is disallowed');
}
function uniqueIDs(xs, keyName) {
  const seen = new Set();
  for (const item of xs) { requireThat(!seen.has(item[keyName]), 'duplicate ' + keyName); seen.add(item[keyName]); }
}
export function validateCorpus(c) {
  requireThat(c && c.schema === 'PHMP-SM1-E1A-CORPUS', 'invalid corpus schema');
  requireThat(c.embeddingSource && ['SIMULATED_FIXTURE', 'OPERATOR_SUPPLIED_LOCAL'].includes(c.embeddingSource.kind), 'invalid embedding source');
  requireThat(str(c.embeddingSource.model), 'missing model name');
  requireThat(Number.isInteger(c.dimension) && c.dimension >= 2 && c.dimension <= 2048, 'invalid dimension');
  requireThat(Array.isArray(c.records) && c.records.length >= 1 && c.records.length <= 2500, 'invalid records length');
  requireThat(Array.isArray(c.queries) && c.queries.length >= 1 && c.queries.length <= 500, 'invalid queries length');
  requireThat(c.records.length * c.dimension <= 1_000_000, 'embedding matrix too large for bounded E1A');
  for (const r of c.records) {
    requireThat(r && str(r.id) && str(r.text, 1200) && str(r.scope) && str(r.sourceId), 'invalid record identity/text');
    requireThat(ORIGINS.has(r.origin) && r.authority === 'NONE', 'invalid record origin/authority');
    requireThat(iso(r.validFrom) && (r.validTo === null || iso(r.validTo)), 'invalid temporal interval');
    requireThat(r.validTo === null || r.validFrom < r.validTo, 'reversed temporal interval');
    validClaim(r.claim); validVector(r.vector, c.dimension);
  }
  uniqueIDs(c.records, 'id');
  const ids = new Map(c.records.map(r => [r.id, r]));
  for (const q of c.queries) {
    requireThat(q && str(q.id) && str(q.text, 1200) && str(q.scope) && iso(q.asOf), 'invalid query identity/text');
    requireThat(['negation', 'time', 'paraphrase', 'scope', 'abstention', 'other'].includes(q.family), 'invalid family');
    validClaim(q.claim); validVector(q.vector, c.dimension);
    requireThat(Array.isArray(q.expectedIds) && q.expectedIds.length <= c.records.length && q.expectedIds.every(x => str(x)), 'invalid expectedIds');
    requireThat(new Set(q.expectedIds).size === q.expectedIds.length, 'duplicate expectedId');
    for (const expectedId of q.expectedIds) {
      const r = ids.get(expectedId);
      requireThat(r, 'label references nonexistent record');
      requireThat(r.scope === q.scope && ALLOWED.has(r.origin) && r.validFrom <= q.asOf && (r.validTo === null || q.asOf < r.validTo), 'label references ineligible record');
      requireThat(r.claim.polarity === q.claim.polarity, 'label polarity mismatch');
    }
  }
  uniqueIDs(c.queries, 'id');
  return c;
}
function cosine(a,b) {
  let dot=0,aa=0,bb=0;
  for (let i=0;i<a.length;i++) { dot += a[i]*b[i]; aa+=a[i]*a[i]; bb+=b[i]*b[i]; }
  requireThat(aa>0 && bb>0, 'zero norm');
  const x=dot/Math.sqrt(aa*bb);
  return Math.min(1, Math.max(-1, x));
}
export function rankOne(c, q, mode, k = 5) {
  requireThat(MODES.includes(mode), 'invalid retrieval mode');
  requireThat(Number.isInteger(k) && k >= 1 && k <= 25, 'invalid k');
  const eligible = c.records.filter(r => r.scope === q.scope && ALLOWED.has(r.origin) &&
    r.validFrom <= q.asOf && (r.validTo === null || q.asOf < r.validTo));
  const grouped = new Map();
  for (const r of eligible) {
    const id = key(r.claim);
    const signs = grouped.get(id) || new Set();
    signs.add(r.claim.polarity); grouped.set(id, signs);
  }
  const conflict = (grouped.get(key(q.claim)) || new Set()).size > 1;
  const candidatePool = mode === 'metadata_filter'
    ? eligible.filter(r => r.claim.polarity === q.claim.polarity)
    : eligible;
  const ordered = candidatePool.map(r => {
    const semantic = cosine(q.vector, r.vector);
    // cos(0) = 1, cos(pi) = -1, using exact signs avoids floating artifacts.
    const sign = q.claim.polarity === r.claim.polarity ? 1 : -1;
    const score = mode === 'raw_cosine' || mode === 'metadata_filter' ? semantic : sign * semantic;
    return { id:r.id, score, origin:r.origin };
  }).sort((a,b) => b.score - a.score || a.id.localeCompare(b.id));
  return { ids: ordered.slice(0,k).map(x => x.id), scores:ordered.slice(0,k).map(x => Number(x.score.toFixed(12))),
    eligibleCount:eligible.length, candidateCount:candidatePool.length, conflict,
    status:conflict ? 'CONFLICT' : candidatePool.length ? 'CANDIDATES_ONLY' : 'INSUFFICIENT' };
}
function metricsOf(rows) {
  let hit1=0,recall5=0,mrr=0,ndcg5=0,abstentionCorrect=0,falseRecall=0,positive=0,empty=0;
  for (const row of rows) {
    const expect = new Set(row.expectedIds);
    if (!expect.size) {
      empty++;
      if (row.results.length === 0) abstentionCorrect++;
      else falseRecall++;
      continue;
    }
    positive++;
    if (expect.has(row.results[0])) hit1++;
    const first=row.results.findIndex(id => expect.has(id));
    if(first>=0)mrr+=1/(first+1);
    const found=row.results.filter(id => expect.has(id)).length;
    recall5 += found/expect.size;
    let dcg=0,ideal=0;
    for(let i=0;i<Math.min(5,row.results.length);i++) if(expect.has(row.results[i]))dcg+=1/Math.log2(i+2);
    for(let i=0;i<Math.min(5,expect.size);i++) ideal+=1/Math.log2(i+2);
    ndcg5 += ideal ? dcg/ideal : 0;
  }
  const fix = x => Number(x.toFixed(9));
  return {queries:rows.length,positiveQueries:positive,emptyQueries:empty,
    hitAt1:positive ? fix(hit1/positive) : null,
    recallAt5:positive ? fix(recall5/positive) : null,
    mrrAt5:positive ? fix(mrr/positive) : null,
    ndcgAt5:positive ? fix(ndcg5/positive) : null,
    abstentionAccuracy:empty ? fix(abstentionCorrect/empty) : null, falseRecallOnEmpty:falseRecall };
}
export function evaluate(c, k=5) {
  validateCorpus(c);
  requireThat(Number.isInteger(k) && k>=1 && k<=5, 'only k <= 5 supported in E1A');
  const details = {};
  let agreement=0, conflicts=0;
  for (const mode of MODES) details[mode]=[];
  for(const q of c.queries) {
    const ranks=Object.fromEntries(MODES.map(mode => [mode,rankOne(c,q,mode,k)]));
    const a=ranks.signed_real, b=ranks.complex_phase;
    requireThat(JSON.stringify(a.ids) === JSON.stringify(b.ids), 'signed real / complex phase rank diverged');
    for(let i=0;i<a.scores.length;i++)requireThat(Math.abs(a.scores[i]-b.scores[i])<=1e-10,'signed real / phase score mismatch');
    agreement++;
    if(a.conflict)conflicts++;
    for(const mode of MODES)details[mode].push({
      queryId:q.id, family:q.family, expectedIds:q.expectedIds,
      results:ranks[mode].ids, status:ranks[mode].status,
    });
  }
  const byMode={}, byFamily={};
  for(const mode of MODES) {
    byMode[mode]=metricsOf(details[mode]);
    byFamily[mode]={};
    for(const family of [...new Set(c.queries.map(q=>q.family))].sort()) {
      byFamily[mode][family]=metricsOf(details[mode].filter(r=>r.family===family));
    }
  }
  const body={
    schema:'PHMP-SM1-E1A-REPORT', origin:'SIMULATED', authority:'NONE',
    embeddingSource:c.embeddingSource, corpusSha256:sha(c), k, records:c.records.length, queries:c.queries.length,
    gates:{scope:'EXACT', origin:'OBSERVED_OR_VERIFIED_DECLARED', validity:'AS_OF', conflict:'EXPLICIT'},
    checks:{phaseSignedRealAgreementQueries:agreement,conflictQueries:conflicts},
    metrics:byMode, families:byFamily,
    interpretation:'Unsigned cosine lacks supplied polarity; signed-real and complex-phase are mathematically equivalent at equal information. User-supplied labels and origin metadata are not independently verified.',
  };
  return {...body, receiptSha256:sha(body)};
}
export function verifyReport(report) {
  if(!report || typeof report !== 'object')return false;
  const {receiptSha256,...body}=report;
  return typeof receiptSha256==='string' && receiptSha256===sha(body);
}
export function readCorpus(filename) {
  const buf=readFileSync(filename);
  requireThat(buf.length<=MAX_FILE,'input corpus exceeds 16 MiB cap');
  return validateCorpus(JSON.parse(buf.toString('utf8')));
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const args=process.argv.slice(2);
  if(![2,4].includes(args.length) || args[0]!=='--input' || (args.length===4 && args[2]!=='--out')) {
    throw new Error('usage: node scripts/phmp_semantic_memory_e1a.mjs --input DATA.json [--out NEW_REPORT.json]');
  }
  const report=evaluate(readCorpus(args[1]));
  if(args.length===4)writeFileSync(args[3], JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify(report,null,2));
}
