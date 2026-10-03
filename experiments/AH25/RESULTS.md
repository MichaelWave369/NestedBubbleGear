# AH25 v0.1.0 Qualification Results

## Verdict

**PASS_AH25_QUALIFIED**

- Frozen acceptance checks: **30/30**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Failure-domain panel

| Dataset | N | p1 | p3 | p11 | Delta | MI bits | Status | Observed dual R | Independence-assumed R | Overstatement |
|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|
| MATCHED_INDEPENDENT | 10000 | 0.24 | 0.24 | 0.0576 | 0 | 0 | INDEPENDENCE_COMPATIBLE | 0.84816 | 0.84816 | 0 |
| MATCHED_COMMON_CAUSE | 10000 | 0.24 | 0.24 | 0.2020 | 0.1444 | 0.426105 | COMMON_MODE_EVIDENCE | 0.71820 | 0.84816 | 0.12996 |
| MATCHED_ANTI_DEPENDENCE | 10000 | 0.24 | 0.24 | 0 | -0.0576 | 0.111235 | DEPENDENCE_OTHER_DIRECTION | 0.90000 | 0.84816 | -0.05184 |
| SMALL_AMBIGUOUS | 25 | 0.24 | 0.24 | 0.0800 | 0.0224 | 0.010359 | INSUFFICIENT_EVIDENCE | 0.82800 | 0.84816 | 0.02016 |

## Main result

The three large datasets expose identical marginal failure dashboards but different joint failure domains.

Using the observed joint co-failure rate reconstructs AH24's dual-path values:

- independent: **0.84816**
- common cause: **0.71820**
- anti-dependence: **0.90000**

Assuming independence from marginals alone reports **0.84816** for all three.

Operationally:

`same marginals != same failure domain`

and:

`joint traces can expose hidden reliability coupling erased by marginal dashboards`

`INDEPENDENCE_COMPATIBLE` is explicitly not a proof of independence, and `INSUFFICIENT_EVIDENCE` is a valid audit state rather than an error.
