import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP Keyhole K6 E1: finite synthetic source-contamination qualification.
// Never generate reserved seed 463 or alter earlier Keyhole/PHMP-3 cohorts.
const T=14,BUDGET=12,STOP=.975;
const SENSORS=['X','Z'], MODES=['target','calibrate'];
const COST={target:2,calibrate:1},DELAY={target:1,calibrate:2};
const GOOD=.75,BAD=.25;
const PLANS=[
  {id:'clean',x:null,z:null,family:'clean'},
  {id:'early-X',x:[3,3],z:null,family:'shifted'},
  {id:'early-Z',x:null,z:[4,3],family:'shifted'},
  {id:'late-X',x:[7,4],z:null,family:'in-support'},
  {id:'late-Z',x:null,z:[8,4],family:'in-support'},
  {id:'long-X',x:[5,6],z:null,family:'out-of-support'},
  {id:'long-Z',x:null,z:[3,6],family:'out-of-support'},
  {id:'staggered',x:[3,3],z:[8,3],family:'joint'},
  {id:'simultaneous',x:[6,2],z:[6,2],family:'joint'}
];
const SPLITS={train:{seed:461,perLabelPlan:4},validation:{seed:462,perLabelPlan:6},reserved:{seed:463,perLabelPlan:12}};
const POLICIES=['restricted-target-bayes','robust-target-bayes','robust-joint-bayes',
  'classical-cusum-audit','nbg-quarantine-keyhole','fixed-X'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const near=(a,b,name)=>assert.ok(Math.abs(a-b)<1e-10,name+': '+a+' vs '+b);
const plausible=(start,len)=>start!==null&&start!==undefined&&len!==undefined;
const active=(window,t)=>Array.isArray(window)&&t>=window[0]&&t<window[0]+window[1];
const rate=(plan,s,t)=>active(plan[s.toLowerCase()],t)?BAD:GOOD;
const prob=(state,s,m,t)=>{
  const truth=m==='calibrate'?1:state.h;
  const r=rate(state.plan,s,t);
  return truth?r:1-r;
};
const narrowPlans=[
  {id:'narrow-clean',x:null,z:null},
  {id:'narrow-X',x:[6,3],z:null},
  {id:'narrow-Z',x:null,z:[6,3]}
];
const broadPlans=[{id:'broad-clean',x:null,z:null}];
for(const s of ['x','z'])for(const t of [2,3,4,5,6,7,8,9])
  for(const len of [2,3,4])broadPlans.push({
    id:s+'-'+t+'-'+len,x:s==='x'?[t,len]:null,z:s==='z'?[t,len]:null
  });
broadPlans.push(
  {id:'broad-staggered',x:[3,3],z:[8,3]},
  {id:'broad-simultaneous',x:[6,2],z:[6,2]}
);
const MODELS={restricted:narrowPlans,robust:broadPlans};
const states=(kind)=>MODELS[kind].flatMap(plan=>[0,1].map(h=>({h,plan})));
const STATE={restricted:states('restricted'),robust:states('robust')};
const uniform=states=>Array(states.length).fill(1/states.length);
const beliefH=(w,s)=>w.reduce((acc,v,i)=>acc+v*s[i].h,0);
const entropy=v=>-v.reduce((a,x)=>a+(x>0?x*Math.log2(x):0),0);
const binaryH=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
const allowed=(t,s,m,spent)=>Number.isInteger(t)&&t>=0&&t<T&&SENSORS.includes(s)&&
  MODES.includes(m)&& (s==='X'?t%7!==3:t%7!==0)&&
  t+DELAY[m]<=T&&spent+COST[m]<=BUDGET;
const prediction=(w,s,sensor,mode,at)=>w.reduce((sum,p,i)=>sum+p*prob(s[i],sensor,mode,at),0);
function update(w,s,sensor,mode,at,reading){
  const out=w.map((p,i)=>p*(reading?prob(s[i],sensor,mode,at):1-prob(s[i],sensor,mode,at)));
  const mass=out.reduce((a,b)=>a+b,0);
  assert.ok(mass>0,'observation outside likelihood support');
  return out.map(p=>p/mass);
}
function gain(w,states,sensor,mode,t,objective){
  const p=prediction(w,states,sensor,mode,t);
  const prior=objective==='joint'?entropy(w):binaryH(beliefH(w,states));
  let expected=0;
  for(const reading of [0,1]){
    const posterior=update(w,states,sensor,mode,t,reading);
    expected+=(reading?p:1-p)*(objective==='joint'?entropy(posterior):binaryH(beliefH(posterior,states)));
  }
  return Math.max(0,prior-expected)/(COST[mode]*(1+.10*DELAY[mode]));
}
function nextAction(policy,w,states,t,cost,control){
  const actions=SENSORS.flatMap(s=>MODES.filter(mode=>allowed(t,s,mode,cost)).map(mode=>({s,mode})));
  if(!actions.length)return null;
  if(policy==='fixed-X')return actions.find(a=>a.s==='X'&&a.mode==='target')??null;
  const pendingCalibration=s=>control.pending.some(e=>e.s===s&&e.mode==='calibrate'&&e.due>t);
  if(policy==='classical-cusum-audit'||policy==='nbg-quarantine-keyhole'){
    // Fair safety control: both monitor only legitimately delivered calibration
    // and target evidence. They never read the hidden truth.
    for(const s of SENSORS){
      const danger=policy==='classical-cusum-audit'?control.cusum[s]>=2:
        control.quarantineUntil[s]>t;
      if(danger&&!pendingCalibration(s)){
        const action=actions.find(a=>a.s===s&&a.mode==='calibrate');
        if(action)return action;
      }
    }
    // Predeclared scheduled calibration, one X then one Z, if affordable.
    if(control.calibrationCounts.X<1||control.calibrationCounts.Z<1){
      const preferred=control.calibrationCounts.X<1?'X':'Z';
      const cal=actions.find(a=>a.s===preferred&&a.mode==='calibrate');
      if(cal)return cal;
    }
  }
  const objective=policy==='robust-joint-bayes'?'joint':'target';
  let best=null,max=1e-12;
  for(const a of actions){
    if((policy==='classical-cusum-audit'||policy==='nbg-quarantine-keyhole')&&
       a.mode==='target'&&control.quarantineUntil[a.s]>t)continue;
    const score=gain(w,states,a.s,a.mode,t,objective);
    if(score>max+1e-12){best=a;max=score;}
  }
  return best;
}
function rng(seed){let z=seed>>>0;return()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296;};}
function fixtureSeed(root,i,h,k,t,s,m){
  return (root^Math.imul(i+1,0x9e3779b9)^Math.imul(h+1,0x85ebca6b)^
    Math.imul(k+1,0xc2b2ae35)^Math.imul(t+1,0x27d4eb2f)^
    Math.imul(s==='X'?1:2,0x165667b1)^Math.imul(m==='target'?1:2,0xd3a2646c))>>>0;
}
function cases(split){
  if(!['train','validation'].includes(split))throw Error('K6 reserved cohort forbidden during E1');
  const result=[],cfg=SPLITS[split];
  for(let i=0;i<PLANS.length;i++)for(let h=0;h<2;h++)
    for(let k=0;k<cfg.perLabelPlan;k++){
      const potential={},scenario=PLANS[i],truth={plan:scenario,h};
      for(const s of SENSORS)for(const m of MODES)
        potential[s+':'+m]=Array.from({length:T},(_,t)=>
          Number(rng(fixtureSeed(cfg.seed,i,h,k,t,s,m))()<prob(truth,s,m,t)));
      result.push({split,plan:i,h,k,potential});
    }
  return result;
}
const key=(t,s,mode)=>t+':'+s+':'+mode;
function append(ledger,t,s,mode,bit,spent){
  if(!allowed(t,s,mode,spent)||![0,1].includes(bit))throw Error('unpermitted issuance');
  const base={id:key(t,s,mode),t,s,mode,bit,due:t+DELAY[mode],
    reference:mode==='calibrate'?1:null,cost:COST[mode],authorized_at_issue:true,
    prev_hash:ledger.length?ledger[ledger.length-1].hash:'K6-GENESIS'};
  const receipt=Object.freeze({...base,hash:hash(base)});
  ledger.push(receipt);
  return receipt;
}
function verify(entry,now,ledger,seen){
  if(!entry||!Number.isInteger(entry.t)||!SENSORS.includes(entry.s)||!MODES.includes(entry.mode)||
    entry.id!==key(entry.t,entry.s,entry.mode)||entry.due!==now||
    entry.due!==entry.t+DELAY[entry.mode]||entry.reference!==(entry.mode==='calibrate'?1:null)||
    ![0,1].includes(entry.bit)||entry.cost!==COST[entry.mode]||
    !entry.authorized_at_issue||!allowed(entry.t,entry.s,entry.mode,0)||
    seen.has(entry.id))throw Error('causality or access failure');
  const index=ledger.findIndex(e=>e.id===entry.id);
  if(index<0)throw Error('not present in issuance ledger');
  for(let i=0;i<=index;i++){
    const item=ledger[i];const {hash:itemHash,...itemBody}=item;
    const expectedPrior=i?ledger[i-1].hash:'K6-GENESIS';
    if(itemBody.prev_hash!==expectedPrior||hash(itemBody)!==itemHash)
      throw Error('ledger prefix integrity failure');
  }
  const prior=index?ledger[index-1].hash:'K6-GENESIS';
  const {hash:claimed,...body}=entry;
  if(body.prev_hash!==prior||hash(body)!==claimed||
    hash(ledger[index])!==hash(entry))throw Error('digest chain integrity failure');
  seen.add(entry.id);
}
function evaluate(row,policy){
  const kind=policy==='restricted-target-bayes'?'restricted':'robust';
  const states=STATE[kind];
  let w=uniform(states),spent=0,calibrations=0;
  let attackedRequests=0;
  const ledger=[],seen=new Set(),control={pending:[],cusum:{X:0,Z:0},
    quarantineUntil:{X:-1,Z:-1},calibrationCounts:{X:0,Z:0}};
  const activities=[];
  for(let t=0;t<=T;t++){
    for(const entry of control.pending.filter(e=>e.due===t)){
      verify(entry,t,ledger,seen);
      // No hindsight: use issuance-time likelihood even if contamination ends
      // between collection and delivery.
      const predictive=prediction(w,states,entry.s,entry.mode,entry.t);
      const observedProbability=entry.bit?predictive:1-predictive;
      w=update(w,states,entry.s,entry.mode,entry.t,entry.bit);
      if(entry.mode==='calibrate'){
        const logEvidence=entry.bit?Math.log(BAD/GOOD):Math.log((1-BAD)/(1-GOOD));
        control.cusum[entry.s]=Math.max(0,control.cusum[entry.s]+logEvidence);
        if(entry.bit===0)control.quarantineUntil[entry.s]=Math.max(control.quarantineUntil[entry.s],t+3);
      }
      if(policy==='nbg-quarantine-keyhole'&&entry.mode==='target'&&observedProbability<.20)
        control.quarantineUntil[entry.s]=Math.max(control.quarantineUntil[entry.s],t+2);
    }
    if(t===T)break;
    const p=beliefH(w,states);
    if(p>=STOP||p<=1-STOP)continue;
    const a=nextAction(policy,w,states,t,spent,control);
    if(!a)continue;
    const entry=append(ledger,t,a.s,a.mode,row.potential[a.s+':'+a.mode][t],spent);
    if(active(PLANS[row.plan][a.s.toLowerCase()],t))attackedRequests++;
    control.pending.push(entry);
    spent+=entry.cost;calibrations+=Number(entry.mode==='calibrate');
    if(entry.mode==='calibrate')control.calibrationCounts[entry.s]++;
    activities.push({sensor:entry.s,mode:entry.mode,t:entry.t,due:entry.due});
  }
  assert.equal(ledger.length,seen.size,'all issued observations arrive before horizon');
  assert.ok(spent<=BUDGET);
  const p=beliefH(w,states),decision=Number(p>=.5);
  return {correct:Number(decision===row.h),brier:(p-row.h)**2,spent,
    calibrations,attackedRequests,issued:ledger.length,activities,
    quarantine_events:Object.values(control.quarantineUntil).filter(v=>v>0).length};
}
// Structural ledger and statistical sanity controls.
assert.equal(STATE.restricted.length,6);
assert.equal(STATE.robust.length,2*broadPlans.length);
assert.ok(broadPlans.length>50);
near(prob({h:1,plan:PLANS[0]},'X','target',5),GOOD,'clean target likelihood');
near(prob({h:1,plan:PLANS[1]},'X','target',3),BAD,'contaminated target likelihood');
near(prob({h:1,plan:PLANS[1]},'X','calibrate',3),BAD,'known-reference calibration detects reversal');
assert.ok(!broadPlans.some(p=>JSON.stringify(p.x)===JSON.stringify([5,6])),'long attack truly out of model');
const chain=[],entry=append(chain,1,'X','calibrate',1,0),visited=new Set();
verify(entry,3,chain,visited);
assert.throws(()=>verify(entry,3,chain,visited),'duplicate cannot be delivered');
assert.throws(()=>verify(entry,2,chain,new Set()),'future delivery rejected');
assert.throws(()=>verify({...entry,bit:0},3,chain,new Set()),'changed bit invalidates hash');
assert.throws(()=>verify({...entry,hash:'forged'},3,chain,new Set()),'forged digest');
assert.throws(()=>verify({...entry,reference:0},3,chain,new Set()),'known reference cannot change');
assert.throws(()=>append([],3,'X','target',1,0),'revoked X');
assert.throws(()=>append([],0,'Z','target',1,0),'revoked Z');
assert.throws(()=>append([],T-1,'X','calibrate',1,0),'late delivery');
const tamperedLedger=[{...entry,bit:0}];
assert.throws(()=>verify(entry,3,tamperedLedger,new Set()),'ledger content replaced');
const second=append(chain,4,'X','target',1,0);
assert.throws(()=>verify(second,5,[{...entry,bit:0},second],new Set()),'modified earlier receipt invalidates chain');
const a=STATE.robust.find(s=>s.h===1&&active(s.plan.x,3)&&!active(s.plan.x,5));
assert.ok(a,'test includes a source whose attack ended before delivery');
assert.ok(prob(a,'X','calibrate',3)!==prob(a,'X','calibrate',5),'wrong delivery-time quality differs');
const ds={train:cases('train'),validation:cases('validation')};
assert.equal(ds.train.length,PLANS.length*2*SPLITS.train.perLabelPlan);
assert.equal(ds.validation.length,PLANS.length*2*SPLITS.validation.perLabelPlan);
const result=[];
for(const [split,rows] of Object.entries(ds)){
  assert.equal(hash(cases(split)),hash(rows),'reproducible seeded dataset');
  for(const policy of POLICIES){
    let correct=0,brier=0,spent=0,calibrations=0,attackedRequests=0;
    const family={};
    for(const sample of rows){
      const score=evaluate(sample,policy);
      assert.ok(score.activities.every(x=>x.due<=T&&allowed(x.t,x.sensor,x.mode,0)));
      const bucket=family[PLANS[sample.plan].family]??={n:0,correct:0,brier:0,spent:0,attack:0,exposedCases:0};
      bucket.n++;bucket.correct+=score.correct;bucket.brier+=score.brier;bucket.spent+=score.spent;
      bucket.attack+=score.attackedRequests;bucket.exposedCases+=Number(score.attackedRequests>0);
      correct+=score.correct;brier+=score.brier;spent+=score.spent;calibrations+=score.calibrations;
      attackedRequests+=score.attackedRequests;
    }
    result.push({split,policy,n:rows.length,correct,accuracy:correct/rows.length,
      brier:brier/rows.length,mean_cost:spent/rows.length,mean_calibrations:calibrations/rows.length,
      mean_attacked_requests:attackedRequests/rows.length,
      by_family:Object.fromEntries(Object.entries(family).map(([name,v])=>[name,{
        n:v.n,correct:v.correct,accuracy:v.correct/v.n,brier:v.brier/v.n,mean_cost:v.spent/v.n,
        attacked_requests:v.attack,exposed_cases:v.exposedCases}]))});
  }
}
const receipt={
  experiment:'PHMP K6 E1: Source Contamination, Hash-Linked Receipts, Classical Controls',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  protocol:{ticks:T,budget:BUDGET,good_reliability:GOOD,bad_reliability:BAD,plans:PLANS,
    public_model_support:{restricted:narrowPlans,robust:broadPlans},split:SPLITS,
    policies:POLICIES,delay:DELAY,cost:COST,
    access:'X issuance t mod 7 !=3; Z issuance t mod 7 !=0'},
  datasets:Object.fromEntries(Object.entries(ds).map(([k,v])=>[k,{n:v.length,sha256:hash(v)}])),
  results:result,
  nonclaims:'exploratory synthetic validation, untrusted attack model, no proof of resistance to forged rewritten ledgers, no physical data or NBG quantum/engineering advantage',
  reservations:'K6 seed 463 and all prior reserved Keyhole and PHMP3 cohorts untouched'
};
const checksum=hash(receipt);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:checksum},null,2)+'\n',{flag:'wx'});
}
console.log('K6 E1 PASS '+ds.train.length+' train, '+ds.validation.length+' validation, '+result.length+' summary rows.');
console.log('VALIDATION '+JSON.stringify(result.filter(r=>r.split==='validation').map(x=>({policy:x.policy,
  correct:x.correct,accuracy:x.accuracy,brier:x.brier,cost:x.mean_cost,
  out_of_support_accuracy:x.by_family['out-of-support']?.accuracy,
  attacked_requests:x.mean_attacked_requests,exposed_cases:x.by_family['out-of-support']?.exposed_cases}))));
console.log('RESERVED COHORTS NOT GENERATED / SCORED. All receipt digests unsigned.');
console.log('receipt_sha256 '+checksum);
