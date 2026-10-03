# AH28 v0.1.1 Qualification Results

## Verdict

**PASS_AH28_QUALIFIED**

- Frozen acceptance checks: **23/23**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Preregistration lineage

- v0.1.0: **FAILED 22/23** because Panel D adaptive expected state was preregistered incorrectly.
- v0.1.1: corrected only that expected state and the version identifier; model and arbitration logic unchanged.

## Arbitration panels

| Panel | Lifetime | Recent-2 | Adaptive | Arbitration |
|---|---|---|---|---|
| A_RECENT_RISK | INSUFFICIENT_EVIDENCE | COMMON_MODE_EVIDENCE | COMMON_MODE_EVIDENCE | RECENT_RISK_ONLY |
| B_THREE_WAY_SPLIT | INSUFFICIENT_EVIDENCE | COMMON_MODE_EVIDENCE | INSUFFICIENT_EVIDENCE | RECENT_RISK_ONLY |
| C_CONSISTENT_COMPATIBLE | INDEPENDENCE_COMPATIBLE | INDEPENDENCE_COMPATIBLE | INDEPENDENCE_COMPATIBLE | CONSISTENT |
| D_LIFETIME_RISK | COMMON_MODE_EVIDENCE | INDEPENDENCE_COMPATIBLE | COMMON_MODE_EVIDENCE | LIFETIME_RISK_ONLY |
| E_CONSISTENT_RISK | COMMON_MODE_EVIDENCE | COMMON_MODE_EVIDENCE | COMMON_MODE_EVIDENCE | CONSISTENT |
| F_ORDER_A | INSUFFICIENT_EVIDENCE | INDEPENDENCE_COMPATIBLE | INDEPENDENCE_COMPATIBLE | HORIZON_CONFLICT |
| G_ORDER_B | INSUFFICIENT_EVIDENCE | COMMON_MODE_EVIDENCE | COMMON_MODE_EVIDENCE | RECENT_RISK_ONLY |

## Query routing

- `Q_RECENT(A)` -> **COMMON_MODE_EVIDENCE** on `RECENT_2`
- `Q_LIFETIME(A)` -> **INSUFFICIENT_EVIDENCE** on `LIFETIME`
- `Q_ADAPTIVE(A)` -> **COMMON_MODE_EVIDENCE** on `DISCOUNTED_0.1`
- `Q_MULTI(A)` -> **RECENT_RISK_ONLY**
- missing horizon -> **REFUSE_UNDERSPECIFIED_HORIZON**
- unknown contract -> **REFUSE_UNKNOWN_QUERY_CONTRACT**

## Main result

`time horizon is part of governance semantics`

`evidence without a declared horizon is an incomplete governance claim`

Accepted receipts carry an explicit horizon. Conflicting multi-horizon states remain visible. No scoped evidence state is promoted to the unqualified word `SAFE`.
