# AH12 v0.1.0 Qualification Results

## Verdict

**PASS_AH12**

- Frozen acceptance checks: **35/35**
- Unit tests: **13/13 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Task-indexed memory table

| Query family | Chosen descriptor | Classes | Entropy (bits) |
|---|---|---:|---:|
| global G | residue | 13 | 3.625000000000 |
| intermediate H2 | H2 | 3 | 1.500000000000 |
| intermediate H3 | H3 | 9 | 3.077819531115 |
| cumulative P2 | cumulative | 13 | 3.625000000000 |
| broad query family | action | 15 | 3.875000000000 |

## Cross-task failures

AH11's residue is exact for the global task:

`H(G | RΓ) = 0`

But for other future queries:

`H(H2 | RΓ) = 0.25 bits`

`H(P2 | RΓ) = 0.25 bits`

Conversely the cumulative endpoint is exact memory for P2, but:

`H(G | P2) = 0.25 bits`

## Broad-query refinement

For the full future query tuple `(G, H2, H3, P2)`, the coarsest sufficient preregistered descriptor is the transported action pair `(H2, H3)` with 15 classes and 3.875 bits.

So expanding the future query family forces a refinement from the 13-class AH11 global-task residue to a 15-class memory.

## Interpretation

AH12 supports task-indexed memory:

`R_Q(Gamma)`

The retained causal residue that is sufficient depends on the future query family.

This is a finite ensemble result, not a universal law of cognition, AI context compression, or physical memory.
