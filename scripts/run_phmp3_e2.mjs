// PHMP-3 E2: explicit, one-shot reserved-evaluation runner.
// Default mode (--verify-freeze) never generates the reserved set.
// Actual scoring requires BOTH --execute-reserved and --ack-once plus a new receipt path.
// No candidate implementation, oracle, or held-out generator is modified here.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { PROTOCOL, generateSplit, queriesFor } from './phmp3_contract.mjs';
import { MODEL_SPECS, availableModels, makeStreamingMemory, answerFromCommitted, modelCodebookMinimumBytes } from './phmp3_memories.mjs';

const PINS=Object.freeze({
  'scripts/phmp3_contract.mjs':'f7f3a3a9a2a02f760a138839016a48b3d791fb9e',
  'scripts/phmp3_memories.mjs':'94f359dac804865ae7d3e9ab71238615c1305adc',
  'scripts/test_phmp3_memories.mjs':'f43fe2fe4ad355d58b8d16cbdc5791427e51b177',
  'experiments/PHMP1/PHMP3_PROTOCOL.md':'1509182be329a2f52d94efbce2793ee6e6c5786d'
});
const projectRoot=new URL('../',import.meta.url);
const sha256=data=>createHash('sha256').update(data).digest('hex');
const gitBlobHash=buf=>createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
function verifyFreeze(){
  const checked={};
  for(const [path,wanted] of Object.entries(PINS)){
    const bytes=readFileSync(new URL(path,projectRoot));
    const actual=gitBlobHash(bytes);
    assert.equal(actual,wanted,'freeze failure: '+path+' changed. DO NOT SCORE RESERVED DATA.');
    checked[path]={git_blob_sha1:actual,sha256:sha256(bytes),bytes:bytes.length};
  }
  assert.equal(PROTOCOL.version,'0.1.0');
  assert.deepEqual(PROTOCOL.budgets_bytes,[1,2,4]);
  assert.deepEqual(PROTOCOL.query_moduli,[2,3]);
  assert.deepEqual(PROTOCOL.query_vectors,[[1,0],[0,1]]);
  assert.equal(PROTOCOL.samples.holdout,512);
  assert.equal(PROTOCOL.splits.holdout,203);
  assert.deepEqual(MODEL_SPECS.map(m=>m.id),[
    'classical-exact','nbg-typed-interfaces','mod2-only','mod3-only',
    'recent-events-packed','recent-events-two-byte','whole-interleaving'
  ]);
  return checked;
}
function argsParse(argv){
  if(argv.length===1&&argv[0]==='--verify-freeze')return {checkOnly:true};
  if(argv.length===4&&argv[0]==='--execute-reserved'&&argv[1]==='--ack-once'&&argv[2]==='--out'&&argv[3]?.trim())
    return {checkOnly:false,path:argv[3]};
  throw Error('usage: node scripts/run_phmp3_e2.mjs --verify-freeze  OR  node scripts/run_phmp3_e2.mjs --execute-reserved --ack-once --out NEW_RECEIPT.json');
}
const opts=argsParse(process.argv.slice(2));
const checked=verifyFreeze();
if(opts.checkOnly){
  console.log('PHMP-3 E2 FREEZE VERIFIED; no reserved data generated or scored.');
  console.log('Pinned E1 source Git blob hashes:',JSON.stringify(Object.fromEntries(Object.entries(checked).map(([k,v])=>[k,v.git_blob_sha1]))));
  process.exit(0);
}

// Execution below only occurs after explicit intentional command; no E0/E1/CI test calls it.
const start=performance.now();
const histories=generateSplit('holdout');
assert.equal(histories.length,512,'reserved count must remain frozen');
const dataSha256=sha256(JSON.stringify(histories));
const runResults=[];
const vEq=(x,y)=>Array.isArray(x)&&x.length===y.length&&x.every((z,i)=>z===y[i]);

// Deterministic HISTORY-LEVEL bootstrap, not falsely independent query bootstrap.
function ci95(historyFractions,seed=1099,reps=1000){
  let state=seed>>>0, pick=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  const samples=[];
  for(let b=0;b<reps;b++){
    let sum=0;
    for(let i=0;i<historyFractions.length;i++)sum+=historyFractions[pick()%historyFractions.length];
    samples.push(sum/historyFractions.length);
  }
  samples.sort((a,b)=>a-b);
  return [samples[Math.floor(reps*.025)],samples[Math.ceil(reps*.975)-1]];
}
for(const budget of PROTOCOL.budgets_bytes){
  for(const spec of availableModels(budget)){
    const t0=performance.now(),grouped={},historyFractions=[];
    let total=0,correct=0,abstained=0,postCommitErrors=0;
    for(const row of histories){
      const candidate=makeStreamingMemory(spec,budget);
      for(const event of row.events)candidate.accept(event);
      const committed=candidate.commit();
      assert.ok(committed instanceof Uint8Array);
      assert.equal(committed.length,budget,'active memory budget exceeded');
      assert.throws(()=>candidate.accept(row.events[0]),'postcommit write must fail');
      postCommitErrors++;
      let rowCorrect=0;
      // Queries generated from the oracle ONLY AFTER the model commits.
      const questions=queriesFor(row);
      assert.equal(questions.length,4);
      for(const {p,v,expected} of questions){
        const predicted=answerFromCommitted(spec,committed,p,v);
        const noAnswer=predicted===null;
        const hit=!noAnswer&&vEq(predicted,expected);
        const byModulus=grouped[p]??={correct:0,total:0,abstained:0};
        byModulus.correct+=Number(hit);
        byModulus.total++;
        byModulus.abstained+=Number(noAnswer);
        total++;
        correct+=Number(hit);
        abstained+=Number(noAnswer);
        rowCorrect+=Number(hit);
      }
      historyFractions.push(rowCorrect/4);
    }
    const accuracy=correct/total;
    const interval=ci95(historyFractions);
    runResults.push({
      model:spec.id,role:spec.role,budget_bytes:budget,
      reported_information_bytes:spec.usedBytes,codebook_lower_bound_bytes:modelCodebookMinimumBytes(spec),
      histories:histories.length,queries:total,correct,abstained,
      accuracy,abstention_rate:abstained/total,
      by_modulus:grouped,history_level_mean:historyFractions.reduce((s,x)=>s+x,0)/historyFractions.length,
      history_level_bootstrap_ci95:interval,post_commit_writes_rejected:postCommitErrors,
      // Execution time is emitted separately and not part of the canonical result.
      _elapsed_ms:performance.now()-t0
    });
  }
}
const exact=runResults.filter(x=>x.model==='classical-exact'||x.model==='nbg-typed-interfaces');
for(const r of exact){
  assert.equal(r.accuracy,1,'invalid E2 if exact baseline fails: '+r.model);
  assert.equal(r.abstained,0);
}
const get=(id,budget)=>runResults.find(r=>r.model===id&&r.budget_bytes===budget);
for(const budget of [2,4]){
  assert.deepEqual(get('classical-exact',budget).by_modulus,get('nbg-typed-interfaces',budget).by_modulus);
  assert.equal(get('mod2-only',budget).by_modulus[3].abstained,1024/2);
  assert.equal(get('mod3-only',budget).by_modulus[2].abstained,1024/2);
}
const telemetry={node:process.version,platform:process.platform,arch:process.arch,
  elapsed_ms:performance.now()-start,
  per_candidate:runResults.map(r=>({model:r.model,budget_bytes:r.budget_bytes,elapsed_ms:r._elapsed_ms}))};
const canonicalResults=runResults.map(({_elapsed_ms,...r})=>r);
const receipt={
  experiment:'PHMP-3 E2 reserved first-pass result',origin:'SIMULATED',authority:'NONE',
  protocol_version:PROTOCOL.version,source_pins:checked,
  reserved_seed:203,reserved_histories:512,reserved_dataset_sha256:dataSha256,
  late_queries_per_history:4,history_unit_of_resampling:true,bootstrap_seed:1099,bootstrap_resamples:1000,
  results:canonicalResults,
  verdict:'VALID_SYNTHETIC_NULL: classical exact = typed-interface exact at >=2 bytes',
  nonclaims:'no statistically distinct advantage, no total memory cost advantage, no quantum/Dirac/physical validation',
  first_pass_caveat:'public seed and auditable script, not cryptographically blinded. Subsequent reruns must not be called fresh holdouts.'
};
const canonicalDigest=sha256(JSON.stringify(receipt));
// Never overwrite and never auto-create directories; if writing fails report as a failure.
writeFileSync(opts.path,JSON.stringify({receipt,receipt_sha256:canonicalDigest,telemetry},null,2)+'\n',{flag:'wx'});
console.log('PHMP-3 E2 RESERVED SCORING COMPLETE. This reserved dataset is now SPENT.');
console.log('Reserved dataset SHA256:',dataSha256);
console.log('Exact two-byte baseline and NBG-inspired typed counterpart: 100% TIE.');
console.log('Budget 2 summary:',JSON.stringify(canonicalResults.filter(x=>x.budget_bytes===2).map(x=>({
  id:x.model,correct:x.correct,queries:x.queries,accuracy:x.accuracy,abstained:x.abstained,CI:x.history_level_bootstrap_ci95
}))));
console.log('Receipt SHA256:',canonicalDigest);
console.log('Receipt path:',opts.path);
