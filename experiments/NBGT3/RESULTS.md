# NBG-T3 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT3**

- Frozen invariant checks: **14/14 PASS**
- Unit tests: **14/14 PASS**
- Replay exact: **True**
- Input/source order invariant: **True**
- Duplicate mirrors create no extra independence: **True**
- No-hindsight replay preserved: **True**
- Explicit refutation gate enforced: **True**
- Observed/counterfactual separation: **True**

## Frozen witness

```text
C_DISPUTED @ k1 -> OBSERVED
C_DISPUTED @ k2 -> DISPUTED
C_DISPUTED @ k4 -> DISPUTED

k4 support groups = G1, G3
k4 oppose groups  = G2
```

The 2-to-1 independent-group balance remains **DISPUTED**. NBG-T3 does not convert record majority into truth.

Duplicate mirrors/reprints remain visible in the evidence ledger but do not create extra independent corroboration.

Refutation witness:

```text
2 independent opposing groups, no decision -> DISPUTED
same evidence + explicit frozen decision   -> REFUTED
```

Counterfactual witness:

```text
exclude source S2 -> CORROBORATED
mode = COUNTERFACTUAL
```

## Frozen file hashes

```text
SPEC.md             21ddea7959399dd67d908c4aaf55a03e0e7747d8794109cdfae63c4e0434fdca
src/nbgt3.py        02c456a8d9001ee94e9f165d4cf17f1da49b6ce4c1d7dee79a3c744eae8bf6dd
tests/test_nbgt3.py 3bbcdc21e20ff7b38a98b0a911fe8b8d37a1c87a5aa6381c717a285f6bf59d0b
```

## Generated artifact hashes

```text
result.json    ba09237322f7734cca13bd76f7f60d6918abc5b1f6ecd7882baad0c96c4e70a8
sources.json   8a963a00d0ae7af8b184b9de7c9d5985da6a7c6a525fbd1e2a1fbd66516c70ba
evidence.json  2349511850115848e90f2695ca3adc93af169ce5e954b6a9112bec20f4f4136b
decisions.json 5dff54b74b7d903586e7c99899b20588f9c4afd2f5c3428dc6d3c3343cdbf94b
```

## Claim boundary

These are finite synthetic reconciliation results. They do not prove that real-world source independence is known, that record majority determines truth, or that a policy decision makes a historical proposition false.
