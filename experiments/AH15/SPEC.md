# AH15 Frozen Specification

## 1. Purpose

Test composition properties of authority-driven memory downgrade.

The experiment asks:

1. Do nested downgrade chains agree with direct downgrade?
2. Can a role switch require information that an earlier downgrade destroyed?
3. Can an intermediate receipt preserve information that the final role no longer needs?

## 2. Frozen history ensemble

Reuse the AH11-AH14 ensemble:

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

Total histories:

\[
48.
\]

## 3. Frozen memory states

### FULL

Queries:

\[
\{G,H_2,H_3,P_2\}.
\]

Memory:

\[
D_{\rm FULL}=(H_2,H_3).
\]

Expected:
- 15 classes;
- 3.875 bits.

### ROUTE_DOWNSTREAM

Queries:

\[
\{H_3,P_2\}.
\]

Memory:

\[
D_{\rm RD}=P_2.
\]

Because:

\[
H_3=P_2CP_2^{-1},
\]

\(P_2\) is sufficient for both H3 and P2.

Expected:
- 13 classes;
- 3.625 bits.

### DOWNSTREAM

Queries:

\[
\{H_3\}.
\]

Memory:

\[
D_{\rm H3}=H_3.
\]

Expected:
- 9 classes;
- 3.077819531114783 bits.

### GLOBAL

Queries:

\[
\{G\}.
\]

Memory:

\[
D_G=R_\Gamma.
\]

Expected:
- 13 classes;
- 3.625 bits.

### ROUTE

Queries:

\[
\{P_2\}.
\]

Memory:

\[
D_{P2}=P_2.
\]

Expected:
- 13 classes;
- 3.625 bits.

## 4. Monotone chain

Freeze the chain:

\[
FULL
\to
ROUTE\_DOWNSTREAM
\to
DOWNSTREAM.
\]

Required functional relations:

\[
H(P_2\mid D_{\rm FULL})=0,
\]

\[
H(H_3\mid P_2)=0.
\]

Therefore the sequential downgrade is locally realizable.

## 5. Direct-versus-sequential equivalence

Define:

### Direct

\[
D_{\rm direct}
=
H_3(D_{\rm FULL}).
\]

### Sequential

\[
D_{\rm sequential}
=
H_3(P_2(D_{\rm FULL})).
\]

Acceptance requires:

\[
D_{\rm direct}
=
D_{\rm sequential}
\]

for all 48 histories.

Since the final canonical memory is just \(H_3\), direct and sequential downgrade must produce identical final memory classes.

## 6. Retention ladder

Frozen expected entropy sequence:

\[
3.875
\to
3.625
\to
3.077819531114783.
\]

Each monotone downgrade step must not increase entropy.

## 7. Authority reduction without memory reduction

Within the ROUTE_DOWNSTREAM state:

\[
\{H_3,P_2\}
\to
\{P_2\}
\]

does **not** permit further memory reduction under the frozen descriptor family because \(P_2\) itself is already the canonical memory for both roles.

So:

\[
D_{\rm RD}=D_{\rm ROUTE}=P_2.
\]

This is a control showing:

> less authority does not always imply less retained memory when the still-authorized answer functionally determines the revoked answer.

## 8. Reauthorization barrier

After downgrade to GLOBAL memory:

\[
D_G=R_\Gamma,
\]

a later lateral switch to ROUTE requires \(P_2\).

But:

\[
H(P_2\mid R_\Gamma)=0.25\ {\rm bits}.
\]

Therefore \(P_2\) is not a deterministic function of the retained GLOBAL memory.

The transition:

\[
GLOBAL\to ROUTE
\]

cannot be completed locally from \(R_\Gamma\) alone.

Likewise:

\[
H(G\mid P_2)=0.25\ {\rm bits},
\]

so:

\[
ROUTE\to GLOBAL
\]

is also not locally realizable.

Reauthorization requires consultation of a higher-authority retained source or recomputation from earlier state.

## 9. Intermediate receipt hazard

In the monotone chain:

\[
FULL\to ROUTE\_DOWNSTREAM\to DOWNSTREAM,
\]

the final memory is \(H_3\).

The revoked route answer \(P_2\) retains uncertainty:

\[
H(P_2\mid H_3)
=
0.5471804688852168\ {\rm bits}.
\]

### Final-state-only receipt

Define:

\[
R_{\rm final}
=
SHA256(\text{final policy},H_3).
\]

This receipt is a deterministic function of final memory only, so:

\[
H(P_2\mid H_3,R_{\rm final})
=
H(P_2\mid H_3).
\]

### Intermediate-state receipt

Define:

\[
R_{\rm mid}
=
SHA256(P_2).
\]

There are 13 P2 classes, and all 13 frozen hashes are unique.

Thus exhaustive lookup in the finite known domain identifies the intermediate P2 class:

\[
H(P_2\mid H_3,R_{\rm mid})=0.
\]

So a chained audit commitment can defeat the final downgrade semantics.

This is not a SHA-256 inversion claim.

## 10. Receipt path independence

If the final receipt commits only to:

- final role;
- final descriptor;
- final memory;
- protocol version;

then direct and sequential paths produce byte-identical final receipts.

Acceptance requires exact equality.

## 11. Governance interpretation

AH15 supports:

\[
\boxed{
\text{monotone downgrade can be path-independent}
}
\]

while:

\[
\boxed{
\text{lateral reauthorization can be blocked by prior forgetting}
}
\]

and:

\[
\boxed{
\text{intermediate receipts can preserve distinctions later revoked}
}
\]

within the frozen model.

## 12. Claim firewall

AH15 does not prove:

- secure deletion;
- irreversible forgetting from physical storage;
- cryptographic revocation;
- zero-knowledge audit;
- noninterference;
- absence of side channels.

It proves only finite functional/partition relationships and receipt leakage under the frozen schemes.
