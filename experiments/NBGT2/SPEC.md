# NBG-T2 Frozen Specification — Typed Temporal Graph Composition

## 1. Goal

NBG-T2 freezes relation semantics for temporal graphs so that chronology, allegation, documentation, inference, contradiction, and composition remain distinct operations.

The experiment is intentionally synthetic. It qualifies graph semantics before any dense real-world timeline is admitted as a stress fixture.

## 2. Frozen relation vocabulary

```text
OCCURRED_BEFORE
MEMBER_OF
FUNDED_BY
OPERATED_BY
DOCUMENTED_INTERACTION
INFERRED_INFLUENCE
ALLEGED_LINK
CONTRADICTS
SUPERSEDES
```

No unknown relation is accepted.

## 3. Frozen evidence vocabulary

```text
OBSERVED
CORROBORATED
INFERRED
DISPUTED
ALLEGED
REFUTED
UNKNOWN
```

Evidence status is metadata about support/provenance. It does not silently rewrite the relation type.

Therefore a later corroborated record for an `ALLEGED_LINK` remains an `ALLEGED_LINK` unless a separate `DOCUMENTED_INTERACTION` assertion is independently entered.

## 4. Bitemporal replay

Every assertion contains:

```text
valid_time
known_time
```

A replay at `(world_cutoff, knowledge_cutoff)` includes only assertions satisfying:

```text
valid_time <= world_cutoff
known_time <= knowledge_cutoff
```

Later-known evidence may change later snapshots but must not mutate earlier knowledge snapshots.

## 5. Contradiction preservation

Contradictory assertions may coexist when provenance differs.

`CONTRADICTS` is represented as an explicit assertion. It does not delete, overwrite, or downgrade the assertion it contradicts.

## 6. Explicit Keyhole projection

Coarsening may occur only through an explicit Keyhole projection that names the relation types retained.

Replay itself returns the full qualified assertion set for the requested cutoffs.

## 7. Typed composition

NBG-T2 freezes exactly one admissible composition rule:

```text
OCCURRED_BEFORE ∘ OCCURRED_BEFORE -> OCCURRED_BEFORE
```

This rule is included only to test typed composition mechanics.

All other relation-pair compositions are refused unless a future frozen specification explicitly permits them.

In particular:

```text
chronology != influence
allegation != documentation
adjacency != causation
```

## 8. Counterfactual separation

Observed replay uses:

```text
mode = OBSERVED
```

Explicit event/claim exclusion uses:

```text
mode = COUNTERFACTUAL
excluded_assertion_ids = [...]
```

Counterfactual output must not be merged into the observed receipt.

## 9. Canonicalization

Canonical replay must be invariant to:

- input assertion ordering;
- source-list ordering.

This prevents irrelevant serialization order from changing the modeled graph.

## 10. Frozen witness

The synthetic witness contains:

- `A OCCURRED_BEFORE B`;
- `B OCCURRED_BEFORE C`;
- an `ALLEGED_LINK` from `ORG_X` to `ORG_Y` known at time 2;
- a later explicit `CONTRADICTS` assertion known at time 3;
- later corroborating evidence for the same `ALLEGED_LINK` known at time 4;
- a separate `DOCUMENTED_INTERACTION` assertion;
- a separate `INFERRED_INFLUENCE` assertion.

The later corroboration must strengthen evidence status without promoting the relation type.

## 11. Qualification

Freeze before first execution:

- this specification;
- source;
- tests.

Qualification requires:

- 12/12 invariant checks PASS;
- 12/12 unit tests PASS;
- replay exact;
- explicit Keyhole projection;
- explicit counterfactual separation;
- typed composition refusal for unsupported relation pairs;
- canonical equivalence under irrelevant record/source reordering.

## 12. Claim firewall

NBG-T2 establishes only that the frozen synthetic implementation obeys the stated typed-graph invariants.

It does **not** establish that:

- a historical assertion is true because it appears in a graph;
- temporal order proves causation;
- correlation proves influence;
- an allegation becomes documentation through repetition;
- a counterfactual branch describes what reality actually would have done.