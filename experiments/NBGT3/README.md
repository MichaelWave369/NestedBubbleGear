# NBG-T3 v0.1.0 — Contradictory-Source Reconciliation

NBG-T3 adds provenance-preserving source reconciliation to the temporal NBG line.

The frozen witness demonstrates that:

```text
different URL != independent source
more records != more independent corroboration
2 support vs 1 oppose != automatic resolution
opposition alone != REFUTED
```

Source independence is explicit through `independence_group`, while copies/reprints remain visible through `lineage_id`.

## Frozen witness

For `C_DISPUTED`:

```text
k1 -> OBSERVED
k2 -> DISPUTED
k4 -> DISPUTED
```

At k4 there are two independent support groups and one opposition group. The claim remains disputed instead of being resolved by record majority.

A counterfactual removal of the opposing source produces `CORROBORATED`, but the counterfactual receipt is kept separate from observed history.

For `C_REFUTABLE`, two independent opposing groups still produce `DISPUTED`. `REFUTED` appears only after a separate frozen `REFUTATION_DECISION` with the exact qualification authority becomes visible.

## Qualification target

```text
14/14 invariant checks PASS
14/14 unit tests PASS
replay exact
order invariant
```

See `SPEC.md` for the exact rules and claim firewall.