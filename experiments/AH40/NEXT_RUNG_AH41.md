# AH41 Candidate — Verifier Compromise, Role Fusion, and Quorum Resilience

AH40 separates a 2-of-3 verification quorum from a 3-of-3 public declassification quorum and shows that output schema remains part of the disclosure boundary.

AH41 should introduce verifier compromise/failure states.

Candidate questions:

1. What happens when one verifier is unavailable?
2. What happens when one verifier is malicious and tries to upgrade `VERIFY_ONLY` into `DECLASSIFY_EPOCH0`?
3. Which verifier failures destroy verification availability?
4. Which verifier compromises create declassification capability if roles/capabilities are fused?
5. Can verification availability and disclosure safety be optimized simultaneously?
6. How do minimal failure cuts compare with minimal compromise coalitions?

A useful frozen variant could compare:

- 2-of-3 verification / 3-of-3 declassification;
- 2-of-3 verification / 2-of-3 declassification negative control;
- a role-fusion policy where one principal accidentally holds two logical verifier seats.

Core distinction:

\[
\text{availability quorum}
\neq
\text{declassification compromise threshold}.
\]
