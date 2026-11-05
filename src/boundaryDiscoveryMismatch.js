// NBG-BD02: candidate-model contradiction, registered recovery, and frozen holdout.
// Everything is finite and synthetic. Model predictions may inform probe selection;
// oracle results and holdout target values never do.
import {STATES,sites,total} from './boundaryDiscovery.js'

export const BD02_PROTOCOL=Object.freeze({
 id:'NBG-BD02',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
 question:'Can a coarse observer reject an inadequate transition catalog and test a registered replacement on unseen inputs?',
 scope:'One-step six-site ring sums; bounded predeclared model grammar, not open-world discovery',
 controls:'Disjoint train/holdout states; task-equivalent mechanisms remain unidentified',
 limitations:'No physical model, empirical measurement, new law, consciousness claim, or authentication'
})
export const INITIAL_MODELS=Object.freeze(['RIGHT_PAIR','LEFT_PAIR','SHIFT_RIGHT'])
export const REGISTERED_GRAMMAR=Object.freeze([...INITIAL_MODELS,'TRIPLE_PRODUCT','MAJORITY_THREE'])
export const ORACLES=Object.freeze([...REGISTERED_GRAMMAR,'ALL_NEGATIVE'])
export const POLICIES=Object.freeze(['ADAPTIVE','FIXED'])
export const TRAIN_STATES=Object.freeze(STATES.filter(s=>s%4!==0))
export const HOLDOUT_STATES=Object.freeze(STATES.filter(s=>s%4===0))

function assertModel(model,allowOracle=false){
 const set=allowOracle?ORACLES:REGISTERED_GRAMMAR
 if(!set.includes(model))throw Error('Unknown transition model: '+model)
}
export function nextState(state,model){
 assertModel(model,true)
 const a=sites(state)
 let bits=0
 for(let i=0;i<6;i++){
  const left=a[(i+5)%6],self=a[i],right=a[(i+1)%6]
  let v
  switch(model){
   case 'RIGHT_PAIR':v=self*right;break
   case 'LEFT_PAIR':v=left*self;break
   case 'SHIFT_RIGHT':v=right;break
   case 'TRIPLE_PRODUCT':v=left*self*right;break
   case 'MAJORITY_THREE':v=left+self+right>0?1:-1;break
   case 'ALL_NEGATIVE':v=-1;break
  }
  if(v>0)bits|=1<<i
 }
 return bits
}
export function observable(state,model){return total(nextState(state,model))}
function hamming(a,b){
 let v=a^b,n=0
 while(v){n+=v&1;v>>=1}
 return n
}
export function entropyOfPredictions(state,models){
 if(!Array.isArray(models)||!models.length)throw Error('Models required')
 const counts=new Map()
 for(const m of models){
  assertModel(m)
  const y=observable(state,m)
  counts.set(y,(counts.get(y)||0)+1)
 }
 return [...counts.values()].reduce((s,c)=>{
  const p=c/models.length
  return s-p*Math.log2(p)
 },0)
}
// Candidate selection is pure: NO oracle model, oracle reading or holdout labels.
export function selectTrainingProbe(models,used=[],policy='ADAPTIVE'){
 if(!POLICIES.includes(policy))throw Error('Invalid policy')
 if(!Array.isArray(used)||used.some(s=>!TRAIN_STATES.includes(s))||new Set(used).size!==used.length)
  throw Error('Invalid used training queries')
 if(!Array.isArray(models)||!models.length||models.some(m=>!REGISTERED_GRAMMAR.includes(m)))
  throw Error('Invalid model cohort')
 const pool=TRAIN_STATES.filter(s=>!used.includes(s))
 if(!pool.length)return null
 if(policy==='FIXED')return {state:pool[0],entropy:entropyOfPredictions(pool[0],models),coverage:0}
 const choices=pool.map(s=>({
  state:s,
  entropy:entropyOfPredictions(s,models),
  // If candidates agree, pick an input unlike earlier probes to test adequacy.
  coverage:used.length?Math.min(...used.map(u=>hamming(u,s))):0
 }))
 choices.sort((a,b)=>(b.entropy-a.entropy)||(b.coverage-a.coverage)||(a.state-b.state))
 return choices[0]
}
function filterModels(models,observations){
 return models.filter(m=>observations.every(o=>observable(o.state,m)===o.response))
}
function taskEquivalent(models){
 return models.length>0&&STATES.every(s=>models.every(m=>observable(s,m)===observable(s,models[0])))
}
export function buildHoldout(frozen,observations,oracle){
 if(!Array.isArray(frozen)||!frozen.length||!taskEquivalent(frozen))
  return {status:'REFUSED_AMBIGUOUS_OR_MISSING_MODEL',rows:[],candidateScore:null,baselines:null}
 const predictions=observations.map(o=>o.response)
 if(!predictions.length)throw Error('Training observations required')
 const hist=new Map()
 for(const x of predictions)hist.set(x,(hist.get(x)||0)+1)
 const constant=[...hist].sort((a,b)=>(b[1]-a[1])||(a[0]-b[0]))[0][0]
 // Only post-freeze: the oracle is used solely to score untouched holdout labels.
 const rows=HOLDOUT_STATES.map(state=>{
  const truth=observable(state,oracle)
  return {state,truth,prediction:observable(state,frozen[0]),
   fixedRightPair:observable(state,'RIGHT_PAIR'),constant}
 })
 const score=key=>({
  correct:rows.filter(r=>r[key]===r.truth).length,
  count:rows.length,
  exactAccuracy:rows.filter(r=>r[key]===r.truth).length/rows.length,
  meanAbsoluteError:rows.reduce((sum,r)=>sum+Math.abs(r[key]-r.truth),0)/rows.length
 })
 return {status:'SCORED_FROZEN_HOLDOUT',rows,
  candidateScore:score('prediction'),
  baselines:{fixedRightPair:score('fixedRightPair'),trainModeConstant:score('constant')},
  note:'Train/holdout split by input state ID; no model selection or tuning using holdout oracle labels.'}
}
export function runBD02({oracle='TRIPLE_PRODUCT',policy='ADAPTIVE',budget=3}={}){
 assertModel(oracle,true)
 if(!POLICIES.includes(policy))throw Error('Unknown probe policy')
 if(!Number.isInteger(budget)||budget<0||budget>12)throw Error('Budget must be an integer 0..12')
 let catalog=[...INITIAL_MODELS],grammar=[...REGISTERED_GRAMMAR]
 const queries=[],used=[]
 let mismatchAt=null
 for(let step=0;step<budget;step++){
  if(!grammar.length)break
  const query=selectTrainingProbe(grammar,used,policy)
  if(!query)break
  // Query is frozen BEFORE the synthetic oracle is called.
  const response=observable(query.state,oracle)
  used.push(query.state)
  queries.push({step:step+1,state:query.state,plannedEntropy:query.entropy,
   coverage:query.coverage,response})
  catalog=filterModels(catalog,queries)
  grammar=filterModels(grammar,queries)
  if(mismatchAt===null&&catalog.length===0)mismatchAt=step+1
  queries[queries.length-1].catalogRemaining=[...catalog]
  queries[queries.length-1].grammarRemaining=[...grammar]
 }
 let status,frozen=[]
 if(!queries.length)status='NO_BUDGET'
 else if(!grammar.length)status='OUTSIDE_REGISTERED_GRAMMAR'
 else if(grammar.length===1){
  frozen=[...grammar]
  status=mismatchAt!==null?'RECOVERED_REGISTERED_CANDIDATE':'IN_INITIAL_CATALOG'
 } else if(taskEquivalent(grammar)){
  frozen=[...grammar]
  status='TASK_EQUIVALENT_MODELS_UNIDENTIFIED'
 }else status='UNRESOLVED_MODEL_AMBIGUITY'
 const holdout=frozen.length?buildHoldout(frozen,queries,oracle):
  {status:'NOT_SCORED_WITHOUT_FROZEN_PREDICTION',rows:[],candidateScore:null,baselines:null}
 return {
  schema:'NBG.BD02.v1',protocol:BD02_PROTOCOL,origin:'SIMULATED',authority:'NONE',
  settings:{oracle,policy,budget},
  split:{trainCount:TRAIN_STATES.length,holdoutCount:HOLDOUT_STATES.length,
   rule:'state % 4 === 0 reserved for untouched holdout',
   trainStates:[...TRAIN_STATES],holdoutStates:[...HOLDOUT_STATES]},
  initialCatalog:[...INITIAL_MODELS],registeredGrammar:[...REGISTERED_GRAMMAR],
  queries,
  decision:{status,firstCatalogContradictionStep:mismatchAt,
   catalogSurvivors:[...catalog],grammarSurvivors:[...grammar],frozenModels:frozen,
   mechanismIdentified:frozen.length===1,
   taskIdentified:frozen.length>0},
  holdout,
  warning:'A model from a predeclared grammar is not an open-world discovery. Task-equivalent mechanisms cannot be uniquely identified using only this output. Synthetic source / authority NONE.'
 }
}
export function comparePolicies({oracle='TRIPLE_PRODUCT',budget=3}={}){
 return {adaptive:runBD02({oracle,policy:'ADAPTIVE',budget}),
  fixed:runBD02({oracle,policy:'FIXED',budget})}
}
