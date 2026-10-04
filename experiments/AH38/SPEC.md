# AH38 Frozen Specification

## 1. Purpose

AH38 asks:

> Which epoch-verification artifacts cross the forward privacy boundary, and whose authority over secret verification material matters?

AH37 established:

\[
H(M\mid Z_1)=0.4
\]

for a fresh Epoch-1 observer, but:

\[
H(M\mid SHA256(Z_0),Z_1)=0
\]

in the frozen enumerable domain.

AH38 compares public digest, public salt, finite hidden-key constructions, and mediated verification.

## 2. Frozen substrate

Reuse AH37's ten-panel ensemble.

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

## 3. Public deterministic digest

Construction:

\[
D_{public}=SHA256(canonical(Z_0)).
\]

Expected:

- distinct digest classes: 9;
- residual privacy:
  \[
  H(M\mid D_{public})=0;
  \]
- with Epoch 1:
  \[
  H(M\mid D_{public},Z_1)=0.
  \]

This reproduces AH37.

## 4. Public-salt digest

Freeze public salt:

```text
AH38-PUBLIC-SALT-v1
```

Construction:

\[
D_{salt,pub}
=
SHA256(
salt_{pub}\Vert canonical(Z_0)
).
\]

The salt is known to the observer.

Expected:

- distinct digest classes: 9;
- residual privacy:
  \[
  H(M\mid D_{salt,pub})=0;
  \]
- with Epoch 1:
  \[
  H(M\mid D_{salt,pub},Z_1)=0.
  \]

Public salt changes the digest values but does not prevent enumeration of the frozen candidate domain.

## 5. Finite toy HMAC keyspace

Freeze key candidates:

```text
AH38-KEY-0
AH38-KEY-1
...
AH38-KEY-7
```

Freeze actual key:

```text
AH38-KEY-3
```

Construction:

\[
T_K=
HMAC\_SHA256(K,canonical(Z_0)).
\]

The public observer sees the tag but not the actual key.

However the observer knows the frozen 8-key candidate set and the ten candidate panels.

Acceptance requires exhaustive enumeration of:

\[
8\times9=72
\]

distinct `(candidate key, distinct old disclosure)` tag candidates.

Expected:

- 72 distinct enumerated tag values;
- every observed actual-key tag maps to exactly one target class across the full key+state candidate set;
- therefore:
  \[
  H(M\mid T_K)=0
  \]
  in this toy finite-keyspace attacker model;
- and:
  \[
  H(M\mid T_K,Z_1)=0.
  \]

This does **not** imply that HMAC-SHA256 with a high-entropy secret key is information-theoretically reversible or computationally weak.

It proves only that a tiny enumerable keyspace is not a hiding mechanism.

## 6. Finite toy secret-salt space

Freeze secret salt candidates:

```text
AH38-SALT-0
...
AH38-SALT-7
```

Freeze actual salt:

```text
AH38-SALT-5
```

Construction:

\[
D_{salt,secret}
=
SHA256(
salt_{secret}\Vert canonical(Z_0)
).
\]

Observer sees the digest but not the actual salt.

Observer knows the 8-salt candidate set.

Expected:

- 72 distinct enumerated `(salt, old disclosure)` digest values;
- every observed actual-salt digest identifies exactly one target class under exhaustive candidate enumeration;
- residual privacy:
  \[
  H(M\mid D_{salt,secret})=0
  \]
  in this frozen finite-secret-space model.

Again, this is a small-domain enumeration result, not a general statement about secret salts.

## 7. Mediated verification

Define an internal verifier with access to:

- Epoch-0 disclosure;
- actual HMAC key;
- expected stored HMAC tag.

The verifier checks the tag internally.

Ordinary observer does **not** receive:

- \(Z_0\);
- HMAC tag bytes;
- key;
- secret salt;
- panel-dependent old-state digest.

The ordinary observer receives only this frozen panel-independent result:

```json
{
  "epoch": 0,
  "verification": "VERIFIED",
  "mechanism": "HMAC_SHA256_INTERNAL",
  "schema": "AH38-E0"
}
```

Call it:

\[
V_0.
\]

Expected:

\[
H(M\mid V_0,Z_1)=0.4.
\]

Because \(V_0\) is identical across all frozen panels, it contributes no target distinction.

## 8. Verification authority versus disclosure authority

Define two observer roles.

### ORDINARY_OBSERVER

Receives:

\[
(V_0,Z_1).
\]

Expected:

\[
\boxed{
H(M\mid ORDINARY)=0.4.
}
\]

### KEY_AUTHORIZED_VERIFIER

Internally has:

\[
(K,T_K,Z_1)
\]

and can enumerate the old frozen disclosure candidates.

Expected:

\[
\boxed{
H(M\mid KEY\_VERIFIER)=0.
}
\]

Thus the same epoch-verification workflow can support different information access depending on key/tag authority.

## 9. Large-secret-key claim refusal

AH38 must emit:

```text
NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE
```

for the question:

> Does a public HMAC tag under a high-entropy secret key preserve 0.4 bits in this model?

Reason:

The frozen entropy model enumerates explicit finite observer states. Computational infeasibility for a large hidden key is a different claim requiring a computational security model and assumptions.

AH38 therefore does not convert “observer lacks the key” into a fabricated positive entropy result.

## 10. Observer comparison

Expected:

| Observer / artifact | Residual privacy |
|---|---:|
| Fresh E1 only | 0.4 |
| Public SHA-256 + E1 | 0 |
| Public-salt SHA-256 + E1 | 0 |
| 8-key HMAC tag + E1 | 0 |
| 8-salt secret-salt digest + E1 | 0 |
| Mediated VERIFIED receipt + E1 | 0.4 |
| Key-authorized verifier | 0 |

## 11. Interpretation

AH38 supports:

\[
\boxed{
\text{verification authority}
\neq
\text{evidence disclosure authority}
}
\]

and:

\[
\boxed{
\text{public verifier artifact design is part of the privacy boundary}.
}
\]

It also supports a refusal principle:

\[
\boxed{
\text{do not smuggle computational hiding assumptions into an information-theoretic result}.
}
\]

## 12. Claim firewall

AH38 does not establish:

- that HMAC-SHA256 with a strong secret key leaks old evidence;
- that HMAC-SHA256 with a strong secret key hides old evidence information-theoretically;
- cryptographic forward secrecy;
- hiding commitments;
- real key-management security;
- security against side channels;
- safety of secret salts generally.

Its positive and negative results are exact only for the frozen finite candidate/key/salt domains and the mediated-output control.
