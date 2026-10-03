# AH23 v0.1.0 Qualification Results

## Verdict

**PASS_AH23_QUALIFIED**

- Frozen acceptance checks: **41/41**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**
- Failure scenarios: **0.05, 0.1, 0.15, 0.2, 0.25, 0.3**

## Robust frontiers

Full tasks:

```text
H2_FULL       (0,1,0.490,0.147) -> (3,0,0.637,0.000)
GLOBAL_REAUTH (0,1,0.490,0.147) -> (5,0,0.637,0.000)
ROUTE_REAUTH  (0,1,0.490,0.147) -> (2,0,0.637,0.000)
```

Tuple order:

```text
(cost, induced singleton cuts, worst-case reliability, max regret)
```

Alarm soft-cost frontier:

```text
(0,1,0.700,0.210)
(1,0,0.847,0.063)
(5,0,0.910,0.000)
```

Alarm hard-deny frontier:

```text
(0,1,0.700,0.210)
(1,0,0.847,0.063)
```

## Main result

Every frozen reliability curve is non-increasing across the declared common-failure scenarios, and every policy reaches its worst case at `p=0.30`.

The AH22 single-point frontier and AH23 robust frontier contain the exact same policy families in every context.

So:

```text
no frontier membership reversal
```

under the frozen common-identical-failure model.

Threshold controls preserve the earlier cost/deny distinction: soft cost can buy worst-case reliability >=0.90 at cost 5, while the hard-deny context makes that threshold infeasible.

AH23 does not establish real failure probabilities, continuous-interval robustness, correlated-failure robustness, or a preferred governance policy.
