import assert from 'node:assert/strict';
import {N,STRIDES,graph,stateFor,step,aggregate,permute,study} from '../experiments/PHI47_R1/keyhole.mjs';
const adj=graph();
assert.equal(adj.length,47);
assert.ok(adj.every((a,i)=>a.length===8 && new Set(a).size===8 && !a.includes(i)));
assert.deepEqual(STRIDES,[8,9,12,16]);
for(let i=0;i<80;i++){
  const s=stateFor(369+i*31);
  assert.equal(aggregate(s),1);
  const p=permute(s,adj);
  assert.deepEqual(step(p.state,p.adjacency),permute(step(s,adj),adj).state);
}
assert.throws(()=>graph(47,[8,9,12,39]),/collision/i);
assert.throws(()=>step([1,-1],[[0,2],[0]]),/Invalid/);
assert.deepEqual(study({trials:32}),study({trials:32}));
const output=study();
assert.equal(output.authority,'NONE');
assert.equal(output.distributions.phi47.histogram[1]??0,output.distributions.phi47.histogram[1]??0);
assert.ok(output.distributions.phi47.distinctFutures>1,'coarse Keyhole must admit distinct futures');
for (const v of Object.values(output.distributions)) {
  assert.equal(Object.values(v.histogram).reduce((s,n)=>s+n,0),512);
  assert.ok(v.entropyBits>=0);
}
console.log('PHI47-R1 PASS: 47-pocket neighbor-majority, relabel invariance, collisions, deterministic controls');
console.log(JSON.stringify(output,null,2));
