# EG-06 | Constitutive-Model Competition & Causal-Collision Controls (E0)

**Status:** SIMULATED, **provenance:** SIMULATED, **authority:** NONE. **No experimental gravity effect, Li–Torr force prediction, or full Kowitt rebuttal is computed.**

## Problem and source boundary

EG-01 through EG-05 documented model ambiguity, differential-force controls, London electrodynamics, invalid permeability substitution and source/page/equation custody. EG-06 adds a **falsifiable synthetic comparison** with predeclared drive sequences, counterfactual confounders and a time-held-out score.

The historical publication trail remains **separate** from this new phenomenological model:

- [Li & Torr, *Effects of a gravitomagnetic field on pure superconductors*, Phys. Rev. D **43**, 457 (1991)](https://doi.org/10.1103/PhysRevD.43.457): published theory, not reconstructed in EG-06.
- [Li & Torr, *Gravitational effects on the magnetic attenuation of superconductors*, Phys. Rev. B **46**, 5489 (1992)](https://doi.org/10.1103/PhysRevB.46.5489): disputed conductivity/permeability model. EG-05 has partial source-page custody, not a validated force law.
- [Kowitt, *Gravitomagnetism and magnetic permeability in superconductors*, Phys. Rev. B **49**, 704 (1994)](https://doi.org/10.1103/PhysRevB.49.704): publisher abstract criticizes conflating bulk Meissner shielding with material/microscopic magnetic permeability. Its full mathematical critique remains unreviewed.
- [EG-05 source ledger](../EG05/PROTOCOL.md) contains the outstanding equation/units gates.

**IMPORTANT:** \`X1\` below is a *generic invented comparison term*, not a direct mathematical representation of Li–Torr or a claim that any hypothetical interaction has been observed. Software model rankings are not scientific verification.

## Registered synthetic fixture (SI units)

For mass \`M\` (kg), standard acceleration \`g=9.80665 m/s²\`, signed vertical field gradient \`G\` (T/m), normalized drive \`I\` (dimensionless), thermal proxy \`T\` (dimensionless) and drive transient \`ΔI\`, a force-shift readout \`y\` (newtons) follows:

\`C0: y = b + m_z G I² + p I² + θ T + ν ΔI + ε\`

where \`m_z\` has units A·m², \`b\`, \`p\`, \`θ\`, and \`ν\` are newton-valued coefficients, and \`ε\` is a deterministic noise function. The term \`m_z G\` is an idealized fixed-magnetic-dipole approximation; it does **not** describe an actual superconducting experiment. \`T_t=0.72T_(t−1)+0.28I_t²\` is a hand-selected nuisance lag, not a measured thermal law.

A nested alternative adds one *mass-like* column:

\`X1: y = C0 + f M g I²\`, where \`f\` is dimensionless.

The standard **software ground truth** is \`f=0\`; nonzero f is strictly an artificial injection. We use a preregistered twelve-step drive sequence, two masses \`M,2M\`, two magnetic-gradient signs \`−G,+G\`, and independent deterministic sine perturbations per fixture configuration. The first **nine** time steps per configuration are training and the last **three** are held-out validation. This split is a development *toy holdout*, not an independent experimental study or hidden evaluation reserve.

## Why the two experimental contrasts matter

The baseline model needs both gradient signs to separate a signed magnetic pickup \`G I²\` from a current-even fixture pickup \`I²\`. The extended model additionally needs at least two masses to separate \`f M g I²\` from \`p I²\`, *assuming* pickup coefficients and thermal terms stay constant across configurations. A modified Gram–Schmidt solver refuses a rank-deficient fixture rather than inventing a fitted coefficient. Sample mass and gradient are exact software inputs here, not unmeasured real-world calibration.

With full contrast, least-squares fits for \`C0\` and \`X1\` yield training RMSE, held-out RMSE, and descriptive Bayesian Information Criterion \`BIC = n ln(RSS/n) + k ln(n)\`. \`ΔBIC=BIC(C0)−BIC(X1)\` compares formal fit quality with a parameter penalty; **positive ΔBIC alone does not identify the mechanism or validate modified gravity**. Values exceeding ±6 are shown as a simple descriptive threshold and have no prespecified physical false-discovery rate.

## Critical negative control: exact causal collision survives full-rank fits

EG-06 separately injects a second ordinary-but-unmodeled **mass-correlated fixture artifact**:

\`F_artifact = c M g I²\`.

Although f and c represent *different hidden causes*, they multiply the **same observed column** on *every* measurement:

\`(f+c) M g I²\`.

Therefore the dataset generated from \`f=0.015, c=0\` is exactly the same as \`f=0, c=0.015\`, with an identical deterministic perturbation. Even if the nominal six-column design has **full mathematical rank**, the underlying causal origin is **structurally non-identifiable**. No force-only experiment of this kind can label the residual as gravity rather than a co-varying conventional pickup. EG-06 treats the X1 fit as conditional modeling only, never as a physics result.

This is the core NBG **Keyhole lesson**: observing and fitting a distinguishable *signature* is not equivalent to identifying the *cause*. New independent perturbations, sensors or shielding/interventions must break the collision.

## Source custody, provenance and promotion

- Pure model: \`src/eg06Model.js\` implements generated fixtures, modified Gram–Schmidt regression, rank rejection, BIC and holdout errors.
- Atlas React lab: \`src/EG06Lab.jsx\`, \`src/eg06Lab.css\` provides toggles and a force-curve comparison.
- Tests: \`scripts/test_eg06.mjs\`, included in \`npm test\`; existing AH/PHMP/EG01–05 frozen work is untouched.
- JSON export is local, user-initiated, marked \`SIMULATED / authority NONE\` and includes hidden ground-truth information for reproducibility, never classified as an independent lab record.
- Source provenance stays at **historical publication** level. No full derivation claim is promoted from an abstract.
- Advancement EG-07: choose an **independent witness channel** or intervention to distinguish f from the mass-correlated artifact, and preregister its costs/assumptions. With insufficient witness quality, refuse a physical attribution rather than forcing a winner.

**Ledger above ego.** Green CI means these constructed mathematical and software controls passed, not that gravity has been modified.
