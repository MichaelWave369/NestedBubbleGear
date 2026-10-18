# Optical Keyholes | Research inspiration, not a PHMP-3 protocol change

**Status:** IDEA / PROPOSED, **not** an independently run NBG experiment. **Date:** 2026-10-18. **Authority:** NONE.

## Why classical optics is a valuable comparison

A shared educational infographic on five light equations motivated reviewing two conventional optical mechanisms as analogues for PHMP's coarse observers:

- **Young interference** (constructive fringe condition for coherent two-slit paths): `d sin(theta) = m lambda`. Phase differences between coherent wave paths change measurable intensity after recombination.
- **Malus's law**, `I_out = I_in cos²(theta)`, for ideal linear polarization incident on an ideal linear polarizer. The analyzer direction determines the power readout.
- **Maxwell:** `c = 1/sqrt(mu0 epsilon0)` in vacuum, describes EM wave propagation, not a proof of an AI causal-network equation.
- **Planck:** `E=hf` specifies photon energy, not the cost of a software phase operation. Planck's 1900 radiation quantization preceded Einstein's explicit light-quantum interpretation in 1905.
- **Compton:** `Delta lambda = h(1-cos theta)/(m_e c)` describes photon-electron scattering, not generic reversible computation or an intrinsic NBG memory operator.

The particular combination of **phase-sensitive interference and polarization projection** is directly useful because both are well-established in *classical* wave optics and Jones calculus. It therefore provides a demanding conventional baseline rather than evidence of new physics.

## Explicit Jones-calculus sanity witness

Using Jones vectors for an idealized monochromatic field,

```text
X  = (1,1) / sqrt(2)   [45-degree linear polarization]
X' = (1,i) / sqrt(2)   [one circular-polarization handedness]
P(z) = (|z[0]|^2, |z[1]|^2)
P(X) = P(X') = (1/2,1/2)
u = (1,1) / sqrt(2)    [ideal 45-degree analyzer]
M_u(z) = |u† z|^2
M_u(X) = 1
M_u(X') = 1/2
```

The component-intensity Keyhole loses relative-phase information. The analyzer changes the accessible intensity without adding information to the state: it reveals a distinction already present in the Jones vector.

This is **ordinary classical optics**, fully explained by the projection rule, and equivalent algebraically to the PHMP-1 H/S sanity witness. It does not establish novel NBG holonomy, physical memory devices, or spontaneous energy recycling.

## Proposed separate PHMP optical-observer baseline (not executed)

1. Preregister a family of Jones vectors with matched component intensities, relative phases, and analyzer-angle queries.
2. Compare intensity-only, phase-sensitive, and complete Stokes-parameter observers using identical information budgets.
3. Distinguish global phase (not observable in a single direct-polarization-intensity measurement) from relative phase (detectable with suitable analyzers).
4. Test how observer choice and noise alter distinguishability. Preserve standard Jones/Stokes predictions as the *primary baseline*.
5. Add a conventional optical interferometer with explicit reference phase only in a later, independently gated study.
6. **No novel NBG predictive claim** unless it discriminates from established Jones, Mueller, and statistical-estimation models.

## Provenance boundary

This note is intentionally **not** part of PHMP-3 E0/E1/E2 task definitions, source checksums, candidate memories, held-out evaluation, or scoring. It is exploratory inspiration only. A later optics experiment needs its own independent frozen hypothesis, controls and receipt. Do not retrospectively use it to re-tune PHMP-3 after observing the reserved result.

**Ledger Above Ego.**
