# AH34 v0.1.0 Qualification Results

## Verdict

**PASS_AH34_QUALIFIED**

- Frozen acceptance checks: **49/49**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Mixed task profiles: **243**
- Positive-privacy profiles: **106**
- Zero-privacy profiles: **137**

## Minimum privacy collapse

Minimum richness score yielding exact reconstruction: **3**

- `COMMON_ONLY / COMMON_ONLY / FULL_STATUS / TRIAGE / COMMON_ONLY`
- `TRIAGE / COMMON_ONLY / FULL_STATUS / COMMON_ONLY / COMMON_ONLY`

So adaptive FULL status plus either lifetime TRIAGE carrier is sufficient to collapse residual privacy in the frozen model.

## Maximum-richness safe allocation

Maximum richness with positive privacy: **7**

- `FULL_STATUS / TRIAGE / TRIAGE / FULL_STATUS / TRIAGE`

Residual privacy: **0.2 bits**.

Any profile with richness score 8 or greater has zero residual privacy.

## Pareto frontier

| Total richness | Residual privacy (bits) |
|---:|---:|
| 2 | 1.160964047443681 |
| 3 | 0.8 |
| 4 | 0.6754887502163468 |
| 6 | 0.4 |
| 7 | 0.2 |
| 10 | 0 |

There are eight nondominated profiles total because the richness-4 and richness-6 coordinates each have two distinct allocations.

## Frozen privacy budgets

At `epsilon = 0.4` bits:

- **71** profiles are feasible;
- maximum richness is **6**;
- exactly **two** allocations tie for optimum.

At `epsilon = 0.8` bits:

- **8** profiles are feasible;
- maximum richness is **3**;
- the optimum is unique.

## Main result

`privacy cost depends on which distinctions are jointly released, not only how many upgrades are granted`

`some task upgrades are privacy-free while specific combinations collapse privacy abruptly`

`privacy floors constrain task allocation without necessarily selecting one unique authority design`

AH34 is a finite mixed-task entropy/Pareto result, not a production privacy-budget theorem.
