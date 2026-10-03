# AH18 Frozen Specification

## 1. Purpose

AH18 generalizes AH17 from two authority Keyholes to three and separates:

1. coalition **size**;
2. coalition **information content**;
3. coalition **authorization policy**.

The central frozen claim is:

> Equal-sized authority coalitions need not have equal reconstruction power.

## 2. Frozen history ensemble

Reuse the AH11-AH17 ensemble:

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

## 3. Three authority Keyholes

Define:

\[
E_1=(H_2)_{00},
\]

\[
E_2=(H_2)_{10},
\]

\[
E_3=(H_2)_{11}.
\]

Each singleton has:

- 2 classes;
- entropy
  \[
  0.8112781244591328\ {\rm bits}.
  \]

The three frozen \(H_2\) classes induce:

| \(H_2\) class | \(E_1\) | \(E_2\) | \(E_3\) |
|---|---:|---:|---:|
| A | 1 | 0 | 1 |
| B | 1 | 1 | 1 |
| C | 2 | 1 | 0 |

## 4. Pair partitions

### Pair \(E_1,E_2\)

Expected:

- 3 joint classes;
- entropy 1.5 bits;
- exact \(H_2\) recovery:
  \[
  H(H_2\mid E_1,E_2)=0.
  \]

### Pair \(E_2,E_3\)

Expected:

- 3 joint classes;
- entropy 1.5 bits;
- exact \(H_2\) recovery:
  \[
  H(H_2\mid E_2,E_3)=0.
  \]

### Pair \(E_1,E_3\)

Expected:

- only 2 joint classes;
- entropy
  \[
  0.8112781244591328\ {\rm bits};
  \]
- residual uncertainty:
  \[
  H(H_2\mid E_1,E_3)
  =
  0.6887218755408672\ {\rm bits}.
  \]

In fact \(E_1\) and \(E_3\) induce the same partition of the three H2 classes, so the second Keyhole adds no partition refinement.

## 5. Coalition capability graph

Minimal sufficient pairs for recovering H2 are:

\[
\mathcal C_{\rm capable}
=
\{
\{E_1,E_2\},
\{E_2,E_3\}
\}.
\]

The pair

\[
\{E_1,E_3\}
\]

is insufficient.

This produces a path-shaped coalition graph:

\[
E_1 - E_2 - E_3.
\]

The middle Keyhole \(E_2\) is contained in every minimal sufficient coalition.

## 6. Frozen grant A — ROUTE -> GLOBAL

Local memory:

\[
D_{\rm local}=P_2.
\]

Target:

\[
Q_{\rm new}=G.
\]

Baseline:

\[
H(G\mid P_2)=0.25.
\]

Every singleton:

\[
H(G\mid P_2,E_i)=0.125
\]

for \(i=1,2,3\).

Pair results:

\[
H(G\mid P_2,E_1,E_2)=0,
\]

\[
H(G\mid P_2,E_2,E_3)=0,
\]

\[
H(G\mid P_2,E_1,E_3)=0.125.
\]

Thus two authorities are not automatically enough.

Release:

\[
D_{\rm release}=R_\Gamma.
\]

## 7. Frozen grant B — DOWNSTREAM -> ROUTE

Local memory:

\[
D_{\rm local}=H_3.
\]

Target:

\[
Q_{\rm new}=P_2.
\]

Baseline:

\[
H(P_2\mid H_3)
=
0.5471804688852168.
\]

Every singleton:

\[
H(P_2\mid H_3,E_i)=0.25
\]

for \(i=1,2,3\).

Pair results:

\[
H(P_2\mid H_3,E_1,E_2)=0,
\]

\[
H(P_2\mid H_3,E_2,E_3)=0,
\]

\[
H(P_2\mid H_3,E_1,E_3)=0.25.
\]

Release:

\[
D_{\rm release}=P_2.
\]

## 8. Capability versus authority policy

AH18 adds a policy overlay independent of mathematical capability.

### GLOBAL grant policy

Authorized coalition:

\[
\{E_1,E_2\}.
\]

The coalition:

\[
\{E_2,E_3\}
\]

is mathematically capable but policy-denied.

### ROUTE grant policy

Authorized coalition:

\[
\{E_2,E_3\}.
\]

The coalition:

\[
\{E_1,E_2\}
\]

is mathematically capable but policy-denied.

The pair:

\[
\{E_1,E_3\}
\]

is both mathematically insufficient and policy-denied.

Thus at coalition level:

\[
\boxed{
\text{CAPABILITY}\neq\text{AUTHORITY}
}
\]

again.

## 9. Authorized reconstruction

For each grant, the policy-authorized pair must:

1. reduce target conditional entropy to zero;
2. deterministically derive the canonical target-role release;
3. never release raw share values;
4. retain zero excess leakage relative to the target role's authorized answer.

## 10. Quorum-cardinality negative control

Define a naive policy:

> any two of three authorities are sufficient.

AH18 rejects this policy because:

\[
H(Q_{\rm new}\mid D_{\rm local},E_1,E_3)>0
\]

for both frozen grants.

Therefore:

\[
\boxed{
|\mathcal C|=2
\not\Rightarrow
\mathcal C\text{ is sufficient}
}
\]

in the frozen model.

## 11. Receipt

The frozen receipt contains:

- experiment/version;
- grant id;
- target role;
- **coalition id**;
- release descriptor;
- released memory.

It does not contain raw shares.

The coalition id is fixed by policy for each grant, not selected as a function of hidden state. Therefore it adds no state information beyond the release in this experiment.

## 12. Interpretation

AH18 supports:

\[
\boxed{
\text{quorum is an access structure, not merely a count}
}
\]

and identifies a minimal sufficient coalition family over the three Keyholes.

The capable coalition family is monotone under supersets:

\[
\{E_1,E_2\}\subset\{E_1,E_2,E_3\},
\]

\[
\{E_2,E_3\}\subset\{E_1,E_2,E_3\}.
\]

## 13. Claim firewall

AH18 does not establish:

- cryptographic threshold security;
- Shamir secret sharing;
- threshold signatures;
- secure multiparty computation;
- collusion resistance;
- Byzantine fault tolerance;
- real-world identity or access control.

It proves only finite conditional-entropy, partition, and policy facts for the frozen Keyhole construction.
