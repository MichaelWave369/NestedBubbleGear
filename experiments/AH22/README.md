# NBG-AH22 v0.1.0 — Costed Policy Synthesis and Pareto Frontiers

AH21 synthesized one minimum-expansion hardening policy.

AH22 stops forcing governance tradeoffs into a single winner.

For each legal upward-closed policy between the baseline and mathematical capability, it records:

- added authorization cost;
- policy-induced singleton failure count;
- diagnostic reliability at a declared failure probability.

A policy is retained on the Pareto frontier when no other legal policy is at least as good in every objective and strictly better in at least one.

The coarse alarm is evaluated twice: once with singleton `E1` treated as expensive but legal, and once with `E1` treated as a hard deny. This separates **cost** from **prohibition**.

This is a finite advisory trade-space calculation, not an automatic policy recommendation.
