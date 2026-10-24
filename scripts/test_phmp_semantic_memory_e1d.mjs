/**
 * E1D qualifications. Fake transport ONLY: no network, model installs, GPU calls,
 * private records, production memory writes, or PHMP-3 reserved split.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readPublicInputs, assertPublicCorpus, pairedSubjectBootstrap, buildBundle,
  runLocal, verifyBundle, outputPath, persistBundle } from './phmp_semantic_memory_e1d.mjs';

const MODEL='synthetic-mock-encoder:latest';
const HASH='sha256:'+('a'.repeat(64));
let checks=0;
const requests=[];
const fake=async (url,init)=>{
  assert(url==='http://127.0.0.1:11434/api/tags'||url==='http://127.0.0.1:11434/api/embed');checks++;
  requests.push({url,method:init.method});
  const ok=json=>({ok:true,status:200,json:async()=>json});
  if(url.endsWith('/tags'))return ok({models:[
    {name:MODEL,digest:HASH,size:8097152},
    {name:'cloud-model:cloud',digest:'sha256:'+('b'.repeat(64)),size:2000},
  ]});
  const request=JSON.parse(init.body);
  assert.equal(request.model,MODEL);checks++;
  assert.equal(request.truncate,false);checks++;
  assert(Array.isArray(request.input)&&request.input.length<=8);checks++;
  // Synthetic, manually programmed 8D basis, not a real neural embedding.
  const embedding=text=>{
    const l=text.toLowerCase(),tokens=['solar','routing','bridge','audio','backup','battery','firewall','inspection'];
    const v=tokens.map((t,i)=>l.includes(t)?(i+1):0.03);
    return v;
  };
  return ok({embeddings:request.input.map(embedding)});
};
const clock=(()=>{let now=10;return ()=>{now+=11;return now;};})();
const inputs=readPublicInputs();
assert.equal(inputs.template.records.length,12);checks++;
assert.equal(inputs.template.queries.length,13);checks++;
assert.equal(inputs.split.validationQueryIds.length,4);checks++;
const bundle=await runLocal({model:MODEL,modelDigest:HASH,transport:fake,clock});
assert(verifyBundle(bundle));checks++;
assert.equal(bundle.execution,'OPERATOR_APPROVED_LOCAL_OLLAMA');checks++;
assert.equal(bundle.metadata.modelDigest,HASH);checks++;
assert.equal(bundle.metadata.embeddingDimensions,8);checks++;
assert.equal(bundle.metadata.recordCount,12);checks++;
assert.equal(bundle.metadata.queryCount,13);checks++;
assert.equal(bundle.timing.embeddingWallMilliseconds,11);checks++;
assert.equal(bundle.timing.scoringWallMilliseconds,11);checks++;
assert.equal(bundle.metadata.templateSha256,inputs.templateSha256);checks++;
assert.equal(bundle.metadata.splitSha256,inputs.splitSha256);checks++;
assert.equal(bundle.admission.status,'DEVELOPMENT_ONLY_NOT_HELD_OUT');checks++;
assert.equal(bundle.pairedSubjectComparisons.phase_minus_signed_real.observedDelta,0);checks++;
assert.equal(bundle.pairedSubjectComparisons.phase_minus_signed_real.pairedCounts.phaseOnly,0);checks++;
assert.equal(bundle.pairedSubjectComparisons.phase_minus_signed_real.pairedCounts.baselineOnly,0);checks++;
assert.equal(bundle.pairedSubjectComparisons.phase_minus_exact_claim_filter.validationSubjectGroups,4);checks++;
assert.equal(bundle.pairedSubjectComparisons.phase_minus_metadata_filter.exhaustiveBootstrapSamples,256);checks++;
assert(!JSON.stringify(bundle).includes('"vector"'));checks++;
assert(!JSON.stringify(bundle).includes('the solar inverter passed inspection'));checks++;
assert(!verifyBundle({...bundle,execution:'FABRICATED'}));checks++;
assert(!verifyBundle({...bundle,admission:{...bundle.admission,status:'TRUTH'}}));checks++;
assert(requests.every(x=>x.url.startsWith('http://127.0.0.1:11434/')));checks++;
assert.equal(requests.filter(x=>x.url.endsWith('/embed')).length,4);checks++;
assert.equal(requests.filter(x=>x.url.endsWith('/tags')).length,2);checks++;

// Exact paired bootstrap: one group per subject (not individual repeated queries).
const cohorts=[
 {subject:'A',rows:[{alpha:true,beta:false},{alpha:false,beta:false}]},
 {subject:'B',rows:[{alpha:false,beta:true}]}
];
const stats=pairedSubjectBootstrap(cohorts,'alpha','beta');
assert.equal(stats.validationSubjectGroups,2);checks++;
assert.equal(stats.exhaustiveBootstrapSamples,4);checks++;
assert.equal(stats.observedDelta,0);checks++;
assert.deepEqual(stats.percentileInterval95,[-0.925,0.4625]);checks++;
assert.throws(()=>pairedSubjectBootstrap([...cohorts,cohorts[0]],'alpha','beta'),/duplicate subject/);checks++;
assert.throws(()=>pairedSubjectBootstrap([{subject:'one',rows:[]}],'alpha','beta'),/groups must be/);checks++;

// Fail-closed public-fixture checks. These are not labels from user's private data.
const corpus={
 schema:'PHMP-SM1-E1A-CORPUS',
 embeddingSource:{
   kind:'OPERATOR_SUPPLIED_LOCAL',model:MODEL,modelDigest:HASH,
   templateSha256:inputs.templateSha256,exporter:'PHMP-SM1-E1B',split:'DEVELOPMENT'
 },
 dimension:8,
 records:inputs.template.records.map(x=>({...x,vector:[1,0,0,0,0,0,0,0]})),
 queries:inputs.template.queries.map(x=>({...x,vector:[1,0,0,0,0,0,0,0]}))
};
assertPublicCorpus(corpus,inputs);checks++;
const replay=buildBundle(corpus,{inputs});
assert(verifyBundle(replay));checks++;
assert.equal(replay.execution,'REPLAY_EXISTING_CORPUS');checks++;
const corrupted=structuredClone(corpus);
corrupted.queries[0].text='A private or edited query';
assert.throws(()=>assertPublicCorpus(corrupted,inputs),/text or labels differ/);checks++;
const wrongModel=structuredClone(corpus);
wrongModel.embeddingSource.modelDigest='missing';
assert.throws(()=>assertPublicCorpus(wrongModel,inputs),/pinned/);checks++;
const wrongTemplate=structuredClone(corpus);
wrongTemplate.embeddingSource.templateSha256='sha256:'+('f'.repeat(64));
assert.throws(()=>assertPublicCorpus(wrongTemplate,inputs),/different public template/);checks++;
const forbidden=structuredClone(corpus);
forbidden.embeddingSource.kind='SIMULATED_FIXTURE';
assert.throws(()=>assertPublicCorpus(forbidden,inputs),/local E1B-development corpus only/);checks++;

// Reject traversal and repository-root outputs; require ignored artifacts/local subtree.
for(const path of ['report.json','../private.json','artifacts/local/../bad.json','artifacts/local/file.txt']){
 assert.throws(()=>outputPath(path),/output must/);checks++;
}
const temp=mkdtempSync(join(tmpdir(),'phmp-e1d-'));
const suffix='e1d-test-'+process.pid+'-'+Date.now();
const relPath='artifacts/local/'+suffix+'/report.json';
try {
 const file=join(temp,'e1b-corpus.json');
 writeFileSync(file,JSON.stringify(corpus));
 const dest=outputPath(relPath);
 const saved=persistBundle(replay,relPath);
 assert.equal(dest,saved);checks++;
 assert(existsSync(saved));checks++;
 assert.deepEqual(JSON.parse(readFileSync(saved,'utf8')),replay);checks++;
 assert.throws(()=>persistBundle(replay,relPath),/already exists/);checks++;
 // Offline process path cannot call local Ollama and must fail closed on duplicate output.
 assert.throws(()=>execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1d.mjs',
  '--offline','--input',file,'--out',relPath],{stdio:'pipe'}));checks++;
 // No acknowledgement means no local embedding, even if a model looks plausible.
 assert.throws(()=>execFileSync(process.execPath,['scripts/phmp_semantic_memory_e1d.mjs',
  '--execute','--model',MODEL,'--digest',HASH,'--out',
  'artifacts/local/'+suffix+'/other.json'],{stdio:'pipe'}));checks++;
} finally {
 rmSync(resolve('artifacts/local',suffix),{recursive:true,force:true});
 rmSync(temp,{recursive:true,force:true});
}
console.log(JSON.stringify({schema:'PHMP-SM1-E1D-TEST',origin:'SIMULATED',authority:'NONE',
 checks,requests:requests.length,modelCalls:requests.filter(x=>x.url.endsWith('/embed')).length,
 pairedSubjectGroups:4,actualOllamaUsed:false,conclusion:'MOCK_ONLY, NO REAL EMBEDDING ADVANTAGE'},null,2));
