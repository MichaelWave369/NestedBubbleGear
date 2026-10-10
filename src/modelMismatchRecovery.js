import { PHASE_PROBE_ANGLES, oraclePhaseDegrees } from './adaptivePhaseKeyhole.js'
import { runUnknownGearExperiment, simulateUnknownReading } from './unknownGearModel.js'

// Predeclared proposal families. Not inferred from, or enlarged using, the oracle's identity.
export const RECOVERY_GRIDS = Object.freeze({
  FINE: Object.freeze(Array.from({length:18},(_,i)=>Number((.56+.02*i).toFixed(2)))),
  COARSE: Object.freeze([.56,.64,.72,.80,.88]),
  EXCLUDES_TRUTH: Object.freeze([.56,.58,.60,.62]),
})
export const RECOVERY_SCENARIOS = Object.freeze([
  { id:'FAR_UNKNOWN', label:'Rejected unknown (e = .72)', truth:.72 },
  { id:'KNOWN_CONTROL', label:'Known control (e = .32)', truth:.32 },
  { id:'NEAR_UNKNOWN', label:'Near-catalog unknown (e = .29)', truth:.29 },
  { id:'ANOTHER_UNKNOWN', label:'Rejected unknown (e = .84)', truth:.84 },
])
export const RECOVERY_HOLDOUT_SHIFTS = Object.freeze([0,.14])
export const RECOVERY_STATES = Object.freeze([
  'REFUSED_NO_CATALOG_REJECTION',
  'REFUSED_INVALID_NOISE_ASSUMPTIONS',
  'NO_TRAINING_COMPATIBLE_PROPOSAL',
  'INSUFFICIENT_INDEPENDENT_HOLDOUT',
  'HOLDOUT_REFUTED',
  'HOLDOUT_COMPATIBLE_UNVERIFIED',
])
function validate({proposalGrid,holdoutShift,holdoutCount,truthEccentricity}) {
  if(!Object.hasOwn(RECOVERY_GRIDS,proposalGrid)) throw new RangeError('Unknown proposal grid')
  if(!RECOVERY_HOLDOUT_SHIFTS.includes(holdoutShift)) throw new RangeError('Unknown holdout intervention')
  if(!Number.isInteger(holdoutCount)||holdoutCount<2||holdoutCount>5) throw new RangeError('Holdout count out of range')
  if(!Number.isFinite(truthEccentricity)||truthEccentricity<0||truthEccentricity>=.85)
    throw new RangeError('Truth eccentricity out of supported recovery range')
  if(truthEccentricity+holdoutShift>=.99) throw new RangeError('Holdout shift outside model domain')
}
const radius = (resolution, bound) => resolution/2 + bound + 1e-8
function fitProposal(eccentricity, training, allowedRadius) {
  const residuals = training.map(step => ({
    angle:step.angle,
    observedDegrees:step.observedDegrees,
    predictedDegrees:oraclePhaseDegrees(eccentricity,step.angle),
    absoluteResidual:Math.abs(oraclePhaseDegrees(eccentricity,step.angle)-step.observedDegrees),
  }))
  return {
    eccentricity,
    residuals,
    maximumResidual:Math.max(...residuals.map(r=>r.absoluteResidual)),
    totalAbsoluteResidual:residuals.reduce((s,r)=>s+r.absoluteResidual,0),
    consistent:residuals.every(r=>r.absoluteResidual<=allowedRadius),
  }
}
function bestHoldoutAngles(eccentricity,used,count){
  const lower=Math.max(0,eccentricity-.05),upper=Math.min(.98,eccentricity+.05)
  return PHASE_PROBE_ANGLES.filter(angle=>!used.includes(angle))
    .map(angle=>({angle,sensitivity:Math.abs(oraclePhaseDegrees(upper,angle)-oraclePhaseDegrees(lower,angle))}))
    .sort((a,b)=>b.sensitivity-a.sensitivity||a.angle-b.angle)
    .slice(0,count).map(row=>row.angle)
}
export function runModelMismatchRecovery({
  truthEccentricity=.72,
  proposalGrid='FINE',
  holdoutShift=0,
  holdoutCount=3,
  resolutionDegrees=4,
  injectedNoiseDegrees=1,
  declaredNoiseBoundDegrees=1.5,
  seed=369,
  queryBudget=6,
}={}){
  validate({proposalGrid,holdoutShift,holdoutCount,truthEccentricity})
  const options={truthEccentricity,resolutionDegrees,injectedNoiseDegrees,
    declaredNoiseBoundDegrees,seed,queryBudget,requiredConfirmations:2}
  const original=runUnknownGearExperiment(options)
  const training=original.steps.map(({index,angle,observedDegrees,before,after})=>
    ({index,angle,observedDegrees,before,after}))
  const settings={...options,proposalGrid,holdoutShift,holdoutCount}
  const common={
    schema:'nbg.model-mismatch-recovery.simulation.v1',
    origin:'SIMULATED',
    authority:'DEMONSTRATION_ONLY',
    settings,
    rejectedCatalogStatus:original.status,
    originalChecks:original.checks,
    originalSurvivors:original.survivors,
    originalTraining:training,
    declaredGrid:RECOVERY_GRIDS[proposalGrid],
    allowedAngles:PHASE_PROBE_ANGLES,
    errorRadiusDegrees:radius(resolutionDegrees,declaredNoiseBoundDegrees),
    candidate:null,
    eligibleProposals:[],
    holdout:[],
    frozenBeforeHoldout:false,
    promoted:false,
    quarantine:'REQUIRES_INDEPENDENT_REAL_WORLD_VALIDATION',
    disclaimer:'No model family is authorized as verified science; holdout uses simulated data only.',
  }
  const refuse=(status)=>({...common,status})
  if(original.status==='MODEL_ASSUMPTIONS_VIOLATED')
    return refuse('REFUSED_INVALID_NOISE_ASSUMPTIONS')
  if(original.status!=='NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
    return refuse('REFUSED_NO_CATALOG_REJECTION')
  if(training.length===0) return refuse('NO_TRAINING_COMPATIBLE_PROPOSAL')
  const fits=RECOVERY_GRIDS[proposalGrid].map(e=>fitProposal(e,training,common.errorRadiusDegrees))
  const eligible=fits.filter(fit=>fit.consistent)
    .sort((a,b)=>a.totalAbsoluteResidual-b.totalAbsoluteResidual||a.eccentricity-b.eccentricity)
  if(!eligible.length) return {
    ...common,status:'NO_TRAINING_COMPATIBLE_PROPOSAL',
    proposalAudit:fits.map(({eccentricity,maximumResidual,consistent})=>({eccentricity,maximumResidual,consistent})),
  }
  // Freeze the training-only winner and prediction before calling the synthetic holdout oracle.
  const selected=eligible[0]
  const candidate={
    eccentricity:selected.eccentricity,
    totalAbsoluteTrainingResidual:selected.totalAbsoluteResidual,
    maximumTrainingResidual:selected.maximumResidual,
    trainingPredictions:selected.residuals,
    status:'QUARANTINED_CANDIDATE',
  }
  const eligibleProposals=eligible.map(({eccentricity,totalAbsoluteResidual,maximumResidual})=>
    ({eccentricity,totalAbsoluteResidual,maximumResidual}))
  const used=training.map(step=>step.angle)
  const angles=bestHoldoutAngles(candidate.eccentricity,used,holdoutCount)
  const preliminary={...common,candidate,eligibleProposals,frozenBeforeHoldout:true,
    unusedHoldoutAngles:angles,proposalAudit:fits.map(({eccentricity,maximumResidual,consistent})=>
      ({eccentricity,maximumResidual,consistent})),
  }
  if(angles.length<holdoutCount)
    return {...preliminary,status:'INSUFFICIENT_INDEPENDENT_HOLDOUT'}
  const holdout=angles.map((angle,i)=>{
    const reading=simulateUnknownReading(truthEccentricity+holdoutShift,angle,
      resolutionDegrees,injectedNoiseDegrees,seed,100+i)
    const predictedDegrees=oraclePhaseDegrees(candidate.eccentricity,angle)
    const absoluteResidual=Math.abs(predictedDegrees-reading.observedDegrees)
    return {
      index:i+1,angle,
      observedDegrees:reading.observedDegrees,
      predictedDegrees,
      absoluteResidual,
      consistent:absoluteResidual<=common.errorRadiusDegrees,
      errorRadiusDegrees:common.errorRadiusDegrees,
      oracleExactDegrees:reading.exactDegrees,
      injectedJitterDegrees:reading.jitterDegrees,
    }
  })
  const pass=holdout.every(row=>row.consistent)
  return {...preliminary,holdout,
    status:pass?'HOLDOUT_COMPATIBLE_UNVERIFIED':'HOLDOUT_REFUTED',
    holdoutAllPass:pass,
    audit:{
      holdoutDisjointFromTraining:holdout.every(row=>!used.includes(row.angle)),
      candidateInPredeclaredGrid:RECOVERY_GRIDS[proposalGrid].includes(candidate.eccentricity),
      candidateFitsAllTraining:selected.consistent,
      candidateFrozenBeforeHoldout:true,
      promotionDenied:true,
    },
  }
}
export function modelRecoveryReceipt(result){
  return {
    schema:'nbg.model-mismatch-recovery.receipt.v1',
    origin:'SIMULATED',authority:'DEMONSTRATION_ONLY',
    claim:'TRAINING_AND_HOLDOUT_MODEL_RELATIVE_ONLY',
    settings:result.settings,
    gate:{originalStatus:result.rejectedCatalogStatus,
      originalChecks:result.originalChecks,
      survivorIds:result.originalSurvivors},
    training:result.originalTraining,
    proposalGrid:result.declaredGrid,
    proposalAudit:result.proposalAudit||[],
    eligibleProposals:result.eligibleProposals,
    candidate:result.candidate,
    frozenBeforeHoldout:result.frozenBeforeHoldout,
    holdout:result.holdout,
    audit:result.audit||null,
    status:result.status,
    quarantine:result.quarantine,
    promoted:false,
    limitations:[
      'The selected oracle is a simulation, not a measured external system.',
      'Holdout angles are distinct from training angles, but share model class and simulation generator.',
      'Passing a synthetic holdout does not validate the model in nature.',
      'The finite grid cannot recover mechanisms outside the proposal family.',
      'Changing the simulation regime at holdout can refute a stationary candidate without proving it was invalid in training.',
      'Model promotion and frozen NBG evidence modification are prohibited.',
    ],
  }
}
