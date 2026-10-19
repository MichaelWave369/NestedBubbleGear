import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// K1: finite iid synthetic observer-selection task, not a physical quantum test.
// Evaluate TRAIN and VALIDATION only. Reserved seed 413 is never evaluated here.
const CONTEXTS=Object.freeze({
  coherence:{h0:{v:.90,gamma:0},h1:{v:.90,gamma:.65}},
  visibility:{h0:{v:.55,gamma:0},h1:{v:.95,gamma:0}}
});
const COST=Object.freeze({X:1,Z:2});
const BUDGET=24,CONFIDENCE=.99,LOSS_WEIGHT=10,COST_WEIGHT=.025;
const SPLITS=Object.freeze({train:{seed:411,trialsPerClass:48},validation:{seed:412,trialsPerClass:64},reserved:{seed:413,trialsPerClass:128}});
const POLICIES=Object.freeze(['bayes-information-gain','nbg-typed-keyhole','fixed-X','fixed-Z','alternating']);
const SHA=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-11,msg+': '+a+' != '+b);
const pPlus=(state,kind)=>(1+(kind==='Z'?state.v:state.v*state.gamma))/2;
const entropy=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
const posterior=logOdds=>logOdds>=0?1/(1+Math.exp(-logOdds)):Math.exp(logOdds)/(1+Math.exp(logOdds));
function infoPerCost(context,logOdds,kind){
  const prior=posterior(logOdds);
  const p0=pPlus(CONTEXTS[context].h0,kind),p1=pPlus(CONTEXTS[context].h1,kind);
  const mixture=(1-prior)*p0+prior*p1;
  const gain=entropy(mixture)-(1-prior)*entropy(p0)-prior*entropy(p1);
  return Math.max(0,gain)/COST[kind];
}
function choose(policy,context,logOdds,costSpent,counts){
  const available=['X','Z'].filter(kind=>costSpent+COST[kind]<=BUDGET);
  if(!available.length)return null;
  if(policy==='fixed-X')return available.includes('X')?'X':null;
  if(policy==='fixed-Z')return available.includes('Z')?'Z':null;
  if(policy==='alternating'){
    const requested=(counts.X+counts.Z)%2===0?'X':'Z';
    return available.includes(requested)?requested:available[0];
  }
  if(policy==='bayes-information-gain'||policy==='nbg-typed-keyhole'){
    // Explicit null: the NBG-style typed policy uses the IDENTICAL
    // information-gain decision and Bayesian update as the classical policy.
    // It cannot claim an independent or novel predictive advantage.
    return available.reduce((best,k)=>!best || infoPerCost(context,logOdds,k)>infoPerCost(context,logOdds,best)+1e-12?k:best,null);
  }
  throw Error('unknown policy');
}
function prng(seed){
  let n=seed>>>0;
  return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
}
function makeCases(split){
  if(!['train','validation'].includes(split))throw Error('reserved cohort forbidden in K1 qualification');
  const result=[];
  const {seed,trialsPerClass}=SPLITS[split];
  for(const [contextIndex,context] of Object.keys(CONTEXTS).entries())
    for(let label=0;label<=1;label++)
      for(let trial=0;trial<trialsPerClass;trial++){
        const streams={};
        for(const [kindIndex,kind] of ['X','Z'].entries()){
          const random=prng((seed ^ Math.imul(contextIndex+1,0x9e3779b9) ^
            Math.imul(label+1,0x85ebca6b) ^ Math.imul(trial+1,0xc2b2ae35) ^
            Math.imul(kindIndex+1,0x27d4eb2f))>>>0);
          const p=pPlus(label===0?CONTEXTS[context].h0:CONTEXTS[context].h1,kind);
          streams[kind]=Array.from({length:BUDGET},()=>Number(random()<p));
        }
        result.push({split,context,label,trial,streams});
      }
  return result;
}
function updatePosterior(logOdds,context,kind,observed){
  const p0=pPlus(CONTEXTS[context].h0,kind),p1=pPlus(CONTEXTS[context].h1,kind);
  return logOdds+Math.log(observed?p1/p0:(1-p1)/(1-p0));
}
function evaluate(caseData,policy){
  let logOdds=0,costSpent=0;
  const counts={X:0,Z:0};
  const chosen=[];
  for(let t=0;t<BUDGET;t++){
    const prob=posterior(logOdds);
    if(prob>=CONFIDENCE || prob<=1-CONFIDENCE)break;
    const kind=choose(policy,caseData.context,logOdds,costSpent,counts);
    if(!kind)break;
    assert.ok(costSpent+COST[kind]<=BUDGET,'over budget');
    const observed=caseData.streams[kind][counts[kind]];
    assert.ok(observed===0||observed===1);
    counts[kind]++;
    costSpent+=COST[kind];
    logOdds=updatePosterior(logOdds,caseData.context,kind,observed);
    chosen.push(kind);
  }
  const probability=posterior(logOdds),prediction=Number(probability>=.5);
  return {prediction,correct:Number(prediction===caseData.label),costSpent,
    observations:counts.X+counts.Z,counts,posterior:probability,
    sequence:chosen.join(''),stopped_confident:probability>=CONFIDENCE||probability<=1-CONFIDENCE};
}
// Contract mathematics: given the public scenarios, EXACTLY ONE readout
// is informative for each task, so the classical greedy policy is not a straw man.
near(pPlus(CONTEXTS.coherence.h0,'Z'),pPlus(CONTEXTS.coherence.h1,'Z'),'coherence Z is null');
near(pPlus(CONTEXTS.visibility.h0,'X'),pPlus(CONTEXTS.visibility.h1,'X'),'visibility X is null');
assert.ok(infoPerCost('coherence',0,'X')>0);
assert.ok(infoPerCost('visibility',0,'Z')>0);
near(infoPerCost('coherence',0,'Z'),0,'coherence Z information');
near(infoPerCost('visibility',0,'X'),0,'visibility X information');
assert.equal(choose('bayes-information-gain','coherence',0,0,{X:0,Z:0}),'X');
assert.equal(choose('bayes-information-gain','visibility',0,0,{X:0,Z:0}),'Z');
assert.equal(choose('nbg-typed-keyhole','visibility',0,0,{X:0,Z:0}),'Z');

const data={train:makeCases('train'),validation:makeCases('validation')};
assert.equal(data.train.length,192);
assert.equal(data.validation.length,256);
assert.equal(SHA(data.train),SHA(makeCases('train')),'deterministic train replay');
assert.equal(SHA(data.validation),SHA(makeCases('validation')),'deterministic validation replay');

const resultRows=[];
for(const [split,cases] of Object.entries(data)){
  for(const policy of POLICIES){
    const total={correct:0,cost:0,observations:0,confident:0,informative:0,n:0};
    const byContext={};
    for(const c of cases){
      const run=evaluate(c,policy);
      const again=evaluate(c,policy);
      assert.deepEqual(run,again,'deterministic case replay');
      assert.ok(run.costSpent<=BUDGET,'budget overflow');
      assert.equal(run.counts.X*COST.X+run.counts.Z*COST.Z,run.costSpent);
      assert.equal(run.sequence.length,run.observations);
      if(policy==='nbg-typed-keyhole')assert.deepEqual(run,evaluate(c,'bayes-information-gain'),'typed policy must explicitly tie with classical information-gain baseline');
      const group=byContext[c.context]??={n:0,correct:0,cost:0,confident:0,informative:0};
      for(const item of [total,group]){
        item.n++;item.correct+=run.correct;item.cost+=run.costSpent;
        item.confident+=Number(run.stopped_confident);
        const informative=c.context==='coherence'?run.counts.X:run.counts.Z;
        item.informative+=informative;
      }
      total.observations+=run.observations;
    }
    const contextSummaries=Object.fromEntries(Object.entries(byContext).map(([name,group])=>[name,{
      cases:group.n,correct:group.correct,accuracy:group.correct/group.n,
      mean_cost:group.cost/group.n,confident_fraction:group.confident/group.n
    }]));
    const accuracy=total.correct/total.n,meanCost=total.cost/total.n;
    resultRows.push({split,policy,cases:total.n,correct:total.correct,accuracy,mean_cost:meanCost,
      mean_observations:total.observations/total.n,confidence_stop_fraction:total.confident/total.n,
      error_cost_utility:LOSS_WEIGHT*(1-accuracy)+COST_WEIGHT*meanCost,
      by_context:contextSummaries});
  }
}
for(const split of ['train','validation']){
  const classical=resultRows.find(x=>x.split===split&&x.policy==='bayes-information-gain');
  const typed=resultRows.find(x=>x.split===split&&x.policy==='nbg-typed-keyhole');
  assert.deepEqual(typed.by_context,classical.by_context,'classical and typed policy must tie on each context');
  assert.equal(typed.accuracy,classical.accuracy);
  assert.equal(typed.mean_cost,classical.mean_cost);
}
for(const context of ['coherence','visibility']){
  for(const label of [0,1]){
    const example=data.validation.find(c=>c.context===context&&c.label===label);
    const wrong=choose('bayes-information-gain',context,0,0,{X:0,Z:0})==='X'?'Z':'X';
    let posteriorWrong=0;
    for(let i=0;i<12;i++)posteriorWrong=updatePosterior(posteriorWrong,context,wrong,example.streams[wrong][i]);
    near(posteriorWrong,0,'uninformative observer never updates posterior');
  }
}
const receipt={
  experiment:'PHMP Keyhole Budget K1 E1: synthetic observer policy controls',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  scope:'TRAIN_VALIDATION_ONLY; reserved seed 413 is public but never generated/scored',
  contexts:CONTEXTS,budgets:{measurement_cost:BUDGET,shot_cost:COST,confidence_stop:CONFIDENCE,
    loss_weight:LOSS_WEIGHT,cost_weight:COST_WEIGHT},
  split_summary:Object.fromEntries(Object.entries(data).map(([split,cases])=>[split,{n:cases.length,sha256:SHA(cases)}])),
  policies:POLICIES,
  result_rows:resultRows,
  verdict:'CLASSICAL_BASELINE_AND_NBG_TYPED_POLICY_IDENTICAL_BY_CONSTRUCTION',
  limitations:'iid synthetic parity, known hypothesis families, no real observer hardware, no novel NBG prediction, no total compute-cost measurement, PHMP-3 reserved memory split untouched'
};
const digest=SHA(receipt);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('KEYHOLE BUDGET K1 PASS: training='+data.train.length+', validation='+data.validation.length+', '+resultRows.length+' scored summary rows.');
console.log('VALIDATION:',JSON.stringify(resultRows.filter(r=>r.split==='validation').map(r=>({policy:r.policy,accuracy:r.accuracy,mean_cost:r.mean_cost,risk:r.error_cost_utility}))));
console.log('NBG typed observer TIES the classical information-gain baseline by construction; no novelty claimed.');
console.log('PHMP-3 E2 reserved histories and K1 reserved seed NOT SCORED.');
console.log('receipt_sha256: '+digest);
