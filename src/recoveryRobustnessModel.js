// BR3 independently stress-tests BR1's frozen linear synthetic oscillator equations.
// It does NOT amend BR1/BR2, and makes no claim about natural or societal systems.
export const BR3_PROTOCOL='NBG-BR3-v0.1.0'
export const BR3_PLAN=Object.freeze({
  coupling:Object.freeze([0,0.85,1.5]),
  asymmetry:Object.freeze([-0.9,0,0.9]),
  damping:Object.freeze([0.07,0.22,0.46]),
  detuning:0.12,
  horizons:Object.freeze([38,60,120]),
  target:Object.freeze(['A','B','BOTH']),
  timeStep:Object.freeze([0.04,0.02]),
  thresholds:Object.freeze([0.03,0.06,0.12]),
  pulseTime:10,
  kick:2,
  forcing:0.75,
  sustainedSeconds:2,
  correlationFlag:0.95,
})
export const BR3_BASE_COUNT=BR3_PLAN.coupling.length*BR3_PLAN.asymmetry.length*BR3_PLAN.damping.length
export const BR3_INTEGRATION_COUNT=BR3_BASE_COUNT*BR3_PLAN.horizons.length*BR3_PLAN.target.length*BR3_PLAN.timeStep.length
export const BR3_OUTCOME_COUNT=BR3_INTEGRATION_COUNT*BR3_PLAN.thresholds.length

function validate(x,name,values){
  if(!values.includes(x))throw new RangeError(`BR3 non-frozen ${name}: ${x}`)
  return x
}
function finite(s){return s.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6)}
function derivative(t,s,p){
  const [xa,va,xb,vb]=s
  const kab=p.coupling*(1-p.asymmetry),kba=p.coupling*(1+p.asymmetry)
  return [va,-1.44*xa-p.damping*va+kab*(xb-xa)+BR3_PLAN.forcing*Math.sin(1.2*t),
    vb,-(1.2+p.detuning)**2*xb-p.damping*vb+kba*(xa-xb)]
}
function rk4(t,s,dt,p){
  const a=derivative(t,s,p)
  const b=derivative(t+dt/2,s.map((v,i)=>v+dt*a[i]/2),p)
  const c=derivative(t+dt/2,s.map((v,i)=>v+dt*b[i]/2),p)
  const d=derivative(t+dt,s.map((v,i)=>v+dt*c[i]),p)
  return s.map((v,i)=>v+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6)
}
function correlation(a,b){
  const n=a.length
  if(n<10)return null
  const ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n
  let ab=0,aa=0,bb=0
  for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;ab+=x*y;aa+=x*x;bb+=y*y}
  return aa>1e-9&&bb>1e-9?ab/Math.sqrt(aa*bb):null
}
const round=n=>n===null||!Number.isFinite(n)?null:+n.toFixed(6)

export function simulateBR3Scenario({
  coupling=0.85,asymmetry=0,damping=0.46,detuning=BR3_PLAN.detuning,
  horizon=38,target='B',timeStep=0.04,includeTrace=false,
}={}){
  validate(coupling,'coupling',BR3_PLAN.coupling)
  validate(asymmetry,'asymmetry',BR3_PLAN.asymmetry)
  validate(damping,'damping',BR3_PLAN.damping)
  if(detuning!==BR3_PLAN.detuning)throw new RangeError('BR3 non-frozen detuning')
  validate(horizon,'horizon',BR3_PLAN.horizons)
  validate(target,'target',BR3_PLAN.target)
  validate(timeStep,'timeStep',BR3_PLAN.timeStep)
  const p={coupling,asymmetry,damping,detuning}
  const totalSteps=Math.round(horizon/timeStep),pulseStep=Math.round(BR3_PLAN.pulseTime/timeStep)
  const holdSteps=Math.ceil(BR3_PLAN.sustainedSeconds/timeStep)
  const sampleEvery=Math.max(1,Math.round(.25/timeStep))
  let base=[0,0,0,0],perturbed=[0,0,0,0]
  const head=BR3_PLAN.thresholds.map(threshold=>({threshold,count:0,start:null}))
  const tailsA=[],tailsB=[],trace=[]
  let peakResidue=0,finalResidue=null,diverged=false
  for(let i=0;i<=totalSteps;i++){
    const t=i*timeStep
    if(i===pulseStep){
      if(target==='A'||target==='BOTH')perturbed[1]+=BR3_PLAN.kick
      if(target==='B'||target==='BOTH')perturbed[3]+=BR3_PLAN.kick
    }
    if(!finite(base)||!finite(perturbed)){diverged=true;break}
    const residue=Math.hypot(...base.map((v,j)=>perturbed[j]-v))
    if(i>=pulseStep){
      peakResidue=Math.max(peakResidue,residue)
      for(const h of head){
        if(residue<h.threshold){
          h.count++
          if(h.count===holdSteps)h.start=i-holdSteps+1
        }else{
          h.count=0;h.start=null
        }
      }
    }
    if(i>=totalSteps-Math.round(8/timeStep)){tailsA.push(base[1]);tailsB.push(base[3])}
    if(includeTrace&&(i%sampleEvery===0||i===pulseStep||i===totalSteps)){
      trace.push({time:round(t),residue:round(residue)})
    }
    finalResidue=residue
    if(i===totalSteps)break
    base=rk4(t,base,timeStep,p)
    perturbed=rk4(t,perturbed,timeStep,p)
  }
  const baselineCorrelation=diverged?null:round(correlation(tailsA,tailsB))
  return {
    protocol:BR3_PROTOCOL,
    origin:'SIMULATED',
    ...p,horizon,target,timeStep,
    finalResidue:diverged?null:round(finalResidue),
    peakResidue:round(peakResidue),
    baselineCorrelation,
    highBaselineCorrelation:baselineCorrelation!==null&&baselineCorrelation>=BR3_PLAN.correlationFlag,
    outcomes:head.map(h=>{
      const recovered=!diverged&&h.count>=holdSteps&&h.start!==null
      return {
        threshold:h.threshold,
        status:diverged?'NUMERIC_RUNAWAY':recovered?'RECOVERED':'HORIZON_CENSORED',
        recovered,
        recoveryTime:recovered?round(h.start*timeStep-BR3_PLAN.pulseTime):null,
        hiddenMismatch:!diverged&&baselineCorrelation!==null&&
          baselineCorrelation>=BR3_PLAN.correlationFlag&&!recovered,
      }
    }),
    ...(includeTrace?{trace}:{}),
  }
}
const key=(p)=>[p.coupling,p.asymmetry,p.damping].join('|')

export function summarizeBR3Runs(runs){
  let recovered=0,censored=0,runaway=0,hiddenMismatch=0,highCoordination=0
  for(const r of runs)for(const o of r.outcomes){
    if(o.status==='RECOVERED')recovered++
    else if(o.status==='HORIZON_CENSORED')censored++
    else runaway++
    if(o.hiddenMismatch)hiddenMismatch++
    if(r.highBaselineCorrelation)highCoordination++
  }
  return {integrations:runs.length,thresholdOutcomes:recovered+censored+runaway,
    recovered,censored,runaway,hiddenMismatch,highCoordination}
}

export function runBR3Panel({damping=null}={}){
  if(damping!==null)validate(damping,'damping',BR3_PLAN.damping)
  const dampings=damping===null?BR3_PLAN.damping:[damping]
  const runs=[]
  for(const d of dampings)for(const k of BR3_PLAN.coupling)for(const a of BR3_PLAN.asymmetry){
    for(const horizon of BR3_PLAN.horizons)for(const target of BR3_PLAN.target)for(const timeStep of BR3_PLAN.timeStep){
      runs.push(simulateBR3Scenario({coupling:k,asymmetry:a,damping:d,horizon,target,timeStep}))
    }
  }
  const byBase=dampings.flatMap(d=>BR3_PLAN.coupling.flatMap(k=>BR3_PLAN.asymmetry.map(a=>{
    const group=runs.filter(r=>r.coupling===k&&r.asymmetry===a&&r.damping===d)
    const reference=group.find(r=>r.horizon===38&&r.target==='B'&&r.timeStep===.04)
    const get=(r,threshold=.06)=>r.outcomes.find(o=>o.threshold===threshold)
    const horizonRescue=BR3_PLAN.target.filter(t=>{
      const short=group.find(r=>r.target===t&&r.timeStep===.04&&r.horizon===38)
      const long=group.find(r=>r.target===t&&r.timeStep===.04&&r.horizon===120)
      return !get(short).recovered&&get(long).recovered
    }).length
    const sites=BR3_PLAN.target.map(t=>{
      const r=group.find(x=>x.horizon===38&&x.timeStep===.04&&x.target===t)
      return get(r).recovered
    })
    const kickSiteVariation=new Set(sites).size>1
    const thresholdFlip=BR3_PLAN.thresholds.map(v=>get(reference,v).recovered)
    const thresholdSensitive=new Set(thresholdFlip).size>1
    const fine=group.find(r=>r.horizon===38&&r.target==='B'&&r.timeStep===.02)
    const coarse=get(reference),fineO=get(fine)
    const dtFlip=coarse.recovered!==fineO.recovered
    const dtDifference=coarse.recoveryTime===null||fineO.recoveryTime===null?null:
      round(Math.abs(coarse.recoveryTime-fineO.recoveryTime))
    return {coupling:k,asymmetry:a,damping:d,
      baseKey:key({coupling:k,asymmetry:a,damping:d}),
      baselineCorrelation:reference.baselineCorrelation,
      baselineRecovered:coarse.recovered,
      horizonRescue,kickSiteVariation,thresholdSensitive,dtFlip,dtDifference,
      coarseHighWithoutRecovery:reference.highBaselineCorrelation&&!coarse.recovered,
      ...(damping===null?{}:{}),
    }
  })))
  return {protocol:BR3_PROTOCOL,origin:'SIMULATED',grid:BR3_PLAN,
    runs,byBase,summary:summarizeBR3Runs(runs)}
}
export function buildBR3Receipt(result){
  if(result?.protocol!==BR3_PROTOCOL||result.origin!=='SIMULATED'||!Array.isArray(result.runs))
    throw new Error('BR3 requires authentic simulation output')
  return {protocol:BR3_PROTOCOL,origin:'SIMULATED',evidenceStatus:'SYNTHETIC_ROBUSTNESS_ONLY',
    authority:'NONE',frozenPlan:BR3_PLAN,summary:result.summary,byBase:result.byBase,runs:result.runs,
    limitations:'Finite-horizon tests of one linear model, not proof about natural systems, society, consciousness or chaos.'}
}
