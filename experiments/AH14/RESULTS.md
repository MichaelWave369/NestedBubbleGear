# AH14 v0.1.0 Qualification Results

## Verdict

**PASS_AH14**

- Frozen acceptance checks: **43/43**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **true**
- Replay exact: **true**
- Frozen histories: **48**
- Old full-capability action classes: **15**
- Old action entropy: **3.875 bits**
- Unique old-memory receipt hashes: **15**

## Revocation table

| Role | New memory | Classes | Retention reduction | Revoked uncertainty after |
|---|---|---:|---:|---:|
| GLOBAL_OPERATOR | residue | 13 | 0.25 bits | 0.25 bits |
| INTERFACE_INSPECTOR | H2 | 3 | 2.375 bits | 2.375 bits |
| DOWNSTREAM_INSPECTOR | H3 | 9 | 0.7971804688852169 bits | 0.7971804688852168 bits |
| ROUTE_AUDITOR | P2 | 13 | 0.25 bits | 0.25 bits |

Before downgrade, full action memory answers every revoked query exactly:

```text
H(Y_revoked | D_old) = 0
```

After downgrade:

```text
H(Y_revoked | D_new) > 0
```

while every still-authorized query remains exact.

## Receipt comparison

A **new-state receipt** hashes only policy/version and the retained downgraded memory. It adds no information beyond the new memory:

```text
H(Y_revoked | D_new, R_new)
=
H(Y_revoked | D_new)
```

The negative-control **old-state receipt** hashes the discarded old action memory. All 15 old hashes are unique in the frozen enumerable domain, so exhaustive lookup identifies the old action class:

```text
H(Y_revoked | D_new, R_old) = 0
```

This is not cryptographic inversion. The state space is tiny and known.

## Interpretation

```text
permission revoked
!= memory downgraded
!= secure erasure
```

AH14 demonstrates representation-level downgrade and a receipt-design hazard. It does **not** prove deletion from RAM, disk, caches, logs, backups, model weights, or external systems.
