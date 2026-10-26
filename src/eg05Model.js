// EG-05 E0 · primary-equation custody and SI dimensional audits.
// No contested gravitomagnetic constitutive derivation is implemented.
import { runEG04 } from './eg04Model.js'

export const EG05 = Object.freeze({
  schema:'nbg.eg05.e0.v1', provenance:'SIMULATED', authority:'NONE',
  sourceScan:'https://unpublished.ca/sites/default/files/letter/263060/Ning%20Li%20Paper1.pdf',
  publisher1992:'https://doi.org/10.1103/PhysRevB.46.5489',
  publisher1991:'https://doi.org/10.1103/PhysRevD.43.457',
  kowitt1994:'https://doi.org/10.1103/PhysRevB.49.704',
  hbarJs:1.054571817e-34,
  boltzmannJperK:1.380649e-23,
  electronMassKg:9.1093837139e-31,
  electronChargeC:1.602176634e-19,
  // From the displayed order-of-magnitude Eq. (49), NOT calibrated data.
  illustrativeLog10Sigma49:-29,
})

// Printed page 5493 is PDF page index 4; 5494 is index 5.
// Distinguish visible form, physically validated model, and missing derivation.
export const EG05_CUSTODY = Object.freeze([
  {id:'L1991',year:1991,document:'Li & Torr (1991), Phys. Rev. D 43, 457',
    location:'Publisher abstract (equation not reconstructed)',source:EG05.publisher1991,
    access:'ABSTRACT_ONLY',reproduction:'NOT_REPRODUCED',
    claim:'Magnetic / gravitomagnetic field couplings proposed.',blocked:'Full equations, definitions and gauges unavailable for independent equation audit.'},
  {id:'L92-46',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5493, Eq. (46); scan PDF page 5 (zero-based 4)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'SI_FORM_CHECKED',
    claim:'Reference conductivity σ₀ = nˢ q² τ₀ / m in their relaxation-time approximation.',
    blocked:'Finite relaxation-time approximation is not a proof of infinite superconductor DC conductivity.'},
  {id:'L92-47',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5493, Eq. (47); scan PDF page 5 (zero-based 4)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'SI_FORM_CHECKED',
    claim:'Relaxation-time expression τ₀ = ℏ / (2π k_B T λ*), with assumed dimensionless λ*.',
    blocked:'The microscopic definition and applicability of coupling λ* remain unverified here.'},
  {id:'L92-48',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5493, Eq. (48); scan PDF page 5 (zero-based 4)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'DEPENDENCE_ONLY',
    claim:'Approximate conductivity expression includes an inverse μᵣ² dependence and other factors.',
    blocked:'No independent reconstruction of gravitomagnetic permeability dimensions, conventions or prefactors.'},
  {id:'L92-49',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5493, Eq. (49); scan PDF page 5 (zero-based 4)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'DEPENDENCE_ONLY',
    claim:'Order-of-magnitude approximation σ ∼ 10⁻²⁹ / μᵣ² in context (SI conductivity units).',
    blocked:'Approximate scale derives from contested upstream assumptions; not a measured conductivity.'},
  {id:'L92-50',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5493, Eq. (50); scan PDF page 5 (zero-based 4)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'DEPENDENCE_ONLY',
    claim:'Associated relaxation-time approximation retains inverse μᵣ² dependence.',
    blocked:'Upstream constitutive assumptions and microscopic relaxation physics not verified.'},
  {id:'L92-54',year:1992,document:'Li & Torr (1992), Phys. Rev. B 46, 5489',
    location:'Printed p. 5494, Eq. (54); scan PDF page 6 (zero-based 5)',source:EG05.sourceScan,
    access:'PAGE_VISUALLY_CHECKED',reproduction:'TRANSCRIPTION_ONLY',
    claim:'Later σ–μ model connects conductivity and permeability via additional parameters.',
    blocked:'No exact algebraic transcription or independent derivation; this is not Eq. (49).'},
  {id:'K1994',year:1994,document:'Mark Kowitt (1994), Phys. Rev. B 49, 704',
    location:'Publisher abstract only',source:EG05.kowitt1994,
    access:'ABSTRACT_ONLY',reproduction:'NOT_REPRODUCED',
    claim:'Critiques use of bulk Meissner magnetic permeability as a microscopic parameter.',
    blocked:'Full text and exact mathematical counter-derivation require lawful access and independent audit.'},
])
// SI base unit dimensions [kg, m, s, A, K]; not unit strings or numeric fit.
export const SI_DIMENSIONS = Object.freeze({
  mass:Object.freeze([1,0,0,0,0]),
  density:Object.freeze([0,-3,0,0,0]),
  charge:Object.freeze([0,0,1,1,0]),
  time:Object.freeze([0,0,1,0,0]),
  hbar:Object.freeze([1,2,-1,0,0]),
  kB:Object.freeze([1,2,-2,0,-1]),
  temperature:Object.freeze([0,0,0,0,1]),
  conductivity:Object.freeze([-1,-3,3,2,0]),
  one:Object.freeze([0,0,0,0,0]),
})
export const multiplyDim=(a,b)=>a.map((x,i)=>x+b[i])
export const divideDim=(a,b)=>a.map((x,i)=>x-b[i])
export const scaleDim=(a,p)=>a.map(x=>x*p)
export const matchesDim=(a,b)=>a.length===b.length && a.every((x,i)=>x===b[i])
export function auditSIDimensions(){
  const D=SI_DIMENSIONS
  const eq46=divideDim(multiplyDim(multiplyDim(D.density,scaleDim(D.charge,2)),D.time),D.mass)
  const eq47=divideDim(D.hbar,multiplyDim(D.kB,D.temperature))
  return {
    eq46,eq46Expected:D.conductivity,eq46Pass:matchesDim(eq46,D.conductivity),
    eq47,eq47Expected:D.time,eq47Pass:matchesDim(eq47,D.time),
    eq48:'UNRESOLVED: gravitomagnetic μ_g conventions and material μr interpretation not independently dimension checked',
    eq54:'UNRESOLVED: full source expression and constituent model not independently rederived',
  }
}
export function conventionalReference({temperatureK=4,couplingLambdaStar=1,
  carrierDensityM3=1e28}={}){
  if (![temperatureK,couplingLambdaStar,carrierDensityM3].every(Number.isFinite)||
    temperatureK<.1||temperatureK>300||couplingLambdaStar<.1||couplingLambdaStar>10||
    carrierDensityM3<1e22||carrierDensityM3>1e30)throw new RangeError('outside illustrative source Eq. 46/47 domain')
  const massKg=2*EG05.electronMassKg
  const chargeC=2*EG05.electronChargeC
  const tauSeconds=EG05.hbarJs/(2*Math.PI*EG05.boltzmannJperK*temperatureK*couplingLambdaStar)
  const conductivitySperM=carrierDensityM3*chargeC*chargeC*tauSeconds/massKg
  return {temperatureK,couplingLambdaStar,carrierDensityM3,carrierMassKg:massKg,
    carrierChargeC:chargeC,tauSeconds,conductivitySperM,
    limits:'Eq. 46/47 finite relaxation-time reference, NOT measured superconducting DC conductivity',
    provenance:'SIMULATED'}
}
// Eq. 49 SOURCE SHAPE only: log10 σ = -29 - 2log10 μr.
// This conditional scaling is not a material model, a measurement,
// or an endorsement of contested permeability values.
export function conditionalEq49(log10MuRelative){
  if(!Number.isFinite(log10MuRelative)||log10MuRelative< -35||log10MuRelative>0)
    throw new RangeError('log10 μr outside illustrated source domain')
  const log10ConductivitySperM=EG05.illustrativeLog10Sigma49 -2*log10MuRelative
  return {log10MuRelative,log10ConductivitySperM,
    conductivitySperM:10**log10ConductivitySperM,
    caveat:'Conditional 1992 Eq. 49 approximate source scaling, disputed assumptions; NOT verified physical conductivity'}
}
export function runEG05({temperatureK=4,couplingLambdaStar=1,
  densityExponent=28, log10MuRelative=-20,
  penetrationNm=80,thicknessNm=400}={}){
  if(!Number.isInteger(densityExponent)||densityExponent<22||densityExponent>30)
    throw new RangeError('density exponent outside range')
  const si=auditSIDimensions()
  const reference=conventionalReference({temperatureK,couplingLambdaStar,
    carrierDensityM3:10**densityExponent})
  const conditional=conditionalEq49(log10MuRelative)
  const slab=runEG04({penetrationNm,thicknessNm,surfaceFieldmT:10,nodes:201})
  const sourceSweep=Array.from({length:71},(_,i)=>{
    const log10MuRelative=-35+i*.5
    return conditionalEq49(log10MuRelative)
  })
  const ratio=slab.conventional.geometricScreeningRatio
  return {
    schema:EG05.schema,provenance:EG05.provenance,authority:EG05.authority,
    status:'PARTIAL_SOURCE_CUSTODY / UNVERIFIED_GRAVITOMAGNETIC_DERIVATION',
    claim:'SI checked only for finite-time conventional Eq. 46/47 and conditional inverse-square shape for Eq. 49',
    input:{temperatureK,couplingLambdaStar,densityExponent,log10MuRelative,penetrationNm,thicknessNm},
    dimensions:si,reference,conditional,
    geometricCounterexample:{
      dOverLambda:thicknessNm/penetrationNm,screeningRatio:ratio,
      log10GeometricRatio:Math.log10(ratio),
      invalidSourceUse:'REJECT: measured screening ratio R is not authenticated as the published microscopic/material μr',
    },
    sourceSweep,
    custody:EG05_CUSTODY,
    missing:[
      'Full 1991 Li–Torr derivation and conventions',
      'Full Kowitt 1994 derivation, symbol definitions and alternative result',
      'Independent reconstruction of 1992 Eq. 48/54 prefactors and all μ_g units',
      'Validation that published μr values refer to the same physical observable',
      'Independent experimental replication, calibration, and error bars',
    ],
  }
}
