# Quantum Boundary Q2 | Dephasing, hidden coherence, and observer sensitivity

**Status:** FINITE_SIMULATED_MATHEMATICAL_SANITY_CHECK. **Origin:** `SIMULATED`. **Authority:** `NONE`.
**No physical experiment. No NBG-specific quantum prediction. No PHMP-3 held-out evaluation.**

## Motivation

[Quantum Boundary Q1](QUANTUM_BOUNDARY_Q1.md) compared a pure Bell state with a separable mixture. Their computational-basis 00/11 measurements agreed, but their coherences and multi-setting correlations did not.

**Q2 asks:** as coherence is gradually attenuated, which observers remain unable to distinguish the quantum state from the classical mixture, and which observer settings can detect weaker remnants of coherence?

The conventional **two-qubit dephasing family** is:

```text
rho(gamma) =
  1/2 [ |00><00| + |11><11|
        + gamma |00><11| + gamma |11><00| ]
0 <= gamma <= 1
```

At `gamma=0`, this is the separable classical 00/11 mixture; at `gamma=1`, it is pure `|Phi+><Phi+|`. Intermediate states are valid mixed density matrices with eigenvalues `(1+gamma)/2`, `(1-gamma)/2`, `0`, `0`.

This is equivalently an ordinary phase-flip/dephasing channel applied to the Bell state. The 00/11 outcome probabilities remain **exactly 1/2 and 1/2 for all gamma**. Both reduced single-qubit states remain `I/2`. Neither local 0/1 measurements nor joint 0/1 correlations tell us how much coherence remains.

## Mathematical observables

For ideal local projective measurements with `M(theta)=cos(2theta)Z + sin(2theta)X`, the standard Born correlation is

```text
E_gamma(a,b) = cos(2a)cos(2b) + gamma sin(2a)sin(2b)
```

Thus `E_gamma(0,0)=1` for every gamma, while `E_gamma(pi/4,pi/4)=gamma`. Changing measurement settings reveals a distinction that the original 0/1 Keyhole cannot detect.

For the **fixed Q1 CHSH settings** `a=0`, `a'=pi/4`, `b=pi/8`, `b'=-pi/8`:

```text
S_fixed(gamma) = sqrt(2) [1+gamma]
S_fixed > 2 only if gamma > sqrt(2)-1 ≈ 0.41421356.
```

For the **optimal CHSH settings for this known family**, choose `a=0`, `a'=pi/4`, `b=atan(gamma)/2`, and `b'=-atan(gamma)/2`. Then

```text
S_opt(gamma) = 2 sqrt(1+gamma²)
```

This exceeds the local-hidden-variable CHSH threshold of 2 for **every mathematically nonzero gamma**. However, at small gamma the violation is tiny and a finite-shot physical experiment would require appropriate sample-size, statistical, calibration, and loophole analyses. **Our code does not perform a Bell experiment, establish quantum hardware, or predict a statistically detectable result for any finite shot count.**

The partial transpose of `rho(gamma)` has eigenvalues `{1/2,1/2,gamma/2,-gamma/2}`. By the established positive-partial-transpose criterion for two qubits, this family is separable at gamma=0 and entangled at every gamma>0. This result is independently known quantum mathematics, not an NBG insight.

## Deterministic test

```sh
npm run test:phmp-quantum-q2
node scripts/test_phmp_quantum_q2.mjs --out quantum-q2-local-receipt.json
```

The `--out` option is optional; it exclusively creates a **new** JSON receipt path without overwrite. The normal `npm test` produces no receipts and never invokes reserved PHMP-3 E2 scoring.

The finite test sweeps **21 gamma values** (0, 0.05, ... 1) and **17×17 pairs of measurement settings per gamma**, checking normalization, nonnegative Born probabilities, correlations, marginal blindness, phase-flip channel agreement, fixed-vs-optimized CHSH identities, and boundary controls, including an explicitly computed partial-transpose eigenvector (rather than a tautological comparison).

Independent local Node.js verification of the source's equations passed **30,710/30,710 checks**. GitHub CI must separately confirm the committed source.

### Exact illustrative results

| gamma | Same 00/11 outcomes? | X/X correlation | Fixed CHSH | Optimized CHSH |
|---:|---|---:|---:|---:|
| 0 | Yes | 0 | 1.414214 | 2.000000 |
| 0.25 | Yes | 0.25 | 1.767767 | 2.061553 |
| 0.50 | Yes | 0.50 | 2.121320 | 2.236068 |
| 0.75 | Yes | 0.75 | 2.474874 | 2.500000 |
| 1 | Yes | 1 | 2.828427 | 2.828427 |

The **fixed observer** can miss a Bell-inequality violation even when the optimally adapted observer can reveal one. That is an observer/measurement-setting distinction, **not** permission to claim information is created by observation.

## Relation to NBG Keyholes and prohibitions

NBG-inspired language may describe the original 0/1 observer as a coarse Keyhole and the X/X or optimized CHSH settings as a refined Keyhole, but these predictions are **fully explained by textbook two-qubit density matrices, dephasing, and Born's rule**.

**What is NOT shown:** a novel Gear/Conveyor operation, native AH holonomy, physical NBG substrate, Dirac-spinor mechanism, a phase-memory efficiency benefit, or a new physical law. This is a standard **quantum-versus-classical observation baseline**, not a positive NBG-specific prediction.

No frozen AH, PHMP-1, PHMP-2, optical O1/O2, Q1 or PHMP-3 sources/results are changed. The separate PHMP-3 E2 reserved cohort remains **UNSCORED**.

**Ledger Above Ego.**
