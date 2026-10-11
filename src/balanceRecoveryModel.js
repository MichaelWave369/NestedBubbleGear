// NBG-BR1: synthetic, dimensionless, deterministically integrated coupled oscillators.
// Not a model of culture, sex, consciousness, or verified natural gear behavior.
export const BR1_PROTOCOL = 'NBG-BR1-v0.1.0'
export const BR1_DEFAULTS = Object.freeze({
  coupling: 0.85,
  asymmetry: 0,
  damping: 0.46,
  detuning: 0.12,
  kick: 2.0,
  duration: 38,
  timeStep: 0.02,
  pulseTime: 10,
  driveAmplitude: 0.75,
})

export const BR1_PRESETS = Object.freeze({
  reciprocal: {label:'Reciprocal feedback', coupling:0.85, asymmetry:0, damping:0.46, detuning:0.12, kick:2},
  asymmetric: {label:'Directional coupling', coupling:0.85, asymmetry:0.9, damping:0.46, detuning:0.12, kick:2},
  uncoupled: {label:'Uncoupled control', coupling:0, asymmetry:0, damping:0.46, detuning:0.12, kick:2},
  weakDamping: {label:'Slow recovery control', coupling:0.85, asymmetry:0, damping:0.07, detuning:0.12, kick:2},
  negativeDamping: {label:'Unstable gain control', coupling:0.85, asymmetry:0, damping:-0.42, detuning:0.12, kick:2},
})

const within = (value, minimum, maximum, name) => {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be a finite number in [${minimum}, ${maximum}]`)
  }
  return value
}

export function validateBR1(input={}) {
  const p={...BR1_DEFAULTS,...input}
  return {
    coupling:within(p.coupling,0,2,'coupling'),
    asymmetry:within(p.asymmetry,-1,1,'asymmetry'),
    damping:within(p.damping,-0.6,1,'damping'),
    detuning:within(p.detuning,0,0.65,'detuning'),
    kick:within(p.kick,0,4,'kick'),
    duration:within(p.duration,20,50,'duration'),
    timeStep:within(p.timeStep,0.01,0.05,'timeStep'),
    pulseTime:within(p.pulseTime,3,15,'pulseTime'),
    driveAmplitude:within(p.driveAmplitude,0,2,'driveAmplitude'),
  }
}

function derivative(t,s,p) {
  const [xa,va,xb,vb]=s
  const wA=1.2, wB=wA+p.detuning
  const kAB=p.coupling*(1-p.asymmetry)
  const kBA=p.coupling*(1+p.asymmetry)
  return [
    va,
    -(wA*wA)*xa-p.damping*va+kAB*(xb-xa)+p.driveAmplitude*Math.sin(1.2*t),
    vb,
    -(wB*wB)*xb-p.damping*vb+kBA*(xa-xb),
  ]
}
function stepRK4(t,s,dt,p) {
  const a=derivative(t,s,p)
  const b=derivative(t+dt/2,s.map((v,i)=>v+dt*a[i]/2),p)
  const c=derivative(t+dt/2,s.map((v,i)=>v+dt*b[i]/2),p)
  const d=derivative(t+dt,s.map((v,i)=>v+dt*c[i]),p)
  return s.map((v,i)=>v+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6)
}
const norm = (s1,s2) => Math.hypot(...s1.map((x,i)=>x-s2[i]))
const finite = s => s.every(Number.isFinite) && s.every(x=>Math.abs(x)<1e6)

function correlation(valuesA,valuesB) {
  if(valuesA.length<10)return null
  const n=valuesA.length
  const ma=valuesA.reduce((a,b)=>a+b,0)/n
  const mb=valuesB.reduce((a,b)=>a+b,0)/n
  let a=0,b=0,c=0
  for(let i=0;i<n;i++){
    const da=valuesA[i]-ma,db=valuesB[i]-mb
    a+=da*db;b+=da*da;c+=db*db
  }
  return b>1e-9&&c>1e-9?a/Math.sqrt(b*c):null
}

export function simulateBR1(config={}) {
  const p=validateBR1(config)
  const steps=Math.round(p.duration/p.timeStep)
  const pulseStep=Math.round(p.pulseTime/p.timeStep)
  const sampleEvery=Math.max(1,Math.round(0.1/p.timeStep))
  let base=[0,0,0,0],kick=[0,0,0,0],nonFinite=false
  const trace=[]
  const tailA=[],tailB=[]
  let peakDistance=0,settlingStep=null,hold=0
  const threshold=0.06, holdSteps=Math.ceil(2/p.timeStep)
  for(let i=0;i<=steps;i++){
    const t=i*p.timeStep
    if(i===pulseStep)kick=[...kick.slice(0,3),kick[3]+p.kick]
    if(!finite(base)||!finite(kick)){nonFinite=true;break}
    const residue=norm(base,kick)
    if(i>=pulseStep){
      peakDistance=Math.max(peakDistance,residue)
      if(residue<threshold){hold++;if(hold===holdSteps&&settlingStep===null)settlingStep=i-holdSteps+1}
      else{hold=0;settlingStep=null}
    }
    if(i>=steps-Math.round(8/p.timeStep)){
      tailA.push(base[1]);tailB.push(base[3])
    }
    if(i%sampleEvery===0||i===pulseStep||i===steps){
      trace.push({time:+t.toFixed(4),a:base[0],b:base[2],perturbedA:kick[0],perturbedB:kick[2],residue})
    }
    if(i===steps)break
    base=stepRK4(t,base,p.timeStep,p)
    kick=stepRK4(t,kick,p.timeStep,p)
  }
  const last=trace.at(-1)
  const recovered=!nonFinite&&settlingStep!==null&&hold>=holdSteps
  return {
    protocol:BR1_PROTOCOL,
    sourceClass:'SIMULATED',
    claimClass:'SYNTHETIC_MODEL_ONLY',
    parameters:p,
    coupling:{aReceivesFromB:p.coupling*(1-p.asymmetry),bReceivesFromA:p.coupling*(1+p.asymmetry)},
    metrics:{
      recovered,
      recoveryTime:recovered?+(settlingStep*p.timeStep-p.pulseTime).toFixed(3):null,
      finalResidue:nonFinite?null:last.residue,
      peakResidue:peakDistance,
      velocityCorrelation:correlation(tailA,tailB),
      diverged:nonFinite,
      threshold,holdSeconds:2,
    },
    trace,
  }
}

export function buildBR1Receipt(result) {
  const {metrics,parameters,coupling}=result
  return {
    protocol:BR1_PROTOCOL,
    origin:'SIMULATED',
    evidenceStatus:'SYNTHETIC_DEMONSTRATION',
    authority:'NONE',
    caveat:'No societal, metaphysical, biological, clinical, or chaotic-dynamics inference.',
    parameters,
    coupling,
    metrics,
    comparison:'Disturbed and undisturbed trajectories share identical deterministic forcing and initial states; only B receives a velocity kick at pulseTime.',
  }
}
