# AH20 Candidate — Keyhole Criticality, Failure Sets, and Authority Resilience

AH19 formalizes task-relative access structures and minimal capable coalitions.

AH20 should ask what happens when authority Keyholes become unavailable.

## Candidate definitions

For task \(Q\) with access structure \(\mathcal A_Q\), define a failure set:

\[
F\subseteq E.
\]

The task remains recoverable iff some capable coalition avoids all failed Keyholes:

\[
\exists C\in\mathcal A_Q
\quad
C\cap F=\varnothing.
\]

Define a minimal cut set as a failure set that destroys all capable coalitions, while every strict subset does not.

Questions:

1. What are the minimal cut sets for each frozen task?
2. Is \(E_2\) a single point of failure for full reconstruction tasks?
3. Why does the coarse C_CLASS_ALARM remain recoverable after losing E2?
4. Can policy create additional single points of failure even when mathematical capability has redundant coalitions?
5. Can capability resilience and policy resilience be compared separately?

This would convert AH19's access structures into a finite reliability/governance analysis.
