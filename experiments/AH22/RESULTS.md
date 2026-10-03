# AH22 v0.1.0 Qualification Results

## Verdict

**PASS_AH22_QUALIFIED**

- Frozen acceptance checks: **44/44**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Pareto frontiers

| Context | Legal candidates | Pareto points `(cost, induced singleton cuts, reliability@0.1)` |
|---|---:|---|
| ALARM_HARD_DENY | 2 | (0, 1, 0.900), (1, 0, 0.981) |
| ALARM_SOFT_COST | 3 | (0, 1, 0.900), (1, 0, 0.981), (5, 0, 0.990) |
| GLOBAL_REAUTH | 2 | (0, 1, 0.810), (5, 0, 0.891) |
| H2_FULL | 2 | (0, 1, 0.810), (3, 0, 0.891) |
| ROUTE_REAUTH | 2 | (0, 1, 0.810), (2, 0, 0.891) |

## Alarm threshold queries

- soft-cost minimum cost for `R>=0.98`: **1**
- soft-cost minimum cost for `R>=0.99`: **5**
- hard-deny minimum cost for `R>=0.98`: **1**
- hard-deny `R>=0.99`: **infeasible**

## Main result

The soft-cost alarm frontier contains three nondominated choices:

- cost 0 / reliability 0.900 / one policy-induced singleton cut;
- cost 1 / reliability 0.981 / no induced singleton cuts;
- cost 5 / reliability 0.990 / no induced singleton cuts.

When singleton `{E1}` becomes a hard deny, the full-capability point disappears from the feasible set rather than merely becoming expensive.

`expensive != forbidden`

AH22 exposes the trade space instead of collapsing governance cost, fragility, and reliability into one scalar score. It remains an advisory finite toy model.
