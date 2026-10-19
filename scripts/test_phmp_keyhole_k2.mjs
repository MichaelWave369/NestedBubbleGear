import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Keyhole Budget K2 E1: discrete-time Bayesian observation with permission,
// known sensor-quality drift, delivery delays and immutable issuance receipts.
// Full test: TRAIN+VALIDATION only. Reserved seed 423 is never generated.
const EPOCHS=18,MAX_COST=14,STOP=.98;
const COST=Object.freeze({X:1,Z:2});
const DELAY=Object.freeze({X:2,Z:3});
const SENSORS=Object.freeze(['X','Z']);
const CONTEXTS=Object.freeze({
  coherence:{h0:{v:.90,gamma:0},h1:{v:.90,gamma:.65}},
  visibility:{h0:{v:.55,gamma:0},h1:{v:.95,gamma:0}}
});
const QUALITY=Object.freeze([.96,.70,.16,.28,.85,.42,.97,.23,.73]);
const SPLITS=Object.freeze({
  train:{seed:421,perClass:48},
  validation:{seed:422,perClass:64},
  reserved:{seed:423,perClass:128}
});
const POLICIES=Object.freeze(['bayes-delay-aware','nbg-provenance-keyhole','fixed-X','fixed-Z','alternating']);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-12,label+': '+a+' vs '+b);
const sig=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
const ent=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const permit=(t,sensor)=>{
  if(sensor==='X')return t%9!==3&&t%9!==4;
  if(sensor==='Z')return t%9!==0&&t%9!==1&&t%9!==7;
  throw Error('invalid sensor');
};
// Context and public time-dependent sensor quality are known to every policy.
// True hypothesis is NOT accessible to policies.
function likelihood(context,t,sensor,label){
  assert.ok(has(CONTEXTS,context)&&Number.isInteger(t)&&t>=0&&t<EPOCHS);
  const state=CONTEXTS[context][label?'h1':'h0'];
  const corr=sensor==='X'?state.v*state.gamma:state.v;
  return (1+QUALITY[t%QUALITY.length]*corr)/2;
}
function infoPerCost(context,t,sensor,logOdds){
  const q=sig(logOdds),p0=likelihood(context,t,sensor,0),p1=likelihood(context,t,sensor,1);
  const p=(1-q)*p0+q*p1;
  const bits=Math.max(0,ent(p)-(1-q)*ent(p0)-q*ent(p1));
  // Both policies know the delay and cannot spend on evidence due after deadline.
  const availableAfter=EPOCHS-(t+DELAY[sensor]);
  const deadlineFactor=availableAfter>=0?1/(1+0.10*DELAY[sensor]):0;
  return bits*deadlineFactor/COST[sensor];
}
const validAction=(t,sensor,cost)=>permit(t,sensor)&&cost+COST[sensor]<=MAX_COST&&t+DELAY[sensor]<=EPOCHS;
function choose(policy,context,t,logOdds,cost,counts){
  const options=SENSORS.filter(s=>validAction(t,s,cost));
  if(!options.length)return null;
  if(policy==='fixed-X')return options.includes('X')?'X':null;
  if(policy==='fixed-Z')return options.includes('Z')?'Z':null;
  if(policy==='alternating'){
    const preference=(counts.X+counts.Z)%2?'Z':'X';
    return options.includes(preference)?preference:options[0];
  }
  if(policy==='bayes-delay-aware'||policy==='nbg-provenance-keyhole'){
    const best=options.reduce((cur,s)=>{
      const value=infoPerCost(context,t,s,logOdds);
      return cur===null || value>infoPerCost(context,t,cur,logOdds)+1e-14?s:cur;
    },null);
    return infoPerCost(context,t,best,logOdds)>1e-8?best:null;
  }
  throw Error('unknown policy');
}
function random(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function caseSeed(base,contextIndex,label,id,t,sensor){
  return (base ^ Math.imul(contextIndex+1,0x9e3779b9) ^
    Math.imul(label+1,0x85ebca6b) ^ Math.imul(id+1,0xc2b2ae35) ^
    Math.imul(t+1,0x27d4eb2f) ^ Math.imul(sensor==='X'?1:2,0x165667b1))>>>0;
}
function buildCases(split){
  if(!['train','validation'].includes(split))throw Error('K2 reserved data cannot be generated during E1');
  const cases=[],meta=SPLITS[split];
  Object.keys(CONTEXTS).forEach((context,contextIndex)=>{
    for(let label=0;label<2;label++)for(let id=0;id<meta.perClass;id++){
      // World owns latent observations, never exposed to a policy.
      const potential=Object.fromEntries(SENSORS.map(sensor=>[sensor,
        Array.from({length:EPOCHS},(_,t)=>Number(
          random(caseSeed(meta.seed,contextIndex,label,id,t,sensor))()<
          likelihood(context,t,sensor,label)))]));
      cases.push({split,context,label,id,potential});
    }
  });
  return cases;
}
const receiptId=(context,t,sensor)=>context+':'+t+':'+sensor;
function issue(context,t,sensor,observed,costBefore){
  if(!validAction(t,sensor,costBefore))throw Error('unauthorized, late, or overbudget observation');
  if(observed!==0&&observed!==1)throw Error('invalid measurement outcome');
  const entry={
    id:receiptId(context,t,sensor),context,sensor,issued_at:t,due_at:t+DELAY[sensor],
    authorized_at_issue:permit(t,sensor),cost:COST[sensor],
    p0:likelihood(context,t,sensor,0),p1:likelihood(context,t,sensor,1),observed
  };
  return Object.freeze(entry);
}
function audit(entry,context,t,seen){
  if(!entry||entry.context!==context||!SENSORS.includes(entry.sensor)||
    !Number.isInteger(entry.issued_at)||!Number.isInteger(entry.due_at)||
    !entry.authorized_at_issue||!permit(entry.issued_at,entry.sensor)||
    entry.due_at!==entry.issued_at+DELAY[entry.sensor]||entry.due_at!==t||
    entry.id!==receiptId(context,entry.issued_at,entry.sensor)||
    entry.cost!==COST[entry.sensor]||(entry.observed!==0&&entry.observed!==1)||
    seen.has(entry.id)||Math.abs(entry.p0-likelihood(context,entry.issued_at,entry.sensor,0))>1e-15||
    Math.abs(entry.p1-likelihood(context,entry.issued_at,entry.sensor,1))>1e-15)
    throw Error('provenance/causality/permission failure');
  seen.add(entry.id);
}
function update(logOdds,entry){
  const p0=entry.p0,p1=entry.p1;
  return logOdds+Math.log(entry.observed?p1/p0:(1-p1)/(1-p0));
}
function evaluate(data,policy){
  let logOdds=0,cost=0,delivered=0,issued=0,revokedSkipped=0;
  const counts={X:0,Z:0},pending=[],seen=new Set(),actions=[];
  for(let t=0;t<=EPOCHS;t++){
    // First deliver ONLY the evidence that becomes available at t.
    for(const entry of pending.filter(e=>e.due_at===t)){
      audit(entry,data.context,t,seen);
      logOdds=update(logOdds,entry);
      delivered++;
    }
    if(t===EPOCHS)break;
    if(sig(logOdds)>=STOP||sig(logOdds)<=1-STOP)continue;
    if(!permit(t,'X')||!permit(t,'Z'))revokedSkipped++;
    const sensor=choose(policy,data.context,t,logOdds,cost,counts);
    if(sensor===null)continue;
    const outcome=data.potential[sensor][t]; // world supplied only upon legal issuance
    const entry=issue(data.context,t,sensor,outcome,cost);
    pending.push(entry);
    actions.push({issued_at:t,due_at:entry.due_at,sensor});
    cost+=COST[sensor]; counts[sensor]++; issued++;
    assert.ok(cost<=MAX_COST,'cost overrun');
  }
  assert.equal(issued,delivered,'every committed observation delivered before end');
  assert.equal(seen.size,delivered,'no duplicate or premature receipt');
  assert.equal(cost,counts.X*COST.X+counts.Z*COST.Z);
  const probability=sig(logOdds),prediction=Number(probability>=.5);
  return {
    prediction,correct:Number(prediction===data.label),posterior:probability,cost,
    issued,delivered,counts,actions,revokedSkipped,
    highConfidence:probability>=STOP||probability<=1-STOP
  };
}
// Sanity: sensor informativeness changes with public quality and context.
close(likelihood('coherence',0,'Z',0),likelihood('coherence',0,'Z',1),'coherence Z null');
close(likelihood('visibility',0,'X',0),likelihood('visibility',0,'X',1),'visibility X null');
assert.ok(infoPerCost('coherence',0,'X',0)>0);
assert.ok(infoPerCost('visibility',2,'Z',0)>0);
assert.ok(infoPerCost('coherence',2,'X',0)<infoPerCost('coherence',0,'X',0));
assert.equal(choose('bayes-delay-aware','coherence',0,0,0,{X:0,Z:0}),'X');
assert.equal(choose('bayes-delay-aware','visibility',0,0,0,{X:0,Z:0}),null,'Z revoked at t=0; X uninformative');
assert.equal(choose('bayes-delay-aware','visibility',2,0,0,{X:0,Z:0}),'Z');

// Explicit tampering, missing permission and anti-hindsight checks.
const authentic=issue('coherence',0,'X',1,0);
audit(authentic,'coherence',DELAY.X,new Set());
assert.throws(()=>audit({...authentic,p1:authentic.p1+.01},'coherence',DELAY.X,new Set()));
assert.throws(()=>audit(authentic,'coherence',DELAY.X-1,new Set()));
assert.throws(()=>audit({...authentic,id:'rewritten'},'coherence',DELAY.X,new Set()));
assert.throws(()=>audit({...authentic,authorized_at_issue:false},'coherence',DELAY.X,new Set()));
const replaySeen=new Set();audit(authentic,'coherence',DELAY.X,replaySeen);
assert.throws(()=>audit(authentic,'coherence',DELAY.X,replaySeen));
assert.throws(()=>issue('coherence',3,'X',1,0),'revoked at issuance');
assert.throws(()=>issue('visibility',0,'Z',1,0),'revoked at issuance');
assert.throws(()=>issue('coherence',EPOCHS-1,'X',1,0),'arrives after deadline');

// Positive control: evidence may arrive after NEW issuance was revoked,
// because it was validly authorized when issued and has an immutable receipt.
const beforeRevocation=issue('coherence',2,'X',1,0);
assert.equal(permit(4,'X'),false);
audit(beforeRevocation,'coherence',4,new Set());

const rows=[],datasets={train:buildCases('train'),validation:buildCases('validation')};
assert.equal(datasets.train.length,192);
assert.equal(datasets.validation.length,256);
for(const [split,data] of Object.entries(datasets)){
  assert.equal(digest(buildCases(split)),digest(data),'dataset reproducibility');
  for(const policy of POLICIES){
    let correct=0,cost=0,issued=0,delivered=0,highConfidence=0;
    const byContext={};
    for(const trial of data){
      const score=evaluate(trial,policy);
      assert.deepEqual(evaluate(trial,policy),score,'deterministic replay');
      if(policy==='nbg-provenance-keyhole')
        assert.deepEqual(score,evaluate(trial,'bayes-delay-aware'),'typed implementation must tie conventional baseline');
      const item=byContext[trial.context]??={n:0,correct:0,cost:0};
      item.n++;item.correct+=score.correct;item.cost+=score.cost;
      correct+=score.correct;cost+=score.cost;issued+=score.issued;
      delivered+=score.delivered;highConfidence+=Number(score.highConfidence);
      // Coarse policy audits have exactly the same valid access controls.
      assert.ok(score.actions.every(a=>permit(a.issued_at,a.sensor)&&a.due_at<=EPOCHS));
    }
    rows.push({split,policy,cases:data.length,correct,accuracy:correct/data.length,
      mean_cost:cost/data.length,mean_delivered:delivered/data.length,
      mean_issued:issued/data.length,high_confidence_fraction:highConfidence/data.length,
      illustrative_risk:10*(1-correct/data.length)+.03*cost/data.length,
      by_context:Object.fromEntries(Object.entries(byContext).map(([key,item])=>[key,{
        cases:item.n,correct:item.correct,accuracy:item.correct/item.n,mean_cost:item.cost/item.n}]))
    });
  }
}
for(const split of ['train','validation']){
  const bayes=rows.find(x=>x.split===split&&x.policy==='bayes-delay-aware');
  const nbg=rows.find(x=>x.split===split&&x.policy==='nbg-provenance-keyhole');
  assert.deepEqual({...bayes,policy:'nbg-provenance-keyhole'},nbg,'no NBG-specific advantage');
}
const receipt={
  experiment:'PHMP Keyhole Budget K2 E1: temporal access and delayed-observation pilot',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  protocol:{epochs:EPOCHS,max_cost:MAX_COST,confidence_stop:STOP,quality_schedule:QUALITY,
    sensor_costs:COST,sensor_delays:DELAY,permission:'X revoked t mod 9 =3,4; Z revoked t mod 9 =0,1,7',
    scenarios:CONTEXTS,splits:SPLITS,policies:POLICIES},
  source_scope:'TRAIN_VALIDATION_ONLY; reserved seed 423 and PHMP3 E2 seed 203 NOT GENERATED',
  datasets:Object.fromEntries(Object.entries(datasets).map(([split,data])=>[split,{n:data.length,sha256:digest(data)}])),
  results:rows,
  verdict:'CONVENTIONAL_ADAPTIVE_BAYES_POLICY_TIES_NBG_TYPED_POLICY_BY_CONSTRUCTION',
  limits:'known likelihoods and public quality/permissions; greedy information policy not proven optimal POMDP; no measured hardware cost or NBG-specific advance'
};
const sha256=digest(receipt);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256},null,2)+'\n',{flag:'wx'});
}
console.log('K2 E1 PASS: '+datasets.train.length+' training, '+datasets.validation.length+' validation; '+rows.length+' summaries.');
console.log('VALIDATION '+JSON.stringify(rows.filter(r=>r.split==='validation').map(r=>({policy:r.policy,accuracy:r.accuracy,mean_cost:r.mean_cost}))));
console.log('NO RESERVED SCORING; NBG typed controller uses exactly the conventional Bayesian selection rule.');
console.log('receipt_sha256 '+sha256);
