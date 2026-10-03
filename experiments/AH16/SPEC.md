# AH16 Frozen Specification

## 1. Purpose

AH16 turns reauthorization into an explicit governed handoff.

The frozen model distinguishes:

1. minimized local memory;
2. higher-authority retained state;
3. a newly authorized query family;
4. the minimal descriptor released to satisfy the grant.

The target is not to prove secure storage or access control.

## 2. Frozen history ensemble

Reuse the AH11-AH15 48-history ensemble:

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
P_2=T_1T_2,
\]

\[
H_2=T_1BT_1^{-1},
\]

\[
H_3=P_2CP_2^{-1},
\qquad
C=AB,
\]

\[
R_\Gamma=H_3H_2,
\qquad
G=R_\Gamma A.
\]

## 3. Authority store

The higher-authority store retains:

\[
D_{\rm escrow}=(H_2,H_3).
\]

Frozen properties:

- 15 classes;
- 3.875 bits;
- sufficient for
  \[
  (G,H_2,H_3,P_2).
  \]

The store is logically separate from minimized actor-local memory.

## 4. Frozen grant scenarios

### Grant A — GLOBAL -> ROUTE

Local memory:

\[
D_{\rm local}=R_\Gamma.
\]

Newly authorized answer:

\[
Q_{\rm new}=P_2.
\]

Local barrier:

\[
H(P_2\mid R_\Gamma)=0.25.
\]

With full escrow:

\[
H(P_2\mid R_\Gamma,D_{\rm escrow})=0.
\]

Released descriptor:

\[
D_{\rm release}=P_2.
\]

### Grant B — ROUTE -> GLOBAL

Local memory:

\[
D_{\rm local}=P_2.
\]

Newly authorized answer:

\[
Q_{\rm new}=G.
\]

Local barrier:

\[
H(G\mid P_2)=0.25.
\]

With full escrow:

\[
H(G\mid P_2,D_{\rm escrow})=0.
\]

Released descriptor:

\[
D_{\rm release}=R_\Gamma.
\]

### Grant C — INTERFACE -> GLOBAL

Local memory:

\[
D_{\rm local}=H_2.
\]

Newly authorized answer:

\[
Q_{\rm new}=G.
\]

Local barrier:

\[
H(G\mid H_2)=2.375.
\]

With full escrow:

\[
H(G\mid H_2,D_{\rm escrow})=0.
\]

Released descriptor:

\[
D_{\rm release}=R_\Gamma.
\]

### Grant D — DOWNSTREAM -> ROUTE

Local memory:

\[
D_{\rm local}=H_3.
\]

Newly authorized answer:

\[
Q_{\rm new}=P_2.
\]

Local barrier:

\[
H(P_2\mid H_3)
=
0.5471804688852168.
\]

With full escrow:

\[
H(P_2\mid H_3,D_{\rm escrow})=0.
\]

Released descriptor:

\[
D_{\rm release}=P_2.
\]

## 5. Handoff correctness

For every grant:

\[
H(Q_{\rm new}\mid D_{\rm release})=0.
\]

The released descriptor must be a deterministic function of escrow:

\[
H(D_{\rm release}\mid D_{\rm escrow})=0.
\]

The handoff does not return the full action-memory tuple unless the new authority actually requires it.

## 6. Minimal-release leakage

For target role \(a\), let \(Y_a\) be the tuple of answers not authorized after the handoff.

Define excess leakage:

\[
L_a^{\rm excess}(D)
=
I(Y_a;D)
-
I(Y_a;Q_a).
\]

Because the released descriptor is the same canonical memory used for the target role in AH13:

\[
L_a^{\rm excess}(D_{\rm release})=0.
\]

By contrast, returning the full escrow action has positive excess leakage.

Expected:

### ROUTE target

\[
L_{\rm ROUTE}^{\rm excess}(D_{\rm release})=0,
\]

\[
L_{\rm ROUTE}^{\rm excess}(D_{\rm escrow})=0.25.
\]

### GLOBAL target

\[
L_{\rm GLOBAL}^{\rm excess}(D_{\rm release})=0,
\]

\[
L_{\rm GLOBAL}^{\rm excess}(D_{\rm escrow})=0.25.
\]

## 7. Escrow degradation controls

The authority store itself can be downgraded.

### H3-only escrow cannot restore ROUTE

\[
H(P_2\mid H_3)
=
0.5471804688852168.
\]

### residue-only escrow cannot restore ROUTE

\[
H(P_2\mid R_\Gamma)
=
0.25.
\]

### P2-only escrow cannot restore GLOBAL

\[
H(G\mid P_2)
=
0.25.
\]

Therefore reauthorization capability depends on what the higher-authority store actually retained.

## 8. Selective handoff receipt

Define:

\[
R_{\rm grant}
=
SHA256(
{\rm grant\_id},
{\rm target\_role},
{\rm descriptor},
D_{\rm release},
{\rm version}
).
\]

The receipt contains no escrow state.

Because it is a deterministic function of released memory and public policy metadata:

\[
I(Y_a;R_{\rm grant}\mid D_{\rm release})=0.
\]

It adds no information beyond the authorized release.

## 9. Bad escrow-commitment receipt

Negative control:

\[
R_{\rm escrow}
=
SHA256(D_{\rm escrow}).
\]

There are 15 escrow action classes and 15 unique hashes in the frozen enumerable domain.

Thus exhaustive lookup identifies the escrow class.

For both GLOBAL and ROUTE targets:

\[
H(Y_a\mid D_{\rm release},R_{\rm escrow})=0.
\]

So a receipt that commits to the higher-authority state can defeat the selective-release semantics in this tiny domain.

This is not a SHA-256 inversion claim.

## 10. Local state after grant

The frozen protocol models a replacement handoff:

\[
D_{\rm local}^{\rm new}=D_{\rm release}.
\]

It does not assume the actor also keeps its old role-specific memory.

A richer union-of-roles policy is deferred.

## 11. Governance interpretation

AH16 supports:

\[
\boxed{
\text{forgotten locally}
\not\Rightarrow
\text{unrecoverable under later authorized escalation}
}
\]

provided a higher-authority source retained the needed distinctions.

But the escalation should release only:

\[
\boxed{
R_{\mathcal Q_{\rm new}}(\Gamma)
}
\]

rather than restoring full-capability memory by default.

## 12. Claim firewall

AH16 does not prove:

- secure escrow isolation;
- cryptographic access control;
- secure deletion;
- zero-knowledge grant receipts;
- resistance to side channels;
- multi-tenant privacy;
- correct real-world authorization enforcement.

It proves only finite sufficiency/leakage properties for the frozen descriptors and receipt schemes.
