// NI1-E1B: exact causal-collision / intervention-isolation toy.
// Original synthetic mathematics; ZERO biological observations or nonlocal claims.
// Generator mechanism is deliberately excluded from all observer-facing inputs.
export const NI1B = Object.freeze({
  version:'NI1-E1B-toy-0.1.0',
  origin:'SIMULATED',
  authority:'NONE',
  ticks:60,
  interventionAt:40,
  amplitude:0.8,
  mechanisms:Object.freeze(['neural','instrument']),
  channels:Object.freeze(['neural','nuisance']),
})
const round=x=>Math.round(x*1e9)/1e9
function validateGenerator({mechanism,seed,probe,crossTalk}){
  if(!NI1B.mechanisms.includes(mechanism))throw Error('Invalid synthetic mechanism')
  if(!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('Invalid seed')
  if(!['none',...NI1B.channels].includes(probe))throw Error('Invalid intervention')
  if(typeof crossTalk!=='boolean')throw Error('crossTalk must be boolean')
  if(crossTalk&&probe!=='neural')throw Error('Cross-talk control only with neural intervention')
}
export function generateNI1BCollision({
  mechanism='neural',seed=369,probe='none',crossTalk=false,
}={}){
  validateGenerator({mechanism,seed,probe,crossTalk})
  let previous=0.15
  const rows=[]
  for(let t=0;t<NI1B.ticks;t++){
    const common=0.37*Math.cos(t*.16)+0.18*Math.sin(t*.27)
    const shared=0.44*Math.sin(t*.23+seed*.0007)+0.21*Math.cos(t*.37)
    const pulse=t>=NI1B.interventionAt?NI1B.amplitude:0
    const neural=shared+(probe==='neural'?pulse:0)
    const nuisance=shared+(probe==='nuisance'||crossTalk?pulse:0)
    const driver=mechanism==='neural'?neural:nuisance
    const readoutNoise=.007*Math.sin(t*.59+seed*.003)
    const observed=0.72*previous+0.22*common+0.4*driver+readoutNoise
    rows.push(Object.freeze({
      t,observed:round(observed),neural:round(neural),
      nuisance:round(nuisance),common:round(common),
    }))
    previous=observed
  }
  // Intentionally do NOT expose the mechanism, probe, or ground-truth coefficients.
  return Object.freeze({version:NI1B.version,origin:'SIMULATED',
    authority:'NONE',rows:Object.freeze(rows)})
}
function assertObservable(recording){
  if(!recording||recording.version!==NI1B.version||recording.origin!=='SIMULATED'||
    recording.authority!=='NONE'||!Array.isArray(recording.rows)||
    recording.rows.length!==NI1B.ticks||Object.keys(recording).some(k=>
      !['version','origin','authority','rows'].includes(k)))
    throw Error('Invalid or truth-leaking observer input')
  for(let t=0;t<NI1B.ticks;t++){
    const r=recording.rows[t]
    if(!r||r.t!==t||Object.keys(r).some(k=>!['t','observed','neural','nuisance','common'].includes(k))||
      ![r.observed,r.neural,r.nuisance,r.common].every(Number.isFinite))
      throw Error('Malformed synthetic trace or hidden label leak')
  }
}
function maxDifference(left,right,field,start=0,end=NI1B.ticks){
  let max=0
  for(let i=start;i<end;i++)
    max=Math.max(max,Math.abs(left.rows[i][field]-right.rows[i][field]))
  return round(max)
}
export function observationalCollisionNI1B(seed=369){
  const neural=generateNI1BCollision({mechanism:'neural',seed})
  const instrument=generateNI1BCollision({mechanism:'instrument',seed})
  const difference=maxDifference(neural,instrument,'observed')
  return {
    version:NI1B.version,origin:'SIMULATED',authority:'NONE',
    coarseIdentical:difference===0,maximumObservedDifference:difference,
    observerConclusion:'NOT IDENTIFIABLE',
    note:'Both invented causal mechanisms yield exactly the same unrestricted observational trace before intervention. Fit or correlation cannot disambiguate them.',
  }
}
// Blind analysis operates on *only two allowed observational traces* and the
// publicly declared intervention channel. Never access scenario ground truth.
export function evaluateNI1B(control,experimental,{channel='neural'}={}){
  assertObservable(control)
  assertObservable(experimental)
  if(!NI1B.channels.includes(channel))throw Error('Unknown intervention channel')
  const other=channel==='neural'?'nuisance':'neural'
  const pre={
    observed:maxDifference(control,experimental,'observed',0,NI1B.interventionAt),
    neural:maxDifference(control,experimental,'neural',0,NI1B.interventionAt),
    nuisance:maxDifference(control,experimental,'nuisance',0,NI1B.interventionAt),
    common:maxDifference(control,experimental,'common',0,NI1B.interventionAt),
  }
  const post={
    primaryChange:maxDifference(control,experimental,channel,NI1B.interventionAt),
    offTargetChange:maxDifference(control,experimental,other,NI1B.interventionAt),
    commonChange:maxDifference(control,experimental,'common',NI1B.interventionAt),
    observedEffect:maxDifference(control,experimental,'observed',NI1B.interventionAt),
  }
  const preMatched=Object.values(pre).every(x=>x===0)
  const isolated=post.offTargetChange<=1e-8&&post.commonChange<=1e-8
  const delivered=post.primaryChange>=NI1B.amplitude-1e-8
  let decision
  if(!preMatched)decision='REFUSE: BASELINE MISMATCH'
  else if(!isolated)decision='REFUSE: FAILED CHANNEL ISOLATION'
  else if(!delivered)decision='REFUSE: NO CONFIRMED INTERVENTION'
  else if(post.observedEffect>0.1)decision='INTERVENTION RESPONSE (TOY ONLY)'
  else decision='NO RESPONSE TO ISOLATED INTERVENTION'
  return {
    version:NI1B.version,origin:'SIMULATED',authority:'NONE',
    declaredChannel:channel,observerInputFields:['t','observed','neural','nuisance','common'],
    preIntervention:pre,afterIntervention:post,
    matchedBaseline:preMatched,isolated,delivered,decision,
    warning:'The positive response label does not identify a unique mechanism in biology; measured exposure and confound controls would be required.',
  }
}
export function runNI1B({
  mechanism='neural',probe='neural',crossTalk=false,seed=369,
}={}){
  if(!NI1B.channels.includes(probe))throw Error('NI1B requires an intervention')
  const control=generateNI1BCollision({mechanism,seed})
  const experimental=generateNI1BCollision({mechanism,seed,probe,crossTalk})
  const evaluation=evaluateNI1B(control,experimental,{channel:probe})
  return {
    ...evaluation,seed,scenarioLabel:mechanism,crossTalk,
    // Scenario selectors are included for UI provenance only, not passed to evaluator.
    control:control.rows,experimental:experimental.rows,
    collision:observationalCollisionNI1B(seed),
  }
}
export function receiptNI1B(result){
  if(!result||result.version!==NI1B.version||result.origin!=='SIMULATED'||
    result.authority!=='NONE')throw Error('Invalid result provenance')
  return {
    experiment:'NI1',phase:'E1B',version:NI1B.version,
    protocol:'experiments/NI1/E1B_PROTOCOL.md',
    origin:'SIMULATED',authority:'NONE',
    seed:result.seed,scenarioLabel:result.scenarioLabel,
    declaredProbe:result.declaredChannel,
    crossTalk:result.crossTalk,
    preIntervention:result.preIntervention,
    afterIntervention:result.afterIntervention,
    decision:result.decision,
    observationalCollision:result.collision,
    exclusions:['Not living-cell data','No new neuroimmune or nonlocal channel measured',
      'No causal identification outside the invented generator',
      'No medical diagnosis, immune enhancement, or treatment inference'],
  }
}
