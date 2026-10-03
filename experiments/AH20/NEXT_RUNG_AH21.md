# AH21 Candidate — Policy Hardening and Redundancy Synthesis

AH20 measures the resilience gap between mathematical capability and narrower policy authorization.

AH21 should ask whether policy can be deliberately hardened while preserving governance constraints.

## Candidate problem

Given:

\[
\mathcal P_Q
\subsetneq
\mathcal A_Q,
\]

find the smallest policy expansion:

\[
\mathcal P'_Q
\]

such that:

1. \(\mathcal P_Q\subseteq\mathcal P'_Q\subseteq\mathcal A_Q\);
2. selected single-point policy cuts are removed;
3. the policy remains upward-closed;
4. explicitly forbidden coalitions remain denied where required.

Possible optimization targets:

- minimize number of newly authorized minimal coalitions;
- minimize reliability gap at a declared failure probability;
- eliminate all policy-induced singleton cuts;
- preserve a mandatory multi-party governance constraint.

For the AH20 GLOBAL policy, adding the alternate capable coalition:

\[
\{E_2,E_3\}
\]

would recover full capability resilience while still requiring \(E_2\).

For the coarse alarm, authorizing both singleton-capable paths:

\[
\{E_1\}
\quad\text{and}\quad
\{E_3\}
\]

would remove the policy-created single point at \(E_3\).

This would convert failure analysis into a finite policy-synthesis problem.
