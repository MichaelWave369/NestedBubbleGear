const POLICY_RECORDS = [
  { id:'NORMAL@1.0', kind:'NORMAL', revision:1, validFrom:1, validUntil:30, knownAt:2, priority:10, mode:'WEIGHTED_THRESHOLD', outcome:'REJECTED' },
  { id:'EMERGENCY@1.0', kind:'EMERGENCY', revision:1, validFrom:6, validUntil:12, knownAt:6, priority:100, mode:'WEIGHTED_THRESHOLD', outcome:'REJECTED' },
  { id:'NORMAL@2.0', kind:'NORMAL', revision:2, validFrom:7, validUntil:30, knownAt:8, priority:10, mode:'UNANIMOUS', outcome:'ABSTAIN_CONFLICT' },
]

const OBSERVED_EVENTS = [
  { eventId:'EV_REGISTER_NORMAL_1', type:'REGISTER_POLICY', knownTime:2, validTime:1, target:'NORMAL@1.0' },
  { eventId:'EV_ACTIVATE_EMERGENCY', type:'ACTIVATE_EMERGENCY', knownTime:6, validTime:6, target:'EMERGENCY@1.0' },
  { eventId:'EV_REGISTER_EMERGENCY_1', type:'REGISTER_POLICY', knownTime:6, validTime:6, target:'EMERGENCY@1.0' },
  { eventId:'EV_REGISTER_NORMAL_2', type:'REGISTER_POLICY', knownTime:8, validTime:7, target:'NORMAL@2.0' },
  { eventId:'EV_SUPERSEDE_NORMAL_1', type:'SUPERSEDE_POLICY', knownTime:8, validTime:7, target:'NORMAL@1.0', replacement:'NORMAL@2.0' },
  { eventId:'EV_DEACTIVATE_EMERGENCY', type:'DEACTIVATE_EMERGENCY', knownTime:9, validTime:9, target:'EMERGENCY@1.0' },
].sort((a,b)=>a.knownTime-b.knownTime || a.eventId.localeCompare(b.eventId))

export const COUNTERFACTUAL_OPTIONS = [
  {
    id:'REMOVE_DEACTIVATE',
    label:'Remove deactivation',
    branchId:'CF_REMOVE_DEACTIVATE',
    operation:'REMOVE_EVENT',
    targetEventId:'EV_DEACTIVATE_EMERGENCY',
    description:'The emergency deactivation never occurs in this synthetic branch.',
  },
  {
    id:'DELAY_DEACTIVATE',
    label:'Delay to k11/t11',
    branchId:'CF_DELAY_DEACTIVATE',
    operation:'DELAY_EVENT',
    targetEventId:'EV_DEACTIVATE_EMERGENCY',
    description:'The same deactivation occurs later, at known k11 and valid t11.',
  },
  {
    id:'ALTER_DEACTIVATE',
    label:'Make valid at t10',
    branchId:'CF_ALTER_DEACTIVATE',
    operation:'ALTER_EVENT',
    targetEventId:'EV_DEACTIVATE_EMERGENCY',
    description:'The deactivation is known at k9 but becomes valid only at t10.',
  },
]

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out,key)=>{
      out[key]=stable(value[key])
      return out
    },{})
  }
  return value
}

export function stableStringify(value) {
  return JSON.stringify(stable(value))
}

export function displayFingerprint(value) {
  const text=typeof value==='string'?value:stableStringify(value)
  let hash=2166136261
  for(let i=0;i<text.length;i+=1){
    hash^=text.charCodeAt(i)
    hash=Math.imul(hash,16777619)
  }
  return 'fnv1a32:'+(hash>>>0).toString(16).padStart(8,'0')
}

export function observedTimeline() {
  return OBSERVED_EVENTS.map((row)=>({...row}))
}

export function buildCounterfactualTimeline(optionId) {
  const option=COUNTERFACTUAL_OPTIONS.find((row)=>row.id===optionId)
  if(!option) throw new Error('Unknown counterfactual option')
  const events=observedTimeline()

  if(option.id==='REMOVE_DEACTIVATE'){
    return events.filter((event)=>event.eventId!==option.targetEventId)
  }

  return events.map((event)=>{
    if(event.eventId!==option.targetEventId) return event
    if(option.id==='DELAY_DEACTIVATE') return {...event,knownTime:11,validTime:11}
    if(option.id==='ALTER_DEACTIVATE') return {...event,validTime:10}
    return event
  }).sort((a,b)=>a.knownTime-b.knownTime || a.eventId.localeCompare(b.eventId))
}

function visibleEvents(events,knownCutoff){
  return events.filter((event)=>event.knownTime<=knownCutoff)
}

function visiblePolicyIds(events,knownCutoff){
  return [...new Set(
    visibleEvents(events,knownCutoff)
      .filter((event)=>event.type==='REGISTER_POLICY')
      .map((event)=>event.target),
  )].sort()
}

function emergencyState(policyId,events,knownCutoff,validTime){
  let state='INACTIVE'
  visibleEvents(events,knownCutoff).forEach((event)=>{
    if(event.target!==policyId || event.validTime>validTime) return
    if(event.type==='ACTIVATE_EMERGENCY') state='ACTIVE'
    if(event.type==='DEACTIVATE_EMERGENCY') state='INACTIVE'
  })
  return state
}

function policyStatus(record,events,knownCutoff,validTime,registered){
  if(!registered.includes(record.id)) return 'NOT_YET_KNOWN'
  if(validTime<record.validFrom || validTime>record.validUntil) return 'OUT_OF_VALIDITY'
  if(record.kind==='EMERGENCY') return emergencyState(record.id,events,knownCutoff,validTime)
  const superseded=visibleEvents(events,knownCutoff).some((event)=>
    event.type==='SUPERSEDE_POLICY'
    && event.target===record.id
    && event.validTime<=validTime
    && registered.includes(event.replacement)
  )
  return superseded?'SUPERSEDED':'ACTIVE'
}

export function governanceView(events,knownCutoff,validTime){
  const registered=visiblePolicyIds(events,knownCutoff)
  const statuses=Object.fromEntries(POLICY_RECORDS.map((record)=>[
    record.id,policyStatus(record,events,knownCutoff,validTime,registered),
  ]))
  const active=POLICY_RECORDS.filter((record)=>statuses[record.id]==='ACTIVE')
  const emergency=active.filter((record)=>record.kind==='EMERGENCY')
  const pool=emergency.length?emergency:active.filter((record)=>record.kind==='NORMAL')
  const selected=[...pool].sort((a,b)=>b.priority-a.priority || b.revision-a.revision || b.id.localeCompare(a.id))[0]??null
  const view={
    knownCutoff,
    validTime,
    selectedPolicyVersionId:selected?.id??null,
    selectedMode:selected?.mode??null,
    governanceOutcome:selected?.outcome??'NO_POLICY',
    visiblePolicyVersionIds:registered,
    policyStatuses:statuses,
    visibleEventIds:visibleEvents(events,knownCutoff).map((event)=>event.eventId),
    ledgerFingerprint:displayFingerprint(visibleEvents(events,knownCutoff)),
  }
  return {...view,viewFingerprint:displayFingerprint(view)}
}

export function counterfactualComparison(optionId,knownCutoff=10,validTime=10){
  const option=COUNTERFACTUAL_OPTIONS.find((row)=>row.id===optionId)
  if(!option) throw new Error('Unknown counterfactual option')
  const observed=governanceView(observedTimeline(),knownCutoff,validTime)
  const counterfactual=governanceView(buildCounterfactualTimeline(optionId),knownCutoff,validTime)
  const row={
    branchId:option.branchId,
    branchKind:'COUNTERFACTUAL',
    operation:option.operation,
    targetEventId:option.targetEventId,
    knownCutoff,
    validTime,
    observed,
    counterfactual,
    policyChanged:observed.selectedPolicyVersionId!==counterfactual.selectedPolicyVersionId,
    outcomeChanged:observed.governanceOutcome!==counterfactual.governanceOutcome,
    truthClaim:'COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY',
  }
  return {...row,comparisonFingerprint:displayFingerprint(row)}
}

export function firstOutcomeDivergence(optionId,maxKnown=12,maxValid=12){
  for(let known=1;known<=maxKnown;known+=1){
    for(let valid=1;valid<=maxValid;valid+=1){
      const row=counterfactualComparison(optionId,known,valid)
      if(row.observed.selectedPolicyVersionId && row.counterfactual.selectedPolicyVersionId && row.outcomeChanged){
        return row
      }
    }
  }
  return null
}

export function buildCounterfactualExport(optionId,knownCutoff=10,validTime=10){
  const option=COUNTERFACTUAL_OPTIONS.find((row)=>row.id===optionId)
  if(!option) throw new Error('Unknown counterfactual option')
  const payload={
    experiment:'NBG-T12',
    version:'0.1.0',
    branchKind:'COUNTERFACTUAL',
    option:{...option},
    observedTimeline:observedTimeline(),
    counterfactualTimeline:buildCounterfactualTimeline(optionId),
    comparison:counterfactualComparison(optionId,knownCutoff,validTime),
    firstOutcomeDivergence:firstOutcomeDivergence(optionId),
    truthClaim:'COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY',
  }
  return {...payload,exportFingerprint:displayFingerprint(payload)}
}
