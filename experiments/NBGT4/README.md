# NBG-T4 v0.1.0 — Hostile Dense Timeline Ingest

NBG-T4 takes the first deliberately messy graph-shaped input through the temporal NBG pipeline.

The motivating artifact is the user-supplied Q-web / Deep State Mapping Project PDF, but the repository does **not** redistribute that map. Instead, the frozen fixture is a small synthetic derivative of the source's stated structural failure modes: chronological centerline, connection-of-interest arrows, adjacency without arrows, tiny/ambiguous labels, mixed certainty, and dense cross-linking.

The important behavior is deliberately conservative:

```text
generic arrow -> ALLEGED_LINK
chronology    -> OCCURRED_BEFORE, causal_inference = NONE
adjacency     -> NO EDGE
unreadable    -> UNKNOWN
unsupported   -> REJECTED
```

Analyst hypotheses are kept separate from imported source claims, and duplicate mirrors do not create independent corroboration.

## Frozen qualification

- **15/15 invariant checks PASS**
- **15/15 unit tests PASS**
- replay exact
- input-order invariant
- 64-record density expansion leaves focal semantics unchanged

See `SPEC.md`, `SOURCE_BASIS.md`, and `RESULTS.md`.
