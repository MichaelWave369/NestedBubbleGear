# Keyhole Budget K4 E1 | Trust Under Drift

**Status:** exploratory synthetic train/validation benchmark. **Origin:** `SIMULATED`. **Authority:** `NONE`.

## Research question

After [K3](KEYHOLE_BUDGET_K3.md), sensor reliability is no longer constant throughout an episode. Both X and Z may independently **flip** between the known possible rates 0.56 and 0.91 at tick 4 or tick 8, or never flip. A controller sees delayed, noisy observations, not the actual reliability or change time.

Can a typed NBG-inspired trust-expiration rule retain valid historical evidence and classify accurately under reliability shifts? The substantive classical comparators are **Bayesian change-point filters**, not deliberately uninformed fixed sensors.

The result is a useful *negative*: in the exploratory validation, both classical Bayesian change-point policies outperform the independent NBG-style TTL policy on classification accuracy. The target-focused Bayesian policy has the best Brier score.

## Exact synthetic model

The latent hypothesis family has 72 equally weighted possibilities:

```text
H in {0,1}
initial rX, rZ in {0.56,0.91}
switch times sX,sZ in {4,8,never}
72 = 2 * 2 * 2 * 3 * 3 states
```

At a sensor's switch time, its reliability flips to the *other* of the two declared rates. Given state `(H,rX,rZ,sX,sZ)`, readings are independent Bernoulli draws conditioned on that state. A `target` observation equals H with the reliability at its **issuance** time; a `calibrate` observation of a **known label 1** reference equals 1 with that reliability. Calibration can provide information about reliability and its possible change time, not direct access to the hidden label.

All competitors know this exact 72-state prior and the allowable change times, observation costs, permission schedule, and delays. They do **not** receive the actual episode's true state, future observations, or reserved outcomes. Thus the classical Bayesian filters are deliberately well-specified for this synthetic model; this is not an out-of-distribution test.

### Cost and causal rules

| Rule | Value |
| --- | --- |
| Request window | ticks 0–11, final delivery at tick 12 |
| Cost ceiling | 12 abstract units |
| Target observation | cost 2, delay 1 |
| Calibration observation | cost 1, delay 2 |
| New X issuance | forbidden at `tick % 6 == 2` |
| New Z issuance | forbidden at `tick % 6 == 0` |
| Early stop | posterior P(H=1) ≥ 0.97 or ≤ 0.03 |
| Trust-expiration rule | prefer a calibration when last issuance is ≥ 4 ticks old and none is pending |

Receipt objects are frozen inside the JavaScript run and include issuance time, delivery time, sensor, observation type, known calibration reference label, cost, authorization status, and result. Audits reject duplicates, early delivery, incorrect timestamps, changed reference labels and unauthorized issuance.

**Anti-hindsight:** the posterior likelihood for a delayed observation is computed using **its issuance time**, not the delivery time. For a change between collection and delivery, those likelihoods can be different; the script explicitly checks that the two would produce distinct posteriors.

These are **structural simulated receipts**, not cryptographic signatures, immutable external storage, or a security proof.

## Predeclared comparative policies

- **`bayes-joint-changepoint`**: exact 72-state Bayesian posterior with a myopic decision rule maximizing expected information about the *whole latent state* (H, reliabilities and switch times) per cost/delay.
- **`bayes-target-changepoint`**: the same exact posterior but actions optimize expected information only about the target H, per cost/delay.
- **`nbg-ttl-audit`**: an *independent* typed-interface policy (not a renamed classical clone). It prioritizes overdue per-sensor calibration by a **four-tick issuance TTL** and otherwise uses the target-information Bayesian rule. It uses the same complete 72-state Bayesian posterior for evidence updates, so no independent NBG inference mathematics is being claimed.
- **`scheduled-calibration`**: conventional fixed scheduling heuristic, requesting early calibrations before target-information sensing.
- **`fixed-X`**: legal X-only target observation control.

The two Bayesian policies are **myopic**, not proven globally optimal finite-horizon POMDP controllers. The NBG-inspired TTL heuristic carries extra action rules but *does not* have additional ground truth. The policies have equal external observation cost ceilings, but this experiment does **not** isolate or equate all CPU cycles, codebase sizes or memory allocations.

## Data and anti-hindsight

| Split | LCG seed | Cases per each of 72 hidden states | Total | Status |
| --- | ---: | ---: | ---: | --- |
| Train | 441 | 3 | 216 | Evaluated |
| Validation | 442 | 4 | 288 | Evaluated |
| Reserved | 443 | 8 | 576 | **NOT generated or evaluated** |

The generator creates independent deterministic potential observations for each episode/tick/sensor/mode. A model sees a particular reading only after legally requesting it and receives its contribution to posterior belief only upon scheduled delivery. This enables paired policy comparisons.

The reserved split is procedurally held out, **not cryptographically blind** (its seed is public). The validation outcomes have been inspected and documented as an exploratory pilot. Any later confirmatory comparison must freeze the controllers and source first, with no tuning on a subsequently consumed evaluation split. Prior K1/K2/K3 and independent PHMP-3 E2 reserved sets remain entirely untouched.

## E1 independent local validation

| Policy | Correct / 288 | Accuracy | Brier ↓ | Mean cost |
| --- | ---: | ---: | ---: | ---: |
| Bayesian joint change-point | **251** | **87.1528%** | 0.094572 | 12.0000 |
| Bayesian target-focused | 249 | 86.4583% | **0.091554** | 11.4583 |
| NBG-inspired TTL Keyhole | 243 | 84.3750% | 0.112309 | 11.6042 |
| Fixed X | 239 | 82.9861% | 0.118661 | 11.5347 |
| Scheduled calibration | 236 | 81.9444% | 0.118117 | 11.4375 |

**Interpretation:** The exact-model classical joint Bayesian policy scored highest for thresholded classification; the classical target-entropy policy achieved the lowest average squared probability error. The independently specified NBG-style four-tick trust expiration rule ranked below both.

No confidence interval, significance test, genuine robustness under model misspecification, or confirmatory holdout result is provided. Small observed gaps should not be promoted to a general ranking. The pilot is particularly favorable to correctly specified Bayesian inference because its entire change-time support is known to the controller.

## Reproduce

```sh
npm run test:phmp-keyhole-k4
node scripts/test_phmp_keyhole_k4.mjs --out k4-e1-local-receipt.json
```

The test uses only built-in Node.js modules and returns deterministic split SHA-256 digests and all policy outcomes. An optional `--out` exclusively creates a *new* JSON receipt; standard tests write no receipt. Independent source-level mathematical replay passed the standalone test on the exact committed GitHub script; GitHub CI must confirm separately.

## Evidence category / next questions

**`EXPLORATORY_CLASSICAL_BASELINES_OUTPERFORM_TTL`**, not `NBG_SPECIFIC_IMPROVEMENT`.

Follow-up K5 should either use a genuinely new, predeclared typed-controller decision policy and fair classical belief-state planning or test **model misspecification**, drift-rate uncertainty, adversarial source corruption and authenticated external receipts. Such extensions require their own frozen protocols, baselines and held-out cohorts; do not rewrite K4 to make the heuristic win.

No original frozen AH/PHMP, physics, optical, quantum or earlier Keyhole files/results were modified. No quantum hardware, novel field effect, physical energy reduction or unaccounted agent memory advantage was demonstrated.

**Ledger Above Ego.**
