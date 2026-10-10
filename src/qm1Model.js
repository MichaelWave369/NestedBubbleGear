// NBG-QM1: educational double-SHA256 experiments, no real Bitcoin mining.
export const QM1_SCHEDULERS=Object.freeze(['SEQUENTIAL','SEEDED_SHUFFLE','NBG_GEAR'])
export const QM1_UNIVERSES=Object.freeze([32,64,128,256,512,1024])
export const QM1_DIFFICULTIES=Object.freeze([4,6,8,10,12])
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
function checkConfig({universe,budget,leadingZeroBits,seed}){
  if(!QM1_UNIVERSES.includes(universe))throw new RangeError('Unsupported nonce domain')
  if(!Number.isInteger(budget)||budget<1||budget>universe)throw new RangeError('Invalid work budget')
  if(!QM1_DIFFICULTIES.includes(leadingZeroBits))throw new RangeError('Unsupported toy target')
  if(!Number.isInteger(seed)||seed<0||seed>65535)throw new RangeError('Invalid seed')
}
function randomStep(state){
  let x=state|0
  x^=x<<13;x^=x>>>17;x^=x<<5
  return x>>>0
}
export function nonceOrder(strategy,universe,seed=369){
  if(!QM1_SCHEDULERS.includes(strategy)||!QM1_UNIVERSES.includes(universe)||
    !Number.isInteger(seed)||seed<0||seed>65535)throw new RangeError('Unsupported scheduler')
  const values=Array.from({length:universe},(_,i)=>i)
  if(strategy==='SEQUENTIAL')return values
  if(strategy==='SEEDED_SHUFFLE'){
    let state=seed||1
    for(let i=universe-1;i>0;i--){
      state=randomStep(state)
      const j=state%(i+1)
      ;[values[i],values[j]]=[values[j],values[i]]
    }
    return values
  }
  // A bijective odd-stride permutation over a power-of-two bounded domain.
  // The golden-ratio-inspired stride changes scheduling order, NOT hash difficulty.
  const stride=(Math.floor(universe*.6180339887498949)|1)
  const start=(seed*37)%universe
  return values.map((_,i)=>(start+i*stride)%universe)
}
export function makeToyHeader(seed=369,nonce=0){
  if(!Number.isInteger(seed)||seed<0||seed>65535)throw new RangeError('Invalid seed')
  if(!Number.isInteger(nonce)||nonce<0||nonce>0xffffffff)throw new RangeError('Invalid nonce')
  const bytes=new Uint8Array(80)
  let state=(seed^0x6e626731)>>>0
  for(let i=0;i<76;i++){
    state=randomStep(state||1)
    bytes[i]=state&255
  }
  // 80-byte synthetic header with 32-bit little-endian nonce field.
  new DataView(bytes.buffer).setUint32(76,nonce,true)
  return bytes
}
export async function doubleSha256(header,sha256){
  if(!(header instanceof Uint8Array)||header.length!==80)throw new RangeError('80-byte header required')
  if(typeof sha256!=='function')throw new TypeError('A SHA-256 implementation must be injected')
  const first=await sha256(header)
  return new Uint8Array(await sha256(first))
}
export function leadingZeroBits(bytes){
  let result=0
  for(const byte of bytes){
    if(byte===0){result+=8;continue}
    for(let bit=7;bit>=0;bit--){
      if(byte&(1<<bit))return result
      result+=1
    }
  }
  return result
}
export async function verifyEducationalPoW({nonce,seed,leadingZeroBits:bits,sha256}){
  const hash=await doubleSha256(makeToyHeader(seed,nonce),sha256)
  return {nonce,hash:hex(hash),valid:leadingZeroBits(hash)>=bits}
}
export async function runPoWSchedule({
  strategy='SEQUENTIAL',universe=128,budget=128,leadingZeroBits:bits=8,
  seed=369,sha256,clock=()=>performance.now(),captureAllHits=false,
}={}){
  checkConfig({universe,budget,leadingZeroBits:bits,seed})
  const order=nonceOrder(strategy,universe,seed).slice(0,budget)
  let firstHit=null
  let hits=0
  const proofSamples=[]
  const allHitProofs=captureAllHits?[]:null
  const start=clock()
  for(let i=0;i<order.length;i++){
    const nonce=order[i]
    const hash=await doubleSha256(makeToyHeader(seed,nonce),sha256)
    const leading=leadingZeroBits(hash)
    if(leading>=bits){
      hits+=1
      if(firstHit===null)firstHit={nonce,attempt:i+1,hash:hex(hash),leadingZeroBits:leading}
      if(proofSamples.length<12)proofSamples.push({nonce,hash:hex(hash),leadingZeroBits:leading})
      if(allHitProofs)allHitProofs.push({nonce,hash:hex(hash),leadingZeroBits:leading})
    }
  }
  const elapsedMs=Math.max(0,clock()-start)
  return {
    strategy,universe,budget,bits,seed,
    uniqueCandidates:new Set(order).size,
    collisions:order.length-new Set(order).size,
    coverage:Number((new Set(order).size/universe).toFixed(8)),
    elapsedMs,
    hashesPerSecond:elapsedMs>0?Number((budget/(elapsedMs/1000)).toFixed(3)):null,
    hashesComputed:budget,
    doubleSha256Operations:2*budget,
    firstHit,hits,proofSamples,
    ...(captureAllHits?{allHitProofs}:{}),
    // Wall-clock timings are only meaningful on one given runtime; no energy measurement.
    joulesPerHash:null,energyMeasurement:'NOT_MEASURED',
  }
}
export async function comparePoWSchedules(settings){
  const trials=[]
  for(const strategy of QM1_SCHEDULERS)
    trials.push(await runPoWSchedule({...settings,strategy}))
  return {
    schema:'nbg.qm1.pow-benchmark.v1',
    origin:'SIMULATED_AND_SOFTWARE_MEASURED',
    authority:'DEMONSTRATION_ONLY',
    hashConstruction:'DOUBLE_SHA256_80_BYTE_SYNTHETIC_HEADER',
    targetRule:'RAW_DIGEST_LEADING_ZERO_BITS_TOY_ONLY_NOT_BITCOIN_CONSENSUS_TARGET',
    trials,
    fairBudget:trials.every(row=>row.budget===trials[0].budget),
    equalDomain:trials.every(row=>row.universe===trials[0].universe),
    comparableEnergy:false,
    noMonetaryMining:true,
  }
}
export function simulateToyGrover({qubits=6,markedIndex=13,iterations=5}={}){
  if(!Number.isInteger(qubits)||qubits<2||qubits>8)throw new RangeError('Qubits 2..8')
  const size=2**qubits
  if(!Number.isInteger(markedIndex)||markedIndex<0||markedIndex>=size)
    throw new RangeError('Invalid marked index')
  if(!Number.isInteger(iterations)||iterations<0||iterations>Math.ceil(2*Math.sqrt(size)))
    throw new RangeError('Invalid Grover iteration count')
  const amplitudes=Array(size).fill(1/Math.sqrt(size))
  const probabilityHistory=[1/size]
  for(let step=0;step<iterations;step++){
    amplitudes[markedIndex]*=-1 // phase oracle: simulated state-vector operation
    const mean=amplitudes.reduce((s,x)=>s+x,0)/size
    for(let i=0;i<size;i++)amplitudes[i]=2*mean-amplitudes[i]
    probabilityHistory.push(amplitudes[markedIndex]**2)
  }
  return {
    schema:'nbg.qm1.grover-statevector.v1',
    origin:'SIMULATED',hardware:'NONE',
    qubits,universe:size,markedIndex,iterations,
    oracleCalls:iterations,markedItems:1,
    successProbability:amplitudes[markedIndex]**2,
    stateNormSquared:amplitudes.reduce((s,x)=>s+x*x,0),
    history:probabilityHistory,
    classicalRandomSuccessAtSameNumberOfGuesses:Math.min(1,iterations/size),
    comparisonBoundary:'ORACLE_QUERY_COUNTS_ONLY_NOT_REAL_HARDWARE_SPEED_OR_ENERGY',
  }
}
export function qm1Receipt(benchmark,grover){
  return {
    schema:'nbg.qm1.receipt.v1',
    origin:'SIMULATED_AND_SOFTWARE_MEASURED',
    authority:'DEMONSTRATION_ONLY',
    proofOfWork:benchmark,
    quantumReference:grover,
    claims:{
      SHA256ImprovementProven:false,
      hardwareQuantumAdvantage:false,
      economicViabilityEstablished:false,
      energyMeasured:false,
      independentScientificValidation:false,
    },
    limitations:[
      'This is not network-valid Bitcoin mining; the target is educational',
      'Scheduling changes nonce order, not cryptographic hash preimage difficulty',
      'Benchmark clock is runtime-dependent and includes JavaScript/WebCrypto overhead',
      'Grover output is a toy classical state-vector simulation, not quantum execution',
      'No GPU, ASIC, quantum hardware, wallet, pool, network endpoint, or measured energy',
    ],
  }
}
export function toAqlenReceiptGraph(receipt){
  if(receipt?.schema!=='nbg.qm1.receipt.v1'||
    receipt.authority!=='DEMONSTRATION_ONLY')throw new RangeError('Unsupported QM1 receipt')
  const types=['module','evidence_anchor']
  const nodes=[
    {id:'module-qm1',type:types[0],label:'NBG QM1 Local Research',
      status:'SIMULATED',claim_boundary:'RESEARCH_DEMO_NO_QUANTUM_HARDWARE',
      source_path:'NBG/docs/QM1_MINING_PROTOCOL.md'},
    {id:'evidence-pow',type:types[1],label:'Double SHA-256 schedule comparison',
      status:'SOFTWARE_MEASUREMENT',
      claim_boundary:'TOY_TARGET_NO_REAL_MINING',
      measured_results:receipt.proofOfWork.trials.map(t=>({
        strategy:t.strategy,budget:t.budget,collisions:t.collisions,hits:t.hits,
        hashesPerSecond:t.hashesPerSecond,energy:t.energyMeasurement,
      }))},
    {id:'evidence-grover',type:types[1],label:'Toy Grover classical simulation',
      status:'SIMULATED',claim_boundary:'NO_REAL_QPU_OR_QUANTUM_SPEEDUP',
      simulated_results:{qubits:receipt.quantumReference.qubits,
        oracleCalls:receipt.quantumReference.oracleCalls,
        successProbability:receipt.quantumReference.successProbability}},
  ]
  return {
    graph_id:'nbg-qm1-bridge-'+receipt.proofOfWork.trials[0].seed,
    version:'v0.1.0',
    summary:'Read-only simulated NBG-QM1 evidence; no qubit provenance or hardware claim',
    nodes,
    edges:[
      {from:'evidence-pow',to:'module-qm1',type:'derived_from'},
      {from:'evidence-grover',to:'module-qm1',type:'derived_from'},
    ],
  }
}
