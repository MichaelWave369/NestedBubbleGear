# NBG-T3 Frozen Specification — Contradictory-Source Reconciliation

## 1. Goal

NBG-T3 freezes source-reconciliation semantics for temporal graphs without pretending every uncertainty can be collapsed into one score.

The experiment is synthetic. It tests provenance and reconciliation machinery, not historical truth.

## 2. Source identity and independence

Every source must explicitly declare:

```text
source_id
lineage_id
independence_group
locator
provenance
```

Different URLs, filenames, mirrors, or reposts do **not** imply independence.

Independent corroboration is counted by explicit `independence_group`, not by record count.

Duplicate copies remain visible in the evidence ledger.

## 3. Evidence records

Every evidence record contains:

```text
evidence_id
claim_id
source_id
stance = SUPPORT | OPPOSE
valid_time
known_time
excerpt_digest
provenance
```

`known_time >= valid_time` is required in the frozen model.

## 4. Bitemporal rule

A record is eligible for a replay only when:

```text
valid_time <= world_cutoff
known_time <= knowledge_cutoff
```

Later-known evidence may change later snapshots but cannot rewrite an earlier knowledge snapshot.

## 5. Reconciliation status

The frozen status rules are deliberately conservative:

```text
no evidence                         -> UNKNOWN
support only, 1 independent group  -> OBSERVED
support only, >=2 groups            -> CORROBORATED
support + oppose                    -> DISPUTED
oppose only                         -> DISPUTED
```

`REFUTED` is not produced by majority vote.

## 6. Explicit refutation rule

The frozen toy policy permits `REFUTED` only when all are true:

1. there are no supporting independence groups;
2. there are at least two opposing independence groups;
3. a visible `REFUTATION_DECISION` exists;
4. its authority is exactly `FROZEN_NBGT3_REFUTATION_AUTHORITY`.

The decision is preserved in a separate decision ledger.

This is a qualification mechanism, not a claim that two sources plus an authority refute real-world propositions.

## 7. Conflict preservation

Supporting and opposing evidence may coexist.

Later support does not erase opposition.

A 2-to-1 support/opposition count remains `DISPUTED` in the frozen witness.

## 8. Derived summaries

Counts and status are derived views.

Every receipt must retain the underlying evidence ledger, source provenance, duplicate identities, and decision ledger.

## 9. Counterfactual source removal

Observed replay uses:

```text
mode = OBSERVED
```

Explicit source-removal replay uses:

```text
mode = COUNTERFACTUAL
excluded_source_ids = [...]
```

Counterfactual output must remain separate from the observed receipt.

## 10. Canonicalization

Canonical reconciliation output is invariant to:

- input source ordering;
- input evidence ordering;
- input decision ordering.

Evidence ledger ordering is normalized before hashing.

## 11. Frozen witness

`C_DISPUTED` receives:

- one supporting source plus a mirror from the same lineage/group;
- one independent opposing source;
- later support from a second independent group plus a reprint of that source.

Expected snapshots:

```text
knowledge cutoff 1 -> OBSERVED
knowledge cutoff 2 -> DISPUTED
knowledge cutoff 4 -> DISPUTED
```

At cutoff 4 the derived independent counts are:

```text
support = 2 groups
oppose  = 1 group
```

The conflict remains unresolved.

A counterfactual excluding the opposing source yields `CORROBORATED`.

`C_REFUTABLE` receives two independent opposing groups plus a duplicate copy. It remains `DISPUTED` until the explicit frozen refutation decision becomes visible, then becomes `REFUTED`.

## 12. Qualification

Freeze before first execution:

- this specification;
- source;
- tests.

Qualification requires:

- 14/14 invariant checks PASS;
- 14/14 unit tests PASS;
- replay exact;
- order-invariant canonical output;
- duplicate copies do not create independence;
- no-hindsight evidence replay;
- explicit refutation gate;
- counterfactual/observed separation.

## 13. Claim firewall

NBG-T3 establishes only that the frozen synthetic implementation obeys the stated reconciliation rules.

It does **not** establish that:

- an evidence source is actually independent because a dataset says so;
- a majority of sources determines truth;
- an explicit decision makes a real-world claim false;
- disputed historical claims can be reduced to a scalar confidence score;
- a counterfactual source-removal branch describes what reality would have done.