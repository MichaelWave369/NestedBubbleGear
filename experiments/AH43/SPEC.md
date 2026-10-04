# AH43 Frozen Specification

## 1. Purpose

AH43 asks:

> How long may an independence certificate be relied on, what happens when it becomes stale, and what can revalidation discover?

AH42 proved that missing independence evidence should produce refusal rather than optimistic certification.

AH43 adds certificate age and revalidation.

## 2. Frozen logical and control model

Reuse AH42:

Logical seats:

```text
A
B
C
```

Named principals:

```text
PRINCIPAL_A
PRINCIPAL_B
PRINCIPAL_C
```

Seat ownership:

```text
PRINCIPAL_A -> A
PRINCIPAL_B -> B
PRINCIPAL_C -> C
```

Independent root topology:

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

Verification policy:

\[
2\text{-of-}3
\]

logical seats.

Strict declassification policy:

\[
3\text{-of-}3
\]

logical seats.

## 3. Certificate freshness policy

Freeze certificate TTL:

\[
\boxed{TTL=2\text{ epochs}}.
\]

If certificate issue epoch is \(t_i\) and current epoch is \(t\), define:

\[
age=t-t_i.
\]

Certificate is policy-fresh iff:

\[
age\le2.
\]

Certificate is stale iff:

\[
age>2.
\]

This is an explicit governance policy, not a physical law.

## 4. Fresh certification

A certificate may be issued only from complete observed root evidence.

If all observed roots are distinct:

```text
status = CERTIFIED_FRESH
advertise_independent_quorum = true
advertised_VERIFY = 2
advertised_DECLASSIFY = 3
```

If complete observed evidence shows shared control:

```text
status = SHARED_CONTROL_OBSERVED
advertise_independent_quorum = false
```

If evidence is incomplete:

```text
status = INDEPENDENCE_UNVERIFIED
advertise_independent_quorum = false
```

## 5. Expiry behavior

When a previously independent certificate exceeds the TTL without revalidation:

```text
status = CERTIFICATE_STALE
advertise_independent_quorum = false
advertised_VERIFY = null
advertised_DECLASSIFY = null
```

Staleness does not assert that sharing exists.

It asserts only that the old evidence is no longer fresh enough to support the independence claim.

Thus:

\[
\boxed{
STALE
\neq
CONTRADICTED.
}
\]

## 6. Stable timeline

Freeze epochs:

```text
t0
t1
t2
t3
t4
```

Actual root topology remains independent at every epoch.

### S0 / t0 — ISSUE

Observed:

```text
ROOT_A / ROOT_B / ROOT_C
```

Issue certificate at t0.

Expected:

```text
status = CERTIFIED_FRESH
age = 0
advertise = true
```

### S1 / t1 — NO REVALIDATION

Age:

\[
1.
\]

Expected:

```text
CERTIFIED_FRESH
advertise = true
```

### S2 / t2 — NO REVALIDATION

Age:

\[
2.
\]

Expected:

```text
CERTIFIED_FRESH
advertise = true
```

### S3 / t3 — EXPIRED

Age:

\[
3.
\]

Expected:

```text
CERTIFICATE_STALE
advertise = false
```

### S4 / t4 — REVALIDATE

Observe distinct roots again and issue fresh certificate at t4.

Expected:

```text
CERTIFIED_FRESH
age = 0
advertise = true
action = REVALIDATED_INDEPENDENT
```

Actual root thresholds remain:

```text
VERIFY = 2
DECLASSIFY = 3
```

throughout.

## 7. Hidden-fusion timeline

Start from the same t0 certificate.

Actual topology changes at epoch 2:

```text
t0 independent
t1 independent
t2 shared A/B
t3 shared A/B
t4 shared A/B
```

No revalidation occurs until t4.

### F0 / t0

Issue distinct-root certificate.

Expected:

```text
CERTIFIED_FRESH
advertise = true
actual thresholds = 2 / 3
```

### F1 / t1

Certificate age 1.

Actual topology still independent.

Expected:

```text
CERTIFIED_FRESH
advertise = true
certificate_matches_ground_truth = true
```

### F2 / t2 — HIDDEN FUSION INSIDE FRESH WINDOW

Actual topology becomes shared A/B.

Old certificate age is exactly 2, therefore still policy-fresh.

Expected policy state:

```text
CERTIFIED_FRESH
advertise = true
advertised thresholds = 2 / 3
```

But actual root-domain thresholds are now:

```text
VERIFY = 1
DECLASSIFY = 2
```

Expected control label:

```text
FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED
```

This is a deliberate negative control.

AH43 must not claim that freshness prevents between-check topology changes.

### F3 / t3 — EXPIRED

Old certificate age 3.

Expected:

```text
CERTIFICATE_STALE
advertise = false
```

Actual hidden thresholds remain:

```text
1 / 2
```

Expiry removes the unsupported old independence advertisement before revalidation occurs.

### F4 / t4 — REVALIDATE

Observe:

```text
ROOT_AB / ROOT_AB / ROOT_C
```

Expected:

```text
status = SHARED_CONTROL_OBSERVED
advertise = false
action = REVALIDATION_DISCOVERED_SHARED_CONTROL
effective verified thresholds = 1 / 2
```

## 8. Freshness-window negative result

In the hidden-fusion timeline, exactly one epoch is frozen where:

1. the certificate is still policy-fresh;
2. governance still advertises independent thresholds;
3. actual hidden topology has already changed.

Expected count:

\[
\boxed{1}
\]

at:

```text
F2 / t2
```

Therefore:

\[
\boxed{
\text{certificate freshness bounds evidence age, not change detection latency to zero}.
}
\]

## 9. TTL sensitivity control

Keep:

```text
certificate issued at t0
hidden fusion begins at t2
no revalidation before t4
```

Evaluate TTL values:

```text
0
1
2
3
```

Count pre-revalidation epochs in:

```text
t2,t3
```

where the certificate would still be policy-fresh after hidden fusion.

Expected:

| TTL | false-advertisement epochs |
|---:|---:|
| 0 | 0 |
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |

Thus longer freshness windows increase the frozen maximum period in which hidden control changes can remain covered by an old certificate.

This is a toy polling tradeoff, not a recommendation for any real TTL.

## 10. Stale versus contradicted

Freeze distinct statuses:

```text
CERTIFICATE_STALE
SHARED_CONTROL_OBSERVED
```

At S3 and F3, the system has stale evidence but no fresh contradiction.

At F4, new evidence positively identifies sharing.

Acceptance requires these states never be conflated.

## 11. Revalidation restoration

Stable timeline:

```text
CERTIFICATE_STALE
 -> REVALIDATED_INDEPENDENT
 -> CERTIFIED_FRESH
```

Hidden-fusion timeline:

```text
CERTIFICATE_STALE
 -> REVALIDATION_DISCOVERED_SHARED_CONTROL
 -> SHARED_CONTROL_OBSERVED
```

Thus revalidation is evidence-producing, not merely a timestamp reset.

## 12. Actual threshold and reliability control

Reuse AH42's actual-root calculations.

Independent topology:

```text
VERIFY threshold = 2
DECLASSIFY threshold = 3
VERIFY reliability at p=0.1 = 0.972
DECLASSIFY reliability at p=0.1 = 0.729
```

Shared A/B topology:

```text
VERIFY threshold = 1
DECLASSIFY threshold = 2
VERIFY reliability at p=0.1 = 0.9
DECLASSIFY reliability at p=0.1 = 0.81
```

The hidden-fusion timeline must reflect these actual values immediately at t2 even while the old certificate remains fresh.

## 13. Receipt fields

Each event receipt records:

- timeline;
- event id;
- epoch;
- action;
- actual root map;
- actual root-domain count;
- actual verification threshold;
- actual declassification threshold;
- actual reliability values;
- certificate issue epoch;
- certificate age;
- certificate TTL;
- certificate status;
- advertisement flag;
- advertised thresholds;
- last observed root evidence;
- evidence freshness;
- ground-truth consistency label;
- deterministic receipt hash.

Replay must be byte-exact.

## 14. Interpretation

AH43 supports:

\[
\boxed{
\text{independence certified once}
\neq
\text{independence certified forever}
}
\]

and:

\[
\boxed{
\text{stale evidence should remove an independence advertisement until revalidated}.
}
\]

It also supports the narrower negative result:

\[
\boxed{
\text{fresh certificate}
\neq
\text{proof that control topology has not changed since observation}.
}
\]

## 15. Claim firewall

AH43 does not establish:

- optimal real-world TTL values;
- continuous attestation;
- secure hardware monitoring;
- real credential-rotation semantics;
- real-time compromise detection;
- PKI correctness;
- identity-provider freshness guarantees.

It proves only finite temporal-certificate, expiry, hidden-change, revalidation, threshold, and refusal properties in the frozen toy model.