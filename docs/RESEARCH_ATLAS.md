# Research Atlas | Live React Navigation + Source Status

This document describes the user-facing **Research Atlas** added to the existing NBG GitHub Pages React website.

## What changed

Previously the React website contained a substantial interactive AH2–AH44 evidence ladder and early browser demos but **did not expose the PHMP/semantic memory or RB3 research folders as navigable website content**. Research merged successfully into the repository did not automatically become visible to visitors.

- A permanent top-level **Research Atlas** navigation link now points to `#research-atlas`.
- The full AH2–AH44 ladder remains accessible under **Core Labs → AH2–AH44 Evidence Ladder** (`#experiments`).
- The hero now points to both the new Atlas and the existing evidence ladder.
- Source-linked cards provide searchable access to **semantic memory E0/E1A/E1B**, PHMP 1–3, optical O1/O2, quantum-boundary Q1–Q3, Keyhole Budgets K1–K7, RB3 and R5 evidence-review stages, provenance, AH governance/time tracks, and other recent foundations.
- Filter by research family, search identifier/title/description, expand a bounded initial result set, and follow source links to actual repository documents.
- A **synthetic interactive polarity illustration** demonstrates why unsigned cosine ties and explicit signed-real and binary complex-phase comparators agree. It never imports private memory, sends requests, invokes Ollama, or attempts natural language negation parsing.
- Responsive styles preserve desktop, mobile and keyboard navigation.

## Important research and source boundaries

- `src/researchAtlasData.js` is an **editorial, committed snapshot** of actual source files, not a live Github API feed. Research statuses must be reviewed and manually updated when protocols change.
- A green CI workflow proves that selected tests passed; it does not mean a physical hypothesis, real-data model, external review, or AI retrieval improvement is verified.
- PHMP-SM1 E1B is an **operator-run local CLI** with no confirmed user-hardware Ollama experiment yet. This hosted GitHub Page does not request access to local Ollama or private memories.
- PHMP-3 reserved evaluation remains separately gated; ordinary test-suite success does not spend a reserved split.
- RB3 real-data fitting is **blocked pending independent source review**. Do not convert its passed extraction/packet tests into claims of independent signoff.
- The UI links to the existing licensed repository research and contains no copy of external ResonanceDB source code.

## Qualification

```bash
npm run test:research-atlas
npm run test:navigation
npm run build
```

If the existing project names the navigation task differently, `npm test` includes its `test:navigation` equivalent in the full chain. The release must keep the original interactive panels and their hash anchors intact.

Source link integrity is checked by `scripts/test_research_atlas.mjs`; all indexed source paths must exist in the repository. Navigation regression checks ensure existing `#experiments` is retained while `#research-atlas` becomes visible.


## ES-01 E6 | Local reviewer packet intake (DEV PILOT)

The [E6 local packet intake validator](ES01_E6_LOCAL_PACKET_INTAKE.md) accepts a previously exported E5 JSON draft (up to 256 KiB) in the browser without network submission. It compares protected source-bound fields against the locally bundled E0-E5 canonical dataset, rejects altered provenance and elevated approval flags, and permits inspection of notes as **untrusted text**. Its optional JSON receipt excludes the notes. A matching **unsigned** packet is **NOT authenticated**, independently reviewed or approved; E4 gates remain HOLD. Run `npm run test:es01-e6`.

## ES-01 E5 | Local reviewer handoff packets (DEV PILOT)

The [ES-01 E5 packet builder](ES01_E5_REVIEW_HANDOFF.md) is a browser-local workflow for making downloadable **DRAFT_UNVERIFIED** JSON review packets. Each packet binds the original source E0 record, E1 context, E2 audit, E3 draft question, E4 blocked readiness checklist and optional unverified reviewer notes. The export makes research gaps portable but **never** certifies review completion or alters source evidence. No server receives notes. Run `npm run test:es01-e5`.

## ES-01 E4 | Evidence review readiness (SCREENING REQUIRED)

The [E4 literature review-readiness ledger](ES01_E4_EVIDENCE_READINESS.md) adds a source-bound interactive review queue covering each of the ten E3 questions and six pending source-method/endpoint/replication checks. E4 is **not** a completed systematic review or an evidence-quality score. `NOT_EXTRACTED` never means a source omitted data, and `NOT_SEARCHED` never means no independent replication exists. All cross-study quantitative effect-separation inference remains **HOLD**. Run `npm run test:es01-e4`.

## ES-01 E3 | Falsifiability-first question contracts (DRAFT)

The [E3 question contracts](ES01_E3_FALSIFIABILITY_CONTRACTS.md) add an interactive, source-linked reader for ten *draft, untested, not-preregistered* research questions. Every candidate interpretation has an alternative, a possible disconfirming observation and missing-evidence requirements. No NBG empirical result, biological experiment, causal claim, or drug prediction follows. The E0 evidence registry, E1 comparison gates and E2 claim-custody records are unchanged. Qualification: `npm run test:es01-e3 && npm run test:research-atlas && npm run build`.

## ES-01 E2 | Claim provenance and source-scope custody (PROPOSED)

The [ES-01 E2 claim audit](ES01_E2_CLAIM_PROVENANCE.md) links every evidence-card observation to one manually reviewed primary abstract or regulatory page, states what that source supports, and explicitly refuses stronger therapeutic claims. This editorial review does not independently reproduce any biomedical study. Run `npm run test:es01-e2` for local integrity checks.

## ES-01 E1 | Conservative evidence comparison gates (PREPARED)

The [E1 comparability protocol](ES01_E1_COMPARABILITY_GATES.md) adds a source-linked, interactive *context-only* comparator for the ES-01 evidence registry. It blocks false rankings based on mismatched human, animal, regulatory or cell endpoints and makes required future controls explicit. This is a software review gate only; no new drug claims or real comparative treatment evaluation are made. Run `npm run test:es01-e1`.

## ES-01 | Effect Separation Atlas (LITERATURE / PROPOSED)

The Research Atlas now embeds an interactive ES-01 explorer with eight families (LSD, cannabis, opioids, psilocybin, DMT/5-MeO-DMT, MDMA, MDA and ketamine), source-linked evidence cards, relationship and evidence-type labels, full-text search, filters, and explicit claim boundaries. The [E0 protocol](ES01_EFFECT_SEPARATION_ATLAS.md) and [committed evidence data](../src/es01Evidence.json) distinguish regulatory indications, healthy-human Phase 1 safety, acute human pharmacology comparisons, and preclinical outcomes. The NBG mapping is only a proposed observability analysis: no molecular design, therapeutic validation, or biological experiments were performed.

Qualification: `npm run test:es01 && npm run test:research-atlas && npm run build`.

## CO-01 | Metabolite-gated chemistry (LITERATURE / PROPOSED NBG)

The Atlas indexes [CO-01](CO01_METABOLITE_GATED_CHEMISTRY.md), a 2026 *Nature Communications* cell-line proof of concept in which an albumin-stabilized palladium reagent uses endogenous CO to synthesize a phenanthridinone compound. The **published cell-line measurements** are source-attributed; the **NBG compartment/causal-Keyhole mapping** is a proposed analogy without biological validation. A normal fibroblast line also yielded detectable chemical product, and the measured cytotoxic selectivity was modest. No animal tumor-treatment or clinical result is claimed.

## Future maintenance

When a research PR introduces a new protocol, add a short, source-grounded record to `src/researchAtlasData.js`, choose the conservative correct status, run `npm run test:research-atlas` and the full build, and link it directly to the repository document. Never invent test results or promote a research candidate automatically.

**Ledger Above Ego.**

## EG-01 | Coupled Field Observability (SIMULATED)

The Atlas now includes a first-class React EG-01 workbench and a source-linked **Field & Gravity** research track. Visitors can vary normalized drive amplitude, inject a hypothetical extra coefficient, toggle deterministic perturbation and compare a single-orientation coarse Keyhole against a paired, fixture-mirrored observation. The single run cannot distinguish magnetic pickup from the injected extra coefficient because the design matrix is rank deficient; the paired configuration can recover the injected coefficient **under explicit synthetic fixture-invariance and proxy-calibration assumptions**.

Use the export button to download a **SIMULATED / authority NONE** JSON receipt locally. No real magnetic hardware, superconductor, gravity sensor or remote service is involved. Primary sources and limitations are documented in [EG-01 PROTOCOL](../experiments/EG01/PROTOCOL.md). The historical source is Amy Eskridge's [HAL5 December 2018 presentation](https://www.hal5.org/PDF/HAL5-Dec2018-Talk-AntiGravity.pdf), not evidence of an operating anti-gravity apparatus. The 2003 Hathaway et al. replication reported no gravity-like force within instrument sensitivity.

Qualification: `npm run test:eg01 && npm run test:research-atlas && npm run build`. All existing AH and PHMP frozen results retain their previous scope.

## EG-02 | Independent Model Audit & Differential Controls (SIMULATED)

The Atlas now includes a React force-forensics workbench at [#eg02](https://michaelwave369.github.io/NestedBubbleGear/#eg02). A conventional dipole force `F_z≈m_z·∂B_z/∂z` is contrasted against a **software-injected** fractional weight term and instrument offset. Source-linked cards distinguish the theoretical Li–Torr papers, Kowitt's critical analysis, and a **different** Podkletnov experiment whose replication found no apparent gravity-like response. This is an editorial publication-abstract audit, not an independent full-paper derivation.

The synthetic 2×2 mass/gradient-reversal design recovers coefficients only with the explicitly assumed constant magnetic pickup and offset. Disabling either contrast forces **NOT IDENTIFIABLE**. Default anomaly coefficient is zero. The browser asks for no permissions, performs no measurement and exports a locally generated `SIMULATED / authority NONE` JSON receipt only when requested.

[EG-02 protocol and source ledger](../experiments/EG02/PROTOCOL.md). Qualification: `npm run test:eg02 && npm run test:research-atlas && npm run build`.

## EG-03 | Maxwell–London static slab baseline (SIMULATED)

A new first-class Atlas React lab at [#eg03](https://michaelwave369.github.io/NestedBubbleGear/#eg03) compares a derived planar static London-field solution with an independently computed numerical finite-difference profile, contrasts an unscreened constant-field reference, and visualizes equal-and-opposite surface screening currents. UI controls vary the penetration length, slab thickness, surface field and numerical grid density; mesh-refinement diagnostics display discretization errors. The user can export a local `SIMULATED / authority NONE` JSON receipt.

The reference uses established London electrodynamics with a planar parallel-field geometry and no vortices or finite-sample demagnetization, and does **not** implement Li–Torr gravitational couplings. See [EG-03 experimental protocol, equations, source bibliography and scope](../experiments/EG03/PROTOCOL.md).

Run `npm run test:eg03 && npm run test:research-atlas && npm run build`. Existing EG-01, EG-02, AH and PHMP work remains unchanged.

## EG-04 | Permeability-variable identity / inference firewall (SIMULATED)

The Research Atlas includes [EG-04](https://michaelwave369.github.io/NestedBubbleGear/#eg04): a London slab comparison of the dimensionless macroscopic screening ratio `R=<B>/B_s` with a *deliberately invalid* proxy `1/R²`, inspired by the inverse-square dependence of **Li & Torr (1992), Eq. 48**. It shows how substituting a geometry-dependent screening ratio for a different microscopic permeability can fabricate huge-seeming amplification. This is an **audit of an inference**, not a full reproduction of Li & Torr or Kowitt, and the orange proxy is neither conductivity nor gravitational coupling.

EG-04 imports the verified deterministic **EG-03 conventional London solver**, exposes analytical screening, magnetic field energy per area, current cancellation, source access and methods, and offers locally generated `SIMULATED / authority NONE` JSON receipts. Full-text access to Kowitt is not yet verified. [Detailed claim-boundary/source protocol](../experiments/EG04/PROTOCOL.md).

Qualification: `npm run test:eg04 && npm run test:research-atlas && npm run build`. Earlier EG rungs and AH/PHMP are unchanged.

## EG-05 | Equation custody, source visibility and SI audit (SIMULATED)

The [EG-05 page](https://michaelwave369.github.io/NestedBubbleGear/#eg05) displays a complete, searchable source-custody ledger covering Li–Torr 1991, Li–Torr 1992 printed page 5493 Eqs. (46)–(50), printed page 5494 Eq. (54), and Kowitt 1994. The Li–Torr 1992 scanned paper has visual page confirmation. The 1991 and Kowitt full mathematical arguments remain **unreproduced**, with only publisher abstracts verified.

The live panel checks the **SI dimensions** of the finite relaxation-time form `σ₀=nˢq²τ₀/m` and the auxiliary time scale `τ₀=ℏ/(2πkBTλ*)` under a stated dimensionless λ* assumption. A separate conditional plot of the printed 1992 approximate scaling `σ~10⁻²⁹/μᵣ²` is explicitly not measured conductivity, nor the paper's complete Eq. (48)/(54) derivation. London bulk shielding ratio `R=<B>/Bs` is never accepted as an authenticated material `μᵣ`. The module exports `SIMULATED / authority NONE` receipts only on user request. [Full source/claim ledger](../experiments/EG05/PROTOCOL.md).

Qualification: `npm run test:eg05 && npm run test:research-atlas && npm run build`. Earlier frozen results untouched.

## EG-06 | Competing Predictions and Exact Causal Collisions (SIMULATED)

The [EG-06 Atlas experiment](https://michaelwave369.github.io/NestedBubbleGear/#eg06) compares a synthetic conventional force budget C0 (magnetic-dipole field gradient, current-even pickup, thermal lag, mechanical transient and offset) against a generic hypothetical X1 = C0 + fMgI² with known synthetic injections, two sample masses, signed-gradient reversal and a frozen 12-step drive. It uses the first 9 steps per fixture to fit, and the final 3 to check future-step errors. Linear least-squares, rank refusal, BIC and holdout RMSE are **software-model diagnostics only**. If either necessary intervention is missing, model attribution is refused.

A distinct mass-correlated conventional pickup `cMgI²` can exactly mimic the X1 term: datasets with `(f,c)=(0.015,0)` and `(0,0.015)` have identical force readings. Therefore good regression does not uniquely identify gravity or any mechanism. Historical Li–Torr and Kowitt claims are linked and explicitly not implemented as validated force models. JSON export is operator-initiated, `SIMULATED / authority NONE`.

[Read EG-06 protocol and provenance](../experiments/EG06/PROTOCOL.md). Qualification: `npm run test:eg06 && npm run test:research-atlas && npm run build`. Existing EG-01–05 and frozen AH/PHMP results remain unchanged.

## NI1 E1 | Neuroimmune causal Keyholes (SIMULATED ONLY)

A first-class, source-linked [NI1 browser lab](https://michaelwave369.github.io/NestedBubbleGear/#ni1) now presents five entirely invented worlds: no brain-to-cell edge, known conventional delayed connection, shared-driver impostor, detached sample, and instrument artifact. The lab compares a frozen known toy recurrence with a fitted lagged candidate on a 20-tick temporal holdout, shows raw correlation without causal interpretation, and can omit measured nuisance to demonstrate a false apparent connection.

The disconnected-sample null changes donor state only **after** sample separation while holding local sample history/environment/noise fixed. The post-detachment synthetic sample must remain exactly invariant. A separate donor-before-detachment contrast establishes why a sample can retain history without any remote control. A formal K0 Altermath witness tests whether coarse-identical states can have distinguishable futures after a declared intervention. These are **software fixtures**, not biology, telepathy or a published Israeli detached-blood experiment.

The model uses invented dimensionless coefficients and an oracle conventional recurrence. Good synthetic model recovery is not independent validation or an advantage over established modeling methods. All exports are operator-created local JSON receipts with origin **SIMULATED** and authority **NONE**.

[Read the E1 frozen computational protocol](../experiments/NI1/E1_PROTOCOL.md) and the [E0 literature mapping](NEUROIMMUNE_CAUSAL_KEYHOLES.md). Run \`npm run test:ni1 && npm run test:research-atlas && npm run test:navigation && npm run build\`. Earlier frozen results and reserved datasets remain unchanged.

## NI1 E1B | Causal collisions and isolated probes (SIMULATED)

The [NI1 E1B React lab](https://michaelwave369.github.io/NestedBubbleGear/#ni1-e1b) constructs two **exactly observationally equivalent** synthetic systems with different causes. Without a probe, two causal programs produce the same full passive traces, so a larger dataset or clever fit cannot uniquely identify the generating mechanism. The public UI reveals which generator was selected for education, but the *evaluator* receives only allowed time traces plus a declared intervention channel, not the generator's truth label.

Controlled software interventions contrast a neural-like input against a measurement/handling nuisance. Properly isolated probes distinguish the two invented causes; deliberately leaked probes trigger **REFUSE: FAILED CHANNEL ISOLATION** even when response curves change. The tool reports \`SIMULATED / authority NONE\`, exports local JSON only when requested, and never claims an isolated-blood effect, clinical outcome or mind-to-mind biological field.

Read the frozen [E1B protocol](../experiments/NI1/E1B_PROTOCOL.md). Run \`npm run test:ni1-collision && npm run test:research-atlas && npm run test:navigation && npm run build\`. E0/E1 and other frozen NBG datasets remain unchanged.
