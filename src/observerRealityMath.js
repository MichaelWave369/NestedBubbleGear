// OBS-01: deterministic, dependency-free finite mathematical thought experiments.
// Simulation only. No claims about cosmology, physical dimensions or consciousness.
export const OBS_PROTOCOL=Object.freeze({
  id:'NBG-OBS-01',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  claim:'Finite examples of observability, reference changes, causal discrimination and invariance.'
})
export const OBS_TABS=Object.freeze([
  {id:'projection',label:"Plato's Cave"},
  {id:'frame',label:'Reference frames'},
  {id:'topology',label:'Topology'},
  {id:'causality',label:'Interventions'},
  {id:'time',label:'Time & aliasing'},
])
const near=(a,b)=>Math.abs(a-b)<1e-10
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])
export function projectionWitness(reveal=false){
  const a=[1,1,1,-1],b=[1,1,1,1]
  const project=v=>reveal?v.slice():v.slice(0,3)
  return {a,b,observationA:project(a),observationB:project(b),
    indistinguishable:project(a).every((x,i)=>x===project(b)[i]),
    measurement:reveal?'four coordinates':'first three coordinates'}
}
const POINTS=Object.freeze([[45,115],[232,45],[181,165]])
export function frameWitness(origin='A',rotation=0){
  if(!['A','B','C'].includes(origin)||![0,90,180].includes(rotation))throw Error('Invalid reference frame')
  const index='ABC'.indexOf(origin),a=POINTS[index],rad=rotation*Math.PI/180
  const relative=POINTS.map(p=>{const x=p[0]-a[0],y=p[1]-a[1];return [
    Math.round((x*Math.cos(rad)-y*Math.sin(rad))*1e9)/1e9,
    Math.round((x*Math.sin(rad)+y*Math.cos(rad))*1e9)/1e9]})
  const distances=[[0,1],[1,2],[2,0]].map(([i,j])=>distance(relative[i],relative[j]))
  return {origin,rotation,relative,distances,perimeter:distances.reduce((s,n)=>s+n,0)}
}
export function graphWitness(mode='ring',size=6){
  if(!['ring','distort','cut'].includes(mode)||![6,12].includes(size))throw Error('Invalid graph')
  const nodes=Array.from({length:size},(_,i)=>{
    const theta=i*2*Math.PI/size-Math.PI/2
    return {id:i,x:150+104*Math.cos(theta)+(mode==='distort'?(i%2?22:-17):0),
      y:112+70*Math.sin(theta)+(mode==='distort'?((i%3)-1)*15:0)}
  })
  const edges=Array.from({length:size-(mode==='cut'?1:0)},(_,i)=>[i,(i+1)%size])
  // These examples remain connected, so the cycle-space dimension is E - V + 1.
  const components=1,cycleRank=edges.length-nodes.length+components
  return {mode,size,nodes,edges,components,cycleRank}
}
export function causalWitness(intervene=false){
  const rows=[0,1].map(h=>{
    const a=intervene?1:h
    return {h,a,commonCauseB:h,directCauseB:a}
  })
  // With do(A=1), choose H=0 to witness different outcomes.
  return {intervene,rows,
    observationallyEquivalent:rows.every(r=>r.commonCauseB===r.directCauseB),
    discriminatingRow:rows.find(r=>r.commonCauseB!==r.directCauseB)||null}
}
export function samplingWitness(interval=1){
  if(![1,0.8].includes(interval))throw Error('Invalid sampling interval')
  const points=Array.from({length:17},(_,i)=>{
    const t=i*interval,low=Math.sin(2*Math.PI*t/8),fast=0.35*Math.sin(4*Math.PI*t)
    return {i,t,low,fast,observed:low+fast}
  })
  const maxResidual=Math.max(...points.map(p=>Math.abs(p.fast)))
  return {interval,points,maxResidual,fastVisible:maxResidual>1e-6}
}
export function delayWitness(){
  // Deterministic partially observed 2D linear system:
  // x(t+1)=0.7x(t)+0.25h(t), h(t+1)=0.9h(t)-0.1x(t).
  // Cayley-Hamilton yields x(t+1)=1.6x(t)-0.655x(t-1) for t>=1.
  const states=[{x:0.4,h:0.8}]
  for(let i=0;i<15;i++){
    const {x,h}=states.at(-1)
    states.push({x:0.7*x+0.25*h,h:0.9*h-0.1*x})
  }
  const predictions=states.slice(1,-1).map((state,i)=>({
    t:i+1,actual:states[i+2].x,
    visibleOnly:0.7*state.x,
    delayed:1.6*state.x-0.655*states[i].x,
  }))
  const rmse=key=>Math.sqrt(predictions.reduce((s,r)=>s+(r[key]-r.actual)**2,0)/predictions.length)
  return {states,predictions,visibleRmse:rmse('visibleOnly'),delayRmse:rmse('delayed')}
}
export function observerReceipt(config={}){
  const {tab='projection',reveal=false,origin='A',rotation=0,graphMode='ring',graphSize=6,intervene=false,interval=1}=config
  if(!OBS_TABS.some(t=>t.id===tab))throw Error('Invalid tab')
  const projection=projectionWitness(reveal),frame=frameWitness(origin,rotation),
    graph=graphWitness(graphMode,graphSize),causality=causalWitness(intervene),
    sampling=samplingWitness(interval),delay=delayWitness()
  return {protocol:OBS_PROTOCOL,settings:{tab,reveal,origin,rotation,graphMode,graphSize,intervene,interval},
    projection:{indistinguishable:projection.indistinguishable,observations:[projection.observationA,projection.observationB]},
    referenceFrame:{origin,rotation,pairwiseDistances:frame.distances.map(x=>Number(x.toFixed(9)))},
    graph:{vertices:graph.size,edges:graph.edges.length,components:graph.components,cycleRank:graph.cycleRank},
    intervention:{intervene,observationallyEquivalent:causality.observationallyEquivalent,
      discriminatingRow:causality.discriminatingRow},
    sampling:{interval,maxResidual:Number(sampling.maxResidual.toFixed(9)),fastVisible:sampling.fastVisible},
    delay:{visibleRmse:Number(delay.visibleRmse.toFixed(9)),delayRmse:Number(delay.delayRmse.toFixed(9))},
    scope:'Synthetic, fully specified toy models. No claims of hidden cosmic structure, quantum mechanisms, or empirical physics.'}
}
export function verifyObserverInvariants(){
  const base=frameWitness('A',0)
  return {frameInvariant:['A','B','C'].every(a=>[0,90,180].every(r=>
    frameWitness(a,r).distances.every((d,i)=>near(d,base.distances[i])))),
    visualDistortionPreservesCycles:graphWitness('ring',6).cycleRank===graphWitness('distort',6).cycleRank,
    cutChangesCycles:graphWitness('ring',6).cycleRank!==graphWitness('cut',6).cycleRank,
    sampleTimingMatters:!samplingWitness(1).fastVisible&&samplingWitness(0.8).fastVisible,
    interventionSeparates:!causalWitness(false).discriminatingRow&&!!causalWitness(true).discriminatingRow,
    temporalHistoryRecovers:delayWitness().delayRmse<1e-10}
}