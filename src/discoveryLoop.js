import { analyzePhaseClosure } from './phaseClosureMath.js'
import { PHASE_CATALOG, selectNextPhaseProbe } from './adaptivePhaseKeyhole.js'
import { runUnknownGearExperiment, unknownGearReceipt } from './unknownGearModel.js'
import { runModelMismatchRecovery, modelRecoveryReceipt } from './modelMismatchRecovery.js'

export const DISCOVERY_STAGES=Object.freeze([
  {id:'GEOMETRY',name:'Observe',detail:'Analytic gear motion'},
  {id:'OBSERVER',name:'Compare',detail:'Measurement keyhole'},
  {id:'MISMATCH',name:'Detect mismatch',detail:'Catalog consistency'},
  {id:'RECOVERY',name:'Propose & falsify',detail:'Frozen candidate + holdout'},
  {id:'REVIEW',name:'Quarantine & review',detail:'Explicit evidence boundary'},
])
export const DISCOVERY_SCENARIOS=Object.freeze([
  {id:'UNKNOWN_FAR',label:'Uncatalogued e = 0.72',truth:.72},
  {id:'KNOWN',label:'Catalogued e = 0.32',truth:.32},
  {id:'UNKNOWN_NEAR',label:'Nearby unknown e = 0.29',truth:.29},
  {id:'UNKNOWN_SHIFT',label:'Uncatalogued e = 0.84',truth:.84},
])
function validate({scenario,resolutionDegrees,declaredNoiseBoundDegrees,injectedNoiseDegrees,seed,holdoutShift}){
  if(!DISCOVERY_SCENARIOS.some(s=>s.id===scenario))throw new RangeError('Unknown scenario')
  if(![4,8,12,16].includes(resolutionDegrees))throw new RangeError('Unsupported rounding')
  if(![.5,1,1.5,2,4].includes(declaredNoiseBoundDegrees))throw new RangeError('Unsupported declared noise')
  if(![0,1,2,4].includes(injectedNoiseDegrees))throw new RangeError('Unsupported injected noise')
  if(![0,7,369,2026].includes(seed))throw new RangeError('Unsupported seed')
  if(![0,.14].includes(holdoutShift))throw new RangeError('Unsupported intervention')
}
export function runDiscoveryLoop({
  scenario='UNKNOWN_FAR',resolutionDegrees=4,
  injectedNoiseDegrees=1,declaredNoiseBoundDegrees=1.5,seed=369,holdoutShift=0,
}={}){
  const settings={scenario,resolutionDegrees,injectedNoiseDegrees,declaredNoiseBoundDegrees,seed,holdoutShift}
  validate(settings)
  const truthEccentricity=DISCOVERY_SCENARIOS.find(s=>s.id===scenario).truth
  const geometry=analyzePhaseClosure({
    referenceE:0,comparisonE:truthEccentricity,
    samples:128,keyhole:'PHASE_TRACE',retainHistory:true,
  })
  const referenceKeyhole=analyzePhaseClosure({
    referenceE:0,comparisonE:truthEccentricity,samples:128,keyhole:'ENDPOINT',
  })
  const catalogIds=PHASE_CATALOG.map(row=>row.id)
  const plannedProbe=selectNextPhaseProbe(catalogIds,[],resolutionDegrees)
  const shared={truthEccentricity,resolutionDegrees,injectedNoiseDegrees,
    declaredNoiseBoundDegrees,seed,queryBudget:6}
  const mismatch=runUnknownGearExperiment({...shared,requiredConfirmations:2})
  const recovery=runModelMismatchRecovery({...shared,
    proposalGrid:'FINE',holdoutCount:3,holdoutShift})
  const originalReadingFingerprint=JSON.stringify(mismatch.steps.map(step=>
    [step.index,step.angle,step.observedDegrees]))
  const recoveryReadingFingerprint=JSON.stringify(recovery.originalTraining.map(step=>
    [step.index,step.angle,step.observedDegrees]))
  const linked=originalReadingFingerprint===recoveryReadingFingerprint &&
    mismatch.status===recovery.rejectedCatalogStatus
  if(!linked)throw new Error('Recovery source does not replay the same parent observations')
  const steps=[
    {id:'GEOMETRY',status:'SIMULATED_MOTION',
      detail:'Full-cycle closure '+(geometry.checks.endpointClosure?'PASS':'FAIL')+
        '; sampled phase difference '+Math.abs(geometry.phasePeak.differenceDegrees).toFixed(3)+'°'},
    {id:'OBSERVER',status:'KEYHOLE_LIMITED',
      detail:'Endpoint observer cannot distinguish; initial catalog probe '+
        plannedProbe.angle+'°; worst partition '+plannedProbe.worstCase},
    {id:'MISMATCH',status:mismatch.status,
      detail:mismatch.steps.length+' synthetic measurements, '+
        mismatch.survivors.length+' remaining catalog models'},
    {id:'RECOVERY',status:recovery.status,
      detail:recovery.candidate
        ? 'Proposed e = '+recovery.candidate.eccentricity.toFixed(2)+
            ', heldout '+recovery.holdout.filter(step=>step.consistent).length+
            '/'+recovery.holdout.length+' fit'
        : 'No authorized candidate for this input and proposal grid'},
    {id:'REVIEW',status:'PROMOTION_DENIED',
      detail:'Demonstration only. No verified physics, funds, or frozen research is modified.'},
  ]
  return {
    schema:'nbg.discovery-loop.simulation.v1',
    origin:'SIMULATED',authority:'DEMONSTRATION_ONLY',
    settings,truthEccentricity,
    geometry:{
      endpointClosure:geometry.checks.endpointClosure,
      endpointDistinguishes:referenceKeyhole.observed.distinguishes,
      traceDistinguishes:geometry.observed.distinguishes,
      phasePeakDegrees:geometry.phasePeak.differenceDegrees,
    },
    observer:{firstPlannedProbeDegrees:plannedProbe.angle,
      partitionWorstCase:plannedProbe.worstCase,
      referenceCatalog:'DECLARED_EIGHT_PROFILE_CATALOG_NOT_GUARANTEED_TO_CONTAIN_ORACLE'},
    mismatch,
    recovery,
    stages:steps,
    chainIntegrity:{sourceReadingsExactReplay:linked,
      noPromotion:recovery.promoted===false,
      noFrozenResearchMutation:true,
      modelFamilyIsNotVerified:true},
    finalReview:'HUMAN_REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION',
  }
}
export function discoveryLoopReceipt(run){
  return {
    schema:'nbg.discovery-loop.receipt.v1',
    origin:'SIMULATED',authority:'DEMONSTRATION_ONLY',
    settings:run.settings,
    geometry:run.geometry,
    observer:run.observer,
    stages:run.stages,
    chainIntegrity:run.chainIntegrity,
    mismatch:unknownGearReceipt(run.mismatch),
    recovery:modelRecoveryReceipt(run.recovery),
    review:run.finalReview,
    frozenExperimentsModified:false,
    promoted:false,
  }
}
