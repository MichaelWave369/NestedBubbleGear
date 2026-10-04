# NBG-T2 v0.1.0 — Typed Temporal Graph Composition

NBG-T1 gave NBG a bitemporal memory of history.

NBG-T2 gives the arrows names and refuses to pretend they are interchangeable.

The frozen relation vocabulary distinguishes chronology, organizational relations, documented interaction, inferred influence, allegation, contradiction, and supersession.

The central safety invariant is simple:

```text
OCCURRED_BEFORE != INFERRED_INFLUENCE
ALLEGED_LINK != DOCUMENTED_INTERACTION
```

A later corroborated source may strengthen the evidence state attached to an allegation without silently converting the relation itself into a documented interaction.

Contradictory assertions are retained side by side with provenance instead of being collapsed into whichever record arrived last.

## Frozen qualification

- **12/12 invariant checks PASS**
- **12/12 unit tests PASS**
- input/source order canonicalization PASS
- no-hindsight bitemporal replay PASS
- explicit Keyhole projection PASS
- observed/counterfactual separation PASS
- typed chronology composition PASS
- unsupported relation composition refusal PASS

## Why this matters

Dense historical maps often draw the same kind of line for very different claims. NBG-T2 treats that as a schema error, not a revelation.

The graph may store uncertainty. It may store disagreement. It may even store wild allegations as allegations. What it may not do is upgrade them because somebody drew an arrow with confidence.