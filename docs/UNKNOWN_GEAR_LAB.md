# NBG Unknown Gear Laboratory · open-world consistency checks

This extension to the Adaptive Phase Keyhole demo asks a precise falsification question:
Can a model declare its finite hypothesis catalog inadequate instead of forcing a winner?

## Mathematical model

The *true* eccentricity is selected by the operator as a synthetic oracle and may be
inside or outside the catalog [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.55].
At a chosen input angle the ideal driven phase is calculated by
the existing analytical elliptical gear relation. It is then perturbed by bounded
seeded pseudonoise and rounded to the selected phase-resolution grid.

    measurement = quantize(phase(true_e, angle) + injected_jitter, resolution)
    |injected_jitter| <= injectedNoiseDegrees

The experiment declares a potentially different **assumed maximum noise bound**.
A candidate remains consistent with a measurement only if:

    |phase(candidate_e, angle) - measurement| <=
        declaredNoiseBoundDegrees + resolutionDegrees/2 + 1e-8

This is a conservative, bounded-error acceptance set. The small epsilon is only
a floating-point guard. There is **no** claim of stochastic Gaussian noise,
Bayesian confidence, statistical type-I/II error control, or hardware calibration.

## Query policy and verification

While multiple candidates remain, each next unused phase angle is selected via the
existing PR #101 one-step greedy minimax catalog partition, using the selected
quantization resolution. When that cannot split the set, and when a single
candidate remains, probes are instead chosen for sensitivity to nearby off-grid
profiles. The oracle measurement is revealed **only after** the angle is selected.

An initial singleton is **PROVISIONAL_SINGLETON** until it withstands at least
the requested number of fresh verification angles. Even then, the status is
**CONSISTENT_WITH_CATALOG_PROFILE**, NOT "true identity verified."

If no profile survives, the state is
**NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS**, which is logically conditional on the
declared bound being valid. If the simulation's injected maximum noise exceeds
the declared model bound, the experiment overrides any result with
**MODEL_ASSUMPTIONS_VIOLATED** using privileged simulation settings. Real
hardware cannot ordinarily know this fact directly; the UI must not imply it can.

For a closely neighboring off-grid profile, the experiment may remain
UNRESOLVED or even CONSISTENT with a catalog member. This is a genuine
identifiability limitation, not something to conceal.

## Controls and provenance

- Known catalog profiles under noise correctly bounded by the declared maximum
  must never be eliminated (enforced across many seeds, profiles, and resolutions).
- Far unknown .72 default should trigger NONE OF THE ABOVE.
- A very low query budget should refuse premature certainty.
- Assumption-mismatched noise is an explicit invalid-input-condition control.
- Every sample is deterministic for seed, step number, and angle.
- JSON receipts contain all inputs, simulator oracle values, selected angles,
  compatibility filtering, stop states and caveats; origin SIMULATED and authority
  DEMONSTRATION_ONLY. Frozen AH-series research files are untouched.

Testing: npm run test:unknown-gear, npm test, npm run build.
