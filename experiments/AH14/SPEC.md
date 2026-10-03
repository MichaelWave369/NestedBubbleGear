# AH14 Frozen Specification

## 1. Purpose

AH14 distinguishes:

\[
\text{authority revoked}
\]

from

\[
\text{memory minimized}
\]

from

\[
\text{information securely erased}.
\]

The experiment proves only deterministic partition/downgrade properties in the frozen ensemble.

## 2. Frozen history ensemble

Reuse the AH11-AH13 ensemble:

\[
U,V\in\{I,A,B,S\},
\qquad
k\in\{-1,0,+1\}.
\]

Define:

\[
T_1=UB^k,
\qquad
T_2=B^{-k}V,
\qquad
P_2=T_1T_2.
\]

Then:

\[
H_2^{(0)}=T_1BT_1^{-1},
\]

\[
H_3^{(0)}=P_2CP_2^{-1},
\qquad C=AB,
\]

\[
R_\Gamma=H_3^{(0)}H_2^{(0)},
\]

\[
G=R_\Gamma A.
\]

Total labeled histories:

\[
48.
\]

## 3. Old full-capability memory

Before revocation, the actor holds:

\[
D_{\rm old}
=
(H_2^{(0)},H_3^{(0)}).
\]

Frozen properties:

- 15 classes;
- 3.875 bits;
- sufficient for the full query tuple
  \[
  (G,H_2^{(0)},H_3^{(0)},P_2).
  \]

## 4. Revocation targets

AH14 freezes four downgrade targets.

### FULL -> GLOBAL_OPERATOR

New authorized query:

\[
\{G\}.
\]

New memory:

\[
D_G=R_\Gamma.
\]

Expected:
- 13 classes;
- 3.625 bits;
- revoked-query uncertainty:
  \[
  H(H_2,H_3,P_2\mid R_\Gamma)=0.25.
  \]

### FULL -> INTERFACE_INSPECTOR

New authorized query:

\[
\{H_2\}.
\]

New memory:

\[
D_{H2}=H_2.
\]

Expected:
- 3 classes;
- 1.5 bits;
- revoked-query uncertainty:
  \[
  H(G,H_3,P_2\mid H_2)=2.375.
  \]

### FULL -> DOWNSTREAM_INSPECTOR

New authorized query:

\[
\{H_3\}.
\]

New memory:

\[
D_{H3}=H_3.
\]

Expected:
- 9 classes;
- 3.077819531114783 bits;
- revoked-query uncertainty:
  \[
  H(G,H_2,P_2\mid H_3)
  =
  0.7971804688852168.
  \]

### FULL -> ROUTE_AUDITOR

New authorized query:

\[
\{P_2\}.
\]

New memory:

\[
D_{P2}=P_2.
\]

Expected:
- 13 classes;
- 3.625 bits;
- revoked-query uncertainty:
  \[
  H(G,H_2,H_3\mid P_2)=0.25.
  \]

## 5. Functional downgrade criterion

A downgrade from old memory \(D_{\rm old}\) to target memory \(D_{\rm new}\) is locally realizable iff:

\[
D_{\rm old}(x)=D_{\rm old}(x')
\Longrightarrow
D_{\rm new}(x)=D_{\rm new}(x')
\]

for every frozen pair.

Equivalently:

\[
H(D_{\rm new}\mid D_{\rm old})=0.
\]

All four frozen full-to-role downgrades are expected to satisfy this.

## 6. Authorized-answer preservation

For each revocation target \(a\):

\[
H(\mathcal Q_a\mid D_a)=0.
\]

Downgrade must preserve every still-authorized answer exactly.

## 7. Revoked distinction test

Before downgrade:

\[
H(Y_a\mid D_{\rm old})=0,
\]

because full-capability memory answers the complete query tuple.

After downgrade, acceptance requires:

\[
H(Y_a\mid D_a)>0
\]

for every restricted role, where \(Y_a\) is the tuple of revoked-query answers.

This does not prove physical erasure. It proves only that the declared downgraded descriptor no longer determines those answers.

## 8. New-state receipt

Define a retained-state receipt:

\[
R_{\rm new}
=
{\rm SHA256}
(
{\rm policy\_id}
\Vert
{\rm version}
\Vert
D_{\rm new}
).
\]

The receipt contains no old-memory value.

Because \(R_{\rm new}\) is a deterministic function of \(D_{\rm new}\):

\[
H(Y_a\mid D_a,R_{\rm new})
=
H(Y_a\mid D_a).
\]

So the receipt adds zero information beyond the retained descriptor.

It verifies only the retained state/policy encoding. It does **not** prove deletion of old copies.

## 9. Bad old-state receipt negative control

Define:

\[
R_{\rm old}
=
{\rm SHA256}(D_{\rm old}).
\]

There are 15 old action-memory classes.

Frozen expectation:

- all 15 old-memory SHA-256 values are distinct;
- therefore \(R_{\rm old}\) identifies the old action-memory class within the frozen enumerable domain.

Since old action memory answers the complete query tuple:

\[
H(Y_a\mid D_a,R_{\rm old})=0
\]

for every restricted role.

Thus a commitment to the discarded state can restore every revoked distinction in this toy domain.

This is a negative control, not a general claim that SHA-256 is reversible.

The issue is exhaustive enumeration of a tiny known state space, not cryptographic inversion.

## 10. Receipt comparison

For every restricted role:

### New-state receipt

\[
H(Y_a\mid D_a,R_{\rm new})
=
H(Y_a\mid D_a)
>
0.
\]

### Old-state receipt

\[
H(Y_a\mid D_a,R_{\rm old})=0.
\]

Therefore:

\[
\boxed{
\text{audit commitment choice can affect retention semantics}
}
\]

in the frozen model.

## 11. Deterministic replay

Every downgrade receipt includes:

- experiment/version;
- target role;
- target descriptor name;
- canonical new-memory encoding;
- new-state receipt hash.

Recomputing from the same frozen old memory and role must produce byte-identical receipt content.

## 12. Governance interpretation

AH14 supports these distinctions:

\[
\boxed{
\text{revoking permission}
\neq
\text{downgrading retained memory}
}
\]

and:

\[
\boxed{
\text{downgrading a declared representation}
\neq
\text{proving secure erasure}
}
\]

and, within an enumerable finite domain:

\[
\boxed{
\text{a commitment to discarded state can preserve discarded distinctions}
}
\]

## 13. Claim firewall

AH14 does not establish:

- secure deletion from RAM, disk, caches, backups, logs, models, or external systems;
- cryptographic erasure;
- zero-knowledge proof of deletion;
- noninterference;
- differential privacy;
- resistance to side channels;
- irreversible forgetting.

The supported conclusion is limited to the frozen finite memory descriptors and receipt schemes.
