# NBG-EFG1 | Proposed simulation contract (E0, UNFROZEN)

**State:** PROPOSED / NOT YET FROZEN. **Date:** 2026-10-20. **Origin:** PROPOSED / INFERRED. **Authority:** NONE. **No run, results, performance improvement, participants, or causal effects are claimed.**

See the [motivation and claim firewall](../../docs/EMOTIONAL_FREQUENCY_GEARS.md). This E0 document is a plan for a *fully synthetic, independently testable* study. It does not revise AH, W, RB, IS1, PHMP or other frozen datasets or results.

## Primary question

When ordinary common causes, schedules, network exposure and autoregression are controlled, does introducing a mechanistically explicit **emotional-feedback pathway** provide incremental held-out predictive value for future group behavior?

The existence of human emotions influencing behavior is not the novel claim. The *specific NBG-EFG1 model*, causal distinctions, out-of-sample improvement and intervention response are not established.

## Population and process

- First candidate population: **250 synthetic agents**; no real-person records.
- Assign stable agent IDs, local time-of-day routines, heterogenous base rates, a fixed declared network, and schedule/community membership.
- Distinguish **phase** (declared event timing), **emotion proxy** (bounded scalar or vector with specified semantics), **action** (observed discrete behavior), **norm/expectation state**, **common driver** (shared external event), and **measurement error**.
- Include heterogeneity, missing observations, autocorrelation and exposure delays. No "human resonance frequency" constant and no unmodeled electromagnetic signal.
- Define a fully observable generative world for synthetic positive controls, plus an observer who can only read allowed Keyholes. Do not leak hidden parameters or target labels through observation or receipt metadata.
- Candidate agents update via (i) a time-of-day/schedule and intrinsic-state policy, (ii) explicit network exposure, (iii) optional feedback pathway, and (iv) declared threshold/delay/attenuation policy. Exact equations and constants require freezing before confirmatory evaluation.

## Four model arms (hypothesis-labeled; not results)

| Arm | Intervention | Purpose |
| --- | --- | --- |
| **A — Clock** | Matched schedules and shared external drivers; no between-agent emotional transmission. | Calibrate coordination from common causes alone. |
| **B — Emotional network** | Add explicit neighbor-state pathway while preserving A's schedules, shocks, graph and capacity budget. | Compare incremental held-out prediction and counterfactual transmission. |
| **C — Toothwork constraints** | Prespecified edge permissions, thresholds, saturation, delays or attenuation, plus capacity-matched controls. | Test whether interface policy changes propagation and stability. |
| **D — Spark / agency** | Permit a prespecified subset to revise their decision policies after observations, against non-revising and random-revision controls. | Test plasticity and norm persistence, **not** consciousness or spiritual liberation. |

The intervention arms alone do not identify the real-world importance of emotion; synthetic data can be constructed to make B win. Report outcomes under **both emotion-present and emotion-absent generative worlds**.

## Minimum baselines and negative controls

1. **Matched conventional forecast:** time-of-day, schedule, common-event covariates, autoregression and network exposure with comparable complexity.
2. **No emotional-coupling null:** same code path and seeds with the emotional pathway disabled, preserving all common drivers.
3. **Driver-only imitation:** correlated behaviors generated from common events **without** interpersonal contagion; require the method not to hallucinate emotional transfer.
4. **Shuffled-network / temporal-shift control:** preserve density and marginal frequencies but destroy relevant edge/timing alignment.
5. **Wrong-sensor / missingness controls:** corrupt emotional proxies or withhold history; predictions should degrade or abstain appropriately.
6. **Nonoscillator baseline:** flexible autoregressive/event-rate model; compare with phase-coupling without giving Kuramoto a free structural advantage.
7. **Unconstrained / randomized toothwork:** capacity-matched thresholds and random edge restrictions, measuring false gains from regularization.
8. **Agency negative control:** agents randomly flip a policy or revise with no new information; improvements cannot be attributed to awareness.

## Outcomes, falsifiers, gates

**Declare and freeze prior to running:**
- Primary outcome: a held-out proper score for next-step or next-window group action prediction (e.g. log loss or Brier score), including predefined cohort and time splits.
- Secondary outcomes: phase order parameter on *defined* repeated actions; cascade size; autocorrelation-adjusted affect-proxy correlations; recovery time after perturbation; norm persistence; false admission of contagion in driver-only worlds.
- Include confidence intervals or seed dispersion, leakage audit, equivalent parameter/model capacity, and a predeclared improvement threshold. Repeated seed exploration on the same evaluation set is not confirmation.

**Hard falsifiers / fail-closed conditions:**
- B does not beat a matched baseline on the independent evaluation split.
- The method infers contagion when only common drivers are present.
- Apparent gains vanish under proper network/timing or selection controls.
- C/D effects are matched by simple random-edge constraints or random policy switching.
- An observer succeeds only with illegal access to hidden state, test labels, or post-treatment data.
- A run lacks deterministic replay, full parameter manifest, or provenance receipts.

**Interpretation rule:** A successful toy demonstration validates behavior of the chosen *toy model*, not evidence that actual humans obey the invented dynamics. A fail result must be reported, not concealed or tuned away.

## Phased execution and evidence custody

1. **E0 — proposal (this PR):** publish claims, protocol, null explanations, and source ledger. No scored data.
2. **E1 — deterministic synthetic controls:** independently implement and test exact no-coupling/common-driver and known-coupling toy witnesses. Freeze random generator, seeds, graph family, data split, metrics, and admissible observational fields *before* a confirmatory test.
3. **E2 — prediction experiment:** benchmark baselines and arms against an untouched, prespecified test cohort. Report failures, ablations and paired uncertainty; no promotion if controls fail.
4. **E3 — optional external evidence:** only with independently reviewed consent, ethics, quality, privacy, selection/contagion identification and permission to use each source. External observational evidence cannot by itself justify direct causal claims.

**Receipt schema (planned, not generated):** `experiment=EFG1`, `phase`, `protocol_version`, `source_commit`, `origin=SIMULATED`, `authority=NONE`, `seed`, `generator_sha256`, `config_sha256`, `split_sha256`, `model_id`, `baseline_id`, `controls`, `metrics`, `decision`, `replay_command`. For real-source contexts, use true source attribution; don't relabel observed data as simulated.

NBG claim firewall remains authoritative. **No cosmic machine, Demiurge, consciousness, electromagnetic emotional energy, special frequency or physical regeneration result follows from EFG1.**
