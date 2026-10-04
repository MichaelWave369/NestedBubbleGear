# AH42 Candidate — Independence Certification and Hidden Common Control

AH41 shows that logical verifier seats can overstate the number of independent physical principals when roles are fused.

AH42 should make **independence itself** an auditable claim.

Candidate questions:

1. What evidence is sufficient to certify that logical seats map to distinct control domains?
2. Can two nominally separate principals share the same root credential, host, HSM, recovery key, or administrative authority?
3. How should the Reality Ledger represent:
   - declared independence;
   - observed shared control;
   - unverified independence?
4. Can the system refuse to advertise an `N-of-M independent quorum` when control-domain evidence is missing?
5. How do hidden common-control domains change compromise thresholds and failure cuts?

A useful frozen model could define a principal-to-control-domain bipartite graph and compare:

- logical seat count;
- named-principal count;
- verified independent control-domain count.

Core distinction:

\[
\text{different account names}
\neq
\text{independent authority domains}.
\]
