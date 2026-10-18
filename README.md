# Nested Bubble/Gear (NBG)

[![CI](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml)
[![Pages](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml)
[![Code License: MIT](https://img.shields.io/badge/code-MIT-73ffc5.svg)](LICENSE)
[![Research Content: CC BY 4.0](https://img.shields.io/badge/research%20content-CC%20BY%204.0-8bc9ff.svg)](LICENSE_POLICY.md)

**Nested Bubble/Gear (NBG)** is an experimental mathematical and computational framework for studying systems in which coarse observables can hide causally relevant internal structure.

> **Core question:** When two states look identical through the current Keyhole, can an admissible future interaction reveal that they were never behaviorally equivalent?

## PHMP complex-phase correspondence track (experimental)

The [PHMP-1 H/S sanity benchmark](experiments/PHMP1/README.md) reproduces standard complex-unitary delayed observability and corrected loop-holonomy invariants with controls. Run `npm run test:phmp1`.

The [PHMP-2 native correspondence audit](experiments/PHMP1/PHMP2_AUDIT.md) is **PROPOSED**, not executed: frozen AH9/AH10 operators use real `SL(2,Z)` row-vector transport, whereas the H/S witness uses complex `U(2)` column vectors. A faithful mapping must be demonstrated, not assumed. Neither establishes new physics or an NBG-specific AI advantage.

## Live research site

**GitHub Pages:** https://michaelwave369.github.io/NestedBubbleGear/

The React site presents the research stack, interactive **Bubble Atlas**, canonical **Bubble Zoo**, Keyhole depth explorer, frozen AH experiment ladder, core equations, and claim firewall.

## Current stack

```text
NBG
  -> Conveyor
  -> Gear
  -> Altermath
  -> Keyholes
  -> Φ-System integration
  -> Ledger
```

- **NBG** — domains and interfaces.
- **Conveyor** — between-step/interface transport state.
- **Gear** — ordered recurrence and cycle-space current.
- **Altermath** — causally relevant structure hidden by coarse cancellation.
- **Keyholes** — observer projections and observability depth.
- **Φ-System** — task-typed convergence/control layer, maintained as a conceptually separate line.
- **Ledger** — replayable provenance.

## NBG-HORN-A1 · Finite Bulk / Persistent Boundary

[Interactive Gabriel's Horn laboratory](https://michaelwave369.github.io/NestedBubbleGear/#horn-a1) · [Formal protocol and controls](experiments/HORN-A1/SPEC.md) · [Reproduction guide](experiments/HORN-A1/README.md)

**HORN-A1** uses Gabriel's Horn as a classical calculus benchmark: the volume of the rotated curve y=1/x converges to π while its lateral area grows without bound. Its two-section **SIMULATED** observer model keeps bulk volume and the net orientation label equal, then defines a boundary-area-weighted probe that distinguishes the hidden label order. A richer Keyhole detects that order before intervention; uniform-weight and disabled-coupling negative controls erase the difference.

This is a newly proposed formal toy experiment, **not** empirical validation of Altermath or evidence of infinite information, energy, or physical influence. Run `npm run test:horn-a1` and `npm run receipt:horn-a1 -- --out horn-a1-receipt.json`. Origin `SIMULATED`; authority `NONE`. Frozen AH research packages remain unchanged.

## NBG-BC3 · Evidence Custody vs. Truth

[Interactive BC3 custody lab](https://michaelwave369.github.io/NestedBubbleGear/#boundary-custody) · [Finite protocol & falsifiers](experiments/BC3/SPEC.md)

BC3 extends BC2 with a **separate evidence custody gate** using two tiny, openly disclosed **insecure teaching key pairs**. All 16 source/edit worlds are evaluated under nine evidence regimes, for **144 exact simulated outcomes**. Duplicate records from one signer never satisfy a two-credential policy. Tampered signatures, unsigned claims and conflicting signed statements are refused. Two honestly agreeing signers allow **16/16 correct admissions** in the constructed example, while two independently credentialed but coordinated false claims produce **16/16 incorrect admissions**. This establishes a limitation of this finite policy: valid signatures and independent-looking signers cannot establish the underlying observation's truth.

No real biological, genomic or secure cryptographic system is being modeled or validated. All results have origin `SIMULATED`, authority `NONE`. Run `npm run test:bc3` and `npm run receipt:bc3 -- --out bc3-receipt.json`. See [experiments/BC3](experiments/BC3/).

## NBG-BC2 · Blind Lineage Recovery

[Interactive BC2 recovery lab](https://michaelwave369.github.io/NestedBubbleGear/#boundary-lineage) · [Frozen finite protocol](experiments/BC2/SPEC.md)

BC2 extends BC1 by **withholding the source/edit ground truth from the inference function**. It exhaustively enumerates 16 synthetic two-bit source/edit worlds across eight witness regimes (128 modeled evaluations). Destination-only inference correctly refuses four-way source ambiguity, a partial witness narrows that to two possible sources, and a full honest edit witness uniquely identifies the source. Two copied records with the same lineage cannot manufacture extra evidence. Hostile controls show both successful contradiction refusal and confidently **incorrect** attribution when witnesses are forged but mutually consistent.

This is a binary XOR thought experiment with `SIMULATED` provenance and `NONE` authority, not real genetics, viral evolution, source authentication, clinical prediction or empirical NBG validation. Run `npm run test:bc2` and `npm run receipt:bc2 -- --out bc2-receipt.json` to reproduce the finite study. See [experiments/BC2](experiments/BC2/).

## NBG-BC1 · Boundary-Crossing Persistence

[Live finite-state BC1 lab](https://michaelwave369.github.io/NestedBubbleGear/#boundary-crossing) · [Protocol and falsifiers](experiments/BC1/SPEC.md)

BC1 is a **SIMULATED**, exact 16-state boundary-transfer experiment inspired by the reported BC200-derived insertions in molluscum contagiosum virus (Gao et al., *Science*, 2026, [DOI:10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441)). The model keeps an existing source function active, requires external machinery plus an open interface for copying, and shows how identical recipient bits can hide different source histories. Controls disable either copying machinery or interface permission. K0, K1 and K2 distinguish initial snapshot, destination outcome and synthetic lineage.

**Claim firewall:** Binary toy rules are not genomic mechanisms, viral experiments, clinical predictions or empirical NBG validation. Run `npm run test:bc1` for the finite census, or `npm run receipt:bc1 -- --out bc1-receipt.json` for a deterministic SHA-256-identified `SIMULATED` receipt. See [experiments/BC1](experiments/BC1/).

## NBG-G1 · Geometry Keyhole

[Interactive Geometry Keyhole](https://michaelwave369.github.io/NestedBubbleGear/#geometry-keyhole) · [Frozen finite protocol](docs/GEOMETRY_KEYHOLE.md)

**G1** exhaustively checks all 35 free hexominoes against exact cube-face folding, with 11 positive cube nets and 24 negative shapes. Every sample gives the same coarse six-square observation; the richer structural Keyhole distinguishes foldability. A separate tesseract graph and 4D→3D projection witness demonstrate observer information loss without requiring physical higher-dimensional claims. Export a `SIMULATED` receipt from the live site, and reproduce the counts with `npm run test:g1`. Geometric correspondence is not evidence of cosmic imprisonment or Saturnian control.

## NBG-G2 · Dimensional Recovery

[Interactive recovery lab](https://michaelwave369.github.io/NestedBubbleGear/#dimensional-recovery) · [Frozen G2 protocol](docs/DIMENSIONAL_RECOVERY.md)

**G2** extends G1's hypercube projection witness with an exact sixteen-state GF(2) observer model. Choose which coordinates are visible, which probe families are authorized, which task must be resolved, and a synthetic query-credit budget. An exhaustive subset search computes the minimum-cost recovery plan and refuses unobservable or unaffordable tasks. The interactive site replays a state-specific evidence trail with candidate sets and exports `SIMULATED` receipts. Tests include all 512 subsets of the full probe library and all sixteen finite witness states. Costs are fictional and no extra physical dimensions or theological claims are inferred. Run `npm run test:g2`.

## NBG-G3 · Noisy Keyhole and Confidence Calibration

[Interactive G3 lab](https://michaelwave369.github.io/NestedBubbleGear/#noisy-keyhole) · [Frozen protocol](docs/NOISY_KEYHOLE.md)

G3 extends G2's noiseless recovery model with finite, analytically scored noisy parity-sensor observations. A true independent-error mechanism is compared to a shared-error mechanism; the observer may correctly model the regime or falsely presume every repeated reading is independent. **Matched inference is calibrated**, while repeated common-cause errors can cause misleadingly high confidence. A fixed example with 10% shared error, five identical readings and a 95% confidence requirement yields **90% actual accuracy versus 99.9983% reported confidence** for the naive IID observer. An aware observer refuses this 95% threshold. All numbers are exact theoretical expectations inside a toy model, not observed real-world events. The G3 lab includes exact decision coverage, accepted error, confidence calibration, outcome distributions, deterministic constructed witnesses and JSON receipts. Run `npm run test:g3`.

## Balance & Recovery Lab (NBG-BR1)

**NBG-BR1** adds a synthetic, dimensionless coupled-oscillator experiment to the live site. Explore reciprocal or asymmetric feedback, damping, frequency mismatch, and a velocity disturbance while comparing undisturbed and perturbed trajectories.

The lab distinguishes full-state **disturbance recovery** from a coarse **velocity-correlation Keyhole**, with reciprocal, directional, uncoupled, slow-recovery, unstable-gain, and zero-kick controls. It exports explicitly `SIMULATED` JSON receipts. Recovery and coordination are operational model outcomes only; this is **not** a claim about societal hierarchy, metaphysical duality, natural gears, or chaos.

See [the BR1 protocol](docs/BALANCE_RECOVERY.md) and run `npm run test:balance-recovery`.

## NBG-BR2 · Resilience Atlas

[Live Atlas](https://michaelwave369.github.io/NestedBubbleGear/#resilience-atlas) · [Frozen protocol](docs/RESILIENCE_ATLAS.md)

**BR2** extends BR1 with a **972-cell synthetic factorial sweep** across coupling, directional asymmetry, damping and detuning (9 × 9 × 4 × 3). The live React lab renders an accessible 81-cell slice with selectable recovery, matched reciprocal comparison, and velocity-correlation Keyhole views. Click a cell to inspect state-recovery vs reciprocal, and export a provenance-marked slice receipt.

The important distinction: high baseline velocity correlation is not evidence of recovery after disturbance. Directional coupling is not presumed intrinsically better or worse. All observations are limited to the dimensionless BR1 toy equations, **not physical or societal claims**.

Reproduce with `npm run test:resilience-atlas` and `npm run sweep:resilience-atlas`. For a SHA-256-stamped full-grid receipt use `node scripts/run_resilience_atlas.mjs --out br2-full-sweep.json`.

## NBG-BR3 · Recovery Robustness & Boundaries

[Live interactive explorer](https://michaelwave369.github.io/NestedBubbleGear/#recovery-robustness) · [Frozen protocol](docs/RECOVERY_ROBUSTNESS.md)

**BR3** challenges the BR2 recovery classification by changing the observation horizon (**38/60/120 s**), disturbed oscillator (**A, B, BOTH**), time step (**0.04/0.02**) and full-state recovery threshold (**0.03/0.06/0.12**). The deliberately bounded pilot covers **27 base parameter configurations**, **486 numerical integrations** and **1,458 threshold outcomes**. The live React explorer shows horizon rescues, kick-site sensitivity, threshold and step-size sensitivity, and high-correlation / nonrecovery Keyhole mismatches. The full sweep produces a deterministic JSON receipt with SHA-256.

BR1 and BR2 are preserved; BR3 cross-checks one overlapping case numerically against BR1. The results remain **SIMULATED** and cannot establish real-world physical stability, biological mechanisms, social hierarchy, metaphysical balance or chaos.

To reproduce: `npm run test:recovery-robustness`, `npm run sweep:recovery-robustness`.

## Temporal NBG (NBG-T)

NBG-T extends the same hidden-structure question across **history** rather than only a single present state.

A temporal model keeps versioned state, lineage, and two clocks:

- **valid time** — when an event belongs in the modeled world;
- **known time** — when evidence for that event entered the ledger.

The first executable rung, **NBG-T1**, freezes a synthetic witness in which two histories are identical through the coarse present Keyhole but retain different hidden lineage. The same later admissible probe reveals that difference. NBG-T1 also freezes no-hindsight replay and explicit counterfactual separation.

**NBG-T2** adds typed temporal relations so chronology, allegation, documentation, inference, contradiction, and supersession cannot silently collapse into the same generic arrow. It also freezes explicit Keyhole projection and narrow typed composition rules.

**NBG-T3** adds contradictory-source reconciliation: explicit source independence, duplicate-lineage detection, support/opposition ledgers, conservative dispute preservation, and an explicit refutation gate.

**NBG-T4** adds hostile dense-ingest semantics: generic source arrows become `ALLEGED_LINK`, chronological placement remains non-causal, adjacency creates no edge, unreadable labels become `UNKNOWN`, unsupported relations are refused, and analyst hypotheses stay on a separate layer.

**NBG-T5** adds evidence-linked review and Temporal Keyholes: reviewer actions append to a hash-chained ledger, earlier snapshots remain replayable, source status stays distinct from later review status, filters are pure projections, and analyst hypotheses remain a separate overlay.

**NBG-T6** exposes those semantics in the live GitHub Pages Temporal Keyhole Explorer with side-by-side cutoffs, evidence/relation filters, provenance inspection, ambiguity review, analyst overlays, ledger heads, and governed JSON export.

**NBG-T7** adds governed evidence-capture semantics: every retrieval becomes a hashed receipt, retrieval alone cannot alter review state, source-version drift is explicit, contradictions are preserved, and captured evidence can replay offline.

**NBG-T8** connects that contract to an operator-triggered read-only HTTP capture path and a governed review queue in the Temporal Explorer. Captures are persisted before review, host access is allow-listed, drift is visible, and browser ACCEPT/REJECT controls remain session projections until exported.

**NBG-T9** adds portable evidence bundles and a stable source registry: content-addressed objects are deduplicated, mirror captures do not manufacture independence, source drift survives export/import, reviewer identities remain attributed, and conflicting review decisions merge as `REVIEW_CONFLICT` rather than last-write-wins.

**NBG-T10** adds explicit trust-policy and conflict-resolution receipts: reviewer roles and authority are registered, policies are hashed data objects with quorum/weight/time rules, the same preserved disagreement can yield different named governance outcomes, and no policy outcome is presented as objective truth.

**NBG-T11** makes policy history bitemporal: policy versions have valid time and known time, registration/supersession/emergency events form an append-only ledger, side-by-side Governance Keyholes replay policy state without hindsight, and later policy changes never rewrite earlier resolution receipts.

**NBG-T12** adds explicit counterfactual governance branches: the observed policy ledger remains immutable, fork receipts pin the altered event and intervention, remove/delay/alter branches replay against the same evidence, divergence summaries identify the first outcome-changing Keyhole, and every branch is marked as counterfactual rather than observed history.

**NBG-T13** adds a deterministic Governance Sensitivity Atlas: admissible interventions are classified by target and temporal leverage, ledger-only negative controls are preserved, minimal intervention sets are enumerated, and no sensitivity result is promoted into a causal claim.

**NBG-T14** adds intervention-equivalence classes and Governance Residue: histories that are identical through one Governance Keyhole can split under a richer temporal query family, while ledger-different negative controls can remain behaviorally equivalent.

**NBG-T15** adds Adaptive Keyhole Synthesis: static observers minimize fixed Keyhole sets, adaptive observers choose the next query from the remaining ambiguity, restricted observer languages can explicitly refuse unseparable histories, and observer cost remains separate from epistemic value.

See [docs/TEMPORAL_NBG.md](docs/TEMPORAL_NBG.md), [experiments/NBGT1](experiments/NBGT1/), and [experiments/NBGT2](experiments/NBGT2/). See also [experiments/NBGT3](experiments/NBGT3/), [experiments/NBGT4](experiments/NBGT4/), [experiments/NBGT5](experiments/NBGT5/), [experiments/NBGT6](experiments/NBGT6/), [experiments/NBGT7](experiments/NBGT7/), [experiments/NBGT8](experiments/NBGT8/), [experiments/NBGT9](experiments/NBGT9/), [experiments/NBGT10](experiments/NBGT10/), [experiments/NBGT11](experiments/NBGT11/), [experiments/NBGT12](experiments/NBGT12/), [experiments/NBGT13](experiments/NBGT13/), [experiments/NBGT14](experiments/NBGT14/), and [experiments/NBGT15](experiments/NBGT15/).

## Cosmic-web application line (NBG-CW)

**NBG-CW1** opens a controlled physical-application track for cosmic-web filaments. It freezes a Keyhole/observer ladder, temporal-lineage discipline, baseline comparisons, closure-failure criteria and machine-readable receipts **before** any NBG result is claimed.

The purpose is not to argue that the cosmic web visually resembles NBG. CW1 asks whether interface-aware observables preserve future-relevant state that simpler coarse descriptions discard, and requires NBG to beat simpler capacity-matched baselines before promotion.

See [experiments/CW1](experiments/CW1/).

## Resonant-bubbles application line (NBG-RB)

**NBG-RB** tests whether nested systems exhibit state-dependent response spectra whose cross-scale coupling preserves future-relevant information.

The first rung, **NBG-RB1**, is intentionally adversarial to "magic frequency" claims. It freezes a source-lineage-held-out comparison between a frequency-only model and a preregistered multiparameter field/context model, with shuffled-boundary, label-permutation, and synthetic-window controls.

RB1 gives 7.83 Hz, 10.5 Hz, 14.1 Hz, and every other candidate frequency **no privileged status**. It is literature/computation-facing only and authorizes no human exposure or treatment claims. Direct-DNA EMF coupling remains a separate competing hypothesis rather than a premise.

See [docs/RESONANT_BUBBLES.md](docs/RESONANT_BUBBLES.md) and [experiments/RB1](experiments/RB1/).

**NBG-RB2** freezes the first literature corpus before modeling: 14 primary experimental EMF records across 11 source lineages, a grouped five-fold lineage evaluation schedule, an extraction/normalization schema, record digests, and a context-only registry that keeps endogenous planarian bioelectric work and the DNA-fractal-antenna debate out of RB3 predictive inputs.

See [experiments/RB2](experiments/RB2/).

**NBG-RB3-E0** freezes the executable comparison before any real literature-model result: deterministic frequency-only, multiparameter, shuffled-boundary and label-permutation arms; a planted synthetic positive control; train-only preprocessing; and hard source-lineage leakage checks. The real-corpus execution remains gated on a separately frozen condition-by-endpoint extraction table.

See [experiments/RB3](experiments/RB3/).

**NBG-RB3-R0** adds an auditable **partial** condition-by-endpoint extraction from the 2025 mouse spinal neural-stem-cell study: nine figure-level comparisons and a separate evidence ledger retaining reported means, p-values and assay details. The remaining RB2 sources remain in a review queue. Real model execution is now hard-gated on a separately reviewed complete input freeze, including exact source coverage and SHA-256 verification. R0 is not a biological result.

See [experiments/RB3/R0](experiments/RB3/R0/).

**NBG-RB3-R1** adds 18 additional **primary-text-attributed candidate rows** from the 2014 and 2016 PLOS embryonic neural-stem-cell experiments (both lineage L002), with figure/table/assay provenance, unknown-value discipline, tamper tests and a cross-assay predictor-collision audit. The combined R0+R1 extraction totals 27 rows across 3 source papers but only 2 of 11 lineages. The real model remains execution-blocked.

See [experiments/RB3/R1](experiments/RB3/R1/).

**NBG-RB3-R2** adds 29 more source-attributed candidate comparisons across three previously unrepresented lineages (L004, L007, L008), including significant increased, significant decreased and unchanged/non-significant cell-assay responses. R0+R1+R2 now cover 56 candidate rows, 6 RB2 papers and 5/11 lineages. The source evidence explicitly records device higher harmonics, indirect MTT growth proxies, cancer-cell-line limitations and missing per-arm p values. No actual literature fit is authorized.

See [experiments/RB3/R2](experiments/RB3/R2/).

**NBG-RB3-R3** adds 8 **provisional, abstract-attributed** comparison candidates from frozen studies in L003, L009 and L011, plus a five-study unresolved-source triage ledger. Combined candidate coverage reaches 64 rows, 9 papers and 8 of 11 source lineages, but pooled outcomes and missing per-arm statistics remain **pending primary-fulltext independent review**. The real-model execution gate stays closed.

See [experiments/RB3/R3](experiments/RB3/R3/).

**NBG-RB3-R4** freezes a source-versus-model-row **admissibility audit** for five unresolved papers. It documents the three still-unrepresented lineages (L005, L006, L010), quarantines pooled study conclusions, and adds a programmatic rule that a source record is not an eligible training row. The 64 existing candidate rows across 8 lineages remain **unreviewed, non-fit-ready evidence**, and real RB3 execution is still blocked.

See [experiments/RB3/R4](experiments/RB3/R4/).

**NBG-RB3-R5-E0** prepares the independent full-text review packet: all 64 candidate rows are enumerated with their RB2 lineage, DOI, original source locator, source-specific risk flags, stable SHA-256 fingerprints, and an explicitly **empty** reviewer-adjudication ledger. Machine-generated review readiness does **not** count as independent signoff. The real-model execution gate remains locked.

See [experiments/RB3/R5](experiments/RB3/R5/).

**NBG-RB3-R5-E1** adds a practical source-by-source review intake tool and targeted full-text evidence requests for the unrepresented L005/L006/L010 lineages. Templates for all 14 frozen sources embed the original candidate row hashes and risk warnings; structural validation rejects fabricated signoffs and cannot promote evidence or authorize any real model fit.

See [experiments/RB3/R5/E1](experiments/RB3/R5/E1/).

**NBG-RB3-R5-E2** builds a reviewer-facing evidence dispatch bundle with 14 source dossiers, SHA-256-verified row references, a GitHub Issues evidence-request form and an Actions artifact. Five sources without candidate rows remain explicitly classed as *missing evidence*, not null biological outcomes. This rung provides an independent reviewer handoff without recording any independent approval, changing the evidence or unlocking real model execution.

See [experiments/RB3/R5/E2](experiments/RB3/R5/E2/).

**NBG-RB3-R5-E3** adds an explicit primary-publisher HTML spotcheck and assay-readout timing crosswalk for 18 existing S001/S002 candidate rows. It catches the 2016 study's three-day *post-exposure* GFAP-cell assay lag and seven-day secondary-neurosphere count lag, without silently adding a model feature, inventing an outcome or claiming independent human review. Real RB3 fitting stays locked.

See [experiments/RB3/R5/E3](experiments/RB3/R5/E3/).

**NBG-RB3-R5-E4** runs an exact frozen-input identifiability audit across 64 existing candidate observations. **4 groups / 10 rows have identical original 13-feature vectors but opposing author-attributed outcome classes.** Original assay specificity and some post-exposure measurement timing explain why these are not necessarily contradictions of one biological measurement. The frozen predictors and all candidate rows are preserved; no independent review approval or real-data fit is authorized.

See [experiments/RB3/R5/E4](experiments/RB3/R5/E4/).

**NBG-RB3-R5-E5** proves a **candidate-only representational ceiling** for the frozen 13-feature deterministic classifier: the 64 unreviewed candidate rows map to 57 distinct exact feature vectors, with four opposing-label groups forcing at least four errors. A label-informed in-sample oracle therefore cannot match more than **60/64 (93.75%)** of these candidate labels, and the L002 subgroup ceiling is **14/18**. This is *neither a model fit nor held-out accuracy*. E5 also exposes frozen fold gaps in L005/L006/L010; no independent source review or real execution is approved.

See [experiments/RB3/R5/E5](experiments/RB3/R5/E5/).

**NBG-RB3-R5-E6** conducts a new scoped primary-source abstract search for the three missing RB2 lineages and distinguishes **10 source-level claims** by endpoint, comparator and readout window. S008 includes early versus late findings and between-exposure comparisons that cannot be relabeled as sham nulls; S009 has duration-dependent outcomes with no exact per-arm schedule; S013 has a multi-regime pooled null that cannot be multiplied into per-regime experimental rows. **No unverified training rows or independent reviewer attestations were created.**

See [experiments/RB3/R5/E6](experiments/RB3/R5/E6/).

**NBG-RB3-R5-E7** adds practical **two-reviewer evidence reconciliation**: two independently submitted E1 source-review drafts can be structurally compared for source/row-hash identity, exact figure/assay/exposure/comparator/statistic agreement, and disagreements requiring human adjudication. Reviewer names in draft JSON are *declarations*, never authenticated signatures. Matching eligibility proposals do **not** approve a row or authorize the original RB3 real-data fit.

See [experiments/RB3/R5/E7](experiments/RB3/R5/E7/).

**NBG-RB3-R5-E8** runs a **real Europe PMC metadata query** for all five frozen papers that still lack condition-level candidate rows. It matches original DOI/PMID/MED identities and can surface a possible legal open-access repository location when OA metadata and PMCID agree; it never downloads articles or equates a PDF indicator with an inspected original figure. Network failures are reported as unknown access. The reviewer ledger and real model stay locked.

See [experiments/RB3/R5/E8](experiments/RB3/R5/E8/).

## Epistemic provenance / Dream isolation

NBG memory now separates **epistemic origin**, **evidence status**, and **authority**.

Supported origins are:

`OBSERVED · VERIFIED · INFERRED · DREAMED · SIMULATED · UNKNOWN`

Core invariants:

`DREAMED != OBSERVED` · `SIMULATED != OBSERVED` · `REPETITION != EVIDENCE` · `MEMORY != FACT`

Dreamed and simulated memories may be retained and used for hypothesis generation, but retrieval preserves their origin and they cannot silently become factual through repetition, compaction, restart, merge, summary, import/export, or confidence.

See [docs/EPISTEMIC_PROVENANCE.md](docs/EPISTEMIC_PROVENANCE.md).

## PhiPie physical-memory ingress

NBG now has a governed ingress for PhiPie host-health episode memory. The importer accepts the pinned `NBG_EPISTEMIC_1` shape only when the episode remains `INFERRED`, routes to `DERIVED_MEMORY`, carries qualifying PhiPie journal evidence, and keeps `actionAuthorized=false`. Unknown bridge revisions, provenance drift, semantic promotion, and conflicting same-ID records fail closed.

See [docs/PHIPIE_PHYSICAL_MEMORY.md](docs/PHIPIE_PHYSICAL_MEMORY.md).

## PhiPie physical episode recall

NBG can now rank previously imported PhiPie host-health episodes by explicit structural similarity across changed signals, throttling flags, peak classification, close reason, and sequence duration. Recall is same-host by default, deterministic under candidate reordering, and always returns `causalClaim=false` and `actionAuthorized=false`.

See [docs/PHIPIE_PHYSICAL_RECALL.md](docs/PHIPIE_PHYSICAL_RECALL.md).

## PhiPie physical recall explanation

NBG now exposes deterministic evidence-linked explanations for PhiPie physical episode matches. Explanations identify shared and contrasting signals/flags, peak and recovery relationships, and exact source record fingerprints/evidence IDs while keeping causal claims, diagnosis, maintenance prescription, and action authority false.

See [docs/PHIPIE_PHYSICAL_EXPLANATION.md](docs/PHIPIE_PHYSICAL_EXPLANATION.md).

## PhiPie physical experience advisor

NBG can now turn repeated same-host episode evidence into conservative read-only investigation prompts. The advisor surfaces what evidence to inspect next while fixing diagnosis, safety conclusions, maintenance recommendations, physical actions, and hardware commands to false/null.

See [docs/PHIPIE_PHYSICAL_ADVISOR.md](docs/PHIPIE_PHYSICAL_ADVISOR.md).

## PhiBot physical experience handoff

NBG can now package bounded PhiPie physical-experience advisories into a portable PhiBot-facing handoff. The packet carries evidence references and uncertainty while explicitly granting no tool, hardware, safety, maintenance, or action authority. Any future tool use must pass an independent PhiOS/runtime authorization path.

See [docs/PHIBOT_PHYSICAL_HANDOFF.md](docs/PHIBOT_PHYSICAL_HANDOFF.md).

## Learned memory line (NBG-W)

**NBG-W1** freezes a run protocol for bounded learned causal memory without claiming a result. It separates exact append-only history (L), learned compression maps (Theta), and bounded replaceable active memory (M_t).

W1 fixes byte budgets, revocation semantics, same-capacity controls, held-out lineage evaluation, network size, optimizer, seeds, and a zero-tolerance unauthorized-read criterion before any training occurs.

See [experiments/W1](experiments/W1/).

**NBG-W1R** follows the reviewed W1 result with a structurally frozen coarse Keyhole so hidden distinctions cannot be carried by the Keyhole itself. See [experiments/W1R](experiments/W1R/).

**NBG-W1G** follows the reviewed W1R negative result by separating residue representation/commit from learned gate alignment. See [experiments/W1G](experiments/W1G/).

**NBG-W1H** follows the reviewed W1G gate-alignment failure with a one-variable successor protocol: remove the explicit keep-cost pressure while preserving the commit-aligned hard-gate path, controls, revocation semantics and provenance firewall. See [experiments/W1H](experiments/W1H/).

## Frozen AH ladder

| Rung | Focus | Outcome |
|---|---|---|
| AH2 | Latent causal residue | PASS · 29/29 |
| AH3 | Boundary-transferred residue | PASS · 89/89 |
| AH4 | Two-interface Altermath holonomy | PASS · 44/44 |
| AH5 | Noncommuting interface order | PASS · 36/36 |
| AH6 | Closed commutator loop | PASS · 41/41 |
| AH7 | Oriented holonomy cancellation | PASS · 65/65 |
| AH8 | Plaquette transport / curvature proxy | PASS · 63/63 |
| AH9 | Basepoint transport / local-to-global composition | PASS · 106/106 |
| AH10 | Three-plaquette transport / composition order | PASS · 158/158 |

See [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md).

## Mathematical heart

A working Altermath witness is:

```text
P(X) = P(X')
but
there exists an admissible future word w
such that
P(rho(w) X) != P(rho(w) X')
```

The states are observationally equivalent **now**, but not behaviorally equivalent under the allowed dynamics.

## Claim firewall

NBG maintains an explicit distinction between:

1. **demonstrated finite toy-model results**;
2. **formal machinery under development**;
3. **speculative physical interpretation**.

Read [CLAIMS.md](CLAIMS.md) before treating a mathematical toy result as evidence about horizons, cosmology, or fundamental spacetime. Humanity has enough problems without a GitHub README inventing another one.

## Repository map

```text
.
├── src/                  React research site
├── docs/
│   ├── BUBBLE_ATLAS.md   Bubble-family taxonomy
│   ├── BUBBLE_ZOO.md     Canonical toy behaviors
│   ├── CONCEPTS.md       Working vocabulary
│   ├── EXPERIMENTS.md    Frozen AH experiment ladder
│   ├── TEMPORAL_NBG.md   Temporal lineage / bitemporal model
│   └── ROADMAP.md        Next research rungs
├── experiments/
│   ├── AH9/              Frozen runnable rung
│   ├── AH10/             Frozen runnable rung
│   ├── NBGT1/            Frozen temporal-lineage rung
│   ├── NBGT2/            Frozen typed temporal-graph rung
│   ├── NBGT3/            Frozen source-reconciliation rung
│   ├── NBGT4/            Frozen hostile-ingest rung
│   ├── NBGT5/            Frozen evidence-review / Temporal Keyhole rung
│   ├── NBGT6/            Frozen Temporal Keyhole Explorer UI rung
│   ├── NBGT7/            Frozen evidence-capture adapter rung
│   ├── NBGT8/            Frozen live-adapter / review-queue rung
│   ├── NBGT9/            Frozen portable evidence-bundle rung
│   ├── NBGT10/           Frozen trust-policy / resolution-receipt rung
│   ├── NBGT11/           Frozen temporal policy-ledger / Governance Keyhole rung
│   ├── NBGT12/           Frozen counterfactual governance / divergence rung
│   ├── NBGT13/           Frozen governance sensitivity / minimal intervention rung
│   ├── NBGT14/           Frozen intervention equivalence / Governance Residue rung
│   ├── NBGT15/           Frozen Adaptive Keyhole Synthesis rung
│   ├── CW1/              Cosmic-web Keyhole closure protocol candidate
│   ├── RB1/              Resonant-bubble frequency-only closure protocol
│   ├── RB2/              Frozen EMF literature corpus + extraction contract
│   ├── RB3/              Frozen executable response-model semantics / controls
│   ├── W1/               Frozen bounded learned causal-memory run protocol
│   └── archive-index.json
├── CLAIMS.md             Claim-status firewall
├── CITATION.cff
├── LICENSE              MIT software license
├── LICENSE_POLICY.md     MIT / CC BY 4.0 scope map
└── .github/workflows/    CI + Pages deployment
```

## Development

```bash
npm install
npm run dev
npm run build
```

The Vite base path is configured for GitHub Pages at `/NestedBubbleGear/`.

## Research stance

NBG is an active research program, **not an established physical theory**. Frozen toy models are used to make precise questions executable and falsifiable before any broader interpretation is entertained.

## Archive

Frozen research releases and related work are archived through the **Enter the Field | Φ369 Research Lab** Zenodo community:

https://zenodo.org/communities/enter-the-field-phi369/records

## Licensing

NBG uses a deliberate split:

- **software/code:** MIT;
- **original research prose, figures, documentation, and research-content artifacts:** CC BY 4.0 unless a file/archive says otherwise;
- **third-party material:** retains its own terms.

See [LICENSE_POLICY.md](LICENSE_POLICY.md) for the exact scope and attribution guidance.
