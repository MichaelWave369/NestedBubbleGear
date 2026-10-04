# AH36 Candidate — Dynamic Upgrade Grants, Revocation, and Privacy Restoration

AH35 treats task-refinement permissions as a static access structure.

AH36 should make upgrade authority temporal.

Candidate sequence:

1. begin from a privacy-safe upgrade configuration;
2. grant one or more task refinements;
3. cross a minimal collapsing upgrade path and observe privacy fall to zero;
4. revoke one refinement;
5. test whether the **current release state** regains positive residual privacy;
6. separately test whether a Reality Ledger containing previously released richer evidence still allows reconstruction.

This should distinguish:

[
\text{permission revoked}
]

from:

[
\text{current release coarsened}
]

from:

[
\text{historical disclosure erased}.
]

That would reconnect the distinction-access-structure branch directly to AH14/AH15 revocation semantics.
