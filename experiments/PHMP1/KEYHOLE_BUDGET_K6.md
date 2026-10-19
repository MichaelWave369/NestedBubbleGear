# Keyhole Budget K6 E1 | Source contamination and hash-linked evidence

**Status:** exploratory TRAIN/VALIDATION-only synthetic benchmark. **Origin:** `SIMULATED`. **Authority:** `NONE`. **No physical sensing, cryptographic authenticity, NBG quantum effect, or novel inference advantage is claimed.**

## Why this rung exists

[K5](KEYHOLE_BUDGET_K5.md) tested restricted vs expanded Bayesian reliability-change models. K6 tests **briefly contaminated observation sources** whose outputs become anti-correlated with the true reference for specific windows, including windows **outside a candidate model's duration support**.

This is a small synthetic design, not a general adversarial security evaluation. The scenario and controller rules were developed and inspected on the reported train/validation samples, so these are **exploratory**, not independent confirmatory results.

An earlier prototype of K6 made the clean sensor signal so easy that controllers often stopped *before an attack*. The current frozen E1 code changes the good/bad correctness probabilities to **0.75/0.25** and explicitly measures how often policies issue reads during active contamination. Without this **attack-exposure check**, a high score would be nearly meaningless.

## Synthetic world

Each episode has a binary hidden label `H ∈ {0,1}`, and sensors X and Z. Outside attacks, each sensor returns the true value with `P(correct)=0.75`. During an attack, this flips to `P(correct)=0.25`: the source becomes systematically misleading, not merely noisier.

Two observation types are available:

- `target`: read the unknown hidden H through the chosen sensor.
- `calibrate`: read a *known reference value of 1* through the same sensor. A failed known-reference calibration can reveal compromised reliability, but is not direct oracle access to the hidden H.

The nine **fixture plans** are:

| Plan | X attack | Z attack | Test group |
| --- | --- | --- | --- |
| clean | None | None | clean |
| early-X | ticks 3–5 | None | shifted |
| early-Z | None | ticks 4–6 | shifted |
| late-X | ticks 7–10 | None | in-support |
| late-Z | None | ticks 8–11 | in-support |
| long-X | ticks 5–10 | None | **out-of-support** |
| long-Z | None | ticks 3–8 | **out-of-support** |
| staggered | ticks 3–5 | ticks 8–10 | joint |
| simultaneous | ticks 6–7 | ticks 6–7 | joint |

Each is balanced across H=0/H=1. A source can recover from an attack without the observer being told the recovery occurred.

The **restricted classical model** supports only *no attack*, *X attack from tick 6 for 3 ticks*, or *Z attack from tick 6 for 3 ticks*. It has six joint H/scenario states.

The **robust classical model** supports no attack; a single X or Z attack starting at any tick in `{2,...,9}` with duration 2, 3 or 4; plus the two declared staggered/simultaneous patterns. It knows a broader *possible* attack family, **not the actual true scenario**. Critically, it **does not include the 6-tick long attacks**, so those are truly outside its modeled support. This remains a finite known-rate parametric model, not resistance to arbitrary new failure mechanisms.

## Time, cost, permissions and provenance

| Constraint | Fixed value |
| --- | --- |
| Request window | 14 ticks, 0–13; final pending deliveries at tick 14 |
| Measurement cost budget | 12 dimensionless units per case |
| Target reading | cost 2; delay 1 tick |
| Known-reference calibration | cost 1; delay 2 ticks |
| X authorization | forbidden on new requests at `t mod 7 == 3` |
| Z authorization | forbidden on new requests at `t mod 7 == 0` |
| Posterior stop | no new requests beyond belief ≥ 0.975 or ≤ 0.025 |
| Bayesian update | Only on delivery, using **the observation issuance tick** |

**Hash-linked ledger:** every legally issued receipt records sensor/type, observation bit, issuance time, due time, known-reference label, cost, authorization-at-issue, predecessor digest and its own SHA-256 hash. Upon arrival the evaluator checks the full ledger hash-chain prefix, receipt membership, digest, permissions, timing, duplicate exclusion and claimed reference. The simulated decision controller gets no unrequested observations or hidden true contamination state.

**Security limitation:** a hash chain without an independently trusted checkpoint, digital signature or externally anchored hash **cannot authenticate the author or prevent a privileged adversary from rewriting and rehashing the entire chain**. This test demonstrates in-process detection of *unsynchronized tampering*, including mutated receipt bits, dates, references and previously recorded entries, not cryptographic proof of provenance in an untrusted system.

The anti-hindsight audit separately establishes that a sensor may recover after a request but before its result is delivered. Likelihoods must still use the **sensor state at issuance time**, not the delivery-time state.

## Fair policy candidates

- **`restricted-target-bayes`**: conventional target-entropy gain per cost using the restricted six-state posterior.
- **`robust-target-bayes`**: conventional target-entropy gain per cost using the expanded possible-attack posterior; may select calibrations when informative to the task.
- **`robust-joint-bayes`**: conventional full joint-state entropy gain per cost using the same expanded model.
- **`classical-cusum-audit`**: a declared **CUSUM-style** known-reference calibration check that accumulates evidence for bad reliability and can trigger further audit; combined with target-focused Bayesian inference. It is a heuristic variant, *not* a formally calibrated or globally optimal CUSUM procedure.
- **`nbg-quarantine-keyhole`**: independently specified NBG-style typed/quarantine rule. A failed calibration or sufficiently surprising target reading can quarantine that interface for a few ticks and request new calibration evidence. It uses the **same conventional expanded Bayesian belief**; the extra quarantine rule is the only distinctive decision-policy component. It has **no secret knowledge of attacks**.
- **`fixed-X`**: a simple legal X-only conventional control.

All models receive the same deterministic, seeded *potential outcomes* when they legally request them. Only the test harness holds the true label and attack plan. Equal **external measurement cost** constraints do not imply equal computation/memory or CPU use; the expanded Bayesian posterior is larger than the restricted posterior. The classical Bayesian policies are myopic, not certified POMDP-optimal.

## Splits and evidence discipline

| Split | Seed | Cases per (plan, label) | Total | Status |
| --- | ---: | ---: | ---: | --- |
| Train | 461 | 4 | 72 | Evaluated |
| Validation | 462 | 6 | 108 | Evaluated |
| Reserved | 463 | 12 | 216 | **NOT GENERATED OR SCORED** |

The source **rejects any fixture-generator split other than train/validation**; it never invokes the K6 reserved seed. All earlier Keyhole K1–K5 reserved cohorts and PHMP-3 E2's seed 203 remain untouched.

These public seeded arrays are not cryptographically blind. After inspection of validation, do **not** call an adjusted pilot confirmatory evidence; future reserved evaluation requires a separately reviewed, pinned, one-shot gate and frozen analysis plan.

## E1 exploratory validation

| Policy | Correct / 108 | Accuracy | Brier ↓ | Mean cost |
| --- | ---: | ---: | ---: | ---: |
| Robust target-focused Bayes | **91** | **84.2593%** | **0.108996** | 10.9259 |
| Fixed X | **91** | **84.2593%** | 0.120237 | 10.8519 |
| Robust joint-state Bayes | 89 | 82.4074% | 0.114574 | 12 |
| Restricted target-focused Bayes | 88 | 81.4815% | 0.140269 | 10.9259 |
| Classical CUSUM-style audit | 81 | 75.0000% | 0.159262 | 12 |
| NBG quarantine Keyhole | 81 | 75.0000% | 0.166548 | 12 |

The NBG quarantine policy does **not** outperform the matched target-focused classical Bayesian policy and does not even outperform the classical CUSUM-style audit on Brier score.

### Actual contamination exposure

The test records a compromised request only if a policy **actually issued** a measurement of a contaminated sensor *during its active attack window*. An attack merely appearing in the world specification does not count as an exposure.

| Policy | Compromised requests (whole validation) | Exposed episodes in 24 long-attack cases | Correct in 24 long-attack cases |
| --- | ---: | ---: | ---: |
| Restricted target Bayes | 56 | 20 | 19 |
| Robust target Bayes | 48 | 12 | 21 |
| Robust joint Bayes | 158 | 24 | **23** |
| Classical CUSUM-style audit | 99 | 24 | 19 |
| NBG quarantine | 108 | 24 | 19 |
| Fixed X | 70 | 8 | 21 |

**Important comparison limitation:** exposure frequency itself varies by policy because policies choose different sensors, issuance ticks, calibration requests, and stopping times. Higher attack exposure can be a consequence of policy behavior, not a fair fixed dose of corruption. These are descriptive paired-policy results; the exposure table is an audit that the experiment *actually exercised its attack mechanisms*, not a causal adjustment for attack severity.

On the long-attack subset, robust joint Bayes scored 23/24 while robust target Bayes scored 21/24. However, this is **24 cases**, and the result does not justify superiority claims. The broader 108-case sample is also far too small to assert narrow differences between the competing strategies. Repeated deterministic Monte Carlo rounds and prospective holdouts would be needed.

## Reproduce

```sh
npm run test:phmp-keyhole-k6
node scripts/test_phmp_keyhole_k6.mjs --out k6-e1-local-receipt.json
```

The test uses built-in Node.js modules only. Regular `npm test` writes no receipt and does not touch any reserved cohort. The `--out` option **creates a new JSON receipt** using exclusive file creation (refuses overwrite) with a deterministic SHA-256 summarizing the full result. The script includes hard checks of wrong timing, revoked issuance, duplicate receipt, altered bits/reference/digest, prior ledger-entry mutation, model support and issuance-time likelihood differences.

**Result classification:** `EXPLORATORY_SYNTHETIC_CLASSICAL_BAYESIAN_CONTROL_LEADS`. No physically observed entanglement, novel NBG theory, agent deployment reliability, malicious-input security guarantee, or hardware energy reduction is established.

**Next meaningful experiment:** a prospective source-corruption task with adversarial timing outside the known support, separate calibrated CUSUM/change-point controls, device-external signed/anchored evidence receipts, and explicit cost/performance uncertainty. Freeze hypotheses before evaluating untouched data.

**Ledger Above Ego.**
