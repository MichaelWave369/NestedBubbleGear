// EG-04 E0 · Permeability inference firewall.
// Reuses the EG-03 *conventional* London slab. This is NOT a derivation
// of Li–Torr (1991/1992), Kowitt (1994), or a new gravitational prediction.
import { EG03, solveLondonSlab } from './eg03Model.js'

export const EG04 = Object.freeze({
  schema: 'nbg.eg04.e0.v1',
  provenance: 'SIMULATED',
  authority: 'NONE',
  evidence: 'SOURCE-AUDITED / partial full-text access',
  sources: Object.freeze({
    li1991: 'https://doi.org/10.1103/PhysRevD.43.457',
    li1992: 'https://doi.org/10.1103/PhysRevB.46.5489',
    kowitt1994: 'https://doi.org/10.1103/PhysRevB.49.704',
    li1992_scan: 'https://unpublished.ca/sites/default/files/letter/263060/Ning%20Li%20Paper1.pdf',
  }),
})

// Magnetic field averaged over a conventional infinite parallel-field slab
// with ideal screening. For x=d/(2 λ),  <B>/Bs = tanh(x)/x.
// We label this a *geometric screening ratio*, not μ_material / μ0.
export function londonScreeningRatio(thicknessOverLambda) {
  if (!Number.isFinite(thicknessOverLambda) || thicknessOverLambda <= 0 ||
      thicknessOverLambda > 100) throw new RangeError('positive d/lambda within 100 required')
  const x = thicknessOverLambda / 2
  return Math.tanh(x) / x
}

// Deliberate WRONG SUBSTITUTION demonstration, not a Li–Torr calculation:
// plugging a geometric screening ratio into a symbol for material μr in a
// simplified ∝ 1/μr² relation creates an apparently huge amplification.
export function invalidSubstitutionStressTest(screeningRatio) {
  if (!Number.isFinite(screeningRatio) || screeningRatio <= 0 || screeningRatio > 1)
    throw new RangeError('screening ratio must be in (0, 1]')
  return 1 / (screeningRatio ** 2)
}

export function runEG04({penetrationNm=80,thicknessNm=400,surfaceFieldmT=10,nodes=201}={}) {
  const slab = solveLondonSlab({penetrationNm,thicknessNm,surfaceFieldmT,nodes})
  const ratio = thicknessNm/penetrationNm
  const screeningRatio = londonScreeningRatio(ratio)
  const falseAmplification = invalidSubstitutionStressTest(screeningRatio)
  const dxM = thicknessNm*1e-9/(nodes-1)
  let fieldEnergyPerAreaJm2 = 0
  for(let i=1;i<slab.rows.length;i++) {
    const last = slab.rows[i-1].analyticmT*1e-3
    const current = slab.rows[i].analyticmT*1e-3
    fieldEnergyPerAreaJm2 += (last*last+current*current)*dxM/(4*EG03.mu0)
  }
  const unscreenedFieldEnergyPerAreaJm2=(surfaceFieldmT*1e-3)**2*thicknessNm*1e-9/(2*EG03.mu0)
  const energyFraction=unscreenedFieldEnergyPerAreaJm2===0?null:
    fieldEnergyPerAreaJm2/unscreenedFieldEnergyPerAreaJm2
  // Analytic, dimensionless limit check. In the slab model, screening tends
  // to 2λ/d for a thick sample. The 1/ratio² proxy is not a physical gain.
  const series=Array.from({length:81},(_,i)=>{
    const thicknessOverLambda=0.5+i*19.5/80
    const geometricRatio=londonScreeningRatio(thicknessOverLambda)
    return {thicknessOverLambda,geometricRatio,
      falseAmplification:invalidSubstitutionStressTest(geometricRatio),
      log10FalseAmplification:Math.log10(invalidSubstitutionStressTest(geometricRatio))}
  })
  return {
    schema:EG04.schema,provenance:EG04.provenance,authority:EG04.authority,
    scientificStatus:'CONVENTIONAL_LONDON_PLUS_INVALID_SUBSTITUTION_COUNTEREXAMPLE',
    sourceAccess:'Li–Torr 1992 accessible scanned text; Kowitt 1994 publisher abstract only; independent full-derivation reconstruction NOT COMPLETE',
    inputs:{penetrationNm,thicknessNm,surfaceFieldmT,nodes},
    conventional:{
      thicknessOverLambda:ratio,geometricScreeningRatio:screeningRatio,
      macroscopicSusceptibilityProxy:screeningRatio-1,
      centerFraction:slab.metrics.centerFraction,
      centerFieldmT:slab.metrics.centerAnalyticmT,
      numericCenterFieldmT:slab.metrics.centerNumericmT,
      maxSolverDeviationMicroT:slab.metrics.maxAbsErrorMicroT,
      signedSheetCurrentApm:slab.metrics.signedSheetCurrentApm,
      halfSheetCurrentApm:slab.metrics.halfSheetCurrentApm,
      fieldEnergyPerAreaJm2,unscreenedFieldEnergyPerAreaJm2,energyFraction,
    },
    invalidInference:{
      inputNotMaterialPermeability:true,
      formalInverseSquare: falseAmplification,
      note:'This number is a deliberately invalid substitution example. It is NOT a conductivity, gravity, force or experimental signal.',
    },
    series,
    audit:[
      {id:'L1991',source:EG04.sources.li1991,access:'publisher abstract',
        reported:'Magnetic and gravitomagnetic field mixing, with a screened field combination.',
        testedHere:'NOT REPRODUCED'},
      {id:'L1992',source:EG04.sources.li1992,access:'scanned article pages 5490, 5493–5494 + publisher abstract',
        reported:'An approximate conductivity/permeability relation including a 1/μr² factor (Eq. 48) and further model assumptions.',
        testedHere:'ONLY THE FORMAL INVERSE-SQUARE DEPENDENCE IS STRESS TESTED, NOT THE EQUATION'},
      {id:'K1994',source:EG04.sources.kowitt1994,access:'publisher abstract',
        reported:'Challenges using macroscopic Meissner-state permeability as a microscopic constitutive parameter.',
        testedHere:'CONCEPTUAL VARIABLE-IDENTITY FIREWALL; FULL DERIVATION NOT REPRODUCED'},
    ],
    claim:'No gravitational response, conductivity prediction or experimental physics discovery inferred.',
  }
}
