# Temporal Nested Bubble/Gear (NBG-T)

NBG-T extends Nested Bubble/Gear from a single-state observability question to a **versioned causal-state history**.

The working object is a family of states:

```text
NBG(t0), NBG(t1), ..., NBG(t_now)
```

with replayable events connecting them and Keyholes controlling what an observer may distinguish at each cutoff.

## Two clocks: valid time and known time

Historical modeling needs two different clocks.

- **valid time** — when an event belongs in the modeled world;
- **known time** — when evidence for that event entered the ledger.

A claim can therefore concern an earlier time without being available to an earlier observer. NBG-T replay must never use later knowledge to silently improve an earlier snapshot.

This is the anti-hindsight rule.

## State layers

A temporal state may contain several layers:

```text
macro state
latent state
claims
observations
lineage
provenance
```

Different histories can project to the same macro state while retaining different latent lineage. If an admissible later interaction reveals that difference, the histories were not behaviorally equivalent under the richer dynamics even though the coarse present Keyhole identified them.

## Evidence state is part of the graph

NBG-T uses explicit evidence labels rather than treating every edge as equally established:

```text
OBSERVED
CORROBORATED
INFERRED
DISPUTED
ALLEGED
REFUTED
UNKNOWN
```

These labels record epistemic/provenance state. They are not a magic truth oracle.

## Epistemic origin is separate from evidence state

The live Temporal NBG retrieval layer now attaches a first-class epistemic envelope to retained records through `src/epistemicTemporalView.js`, while the frozen NBG-T6 `src/temporalKeyhole.js` semantic core remains byte-identical.

Epistemic origin answers **how the memory entered the system**:

`OBSERVED · VERIFIED · INFERRED · DREAMED · SIMULATED · UNKNOWN`

This is independent of the claim's evidence state and independent of authority.

For example:

```text
origin = OBSERVED
relation = ALLEGED_LINK
sourceStatus = ALLEGED
```

means the system directly captured a source making an allegation. It does not convert the allegation into an observed causal fact.

Review evidence may be appended to the epistemic evidence list, but it does not silently promote origin. Promotion requires a separate evidence-bearing transition receipt.

Dreamed and simulated memories remain logically isolated as possibility memory and must retain their origin through retrieval, summary, compaction, export/import and handoff.

See [Epistemic Provenance / Dream Isolation](EPISTEMIC_PROVENANCE.md).

## Relation semantics matter

These statements are not equivalent:

```text
A occurred before B
A interacted with B
A influenced B
A caused B
someone alleged a connection between A and B
```

A temporal graph must keep those relation types separate. Visual adjacency or chronology alone is not a causal operator.

## Counterfactuals are a separate product

Observed replay and counterfactual replay must remain distinguishable:

```text
OBSERVED
COUNTERFACTUAL
```

A counterfactual can test model dependence by explicitly excluding an event and replaying the frozen rules. It does not claim that the resulting branch is what reality would actually have done.

## Why this fits NBG

The original NBG question asks whether two states that look equal through a current Keyhole can respond differently to an admissible future interaction.

NBG-T applies the same logic across historical lineage:

```text
same coarse present
!=
same retained history
!=
same future response
```

This makes temporal provenance a natural extension of hidden causal residue rather than a separate diagramming feature.

## Dense timeline maps as stress tests

Large historical or conspiracy-style timeline maps can be useful **hostile ingest fixtures**, but not trusted source graphs. Their nodes and arrows must first be decomposed into typed claims, evidence grades, sources, dates, and explicit uncertainty.

That conversion is the research task. The original visual map is not the ground truth.

## First executable rung

[NBG-T1](../experiments/NBGT1/) freezes the first synthetic temporal-lineage witness with:

- valid-time / known-time replay;
- no-hindsight snapshots;
- coarse-equivalent but lineage-distinct histories;
- a future probe that exposes the hidden difference;
- explicit evidence labels;
- explicit counterfactual receipts.

## Second executable rung

[NBG-T2](../experiments/NBGT2/) freezes typed temporal graph semantics:

- explicit relation classes for chronology, membership, funding, operation, documented interaction, inferred influence, allegation, contradiction, and supersession;
- evidence state that may strengthen without silently rewriting the relation type;
- contradiction preservation rather than last-write-wins collapse;
- explicit Keyhole projection;
- observed/counterfactual separation;
- canonical replay under irrelevant input/source ordering;
- narrow typed composition, with unsupported relation pairs refused.

The frozen safety idea is intentionally boring and therefore useful:

```text
chronology != influence
allegation != documentation
adjacency != causation
```

NBG-T3 is reserved for contradictory-source reconciliation and source-independence semantics.

## Third executable rung

[NBG-T3](../experiments/NBGT3/) freezes contradictory-source reconciliation semantics:

- source independence is explicit, never inferred from URLs or filenames;
- mirrors/reprints remain visible but do not create independent corroboration;
- support and opposition can coexist without forced collapse;
- derived summaries never replace the evidence ledger;
- later-known evidence changes only later knowledge snapshots;
- REFUTED requires an explicit frozen decision rule rather than record majority;
- counterfactual source removal remains separate from observed history.

The next temporal rung is NBG-T4, a hostile dense-ingest stress test.

## Fourth executable rung

[NBG-T4](../experiments/NBGT4/) freezes hostile dense-ingest semantics using a small synthetic derivative of the motivating Q-web map's structural failure modes.

- generic connection-of-interest arrows become `ALLEGED_LINK`, never causal edges;
- chronological centerline order becomes `OCCURRED_BEFORE` with `causal_inference = NONE`;
- adjacency without an arrow produces no edge;
- unreadable labels become `UNKNOWN` rather than guessed text;
- unsupported relation types are rejected;
- every accepted source-map claim retains exact provenance;
- duplicate source lineage does not create independent corroboration;
- disputed records remain inspectable;
- analyst-added hypotheses remain separate;
- graph density and input ordering do not change focal semantics;
- every record lands in a machine-readable audit bucket.

NBG-T5 is reserved for evidence-linked review and temporal Keyhole exploration.


## Fifth executable rung

[NBG-T5](../experiments/NBGT5/) freezes evidence-linked review and Temporal Keyhole semantics:

- source records remain immutable while reviewer actions append new ledger events;
- ambiguity resolution is visible only after its review event becomes known;
- later evidence never rewrites an earlier knowledge-cutoff snapshot;
- source-map status and later review status remain distinct layers;
- status and relation filters are pure projections;
- analyst hypotheses can be toggled as a separate overlay;
- each record can export a provenance bundle;
- the review ledger is hash-chained;
- governed exports preserve base digest, ledger head, derived view, and export hash.

The next temporal rung is NBG-T6, the GitHub Pages Temporal Keyhole Explorer UI.


## Sixth executable rung

[NBG-T6](../experiments/NBGT6/) exposes the frozen NBG-T5 semantics through the GitHub Pages Temporal Keyhole Explorer.

The browser UI supports:

- two independent knowledge cutoffs for side-by-side comparison;
- evidence-status and relation-type filters;
- source-status versus review-status display;
- analyst-hypothesis overlay on/off;
- provenance bundles;
- ambiguity queue;
- ledger-head and view-fingerprint display;
- governed JSON export.

All controls are projection-only. They do not edit the source records or review ledger.

NBG-T7 is reserved for optional external evidence adapters with provenance-safe capture and reviewer acceptance.


## Seventh executable rung

[NBG-T7](../experiments/NBGT7/) freezes governed evidence-capture behavior for Temporal NBG.

It records adapter identity, source locator, capture time, content digest, explicit source grouping, review decisions, source-version changes, contradiction-preserving outcomes, and offline replay.

A captured item does not alter the original source-map claim. A separate review decision is required before it affects the derived review view.

NBG-T8 is reserved for optional integration of the qualified capture contract into the review interface.


## Eighth executable rung

[NBG-T8](../experiments/NBGT8/) connects the frozen capture contract to an operator-triggered read-only adapter path and a governed review queue.

- retrieval requires explicit operator invocation;
- HTTP(S) hosts must be allow-listed;
- captured bytes and receipt metadata are persisted before review;
- failed and ambiguous retrievals remain blocked;
- reviewer ACCEPT / REJECT decisions remain separate from capture;
- source status stays immutable;
- source-version drift is surfaced as a separate queue item;
- the Temporal Explorer exposes a session review queue and export;
- cached evidence bundles replay with networking disabled.

NBG-T9 is reserved for portable evidence-bundle import/export and a stable source registry.


## Ninth executable rung

[NBG-T9](../experiments/NBGT9/) freezes portable evidence-bundle and stable source-registry semantics.

- every source has a stable source ID and explicit independence group;
- the source registry is canonicalized and SHA-256 hashed;
- evidence bytes are stored by content digest;
- bundle manifests hash the payload, registry, decision-chain head, and parent export lineage;
- import validation returns `REVIEW_REQUIRED`, never automatic trust;
- duplicate or mirrored content is detected across source IDs;
- same-independence-group mirrors do not create extra corroboration;
- source drift remains attached to the stable source ID across exports;
- reviewer attribution survives bundle merge;
- ACCEPT/REJECT disagreement becomes `REVIEW_CONFLICT`, never last-write-wins;
- portable export/import preserves manifests, payloads, bytes, and deterministic offline replay.

NBG-T10 is reserved for explicit trust policies and conflict-resolution receipts over preserved T9 evidence.


## Tenth executable rung

[NBG-T10](../experiments/NBGT10/) freezes explicit trust-policy and conflict-resolution receipt semantics.

- reviewer roles and authority values live in a hashed registry;
- policies are explicit hashed data with named versions, eligible roles, quorum, weights, and validity windows;
- the same preserved reviewer disagreement may yield different governance outcomes under different policies;
- policy outcomes include `ACCEPTED`, `REJECTED`, `ABSTAIN`, `ABSTAIN_CONFLICT`, and `INSUFFICIENT_AUTHORITY`;
- historical reviewer decisions remain byte-identical after resolution;
- every resolution emits a hashed receipt pinning the bundle manifest, reviewer registry, policy version, input decision hashes, scores, outcome, and reason;
- stale policies, tampered policies, bundle mismatches, and reviewer-registry mismatches are refused;
- receipt replay is deterministic and exact;
- policy outcomes explicitly state that they are governance results, not objective truth.

NBG-T11 is reserved for temporal policy ledgers and Governance Keyholes.


## Eleventh executable rung

[NBG-T11](../experiments/NBGT11/) makes governance history itself bitemporal and replayable.

- every policy version has valid time and known time;
- policy registration, supersession, emergency activation, and emergency deactivation are append-only hash-chained events;
- Governance Keyholes query both a knowledge cutoff and a modeled valid time;
- a policy that was valid earlier but only learned later does not leak backward into an earlier knowledge snapshot;
- later supersession does not rewrite earlier Governance Keyholes;
- emergency deactivation at a later valid time does not erase the emergency policy from earlier historical valid-time queries;
- every temporal resolution receipt pins the exact policy version, policy-record hash, policy-ledger head, Governance Keyhole hash, and embedded T10 resolution receipt;
- earlier resolution receipts remain byte-identical after later policy events;
- governance bundles preserve policy records, ledger events, reviewer registry, input T9 manifest, and temporal resolution receipts;
- the live research site exposes side-by-side Governance Keyholes and governed JSON export.

NBG-T12 is reserved for explicit counterfactual governance branches over an immutable observed policy ledger.


## Twelfth executable rung

[NBG-T12](../experiments/NBGT12/) freezes explicit counterfactual governance branches over the immutable observed NBG-T11 policy ledger.

- every branch begins with a hashed fork receipt tied to the observed ledger head and exact target-event hash;
- the frozen mutation grammar supports one-event REMOVE, DELAY, or ALTER interventions;
- branch construction verifies that the observed ledger remains byte-identical;
- the same evidence, reviewer registry, and policy records are replayed on observed and counterfactual histories;
- branch-specific resolution receipts pin both observed and counterfactual ledger heads;
- divergence summaries identify the altered policy event and the first Governance Keyhole whose outcome changes;
- portable counterfactual bundles preserve the observed ledger, fork receipt, branch ledger, branch receipts, and divergence summary;
- deterministic export/import and replay reconstruct the same branch exactly;
- the live site exposes an observed-versus-counterfactual Governance Keyhole explorer and governed branch export;
- every branch carries the explicit boundary `COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY`.

NBG-T13 is reserved for a Governance Sensitivity Atlas and minimal outcome-changing intervention sets.


## Thirteenth executable rung

[NBG-T13](../experiments/NBGT13/) freezes a deterministic Governance Sensitivity Atlas over the qualified NBG-T12 intervention grammar.

- nine admissible one-event interventions are enumerated explicitly;
- every intervention is classified separately for the declared target query and across the temporal replay window;
- target classes distinguish outcome change, policy-only change, and target inertness;
- temporal classes distinguish outcome leverage, policy leverage, and ledger-only inertness;
- the payload-only mutation is a frozen negative control where the branch ledger hash changes but governance behavior does not;
- removing the explicit NORMAL@1.0 supersession is also inert in the frozen witness;
- target-inert interventions may still carry temporal leverage elsewhere;
- minimal intervention sets for a declared desired outcome are enumerated in increasing cardinality;
- the complete frozen minimum family for REJECTED at k10/t10 contains four singleton interventions;
- every atlas row and minimal-set result carries an explicit no-causal-attribution boundary;
- the live site exposes the sensitivity table, leverage classes, first divergence, minimal sets, negative controls, and governed JSON export.

NBG-T14 is reserved for intervention equivalence classes and Governance Residue: interventions that look equal through one Keyhole but differ elsewhere in their retained history.


## Fourteenth executable rung

[NBG-T14](../experiments/NBGT14/) freezes intervention-equivalence classes and Governance Residue over the qualified NBG-T13 intervention family.

- the focal observer is the Governance Keyhole at known k10 / valid t10;
- each intervention receives a focal policy/outcome signature and a full 144-Keyhole temporal signature;
- all 36 unordered intervention pairs receive deterministic equivalence receipts;
- target-equivalent pairs may split when the observer family widens;
- Governance Residue is the ordered set of Keyholes where a target-equivalent pair differs;
- the first divergent Keyhole is a minimal separating family of cardinality 1;
- the remove-vs-delay deactivation pair is a primary hidden-residue witness;
- the remove-vs-delay NORMAL@2.0 registration pair is an independent hidden-residue witness;
- the payload-only and remove-supersession negative controls have different branch ledgers but remain equivalent across the full declared Governance Keyhole family;
- target equivalence and full temporal equivalence are exported as separate partitions;
- every pair receipt refuses causal-identity claims from observational equivalence;
- the live research site exposes focal equivalence, full temporal equivalence, first separating Keyhole, Governance Residue, and governed pair export.

NBG-T15 is reserved for Adaptive Keyhole Synthesis: finding the smallest admissible observer family that separates a declared set of intervention histories.


## Fifteenth executable rung

[NBG-T15](../experiments/NBGT15/) freezes static and adaptive Governance Keyhole synthesis over the qualified NBG-T14 intervention family.

- the admissible observer space is the full 144-Keyhole k1...k12 × t1...t12 family;
- observer channels are explicit: POLICY, OUTCOME, or JOINT;
- static synthesis minimizes fixed Keyhole cardinality before the frozen resource-cost proxy;
- observer cost is declared as a resource proxy and is never promoted into epistemic value;
- unseparable intervention pairs emit `REFUSE_UNSEPARABLE` rather than receiving invented distinctions;
- the restricted policy-vs-outcome witness demonstrates that separability depends on the declared observer language;
- the full nine-history family remains unseparable because T14 qualified one pair as behaviorally identical across the entire declared Keyhole family;
- the eight-history family is fully separable under JOINT observation;
- adaptive synthesis chooses the next Keyhole by maximum remaining pair split, then minimum cost and canonical time order;
- every adaptive selection emits a deterministic query-selection receipt;
- unresolved adaptive leaves preserve the exact intervention histories that remain observationally merged;
- the live research site exposes family/channel controls, static minimum observers, adaptive next-query selection, refusal states, and governed synthesis export.

NBG-T16 is reserved for Keyhole Robustness + Observer Failure: testing which synthesized distinctions survive missing, stale, or corrupted observer components.
