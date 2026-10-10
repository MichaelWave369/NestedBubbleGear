// NBG-QM2: repeated-trial controlled software benchmark. No mining network.
import {
  QM1_SCHEDULERS, QM1_DIFFICULTIES, nonceOrder,
  makeToyHeader, doubleSha256, leadingZeroBits, runPoWSchedule,
} from './qm1Model.js'

export const QM2_ROUNDS = Object.freeze([3,6,9])
export const QM2_DOMAINS = Object.freeze([32,64,128,256,512])
const HEX = bytes => Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('')
const average = values => values.reduce((sum,value)=>sum+value,0)/values.length
export function median(values){
  if(!Array.isArray(values)||values.length===0||
    values.some(v=>!Number.isFinite(v)))throw new RangeError('Need nonempty finite values')
  const sorted=[...values].sort((a,b)=>a-b)
  const mid=Math.floor(sorted.length/2)
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2
}
export function percentile(values,p){
  if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('Invalid percentile')
  const sorted=[...values].sort((a,b)=>a-b)
  if(!sorted.length||sorted.some(v=>!Number.isFinite(v)))throw new RangeError('Invalid sample')
  const at=(sorted.length-1)*p,left=Math.floor(at),right=Math.ceil(at)
  return sorted[left]+(sorted[right]-sorted[left])*(at-left)
}
export function descriptiveStats(values){
  if(!Array.isArray(values)||!values.length||values.some(v=>!Number.isFinite(v)))
    throw new RangeError('Invalid observations')
  const mean=average(values)
  const stddev=Math.sqrt(average(values.map(v=>(v-mean)**2)))
  return {
    n:values.length,median:median(values),mean,stddev,
    coefficientOfVariation:mean===0?null:stddev/Math.abs(mean),
    min:Math.min(...values),max:Math.max(...values),
    q1:percentile(values,.25),q3:percentile(values,.75),
  }
}
function next32(state){
  let x=state|0;x^=x<<13;x^=x>>>17;x^=x<<5
  return x>>>0
}
export function balancedTrialOrder(rounds=6,seed=369){
  if(!QM2_ROUNDS.includes(rounds)||!Number.isInteger(seed)||seed<0||seed>65535)
    throw new RangeError('Invalid balanced experiment settings')
  const schedule=[]
  for(let block=0;block<rounds/3;block++){
    const items=[...QM1_SCHEDULERS]
    let state=(seed+1+block*1009)>>>0
    for(let i=items.length-1;i>0;i--){
      state=next32(state||1)
      const j=state%(i+1)
      ;[items[i],items[j]]=[items[j],items[i]]
    }
    for(let offset=0;offset<3;offset++){
      const round=block*3+offset
      const order=items.map((_,pos)=>items[(pos+offset)%3])
      schedule.push({round:round+1,seed:(seed+17+round*131)%65536,order})
    }
  }
  return schedule
}
function validateSettings({universe,rounds,bits,seed,warmup,sha256,clock,onRound}){
  if(!QM2_DOMAINS.includes(universe))throw new RangeError('Unsupported QM2 domain')
  if(!QM2_ROUNDS.includes(rounds))throw new RangeError('Unsupported repetition count')
  if(!QM1_DIFFICULTIES.includes(bits))throw new RangeError('Unsupported toy target')
  if(!Number.isInteger(seed)||seed<0||seed>65535)throw new RangeError('Invalid seed')
  if(![0,16].includes(warmup))throw new RangeError('Warmup is either 0 or 16')
  if(typeof sha256!=='function'||typeof clock!=='function')throw new TypeError('Missing cryptographic hash or monotonic clock')
  if(onRound!==undefined&&typeof onRound!=='function')throw new TypeError('Invalid progress callback')
}
export async function auditQM2Round({runs,universe,bits,seed,sha256}){
  if(runs.length!==QM1_SCHEDULERS.length)throw new Error('All three strategies required')
  // Entire reference set is recomputed OUTSIDE each measured runtime.
  const reference=new Map()
  for(let nonce=0;nonce<universe;nonce++){
    const digest=await doubleSha256(makeToyHeader(seed,nonce),sha256)
    reference.set(nonce,{hash:HEX(digest),leadingZeroBits:leadingZeroBits(digest)})
  }
  const correctNonces=[...reference.entries()].filter(([,data])=>data.leadingZeroBits>=bits)
    .map(([nonce])=>nonce).sort((a,b)=>a-b)
  const reports=[]
  for(const run of runs){
    const order=nonceOrder(run.strategy,universe,seed)
    const expected=order.filter(nonce=>reference.get(nonce).leadingZeroBits>=bits)
    const recorded=run.allHitProofs
    if(run.seed!==seed||run.universe!==universe||run.budget!==universe||run.bits!==bits||
      run.hashesComputed!==universe||run.uniqueCandidates!==universe||run.collisions!==0||
      run.coverage!==1||!Array.isArray(recorded)||recorded.length!==expected.length||
      run.hits!==expected.length)throw new Error('QM2 invariant failure: equal work, coverage, or hit count')
    for(let i=0;i<expected.length;i++){
      const proof=recorded[i],expectedHash=reference.get(expected[i])
      if(proof?.nonce!==expected[i]||proof.hash!==expectedHash.hash||
        proof.leadingZeroBits!==expectedHash.leadingZeroBits)
        throw new Error('QM2 detected an unverifiable accepted hash')
    }
    if(expected.length===0){
      if(run.firstHit!==null)throw new Error('Incorrect first-hit claim')
    }else{
      const expectedHash=reference.get(expected[0])
      if(run.firstHit?.nonce!==expected[0]||run.firstHit?.attempt!==order.indexOf(expected[0])+1||
        run.firstHit?.hash!==expectedHash.hash)
        throw new Error('Incorrect first-hit claim')
    }
    reports.push({
      strategy:run.strategy,fullyReverified:true,
      verifiedAcceptedNonces:expected.length,
      rehashedCandidates:universe,
      validFirstHit:true,
      completeCoverage:true,
    })
  }
  return {
    verified:true,referenceRecomputations:universe,referenceHitNonces:correctNonces,
    allStrategyHitSetsMatch:runs.every(run=>run.hits===correctNonces.length),
    reports,
  }
}
export async function runQM2Experiment({
  universe=128,rounds=6,bits=8,seed=369,warmup=16,
  sha256,clock=()=>performance.now(),onRound,
}={}){
  validateSettings({universe,rounds,bits,seed,warmup,sha256,clock,onRound})
  const schedule=balancedTrialOrder(rounds,seed)
  const measured=[]
  const audits=[]
  for(const block of Array.from({length:rounds/3},(_,i)=>i)){
    if(warmup>0){
      // Untimed one-off preconditioning in balanced block order.
      const controls=schedule[block*3].order
      for(const strategy of controls){
        await runPoWSchedule({
          strategy,universe,budget:warmup,seed:schedule[block*3].seed,
          leadingZeroBits:bits,sha256,clock,
        })
      }
    }
    for(let slot=0;slot<3;slot++){
      const record=schedule[block*3+slot]
      const results=[]
      for(const strategy of record.order){
        results.push(await runPoWSchedule({
          strategy,universe,budget:universe,
          seed:record.seed,leadingZeroBits:bits,
          sha256,clock,captureAllHits:true,
        }))
      }
      const audit=await auditQM2Round({runs:results,universe,bits,seed:record.seed,sha256})
      audits.push({...audit,round:record.round,seed:record.seed})
      measured.push({
        round:record.round,seed:record.seed,executionOrder:record.order,
        trials:results.map((run,executionPosition)=>({
          strategy:run.strategy,executionPosition:executionPosition+1,
          elapsedMs:run.elapsedMs,hashesPerSecond:run.hashesPerSecond,
          hashesComputed:run.hashesComputed,coverage:run.coverage,
          collisions:run.collisions,hits:run.hits,
          firstHitAttempt:run.firstHit?.attempt??null,
          verifiedHitCount:run.allHitProofs.length,
          independentRehashPass:audit.reports.find(row=>row.strategy===run.strategy).fullyReverified,
        })),
      })
      if(onRound)await onRound({round:record.round,total:rounds})
    }
  }
  const summary=QM1_SCHEDULERS.map(strategy=>{
    const runs=measured.map(row=>row.trials.find(trial=>trial.strategy===strategy))
    return {
      strategy,throughput:descriptiveStats(runs.map(run=>run.hashesPerSecond??0)),
      elapsedMs:descriptiveStats(runs.map(run=>run.elapsedMs)),
      firstHitAttempts:runs.map(run=>run.firstHitAttempt),
      totalHashes:runs.reduce((s,run)=>s+run.hashesComputed,0),
      allReverified:runs.every(run=>run.independentRehashPass),
      coverageEveryRound:runs.every(run=>run.coverage===1&&run.collisions===0),
    }
  })
  const pairedRatios=measured.map(row=>{
    const rate=strategy=>row.trials.find(trial=>trial.strategy===strategy).hashesPerSecond
    const sequential=rate('SEQUENTIAL'),gear=rate('NBG_GEAR'),shuffled=rate('SEEDED_SHUFFLE')
    return {round:row.round,gearVsSequential:sequential>0&&gear!==null?gear/sequential:null,
      shuffleVsSequential:sequential>0&&shuffled!==null?shuffled/sequential:null}
  })
  const validPaired=pairedRatios.filter(row=>row.gearVsSequential!==null)
  return {
    schema:'nbg.qm2.repeated-trial.v1',
    origin:'SOFTWARE_MEASURED_WITH_SYNTHETIC_INPUTS',
    authority:'DEMONSTRATION_ONLY',
    method:'SEEDED_BLOCK_RANDOMIZED_BALANCED_CROSSOVER',
    settings:{universe,rounds,bits,seed,warmup,
      fullDomainEveryRound:true,unmeasuredWarmups:true},
    trialSchedule:schedule,
    measuredRounds:measured,
    referenceAudits:audits,
    summaries:summary,
    pairedComparisons:{
      gearVsSequential:validPaired.length?
        descriptiveStats(validPaired.map(row=>row.gearVsSequential)):null,
      shuffleVsSequential:validPaired.length?
        descriptiveStats(validPaired.map(row=>row.shuffleVsSequential)):null,
      perRound:pairedRatios,
      metric:'LOCAL_SOFTWARE_THROUGHPUT_RATIO_NOT_PROVEN_ALGORITHM_ADVANTAGE',
    },
    checks:{
      equalHashesPerStrategy:summary.every(row=>row.totalHashes===universe*rounds),
      everyHitRehashed:summary.every(row=>row.allReverified),
      fullDomainNoDuplicateNonces:summary.every(row=>row.coverageEveryRound),
      sameValidHashCountsEachRound:audits.every(row=>row.allStrategyHitSetsMatch),
      balancedExecutionPositions:QM1_SCHEDULERS.every(strategy=>
        [1,2,3].every(pos=>measured.filter(row=>
          row.trials.some(trial=>trial.strategy===strategy&&trial.executionPosition===pos)).length===rounds/3)),
      identicalSeedsWithinRound:measured.every(row=>
        row.trials.every(t=>t.hashesComputed===universe)),
    },
    claimBoundary:'Exploratory software timing only; no quantum, SHA-256 search-space, energy, statistical significance or economic advantage demonstrated.',
    limitations:[
      'Runs sequentially inside one software runtime; timing includes implementation, JIT, scheduling, GC and WebCrypto overhead',
      'Position balance controls some ordering confounds but cannot control temperature, GPU/ASIC use, CPU frequency or browser contention',
      'Full-domain work makes total valid-hit sets identical by construction; first-hit variation is nonce ordering only',
      'The separate reference SHA-256 rehash checks algorithmic correctness outside the timing window; it is the same crypto backend, not an independent implementation',
      'Quartiles are descriptive interpolation, not confidence intervals, p-values or statistical significance',
      'Joules per hash NOT MEASURED; no actual Bitcoin-network validation, mining payouts, or quantum hardware',
    ],
    physicalEnergyJoulesPerHash:null,
    promoted:false,
  }
}
export function qm2Receipt(run){
  if(run?.schema!=='nbg.qm2.repeated-trial.v1'||run?.authority!=='DEMONSTRATION_ONLY')
    throw new RangeError('Expected governed QM2 result')
  return {
    ...run,
    exportSchema:'nbg.qm2.receipt.v1',
    frozenNBGExperimentsModified:false,
    aqlenHandoff:'REQUIRES_SEPARATE_REVIEW_NO_SILENT_LEDGER_IMPORT',
  }
}
