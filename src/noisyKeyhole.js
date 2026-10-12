// NBG-G3 · Noisy Keyhole: exact finite Bayesian sensor and calibration audit.
// Fully synthetic and analytical: NO randomly sampled data, no physical noise measurements.
import { G2_PROTOCOL, parity } from './dimensionalRecovery.js'
export const G3_PROTOCOL=Object.freeze({
 id:'NBG-G3',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
 inherits:'NBG-G2 16-state uniform hypercube; K3 reads X,Y,Z exactly',
 measuredProbe:'G2 mask 15 (X XOR Y XOR Z XOR W); xor known X,Y,Z to observe W through noise',
 regimes:['IID','COMMON_CAUSE'],
 assumptions:['MATCHED','NAIVE_IID'],
 prior:'P(W=0)=P(W=1)=1/2 after observing K3',
 scope:'Synthetic finite binary sensors only; no empirical physical or theological inference'
})
export const G3_REPEATS=Object.freeze([1,3,5,9])
export const G3_NOISE=Object.freeze([0,.05,.10,.20,.30,.50])
export const G3_THRESHOLDS=Object.freeze([.60,.80,.95,.99])
export const G3_REGIMES=Object.freeze(['IID','COMMON_CAUSE'])
export const G3_ASSUMPTIONS=Object.freeze(['MATCHED','NAIVE_IID'])
const round=x=>Math.round(x*1e12)/1e12
const optionsOK=({repeats,noise,threshold,regime,assumption})=>{
 if(!G3_REPEATS.includes(repeats))throw Error('Repeats must be 1,3,5 or 9')
 if(!Number.isFinite(noise)||noise<0||noise>.5)throw Error('Noise must be in [0, .5]')
 if(!Number.isFinite(threshold)||threshold<.5||threshold>1)throw Error('Threshold must be in [.5, 1]')
 if(!G3_REGIMES.includes(regime))throw Error('Unknown true-noise regime')
 if(!G3_ASSUMPTIONS.includes(assumption))throw Error('Unknown observer assumption')
}
export function binomial(n,k){
 if(!Number.isInteger(n)||n<0||!Number.isInteger(k)||k<0||k>n)throw Error('Invalid binomial')
 let v=1
 for(let i=1;i<=k;i++)v=v*(n-i+1)/i
 return Math.round(v)
}
// Likelihood of an observable count k of decoded 1 bits given hidden W=w.
// COMMON_CAUSE flips all repeated samples together, rather than independently.
export function countLikelihood(w,repeats,k,noise,regime){
 if(w!==0&&w!==1)throw Error('Hidden bit must be 0 or 1')
 if(!Number.isInteger(repeats)||repeats<1||!Number.isInteger(k)||k<0||k>repeats)throw Error('Invalid count')
 if(!Number.isFinite(noise)||noise<0||noise>.5)throw Error('Invalid noise')
 if(!G3_REGIMES.includes(regime))throw Error('Unknown regime')
 if(regime==='COMMON_CAUSE'){
  if(k!==0&&k!==repeats)return 0
  return (k===repeats ? (w===1?1-noise:noise) : (w===0?1-noise:noise))
 }
 const p1=w===1?1-noise:noise
 return binomial(repeats,k)*p1**k*(1-p1)**(repeats-k)
}
export function inferW({repeats,ones,noise,assumedRegime='IID',threshold=.95}){
 if(!G3_REGIMES.includes(assumedRegime))throw Error('Unknown assumed regime')
 if(!Number.isInteger(ones)||ones<0||ones>repeats)throw Error('Invalid observed count')
 if(!Number.isFinite(threshold)||threshold<.5||threshold>1)throw Error('Invalid threshold')
 const l0=countLikelihood(0,repeats,ones,noise,assumedRegime)
 const l1=countLikelihood(1,repeats,ones,noise,assumedRegime)
 const total=l0+l1
 if(total===0)return {posteriorW1:null,confidence:null,decision:null,status:'IMPOSSIBLE_UNDER_ASSUMED_MODEL'}
 const posteriorW1=l1/total,confidence=Math.max(posteriorW1,1-posteriorW1)
 const tied=Math.abs(posteriorW1-.5)<1e-12
 const accepted=!tied&&confidence+1e-12>=threshold
 return {posteriorW1,confidence,decision:accepted?(posteriorW1>.5?1:0):null,
  status:accepted?'RESOLVED':tied?'TIED_PRIOR':'LOW_CONFIDENCE'}
}
// Exact enumeration of the COUNT distribution for both true W values.
// All 16 G2 vertices are represented via their uniform W marginal after K3;
// the three known coordinates do not change the posterior for this parity query.
export function evaluateG3({repeats=5,noise=.1,threshold=.95,regime='IID',assumption='MATCHED'}={}){
 optionsOK({repeats,noise,threshold,regime,assumption})
 const assumedRegime=assumption==='MATCHED'?regime:'IID'
 let totalMass=0,acceptedMass=0,wrongMass=0,confMass=0,impossibleMass=0
 const counts=[]
 for(let ones=0;ones<=repeats;ones++){
  const inference=inferW({repeats,ones,noise,assumedRegime,threshold})
  let marginal=0,wrongAtCount=0
  for(let trueW=0;trueW<=1;trueW++){
   const mass=.5*countLikelihood(trueW,repeats,ones,noise,regime)
   totalMass+=mass;marginal+=mass
   if(inference.decision!==null){
    acceptedMass+=mass;confMass+=mass*inference.confidence
    if(inference.decision!==trueW){wrongMass+=mass;wrongAtCount+=mass}
   }else if(inference.status==='IMPOSSIBLE_UNDER_ASSUMED_MODEL')impossibleMass+=mass
  }
  counts.push({ones,probability:marginal,decision:inference.decision,
    confidence:inference.confidence,status:inference.status,wrongProbability:wrongAtCount})
 }
 const conditionalError=acceptedMass>0?wrongMass/acceptedMass:null
 const meanClaimedConfidence=acceptedMass>0?confMass/acceptedMass:null
 const actualAccuracy=conditionalError!==null?1-conditionalError:null
 return {protocolId:G3_PROTOCOL.id,origin:'SIMULATED',authority:'NONE',
  repeats,noise,threshold,regime,assumption,assumedRegime,
  outcomeMass:totalMass,coverage:acceptedMass,unconditionalWrongMass:wrongMass,
  conditionalError,actualAccuracy,meanClaimedConfidence,
  confidenceGap:actualAccuracy===null?null:meanClaimedConfidence-actualAccuracy,
  impossibleMass,counts,
  verdict:acceptedMass<=1e-12?'NO_DECISIONS':impossibleMass>1e-12?'ASSUMPTION_MODEL_CONFLICT':'ANALYTIC_ONLY'}
}
export function g3Curve(config={}){
 return G3_REPEATS.map(repeats=>{
  const row=evaluateG3({...config,repeats})
  return {repeats,coverage:row.coverage,conditionalError:row.conditionalError,
   actualAccuracy:row.actualAccuracy,confidence:row.meanClaimedConfidence,
   confidenceGap:row.confidenceGap,unconditionalWrongMass:row.unconditionalWrongMass}
 })
}
export function selectedWitness({state=5,repeats=5,flippedSamples=0,noise=.1,threshold=.95,regime='IID',assumption='MATCHED'}={}){
 if(!Number.isInteger(state)||state<0||state>15)throw Error('True G2 state must be 0..15')
 optionsOK({repeats,noise,threshold,regime,assumption})
 if(!Number.isInteger(flippedSamples)||flippedSamples<0||flippedSamples>repeats)throw Error('Invalid flip count')
 if(regime==='COMMON_CAUSE'&&flippedSamples!==0&&flippedSamples!==repeats)throw Error('Shared-flip control requires 0 or n flips')
 const w=parity(state,8),parityProbe=parity(state,15)
 const knownXYZ=parity(state,7)
 const decodedBits=Array.from({length:repeats},(_,i)=>w^(i<flippedSamples?1:0))
 const rawBits=decodedBits.map(v=>v^knownXYZ)
 const ones=decodedBits.reduce((a,b)=>a+b,0)
 const assumedRegime=assumption==='MATCHED'?regime:'IID'
 const inference=inferW({repeats,ones,noise,assumedRegime,threshold})
 const likelihood=countLikelihood(w,repeats,ones,noise,regime)
 return {state,trueW:w,knownXYZ,idealProbe:parityProbe,
  flippedSamples,rawBits,decodedBits,ones,likelihood,
  inference,correct:inference.decision===null?null:inference.decision===w,
  note:'Constructed illustration of a count, not sampled evidence or an independent trial.'}
}
export function buildG3Receipt(config={}){
 const {state=5,flippedSamples=0,...settings}=config
 const parameters={repeats:5,noise:.1,threshold:.95,regime:'IID',assumption:'MATCHED',...settings}
 const result=evaluateG3(parameters)
 const witness=selectedWitness({...parameters,state,flippedSamples})
 return {protocol:G3_PROTOCOL,g2ProtocolId:G2_PROTOCOL.id,
  origin:'SIMULATED',authority:'NONE',settings:{...parameters,state,flippedSamples},
  result,comparison:{
    iidMatched:evaluateG3({...parameters,regime:'IID',assumption:'MATCHED'}),
    commonMatched:evaluateG3({...parameters,regime:'COMMON_CAUSE',assumption:'MATCHED'}),
    commonNaive:evaluateG3({...parameters,regime:'COMMON_CAUSE',assumption:'NAIVE_IID'})
  },witness,
  caveat:'No Monte Carlo samples or empirical events. Exact analytic probability over a uniform 16-state toy model. Shared-cause repeats are not independent.'}
}
