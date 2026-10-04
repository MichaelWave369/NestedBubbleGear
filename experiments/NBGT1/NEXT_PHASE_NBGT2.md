# NBG-T2 Candidate — Typed Temporal Graph Composition

NBG-T1 establishes temporal lineage, bitemporal provenance, no-hindsight replay, and explicit counterfactual separation.

NBG-T2 should add **typed relation semantics** so dense timelines cannot silently turn visual proximity into causation.

Candidate relation classes:

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

Candidate invariants:

1. temporal order never upgrades to causal influence;
2. `ALLEGED_LINK` never canonicalizes to `DOCUMENTED_INTERACTION`;
3. contradictory claims may coexist when provenance differs;
4. later corroboration may change a later knowledge snapshot but never rewrites an earlier one;
5. coarsening happens only through an explicit Keyhole projection;
6. counterfactual products remain separate from observed-history receipts;
7. canonical replay is invariant to irrelevant source-record ordering;
8. relation composition is allowed only for explicitly compatible edge types.

A dense real-world timeline map should enter the program only **after** these edge and evidence semantics are frozen. Otherwise a graph becomes a machine for turning adjacency into mythology, which humanity has already automated quite efficiently.
