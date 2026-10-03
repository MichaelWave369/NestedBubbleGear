# AH21 v0.1.0 Qualification Results

## Verdict

**PASS_AH21_QUALIFIED**

- Frozen acceptance checks: **64/64**
- Unit tests: **16/16 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Synthesized hardening

| Task | Newly authorized coalition | Hardened minimal success | Hardened cuts | p=0.1 baseline → hardened → capability |
|---|---|---|---|---|
| C_CLASS_ALARM | {E1,E2} | {E3}, {E1,E2} | {E1,E3}, {E2,E3} | 0.900 → 0.981 → 0.990 |
| GLOBAL_REAUTH | {E2,E3} | {E1,E2}, {E2,E3} | {E2}, {E1,E3} | 0.810 → 0.891 → 0.891 |
| H2_FULL | {E2,E3} | {E1,E2}, {E2,E3} | {E2}, {E1,E3} | 0.810 → 0.891 → 0.891 |
| ROUTE_REAUTH | {E1,E2} | {E1,E2}, {E2,E3} | {E2}, {E1,E3} | 0.810 → 0.891 → 0.891 |

## Main result

Every frozen policy removes all policy-induced singleton cuts by authorizing exactly **one** additional coalition.

For H2_FULL and GLOBAL_REAUTH the optimizer adds `{E2,E3}`. For ROUTE_REAUTH it adds `{E1,E2}`. Those three policies recover full mathematical capability resilience.

For C_CLASS_ALARM the optimizer preserves the explicit deny on singleton `{E1}` and adds only `{E1,E2}` as a backup path.

The alarm reliability moves `0.900 → 0.981 → 0.990` at `p=0.1`, where the last number is full mathematical capability.

The hardened alarm policy remains a strict subset of capability and has no singleton failure cut.

## Interpretation

`diagnose fragility → enumerate legal expansions → synthesize minimum hardening`

AH21 solves only this finite constrained optimization problem. It does not recommend automatic deployment of generated policy.
