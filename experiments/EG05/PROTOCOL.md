# EG-05 | Equation Custody, SI Dimensions & Limiting Cases (E0)

**Status:** SIMULATED / SOURCE-AUDITED PARTIAL TEXT. **Epistemic origin:** SIMULATED for all computations; VERIFIED for *bibliographic/source-page inspection only*. **Authority:** NONE for claimed gravity effects. No physical measurements or claimed new physics.

## New primary-source findings

The original **Li & Torr (1992)** scanned Physical Review B paper was inspected visually, not only through noisy PDF text extraction. The scanned copy is [here](https://unpublished.ca/sites/default/files/letter/263060/Ning%20Li%20Paper1.pdf), with publisher DOI [10.1103/PhysRevB.46.5489](https://doi.org/10.1103/PhysRevB.46.5489). Its printed page **5493** is *PDF page 5* (zero-based index 4) and printed page **5494** is *PDF page 6* (zero-based index 5).

The original *displayed equation forms* and surrounding context matter:

| ID | Printed page | Source equation | Source-reading status | Independent calculation in EG-05 |
|---|---|---|---|---|
| L92-46 | 5493 | \`σ₀ = nˢ q² τ₀ / m\` | Formula transcribed from image | SI dimension and source-form scaling checked |
| L92-47 | 5493 | \`τ₀ = ℏ/(2π k_B T λ*)\` | Formula transcribed from image | SI time dimensions; assumes λ* dimensionless |
| L92-48 | 5493 | Additional prefactors including \`1/μᵣ²\` | **Dependence only**; not independently rederived | No false numerical reproduction |
| L92-49 | 5493 | Approximate scaling \`σ ~ 10⁻²⁹/μᵣ²\` in the paper's conductivity context | Approximation, not an observation | Sensitivity-only conditional log sweep |
| L92-50 | 5493 | Similar \`1/μᵣ²\` dependence for \`τ\` | Dependence only | Not independently rederived |
| L92-54 | 5494 | A later and **different** σ–μ model with extra terms and parameter combinations | Visible equation, not fully transcribed | **Not implemented** |
| L1991 | 1991 | Gravitomagnetic-field theory, DOI [10.1103/PhysRevD.43.457](https://doi.org/10.1103/PhysRevD.43.457) | Publisher abstract only | **Not reproduced** |
| K1994 | 1994 | Kowitt, DOI [10.1103/PhysRevB.49.704](https://doi.org/10.1103/PhysRevB.49.704) | Publisher abstract only | **Not reproduced** |

Kowitt's *published abstract* explicitly objects to treating macroscopic Meissner-state bulk magnetic permeability as if it were the microscopic constituent quantity used in Li–Torr. It also challenges their microscopic model. This record preserves the objection but **does not purport to know Kowitt's full alternative equations**; no copy of his full paper was successfully opened.

The word **verified** is limited strictly to seeing the source text at the specified page or publisher abstract. **Equation visibility is not validation of a physical derivation.** External PDF OCR can scramble Greek symbols, exponents and equations; page-image inspection, full copy access and independent review must precede any exact theoretical reproduction.

## SI dimensional audit: what can actually be computed

### Equation (46): ordinary finite-relaxation-time conductivity reference

\`σ₀=nˢ q² τ₀/m\`, where \`nˢ\` is a number density (m⁻³), \`q\` in coulombs, \`τ₀\` in seconds and \`m\` in kilograms.

\`[nˢ q² τ₀/m] = [kg⁻¹ m⁻³ s³ A²] = [S/m]\`.

The evaluator carries five SI dimension exponents (kg, m, s, A, K). It intentionally does not attempt a measured superconducting conductivity. In a superconductor, frequency response and the zero-frequency limit require a proper microscopic treatment; the finite-\`τ\` expression is a conventional **source-form baseline**, not evidence of exact real-world DC behavior.

### Equation (47): the time scale

\`τ₀ = ℏ/(2π k_B T λ*)\`; when \`λ*\` is **assumed dimensionless**, \`[τ₀]=s\`. The browser lets the reader vary \`T\`, \`nˢ\` and a nominal coupling \`λ*\`; it deliberately does not assign experimentally calibrated parameters to a particular real material.

### Equation (49): conditional source shape only

EG-05 implements the logarithmic relation **exactly as a sensitivity example**:

\`log₁₀(σ/[S/m]) = -29 - 2 log₁₀(μᵣ)\`,

**conditional on** the disputed upstream Li–Torr estimates leading to the printed order-of-magnitude Eq. (49). The displayed \`μᵣ\` is a user-controlled **assumed relative permeability**, not a measured parameter or a material identification. The 10⁻²⁹ coefficient is a *source estimate*, not an independent calibration, and is not used to simulate gravitational forces.

Changing \`μᵣ\` by one power of ten makes this formal \`σ\` change by 100×. It does **not** mean that a real superconductor reaches that conductivity by altering its shielding.

### The key NBG Keyhole distinction

The EG-03/04 ideal infinite parallel-field London slab has geometric mean-field screening ratio

\`R=<B>/B_s=(2λ/d) tanh[d/(2λ)]\`.

This *bulk screening ratio* changes with sample thickness even when λ is unchanged. **There is no authenticated bridge** equating \`R\` and the microscopic/material \`μᵣ\` appearing in the disputed constitutive argument. EG-05 therefore explicitly **refuses** this substitution. EG-04 explored what would happen if one did it incorrectly; EG-05 adds a machine-enforced custody distinction.

EG-05 further refuses to claim a full SI audit of Eq. (48), because consistent units for gravitomagnetic permeability \`μ_g\`, its convention, and the complete prefactor/constitutive context have *not* been independently reconstructed. A dimensionless inverse-square factor alone cannot establish that the whole equation has correct SI dimensions.

## Controls and deliverables

- Pure deterministic model: \`src/eg05Model.js\`.
- Source locations and access states: machine-readable \`EG05_CUSTODY\`, eight entries including 1991, 1992 and 1994 sources.
- Full independent SI exponents for (46), (47), explicit **UNRESOLVED** for contested (48)/(54).
- Parameter sensitivity sweep (49), conventional slab counterexample imported from EG-04.
- React site workbench \`src/EG05Lab.jsx\`, scoped \`src/eg05Lab.css\`, linkable \`#eg05\`.
- \`scripts/test_eg05.mjs\` verifies dimensions, source custody, rank of evidence/access, conditional scaling, null provenance, rejection of parameter substitution, replay.
- Exports are explicit operator-triggered \`SIMULATED / authority NONE\` JSON local receipts.

## Promotion gates for EG-05 E1

1. Lawfully obtain and inspect full Kowitt 1994 and Li–Torr 1991 articles and record exact equation/page locations.
2. Independently derive all steps between 1992 Eq. (45), (48), (49), (53), (54), (55), explicitly defining all symbols and units.
3. Identify at what derivational step macroscopic shielding gets interpreted as microscopic permeability, using Kowitt's actual text, **not** secondhand speculation.
4. Reproduce known Maxwell–London and weak-field-GR limits with separate conventional baselines and qualified reviewer signoff.
5. Only then implement physical prediction comparisons. Do not promote extraordinary effect claims without independently validated physical measurements and null controls.

**Ledger above ego.** Passed tests mean the *source custody and limited mathematical calculations* are consistent, not that Li–Torr has been vindicated or conclusively refuted.
