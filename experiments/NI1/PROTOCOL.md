# NBG-NI1 E0 | Neuroimmune Keyhole: proposed falsification and simulation contract

**Version:** NI1-E0-draft-0.1.0. **State:** PROPOSED / UNFROZEN / NOT EXECUTED. **Date:** 2026-10-25. **Origin:** INFERRED/PROPOSED (literature references SOURCE-ATTRIBUTED). **Authority:** NONE. There are no measurements, trained parameters, human participants, clinical effects, or synthetic results. Do not disturb frozen NBG AH, RB, PHMP, EFG1, or IS1 results or reserves.

## Preregisterable research question

When two multi-compartment systems have the same coarse observed immune readout, can explicit physiological pathway history and predeclared interventions distinguish their future dynamics better than a matched ordinary-delay/history baseline? In contrast, can any detached-sample signal be explained without a hypothetical direct remote donor-to-sample edge?

**Primary deliverable at E0:** an independently auditable source ledger, causal graph, and future simulation contract. Publication of this text is not preregistration or an executed study.

## Competing generative models (proposed)

- **M0 / conventional common-driver and persistence:** observed immune trajectory predicted using sample baseline, time, environmental conditions, ordinary immune autocorrelation, and recorded common drivers. Detached samples evolve locally, without donor signal.
- **M1 / explicit in-vivo neural–immune mediation:** M0 plus named, physiologically plausible sympathetic/vagal/endocrine connections, with declared delays and intervenable links. This is a *within-body* pathway model.
- **M2 / history dependence:** M1 plus a slowly varying, unobserved local physiological history parameter. Under a coarse Keyhole, two states may appear identical until a lawful intervention separates their readouts. Model-based, not an asserted neural memory discovery by NBG.
- **M3 / putative direct donor-to-detached-sample coupling:** a deliberately **unsupported**, separately labeled adversarial hypothesis. Only accepted as a scientific candidate if an externally reviewed laboratory protocol supplies independent, reproducible channel-specific evidence and rules out conventional paths, information leakage, and acquisition artifacts. It must never be selected merely because a synthetic M3 injection is recoverable.

Do not use mood, awareness, fear, or laughter as an invented frequency or substitute them for measured neural/cellular variables. Each `T_ij` edge needs named carrier, units, geometry, delay, and a measurable receptor/mediator to claim physiological interpretation.

## Keyholes and observables

| Keyhole | Allowed observables | What it cannot identify |
| --- | --- | --- |
| K0 | one immune trajectory, broad mood label, time | unique mechanism, cellular subtype, causality |
| K1 | K0 + declared sympathetic/vagal or endocrine proxies, immune-cell classes, covariates | causal pathway from observational association |
| K2 | K1 + known randomized *synthetic* neural-edge intervention, blinded held-out responses | real-human mechanism, clinical benefit |
| K3 | K2 + sample detachment timestamp, temperature, media chemistry, microscope illumination, frame timing, sham/swap labels, instrument drift | novel nonlocal channel without independent source-specific evidence |

Endpoint candidates must be measured separately: macrophage phagocytosis, monocyte function, cytokines, leukocyte trafficking, inflammation magnitude, bacterial load, vaccine antibodies, and gut microbiota are not equivalent markers. The 2026 attention paper's histamine wheal/flare is an acute tissue readout and must not become an infection-defense proxy.

## E1 synthetic-only test protocol, to freeze before execution

Design deterministic, versioned numerical generators for at least these worlds:

1. **No pathway:** M0, zero brain-to-immune mediated edge; independent noise streams. Fit must not hallucinate M1/M3.
2. **Known conventional path:** M1 with a single known delayed sympathetic or vagal effect. Test recovery/ablation under correct units and complete intervention history.
3. **Shared driver impostor:** correlated mood and immune outputs caused by a common event, with no mood-to-cell edge. Require null admission.
4. **Stored state after separation:** donor condition changes initial sample composition at extraction, then *no further donor influence*. A persistent sample response is not remote signaling.
5. **Acquisition artifact:** changes in temperature, phototoxicity, agitation, focal drift, bacterial growth conditions, and timestamp mismatch that can mimic an 'awakening' or directional switch.
6. **Hidden-state Altermath witness:** pair X/X' with identical K0 output but a prescribed later response to a permissible intervention, while controlling model capacity and observation access.
7. **Hypothetical positive-control M3 injection (optional only):** separate from real-world inference, ensure classifier can detect a known injected remote path without inferring such a path in null worlds.

All datasets **SIMULATED**, with no blood, bacteria cultures, biological samples, clinical measurements, or human experimentation. No unsafe wet-lab instructions.

## Tests and falsification

- Freeze generator code/version, seeds, states, exact observation schedule, split by independent simulation world, parameter sweep, noise/disturbance regimes, null frequency, and the full evaluation algorithm **before** confirming E1/E2 performance.
- Separate initialization state, subsequent environment, and donor state *after separation*; incorrectly leaking initial donor labels across time must fail.
- Use matched model complexity and conventional baselines including lagged regression, state-space model, AR models, and common-driver controls; no special NBG credit for naming a recurrent state "Gear."
- Required negative tests: temporal label permutation that respects autocorrelation; donor-sample swap; false-positive rate in disconnected worlds; environmental nuisance adjustment; blinded analysis; missing-data refusal.
- Outcomes: held-out proper prediction score (e.g. log loss), calibration, false positive rate of remote linkage, ablation-specific causal recovery, intervention discrimination at an explicitly declared Keyhole, and seed/world uncertainty intervals.
- Do not promote if a model 'wins' only with ground-truth access, post-treatment leakage, uncontrolled lag search, trivial injection, or a confounded sample timeline.
- A fitted parameter or a statistical score alone cannot prove biological mechanism. Model identifiability must be argued from interventions and independent observable restrictions.
- Real human/device studies are **outside authorization**, require consent, competent supervision, independent ethics approvals, specialist review, and source-data licenses.

## Gates

- **E0: literature/source and risk note (this PR)** — documents a question only.
- **E1: synthetic replay** — implement and test conventional/common-driver/hidden-state/disconnected controls and publish SIMULATED receipts; no physical discovery.
- **E2: independent existing-data review (future)** — freeze legal, consent-compatible dataset, source corrections, preprocessing, external validation and controls. Broad observational effects permit limited associations only.
- **E3: human or physical channel study (not authorized)** — external preregistration and ethics review; independent calibrated study with legitimate and blinded controls. A separated-blood claim remains unsupported absent reproducible channel-specific evidence.

## Planned receipt fields (none generated yet)

```text
experiment=NI1; phase; protocol_version; source_commit; source_uri;
origin=SIMULATED|OBSERVED; authority=NONE (unless independent review);
generator_version; seed; split_manifest; measurement_units; causal_edges;
sample_detached_at; donor_condition_blind_id; sample_condition_blind_id;
keyhole; baseline; intervention; negative_controls; disturbance_manifest;
metrics; uncertainty; null_rejection; decision; replay_command;
literature_claims_checksum; excluded_inferences
```

Links: [literature and NBG mapping](../../docs/NEUROIMMUNE_CAUSAL_KEYHOLES.md), [EFG1](../EFG1/PROTOCOL.md), [IS1](../IS1/PROTOCOL.md). The viral story is **unverified** and no role of DNA, family connection, special frequency, remote blood activation, or healing by mental state is established.

**Ledger Above Ego.**
