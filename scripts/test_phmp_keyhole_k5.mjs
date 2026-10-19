import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';

// K5 E1: model mismatch in delayed, permissioned synthetic sensor evidence.
// E1 generates train/validation only. Public reserved seed 453 is NEVER used.
const T=12, BUDGET=12, STOP=.97;
const RATES=[.56,.91], SENSORS=['X','Z'], MODES=['target','calibrate'];
const DELAY=Object.freeze({target:1,calibrate:2});
const COST=Object.freeze({target:2,calibrate:1});
const FAMILIES=Object.freeze({
  expected:[[4,8],[8,99],[99,4],[99,99]],
  shifted:[[3,7],[7,99],[99,3],[99,99]]
});
const SUPPORT=Object.freeze({restricted:[4,8,99],robust:[3,4,7,8,99]});
const SPLITS=Object.freeze({
  train:{seed:451,perStratum:3},validation:{seed:452,perStratum:5},
  reserved:{seed:453,perStratum:10}
});
const POLICIES=Object.freeze([
  'restricted-joint-bayes','robust-joint-bayes','robust-target-bayes',
  'nbg-surprise-keyhole','scheduled-calibration','fixed-X'
]);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const close=(a,b,why)=>assert.ok(Math.abs(a-b)<1e-10,why+': '+a+' versus '+b);
const models={};
for(const [name,support] of Object.entries(SUPPORT)){
  const states=[];
  for(let h=0;h<2;h++)for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++)
    for(const sx of support)for(const sz of support)
      states.push({h,ix,iz,sx,sz});
  models[name]=Object.freeze(states);
}
assert.equal(models.restricted.length,72);
assert.equal(models.robust.length,200);
const reliability=(state,s,t)=>{
  const index=s==='X'?state.ix:state.iz;
  const switchTime=s==='X'?state.sx:state.sz;
  return RATES[t>=switchTime?1-index:index];
};
const pPlus=(state,s,mode,t)=>{
  const h=mode==='calibrate'?1:state.h;
  const r=reliability(state,s,t);
  return h?r:1-r;
};
const allow=(t,s,mode,spent)=>
  t>=0&&t<T&&SENSORS.includes(s)&&MODES.includes(mode)&&
  (s==='X'?t%6!==2:t%6!==0)&&
  t+DELAY[mode]<=T&&spent+COST[mode]<=BUDGET;
const labelP=(w,states)=>w.reduce((v,p,i)=>v+p*states[i].h,0);
const entropy=w=>-w.reduce((v,p)=>v+(p>0?p*Math.log2(p):0),0);
const binaryEntropy=p=>p===0||p===1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
const initial=states=>Array(states.length).fill(1/states.length);
function predictive(w,states,s,mode,t){
  return w.reduce((v,weight,i)=>v+weight*pPlus(states[i],s,mode,t),0);
}
function observe(w,states,s,mode,at,bit){
  const out=w.map((weight,i)=>weight*(bit?pPlus(states[i],s,mode,at):1-pPlus(states[i],s,mode,at)));
  const sum=out.reduce((a,b)=>a+b,0);
  assert.ok(sum>0,'impossible observation likelihood');
  return out.map(x=>x/sum);
}
function info(w,states,s,mode,t,objective){
  const p=predictive(w,states,s,mode,t);
  const before=objective==='joint'?entropy(w):binaryEntropy(labelP(w,states));
  let after=0;
  for(const bit of [0,1]){
    const q=bit?p:1-p;
    const updated=observe(w,states,s,mode,t,bit);
    after+=q*(objective==='joint'?entropy(updated):binaryEntropy(labelP(updated,states)));
  }
  return Math.max(0,before-after)/(COST[mode]*(1+.10*DELAY[mode]));
}
function decision(policy,w,states,t,spent,lastSurprise,lastCal,pending,calCount){
  const actions=[];
  for(const s of SENSORS)for(const mode of MODES)
    if(allow(t,s,mode,spent))actions.push({s,mode});
  if(!actions.length)return null;
  if(policy==='fixed-X')return actions.find(a=>a.s==='X'&&a.mode==='target')??null;
  if(policy==='scheduled-calibration'&&calCount<4&&t%3===1){
    const desired=calCount%2?'Z':'X';
    const planned=actions.find(a=>a.s===desired&&a.mode==='calibrate');
    if(planned)return planned;
  }
  if(policy==='nbg-surprise-keyhole'){
    // Independently specified typed observer heuristic: request fresh
    // calibration after a surprising delivered result. No extra data.
    for(const s of SENSORS){
      if(lastSurprise[s]>lastCal[s] &&
         !pending.some(e=>e.s===s&&e.mode==='calibrate')){
        const action=actions.find(a=>a.s===s&&a.mode==='calibrate');
        if(action)return action;
      }
    }
  }
  let objective=['restricted-joint-bayes','robust-joint-bayes'].includes(policy)?'joint':'target';
  let best=null,highest=1e-12;
  for(const action of actions){
    const value=info(w,states,action.s,action.mode,t,objective);
    if(value>highest+1e-12){highest=value;best=action;}
  }
  return best;
}
function receipt(t,s,mode,reading,spent){
  if(!allow(t,s,mode,spent)||![0,1].includes(reading))throw Error('not authorized');
  return Object.freeze({id:t+':'+s+':'+mode,t,s,mode,reading,
    due:t+DELAY[mode],cost:COST[mode],issued_permission:true,
    reference:mode==='calibrate'?1:null});
}
function audit(e,now,seen){
  if(!e||!Number.isInteger(e.t)||!SENSORS.includes(e.s)||!MODES.includes(e.mode)||
    e.id!==e.t+':'+e.s+':'+e.mode||seen.has(e.id)||
    !(e.s==='X'?e.t%6!==2:e.t%6!==0)||
    !e.issued_permission||e.cost!==COST[e.mode]||
    e.due!==e.t+DELAY[e.mode]||e.due!==now||
    e.reference!==(e.mode==='calibrate'?1:null)||![0,1].includes(e.reading))
    throw Error('invalid causal receipt');
  seen.add(e.id);
}
const lcg=seed=>{let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const seedFor=(seed,scenario,id,t,s,mode)=>(seed ^
  Math.imul(scenario+1,0x9e3779b9)^Math.imul(id+1,0x85ebca6b)^
  Math.imul(t+1,0xc2b2ae35)^Math.imul(s==='X'?1:2,0x27d4eb2f)^
  Math.imul(mode==='target'?1:2,0x165667b1))>>>0;
function fixtures(split){
  if(!['train','validation'].includes(split))throw Error('K5 reserved cohort must remain unused');
  const out=[],cfg=SPLITS[split];
  let scenario=0;
  for(const [family,pairs] of Object.entries(FAMILIES)){
    for(const [sx,sz] of pairs)for(let h=0;h<2;h++)
      for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++){
        const state={h,ix,iz,sx,sz};
        for(let id=0;id<cfg.perStratum;id++){
          const world={};
          for(const s of SENSORS)for(const mode of MODES)
            world[s+':'+mode]=Array.from({length:T},(_,t)=>
              Number(lcg(seedFor(cfg.seed,scenario,id,t,s,mode))()<pPlus(state,s,mode,t)));
          out.push({split,family,state:{...state},scenario,id,world});
        }
        scenario++;
      }
    }
  }
  return out;
}
function evaluate(row,policy){
  const support=policy==='restricted-joint-bayes'?'restricted':'robust';
  const states=models[support];
  let w=initial(states),spent=0,calCount=0,issued=0,delivered=0,surpriseSum=0;
  const queue=[],seen=new Set(),lastSurprise={X:-1,Z:-1},lastCal={X:-1,Z:-1};
  const actions=[];
  for(let t=0;t<=T;t++){
    for(const e of queue.filter(e=>e.due===t)){
      audit(e,t,seen);
      const predicted=predictive(w,states,e.s,e.mode,e.t);
      const prob=e.reading?predicted:1-predicted;
      const surprise=-Math.log2(prob);
      surpriseSum+=surprise;
      // Use delivery-time prior, ISSUE-time sensor likelihood: no hindsight.
      w=observe(w,states,e.s,e.mode,e.t,e.reading);
      if(surprise>1.5)lastSurprise[e.s]=t;
      if(e.mode==='calibrate')lastCal[e.s]=t;
      delivered++;
    }
    if(t===T)break;
    const p=labelP(w,states);
    if(p>=STOP||p<=1-STOP)continue;
    const a=decision(policy,w,states,t,spent,lastSurprise,lastCal,queue.filter(e=>e.due>t),calCount);
    if(!a)continue;
    const e=receipt(t,a.s,a.mode,row.world[a.s+':'+a.mode][t],spent);
    queue.push(e);actions.push({issued_at:t,due_at:e.due,sensor:a.s,mode:a.mode});
    spent+=e.cost;issued++;calCount+=Number(a.mode==='calibrate');
  }
  assert.equal(issued,delivered);
  assert.equal(issued,seen.size);
  assert.ok(spent<=BUDGET);
  assert.ok(actions.every(e=>e.due_at<=T));
  const p=labelP(w,states),pred=Number(p>=.5);
  return {correct:Number(pred===row.state.h),brier:(p-row.state.h)**2,prob:p,spent,
    calibrations:calCount,surpriseSum,issued,actions};
}
// Source-model and negative controls.
assert.equal(models.restricted.length,72);
assert.equal(models.robust.length,200);
const outOfFamily={h:1,ix:1,iz:1,sx:3,sz:7};
close(reliability(outOfFamily,'X',2),.91,'before unforeseen shift');
close(reliability(outOfFamily,'X',3),.56,'after unforeseen shift');
assert.ok(!SUPPORT.restricted.includes(3)&&SUPPORT.robust.includes(3));
assert.ok(!SUPPORT.restricted.includes(7)&&SUPPORT.robust.includes(7));
close(labelP(initial(models.robust),models.robust),.5,'balanced prior');
close(initial(models.restricted).reduce((s,x)=>s+x,0),1,'restricted prior sum');
close(initial(models.robust).reduce((s,x)=>s+x,0),1,'robust prior sum');
const good=receipt(1,'X','calibrate',1,0),seen=new Set();
audit(good,3,seen);
assert.throws(()=>audit(good,3,seen),'duplicate');
assert.throws(()=>audit(good,2,new Set()),'premature arrival');
assert.throws(()=>audit({...good,reference:0},3,new Set()),'forged reference');
assert.throws(()=>audit({...good,id:'wrong'},3,new Set()),'forged ID');
assert.throws(()=>receipt(2,'X','target',1,0),'revoked X');
assert.throws(()=>receipt(0,'Z','target',1,0),'revoked Z');
assert.throws(()=>receipt(11,'X','calibrate',1,0),'late delivery');
assert.equal(good.due,3);
assert.equal(allow(2,'X','calibrate',0),false);
const before=observe(initial(models.robust),models.robust,'X','calibrate',2,1);
const after=observe(initial(models.robust),models.robust,'X','calibrate',4,1);
assert.ok(before.some((x,i)=>Math.abs(x-after[i])>1e-6),'issuance versus delivery likelihood difference');
const sets={train:fixtures('train'),validation:fixtures('validation')};
assert.equal(sets.train.length,192);
assert.equal(sets.validation.length,320);
const rows=[];
for(const [split,cases] of Object.entries(sets)){
  assert.equal(digest(fixtures(split)),digest(cases),'deterministic fixture replay');
  for(const policy of POLICIES){
    const groups={};
    let n=0,correct=0,brier=0,spent=0,calibration=0,issued=0;
    for(const row of cases){
      const result=evaluate(row,policy);
      assert.deepEqual(result,evaluate(row,policy),'deterministic replay');
      assert.ok(result.actions.every(e=>allow(e.issued_at,e.sensor,e.mode,0)));
      const sub=groups[row.family]??={n:0,correct:0,brier:0,spent:0,calibration:0};
      sub.n++;sub.correct+=result.correct;sub.brier+=result.brier;
      sub.spent+=result.spent;sub.calibration+=result.calibrations;
      n++;correct+=result.correct;brier+=result.brier;spent+=result.spent;
      calibration+=result.calibrations;issued+=result.issued;
    }
    const sums=o=>({n:o.n,correct:o.correct,accuracy:o.correct/o.n,
      brier:o.brier/o.n,mean_cost:o.spent/o.n,mean_calibrations:o.calibration/o.n});
    rows.push({split,policy,n,correct,accuracy:correct/n,brier:brier/n,
      mean_cost:spent/n,mean_calibrations:calibration/n,mean_issues:issued/n,
      by_family:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,sums(v)]))});
  }
}
const receiptData={
  experiment:'PHMP Keyhole K5 E1: Trust Under Model Mismatch',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  protocol:{ticks:T,budget:BUDGET,confidence_stop:STOP,rates:RATES,source_switch_families:FAMILIES,
    classical_state_support:SUPPORT,policies:POLICIES,permission:'X t%6!=2; Z t%6!=0',
    delay:DELAY,cost:COST,seeded_splits:SPLITS},
  scope:'TRAIN_VALIDATION_ONLY; seed 453 ungenerated; all K1-K4 and PHMP-3 reserved cohorts untouched',
  sets:Object.fromEntries(Object.entries(sets).map(([k,rows])=>[k,{n:rows.length,sha256:digest(rows)}])),
  results:rows,
  limitations:'hypothesis family includes true shifted support for robust classical methods; simulated iid Bernoulli, unsigned receipts, exploratory comparisons only; no new NBG physics/algorithmic advantage claim'
};
const receiptSha=digest(receiptData);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');
  assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt:receiptData,sha256:receiptSha},null,2)+'\n',{flag:'wx'});
}
console.log('K5 E1 PASS train '+sets.train.length+' validation '+sets.validation.length+' results '+rows.length);
console.log('VALIDATION '+JSON.stringify(rows.filter(r=>r.split==='validation').map(r=>({policy:r.policy,accuracy:r.accuracy,brier:r.brier,shifted_accuracy:r.by_family.shifted.accuracy,mean_cost:r.mean_cost}))));
console.log('No reserved data generated. All scores exploratory. Structural unsigned receipts only.');
console.log('receipt_sha256 '+receiptSha);
