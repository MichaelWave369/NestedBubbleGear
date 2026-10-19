import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP Keyhole Budget K4 E1: Bayesian change-point inference vs an independently
// specified NBG-inspired TTL calibration rule. Train/validation only.
// No K4 (or K1/K2/K3/PHMP-3) reserved cohort is generated or scored.
const T=12,BUDGET=12,STOP=.97;
const SENSOR=['X','Z'],MODE=['target','calibrate'];
const RATE=[.56,.91],SWITCH=[4,8,99];
const COST=Object.freeze({target:2,calibrate:1}),DELAY=Object.freeze({target:1,calibrate:2});
const SPLIT=Object.freeze({train:{seed:441,perStratum:3},validation:{seed:442,perStratum:4},reserved:{seed:443,perStratum:8}});
const POLICIES=Object.freeze(['bayes-joint-changepoint','bayes-target-changepoint','nbg-ttl-audit','scheduled-calibration','fixed-X']);
const has=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-10,(msg||'numeric')+': '+a+' / '+b);
const stateSpace=[];
for(let h=0;h<2;h++)for(let x=0;x<2;x++)for(let z=0;z<2;z++)
  for(let sx=0;sx<3;sx++)for(let sz=0;sz<3;sz++)
    stateSpace.push(Object.freeze({h,rx:x,rz:z,sx:SWITCH[sx],sz:SWITCH[sz]}));
assert.equal(stateSpace.length,72);
const initial=()=>Array(72).fill(1/72);
const signalRate=(s,t,name)=>{
  const start=RATE[name==='X'?s.rx:s.rz],change=name==='X'?s.sx:s.sz;
  return t>=change?RATE[1-(name==='X'?s.rx:s.rz)]:start;
};
const permission=(t,s)=>s==='X'?t%6!==2:s==='Z'?t%6!==0:false;
const allowed=(t,s,mode,cost)=>permission(t,s)&&t+DELAY[mode]<=T&&cost+COST[mode]<=BUDGET;
const obsProb=(s,sensor,mode,at)=>{
  const rate=signalRate(s,at,sensor),trueBit=mode==='calibrate'?1:s.h;
  return trueBit?rate:1-rate;
};
function likelihoodUpdate(belief,sensor,mode,at,bit) {
  const weights=belief.map((p,i)=>p*(bit?obsProb(stateSpace[i],sensor,mode,at):
    1-obsProb(stateSpace[i],sensor,mode,at)));
  const mass=weights.reduce((x,y)=>x+y,0);
  assert.ok(mass>0,'measurement impossible under model');
  return weights.map(x=>x/mass);
}
const labelProb=weights=>weights.reduce((sum,w,i)=>sum+w*stateSpace[i].h,0);
const entropy=x=>-x.reduce((sum,p)=>sum+(p>0?p*Math.log2(p):0),0);
const binaryH=p=>p===0||p===1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
function information(belief,sensor,mode,t,goal) {
  const plus=belief.reduce((sum,w,i)=>sum+w*obsProb(stateSpace[i],sensor,mode,t),0);
  const prior=goal==='joint'?entropy(belief):binaryH(labelProb(belief));
  let afterward=0;
  for(const bit of [0,1]){
    const prob=bit?plus:1-plus;
    const next=likelihoodUpdate(belief,sensor,mode,t,bit);
    afterward+=prob*(goal==='joint'?entropy(next):binaryH(labelProb(next)));
  }
  return Math.max(0,prior-afterward)/(COST[mode]*(1+.10*DELAY[mode]));
}
function choose(policy,belief,t,spent,lastCalibration,scheduled,counts){
  const available=[];
  for(const s of SENSOR)for(const m of MODE)if(allowed(t,s,m,spent))available.push({s,m});
  if(!available.length)return null;
  if(policy==='fixed-X')return available.find(a=>a.s==='X'&&a.m==='target')??null;
  if(policy==='scheduled-calibration'){
    const preferred=(counts.calibrate<4&&t%3===0)?'calibrate':'target';
    const action=available.find(a=>a.m===preferred&&a.s===(counts.calibrate%2?'Z':'X'));
    if(action)return action;
    policy='bayes-target-changepoint';
  }
  if(policy==='nbg-ttl-audit'){
    // Distinct, fixed NBG-inspired interface rule, NOT a Bayesian clone:
    // do a calibration when the issued receipt for some interface is stale.
    // TTL is attached to ISSUANCE, not hindsight-retrofitted delivery time.
    for(const s of SENSOR){
      if(t-lastCalibration[s]>=4&&!scheduled[s]){
        const action=available.find(a=>a.s===s&&a.m==='calibrate');
        if(action)return action;
      }
    }
    policy='bayes-target-changepoint';
  }
  const goal=policy==='bayes-joint-changepoint'?'joint':'target';
  if(!['bayes-joint-changepoint','bayes-target-changepoint'].includes(policy))
    throw Error('unrecognized policy '+policy);
  let best=null,bestScore=1e-12;
  for(const action of available){
    const value=information(belief,action.s,action.m,t,goal);
    if(value>bestScore+1e-12){best=action;bestScore=value;}
  }
  return best;
}
const rawRng=seed=>{let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
const seedFor=(root,si,id,t,s,m)=>(root ^
  Math.imul(si+1,0x9e3779b9)^Math.imul(id+1,0x85ebca6b)^
  Math.imul(t+1,0xc2b2ae35)^Math.imul(s==='X'?1:2,0x27d4eb2f)^
  Math.imul(m==='target'?1:2,0x165667b1))>>>0;
function dataset(split){
  if(!['train','validation'].includes(split))throw Error('reserved K4 cohort forbidden in E1');
  const out=[],cfg=SPLIT[split];
  for(let si=0;si<stateSpace.length;si++)for(let id=0;id<cfg.perStratum;id++){
    const scenario=stateSpace[si],potential={};
    for(const s of SENSOR)for(const m of MODE){
      potential[s+':'+m]=Array.from({length:T},(_,t)=>{
        const p=obsProb(scenario,s,m,t);
        return Number(rawRng(seedFor(cfg.seed,si,id,t,s,m))()<p);
      });
    }
    out.push({split,si,id,trueH:scenario.h,potential,
      trueDrifts:Number(scenario.sx!==99)+Number(scenario.sz!==99)});
  }
  return out;
}
const key=(t,s,m)=>t+':'+s+':'+m;
function receipt(t,s,m,bit,spent){
  if(!MODE.includes(m)||!SENSOR.includes(s)||!allowed(t,s,m,spent)||![0,1].includes(bit))
    throw Error('unauthorized, impossible, late, or overbudget issuance');
  return Object.freeze({id:key(t,s,m),sensor:s,mode:m,issued_at:t,due_at:t+DELAY[m],
    authorized_at_issue:true,cost:COST[m],known_calibration_label:m==='calibrate'?1:null,bit});
}
function validateReceipt(r,t,seen){
  if(!r||!Number.isInteger(r.issued_at)||r.issued_at<0||r.issued_at>=T||
    !SENSOR.includes(r.sensor)||!MODE.includes(r.mode)||
    r.id!==key(r.issued_at,r.sensor,r.mode)||
    !r.authorized_at_issue||!permission(r.issued_at,r.sensor)||
    r.due_at!==r.issued_at+DELAY[r.mode]||r.due_at!==t||
    r.cost!==COST[r.mode]||r.known_calibration_label!==(r.mode==='calibrate'?1:null)||
    ![0,1].includes(r.bit)||seen.has(r.id))throw Error('invalid or noncausal receipt');
  seen.add(r.id);
}
function evaluate(trial,policy){
  let belief=initial(),spent=0,delivered=0,issued=0,calibrations=0,postSwitchCalibrations=0;
  const seen=new Set(),pending=[],issuedActions=[],lastCalibration={X:-100,Z:-100};
  const counts={calibrate:0,target:0};
  for(let t=0;t<=T;t++){
    for(const entry of pending.filter(e=>e.due_at===t)){
      validateReceipt(entry,t,seen);
      belief=likelihoodUpdate(belief,entry.sensor,entry.mode,entry.issued_at,entry.bit);
      delivered++;
    }
    if(t===T)break;
    const p=labelProb(belief);
    if(p>=STOP||p<=1-STOP)continue;
    const scheduled={X:pending.some(e=>e.sensor==='X'&&e.mode==='calibrate'&&e.due_at>t),
      Z:pending.some(e=>e.sensor==='Z'&&e.mode==='calibrate'&&e.due_at>t)};
    const a=choose(policy,belief,t,spent,lastCalibration,scheduled,counts);
    if(!a)continue;
    const entry=receipt(t,a.s,a.m,trial.potential[a.s+':'+a.m][t],spent);
    pending.push(entry);
    spent+=entry.cost;issued++;counts[a.m]++;
    if(a.m==='calibrate'){
      calibrations++;lastCalibration[a.s]=t;
      const truth=stateSpace[trial.si],sw=a.s==='X'?truth.sx:truth.sz;
      if(sw!==99&&t>=sw)postSwitchCalibrations++;
    }
    issuedActions.push({t,sensor:a.s,mode:a.m,due_at:entry.due_at});
    assert.ok(spent<=BUDGET);
  }
  assert.equal(delivered,issued,'all authorized issued evidence delivered');
  assert.equal(seen.size,issued,'no duplicate receipts');
  const p=labelProb(belief),pred=Number(p>=.5);
  return {correct:Number(pred===trial.trueH),brier:(p-trial.trueH)**2,
    pred,probability:p,spent,issued,delivered,calibrations,postSwitchCalibrations,issuedActions};
}
// Independent mathematical and provenance sanity controls.
const p0=initial();
close(p0.reduce((s,x)=>s+x,0),1,'prior normalized');
close(labelProb(p0),.5,'balanced label prior');
close(signalRate({rx:1,rz:0,sx:4,sz:99},3,'X'),.91,'pre-change rate');
close(signalRate({rx:1,rz:0,sx:4,sz:99},4,'X'),.56,'post-change rate');
assert.equal(permission(2,'X'),false);
assert.equal(permission(0,'Z'),false);
const legit=receipt(1,'X','calibrate',1,0);
const used=new Set();
validateReceipt(legit,3,used);
assert.throws(()=>validateReceipt(legit,3,used),'duplicate must fail');
assert.throws(()=>validateReceipt(legit,2,new Set()),'future evidence must not arrive early');
assert.throws(()=>validateReceipt({...legit,id:'forged'},3,new Set()));
assert.throws(()=>validateReceipt({...legit,issued_at:3},3,new Set()));
assert.throws(()=>validateReceipt({...legit,known_calibration_label:0},3,new Set()));
assert.throws(()=>receipt(2,'X','calibrate',1,0),'revoked request');
assert.throws(()=>receipt(0,'Z','target',1,0),'revoked request');
assert.throws(()=>receipt(11,'X','calibrate',1,0),'late request');
assert.equal(legit.issued_at,1);
assert.equal(permission(2,'X'),false); // revocation doesn't cancel valid pending evidence
// Updating at receipt time with CURRENT quality would constitute hindsight:
const drifting=stateSpace.find(s=>s.rx===1&&s.sx===4);
assert.ok(drifting);
const fromIssue=obsProb(drifting,'X','calibrate',3);
const fromDelivery=obsProb(drifting,'X','calibrate',5);
assert.ok(fromIssue!==fromDelivery,'delayed observations must use issuance-state likelihood');
// Use the issuance timestamp (not delivery timestamp) for each hypothesis.
const qIssue=likelihoodUpdate(p0,'X','calibrate',3,1);
const qDeliveryWrong=likelihoodUpdate(p0,'X','calibrate',5,1);
assert.ok(qIssue.some((x,i)=>Math.abs(x-qDeliveryWrong[i])>1e-5),'anti-hindsight check');
const datasets={train:dataset('train'),validation:dataset('validation')};
assert.equal(datasets.train.length,216);
assert.equal(datasets.validation.length,288);
const rows=[];
for(const [split,data] of Object.entries(datasets)){
  assert.equal(hash(dataset(split)),hash(data),'deterministic fixture replay');
  for(const policy of POLICIES){
    const total={n:0,correct:0,brier:0,cost:0,cal:0,postCal:0};
    const byDrift={};
    for(const trial of data){
      const score=evaluate(trial,policy);
      assert.deepEqual(score,evaluate(trial,policy),'replay same case');
      assert.ok(score.issuedActions.every(a=>permission(a.t,a.sensor)&&a.due_at<=T));
      assert.ok(score.spent<=BUDGET);
      for(const agg of [total,byDrift[trial.trueDrifts]??={n:0,correct:0,brier:0,cost:0,cal:0,postCal:0}]){
        agg.n++;agg.correct+=score.correct;agg.brier+=score.brier;agg.cost+=score.spent;
        agg.cal+=score.calibrations;agg.postCal+=score.postSwitchCalibrations;
      }
    }
    const finish=o=>({n:o.n,correct:o.correct,accuracy:o.correct/o.n,
      brier:o.brier/o.n,mean_cost:o.cost/o.n,mean_calibrations:o.cal/o.n,
      mean_postswitch_calibrations:o.postCal/o.n});
    rows.push({split,policy,...finish(total),
      by_drifts:Object.fromEntries(Object.entries(byDrift).map(([n,g])=>[n,finish(g)]))});
  }
}
const receiptData={
  experiment:'PHMP K4 E1 Trust Under Drift',version:'0.1.0',
  origin:'SIMULATED',authority:'NONE',scope:'TRAIN_VALIDATION_ONLY; reserved K4 443 NOT GENERATED',
  model:{rates:RATE,switch_points:SWITCH,states:72,time:T,budget:BUDGET,
    stop:STOP,delay:DELAY,cost:COST,split:SPLIT,policies:POLICIES},
  split_digests:Object.fromEntries(Object.entries(datasets).map(([k,v])=>[k,{n:v.length,sha256:hash(v)}])),
  results:rows,notes:'Standard Bayesian change-point filtering with delay-aware issuance snapshots; NBG-style TTL audit is an independent policy heuristic, not a new mathematical law.',
  limitations:'No cryptographic signature, nonstationary within-episode change times from known fixed support; myopic Bayesian policies not globally POMDP-optimal; no NBG quantum or physical claim.'
};
const sha256=hash(receiptData);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt:receiptData,sha256},null,2)+'\n',{flag:'wx'});
}
console.log('K4 E1 PASS '+datasets.train.length+' train / '+datasets.validation.length+' validation / '+rows.length+' result rows.');
console.log('VALIDATION '+JSON.stringify(rows.filter(x=>x.split==='validation').map(x=>({
  policy:x.policy,correct:x.correct,accuracy:x.accuracy,brier:x.brier,mean_cost:x.mean_cost
}))));
console.log('No reserved cohort was generated; structural (unsigned) receipts, not authenticated provenance.');
console.log('receipt_sha256 '+sha256);
