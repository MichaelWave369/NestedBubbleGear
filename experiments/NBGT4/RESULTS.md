# NBG-T4 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT4**

- Frozen invariant checks: **15/15 PASS**
- Unit tests: **15/15 PASS**
- Replay exact: **True**
- Input-order invariant: **True**
- Density semantics invariant: **True**

## Frozen witness

```text
generic source arrow -> ALLEGED_LINK / ALLEGED
center timeline       -> OCCURRED_BEFORE / causal_inference NONE
adjacent-only         -> NO EDGE
ambiguous label       -> UNKNOWN audit bucket
unsupported relation  -> REJECTED
missing provenance    -> REJECTED
analyst hypothesis    -> separate bucket
```

Base audit counts:

```text
accepted            3
disputed            2
ambiguous           1
rejected            2
no_edge             1
analyst_hypotheses  1
duplicate_groups    1
```

A 64-record irrelevant density expansion leaves the focal relation semantics unchanged.

## Claim boundary

NBG-T4 is a finite synthetic ingest experiment derived from the structural failure modes of the motivating Q-web PDF. It does not fact-check that map, prove any historical proposition, or convert its visual arrows into causal claims.
