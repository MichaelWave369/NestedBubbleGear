# NI1-E1B | Exact causal collision and isolated-probe contract

**Scope:** mathematically specified **SIMULATED / authority NONE** experiment. **Version:** \`NI1-E1B-toy-0.1.0\`. **Date:** 2026-10-25. This is not a biological model validated against physiology, a real laboratory intervention, or evidence for remote consciousness.

## Why E1B exists

NI1-E1's demonstration recovered a software-injected delayed coefficient when the analyst knew the recurrence, and used a generator-world label to gate interpretation of an unmeasured nuisance. Such software tests are useful regression checks but do not identify causal mechanisms from observables. E1B addresses a harder question:

> Can **two different causal programs** generate *exactly the same observable samples*, and can an evaluator restricted to observation-only Keyholes distinguish them only after a **channel-specific intervention**? Can it refuse when the intervention contaminates another channel?

This is an exact **mathematical causal-collision witness**. It does not demonstrate NBG's physical applicability or superiority over conventional causal-inference methods.

## Frozen mathematical generator

Ticks \`t=0,...,59\`, default seed 369 and test seeds \`{19,42,369,777}\`.
Intervention begins at t=40 and has fixed positive amplitude \`a=0.8\` in dimensionless units.

Define independent-of-mechanism time signals:

\`\`\`text
common_t   = 0.37 cos(0.16t) + 0.18 sin(0.27t)
shared_t   = 0.44 sin(0.23t + 0.0007 seed) + 0.21 cos(0.37t)
noise_t    = 0.007 sin(0.59t + 0.003 seed)
pulse_t    = 0 for t < 40, else 0.8
neural_t   = shared_t + pulse_t if neural probe, else shared_t
nuisance_t = shared_t + pulse_t if nuisance probe (or deliberate
             cross-talk from neural probe), else shared_t
observed_t = 0.72 observed_(t-1) + 0.22 common_t
             + 0.4 * active_t + noise_t
observed_(-1) = 0.15
\`\`\`

The two candidate *generating* mechanisms differ only in \`active_t\`:

- **N generator:** \`active_t = neural_t\` (invented neural-like driver).
- **I generator:** \`active_t = nuisance_t\` (invented instrument/handling-like driver).

Without a probe, \`neural_t=nuisance_t=shared_t\`, so all public time traces match point for point in both worlds. This is a structural causal ambiguity, not a sampling artifact. All numbers are invented and have no physical units or clinical calibration. Readout values are rounded to 9 decimal places; replay is deterministic.

## Observer boundary and admissible probes

The generator selector (N versus I) is *not* placed in the input passed to \`evaluateNI1B\`. The observer accepts only \`{version,origin,authority,rows}\`, each row with \`{t,observed,neural,nuisance,common}\`, and the declared intervention channel.

- **K0 / observational:** no probe. The two worlds have exactly the same series and the only admissible conclusion is \`NOT IDENTIFIABLE\`.
- **K1 / isolated neural probe:** neural input rises, nuisance and common drivers remain unchanged. If readout changes, report **intervention response in this toy**, never an external biological cause.
- **K2 / isolated nuisance probe:** nuisance rises alone; interpretation is similarly limited.
- **K3 / failed exclusion (cross-talk):** neural probe also changes nuisance. The observer *must refuse mechanism attribution* even if readout changes.

The observer compares a baseline and intervention replay at the same seed. They must be *exactly* equal on all measured channels before t=40, and off-target measurements must be invariant after t=40. The algorithm does **not** look up either world label or the generating coefficient. Any receipt can disclose its generator selection for simulation provenance, but only **after** the blind observer has produced its decision.

## Predeclared software decisions

1. Any unmatched pre-probe row/channel: \`REFUSE: BASELINE MISMATCH\`.
2. Any off-target neural/nuisance or common-input change after the probe: \`REFUSE: FAILED CHANNEL ISOLATION\`.
3. If the declared input fails to change by the frozen amplitude: \`REFUSE: NO CONFIRMED INTERVENTION\`.
4. For a valid isolated probe, max absolute post-probe readout contrast over t=40..59 > 0.1: \`INTERVENTION RESPONSE (TOY ONLY)\`.
5. Otherwise: \`NO RESPONSE TO ISOLATED INTERVENTION\`.

This is *not* a new empirical effect-size threshold, not inference of physical mediators, not a probability of an extraordinary hypothesis, and not evidence of a healing protocol. Paired streams intentionally use exactly matched synthetic noise/common history, an unrealistic convenience compared to independent wet-lab samples. Thus there are no p-values, uncertainty intervals, real treatment effects, biologically calibrated quantities, or observed participants.

## Frozen 2×2 predictions

| Generator | Isolated neural probe | Isolated nuisance probe |
| --- | --- | --- |
| Invented neural driver N | RESPONSE (TOY) | NO RESPONSE |
| Invented instrument driver I | NO RESPONSE | RESPONSE (TOY) |

The extra **cross-talk intervention** moves both channels and forces \`REFUSE\` under *either* hidden mechanism. Before any intervention, both programs have *exactly identical* observations and cannot be distinguished, even with unlimited noiseless unperturbed data. After an isolated intervention they diverge by construction, illustrating a lawful future distinction in the NBG Keyhole/Altermath formal sense.

## Interpretation and status

- Test success is an **exact structural property of an invented deterministic model**. It does not elevate the viral alleged Israeli detached-blood story, "family immunity", remote emotional influence, telepathy, special neuroimmune frequencies, or any therapeutic application.
- **The term "neural" here is a label on a software variable, not an experimentally measured physiological pathway.**
- Any real isolated-sample or human experiment remains outside authorization and would require independent ethics review, legitimate sample custody, masked donor identifiers, environmental controls, preplanned endpoints, competent specialists, and proper uncertainty estimation.
- No source-human datasets are imported, and existing frozen NI1-E1, EFG1, IS1, RB, AH, and PHMP artifacts are unchanged.
- Cross-references: [NI1 E0](PROTOCOL.md), [NI1 E1](E1_PROTOCOL.md), [literature map](../../docs/NEUROIMMUNE_CAUSAL_KEYHOLES.md).
- \`npm run test:ni1-collision\` tests exact collisions, all four seeds, opposite mechanism/probe predictions, failed channel isolation, baseline mismatch, payload validation and provenance.
- UI at \`#ni1-e1b\` is interactive and exports optional local **SIMULATED / NONE** receipts. No web request or access to private measurements is performed.

**Ledger Above Ego.**
