import { governanceView, stableStringify, displayFingerprint } from './counterfactualGovernance.js'
import { SENSITIVITY_INTERVENTIONS, mutateTimeline } from './governanceSensitivity.js'

export const OBSERVER_CHANNELS=['POLICY','OUTCOME','JOINT']
export const SYNTHESIS_BOUNDARY='OBSERVER_SYNTHESIS_RELATIVE_TO_DECLARED_QUERY_LANGUAGE'

export const FULL_SYNTHESIS_FAMILY=[
  'I_ALTER_DEACTIVATE_PAYLOAD_ONLY',
  'I_ALTER_DEACTIVATE_VALID10',
  'I_DELAY_ACTIVATE_EMERGENCY_7',
  'I_DELAY_DEACTIVATE_11',
  'I_DELAY_REGISTER_NORMAL2_11',
  'I_REMOVE_DEACTIVATE',
  'I_REMOVE_REGISTER_EMERGENCY',
  'I_REMOVE_REGISTER_NORMAL2',
  'I_REMOVE_SUPERSEDE_NORMAL1',
]

export const DISTINGUISHABLE_EIGHT=FULL_SYNTHESIS_FAMILY.filter(
  (id)=>id!=='I_ALTER_DEACTIVATE_PAYLOAD_ONLY',
)

export const RESTRICTED_OUTCOME_PAIR=[
  'I_DELAY_ACTIVATE_EMERGENCY_7',
  'I_REMOVE_SUPERSEDE_NORMAL1',
]

export const SYNTHESIS_FAMILIES=[
  {
    id:'EIGHT',
    label:'Eight-history separable family',
    interventionIds:DISTINGUISHABLE_EIGHT,
  },
  {
    id:'FULL9',
    label:'Full nine-history family',
    interventionIds:FULL_SYNTHESIS_FAMILY,
  },
  {
    id:'RESTRICTED_PAIR',
    label:'Policy-vs-outcome witness pair',
    interventionIds:RESTRICTED_OUTCOME_PAIR,
  },
]

const observationCache=new Map()

function assertChannel(channel){
  if(!OBSERVER_CHANNELS.includes(channel)) throw new Error('Unsupported observer channel')
}

function assertFamily(interventionIds){
  const ids=[...interventionIds].sort()
  if(!ids.length) throw new Error('Observer synthesis requires at least one intervention')
  if(new Set(ids).size!==ids.length) throw new Error('Duplicate intervention in family')
  const known=new Set(SENSITIVITY_INTERVENTIONS.map((row)=>row.id))
  ids.forEach((id)=>{
    if(!known.has(id)) throw new Error('Unknown intervention')
  })
  return ids
}

export function synthesisKeyholes(){
  const rows=[]
  for(let known=1;known<=12;known+=1){
    for(let valid=1;valid<=12;valid+=1){
      rows.push({
        keyholeId:\`k\${known}_t\${valid}\`,
        knownCutoff:known,
        validTime:valid,
        observerCost:known+valid,
      })
    }
  }
  return rows
}

function signatureForView(view,channel){
  assertChannel(channel)
  if(channel==='POLICY'){
    return { policyVersionId:view.selectedPolicyVersionId }
  }
  if(channel==='OUTCOME'){
    return { governanceOutcome:view.governanceOutcome }
  }
  return {
    policyVersionId:view.selectedPolicyVersionId,
    governanceOutcome:view.governanceOutcome,
  }
}

export function observeIntervention(interventionId,keyhole,channel){
  assertChannel(channel)
  const cacheKey=`${interventionId}|${keyhole.knownCutoff}|${keyhole.validTime}|${channel}`
  if(observationCache.has(cacheKey)) return observationCache.get(cacheKey)
  const timeline=mutateTimeline(interventionId)
  const view=governanceView(timeline,keyhole.knownCutoff,keyhole.validTime)
  const signature=signatureForView(view,channel)
  observationCache.set(cacheKey,signature)
  return signature
}

function pairUniverse(ids){
  const pairs=[]
  for(let i=0;i<ids.length;i+=1){
    for(let j=i+1;j<ids.length;j+=1){
      pairs.push([ids[i],ids[j]])
    }
  }
  return pairs
}

export function partitionInterventions(interventionIds,keyhole,channel){
  const ids=assertFamily(interventionIds)
  const groups=new Map()
  ids.forEach((id)=>{
    const signature=observeIntervention(id,keyhole,channel)
    const key=stableStringify(signature)
    if(!groups.has(key)) groups.set(key,{signature,interventionIds:[]})
    groups.get(key).interventionIds.push(id)
  })
  return [...groups.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([,row])=>({
      signature:row.signature,
      interventionIds:[...row.interventionIds].sort(),
    }))
}

function coverageMask(interventionIds,keyhole,channel,pairs){
  const signatures=Object.fromEntries(
    interventionIds.map((id)=>[
      id,
      stableStringify(observeIntervention(id,keyhole,channel)),
    ]),
  )
  let mask=0n
  const separatedPairs=[]
  pairs.forEach(([left,right],index)=>{
    if(signatures[left]!==signatures[right]){
      mask|=1n<<BigInt(index)
      separatedPairs.push([left,right])
    }
  })
  return {mask,separatedPairs}
}

function publicCandidate(row){
  return {
    keyholeId:row.keyholeId,
    knownCutoff:row.knownCutoff,
    validTime:row.validTime,
    observerCost:row.observerCost,
    separatedPairCount:row.separatedPairCount,
  }
}

function candidateSet(interventionIds,channel){
  const ids=assertFamily(interventionIds)
  assertChannel(channel)
  const pairs=pairUniverse(ids)
  const byMask=new Map()
  synthesisKeyholes().forEach((keyhole)=>{
    const {mask,separatedPairs}=coverageMask(ids,keyhole,channel,pairs)
    if(mask===0n) return
    const row={
      ...keyhole,
      mask,
      separatedPairCount:separatedPairs.length,
    }
    const key=mask.toString()
    const prior=byMask.get(key)
    const better=!prior
      || row.observerCost<prior.observerCost
      || (row.observerCost===prior.observerCost && row.knownCutoff<prior.knownCutoff)
      || (
        row.observerCost===prior.observerCost
        && row.knownCutoff===prior.knownCutoff
        && row.validTime<prior.validTime
      )
    if(better) byMask.set(key,row)
  })

  const raw=[...byMask.values()]
  const keep=raw.filter((candidate)=>!raw.some((other)=>{
    if(other===candidate) return false
    const contains=(candidate.mask|other.mask)===other.mask
    const better=other.observerCost<candidate.observerCost
      || (
        other.observerCost===candidate.observerCost
        && other.knownCutoff<candidate.knownCutoff
      )
      || (
        other.observerCost===candidate.observerCost
        && other.knownCutoff===candidate.knownCutoff
        && other.validTime<=candidate.validTime
      )
    return contains && better
  }))

  keep.sort((a,b)=>
    a.observerCost-b.observerCost
    || a.knownCutoff-b.knownCutoff
    || a.validTime-b.validTime
    || b.separatedPairCount-a.separatedPairCount
  )
  return {ids,pairs,candidates:keep}
}

function greedyUpperBound(candidates,universe){
  let covered=0n
  const chosen=[]
  let remaining=[...candidates]
  while(covered!==universe){
    const ranked=remaining
      .map((candidate)=>{
        const gainMask=candidate.mask & ~covered
        let gain=0
        for(let x=gainMask;x;x>>=1n) gain+=Number(x&1n)
        return {candidate,gain}
      })
      .filter((row)=>row.gain>0)
      .sort((a,b)=>
        b.gain-a.gain
        || a.candidate.observerCost-b.candidate.observerCost
        || a.candidate.knownCutoff-b.candidate.knownCutoff
        || a.candidate.validTime-b.candidate.validTime
      )
    if(!ranked.length) return null
    const selected=ranked[0].candidate
    chosen.push(selected)
    covered|=selected.mask
    remaining=remaining.filter((row)=>row.keyholeId!==selected.keyholeId)
  }
  return chosen
}

function chooseCombinations(candidates,size,start,chosen,visit){
  if(chosen.length===size){
    visit(chosen)
    return
  }
  const need=size-chosen.length
  for(let i=start;i<=candidates.length-need;i+=1){
    chosen.push(candidates[i])
    chooseCombinations(candidates,size,i+1,chosen,visit)
    chosen.pop()
  }
}

export function synthesizeStaticObserver(interventionIds,channel){
  const {ids,pairs,candidates}=candidateSet(interventionIds,channel)
  const universe=pairs.length ? (1n<<BigInt(pairs.length))-1n : 0n
  let union=0n
  candidates.forEach((row)=>{ union|=row.mask })

  const unseparablePairs=pairs.filter((pair,index)=>
    (union & (1n<<BigInt(index)))===0n
  )

  const base={
    experiment:'NBG-T15',
    version:'0.1.0',
    mode:'STATIC_MINIMAL_OBSERVER',
    channel,
    familyIds:ids,
    admissibleKeyholeCount:144,
    compressedCandidateCount:candidates.length,
    pairCount:pairs.length,
    truthClaim:SYNTHESIS_BOUNDARY,
    costNote:'observer_cost=known_cutoff+valid_time is a frozen resource proxy, not epistemic value',
  }

  if(unseparablePairs.length){
    const payload={
      ...base,
      status:'REFUSE_UNSEPARABLE',
      minimalCardinality:null,
      totalObserverCost:null,
      selectedKeyholes:[],
      unseparablePairs,
    }
    return {...payload,selectionFingerprint:displayFingerprint(payload)}
  }

  if(universe===0n){
    const payload={
      ...base,
      status:'PASS',
      minimalCardinality:0,
      totalObserverCost:0,
      selectedKeyholes:[],
      unseparablePairs:[],
    }
    return {...payload,selectionFingerprint:displayFingerprint(payload)}
  }

  const greedy=greedyUpperBound(candidates,universe)
  if(!greedy) throw new Error('Separable universe lacked greedy cover')

  let winning=null
  for(let size=1;size<=greedy.length && !winning;size+=1){
    let best=null
    chooseCombinations(candidates,size,0,[],(combo)=>{
      let mask=0n
      combo.forEach((row)=>{ mask|=row.mask })
      if(mask!==universe) return
      const selected=combo.map(publicCandidate).sort((a,b)=>
        a.knownCutoff-b.knownCutoff || a.validTime-b.validTime
      )
      const total=selected.reduce((sum,row)=>sum+row.observerCost,0)
      const lex=selected.map((row)=>[row.knownCutoff,row.validTime])
      const lexBefore=(a,b)=>{
        for(let i=0;i<Math.min(a.length,b.length);i+=1){
          if(a[i][0]!==b[i][0]) return a[i][0]<b[i][0]
          if(a[i][1]!==b[i][1]) return a[i][1]<b[i][1]
        }
        return a.length<b.length
      }
      if(!best || total<best.total || (total===best.total && lexBefore(lex,best.lex))){
        best={lex,selected,total}
      }
    })
    if(best) winning=best
  }

  const payload={
    ...base,
    status:'PASS',
    minimalCardinality:winning.selected.length,
    totalObserverCost:winning.total,
    selectedKeyholes:winning.selected,
    unseparablePairs:[],
  }
  return {...payload,selectionFingerprint:displayFingerprint(payload)}
}

function splitScore(partition){
  const sizes=partition.map((row)=>row.interventionIds.length)
  const total=sizes.reduce((sum,n)=>sum+n,0)
  const before=(total*(total-1))/2
  const unresolved=sizes.reduce((sum,n)=>sum+(n*(n-1))/2,0)
  return before-unresolved
}

export function chooseNextKeyhole(interventionIds,channel,usedKeyholeIds=[]){
  const ids=assertFamily(interventionIds)
  assertChannel(channel)
  const used=new Set(usedKeyholeIds)
  const ranked=synthesisKeyholes()
    .filter((row)=>!used.has(row.keyholeId))
    .map((keyhole)=>{
      const partition=partitionInterventions(ids,keyhole,channel)
      return {keyhole,partition,score:splitScore(partition)}
    })
    .filter((row)=>row.score>0)
    .sort((a,b)=>
      b.score-a.score
      || a.keyhole.observerCost-b.keyhole.observerCost
      || a.keyhole.knownCutoff-b.keyhole.knownCutoff
      || a.keyhole.validTime-b.keyhole.validTime
    )
  if(!ranked.length) return null
  const selected=ranked[0]
  const payload={
    candidateFamilyIds:ids,
    channel,
    usedKeyholeIds:[...used].sort(),
    selectedKeyhole:selected.keyhole,
    splitScore:selected.score,
    partition:selected.partition,
    selectionRule:'MAX_PAIR_SPLIT_THEN_MIN_COST_THEN_EARLIEST_KEYHOLE',
    truthClaim:SYNTHESIS_BOUNDARY,
  }
  return {...payload,querySelectionFingerprint:displayFingerprint(payload)}
}

export function synthesizeAdaptiveObserver(interventionIds,channel){
  const ids=assertFamily(interventionIds)
  const receipts=[]

  function build(current,used,depth){
    const sorted=[...current].sort()
    if(sorted.length<=1){
      return {nodeKind:'RESOLVED_LEAF',depth,interventionIds:sorted}
    }
    const selection=chooseNextKeyhole(sorted,channel,[...used])
    if(!selection){
      return {
        nodeKind:'REFUSE_UNSEPARABLE',
        depth,
        interventionIds:sorted,
        reason:'NO_ADMISSIBLE_KEYHOLE_SPLITS_REMAINING_FAMILY',
      }
    }
    receipts.push(selection)
    const nextUsed=new Set(used)
    nextUsed.add(selection.selectedKeyhole.keyholeId)
    return {
      nodeKind:'QUERY',
      depth,
      interventionIds:sorted,
      selectedKeyhole:selection.selectedKeyhole,
      splitScore:selection.splitScore,
      querySelectionFingerprint:selection.querySelectionFingerprint,
      children:selection.partition.map((group)=>({
        signature:group.signature,
        interventionIds:group.interventionIds,
        child:build(group.interventionIds,nextUsed,depth+1),
      })),
    }
  }

  const tree=build(ids,new Set(),0)
  const keyholes=new Set()
  let resolved=0
  let unresolved=0
  let leaves=0
  let queryNodes=0
  let worst=0

  function walk(node){
    worst=Math.max(worst,node.depth)
    if(node.nodeKind==='QUERY'){
      queryNodes+=1
      keyholes.add(node.selectedKeyhole.keyholeId)
      node.children.forEach((row)=>walk(row.child))
      return
    }
    leaves+=1
    if(node.nodeKind==='RESOLVED_LEAF') resolved+=1
    else unresolved+=1
  }
  walk(tree)

  const payload={
    experiment:'NBG-T15',
    version:'0.1.0',
    mode:'ADAPTIVE_OBSERVER',
    channel,
    familyIds:ids,
    tree,
    querySelectionReceipts:receipts,
    stats:{
      leafCount:leaves,
      resolvedLeafCount:resolved,
      unresolvedLeafCount:unresolved,
      worstCaseDepth:worst,
      queryNodeCount:queryNodes,
      distinctKeyholeCount:keyholes.size,
      distinctKeyholeIds:[...keyholes].sort(),
    },
    status:unresolved===0?'PASS':'REFUSE_UNSEPARABLE',
    truthClaim:SYNTHESIS_BOUNDARY,
  }
  return {...payload,adaptiveFingerprint:displayFingerprint(payload)}
}

export function buildObserverSynthesisExport(familyId='EIGHT',channel='JOINT'){
  const family=SYNTHESIS_FAMILIES.find((row)=>row.id===familyId)
  if(!family) throw new Error('Unknown synthesis family')
  const staticObserver=synthesizeStaticObserver(family.interventionIds,channel)
  const adaptiveObserver=synthesizeAdaptiveObserver(family.interventionIds,channel)
  const payload={
    family,
    channel,
    staticObserver,
    adaptiveObserver,
    truthClaim:SYNTHESIS_BOUNDARY,
  }
  return {...payload,exportFingerprint:displayFingerprint(payload)}
}
