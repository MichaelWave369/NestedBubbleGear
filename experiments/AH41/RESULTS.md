# AH41 v0.1.0 Qualification Results

## Verdict

**PASS_AH41_QUALIFIED**

- Frozen acceptance checks: **29/29**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Physical-threshold comparison

| Capability | Independent ownership | Fused A+B ownership |
|---|---:|---:|
| Verification | 2 principals | 1 principal |
| Strict declassification | 3 principals | 2 principals |
| Weak 2-of-3 declassification control | 2 principals | 1 principal |

## Reliability at p=0.1

| Capability | Independent | Fused A+B |
|---|---:|---:|
| Verification | 0.972 | 0.900 |
| Strict declassification | 0.729 | 0.810 |

## Structural findings

- Fused A+B ownership reduces the physical verification compromise threshold from **2 to 1**.
- Fused A+B ownership reduces the strict declassification compromise threshold from **3 to 2**.
- Fused A+B ownership creates a verification single point of failure at `PRINCIPAL_A`.
- Under the weak 2-of-3 declassification negative control, `PRINCIPAL_A` alone can declassify.
- Under strict independent ownership, a two-principal malicious declassification attempt is refused and public privacy remains **0.4 bits**.

## Main result

`logical quorum size != independent principal threshold`

`role fusion can change compromise threshold and availability in opposite directions`

`availability quorum != declassification compromise threshold`

AH41 is a finite ownership/coalition/reliability result, not threshold cryptography, BFT, MPC, or a production custody theorem.
