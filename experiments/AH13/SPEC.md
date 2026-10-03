# AH13 Frozen Specification

## 1. Purpose

AH13 turns the AH12 task-indexed memory result into an authorization-indexed retention test.

The substrate is capable of answering:

\[
\mathcal Q_{\rm capable}
=
\{G,H_2,H_3,P_2\}.
\]

Each actor receives an authorized query family

\[
\mathcal Q_{\rm authorized}
\subseteq
\mathcal Q_{\rm capable}.
\]

The experiment asks whether memory can be restricted to the coarsest preregistered descriptor sufficient for the actor's authorized questions.

## 2. Frozen history ensemble

Reuse the AH11/AH12 48-history ensemble:

\[
U,V\in\{I,A,B,S\},
\qquad
k\in\{-1,0,+1\}.
\]

Define

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
\qquad
C=AB,
\]

\[
R_\Gamma=H_3^{(0)}H_2^{(0)},
\]

\[
G=R_\Gamma A.
\]

## 3. Capability memory

The substrate-wide query family is:

\[
\mathcal Q_{\rm capable}
=
(G,H_2^{(0)},H_3^{(0)},P_2).
\]

From AH12, the coarsest sufficient preregistered descriptor is:

\[
D_{\rm capable}
=
(H_2^{(0)},H_3^{(0)}),
\]

called `action`.

Frozen values:

- 15 classes;
- entropy \(3.875\) bits;
- sufficient for every singleton query and the full tuple.

## 4. Frozen actor roles

### GLOBAL_OPERATOR

Authorized query family:

\[
\mathcal Q_G=\{G\}.
\]

Chosen memory:

\[
D_G=R_\Gamma.
\]

Expected:
- 13 classes;
- 3.625 bits;
- sufficient for \(G\);
- not sufficient for \(H_2\) or \(P_2\).

### INTERFACE_INSPECTOR

Authorized query family:

\[
\mathcal Q_{H2}=\{H_2^{(0)}\}.
\]

Chosen memory:

\[
D_{H2}=H_2^{(0)}.
\]

Expected:
- 3 classes;
- 1.5 bits;
- sufficient for \(H_2\);
- not sufficient for \(G\).

### DOWNSTREAM_INSPECTOR

Authorized query family:

\[
\mathcal Q_{H3}=\{H_3^{(0)}\}.
\]

Chosen memory:

\[
D_{H3}=H_3^{(0)}.
\]

Expected:
- 9 classes;
- 3.077819531114783 bits;
- sufficient for \(H_3\).

### ROUTE_AUDITOR

Authorized query family:

\[
\mathcal Q_{P2}=\{P_2\}.
\]

Chosen memory:

\[
D_{P2}=P_2.
\]

Expected:
- 13 classes;
- 3.625 bits;
- sufficient for \(P_2\);
- not sufficient for \(G\).

### FULL_AUDITOR

Authorized query family:

\[
\mathcal Q_{\rm capable}.
\]

Chosen memory:

\[
D_{\rm full}=D_{\rm action}.
\]

Expected:
- 15 classes;
- 3.875 bits;
- sufficient for all frozen queries.

## 5. Sufficiency requirement

For actor \(a\), memory descriptor \(D_a\) must satisfy:

\[
H(\mathcal Q_a\mid D_a)=0.
\]

All "coarsest" claims are limited to the preregistered descriptor family.

## 6. Retention reduction

For every restricted role:

\[
H(D_a)<H(D_{\rm capable}).
\]

Expected entropy reductions relative to full-capability memory:

| Role | Selected entropy | Reduction |
|---|---:|---:|
| GLOBAL_OPERATOR | 3.625 | 0.25 |
| INTERFACE_INSPECTOR | 1.5 | 2.375 |
| DOWNSTREAM_INSPECTOR | 3.077819531114783 | 0.797180468885217 |
| ROUTE_AUDITOR | 3.625 | 0.25 |

## 7. Unauthorized-query leakage

For actor \(a\), let:

\[
Y_a
\]

be the tuple of answers to all queries not authorized for that actor.

Define information leaked by retained memory:

\[
L_a(D)=I(Y_a;D).
\]

However, authorized answers may already be statistically correlated with unauthorized answers. Therefore define the unavoidable correlation floor:

\[
L_a^{\rm floor}
=
I(Y_a;\mathcal Q_a).
\]

Define excess unauthorized leakage:

\[
L_a^{\rm excess}(D)
=
I(Y_a;D)-I(Y_a;\mathcal Q_a).
\]

A descriptor that is merely a lossless encoding of the authorized answer can achieve:

\[
L_a^{\rm excess}=0.
\]

## 8. Frozen leakage expectations

For each restricted role, the selected memory has zero excess leakage:

\[
L_a^{\rm excess}(D_a)=0.
\]

Full-capability `action` memory has positive excess leakage:

| Role | Selected excess leakage | Full-action excess leakage |
|---|---:|---:|
| GLOBAL_OPERATOR | 0 | 0.25 |
| INTERFACE_INSPECTOR | 0 | 2.375 |
| DOWNSTREAM_INSPECTOR | 0 | 0.7971804688852169 |
| ROUTE_AUDITOR | 0 | 0.25 |

This does **not** mean selected memory reveals no unauthorized information. It means it reveals no more about unauthorized answers than is already implied by the authorized answer in this finite ensemble.

## 9. Capability-versus-authority witness

The substrate-wide `action` descriptor answers the complete future query tuple exactly.

For `INTERFACE_INSPECTOR`, retain only:

\[
H_2^{(0)}.
\]

Then:

\[
H(H_2^{(0)}\mid H_2^{(0)})=0,
\]

while:

\[
H(G\mid H_2^{(0)})=2.375\ {\rm bits}.
\]

So the substrate is capable of retaining enough information to answer \(G\), but the role-specific memory intentionally does not preserve that answer.

Likewise, for `GLOBAL_OPERATOR`:

\[
H(G\mid R_\Gamma)=0,
\]

but:

\[
H(H_2^{(0)}\mid R_\Gamma)=0.25,
\]

\[
H(P_2\mid R_\Gamma)=0.25.
\]

## 10. Governance interpretation

Within this frozen model:

\[
\boxed{
\text{capability memory}
\neq
\text{authorized-role memory}
}
\]

and:

\[
\boxed{
R_{\mathcal Q_{\rm authorized}}(\Gamma)
}
\]

can be strictly coarser than:

\[
R_{\mathcal Q_{\rm capable}}(\Gamma).
\]

This is a retention-policy result, not an enforcement result.

## 11. What AH13 does not prove

AH13 does not establish:
- secure deletion;
- cryptographic access control;
- noninterference;
- differential privacy;
- resistance to inference attacks;
- universal least-privilege memory;
- cognitive or biological memory laws.

A malicious or differently instrumented system could retain additional state outside the declared descriptor.

## 12. Claim firewall

The supported conclusion is narrow:

> In this finite ensemble and preregistered descriptor family, role-specific query authority permits coarser sufficient memory and can reduce excess information retained about unauthorized query answers.

Nothing stronger is claimed.
