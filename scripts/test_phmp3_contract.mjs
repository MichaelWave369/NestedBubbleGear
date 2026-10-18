import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { PROTOCOL,generateSplit,outerFromEvents,answer,queriesFor,matrixMul,inverse } from './phmp3_contract.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const train=generateSplit('train'),validation=generateSplit('validation');
assert.equal(train.length,256);assert.equal(validation.length,128);
assert.equal(hash(train),hash(generateSplit('train')));assert.equal(hash(validation),hash(generateSplit('validation')));
const keys=new Set();const counts={};let checked=0;
for(const row of [...train,...validation]){
  assert.equal(row.events.filter(e=>e.lane===0).length>0,true);
  assert.equal(row.events.filter(e=>e.lane===1).length>0,true);
  const each=[0,0];for(const e of row.events){assert.equal(e.seq,each[e.lane]++);assert.ok(PROTOCOL.tokens.includes(e.token));}
  const key=JSON.stringify(row.events);assert.ok(!keys.has(key),'duplicate stream');keys.add(key);
  const q=queriesFor(row);assert.equal(q.length,4);
  for(const entry of q){
    assert.deepEqual(entry.expected,answer(row.events,entry.p,entry.v));
    assert.ok(entry.expected.every(x=>Number.isInteger(x)&&x>=0&&x<entry.p));
    checked++;
  }
  counts[row.regime]=(counts[row.regime]||0)+1;
  assert.deepEqual(outerFromEvents(row.events,2),outerFromEvents(structuredClone(row.events),2));
  assert.deepEqual(outerFromEvents(row.events,3),outerFromEvents(structuredClone(row.events),3));
  // Cross-lane interleaving is not part of the target; each lane's internal order is.
  const canonicalInterleaving=[...row.events.filter(e=>e.lane===0),...row.events.filter(e=>e.lane===1)];
  for(const p of [2,3])assert.deepEqual(outerFromEvents(row.events,p),outerFromEvents(canonicalInterleaving,p));
  // Append an exact adjacent inverse pair to one lane without changing the transport.
  const compensated=[...row.events,{lane:0,seq:each[0],token:'A'},{lane:0,seq:each[0]+1,token:'a'}];
  for(const p of [2,3])assert.deepEqual(outerFromEvents(row.events,p),outerFromEvents(compensated,p));
}
for(const p of [2,3,6]){
  const I=[1,0,0,1],A=[1,1,0,1],a=[1,-1,0,1];
  assert.deepEqual(matrixMul(A,inverse(A,p),p),I);
  assert.deepEqual(matrixMul(A,a,p),I);
  // With zero connector histories, AH10 outer equals C B A.
  assert.deepEqual(outerFromEvents([],p),matrixMul(matrixMul([2,1,1,1],[1,0,1,1],p),A,p));
}
for(const bad of [ [{lane:0,seq:1,token:'A'}], [{lane:3,seq:0,token:'B'}], [{lane:1,seq:0,token:'INVALID'}] ])
  assert.throws(()=>outerFromEvents(bad,2));
// Within-lane order is genuinely relevant; AB and BA are distinguishable.
for(const p of [2,3])assert.notDeepEqual(
  outerFromEvents([{lane:0,seq:0,token:'A'},{lane:0,seq:1,token:'B'}],p),
  outerFromEvents([{lane:0,seq:0,token:'B'},{lane:0,seq:1,token:'A'}],p));
// E0 only validates train and validation; reserved split is NEVER called here.
const receipt={experiment:'PHMP-3 E0 prospective fixture-contract qualification',origin:'SIMULATED',authority:'NONE',
  status:'TRAIN_VALIDATION_ONLY; NO HOLDOUT SCORING',version:PROTOCOL.version,
  budgets_bytes:PROTOCOL.budgets_bytes,train_count:train.length,validation_count:validation.length,
  total_fixture_queries:checked,regime_counts:counts,
  train_dataset_sha256:hash(train),validation_dataset_sha256:hash(validation),
  caveat:'No model is scored, no held-out outcomes examined, no NBG performance claim.'};
const digest=hash(receipt);
if(process.argv.length>2){assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});}
console.log('PHMP-3 E0 PASS: contract/train-validation fixture checks '+checked+' query labels; no holdout scoring.');
console.log('receipt_sha256: '+digest);
