/** E1C synthetic, no Ollama/network/reserved data. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {validateCorpus} from './phmp_semantic_memory_e1a.mjs';
import {E1C_MODES,rankedCandidates,decide,validateSplit,calibrate,evaluatePilot,verifyPilotReceipt} from './phmp_semantic_memory_e1c.mjs';

const template=JSON.parse(readFileSync('experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json','utf8'));
const split=JSON.parse(readFileSync('experiments/PHMP1/fixtures/phmp_sm1_e1c_development_split.json','utf8'));
let checks=0;
// Deterministic, manually created toy vectors, not an embedding model.
const subjects=['solar','router','bridge','deck','backup','battery','thermal-pump','firewall'];
const vectorFor=(subject,polarity)=>{
  const vec=Array.from({length:subjects.length+1},()=>0.01);
  vec[subjects.indexOf(subject)] = 1;
  return vec;
};
const corpus=validateCorpus({
 schema:'PHMP-SM1-E1A-CORPUS',
 embeddingSource:{kind:'SIMULATED_FIXTURE',model:'handmade-onehot-context-no-learning'},
 dimension:subjects.length+1,
 records:template.records.map(r=>({...r,vector:vectorFor(r.claim.subject,r.claim.polarity)})),
 queries:template.queries.map(q=>({...q,vector:vectorFor(q.claim.subject,q.claim.polarity)}))
});
validateSplit(corpus,split);checks++;
const report=evaluatePilot(corpus,split);
assert(verifyPilotReceipt(report));checks++;
assert.deepEqual(evaluatePilot(corpus,split),report);checks++;
assert.equal(report.status,'DEVELOPMENT_ONLY_NOT_HELD_OUT');checks++;
assert.equal(report.developmentQueries,9);checks++;
assert.equal(report.validationQueries,4);checks++;
assert.equal(report.modes.signed_real.threshold,report.modes.complex_phase.threshold);checks++;
const normalizedDecisions = mode => report.modes[mode].validationDecisions.map(
  ({mode: _mode, ...decision}) => decision);
assert.deepEqual(normalizedDecisions('signed_real'),normalizedDecisions('complex_phase'));checks++;
assert.deepEqual(report.modes.signed_real.validation,report.modes.complex_phase.validation);checks++;
assert.equal(report.modes.signed_real.development.wrongAdmissions,0);checks++;
assert.equal(report.modes.metadata_filter.development.wrongAdmissions,0);checks++;
assert.equal(report.modes.exact_claim_filter.development.wrongAdmissions,0);checks++;
assert.equal(report.modes.exact_claim_filter.validation.falseAdmissionsOnEmpty,0);checks++;
assert(!verifyPilotReceipt({...report,validationQueries:1000}));checks++;

// Both sides of contradictory testimony may rank highly but MUST be deferred.
const solar=corpus.queries.find(q=>q.id==='q-solar-passed');
for(const mode of E1C_MODES) {
  const d=decide(corpus,solar,mode,-1);
  assert.equal(d.status,'CONFLICT_DEFER');checks++;
  assert.equal(d.admittedId,null);checks++;
}
// A perfectly aligned embedding of the wrong polarity must not be admitted.
const battery=corpus.queries.find(q=>q.id==='q-battery');
const wrong=decide(corpus,battery,'raw_cosine',-1);
assert.equal(wrong.status,'CLAIM_MISMATCH_DEFER');checks++;
assert.equal(wrong.admittedId,null);checks++;
assert.equal(decide(corpus,battery,'metadata_filter',-1).status,'CLAIM_MISMATCH_DEFER');checks++;
assert.equal(decide(corpus,battery,'exact_claim_filter',-1).status,'INSUFFICIENT');checks++;
// Exact-claim metadata baseline is allowed the same typed claim as phase.
assert.equal(rankedCandidates(corpus,battery,'exact_claim_filter').poolCount,0);checks++;
// Dream and simulated origin records never enter evidence-gated rankings.
for(const mode of E1C_MODES) {
  const r=rankedCandidates(corpus,solar,mode);
  assert(!r.candidates.some(x=>x.id==='solar-dream'));checks++;
}
const bridgeOld=corpus.queries.find(q=>q.id==='q-bridge-march');
const bridgeNew=corpus.queries.find(q=>q.id==='q-bridge-may');
assert.equal(decide(corpus,bridgeOld,'exact_claim_filter',-1).admittedId,'bridge-old');checks++;
assert.equal(decide(corpus,bridgeNew,'exact_claim_filter',-1).admittedId,'bridge-new');checks++;
// If an otherwise relevant candidate misses a high threshold, it must defer.
assert.equal(decide(corpus,bridgeOld,'exact_claim_filter',2).status,'LOW_SCORE_DEFER');checks++;
assert.equal(decide(corpus,bridgeOld,'exact_claim_filter',-1).status,'CANDIDATE_ONLY');checks++;
const unknown=corpus.queries.find(q=>q.id==='q-nonexistent');
assert.equal(decide(corpus,unknown,'exact_claim_filter',-1).status,'INSUFFICIENT');checks++;
assert.throws(()=>decide(corpus,bridgeOld,'exact_claim_filter',3),/threshold/);checks++;
assert.throws(()=>rankedCandidates(corpus,solar,'quantum_hype'),/comparator/);checks++;
assert.equal(calibrate(corpus,split.developmentQueryIds,'complex_phase').metrics.wrongAdmissions,0);checks++;

// Split cannot be retrospectively labeled as reserved or leak the same subject.
function rejects(mut,match) {
 const x=structuredClone(split);mut(x);
 assert.throws(()=>validateSplit(corpus,x),match);checks++;
}
rejects(x=>x.purpose='RESERVED',/development/);
rejects(x=>x.validationQueryIds.push('q-solar-passed'),/both groups|duplicated/);
rejects(x=>x.developmentQueryIds[0]='q-battery',/both groups|duplicated|every corpus/);
rejects(x=>x.validationQueryIds[0]='missing',/every corpus/);
rejects(x=>x.validationQueryIds=[],/development and validation/);
rejects(x=>x.extra='not-allowed',/unknown fields/);
// Deliberately move a solar query while keeping all IDs assigned: reject subject leakage.
rejects(x=>{x.developmentQueryIds=x.developmentQueryIds.filter(id=>id!=='q-solar-failed');x.validationQueryIds.push('q-solar-failed')},/subject leakage/);

// CLI must never overwrite a previously emitted report.
const tmp=mkdtempSync(join(tmpdir(),'phmp-e1c-'));
try {
  const input=join(tmp,'corpus.json'),manifest=join(tmp,'split.json'),output=join(tmp,'report.json');
  writeFileSync(input,JSON.stringify(corpus));
  writeFileSync(manifest,JSON.stringify(split));
  const log=execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1c.mjs','--input',input,'--split',manifest,'--out',output],{encoding:'utf8'});
  assert.equal(JSON.parse(log).receiptSha256,report.receiptSha256);checks++;
  assert.deepEqual(JSON.parse(readFileSync(output,'utf8')),report);checks++;
  assert.throws(()=>execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1c.mjs','--input',input,'--split',manifest,'--out',output],{stdio:'pipe'}));checks++;
} finally {rmSync(tmp,{recursive:true,force:true});}
console.log(JSON.stringify({
 schema:'PHMP-SM1-E1C-TEST',origin:'SIMULATED',authority:'NONE',checks,
 development:report.developmentQueries,validation:report.validationQueries,
 metrics:Object.fromEntries(E1C_MODES.map(mode=>[mode,report.modes[mode].validation])),
 interpretation:'Development-only synthetic checks, not independently held-out semantic memory performance.',
},null,2));
