/**
 * PHMP-SM1 E1A contract, negative controls, parity audit and CLI smoke.
 * Hand-authored vectors, never a report of real embedding model performance.
 */
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readCorpus, validateCorpus, evaluate, rankOne, verifyReport, MODES } from './phmp_semantic_memory_e1a.mjs';

const filename='experiments/PHMP1/fixtures/phmp_sm1_e1a_synthetic_vectors.json';
const corpus=readCorpus(filename);
let checks=0;
const report=evaluate(corpus);
assert.equal(report.records,9);checks++;
assert.equal(report.queries,10);checks++;
assert.equal(report.checks.phaseSignedRealAgreementQueries,10);checks++;
assert.equal(report.checks.conflictQueries,4);checks++; // 2 solar + 2 safety
assert(verifyReport(report));checks++;
assert.deepEqual(evaluate(corpus),report);checks++;
assert(!verifyReport({...report,queries:1000}));checks++;
for (const mode of MODES) {
  assert(report.metrics[mode].positiveQueries>=1);checks++;
  assert(report.metrics[mode].emptyQueries===2);checks++;
  assert(report.metrics[mode].ndcgAt5 !== null);checks++;
  assert(report.metrics[mode].falseRecallOnEmpty>=0);checks++;
}
assert.deepEqual(report.metrics.signed_real,report.metrics.complex_phase);checks++;
assert.deepEqual(report.families.signed_real,report.families.complex_phase);checks++;

const byId=(id)=>corpus.queries.find(q=>q.id===id);
function top(q,mode) { return rankOne(corpus,byId(q),mode,1).ids[0]; }
assert.equal(top('q-solar-no','raw_cosine'),'solar-affirmed');checks++;
assert.equal(top('q-solar-no','complex_phase'),'solar-denied');checks++;
assert.equal(top('q-solar-no','signed_real'),'solar-denied');checks++;
assert.equal(top('q-solar-no','metadata_filter'),'solar-denied');checks++;
assert.equal(top('q-safety-no','complex_phase'),'safety-denied');checks++;
assert.equal(top('q-router-paraphrase','complex_phase'),'router-accepted');checks++;
assert.equal(top('q-private','raw_cosine'),'private-solar');checks++;
for(const mode of MODES) {
  assert.deepEqual(rankOne(corpus,byId('q-bridge-feb'),mode,5).ids.includes('bridge-new'),false);checks++;
  assert.deepEqual(rankOne(corpus,byId('q-bridge-april'),mode,5).ids.includes('bridge-old'),false);checks++;
  assert.deepEqual(rankOne(corpus,byId('q-empty-scope'),mode,5).ids,[]);checks++;
}
assert.equal(rankOne(corpus,byId('q-solar-no'),'complex_phase',5).status,'CONFLICT');checks++;
assert.equal(rankOne(corpus,byId('q-bridge-feb'),'complex_phase',5).status,'CANDIDATES_ONLY');checks++;
assert.equal(rankOne(corpus,byId('q-empty-scope'),'complex_phase',5).status,'INSUFFICIENT');checks++;
assert(!rankOne(corpus,byId('q-solar-yes'),'raw_cosine',5).ids.includes('dream-solar'));checks++;
assert(!rankOne(corpus,byId('q-solar-yes'),'raw_cosine',5).ids.includes('private-solar'));checks++;

// Malformed and contaminated artifacts must be rejected before any evaluation.
const clone=()=>structuredClone(corpus);
function fail(modify,match) { const c=clone();modify(c);assert.throws(()=>validateCorpus(c),match);checks++; }
fail(c=>c.records.push({...c.records[0]}),/duplicate/);
fail(c=>c.records[0].vector=[0,0,0,0],/zero/);
fail(c=>c.records[0].vector=[1,0,0],/embedding/);
fail(c=>c.records[0].vector=[1,0,Infinity,0],/embedding/);
fail(c=>c.records[0].scope='',/record identity/);
fail(c=>c.records[0].origin='UNKNOWN_FAKE',/origin/);
fail(c=>c.records[0].authority='VERIFIED',/authority/);
fail(c=>c.records[0].validTo='2025-12-31',/reversed/);
fail(c=>c.records[0].validFrom='2026-02-31',/temporal/);
fail(c=>c.queries[0].asOf='tomorrow',/query identity/);
fail(c=>c.queries[0].expectedIds=['dream-solar'],/ineligible/);
fail(c=>c.queries[0].expectedIds=['private-solar'],/ineligible/);
fail(c=>c.queries[0].expectedIds=['solar-denied'],/polarity mismatch/);
fail(c=>c.queries[0].expectedIds=['absent-id'],/nonexistent/);
fail(c=>c.queries[0].expectedIds=['solar-affirmed','solar-affirmed'],/duplicate expectedId/);
fail(c=>c.queries[0].family='SENTIENT',/family/);
fail(c=>c.embeddingSource.kind='UNSAFE_REMOTE',/embedding source/);
fail(c=>c.dimension=0,/dimension/);
fail(c=>c.records[0].claim.polarity=0,/polarity/);
assert.throws(()=>rankOne(corpus,byId('q-solar-yes'),'unknown'),/retrieval mode/);checks++;
assert.throws(()=>evaluate(corpus,6),/only k/);checks++;

// The CLI must produce the same deterministic report and refuse overwrite.
const td=mkdtempSync(join(tmpdir(),'phmp-sm1-e1a-'));
try {
  const dest=join(td,'report.json');
  execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1a.mjs','--input',filename,'--out',dest],{stdio:'pipe'});
  assert(existsSync(dest));checks++;
  assert.deepEqual(JSON.parse(readFileSync(dest,'utf8')),report);checks++;
  assert.throws(()=>execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1a.mjs','--input',filename,'--out',dest],{stdio:'pipe'}));checks++;
} finally { rmSync(td,{recursive:true,force:true}); }
console.log(JSON.stringify({schema:'PHMP-SM1-E1A-TEST',origin:'SIMULATED',authority:'NONE',checks,
  summary:{records:report.records,queries:report.queries,byMode:report.metrics},
  interpretation:'This is a deterministic fixture contract, not a real learned-embedding benchmark.'},null,2));
