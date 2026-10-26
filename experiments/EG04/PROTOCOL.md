# EG-04 · Li–Torr / Kowitt permeability-inference audit (E0)

**Provenance:** SIMULATED. **Authority:** NONE. **Scientific state:** source-audited partial-text comparative methods + independent conventional London math. **No reported gravity anomaly is confirmed or generated.**

## Where this study sits

- **EG-01:** A single observed force trace may conceal distinct causal mechanisms.
- **EG-02:** In a synthetic apparatus, independent mass and magnetic-gradient variation improves identifiability.
- **EG-03:** Conventional Maxwell–London equations reproduce the static planar Meissner-state screening profile through independently implemented exact and finite-difference mathematics.
- **EG-04:** Audit a disputed **inference step**: whether a *macroscopic, geometry-dependent shielding ratio* may legitimately be substituted for the **microscopic material permeability** in a conductivity/gravitomagnetism model.

## Primary-source chain and the access ledger

| Source | Primary evidence checked | Scope/access | Claim boundary |
|---|---|---|---|
| Li & Torr, *Effects of a gravitomagnetic field on pure superconductors*, Phys. Rev. D **43**, 457 (1991), DOI [10.1103/PhysRevD.43.457](https://doi.org/10.1103/PhysRevD.43.457) | Publisher abstract discusses magnetic and gravitomagnetic fields and the screened field combination. | Publisher abstract; full derivation NOT reviewed here. | Published theoretical proposal, **not** a demonstrated gravity effect. |
| Li & Torr, *Gravitational effects on the magnetic attenuation of superconductors*, Phys. Rev. B **46**, 5489–5495 (1992), DOI [10.1103/PhysRevB.46.5489](https://doi.org/10.1103/PhysRevB.46.5489) | Full scanned article [mirror](https://unpublished.ca/sites/default/files/letter/263060/Ning%20Li%20Paper1.pdf), especially page 5490 Eqs. 7–20 and page 5493 **Eq. 48** (approximate conductivity proportional to \`1/μr²\` with additional factors); page 5494 Eqs. 54–55. | Scanned paper and publisher abstract. Page-level inspection supports the equation's **formal variable dependence**, not the full derivation's correctness. | A theoretical expression exists; values for \`μr\` and its proper physical meaning are contested. |
| Kowitt, *Gravitomagnetism and magnetic permeability in superconductors*, Phys. Rev. B **49**, 704–708 (1994), DOI [10.1103/PhysRevB.49.704](https://doi.org/10.1103/PhysRevB.49.704) | Publisher abstract directly states that Li–Torr (1992) grossly overestimated effects by misinterpreting macroscopic Meissner-state magnetic permeability and criticizes microscopic models. | APS publisher abstract; full text requires independent lawful access/verification. | Direct scholarly theoretical critique, **not** a blanket proof that gravitational couplings never exist. |
| Eskridge, [HAL5 2018 historical presentation](https://www.hal5.org/PDF/HAL5-Dec2018-Talk-AntiGravity.pdf) | Historical orientation for candidate nonstandard propulsion/gravity work. | Secondary historical survey. | Presentation is **not** a replication or independent confirmation of Li–Torr. |

**DO NOT** describe this E0 as a line-by-line reproduction of Li–Torr (1991/1992) or Kowitt (1994). It specifically tests variable identity and scaling, using an ordinary EG-03 London slab. Full primary derivation and independent expert review are gated E1 work.

## Established conventional problem: magnetic screening of a parallel-field slab

An ideal static Meissner slab, thickness \`d\`, London penetration depth \`λ\`, and equal tangential fields \`B_s\` on its two large faces, obeys

\`B(x) = B_s cosh(x/λ)/cosh(d/(2λ))\`.

EG-03 solves this profile by exact analytic expression and an independent tridiagonal numerical solver. The slab's **dimensionless macroscopic screening ratio** is

\`R = <B>/B_s = [2λ/d] tanh[d/(2λ)]\`.

Here \`R\` summarizes an *average interior field*, under this special geometry and specified boundary field. It is **not a freely transferable microscopic constitutive permeability μr**; sample thickness changes R without changing the material's intrinsic London parameters. The companion susceptibility *proxy* \`R−1\` is likewise not a universal thermodynamic susceptibility.

One may use this ratio to illustrate macroscopic field exclusion, **not** substitute it into a theory without showing that it is exactly the same physical quantity, under the same geometry and constitutive assumptions.

## Deliberately invalid substitution: a diagnostic, not a model of gravitation

Li–Torr's 1992 Eq. 48 contains an approximate \`1/μr²\` dependence within a longer conductivity expression under additional assumptions.

EG-04 intentionally makes the **illegitimate** replacement \`μr := R\` and plots the dimensionless number

\`P_invalid = 1/R²\`.

As \`d/λ\` gets large, \`R∼2λ/d\`, so \`P_invalid∼(d/(2λ))²\`. This constructed quantity becomes enormous just by thickening a conventional slab with unchanged microscopic material parameters. That shows why **confusing a geometry-dependent screening proxy with a material parameter can create arbitrary-looking amplification**.

**Critical limitation:** The diagnostic is **not** Li–Torr's full Eq. 48, a conductivity, a gravitomagnetic result, a computed force, an observed effect, or a mathematical proof that the source derivation fails. EG-04 uses the inverse-square *shape* as a sensitivity illustration; Kowitt's actual argument and all Li–Torr constitutive steps require a separate full text audit.

For additional physical sanity we calculate the ordinary magnetic **field energy per area** \`∫ B²/(2μ0) dx\` (J/m²) and compare it with the unscreened constant-field reference; the energy remains finite and positive at finite slab thickness. This is only stored *field* energy, not the full superconducting free energy or gravitational stress-energy.

The slab has equal and opposite integrated screening currents, so the **net signed current vanishes** while local currents and screening remain nonzero. This is compatible with NBG's *coarse observable versus retained structure* framing, without importing NBG abstract mathematics into Maxwell's equations as a new physical law.

## Reproducibility

- Pure module: \`src/eg04Model.js\` imports \`solveLondonSlab\` from EG-03.
- React lab: \`src/EG04Lab.jsx\` + scoped \`src/eg04Lab.css\`.
- Atlas registry row: \`EG-04\`, category *Field & Gravity*, status **SIMULATED**.
- Deterministic controls: screened-field curve, center and average, field energy per area, current-cancellation check, explicit invalid proxy, normalized thickness sweep, zero-field null, source ledger.
- Tests: \`npm run test:eg04\`, \`npm run test:research-atlas\`, \`npm run build\`.
- Local, voluntary JSON export must say **SIMULATED / authority NONE** and include original source links, the invalid-substitution warning and input parameters.

## Pending EG-04 E1 derivation-readiness gate

1. Obtain lawful full copies of **all three** primary papers and preserve per-equation source locations, conventions and symbols.
2. Independently reproduce the 1992 assumptions leading to Eq. 48 and Kowitt's actual alternative interpretation; document the precise points of divergence.
3. Audit SI dimensions and gauge conventions for \`B_g\`, \`μ_g\`, \`μ_r\`, \`M\`, \`χ\`, \`σ\`, \`λ\`.
4. Stress-test limiting cases and the role of finite dimensions, boundary fields and currents.
5. Seek independent domain-expert signoff before publishing any conclusion stronger than this E0's narrow inferential warning.

**Ledger above ego.**
