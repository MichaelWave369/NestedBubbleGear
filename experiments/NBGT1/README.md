# NBG-T1 v0.1.0 — Temporal Lineage and Bitemporal Provenance

NBG-T1 opens a temporal research line inside Nested Bubble/Gear.

The motivating question is:

> Can two histories look identical through the present coarse Keyhole while retaining different hidden lineage that an admissible future interaction can reveal?

The frozen synthetic witness contains two histories that both expose:

```text
macro.status = READY
```

at the witness cutoff, while retaining different latent route memories:

```text
History A -> NORTH
History B -> SOUTH
```

A later admissible probe reveals the difference.

NBG-T1 also separates:

- **valid time** — when an event belongs in the modeled world;
- **known time** — when the supporting evidence becomes available to the ledger.

That distinction prevents a later record from being silently treated as if an earlier observer already knew it.

## Frozen qualification

- **10/10 invariant checks PASS**
- **10/10 unit tests PASS**
- coarse witness: exact equality
- full/lineage witness: non-equivalent
- future probe: `NORTH` vs `SOUTH`
- late evidence: hidden at knowledge cutoff 2, visible at cutoff 4
- counterfactual replay: explicit and deterministic
- replay exact

## Evidence vocabulary

Evidence-bearing claim edges use one of:

```text
OBSERVED
CORROBORATED
INFERRED
DISPUTED
ALLEGED
REFUTED
UNKNOWN
```

These are provenance labels, not truth-by-enum. A graph can record that a claim exists without promoting it to fact.

## Claim firewall

NBG-T1 is a finite synthetic temporal/provenance experiment.

It does not establish that temporal order implies causation, that graph adjacency implies influence, or that a historical claim is true because it can be represented in NBG.
