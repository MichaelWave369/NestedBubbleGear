# Optical Keyhole O2 | Coherent-reference phase observability

**Status:** exact, classical simulated optics identities. **Origin:** `SIMULATED`. **Authority:** `NONE`.

## Purpose

[Optical O1](OPTICAL_KEYHOLES_O1.md) showed that intensity-only and polarization-only observations cannot distinguish all complex states. O2 asks what changes if the observer acquires **a separate coherent reference field**.

**Critical distinction:** a common/global optical phase applied to signal *and* reference is not observable; the *relative phase* between a signal and a reference can be observed through interference. This does not establish measurement of an isolated field's absolute phase, and it does not prove NBG physics.

## Exact ideal two-port interferometer

Let the signal be `s = exp(i phi)` and the matched, mutually coherent reference be `r = exp(i eta)`. With ideal 50/50 recombination and normalized input field amplitudes, the two output intensities are

```text
I_plus  = |(s+r)/2|² = (1 + cos(phi-eta))/2
I_minus = |(s-r)/2|² = (1 - cos(phi-eta))/2
I_plus + I_minus = 1
```

The input/output normalization is a dimensionless, lossless *toy model*, not a measurement of physical power or thermodynamic savings. Multiplying both fields by `exp(i psi)` does not change any output intensity.

When no coherent reference is available, a lone unit-amplitude signal has `|s|²=1` regardless of phase; this comparison is about the information available to the observer, not about changing the signal's internal state.

### Matched polarization versus orthogonal polarization

For Jones vectors `s_vec` and `r_vec`, port intensities are `||(s_vec ± r_vec)/2||²`. Co-polarized components interfere. Strictly orthogonal Jones vectors have zero cross term and yield half the normalized output intensity at **each** port regardless of the relative phase.

A reference with unknown, uniformly distributed relative phase also washes out interference *in ensemble average*. This is a deliberate loss-of-coherence control, not a claim that all fluctuating optical fields must always average to exactly half in every measurement.

### Observer insufficiency and quadrature readouts

One reference phase (eta = 0) gives `I_plus(0) = (1 + cos phi)/2`; it cannot distinguish `phi` from `-phi`.

A second ideal 90°-shifted reference yields `I_plus(pi/2) = (1 + sin phi)/2`. With both readouts, reconstruct the relative phase modulo `2pi`:

```text
cos(phi) = 2 I_plus(0) - 1
sin(phi) = 2 I_plus(pi/2) - 1
phi_mod_2pi = atan2(sin(phi), cos(phi))
```

These measurements represent alternative reference settings or independently prepared trials; they are not a claim that two physically incompatible settings can be applied to one photon without measurement constraints.

## Experiment

Run the independent Node.js checks:

```sh
npm run test:phmp-optical-o2
node scripts/test_phmp_optical_o2.mjs --out optical-o2-local-receipt.json
```

The `--out` form exclusively creates a *new* receipt file and refuses overwrite. The normal `npm test` does not create files or run any PHMP-3 reserved evaluation.

The test uses 128 relative-phase points, five fixed reference phases, four common phase shifts, both ideal outputs, co- and cross-polarized Jones fields, inverse-port controls, phase-averaged ensembles with 32 reference phases, and quadrature reconstruction.

**Independent local Node v22 verification:** `23702/23702` assertions passed. Script blob SHA-1 `a4b8d3b5384f30f22dc6e304bedad85c07273076`; canonical receipt SHA-256 `63b7745ac18779462967b9bfa46a6abebf6d947f3fe68b7e78a4b03854a084a4`. These hashes identify this specific *simulated test*, not a physical optical experiment. GitHub CI must be separately verified.

## What is and isn't supported

**Established conventional optics:** relative phase and polarization overlap determine interferometric visibility; fixed-phase single-output cosine measurements may be ambiguous; two coherent quadratures can recover relative phase. Both outputs preserve normalized intensity in the ideal model.

**Not established:** novel NBG holonomy, hidden energy recovery, proof of quantum-memory function, actual hardware performance, new photonic information theory, general relativity, or any NBG-specific predictive advantage.

Do not integrate O2 data into the source-pinned **PHMP-3 E2 reserved memory evaluation**. That comparison is a different task and must be run only through its explicit gate. The optics tests are independent.

**Ledger Above Ego.**
