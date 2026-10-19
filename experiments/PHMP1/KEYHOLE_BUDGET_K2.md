# Keyhole Budget K2 E1 | Temporal access and delayed-evidence observer pilot

**Status:** exploratory train/validation software benchmark. **Origin:** `SIMULATED`. **Authority:** `NONE`.
**Held-out cohorts untouched:** K2 seed 423, K1 seed 413, and the separately frozen PHMP-3 E2 memory seed 203.

## Why K2 exists

[K1](KEYHOLE_BUDGET_K1.md) demonstrated that an observer policy selecting informationally useful measurements can outperform fixed sensor choices on a constructed classification task, but an NBG-labeled implementation tied ordinary Bayesian information gain. K2 introduces changing *public* sensor quality, time-scoped permissions and delayed observations, while keeping a **properly informed conventional Bayesian competitor**.

The main scientific question is whether a bounded typed-observer system can choose permissible measurements and update its beliefs only when evidence becomes available. This phase **does not test an NBG-specific mathematical advantage**: the `nbg-provenance-keyhole` and `bayes-delay-aware` policies use exactly the same action-selection and Bayesian update rules.

## Defined synthetic hypotheses

Both classifications use equal prior probability and balanced hidden labels. The generator is based on deterministic, simulated binary parity outcomes inspired by established two-qubit correlations; **no physical quantum experiment is conducted**.

| Context | H0 | H1 | Informative sensor |
| --- | --- | --- | --- |
| `coherence` | `v=.90, gamma=0` | `v=.90, gamma=.65` | X |
| `visibility` | `v=.55, gamma=0` | `v=.95, gamma=0` | Z |

For each known context, tick and sensor, the likelihood for outcome +1 is:

```text
q(t) = [0.96,0.70,0.16,0.28,0.85,0.42,0.97,0.23,0.73][t mod 9]
P(Y=+1 | H, t, X) = (1 + q(t) * v_H * gamma_H)/2
P(Y=+1 | H, t, Z) = (1 + q(t) * v_H)/2
```

This time-dependent `q(t)` is **known and identical for all policy designs**. It is a quality-drift control, not a secretly inferred nuisance parameter or an adversarial change.

## Exact access, delay, and decision rules

- Discrete observation-request ticks: `0..17`, and terminal receipt delivery at `t=18`.
- Each case has **14 arbitrary observation-cost units**. X costs **1**, Z costs **2**.
- An X result arrives **2 ticks** after issuance. A Z result arrives **3 ticks** later. A request whose response would arrive after tick 18 is forbidden.
- X request authorization is revoked at `t mod 9 in {3,4}`; Z is revoked at `t mod 9 in {0,1,7}`. Permissions affect **new requests**, not future delivery of evidence authorized at issuance.
- A valid receipt records context, sensor, issuance tick, scheduled delivery tick, issuance authorization, sensor cost, likelihood snapshot, observation value, and unique issuance identity.
- The evaluator rejects early deliveries, duplicates, invalid snapshots, incorrect timestamps, unauthorized issuance, and overbudget requests. It updates posterior odds from a measurement **only at the delivery tick**, using the likelihood snapshot from issuance.
- The observer may stop requesting new measurements when the posterior reaches `>=0.98` or `<=0.02`; previously requested evidence still arrives before final classification.

**Important security limit:** these receipts are structurally checked JavaScript objects, not cryptographically signed evidence. An adversary able to rewrite both an event and all its expected fields could forge one. K2 establishes accounting/causality rules for this synthetic harness, **not tamper-evident external provenance**.

### Predeclared policies

1. `bayes-delay-aware`: a conventional *myopic* information-gain-per-cost policy using the true public likelihoods at request time, with a fixed delay discount `1/(1+0.1*delay)`. It requests the best allowed sensor with positive expected gain. **It is not proven to be a globally optimal POMDP policy.**
2. `nbg-provenance-keyhole`: precisely the same classical Bayesian rule and evidence processing, with an NBG-style name for the typed interface and ledger. **Identical per-case results are mandatory.**
3. `fixed-X`, `fixed-Z`, `alternating`: legal but intentionally limited comparison strategies. They obey identical permissions and receive evidence only upon delivery.

The same seeded potential outcome for each case/tick/sensor is supplied to whichever model legally requests that observation. No controller is passed the hidden label, future observation values, or an oracle. The final evaluator does retain the label for scoring.

## Data split and exact pilot scores

| Split | Public LCG seed | Cases per context × label | Total cases | Status |
| --- | ---: | ---: | ---: | --- |
| Train | 421 | 48 | 192 | Evaluated |
| Validation | 422 | 64 | 256 | Evaluated |
| Reserved | 423 | 128 | 512 | **NOT GENERATED OR EVALUATED** |

Validation results:

| Policy | Correct / 256 | Accuracy | Mean cost |
| --- | ---: | ---: | ---: |
| Classical delay-aware Bayesian | **182** | **71.09375%** | 13.50 |
| NBG provenance Keyhole | **182** | **71.09375%** | 13.50 |
| Fixed X | 162 | 63.28125% | 13.00 |
| Fixed Z | 148 | 57.8125% | 14.00 |
| Alternating | 167 | 65.234375% | 14.00 |

The classical and typed Keyhole policies tie because they are the **same algorithm**. The smaller score compared with K1 should not be interpreted as regression: K2 has different noise, latency, access rules, time horizon and budget.

These are descriptive, synthetic, in-sample development/validation outcomes; **no inferential significance or broad engineering-performance claim** follows. The fixed competitors are weaker controls, not the strongest possible classical decision strategies.

## Reproduce

```sh
npm run test:phmp-keyhole-k2
node scripts/test_phmp_keyhole_k2.mjs --out k2-local-receipt.json
```

No external packages required beyond Node.js built-ins. `--out` writes a new receipt with deterministic SHA-256 and refuses overwrite. No receipts are written in the standard test run.

The runnable code independently checks reproducible fixture generation, both controlled null-information sensors, quality drift, permission schedules, delivery causality, issuance snapshot integrity, duplicate receipt rejection, same-permission delayed delivery, budget accounting, and **exact NBG/Bayesian per-case parity**. The synthetic receipt summarizes 192 training and 256 validation cases only.

## What should be tested next

The proper K3 challenge is **not** to relabel a known Bayesian policy as NBG. Introduce previously unknown sensor-state nuisance parameters, independent adaptation/calibration data, costed delayed observations, authenticated provenance, and honest classical Bayesian filtering/POMDP competitors. If an NBG-inspired implementation gains something under equal resources, separately freeze the prediction before unseen evaluation. If ordinary policies tie or outperform it, that is the result.

The protocol concerns bounded software decision-making, not new electrodynamics, relativistic causality, Dirac-spinor hardware, physical quantum information, or energy recovery.

**Ledger Above Ego.**
