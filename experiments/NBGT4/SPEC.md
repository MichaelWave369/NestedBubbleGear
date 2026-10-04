# NBG-T4 Frozen Specification — Hostile Dense Timeline Ingest

## 1. Goal

NBG-T4 is the first hostile-ingest rung in the temporal NBG line.

It does **not** certify a dense historical map as true. It tests whether the ingest boundary preserves uncertainty, provenance, ambiguity, relation types, contradiction, chronology, and analyst/source separation when the input is graph-like, crowded, and semantically dangerous.

## 2. Source basis

The motivating source is the user-supplied `timeline-hidden-history.pdf`, whose Q-web introduction describes a chronological center timeline, arrows representing a connection of interest, many topics placed adjacent without an arrow, and a mixture of generally accepted facts and plausible theories.

The source PDF is **not redistributed** in this experiment. The frozen fixture is a small synthetic derivative that reproduces those failure modes without copying the source map wholesale.

## 3. Frozen ingest policy

### Generic source-map arrow

```text
CONNECTION_OF_INTEREST -> ALLEGED_LINK
```

This mapping records that the source asserts a connection. It does not infer influence or causation.

### Center-timeline sequence

```text
TIMELINE_SEQUENCE -> OCCURRED_BEFORE
causal_inference = NONE
```

Chronology is not causation.

### Adjacency without arrow

```text
ADJACENT_ONLY -> NO EDGE
```

Visual proximity alone creates no claim.

### Unreadable labels

An ambiguous or unreadable label becomes `UNKNOWN` in the audit bucket. The ingest must not guess the hidden text.

### Unsupported relation

A relation outside the frozen NBG-T2 vocabulary is rejected rather than coerced into a supported type.

### Provenance

Every accepted source-map claim must retain:

```text
source_locator
source_lineage
origin_kind
```

A source-map record with missing provenance is rejected.

## 4. Evidence state

If a source-map record has no explicit frozen evidence status, the ingest assigns:

```text
ALLEGED
```

This means only that the source map asserts the connection. It is not an external verification result.

Allowed evidence states remain:

```text
OBSERVED
CORROBORATED
INFERRED
DISPUTED
ALLEGED
REFUTED
UNKNOWN
```

## 5. Source lineage and duplicates

Duplicate source records remain inspectable, but records sharing one `source_lineage` do not become independent corroboration merely because their locators differ.

## 6. Analyst hypotheses

Analyst-added hypotheses use:

```text
origin_kind = ANALYST_HYPOTHESIS
```

They are stored in a separate audit bucket and never silently merged with source-map claims.

## 7. Audit buckets

Every input record must land in a machine-readable category:

```text
accepted
disputed
ambiguous
rejected
no_edge
analyst_hypotheses
duplicate_groups
```

## 8. Density invariant

Adding many unrelated well-formed records must not change the semantics of a focal claim.

Graph density is not evidence.

## 9. Canonicalization

Canonical ingest output must be invariant to input record ordering.

## 10. Frozen qualification

Qualification requires:

- 15/15 invariant checks PASS;
- 15/15 unit tests PASS;
- replay exact;
- input-order invariance;
- generic arrow -> `ALLEGED_LINK`;
- center timeline -> `OCCURRED_BEFORE` with no causal inference;
- adjacency -> no edge;
- unreadable label -> `UNKNOWN`, never guessed;
- unsupported relation refused;
- missing provenance refused;
- duplicate lineage does not create independence;
- disputes remain inspectable;
- analyst hypotheses remain separate;
- dense irrelevant records do not change focal semantics;
- machine-readable audit report emitted.

## 11. Claim firewall

NBG-T4 establishes only that the frozen synthetic ingest implementation obeys these rules.

It does **not** establish that any claim in the motivating historical map is true, that the map's arrows represent causal mechanisms, that adjacency is meaningful, or that this ingest performs external fact verification.
