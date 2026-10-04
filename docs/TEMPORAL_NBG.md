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
