# EG-01 | Coupled Field Observability: synthetic E0

**Status:** SIMULATED · **Epistemic origin:** SIMULATED · **Authority:** NONE.
**Research scope:** A deterministic, browser-executable toy model for testing whether a coarse force measurement can distinguish ordinary electromagnetic/mechanical effects from a *hypothetical* additive response. No superconducting apparatus, sensor, real gravity measurement, Li–Torr numerical reproduction, or physical coupling estimate is included.

## Motivation and source custody

Amy Eskridge's **December 6, 2018** HAL5 talk, *A Historical Perspective on Anti-Gravity Technology*, surveyed historical propulsion/gravity-modification claims and called for testable hypotheses. It is **not an experimental data set or proof of a device**:

- Primary presentation: https://www.hal5.org/PDF/HAL5-Dec2018-Talk-AntiGravity.pdf
- Official HAL5 meeting notice: https://www.hal5.org/program-2018-12.shtml
- Li & Torr (1991), *Effects of a gravitomagnetic field on pure superconductors*: https://doi.org/10.1103/PhysRevD.43.457
- Li & Torr (1992), *Gravitational effects on the magnetic attenuation of superconductors*: https://doi.org/10.1103/PhysRevB.46.5489
- Kowitt (1994), *Gravitomagnetism and magnetic permeability in superconductors*: https://doi.org/10.1103/PhysRevB.49.704 . Critiques Li–Torr's permeability interpretation and predicted effect magnitude.
- Hathaway, Cleveland & Bao (2003), *Gravity modification experiment using a rotating superconducting disk and radio frequency fields*: https://doi.org/10.1016/S0921-4534(02)02284-0 . Reported no gravity-like force within apparatus sensitivity.

This module attributes intellectual context to Eskridge without attributing unverified breakthroughs or identifying a cause of her death. Her death is not experimental evidence. Literature claims must be weighed against failed replications and conventional explanations.

## Causal graph and declared mechanism

Controlled input **I(t)** (dimensionless normalized drive; not amperes) produces:
- Magnetic fixture pickup **F_B = β · o · I²**, where **o ∈ {+1,−1}** is a *toy sign-changing pickup geometry*, not a physical inversion of gravity.
- Thermal lag **T(t) = 0.82 T(t−1) + 0.18 I(t)²** and drift **F_T = θ T(t)**.
- Mechanical transient **F_V = ν (I(t)−I(t−1))**.
- Extra hypothetical response **F_X = α I(t)²**, chosen invariant to this *particular* fixture reversal by assumption, **not** derived from any gravitational theory.
- Deterministic synthetic perturbation **ε(t) = σ sin(17.1(t+1) + orientation phase)**.

The single measured force channel, in **illustrative micro-newton units**, is:

\`y(t,o) = β o I² + θ T + ν ΔI + α I² + ε\`.

Fixed test coefficients: β=0.36, θ=0.14, ν=0.095 µN per normalized feature. Default **α=0** (null), σ=0.003 µN. Sliders can inject synthetic nonzero α as a software positive control, **never as evidence of gravity**.

## NBG Keyhole / observability test

**Coarse Keyhole**: Only orientation o=+1 is acquired. Then \`β I² + α I² = (β + α) I²\`. Even noiseless data cannot uniquely determine β and α: two different internal coefficient states give the same force trace. Reporting a candidate gravity signal from one run is invalid.

**Expanded Keyhole**: Acquire matched drives at o=+1 and o=−1 while *assuming* all nuisance coefficients, temperature dynamics and extra term are invariant except the magnetic pickup sign. With independent reference proxies T and ΔI, fit four features \`[oI², T, ΔI, I²]\` by ordinary least squares. The paired design has a full-rank synthetic design matrix and resolves the injected α **within the model**. Failure of the invariance and calibration assumptions would invalidate such inference in a physical study.

The single-run and paired-run outputs, plus deterministic zero-/nonzero-candidate tests, demonstrate observability, **not** a new effect. Default browser demo does not download anything, contact an API, use sensors, modify prior AH/PHMP frozen protocols, or evaluate a reserved split.

## Energy scale sanity check

Using the pedagogical approximation \`u_B=B²/(2μ₀)\`, a uniform 10 T field over 1 m³ stores roughly 39.8 MJ; \`U/c²≈4.43×10⁻¹⁰ kg\`. A point-source mass-equivalent at distance 1 m gives \`g≈3×10⁻²⁰ m/s²\`. This is **only** an order-of-magnitude comparison for stored field energy, not a full stress-energy calculation or a prediction for a realistic magnet. Its numerical scale is completely separate from the synthetic µN coefficients.

## Reproducibility and controls

- Pure model: \`src/eg01Model.js\`; deterministic and no external dependencies.
- Atlas demo: \`src/EG01Lab.jsx\` and \`src/eg01Lab.css\`; local React calculation and optional explicit JSON export.
- Contract checks: \`npm run test:eg01\`, \`npm run test:research-atlas\`, \`npm run build\`.
- Null: α=0; positive control: α>0 *injected*; reversal: paired o=+1/−1; noise: deterministic; negative identifiability control: one orientation.
- Exported JSON is a locally generated synthetic receipt, not independent experimental validation.

## Promotion gates

1. Reproduce published Li–Torr and Kowitt derivations independently with units and explicit assumptions; do **not** confuse bibliographic review with E0's synthetic results.
2. Build null predictions for electrostatic/magnetic forces, vibration, thermal drift, airflow, electronics and data processing.
3. Pre-register calibration/controls, admissible test geometry, error budget, blinded analysis and instrument acceptance thresholds.
4. Only then consider safe physical measurements with appropriate high-voltage/cryogenic expertise. Independent replication is necessary before any anomalous gravity claim.
5. Keep UFP/DCF extensions separate and explicitly **PROPOSED** until equations and predictive comparisons exist.

**Claim firewall:** No antigravity result, new field interaction, superconductor property, or equivalence-principle violation is established by EG-01. Green CI means code contracts passed, not physics verified.
