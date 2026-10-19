# Keyhole Budget K5 E1 | Trust Under Model Mismatch

**Status:** exploratory train/validation software benchmark. **Origin:** `SIMULATED`. **Authority:** `NONE`.

**Verdict:** A conventional target-focused Bayesian policy scored best on the K5 synthetic validation for both classification accuracy and Brier score. An independently coded NBG-inspired surprise-triggered calibration policy did **not** outperform it. No novel physics or NBG-specific engineering gain is claimed.

## Research question

After [K4](KEYHOLE_BUDGET_K4.md), which assumed reliability could change only at known tick numbers, K5 asks whether incorrect change-time assumptions can harm an observer, and whether a **receipt-aware surprise-triggered recalibration** rule improves decisions with finite observation costs.

This benchmark distinguishes:
- **Restricted classical model:** sensor changes at tick 4, tick 8, or never, matching the hypothesis support used in K4.
- **Expanded classical model:** sensor changes at 3, 4, 7, 8, or never. It does *not* know the true times, but its prior includes the shifted possibilities. This is a matched classical robustness control, **not** a source-blind inference engine.
- **NBG-inspired rule:** independently specified extra observation scheduling based on surprising *delivered* evidence, but retains the **same conventional expanded Bayesian posterior** for inference as the robust baselines.

The comparison avoids claiming that mere typed data/ledger labels supply information absent from standard Bayesian filtering.

## True synthetic episode family

The hidden label is binary `H ∈ {0,1}`. Each sensor initially has one of two possible reliability levels `rX,rZ ∈ {0.56,0.91}`. At its true change tick, reliability **flips** to the other level.

| Family | Allowed (X switch, Z switch) pairs | Cases on validation |
| --- | --- | ---: |
| `expected` | (4,8), (8,never), (never,4), (never,never) | 160 |
| `shifted` | (3,7), (7,never), (never,3), (never,never) | 160 |

Each family crosses eight balanced combinations of hidden label and initial sensor quality, with five independently seeded cases per stratum for validation. **The no-switch case occurs in both families**, so the labels describe fixture design, not two perfectly disjoint physical populations.

`target` sensor requests return the hidden label with the source's reliability **at the request time**. `calibrate` requests measure a *known label-1 reference*, informing source reliability but not directly revealing the hidden target. Their Bernoulli likelihoods are conventional probability calculations. Outcomes are reproducible seeded software draws, not physical experiments.

## Access, timing, and resources

| Parameter | Fixed value |
| --- | --- |
| Horizon | 12 issue ticks, final delivery at tick 12 |
| Abstract measurement budget | 12 units |
| Target measurement | cost 2; delivery delay 1 tick |
| Known-reference calibration | cost 1; delivery delay 2 ticks |
| X permission | no new issuance when `t mod 6 = 2` |
| Z permission | no new issuance when `t mod 6 = 0` |
| Early-stop confidence | posterior H reaches ≥ 0.97 or ≤ 0.03 |
| Restricted prior | 72 equally weighted latent states |
| Expanded prior | 200 equally weighted latent states |
| NBG-style surprise trigger | observation surprisal strictly above 1.5 bits |

One receipt per authorized issuance records its ID, source, type, issuance time, delivery time, cost, authorization-at-issue, known calibration label, and observed bit. Its effect reaches the controller only at the scheduled delivery tick.

The receipt audit rejects duplicate receipts, wrong IDs, unauthorized source issuance, invalid reference labels, and early delivery. **It is structural verification of unsigned data, not cryptographic authenticity or adversarial provenance.**

**Critical anti-hindsight rule:** evaluate the likelihood for the *time the observation was requested*, even if the source's quality changes before the result is delivered. The posterior incorporates all previously delivered evidence at receipt time; the event likelihood is still indexed by its own issuance time.

## Policy competitors

| Controller | Posterior | Sensor-selection rule |
| --- | --- | --- |
| `restricted-joint-bayes` | Correct Bayesian filter over restricted 72-state model | Maximize myopic joint-state entropy reduction per discounted cost |
| `robust-joint-bayes` | Correct Bayesian filter over 200-state expanded model | Same conventional myopic joint-state information objective |
| `robust-target-bayes` | Same expanded Bayesian posterior | Maximize **target-label** information gain per discounted cost |
| `nbg-surprise-keyhole` | Same expanded Bayesian posterior | Normally target-focused; after a delivered observation has surprisal > 1.5 bits, request a legal calibration of that source when no calibration remains pending |
| `scheduled-calibration` | Same expanded Bayesian posterior | Conventional periodic calibration control, then target-focused observations |
| `fixed-X` | Same expanded Bayesian posterior | Request only legal X target measurements |

Surprisal is evaluated on the **arrival-time posterior predictive probability** of the observation under its **issuance-time likelihood**. The NBG-inspired rule observes no actual hidden label, reliability, or change time; it reacts to what the controller has legitimately received.

All competitors have the same external evidence-generation process, permissions and budget. They do **not** have equal CPU/memory cost in this experiment: the expanded 200-state posterior is computationally larger than the restricted 72-state posterior. This precludes claims of improved end-to-end compute efficiency.

The Bayesian policies are myopic, **not** established globally optimal POMDP policies. The surprise threshold is an exploratory heuristic, not a calibrated sequential change-detection test.

## Data split and research hygiene

| Cohort | Public seed | Cases per stratum | Total | Status |
| --- | ---: | ---: | ---: | --- |
| Train | 451 | 3 | 192 | Scored |
| Validation | 452 | 5 | 320 | Scored |
| Reserved | 453 | 10 | 640 | **NOT generated or scored** |

The test script calls its fixture generator **only** for train/validation. The reserved generator rejects other split names in this rung. Prior reserved cohorts (K1 through K4 and the independent PHMP-3 E2 memory study) are not generated or scored.

All candidate policies get the same deterministic potential sensor readings *if they request them*, without being shown unissued events. All strategies use their current posterior, permitted actions, clock and cost state. True hidden variables stay in the evaluation harness. Receipt timestamps are immutable in their issued representation.

**Hindsight limitation:** the K5 source was developed and inspected against train/validation. All results below are exploratory. Before using seed 453, the candidate and statistical protocol must be frozen; the public seed does not provide cryptographic blindness. Do not claim future replays as fresh independent holdouts.

## E1 validation scorecard

All 320 validation cases, in descending accuracy:

| Policy | Correct / 320 | Accuracy | Brier (lower better) | Mean cost |
| --- | ---: | ---: | ---: | ---: |
| Robust target-focused Bayes | **285** | **89.0625%** | **0.079613** | **10.5875** |
| Robust joint Bayes | 282 | 88.1250% | 0.094157 | 12.0000 |
| NBG surprise-triggered calibration | 282 | 88.1250% | 0.091892 | 10.5875 |
| Restricted joint Bayes | 281 | 87.8125% | 0.100383 | 12.0000 |
| Scheduled calibration | 277 | 86.5625% | 0.093661 | 11.3750 |
| Fixed X | 268 | 83.7500% | 0.102921 | 11.3688 |

### Shifted-pattern subset (160 cases)

| Policy | Correct | Accuracy |
| --- | ---: | ---: |
| Restricted joint Bayes | 142 | 88.75% |
| Robust target-focused Bayes | 140 | 87.50% |
| NBG surprise-triggered | 140 | 87.50% |
| Scheduled calibration | 138 | 86.25% |
| Robust joint Bayes | 137 | 85.63% |
| Fixed X | 128 | 80.00% |

**Important:** On this *small subset*, the restricted model happened to have the highest accuracy even though it excludes some true change times. That is not contradictory: better support coverage does not guarantee more correct finite-sample thresholded predictions. Expanded-vs-restricted conclusions require larger independent tests, calibration metrics, and predeclared inference.

The NBG-inspired controller requested on average **0.7125 calibrations per validation case**, compared with **zero** for the target-focused Bayesian controller, yet did not improve its classification accuracy or Brier score. Those additional observations cost opportunities to collect task-relevant measurements. This is the main negative-control observation.

## How to replay

```sh
npm run test:phmp-keyhole-k5
node scripts/test_phmp_keyhole_k5.mjs --out k5-e1-local-receipt.json
```

The script uses built-in Node.js modules only. It checks the 72/200-state sizes, probability normalization, model-support differences, source-quality change, receipt tamper/duplicate/authorization controls, issuance-time likelihood versus delivery-time error, paired reproducibility, budgets, and deterministic policy replays. `--out` creates a **new** JSON receipt path only (no overwrite). It records both family subsets, all six policies, both scored splits and deterministic split hashes.

An independent in-process JavaScript replay of the exact committed source passed and scored 192 training / 320 validation cases. GitHub CI must verify the final committed tree separately.

## What K5 does not establish

- No physical quantum system, photon, Dirac spinor, or novel NBG holonomy.
- No cryptographically protected evidence log, malicious collusion resistance, or independent signed origin checks.
- No genuine unknown-unknown change point for the robust model: its support includes the new shifted change times.
- No statistical proof of general superiority for any controller, and no claim that a myopic Bayesian strategy is globally optimal.
- No reduced hardware energy, proven total memory savings, or practical production robustness from synthetic scores.

**Next:** A separately frozen K6 could use fully undisclosed drift patterns or adversarially contaminated sources, calibrated forgetting/change-detection controls (CUSUM, Bayesian online change-point detection), and independent out-of-family evaluation with the same cost accounting. Keep source reliability distinctions and provenance **observable only through actual authorized evidence**.

**Ledger Above Ego.**
