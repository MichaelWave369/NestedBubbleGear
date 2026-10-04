# NBG-T7 v0.1.0 — External Evidence Adapters

NBG-T7 adds the first governed boundary between remote evidence retrieval and the temporal review ledger.

The frozen rule is intentionally strict:

```text
retrieval creates a receipt
reviewer acceptance changes the derived view
the source-map record never gets rewritten
```

The synthetic witness covers successful capture, ambiguous retrieval, failed retrieval, content SHA-256 receipts, explicit source independence, source-version drift, reviewer acceptance, contradictory evidence, and no-network replay.

## Local qualification

- **18/18 invariant checks PASS**
- **19/19 unit tests PASS**
- source version drift detected
- offline replay exact
- tamper detection PASS
- order invariant
- no hindsight
- source-map firewall preserved

No live historical source is queried in this rung.
