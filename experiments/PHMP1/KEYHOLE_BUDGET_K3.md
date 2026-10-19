# Keyhole Budget K3 E1 | Unknown sensor reliability and calibration evidence

**Status:** exploratory synthetic train/validation pilot. **Origin:** `SIMULATED`. **Authority:** `NONE`.
**No K3 held-out scoring**; K1, K2 and the independent PHMP-3 E2 reserved datasets also remain untouched.

## Question

[K2](KEYHOLE_BUDGET_K2.md) gave both controllers the public time-dependent sensor-quality schedule. K3 removes that information: each episode contains an unknown but **stationary** X and Z reliability. The observer can request target readings or pay for a **known-reference calibration reading**, then update a joint belief over the target and sensor reliabilities when that evidence actually arrives.

Can a typed/provenance-aware observer choose good questions under partial reliability information **better than matched conventional Bayesian inference**? This is a real engineering question but **not yet a distinct NBG algorithm**.

## Task and generative model

The hidden target label is `H in {0,1}`. Each episode independently selects one of the *two publicly known potential rates*, `rX,rZ in {0.55,0.90}`. Each of the eight combinations `(H,rX,rZ)` is equally weighted in the Bayesian prior and represented equally in the synthetic dataset. Controllers know the possible rates and priors, **not the actual episode's assignments or label**.

- `target(sensor)`: an observation equals the hidden `H` with probability `rSensor`.
- `calibrate(sensor)`: an observation of a *known label 1 reference* equals `1` with probability `rSensor`. That calibration directly informs reliability, **not the hidden target H**.
- The evidence sources are conditionally independent given `(H,rX,rZ)`, with episode-stationary reliability. This is a toy model and not a claim about physical quantum equipment.
- The conventional Bayesian controller carries the exact posterior over all **eight joint states**, updating on **the measurement actually received** at its scheduled delivery time. A known calibration updates the rate estimates, a target measurement updates both target and rates.

### Rules frozen in this E1 code

| Parameter | Value |
| --- | --- |
| Discrete time horizon | 14 issue ticks, with terminal delivery at tick 14 |
| Available measurement-cost budget | 12 abstract units per episode |
| `target` cost / delay | 2 units / 1 tick |
| `calibrate` cost / delay | 1 unit / 2 ticks |
| X permission | New issuance forbidden at `t mod 7 = 2` |
| Z permission | New issuance forbidden at `t mod 7 = 0 or 5` |
| Posterior-confidence stopping | Stop initiating new observations if P(H=1) reaches >=0.96 or <=0.04 |
| Receipt | Sensor/mode, issuance/delivery ticks, authorization-at-issue, declared cost, reference label and observed bit |

The evaluator rejects early, duplicate, altered-reference, unauthorized, wrong-cost and after-deadline receipts. A reading originally authorized at issuance remains deliverable after new issuance is forbidden. **Receipts are unsigned structural JavaScript records; this does not prove resistance to an attacker who can forge the entire record.**

### Fair controllers and metric caution

- **`bayes-joint-info`**: classical *myopic* joint-entropy reduction for `(H,rX,rZ)`, divided by measurement cost and a known delay factor `1+0.1*delay`. It may spend too much budget learning sensor quality rather than the target. It is not a globally optimal POMDP policy.
- **`nbg-typed-provenance`**: intentionally uses **exactly the same joint Bayesian policy**, receipt checks, and posterior update. Its score must equal the conventional policy *per case*. Labeling this controller NBG is not evidence of a separate new computation.
- **`bayes-target-info`**: classical myopic *target entropy* reduction, requests only target observations, but maintains the same full joint Bayesian posterior.
- **`bayes-calibrate-first`**: conventional planned heuristic, seeks two valid calibrations per sensor, then chooses target observations by Bayesian target information. It is a meaningful counterexample to automatic superiority of myopic joint information gain.
- **`fixed-X-target` / `fixed-Z-target`**: legal but intentionally limited single-sensor controls.

The **primary descriptive scores** are exact target classification accuracy and the probabilistic Brier score `mean((P(H=1)-H)^2)` (lower is better). Secondary scores are cost, number of calibrations, and performance within each reliability stratum. **No statistical significance, optimality, or total computational-resource superiority is established** from this exploratory validation.

## Reproduction, splits, and hindsight boundary

```sh
npm run test:phmp-keyhole-k3
node scripts/test_phmp_keyhole_k3.mjs --out k3-e1-local-receipt.json
```

The script requires only Node built-ins, performs a replay and hard assertions, prints the full model table, and optionally creates a SHA-256 JSON receipt at a *new* path only. It does not call any reserved data generator.

| Cohort | Public seed | Histories per each (label,rX,rZ) stratum | Total |
| --- | ---: | ---: | ---: |
| Train | 431 | 48 | 384 |
| Validation | 432 | 64 | 512 |
| Reserved, **NOT generated** | 433 | 128 | 1,024 |

All policies receive identical deterministic potential sensor observations *if and only if* they request a permitted observation. Their strategy functions receive only current Bayesian belief, allowed action list, costs, and previously requested calibration counts. The evaluator holds the secret label and reliability for scoring. A pending observation cannot update a posterior early.

**Research-governance caveat:** K3's sensor-cost design was explored on the train/validation pilot, so the following outcomes are **exploratory**, not confirmatory. Do not imply the pilot design was preregistered before any validation outcomes. The current code can now be frozen; a future separate first-pass reserved run requires an explicit source-pinned gate and cannot use seed 433 as fresh evidence after results are examined.

## K3 E1 local validation results

512 synthetic episodes, balanced across the eight states:

| Controller | Correct | Accuracy | Brier (lower better) | Mean cost | Mean calibrations |
| --- | ---: | ---: | ---: | ---: | ---: |
| Classical joint information gain | 428 | 83.59375% | 0.11499 | 11.701 | 5.557 |
| NBG typed/provenance Keyhole | 428 | 83.59375% | 0.11499 | 11.701 | 5.557 |
| Classical calibration-first | **434** | **84.765625%** | **0.10449** | 11.703 | 4.000 |
| Classical target-only information gain | 420 | 82.03125% | 0.11245 | 10.602 | 0 |
| Fixed X target | 402 | 78.515625% | 0.14228 | 11.313 | 0 |
| Fixed Z target | 405 | 79.1015625% | 0.13091 | 11.383 | 0 |

The NBG-style and classical joint Bayes models **tie exactly by construction**. The calibration-first classical competitor performs somewhat better on this particular validation set on both classification accuracy and Brier score. The relative ordering of policies is an **exploratory observation**, not a general conclusion; no held-out statistical test or confidence interval has been performed.

The key question for future experiments is not whether "calibration" or "holonomy" sounds clever. It is whether a predeclared controller makes better **task-relevant decisions** at matched budgets, while preserving valid evidence provenance. A higher joint information-gain objective need not minimize target-classification loss.

## Boundaries and possible K4

- **Not demonstrated:** a physically new quantum/Dirac mechanism, a new NBG-specific predictive advantage, learning an entirely unknown sensor distribution, or cryptographically authenticated causal provenance.
- **Important stationary assumption:** sensor reliability is unknown within an episode but does not change. A real drift, calibration-adversary, revocation or signed-evidence scenario requires a separate frozen test.
- **Next good control:** a conventional finite-horizon Bayesian/POMDP or value-of-information policy that jointly optimizes classification loss and cost, alongside a genuinely independently implemented typed-policy proposal. Include source reliability shifts and observe out-of-distribution failures, but do not silently alter these K3 outcomes.

No existing frozen AH, PHMP, K1/K2, quantum, or optical source/results have been modified.

**Ledger Above Ego.**
