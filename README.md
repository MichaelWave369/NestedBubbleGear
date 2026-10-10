# Nested Bubble/Gear (NBG)

[![CI](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml)
[![Pages](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml)
[![Code License: MIT](https://img.shields.io/badge/code-MIT-73ffc5.svg)](LICENSE)
[![Research Content: CC BY 4.0](https://img.shields.io/badge/research%20content-CC%20BY%204.0-8bc9ff.svg)](LICENSE_POLICY.md)

**Nested Bubble/Gear (NBG)** is an experimental mathematical and computational framework for studying systems in which coarse observables can hide causally relevant internal structure.

> **Core question:** When two states look identical through the current Keyhole, can an admissible future interaction reveal that they were never behaviorally equivalent?

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
