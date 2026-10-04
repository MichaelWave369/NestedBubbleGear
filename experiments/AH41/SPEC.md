# AH41 Frozen Specification

## 1. Purpose

AH41 distinguishes:

\[
\text{logical verifier seat}
\]

from:

\[
\text{independent physical principal}.
\]

AH40's authorization rules are defined over logical seats. AH41 asks how physical ownership changes:

- verification capability;
- declassification capability;
- compromise threshold;
- availability failure cuts;
- finite reliability.

## 2. Logical seats

Freeze exactly three logical verifier seats:

```text
A
B
C
```

## 3. Physical principals

Freeze exactly three physical principals:

```text
PRINCIPAL_A
PRINCIPAL_B
PRINCIPAL_C
```

## 4. Ownership maps

### INDEPENDENT

```text
PRINCIPAL_A -> {A}
PRINCIPAL_B -> {B}
PRINCIPAL_C -> {C}
```

### FUSED_AB

```text
PRINCIPAL_A -> {A,B}
PRINCIPAL_B -> {C}
PRINCIPAL_C -> {}
```

`FUSED_AB` is intentionally a negative-control topology for seat independence.

## 5. Logical authorization policies

### VERIFY_POLICY

Authorize when at least two distinct logical seats are controlled:

\[
|S|\ge2.
\]

### STRICT_DECLASSIFY_POLICY

Authorize only when all three logical seats are controlled:

\[
|S|=3.
\]

### WEAK_DECLASSIFY_NEGATIVE_CONTROL

Authorize when at least two logical seats are controlled:

\[
|S|\ge2.
\]

The weak policy is frozen only as a negative control.

## 6. Physical compromise coalitions

For a physical coalition \(C\), define controlled logical seats:

\[
Seats(C)=\bigcup_{p\in C}Seats(p).
\]

A physical coalition is capable when `Seats(C)` satisfies the logical policy.

Enumerate all:

\[
2^3=8
\]

physical coalitions under each ownership map.

## 7. Verification compromise threshold

### Independent ownership

Minimal verification-capable physical coalitions:

```text
{PRINCIPAL_A, PRINCIPAL_B}
{PRINCIPAL_A, PRINCIPAL_C}
{PRINCIPAL_B, PRINCIPAL_C}
```

Minimum physical threshold:

\[
\boxed{2}.
\]

### Fused ownership

`PRINCIPAL_A` alone controls:

\[
\{A,B\}.
\]

Therefore the unique minimal verification-capable physical coalition is:

```text
{PRINCIPAL_A}
```

Minimum physical threshold:

\[
\boxed{1}.
\]

Thus:

\[
\boxed{
\text{logical 2-of-3}
\not\Rightarrow
\text{two independent principals}.
}
\]

## 8. Strict declassification compromise threshold

### Independent ownership

Minimal capable physical coalition:

```text
{PRINCIPAL_A, PRINCIPAL_B, PRINCIPAL_C}
```

Threshold:

\[
\boxed{3}.
\]

### Fused ownership

Minimal capable physical coalition:

```text
{PRINCIPAL_A, PRINCIPAL_B}
```

because `PRINCIPAL_A` contributes seats A+B and `PRINCIPAL_B` contributes C.

Threshold:

\[
\boxed{2}.
\]

So logical 3-of-3 becomes physical 2-of-2 among actual seat holders.

## 9. Weak declassification negative control

Under logical 2-of-3 declassification:

### Independent

Minimum physical compromise threshold:

\[
\boxed{2}.
\]

### Fused

`PRINCIPAL_A` alone controls A+B.

Minimum physical compromise threshold:

\[
\boxed{1}.
\]

Expected status:

```text
ROLE_FUSION_COLLAPSES_WEAK_DECLASSIFICATION_TO_SINGLE_PRINCIPAL
```

## 10. Failure / availability model

Treat a physical principal as either:

- `UP`
- `DOWN`

A service is available when the remaining UP principals collectively control enough logical seats for the policy.

A **minimal physical failure cut** is an inclusion-minimal set of DOWN principals that makes the policy unavailable.

## 11. Verification failure cuts

### Independent ownership

Verification needs any two logical seats.

Minimal physical failure cuts:

```text
{PRINCIPAL_A, PRINCIPAL_B}
{PRINCIPAL_A, PRINCIPAL_C}
{PRINCIPAL_B, PRINCIPAL_C}
```

Minimum cut size:

\[
\boxed{2}.
\]

### Fused ownership

If `PRINCIPAL_A` fails, both A and B disappear and only C remains.

Unique minimal failure cut:

```text
{PRINCIPAL_A}
```

Minimum cut size:

\[
\boxed{1}.
\]

Role fusion therefore creates a verification single point of failure.

## 12. Strict declassification failure cuts

### Independent ownership

All three seats are required.

Any one principal failure removes one required seat.

Minimal cuts:

```text
{PRINCIPAL_A}
{PRINCIPAL_B}
{PRINCIPAL_C}
```

### Fused ownership

All three logical seats require both actual seat holders:

```text
PRINCIPAL_A
PRINCIPAL_B
```

`PRINCIPAL_C` owns no seat.

Minimal cuts:

```text
{PRINCIPAL_A}
{PRINCIPAL_B}
```

## 13. Reliability at independent physical failure rate p=0.1

Freeze:

\[
p=0.1.
\]

All physical principal failures are independent in this toy control.

### Verification, independent ownership

At least two of three principals must be UP:

\[
R_V^{ind}
=
(1-p)^3+3(1-p)^2p
=
\boxed{0.972}.
\]

### Verification, fused ownership

`PRINCIPAL_A` must be UP; its A+B seats alone satisfy verification:

\[
R_V^{fused}
=
1-p
=
\boxed{0.9}.
\]

Thus fusion lowers verification availability.

### Strict declassification, independent ownership

All three principals must be UP:

\[
R_D^{ind}
=
(1-p)^3
=
\boxed{0.729}.
\]

### Strict declassification, fused ownership

Only the two actual seat-holders must be UP:

\[
R_D^{fused}
=
(1-p)^2
=
\boxed{0.81}.
\]

Thus role fusion increases strict declassification availability while reducing its physical compromise threshold from 3 to 2.

This is a security/availability tradeoff, not a universal design recommendation.

## 14. AH40 output-schema preservation

Reuse AH40's ten-panel disclosure model.

For every physically verification-capable coalition, `VERIFY_ONLY` emits only the mediated panel-independent receipt.

Expected ordinary-observer privacy:

\[
\boxed{0.4\text{ bits}}.
\]

A physically declassification-capable coalition invoking `DECLASSIFY_EPOCH0` emits \(Z_0\).

Expected privacy:

\[
\boxed{0\text{ bits}}.
\]

## 15. Malicious upgrade attempt

Freeze this witness under **independent ownership**:

```text
coalition = {PRINCIPAL_A, PRINCIPAL_B}
requested action = DECLASSIFY_EPOCH0
policy = STRICT_DECLASSIFY_POLICY
```

The coalition controls only seats A+B.

Expected:

```text
REFUSE_DECLASSIFICATION_QUORUM
```

No panel-dependent evidence is emitted.

Ordinary observer remains at:

\[
\boxed{0.4\text{ bits}}.
\]

So a verification-capable coalition cannot merely rename its request and bypass the stricter action policy.

## 16. Role-fusion weak-policy negative control

Under `FUSED_AB` plus weak 2-of-3 declassification:

```text
coalition = {PRINCIPAL_A}
```

controls A+B and is therefore authorized.

If it invokes declassification, observer privacy becomes:

\[
\boxed{0}.
\]

This is the frozen demonstration that logical seats do not guarantee independent control.

## 17. Interpretation

AH41 supports:

\[
\boxed{
\text{logical quorum size}
\neq
\text{independent principal threshold}
}
\]

and:

\[
\boxed{
\text{role fusion can simultaneously change compromise threshold and availability}.
}
\]

It also supports:

\[
\boxed{
\text{availability quorum}
\neq
\text{declassification compromise threshold}.
}
\]

## 18. Claim firewall

AH41 does not establish:

- threshold cryptography;
- Byzantine fault tolerance;
- malicious-party MPC security;
- real-world correlated failure rates;
- production key custody;
- secure hardware independence;
- organizational independence merely because accounts have different names.

It proves only finite seat-ownership, coalition, failure-cut, reliability, and mediated-output facts in the frozen toy model.
