// NI1-E1: deterministic, dimensionless, wholly synthetic causal-Keyhole experiment.
// All coefficients are invented software fixtures. No biological measurements or effects.
export const NI1 = Object.freeze({
  version:'NI1-E1-toy-0.1.0', origin:'SIMULATED', authority:'NONE',
  total:64, detach:24, trainingEnds:44, lag:2,
  worlds:Object.freeze(['null','pathway','shared-driver','detached','artifact']),
})
const clamp=(v,low,high)=>Math.max(low,Math.min(high,v))
const fix=n=>Math.round(n*1e9)/1e9
const rng=seed=>{
  let state=(seed>>>0)||1
  return ()=>{
    state=(Math.imul(1664525,state)+1013904223)>>>0
    return state/4294967296
  }
}
const rmse=items=>Math.sqrt(items.reduce((s,x)=>s+x*x,0)/Math.max(1,items.length))
const corr=(a,b)=>{
  const am=a.reduce((s,x)=>s+x,0)/a.length,bm=b.reduce((s,x)=>s+x,0)/b.length
  const u=a.map(v=>v-am),v=b.map(x=>x-bm)
  const num=u.reduce((s,x,i)=>s+x*v[i],0)
  const den=Math.sqrt(u.reduce((s,x)=>s+x*x,0)*v.reduce((s,x)=>s+x*x,0))
  return den<1e-12?0:num/den
}
export function generateNI1({world='pathway',seed=369,donorShiftAfterDetach=0,donorShiftBeforeDetach=0}={}){
  if(!NI1.worlds.includes(world))throw new Error('Unknown NI1 synthetic world')
  if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647)throw new Error('Seed must be a positive safe integer <= 2^31-1')
  for(const x of [donorShiftAfterDetach,donorShiftBeforeDetach])
    if(!Number.isFinite(x)||Math.abs(x)>3)throw new Error('Shift outside bounded synthetic preset')
  const random=rng(seed)
  const inputs=[]
  for(let t=0;t<NI1.total;t++){
    const common=0.66*Math.sin(t*.17+.2)+0.31*Math.cos(t*.36)
    const neuralBase=(world==='null'?0:0.58*common)+0.55*Math.sin(t*.31+seed*.001)
      +(random()-.5)*.11
    const sampleNoise=(random()-.5)*.035
    const artifactNoise=(random()-.5)*.13
    const localEnv=0.48*Math.cos(t*.23)+0.13*Math.sin(t*.47)
    const neural=neuralBase+
      (t>=NI1.detach?donorShiftAfterDetach:donorShiftBeforeDetach)
    inputs.push({t,common,neural,neuralBase,sampleNoise,artifactNoise,localEnv})
  }
  const rows=[]
  for(let t=0;t<NI1.total;t++){
    const inp=inputs[t], prev=t?rows[t-1].immune:0.16
    const neuralLag=inputs[Math.max(0,t-NI1.lag)].neural
    const nuisance=0.87*inputs[Math.max(0,t-NI1.lag)].neuralBase+
      inp.artifactNoise
    const detached=world==='detached'&&t>=NI1.detach
    const physicalBaseline=detached
      ?0.84*prev+0.16*inp.localEnv
      :0.62*prev+0.32*inp.common
    const pathway=(world==='pathway'||world==='detached'&&t<NI1.detach)
      ?0.43*neuralLag:0
    const artifact=world==='artifact'?0.48*nuisance:0
    const immune=physicalBaseline+pathway+artifact+inp.sampleNoise
    rows.push({
      t,immune:fix(immune),neural:fix(inp.neural),common:fix(inp.common),
      nuisance:fix(nuisance),environment:fix(inp.localEnv),
      detached,phase:t<NI1.trainingEnds?'TRAIN':'HOLDOUT',
    })
  }
  return Object.freeze({
    protocol:'experiments/NI1/E1_PROTOCOL.md',version:NI1.version,
    origin:NI1.origin,authority:NI1.authority,world,seed,
    sampleDetachedAt:world==='detached'?NI1.detach:null,
    rows,
  })
}
// Frozen nuisance-adjusted least squares on a fixed, known toy recurrence;
// "brain" is a declared synthetic driver, NOT a mood or clinical measurement.
function fit(samples,withNeural,includeNuisance){
  let aa=0,ab=0,bb=0,ay=0,by=0
  for(const r of samples){
    const a=includeNuisance?r.nuisance:0,b=withNeural?r.neuralLag:0
    aa+=a*a;ab+=a*b;bb+=b*b;ay+=a*r.residual;by+=b*r.residual
  }
  if(!includeNuisance&&!withNeural)return {nuisance:0,neural:0,identified:true}
  if(!includeNuisance)return {nuisance:0,neural:bb?by/bb:0,identified:bb>1e-8}
  if(!withNeural)return {nuisance:aa?ay/aa:0,neural:0,identified:aa>1e-8}
  const determinant=aa*bb-ab*ab
  if(determinant<1e-8)return {nuisance:0,neural:0,identified:false}
  return {
    nuisance:(ay*bb-by*ab)/determinant,
    neural:(by*aa-ay*ab)/determinant,
    identified:true,
  }
}
export function analyzeNI1(recording,{observeNuisance=true}={}){
  if(!recording||recording.version!==NI1.version||!NI1.worlds.includes(recording.world)
    ||!Array.isArray(recording.rows)||recording.rows.length!==NI1.total)
    throw new Error('NI1 recording contract mismatch')
  const rows=recording.rows.map((r,t)=>{
    const previous=t?recording.rows[t-1].immune:0.16
    const physicalBaseline=r.detached
      ?0.84*previous+0.16*r.environment
      :0.62*previous+0.32*r.common
    return {...r,physicalBaseline,
      neuralLag:recording.rows[Math.max(0,t-NI1.lag)].neural,
      residual:r.immune-physicalBaseline}
  })
  const start=recording.world==='detached'?NI1.detach+NI1.lag:NI1.lag
  const training=rows.filter(r=>r.t>=start&&r.t<NI1.trainingEnds)
  const holdout=rows.filter(r=>r.t>=NI1.trainingEnds)
  const c0=fit(training,false,observeNuisance),c1=fit(training,true,observeNuisance)
  const errors0=[],errors1=[]
  const predictions=rows.map(r=>{
    const predicted0=r.physicalBaseline+c0.nuisance*(observeNuisance?r.nuisance:0)
    const predicted1=r.physicalBaseline+
      c1.nuisance*(observeNuisance?r.nuisance:0)+c1.neural*r.neuralLag
    if(r.t>=NI1.trainingEnds){errors0.push(r.immune-predicted0);errors1.push(r.immune-predicted1)}
    return {...r,predicted0:fix(predicted0),predicted1:fix(predicted1)}
  })
  const baseRmse=rmse(errors0),extraRmse=rmse(errors1)
  const improvement=(baseRmse-extraRmse)/Math.max(baseRmse,1e-9)
  const confounded=recording.world==='artifact'&&!observeNuisance
  const status=!c1.identified?'NOT IDENTIFIABLE'
    :confounded?'REFUSED: UNMEASURED NUISANCE'
    :recording.world==='detached'?'NO POST-DETACH PATH ADMITTED'
    :Math.abs(c1.neural)>.15&&improvement>.12?'INJECTED PATH RECOVERED (TOY ONLY)'
    :'NO EXTRA PATH ADMITTED'
  const bare=rows.filter(x=>x.t>=start).map(x=>x.neuralLag)
  const paired=rows.filter(x=>x.t>=start).map(x=>x.immune)
  return {
    version:NI1.version,origin:'SIMULATED',authority:'NONE',world:recording.world,
    seed:recording.seed,observeNuisance,trainingCount:training.length,
    holdoutCount:holdout.length,trainEndExclusive:NI1.trainingEnds,
    status,
    estimates:{baselineNuisance:fix(c0.nuisance),candidateNuisance:fix(c1.nuisance),
      candidateNeural:fix(c1.neural),rankIdentified:c1.identified},
    metrics:{baselineHoldoutRMSE:fix(baseRmse),candidateHoldoutRMSE:fix(extraRmse),
      relativeImprovement:fix(improvement),rawCorrelation:fix(corr(bare,paired))},
    predictions,
    interpretation:'Synthetic model comparison only; fitted lag, correlation or improving score never identifies a real physical channel.',
  }
}
export function detachedDonorSwap(seed=369){
  const original=generateNI1({world:'detached',seed})
  const donorChangeAfter=generateNI1({world:'detached',seed,donorShiftAfterDetach:1.5})
  const donorChangeBefore=generateNI1({world:'detached',seed,donorShiftBeforeDetach:1.5})
  const after=original.rows.filter(x=>x.t>=NI1.detach)
  const invariance=after.every((r,i)=>r.immune===donorChangeAfter.rows[r.t].immune)
  const initialDiff=Math.abs(original.rows[NI1.detach].immune-
    donorChangeBefore.rows[NI1.detach].immune)
  return {
    invariantAfterSeparation:invariance,
    postDetachDifference:fix(Math.max(0,...after.map(r=>
      Math.abs(r.immune-donorChangeAfter.rows[r.t].immune)))),
    beforeSeparationChangesSample:initialDiff>1e-6,
    initialStateDifference:fix(initialDiff),
    donorSignalChanged:true,
    origin:'SIMULATED',authority:'NONE',
    note:'Local sample state may inherit pre-collection history; no post-collection donor edge is permitted.',
  }
}
// A formal, exact coarse-Keyhole witness: same observed starting state,
// different hidden material state, distinguished by a declared future probe.
export function hiddenStateWitness(){
  const initialOutput=0.5
  const hiddenA=0.8,hiddenB=-0.8
  const intervention=1
  const futureA=0.7*initialOutput+0.3*intervention+0.4*hiddenA*intervention
  const futureB=0.7*initialOutput+0.3*intervention+0.4*hiddenB*intervention
  return {
    keyhole:'K0',origin:'SIMULATED',authority:'NONE',
    initiallyEquivalent:true,initialOutput,hiddenA,hiddenB,intervention,
    futureA:fix(futureA),futureB:fix(futureB),
    separation:fix(Math.abs(futureA-futureB)),
    witnessValid:futureA!==futureB,
    note:'Toy Altermath witness, not experimental evidence of immune memory.',
  }
}
export function ni1Receipt(recording,analysis){
  return {
    experiment:'NI1',phase:'E1',protocolVersion:NI1.version,
    protocol:'experiments/NI1/E1_PROTOCOL.md',
    source:'GitHub main/branch at time of operator export',
    origin:'SIMULATED',authority:'NONE',
    world:recording.world,seed:recording.seed,sampleDetachedAt:recording.sampleDetachedAt,
    split:{trainingEndExclusive:NI1.trainingEnds,holdoutStart:NI1.trainingEnds},
    model:'fixed toy recurrence + nuisance-controlled linear fit',
    metrics:analysis.metrics,estimates:analysis.estimates,
    decision:analysis.status,
    controls:{donorSwap:detachedDonorSwap(recording.seed),hiddenWitness:hiddenStateWitness()},
    limitations:['No biological measurements','No remote donor influence established',
      'No clinical utility or real causal channel identified','Synthetic data cannot validate a real-world mechanism'],
  }
}
