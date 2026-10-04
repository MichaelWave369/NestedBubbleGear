# AH35 v0.1.1 Qualification Results

## Verdict

**PASS_AH35_QUALIFIED**

- Frozen acceptance checks: **29/29**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **true**
- Replay exact: **true**

## Preregistration lineage

- v0.1.0: **FAILED 28/29** because the same 12 correct cut sets were preregistered in a different tuple order than the deterministic enumerator.
- v0.1.1: corrected only expected/listed ordering plus version metadata; model, algorithms, cut membership, scientific outputs, and all 15 tests unchanged.

## Upgrade access structure

- valid prerequisite-closed upgrade sets: **243**
- dangerous exact-reconstruction sets: **137**
- positive-privacy sets: **106**
- minimal collapsing paths: **10**
- mandatory core: **empty**
- inclusion-minimal cuts: **12**

## Unique minimum cut

`{H_L:T, U_L:T}`

- denied atoms: **2**
- permitted profiles: **27**
- maximum permitted richness: **6**
- worst permitted residual privacy: **0.400000000000000 bits**

## Structural control versus scalar cap

To guarantee safety by richness score alone, AH34 requires **R <= 2**.

The two-atom structural cut guarantees positive privacy while permitting richness **6**.

## Structural-cut policy frontier

| Cut cost | Max permitted richness | Worst residual privacy (bits) |
|---:|---:|---:|
| 2 | 6 | 0.400000000000000 |
| 3 | 7 | 0.200000000000000 |
| 3 | 4 | 0.675488750216347 |
| 5 | 3 | 0.800000000000000 |
| 5 | 2 | 1.160964047443681 |

## Main result

`task refinement permissions themselves form an access structure`

`structure-aware deny rules can preserve more useful task richness than scalar caps`

AH35 is a finite prerequisite/access-structure/cut-set result, not a production authorization or cryptographic privacy theorem.
