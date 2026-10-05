import {
  SENSITIVITY_INTERVENTIONS,
  mutateTimeline,
} from './governanceSensitivity.js'
import {
  displayFingerprint,
  governanceView,
  stableStringify,
} from './counterfactualGovernance.js'

export const EQUIVALENCE_BOUNDARY='KEYHOLE_EQUIVALENCE_NOT_CAUSAL_IDENTITY'

function spec(id){
  const row=SENSITIVITY_INTERVENTIONS.find((item)=>item.id===id)
  if(!row) throw new Error('Unknown intervention')
  return row
}

function snapshot(interventionId,knownCutoff,validTime){
  const view=governanceView(mutateTimeline(interventionId),knownCutoff,validTime)
  return {
    knownCutoff,
    validTime,
    policyVersionId:view.selectedPolicyVersionId,
    governanceOutcome:view.governanceOutcome,
  }
}

export function interventionTemporalSignature(interventionId,maxKnown=12,maxValid=12){
  spec(interventionId)
  const rows=[]
  for(let known=1;known<=maxKnown;known+=1){
    for(let valid=1;valid<=maxValid;valid+=1){
      rows.push(snapshot(interventionId,known,valid))
    }
  }
  const payload={ interventionId,maxKnown,maxValid,rows }
  return { rows,signatureFingerprint:displayFingerprint(payload) }
}

export function interventionTargetSignature(interventionId,targetKnown=10,targetValid=10){
  const row=snapshot(interventionId,targetKnown,targetValid)
  return {
    policyVersionId:row.policyVersionId,
    governanceOutcome:row.governanceOutcome,
  }
}

export function interventionPairReceipt(leftId,rightId,targetKnown=10,targetValid=10){
  if(leftId===rightId) throw new Error('Pair requires distinct interventions')
  spec(leftId); spec(rightId)
  const [leftInterventionId,rightInterventionId]=[leftId,rightId].sort()
  const leftTarget=interventionTargetSignature(leftInterventionId,targetKnown,targetValid)
  const rightTarget=interventionTargetSignature(rightInterventionId,targetKnown,targetValid)
  const leftFull=interventionTemporalSignature(leftInterventionId)
  const rightFull=interventionTemporalSignature(rightInterventionId)
  const targetEquivalent=stableStringify(leftTarget)===stableStringify(rightTarget)
  const residue=[]

  leftFull.rows.forEach((left,index)=>{
    const right=rightFull.rows[index]
    if(left.policyVersionId!==right.policyVersionId || left.governanceOutcome!==right.governanceOutcome){
      residue.push({
        knownCutoff:left.knownCutoff,
        validTime:left.validTime,
        leftPolicy:left.policyVersionId,
        rightPolicy:right.policyVersionId,
        leftOutcome:left.governanceOutcome,
        rightOutcome:right.governanceOutcome,
      })
    }
  })

  const temporalEquivalent=residue.length===0
  const firstSeparatingKeyhole=residue[0]??null
  const classification=targetEquivalent
    ? temporalEquivalent
      ? 'TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY'
      : 'KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT'
    : 'TARGET_DISTINCT'

  const payload={
    experiment:'NBG-T14',
    version:'0.1.0',
    leftInterventionId,
    rightInterventionId,
    targetKeyhole:{ knownCutoff:targetKnown,validTime:targetValid },
    leftTargetSignature:leftTarget,
    rightTargetSignature:rightTarget,
    targetEquivalent,
    temporalEquivalent,
    classification,
    leftTemporalSignatureFingerprint:leftFull.signatureFingerprint,
    rightTemporalSignatureFingerprint:rightFull.signatureFingerprint,
    residueCount:residue.length,
    firstSeparatingKeyhole,
    minimalSeparatingKeyholeFamily:temporalEquivalent ? [] : [{
      knownCutoff:firstSeparatingKeyhole.knownCutoff,
      validTime:firstSeparatingKeyhole.validTime,
    }],
    minimalSeparatorCardinality:temporalEquivalent?0:1,
    governanceResidueFingerprint:displayFingerprint(residue),
    truthClaim:EQUIVALENCE_BOUNDARY,
    causalClaim:'NONE_EQUIVALENCE_CLASS_IS_NOT_CAUSAL_IDENTITY',
  }
  return { ...payload,receiptFingerprint:displayFingerprint(payload) }
}

export function buildInterventionEquivalenceAtlas(targetKnown=10,targetValid=10){
  const ids=SENSITIVITY_INTERVENTIONS.map((row)=>row.id).sort()
  const pairs=[]
  for(let i=0;i<ids.length;i+=1){
    for(let j=i+1;j<ids.length;j+=1){
      pairs.push(interventionPairReceipt(ids[i],ids[j],targetKnown,targetValid))
    }
  }

  const targetGroups=new Map()
  const temporalGroups=new Map()
  ids.forEach((id)=>{
    const target=interventionTargetSignature(id,targetKnown,targetValid)
    const targetKey=stableStringify(target)
    const full=interventionTemporalSignature(id)
    if(!targetGroups.has(targetKey)) targetGroups.set(targetKey,{ ...target,interventionIds:[] })
    targetGroups.get(targetKey).interventionIds.push(id)
    if(!temporalGroups.has(full.signatureFingerprint)) temporalGroups.set(full.signatureFingerprint,[])
    temporalGroups.get(full.signatureFingerprint).push(id)
  })

  const targetEquivalenceClasses=[...targetGroups.values()]
    .map((row)=>({ ...row,interventionIds:[...row.interventionIds].sort() }))
    .sort((a,b)=>stableStringify(a).localeCompare(stableStringify(b)))

  const temporalEquivalenceClasses=[...temporalGroups.entries()]
    .map(([signatureFingerprint,interventionIds])=>({
      signatureFingerprint,
      interventionIds:[...interventionIds].sort(),
    }))
    .sort((a,b)=>stableStringify(a.interventionIds).localeCompare(stableStringify(b.interventionIds)))

  const targetEquivalentPairs=pairs.filter((row)=>row.targetEquivalent)
  const hiddenResiduePairs=targetEquivalentPairs.filter((row)=>!row.temporalEquivalent)
  const temporallyEquivalentPairs=targetEquivalentPairs.filter((row)=>row.temporalEquivalent)

  const payload={
    experiment:'NBG-T14',
    version:'0.1.0',
    targetKeyhole:{ knownCutoff:targetKnown,validTime:targetValid },
    targetEquivalenceClasses,
    temporalEquivalenceClasses,
    pairs,
    counts:{
      interventions:ids.length,
      pairs:pairs.length,
      targetEquivalentPairs:targetEquivalentPairs.length,
      hiddenResiduePairs:hiddenResiduePairs.length,
      temporallyEquivalentPairs:temporallyEquivalentPairs.length,
    },
    truthClaim:EQUIVALENCE_BOUNDARY,
  }
  return { ...payload,atlasFingerprint:displayFingerprint(payload) }
}

export function defaultEquivalencePairs(){
  return [
    {
      id:'PAIR_DEACTIVATION',
      left:'I_REMOVE_DEACTIVATE',
      right:'I_DELAY_DEACTIVATE_11',
      label:'Remove vs delay deactivation',
    },
    {
      id:'PAIR_NORMAL2',
      left:'I_REMOVE_REGISTER_NORMAL2',
      right:'I_DELAY_REGISTER_NORMAL2_11',
      label:'Remove vs delay NORMAL@2.0 registration',
    },
    {
      id:'PAIR_LEDGER_CONTROLS',
      left:'I_ALTER_DEACTIVATE_PAYLOAD_ONLY',
      right:'I_REMOVE_SUPERSEDE_NORMAL1',
      label:'Ledger-only controls',
    },
    {
      id:'PAIR_ALTER_CONTROL',
      left:'I_ALTER_DEACTIVATE_VALID10',
      right:'I_ALTER_DEACTIVATE_PAYLOAD_ONLY',
      label:'Same here, different elsewhere',
    },
  ]
}

export function buildEquivalenceExport(pairId='PAIR_DEACTIVATION',targetKnown=10,targetValid=10){
  const pairMeta=defaultEquivalencePairs().find((row)=>row.id===pairId)
  if(!pairMeta) throw new Error('Unknown pair')
  const payload={
    atlas:buildInterventionEquivalenceAtlas(targetKnown,targetValid),
    selectedPair:pairMeta,
    receipt:interventionPairReceipt(pairMeta.left,pairMeta.right,targetKnown,targetValid),
    truthClaim:EQUIVALENCE_BOUNDARY,
  }
  return { ...payload,exportFingerprint:displayFingerprint(payload) }
}
