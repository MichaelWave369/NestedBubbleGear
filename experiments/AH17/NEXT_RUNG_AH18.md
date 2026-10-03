# AH18 Candidate — Three-Keyhole Thresholds and Quorum Policies

AH17 establishes a 2-of-2 authority split for two frozen grants.

AH18 should test a larger quorum family.

## Candidate design

Construct three authority views:

\[
E_1,E_2,E_3
\]

and freeze policies such as:

- 2-of-3 sufficient;
- 1-of-3 insufficient;
- specific pairs authorized while another pair is insufficient;
- role-dependent quorum requirements.

Questions:

1. Can threshold policy be represented as a partition lattice over authority views?
2. Can different roles require different quorums over the same stored shares?
3. Does a receipt reveal which authority subset participated?
4. Can collusion below threshold preserve partial unauthorized information?
5. Can Keyhole parallax be generalized from pairwise reconstruction to quorum reconstruction?

This should remain information-theoretic unless a real cryptographic threshold construction is explicitly introduced.
