# AH44 Frozen Specification

## 1. Purpose

AH44 asks:

> Can event-driven revocation reduce the hidden-change window left by certificate TTL polling, while preserving the distinction between "something changed" and "we know the new topology"?

AH43 froze:

\[
TTL=2.
\]

The old certificate is issued at `t0`.

Actual A+B root fusion occurs at:

\[
t_2.
\]

Without new evidence, the old certificate remains policy-fresh through t2 and expires at t3.

## 2. Frozen actual topologies

Independent topology:

```text
PRINCIPAL_A -> ROOT_A
PRINCIPAL_B -> ROOT_B
PRINCIPAL_C -> ROOT_C
```

Shared A/B topology:

```text
PRINCIPAL_A -> ROOT_AB
PRINCIPAL_B -> ROOT_AB
PRINCIPAL_C -> ROOT_C
```

Actual root thresholds:

| Topology | VERIFY | DECLASSIFY |
|---|---:|---:|
| independent | 2 | 3 |
| shared A/B | 1 | 2 |

At independent root-domain failure probability `p=0.1`:

| Topology | VERIFY reliability | DECLASSIFY reliability |
|---|---:|---:|
| independent | 0.972 | 0.729 |
| shared A/B | 0.900 | 0.810 |

## 3. Frozen certificate

Certificate issue epoch:

```text
t0
```

Observed roots at issue:

```text
ROOT_A / ROOT_B / ROOT_C
```

Certificate TTL:

\[
\boxed{2\text{ epochs}}.
\]

Before any trusted revocation event, status is:

```text
CERTIFIED_FRESH
```

for ages 0, 1, and 2.

At age 3 without revalidation:

```text
CERTIFICATE_STALE
```

## 4. Change-event model

Each event contains:

- `event_id`;
- `event_epoch`;
- `claimed_change`;
- `source`;
- `provenance_status`.

Frozen provenance states:

```text
TRUSTED
UNTRUSTED
```

AH44 treats only `TRUSTED` events as authoritative revocation triggers.

A trusted event **does not** supply enough evidence to certify the new root topology.

Therefore, on accepted trusted change event:

```text
certificate_status = INDEPENDENCE_REVOKED_PENDING_REVALIDATION
advertise_independent_quorum = false
advertised_VERIFY = null
advertised_DECLASSIFY = null
```

until revalidation.

## 5. Revalidation

At t4, fresh root evidence is collected.

If roots are distinct:

```text
REVALIDATED_INDEPENDENT
CERTIFIED_FRESH
```

If roots show A+B sharing:

```text
REVALIDATION_DISCOVERED_SHARED_CONTROL
SHARED_CONTROL_OBSERVED
effective verified thresholds = 1 / 2
```

Event-driven revocation is therefore a **prospective refusal mechanism**, not a replacement for revalidation.

## 6. Control C1 — TTL_ONLY

Actual topology:

```text
t0 independent
t1 independent
t2 shared A/B
t3 shared A/B
t4 shared A/B
```

No change event.

Expected:

```text
t0 CERTIFIED_FRESH       advertise=true
t1 CERTIFIED_FRESH       advertise=true
t2 CERTIFIED_FRESH       advertise=true  <-- false advertisement
t3 CERTIFICATE_STALE     advertise=false
t4 SHARED_CONTROL_OBSERVED after revalidation
```

False-advertisement epochs after actual fusion and before revalidation:

\[
\boxed{1}.
\]

## 7. Control C2 — TRUSTED_IMMEDIATE

Actual fusion at t2.

Trusted change event delivered at t2:

```text
source = CONTROL_DOMAIN_MONITOR
provenance = TRUSTED
claimed_change = CONTROL_DOMAIN_CHANGED
```

Expected:

```text
t2 INDEPENDENCE_REVOKED_PENDING_REVALIDATION
advertise=false
```

The event is accepted before any t2 independence advertisement is emitted.

False-advertisement epochs after fusion:

\[
\boxed{0}.
\]

At t4, revalidation discovers shared A+B:

```text
SHARED_CONTROL_OBSERVED
```

## 8. Control C3 — TRUSTED_DELAYED_1

Actual fusion at t2.

Trusted event delivered at t3.

Expected:

```text
t2 CERTIFIED_FRESH advertise=true  <-- false advertisement
t3 INDEPENDENCE_REVOKED_PENDING_REVALIDATION advertise=false
t4 SHARED_CONTROL_OBSERVED
```

False-advertisement epochs:

\[
\boxed{1}.
\]

Thus one-epoch event latency preserves a one-epoch hidden-change window.

## 9. Control C4 — MISSING_EVENT

Actual fusion at t2.

No event ever arrives.

Expected behavior equals TTL-only:

\[
\boxed{1}
\]

false-advertisement epoch.

Certificate expiry at t3 eventually removes the old claim.

## 10. Control C5 — FALSE_POSITIVE_TRUSTED

Actual topology remains independent through t4.

Trusted change event arrives at t2 even though no root change occurred.

Expected:

```text
t0 CERTIFIED_FRESH
t1 CERTIFIED_FRESH
t2 INDEPENDENCE_REVOKED_PENDING_REVALIDATION
t3 INDEPENDENCE_REVOKED_PENDING_REVALIDATION
t4 REVALIDATED_INDEPENDENT -> CERTIFIED_FRESH
```

Consequences:

- no false independence claim occurs;
- independence availability is conservatively reduced for t2/t3;
- revalidation restores certification.

Count of unnecessary-refusal epochs:

\[
\boxed{2}.
\]

This is the false-positive cost control.

## 11. Control C6 — UNTRUSTED_IMMEDIATE

Actual fusion occurs at t2.

An event arrives at t2 with:

```text
provenance = UNTRUSTED
```

Expected:

```text
event_action = REFUSE_UNTRUSTED_CHANGE_EVENT
```

Certification state remains governed by TTL:

```text
t2 CERTIFIED_FRESH advertise=true
t3 CERTIFICATE_STALE advertise=false
```

False-advertisement epochs:

\[
\boxed{1}.
\]

Thus event presence alone is not authority.

\[
\boxed{
\text{change signal}
\neq
\text{trusted revocation authority}.
}
\]

## 12. False-advertisement metric

Define a false-advertisement epoch as one where:

1. actual topology is shared A/B;
2. the system still advertises the old independent quorum.

Expected counts:

| Control | False-advertisement epochs |
|---|---:|
| TTL_ONLY | 1 |
| TRUSTED_IMMEDIATE | 0 |
| TRUSTED_DELAYED_1 | 1 |
| MISSING_EVENT | 1 |
| FALSE_POSITIVE_TRUSTED | 0 |
| UNTRUSTED_IMMEDIATE | 1 |

`FALSE_POSITIVE_TRUSTED` has zero false independence advertisements because actual topology never changed.

## 13. Revocation latency

For controls with actual fusion at t2, define revocation latency as:

\[
t_{\rm first\ no\ advertise}-t_2.
\]

Expected:

| Control | Revocation latency |
|---|---:|
| TTL_ONLY | 1 |
| TRUSTED_IMMEDIATE | 0 |
| TRUSTED_DELAYED_1 | 1 |
| MISSING_EVENT | 1 |
| UNTRUSTED_IMMEDIATE | 1 |

The false-positive control has no actual change and therefore no change-relative latency.

## 14. Trusted event does not certify sharing

At t2 in `TRUSTED_IMMEDIATE`:

```text
status = INDEPENDENCE_REVOKED_PENDING_REVALIDATION
```

not:

```text
SHARED_CONTROL_OBSERVED
```

Fresh shared-root evidence appears only at t4.

Therefore:

\[
\boxed{
\text{credible change evidence}
\neq
\text{complete new-topology evidence}.
}
\]

## 15. Event provenance and receipts

Every event receipt records:

- control;
- epoch;
- actual topology;
- certificate age;
- certificate status;
- advertisement flag;
- actual thresholds;
- advertised thresholds;
- event delivered?;
- event provenance;
- event action;
- revalidation action;
- deterministic receipt hash.

Replay must be exact.

## 16. Interpretation

AH44 supports:

\[
\boxed{
\text{certificate freshness}
\neq
\text{continuous change detection}.
}
\]

and:

\[
\boxed{
\text{trusted event-driven revocation can reduce the hidden-change window without pretending to know the new topology}.
}
\]

It also supports:

\[
\boxed{
\text{event provenance is part of revocation authority}.
}
\]

## 17. Claim firewall

AH44 does not establish:

- secure event transport;
- truthful monitoring;
- Byzantine event sources;
- real-time detection guarantees;
- optimal TTL/event-latency values;
- production identity or HSM monitoring;
- real-world false-positive/false-negative rates.

It proves only finite event/TTL/revalidation/refusal properties in the frozen toy model.

## 18. Arc closure

AH44 is the final planned temporal-certification rung.

The next phase is **not AH45**.

The next phase is meta-qualification:

1. independent second implementation;
2. property-based/generated universes;
3. mutation testing;
4. metamorphic invariants;
5. flagship-result reproduction bundles;
6. explicit attempts to falsify the major claims.
