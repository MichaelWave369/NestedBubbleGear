# NBG-AH21 v0.1.0 — Policy Hardening and Redundancy Synthesis

AH20 measured how policy can create avoidable single points of failure.

AH21 turns that diagnosis into a finite synthesis problem.

For each task, enumerate every upward-closed policy family

\[
\mathcal P'
\]

such that:

\[
\mathcal P
\subseteq
\mathcal P'
\subseteq
\mathcal A,
\]

where \(\mathcal P\) is the current policy and \(\mathcal A\) is mathematical capability.

The frozen hardening objective is:

1. remove every policy-induced singleton cut;
2. preserve explicit deny constraints;
3. minimize the number of newly authorized coalitions;
4. break remaining ties by higher diagnostic reliability at \(p=0.1\), then lexicographic order.

For the full tasks, the optimizer adds one alternate capable pair and recovers full capability resilience.

For the coarse alarm, the optimizer does **not** authorize the denied singleton `{E1}`. It adds only `{E1,E2}` as a backup path, eliminating the single-point failure while keeping policy strictly narrower than capability.

This is a finite policy-synthesis toy model, not an automatic real-world security-policy recommender.
