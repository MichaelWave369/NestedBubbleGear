# POLY-04 · Held-Out Predictive Keyhole research ledger

**Research classification:** synthetic held-out task benchmark, **authority NONE**.
**Runnable implementation:** [Altermath R27 PR #29](https://github.com/MichaelWave369/Altermath/pull/29).
**Earlier tracks:** [POLY-01](POLY01_POLYHEDRAL_KEYHOLE.md), [POLY-02](POLY02_RULE_PRIOR_ROBUSTNESS.md), [POLY-03](POLY03_EXHAUSTIVE_CUBIC_ENSEMBLE.md).

## The engineering question

NBG asks when coarse observations conceal consequential information. POLY-03 proved that in a narrow, exact finite graph model, *topology* can affect conditional uncertainty even when graph size, degree and update rule are held fixed.

But a high conditional entropy is not itself a useful technology. POLY-04 tests a practical-sounding but **still synthetic** question: can observing one or two additional binary pocket states make a one-step aggregate predictor more accurate on held-out examples, at the same observation budget as a nonadaptive baseline?

## Protocol

- Five declared connected cubic eight-pocket representatives from POLY-03; **not** the full 19,320 graph population.
- Four deterministic synchronous update laws from POLY-02: neighbor majority, neighbor parity, inertia with tie-to-self, and identity/null.
- Every full binary state \(X\in\{-1,+1\}^8\) is used exactly once; \(M(X)=\sum_i X_i\) is visible to every predictor, and the target is the **next aggregate** \(Y=\sum_iF(X)_i\).
- Three preregistered partition seeds: **369, 636, 963**.
- Complete state space is paired by bitwise complement so inverse-sign states stay in the same subset, then shuffled deterministically into 128 **training**, 64 **validation**, and 64 **heldout** state masks.
- A discrete empirical-mode predictor learns \(Y\) from the aggregate \(M\) and at most \(k\in\{0,1,2\}\) **extra raw pocket bits**. Unknown keys fall back to the training aggregate model, then to its training global mode.
- **Fair budget**: compare the aggregate-only model, first-k fixed pocket locations, a seeded random k-pocket selection, and validation-selected pocket indices chosen from all 8 singletons or 28 pairs. The candidate search sees training and validation only; holdout data are used **once for final evaluation**.
- Metrics: heldout exact-match accuracy, mean absolute error, candidate-minus-aggregate accuracy and candidate-minus-fixed accuracy. All deltas, including **zero and negative**, must be retained.
- Three-seed report comprises 15 graph-by-seed conditions × 64 test masks = **960 within-model heldout predictions** for each fixed rule and budget. These are synthetic, substantially dependent conditions, **not** 960 independent operational trials.

## Adversarial controls

- Independent array-of-signs transition oracle verifies labels for all graph representatives and four rules.
- Complement-paired train/validation/test states are disjoint and cover all 256 configurations exactly; the partition repeats for fixed seeds.
- Predictions are functions solely of the current aggregate and explicitly allowed extra raw pocket bits. **No next-state or target-derived values enter the Keyhole.**
- Budget-zero selected/random/fixed predictions must exactly equal aggregate-only baselines.
- Validation chooses sensors, never test cases or test labels. Fixed and random controls use the same observation budget.
- Unsupported rules, sensors, seed values, malformed records and empty inputs fail closed.

This experiment may find no improvement or regression: report either outcome without editorial suppression.

## Explicit nonclaims

- None of these labels originate from real devices, agents, neural models, sensory systems or independently observed physical data.
- Holdout on the same deterministic graph rule is not independent external validation of general prediction or learned architecture.
- Higher hidden entropy doesn't imply the graph is a better source of useful information, intelligence or optimized routing.
- No evidence is offered for E8 cosmology, dimensional realms, quantum communication, consciousness or new physical laws.
- No deployment, model-weight routing, private data sharing, network calls or capability grant is authorized.

## Promotion gate

An **optional future** NBGPocketMesh adapter requires a separately preregistered, consented held-out *real task* evaluation against E0/E1 baselines, equal privacy/latency/memory budgets, independent task sources, and hard non-bypassable PhiKernel policy checks. If a simple aggregate or ordinary graph-feature baseline works as well, document that result and **do not** promote.

## Reproduce / review

From Altermath main or R27 branch:

~~~sh
npm run test --prefix site
npm run build --prefix site
~~~

Implementation: \`site/src/keyholeForecast.js\`; tests: \`site/tests/keyholeForecast.test.js\`; research protocol: [Altermath POLY-04 document](https://github.com/MichaelWave369/Altermath/blob/research/poly04-heldout-keyhole-forecast-r27/docs/keyhole-forecast-r27.md).

**Stop conditions:** heldout leakage, improper sensor budgets, oracle disagreement, missing negative outcomes, reproducibility failure, or any attempt to confer authority from synthetic graph scores.
