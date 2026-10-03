# AH20 v0.1.0 Qualification Results

## Verdict

**PASS_AH20_QUALIFIED**

- Frozen acceptance checks: **68/68**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**
- Enumerated failure sets per task: **8**

## Minimal cut sets

| Task | Capability cuts | Policy cuts | Policy-induced singleton cuts |
|---|---|---|---|
| C_CLASS_ALARM | {E1,E3} | {E3} | {E3} |
| GLOBAL_REAUTH | {E2}, {E1,E3} | {E1}, {E2} | {E1} |
| H2_FULL | {E2}, {E1,E3} | {E1}, {E2} | {E1} |
| ROUTE_REAUTH | {E2}, {E1,E3} | {E2}, {E3} | {E3} |

## Reliability polynomials

For the three full reconstruction/reauthorization tasks:

`R_cap(p) = 1 - p - p^2 + p^3 = (1-p)(1-p^2)`

`R_policy(p) = 1 - 2p + p^2 = (1-p)^2`

`ΔR(p) = p(1-p)^2`

At `p=0.1`: capability = **0.891**, policy = **0.81**, gap = **0.081**.

For `C_CLASS_ALARM`:

`R_cap(p) = 1 - p^2`

`R_policy(p) = 1 - p`

`ΔR(p) = p(1-p)`

At `p=0.1`: capability = **0.99**, policy = **0.9**.

## Main result

Minimal failure cuts exactly match the minimal hitting sets of the corresponding minimal successful coalitions.

`E2` is a mathematical single point of failure for the full tasks.

But policy introduces additional singleton vulnerabilities:

- `E1` for H2_FULL and GLOBAL_REAUTH;
- `E3` for ROUTE_REAUTH;
- `E3` for C_CLASS_ALARM, even though alarm capability has **no** singleton failure.

So:

`capability resilience != policy resilience`

A stricter governance policy can trade away mathematically available redundancy. AH20 measures that tradeoff; it does not judge whether the policy choice is appropriate.

## Claim boundary

The reliability polynomial assumes independent identical Keyhole failure probability only as a diagnostic toy model. AH20 makes no deployed-system reliability or safety guarantee.
