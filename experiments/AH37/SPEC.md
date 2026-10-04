# AH37 Frozen Specification

## 1. Purpose

AH37 asks:

> Can an epoch rotation create a forward privacy boundary for new observers without pretending that prior disclosures were erased?

It also asks:

> Does replacing old content with a deterministic public digest preserve that boundary in a small enumerable domain?

## 2. Frozen substrate

Reuse AH36's ten-panel ensemble and full target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

Grant order:

```text
HISTORIAN:LIFETIME
OPERATOR:RECENT
ADAPTIVE_CONTROLLER:ADAPTIVE
AUDITOR:LIFETIME
AUDITOR:RECENT
```

Task levels:

```text
COMMON_ONLY
TRIAGE
FULL_STATUS
```

## 3. Epoch 0 disclosure

Freeze Epoch 0 profile to AH36's collapsing state:

```text
TRIAGE
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Call its panel-dependent release:

\[
Z_0.
\]

Expected:

\[
\boxed{
H(M\mid Z_0)=0.
}
\]

Expected descriptor classes:

\[
\boxed{9}.
\]

## 4. Epoch rotation

Close Epoch 0.

Revoke historian lifetime TRIAGE and explicitly downgrade/rematerialize.

Start Epoch 1 with profile:

```text
COMMON_ONLY
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Call its release:

\[
Z_1.
\]

Expected:

\[
\boxed{
H(M\mid Z_1)=0.4\text{ bits}.
}
\]

Expected descriptor classes:

\[
\boxed{7}.
\]

## 5. Observer classes

### FRESH_E1

Receives only:

\[
Z_1.
\]

Expected:

\[
\boxed{
H(M\mid Z_{\rm fresh})=0.4.
}
\]

### LEGACY_E0_E1

Retains:

\[
(Z_0,Z_1).
\]

Expected:

\[
\boxed{
H(M\mid Z_{\rm legacy})=0.
}
\]

The new epoch does not retroactively restore privacy for an observer that already received the collapsing old disclosure.

### PUBLIC_COMMITMENT_E0_E1

Does not receive \(Z_0\) directly.

Instead it receives:

\[
C_0=
SHA256(
canonical(Z_0)
).
\]

It also receives:

\[
Z_1.
\]

So descriptor is:

\[
(C_0,Z_1).
\]

Expected:

\[
\boxed{
H(M\mid C_0,Z_1)=0.
}
\]

Expected public commitment classes:

\[
\boxed{9}.
\]

Because the ten-panel domain is frozen and enumerable, the observer can precompute each candidate \(Z_0\), hash it, and match the public digest.

No hash collision is expected across the nine distinct Epoch 0 descriptors in the frozen panel.

## 6. Public-digest enumeration check

Acceptance requires:

1. compute every candidate Epoch 0 rich snapshot;
2. compute its canonical SHA-256;
3. map public digest to the candidate multi-horizon target;
4. verify every observed digest identifies exactly one target class.

Thus:

\[
\boxed{
H(M\mid C_0)=0.
}
\]

in this finite model.

This is not a statement that SHA-256 is reversible in general.

It is a statement that deterministic commitments over a known tiny candidate domain are enumerable.

## 7. Metadata-only seal control

Define a panel-independent public seal receipt:

```json
{
  "epoch": 0,
  "status": "SEALED",
  "schema": "AH37-E0",
  "policy_transition": "REVOKE_H_L_TRIAGE"
}
```

Call it:

\[
R_0.
\]

It contains no panel-dependent digest or old release content.

Observer receives:

\[
(R_0,Z_1).
\]

Because \(R_0\) is constant across all panels:

\[
\boxed{
H(M\mid R_0,Z_1)
=
H(M\mid Z_1)
=
0.4.
}
\]

This is only a control showing that panel-independent metadata does not add information about the frozen target.

It is not a cryptographic commitment to Epoch 0 data.

## 8. Epoch-boundary comparison

Expected observer privacy table:

| Observer | Old epoch exposure | E1 exposure | Residual privacy |
|---|---|---|---:|
| FRESH_E1 | none | Z1 | 0.4 |
| LEGACY_E0_E1 | full Z0 | Z1 | 0 |
| PUBLIC_COMMITMENT_E0_E1 | SHA256(Z0) | Z1 | 0 |
| METADATA_ONLY_E0_E1 | constant metadata | Z1 | 0.4 |

Acceptance requires exactly this pattern.

## 9. Forward-boundary meaning

AH37 defines a frozen **forward privacy boundary** as:

> An observer first admitted after epoch rotation, and not given any panel-dependent old-epoch disclosure or enumerable old-epoch commitment, has positive residual privacy about the frozen target.

Thus:

\[
\boxed{
\text{forward boundary}
\text{ is observer-admission and disclosure scoped}.
}
\]

It is not retroactive secrecy.

## 10. Historical non-erasure

Legacy observer privacy remains:

\[
0
\]

after rotation.

Therefore:

\[
\boxed{
\text{epoch rotation}
\not\Rightarrow
\text{historical erasure}.
}
\]

## 11. Commitment negative control

Public digest observer also remains at:

\[
0.
\]

Therefore:

\[
\boxed{
\text{sealing old content behind a deterministic public digest}
\not\Rightarrow
\text{forward privacy}
}
\]

when the old candidate domain is enumerable.

## 12. Claim firewall

AH37 does not establish:

- cryptographic forward secrecy;
- secure deletion;
- hiding commitments;
- preimage attacks on SHA-256;
- safety of public hashes over large unknown domains;
- confidentiality against auxiliary information;
- deployed epoch/key-management correctness.

The public-commitment result is entirely due to finite-domain enumeration of known candidate disclosures.

## 13. Deterministic receipt

The result receipt records:

- Epoch 0 profile;
- Epoch 1 profile;
- descriptor class counts;
- fresh observer privacy;
- legacy observer privacy;
- public-digest observer privacy;
- metadata-only observer privacy;
- digest class count;
- digest-to-target uniqueness;
- frozen hashes;
- replay exactness.
