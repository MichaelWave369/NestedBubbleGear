# M2 Candidate — Property-Based Generated Universes

M1 tests implementation independence for selected frozen contracts.

M2 should leave the hand-frozen examples and generate finite authority/control universes with 3–7 logical seats, variable root domains, randomized mappings, monotone authorization families, coarsenings, and certificate/event schedules.

Target structural properties:
1. minimal failure cuts equal minimal hitting sets of minimal success coalitions;
2. fusing control domains never increases independent root-domain count;
3. incomplete independence evidence never certifies independence;
4. trusted revocation never directly certifies a new topology;
5. coarsening cannot increase exact distinguishability;
6. adding observer distinctions cannot increase residual conditional entropy.

Failures should be minimized to small counterexamples and written to a deterministic seed ledger.
