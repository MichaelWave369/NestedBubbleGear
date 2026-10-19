import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP Keyhole Budget K3 E1. Purely simulated classification and calibration.
// The model never sees the episode's true label or true sensor reliability.
// No PHMP3 E2, K1, K2 or K3 reserved cohort is generated here.
const TICKS=14, BUDGET=12, STOP=.96;
const RATES=Object.freeze([.55,.90]);
const SENSORS=Object.freeze(['X','Z']);
const MODES=Object.freeze(['target','calibrate']);
const COST=Object.freeze({target:2,calibrate:1});
const DELAY=Object.freeze({target:1,calibrate:2});
const SPLITS=Object.freeze({train:{seed:431,nPerStratum:48},validation:{seed:432,nPerStratum:64},reserved:{seed:433,nPerStratum:128}});
const POLICIES=Object.freeze(['bayes-joint-info','nbg-typed-provenance','bayes-target-info','bayes-calibrate-first','fixed-X-target','fixed-Z-target']);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const present=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const near=(x,y,name)=>assert.ok(Math.abs(x-y)<1e-11,name+': '+x+' != '+y);
const priorStates=[];
for(let label=0;label<2;label++)for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++)priorStates.push(Object.freeze({label,q:{X:RATES[ix],Z:RATES[iz]}}));
const initial=()=>Array(8).fill(1/8);
const entropy=x=>x<=0||x>=1?0:-x*Math.log2(x)-(1-x)*Math.log2(1-x);
const H=weights=>-weights.reduce((sum,p)=>sum+(p>0?p*Math.log2(p):0),0);
const labelPosterior=w=>w.reduce((sum,p,i)=>sum+p*priorStates[i].label,0);
const authorized=(t,s)=>s==='X'?t%7!==2:s==='Z'?t%7!==0&&t%7!==5:false;
const available=(t,s,mode,spent)=>authorized(t,s)&&spent+COST[mode]<=BUDGET&&t+DELAY[mode]<=TICKS;
const observableLabel=(state,mode)=>mode==='calibrate'?1:state.label;
const likelihoodPlus=(state,sensor,mode)=>observableLabel(state,mode)?state.q[sensor]:1-state.q[sensor];
function nextBelief(belief,sensor,mode,reading){
  const newWeights=belief.map((w,i)=>w*(reading?likelihoodPlus(priorStates[i],sensor,mode):1-likelihoodPlus(priorStates[i],sensor,mode)));
  const normalizer=newWeights.reduce((a,b)=>a+b,0);
  assert.ok(normalizer>0,'impossible Bayesian evidence');
  return newWeights.map(w=>w/normalizer);
}
function information(belief,sensor,mode,kind){
  const pPlus=belief.reduce((sum,p,i)=>sum+p*likelihoodPlus(priorStates[i],sensor,mode),0);
  const before=kind==='target'?entropy(labelPosterior(belief)):H(belief);
  let after=0;
  for(const y of [0,1]){
    const p=y?pPlus:1-pPlus;
    const updated=nextBelief(belief,sensor,mode,y);
    after+=p*(kind==='target'?entropy(labelPosterior(updated)):H(updated));
  }
  return Math.max(0,before-after);
}
const score=(belief,sensor,mode,kind)=>information(belief,sensor,mode,kind)/COST[mode]/(1+0.1*DELAY[mode]);
const receiptKey=(t,s,m)=>t+':'+s+':'+m;
function issue(t,s,mode,observed,spent){
  if(!SENSORS.includes(s)||!MODES.includes(mode)||!available(t,s,mode,spent))throw Error('Unauthorized/late/overbudget issuance');
  if(observed!==0&&observed!==1)throw Error('invalid reading');
  return Object.freeze({id:receiptKey(t,s,mode),sensor:s,mode,issued_at:t,due_at:t+DELAY[mode],
    authorized_at_issue:true,cost:COST[mode],reference_label:mode==='calibrate'?1:null,observed});
}
function audit(receipt,now,seen){
  if(!receipt||!SENSORS.includes(receipt.sensor)||!MODES.includes(receipt.mode)||
    !Number.isInteger(receipt.issued_at)||receipt.issued_at<0||receipt.issued_at>=TICKS||
    receipt.due_at!==receipt.issued_at+DELAY[receipt.mode]||receipt.due_at!==now||
    receipt.id!==receiptKey(receipt.issued_at,receipt.sensor,receipt.mode)||
    !receipt.authorized_at_issue||!authorized(receipt.issued_at,receipt.sensor)||
    receipt.cost!==COST[receipt.mode]||receipt.reference_label!==(receipt.mode==='calibrate'?1:null)||
    ![0,1].includes(receipt.observed)||seen.has(receipt.id))throw Error('Invalid receipt');
  seen.add(receipt.id);
}
function choose(policy,belief,t,spent,calibrations){
  const options=[];
  for(const sensor of SENSORS)for(const mode of MODES)if(available(t,sensor,mode,spent))options.push({sensor,mode});
  if(!options.length)return null;
  if(policy==='fixed-X-target'||policy==='fixed-Z-target'){
    const s=policy==='fixed-X-target'?'X':'Z';
    return options.find(o=>o.sensor===s&&o.mode==='target')??null;
  }
  if(policy==='bayes-calibrate-first'){
    const preferred=calibrations.X<2?'X':calibrations.Z<2?'Z':null;
    if(preferred){const c=options.find(o=>o.sensor===preferred&&o.mode==='calibrate');if(c)return c;}
    policy='bayes-target-info';
  }
  if(['bayes-joint-info','nbg-typed-provenance','bayes-target-info'].includes(policy)){
    const kind=policy==='bayes-target-info'?'target':'joint';
    let best=null,bestValue=1e-12;
    for(const o of options){
      if(kind==='target'&&o.mode==='calibrate')continue;
      const value=score(belief,o.sensor,o.mode,kind);
      if(value>bestValue+1e-12){best=o;bestValue=value;}
    }
    return best;
  }
  throw Error('Unsupported policy');
}
function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function caseSeed(seed,ix,iz,label,id,t,s,mode){
  return (seed^Math.imul(ix+1,0x9e3779b9)^Math.imul(iz+1,0x85ebca6b)^
    Math.imul(label+1,0xc2b2ae35)^Math.imul(id+1,0x27d4eb2f)^
    Math.imul(t+1,0x165667b1)^Math.imul(s==='X'?1:2,0xd3a2646c)^
    Math.imul(mode==='target'?1:2,0xfd7046c5))>>>0;
}
function fixtures(split){
  if(!['train','validation'].includes(split))throw Error('Reserved K3 cohort forbidden during E1');
  const cfg=SPLITS[split],cases=[];
  for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++)for(let label=0;label<2;label++)
    for(let id=0;id<cfg.nPerStratum;id++){
      const trueRates={X:RATES[ix],Z:RATES[iz]},world={};
      for(const sensor of SENSORS)for(const mode of MODES){
        const k=sensor+':'+mode;
        world[k]=Array.from({length:TICKS},(_,t)=>{
          const isCorrect=rng(caseSeed(cfg.seed,ix,iz,label,id,t,sensor,mode))()<trueRates[sensor];
          const trueBit=mode==='calibrate'?1:label;
          return Number(isCorrect?trueBit:1-trueBit);
        });
      }
      cases.push({split,ix,iz,label,id,world});
    }
  return cases;
}
function evaluate(fixture,policy){
  let belief=initial(),spent=0,issued=0,delivered=0;
  const pending=[],seen=new Set(),calibrations={X:0,Z:0};
  const issuedActions=[];
  for(let t=0;t<=TICKS;t++){
    for(const receipt of pending.filter(r=>r.due_at===t)){
      audit(receipt,t,seen);
      belief=nextBelief(belief,receipt.sensor,receipt.mode,receipt.observed);
      delivered++;
    }
    if(t===TICKS)break;
    const p=labelPosterior(belief);
    if(p>=STOP||p<=1-STOP)continue;
    const action=choose(policy,belief,t,spent,calibrations);
    if(!action)continue;
    const observed=fixture.world[action.sensor+':'+action.mode][t];
    const receipt=issue(t,action.sensor,action.mode,observed,spent);
    pending.push(receipt);issuedActions.push({sensor:action.sensor,mode:action.mode,issued_at:t,due_at:receipt.due_at});
    if(action.mode==='calibrate')calibrations[action.sensor]++;
    issued++;spent+=receipt.cost;
    assert.ok(spent<=BUDGET);
  }
  assert.equal(delivered,issued,'all issued evidence must arrive');
  assert.equal(seen.size,issued,'all receipts must be unique');
  const probability=labelPosterior(belief),prediction=Number(probability>=.5);
  const calCount=calibrations.X+calibrations.Z;
  const finalBeliefs={X:0,Z:0};
  belief.forEach((weight,i)=>{
    if(priorStates[i].q.X===RATES[1])finalBeliefs.X+=weight;
    if(priorStates[i].q.Z===RATES[1])finalBeliefs.Z+=weight;
  });
  return {correct:Number(prediction===fixture.label),prediction,probability,spent,
    brier:(probability-fixture.label)**2,issued,delivered,calibrations:calCount,
    final_quality_high_posterior:finalBeliefs,issuedActions};
}

// Core model and policy controls, including a calibration receipt accepted after revocation.
near(priorStates.length,8,'eight prior states');
near(initial().reduce((s,x)=>s+x,0),1,'prior sum');
near(labelPosterior(initial()),.5,'prior H=1');
for(const sensor of SENSORS){
  const q=nextBelief(initial(),sensor,'calibrate',1);
  near(labelPosterior(q),.5,'a known calibration target does not directly reveal hidden label');
  assert.ok(Math.abs(q.reduce((sum,p,i)=>sum+(priorStates[i].q[sensor]===.90?p:0),0)-.5)>0.05);
}
assert.equal(authorized(2,'X'),false);
assert.equal(authorized(0,'Z'),false);
const valid=issue(1,'X','calibrate',1,0);
const seen=new Set();audit(valid,3,seen);
assert.throws(()=>audit(valid,3,seen));
assert.throws(()=>audit(valid,2,new Set()));
assert.throws(()=>audit({...valid,id:'rewritten'},3,new Set()));
assert.throws(()=>audit({...valid,reference_label:0},3,new Set()));
assert.throws(()=>audit({...valid,observed:2},3,new Set()));
assert.throws(()=>issue(2,'X','target',1,0));
assert.throws(()=>issue(0,'Z','calibrate',1,0));
assert.throws(()=>issue(13,'X','calibrate',1,0));
// X is disabled for new requests at t=2, but calibration from t=1 is delivered at t=3.
assert.equal(authorized(2,'X'),false);
assert.ok(valid.due_at>2);
assert.deepEqual(choose('bayes-joint-info',initial(),0,0,{X:0,Z:0}),choose('nbg-typed-provenance',initial(),0,0,{X:0,Z:0}));

const datasets={train:fixtures('train'),validation:fixtures('validation')};
assert.equal(datasets.train.length,384);
assert.equal(datasets.validation.length,512);
for(const split of ['train','validation'])assert.equal(sha(fixtures(split)),sha(datasets[split]));
const rows=[];
for(const [split,cases] of Object.entries(datasets))for(const policy of POLICIES){
  let correct=0,brier=0,cost=0,calibrations=0;
  const byQuality={};
  for(const f of cases){
    const res=evaluate(f,policy);
    assert.deepEqual(res,evaluate(f,policy),'deterministic replay');
    assert.equal(res.issued,res.delivered);
    assert.ok(res.spent<=BUDGET);
    assert.ok(res.issuedActions.every(a=>authorized(a.issued_at,a.sensor)&&a.due_at<=TICKS));
    if(policy==='nbg-typed-provenance')assert.deepEqual(res,evaluate(f,'bayes-joint-info'),'typed and classical policies must tie per case');
    correct+=res.correct;brier+=res.brier;cost+=res.spent;calibrations+=res.calibrations;
    const group=byQuality['X'+f.ix+'Z'+f.iz]??={n:0,correct:0,calibrations:0};
    group.n++;group.correct+=res.correct;group.calibrations+=res.calibrations;
  }
  rows.push({split,policy,n:cases.length,correct,accuracy:correct/cases.length,
    brier:brier/cases.length,mean_cost:cost/cases.length,mean_calibration_requests:calibrations/cases.length,
    by_quality:Object.fromEntries(Object.entries(byQuality).map(([k,g])=>[k,{
      n:g.n,correct:g.correct,accuracy:g.correct/g.n,mean_calibration_requests:g.calibrations/g.n
    }]))});
}
for(const split of ['train','validation']){
  const a=rows.find(r=>r.split===split&&r.policy==='bayes-joint-info');
  const b=rows.find(r=>r.split===split&&r.policy==='nbg-typed-provenance');
  assert.deepEqual({...a,policy:'nbg-typed-provenance'},b);
}
const receipt={
  experiment:'PHMP K3 E1 Unknown Reliability / Calibrated Keyholes',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  split_policy:'train and validation only; reserved K3 seed 433 NOT generated; K1/K2/PHMP3 reserved sets untouched',
  protocol:{ticks:TICKS,budget:BUDGET,posterior_stop:STOP,rates:RATES,action_cost:COST,action_delay:DELAY,
    sensors:SENSORS,modes:MODES,splits:SPLITS,policies:POLICIES,prior:'8 joint states H x rX x rZ, each equally likely',
    access:'X banned t%7==2, Z banned t%7==0 or 5; issued evidence delivered despite future revocation'},
  datasets:Object.fromEntries(Object.entries(datasets).map(([name,cs])=>[name,{n:cs.length,sha256:sha(cs)}])),
  results:rows,verdict:'NBG-TYPED AND CLASSICAL JOINT BAYES TIE EXACTLY; NO NOVEL ADVANTAGE',
  limitations:'simulation, finite known two-point reliability prior, independent observations, structurally validated unsigned receipts; no cryptographic provenance or new physics'
};
const digest=sha(receipt);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('K3 E1 PASS: train='+datasets.train.length+', validation='+datasets.validation.length+', '+rows.length+' summary rows');
console.log('VALIDATION '+JSON.stringify(rows.filter(r=>r.split==='validation').map(r=>({policy:r.policy,accuracy:r.accuracy,brier:r.brier,mean_cost:r.mean_cost,mean_calibrations:r.mean_calibration_requests}))));
console.log('Conventional joint Bayesian and NBG typed policy TIE by construction; reserved cohorts NOT SCORED.');
console.log('receipt_sha256 '+digest);
