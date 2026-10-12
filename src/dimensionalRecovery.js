// NBG-G2 · Dimensional Recovery, a finite exact GF(2) observer model.
// All 'costs' are synthetic design weights, NOT physical or monetary measurements.
export const G2_PROTOCOL=Object.freeze({
  id:'NBG-G2',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  stateSpace:'16 four-bit hypercube vertices, uniform prior',
  coarse:'first d signed coordinates, d in 0..4',
  tasks:['FULL_STATE','HIDDEN_W'],
  success:'query span contains the target function',
  limitation:'No causal, metaphysical, historical or physical-dimensional inference',
})
export const AXES=['X','Y','Z','W']
export const VERTICES=Object.freeze(Array.from({length:16},(_,i)=>i))
const bitCount=value=>{let n=0;while(value){n+=value&1;value>>=1}return n}
export const parity=(state,mask)=>bitCount(state&mask)%2
export const signedCoordinates=state=>AXES.map((_,i)=>state&(1<<i)?1:-1)
export const baselineMasks=depth=>{
  if(!Number.isInteger(depth)||depth<0||depth>4)throw Error('Projection depth must be an integer 0..4')
  return [1,2,4,8].slice(0,depth)
}
export function rankGF2(masks){
  const pivots=[0,0,0,0]
  let rank=0
  for(const mask of masks){
    if(!Number.isInteger(mask)||mask<1||mask>15)throw Error('Probe masks must be 1..15')
    let v=mask
    for(let bit=3;bit>=0;bit--){
      if(!(v&(1<<bit)))continue
      if(pivots[bit]){v^=pivots[bit];continue}
      pivots[bit]=v;rank++;break
    }
  }
  return rank
}
export function isTaskResolved(masks,task='FULL_STATE'){
  if(task==='FULL_STATE')return rankGF2(masks)===4
  if(task==='HIDDEN_W')return rankGF2([...masks,8])===rankGF2(masks)
  throw Error('Unknown query task: '+task)
}
export function entropyBits(masks,task='FULL_STATE'){
  const rank=rankGF2(masks)
  if(task==='FULL_STATE')return 4-rank
  if(task==='HIDDEN_W')return isTaskResolved(masks,task)?0:1
  throw Error('Unknown query task: '+task)
}
export function compatibleVertices(target,masks){
  if(!VERTICES.includes(target))throw Error('Target must be one of 16 vertices')
  rankGF2(masks)
  return VERTICES.filter(v=>masks.every(m=>parity(v,m)===parity(target,m)))
}
export const PROBES=Object.freeze([
  Object.freeze({id:'X',name:'Read X',mask:1,cost:3}),
  Object.freeze({id:'Y',name:'Read Y',mask:2,cost:3}),
  Object.freeze({id:'Z',name:'Read Z',mask:4,cost:3}),
  Object.freeze({id:'W',name:'Read W',mask:8,cost:3}),
  Object.freeze({id:'XW',name:'X XOR W',mask:9,cost:2}),
  Object.freeze({id:'YW',name:'Y XOR W',mask:10,cost:2}),
  Object.freeze({id:'ZW',name:'Z XOR W',mask:12,cost:2}),
  Object.freeze({id:'XYZW',name:'X XOR Y XOR Z XOR W',mask:15,cost:1}),
  Object.freeze({id:'XYZ',name:'X XOR Y XOR Z',mask:7,cost:.25}),
])
export const PROFILES=Object.freeze({
  DIRECT:Object.freeze({label:'Direct coordinate probes',ids:['X','Y','Z','W']}),
  HYBRID:Object.freeze({label:'Direct + cross-coordinate parity',ids:PROBES.map(p=>p.id)}),
  BLIND:Object.freeze({label:'Blind to W · negative control',ids:['X','Y','Z','XYZ']}),
})
export const allowedProbes=(profile='HYBRID')=>{
  const p=PROFILES[profile]
  if(!p)throw Error('Unknown observer profile: '+profile)
  return PROBES.filter(q=>p.ids.includes(q.id))
}
const comparePlans=(a,b)=>{
  if(a.cost!==b.cost)return a.cost-b.cost
  if(a.probes.length!==b.probes.length)return a.probes.length-b.probes.length
  return a.probes.map(x=>x.id).join(',').localeCompare(b.probes.map(x=>x.id).join(','))
}
// Exhaustively enumerate every permitted query subset. No heuristic search,
// stochastic oracle, or unfrozen library additions.
export function enumeratePlans(depth=3,profile='HYBRID',task='FULL_STATE',budget=12){
  if(typeof budget!=='number'||!Number.isFinite(budget)||budget<0)throw Error('Budget must be nonnegative and finite')
  const base=baselineMasks(depth)
  const library=allowedProbes(profile).filter(q=>!base.includes(q.mask))
  const candidates=[]
  for(let chosen=0;chosen<1<<library.length;chosen++){
    const probes=library.filter((q,i)=>(chosen&(1<<i))!==0)
    const cost=probes.reduce((total,q)=>total+q.cost,0)
    const masks=[...base,...probes.map(q=>q.mask)]
    candidates.push({probes,cost,rank:rankGF2(masks),
      residualBits:entropyBits(masks,task),resolved:isTaskResolved(masks,task)})
  }
  const sorted=[...candidates].sort(comparePlans)
  const optimal=sorted.find(p=>p.resolved)||null
  const within=sorted.filter(p=>p.cost<=budget+1e-9)
  const bestAffordable=within.slice().sort((a,b)=>{
    if(a.residualBits!==b.residualBits)return a.residualBits-b.residualBits
    return comparePlans(a,b)
  })[0]||null
  const selected=optimal&&optimal.cost<=budget+1e-9?optimal:bestAffordable
  const status=!optimal?'UNOBSERVABLE_LIBRARY':optimal.cost>budget+1e-9?'BUDGET_INSUFFICIENT':'RECOVERED'
  return {depth,profile,task,budget,baselineMasks:base,baselineRank:rankGF2(base),
    baselineResidualBits:entropyBits(base,task),library,
    optimal,bestAffordable,selected,status,enumeratedSubsets:candidates.length}
}
export function recoveryTrace(state,depth,probes,task='FULL_STATE'){
  const base=baselineMasks(depth)
  let masks=[...base]
  const stages=[{step:'Baseline K0',rank:rankGF2(masks),residualBits:entropyBits(masks,task),
    compatible:compatibleVertices(state,masks),resolved:isTaskResolved(masks,task)}]
  for(const q of probes){
    if(!PROBES.some(p=>p.id===q.id&&p.mask===q.mask))throw Error('Unregistered probe')
    masks=[...masks,q.mask]
    stages.push({step:q.name,probe:q.id,response:parity(state,q.mask),
      rank:rankGF2(masks),residualBits:entropyBits(masks,task),
      compatible:compatibleVertices(state,masks),resolved:isTaskResolved(masks,task)})
  }
  return stages
}
export function buildG2Receipt({depth=3,profile='HYBRID',task='FULL_STATE',budget=12,state=0}={}){
  const plans=enumeratePlans(depth,profile,task,budget)
  const trace=recoveryTrace(state,depth,plans.selected.probes,task)
  const witness={coordinateSigns:signedCoordinates(state),
    selectedVertex:state,initialAmbiguity:trace[0].compatible.length,
    terminalAmbiguity:trace.at(-1).compatible.length}
  return {protocol:G2_PROTOCOL,origin:'SIMULATED',authority:'NONE',
    selected:{depth,profile,task,budget,state},status:plans.status,
    baseline:{rank:plans.baselineRank,residualBits:plans.baselineResidualBits},
    search:{subsets:plans.enumeratedSubsets,
      optimal:plans.optimal?{cost:plans.optimal.cost,probeIds:plans.optimal.probes.map(p=>p.id)}:null,
      affordable:{cost:plans.selected.cost,probeIds:plans.selected.probes.map(p=>p.id),
        rank:plans.selected.rank,residualBits:plans.selected.residualBits}},
    witness,trace,
    caveat:'Exact enumeration over a uniform synthetic 4-bit universe and an artificial weighted probe library only. No physical dimensions or metaphysical claims.'}
}
