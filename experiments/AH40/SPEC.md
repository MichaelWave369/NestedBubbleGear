# AH40 Frozen Specification

## 1. Purpose

AH40 asks:

> Can a verifier coalition be authorized to establish that an old epoch is valid without automatically being authorized to publish the old evidence?

Core distinction:

\[
\boxed{
\text{verification quorum}
\neq
\text{public evidence-release quorum}
}
\]

The experiment also distinguishes coalition capability from the action actually exercised and from the output schema emitted.

## 2. Frozen substrate

Reuse AH39's ten-panel ensemble.

Full target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

Epoch-0 rich profile:

```text
TRIAGE
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Epoch-1 downgraded profile:

```text
COMMON_ONLY
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Expected:

\[
H(M\mid Z_0)=0
\]

and:

\[
H(M\mid Z_1)=0.4.
\]

## 3. Frozen verifier principals

Use exactly:

```text
VERIFIER_A
VERIFIER_B
VERIFIER_C
```

There are:

\[
2^3=8
\]

verifier coalitions.

## 4. Verification policy

A coalition may invoke:

```text
VERIFY_ONLY
```

iff:

\[
|C|\ge2.
\]

Thus verification-capable coalitions are:

```text
{A,B}
{A,C}
{B,C}
{A,B,C}
```

Count:

\[
\boxed{4/8}.
\]

Minimal verification coalitions:

```text
{A,B}
{A,C}
{B,C}
```

There is no mandatory verifier present in every minimal verification quorum.

Unauthorized coalitions receive:

```text
REFUSE_VERIFICATION_QUORUM
```

## 5. Declassification policy

A coalition may invoke:

```text
DECLASSIFY_EPOCH0
```

iff:

\[
|C|=3.
\]

Therefore only:

```text
{A,B,C}
```

is declassification-capable.

Count:

\[
\boxed{1/8}.
\]

Minimal declassification coalition:

```text
{A,B,C}
```

Unauthorized coalitions receive:

```text
REFUSE_DECLASSIFICATION_QUORUM
```

## 6. Mediated verification output

A successful `VERIFY_ONLY` action performs the old-epoch integrity check internally.

The public observer receives only:

```json
{
  "epoch": 0,
  "verification": "VERIFIED",
  "action": "VERIFY_ONLY",
  "schema": "AH40-E0"
}
```

This receipt is panel-independent.

The observer also has Epoch-1 disclosure \(Z_1\).

For every verification-capable coalition:

\[
\boxed{
H(M\mid VERIFIED,C,Z_1)=0.4.
}
\]

Coalition identity \(C\) is public but panel-independent.

Acceptance requires exactly seven descriptor classes, the same as fresh Epoch 1.

## 7. Full coalition verification-only control

The full coalition:

```text
{A,B,C}
```

is both verification-capable and declassification-capable.

If it exercises:

```text
VERIFY_ONLY
```

the output remains the mediated receipt.

Expected:

\[
\boxed{
H(M\mid VERIFY\_ONLY,\{A,B,C\},Z_1)=0.4.
}
\]

Thus:

\[
\boxed{
\text{declassification capability}
\not\Rightarrow
\text{declassification occurs}.
}
\]

Action selection remains part of the authority boundary.

## 8. Full coalition declassification

When:

```text
{A,B,C}
```

invokes:

```text
DECLASSIFY_EPOCH0
```

the public output contains:

\[
Z_0.
\]

Observer descriptor includes:

\[
(Z_0,Z_1).
\]

Expected:

\[
\boxed{
H(M\mid Z_0,Z_1)=0.
}
\]

Expected descriptor classes:

\[
\boxed{9}.
\]

Emit status:

```text
DECLASSIFIED_BY_3_OF_3_QUORUM
```

## 9. Two-verifier declassification refusal

Each two-verifier coalition is verification-capable but declassification-incapable.

For:

```text
{A,B}
{A,C}
{B,C}
```

a `DECLASSIFY_EPOCH0` request must return:

```text
REFUSE_DECLASSIFICATION_QUORUM
```

with no:

- Epoch-0 snapshot;
- authenticator;
- key;
- panel-dependent digest.

This demonstrates:

\[
\boxed{
\text{verification authority}
\not\Rightarrow
\text{evidence-release authority}.
}
\]

## 10. Debug-transcript negative control

Reuse AH39's toy HMAC construction:

- 8-key candidate space;
- actual key `AH38-KEY-3`;
- public tag:
  \[
  T_0=HMAC(K,Z_0).
  \]

AH39 already showed that public \(T_0\) is enumerable in the frozen toy model.

Define a forbidden verification output:

```text
DEBUG_VERIFY_WITH_PUBLIC_TAG
```

that would emit:

```text
VERIFIED + T0
```

to the public observer.

Expected:

\[
\boxed{
H(M\mid VERIFIED,T_0,Z_1)=0.
}
\]

Therefore the verifier output schema is itself part of the disclosure boundary.

AH40 does not expose this output in the accepted verification API.

## 11. Exhaustive coalition/action matrix

For every one of eight coalitions, evaluate:

- `VERIFY_ONLY`
- `DECLASSIFY_EPOCH0`

Expected counts:

### VERIFY_ONLY

- 4 `ALLOW`;
- 4 `REFUSE_VERIFICATION_QUORUM`.

### DECLASSIFY_EPOCH0

- 1 `ALLOW`;
- 7 `REFUSE_DECLASSIFICATION_QUORUM`.

No refused action may include panel-dependent evidence.

## 12. Access-structure comparison

Verification access structure:

\[
\mathcal V=
\{C:|C|\ge2\}.
\]

Minimal family:

\[
\boxed{
\{\{A,B\},\{A,C\},\{B,C\}\}.
}
\]

Declassification access structure:

\[
\mathcal D=
\{\{A,B,C\}\}.
\]

Therefore:

\[
\boxed{
\mathcal D\subsetneq\mathcal V.
}
\]

A coalition can have verification authority without evidence-release authority.

## 13. Public-observer privacy table

Expected:

| Scenario | Residual privacy |
|---|---:|
| Fresh E1 only | 0.4 |
| Any authorized 2-of-3 VERIFY_ONLY | 0.4 |
| Full 3-of-3 VERIFY_ONLY | 0.4 |
| Full 3-of-3 DECLASSIFY_EPOCH0 | 0 |
| Forbidden DEBUG_VERIFY_WITH_PUBLIC_TAG control | 0 |

## 14. Claim firewall

AH40 does not establish:

- threshold cryptography;
- secret sharing;
- MPC security;
- cryptographic quorum signatures;
- resistance to malicious verifiers;
- deployed key custody;
- secure hardware behavior.

Its 2-of-3 and 3-of-3 rules are finite authorization policies over a toy mediated verifier.

## 15. Interpretation

AH40 supports:

\[
\boxed{
\text{verification quorum}
\neq
\text{public evidence-release quorum}
}
\]

and:

\[
\boxed{
\text{coalition capability}
\neq
\text{action exercised}
\neq
\text{output disclosed}.
}
\]

This reconnects quorum topology to disclosure governance without pretending the experiment implements threshold cryptography.
