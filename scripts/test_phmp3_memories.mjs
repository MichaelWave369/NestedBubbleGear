import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { PROTOCOL,generateSplit,queriesFor,answer } from './phmp3_contract.mjs';
import { MODEL_SPECS, GROUPS,availableModels,makeStreamingMemory,answerFromCommitted,modelCodebookMinimumBytes } from './phmp3_memories.mjs';

// E1 uses train + validation ONLY. It does not request or score reserved seed 203.
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const expectedCounts={train:256,validation:128};
const data={train:generateSplit('train'),validation:generateSplit('validation')};
assert.equal(data.train.length,expectedCounts.train);
assert.equal(data.validation.length,expectedCounts.validation);
assert.deepEqual([GROUPS[2].elements.length,GROUPS[3].elements.length,GROUPS[6].elements.length],[6,24,144]);
const modelSourceBytes=readFileSync(new URL('./phmp3_memories.mjs',import.meta.url)).length;
const fixtureSourceBytes=readFileSync(new URL('./phmp3_contract.mjs',import.meta.url)).length;
const sourceHashes={
  models:sha(readFileSync(new URL('./phmp3_memories.mjs',import.meta.url)).toString('utf8')),
  generator:sha(readFileSync(new URL('./phmp3_contract.mjs',import.meta.url)).toString('utf8'))
};
const telemetry=[];
const results=[];
const vectorEq=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);

for(const budget of PROTOCOL.budgets_bytes){
  for(const spec of availableModels(budget)){
    for(const split of ['train','validation']){
      const t0=performance.now(),before=process.memoryUsage().rss;
      let correct=0,abstained=0,total=0;
      const byModulus={2:{correct:0,abstained:0,total:0},3:{correct:0,abstained:0,total:0}};
      const byRegime={};
      const perHistory=[];
      for(const row of data[split]){
        const writer=makeStreamingMemory(spec,budget);
        for(const event of row.events)writer.accept(event);
        const committed=writer.commit();
        assert.equal(committed.length,budget,'exact active-state budget');
        assert.throws(()=>writer.accept(row.events[0]),'post-commit mutation must fail');
        let rowCorrect=0,rowAbstained=0;
        const q=queriesFor(row); // labels visible to scorer AFTER the candidate commits
        for(const {p,v,expected} of q){
          const predicted=answerFromCommitted(spec,committed,p,v);
          const isAbstained=predicted===null;
          const isCorrect=!isAbstained&&vectorEq(predicted,expected);
          correct+=Number(isCorrect);abstained+=Number(isAbstained);total++;
          byModulus[p].correct+=Number(isCorrect);
          byModulus[p].abstained+=Number(isAbstained);
          byModulus[p].total++;
          rowCorrect+=Number(isCorrect);rowAbstained+=Number(isAbstained);
          const regime=byRegime[row.regime]??={correct:0,total:0,abstained:0,histories:0};
          regime.correct+=Number(isCorrect);regime.total++;regime.abstained+=Number(isAbstained);
        }
        byRegime[row.regime].histories++;
        perHistory.push({id:row.id,correct:rowCorrect,abstained:rowAbstained,outOf:4});
      }
      assert.equal(total,data[split].length*4);
      const accuracy=correct/total,abstentionRate=abstained/total;
      results.push({
        spec:spec.id,role:spec.role,budget_bytes:budget,actual_information_bytes:spec.usedBytes,
        codebook_lower_bound_bytes:modelCodebookMinimumBytes(spec),
        split,histories:data[split].length,queries:total,correct,abstained,accuracy,abstentionRate,
        by_modulus:byModulus,by_regime:byRegime,
        history_level:{mean_fraction_correct:perHistory.reduce((s,x)=>s+x.correct/4,0)/perHistory.length,
          min_fraction_correct:Math.min(...perHistory.map(x=>x.correct/4))}
      });
      telemetry.push({spec:spec.id,budget,split,elapsed_ms:performance.now()-t0,
        rss_before_bytes:before,rss_after_bytes:process.memoryUsage().rss});
    }
  }
}
const get=(model,budget,split)=>results.find(x=>x.spec===model&&x.budget_bytes===budget&&x.split===split);
for(const split of ['train','validation']){
  for(const budget of [2,4]){
    assert.equal(get('classical-exact',budget,split).accuracy,1,'classical group-state ceiling must pass');
    assert.equal(get('nbg-typed-interfaces',budget,split).accuracy,1,'typed policy must tie if sufficient state');
    assert.deepEqual(get('nbg-typed-interfaces',budget,split).by_modulus,get('classical-exact',budget,split).by_modulus,'no claimed NBG-specific win');
  }
  for(const budget of [1,2,4]){
    assert.equal(get('mod2-only',budget,split).by_modulus[2].correct,get('mod2-only',budget,split).by_modulus[2].total);
    assert.equal(get('mod2-only',budget,split).by_modulus[3].abstained,get('mod2-only',budget,split).by_modulus[3].total);
  }
  for(const budget of [2,4]){
    assert.equal(get('mod3-only',budget,split).by_modulus[3].correct,get('mod3-only',budget,split).by_modulus[3].total);
    assert.equal(get('mod3-only',budget,split).by_modulus[2].abstained,get('mod3-only',budget,split).by_modulus[2].total);
  }
}
// Causal controls: cross-lane scheduling must not affect typed lane-local memory.
// Deliberately flawed whole-stream memory must be sensitive to AB versus BA.
const crossA=[{lane:0,seq:0,token:'A'},{lane:1,seq:0,token:'B'}];
const crossB=[{lane:1,seq:0,token:'B'},{lane:0,seq:0,token:'A'}];
for(const spec of MODEL_SPECS){
  const budget=spec.minimumBytes;
  const memory=events=>{const m=makeStreamingMemory(spec,budget);for(const e of events)m.accept(e);return m.commit();};
  const x=memory(crossA),y=memory(crossB);
  if(spec.kind==='whole')assert.notDeepEqual(x,y,'interleaving-dependent negative control');
  else assert.deepEqual(x,y,'typed lane products must not depend on interleaving');
  for(const p of [2,3]){
    const expected=answer(crossA,p,[1,0]);
    assert.deepEqual(answer(crossB,p,[1,0]),expected,'oracle must ignore interleaving');
  }
}
// Anti-leakage: task labels are not a fixed constant, and permuting token meanings changes some oracle outputs.
const original=[{lane:0,seq:0,token:'A'},{lane:0,seq:1,token:'B'},{lane:1,seq:0,token:'S'}];
const swapped=original.map(e=>({...e,token:e.token==='A'?'B':e.token==='B'?'A':e.token}));
assert.ok([2,3].some(p=>[[1,0],[0,1]].some(v=>!vectorEq(answer(original,p,v),answer(swapped,p,v)))),
  'label swap must change some targets');
// Canonical result excludes machine-specific telemetry to keep receipt replay-exact.
const receipt={
  experiment:'PHMP-3 E1 bounded-memory train/validation benchmark',version:'0.1.0',
  origin:'SIMULATED',authority:'NONE',
  split_scope:'TRAIN_VALIDATION_ONLY; RESERVED SPLIT NOT GENERATED OR SCORED',
  protocol_version:PROTOCOL.version,
  budgets_bytes:PROTOCOL.budgets_bytes,
  datasets:{train:{count:data.train.length,sha256:sha(data.train)},validation:{count:data.validation.length,sha256:sha(data.validation)}},
  source_sha256:sourceHashes,
  model_shared_source_bytes:modelSourceBytes,
  generator_shared_source_bytes:fixtureSourceBytes,
  table_accounting:'lower bounds count 4 bytes/matrix and 1 byte/index; JS Map and object overhead unmeasured and not claimed as physical memory savings',
  active_budget_policy:'actual typed-array length exactly budget; event history not stored in candidate; query after commit only',
  results,
  verdict:'VALID_SYNTHETIC_BASELINE_TIE; NO_NBG_SPECIFIC_ADVANTAGE_AT_2_OR_4_BYTES',
  nonclaims:'no held-out scoring, no trained models, no physical memory compression, no quantum/Dirac result'
};
const digest=sha(receipt);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');
  assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('PHMP-3 E1 PASS; train/validation only; reserved split untouched.');
console.log('Exact group baseline and typed-interface candidate tie at 100% for 2/4 bytes.');
console.log('Other models:',JSON.stringify(results.filter(x=>x.split==='validation'&&x.budget_bytes===2)
  .map(x=>({name:x.spec,accuracy:x.accuracy,abstain:x.abstentionRate}))));
console.log('model_source_bytes:',modelSourceBytes,'reported_codebook_payloads_are_lower_bounds_only');
console.log('telemetry (non-canonical):',JSON.stringify({node:process.version,machine:process.platform,
  candidates:telemetry.filter(x=>x.split==='validation'&&x.budget===2)}));
console.log('receipt_sha256:',digest);
