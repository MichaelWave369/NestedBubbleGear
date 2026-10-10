# NBG-RB3-R5-E5: Frozen model's empirical representational ceiling

**Status: DIAGNOSTIC ONLY. NO REAL MODEL FIT OR INDEPENDENT SOURCE APPROVAL.**

This rung turns E4's exact predictor collisions into a mathematical **in-sample upper bound**. It uses the *original frozen 13 predictor columns* and the *64 unreviewed, source-attributed candidate labels*, without training a classifier or changing any features, labels, source assignments or fold definitions.

## Question

Suppose an unrealistically knowledgeable deterministic function is allowed to look up the **true candidate labels** for every exact feature vector. It may pick whichever label appears most often at that vector, but for identical inputs it must return the same prediction. How many of these 64 labels could it possibly match?

For each unique feature vector `v`, let `n(v,y)` be the number of candidate rows with outcome label `y`. Then:

```text
optimistic oracle matches = sum_v max_y n(v,y)
unavoidable oracle errors = N - sum_v max_y n(v,y)
```

The original 64 candidate rows contain **57 distinct exact vectors**, with **four opposing-label groups of 10 rows in total**. Three groups contain 2 or 3 candidate comparisons, and each of the four groups forces at least one error.

| Quantity | Candidate-only diagnostic |
|---|---:|
| Rows in original R0–R3 candidates | 64 |
| Exact frozen-predictor vectors | 57 |
| Conflicting vector groups | 4 |
| Rows in conflicting vector groups | 10 |
| Unavoidable in-sample errors for any deterministic mapping | **4/64 (6.25%)** |
| **Optimistic in-sample oracle ceiling** | **60/64 (93.75%)** |
| Within L002 candidate lineage | **14/18 (77.78%) ceiling** |
| Within fold 0's available candidate test rows | **23/27 (85.19%) ceiling** |
| Independently approved model-eligible rows | **0** |
| Real model fits | **0** |

**The 60/64 number is NOT test accuracy, prediction quality, a trained model result, or an empirical biology result.** The label-informed lookup cheats by consulting the outcomes. Our actual frozen multinomial-softmax model is more constrained and might do worse even *in sample*. Different preprocessing may collapse more vectors.

## Original lineage fold coverage

| Outer test fold | Frozen test lineages | Candidate rows present | Missing frozen test lineage |
|---|---|---:|---|
| 0 | L004, L002, L005 | 27 | L005 |
| 1 | L003, L006 | 3 | L006 |
| 2 | L009, L007 | 14 | none |
| 3 | L011, L008 | 11 | none |
| 4 | L010, L001 | 9 | L010 |

These are **candidate counts**, not reviewed eligible rows and not a completed grouped cross-validation. Three frozen lineages lack any candidate conditions. No source can be inserted or split changed just to remove that obstacle.

All four opposing-label groups fall in L002, which is assigned to outer test **fold 0** under the immutable RB2 mapping. Their source-specific differences (gene target, differentiation marker, neurite metric and certain post-exposure delays) are already recorded in [E4's casebook](../E4/README.md).

## Reproduce

```sh
python experiments/RB3/R5/E5/bound_audit.py --audit
python experiments/RB3/R5/E5/bound_audit.py --markdown
python -m unittest discover -s experiments/RB3/R5/E5/tests -v
```

The audit checks E4, E3, the R5 untouched reviewer packet, RB2's frozen source/fold mapping and the original E0 feature list. It verifies that the numeric bound is mechanically derived from the existing unreviewed candidate rows, and that the reference policy cannot quietly raise the ceiling or authorize a fit.

## Scientific firewall

- Source-attributed labels are **not independently adjudicated**, and any later independently reviewed subset would need a fresh, preregistered interpretation of its own bounds.
- No inference about clinical regeneration, direct DNA antenna coupling, safe exposure settings or hidden-gamma causal dynamics.
- No new feature is smuggled into RB3 to resolve collisions post hoc.
- No row is dropped because it hurts accuracy.
- Insufficient eligible source/lineage coverage can correctly return `VOID_INSUFFICIENT_CORPUS`.

The result is a **proof of a limitation of the current representation on its current candidate labels**, not a scientific verification of the candidate labels themselves.
