# NBG-T3 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT3**

Local pre-commit qualification:

- invariant checks: **14/14 PASS**
- unit tests: **14/14 PASS**
- replay exact
- input/source order invariant
- duplicate mirrors do not create independent corroboration
- no-hindsight replay preserved
- explicit refutation gate enforced
- counterfactual source removal kept separate from observed history

## Frozen witness

```text
C_DISPUTED @ k1 -> OBSERVED
C_DISPUTED @ k2 -> DISPUTED
C_DISPUTED @ k4 -> DISPUTED

k4 support groups = G1, G3
k4 oppose groups  = G2
```

The 2-to-1 independent-group balance remains **DISPUTED**. NBG-T3 does not turn majority record count into truth.

Duplicate copies remain visible in the evidence ledger but do not create additional independence.

For the refutation witness:

```text
two independent opposing groups, no explicit decision -> DISPUTED
same evidence + frozen explicit refutation decision   -> REFUTED
```

A counterfactual excluding source `S2` produces `CORROBORATED`, but that receipt is explicitly marked `COUNTERFACTUAL`.

## Claim boundary

These are finite synthetic reconciliation results. They do not prove that real-world source independence is known, that record majority determines truth, or that a policy decision makes a historical proposition false.
