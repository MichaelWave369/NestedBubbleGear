# NBG-NI1 E1 | Frozen synthetic neuroimmune Keyhole sanity controls

**Contract**: NI1-E1-toy-0.1.0. **Origin**: SIMULATED. **Authority**: NONE.
**Date:** 2026-10-25. **Status:** implemented finite toy sanity checks; no living-organism or isolated-cell experiment. **Protocol lineage**: [NI1 E0](PROTOCOL.md), [evidence map](../../docs/NEUROIMMUNE_CAUSAL_KEYHOLES.md).

## Research question: computational only

When a known synthetic influence is injected into a delayed multi-input recurrence, can a fixed model detect it on a later withheld time window? Conversely, can the same procedure reject no-path and common-driver cases, recognize an unmeasured nuisance, and enforce exact *absence* of donor signal after a sample is disconnected? Can two coarse-equal artificial material states split after a specified future intervention?

These are **software-recovery checks**, not biological parameter estimates, not external model superiority, not claims about immune function, and not evidence for a field or nonlocal mind.

## Generator freeze

- Total synthetic ticks: **64**; pseudo-random deterministic LCG recurrence \`s=(1664525s+1013904223) mod 2^32\`, normalized into [0,1).
- Default seed 369, qualifying seeds 19, 42, 369, 777.
- Independent within-tick draws: neural jitter, readout jitter, acquisition nuisance jitter. They are synthetic PRNG streams; their amplitudes have **dimensionless** toy units.
- Train on ticks 2–43 (inclusive); hold out ticks 44–63. In detached world, train on ticks 26–43 and hold out 44–63. No post-holdout fitting or random re-splitting.
- Lag: 2 ticks. All coefficients invented. We intentionally freeze **known** ordinary recurrence \`y_t=0.62*y_(t-1)+0.32*common_t + β*neural_(t-2)+γ*nuisance_t + ε_t\` for connected worlds. This makes evaluation a positive/negative software sanity check, not an independent attempt to learn physical dynamics.
- The detached world switches at t=24 to **local** \`y_t=0.84*y_(t-1)+0.16*environment_t+ε_t\`. Its original sample state depends on its pre-detachment history; donor state after t=24 is not read.
- The pathway toy injects \`β=0.43\`, the artifact toy injects \`γ=0.48\`. Null and shared-driver worlds inject neither. The instrument nuisance is deliberately correlated with the lagged driver to expose confounding when omitted.
- \`K0\` toy witness: both artificial states have y=0.5, with hidden h=0.8 vs h=-0.8; one declared intervention u=1 yields \`y'=0.7*0.5+0.3*u+0.4*h*u\`, so 0.97 versus 0.33. This is a formal observer-distinguishability example, not a biological memory mechanism.

## Model audit

- **M0** known toy recurrence with optional, observed acquisition nuisance fitted by least squares on training ticks.
- **M1** same recurrence plus one lagged driver coefficient. Both compare one-step predictions using the actually observed previous tick (not iterative free forecasts).
- Fit with closed-form least squares on training; reject non-identifiable normal equations. Baseline and candidate are *not equal-capacity*, and the fixed recurrence is an oracle synthetic baseline. Therefore any score improvement supports only correct fixture detection, not NBG superiority to conventional statistics.
- Primary diagnostic: 20-tick holdout root-mean-square error (RMSE) and coefficient recovery. A **toy-only recovery flag** requires |β_hat|>0.15 and relative holdout RMSE reduction >0.12. These arbitrary software sanity thresholds are not significance tests or medical standards.
- No p-values, population confidence intervals, calibration or physical causal-effect estimation. NI1-E2 must adopt independent source data, matched model capacity, prespecified empirical endpoints, uncertainty and its own frozen splits before reporting any empirical improvement.
- Refuse causal interpretation if acquisition nuisance is unobserved in the artifact generator, regardless of an attractive extra-lag fit. Association/correlation alone is not a causal signal.
- Donor-swap null explicitly holds the isolated sample's deterministic PRNG and local environment fixed and alters only the donor state *after* disconnection; post-detachment sample differences must be exactly zero. A donor manipulation *before* disconnection changes the sample's inherited initial condition and subsequent trajectory.
- The simulated after-swap zero is guaranteed by its generator. It is an invariant *we test code against*, not an experimental proof that all possible unknown physical coupling has been excluded.
- No hypothetical nonlocal coupling is implemented. Including one in synthetic code would not authenticate it in reality.

## Provenance and fail-closed checks

Run \`npm run test:ni1\`, \`npm run test:research-atlas\`, \`npm run test:navigation\`, and \`npm run build\`.

Checks cover version/authority, finite replay, bounded seeds, five worlds, independent holdout, positive known-lag recovery, false-path rejection, nuisance refusal, donor isolation, exact coarse-Keyhole witness and local export metadata. UI offers explicit \`SIMULATED\` receipt export on the operator's click, with no network call and no collection of patient records.

Existing AH, RB, PHMP, IS1, EFG1, EG01–06, reserved holdouts and approved source rows remain untouched. No confirmation that an Israeli separated-blood comedy/horror experiment occurred; no cross-continent "family immunity," mind-to-mind transmission, special emotion frequency, or self-treatment guidance.

**Ledger Above Ego.**
