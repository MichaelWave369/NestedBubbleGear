/**
 * BSR-3.0.0: deterministic constitutive-law toy. NOT a pineal model.
 * A synthetic, sinusoidal externally APPLIED stress acts on an assumed
 * uniaxial piezoelectric element; neither tissue transfer nor physiology
 * is implemented. d_eff is ASSUMED (not a measured calcite coefficient).
 */
export const BSR3_VERSION = 'BSR-3.0.0'
export const BSR3_EPSILON_0 = 8.8541878128e-12 // farad / meter
export const BSR3_ELEMENTARY_CHARGE = 1.602176634e-19 // coulomb
export const BSR3_DEFAULTS = Object.freeze({
  stressPa: 100,
  effectiveDPcPerN: 0.2,
  crystalSizeUm: 10,
  relativePermittivity: 9,
  frequencyHz: 0.22,
})
const RANGES = Object.freeze({
  stressPa: [0, 1000],
  effectiveDPcPerN: [0, 2.5],
  crystalSizeUm: [1, 20],
  relativePermittivity: [3, 30],
  frequencyHz: [0.1, 1],
})
const DURATION_SEC = 20
const SAMPLE_RATE_HZ = 100
const finiteBounded = (key, input) => {
  const x = Number(input)
  const [min, max] = RANGES[key]
  return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : BSR3_DEFAULTS[key]
}
export function normalizeBSR3(options = {}) {
  return Object.fromEntries(Object.keys(RANGES).map(key =>
    [key, finiteBounded(key, options[key] ?? BSR3_DEFAULTS[key])]))
}
/**
 * Small-signal, 1-D, ideal open circuit:
 * F(t) = sigma(t) A ; Q(t) = d_eff F(t)
 * C = epsilon0 epsilon_r A / L ; V_oc(t) = Q(t) / C.
 * Cross section is approximated as a circle with diameter = length L.
 * An ideal capacitor voltage is NOT a detected tissue voltage:
 * screening, leakage, interfaces, electrode geometry and noise are excluded.
 */
export function simulateBSR3(options = {}) {
  const settings = normalizeBSR3(options)
  const sizeM = settings.crystalSizeUm * 1e-6
  const areaM2 = Math.PI * (sizeM / 2) ** 2
  const capacitanceF = BSR3_EPSILON_0 * settings.relativePermittivity * areaM2 / sizeM
  const effectiveDCPerN = settings.effectiveDPcPerN * 1e-12
  const stressPeakPa = settings.stressPa
  const peakForceN = stressPeakPa * areaM2
  const peakChargeC = effectiveDCPerN * peakForceN
  const peakVoltageV = peakChargeC / capacitanceF
  const samples = []
  for (let i = 0; i <= DURATION_SEC * SAMPLE_RATE_HZ; i++) {
    const timeSec = i / SAMPLE_RATE_HZ
    const signal = Math.sin(2 * Math.PI * settings.frequencyHz * timeSec)
    samples.push({
      timeSec,
      stressPa: stressPeakPa * signal,
      forceN: peakForceN * signal,
      chargeC: peakChargeC * signal,
      voltageV: peakVoltageV * signal,
    })
  }
  return {
    version: BSR3_VERSION,
    provenance: 'SIMULATED',
    scope: 'IDEAL_UNIAXIAL_MATERIAL_ELEMENT_NOT_HUMAN_TISSUE',
    settings,
    equations: {
      force: 'F(t) = sigma(t) * A',
      charge: 'Q(t) = d_eff * F(t)',
      capacitance: 'C = epsilon0 * epsilon_r * A / L',
      voltage: 'V_oc(t) = Q(t) / C',
    },
    geometry: { areaM2, lengthM: sizeM, capacitanceF },
    peaks: {
      stressPa: stressPeakPa,
      forceN: peakForceN,
      chargeC: peakChargeC,
      voltageV: peakVoltageV,
      chargeEquivalentElementaryUnits: peakChargeC / BSR3_ELEMENTARY_CHARGE,
    },
    sampleRateHz: SAMPLE_RATE_HZ,
    durationSec: DURATION_SEC,
    samples,
  }
}
export function compareBSR3(options = {}) {
  const candidate = simulateBSR3(options)
  const nullCoefficient = simulateBSR3({...candidate.settings, effectiveDPcPerN: 0})
  const nullStress = simulateBSR3({...candidate.settings, stressPa: 0})
  const reference = simulateBSR3({...candidate.settings, effectiveDPcPerN: 1})
  return { candidate, nullCoefficient, nullStress, reference }
}
export function buildBSR3Receipt({candidate, nullCoefficient, nullStress, reference}) {
  return {
    protocol: BSR3_VERSION,
    provenance: 'SIMULATED',
    origin: 'ORIGINAL_SOFTWARE_ILLUSTRATION',
    evidenceStatus: 'CONSTITUTIVE_LAW_TOY_NOT_BIOLOGICAL_EVIDENCE',
    hypothesis: 'An assumed nonzero effective piezoelectric coefficient and applied stress produce an ideal open-circuit electrical response.',
    inputs: candidate.settings,
    equations: candidate.equations,
    units: {stress:'Pa', force:'N', charge:'C', capacitance:'F', voltage:'V'},
    geometry: candidate.geometry,
    peaks: candidate.peaks,
    controls: {
      zeroCouplingPeakVoltageV: nullCoefficient.peaks.voltageV,
      zeroStressPeakVoltageV: nullStress.peaks.voltageV,
      assumedReferenceCoefficientPcPerN: reference.settings.effectiveDPcPerN,
      referencePeakVoltageV: reference.peaks.voltageV,
    },
    sampleRateHz: candidate.sampleRateHz,
    durationSec: candidate.durationSec,
    rawSamplesIncluded: false,
    exclusions: [
      'No measured calcite coefficient or actual pineal crystal electromechanical response',
      'No measured pineal stress, tissue transmission or cerebrospinal-fluid coupling',
      'No neuron, EEG, melatonin, consciousness, therapeutic or light-production inference',
      'No noise floor, instrumentation sensitivity, electrolyte screening, leakage or loss model',
      'This continuous charge model can yield a value below one elementary charge; it is not a discrete charge transport prediction',
      'Optical second-harmonic generation is not pressure-induced light emission',
    ],
    references: [
      'https://doi.org/10.1002/bem.10053',
      'https://doi.org/10.1109/TDEI.2004.1285888',
      'https://doi.org/10.1109/TDEI.2017.007045',
    ],
  }
}
