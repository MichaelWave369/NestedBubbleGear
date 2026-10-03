# AH24 v0.1.0 Qualification Results

## Verdict

**PASS_AH24_QUALIFIED**

- Frozen acceptance checks: **36/36**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Heterogeneous regimes

| Regime | P12 | P23 | P_BOTH | Pareto frontier |
|---|---:|---:|---:|---|
| BALANCED | 0.81000 | 0.81000 | 0.89100 | P12, P23, P_BOTH |
| E1_FRAGILE | 0.63000 | 0.85500 | 0.88650 | P23, P_BOTH |
| E3_FRAGILE | 0.85500 | 0.63000 | 0.88650 | P12, P_BOTH |
| E2_FRAGILE | 0.66500 | 0.66500 | 0.69825 | P12, P23, P_BOTH |
| EDGE_MATCHED_INDEP | 0.68400 | 0.68400 | 0.84816 | P12, P23, P_BOTH |
| EDGE_COMMON_CAUSE | 0.68400 | 0.68400 | 0.71820 | P12, P23, P_BOTH |

## Ranking reversal

In `E1_FRAGILE`, `P23` dominates `P12` on reliability at equal declared cost/fragility.

In `E3_FRAGILE`, the ordering reverses: `P12` dominates `P23`.

So coalition identity matters once hazards are heterogeneous.

## Matched-marginal correlation control

- independent marginals: **[0.24, 0.10, 0.24]**
- correlated marginals: **[0.24, 0.10, 0.24]**
- independent dual-path redundancy gain: **0.16416**
- correlated dual-path redundancy gain: **0.03420**
- correlation penalty: **0.12996**

The single-path policies remain at 0.684 in both matched-marginal regimes, while `P_BOTH` falls from 0.84816 to 0.7182 under common-cause edge failure.

## Interpretation

`coalition identity matters under heterogeneous hazards`

`same component marginals != same redundancy value`

AH24 is a finite toy reliability result. It does not estimate real failure probabilities or deployed-system common-cause risk.
