import {
  displayFingerprint,
  governanceView,
  observedTimeline,
  stableStringify,
} from './counterfactualGovernance.js'

export const SENSITIVITY_INTERVENTIONS = [
  { id:'I_REMOVE_DEACTIVATE', operation:'REMOVE_EVENT', target:'EV_DEACTIVATE_EMERGENCY', patch:{}, label:'Remove deactivation' },
  { id:'I_DELAY_DEACTIVATE_11', operation:'DELAY_EVENT', target:'EV_DEACTIVATE_EMERGENCY', patch:{ knownTime:11, validTime:11 }, label:'Delay deactivation' },
  { id:'I_ALTER_DEACTIVATE_VALID10', operation:'ALTER_EVENT', target:'EV_DEACTIVATE_EMERGENCY', patch:{ validTime:10 }, label:'Deactivation valid t10' },
  { id:'I_REMOVE_SUPERSEDE_NORMAL1', operation:'REMOVE_EVENT', target:'EV_SUPERSEDE_NORMAL_1', patch:{}, label:'Remove supersession' },
  { id:'I_DELAY_ACTIVATE_EMERGENCY_7', operation:'DELAY_EVENT', target:'EV_ACTIVATE_EMERGENCY', patch:{ knownTime:7, validTime:7 }, label:'Delay emergency activation' },
  { id:'I_REMOVE_REGISTER_NORMAL2', operation:'REMOVE_EVENT', target:'EV_REGISTER_NORMAL_2', patch:{}, label:'Remove NORMAL@2.0 registration' },
  { id:'I_DELAY_REGISTER_NORMAL2_11', operation:'DELAY_EVENT', target:'EV_REGISTER_NORMAL_2', patch:{ knownTime:11, validTime:11 }, label:'Delay NORMAL@2.0 registration' },
  { id:'I_REMOVE_REGISTER_EMERGENCY', operation:'REMOVE_EVENT', target:'EV_REGISTER_EMERGENCY_1', patch:{}, label:'Remove emergency registration' },
  { id:'I_ALTER_DEACTIVATE_PAYLOAD_ONLY', operation:'ALTER_EVENT', target:'EV_DEACTIVATE_EMERGENCY', patch:{ payload:{ reason:'synthetic annotation-only mutation' } }, label:'Payload-only negative control' },
]

function intervention(id) {
  const row=SENSITIVITY_INTERVENTIONS.find((item)=>item.id===id)
  if(!row) throw new Error('Unknown sensitivity intervention')
  return row
}

export function mutateTimeline(interventionId) {
  const spec=intervention(interventionId)
  const rows=observedTimeline()
  if(spec.operation==='REMOVE_EVENT'){
    return rows.filter((event)=>event.eventId!==spec.target)
  }
  return rows.map((event)=>
    event.eventId===spec.target ? { ...event, ...spec.patch } : event
  ).sort((a,b)=>a.knownTime-b.knownTime || a.eventId.localeCompare(b.eventId))
}

export function firstPolicyDivergence(interventionId,maxKnown=12,maxValid=12){
  const branch=mutateTimeline(interventionId)
  const observed=observedTimeline()
  for(let known=1;known<=maxKnown;known+=1){
    for(let valid=1;valid<=maxValid;valid+=1){
      const left=governanceView(observed,known,valid)
      const right=governanceView(branch,known,valid)
      if(left.selectedPolicyVersionId!==right.selectedPolicyVersionId){
        return {
          knownCutoff:known,
          validTime:valid,
          observedPolicy:left.selectedPolicyVersionId,
          counterfactualPolicy:right.selectedPolicyVersionId,
        }
      }
    }
  }
  return null
}

export function firstOutcomeDivergence(interventionId,maxKnown=12,maxValid=12){
  const branch=mutateTimeline(interventionId)
  const observed=observedTimeline()
  for(let known=1;known<=maxKnown;known+=1){
    for(let valid=1;valid<=maxValid;valid+=1){
      const left=governanceView(observed,known,valid)
      const right=governanceView(branch,known,valid)
      if(!left.selectedPolicyVersionId || !right.selectedPolicyVersionId) continue
      if(left.governanceOutcome!==right.governanceOutcome){
        return {
          knownCutoff:known,
          validTime:valid,
          observedOutcome:left.governanceOutcome,
          counterfactualOutcome:right.governanceOutcome,
        }
      }
    }
  }
  return null
}

export function classifySensitivity(interventionId,targetKnown=10,targetValid=10){
  const spec=intervention(interventionId)
  const observed=governanceView(observedTimeline(),targetKnown,targetValid)
  const branchTimeline=mutateTimeline(interventionId)
  const counterfactual=governanceView(branchTimeline,targetKnown,targetValid)
  const policyChanged=observed.selectedPolicyVersionId!==counterfactual.selectedPolicyVersionId
  const outcomeChanged=observed.governanceOutcome!==counterfactual.governanceOutcome
  const firstPolicy=firstPolicyDivergence(interventionId)
  const firstOutcome=firstOutcomeDivergence(interventionId)

  const targetClass=outcomeChanged
    ? 'OUTCOME_CHANGING'
    : policyChanged
      ? 'POLICY_CHANGING'
      : 'TARGET_INERT'

  const temporalClass=firstOutcome
    ? 'TEMPORAL_OUTCOME_LEVERAGE'
    : firstPolicy
      ? 'TEMPORAL_POLICY_LEVERAGE'
      : 'LEDGER_ONLY_INERT'

  const row={
    interventionId,
    label:spec.label,
    operation:spec.operation,
    targetEventId:spec.target,
    targetKnown,
    targetValid,
    observedPolicy:observed.selectedPolicyVersionId,
    counterfactualPolicy:counterfactual.selectedPolicyVersionId,
    observedOutcome:observed.governanceOutcome,
    counterfactualOutcome:counterfactual.governanceOutcome,
    policyChanged,
    outcomeChanged,
    targetClass,
    temporalClass,
    firstPolicyDivergence:firstPolicy,
    firstOutcomeDivergence:firstOutcome,
    observedLedgerFingerprint:observed.ledgerFingerprint,
    branchLedgerFingerprint:displayFingerprint(branchTimeline),
    causalClaim:'NONE_SENSITIVITY_IS_NOT_CAUSAL_ATTRIBUTION',
  }
  return { ...row, rowFingerprint:displayFingerprint(row) }
}

export function buildSensitivityAtlas(targetKnown=10,targetValid=10){
  const rows=SENSITIVITY_INTERVENTIONS
    .map((item)=>classifySensitivity(item.id,targetKnown,targetValid))
    .sort((a,b)=>a.interventionId.localeCompare(b.interventionId))
  const payload={
    experiment:'NBG-T13',
    version:'0.1.0',
    targetKnown,
    targetValid,
    rows,
    truthClaim:'SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION',
  }
  return { ...payload, atlasFingerprint:displayFingerprint(payload) }
}

export function minimalRejectedSingletons(targetKnown=10,targetValid=10){
  const atlas=buildSensitivityAtlas(targetKnown,targetValid)
  const sets=atlas.rows
    .filter((row)=>row.counterfactualOutcome==='REJECTED')
    .map((row)=>row.interventionId)
    .sort()
  return {
    desiredOutcome:'REJECTED',
    minimalCardinality:sets.length?1:null,
    interventionIds:sets,
    causalClaim:'NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE',
    fingerprint:displayFingerprint({ targetKnown,targetValid,sets }),
  }
}

export function buildSensitivityExport(targetKnown=10,targetValid=10){
  const atlas=buildSensitivityAtlas(targetKnown,targetValid)
  const minimal=minimalRejectedSingletons(targetKnown,targetValid)
  const payload={
    atlas,
    minimalInterventionSets:minimal,
    observedTimeline:observedTimeline(),
    truthClaim:'SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION',
  }
  return { ...payload, exportFingerprint:displayFingerprint(payload) }
}

export { stableStringify }
