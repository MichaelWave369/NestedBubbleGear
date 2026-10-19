# Keyhole Budget K1 | Cost-aware observer selection

**Status:** E1 synthetic train/validation pilot; E2 reserved evaluation **NOT RUN**. **Origin:** `SIMULATED`. **Authority:** `NONE`.

## Research question

Following [Quantum Boundary Q3](QUANTUM_BOUNDARY_Q3.md), ask a *software engineering* question rather than reinterpreting textbook physics:

> Given two possible hidden-state hypotheses, an observation budget, different measurement costs, and a known query context, can an observer select the measurement that yields the most useful information per unit cost?

The benchmark's `X` and `Z` readouts borrow standard **two-qubit parity correlation formulas** only as a synthetic measurement generator. No real quantum system is observed, and the experiment does not claim an NBG-specific information-theoretic law.

## Fixed task and hypotheses

For visibility `v` and coherence `gamma`, ideal parity outcomes have:

```text
P(Y=+1 | X/X, v, gamma) = (1 + v*gamma)/2
P(Y=+1 | Z/Z, v, gamma) = (1 + v)/2
```

Two task contexts are equally represented with balanced labels:

| Context | H0 | H1 | Informative readout | Uninformative readout |
| --- | --- | --- | --- | --- |
| `coherence` | `v=.90,gamma=0` | `v=.90,gamma=.65` | X (cost 1) | Z (cost 2) |
| `visibility` | `v=.55,gamma=0` | `v=.95,gamma=0` | Z (cost 2) | X (cost 1) |

Every streaming policy receives the **context** and observations only. It does **not** receive the true hidden label, event likelihood draws ahead of time, or final evaluation answers. The label and fixture streams remain in the evaluation harness.

The informative sensor is known from the supplied hypothesis pair; consequently the classical information-gain approach is **already sufficient to choose correctly**. The study is intentionally a baseline, not a challenge designed to guarantee NBG novelty.

## Observer policies

- **Classical information gain per unit cost:** at posterior probability `q=P(H1|observed)`, choose the affordable readout maximizing `I(H;Y)/cost`. Information gain is `h((1-q)p0+q*p1) - (1-q)h(p0) - q*h(p1)`, with binary entropy `h`.
- **NBG-inspired typed Keyhole:** implements **exactly the same calculation and Bayesian update**, interpreting X/Z as typed permitted observation interfaces. It must tie classical information gain on all test cases, not be described as a separate superior algorithm.
- **Fixed X**, **fixed Z**, and **alternating** controls: some spend budget on statistically non-informative readouts by design. These are deliberately weak controls; the Bayesian baseline, not these, is the substantive comparator.

All models use the same sequential Bayesian likelihood-ratio update from observed parity outcomes, starting at `P(H1)=.5`. They stop at a predeclared posterior confidence `>=.99` or `<=.01`, or when no affordable measurement remains.

**Budget:** 24 dimensionless measurement-cost units per case; `cost(X)=1`, `cost(Z)=2`. Outcome loss for a binary classification error: 10 units; observation costs weighted at 0.025 per unit. The composite predeclared descriptive risk is `10*(1-accuracy)+.025*mean_cost`.

This cost is an **abstract budget**, not hardware power consumption, wall-clock runtime, or thermodynamic work. No total-memory advantage is claimed. The controller retains only its scalar log-odds and counters; implementation runtime objects are not byte-for-byte metered.

## Splits and provenance

Deterministic 32-bit LCG pseudo-random streams are constructed separately for each case and observation type, giving each candidate identical pre-generated potential readings for paired comparison. Candidate code can consume observations only as they are selected, without a precommit data oracle.

| Split | Seed | Cases per (context, label) | Total cases | Status |
| --- | ---: | ---: | ---: | --- |
| Training | 411 | 48 | 192 | Evaluated |
| Validation | 412 | 64 | 256 | Evaluated |
| Reserved | 413 | 128 | 512 | **NOT generated or evaluated** |

This repository PR implements and checks **train/validation only**, not the public reserved seed 413. The seed is public, hence reserved evaluation is *procedurally held out*, not cryptographically blinded. Once scored, the reserved cohort cannot be reused as independent evidence for retuned models.

The older, entirely separate **PHMP-3 E2 memory evaluation** with seed 203 also remains unscored and unchanged.

## Reproduction

```sh
npm run test:phmp-keyhole-k1
node scripts/test_phmp_keyhole_k1.mjs --out keyhole-k1-local-receipt.json
```

The script is dependency-free Node.js. Ordinary testing does not create receipts; `--out` creates a new receipt only and refuses overwrite. Canonical SHA-256 summarizes protocol constants, deterministic train/validation dataset digests, and all candidate comparison results.

Sanity checks cover:
- Zero information gain in the intentionally irrelevant readout of each task.
- Positive information gain in the relevant readout.
- Equal deterministic streams and budget accounting for all competitors.
- Explicit **exact per-case tie** between typed NBG and classical information gain.
- Deterministic replay, zero posterior updates from irrelevant observations, and a complete report of all competitors.

## E1 results on 256 validation cases

| Policy | Correct | Accuracy | Mean observation cost | Composite risk |
| --- | ---: | ---: | ---: | ---: |
| Classical Bayesian information gain | 238/256 | 92.96875% | 20.21484375 | 1.20849609375 |
| NBG-inspired typed Keyhole | 238/256 | 92.96875% | 20.21484375 | 1.20849609375 |
| Fixed X | 185/256 | 72.265625% | 20.98046875 | 3.29794921875 |
| Fixed Z | 181/256 | 70.703125% | 23.234375 | 3.510546875 |
| Alternating X/Z | 208/256 | 81.25% | 23.59375 | 2.46484375 |

**Interpretation:** Conditional observation routing preserves informative observations more effectively than intentionally irrelevant/fixed routing on these declared synthetic cases. The NBG-inspired controller **ties standard Bayesian information gain by construction**, demonstrating **NO DISTINCT NBG ENGINEERING ADVANTAGE**. No significance or robustness claim is made beyond these runs.

The two task contexts expose sensor informativeness in advance; this is a **starter control**. The next genuinely harder study should introduce a time-varying/uncertain observation model, delayed and revoked access, or an unknown nuisance parameter, and compare against appropriately adapted classical POMDP / active sensing / Bayesian decision baselines at equal cost.

## Frozen evidence boundary

`TRAIN_VALIDATION_EXPLORATORY`; `SIMULATED / authority NONE`.

No changes to frozen AH, PHMP, optical, or Q1–Q3 files or results. No physical measurements, device-independent Bell evidence, empirical AI benefit, quantum computation, NBG causal gravity, or hardware energy claim. A positive NBG-specific claim requires a newly frozen test that separates it from ordinary information theory **and** from matched classical strategies.

**Ledger Above Ego.**
