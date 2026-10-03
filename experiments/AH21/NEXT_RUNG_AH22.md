# AH22 Candidate — Costed Policy Synthesis and Pareto Frontiers

AH21 minimizes only the number of newly authorized coalitions, with a reliability tie-break.

AH22 should allow coalition-specific governance costs.

## Candidate formulation

Assign each newly authorized coalition a declared cost:

\[
w(C)\ge0.
\]

For candidate hardened policy \(\mathcal P'\), define:

\[
{\rm Cost}(\mathcal P')
=
\sum_{C\in\mathcal P'\setminus\mathcal P} w(C).
\]

Then jointly evaluate authorization cost, reliability, singleton cuts, and explicit deny constraints.

Rather than forcing one scalar objective, compute the finite Pareto frontier.

Questions:

1. Can two hardening policies trade lower governance cost against higher reliability?
2. Does the minimum-coalition-count solution remain cost-optimal under nonuniform weights?
3. Can a policy sit on the Pareto frontier while still be strictly less resilient than capability?
4. How does the frontier change when certain coalitions carry legal, organizational, or trust costs?
5. Can the output remain advisory rather than automatically selecting deployment policy?

This would convert AH21's single objective into a transparent finite decision surface.
