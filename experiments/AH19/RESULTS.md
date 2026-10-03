# AH19 v0.1.0 Qualification Results

## Verdict

**PASS_AH19_QUALIFIED**

- Frozen acceptance checks: **65/65**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**
- Enumerated coalitions per task: **8**

## Access structures

| Task | Capable coalitions | Minimal coalitions | Mandatory core |
|---|---:|---|---|
| C_CLASS_ALARM | 6/8 | {E1}, {E3} | ∅ |
| GLOBAL_REAUTH | 3/8 | {E1,E2}, {E2,E3} | {E2} |
| H2_FULL | 3/8 | {E1,E2}, {E2,E3} | {E2} |
| ROUTE_REAUTH | 3/8 | {E1,E2}, {E2,E3} | {E2} |

## Main result

The full H2 reconstruction, GLOBAL reauthorization, and ROUTE reauthorization tasks all recover the same mathematical capability family:

`{E1,E2}`, `{E2,E3}`, and `{E1,E2,E3}`.

Their minimal capable coalitions are `{E1,E2}` and `{E2,E3}`, making `E2` the mandatory core Keyhole.

The coarse `C_CLASS_ALARM` task has a different access structure. Its minimal capable coalitions are the singleton views `{E1}` and `{E3}`, so its mandatory core is empty.

Thus the same authority views induce different access structures for different future queries.

## Policy overlay

For every task, the frozen policy-authorized coalition family is:

- upward-closed;
- a subset of mathematical capability;
- a **strict** subset of mathematical capability.

So coalition-level capability and authority remain distinct even after the entire capability family is enumerated.

## Interpretation

`A_Q = { C : H(Q | D_local, C) = 0 }`

is an exact finite access structure in this model.

All four frozen capability families are upward-closed, their minimal sufficient coalitions are recovered exactly, and their mandatory cores are task-relative.

This is an information-partition/access-structure result, not a cryptographic secret-sharing or real-world identity theorem.
