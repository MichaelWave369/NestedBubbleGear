// NBG-BD03 · compositional local-rule synthesis with strict train/holdout custody.
// Everything below is FINITE / SIMULATED / AUTHORITY NONE.
// The planner never receives oracle identity or holdout outcomes.
import {STATES, sites, total} from './boundaryDiscovery.js'
import {nextState as bd02NextState, ORACLES as BD02_ORACLES} from './boundaryDiscoveryMismatch.js'

export const BD03_PROTOCOL=Object.freeze({
 id:'NBG-BD03',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
 task:'synthesize and evaluate bounded local transition rules using controlled coarse observations',
 grammar:'local L/C/R signs; NOT, MUL, MAJ expression trees up to a bounded node count',
 controls:'frozen input split, training-only probe selection, complexity preference, held-out scoring',
 caveat:'Known finite grammar, constructed oracle fixtures and artificial budgets; no open-world science or awareness'
})
export const ORACLES=Object.freeze([...BD02_ORACLES,'GLOBAL_PARITY','POSITIONAL_FLIP'])
export const TASKS=Object.freeze(['SUM','ANCHOR_0'])
export const SPLITS=Object.freeze(['INTERLEAVED','PARITY_SHIFT'])
export const POLICIES=Object.freeze(['ENTROPY','FIXED'])
const cache=new Map()
const signature=values=>values.map(x=>x>0?'1':'0').join('')
const truth=Array.from({length:8},(_,i)=>({
 L:i&4?1:-1,C:i&2?1:-1,R:i&1?1:-1
}))
function put(bucket,expr,cost,values){
 const sig=signature(values)
 const old=bucket.get(sig)
 if(!old||expr<old.expr)bucket.set(sig,{expr,cost,signature:sig})
}
function bits(sig){return Array.from(sig,ch=>ch==='1'?1:-1)}
function operands(byCost,cost){return [...byCost[cost].values()]}
function signMajority(a,b,c){return a+b+c>0?1:-1}
export function enumerateRules(maxCost=5){
 if(!Number.isInteger(maxCost)||maxCost<1||maxCost>6)throw Error('Rule complexity must be an integer 1..6')
 if(cache.has(maxCost))return cache.get(maxCost)
 const byCost=Array.from({length:maxCost+1},()=>new Map())
 for(const name of ['L','C','R'])put(byCost[1],name,1,truth.map(row=>row[name]))
 for(let cost=2;cost<=maxCost;cost++){
  // Unary negation: COST=1+child cost.
  for(const a of operands(byCost,cost-1))
   put(byCost[cost],'NOT('+a.expr+')',cost,bits(a.signature).map(x=>-x))
  // Symmetric binary product; canonical operand order.
  for(let aCost=1;aCost<cost-1;aCost++){
   const bCost=cost-1-aCost
   for(const a of operands(byCost,aCost))for(const b of operands(byCost,bCost)){
    if(a.expr>b.expr)continue
    put(byCost[cost],'MUL('+a.expr+','+b.expr+')',cost,
     bits(a.signature).map((x,i)=>x*bits(b.signature)[i]))
   }
  }
  // Three-input signed-majority gate as a primitive, not a named complete rule.
  for(let aCost=1;aCost<cost-2;aCost++)for(let bCost=1;bCost<cost-aCost-1;bCost++){
   const cCost=cost-1-aCost-bCost
   if(cCost<1)continue
   for(const a of operands(byCost,aCost))for(const b of operands(byCost,bCost))
    for(const c of operands(byCost,cCost)){
     const terms=[a,b,c].sort((x,y)=>x.expr.localeCompare(y.expr))
     const [p,q,r]=terms
     const v1=bits(p.signature),v2=bits(q.signature),v3=bits(r.signature)
     put(byCost[cost],'MAJ('+terms.map(x=>x.expr).join(',')+')',cost,
      v1.map((x,i)=>signMajority(x,v2[i],v3[i])))
    }
  }
 }
 // Keep the cheapest lexicographically canonical representative of each
 // possible 3-neighbor truth table. Semantic equivalents remain distinct
 // from physical/mathematical identification of the actual mechanism.
 const unique=new Map()
 for(let cost=1;cost<=maxCost;cost++)for(const rule of byCost[cost].values()){
  const old=unique.get(rule.signature)
  if(!old||rule.cost<old.cost||(rule.cost===old.cost&&rule.expr<old.expr))
   unique.set(rule.signature,rule)
 }
 const result=Object.freeze([...unique.values()]
  .sort((a,b)=>(a.cost-b.cost)||a.expr.localeCompare(b.expr))
  .map(rule=>Object.freeze(rule)))
 cache.set(maxCost,result)
 return result
}
function assertRule(rule){
 if(!rule||typeof rule.signature!=='string'||!/^[01]{8}$/.test(rule.signature))
  throw Error('Invalid local-rule truth table')
}
export function localNextState(state,rule){
 assertRule(rule)
 const a=sites(state)
 let result=0
 for(let i=0;i<6;i++){
  const index=(a[(i+5)%6]>0?4:0)+(a[i]>0?2:0)+(a[(i+1)%6]>0?1:0)
  if(rule.signature[index]==='1')result|=1<<i
 }
 return result
}
export function oracleNextState(state,oracle){
 if(!ORACLES.includes(oracle))throw Error('Unknown synthetic oracle')
 if(oracle==='GLOBAL_PARITY')return sites(state).reduce((p,v)=>p*v,1)>0?63:0
 if(oracle==='POSITIONAL_FLIP')return bd02NextState(state,'RIGHT_PAIR')^1
 return bd02NextState(state,oracle)
}
export function measurement(next,task='SUM'){
 if(!TASKS.includes(task))throw Error('Unknown measurement task')
 return task==='SUM'?total(next):sites(next)[0]
}
export function predicted(state,rule,task='SUM'){
 return measurement(localNextState(state,rule),task)
}
export function oracleReading(state,oracle,task='SUM'){
 return measurement(oracleNextState(state,oracle),task)
}
const popcount=n=>{let c=0;while(n){c+=n&1;n>>=1}return c}
export function partitionStates(split='INTERLEAVED'){
 if(!SPLITS.includes(split))throw Error('Unknown partition')
 const train=STATES.filter(s=>split==='INTERLEAVED'?s%4!==0:popcount(s)%2===0)
 const holdout=STATES.filter(s=>!train.includes(s))
 return {split,train,holdout,rule:split==='INTERLEAVED'?
  'state % 4 !== 0 for training; else holdout':
  'even number of positive signs for training; odd for holdout'}
}
const hamming=(a,b)=>popcount(a^b)
export function probeEntropy(state,rules,task){
 if(!Array.isArray(rules)||!rules.length)throw Error('Candidate rules required')
 if(!TASKS.includes(task))throw Error('Unknown task')
 const histogram=new Map()
 for(const rule of rules){
  const y=predicted(state,rule,task)
  histogram.set(y,(histogram.get(y)||0)+1)
 }
 return [...histogram.values()].reduce((sum,n)=>{
  const p=n/rules.length
  return sum-p*Math.log2(p)
 },0)
}
export function chooseTrainingInput(rules,used,train,task='SUM',policy='ENTROPY'){
 if(!POLICIES.includes(policy))throw Error('Unknown planning policy')
 if(!Array.isArray(rules)||!rules.length||rules.some(r=>!r||!r.signature))
  throw Error('Rule cohort required')
 if(!Array.isArray(train)||!train.length||new Set(train).size!==train.length||
  train.some(s=>!STATES.includes(s)))throw Error('Invalid train partition')
 if(!Array.isArray(used)||new Set(used).size!==used.length||used.some(s=>!train.includes(s)))
  throw Error('Invalid used inputs')
 const available=train.filter(s=>!used.includes(s))
 if(!available.length)return null
 if(policy==='FIXED')return {state:available[0],entropy:probeEntropy(available[0],rules,task),novelty:0}
 const scored=available.map(state=>({
  state,entropy:probeEntropy(state,rules,task),
  novelty:used.length?Math.min(...used.map(previous=>hamming(state,previous))):0
 }))
 scored.sort((a,b)=>(b.entropy-a.entropy)||(b.novelty-a.novelty)||(a.state-b.state))
 return scored[0]
}
export function consistentRules(rules,observations,task){
 return rules.filter(rule=>observations.every(row=>predicted(row.state,rule,task)===row.response))
}
function taskClassCount(rules,task){
 return new Set(rules.map(rule=>STATES.map(s=>predicted(s,rule,task)).join(','))).size
}
function scores(rows,key){
 if(!rows.length)return null
 const exact=rows.filter(row=>row[key]===row.truth).length
 const mae=rows.reduce((sum,row)=>sum+Math.abs(row[key]-row.truth),0)/rows.length
 return {exact,of:rows.length,accuracy:exact/rows.length,meanAbsoluteError:mae}
}
export function evaluateFrozen({oracle,task,holdout,observations,frozen}){
 if(!ORACLES.includes(oracle)||!TASKS.includes(task))throw Error('Invalid evaluation settings')
 if(!Array.isArray(holdout)||holdout.some(x=>!STATES.includes(x))||!holdout.length)
  throw Error('Holdout required')
 if(!Array.isArray(observations)||!observations.length||!frozen)
  return {status:'NOT_EVALUATED_NO_FROZEN_MODEL',rows:[],scores:null}
 assertRule(frozen)
 const freq=new Map()
 for(const row of observations)freq.set(row.response,(freq.get(row.response)||0)+1)
 const trainMode=[...freq].sort((a,b)=>(b[1]-a[1])||(a[0]-b[0]))[0][0]
 // Ground truth is evaluated only after frozen is determined.
 const rows=holdout.map(state=>({
  state,truth:oracleReading(state,oracle,task),
  synthesized:predicted(state,frozen,task),
  fixedRightPair:measurement(bd02NextState(state,'RIGHT_PAIR'),task),
  currentObservable:task==='SUM'?total(state):sites(state)[0],
  trainConstant:trainMode
 }))
 return {status:'FROZEN_HOLDOUT_SCORED',
  rows,scores:{
   synthesized:scores(rows,'synthesized'),
   fixedRightPair:scores(rows,'fixedRightPair'),
   currentObservable:scores(rows,'currentObservable'),
   trainConstant:scores(rows,'trainConstant')
  },
  assessment:rows.every(row=>row.synthesized===row.truth)?
   'NO_FALSIFICATION_WITHIN_THIS_HOLDOUT':'FALSIFIED_BY_HELD_OUT_CASES'
 }
}
export function runBD03({oracle='TRIPLE_PRODUCT',task='SUM',split='INTERLEAVED',
  policy='ENTROPY',budget=9,maxCost=5}={}){
 if(!ORACLES.includes(oracle))throw Error('Unknown oracle')
 if(!TASKS.includes(task))throw Error('Unknown task')
 if(!POLICIES.includes(policy))throw Error('Unknown planner')
 if(!Number.isInteger(budget)||budget<0||budget>48)throw Error('Budget must be integer 0..48')
 const partition=partitionStates(split)
 const vocabulary=enumerateRules(maxCost)
 const observations=[],used=[]
 let candidates=[...vocabulary]
 for(let i=0;i<Math.min(budget,partition.train.length)&&candidates.length;i++){
  const next=chooseTrainingInput(candidates,used,partition.train,task,policy)
  if(!next)break
  // Oracle reading is requested only AFTER planning on current hypotheses.
  const response=oracleReading(next.state,oracle,task)
  used.push(next.state)
  observations.push({step:i+1,state:next.state,plannedEntropy:next.entropy,
   novelty:next.novelty,response})
  candidates=consistentRules(candidates,observations,task)
  observations[observations.length-1].remainingRules=candidates.length
 }
 const sorted=[...candidates].sort((a,b)=>(a.cost-b.cost)||a.expr.localeCompare(b.expr))
 const frozen=observations.length&&sorted.length?sorted[0]:null
 const classes=sorted.length?taskClassCount(sorted,task):0
 const decision=!observations.length?'NO_TRAINING':
  !sorted.length?'GRAMMAR_REJECTED':
  classes===1?'TASK_PREDICTION_IDENTIFIED_WITHIN_GRAMMAR':'PROVISIONAL_MDL'
 const holdout=frozen?evaluateFrozen({oracle,task,holdout:partition.holdout,observations,frozen}):
  {status:'NOT_EVALUATED_NO_FROZEN_MODEL',rows:[],scores:null,assessment:'UNSCORED'}
 return {
  schema:'NBG.BD03.v1',protocol:BD03_PROTOCOL,origin:'SIMULATED',authority:'NONE',
  settings:{oracle,task,split,policy,budget,maxCost},
  partition:{rule:partition.rule,trainCount:partition.train.length,
   holdoutCount:partition.holdout.length,trainStates:partition.train,
   holdoutStates:partition.holdout},
  grammar:{uniqueTruthTables:vocabulary.length,maxCost,
   operations:['L','C','R','NOT','MUL','MAJ'],selection:'shortest consistent expression, then lexical'},
  observations,
  decision:{status:decision,trainingConsistentRules:sorted.length,
   distinctTaskPredictionClasses:classes,
   frozenRule:frozen?{...frozen}:null,
   remainingSamples:sorted.slice(0,12).map(rule=>({...rule})),
   mechanismIdentified:false},
  holdout,
  warning:'A held-out pass is not universal correctness; a held-out failure does not authorize changing the frozen model. Semantic rules may have many algebraic representations. SIMULATED / authority NONE.'
 }
}
export function compareBD03(options={}){
 return {adaptive:runBD03({...options,policy:'ENTROPY'}),
  fixed:runBD03({...options,policy:'FIXED'})}
}
