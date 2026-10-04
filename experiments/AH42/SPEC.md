# AH42 Frozen Specification

## 1. Purpose

AH42 asks:

> What evidence is required before a quorum may be described as independently controlled?

AH41 showed that logical seats and physical principals can diverge. AH42 adds a deeper control-domain layer and refuses to infer independence from names alone.

## 2. Frozen logical seats

```text
A
B
C
```

Verification policy:

\[
|Seats|\ge2.
\]

Strict declassification policy:

\[
|Seats|=3.
\]

## 3. Frozen named principals

```text
PRINCIPAL_A
PRINCIPAL_B
PRINCIPAL_C
```

Logical seat ownership remains one seat per named principal:

```text
PRINCIPAL_A -> A
PRINCIPAL_B -> B
PRINCIPAL_C -> C
```

Therefore:

- logical seat count = 3;
- named-principal count = 3.

AH42 does not treat either number as proof of control-domain independence.

## 4. Root control domains

A root control domain is a frozen abstraction for a common authority source such as:

- one root credential;
- one administrator;
- one recovery key;
- one HSM custody domain;
- one host;
- one higher-level account.

These are examples only. AH42 does not model any real provider or hardware.

For a root-domain coalition \(D\), controlled principals are all principals whose **actual** root domain lies in \(D\). Controlled logical seats are then inherited from those principals.

## 5. Evidence model

For each principal freeze:

- `declared_root` — operator-declared domain label;
- `observed_root` — evidence-backed root fingerprint or `null`.

Certification uses only `observed_root`.

Declarations are retained only for contradiction reporting.

## 6. Certification statuses

### CERTIFIED_INDEPENDENT

Emit only when:

1. every principal has an observed root;
2. all observed roots are distinct.

Expected fields:

```text
status = CERTIFIED_INDEPENDENT
complete_evidence = true
verified_control_domain_count = 3
advertise_independent_quorum = true
```

### SHARED_CONTROL_OBSERVED

Emit when:

1. every principal has an observed root;
2. at least two observed roots are equal.

Expected:

```text
status = SHARED_CONTROL_OBSERVED
complete_evidence = true
advertise_independent_quorum = false
```

### INDEPENDENCE_UNVERIFIED

Emit when any principal lacks observed root evidence.

Expected:

```text
status = INDEPENDENCE_UNVERIFIED
complete_evidence = false
advertise_independent_quorum = false
```

No missing-evidence scenario may advertise a verified independent threshold.

## 7. Frozen scenarios

### S1 — CERTIFIED_INDEPENDENT

Actual root map:

```text
PRINCIPAL_A -> ROOT_A
PRINCIPAL_B -> ROOT_B
PRINCIPAL_C -> ROOT_C
```

Declared roots:

```text
DECL_A
DECL_B
DECL_C
```

Observed roots:

```text
ROOT_A
ROOT_B
ROOT_C
```

Expected certification:

```text
CERTIFIED_INDEPENDENT
```

Actual root-domain thresholds:

```text
VERIFY = 2
STRICT_DECLASSIFY = 3
```

### S2 — SHARED_AB_OBSERVED

Actual root map:

```text
PRINCIPAL_A -> ROOT_AB
PRINCIPAL_B -> ROOT_AB
PRINCIPAL_C -> ROOT_C
```

Declarations still claim three separate roots:

```text
DECL_A
DECL_B
DECL_C
```

Observed roots:

```text
ROOT_AB
ROOT_AB
ROOT_C
```

Expected certification:

```text
SHARED_CONTROL_OBSERVED
```

Expected contradiction:

```text
DECLARATION_CONTRADICTED_BY_SHARED_CONTROL_EVIDENCE
```

Actual root-domain thresholds:

```text
VERIFY = 1
STRICT_DECLASSIFY = 2
```

### S3 — INDEPENDENT_BUT_UNVERIFIED

Actual root map is independent:

```text
ROOT_A
ROOT_B
ROOT_C
```

but observed evidence is incomplete:

```text
ROOT_A
null
null
```

Expected certification:

```text
INDEPENDENCE_UNVERIFIED
```

The actual hidden declassification threshold is 3, but the certification layer must not advertise `3 independent domains`.

Expected:

```text
advertised_independent_declassification_threshold = null
```

### S4 — HIDDEN_SHARED_UNVERIFIED

Actual root map:

```text
ROOT_AB
ROOT_AB
ROOT_C
```

Observed evidence:

```text
null
null
ROOT_C
```

Expected certification:

```text
INDEPENDENCE_UNVERIFIED
```

Actual hidden thresholds:

```text
VERIFY = 1
STRICT_DECLASSIFY = 2
```

Again the certification layer must not advertise a three-independent-domain claim.

This is the central negative control:

\[
\boxed{
\text{refusal under missing evidence prevents a false independence claim even when hidden common control exists}.
}
\]

## 8. Root-domain compromise thresholds

Enumerate all coalitions of actual root domains for each scenario.

A root coalition is verification-capable when controlled logical seats satisfy 2-of-3.

A root coalition is strict-declassification-capable when controlled logical seats satisfy 3-of-3.

Expected thresholds:

| Scenario | VERIFY root threshold | STRICT DECLASSIFY root threshold |
|---|---:|---:|
| S1 independent | 2 | 3 |
| S2 shared AB | 1 | 2 |
| S3 independent but unverified | 2 | 3 |
| S4 hidden shared | 1 | 2 |

## 9. Minimal root-domain failure cuts

A root domain is `DOWN` when every principal controlled by that root becomes unavailable.

### S1 independent

Verification minimal failure cuts:

```text
{ROOT_A,ROOT_B}
{ROOT_A,ROOT_C}
{ROOT_B,ROOT_C}
```

Strict-declassification minimal failure cuts:

```text
{ROOT_A}
{ROOT_B}
{ROOT_C}
```

### S2/S4 shared AB

Verification minimal failure cut:

```text
{ROOT_AB}
```

Strict-declassification minimal failure cuts:

```text
{ROOT_AB}
{ROOT_C}
```

This mirrors the role-fusion effect at the deeper control-domain layer.

## 10. Reliability control at p=0.1 per actual root domain

Freeze independent root-domain failure probability:

\[
p=0.1.
\]

### S1/S3 independent-root topology

Verification:

\[
R_V=0.972.
\]

Strict declassification:

\[
R_D=0.729.
\]

### S2/S4 shared-root topology

Verification:

\[
R_V=0.9.
\]

Strict declassification:

\[
R_D=0.81.
\]

The same topology can therefore reduce compromise threshold while increasing strict-declassification availability.

These are toy reliability values only.

## 11. Certified-threshold advertisement

Define:

```text
advertised_independent_verification_threshold
advertised_independent_declassification_threshold
```

Rules:

### CERTIFIED_INDEPENDENT

Advertise:

```text
VERIFY = 2
STRICT_DECLASSIFY = 3
```

### SHARED_CONTROL_OBSERVED

Do not advertise an independent threshold.

Instead report:

```text
effective_verified_root_threshold_VERIFY = 1
effective_verified_root_threshold_DECLASSIFY = 2
```

### INDEPENDENCE_UNVERIFIED

Advertise neither independent nor effective verified threshold:

```text
null
```

Reason: incomplete evidence does not support either independence certification or a complete shared-control graph.

## 12. Different names negative control

All four scenarios have:

```text
logical seats = 3
named principals = 3
```

Yet actual strict-declassification root thresholds are either:

```text
3
```

or:

```text
2
```

depending on hidden root topology.

Therefore:

\[
\boxed{
\text{different account names}
\neq
\text{independent authority domains}.
}
\]

## 13. Evidence monotonicity

Freeze this evidence progression over the shared-AB ground truth:

### U0

No observed roots:

```text
null/null/null
```

Status:

```text
INDEPENDENCE_UNVERIFIED
```

### U1

Observe C only:

```text
null/null/ROOT_C
```

Status remains:

```text
INDEPENDENCE_UNVERIFIED
```

### U2

Observe A and B shared:

```text
ROOT_AB/ROOT_AB/ROOT_C
```

Status becomes:

```text
SHARED_CONTROL_OBSERVED
```

At no step may the system emit `CERTIFIED_INDEPENDENT`.

Thus additional evidence can resolve uncertainty toward observed sharing without passing through a fabricated independence state.

## 14. Receipt fields

Each scenario receipt records:

- scenario id;
- logical seat count;
- named-principal count;
- actual root-domain count;
- declarations;
- observed evidence;
- certification status;
- completeness;
- contradiction status;
- verified control-domain count when complete;
- actual verification compromise threshold;
- actual strict-declassification compromise threshold;
- minimal root failure cuts;
- p=0.1 reliability;
- advertised thresholds;
- deterministic receipt hash.

Replay must be byte-exact.

## 15. Interpretation

AH42 supports:

\[
\boxed{
\text{independence is an evidence-bearing claim, not a naming convention}.
}
\]

and:

\[
\boxed{
\text{missing independence evidence should produce refusal, not optimistic certification}.
}
\]

It also reconnects hidden common-control topology to NBG's recurring theme:

\[
\boxed{
\text{apparently separate interfaces can share one latent causal/control domain}.
}
\]

## 16. Claim firewall

AH42 does not establish:

- real organizational independence;
- secure hardware independence;
- HSM independence;
- credential-compromise probabilities;
- trustworthy identity proofing;
- correctness of any real recovery system;
- Byzantine independence.

It proves only finite graph, evidence-state, threshold, failure-cut, reliability, and certification/refusal properties in the frozen toy model.
