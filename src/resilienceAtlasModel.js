// NBG-BR2: frozen factorial sweep over the BR1 synthetic, dimensionless equations.
// Distinct observer: baseline velocity correlation; distinct task: post-kick full-state recovery.
import {BR1_DEFAULTS,BR1_PRESETS,simulateBR1} from './balanceRecoveryModel.js'

export const BR2_PROTOCOL = 'NBG-BR2-v0.1.0'
export const BR2_GRID = Object.freeze({
  coupling:Object.freeze([0,0.25,0.5,0.75,1,1.25,1.5,1.75,2]),
  asymmetry:Object.freeze([-1,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1]),
  damping:Object.freeze([0.08,0.22,0.46,0.8]),
  detuning:Object.freeze([0,0.12,0.36]),
  timeStep:0.04,
  duration:38,
  pulseTime:10,
  kick:2,
  driveAmplitude:0.75,
  correlationThreshold:0.95,
})

export const BR2_TOTAL_CELLS =
  BR2_GRID.coupling.length * BR2_GRID.asymmetry.length *
  BR2_GRID.damping.length * BR2_GRID.detuning.length

function assertSlice(damping,detuning){
  if(!BR2_GRID.damping.includes(damping))throw new RangeError('Unknown frozen damping slice')
  if(!BR2_GRID.detuning.includes(detuning))throw new RangeError('Unknown frozen detuning slice')
}
const rounded = n => n===null || !Number.isFinite(n) ? null : +n.toFixed(6)

function cellAt(coupling,asymmetry,damping,detuning) {
  const sim=simulateBR1({
    ...BR1_DEFAULTS,
    coupling,asymmetry,damping,detuning,
    timeStep:BR2_GRID.timeStep,
    duration:BR2_GRID.duration,
    pulseTime:BR2_GRID.pulseTime,
    kick:BR2_GRID.kick,
    driveAmplitude:BR2_GRID.driveAmplitude,
  })
  const m=sim.metrics
  const state=m.diverged?'DIVERGED':m.recovered?'RECOVERED':'HORIZON_CENSORED'
  return {
    coupling,asymmetry,damping,detuning,
    state,
    recoveryTime:m.recoveryTime,
    finalResidue:rounded(m.finalResidue),
    peakResidue:rounded(m.peakResidue),
    velocityCorrelation:rounded(m.velocityCorrelation),
    coarseHighCoordination:m.velocityCorrelation!==null &&
      m.velocityCorrelation>=BR2_GRID.correlationThreshold,
    mismatch:false,
    comparedToReciprocal:null,
    recoveryAdvantageSeconds:null,
  }
}

function comparison(row,baseline) {
  if(row.asymmetry===0)return 'RECIPROCAL_BASELINE'
  if(row.state==='DIVERGED'||baseline.state==='DIVERGED')return 'DIVERGED'
  if(row.state==='HORIZON_CENSORED'&&baseline.state==='HORIZON_CENSORED')return 'BOTH_CENSORED'
  if(row.state==='RECOVERED'&&baseline.state!=='RECOVERED')return 'DIRECTIONAL_ONLY_RECOVERS'
  if(row.state!=='RECOVERED'&&baseline.state==='RECOVERED')return 'RECIPROCAL_ONLY_RECOVERS'
  const delta=rounded(baseline.recoveryTime-row.recoveryTime)
  if(delta>0)return 'DIRECTIONAL_FASTER'
  if(delta<0)return 'RECIPROCAL_FASTER'
  return 'TIED'
}

function summarize(cells) {
  const counts={
    total:cells.length,recovered:0,censored:0,diverged:0,
    highCoordination:0,highCoordinationWithoutRecovery:0,
    directionalFaster:0,reciprocalFaster:0,directionalOnly:0,reciprocalOnly:0,
    tied:0,bothCensored:0,reciprocalBaselines:0,
  }
  for(const c of cells){
    if(c.state==='RECOVERED')counts.recovered++
    else if(c.state==='HORIZON_CENSORED')counts.censored++
    else counts.diverged++
    if(c.coarseHighCoordination)counts.highCoordination++
    if(c.mismatch)counts.highCoordinationWithoutRecovery++
    if(c.comparedToReciprocal==='DIRECTIONAL_FASTER')counts.directionalFaster++
    if(c.comparedToReciprocal==='RECIPROCAL_FASTER')counts.reciprocalFaster++
    if(c.comparedToReciprocal==='DIRECTIONAL_ONLY_RECOVERS')counts.directionalOnly++
    if(c.comparedToReciprocal==='RECIPROCAL_ONLY_RECOVERS')counts.reciprocalOnly++
    if(c.comparedToReciprocal==='TIED')counts.tied++
    if(c.comparedToReciprocal==='BOTH_CENSORED')counts.bothCensored++
    if(c.comparedToReciprocal==='RECIPROCAL_BASELINE')counts.reciprocalBaselines++
  }
  if(counts.recovered+counts.censored+counts.diverged!==counts.total){
    throw new Error('BR2 outcome accounting mismatch')
  }
  return counts
}

export function runBR2Slice({damping=0.46,detuning=0.12}={}) {
  assertSlice(damping,detuning)
  const rows=BR2_GRID.coupling.flatMap(coupling=>
    BR2_GRID.asymmetry.map(asymmetry=>cellAt(coupling,asymmetry,damping,detuning)))
  const reciprocal=new Map(rows.filter(c=>c.asymmetry===0).map(c=>[c.coupling,c]))
  const cells=rows.map(row=>{
    const baseline=reciprocal.get(row.coupling)
    const comparisonClass=comparison(row,baseline)
    return {
      ...row,
      mismatch:row.coarseHighCoordination&&row.state!=='RECOVERED',
      comparedToReciprocal:comparisonClass,
      recoveryAdvantageSeconds:
        row.state==='RECOVERED'&&baseline.state==='RECOVERED'
        ?rounded(baseline.recoveryTime-row.recoveryTime):null,
    }
  })
  return {protocol:BR2_PROTOCOL,origin:'SIMULATED',damping,detuning,cells,summary:summarize(cells)}
}

export function runBR2FullSweep() {
  const slices=BR2_GRID.damping.flatMap(damping=>
    BR2_GRID.detuning.map(detuning=>runBR2Slice({damping,detuning})))
  const cells=slices.flatMap(slice=>slice.cells)
  if(cells.length!==BR2_TOTAL_CELLS)throw new Error('Incomplete frozen BR2 sweep')
  return {
    protocol:BR2_PROTOCOL,
    origin:'SIMULATED',
    slices,
    summary:summarize(cells),
    totalCells:cells.length,
  }
}

export function runBR2Controls() {
  const controlNames=['reciprocal','asymmetric','uncoupled','weakDamping','negativeDamping']
  const result=Object.fromEntries(controlNames.map(name=>{
    const m=simulateBR1({...BR1_DEFAULTS,...BR1_PRESETS[name],timeStep:BR2_GRID.timeStep}).metrics
    return [name,{
      recovered:m.recovered,diverged:m.diverged,
      recoveryTime:m.recoveryTime,finalResidue:rounded(m.finalResidue),
      velocityCorrelation:rounded(m.velocityCorrelation),
    }]
  }))
  const zero=simulateBR1({...BR1_DEFAULTS,kick:0,timeStep:BR2_GRID.timeStep})
  return {...result,zeroKick:{exactlyZero:zero.trace.every(p=>p.residue===0)}}
}

export function buildBR2Receipt(slice,{includeCells=true}={}) {
  if(slice?.protocol!==BR2_PROTOCOL||slice?.origin!=='SIMULATED'||
    !Array.isArray(slice.cells))throw new Error('BR2 receipt requires a genuine slice result')
  return {
    protocol:BR2_PROTOCOL,
    origin:'SIMULATED',
    evidenceStatus:'EXPLORATORY_SYNTHETIC_GRID',
    authority:'NONE',
    grid:BR2_GRID,
    selectedSlice:{damping:slice.damping,detuning:slice.detuning},
    summary:slice.summary,
    cells:includeCells?slice.cells:undefined,
    note:'No real-world causal, physical, biological, spiritual, social or chaotic-dynamics claim. Null times are horizon-censored, never zero.',
  }
}
