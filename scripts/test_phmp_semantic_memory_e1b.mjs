/**
 * PHMP-SM1 E1B: offline mock transport tests.
 * No local Ollama service or network required. No real model performance claims.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectLocal, preflight, validateTemplate, loadTemplate, produceCorpus } from './phmp_semantic_memory_e1b.mjs';
import { evaluate, validateCorpus, verifyReport } from './phmp_semantic_memory_e1a.mjs';
const MODEL='synthetic-test-embed:latest';
const HASH='sha256:'+('a'.repeat(64));
const TAGS={models:[
  {name:MODEL,digest:HASH,size:7777777},
  {name:'unloaded:latest',digest:'sha256:'+('b'.repeat(64)),size:0},
  {name:'remote:cloud',digest:'sha256:'+('c'.repeat(64)),size:8123}
]};
const fixture='experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json';
let checks=0;
const reqs=[];
const ok=(x)=>({ok:true,status:200,json:async()=>x});
function fakeVectors(input) {
  return input.map(text=>{
    const t=text.toLowerCase();
    // Public deterministic mock featurizer; deliberately NOT a learned model.
    const words=['solar','router','bridge','deck','backup','battery','firewall','acceptance'];
    const vec=words.map((w,i)=>t.includes(w)?(i+1):0.02);
    return vec;
  });
}
function mock(url,init) {
  assert(url==='http://127.0.0.1:11434/api/tags'||url==='http://127.0.0.1:11434/api/embed');
  reqs.push({url,method:init.method});
  if(url.endsWith('/api/tags'))return Promise.resolve(ok(TAGS));
  const b=JSON.parse(init.body);
  assert.equal(b.model,MODEL);
  assert.equal(b.truncate,false);
  assert(Array.isArray(b.input)&&b.input.length<=8&&b.input.length>0);
  assert(!('stream' in b));
  return Promise.resolve(ok({embeddings:fakeVectors(b.input)}));
}
const {template,inputSha256}=loadTemplate(fixture);
assert.equal(template.split,'DEVELOPMENT');checks++;
assert.equal(template.records.length,12);checks++;
assert.equal(template.queries.length,13);checks++;
assert.equal(validateTemplate(template),template);checks++;
const inventory=await inspectLocal({transport:mock});
assert.deepEqual(inventory.map(x=>x.name),[MODEL]);checks++;
const inspected=await preflight({model:MODEL,modelDigest:HASH,transport:mock});
assert.equal(inspected.digest,HASH);checks++;
await assert.rejects(()=>preflight({model:MODEL,modelDigest:'sha256:'+('d'.repeat(64)),transport:mock}),/digest mismatch/);checks++;
await assert.rejects(()=>preflight({model:'remote:cloud',modelDigest:HASH,transport:mock}),/cloud reference disallowed/);checks++;
await assert.rejects(()=>preflight({model:'nonexistent:latest',modelDigest:HASH,transport:mock}),/model not found/);checks++;
await assert.rejects(()=>preflight({model:MODEL,modelDigest:'BAD',transport:mock}),/digest/);checks++;
let embedCount=reqs.filter(x=>x.url.endsWith('/api/embed')).length;
assert.equal(embedCount,0);checks++;
const corpus=await produceCorpus(template,{model:MODEL,modelDigest:HASH,inputSha256,transport:mock});
assert.equal(corpus.records.length,12);checks++;
assert.equal(corpus.queries.length,13);checks++;
assert.equal(corpus.dimension,8);checks++;
assert.equal(corpus.embeddingSource.modelDigest,HASH);checks++;
assert.equal(corpus.embeddingSource.split,'DEVELOPMENT');checks++;
validateCorpus(corpus);checks++;
const report=evaluate(corpus);
assert(verifyReport(report));checks++;
assert.equal(report.checks.phaseSignedRealAgreementQueries,13);checks++;
assert.deepEqual(report.metrics.signed_real,report.metrics.complex_phase);checks++;
assert.deepEqual(report.families.signed_real,report.families.complex_phase);checks++;
embedCount=reqs.filter(x=>x.url.endsWith('/api/embed')).length;
assert.equal(embedCount,4);checks++;
const expectedRecords=template.records.map(r=>r.id);
assert.deepEqual(corpus.records.map(r=>r.id),expectedRecords);checks++;

const copy=()=>structuredClone(template);
function rejection(fn,regex) {const t=copy();fn(t);assert.throws(()=>validateTemplate(t),regex);checks++;}
rejection(t=>t.split='RESERVED',/development/i);
rejection(t=>t.records[0].vector=[1,2],/unexpected/);
rejection(t=>t.records[0].authority='TRUTH',/authority/);
rejection(t=>t.records[0].origin='LOOPHOLE',/provenance/);
rejection(t=>t.records[0].validFrom='2026-02-31',/interval/);
rejection(t=>t.records.push(structuredClone(t.records[0])),/duplicate record/);
rejection(t=>t.queries[0].expectedIds=['solar-dream'],/ineligible/);
rejection(t=>t.queries[0].expectedIds=['router-private'],/ineligible/);
rejection(t=>t.queries[0].expectedIds=['solar-no'],/ineligible/);
rejection(t=>t.queries[0].expectedIds=['not-real'],/ineligible/);
rejection(t=>t.queries[0].family='TRUTH',/family/);
rejection(t=>t.queries[0].asOf='next week',/invalid query/);
rejection(t=>t.queries[0].extra='bad',/unexpected/);
rejection(t=>t.queries.push(structuredClone(t.queries[0])),/duplicate query/);
rejection(t=>t.records[0].claim.polarity=0,/polarity/);

let tagsCalls=0;
async function changedModel(url,init) {
  if(url.endsWith('/api/tags')) {
    tagsCalls++;
    return ok({models:[{name:MODEL,digest:tagsCalls===1?HASH:'sha256:'+('e'.repeat(64)),size:7777777}]});
  }
  return mock(url,init);
}
await assert.rejects(()=>produceCorpus(template,{model:MODEL,modelDigest:HASH,inputSha256,transport:changedModel}),/digest mismatch/);checks++;
const wrongCount=async (url,init)=>url.endsWith('/api/embed')?ok({embeddings:[]}):ok(TAGS);
await assert.rejects(()=>produceCorpus(template,{model:MODEL,modelDigest:HASH,inputSha256,transport:wrongCount}),/count mismatch/);checks++;
const invalidValues=async (url,init)=>url.endsWith('/api/embed')?ok({embeddings:JSON.parse(init.body).input.map(()=>[NaN,1])}):ok(TAGS);
await assert.rejects(()=>produceCorpus(template,{model:MODEL,modelDigest:HASH,inputSha256,transport:invalidValues}),/nonfinite/);checks++;
let batchIndex=0;
const mixedSize=async (url,init)=> {
  if(url.endsWith('/api/tags'))return ok(TAGS);
  batchIndex++;
  return ok({embeddings:JSON.parse(init.body).input.map(()=>batchIndex===1?[1,2,3]:[1,2])});
};
await assert.rejects(()=>produceCorpus(template,{model:MODEL,modelDigest:HASH,inputSha256,transport:mixedSize}),/mixed embedding/);checks++;

const folder=mkdtempSync(join(tmpdir(),'phmp-e1b-'));
try {
  const file=join(folder,'template.json');
  writeFileSync(file,JSON.stringify({...template,split:'RESERVED'}));
  assert.throws(()=>loadTemplate(file),/development/i);checks++;
  writeFileSync(file,' '.repeat(256*1024+1));
  assert.throws(()=>loadTemplate(file),/larger than/);checks++;
} finally {rmSync(folder,{recursive:true,force:true});}
console.log(JSON.stringify({schema:'PHMP-SM1-E1B-TEST',origin:'SIMULATED',authority:'NONE',checks,
  mockCorpus:{records:corpus.records.length,queries:corpus.queries.length,dimensions:corpus.dimension},
  comparison:'SIGNED_REAL_EQUAL_COMPLEX_PHASE',localOnly:'MOCK_ONLY_NO_NETWORK'},null,2));
