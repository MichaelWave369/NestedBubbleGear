# AH21 Frozen Specification

## 1. Purpose

AH21 synthesizes minimal hardening changes to the frozen AH20 policies.

For task \(Q\), let \(\mathcal A_Q\) be the mathematical capability family and \(\mathcal P_Q\subsetneq\mathcal A_Q\) the current policy family.

Enumerate candidate hardened policies \(\mathcal P'_Q\) subject to:

\[
\mathcal P_Q\subseteq\mathcal P'_Q\subseteq\mathcal A_Q.
\]

## 2. Candidate validity constraints

A candidate policy is valid iff:

1. it is upward-closed;
2. it contains the baseline policy;
3. it contains only mathematically capable coalitions;
4. it preserves every frozen explicit deny constraint;
5. it has no policy-induced singleton cut relative to capability.

Define singleton cuts:

\[
S(\mathcal F)=\{\{E_i\}:\{E_i\}\text{ is a minimal cut of }\mathcal F\}.
\]

The no-induced-singleton requirement is:

\[
S(\mathcal P'_Q)\subseteq S(\mathcal A_Q).
\]

## 3. Optimization objective

Among all valid candidates, select lexicographically by:

1. minimum number of newly authorized coalitions \(|\mathcal P'_Q\setminus\mathcal P_Q|\);
2. maximum diagnostic reliability at \(p=0.1\);
3. canonical lexicographic coalition-family encoding.

The experiment exhaustively enumerates the finite candidate space, so the selected optimum is exact within the frozen model.

## 4. H2_FULL

Capability family:

\[
\mathcal A=\{\{E_1,E_2\},\{E_2,E_3\},\{E_1,E_2,E_3\}\}.
\]

Baseline policy:

\[
\mathcal P=\{\{E_1,E_2\},\{E_1,E_2,E_3\}\}.
\]

Frozen optimum adds exactly:

\[
\boxed{\{E_2,E_3\}}
\]

so \(\mathcal P'=\mathcal A\).

Reliability at \(p=0.1\):

\[
0.81\to0.891.
\]

## 5. GLOBAL_REAUTH

Same capability and baseline family as H2_FULL.

Frozen optimum:

\[
\boxed{\{E_2,E_3\}}
\]

with one newly authorized coalition.

## 6. ROUTE_REAUTH

Baseline policy:

\[
\mathcal P=\{\{E_2,E_3\},\{E_1,E_2,E_3\}\}.
\]

Frozen optimum adds:

\[
\boxed{\{E_1,E_2\}}.
\]

## 7. C_CLASS_ALARM

Capability family:

\[
\mathcal A_C=\{\{E_1\},\{E_3\},\{E_1,E_2\},\{E_1,E_3\},\{E_2,E_3\},\{E_1,E_2,E_3\}\}.
\]

Baseline policy:

\[
\mathcal P_C=\{\{E_3\},\{E_1,E_3\},\{E_2,E_3\},\{E_1,E_2,E_3\}\}.
\]

Freeze an explicit deny constraint:

\[
\boxed{\{E_1\}\notin\mathcal P'_C}.
\]

The minimum valid repair is:

\[
\boxed{\mathcal P'_C=\mathcal P_C\cup\{\{E_1,E_2\}\}}.
\]

Minimal authorized success coalitions become:

\[
\{E_3\},\qquad\{E_1,E_2\}.
\]

Minimal cuts become:

\[
\{E_1,E_3\},\qquad\{E_2,E_3\}.
\]

There are no singleton cuts, while singleton E1 remains denied.

## 8. Hardened alarm reliability

Baseline:

\[
R_{\rm base}(p)=1-p.
\]

Hardened:

\[
R_{\rm hard}(p)=1-2p^2+p^3.
\]

Capability:

\[
R_{\rm cap}(p)=1-p^2.
\]

At \(p=0.1\):

\[
0.9\to0.981\to0.99.
\]

At \(p=0.5\):

\[
0.5\to0.625\to0.75.
\]

## 9. Policy-distance metrics

Define authorization expansion:

\[
d_{\rm add}=|\mathcal P'\setminus\mathcal P|.
\]

Frozen optimum:

| Task | Newly authorized coalitions |
|---|---:|
| H2_FULL | 1 |
| GLOBAL_REAUTH | 1 |
| ROUTE_REAUTH | 1 |
| C_CLASS_ALARM | 1 |

## 10. Resilience recovery ratio

Define:

\[
\rho(p)=\frac{R_{\rm hard}(p)-R_{\rm base}(p)}{R_{\rm cap}(p)-R_{\rm base}(p)}
\]

when the denominator is positive.

For full tasks:

\[
\rho(p)=1
\]

for \(0<p<1\).

For C_CLASS_ALARM:

\[
\rho(0.1)=0.9,
\qquad
\rho(0.5)=0.5.
\]

## 11. Negative control: authorize-everything

The trivial candidate \(\mathcal P'=\mathcal A\) always removes policy-induced fragility.

AH21 must not select it when a smaller valid expansion exists.

For C_CLASS_ALARM, capability policy would require two newly authorized coalitions relative to baseline:

\[
\{E_1\},\qquad\{E_1,E_2\}.
\]

The frozen optimizer instead selects only:

\[
\{E_1,E_2\}.
\]

## 12. Interpretation

AH21 supports:

\[
\boxed{\text{resilience hardening can be synthesized as a constrained finite policy expansion}}
\]

and separates maximal capability use, minimally sufficient hardening, and explicit governance denies.

## 13. Claim firewall

AH21 does not establish:

- that higher reliability is always preferable;
- that synthesized policy should be deployed automatically;
- correct real-world risk weights;
- legal/compliance policy;
- cryptographic authorization security;
- safety-critical governance.

It solves only the frozen finite optimization problem under the declared constraints and toy failure model.
